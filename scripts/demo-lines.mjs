// The demo script: one entry per spoken line, with the screen actions that belong to it.
// Used by scripts/record-demo.mjs (drives the browser) and scripts/align-audio.mjs (times a
// recorded voice-over). Keep the wording in step with docs/hackathon/VIDEO.md.
export const BOARD = "#/board/CO";

export const LINES = [
  // ---------------------------------------------------------------- scene 1
  {
    scene: "SCENE 1 · The problem",
    text: "These are ninety-six urban streams that the OneAquaHealth project monitors across five European cities.",
    do: "Start on the Coimbra board. Nothing to click — just let it sit.",
    act: async ({ point }) => point(".stats"),
  },
  {
    scene: "SCENE 1 · The problem",
    text: "Each of them was tested by a lab once. For ninety-five of them, that was back in 2023.",
    do: "Move the pointer onto the big number (“1,185 days”).",
    act: async ({ point }) => point(".stat:first-child", "AGE OF THE LAB PICTURE"),
  },
  {
    scene: "SCENE 1 · The problem",
    text: "Between those campaigns, nobody knows what is in the water. And the things that harm health — a sewage misconnection, a spill — happen in between.",
    do: "Scroll the ranked list down a little, then back up.",
    act: async ({ page, wait }) => {
      await page.mouse.wheel(0, 260);
      await wait(600);
      await page.mouse.wheel(0, -260);
    },
  },
  // ---------------------------------------------------------------- scene 2
  {
    scene: "SCENE 2 · The idea",
    text: "Volunteers walk past these streams every day. Their reports live in a separate app: no health system can read them, nobody knows how far to trust them, and nothing follows from them.",
    do: "Hover over two rows in the list so their dots light up on the map.",
    act: async ({ page, wait }) => {
      await page.locator(".rank-row").nth(1).hover();
      await wait(900);
      await page.locator(".rank-row").nth(3).hover();
    },
  },
  {
    scene: "SCENE 2 · The idea",
    text: "StreamLink gives every stream one shared record instead. Here are five volunteer checks.",
    do: "Click **Load demo scenario**.",
    act: async ({ click }) => click("button:has-text('Load demo scenario')", "LOAD DEMO SCENARIO"),
  },
  // ---------------------------------------------------------------- scene 3
  {
    scene: "SCENE 3 · Being a volunteer",
    text: "A check takes three minutes and needs no expertise. The questions are OneAquaHealth's own, turned into pictures.",
    do: "Go to **Check a stream → Mina Hospital (C5)**, and narrow the window to phone width first.",
    before: async ({ usePhone, scope }) => {
      await usePhone(true, "#/check/C5");
      await scope().getByRole("button", { name: "Fill with an example" }).waitFor();
    },
    act: async ({ point }) => point("h1"),
  },
  {
    scene: "SCENE 3 · Being a volunteer",
    text: "Shape of the channel, the bed, the banks. Anything you are unsure about, you just say so.",
    do: "Click **Fill with an example**, then scroll slowly through step one.",
    act: async ({ click }) => click("button:has-text('Fill with an example')", "FILL EXAMPLE"),
  },
  {
    scene: "SCENE 3 · Being a volunteer",
    text: "And this is what maps and yearly lab visits miss: a pipe discharging today.",
    do: "Click **Next**, then point at the “Sewage flowing in” question.",
    act: async ({ click, point }) => {
      await click("button:has-text('Next')", "NEXT");
      await point("fieldset:has-text('Sewage flowing in')", "REPORTED TODAY");
    },
  },
  {
    scene: "SCENE 3 · Being a volunteer",
    text: "It even asks how the place makes you feel, because the project links stream health to human wellbeing.",
    do: "Click **Next**, then **Next** again to reach “How it feels”.",
    lead: 2.2, // two clicks before the line starts
    act: async ({ click, point }) => {
      await click("button:has-text('Next')", "NEXT");
      await click("button:has-text('Next')", "NEXT");
      await point("fieldset:has-text('How does this place make you feel')");
    },
  },
  {
    scene: "SCENE 3 · Being a volunteer",
    text: "Say the volunteer sums it up as good overall — that is the mistake we want to catch.",
    do: "Click **Good** under “Overall, this stream looks…” (deliberately wrong).",
    act: async ({ click }) => click("button:has-text('Good')", "TAP GOOD (ON PURPOSE)"),
  },
  {
    scene: "SCENE 3 · Being a volunteer",
    text: "It works with no signal, too. The check waits on your phone and sends itself later.",
    do: "Click **Review**.",
    act: async ({ click }) => click("button:has-text('Review')", "REVIEW"),
  },
  // ---------------------------------------------------------------- scene 4
  {
    scene: "SCENE 4 · Trust",
    text: "Before anything is sent, the app checks the answers against each other. Here the volunteer rated the stream as good, but also reported sewage.",
    do: "Nothing to click. Point at the orange flag.",
    before: async ({ scope }) => scope().getByText(/rated the stream as good/).waitFor(),
    act: async ({ point }) => point(".flag", "CONTRADICTION", { below: true }),
  },
  {
    scene: "SCENE 4 · Trust",
    text: "The volunteer fixes it, and the trust score goes up.",
    do: "Click **Fix**, choose **Poor**, then **Review** again.",
    lead: 3.2, // fix, choose Poor, review
    act: async ({ click }) => {
      await click(".flag button:has-text('Fix')", "FIX");
      await click("button:has-text('Poor')", "CHOOSE POOR");
      await click("button:has-text('Review')", "REVIEW");
    },
  },
  {
    scene: "SCENE 4 · Trust",
    text: "The second flag is only a reminder that a photo helps; the volunteer confirms there isn't one.",
    do: "Click **It's correct** on the “No photos” flag.",
    act: async ({ click }) => click("button:has-text(\"It's correct\")", "CONFIRM IT"),
  },
  {
    scene: "SCENE 4 · Trust",
    text: "Every flag, and how it was resolved, is stored with the record, so an expert can see why it deserves trust.",
    do: "Point at the trust bar (now 100%).",
    act: async ({ point }) => point(".trust", "TRUST SCORE"),
  },
  {
    scene: "SCENE 4 · Trust",
    text: "Now it is saved — as preliminary data.",
    do: "Click **Send check**.",
    act: async ({ click, scope }) => click(scope().getByRole("button", { name: /^Send/ }), "SEND"),
  },
  // ---------------------------------------------------------------- scene 5
  {
    scene: "SCENE 5 · What the city does",
    text: "This is the stream's record: the stream and its banks, animals and disease vectors, and people's health — each showing how old that part of the picture is.",
    do: "Click **Open the stream's record**, then widen the window back to full size.",
    before: async ({ page, base, click, scope, usePhone, wait }) => {
      await scope().getByText("your check is in the stream's record").waitFor();
      await click("button:has-text(\"Open the stream's record\")", "OPEN RECORD");
      await wait(500);
      await usePhone(false);
      await page.goto(`${base}#/site/C5`);
      await page.getByRole("heading", { name: "Coordinator actions" }).waitFor();
      await wait(400);
    },
    act: async ({ point }) => point(".pillars"),
  },
  {
    scene: "SCENE 5 · What the city does",
    text: "An expert verifies it. Only then does it become final and conform to OneAquaHealth's official indicator profile — so unverified crowd data can never pretend to be project data.",
    do: "Click **Verify check**.",
    act: async ({ click }) => click("button:has-text('Verify check')", "VERIFY"),
  },
  {
    scene: "SCENE 5 · What the city does",
    text: "The city requests a lab visit, and the request carries its reasons: a fresh verified report, a lab picture that is two years old, and the map context.",
    do: "Click **Request lab visit**, then point at the reasons in the timeline.",
    act: async ({ click, point }) => {
      await click("button:has-text('Request lab visit')", "REQUEST LAB VISIT");
      await point(".timeline li", "REASONS RECORDED");
    },
  },
  {
    scene: "SCENE 5 · What the city does",
    text: "The lab reports back, and that closes the request.",
    do: "Click **Record lab result (simulated)**.",
    act: async ({ click }) => click("button:has-text('Record lab result')", "RECORD RESULT"),
  },
  {
    scene: "SCENE 5 · What the city does",
    text: "And the volunteer is told what their report led to. That is the part that keeps people checking.",
    do: "Click **Messages** in the top bar.",
    lead: 2.0,
    act: async ({ click, point, wait }) => {
      await click("nav button:has-text('Messages')", "MESSAGES");
      await wait(600);
      await point(".inbox li", "YOUR REPORT LED TO A LAB VISIT");
    },
  },
  // ---------------------------------------------------------------- scene 6
  {
    scene: "SCENE 6 · The proof",
    text: "None of this sits in a private database. Everything you just saw is standard health data.",
    do: "Open **Settings** and choose **Official OneAquaHealth FHIR sandbox**.",
    before: async ({ page, base }) => page.goto(`${base}#/settings`),
    act: async ({ click }) => click("input[type=radio] >> nth=1", "SWITCH TO THEIR SERVER", { below: true }),
  },
  {
    scene: "SCENE 6 · The proof",
    text: "And this is the same record, read back from the organizers' own FHIR server.",
    do: "Open **Mina Hospital**'s record again and point at the green “live” pill.",
    // Live when their sandbox is reachable; otherwise the capture taken while it was up.
    before: async ({ page, base, wait, sandboxUp, still }) => {
      if (await sandboxUp()) {
        await page.goto(`${base}#/site/C5`);
        await page.locator(".timeline li").first().waitFor({ timeout: 40000 });
      } else {
        await page.goto(still({ zoom: 0.6, top: 0 }));
      }
      await wait(500);
    },
    act: async ({ point, wait, sandboxUp }) => {
      if (!(await sandboxUp())) return;
      await point(".store-pill", "LIVE ON THEIR SERVER", { below: true });
      await wait(900);
      await point(".timeline");
    },
  },
  {
    scene: "SCENE 6 · The proof",
    text: "Here it is on their server, claiming two profiles: ours, and OneAquaHealth's official indicator profile.",
    do: "Switch to the browser tab showing the raw data on their server.",
    before: async ({ page, wait, sandboxObservationUrl, sandboxUp, still }) => {
      if (await sandboxUp()) {
        await page.goto(await sandboxObservationUrl());
        await page.evaluate(() => {
          document.body.style.zoom = "0.78";
        }).catch(() => {});
      } else {
        // Zoom the same capture onto the timeline entry that states the two profiles.
        await page.goto(still({ zoom: 0.94, top: 1075 }));
      }
      await wait(500);
    },
  },
  {
    scene: "SCENE 6 · The proof",
    text: "Every record we write is checked by the official HL7 validator: ninety-one files, zero errors — plus five broken records it correctly rejects.",
    do: "Back in the app, click **About** and point at the green validation panel.",
    before: async ({ page, base }) => {
      await page.goto(`${base}#/about`);
      await page.locator(".proof").first().waitFor();
    },
    act: async ({ point }) => point(".proof", "VALIDATOR RESULT"),
  },
  // ---------------------------------------------------------------- scene 7
  {
    scene: "SCENE 7 · Anywhere, and honesty",
    text: "Adding a city is one config file. Singapore has no OneAquaHealth lab data at all, so the map baseline carries it — and the app says so plainly.",
    do: "Click **Board**, then the **Singapore** tab. Point at the blue “no lab data” banner.",
    before: async ({ page, base, wait }) => {
      await page.goto(`${base}#/board/singapore`);
      await page.getByRole("heading", { name: "Needs a lab visit" }).waitFor();
      await wait(500);
    },
    act: async ({ point }) => point(".notice", "NO LAB DATA HERE"),
  },
  {
    scene: "SCENE 7 · Anywhere, and honesty",
    text: "We tested that map score by holding out whole cities. One signal survived: within a city, streams closer to a wastewater plant rank higher for lab risk.",
    do: "Go to **About** and scroll to “The map-context baseline”.",
    before: async ({ page, base, wait }) => {
      await page.goto(`${base}#/about`);
      await page.locator(".proof").nth(1).waitFor();
      await page.locator(".proof").nth(1).scrollIntoViewIfNeeded();
      await wait(350);
    },
    act: async ({ point }) => point(".proof >> nth=1", "WHAT IT SUPPORTS"),
  },
  {
    scene: "SCENE 7 · Anywhere, and honesty",
    text: "Comparing cities did not hold up, so we do not claim it. The richer model we tried first did worse than chance, and we say that too.",
    do: "Stay there; point at the “No” bullet and the negative result.",
    act: async ({ page }) => page.locator(".proof").nth(1).scrollIntoViewIfNeeded(),
  },
  {
    scene: "SCENE 7 · Anywhere, and honesty",
    text: "It is open source, it says exactly what is real and what is simulated, and the extension we wrote is ready to hand back to the project.",
    do: "Open the GitHub repository page.",
    lead: 3.5, // loading github.com takes a moment
    before: async ({ page, wait }) => {
      await page.goto("https://github.com/N-H-L/streamlink-oneaquahealth", { waitUntil: "domcontentloaded" }).catch(() => {});
      await wait(900);
    },
  },
];
