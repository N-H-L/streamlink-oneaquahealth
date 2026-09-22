# Devpost submission text (draft — fill the bracketed items before submitting)

**Track alignment (required field):** Track 7 — Digital Health Standards. StreamLink models OneAquaHealth citizen stream checks in HL7 FHIR, conforming to the project's own Implementation Guide, and uses standard FHIR workflow resources (ServiceRequest → result → Communication) to turn those reports into a lab visit and back into feedback for the volunteer. It also serves Track 1 (a 3-minute picture-based check), Track 2 (the city board) and Track 3 (explainable, human-in-the-loop trust checks), but it is submitted under Track 7.

## Elevator pitch (one line)
A shared One Health record for every urban stream: maps say where to look first, volunteers report what maps and rare lab visits miss, and the lab confirms — all in OneAquaHealth's own FHIR standard.

## The problem
The OneAquaHealth Resilience Map holds one lab health-risk campaign for each of its 96 monitored streams in Coimbra, Ghent, Toulouse, Benevento and Oslo. 95 of those campaigns are from 2023. Lab work is expensive and rare, so the health picture of a city's streams is years old, while the things that actually harm health — a sewage misconnection, a discharging pipe, a spill — happen between campaigns. Volunteers are there in between, but their reports sit in a separate app: no health or environmental system can read them, nobody knows how far to trust them, and nothing follows from them.

## What StreamLink does
Every stream gets a living record that citizens, experts, the city and the lab share.
1. **Check-in.** A volunteer answers the OneAquaHealth citizen app's own questions as pictures, in about three minutes, offline if needed. Stored as FHIR with status *preliminary*.
2. **Trust.** Plain-language consistency checks ("you rated it good but reported sewage"). The volunteer fixes or confirms; the score and every flag are stored in a FHIR Provenance resource.
3. **Verification.** An expert confirms. The observations become *final* and then also conform to OneAquaHealth's official indicator profile — so unverified crowd data can never masquerade as project data.
4. **Referral.** The city sees which streams need a lab visit, ranked by fresh reports × trust, last lab result, map context and data age, with every factor visible and adjustable. Accepting creates a FHIR ServiceRequest carrying its reasons.
5. **Result and feedback.** The lab result closes the request and settles the reports that triggered it; the volunteer gets a message saying their report led to a lab visit.
6. **Anywhere.** A new city is a config file; map features come from OpenStreetMap, so cities with no lab data still get a starting prior. Singapore ships as an example: 10 real streams and canals, marked as having no lab data and as out of distribution for the model.

## Why it matters for One Health
The record carries all three pillars for each stream and shows how old each one is: the stream and its banks; animals and disease vectors (standing water is where the Diptera OneAquaHealth tracks breed); and people — the lab's pathogen, fecal and antibiotic-resistance risk, plus how the place makes visitors feel, recorded as self-reported wellbeing. That last one is the link the project keeps making between urban streams and human wellbeing, and it is data nobody else is collecting.

## Technical
- **Standards.** A proposed extension to the OneAquaHealth IG (`fhir/`): Questionnaire, 9 profiles, 2 extensions, code systems, value sets, a ConceptMap onto OAH indicator codes, 19 examples and 5 negative tests. The OAH indicator profile fixes `status = final`, which is exactly why citizen data needs the preliminary→verified promotion we added.
- **Proof.** The official HL7 validator runs in the build against the OAH IG plus ours: **0 errors** on the IG artefacts, on the 12 transactions the app's own code produces, and on every resource stored after a full lifecycle; 5/5 deliberately broken records are rejected. Verified offline and against tx.fhir.org.
- **Architecture.** A static web app with no back end of ours: the FHIR server *is* the database. We ran the complete lifecycle on the **official OneAquaHealth sandbox** — 28 records, all tagged `demo`, written and read back — so a city could point it at their own server. Operating cost is effectively zero.
- **Evidence.** 25 tests including the whole lifecycle and both stores; an automated browser walkthrough; axe accessibility audit with 0 violations on six screens; an offline test that loads the installed app and takes a check with the network off. [SUS score]
- **Calibration, with its limits measured.** We rebuilt OneAquaHealth's map context from OpenStreetMap so it works in any city, and tested it against their lab data with a pre-specified design, leaving one city out at a time. One signal survived: within a city, streams closer to a wastewater plant do rank higher for lab-measured risk (Spearman 0.22, permutation p = 0.03). Comparing cities is not supported, and the three-feature model we started with did worse than chance on a held-out city, so we did not ship it. The score says where to look first; citizens and the lab do the rest. We also found a data-quality problem worth reporting back: 13 of 17 Ghent lab sites have `urbanPct2000m = 0` in the Resilience Map.

## Honest limits
- Volunteer checks are **not** a substitute for lab work: they are event reports that trigger one.
- Lab *results* in the demo are simulated and tagged `simulated` in FHIR; the demo scenario's volunteer checks are synthetic.
- No biological indicator (macroinvertebrates, diatoms), because the OneAquaHealth citizen form has none.
- We do not claim the trust rules or the baseline predict contamination beyond the evaluation shown.

## What we found that may help the project
1. **Resilience Map data:** 13 of 17 Ghent lab sites have `urbanPct2000m = 0`, and their farmland distances disagree with OpenStreetMap by kilometres. Ghent is also the city where our map baseline behaves worst, which is consistent with the data rather than the method.
2. **FHIR sandbox CORS:** preflight responses carry two conflicting `Access-Control-Allow-Origin` headers, so browser-based entries cannot use the sandbox at all from another origin. Server-side clients are unaffected.
3. **FHIR sandbox search caching:** a search issued immediately after a write can return the pre-write result; `Cache-Control: no-cache` avoids it.
4. **A gap in the IG:** there is no model for citizen checks, and `observation-indicators-oah` fixes `status = final`, so citizen data cannot conform until an expert verifies it. Our proposed extension in `fhir/` handles exactly that, and is offered back to the project.

## Links
- Repository: [URL]
- Live demo: [URL]
- Demo video (3–5 min): [URL]
- Validation report: `out/validation/summary.md` in the repo, reproduce with `npm run validate`

## Built with
TypeScript, React, Vite, Leaflet/OpenStreetMap, HL7 FHIR R4, FSH/SUSHI, the official HL7 validator, Python (analysis), Playwright + axe-core (testing). Built with AI assistance (Claude Code) during the hackathon period.

## Submission checklist
- [ ] Track alignment stated
- [ ] Description covers problem, solution, users, impact
- [ ] Demo video 3–5 min, link works when signed out
- [ ] Public repository with README and licence
- [ ] Working prototype link
- [ ] Submitted before **Sep 30, 21:00 PDT = Oct 1, 12:00 SGT** (target: Sep 30, 20:00 SGT)
