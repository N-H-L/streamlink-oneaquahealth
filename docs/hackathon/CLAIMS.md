# Claim → evidence

Every claim StreamLink makes, what a judge can click to see it, the file that proves it, and what the claim does **not** cover. If a limitation here is missing from the README, the About page or the submission text, that is a bug in the text, not in this table.

- Live demo: https://n-h-l.github.io/streamlink-oneaquahealth/
- Repository: https://github.com/N-H-L/streamlink-oneaquahealth
- Video: https://youtu.be/ij3GwQ4N66o
- Committed proof files: `docs/evidence/`

---

## Impact and alignment with OneAquaHealth (30%)

| Claim | Feature | How a judge sees it | Evidence | What it does not claim |
|---|---|---|---|---|
| The health picture of OAH streams ages fast: each of the 96 lab sites carries exactly one health-risk campaign, 95 of them from 2023 | The board's first stat, "days since the lab last visited a typical stream here" | Open the board for any city | `EVIDENCE.md` § lab sampling frequency, queried from the Resilience Map health-risks endpoint; `data/sites.json` | Nothing about campaigns run after that snapshot, or about cities outside the five |
| Citizen reports can become something a city acts on | The record lifecycle: check → trust → verification → lab visit request → result → volunteer told | Board → open a stream → Coordinator actions → Verify, Request lab visit, Record result → Messages | `src/core/workflow.ts`; the same lifecycle run on the real OAH sandbox, `docs/evidence/sandbox-demo.json` | That any city has adopted it, or that the resulting priority order improves real outcomes |
| It supports expert judgement rather than replacing it | Nothing becomes `final` without a human; the ranking shows its weights and states its reason in words | "How is this ranked?" on the board; the factor bars and the sentence on a record | `src/core/triage.ts` (`explain()`); `src/core/trust.ts` | That the trust rules catch deliberate abuse — they test consistency, not honesty |
| It builds on the project's own assets instead of replacing them | The OAH Citizen Science App's own question set; OAH sites and lab health-risk scores; the OAH FHIR IG; the OAH sandbox | The check-in wizard; About → Data sources | `src/core/questions.ts`; `data/sites.json`; `fhir/` | No connection to the live Citizen Science App backend: the question set is mirrored, not integrated |

## Innovation and creativity (20%)

| Claim | Feature | How a judge sees it | Evidence | What it does not claim |
|---|---|---|---|---|
| The OAH IG has no model for a citizen check, and `observation-indicators-oah` fixes `status = final`, so provisional citizen data cannot conform | A proposed extension: 9 profiles, 2 extensions, code systems, value sets, a Questionnaire and a ConceptMap to OAH indicator codes | `fhir/` in the repo; About → Standards | `docs/SPEC-fhir.md`; SUSHI 0 errors / 0 warnings; validator PASS | That HL7 Europe has reviewed or accepted it. It is a proposal, offered back to the project |
| A citizen check can be **promoted** into a conformant OAH indicator observation | On verification the observations become `final` and carry **both** profiles | Verify a check, then open "This record as stored (FHIR resources)" | Read back from the OAH sandbox carrying both profiles: `EVIDENCE.md` 2026-09-23 ~03:00 | That the promotion step is part of the official IG |
| Trust is explained, not hidden | 8 named rules with weights; the volunteer can fix or confirm; the score is stored in a FHIR Provenance | Answer "water looks clean" and "sewage smell" in the same check | `src/core/trust.ts`; tests in `src/core/core.test.ts` | That the rules are validated against known-false reports |

## Technical implementation (20%)

| Claim | Feature | How a judge sees it | Evidence | What it does not claim |
|---|---|---|---|---|
| Every record type the app writes is valid against the official IGs | The validation banner on the About page | About → Standards | Official HL7 validator 6.10.4 with `-tx https://tx.fhir.org/r4`: 45 IG artefacts + 12 engine-produced transactions + 34 resources as stored, **0 errors**; 5/5 negative tests rejected. `docs/evidence/validation-summary.md` | Conformance to any profile outside OAH + StreamLink |
| The app's own code talks to a real FHIR server, not a mock | `RemoteStore` against the OAH sandbox; 34 resources written and read back | The sandbox segment of the video; `npm run sandbox` | `docs/evidence/sandbox-demo.json` (the ids), `docs/evidence/sandbox-record-in-app.png` | The sandbox is **not reachable from the hosted page**: it returns two conflicting CORS headers, and at submission time it is offline entirely. The video's sandbox segment is real footage from the earlier live run, captioned as such |
| The prototype is tested | 25 unit tests, a browser walkthrough, an accessibility audit and an offline proof — all re-run against the **deployed** build | The CI badge; `npm test`, `npm run e2e` | `EVIDENCE.md` 2026-09-25: e2e OK, offline OK, a11y 0 violations, all against the GitHub Pages URL | No load testing, no multi-user testing, no security review |
| It works offline, which is what a volunteer at a stream needs | Service worker, and a check submitted with the network off is kept | Load the site, turn the network off, reload, submit a check | `scripts/offline-check.mjs` run against the deployed URL | The check is kept on the device; there is no server-side sync service |

## Usability and user experience (15%)

| Claim | Feature | How a judge sees it | Evidence | What it does not claim |
|---|---|---|---|---|
| A volunteer can file a usable check in four picture-led steps | The check-in wizard, with drafts that survive a reload | "Check a stream" from any screen | `src/app/views/CheckIn.tsx`; the e2e step "check submitted" | Not tested with volunteers in the field, and no usability study was run |
| A coordinator is told what to do next, not just shown data | The "Act on this next" card, with the reason in one sentence | Top of the board | `src/app/views/Board.tsx`; `explain()` in `src/core/triage.ts` | That the recommended order matches what a city would actually choose |
| It passes the automated WCAG 2.1 A/AA rules and works on a phone | axe-core clean; layouts checked at 320, 390 and 768 px | Open the demo on a phone | `docs/evidence/a11y.json`; `npm run a11y` on the deployed build | Automated rules only: no screen-reader or assistive-technology testing with users |

## Feasibility and scalability (15%)

| Claim | Feature | How a judge sees it | Evidence | What it does not claim |
|---|---|---|---|---|
| A city with no lab data at all can still be ranked | The Oslo and Singapore tabs, ranked on map context alone | Switch city tabs on the board | `data/sites.json`; the "new" badge and the empty-state wording | In such a city the ranking rests on one weak signal — see the row below |
| The map factor is real, tested, and weak | "Where to look first (from maps)" | About → The map-context baseline | Leave-one-city-out over 96 sites in 5 cities: within-city Spearman **+0.22** (permutation p = 0.025), AUROC 0.63 (p = 0.030). `analysis/REPORT.md`, `data/baseline/model-v1.json` v1.1 | **Not** comparison between cities (pooled AUROC 0.55), not a risk level, not a measurement. A richer 3-feature model did worse than chance on a held-out city and was dropped; it is kept as a documented negative result |
| Adding a city costs a coordinate list, not a retrain | Six cities in the build, two of them with no lab data | The city tabs | The OpenStreetMap feature build in `scripts/`; `data/` | Nothing about data-sharing agreements, hosting or governance, which are the real adoption blockers |
| Records are stored as FHIR, so they can plug into health systems | Every write is a FHIR transaction Bundle | "This record as stored" on any record | `src/core/fhir.ts`, `src/core/store.ts` | No authentication, no consent management, no production server. The hosted demo stores records in the browser |

## What a judge should not be able to catch us on

- The demo store is **not** a FHIR server, and Settings says so in those words.
- Every lab *result* in the app is synthetic and tagged `simulated` in the FHIR resource itself.
- The demo scenario's volunteer checks are synthetic; the sites and lab health-risk scores are real OAH data.
- The video's sandbox segment is genuine footage from a live run, captioned because the server has since gone offline.
- AI assistance is disclosed in the README, and all code was written inside the hackathon period.

## Data-quality findings handed back to the project

1. 13 of 17 Ghent lab sites have `urbanPct2000m = 0` in the Resilience Map, and their farmland distances disagree with OpenStreetMap by 0.9–14.9 km. Ghent is where the baseline behaves worst.
2. The sandbox answers CORS preflights with two conflicting `Access-Control-Allow-Origin` headers, so no browser application can call it cross-origin.
3. The sandbox caches search results, so a search issued straight after a write can return the pre-write state.
4. The IG has no citizen-check model, and its indicator profile fixes `status = final`, which blocks provisional citizen data.
