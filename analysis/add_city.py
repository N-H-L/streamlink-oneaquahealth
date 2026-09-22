"""Build a StreamLink city config (data/cities/<id>.json) for ANY city: "a new city in one file".

Usage:
  python analysis/add_city.py analysis/city_specs/singapore.json      # sites from a spec (named waterways)
  python analysis/add_city.py --auto 8 --id lyon --name Lyon --country FR --bbox 45.70,4.77,45.81,4.93
                                                                     # picks the N longest named waterways
  python analysis/add_city.py --oah                                  # the 5 OAH pilot cities (lab data)
  add --offline to use only cached Overpass responses.

What it does:
  1. One Overpass query for named waterways in the bbox; each site is snapped onto the water line.
  2. One Overpass query for the model's features (WWTPs, farmland, built-up landuse), same code as
     the OAH sites (analysis/osmlib.py).
  3. Scores sites with data/baseline/model-v1.json ONLY (the JSON is self-sufficient, as in the app).
"""
import argparse
import json
import math
import sys
import time
from pathlib import Path

from shapely.geometry import Point

sys.path.insert(0, str(Path(__file__).resolve().parent))
import osmlib  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
MODEL = ROOT / "data" / "baseline" / "model-v1.json"
OUTDIR = ROOT / "data" / "cities"
SCHEMA = "streamlink-city/1"


def load_model():
    return json.loads(MODEL.read_text(encoding="utf-8"))


def score(model, feats):
    """Pure re-implementation of model-v1.json 'scoring' (mirror this in TypeScript)."""
    z_sum = model["logistic"]["intercept"]
    for i, fd in enumerate(model["features"]):
        v = feats[fd["id"]]
        if fd["transform"].startswith("log10"):
            hi = osmlib.WWTP_CAP_M if fd["id"] == "osm_dist_wwtp_m" else osmlib.FARM_CAP_M
            x = math.log10(min(max(v, 50.0), hi))
        else:
            x = v
        z = (x - model["standardize"]["mean"][i]) / model["standardize"]["sd"][i]
        z_sum += model["logistic"]["weights"][i] * z
    return 1 / (1 + math.exp(-z_sum))


def percentiles(scores):
    return [sum(1 for t in scores if t <= s) / len(scores) for s in scores]


def pick_sites(spec, ww_doc, proj):
    ways = []
    for el in ww_doc["elements"]:
        if el["type"] != "way" or not el.get("geometry"):
            continue
        g = osmlib.element_geom(el, proj)
        ways.append((el["tags"].get("name", ""), el["id"], el["tags"].get("waterway"), g))
    chosen = []
    if spec.get("sites"):
        for s in spec["sites"]:
            names = {n.lower() for n in s["waterway"]}
            hint = Point(proj.xy(*s["near"]))
            cands = [(g.distance(hint), n, wid, wt, g) for n, wid, wt, g in ways if n.lower() in names]
            if not cands:
                print(f"  ! no OSM waterway named {s['waterway']}; skipped")
                continue
            d, n, wid, wt, g = min(cands, key=lambda c: c[0])
            if d > 3000:
                print(f"  ! nearest '{n}' is {d:.0f} m from hint; skipped")
                continue
            p = g.interpolate(g.project(hint))
            lat, lon = proj.latlon(p.x, p.y)
            chosen.append({"name": s.get("label", n), "waterway": n, "waterwayType": wt, "osmWayId": wid,
                           "lat": round(lat, 6), "lon": round(lon, 6), "snapDistanceM": round(d, 1)})
    else:  # --auto: the N longest named waterways (by total length per name), midpoint of the longest segment
        by_name = {}
        for n, wid, wt, g in ways:
            by_name.setdefault(n, []).append((g.length, wid, wt, g))
        top = sorted(by_name.items(), key=lambda kv: -sum(x[0] for x in kv[1]))[: spec["auto"]]
        for n, segs in top:
            L, wid, wt, g = max(segs, key=lambda x: x[0])
            p = g.interpolate(0.5, normalized=True)
            lat, lon = proj.latlon(p.x, p.y)
            chosen.append({"name": n, "waterway": n, "waterwayType": wt, "osmWayId": wid,
                           "lat": round(lat, 6), "lon": round(lon, 6), "snapDistanceM": 0.0})
    return chosen


def build_city(spec, offline=False):
    model = load_model()
    bbox = tuple(spec["bbox"])
    s, w, n, e = bbox
    proj = osmlib.Proj((s + n) / 2, (w + e) / 2)
    print(f"{spec['name']}: bbox {bbox}")
    ww = osmlib.overpass(osmlib.waterways_query(bbox), f"waterways-{spec['id']}", offline=offline)
    sites = pick_sites(spec, ww, proj)
    if not sites:
        raise SystemExit("no sites found")
    core = osmlib.bbox_of([(x["lat"], x["lon"]) for x in sites])
    doc = osmlib.fetch_features(core, spec["id"], offline=offline)
    fc = osmlib.FeatureComputer(doc, (core[0] + core[2]) / 2, (core[1] + core[3]) / 2)
    print(f"  feature layers: {fc.counts}")
    prefix = spec.get("codePrefix", spec["id"][:2].upper())
    for i, x in enumerate(sites, 1):
        x["code"] = f"{prefix}{i}"
        f = fc.features(x["lat"], x["lon"])
        x["features"] = {"distWwtpM": f["osm_dist_wwtp_m"], "distFarmlandM": f["osm_dist_farmland_m"],
                         "urbanFrac2km": f["osm_urban_frac_2km"], "nearestWwtpName": f["osm_nearest_wwtp_name"]}
        x["baselineScore"] = round(score(model, f), 4)
    for x, p in zip(sites, percentiles([x["baselineScore"] for x in sites])):
        x["cityPercentile"] = round(p, 4)
        x["hasLabData"] = False
    sites = [{k: x[k] for k in ("code", "name", "waterway", "waterwayType", "osmWayId", "lat", "lon", "snapDistanceM",
                                "hasLabData", "features", "baselineScore", "cityPercentile")} for x in sites]
    return {
        "schema": SCHEMA,
        "id": spec["id"], "name": spec["name"], "country": spec["country"],
        "centre": {"lat": round((s + n) / 2, 5), "lon": round((w + e) / 2, 5)},
        "bbox": {"south": s, "west": w, "north": n, "east": e},
        "labData": {"available": False,
                    "note": "No OneAquaHealth lab campaign in this city. Scores are the map-context baseline only; lab confirmation is required."},
        "baseline": {
            "model": model["id"], "modelVersion": model["version"], "outOfDistribution": True,
            "note": ("Model trained on 96 sites in 5 temperate European cities. "
                     + (f"{spec['name']} ({spec.get('climate', 'climate unknown')}) differs in climate, hydrology and drainage/sewerage design, "
                        "so scores are an out-of-distribution prior for ranking sites within the city, not a risk estimate.")),
            "featureCounts": fc.counts,
        },
        "dataQualityNotes": spec.get("dataQualityNotes", []),
        "sites": sites,
        "provenance": {"osm": "OpenStreetMap contributors (ODbL) via Overpass API",
                       "fetched": {"waterways": ww.get("_meta", {}).get("fetched_utc"), "features": doc.get("_meta", {}).get("fetched_utc")},
                       "generator": "analysis/add_city.py", "generated": time.strftime("%Y-%m-%d")},
    }


def build_oah_cities():
    """Same shape for the 5 OAH pilot cities, from data/baseline/site-features.json (lab data available)."""
    model = load_model()
    sf = json.loads((ROOT / "data" / "baseline" / "site-features.json").read_text(encoding="utf-8"))["sites"]
    names = {x["code"]: x for x in json.loads((ROOT / "data" / "oah" / "sites.snapshot.json").read_text(encoding="utf-8"))}
    for city in sorted({x["city"] for x in sf}):
        ss = [x for x in sf if x["city"] == city]
        lats, lons = [x["lat"] for x in ss], [x["lon"] for x in ss]
        c0 = names[ss[0]["code"]]["city"]
        doc = {
            "schema": SCHEMA, "id": city.lower(), "name": city, "country": None,
            "oahCityId": c0["id"],
            "centre": {"lat": c0["latitude"], "lon": c0["longitude"]},
            "bbox": {"south": min(lats), "west": min(lons), "north": max(lats), "east": max(lons)},
            "labData": {"available": True, "sitesWithLab": sum(x["hasLabData"] for x in ss),
                        "note": "One OAH lab campaign per site (2023-2024). Lab sites were used to train the baseline, so their baselineScore is in-sample."},
            "baseline": {"model": model["id"], "modelVersion": model["version"], "outOfDistribution": False},
            "sites": [{"code": x["code"], "name": names[x["code"]]["name"], "lat": x["lat"], "lon": x["lon"],
                       "hasLabData": x["hasLabData"],
                       "features": {"distWwtpM": x["osm"]["distWwtpM"], "distFarmlandM": x["osm"]["distFarmlandM"],
                                    "urbanFrac2km": x["osm"]["urbanFrac2km"], "nearestWwtpName": x["osm"]["nearestWwtpName"]},
                       "lab": x["lab"], "baselineScore": x["baselineScore"], "cityPercentile": x["cityPercentile"]} for x in ss],
            "provenance": {"sites": "OAH Resilience Map snapshot (data/oah/)", "osm": "OpenStreetMap contributors (ODbL)",
                           "generator": "analysis/add_city.py --oah", "generated": time.strftime("%Y-%m-%d")},
        }
        write(doc)


def write(doc):
    OUTDIR.mkdir(parents=True, exist_ok=True)
    p = OUTDIR / f"{doc['id']}.json"
    p.write_text(json.dumps(doc, indent=1, ensure_ascii=False), encoding="utf-8")
    print(f"  wrote {p.relative_to(ROOT)} ({len(doc['sites'])} sites)")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("spec", nargs="?")
    ap.add_argument("--oah", action="store_true")
    ap.add_argument("--auto", type=int)
    ap.add_argument("--id"); ap.add_argument("--name"); ap.add_argument("--country"); ap.add_argument("--bbox")
    ap.add_argument("--offline", action="store_true")
    a = ap.parse_args()
    if a.oah:
        return build_oah_cities()
    if a.spec:
        spec = json.loads(Path(a.spec).read_text(encoding="utf-8"))
    else:
        spec = {"id": a.id, "name": a.name, "country": a.country, "auto": a.auto or 8,
                "bbox": [float(v) for v in a.bbox.split(",")]}
    write(build_city(spec, offline=a.offline))


if __name__ == "__main__":
    main()
