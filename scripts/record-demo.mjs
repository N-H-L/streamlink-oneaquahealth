// Records the StreamLink walkthrough in a real browser.
//
//   node scripts/record-demo.mjs                      guide take: burned-in subtitles + scene labels
//   node scripts/record-demo.mjs --clean --timings out/video/timings.json
//                                                     final take: no subtitles, timed to a voice-over
//
// Needs `npm run dev` on port 5173 (the sandbox scene goes through the dev proxy).
// Output: out/video/demo-<stamp>.webm, one still per line in out/video/frames/, and a log.
import { chromium } from "playwright-core";
import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { LINES, BOARD } from "./demo-lines.mjs";

const args = process.argv.slice(2);
const CLEAN = args.includes("--clean");
const timingsPath = args.includes("--timings") ? args[args.indexOf("--timings") + 1] : null;
const TIMINGS = timingsPath ? JSON.parse(readFileSync(timingsPath, "utf8")).timings : null;
const BASE = process.env.APP_URL ?? "http://localhost:5173/";
const EDGE = process.env.EDGE_PATH ?? "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const OUT = "out/video";
const FRAMES = `${OUT}/frames`;
/** Do each line's action this long before the narrator starts the line. */
const LEAD_IN = 0.8;

rmSync(FRAMES, { recursive: true, force: true });
mkdirSync(FRAMES, { recursive: true });

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
/* The browser only emits a video frame when something changes, which would compress every still
   moment out of the recording. This 3px mark keeps the compositor busy; it is invisible on screen. */
#sl-tick { position: fixed; right: 1px; bottom: 1px; width: 3px; height: 3px; border-radius: 50%;
  background: rgba(127,127,127,.06); pointer-events: none; z-index: 2147483647; animation: sl-tick .32s linear infinite; }
@keyframes sl-tick { from { transform: translateX(0); } to { transform: translateX(-2px); } }
`;

const browser = await chromium.launch({ executablePath: EDGE, headless: true });
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: 1,
  recordVideo: { dir: OUT, size: { width: 1280, height: 800 } },
});
// Video recording starts with the context, so remember when, to trim the set-up off later.
const ctxStart = Date.now();
const page = await ctx.newPage();
const video = page.video();
const problems = [];
page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));

const wait = (ms) => page.waitForTimeout(ms);
/** Scenes shot "on a phone" run inside an iframe, so the surrounding canvas can be styled
 * instead of showing grey bars. Everything targets whichever document is live. */
let scope = page;
const install = async (target = scope) => {
  await target.addStyleTag({ content: OVERLAY }).catch(() => {});
  await target.evaluate(() => {
    if (!document.getElementById("sl-cap")) {
      const c = document.createElement("div");
      c.id = "sl-cap";
      c.innerHTML = '<div id="sl-scene"></div><div id="sl-text"></div>';
      c.style.display = "none";
      document.body.appendChild(c);
      const tick = document.createElement("div");
      tick.id = "sl-tick";
      document.body.appendChild(tick);
    }
  }).catch(() => {});
};

async function caption(text, scene) {
  await install(page);
  if (CLEAN) return;
  await page.evaluate(({ text, scene }) => {
    const c = document.getElementById("sl-cap");
    c.style.display = "flex";
    document.getElementById("sl-text").textContent = text;
    document.getElementById("sl-scene").textContent = scene;
  }, { text, scene });
}

async function ring(selector, label, below, ms) {
  await install(scope);
  const loc = typeof selector === "string" ? scope.locator(selector) : selector;
  await loc.first().scrollIntoViewIfNeeded().catch(() => {});
  const box = await loc.first().boundingBox();
  if (!box) {
    problems.push(`no element: ${selector}`);
    return false;
  }
  await scope.evaluate(({ box, label, below, ms }) => {
    const r = document.createElement("div");
    r.className = "sl-ring" + (below ? " below" : "");
    r.dataset.label = label;
    Object.assign(r.style, { left: `${box.x - 6}px`, top: `${box.y - 6}px`, width: `${box.width + 12}px`, height: `${box.height + 12}px` });
    document.body.appendChild(r);
    setTimeout(() => r.remove(), ms);
  }, { box, label, below, ms });
  return true;
}

let sandboxState = null;
const stillsDir = `${process.cwd().split("\\").join("/")}/scripts/stills`;

const api = {
  page,
  base: BASE,
  wait,
  /** Is the OneAquaHealth sandbox reachable right now? Checked once per run. */
  sandboxUp: async () => {
    if (sandboxState !== null) return sandboxState;
    try {
      const r = await fetch("https://sandbox.hl7europe.eu/oneaquahealth/fhir/metadata", { signal: AbortSignal.timeout(12000) });
      sandboxState = r.ok;
    } catch {
      sandboxState = false;
    }
    if (!sandboxState) problems.push("sandbox unreachable: scene 6 uses the capture taken while it was up");
    return sandboxState;
  },
  still: ({ zoom = 0.6, top = 0, note = "on" } = {}) => `file:///${stillsDir}/still.html?zoom=${zoom}&top=${top}&note=${note}`,
  setViewport: (size) => page.setViewportSize(size),
  scope: () => scope,
  /** Switch between the full-width app and the phone mock-up. */
  usePhone: async (on, path = "") => {
    if (on) {
      await page.goto(`file:///${stillsDir}/phone.html?src=${encodeURIComponent(BASE + path)}`);
      await page.waitForTimeout(700);
      const frame = page.frames().find((f) => f.url().startsWith(BASE));
      if (!frame) {
        problems.push("phone frame did not load");
        return;
      }
      scope = frame;
    } else {
      scope = page;
    }
  },
  point: async (selector, label = "LOOK", { below = false } = {}) => {
    await ring(selector, label, below, 2600);
  },
  click: async (selector, label = "CLICK", { below = false } = {}) => {
    const loc = typeof selector === "string" ? scope.locator(selector) : selector;
    if (await ring(selector, label, below, 1400)) await wait(850);
    await loc.first().click();
    await wait(350);
  },
  sandboxObservationUrl: async () => {
    const tag = encodeURIComponent("https://n-h-l.github.io/streamlink-oneaquahealth/fhir/CodeSystem/streamlink-tags|demo");
    const r = await fetch(`https://sandbox.hl7europe.eu/oneaquahealth/fhir/Observation?_tag=${tag}&_count=5`, { headers: { "Cache-Control": "no-cache" } }).then((x) => x.json());
    const obs = (r.entry ?? []).map((e) => e.resource).find((x) => x.status === "final" && (x.meta?.profile ?? []).length > 1) ?? (r.entry ?? [])[0]?.resource;
    return `https://sandbox.hl7europe.eu/oneaquahealth/fhir/Observation/${obs?.id}?_pretty=true`;
  },
};

// ---------------------------------------------------------------- setup
await page.goto(BASE);
await page.evaluate(() => {
  localStorage.clear();
  localStorage.setItem("streamlink.settings.v1", JSON.stringify({ mode: "local", role: "coordinator", volunteerId: "vol-demo-video", tourDone: true, weights: { events: 0.4, lastLab: 0.25, baseline: 0.2, labAge: 0.15 } }));
});
// Warm the cache for the page the last line lands on, so it is not slow to appear later.
await page.goto("https://github.com/N-H-L/streamlink-oneaquahealth", { waitUntil: "domcontentloaded" }).catch(() => {});
await page.goto(`${BASE}${BOARD}`);
await page.reload();
await page.getByRole("heading", { name: "Needs a lab visit" }).waitFor();
await install();
await wait(800);

const t0 = Date.now();
const elapsed = () => (Date.now() - t0) / 1000;
const waitUntil = async (seconds) => {
  const ms = Math.round((seconds - elapsed()) * 1000);
  if (ms > 0) await wait(ms);
  return ms;
};

const log = [];
for (const [i, line] of LINES.entries()) {
  const target = TIMINGS?.[i]?.start;
  // In a timed take the action happens just before the narrator reaches the line.
  if (target !== undefined) await waitUntil(Math.max(0, target - (line.lead ?? LEAD_IN)));
  if (line.before) await line.before(api);
  await caption(line.text, line.scene);
  if (line.act) await line.act(api);
  const shownAt = elapsed();
  await page.screenshot({ path: `${FRAMES}/${String(i + 1).padStart(2, "0")}.png` }).catch(() => {});
  log.push({ n: i + 1, scene: line.scene, audioStart: target ?? null, shownAt: Math.round(shownAt * 100) / 100, drift: target === undefined ? null : Math.round((shownAt - target) * 100) / 100, text: line.text });
  if (target === undefined) {
    await wait(Math.max(600, speakSeconds(line.text) * 1000 - 1000));
  } else if (TIMINGS[i + 1]) {
    await waitUntil(Math.max(elapsed(), TIMINGS[i + 1].start - (LINES[i + 1].lead ?? LEAD_IN) - 0.05));
  }
}

// Hold the last frame until the voice-over has finished.
if (TIMINGS) {
  const audioEnd = JSON.parse(readFileSync(timingsPath, "utf8")).duration ?? 0;
  await waitUntil(audioEnd + 1.2);
}
if (!CLEAN) await caption("", "");
await wait(500);
await ctx.close();
await browser.close();

// Ask Playwright which file this run produced, rather than guessing from the directory.
const recorded = await video.path();
const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 16);
const final = `${OUT}/${CLEAN ? "clean" : "demo"}-${stamp}.webm`;
renameSync(recorded, final);
writeFileSync(`${OUT}/record-log.json`, JSON.stringify({ file: final, clean: CLEAN, timed: !!TIMINGS, videoOffset: Math.round(((t0 - ctxStart) / 1000) * 100) / 100, lines: log }, null, 2));

const drifts = log.map((l) => l.drift).filter((d) => d !== null);
console.log(`video: ${final}`);
if (drifts.length) {
  const worst = Math.max(...drifts.map(Math.abs));
  console.log(`timed to the voice-over · worst drift ${worst.toFixed(2)}s · average ${(drifts.reduce((a, b) => a + Math.abs(b), 0) / drifts.length).toFixed(2)}s`);
}
console.log(problems.length ? `PROBLEMS:\n- ${problems.join("\n- ")}` : "no problems reported");
