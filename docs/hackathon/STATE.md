# State / Handoff

Updated: 2026-09-23 ~00:50 SGT
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

## In progress (background agents)
- FHIR specialist: owns `fhir/` and `scripts/validate.sh`. Builds our FSH IG on top of the OAH IG, plus a positive/negative test of the HL7 validator.
- Data specialist: owns `analysis/`, `data/baseline/`, `data/cities/`. Builds the OSM features, a leave-one-city-out evaluation, model-v1.json, site-features.json and the Singapore config.
- `src/app/data.ts` auto-loads their outputs via import.meta.glob. **Check the field names after they report.**

## Decisions
- Static SPA, no own backend.
  - Default store: in-browser demo store.
  - The live OAH sandbox is opt-in in Settings. **Not yet written to: the user has not explicitly OK'd writes.**
- Resilience Map data is used **only as committed snapshots** (data/oah/, attributed). Never call the live API from the product; the undocumented endpoint checks Origin.
- Map tiles: OpenStreetMap standard tiles. CARTO now needs an API key.
- A lab result settles the reports made before it (triage).
- Claude API spend: not needed (no paid AI in the product).

## Next actions
1. Integrate the agent outputs: validator run on out/bundles + out/resources; baseline + Singapore in the UI.
2. Polish: judge tour, pillar visuals, "About the model" card, README.
3. Checkpoint 2 for the user.

## Needs the user (ask at the checkpoint)
- Registered on Devpost? (Still unconfirmed; late registration is allowed.)
- OK to write labelled demo records to the public OAH sandbox?
- GitHub account/repo name for the public repo, and an OK to publish (GitHub Pages deploy).
- An OK to email the organizers (Resilience Map API permission; optional mentor).
- Day 6: 3–5 usability testers + a Singapore field check.
