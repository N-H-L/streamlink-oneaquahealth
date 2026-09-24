# How to record the demo video

The video is **mandatory** (no video = rejected) and must be **3–5 minutes**. Aim for 4:00.

---

## Part 1 — Set up (about 10 minutes, once)

**1. Start the app on your own machine.** In the project folder:

```
npm run dev
```

Leave it running. Open **http://localhost:5173** in your browser.
(Record on localhost, not the published site, because one scene needs the organizers' test server, which browsers can only reach through the local proxy.)

**2. Put the app in its starting state.**
- Click the **Demo store** pill (top right) to open Settings → **Reset demo store** → **Yes, clear it**.
- Make sure **"Demo store in this browser"** is selected.
- Go back to **Board**. Click **Hide tour** if the tour panel is open.
- Set the role switch (top right) to **Coordinator**.

**3. Make the window look clean.**
- Full-screen the browser (F11), or at least hide the bookmarks bar.
- Browser zoom **110%** (Ctrl and +) so text is readable in the video.
- Close other tabs; turn off notifications (Windows: turn on Focus assist / Do not disturb).

**4. Open one extra tab** and paste this URL, then leave it on that tab (you switch to it in scene 6):

```
https://sandbox.hl7europe.eu/oneaquahealth/fhir/Observation?_tag=https%3A%2F%2Fn-h-l.github.io%2Fstreamlink-oneaquahealth%2Ffhir%2FCodeSystem%2Fstreamlink-tags%7Cdemo&_count=3&_pretty=true
```

That is the organizers' own FHIR server, showing our records on it.

**5. Start recording.** Windows: press **Win + Alt + R** (Xbox Game Bar). Check the microphone icon is **on**. The same keys stop it. The file lands in `Videos\Captures`.
If you prefer, record each scene separately and join them in **Clipchamp** (built into Windows).

---

## The finished video was assembled this way

The voice-over was recorded first, then the screen was driven in time with it:

```
node scripts/align-audio.mjs "<audio file>"        # finds the pauses, times each line
node scripts/record-demo.mjs --clean --timings out/video/timings.json
node scripts/make-video.mjs                        # MP4 (H.264 + AAC) + .srt into Downloads
node scripts/verify-video.mjs                      # one frame per line, for checking
```

The phone scenes are shot in a phone mock-up (`scripts/stills/phone.html`) so the recording is never letterboxed. If the OneAquaHealth sandbox is unreachable, scene 6 falls back to the capture taken while it was up, with a caption saying so.

## A reference recording exists

`npm run record` drives the app through this exact script in a real browser and saves a **silent** walkthrough with the subtitles burned in and a yellow box labelling every control it clicks:

- video: `out/video/demo-<timestamp>.webm` (about 4:45; open it in Edge or Clipchamp)
- one still per line: `out/video/frames/`
- the line-by-line timing: `out/video/transcript.json`

Watch it once before recording your own. It has no voice, no mouse pointer, and the yellow boxes and scene labels are guides only — your version should have your voice and none of those overlays.

---

## Prefer a step-by-step version?

`docs/hackathon/VIDEO-GUIDE.md` has the same thing as a single numbered list: say this line, then do this click, all the way through, with the time each line falls at in the recorded voice-over. Regenerate it with `node scripts/make-guide.mjs`.

## Part 2 — How to use the script

- **Left column = what you click.** Do it, then say the line.
- **Right column = exactly what to say.** Read it as written; it is timed to fit.
- Pause for a second between scenes. It is fine to re-record one scene and stitch them.
- Speak a little slower than feels natural. Total speaking time is about 4 minutes.

---

## Part 3 — The script

### Scene 1 — The problem (0:00–0:30)
*On screen: the Coimbra board.*

| Do this | Say this |
|---|---|
| Rest on the board. Move the cursor to the big number **1183 days**. | "These are ninety-six urban streams that the OneAquaHealth project monitors across five European cities." |
| Point at the number. | "Each of them was tested by a lab once. For ninety-five of them, that was back in 2023." |
| Slowly scroll the ranked list. | "So between those campaigns, nobody really knows what is in the water. And the things that harm health — a sewage misconnection, a spill — happen in between." |

### Scene 2 — The idea (0:30–0:55)
*Still on the board.*

| Do this | Say this |
|---|---|
| Hover over two rows so the map dots light up. | "Volunteers walk past these streams every day. Their reports exist, but in a separate app: no health system can read them, nobody knows how far to trust them, and nothing happens as a result." |
| Click **Load demo scenario**. | "StreamLink gives every stream one shared record instead. Here are five volunteer checks." |

### Scene 3 — Being a volunteer (0:55–1:45)
*Narrow the browser window to about phone width.*

| Do this | Say this |
|---|---|
| Click **Check a stream**, choose **Mina Hospital**. | "A check takes three minutes and needs no expertise. The questions are the ones from OneAquaHealth's own citizen app, turned into pictures." |
| Click **Fill with an example**, then scroll through step one. | "Shape of the channel, the bed, the banks. Anything you are unsure about, you just say so." |
| Click **Next**. Point at the sewage question. | "And this is what maps and yearly lab visits miss: a pipe discharging today." |
| Click **Next**, then **Next** again to reach "How it feels". | "It even asks how the place makes you feel, because the project links the health of a stream to how people feel about where they live." |
| On the same step, tap **Good** under "Overall, this stream looks…". This is deliberate: the example already reported sewage, so "Good" creates the contradiction you fix in the next scene. | "Say the volunteer sums it up as good overall — that is the mistake we want to catch." |
| Click **Review**. | "It works with no signal, too. The check waits on your phone and sends itself later." |

### Scene 4 — Trust (1:45–2:15)
*On the Review screen, with the orange flag visible.*

| Do this | Say this |
|---|---|
| Point at the orange flag. | "Before anything is sent, the app checks the answers against each other. Here the volunteer rated the stream as good, but also reported sewage." |
| Click **Fix**, choose **Poor**, then **Review** again. | "The volunteer fixes it, and the trust score goes up." |
| A second flag remains ("No photos"). Click **It's correct**. | "The second flag is only a reminder that a photo helps; the volunteer confirms there isn't one." |
| Point at the trust bar. | "Every flag, and how it was resolved, is stored with the record, so an expert can see why it deserves trust." |
| Click **Send check**. | "Now it is saved — as preliminary data." |

### Scene 5 — What the city does (2:15–3:05)
*Click "Open the stream's record", then widen the window back to full size.*

| Do this | Say this |
|---|---|
| Point at the three cards. | "This is the stream's record: the stream and its banks, the animals and disease vectors, and people's health. Each card shows how old that part of the picture is." |
| Click **Verify check**. | "An expert verifies the report. The moment they do, it becomes final — and only then does it conform to OneAquaHealth's official indicator profile. Unverified crowd data can never pretend to be project data." |
| Click **Request lab visit**, then point at the reason text. | "The city requests a lab visit, and the request carries its reasons: a fresh verified report, a lab picture that is two years old, and the map context." |
| Click **Record lab result**. | "The lab reports back, and that closes the request." |
| Click **Messages** in the top bar. | "And the volunteer is told what their report led to. That is the part that keeps people checking." |

### Scene 6 — The proof (3:05–3:50)
*Open Settings, choose "Official OneAquaHealth FHIR sandbox", then open the Mina Hospital record again.*

| Do this | Say this |
|---|---|
| Point at the green "live" pill, then the timeline. | "None of this sits in a private database. Everything you just saw is standard health data — and this is the same record, read back from the organizers' own FHIR server." |
| Switch to the tab you opened during setup (the raw data). | "Here it is on their server. Notice that each record claims two profiles: ours, and OneAquaHealth's official indicator profile." |
| Back in the app, click **About** and point at the green validation panel. | "Every record type we write is checked by the official HL7 validator: ninety-one files, zero errors — plus five deliberately broken records that it correctly rejects." |

### Scene 7 — Anywhere, and honesty (3:50–4:25)
*Click Board, then the **Singapore** tab.*

| Do this | Say this |
|---|---|
| Point at the "No lab data" banner. | "Adding a city is one config file. Singapore has no OneAquaHealth lab data at all, so the map baseline carries it — and the app says so plainly." |
| Go to **About** and scroll to the model card. | "We tested that map score honestly, holding out whole cities. One signal survived: within a city, streams closer to a wastewater plant do rank higher for lab risk. Comparing cities did not hold up, so we do not claim it. The richer model we tried first did worse than chance, and we say that too." |
| Briefly show the GitHub repository page. | "It is open source, it states exactly what is real and what is simulated, and the extension we wrote is ready to hand back to the OneAquaHealth project." |

---

## Part 4 — Rules while you talk

- When the lab result appears, the word **simulated** is on screen. Never call it a real result.
- Say "**proposed** extension", never "official extension".
- Never say the map score predicts pollution. It says *where to look first*.

## Part 5 — Before you upload

- [ ] Length is between 3:00 and 5:00
- [ ] Your voice is audible and the on-screen text is readable
- [ ] Upload to YouTube (Unlisted is fine) and check the link works in a private window
- [ ] Put the link in the Devpost entry and in `README.md`

## Optional extra scene (only if you really do it)

If you visit a canal or stream in Singapore and do a real check on your phone, record ten seconds of it and add it after scene 7: "And here it is at a real stream in Singapore." Only say that if it actually happened.
