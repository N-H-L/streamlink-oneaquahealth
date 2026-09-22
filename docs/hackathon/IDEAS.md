# Idea Shortlist — checkpoint 1 (2026-09-22)

Evidence: BRIEF.md, research/oah-ecosystem.md, research/precedents.md.
Build window left: ~8.5 days, to Thu Oct 1 12:00 SGT. Internal target: submission complete Wed Sep 30 evening SGT.

## Key facts that drove the shortlist
- All 7 tracks compete for one overall ranking. The track choice only affects fit, not which prize pool we enter.
- Rubric: Impact 30 / Innovation 20 / Technical 20 / UX 15 / Feasibility and integration 15.
- The panel is weighted toward standards people. Gora Datta (HL7) led Session 1, Session 4 was a FHIR sandbox session, and the sponsors include EFMI and ISO. The consortium ecologist (Feio) and EU partners are also judges.
- Verified live: the official OAH FHIR sandbox `https://sandbox.hl7europe.eu/oneaquahealth/fhir` (HAPI 8.2, R4, open writes, 390 Obs / 22 Loc / 27 Group / 18 Library).
- The official IG (github hl7-eu/oah) compiles locally with SUSHI: 0 errors, 7 profiles, 475 instances.
- Verified gap: the IG has **no model for the Citizen Science App questionnaire**.
- The visible competitor repos cluster on Track 2 dashboards and Track 3 AI assessment (about 10 repos). Some teams already write "experimental FHIR" or post ad-hoc resources to the sandbox. Conformance to the IG, with proof, is the differentiator, not "uses FHIR".
- Organizer guidance: build on the existing OAH tools; scale beyond Europe; support expert judgement, don't replace it; the demo video is mandatory.

## Gates (pass/fail)
All four ideas pass these gates. Each can be built new during the build window, has a public repo, needs no private data, and needs no hardware. Idea C needs organizer OK for the undocumented Resilience Map API; without it, C falls back to public CSV export only.

## A. StreamLink — citizen stream checks → official One Health data (Track 7) ★ recommended
- **One line:** A volunteer's stream check becomes validated, standards-compliant health-ready data in the official OAH FHIR server, shown next to the health risk measured for that same place.
- **User / pain / workaround:**
  - OAH researchers and city environment/health officers can't combine citizen observations with lab and health-cohort data. Citizen data sits in an app-specific format, there is no IG model for it, and nobody can see how far to trust it.
  - Workaround today: CSV exports and spreadsheet merging, and experts re-check everything.
- **Workflow:** mobile stream check (the same fields as the OAH app) → FHIR QuestionnaireResponse → extraction into IG-conformant Observations (IndicatorsOah, WithCompOah riparian cover), LocationOah, and Provenance with data-quality flags → validation against the IG → transaction posted to the OAH sandbox → "One Health site card" that joins the citizen observation with sandbox health data, Resilience Map health-risk scores and recent rain.
- **Track fit:** Track 7 names "FHIR models … integration frameworks". It also directly serves the tagline "from streams to systems".
- **Demo moment:** a phone submission appears in the *official* OAH FHIR server within seconds, and the validator reports "0 errors". The site card then shows "foam + drain pipe reported by a citizen; lab fecal risk at this site 0.73 → suggested priority sampling".
- **Nontrivial and useful:**
  - An IG extension written in FSH: a Questionnaire, answer ValueSets, a ConceptMap to OAH indicator codes, and a citizen-observation profile with a data-quality extension.
  - Transaction bundles, Provenance, and rule-based consistency checks.
  - Proof: SUSHI 0 errors, HL7 validator 0 errors on N generated resources, automated tests, and a round-trip read-back from the sandbox.
- **Sponsor/organizer tech:** the OAH IG, the OAH sandbox, Citizen Science App fields, and Resilience Map data. All used materially.
- **Alternatives:**
  - The OAH app itself has no known FHIR output.
  - Catchment (competitor) produces "experimental FHIR".
  - Unknown teams post ad-hoc resources to the sandbox.
  - Our difference: we fill the verified IG gap, conform to the official profiles, and show validator evidence and provenance. The result is designed as a proposed contribution back to the IG.
- **MVP:** the full app field set (~20 questions), extraction for about 8 indicators, sandbox posting, a site card for the 5 pilot cities, and a validator report.
- **Stretch:** the "Second Look" AI photo check (Idea B) as a module, and multilingual labels (PT/IT/FR/NL/NO).
- **Effort:** 5–6 focused days with Claude doing most of the coding.
- **Access:** none needed; the sandbox is open.
- **Largest risk:** judges read it as plumbing and it scores low on impact and UX. Mitigation: open the demo on the citizen and the researcher decision, and keep the FHIR proof brief and visual.
- **Fallback:** if the sandbox goes down, run a local HAPI server or file-based bundles and use a recorded demo.
- **Success signal:** 100% of app fields mapped; X resources with 0 validation errors; submit-to-readback time in seconds; tests passing.

## B. Second Look — AI checks photos against answers, human decides (Track 3)
- **One line:** After a citizen submits, AI compares their photos with their answers, points out likely mismatches with an explanation, and lets the citizen confirm or fix them. Experts get a review queue ranked by risk.
- **Pain:** inconsistent volunteer data (the problem named in Track 3).
- **Workflow:** answers + photos → vision model per-field check → explained flags → citizen accept/override → confidence score + reviewer queue.
- **Demo moment:** the citizen answered "water clear", the photo shows foam, and the app asks "Did you mean foam? Here's why."
- **Nontrivial:** a structured vision prompt with a schema, calibration against a labelled set, and human-in-the-loop logging.
- **Proof:** an agreement rate on about 40 CC-licensed stream photos that we label ourselves.
- **Alternatives:** miniSASS ML (organism ID only); competitors streamvitals, streamsentinel and aquasentinel; a prior OAH student project on AI photo classification. The space is **crowded**.
- **Access/cost:** a Claude API key (billed separately from Max, likely a few US dollars).
- **Risk:** vision is unreliable on turbidity and colour from phone photos.
- **Effort:** 4–5 days.

## C. After the Rain — storm-triggered stream health advisories (Track 6)
- **One line:** Uses rain and river-flow forecasts plus each site's measured fecal/pathogen risk to warn when stream contact is riskier. It also asks volunteers for "post-storm checks".
- **Data:** Open-Meteo forecasts and flood API (free) plus Resilience Map health-risk scores for 106 sites (undocumented API; needs organizer OK or CSV).
- **Demo moment:** a forecast storm turns Coimbra sites amber and volunteers get a mission.
- **Risk:** there is no ground truth to validate a prediction, and the ecologist judges may distrust invented thresholds. It has to be honestly framed as a rule-based advisory.
- **Effort:** 4–5 days.

## D. Stream Missions — data-gap-driven challenges (Track 5)
- **One line:** Gamified missions that send volunteers to sites that haven't been checked recently, with city leaderboards and a "your data was used" feedback loop.
- **Pros:** strongest UX, least crowded track.
- **Cons:** lowest technical depth; the gamification is similar to CrowdWater/SPOTTERON; weaker with a standards-heavy panel.
- **Effort:** 4 days (the safest option).

## Planning heuristic (NOT official scoring; relative, coarse)
| | Impact 30 | Innov 20 | Tech 20 | UX 15 | Feas/Integr 15 | Exec risk | Crowding |
|---|---|---|---|---|---|---|---|
| A StreamLink | High | High | High | Med→High if UI polished | **Very high** (built on IG + sandbox + app) | Low-Med | Low |
| B Second Look | High | Med | Med-High | High | Med | Med (model accuracy) | **High** |
| C After the Rain | High | Med-High | Med | Med | Med (API permission) | Med | Low-Med |
| D Missions | Med | Med | Low-Med | **High** | Med | Low | Low |

## Challenge of the top two
**A — case against**
- Judges might pass: "infrastructure, not impact"; the ecologists may not value FHIR.
- Competitors: at least one team exports FHIR and someone is already posting to the sandbox.
- Assumption most likely to fail: that the IG profiles can represent citizen observations cleanly without a custom extension. If they can't, we author an extension, which is also a contribution.
- Cheapest disproof test: done in part. The IG compiles (0 errors). HL7 validator run pending (see STATE.md).
- Revision: keep A, but make the citizen-facing form and the site card first-class so UX and Impact don't lag.

**B — case against**
- Crowded track, and an earlier OAH student project did AI photo classification.
- Judges have heard "AI checks the data" several times.
- The assumption most likely to fail is vision accuracy on water appearance.
- Cheapest test: 20 labelled photos, one prompt, measure agreement (about 1 hour, a few cents of API).
- Revision: B is weaker standalone. It works best as a stretch module inside A, where its flags feed the Provenance/data-quality fields.

## Round 2 — Tuning Idea A against the rubric (2026-09-22, user asked for variants)
Where the original A is weak: Impact (the benefit is indirect) and UX (it can look like plumbing). Its strengths are Technical and Feasibility.

Candidate add-ons, each mapped to the rubric line it moves:
| # | Add-on | Main criterion | Cost | Note |
|---|---|---|---|---|
| 1 | Close the loop: a city "act here" priority list, plus "your report led to…" feedback for citizens | Impact | 1d | Rewarded by precedents such as Mind the Gap. |
| 2 | Wellbeing as health data: the app's Joy/Serenity/Anger/Fear sliders mapped to FHIR Observations (perceived wellbeing, survey category) → the stream's link to human mental health | Impact + Innovation | 0.5d | Framed as self-reported, not clinical. No competitor seen doing it. |
| 3 | One Health site passport: ecosystem (habitat, riparian) + animal (GBIF species, vector-relevant habitat) + human (health risk, wellbeing, cohorts) on one card | Impact + UX | 1d | Makes all three One Health pillars visible. |
| 4 | Explainable trust score: rule-based consistency checks (contradictions, GPS distance to site, photo presence) → FHIR Provenance and a quality extension; the citizen can fix flags | Tech + Track 3 flavour | 0.5–1d | No AI cost. |
| 5 | MCP server over the OAH FHIR API: any AI assistant can answer researcher questions using standard queries that are shown to the user | Innovation + Tech (Track 7 lists "AI agents") | 1–1.5d | Demo via the user's Claude app/Code; no API spend. |
| 6 | Field-ready UX: mobile PWA, offline queue, pictograms, plain terms, 5 pilot languages, WCAG checks | UX | 1d | Evidence: Lighthouse accessibility score. |
| 7 | "New city in one file": onboard a non-EU city live (e.g. Singapore) with config + Location resources | Scale | 0.5d | Answers the organizer quote "scale across the globe". |
| 8 | IG contribution pack (FSH, examples, validator report, PR-ready) + privacy (pseudonymised contributors, GDPR note) | Feasibility | 0.5d | Built for adoption by the owners. |
Cut candidates if time runs short: 5, then the 5-language part of 6, then 7.
