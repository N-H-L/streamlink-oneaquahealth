// Builds the recording guide (docs/hackathon/VIDEO-GUIDE.md) from the same script the recorder
// runs, so the words, the actions and the timings can never drift apart.
//
//   node scripts/make-guide.mjs
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { LINES } from "./demo-lines.mjs";

const timings = existsSync("out/video/timings.json")
  ? JSON.parse(readFileSync("out/video/timings.json", "utf8")).timings
  : null;

const clock = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;

const out = [
  "# Recording guide — say this, then do this",
  "",
  "Every step is one thing to say and one thing to do. Do the action **while** you say the line, or",
  "just before it; never in silence between lines.",
  "",
  timings
    ? "The times are where each line falls in the voice-over already recorded (`video 2 project Audio file.m4a`). They are a guide, not a stopwatch."
    : "Times appear here once a voice-over has been aligned with `node scripts/align-audio.mjs`.",
  "",
  "## Before you start",
  "",
  "1. `npm run dev`, then open http://localhost:5173",
  "2. Click the **Demo store** pill → **Reset demo store** → **Yes, clear it**",
  "3. Back on **Board**: click **Hide tour**; set the role switch to **Coordinator**",
  "4. Browser zoom 110% (Ctrl +), full screen (F11), notifications off",
  "5. Open a second tab on the organizers' server:",
  "   `https://sandbox.hl7europe.eu/oneaquahealth/fhir/Observation?_tag=https%3A%2F%2Fn-h-l.github.io%2Fstreamlink-oneaquahealth%2Ffhir%2FCodeSystem%2Fstreamlink-tags%7Cdemo&_count=3&_pretty=true`",
  "6. Record with **Win + Alt + R** (microphone on)",
  "",
  "---",
  "",
];

let scene = "";
LINES.forEach((line, i) => {
  if (line.scene !== scene) {
    scene = line.scene;
    out.push(`\n## ${scene.replace(" · ", " — ")}\n`);
  }
  const t = timings?.[i];
  out.push(`**${i + 1}.${t ? ` (${clock(t.start)})` : ""} SAY:** “${line.text}”`);
  out.push("");
  out.push(`  **DO:** ${line.do ?? "—"}`);
  out.push("");
});

out.push("---", "", "## Three rules while you talk", "",
  "- The lab result is labelled **simulated** on screen. Never call it real.",
  "- Say “**proposed** extension”, never “official extension”.",
  "- Never say the map score predicts pollution. It says *where to look first*.",
  "", "## When you are done", "",
  "- [ ] Length between 3:00 and 5:00",
  "- [ ] Voice clear, on-screen text readable",
  "- [ ] Uploaded (YouTube, Unlisted is fine); link checked in a private window",
  "- [ ] Link added to the Devpost entry and to `README.md`",
  "");

writeFileSync("docs/hackathon/VIDEO-GUIDE.md", out.join("\n"));
console.log(`docs/hackathon/VIDEO-GUIDE.md — ${LINES.length} steps${timings ? ", timed to the recorded voice-over" : ""}`);
