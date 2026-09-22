# PLAN — StreamLink (revision 4, 2026-09-23 SGT) — "A shared One Health record for every urban stream"

Status: Rev 4 awaiting user OK. The user confirmed eligibility on 2026-09-23. Rev 3 and earlier are kept below for history; Rev 4 wins on any conflict.

## Rev 4 core idea
Each stream gets a living One Health record on the official OAH FHIR server. **Maps provide its history, citizens report what maps and rare lab visits miss, and the lab confirms.** Every feature is one step of that record's lifecycle.

Evidence behind it (EVIDENCE.md, 2026-09-23):
- Each of the 96 OAH sites had one lab campaign, 95 of them in 2023.
- In OAH's own data, lab risk tracks map context (distance to sewage plants and farmland, urban intensity; rho ≈ 0.3).
- Lab risk does **not** track what citizens see at the bank (|rho| ≤ 0.12).
- So citizens are positioned as **event reporters** (discharge, foam, colour, construction), not as lab substitutes.

## Record lifecycle = the whole product
| Step | What happens | FHIR | Weakness it fixes |
|---|---|---|---|
| 0 History | Baseline context risk from map features, with rules calibrated on OAH's 96-site lab data. Computed anywhere from OpenStreetMap (wastewater plants, farmland, built-up area). | Observation (context indicators) + Library citing the evidence | Arbitrary weights (vs Catchment's "unvalidated"); global scale |
| 1 Check-in | 3-min pictogram check (the OAH app's fields), focused on events maps can't see; wellbeing sliders; offline | QuestionnaireResponse → Observations `preliminary` | Validity: citizens aren't asked to predict lab results |
| 2 Verification | Citizen fixes flagged contradictions; an expert confirms → `final`; Provenance | Observation.status, Provenance | Trust (overlap with Riparia, done natively in the standard) |
| 3 Chart | Timeline + 3 pillars (environment / animals / people) + freshness per pillar | read-only views over the record | "Plumbing" risk: the record is visible and understandable |
| 4 Referral | Ranked "needs a lab visit" list = baseline × fresh event signals × data age; every weight shows its evidence; experts can adjust | ServiceRequest | Overlap with Catchment: evidence-based + standard referral |
| 5 Result | The lab result closes the referral (demo result labelled simulated); citizen told "your report led to a lab visit" | Observation.basedOn → ServiceRequest | Closes the loop (Impact) |
| 5b Care plan (stretch) | If confirmed, suggest rehabilitation measures from the OAH Catalogue of Measures / DSS | CarePlan | Protection, not only monitoring; OAH DSS integration |
| 6 Anywhere | Singapore: auto-baseline from OSM + the user's real field check through steps 1–5 | same | Scale 15% |

## Cross-cutting fixes (not separate features)
- **Reliability:** the record runs on any FHIR R4 server, tested on the official OAH sandbox and a local mirror seeded with a snapshot. The demo can't break if the shared server does. Resilience Map data is cached as a snapshot, and we ask organizers before using the live feed.
- **Proof for standards judges:** SUSHI 0 errors; HL7 validator 0 errors against OAH profiles; round-trip tests on both servers.
- **Proof for ecologists:** the analysis notebook (reproducible script, limits stated) cites the OAH factsheets (Feio et al., Zenodo) for indicator meanings. Ecological terms come first in the UI; the "record" framing stays light.
- **UX proof:** a System Usability Scale (SUS) test with 3–5 people, a Lighthouse accessibility score, and a "judge tour": a guided 2-minute walkthrough on the live demo with no sign-up.
- **Adoption:** the engine ships as a reusable library the OAH app could call, plus the IG-extension FSH. README sections follow the 5 criteria.

## Cut / stretch
- Cut: MCP assistant, GBIF species list, 5 languages.
- Stretch (only if Day 5 exit check passes): 5b care plan, Portuguese labels.

## Milestones (SGT)
| Day | Date | Deliverable | Exit check |
|---|---|---|---|
| 1 | Wed Sep 23 | Scaffold; FSH (Questionnaire, ValueSets, profiles, ServiceRequest usage); analysis script in repo | SUSHI 0 errors; validator runs |
| 2 | Thu Sep 24 | Engine: extraction, trust, bundle, referral; sandbox + local mirror; tests | Validator 0 errors; round-trip on both servers |
| 3 | Fri Sep 25 | Check-in screen (offline, pictograms, wellbeing) + baseline model; video script v1 | Phone-size end-to-end submission |
| 4 | Sat Sep 26 | Chart + referral list + result/feedback loop | 5 pilot cities with real data |
| 5 | Sun Sep 27 | Singapore OSM baseline, judge tour, a11y, polish. **Scope freeze** | Lighthouse recorded; Singapore works |
| 6 | Mon Sep 28 | SUS test + Singapore field check + fixes; deploy if authorized; stretch if ahead | Numbers in EVIDENCE.md |
| 7 | Tue Sep 29 | README, diagram, video | 3–5 min video |
| 8 | Wed Sep 30 | Devpost text, final verification, **submit 20:00 SGT** | Submitted |

## Video spine (one story)
1. "The lab last visited these 96 streams in 2023."
2. "Maps tell us which streams are at risk; we checked this against OAH's own lab data."
3. A citizen reports a sewage discharge the map can't see.
4. The record flags it, an expert confirms, a lab referral is created, the result comes back, and the citizen is told.
5. It is all official, validated FHIR on OAH's server.
6. The same flow in Singapore.

---
# PLAN — StreamLink (revision 3, 2026-09-23 SGT) — "A shared health record for every urban stream"

History:
- Rev 1 (approved 2026-09-22): 9 modules.
- Rev 2: consolidated to 3 screens.
- **Rev 3: one unifying concept after a competitor re-check.** Awaiting user OK.

## Why Rev 3 (competitor re-check, 2026-09-23; see research/competitors-2026-09-23.md)
- Catchment (Track 2) already does citizen evidence → explainable, human-reviewed "where to sample next" with trust/staleness weighting, 39 tests and a polished UI. That is Rev 2's City Board and trust score.
- Riparia (Track 3) is a "human-in-the-loop trust layer for citizen stream assessments".
- StreamVitals (Track 3) exports a FHIR R4 Bundle with QuestionnaireResponse + Observation that cites the OAH IG ("draft, not certified"; schema tests only).
- Neer: a "Stream One Health Index".
- **Correction:** the Rev 2 claim "first model of citizen checks in FHIR" is **not safe**. The safe claim is narrower (below).
- Visible repos: none validates against the OAH IG profiles with the HL7 validator, none writes to the official OAH sandbox, none has a referral (ServiceRequest) workflow or a longitudinal per-site record, and none records wellbeing as a health Observation. Only ~12 repos are visible; many teams are private, so this is not proof of uniqueness.

## The one concept
Treat each urban stream the way digital health treats a person: a **shared, longitudinal health record** on the official OAH FHIR server, which citizens, labs, health teams and the city all write to and read from. This is the One Digital Health idea applied literally, in the standards language this panel uses.
Every feature is one step of the same record lifecycle:
1. **Check-in (citizen):** the OAH app's fields as a 3-minute, offline, pictogram check → Observations with status `preliminary`.
2. **Verification:** trust flags the citizen can fix; an expert review promotes the record to `final`. Provenance records who/what/how. Trust uses FHIR's native status, not a separate feature.
3. **Chart:** a per-stream timeline of citizen check-ins, lab results and health context. The three One Health pillars: environment (habitat/pollution signs), animals (vector-breeding habitat), people (lab pathogen/fecal risk, perceived wellbeing). Each pillar shows its **freshness** ("lab picture 812 days old · citizen picture 2 days old").
4. **Triage → referral:** sites needing a lab visit are ranked with reasons and expert-adjustable weights. Accepting one creates a FHIR **ServiceRequest** ("lab sampling referral") on the official server.
5. **Result closes the loop:** a lab result references the referral (demo result clearly labelled simulated). The record updates, and the citizen sees "your check led to a lab visit".
6. **Open a record anywhere:** Singapore is onboarded with one config file, and the user's real field check flows through the same lifecycle.

## Safe innovation claims (precise wording)
- "Citizen checks written as records that **validate against the official OAH IG profiles** (HL7 validator, 0 errors), plus a proposed IG extension (Questionnaire, ValueSets, ConceptMap, citizen profile)."
- "A clinical-style referral workflow (ServiceRequest → result) for streams, on the official OAH FHIR server."
- "Perceived wellbeing at the stream recorded as a health Observation (self-reported, not clinical)."
- "Per-pillar data freshness that exposes the gap between rare lab campaigns and frequent citizen checks."
Never claim "first" without the qualifier "among tools we found".

## How a win is actually decided (evidence + inference)
- CONFIRMED (rules): 5 criteria scored 1–10 each, weighted Impact 30 / Innovation 20 / Technical 20 / UX 15 / Feasibility 15. Ties are broken by impact and innovation.
- CONFIRMED (updates): judges want the problem clear, the OAH alignment explicit, a working build, and "clear submission documentation".
- INFERENCE:
  - With 976 registrants and 10 judges, each judge probably scores many entries, mostly from the **3–5 min video and the Devpost text**, and few will run the app.
  - So the score depends on what a judge understands in about 5 minutes, not on how many features exist.
  - Tie-breaks and the heaviest weights both favour impact.

## Weakness review of Rev 1
| Weakness | Root cause | Fix |
|---|---|---|
| "Plumbing" (Impact 30%) | The product was defined by its technology (FHIR), not by an outcome | Reframe around one outcome. FHIR becomes the proof, not the pitch. |
| Too many separate features (9 modules) | Features each served a different criterion and a different user | Consolidate into 3 screens on one storyline and cut off-story items (see below) |
| Impact claims untestable | No real-world outcome can be shown in 8 days | Use a real, verified gap in OAH's own data, plus real field use (see Evidence) |
| Innovation could look incremental | "Uses FHIR" is not new; one competitor already emits FHIR | Pitch 3 concrete firsts that we can verify |
| UX judged only on video | Judges don't run the app | Short usability test with numbers + accessibility score + clean screens |
| Solo, 8 days | Breadth × polish × video | Scope freeze on Day 5; start the video script on Day 3; demo-driven build |

## The verified hook (EVIDENCE.md, 2026-09-23)
The Resilience Map health-risk data has **exactly one lab sample per site for all 96 sites**. 95 of them are from 2023 and the latest is Aug 2024. Lab campaigns are rare and expensive, so the health picture of these streams is years old.
**Outcome pitch:** "StreamLink keeps each stream's One Health picture current between lab campaigns. Citizens check in weekly, and the city sees where to send the next lab visit and why."

## (Rev 2 detail below is superseded where it conflicts with Rev 3)

## Product = one story, three screens, one engine
1. **Check** (citizen, 3 min):
   - The OAH app's own fields, as pictograms in plain words.
   - Works offline.
   - The trust check flags contradictions for the citizen to fix.
   - EN + PT (Coimbra, the coordinator's city); other languages are config only.
2. **Site Passport** (everyone). One card with the three One Health pillars, all derived from the check + OAH data:
   - Environment: habitat, riparian, pollution signs.
   - Animals: vector-habitat signal (stagnant/low flow, per the DipteraCAST link).
   - People: lab risk and "last lab test N days ago", plus perceived wellbeing.
   - A "view as standard data" toggle shows the conformant FHIR records. This is the 20-second moment for the standards judges.
3. **City Board** ("send the lab here next"):
   - Sites ranked by citizen flags × last lab risk × data age × trust.
   - Each rank shows its reasons.
   - **Experts can adjust the weights.** This supports expert judgement instead of replacing it, as the organizers asked.
   - The citizen gets "your check moved this site up".
- **Engine** (invisible, proven):
  - FSH extension of `hl7.eu.fhir.oah`: Questionnaire, ValueSets, ConceptMap, CitizenStreamObservation, a wellbeing Observation, and Provenance with trust.
  - Transaction bundle → OAH sandbox → read-back.
  - SUSHI + HL7 validator green.
- **Scale:** a new city in one config file. The user does a real check at a Singapore stream or canal, and it flows through the same pipeline.

### Cut / demoted (and why)
- **AI assistant (MCP):** cut. It's a separate audience and a separate demo segment with no link to the outcome. Revisit only if everything else is done by Sep 28 12:00.
- **5 languages → 2:** the video can't show five, and the translation framework already proves scale.
- **GBIF species list:** cut. It's weakly meaningful per site; the animal pillar now comes from vector habitat.
- **Standalone "adoption pack":** folded into README and docs (required anyway).

## Innovation claims we can defend (each checked before claiming)
1. The first model of OAH citizen stream checks in the OAH FHIR IG. Verified: the IG has none today.
2. Self-reported stream wellbeing recorded as health data, linking stream condition to mental wellbeing. No competitor seen doing this; worded as "perceived wellbeing", not clinical.
3. Trust-aware, expert-tunable lab-visit prioritisation that closes the loop back to the citizen.

## Evidence to produce (Evidence → criterion)
- Staleness stat from OAH's own data → Impact.
- Validator 0 errors on N resources; test counts; sandbox round-trip time → Technical.
- 100% of OAH app fields mapped → Feasibility and integration.
- **Usability test with 3–5 people** (time to complete, errors, a simple ease rating) → UX. The user recruits friends; I prepare the script.
- Lighthouse accessibility score → UX.
- **Real field check in Singapore** (photos from the user) → Impact, Scale, authenticity.
- Optional: mentor feedback via oneaquahealth@ieee.org (user must approve the email) → Feasibility.

## Milestones (SGT)
| Day | Date | Deliverable | Exit check |
|---|---|---|---|
| 1 | Wed Sep 23 | Scaffold; FSH Questionnaire, ValueSets, profiles | SUSHI 0 errors; validator runs |
| 2 | Thu Sep 24 | Engine: bundle + trust rules + sandbox round-trip + tests | Validator 0 errors; tests green |
| 3 | Fri Sep 25 | Check screen (offline, pictograms, EN/PT); **video script v1** | Phone-size end-to-end submission |
| 4 | Sat Sep 26 | Passport + City Board + feedback loop | 5 pilot cities with real data |
| 5 | Sun Sep 27 | Singapore config, a11y pass, polish. **Scope freeze** | Lighthouse score recorded |
| 6 | Mon Sep 28 | Usability test + Singapore field check + fixes; deploy if authorized | Numbers in EVIDENCE.md |
| 7 | Tue Sep 29 | README, diagram, video recording | 3–5 min video done |
| 8 | Wed Sep 30 | Devpost text (headings = criteria), final verification, **submit 20:00 SGT** | Submission confirmed |

## Video (3–5 min), one storyline
1. **Hook (0:00–0:30):** "The lab last tested these 96 streams in 2023."
2. **Citizen check (0:30–1:30):** includes a trust flag fixed.
3. **Passport (1:30–2:30):** the three pillars, then the toggle to standard data with validator 0 errors.
4. **City Board (2:30–3:30):** re-weighting by an expert, and "your check moved this up".
5. **Scale + close (3:30–4:30):** the Singapore field check through the same pipeline; evidence numbers.

## Needs the user
- Confirm student + age 21+, and Devpost registration.
- OK to write labelled demo data to the OAH sandbox.
- OK to draft an organizer email (Resilience Map API permission + optional mentor feedback).
- Day 6: 3–5 testers + one real Singapore stream visit with photos.
- GitHub account (public repo on OK); optional free deploy account.
- Video narration; press submit.
