// Combines the silent screen recording with the recorded voice-over into an MP4 that plays
// anywhere (H.264 + AAC, faststart), and writes a subtitle file alongside it.
//
//   node scripts/make-video.mjs [video.webm] [audio.m4a] [outdir]
//
// Defaults: the newest out/video/clean-*.webm, the voice-over in Downloads, output to Downloads.
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";

const FFMPEG = process.env.FFMPEG ?? "C:/Users/HaoLu/AppData/Local/Programs/Stremio/ffmpeg.exe";
const OUT = "out/video";
// Newest by modification time: file names sort unhelpfully.
const newest = (prefix) =>
  readdirSync(OUT)
    .filter((f) => f.startsWith(prefix) && f.endsWith(".webm"))
    .map((f) => ({ f, t: statSync(`${OUT}/${f}`).mtimeMs }))
    .sort((a, b) => a.t - b.t)
    .at(-1)?.f;

const video = process.argv[2] ?? `${OUT}/${newest("clean-") ?? newest("demo-")}`;
const audio = process.argv[3] ?? `${process.env.USERPROFILE}/Downloads/video 2 project Audio file.m4a`;
const outDir = process.argv[4] ?? `${process.env.USERPROFILE}/Downloads`;
const mp4 = `${outDir}/StreamLink-demo.mp4`;
const srt = `${outDir}/StreamLink-demo.srt`;

// The recording begins while the app is being set up; trim that off so the first line of the
// voice-over lands on the first scene.
const recLog = JSON.parse(readFileSync(`${OUT}/record-log.json`, "utf8"));
const offset = recLog.videoOffset ?? 0;

const run = (args) => {
  const r = spawnSync(FFMPEG, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  return `${r.stdout ?? ""}${r.stderr ?? ""}`;
};

console.log(`video: ${video}\naudio: ${audio}\n→ ${mp4}`);

// -shortest would cut whichever ends first; the recorder already pads the video past the audio.
// Screen recording can end a moment before the voice-over does, so hold the last frame and cut to
// the length of the audio instead of truncating the final sentence.
const { duration: audioDuration } = JSON.parse(readFileSync(`${OUT}/timings.json`, "utf8"));
const runLength = Math.round((audioDuration + 1.2) * 100) / 100;
const log = run([
  "-y",
  "-ss", String(offset), "-i", video,
  "-i", audio,
  "-map", "0:v:0", "-map", "1:a:0",
  "-vf", "tpad=stop_mode=clone:stop_duration=15",
  "-c:v", "libx264", "-preset", "medium", "-crf", "21", "-pix_fmt", "yuv420p", "-r", "25",
  "-c:a", "aac", "-b:a", "192k",
  "-movflags", "+faststart",
  "-t", String(runLength),
  mp4,
]);
const dur = log.match(/time=(\d+):(\d+):([\d.]+)/g)?.at(-1);
if (!log.includes("video:") && !dur) {
  console.error(log.slice(-1200));
  process.exit(1);
}

// Subtitles from the aligned timings, so the words can be turned on in a player or on YouTube.
const { timings, duration } = JSON.parse(readFileSync(`${OUT}/timings.json`, "utf8")); // for the subtitles
const stamp = (t) => {
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = Math.floor(t % 60), ms = Math.round((t % 1) * 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
};
writeFileSync(srt, timings.map((t, i) => {
  const end = Math.min(timings[i + 1]?.start ?? duration, t.start + 12);
  return `${i + 1}\n${stamp(t.start)} --> ${stamp(end)}\n${t.text}\n`;
}).join("\n"));

const probe = run(["-hide_banner", "-i", mp4]);
console.log(probe.split("\n").filter((l) => /Duration|Stream #/.test(l)).join("\n"));
console.log(`subtitles: ${srt}`);
