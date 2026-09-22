"""Load the OAH Resilience Map snapshots (sites, lab health risks, map-derived urban parameters).

Looks in data/oah/*.snapshot.json first (the committed snapshots), then falls back to the raw
copies in analysis/.cache/ (retrieved 2026-09-22/23 from the same endpoints; see data/oah/README.md).
The live API is never called from here.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCES = {
    "sites": ["data/oah/sites.snapshot.json"],
    "health": ["data/oah/health-risks.snapshot.json", "analysis/.cache/oah-health-risks.json"],
    "urban": ["data/oah/urban-parameters.snapshot.json", "analysis/.cache/oah-urban-parameters.json"],
}
OAH_FEATURES = ["distanceToSewageStations", "distChampCulture", "urbanPct2000m"]
CITY_ORDER = ["Coimbra", "Ghent", "Toulouse", "Benevento", "Oslo"]


def _load(kind):
    for rel in SOURCES[kind]:
        p = ROOT / rel
        if p.exists():
            return json.loads(p.read_text(encoding="utf-8")), rel
    raise FileNotFoundError(f"none of {SOURCES[kind]} found")


def load():
    """Returns (sites, rows, provenance). rows = lab sites (n=96) joined with OAH map features."""
    sites_raw, s_src = _load("sites")
    health, h_src = _load("health")
    urban, u_src = _load("urban")
    sites = {
        s["code"]: {
            "code": s["code"], "name": s["name"], "city": s["city"]["name"], "cityId": s["city"]["id"],
            "lat": s["latitude"], "lon": s["longitude"],
        }
        for s in sites_raw
    }
    up = {u["researchSiteCode"]: u for u in urban}
    rows = []
    for h in health:
        c = h["researchSiteCode"]
        if c not in sites:
            continue
        r = dict(sites[c])
        r.update({k: h[k] for k in ("samplingDate", "scaledPathogenRisk", "scaledFecalRisk", "scaledArgRisk", "healthRiskScore")})
        u = up.get(c, {})
        for k in OAH_FEATURES:
            r[k] = u.get(k)
        rows.append(r)
    prov = {"sites": s_src, "healthRisks": h_src, "urbanParameters": u_src}
    return sites, rows, prov
