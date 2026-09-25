# State / Handoff

Updated: 2026-09-25 ~21:40 SGT
Deadline: Sep 30 21:00 PDT = **Thu Oct 1 12:00 SGT**. Internal target: submit Wed Sep 30, 20:00 SGT. About **5 days left**.
Stage: **Finishing and submission (Prompt 3).** Rules re-checked on 2026-09-25 from the official Devpost rules and updates pages: unchanged. The newest organizer post concerns the Discussion board and Slack, not the requirements.

## Status: the project is submittable now

Everything the entry needs exists and is published. What is left is the user's own act of submitting, plus optional polish.

- Repository (public): https://github.com/N-H-L/streamlink-oneaquahealth
- Live demo: https://n-h-l.github.io/streamlink-oneaquahealth/
- Demo video (4:15, playable signed-out, verified via oEmbed): https://youtu.be/ij3GwQ4N66o
- Devpost entry: created (user confirmed 2026-09-23). **Not submitted.**

## Verified on the deployed build (2026-09-25)

Not on a dev server — against the GitHub Pages URL a judge will open, from a cleared browser state:
- `node scripts/e2e.mjs <live url>` — full journey, all six city tabs, 0 console errors.
- `node scripts/offline-check.mjs <live url>` — service worker takes control, board renders with the network off, a check submitted offline is kept.
- `node scripts/a11y.mjs <live url>` — 0 axe violations on all six screens.
- `TX=https://tx.fhir.org/r4 bash scripts/validate.sh` — PASS: 45 IG artefacts + 12 engine transactions + 34 stored resources, 0 errors; 5/5 negative tests rejected.
- `npm test` — 25 passing.

## Fixed this session (from a fresh skeptical review)

- The validation summary counted the 34 stored lifecycle resources as IG artefacts, so the report never showed what the README claimed. Fixed in `scripts/fhir-summary.mjs`; the run was repeated online.
- `out/` is gitignored, so the validation report and sandbox record the README linked to **were not in the repo**. Copied to `docs/evidence/` with a reproduction note. This also keeps the sandbox claim checkable now that the sandbox is offline.
- README said 20 tests; there are 25. Sandbox count corrected to 34 against `out/sandbox-demo.json`, the machine record.
- SUBMISSION.md still carried its "draft" heading and a `[SUS score]` placeholder. Finalised; there is no usability study, so it now says so.
- At most two notifications on screen at once — three could cover the panel behind them.

## Documents a judge or the user reads

| File | Purpose |
|---|---|
| `SUBMISSION.md` | The text to paste into Devpost. Final. |
| `CLAIMS.md` | Every claim → the feature that shows it → the evidence → what it does not cover. |
| `JUDGE-QA.md` | Likely questions with honest answers, including the awkward ones. |
| `OWNERSHIP.md` | For the user: the five things to know cold, the honest line on how it was built, the live demo order. |
| `EVIDENCE.md` | Dated log of every real run. Nothing goes in here that wasn't actually observed. |
| `docs/evidence/` | Committed copies of the result files. |

## Known limits, all disclosed in the product

- The OAH sandbox is offline, and independently returns two conflicting CORS headers, so no browser can reach it cross-origin. The hosted demo uses the in-browser store and Settings explains why. The video's sandbox segment is real footage from the earlier live run, captioned as such.
- The map factor is weak by design and labelled weak: within-city Spearman 0.22.
- Lab results in the app are simulated and tagged `simulated` in FHIR.
- No usability study, no field trial, no authentication, no photo storage.

## Fallback for a live demo

1. The deployed site is first choice; it works offline, so a bad network is not a blocker.
2. If it fails, play the video: https://youtu.be/ij3GwQ4N66o
3. Sandbox mode cannot be shown live — the server is down. Point at `docs/evidence/sandbox-demo.json` and the screenshot instead, and say so plainly.

## Next actions

1. **The user submits on Devpost** — paste `SUBMISSION.md`, then tick the last checklist box. Nobody else can do this.
2. Optional, if time allows: usability test with 3–5 people; the Singapore field check in `FIELD-CHECK.md`; re-record the sandbox segment live if the server returns.

## Standing decisions

- Do not email the organizers. The Resilience Map API permission question and the Ghent data-quality finding go in the submission text itself.
- Resilience Map data is used only as committed snapshots, attributed; never call their live API from the product.
- No paid services, no AI in the product.
- Nothing is submitted, published or sent without the user's explicit OK.
