# Map-context baseline v1.1 — what we ship, method, results, limitations

StreamLink, OneAquaHealth IEEE Global Hackathon 2026. Analysis run 2026-09-23 (SGT).
Reproduce with `pip install -r analysis/requirements.txt` then

```
python analysis/osm_features.py      # OpenStreetMap features for all 106 OAH sites (cached Overpass responses)
python analysis/baseline_v1.py       # leave-one-city-out evaluation -> data/baseline/*.json
python analysis/add_city.py analysis/city_specs/singapore.json   # a new city in one file
python analysis/add_city.py --oah    # the 5 pilot cities in the same shape
```

## 0. What we ship, and why (v1.1)

**We ship a one-feature rule: how close the site is to the nearest wastewater treatment plant.**
Score = a monotone map of that distance to 0-1 (closer = higher), used to order the sites *within
one city*.

Why this and not the three-feature model:

| | within-city rho | p | within-city AUROC | p | across-city AUROC |
|---|---|---|---|---|---|
| **shipped: distance to wastewater plant** | **+0.22** | **0.025** | **0.63** | **0.030** | 0.55 (not supported) |
| 3-feature logistic (v1.0) | +0.19 | 0.07 | 0.57 | 0.17 | 0.33 (worse than chance) |

The one-feature rule is the only thing here that beats its permutation null, it is positive in 4 of
5 cities (Coimbra +0.28, Benevento +0.51, Oslo +0.23, Toulouse +0.08, Ghent -0.01), and it is
readable by anyone: *streams near a wastewater plant get looked at first*. Ranking **between**
cities is not supported by anything we measured, so the product only ever ranks within a city.

**Correction to v1.0.** v1.0 reported a "best single feature" baseline at AUROC 0.72 and this report
repeated it. That number was an artifact of the evaluation code, not a result: each fold emitted the
raw transformed feature it had selected, so log10-metre values (-4.3 to -1.7) and 0-1 fractions were
pooled into one ranking which mostly encoded *which feature the fold happened to pick* - and that
tracked the cities' risk rates. Scored as comparable probabilities, the same selection procedure
gives pooled AUROC **0.32**, no better than the logistic, and the feature it selects is unstable
(urban fraction in Coimbra and Benevento, wastewater distance in Ghent and Oslo, farmland distance
in Toulouse). The shipped rule instead uses **one fixed feature in every fold**, which is what the
table above evaluates.

**Still true, and the pitch must say it:** this is a weak prior from 96 sites in 5 cities with one
lab campaign each. It says where to look first. It is not a measurement, and it cannot call a stream
safe or unsafe. The full negative result for the combined model is kept below deliberately.

## 1. Why these features

The pilot cities come with OAH's own map-derived parameters, but Singapore (or any new city) does
not. So the same three ideas are recomputed from OpenStreetMap, which exists everywhere:

| Feature | OSM query | Definition |
|---|---|---|
| `osm_dist_wwtp_m` | `man_made=wastewater_plant` | metres to the nearest plant (0 if inside); searched in the city bbox + 25 km, capped at 25 km |
| `osm_dist_farmland_m` | `landuse=farmland/orchard/vineyard` | metres to the nearest farmland polygon; bbox + 5 km, capped at 5 km |
| `osm_urban_frac_2km` | `landuse=residential/commercial/industrial/retail` | area of built-up landuse inside a 2 km disc, divided by the disc area |

Built-up **landuse polygons** were chosen over building footprints: they are the closer analogue of
OAH's `urbanPct2000m` (an artificial-surface share, like CORINE / Urban Atlas), they download in a
few MB instead of hundreds, and building footprints measure something different (roof cover, closer
to imperviousness). Three Overpass requests per city, each cached raw in `analysis/.cache/overpass/`
(gitignored), polite User-Agent, retries with backoff over several public instances.

## 2. Do the OSM features agree with OAH's own?

Spearman on the 96 lab sites.

| OSM feature | OAH feature | pooled | Coimbra | Ghent | Toulouse | Benevento | Oslo |
|---|---|---|---|---|---|---|---|
| `osm_dist_wwtp_m` | `distanceToSewageStations` | **+0.83** | +1.00 | 0.00 | +1.00 | +1.00 | +1.00 |
| `osm_urban_frac_2km` | `urbanPct2000m` | **+0.90** | +0.84 | +0.62 | +0.94 | +0.87 | +0.87 |
| `osm_dist_farmland_m` | `distChampCulture` | +0.22 | +0.78 | -0.25 | +0.47 | +1.00 | +0.84 |

Outside Ghent the wastewater-plant distances agree perfectly in rank (the OSM value is a
near-constant fraction of OAH's within each city — 0.72-0.77 in Coimbra/Toulouse/Benevento,
0.45-0.50 in Oslo — so OAH appears to measure a different but consistently ordered distance), and
built-up fraction agrees strongly everywhere.

**Ghent is the exception, and the evidence points at OAH's layer, not ours** (inference): 13 of the
17 Ghent lab sites have `urbanPct2000m = 0`, which is implausible for sites inside a city, and OAH
farmland distances there are 0.9-14.9 km although OSM shows farmland 10-460 m away in Flanders.
Ghent's OAH context values look unusable, which matters below.

## 3. The pre-registered v1.0 model (fixed before looking at held-out results)

- **Target**: the site is in the **top third of OAH `healthRiskScore`** — OAH's own headline
  composite, and the thing the product ranks. Chosen in advance and not changed; pathogen risk is
  reported only as a labelled secondary target. Held-out Spearman against the continuous score is
  reported as well.
- **Model**: log10 of the two (clipped) distances, built-up fraction as is, z-scored with the
  **training fold's** mean/sd, then L2 logistic regression (lambda = 1). The score is the predicted
  probability, 0-1.
- **Evaluation**: leave-one-city-out, 5 folds. Transforms, tercile threshold and weights are all
  refit inside each fold. Null = shuffle the target across sites and rerun the whole pipeline 1000x.
- **Baselines**: random ranking, and the single best feature *chosen inside each training fold*.

## 4. Results

Pooled over the 5 held-out folds; `data/baseline/model-v1.json` carries the per-fold numbers.

| Features | Model | AUROC (top tercile) | perm p | Held-out Spearman | perm p |
|---|---|---|---|---|---|
| OSM | **baseline v1.0 (3-feature logistic)** | **0.33** | 0.97 | -0.14 | 0.83 |
| OSM | in-fold feature selection, raw scales | ~~0.72~~ | ~~0.002~~ | +0.21 | 0.10 |
| OSM | in-fold feature selection, comparable scores | 0.32 | — | -0.19 | — |
| OSM | **shipped v1.1: wastewater-plant distance only** | 0.55 | 0.27 | +0.09 | 0.23 |
| OSM | random ranking | 0.50 | — | 0.00 | — |
| OAH | baseline v1.0 (same pipeline) | 0.70 | 0.01 | +0.28 | 0.005 |
| OAH | best single feature (in-fold, raw scales) | 0.69 | 0.02 | +0.21 | 0.09 |

The struck-through 0.72 is the artifact described in §0. Note that **no** rule, including the one we
ship, is supported on the *across-city* metric — which is why the product never compares cities.
The shipped rule's support is the within-city evaluation in §0 (rho +0.22, within-city permutation
p = 0.025).

Post-hoc (added after seeing the above, and labelled as such): the same model fitted on
**city-centred** features and scored within each held-out city — the way the product actually uses
it.

| Features | Mean within-city Spearman | perm p | Mean within-city AUROC | perm p |
|---|---|---|---|---|
| OSM | +0.19 | 0.07 | 0.57 | 0.17 |
| OAH | +0.09 | 0.21 | 0.53 | 0.32 |

**Reading these honestly:**

1. The pre-registered 3-feature model **fails**: 0.33 AUROC is worse than chance. It is kept in
   `model-v1.json` under `alternatives.multiFeatureLogistic` as a documented negative result.
2. The reason is between-city, not within-city. Ghent has the **closest** wastewater plants and
   farmland of the five cities but the **lowest** lab risk (1 of 17 sites in the top tercile), while
   Benevento has the farthest plants and the highest risk. Ranking sites across cities on these
   features therefore inverts. Inside every fold the learned weight on wastewater-plant distance is
   negative (closer = higher risk), the expected direction.
3. The OAH-feature model looks good (0.70) partly **because** Ghent's broken values happen to push
   Ghent's scores down to match its low risk. That is an artifact, not extra validity, so "OAH's own
   features do better" should not be claimed as a finding.
4. Within a city — the only way the product uses the score — the 3-feature model is weak and does
   not reach significance (OSM +0.19, p = 0.07; OAH +0.09, p = 0.21). The single fixed feature we
   ship does (+0.22, p = 0.025); see §0.
5. At the level of single correlations the OSM features do reproduce OAH's reported signal:
   pathogen risk vs distance to a wastewater plant, OSM rho = -0.22 pooled and -0.38 excluding Ghent
   (OAH's own feature: -0.35 / -0.39); ARG risk vs built-up fraction within 2 km, OSM +0.35
   (OAH +0.31). The information is there; three features and 96 sites are not enough to turn it into
   a model that transfers to an unseen city.

## 5. Limitations

- n = 96, 5 cities, **one lab campaign per site** (95 of them in 2023). Nothing here tracks change
  over time, and a single campaign is itself a noisy draw.
- The features and their expected signs come from an earlier exploratory pass over the same 96 sites
  (212 uncorrected tests). Leave-one-city-out reduces that optimism but cannot remove it.
- Five cities means five clusters, so the effective sample for "does it transfer to a new city" is 5,
  not 96. A permutation null is reported for every number precisely because of this.
- OSM completeness and tagging vary by city and directly move the score; an unmapped plant or landuse
  polygon changes a site's rank. The score is only as good as the map. A live example found while
  building the Singapore config: OSM way 1229453929, "PUB Bukit Timah Waterworks", is tagged
  `man_made=wastewater_plant` although it is a drinking-water facility, and it is the nearest
  "plant" for 3 of the 10 Singapore sites. It was left uncorrected so the demo shows the real
  dependency on map quality (see `dataQualityNotes` in `data/cities/singapore.json`).
- In Singapore 6 of the 10 sites sit at the 5 km cap for distance to farmland, so that feature
  carries almost no information there.
- Singapore is **out of distribution**: tropical, different drainage, and its water reclamation
  plants are sealed facilities discharging to sea rather than into the streams. There is no lab data
  there, so nothing can check the score.
- The score is a **prior about where to look**, not a measurement of water quality and not a safety
  statement.

## 6. What the product should do with this

Use `percentile` (0-100, within the city) to order the sites of one city as a starting point for
"where should the lab go first", and let citizen event reports and lab results outweigh it. Show the
caveat text from `model-v1.json` (`headline`, `caveats`) wherever the score is displayed. Never sort
or compare sites from different cities by `baselineScore`.
