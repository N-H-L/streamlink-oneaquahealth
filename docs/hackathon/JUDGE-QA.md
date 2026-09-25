# Judge Q&A

Likely questions, with answers that are true. Where an answer is "we don't know" or "we didn't do that", it says so — a judge trusts a project that knows its own limits far more than one that bluffs. Keep answers to two or three sentences out loud; the detail below is so you know what you are compressing.

---

## The idea

**Why not just add a dashboard to the existing Citizen Science App?**
Because the problem is not display, it is that a citizen report has nowhere to go. The app collects reports; nothing downstream can read them, weigh them, or act on them. StreamLink makes the report a health record in the project's own standard, gives it a trust score a human can argue with, and connects it to a lab visit and back to the volunteer. The dashboard is the smallest part of it.

**Isn't this just crowdsourcing water quality? Volunteers can't measure contamination.**
Agreed, and we don't claim they can. A volunteer check is an *event report* — a discharging pipe, sewage smell, foam, a colour change — not a measurement. Its job is to tell the city where the expensive, accurate measurement should go next. The lab still decides what the water is.

**What is actually new here?**
One thing above all: the OneAquaHealth indicator profile fixes `status = final`, so by construction an unverified citizen observation cannot conform to it. We modelled the citizen check as its own profile at `preliminary`, and made expert verification the step that promotes it — at which point the observation gains the official profile too. That is a standards-level answer to "can crowd data masquerade as project data?", and the answer is no, not until a human says so. Also: trust is stored as data, in a FHIR Provenance with the score and every rule, rather than being a hidden filter.

**Where does AI fit in?**
It doesn't. The trust rules are eight explicit consistency checks with visible weights; the map factor is a single feature chosen by a pre-specified evaluation. Both were deliberate. A judge can read every rule and disagree with it, which is the point — the brief asked for support for expert judgement, not replacement of it.

## The standards work

**Did you actually validate, or just say "FHIR"?**
The official HL7 validator (6.10.4) runs against the OneAquaHealth IG plus ours: 45 IG artefacts, the 12 transactions the app's own engine emits, and the 34 resources as stored after a full lifecycle — 0 errors, with `-tx https://tx.fhir.org/r4` so UCUM units are checked too. Five deliberately broken records are in the suite and must fail; all five do. The per-file report is committed at `docs/evidence/validation-summary.md`.

**Why negative tests?**
Because "0 errors" is meaningless if the validator isn't actually enforcing anything. The negative tests prove the profiles bite. We also checked the opposite way round: an official OAH example passes, and the same record with `status = preliminary` and no performer produces two errors.

**Is your extension official?**
No, and we don't imply it is. It is a proposal, written in FSH, buildable with SUSHI, and offered back to the project along with the gap we found in the IG. HL7 Europe has not reviewed it.

**Does it work against a real server, or only your own store?**
Both. The same client code ran the complete lifecycle on the official OneAquaHealth sandbox: 34 resources written and read back, all tagged `demo`, with the verified observations coming back carrying both profiles. The ids are committed at `docs/evidence/sandbox-demo.json`. **Be honest here:** that server is offline at the time of submission, and independently it returns two conflicting CORS headers, so no browser app can reach it cross-origin. The hosted demo therefore uses an in-browser store and says so in Settings. The sandbox segment of the video is real footage from the live run, captioned as such.

## The model

**How good is the map score?**
Weak, and we say so on the About page. Leave-one-city-out across 96 sites in 5 cities: within a city, streams nearer a wastewater plant do rank higher for lab-measured risk — Spearman +0.22, permutation p = 0.025, AUROC 0.63. That is a real signal and a small one. It orders streams inside one city. It cannot compare cities, and it is not a risk level.

**Why only one feature? That's barely a model.**
Because the richer one didn't work. A three-feature logistic model scored a pooled held-out AUROC of 0.33 — worse than chance on a city it had never seen. It is in the model card as a documented negative result. During evaluation a variant appeared to reach 0.72; that turned out to be an artefact of pooling incomparable raw feature values across folds, and scored correctly it was 0.32. We caught it and dropped it. Shipping the honest 0.22 rather than the flattering 0.72 is the decision we would most want judged.

**What if the map score is wrong for a particular stream?**
Then the volunteers and the lab overrule it, which is how the product is weighted. A fresh verified report outweighs the map factor, and a lab result settles the reports that preceded it. The weights are on screen and adjustable, so a coordinator who distrusts the map can turn it down to zero.

## The product

**Who is the user?**
A city or OneAquaHealth stream-health coordinator deciding where to send a limited lab budget next. The volunteer is the second user, and the thing they get back — "your report led to a lab visit" — is what keeps them reporting.

**Could a city run this tomorrow?**
Not tomorrow. It is a static app with no back end of its own and it points at any FHIR R4 server, so hosting is nearly free and a new city is a coordinate list. What is missing for real use: authentication and authorisation (there is no SMART-on-FHIR; the coordinator/volunteer switch is a UI role, not a security boundary), photo storage, moderation and duplicate handling at volume, and the data-sharing and governance agreements that are the actual blocker.

**What's simulated?**
Every lab *result* in the app, tagged `simulated` in the FHIR resource itself, and the demo scenario's volunteer checks. Real: the OneAquaHealth site list and lab health-risk scores, the map features, the FHIR resources and their validation, and the workflow.

**Did you test it with volunteers?**
No. There is no usability study and no field trial, so there is no SUS score to quote. What was tested: 25 unit tests, an automated browser walkthrough, an axe accessibility audit with 0 violations on six screens, and an offline run — all re-run against the deployed build, not just locally.

**Why is there no biological indicator?**
Because the OneAquaHealth citizen form has none. Macroinvertebrates and diatoms come from the professional protocol and the lab — which is exactly what a lab visit request asks for.

## The awkward ones

**How much of this did you write yourself?**
Answer plainly: it was built solo with AI assistance (Claude Code), disclosed in the README, and every line was written inside the hackathon period. Then move to what you can demonstrate: why the citizen profile has to sit at `preliminary`, why the three-feature model was dropped, what the trust rules do and why. Owning the tooling and knowing the system cold is a better answer than a claim nobody can check. See `OWNERSHIP.md`.

**The sandbox is down — how do we know you ever reached it?**
The resource ids, the timestamp and the screenshot of the app rebuilding a record from their server are committed in `docs/evidence/`. The cleanup script deletes exactly those ids. We also reported two defects in that server back to the project, which is not something you find without using it.

**Your priority score is just a weighted sum. Why should a city trust it?**
It isn't asking to be trusted as a prediction. It is a transparent way of combining four things a coordinator already balances by hand, with the arithmetic and the weights on screen and a sentence explaining every ranking. Only one of the four factors is fitted to data, and that one is labelled as weak. A coordinator can retune it in ten seconds.

**Another team has AI summaries and a nicer dashboard.**
Fair. Ours is deliberately not that: an LLM summary of citizen reports is unverifiable and adds a second layer of uncertainty to data whose reliability is already the problem. We put the effort into making the data conformant, traceable and refutable instead. If the judges want the record to be readable by a health system in five years, that is the part that matters.
