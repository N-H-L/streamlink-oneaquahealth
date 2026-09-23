// Records a reference walkthrough of StreamLink: a real browser driven through the demo script,
// with burned-in subtitles (the words to say) and a highlight box + "CLICK" label on every control
// it touches. Silent on purpose — it is a guide for recording the real video, not the entry itself.
//
//   npm run dev            (in another terminal; the sandbox scene needs the dev proxy)
//   node scripts/record-demo.mjs
//
// Output: out/video/demo-<timestamp>.webm  +  out/video/frames/NN-*.png (one per subtitle, for review)
import { chromium } from "playwright-core";
import { mkdirSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";

const BASE = process.argv[2] ?? "http://localhost:5173/";
const EDGE = process.env.EDGE_PATH ?? "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const OUT = "out/video";
const FRAMES = `${OUT}/frames`;
rmSync(OUT, { recursive: true, force: true });
mkdirSync(FRAMES, { recursive: true });

/** Speaking time: ~2.3 words a second, plus a breath. Never less than 3 s. */
const speakSeconds = (text) => Math.max(2.6, Math.round((text.split(/\s+/).length / 2.7 + 0.8) * 10) / 10);

const OVERLAY = `
#sl-cap { position: fixed; left: 0; right: 0; bottom: 0; z-index: 2147483647; display: flex; flex-direction: column; align-items: center; gap: 7px;
  padding: 0 0 22px; pointer-events: none; font-family: ui-sans-serif, system-ui, "Segoe UI", sans-serif; }
#sl-text { max-width: 1050px; background: rgba(8,22,28,.93); color: #fff; font-size: 23px; line-height: 1.38;
  padding: 14px 22px; border-radius: 12px; box-shadow: 0 6px 30px rgba(0,0,0,.35); text-align: center; }
#sl-scene { background: #0e2a33; color: #ffd57a; font: 700 14px ui-sans-serif, system-ui, sans-serif;
  padding: 5px 16px; border-radius: 999px; pointer-events: none; opacity: .95; }
.sl-ring { position: fixed; z-index: 2147483646; border: 4px solid #f0b429; border-radius: 12px; pointer-events: none;
  box-shadow: 0 0 0 4000px rgba(4,16,22,.28); animation: sl-pulse 1s ease-out infinite; }
.sl-ring::after { content: attr(data-label); position: absolute; left: 50%; transform: translateX(-50%);
  top: -34px; background: #f0b429; color: #3a2a00; font: 700 15px ui-sans-serif, system-ui, sans-serif;
  padding: 4px 12px; border-radius: 999px; white-space: nowrap; }
.sl-ring.below::after { top: auto; bottom: -34px; }
@keyframes sl-pulse { 0% { box-shadow: 0 0 0 4000px rgba(4,16,22,.28), 0 0 0 0 rgba(240,180,41,.55); }
  100% { box-shadow: 0 0 0 4000px rgba(4,16,22,.28), 0 0 0 18px rgba(240,180,41,0); } }
`;

const install = async (page) => {
  await page.addStyleTag({ content: OVERLAY }).catch(() => {});
  await page.evaluate(() => {
    if (!document.getElementById("sl-cap")) {
      const c = document.createElement("div");
      c.id = "sl-cap";
      c.innerHTML = '<div id="sl-scene"></div><div id="sl-text"></div>';
      c.style.display = "none";
      document.body.appendChild(c);
    }
  }).catch(() => {});
};

const browser = await chromium.launch({ executablePath: EDGE, headless: true });
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: 1,
  recordVideo: { dir: OUT, size: { width: 1280, height: 800 } },
});
const page = await ctx.newPage();
const problems = [];
page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));

let scene = "";
let n = 0;
const wait = (ms) => page.waitForTimeout(ms);

async function caption(text) {
  await install(page);
  await page.evaluate(({ text, scene }) => {
    const c = document.getElementById("sl-cap");
    c.style.display = "flex";
    document.getElementById("sl-text").textContent = text;
    document.getElementById("sl-scene").textContent = scene;
  }, { text, scene });
}

/** Show a line, optionally do something while it is on screen, and hold it long enough to say. */
async function line(text, action) {
  n++;
  await caption(text);
  await wait(500);
  if (action) await action();
  await wait(200);
  await page.screenshot({ path: `${FRAMES}/${String(n).padStart(2, "0")}-${text.slice(0, 40).replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.png` }).catch(() => {});
  const held = 1000;
  await wait(Math.max(600, speakSeconds(text) * 1000 - held));
  transcript.push({ n, scene, seconds: speakSeconds(text), text });
}

const transcript = [];

/** Highlight a control, label it, then click it. */
async function click(selector, label = "CLICK", { below = false, exact } = {}) {
  const loc = typeof selector === "string" ? page.locator(selector) : selector;
  const target = exact ? loc.filter({ hasText: exact }) : loc;
  await target.first().scrollIntoViewIfNeeded().catch(() => {});
  const box = await target.first().boundingBox();
  if (!box) {
    problems.push(`no element for ${selector}`);
    return;
  }
  await page.evaluate(({ box, label, below }) => {
    const r = document.createElement("div");
    r.className = "sl-ring" + (below ? " below" : "");
    r.dataset.label = label;
    Object.assign(r.style, { left: `${box.x - 6}px`, top: `${box.y - 6}px`, width: `${box.width + 12}px`, height: `${box.height + 12}px` });
    document.body.appendChild(r);
    setTimeout(() => r.remove(), 1400);
  }, { box, label, below });
  await wait(850);
  await target.first().click();
  await wait(350);
}

/** Highlight something without clicking (for "look here"). */
async function point(selector, label = "LOOK", { below = false } = {}) {
  const loc = typeof selector === "string" ? page.locator(selector) : selector;
  await loc.first().scrollIntoViewIfNeeded().catch(() => {});
  const box = await loc.first().boundingBox();
  if (!box) {
    problems.push(`no element to point at: ${selector}`);
    return;
  }
  await page.evaluate(({ box, label, below }) => {
    const r = document.createElement("div");
    r.className = "sl-ring" + (below ? " below" : "");
    r.dataset.label = label;
    Object.assign(r.style, { left: `${box.x - 6}px`, top: `${box.y - 6}px`, width: `${box.width + 12}px`, height: `${box.height + 12}px` });
    document.body.appendChild(r);
    setTimeout(() => r.remove(), 2600);
  }, { box, label, below });
}

// ---------------------------------------------------------------- setup
await page.goto(BASE);
await page.evaluate(() => {
  localStorage.clear();
  localStorage.setItem("streamlink.settings.v1", JSON.stringify({ mode: "local", role: "coordinator", volunteerId: "vol-demo-video", tourDone: true, weights: { events: 0.4, lastLab: 0.25, baseline: 0.2, labAge: 0.15 } }));
});
await page.goto(`${BASE}#/board/CO`);
await page.reload(); // settings are read once at start-up, so load them before the first scene
await page.getByRole("heading", { name: "Needs a lab visit" }).waitFor();
await wait(800);

// ---------------------------------------------------------------- scene 1
scene = "SCENE 1 · The problem";
await line("These are ninety-six urban streams that the OneAquaHealth project monitors across five European cities.", async () => point(".stats"));
await line("Each of them was tested by a lab once. For ninety-five of them, that was back in 2023.", async () => point(".stat:first-child", "AGE OF THE LAB PICTURE"));
await line("Between those campaigns, nobody knows what is in the water. And the things that harm health — a sewage misconnection, a spill — happen in between.", async () => {
  await page.mouse.wheel(0, 260);
  await wait(500);
  await page.mouse.wheel(0, -260);
});

// ---------------------------------------------------------------- scene 2
scene = "SCENE 2 · The idea";
await line("Volunteers walk past these streams every day. Their reports live in a separate app: no health system can read them, nobody knows how far to trust them, and nothing follows from them.", async () => {
  await page.locator(".rank-row").nth(1).hover();
  await wait(900);
  await page.locator(".rank-row").nth(3).hover();
});
await line("StreamLink gives every stream one shared record instead. Here are five volunteer checks.", async () => click("button:has-text('Load demo scenario')"));
await wait(800);

// ---------------------------------------------------------------- scene 3
scene = "SCENE 3 · Being a volunteer";
await page.setViewportSize({ width: 430, height: 800 });
await page.goto(`${BASE}#/check/C5`);
await page.getByRole("button", { name: "Fill with an example" }).waitFor();
await line("A check takes three minutes and needs no expertise. The questions are OneAquaHealth's own, turned into pictures.", async () => point("h1"));
await line("Shape of the channel, the bed, the banks. Anything you are unsure about, you just say so.", async () => click("button:has-text('Fill with an example')"));
await line("And this is what maps and yearly lab visits miss: a pipe discharging today.", async () => {
  await click("button:has-text('Next')", "NEXT");
  await point("fieldset:has-text('Sewage flowing in')", "REPORTED TODAY");
});
await line("It even asks how the place makes you feel, because the project links stream health to human wellbeing.", async () => {
  await click("button:has-text('Next')", "NEXT");
  await click("button:has-text('Next')", "NEXT");
  await point("fieldset:has-text('How does this place make you feel')");
});
await line("Say the volunteer sums it up as good overall — that is the mistake we want to catch.", async () => click("button:has-text('Good')", "TAP GOOD (ON PURPOSE)"));
await line("It works with no signal, too. The check waits on your phone and sends itself later.", async () => click("button:has-text('Review')", "REVIEW"));

// ---------------------------------------------------------------- scene 4
scene = "SCENE 4 · Trust";
await page.getByText(/rated the stream as good/).waitFor();
await line("Before anything is sent, the app checks the answers against each other. Here the volunteer rated the stream as good, but also reported sewage.", async () => point(".flag", "CONTRADICTION", { below: true }));
await line("The volunteer fixes it, and the trust score goes up.", async () => {
  await click(".flag button:has-text('Fix')", "FIX");
  await click("button:has-text('Poor')", "CHOOSE POOR");
  await click("button:has-text('Review')", "REVIEW");
});
await line("The second flag is only a reminder that a photo helps; the volunteer confirms there isn't one.", async () => click("button:has-text(\"It's correct\")", "CONFIRM IT"));
await line("Every flag, and how it was resolved, is stored with the record, so an expert can see why it deserves trust.", async () => point(".trust", "TRUST SCORE"));
await line("Now it is saved — as preliminary data.", async () => click(page.getByRole("button", { name: /^Send/ }), "SEND"));

// ---------------------------------------------------------------- scene 5
scene = "SCENE 5 · What the city does";
await page.getByText("your check is in the stream's record").waitFor();
await click("button:has-text(\"Open the stream's record\")", "OPEN RECORD");
await page.setViewportSize({ width: 1280, height: 800 });
await page.getByRole("heading", { name: "Coordinator actions" }).waitFor();
await wait(400);
await line("This is the stream's record: the stream and its banks, animals and disease vectors, and people's health — each showing how old that part of the picture is.", async () => point(".pillars"));
await line("An expert verifies it. Only then does it become final and conform to OneAquaHealth's official indicator profile — so unverified crowd data can never pretend to be project data.", async () => click("button:has-text('Verify check')", "VERIFY"));
await line("The city requests a lab visit, and the request carries its reasons: a fresh verified report, a lab picture that is two years old, and the map context.", async () => {
  await click("button:has-text('Request lab visit')", "REQUEST LAB VISIT");
  await point(".timeline li", "REASONS RECORDED");
});
await line("The lab reports back, and that closes the request.", async () => click("button:has-text('Record lab result')", "RECORD RESULT"));
await line("And the volunteer is told what their report led to. That is the part that keeps people checking.", async () => {
  await click("nav button:has-text('Messages')", "MESSAGES");
  await wait(600);
  await point(".inbox li", "YOUR REPORT LED TO A LAB VISIT");
});

// ---------------------------------------------------------------- scene 6
scene = "SCENE 6 · The proof";
await page.goto(`${BASE}#/settings`);
await line("None of this sits in a private database. Everything you just saw is standard health data.", async () => click("input[type=radio] >> nth=1", "SWITCH TO THEIR SERVER", { below: true }));
await page.goto(`${BASE}#/site/C5`);
await page.locator(".timeline li").first().waitFor({ timeout: 40000 });
await wait(700);
await line("And this is the same record, read back from the organizers' own FHIR server.", async () => {
  await point(".store-pill", "LIVE ON THEIR SERVER", { below: true });
  await wait(900);
  await point(".timeline");
});
// One verified observation reads better on camera than a whole search result.
const tagged = await fetch("https://sandbox.hl7europe.eu/oneaquahealth/fhir/Observation?_tag=" + encodeURIComponent("https://n-h-l.github.io/streamlink-oneaquahealth/fhir/CodeSystem/streamlink-tags|demo") + "&_count=5", { headers: { "Cache-Control": "no-cache" } }).then((r) => r.json());
const verified = (tagged.entry ?? []).map((e) => e.resource).find((r) => r.status === "final" && (r.meta?.profile ?? []).length > 1) ?? (tagged.entry ?? [])[0]?.resource;
await page.goto(`https://sandbox.hl7europe.eu/oneaquahealth/fhir/Observation/${verified?.id}?_pretty=true`);
await page.evaluate(() => { document.body.style.zoom = "0.78"; }).catch(() => {});
await wait(700);
await line("Here it is on their server, claiming two profiles: ours, and OneAquaHealth's official indicator profile.", null);
await page.goto(`${BASE}#/about`);
await page.locator(".proof").first().waitFor();
await line("Every record we write is checked by the official HL7 validator: ninety-one files, zero errors — plus five broken records it correctly rejects.", async () => point(".proof", "VALIDATOR RESULT"));

// ---------------------------------------------------------------- scene 7
scene = "SCENE 7 · Anywhere, and honesty";
await page.goto(`${BASE}#/board/singapore`);
await page.getByRole("heading", { name: "Needs a lab visit" }).waitFor();
await wait(500);
await line("Adding a city is one config file. Singapore has no OneAquaHealth lab data at all, so the map baseline carries it — and the app says so plainly.", async () => point(".notice", "NO LAB DATA HERE"));
await page.goto(`${BASE}#/about`);
await page.locator(".proof").nth(1).waitFor();
await page.locator(".proof").nth(1).scrollIntoViewIfNeeded();
await wait(350);
await line("We tested that map score by holding out whole cities. One signal survived: within a city, streams closer to a wastewater plant rank higher for lab risk.", async () => point(".proof >> nth=1", "WHAT IT SUPPORTS"));
await line("Comparing cities did not hold up, so we do not claim it. The richer model we tried first did worse than chance, and we say that too.", null);
await page.goto("https://github.com/N-H-L/streamlink-oneaquahealth", { waitUntil: "domcontentloaded" }).catch(() => {});
await wait(1100);
await line("It is open source, it says exactly what is real and what is simulated, and the extension we wrote is ready to hand back to the project.", null);

await caption("");
await wait(600);
await ctx.close();
await browser.close();

// name the video predictably and write the transcript for review
const vids = readdirSync(OUT).filter((f) => f.endsWith(".webm"));
const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 16);
const final = `${OUT}/demo-${stamp}.webm`;
if (vids[0]) renameSync(`${OUT}/${vids[0]}`, final);
const total = transcript.reduce((s, t) => s + t.seconds, 0);
writeFileSync(`${OUT}/transcript.json`, JSON.stringify({ file: final, lines: transcript.length, spokenSeconds: Math.round(total), transcript }, null, 2));
console.log(`video: ${final}`);
console.log(`lines: ${transcript.length}, speaking time ~${Math.floor(total / 60)}m${Math.round(total % 60)}s`);
console.log(problems.length ? `PROBLEMS:\n- ${problems.join("\n- ")}` : "no problems reported");
