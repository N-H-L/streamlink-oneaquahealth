# Devpost paste sheet

One block per box on the Devpost submission form. Copy between the lines, paste, move on.
Nothing here needs editing. If a box on the real form has a different name, match it by what it asks for.

---

## Box: Project name

```
StreamLink
```

---

## Box: Elevator pitch (short tagline, 200 characters)

```
One shared record per urban stream. Maps say where to look first, volunteers report what the maps and rare lab visits miss, and the lab confirms. All in OneAquaHealth's own FHIR standard.
```

(187 characters, inside Devpost's 200 limit.)

---

## Box: About the project (the long description)

Devpost prefills this field with its own headings, which say "we". You are solo, so they are singular
below. The headings are ordinary editable text, so paste the whole block over what is there.

```
## Inspiration

I opened the OneAquaHealth Resilience Map expecting recent water data and found the opposite. All 96 monitored sites have exactly one lab health-risk campaign on record, and 95 of those campaigns are from 2023. That is nobody's failing. Lab work is expensive, so campaigns are rare by necessity.

The trouble is that what actually makes an urban stream dangerous does not wait for the next campaign. A sewage misconnection, a pipe discharging into the channel, a spill upstream. These happen in between, and they are visible to anyone walking past. OneAquaHealth already has volunteers doing exactly that walk, through its Citizen Science App. But their reports sit somewhere separate. No health or environmental system can read them, nobody knows how far to trust any one of them, and in practice nothing follows from filing one.

So the gap I wanted to close was not "collect more citizen data". It was to turn a citizen report into something a city can act on, and have it count as a health record while it is at it.

## What it does

Every stream gets one living record that citizens, experts, the city and the lab all share.

A volunteer does a stream check on their phone. It is the OneAquaHealth citizen app's own question set, asked as pictures, and it takes about three minutes. It works with no signal, which matters when you are standing on a riverbank. The check is stored as FHIR immediately, with status "preliminary".

Before it sends, the app runs eight plain-language consistency checks over the answers. If you rated the water as good and also reported a sewage smell, it says so in those words, and you either fix it or confirm you meant it. The trust score and every individual flag are stored in a FHIR Provenance resource, so the reasoning travels with the data instead of sitting in a filter somewhere behind the scenes.

An expert then verifies the check, and this is the part I find most interesting. OneAquaHealth's own indicator profile fixes status to "final", which means an unverified citizen observation cannot conform to it, by construction. So citizen checks get their own profile at "preliminary", and verification is what promotes them: the observations become final and pick up the official OAH profile alongside ours. Unverified crowd data can never quietly pass itself off as project data.

The city then sees which streams need a lab visit, ranked on four things: fresh reports weighted by trust, the last lab result, map context, and how old the lab data is. Every weight is on screen and adjustable, and every ranking comes with a sentence saying why that stream sits where it does. Requesting a visit creates a FHIR ServiceRequest that carries those reasons with it.

When the lab reports back, the request closes, the result settles the reports that triggered it, and the volunteer gets a message saying their report led to a lab visit. That last step is small and it is the whole point. It is the reason someone files a second report.

Adding a city is a config file. Map features come from OpenStreetMap, so a city with no lab data at all still gets a starting point. Singapore ships as an example: 10 real streams and canals, labelled as having no lab data and as outside the range the model was tested on.

## How I built it

It is a static web app with no back end of its own. TypeScript and React on the front, and the FHIR server is the database. It ships with an in-browser demo store so anyone can try it without setup, and it can be pointed at any FHIR R4 server instead.

The standards work is a proposed extension to the OneAquaHealth Implementation Guide, written in FSH: a Questionnaire mirroring the citizen app, 9 profiles, 2 extensions, code systems, value sets, a ConceptMap onto the OAH indicator codes, 19 examples and 5 deliberately broken records. The official HL7 validator runs over all of it, over the 12 transaction bundles the app's own code produces, and over the 34 resources left in the store after a full lifecycle. Zero errors, and all 5 broken records get rejected, which is the part that proves the validation is doing anything at all.

For map context I rebuilt OneAquaHealth's features from OpenStreetMap so they work in cities the project has not surveyed, then tested them against their lab data leaving one city out at a time.

## Challenges I ran into

The indicator profile fixing status to "final" looked like a blocker for about an hour, then turned out to be the most interesting thing in the project. It is the standard correctly refusing to let unreviewed data in. Working out that verification should be the promotion step, rather than trying to bend the profile, is the design decision I would most want a judge to look at.

The map model was humbling. My first version used three features and scored a pooled held-out AUROC of 0.33, which is worse than guessing. A later variant looked excellent at 0.72 until I found the number came from pooling raw feature values across folds that were not comparable. Scored properly it was 0.32. What survived was a single feature, distance to the nearest wastewater plant, ranking streams within one city at a Spearman of 0.22. That is a weak signal. It is described as weak on the About page, and the failed model is kept in the model card as a documented negative result. Shipping 0.22 instead of a 0.72 that was not real is the decision I am most pleased with.

The HL7 Europe sandbox gave me two genuine defects to report, and then went offline in the middle of production. I had already run the full lifecycle on it, 34 resources written and read back, so the recording of that segment is real footage from when the server was up, captioned to say so. I would rather caption it than re-shoot something that never happened.

## Accomplishments that I'm proud of

Running the complete lifecycle on the official OneAquaHealth sandbox rather than a mock. Check, verification, lab request, result, volunteer message, all of it written to their server and read back, with the verified observations coming back carrying both profiles.

The negative tests. It is easy to say "FHIR validated" and mean nothing by it. Five records that must fail, and do, is the difference.

And the honest numbers. There is no usability study, so the submission says there is no usability study rather than implying one. The map signal is weak and is labelled weak inside the product, not just in the small print.

## What I learned

That most of the work in a standards project is not writing resources. It is reading someone else's profile carefully enough to understand why it says no.

And that an evaluation which flatters you is worth less than one that does not. I caught the 0.72 result because the leave-one-city-out design was decided before I looked at any numbers. If I had tuned first and evaluated after, I would have shipped something broken and never known.

## What's next for StreamLink

Authentication is the honest blocker for real use. The coordinator and volunteer views are a UI role right now, not a security boundary, and a city would need SMART-on-FHIR or equivalent before this touches anything real. After that: photo storage, moderation and duplicate handling once there is volume, and a pilot with one city's coordinator to find out whether the ranking matches what they would have chosen anyway.

The IG extension is written to be given away. If OneAquaHealth wants a citizen-check model in their Implementation Guide it is sitting in the repository under fhir/, and the two sandbox defects and the Ghent data problem are written up for them.
```

---

## Box: Track (or "Which track are you submitting under?")

```
Track 7: Digital Health Standards
```

If the box lets you explain, add this underneath:

```
StreamLink models OneAquaHealth citizen stream checks in HL7 FHIR, conforming to the project's own Implementation Guide, and uses standard FHIR workflow resources (ServiceRequest, then result, then Communication) to turn a citizen report into a lab visit and back into feedback for the volunteer. It also touches Track 1 with the three-minute picture-based check, Track 2 with the city board, and Track 3 with explainable, human-in-the-loop trust checks, but it is submitted under Track 7.
```

---

## Box: Built with (tags)

Devpost wants these one at a time, as tags. Type each and press enter:

```
typescript
react
vite
hl7-fhir
fsh
sushi
leaflet
openstreetmap
python
playwright
axe-core
github-pages
```

---

## Box: Try it out links

```
https://n-h-l.github.io/streamlink-oneaquahealth/
```
```
https://github.com/N-H-L/streamlink-oneaquahealth
```

---

## Box: Video demo link

```
https://youtu.be/ij3GwQ4N66o
```

Check the preview loads on the page after you paste it. It should show the title "OneAquaHealth IEEE Global Hackathon Project (StreamLink)".

---

## Box: Image gallery

Upload from `docs/submission-images/` in this order. Devpost uses the first image as the card,
so the thumbnail goes first.

1. Your chosen thumbnail (`thumbnail-l3.png`, or whichever of the five you prefer). No caption needed.

2. `01-board.png` 
```
The city board. 1,186 days since the lab last visited a typical Coimbra stream. "Act on this next" names one stream and says why.
```

3. `02-record.png`
```
One stream's shared record, covering the stream itself, animals and disease vectors, and people, with the four ranking factors and the reason behind each one.
```

4. `03-validation.png`
```
Every record type the app writes, checked by the official HL7 validator against the OneAquaHealth IG. Zero errors, and 5 out of 5 deliberately broken records rejected.
```

5. `04-check-phone.png`
```
The volunteer check on a phone. The OneAquaHealth citizen app's own questions, asked as pictures, and it works offline.
```

---

## If there is a box asking about limitations, honesty, or "what is not finished"

```
Lab results in the demo are simulated and tagged "simulated" in the FHIR itself, and the demo scenario's volunteer checks are synthetic. The site list and lab health-risk scores are real OneAquaHealth data. The map signal is weak, a within-city Spearman of 0.22, and is described that way inside the product. There is no usability study and no field trial, so no SUS score is quoted. There is no authentication yet, so the coordinator and volunteer views are a UI role rather than a security boundary. The HL7 Europe sandbox is currently offline, and separately it returns two conflicting CORS headers which stop any browser reaching it cross-origin, so the hosted demo uses an in-browser store and explains why in Settings.
```

---

## If there is a box about AI use

```
Built solo with AI assistance (Claude Code), disclosed in the repository README. All code was written during the hackathon period. There is no AI in the product itself: the trust rules are eight explicit consistency checks with visible weights, and the map factor is a single feature chosen by a pre-specified evaluation.
```

---

## Last step

Tick the final box in `SUBMISSION.md` once it is submitted, and tell me so I can update `STATE.md`.
