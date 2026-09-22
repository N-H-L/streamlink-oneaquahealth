import { useState } from "react";
import { go, useApp } from "../state";

const STEPS = [
  { title: "See the problem", text: "The Coimbra board: the lab last visited a typical stream over 1,100 days ago. Load the demo scenario to add synthetic volunteer checks.", path: "/board/CO", role: "coordinator" as const },
  { title: "Be a volunteer", text: "Check Mina Hospital (C5). Tap “Fill with an example”, click Next three times, rate it “Good”, then Review: a trust flag appears. Fix it and send.", path: "/check/C5", role: "volunteer" as const },
  { title: "Be the coordinator", text: "Open C5's record. Verify the check (it becomes official OAH-profile data), request a lab visit, then record the (simulated) lab result.", path: "/site/C5", role: "coordinator" as const },
  { title: "Close the loop", text: "The volunteer's messages now say their report led to a lab visit.", path: "/inbox", role: "volunteer" as const },
  { title: "Check the proof", text: "Open any “FHIR R4” panel to see the exact records. About explains the standards, the map model's evaluation and what is simulated.", path: "/about", role: "coordinator" as const },
];

export function Tour() {
  const app = useApp();
  const [open, setOpen] = useState(!app.tourDone);
  const [i, setI] = useState(0);
  if (!open) {
    return <button className="tour-fab" onClick={() => setOpen(true)} aria-label="Open the 2-minute tour">2-minute tour</button>;
  }
  const s = STEPS[i];
  return (
    <aside className="tour" aria-label="Guided tour">
      <div className="tour-head">
        <b>Tour {i + 1}/{STEPS.length}: {s.title}</b>
        <button className="link" onClick={() => { setOpen(false); app.update({ tourDone: true }); }} aria-label="Close tour">Close</button>
      </div>
      <p className="small">{s.text}</p>
      <div className="row">
        <button className="btn small" onClick={() => { app.update({ role: s.role }); go(s.path); }}>Take me there</button>
        {i > 0 && <button className="btn ghost small" onClick={() => setI(i - 1)}>Back</button>}
        {i < STEPS.length - 1 ? <button className="btn ghost small" onClick={() => setI(i + 1)}>Next step</button> : <button className="btn ghost small" onClick={() => { setOpen(false); app.update({ tourDone: true }); }}>Done</button>}
      </div>
    </aside>
  );
}
