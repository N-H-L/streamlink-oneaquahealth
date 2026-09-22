"""Step 2+3: map-context baseline v1, leave-one-city-out evaluation, JSON outputs.

Usage:  python analysis/baseline_v1.py            (needs analysis/features_oah_sites.csv from osm_features.py)
Writes: data/baseline/model-v1.json, data/baseline/site-features.json, analysis/results.json

PRE-SPECIFIED DESIGN (fixed before looking at held-out results; see REPORT.md):
  target   = site is in the top tercile of OAH healthRiskScore (threshold = 2/3 quantile of the
             TRAINING fold). healthRiskScore is OAH's own headline composite (pathogen + fecal + ARG),
             which is what the product ranks. Held-out Spearman vs the continuous score is reported too.
  features = x1 = log10(distance to nearest wastewater plant, m), x2 = log10(distance to nearest
             farmland, m), x3 = built-up fraction within 2 km (0-1). Distances clipped to [50 m, cap].
  model    = z-score each feature with training-fold mean/sd, L2 logistic regression (lambda = 1).
  eval     = leave-one-city-out (5 folds); pooled held-out AUROC + Spearman, per-fold values,
             permutation null (target shuffled across all 96 sites, whole pipeline refit, 1000x).
  baselines= random ranking (AUROC 0.5 by construction; null distribution shown), and the single
             best feature chosen INSIDE each training fold by |Spearman| with healthRiskScore.
  The same pipeline is run on OAH's own features (distanceToSewageStations, distChampCulture,
  urbanPct2000m/100) as a comparison. Pathogen risk is reported as a secondary, exploratory target.
"""
import csv
import json
import sys
import time
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import oahdata  # noqa: E402
import osmlib  # noqa: E402
from stats import auroc, fit_logistic, spearman  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
FEAT_CSV = ROOT / "analysis" / "features_oah_sites.csv"
N_PERM = 1000
L2 = 1.0
SEED = 20260923

SHIPPED_FEATURE = "osm_dist_wwtp_m"   # v1.1 scores with this single feature (see REPORT.md)

FEATURESETS = {
    "osm": ["osm_dist_wwtp_m", "osm_dist_farmland_m", "osm_urban_frac_2km"],
    "oah": ["distanceToSewageStations", "distChampCulture", "urbanPct2000m"],
}
CAPS = {"osm_dist_wwtp_m": osmlib.WWTP_CAP_M, "osm_dist_farmland_m": osmlib.FARM_CAP_M,
        "distanceToSewageStations": 50_000, "distChampCulture": 50_000}
MIN_DIST = 50.0


def transform_raw(name, v):
    """Fixed (non-fitted) transform: log10 of clipped distance, or fraction 0-1."""
    v = np.asarray(v, float)
    if name in CAPS:
        return np.log10(np.clip(v, MIN_DIST, CAPS[name]))
    if name == "urbanPct2000m":
        return v / 100.0
    return v


def load_rows():
    with FEAT_CSV.open(encoding="utf-8") as fh:
        rows = list(csv.DictReader(fh))
    lab = [r for r in rows if r["hasLab"] == "True"]
    return rows, lab


def design(lab, fset):
    return np.column_stack([transform_raw(f, [float(r[f]) for r in lab]) for f in FEATURESETS[fset]])


# ------------------------------------------------------------- pipeline pieces
def fit_model(X, y_cont):
    thr = np.quantile(y_cont, 2 / 3)
    y = (y_cont >= thr).astype(float)
    mu, sd = X.mean(0), X.std(0, ddof=0)
    sd[sd == 0] = 1
    b0, w = fit_logistic((X - mu) / sd, y, l2=L2)
    return {"mu": mu, "sd": sd, "b0": b0, "w": w, "thr": thr}


def predict(m, X):
    z = (X - m["mu"]) / m["sd"]
    return 1 / (1 + np.exp(-(m["b0"] + z @ m["w"])))


def fit_best_single(X, y_cont):
    rhos = [spearman(X[:, j], y_cont) for j in range(X.shape[1])]
    j = int(np.nanargmax(np.abs(rhos)))
    return {"j": j, "sign": float(np.sign(rhos[j])), "thr": np.quantile(y_cont, 2 / 3)}


def loco(X, y_cont, cities, want_folds=False):
    """Leave-one-city-out. Returns pooled metrics (and per-fold detail if asked)."""
    pred_m = np.empty(len(y_cont))
    pred_s = np.empty(len(y_cont))
    lab_ho = np.empty(len(y_cont), bool)
    folds = []
    for c in oahdata.CITY_ORDER:
        te = cities == c
        tr = ~te
        m = fit_model(X[tr], y_cont[tr])
        s = fit_best_single(X[tr], y_cont[tr])
        pred_m[te] = predict(m, X[te])
        pred_s[te] = s["sign"] * X[te, s["j"]]
        lab_ho[te] = y_cont[te] >= m["thr"]
        if want_folds:
            folds.append({
                "heldOutCity": c, "n": int(te.sum()), "nHighRisk": int(lab_ho[te].sum()),
                "trainThreshold": round(float(m["thr"]), 4),
                "model": {"spearman": spearman(pred_m[te], y_cont[te]), "auroc": auroc(pred_m[te], lab_ho[te]),
                          "weights": [round(float(v), 3) for v in m["w"]]},
                "bestSingle": {"feature": int(s["j"]), "sign": s["sign"],
                               "spearman": spearman(pred_s[te], y_cont[te]), "auroc": auroc(pred_s[te], lab_ho[te])},
            })
    # "within-city" spearman = mean over folds (what the in-city percentile relies on)
    wc_m = np.nanmean([spearman(pred_m[cities == c], y_cont[cities == c]) for c in oahdata.CITY_ORDER])
    wc_s = np.nanmean([spearman(pred_s[cities == c], y_cont[cities == c]) for c in oahdata.CITY_ORDER])
    res = {
        "model": {"auroc": auroc(pred_m, lab_ho), "spearman": spearman(pred_m, y_cont), "meanWithinCitySpearman": wc_m},
        "bestSingle": {"auroc": auroc(pred_s, lab_ho), "spearman": spearman(pred_s, y_cont), "meanWithinCitySpearman": wc_s},
    }
    return (res, folds) if want_folds else res


def evaluate(lab, fset, target, rng):
    X = design(lab, fset)
    y = np.array([float(r[target]) for r in lab])
    cities = np.array([r["city"] for r in lab])
    obs, folds = loco(X, y, cities, want_folds=True)
    keys = [(a, b) for a in ("model", "bestSingle") for b in ("auroc", "spearman", "meanWithinCitySpearman")]
    null = {k: [] for k in keys}
    for _ in range(N_PERM):
        r = loco(X, rng.permutation(y), cities)
        for a, b in keys:
            null[(a, b)].append(r[a][b])
    out = {"pooled": {}, "folds": folds, "featureNames": FEATURESETS[fset]}
    for a, b in keys:
        nv = np.array(null[(a, b)])
        o = obs[a][b]
        out["pooled"].setdefault(a, {})[b] = {
            "observed": round(float(o), 3),
            "null_mean": round(float(np.nanmean(nv)), 3),
            "null_95pct": round(float(np.nanquantile(nv, 0.95)), 3),
            "p_perm_one_sided": round(float((1 + np.sum(nv >= o)) / (1 + np.sum(~np.isnan(nv)))), 4),
        }
    # random-ranking baseline = the permutation null of the model itself
    out["pooled"]["random"] = {"auroc": {"observed": 0.5, "null_95pct": out["pooled"]["model"]["auroc"]["null_95pct"]},
                               "spearman": {"observed": 0.0}}
    return out


# --------------------------------------------------- v1.1 shipped rule: one fixed feature
# The pre-registered 3-feature logistic failed (pooled AUROC 0.33). The "best single feature"
# baseline printed 0.72, but that number is an ARTIFACT: each fold emitted the raw transformed
# feature it happened to select, so log10-metre values (-4.3..-1.7) and 0-1 fractions were pooled
# into one ranking, and the ranking mostly encoded which feature the fold picked. Scored as
# comparable probabilities the same selection procedure gives 0.32, i.e. no better than the
# logistic. What does survive is one FIXED feature - distance to the nearest wastewater plant -
# used to rank sites WITHIN a city, which is how the product uses it.
def loco_fixed_feature(X, y_cont, cities, j, rng=None, n_perm=0):
    def run(yv):
        pred = np.empty(len(yv)); labho = np.empty(len(yv), bool); rh = []; au = []; per = []
        for c in oahdata.CITY_ORDER:
            te, tr = cities == c, cities != c
            m = fit_model(X[tr][:, [j]], yv[tr])
            p = predict(m, X[te][:, [j]]); yt = yv[te]
            pred[te] = p; labho[te] = yt >= m["thr"]
            rh.append(spearman(p, yt))
            au.append(auroc(p, yt >= np.quantile(yt, 2 / 3)))   # top third WITHIN the held-out city
            per.append({"heldOutCity": c, "n": int(te.sum()), "weight": round(float(m["w"][0]), 3),
                        "withinCitySpearman": round(rh[-1], 3),
                        "withinCityAUROC": None if np.isnan(au[-1]) else round(au[-1], 3)})
        return (float(np.nanmean(rh)), float(np.nanmean(au)), auroc(pred, labho), spearman(pred, y_cont if yv is y_cont else yv), per)
    r, a, pooled_a, pooled_r, per = run(y_cont)
    out = {"withinCitySpearman": round(r, 3), "withinCityAUROC": round(a, 3),
           "pooledAcrossCitiesAUROC": round(float(pooled_a), 3), "pooledAcrossCitiesSpearman": round(float(pooled_r), 3),
           "folds": per}
    if n_perm:  # null shuffles the target WITHIN each city: the correct null for a within-city claim
        nr, na = [], []
        for _ in range(n_perm):
            yq = y_cont.copy()
            for c in oahdata.CITY_ORDER:
                m = cities == c
                yq[m] = rng.permutation(y_cont[m])
            x1, x2, _, _, _ = run(yq)
            nr.append(x1); na.append(x2)
        nr, na = np.array(nr), np.array(na)
        out["permutationNull"] = {
            "design": f"target shuffled within each city, {n_perm} times, whole pipeline refit",
            "spearman_95pct": round(float(np.nanquantile(nr, .95)), 3),
            "spearman_p": round(float((1 + np.sum(nr >= r)) / (1 + n_perm)), 4),
            "auroc_95pct": round(float(np.nanquantile(na, .95)), 3),
            "auroc_p": round(float((1 + np.sum(na >= a)) / (1 + n_perm)), 4)}
    return out


# ------------------------------------------------------------- POST-HOC variant
# Added AFTER seeing the pre-specified results (labelled as post-hoc in REPORT.md and model-v1.json).
# Reason: with 5 city clusters the pooled metric is dominated by BETWEEN-city differences, which the
# model cannot learn (the held-out city is unseen) and which are inverted in this sample (Ghent has
# the closest wastewater plants and the lowest lab risk). The product ranks sites WITHIN a city, so
# this variant fits and scores the same model on city-centred features (a fixed-effects style model):
# each transformed feature has its own city's median subtracted, train and test alike (features only,
# no labels, so no leakage). Within a city the ranking is unchanged by the centring; what changes is
# that the weights are estimated from within-city variation.
def city_centre(X, cities):
    Xc = X.copy()
    for c in sorted(set(cities)):  # sorted: set iteration order varies with PYTHONHASHSEED
        m = cities == c
        Xc[m] = X[m] - np.median(X[m], axis=0)
    return Xc


def loco_within(X, y_cont, cities, rng=None, n_perm=0):
    """LOCO on city-centred features; metrics are within-city (the deployment use)."""
    def run(yv):
        rhos, aurocs = [], []
        for c in oahdata.CITY_ORDER:
            te, tr = cities == c, cities != c
            Xc = city_centre(X, cities)
            m = fit_model(Xc[tr], yv[tr])
            p = predict(m, Xc[te])
            yt = yv[te]
            rhos.append(spearman(p, yt))
            aurocs.append(auroc(p, yt >= np.quantile(yt, 2 / 3)))  # top third WITHIN the held-out city
        return float(np.nanmean(rhos)), float(np.nanmean(aurocs)), rhos, aurocs
    rho, au, rhos, aus = run(y_cont)
    out = {"meanWithinCitySpearman": round(rho, 3), "meanWithinCityAUROC": round(au, 3),
           "perCity": {c: {"spearman": round(r, 3), "auroc": round(a, 3)} for c, r, a in zip(oahdata.CITY_ORDER, rhos, aus)}}
    if n_perm:  # null: shuffle the target WITHIN each city (keeps city levels, tests within-city signal)
        nr, na = [], []
        for _ in range(n_perm):
            yp = y_cont.copy()
            for c in sorted(set(cities)):  # deterministic permutation order
                m = cities == c
                yp[m] = rng.permutation(y_cont[m])
            a, b, _, _ = run(yp)
            nr.append(a); na.append(b)
        out["null"] = {"spearman_mean": round(float(np.mean(nr)), 3), "spearman_95pct": round(float(np.quantile(nr, .95)), 3),
                       "spearman_p": round(float((1 + np.sum(np.array(nr) >= rho)) / (1 + n_perm)), 4),
                       "auroc_mean": round(float(np.mean(na)), 3), "auroc_95pct": round(float(np.quantile(na, .95)), 3),
                       "auroc_p": round(float((1 + np.sum(np.array(na) >= au)) / (1 + n_perm)), 4)}
    return out


def r3(x):
    if isinstance(x, float):
        return None if np.isnan(x) else round(x, 3)
    if isinstance(x, dict):
        return {k: r3(v) for k, v in x.items()}
    if isinstance(x, list):
        return [r3(v) for v in x]
    return x


def main():
    rows, lab = load_rows()
    _, _, prov = oahdata.load()
    print(f"lab sites: {len(lab)}")
    results = {}
    for fset in ("osm", "oah"):
        for target in ("healthRiskScore", "scaledPathogenRisk"):
            t0 = time.time()
            res = evaluate(lab, fset, target, np.random.default_rng(SEED))
            results[f"{fset}:{target}"] = r3(res)
            p = res["pooled"]
            print(f"\n[{fset} features | target {target}]  ({time.time()-t0:.0f}s)")
            for a in ("model", "bestSingle"):
                print(f"  {a:10s} AUROC {p[a]['auroc']['observed']:.3f} (null95 {p[a]['auroc']['null_95pct']:.3f}, p={p[a]['auroc']['p_perm_one_sided']})"
                      f" | rho {p[a]['spearman']['observed']:+.3f} (p={p[a]['spearman']['p_perm_one_sided']})"
                      f" | within-city rho {p[a]['meanWithinCitySpearman']['observed']:+.3f} (p={p[a]['meanWithinCitySpearman']['p_perm_one_sided']})")
            wc = loco_within(design(lab, fset), np.array([float(r[target]) for r in lab]),
                             np.array([r["city"] for r in lab]), rng=np.random.default_rng(SEED), n_perm=N_PERM)
            results[f"{fset}:{target}"]["withinCityPostHoc"] = wc
            print(f"  postHoc within-city: rho {wc['meanWithinCitySpearman']:+.3f} (null95 {wc['null']['spearman_95pct']:+.3f}, p={wc['null']['spearman_p']})"
                  f" | AUROC {wc['meanWithinCityAUROC']:.3f} (null95 {wc['null']['auroc_95pct']:.3f}, p={wc['null']['auroc_p']})")
            for f in res["folds"]:
                print(f"    {f['heldOutCity']:9s} n={f['n']:2d} high={f['nHighRisk']:2d}  model rho {f['model']['spearman']:+.2f} AUROC {f['model']['auroc']:.2f}"
                      f"  | best[{FEATURESETS[fset][f['bestSingle']['feature']]}] rho {f['bestSingle']['spearman']:+.2f} AUROC {f['bestSingle']['auroc']:.2f}")
    (ROOT / "analysis" / "results.json").write_text(json.dumps(results, indent=1), encoding="utf-8")

    # ---------------- v1.1 shipped rule: one fixed feature, evaluated the way the product uses it
    X = design(lab, "osm")
    cities = np.array([r["city"] for r in lab])
    j = FEATURESETS["osm"].index(SHIPPED_FEATURE)
    shipped_eval = {}
    for target in ("healthRiskScore", "scaledPathogenRisk"):
        yv = np.array([float(r[target]) for r in lab])
        shipped_eval[target] = loco_fixed_feature(X, yv, cities, j, rng=np.random.default_rng(SEED), n_perm=N_PERM)
    e = shipped_eval["healthRiskScore"]
    print(f"\n[SHIPPED v1.1: {SHIPPED_FEATURE} only | target healthRiskScore]")
    print(f"  within-city rho {e['withinCitySpearman']:+.3f} (null95 {e['permutationNull']['spearman_95pct']:+.3f}, p={e['permutationNull']['spearman_p']})"
          f" | within-city AUROC {e['withinCityAUROC']:.3f} (null95 {e['permutationNull']['auroc_95pct']:.3f}, p={e['permutationNull']['auroc_p']})")
    print(f"  across-city (NOT demonstrated): pooled AUROC {e['pooledAcrossCitiesAUROC']:.3f}")
    for f in e["folds"]:
        print(f"    {f['heldOutCity']:9s} n={f['n']:2d} rho {f['withinCitySpearman']:+.2f} AUROC {f['withinCityAUROC']}")

    y = np.array([float(r["healthRiskScore"]) for r in lab])
    m = fit_model(X[:, [j]], y)          # final fit on all 96 sites, single feature
    write_model(m, results, prov, len(lab), shipped_eval)
    write_site_features(rows, m)


FEATURE_DEFS = {
    "osm_dist_wwtp_m": {
        "id": "osm_dist_wwtp_m", "label": "Distance to nearest wastewater treatment plant", "unit": "m",
        "osm": 'nwr["man_made"="wastewater_plant"]',
        "compute": "Planar distance from the site point to the nearest WWTP node/way/relation geometry (0 if inside). Searched within city bbox + 25 km; capped at 25 000 m.",
        "transform": "log10(clip(value, 50, 25000))", "expectedDirection": "closer = higher risk",
        "jsonField": "osm.distWastewaterM"},
    "osm_dist_farmland_m": {
        "id": "osm_dist_farmland_m", "label": "Distance to nearest farmland/orchard/vineyard", "unit": "m",
        "osm": 'nwr["landuse"~"^(farmland|orchard|vineyard)$"]',
        "compute": "Planar distance to the nearest farmland polygon (0 if inside). Searched within bbox + 5 km; capped at 5 000 m.",
        "transform": "log10(clip(value, 50, 5000))", "expectedDirection": "closer = higher risk (not used by v1.1)",
        "jsonField": "osm.distFarmlandM"},
    "osm_urban_frac_2km": {
        "id": "osm_urban_frac_2km", "label": "Built-up land fraction within 2 km", "unit": "fraction 0-1",
        "osm": 'nwr["landuse"~"^(residential|commercial|industrial|retail)$"]',
        "compute": "Area of the union of built-up landuse polygons inside a 2 km-radius disc, divided by the disc area.",
        "transform": "identity (the JSON also carries urbanFraction2km as a 0-100 percentage for display)",
        "expectedDirection": "more built-up = higher ARG risk (not used by v1.1)",
        "jsonField": "osm.urbanFrac2km"},
}

HEADLINE = (
    "This score ranks the streams of one city by how close they are to a wastewater treatment plant, "
    "the one map signal that still held up when it was tested on cities the model had never seen "
    "(within-city Spearman 0.22, permutation p = 0.03, across 96 OneAquaHealth lab sites). "
    "It says where to look first. It is not a measurement of water quality, it cannot say a stream is "
    "safe or unsafe, and it cannot compare one city with another."
)

RECOMMENDED_USE = ("Order sites within one city (percentile) as a starting prior; citizen event "
                   "reports and lab results must outweigh it in any referral ranking.")


def write_model(m, results, prov, n, shipped_eval):
    osm = results["osm:healthRiskScore"]
    oah = results["oah:healthRiskScore"]
    e = shipped_eval["healthRiskScore"]
    model = {
        "id": "streamlink-baseline-v1",
        "version": "1.1.0",
        "created": time.strftime("%Y-%m-%d"),
        "status": "experimental",
        "headline": HEADLINE,
        "description": ("Map-context baseline v1.1: a single-feature rule. Estimated probability that a stream site "
                        "is in the top third of OAH lab healthRiskScore, from how close it is to a wastewater "
                        "treatment plant in OpenStreetMap. A prior for prioritising lab visits, not a measurement."),
        "validated": {
            "withinCityRanking": True,
            "acrossCityComparison": False,
            "statement": ("Ranking sites inside one city is supported by leave-one-city-out: within-city Spearman "
                          "%.2f (permutation p = %s), within-city AUROC %.2f (p = %s). Comparing absolute scores "
                          "BETWEEN cities is not supported (pooled AUROC %.2f). Evidence base: 5 European cities, "
                          "96 sites, one lab campaign each, so this is one signal tested on five held-out cities, "
                          "not a validated instrument.") % (
                e["withinCitySpearman"], e["permutationNull"]["spearman_p"], e["withinCityAUROC"],
                e["permutationNull"]["auroc_p"], e["pooledAcrossCitiesAUROC"]),
        },
        "recommendedUse": RECOMMENDED_USE,
        "target": {"name": "healthRiskTopTercile", "definition": "healthRiskScore >= 2/3 quantile of the 96 OAH lab sites",
                   "threshold": round(float(m["thr"]), 4), "source": "OAH Resilience Map health-risks (one lab campaign per site, 2023-2024)"},
        "features": [FEATURE_DEFS[SHIPPED_FEATURE]],
        "contextFeatures": [FEATURE_DEFS[k] for k in FEATURESETS["osm"] if k != SHIPPED_FEATURE],
        "standardize": {"mean": [round(float(v), 6) for v in m["mu"]], "sd": [round(float(v), 6) for v in m["sd"]]},
        "logistic": {"intercept": round(float(m["b0"]), 6), "weights": [round(float(v), 6) for v in m["w"]], "l2": L2},
        "scoring": ("x = log10(clip(distance to nearest wastewater plant in m, 50, 25000)); z = (x - mean[0])/sd[0]; "
                    "score = 1/(1+exp(-(intercept + weights[0]*z))). weights[0] is negative, so a closer plant gives a "
                    "higher score. percentile = percentage of the city's sites with score <= this site's score (0-100)."),
        "evaluation": {
            "design": ("leave-one-city-out (Coimbra, Ghent, Toulouse, Benevento, Oslo); transform, threshold and weight "
                       "refit inside each fold. Within-city metrics use a null that shuffles the target WITHIN each city "
                       "(%d times); the across-city metric uses the pooled held-out ranking." % N_PERM),
            "n": n,
            "shippedRule": shipped_eval,
            "baselines": {"randomRanking": {"auroc": 0.5},
                          "note": "The shipped rule IS the single-feature baseline; the multi-feature model it is compared with is under 'alternatives'."},
        },
        "alternatives": {
            "multiFeatureLogistic": {
                "whatItWas": "The pre-registered v1.0 model: all three features, z-scored in-fold, L2 logistic regression.",
                "whyNotShipped": ("It did not beat chance on a held-out city (pooled AUROC %.2f, permutation p = %s). "
                                  "Between-city differences run the wrong way in this sample: Ghent has the closest "
                                  "wastewater plants and farmland but the lowest lab risk, while Benevento has the "
                                  "farthest plants and the highest risk. A model that cannot see the held-out city "
                                  "therefore ranks cities backwards.") % (
                    osm["pooled"]["model"]["auroc"]["observed"], osm["pooled"]["model"]["auroc"]["p_perm_one_sided"]),
                "locoResults": osm,
                "oahFeatureVersion": {
                    "note": ("The same 3-feature model on OAH's own map features scores better (pooled AUROC %.2f), but "
                             "that is confounded: OAH's Ghent values look unusable (13 of 17 Ghent lab sites have "
                             "urbanPct2000m = 0, farmland distances of 0.9-14.9 km although OSM shows farmland 10-460 m "
                             "away), which happens to push Ghent's scores down to match its low risk.") % (
                        oah["pooled"]["model"]["auroc"]["observed"]),
                    "locoResults": oah},
            },
            "inFoldFeatureSelection": {
                "whatItWas": "Pick the feature with the largest |Spearman| inside each training fold.",
                "whyNotShipped": ("Reported as AUROC 0.72 in v1.0; that figure was an artifact. Each fold emitted the raw "
                                  "transformed feature it selected, so log10-metre values and 0-1 fractions were pooled "
                                  "into a single ranking that mostly encoded which feature the fold had picked. Scored as "
                                  "comparable probabilities the same procedure gives pooled AUROC 0.32, and the selected "
                                  "feature was unstable (urban fraction in Coimbra and Benevento, wastewater distance in "
                                  "Ghent and Oslo, farmland distance in Toulouse)."),
            },
        },
        "caveats": [
            "What is supported: ordering sites WITHIN one city. What is not: comparing scores between cities, or reading a score as a risk level.",
            "Evidence base is 96 sites in 5 European cities with a single lab campaign each (2023-2024). Five cities means the effective sample for 'does it transfer' is five.",
            "The feature and its direction come from an earlier exploratory pass over these same 96 sites (212 uncorrected tests); leave-one-city-out reduces but does not remove that optimism.",
            "The signal is weak (within-city Spearman about 0.22) and absent in one of the five cities (Ghent).",
            "OpenStreetMap completeness and tagging vary and directly move the score: OSM way 1229453929 'PUB Bukit Timah Waterworks' is tagged man_made=wastewater_plant although it is a drinking-water facility, and it is the nearest 'plant' for 3 of the 10 Singapore sites.",
            "OAH's own map features for Ghent look unreliable (13 of 17 Ghent lab sites have urbanPct2000m = 0, and farmland distances of 0.9-14.9 km although OSM shows farmland 10-460 m away). Worth reporting back to the project.",
            "Out of distribution for tropical cities such as Singapore, where water reclamation plants are sealed facilities discharging to sea rather than into the streams, so the assumed mechanism may not hold. No lab data exists there to check it.",
            "Scores are relative priorities for where to sample, never a safety statement.",
        ],
        "provenance": {
            "labData": prov,
            "osm": "OpenStreetMap contributors (ODbL), via Overpass API; raw responses cached in analysis/.cache/overpass/",
            "code": "analysis/osm_features.py, analysis/baseline_v1.py",
            "oahAttribution": "OneAquaHealth project (EU Horizon Europe), Resilience Map data; used non-commercially with attribution",
        },
    }
    (ROOT / "data" / "baseline" / "model-v1.json").write_text(json.dumps(model, indent=1, ensure_ascii=False), encoding="utf-8")
    print("wrote data/baseline/model-v1.json (v1.1.0)")


def score_sites(feats, m):
    """v1.1 scores with the single shipped feature; the other two are still reported for context."""
    X = np.column_stack([transform_raw(SHIPPED_FEATURE, [float(r[SHIPPED_FEATURE]) for r in feats])])
    return predict(m, X)


def city_percentiles(scores, cities):
    scores, cities = np.asarray(scores), np.asarray(cities)
    pct = np.empty(len(scores))
    for c in sorted(set(cities)):
        idx = np.where(cities == c)[0]
        s = scores[idx]
        pct[idx] = [(s <= v).mean() for v in s]
    return pct


def write_site_features(rows, m):
    """Field names follow the app's contract (src/core/sites.ts Baseline): distWastewaterM,
    distFarmlandM, urbanFraction2km (PERCENT 0-100) and percentile (0-100). urbanFrac2km keeps the
    raw 0-1 fraction that the model actually consumes."""
    sc = score_sites(rows, m)
    pct = city_percentiles(sc, [r["city"] for r in rows])
    out = {}
    for r, s, p in zip(rows, sc, pct):
        def num(k):
            return None if r.get(k) in (None, "") else float(r[k])
        out[r["code"]] = {
            "code": r["code"], "city": r["city"], "lat": float(r["lat"]), "lon": float(r["lon"]),
            "hasLabData": r["hasLab"] == "True",
            "osm": {"distWastewaterM": num("osm_dist_wwtp_m"), "distFarmlandM": num("osm_dist_farmland_m"),
                    "urbanFraction2km": round(num("osm_urban_frac_2km") * 100, 2),
                    "urbanFrac2km": num("osm_urban_frac_2km"),
                    "nearestWwtpName": r.get("osm_nearest_wwtp_name") or None},
            "oah": {"distanceToSewageStations": num("distanceToSewageStations"), "distChampCulture": num("distChampCulture"),
                    "urbanPct2000m": num("urbanPct2000m")},
            "lab": {"healthRiskScore": num("healthRiskScore"), "scaledPathogenRisk": num("scaledPathogenRisk"),
                    "scaledFecalRisk": num("scaledFecalRisk"), "scaledArgRisk": num("scaledArgRisk")} if r["hasLab"] == "True" else None,
            "baselineScore": round(float(s), 4),
            "percentile": round(float(p) * 100, 1),
        }
    doc = {"model": "streamlink-baseline-v1",
           "note": "baselineScore is in-sample for lab sites (the final model is fitted on all 96); see model-v1.json evaluation for held-out performance. percentile is within the site's own city, 0-100.",
           "sites": out}
    (ROOT / "data" / "baseline" / "site-features.json").write_text(json.dumps(doc, indent=1, ensure_ascii=False), encoding="utf-8")
    print(f"wrote data/baseline/site-features.json ({len(out)} sites)")


if __name__ == "__main__":
    main()
