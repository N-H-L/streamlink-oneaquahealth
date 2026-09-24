// Builds the 23-second scene 6 insert: the app reading a record from the OneAquaHealth sandbox,
// from captures taken while that server was live (it has been offline since).
//   node scripts/record-scene6.mjs [seconds] [--no-note]
import { chromium } from "playwright-core";
import { spawnSync } from "node:child_process";
import { mkdirSync, readdirSync, renameSync, rmSync } from "node:fs";

const SECONDS = Number(process.argv[2] ?? 23);
const NOTE = process.argv.includes("--no-note") ? "off" : "on";
const EDGE = process.env.EDGE_PATH ?? "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const FFMPEG = process.env.FFMPEG ?? "C:/Users/HaoLu/AppData/Local/Programs/Stremio/ffmpeg.exe";
const BASE = "http://localhost:5173/";
const OUT = "out/scene6";
const stills = `${process.cwd().split("\\").join("/")}/scripts/stills`;
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

// Three beats, matching the three spoken lines of scene 6.
const settingsFor = SECONDS * 0.3;
const panFor = SECONDS - settingsFor;

const browser = await chromium.launch({ executablePath: EDGE, headless: true });
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, recordVideo: { dir: OUT, size: { width: 1920, height: 1080 } } });
const page = await ctx.newPage();
const video = page.video();

// Beat 1 — the app's own setting that points it at the organizers' server.
await page.goto(BASE);
await page.evaluate(() => localStorage.setItem("streamlink.settings.v1", JSON.stringify({ mode: "local", role: "coordinator", volunteerId: "vol-demo-video", tourDone: true })));
await page.reload(); // settings are read at start-up, so they must be in place before the screen loads
await page.goto(`${BASE}#/settings`);
await page.locator(".radio").nth(1).waitFor();
await page.addStyleTag({ content: `
  .sl-ring{position:fixed;z-index:99999;border:4px solid #f0b429;border-radius:12px;pointer-events:none;
    box-shadow:0 0 0 4000px rgba(4,16,22,.22);animation:p 1.1s ease-out infinite}
  @keyframes p{0%{box-shadow:0 0 0 4000px rgba(4,16,22,.22),0 0 0 0 rgba(240,180,41,.5)}
               100%{box-shadow:0 0 0 4000px rgba(4,16,22,.22),0 0 0 20px rgba(240,180,41,0)}}` });
const box = await page.locator(".radio").nth(1).boundingBox();
await page.evaluate((b) => {
  const r = document.createElement("div");
  r.className = "sl-ring";
  Object.assign(r.style, { left: `${b.x - 8}px`, top: `${b.y - 8}px`, width: `${b.width + 16}px`, height: `${b.height + 16}px` });
  document.body.appendChild(r);
}, box);
await page.waitForTimeout(settingsFor * 1000);

// Beats 2 and 3 — the record as it came back from their server, panning down to the line that
// states both profiles.
await page.goto(`file:///${stills}/scene6.html?from=0&to=-1250&dur=${panFor}&note=${NOTE}`);
await page.waitForTimeout(panFor * 1000 + 400);
await ctx.close();
await browser.close();

const raw = await video.path();
const webm = `${OUT}/scene6.webm`;
renameSync(raw, webm);
for (const f of readdirSync(OUT)) if (f.endsWith(".webm") && f !== "scene6.webm") rmSync(`${OUT}/${f}`);

const mp4 = `${process.env.USERPROFILE}/Downloads/StreamLink-scene6-insert.mp4`;
// A silent audio track keeps editors and phones happy; inputs first, then output options.
const r = spawnSync(FFMPEG, ["-y",
  "-i", webm,
  "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=48000",
  "-map", "0:v:0", "-map", "1:a:0",
  "-t", String(SECONDS),
  "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", "-r", "25",
  "-c:a", "aac", "-b:a", "128k",
  "-movflags", "+faststart",
  mp4], { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
const probe = spawnSync(FFMPEG, ["-hide_banner", "-i", mp4], { encoding: "utf8" });
console.log(`${mp4}`);
console.log((probe.stderr ?? "").split("\n").filter((l) => /Duration|Stream #/.test(l)).join("\n"));
if (r.status !== 0) console.error((r.stderr ?? "").slice(-600));
