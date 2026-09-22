# Project: OneAquaHealth IEEE Global Hackathon 2026 entry (solo)

## Hackathon workflow
- Durable record lives in `docs/hackathon/`:
  - BRIEF.md: rules and sources
  - IDEAS.md: shortlist
  - PLAN.md: approved direction
  - STATE.md: progress and next action (read this first)
  - EVIDENCE.md: only real test results
  - research/: background research
- Deadline: Sep 30 2026 21:00 PDT = Thu Oct 1 12:00 SGT. The user is in Singapore.
- Rules:
  - All code must be written during the hackathon period (from Sep 14 2026).
  - Public repo with docs.
  - Demo video of 3–5 minutes.
- Don't spend money, publish, email organizers, write to shared servers, or submit without the user's explicit OK.
- Keep secrets in a gitignored `.env`, never in chat or commits.
- Update STATE.md at each checkpoint and before any interruption.

## Verification commands
- Compile the official IG: `npx fsh-sushi@3 <path-to-hl7-eu/oah>`
- OAH sandbox: `curl https://sandbox.hl7europe.eu/oneaquahealth/fhir/metadata`
- (Build and test commands will be added once the stack is chosen.)
