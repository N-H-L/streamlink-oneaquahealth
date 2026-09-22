"""Step 1: compute OSM context features for every OAH research site (one Overpass query per city).

Usage:  python analysis/osm_features.py [--offline]
Output: analysis/features_oah_sites.csv  (all OAH sites, lab or not; OAH features where present)
        prints agreement (Spearman) between the OSM features and OAH's own map features.
"""
import csv
import sys
from collections import defaultdict
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import oahdata  # noqa: E402
import osmlib  # noqa: E402
from stats import spearman  # noqa: E402

OUT = Path(__file__).resolve().parent / "features_oah_sites.csv"


def main(offline=False):
    sites, rows, _ = oahdata.load()
    urban = {r["code"]: r for r in rows}
    by_city = defaultdict(list)
    for s in sites.values():
        by_city[s["city"]].append(s)
    out, meta = [], {}
    for city in oahdata.CITY_ORDER:
        ss = by_city[city]
        core = osmlib.bbox_of([(s["lat"], s["lon"]) for s in ss])
        print(f"{city}: {len(ss)} sites, core bbox {core}")
        doc = osmlib.fetch_features(core, city.lower(), offline=offline)
        lat0, lon0 = (core[0] + core[2]) / 2, (core[1] + core[3]) / 2
        fc = osmlib.FeatureComputer(doc, lat0, lon0)
        meta[city] = fc.counts
        print(f"  layers: {fc.counts}")
        for s in ss:
            f = fc.features(s["lat"], s["lon"])
            r = urban.get(s["code"], {})
            out.append({
                "code": s["code"], "city": city, "lat": s["lat"], "lon": s["lon"],
                "hasLab": s["code"] in urban,
                **f,
                **{k: r.get(k) for k in oahdata.OAH_FEATURES},
                **{k: r.get(k) for k in ("healthRiskScore", "scaledPathogenRisk", "scaledFecalRisk", "scaledArgRisk")},
            })
    with OUT.open("w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=list(out[0].keys()))
        w.writeheader()
        w.writerows(out)
    print(f"wrote {OUT} ({len(out)} sites)")

    lab = [o for o in out if o["hasLab"]]
    pairs = [("osm_dist_wwtp_m", "distanceToSewageStations"), ("osm_dist_farmland_m", "distChampCulture"),
             ("osm_urban_frac_2km", "urbanPct2000m")]
    print("\nAgreement OSM vs OAH features (Spearman, lab sites n=%d)" % len(lab))
    for a, b in pairs:
        x = np.array([o[a] for o in lab], float)
        y = np.array([o[b] for o in lab], float)
        within = []
        for city in oahdata.CITY_ORDER:
            m = np.array([o["city"] == city for o in lab])
            within.append(f"{city[:4]} {spearman(x[m], y[m]):+.2f}")
        print(f"  {a:22s} vs {b:26s} pooled {spearman(x, y):+.2f} | " + ", ".join(within))
    return out, meta


if __name__ == "__main__":
    main(offline="--offline" in sys.argv)
