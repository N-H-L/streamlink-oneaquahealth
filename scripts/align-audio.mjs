// Works out when each scripted line starts inside a recorded voice-over, so the screen recording
// can be driven in time with it.
//
//   node scripts/align-audio.mjs "<path to audio>"
//
// Method: find the silences, build the speech timeline, spread the script's expected line lengths
// across the speech (not the silence), then snap each boundary to a real pause when one is close.
// Writes out/video/timings.json and prints a table for checking.
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { LINES } from "./demo-lines.mjs";

const FFMPEG = process.env.FFMPEG ?? "C:/Users/HaoLu/AppData/Local/Programs/Stremio/ffmpeg.exe";
const audio = process.argv[2] ?? `${process.env.USERPROFILE}/Downloads/video 2 project Audio file.m4a`;
const SNAP_WINDOW = 2.2; // seconds: how far a boundary may move to land in a real pause

// ffmpeg writes its analysis to stderr, so both streams are needed.
const probe = spawnSync(FFMPEG, ["-hide_banner", "-i", audio, "-af", "silencedetect=noise=-31dB:d=0.45", "-f", "null", "-"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
const log = `${probe.stdout ?? ""}${probe.stderr ?? ""}`;
if (!log.includes("Duration")) {
  console.error("ffmpeg produced no analysis. Is the path right?", log.slice(0, 400));
  process.exit(1);
}
const duration = (() => {
  const m = log.match(/Duration: (\d+):(\d+):([\d.]+)/);
  return m ? +m[1] * 3600 + +m[2] * 60 + +m[3] : 0;
})();
const starts = [...log.matchAll(/silence_start: ([\d.]+)/g)].map((m) => +m[1]);
const ends = [...log.matchAll(/silence_end: ([\d.]+)/g)].map((m) => +m[1]);
const gaps = starts.map((s, i) => ({ start: s, end: ends[i] ?? duration })).filter((g) => g.end > g.start);

// Speech intervals = everything that is not a gap.
const speech = [];
let cursor = 0;
for (const g of gaps) {
  if (g.start - cursor > 0.15) speech.push({ start: cursor, end: g.start });
  cursor = g.end;
}
if (duration - cursor > 0.15) speech.push({ start: cursor, end: duration });
const speechTotal = speech.reduce((s, x) => s + (x.end - x.start), 0);

/** Convert "n seconds into the speech" back to a wall-clock time in the audio. */
function speechTimeToClock(t) {
  let acc = 0;
  for (const s of speech) {
    const len = s.end - s.start;
    if (acc + len >= t) return s.start + (t - acc);
    acc += len;
  }
  return speech.at(-1).end;
}

const weight = (text) => text.split(/\s+/).length; // spoken length is ~proportional to word count
const totalWeight = LINES.reduce((s, l) => s + weight(l.text), 0);

// Boundary before each line, in speech-time, then mapped to the clock and snapped to a real pause.
let acc = 0;
const timings = LINES.map((l, i) => {
  const startSpeech = (acc / totalWeight) * speechTotal;
  acc += weight(l.text);
  const endSpeech = (acc / totalWeight) * speechTotal;
  let start = i === 0 ? speech[0].start : speechTimeToClock(startSpeech);
  let snapped = null;
  if (i > 0) {
    const near = gaps
      .map((g) => ({ g, mid: (g.start + g.end) / 2 }))
      .filter((x) => Math.abs(x.mid - start) <= SNAP_WINDOW)
      .sort((a, b) => Math.abs(a.mid - start) - Math.abs(b.mid - start))[0];
    if (near) {
      snapped = Math.round((near.g.end - start) * 100) / 100;
      start = near.g.end - 0.15; // start just as the speech resumes
    }
  }
  return { n: i + 1, scene: l.scene, start: Math.round(start * 100) / 100, endEstimate: Math.round(speechTimeToClock(endSpeech) * 100) / 100, snapped, text: l.text };
});

mkdirSync("out/video", { recursive: true });
writeFileSync("out/video/timings.json", JSON.stringify({ audio, duration, speechTotal: Math.round(speechTotal * 10) / 10, gaps: gaps.length, timings }, null, 2));

console.log(`audio ${duration.toFixed(1)}s · speech ${speechTotal.toFixed(1)}s · ${gaps.length} pauses · ${LINES.length} lines`);
for (const t of timings) {
  const len = (t.endEstimate - t.start).toFixed(1);
  console.log(`${String(t.n).padStart(2)} ${String(t.start.toFixed(1)).padStart(6)}s (+${len}s)${t.snapped !== null ? " snap" : "     "}  ${t.text.slice(0, 62)}`);
}
