"""Shared helpers: Overpass fetching (cached, polite) and OSM context features.

Features (identical definitions for OAH pilot cities, Singapore and any new city):
  osm_dist_wwtp_m      distance (m) from the site to the nearest OSM man_made=wastewater_plant
                       (node, way or relation; 0 if the site is inside the polygon).
                       Searched within the city bbox + WWTP_BUFFER_M, capped at WWTP_CAP_M.
  osm_dist_farmland_m  distance (m) to the nearest landuse=farmland|orchard|vineyard polygon.
                       Searched within bbox + FARM_BUFFER_M, capped at FARM_CAP_M.
  osm_urban_frac_2km   fraction (0-1) of the 2 km-radius disc around the site covered by the
                       union of built-up landuse polygons (residential, commercial, industrial,
                       retail).

Geometry is handled in a local equirectangular projection (metres) centred on the city,
which is accurate to well under 1% over the ~50 km extents used here.
"""
from __future__ import annotations

import hashlib
import json
import math
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

from shapely.geometry import LineString, Point, Polygon
from shapely.ops import polygonize, unary_union

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / "analysis" / ".cache" / "overpass"

# Tried in order, with backoff. On 2026-09-23 kumi.systems returned 504 for every query and the
# main instance returned "Dispatcher_Client ... too busy" for large ones, hence the per-layer split
# and several mirrors. Only global instances: overpass.osm.ch serves Switzerland only and silently
# returned 0 elements for Coimbra.
ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
]
USER_AGENT = "StreamLink-hackathon-analysis/1.0 (OneAquaHealth IEEE hackathon prototype; non-commercial research)"

WWTP_BUFFER_M = 25_000
WWTP_CAP_M = 25_000
FARM_BUFFER_M = 5_000
FARM_CAP_M = 5_000
URBAN_RADIUS_M = 2_000
URBAN_BUFFER_M = 2_500

FARM_LANDUSE = ("farmland", "orchard", "vineyard")
BUILT_LANDUSE = ("residential", "commercial", "industrial", "retail")


# ---------------------------------------------------------------- bbox helpers
def bbox_of(points, pad_m=0.0):
    """points: iterable of (lat, lon). Returns (south, west, north, east) padded by pad_m."""
    lats = [p[0] for p in points]
    lons = [p[1] for p in points]
    s, n, w, e = min(lats), max(lats), min(lons), max(lons)
    dlat = pad_m / 111_320.0
    dlon = pad_m / (111_320.0 * math.cos(math.radians((s + n) / 2)))
    return (round(s - dlat, 5), round(w - dlon, 5), round(n + dlat, 5), round(e + dlon, 5))


def bbox_pad(bbox, pad_m):
    s, w, n, e = bbox
    return bbox_of([(s, w), (n, e)], pad_m)


def fmt_bbox(b):
    return ",".join(f"{v:.5f}" for v in b)


# ---------------------------------------------------------------- Overpass
def feature_queries(core_bbox):
    """Three Overpass requests per city, one per layer, each with its own buffer.

    (A single combined request was tried first; both overpass-api.de and kumi.systems timed out on
    the larger cities, so the layers are requested separately - still only 3 requests per city.)
    """
    farm = "|".join(FARM_LANDUSE)
    built = "|".join(BUILT_LANDUSE)
    q = lambda body: f"[out:json][timeout:300];\n({body}\n);\nout geom qt;"
    return {
        "wwtp": q(f'\n  nwr["man_made"="wastewater_plant"]({fmt_bbox(bbox_pad(core_bbox, WWTP_BUFFER_M))});'),
        "farm": q(f'\n  way["landuse"~"^({farm})$"]({fmt_bbox(bbox_pad(core_bbox, FARM_BUFFER_M))});'
                  f'\n  relation["landuse"~"^({farm})$"]({fmt_bbox(bbox_pad(core_bbox, FARM_BUFFER_M))});'),
        "built": q(f'\n  way["landuse"~"^({built})$"]({fmt_bbox(bbox_pad(core_bbox, URBAN_BUFFER_M))});'
                   f'\n  relation["landuse"~"^({built})$"]({fmt_bbox(bbox_pad(core_bbox, URBAN_BUFFER_M))});'),
    }


def fetch_features(core_bbox, tag, offline=False):
    """Returns a merged pseudo-document {'elements': [...], '_meta': {...}} for the 3 layers."""
    elements, meta = [], {}
    for layer, query in feature_queries(core_bbox).items():
        # an urban bbox always has some built-up landuse; 0 means a regional/failed instance
        doc = overpass(query, f"{layer}-{tag}", offline=offline, min_elements=1 if layer == "built" else 0)
        elements.extend(doc["elements"])
        meta[layer] = doc.get("_meta", {}).get("fetched_utc")
    return {"elements": elements, "_meta": {"fetched_utc": meta}}


def waterways_query(bbox):
    return f"""[out:json][timeout:180];
way["waterway"~"^(river|stream|canal|drain)$"]["name"]({fmt_bbox(bbox)});
out geom qt;"""


def overpass(query: str, tag: str, offline: bool = False, min_elements: int = 0) -> dict:
    """POST a query to Overpass with caching, a proper User-Agent and retry/backoff."""
    CACHE.mkdir(parents=True, exist_ok=True)
    h = hashlib.sha1(query.encode()).hexdigest()[:10]
    path = CACHE / f"{tag}-{h}.json"
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    if offline:
        raise FileNotFoundError(f"no cached Overpass response {path.name} and offline=True")
    data = urllib.parse.urlencode({"data": query}).encode()
    last = None
    for attempt in range(8):
        url = ENDPOINTS[attempt % len(ENDPOINTS)]
        try:
            req = urllib.request.Request(url, data=data, headers={"User-Agent": USER_AGENT})
            t0 = time.time()
            with urllib.request.urlopen(req, timeout=240) as r:
                raw = r.read()
            if not raw.lstrip().startswith(b"{"):  # Overpass returns an HTML page when overloaded
                raise RuntimeError(f"non-JSON response ({len(raw)} bytes): {raw[:200]!r}")
            doc = json.loads(raw)
            if "remark" in doc and not doc.get("elements"):
                raise RuntimeError(f"Overpass remark: {doc['remark']}")
            if len(doc.get("elements", [])) < min_elements:
                raise RuntimeError(f"only {len(doc.get('elements', []))} elements (expected >= {min_elements}); "
                                   "instance may hold a regional extract only")
            doc["_meta"] = {"endpoint": url, "fetched_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                            "query": query, "seconds": round(time.time() - t0, 1)}
            path.write_text(json.dumps(doc), encoding="utf-8")
            print(f"  fetched {tag} from {url}: {len(doc['elements'])} elements, {len(raw)/1e6:.1f} MB")
            return doc
        except (urllib.error.URLError, TimeoutError, RuntimeError, json.JSONDecodeError, ConnectionError) as ex:
            last = ex
            wait = min(15 * (2 ** (attempt // len(ENDPOINTS))), 240)
            print(f"  {url} failed ({ex}); retrying in {wait}s")
            time.sleep(wait)
    raise RuntimeError(f"Overpass failed for {tag}: {last}")


# ---------------------------------------------------------------- geometry
class Proj:
    """Local equirectangular projection to metres."""

    def __init__(self, lat0, lon0):
        self.lat0, self.lon0 = lat0, lon0
        self.kx = 111_320.0 * math.cos(math.radians(lat0))
        self.ky = 110_574.0

    def xy(self, lat, lon):
        return ((lon - self.lon0) * self.kx, (lat - self.lat0) * self.ky)

    def latlon(self, x, y):
        return (self.lat0 + y / self.ky, self.lon0 + x / self.kx)


def _way_geom(coords, proj):
    pts = [proj.xy(c["lat"], c["lon"]) for c in coords]
    if len(pts) >= 4 and pts[0] == pts[-1]:
        poly = Polygon(pts)
        if not poly.is_valid:
            poly = poly.buffer(0)
        return poly
    if len(pts) >= 2:
        return LineString(pts)
    return Point(pts[0]) if pts else None


def element_geom(el, proj):
    t = el["type"]
    if t == "node":
        return Point(proj.xy(el["lat"], el["lon"]))
    if t == "way":
        return _way_geom(el.get("geometry", []), proj) if el.get("geometry") else None
    if t == "relation":
        outers, inners = [], []
        for m in el.get("members", []):
            if m.get("type") != "way" or not m.get("geometry"):
                continue
            ls = LineString([proj.xy(c["lat"], c["lon"]) for c in m["geometry"]]) if len(m["geometry"]) >= 2 else None
            if ls is None:
                continue
            (inners if m.get("role") == "inner" else outers).append(ls)
        if not outers:
            return None
        polys = list(polygonize(unary_union(outers)))
        if not polys:  # broken multipolygon: fall back to its outline
            return unary_union(outers)
        g = unary_union(polys)
        if inners:
            holes = list(polygonize(unary_union(inners)))
            if holes:
                g = g.difference(unary_union(holes))
        return g if g.is_valid else g.buffer(0)
    return None


def classify(el):
    tags = el.get("tags", {})
    if tags.get("man_made") == "wastewater_plant":
        return "wwtp"
    lu = tags.get("landuse")
    if lu in FARM_LANDUSE:
        return "farm"
    if lu in BUILT_LANDUSE:
        return "built"
    return None


def build_layers(doc, proj):
    layers = {"wwtp": [], "farm": [], "built": []}
    names = []
    for el in doc["elements"]:
        k = classify(el)
        if not k:
            continue
        g = element_geom(el, proj)
        if g is None or g.is_empty:
            continue
        layers[k].append(g)
        if k == "wwtp":
            names.append(el.get("tags", {}).get("name", ""))
    return layers, names


class FeatureComputer:
    def __init__(self, doc, lat0, lon0):
        from shapely.strtree import STRtree

        self.proj = Proj(lat0, lon0)
        self.layers, self.wwtp_names = build_layers(doc, self.proj)
        self.trees = {k: STRtree(v) if v else None for k, v in self.layers.items()}
        self.counts = {k: len(v) for k, v in self.layers.items()}

    def _nearest(self, k, pt, cap):
        tree = self.trees[k]
        if tree is None:
            return float(cap), None
        i = tree.nearest(pt)
        d = self.layers[k][i].distance(pt)
        return float(min(d, cap)), int(i)

    def features(self, lat, lon):
        pt = Point(self.proj.xy(lat, lon))
        dw, iw = self._nearest("wwtp", pt, WWTP_CAP_M)
        df, _ = self._nearest("farm", pt, FARM_CAP_M)
        disc = pt.buffer(URBAN_RADIUS_M, quad_segs=32)
        frac = 0.0
        tree = self.trees["built"]
        if tree is not None:
            idx = tree.query(disc, predicate="intersects")
            if len(idx):
                inter = unary_union([self.layers["built"][i].intersection(disc) for i in idx])
                frac = inter.area / disc.area
        return {
            "osm_dist_wwtp_m": round(dw, 1),
            "osm_dist_farmland_m": round(df, 1),
            "osm_urban_frac_2km": round(min(frac, 1.0), 4),
            "osm_nearest_wwtp_name": (self.wwtp_names[iw] or None) if iw is not None else None,
        }
