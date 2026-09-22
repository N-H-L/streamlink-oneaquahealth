# State / Handoff

Updated: 2026-09-22 ~22:45 SGT
Deadline: Sep 30 21:00 PDT = **Thu Oct 1 12:00 SGT**. Internal target: submit by Wed Sep 30 evening SGT.
Stage: **PLAN rev 4 (One Health record lifecycle, evidence-calibrated) written; user confirmed eligible 2026-09-23. Waiting for user OK, then Day 1.**

## Done
- Event brief: BRIEF.md.
- Research: research/oah-ecosystem.md, research/precedents.md.
- Shortlist: IDEAS.md (A StreamLink recommended; B Second Look, C After the Rain, D Stream Missions).
- Feasibility checks: EVIDENCE.md.
- `git init` in the project root (no commits yet).

## Pending / blockers
- User answers needed:
  - (resolved 2026-09-23: user confirms eligibility)
  - Whether they're registered on Devpost.
  - Whether we may write test data to the public OAH sandbox.
  - Whether they'll allow a small Claude API spend (only for Idea B or the stretch).
- HL7 validator test. The portable JRE download was running in the background into the scratchpad. The scratchpad is session-specific; if it's lost, re-download the Temurin 21 JRE zip plus validator_cli.jar into a `tools/` folder that is gitignored.
- ENORA/Resilience Map API: ask organizers before using it (oneaquahealth@ieee.org). Needs user authorization before any email is sent.

## Next action
Day 1 of PLAN.md: scaffold the repo (fhir/ app/ server/ scripts/), write the FSH Questionnaire and profiles, get SUSHI plus the validator green. The validator jar is downloading to the scratchpad; move it to the gitignored tools/.
