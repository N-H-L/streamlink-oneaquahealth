# Recording guide — say this, then do this

Every step is one thing to say and one thing to do. Do the action **while** you say the line, or
just before it; never in silence between lines.

The times are where each line falls in the voice-over already recorded (`video 2 project Audio file.m4a`). They are a guide, not a stopwatch.

## Before you start

1. `npm run dev`, then open http://localhost:5173
2. Click the **Demo store** pill → **Reset demo store** → **Yes, clear it**
3. Back on **Board**: click **Hide tour**; set the role switch to **Coordinator**
4. Browser zoom 110% (Ctrl +), full screen (F11), notifications off
5. Open a second tab on the organizers' server:
   `https://sandbox.hl7europe.eu/oneaquahealth/fhir/Observation?_tag=https%3A%2F%2Fn-h-l.github.io%2Fstreamlink-oneaquahealth%2Ffhir%2FCodeSystem%2Fstreamlink-tags%7Cdemo&_count=3&_pretty=true`
6. Record with **Win + Alt + R** (microphone on)

---


## SCENE 1 — The problem

**1. (0:01) SAY:** “These are ninety-six urban streams that the OneAquaHealth project monitors across five European cities.”

  **DO:** Start on the Coimbra board. Nothing to click — just let it sit.

**2. (0:07) SAY:** “Each of them was tested by a lab once. For ninety-five of them, that was back in 2023.”

  **DO:** Move the pointer onto the big number (“1,185 days”).

**3. (0:16) SAY:** “Between those campaigns, nobody knows what is in the water. And the things that harm health — a sewage misconnection, a spill — happen in between.”

  **DO:** Scroll the ranked list down a little, then back up.


## SCENE 2 — The idea

**4. (0:25) SAY:** “Volunteers walk past these streams every day. Their reports live in a separate app: no health system can read them, nobody knows how far to trust them, and nothing follows from them.”

  **DO:** Hover over two rows in the list so their dots light up on the map.

**5. (0:40) SAY:** “StreamLink gives every stream one shared record instead. Here are five volunteer checks.”

  **DO:** Click **Load demo scenario**.


## SCENE 3 — Being a volunteer

**6. (0:48) SAY:** “A check takes three minutes and needs no expertise. The questions are OneAquaHealth's own, turned into pictures.”

  **DO:** Go to **Check a stream → Mina Hospital (C5)**, and narrow the window to phone width first.

**7. (0:56) SAY:** “Shape of the channel, the bed, the banks. Anything you are unsure about, you just say so.”

  **DO:** Click **Fill with an example**, then scroll slowly through step one.

**8. (1:02) SAY:** “And this is what maps and yearly lab visits miss: a pipe discharging today.”

  **DO:** Click **Next**, then point at the “Sewage flowing in” question.

**9. (1:06) SAY:** “It even asks how the place makes you feel, because the project links stream health to human wellbeing.”

  **DO:** Click **Next**, then **Next** again to reach “How it feels”.

**10. (1:15) SAY:** “Say the volunteer sums it up as good overall — that is the mistake we want to catch.”

  **DO:** Click **Good** under “Overall, this stream looks…” (deliberately wrong).

**11. (1:22) SAY:** “It works with no signal, too. The check waits on your phone and sends itself later.”

  **DO:** Click **Review**.


## SCENE 4 — Trust

**12. (1:32) SAY:** “Before anything is sent, the app checks the answers against each other. Here the volunteer rated the stream as good, but also reported sewage.”

  **DO:** Nothing to click. Point at the orange flag.

**13. (1:43) SAY:** “The volunteer fixes it, and the trust score goes up.”

  **DO:** Click **Fix**, choose **Poor**, then **Review** again.

**14. (1:47) SAY:** “The second flag is only a reminder that a photo helps; the volunteer confirms there isn't one.”

  **DO:** Click **It's correct** on the “No photos” flag.

**15. (1:55) SAY:** “Every flag, and how it was resolved, is stored with the record, so an expert can see why it deserves trust.”

  **DO:** Point at the trust bar (now 100%).

**16. (2:04) SAY:** “Now it is saved — as preliminary data.”

  **DO:** Click **Send check**.


## SCENE 5 — What the city does

**17. (2:08) SAY:** “This is the stream's record: the stream and its banks, animals and disease vectors, and people's health — each showing how old that part of the picture is.”

  **DO:** Click **Open the stream's record**, then widen the window back to full size.

**18. (2:18) SAY:** “An expert verifies it. Only then does it become final and conform to OneAquaHealth's official indicator profile — so unverified crowd data can never pretend to be project data.”

  **DO:** Click **Verify check**.

**19. (2:30) SAY:** “The city requests a lab visit, and the request carries its reasons: a fresh verified report, a lab picture that is two years old, and the map context.”

  **DO:** Click **Request lab visit**, then point at the reasons in the timeline.

**20. (2:43) SAY:** “The lab reports back, and that closes the request.”

  **DO:** Click **Record lab result (simulated)**.

**21. (2:46) SAY:** “And the volunteer is told what their report led to. That is the part that keeps people checking.”

  **DO:** Click **Messages** in the top bar.


## SCENE 6 — The proof

**22. (2:58) SAY:** “None of this sits in a private database. Everything you just saw is standard health data.”

  **DO:** Open **Settings** and choose **Official OneAquaHealth FHIR sandbox**.

**23. (3:04) SAY:** “And this is the same record, read back from the organizers' own FHIR server.”

  **DO:** Open **Mina Hospital**'s record again and point at the green “live” pill.

**24. (3:09) SAY:** “Here it is on their server, claiming two profiles: ours, and OneAquaHealth's official indicator profile.”

  **DO:** Switch to the browser tab showing the raw data on their server.

**25. (3:16) SAY:** “Every record we write is checked by the official HL7 validator: ninety-one files, zero errors — plus five broken records it correctly rejects.”

  **DO:** Back in the app, click **About** and point at the green validation panel.


## SCENE 7 — Anywhere, and honesty

**26. (3:25) SAY:** “Adding a city is one config file. Singapore has no OneAquaHealth lab data at all, so the map baseline carries it — and the app says so plainly.”

  **DO:** Click **Board**, then the **Singapore** tab. Point at the blue “no lab data” banner.

**27. (3:43) SAY:** “We tested that map score by holding out whole cities. One signal survived: within a city, streams closer to a wastewater plant rank higher for lab risk.”

  **DO:** Go to **About** and scroll to “The map-context baseline”.

**28. (3:53) SAY:** “Comparing cities did not hold up, so we do not claim it. The richer model we tried first did worse than chance, and we say that too.”

  **DO:** Stay there; point at the “No” bullet and the negative result.

**29. (4:03) SAY:** “It is open source, it says exactly what is real and what is simulated, and the extension we wrote is ready to hand back to the project.”

  **DO:** Open the GitHub repository page.

---

## Three rules while you talk

- The lab result is labelled **simulated** on screen. Never call it real.
- Say “**proposed** extension”, never “official extension”.
- Never say the map score predicts pollution. It says *where to look first*.

## When you are done

- [ ] Length between 3:00 and 5:00
- [ ] Voice clear, on-screen text readable
- [ ] Uploaded (YouTube, Unlisted is fine); link checked in a private window
- [ ] Link added to the Devpost entry and to `README.md`
