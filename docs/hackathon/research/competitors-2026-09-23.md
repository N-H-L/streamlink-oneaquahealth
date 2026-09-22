# Competitor re-check — 2026-09-23 SGT
Method: GitHub search "oneaquahealth" (12 repos) + README scan for FHIR, IG, sandbox, Questionnaire, ServiceRequest, wellbeing; full READMEs read for Catchment and StreamVitals.

| Repo | Track | Overlap with StreamLink |
|---|---|---|
| shi1720/catchment-oneaquahealth | 2 | **High.** Citizen evidence → explainable, human-reviewed sampling plan with budget; stale/pending evidence down-weighted; "experimental FHIR R4" export (no profile conformance); fictional UK catchment; 22 unit + 17 API tests; MIT. |
| kathir-iTech/streamvitals | 3 | **Medium.** Evidence rules from OAH factsheets; FHIR R4 Bundle with QuestionnaireResponse + Observation citing the OAH IG ("draft, not certified"); 13 FHIR schema tests; five OAH cities as reference. |
| chanderbhanu096/riparia | 3 | Medium. "Human-in-the-loop trust layer for citizen stream assessments" (README not retrievable at main). |
| dapphari007/neer | ? | Medium. Stream One Health Index, explainable scores; mentions wellbeing. |
| Cyberchopin/aquasentinel | ? | Low-Med. Observation triage, human review, mentions FHIR. |
| aliirtaza58/oneaqua-insight-hub | 2 | Low. Dashboard, indices, AI summary. |
| dominionochai/freshwater-sentinel | ? | Low. Bloom-risk analysis. |
| momo25bend/streamsentinel, khansakln297-coder/AquaSentinel-AI, evacatalina123-cyber/streamhealth-oneaquahealth, Gurleen020705/OneAquaHealth | 3/2 | Low. AI assessment / scoring / anomaly detection. |

None of the visible repos mentions HL7-validator conformance to OAH profiles, the official OAH sandbox, ServiceRequest/referral, or a longitudinal per-site record. Limitation: private repos are not visible.
