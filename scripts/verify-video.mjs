// Checks the finished video against the script: pulls a frame from the middle of every spoken line
// so each one can be compared with what should be on screen at that moment.
//
//   node scripts/verify-video.mjs [video.mp4]
//
// Writes out/video/verify/NN-<scene>.png and a checklist (out/video/verify/CHECKLIST.md).
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";

const FFMPEG = process.env.FFMPEG ?? "C:/Users/HaoLu/AppData/Local/Programs/Stremio/ffmpeg.exe";
const video = process.argv[2] ?? `${process.env.USERPROFILE}/Downloads/StreamLink-demo.mp4`;
const DIR = "out/video/verify";
rmSync(DIR, { recursive: true, force: true });
mkdirSync(DIR, { recursive: true });

const { timings, duration } = JSON.parse(readFileSync("out/video/timings.json", "utf8"));
const log = JSON.parse(readFileSync("out/video/record-log.json", "utf8"));

/** What the frame at each line should show; checked by eye against the still. */
const EXPECT = {
  1: "Coimbra board, summary stats highlighted",
  2: "board, 'days since the lab last visited' highlighted",
  3: "board, ranked list",
  4: "board, a list row highlighted and its map dot",
  5: "board with five demo checks loaded",
  6: "phone-width check-in at Mina Hospital, step 'The channel'",
  7: "check-in with the example answers filled in",
  8: "check-in step 'The water', sewage question highlighted",
  9: "check-in step 'How it feels', emotion sliders",
  10: "'Good' selected in the overall rating",
  11: "Review screen",
  12: "Review screen with the good-but-sewage flag highlighted",
  13: "rating changed to Poor, back on Review",
  14: "the photo flag being confirmed",
  15: "trust bar highlighted",
  16: "confirmation screen after sending",
  17: "full-width stream record, three pillars highlighted",
  18: "record after verification (status final)",
  19: "lab visit requested, reasons in the timeline",
  20: "lab result recorded (simulated)",
  21: "Messages: 'your report led to a lab visit'",
  22: "Settings, the sandbox option selected",
  23: "record read from the OAH sandbox, live pill visible",
  24: "raw FHIR JSON on the OAH server showing two profiles",
  25: "About page, validator panel",
  26: "Singapore board, 'no lab data' banner",
  27: "About page, what the evaluation supports",
  28: "About page, model caveats",
  29: "GitHub repository page",
};

for (const t of timings) {
  // Sample just after the line begins: the next line's screen actions start before it ends.
  const mid = Math.min(t.start + 1.2, duration - 0.5);
  spawnSync(FFMPEG, ["-hide_banner", "-y", "-ss", String(mid), "-i", video, "-frames:v", "1", "-q:v", "3", `${DIR}/${String(t.n).padStart(2, "0")}.png`], { encoding: "utf8" });
}

const rows = timings.map((t) => {
  const rec = log.lines.find((l) => l.n === t.n);
  return `| ${t.n} | ${t.start.toFixed(1)}s | ${rec?.drift ?? "-"} | ${EXPECT[t.n] ?? ""} | ${t.text.slice(0, 70)}… |`;
});
writeFileSync(`${DIR}/CHECKLIST.md`, `# Frame-by-frame check\n\nOne still from the middle of each spoken line (${DIR}/NN.png).\n\n| # | audio time | drift (s) | what should be on screen | line |\n|---|---|---|---|---|\n${rows.join("\n")}\n`);

const drifts = log.lines.map((l) => l.drift).filter((d) => d !== null).map(Math.abs);
console.log(`frames written to ${DIR}`);
if (drifts.length) console.log(`drift vs voice-over: worst ${Math.max(...drifts).toFixed(2)}s, average ${(drifts.reduce((a, b) => a + b, 0) / drifts.length).toFixed(2)}s`);
