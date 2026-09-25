# Ownership briefing

For you, not for the judges. It exists so that if anyone asks how this was built, or asks you to explain a part of it on the spot, you can answer without guessing.

## What to say about how it was built

The true version, and the one to use: **built solo, with AI assistance (Claude Code), disclosed in the README, all of it written inside the hackathon period.** Don't dress that up and don't apologise for it. Hackathon rules ask that the work be original and made during the window, and it is; they don't ask that you typed every character.

What you should not do is claim parts you didn't write by hand. If a judge asks a pointed question about who wrote what, say what's true and move straight to the system itself — the decisions, the trade-offs, the things that were rejected. That is what you can actually defend, and it is the more interesting answer.

The strongest thing you own is the **judgement calls**, and they are real:
- Shipping a map signal that scores 0.22 instead of the one that looked like 0.72 but was an evaluation artefact.
- Refusing to fake the sandbox segment of the video when the server went down mid-production, and captioning the real earlier footage instead.
- Deciding that citizen data must not be able to conform to the official profile until a human verifies it.
- Keeping AI out of the trust rules so a coordinator can argue with them.

## The five things to know cold

If you understand these five, you can hold any conversation about this project.

**1. The problem, in one sentence with a number.**
Each of the 96 OneAquaHealth lab sites has exactly one lab health-risk campaign on record, and 95 of them are from 2023. Lab campaigns are expensive, so the health picture of these streams is years old, while the things that actually hurt people — a sewage misconnection, a discharging pipe, a spill — happen in between.

**2. Why the `preliminary` / `final` thing matters.**
The OneAquaHealth Implementation Guide has a profile for indicator observations, and it *fixes* `status = final`. "Fixes" means the standard requires that exact value — you cannot write a conformant observation at any other status. So a citizen's unverified report cannot be expressed in the project's own standard at all. We wrote a citizen-check profile that lives at `preliminary`, and made expert verification the step that promotes the observation to `final` and adds the official profile alongside ours. The consequence is the sentence worth remembering: **unverified crowd data can never masquerade as project data.**

**3. What the map score is and isn't.**
It is one feature: how close a stream is to a wastewater treatment plant, expressed as a percentile *within its own city*. It came out of a leave-one-city-out evaluation over 96 sites in 5 cities, and within a city it correlates with lab-measured risk at Spearman 0.22 (permutation p = 0.025). It orders streams inside one city. It cannot compare cities, and it is not a risk level or a measurement. The richer three-feature model was dropped because on a held-out city it scored worse than chance.

**4. What the four ranking factors are.**
New reports since the last lab visit (decayed by age, scaled by trust, unverified ones counted at 70%); the last lab result; the map context above; and how old the lab data is. It is a weighted mean, the weights are visible and adjustable on screen, and each ranking comes with a sentence saying why. Only the map factor is fitted to data.

**5. What's real and what's simulated.**
Real: the site list and lab health-risk scores from the OneAquaHealth Resilience Map, the map features from OpenStreetMap, the FHIR resources, the validation, and the lifecycle run on the real sandbox. Simulated: every lab *result* in the app (tagged `simulated` in the FHIR itself) and the demo scenario's volunteer checks.

## If you're asked to show something live

The order that tells the story fastest, about three minutes:
1. Coimbra board — read the stat aloud ("*n* days since the lab last visited a typical stream here"), then the "Act on this next" card.
2. "How is this ranked?" — show the four weights, move one, watch the order change.
3. Check a stream — answer "water looks clean" *and* "sewage smell" so the trust rule fires, then fix it and send.
4. Open the record — the timeline, then expand "This record as stored" so they see actual FHIR.
5. Switch to Coordinator — verify the check, and say the promotion sentence from point 2 above.
6. Request a lab visit, record the result, then Messages — the volunteer has been told.

If the network is unreliable, the demo works offline; that is a feature, so say so rather than apologising. If anything breaks, the video is the fallback: https://youtu.be/ij3GwQ4N66o

## Things to say before you're asked

Volunteering a limit costs nothing and buys a lot of credibility:
- "The map signal is weak — 0.22 — and it's labelled as weak in the app."
- "No usability study, so I can't give you a SUS score."
- "The sandbox is down right now; the ids and the screenshot from the live run are committed in the repo."
- "The lab results in the demo are simulated, and tagged that way in the FHIR."

## What you cannot say

- That HL7 Europe has reviewed or accepted the extension. They haven't; it's a proposal.
- That anyone has trialled this, that a city is using it, or that volunteers have tested it.
- That the score predicts contamination. It orders streams within one city, nothing more.
- That the hosted demo talks to the sandbox. It can't — CORS, plus the server being offline.
- Any number you haven't checked. If you're unsure, say "it's in the evidence file, I'd rather check than guess." That answer never costs you marks.

## Where everything lives

| You need | File |
|---|---|
| What each claim rests on, and its limits | `docs/hackathon/CLAIMS.md` |
| Answers to likely questions | `docs/hackathon/JUDGE-QA.md` |
| The dated log of every real run | `docs/hackathon/EVIDENCE.md` |
| The text to paste into Devpost | `docs/hackathon/SUBMISSION.md` |
| Copies of the result files | `docs/evidence/` |
| The FHIR contract | `docs/SPEC-fhir.md` |
| The model card and method | `data/baseline/model-v1.json`, `analysis/REPORT.md` |
