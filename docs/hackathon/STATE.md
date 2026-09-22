# State / Handoff

Updated: 2026-09-23 ~02:00 SGT
Deadline: Sep 30 21:00 PDT = **Thu Oct 1 12:00 SGT**. Internal target: submit by Wed Sep 30, 20:00 SGT.
Stage: **Build (Prompt 2).** PLAN.md Rev 4 approved on 2026-09-23. Product contract: CONTRACT.md. FHIR contract: docs/SPEC-fhir.md. The user confirmed eligibility on 2026-09-23.

## Working (verified)
- Core engine in `src/core/`:
  - FHIR builders, trust rules, LocalStore/RemoteStore, per-site record, triage, lifecycle workflow.
  - `npm test`: 10/10 pass.
- App in `src/app/`:
  - board, check-in wizard (4 steps + trust review), stream record (verify → referral → simulated result → citizen message), messages, about, settings, demo scenario.
  - `npm run build` OK.
- E2E: `npm run dev`, then `node scripts/e2e.mjs`, walks the full journey in headless Edge. Passed, 0 console errors; screenshots in out/e2e/.
- Validation fixtures: `npx tsx scripts/gen-bundles.ts` → out/bundles (4) + out/resources (34).

## Done since
- FHIR IG extension (`fhir/`): 9 profiles, 2 extensions, code systems, value sets, Questionnaire, ConceptMap, 19 examples, 5 negative tests. SUSHI 0 errors.
- **HL7 validator PASS** offline and against tx.fhir.org: 0 errors on IG artefacts, on the 12 transactions the app's own code produces, and on all stored resources after a full lifecycle; 5/5 negative tests rejected. `npm run validate`; summary published to data/validation-summary.json and shown on the About screen.
- Accessibility: axe-core, 0 violations on 6 screens (`npm run a11y`).
- Offline/PWA: manifest, service worker with precache; `npm run offline` proves the built app loads and takes a check with the network off.
- Skeptical judge review done; its fixes applied: coarse GPS (~100 m) in stored records, README overclaims removed, sticky map linked to the ranked list, tour moved into the header.

## In progress
- Data specialist (background agent): owns `analysis/`, `data/baseline/`, `data/cities/`. Fetching OpenStreetMap features per city (Overpass was overloaded earlier; it now queries per layer). Outputs due: model-v1.json, site-features.json, analysis/REPORT.md, data/cities/singapore.json.
- `src/app/data.ts` auto-loads those outputs. **Check the field names against toBaseline() when they land.** Until then the app honestly shows "map context: unknown (0.5)" and the About page says the baseline is still being computed.

## Decisions
- Static SPA, no own backend.
  - Default store: in-browser demo store.
  - The live OAH sandbox is opt-in in Settings. **Not yet written to: the user has not explicitly OK'd writes.**
- Resilience Map data is used **only as committed snapshots** (data/oah/, attributed). Never call the live API from the product; the undocumented endpoint checks Origin.
- Map tiles: OpenStreetMap standard tiles. CARTO now needs an API key.
- A lab result settles the reports made before it (triage).
- Claude API spend: not needed (no paid AI in the product).

## Next actions
1. Land the baseline + Singapore config; re-run e2e and update the About model card.
2. With the user's OK: one real write to the OAH sandbox (tagged demo), then screenshot it as evidence.
3. Deploy the static build (needs the user's GitHub/host) and put the URL in the README.
4. Usability test (3–5 people) + Singapore field check.
5. Demo video script and recording; Devpost submission text.

## Needs the user (ask at the checkpoint)
- Registered on Devpost? (Still unconfirmed; late registration is allowed.)
- OK to write labelled demo records to the public OAH sandbox?
- GitHub account/repo name for the public repo, and an OK to publish (GitHub Pages deploy).
- An OK to email the organizers (Resilience Map API permission; optional mentor).
- Day 6: 3–5 usability testers + a Singapore field check.
