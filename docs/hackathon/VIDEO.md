# Demo video script (3–5 min, hard requirement: missing video = rejection)

Target: 4:00. Screen recording with voice-over. Record at 1440×900, browser zoom 110%, tour hidden, demo store reset, one browser window, no notifications.

Before recording:
1. `npm run dev`; open http://localhost:5173
2. Settings → Reset demo store; hide the tour; role = Coordinator.
3. Open the board on Coimbra and press "Load demo scenario" once, then reload so no toast is on screen.
4. Have a second tab on the About page (the validator panel).

| Time | On screen | Voice-over (write, then say it in your own words) |
|---|---|---|
| 0:00–0:25 | Board, Coimbra. Cursor rests on "1183 days". | "These are 96 urban streams that the OneAquaHealth project monitors across five European cities. Each one was lab-tested once. For 95 of them that was in 2023. Between those campaigns, nobody knows what is happening in the water." |
| 0:25–0:50 | Scroll the ranked list; hover two rows so the map dots light up. | "Volunteers do walk past these streams. Their reports exist, but in an app of their own: no health system can read them, nobody knows how much to trust them, and nothing happens as a result. StreamLink gives every stream one shared health record instead." |
| 0:50–1:40 | Phone-width window. Check at Mina Hospital: pictures, a couple of taps, sewage = Yes. | "A check takes three minutes and needs no expertise. The questions are exactly the ones in OneAquaHealth's own citizen app, as pictures. It works with no signal: the check is queued and sent later." |
| 1:40–2:10 | Review screen: the trust flag, then Fix → Poor → Send. | "Before it is sent, the app checks the answers against each other. Here the volunteer rated the stream as good but reported sewage. They fix it. The trust score and every flag are stored with the record, so an expert can see why it is trustworthy." |
| 2:10–2:45 | Record page: three pillars, freshness labels; open the FHIR panel briefly. | "This is the stream's record: the stream and its banks, the animals and disease vectors, and people's health, each showing how old that part of the picture is. Underneath it is standard health data, in the OneAquaHealth FHIR format." |
| 2:45–3:20 | Coordinator: Verify → Request lab visit (read the reason text) → Record lab result. | "An expert verifies the report. The moment they do, it becomes final and conforms to OneAquaHealth's official indicator profile. The city then requests a lab visit, and the request carries its reasons: a fresh verified report, a two-year-old lab picture, the map context. The lab result closes the request." |
| 3:20–3:40 | Messages, then the board: the site has dropped down the list. | "And the volunteer is told what their report led to, which is the part that keeps people checking. The stream drops down the list, because its picture is current again." |
| 3:40–4:10 | About page: the validation panel; then the Singapore tab. | "Every record type is checked by the official HL7 validator against OneAquaHealth's guide: zero errors, and deliberately broken records are rejected. There is no back end of ours: the FHIR server is the database, so a city can point this at their own. Adding a city is a config file, so it also runs where there is no lab data at all." |
| 4:10–4:20 | Repo/README. | "It is open source, it states plainly what is real and what is simulated, and the extension we wrote is ready to be proposed back to the OneAquaHealth guide." |

## Rules for the voice-over
- Never claim the lab result is real: say "simulated" on screen when it appears.
- Never claim the trust rules or the baseline predict contamination.
- Say "proposed extension", not "official".

## Checklist before upload
- [ ] 3:00–5:00 long
- [ ] The words "simulated" and "synthetic" are audible or visible where relevant
- [ ] Captions or clear audio
- [ ] Uploaded (YouTube/Vimeo, public or unlisted) and the link added to the Devpost entry and the README
