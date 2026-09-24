import { useEffect, useState } from "react";
import type { Resource } from "../../core/fhir";
import { volunteerInbox } from "../../core/workflow";
import { catalogue, model, validation } from "../data";
import { OAH_SANDBOX_URL, SANDBOX_REACHABLE_FROM_BROWSER, go, useApp, type Mode } from "../state";

export function Inbox() {
  const app = useApp();
  const [msgs, setMsgs] = useState<Resource[] | null>(null);
  useEffect(() => {
    volunteerInbox(app.store, app.volunteerId).then(setMsgs).catch(() => setMsgs([]));
  }, [app.store, app.version, app.volunteerId]);
  return (
    <div className="page narrow">
      <h1>My messages</h1>
      <p className="muted">You are volunteer <span className="code">{app.volunteerId}</span>, a random pseudonym stored only on this device.</p>
      {msgs === null && <p className="muted">Loading…</p>}
      {msgs?.length === 0 && <p className="notice">No messages yet. When a lab visit follows one of your reports, you'll be told here.</p>}
      <ul className="inbox">
        {msgs?.map((m) => (
          <li key={m.id} className="card">
            <span className="muted small">{String(m.sent).slice(0, 10)}</span>
            <p>{m.payload?.[0]?.contentString}</p>
          </li>
        ))}
      </ul>
      <button className="btn" onClick={() => go("/check")}>Check a stream</button>
    </div>
  );
}

export function Settings() {
  const app = useApp();
  const [confirming, setConfirming] = useState(false);
  const setMode = (mode: Mode) => app.update({ mode });
  return (
    <div className="page narrow">
      <h1>Settings</h1>
      <section className="card">
        <h2>Where records are stored</h2>
        <label className="radio">
          <input type="radio" name="mode" checked={app.mode === "local"} onChange={() => setMode("local")} />
          <span><b>Demo store in this browser</b> (default). Works offline; nothing leaves your device. It is not a FHIR server, but a small stand-in that behaves like one for StreamLink's requests.</span>
        </label>
        <label className="radio">
          <input type="radio" name="mode" checked={app.mode === "oah"} onChange={() => setMode("oah")} />
          <span>
            <b>Official OneAquaHealth FHIR sandbox</b> (HL7 Europe, public test server). Records are written live to <span className="code">{OAH_SANDBOX_URL}</span>, where anyone can read them. Only demo data, tagged <span className="code">demo</span>.
            {!SANDBOX_REACHABLE_FROM_BROWSER && (
              <><br /><b>Not available in this hosted build:</b> that server answers browser preflight requests with two conflicting <span className="code">Access-Control-Allow-Origin</span> headers, so browsers refuse the connection from any other site. It works from a server-side client: StreamLink's own records were written to it and read back with <span className="code">npm run sandbox</span> (see the repository's EVIDENCE.md), and running the app locally with <span className="code">npm run dev</span> proxies it.</>
            )}
          </span>
        </label>
      </section>
      <section className="card">
        <h2>Demo data</h2>
        <p className="muted small">Clear everything StreamLink stored in this browser's demo store. The sandbox is not affected.</p>
        {!confirming ? (
          <button className="btn ghost" onClick={() => setConfirming(true)}>Reset demo store</button>
        ) : (
          <span className="row">
            <button className="btn danger" onClick={() => { app.localStore.reset(); app.refresh(); setConfirming(false); app.toast("Demo store cleared."); }}>Yes, clear it</button>
            <button className="btn ghost" onClick={() => setConfirming(false)}>Cancel</button>
          </span>
        )}
      </section>
      <section className="card">
        <h2>Your pseudonym</h2>
        <p className="muted small">Volunteers are identified only by a random code: <span className="code">{app.volunteerId}</span></p>
        <button className="btn ghost" onClick={() => app.update({ volunteerId: `vol-${Math.random().toString(36).slice(2, 8)}` })}>Generate a new one</button>
      </section>
    </div>
  );
}

export function About() {
  return (
    <div className="page narrow prose">
      <h1>About StreamLink</h1>
      <p className="lead">A shared One Health record for every urban stream. Maps say where to look first, volunteers report what maps and rare lab visits miss, and the lab confirms.</p>

      <h2>Why</h2>
      <p>Each of the 96 OneAquaHealth lab sites in Coimbra, Ghent, Toulouse, Benevento and Oslo has one lab health-risk campaign on record; 95 of them are from 2023. Lab campaigns are expensive, so the health picture of these streams ages fast. Volunteer reports exist, but they sit outside health-data systems, their reliability is unknown, and nothing follows from them.</p>

      <h2>How a record works</h2>
      <ol>
        <li><b>Check-in.</b> The same questions as the OneAquaHealth Citizen Science App, as pictures. Stored as FHIR with status <i>preliminary</i>.</li>
        <li><b>Trust.</b> Plain-language consistency checks; volunteers fix or confirm; the result is stored in a FHIR Provenance resource.</li>
        <li><b>Verification.</b> An expert confirms: observations become <i>final</i> and then also conform to the official OneAquaHealth indicator profile.</li>
        <li><b>Referral.</b> The city ranks streams by fresh reports, last lab result, map context and data age, and requests a lab visit (FHIR ServiceRequest) with its reasons.</li>
        <li><b>Result and feedback.</b> The lab result closes the request; volunteers receive a FHIR Communication: "your report led to a lab visit".</li>
      </ol>

      <h2>Standards</h2>
      <p>Records follow HL7 FHIR R4 and the OneAquaHealth FHIR Implementation Guide (hl7-eu/oah). StreamLink adds a proposed extension for citizen checks: a Questionnaire mirroring the OAH app, 9 profiles, 2 extensions, code systems, value sets and a concept map to OAH indicator codes. Every record type the app writes is checked with the official HL7 validator.</p>
      {validation && (
        <div className={`proof ${validation.result === "PASS" ? "pass" : "fail"}`}>
          <b>{validation.result === "PASS" ? "✓ Validation passed" : "Validation failed"}</b>: {validation.validator}, against the OAH IG + StreamLink IG
          <ul>
            <li>{validation.igResources.files + validation.engineOutputs.files} files, <b>{validation.igResources.errors + validation.engineOutputs.errors} errors</b>: IG definitions and examples, 12 transactions produced by this app's own code (check-in, verification, referral, lab result), and every resource stored after a full lifecycle</li>
            <li>Negative tests: {validation.negativeTests.failedAsExpected}/{validation.negativeTests.files} deliberately broken records rejected, as expected</li>
            <li className="muted small">Run {String(validation.generated).slice(0, 16).replace("T", " ")} UTC · terminology {validation.terminology} · reproduce with <span className="code">npm run validate</span></li>
          </ul>
        </div>
      )}

      <h2>The map-context baseline</h2>
      {model ? (
        <>
          <p>{model.headline}</p>
          <div className="proof scope">
            <b>What the evaluation supports — and what it does not</b>
            <ul>
              <li><b>Yes:</b> ranking the streams of one city. {model.validated?.statement}</li>
              <li><b>No:</b> comparing scores between cities, or reading a score as a risk level.</li>
              <li>A richer three-feature model was tried first and did <b>worse than chance</b> on a held-out city, so it is not used. It is kept in the model card as a negative result.</li>
            </ul>
          </div>
          <p className="muted small">How it is used here: the map factor in the ranking is this site's percentile <i>within its own city</i>, and fresh volunteer reports and lab results outweigh it.</p>
          <details>
            <summary>All caveats ({model.caveats?.length ?? 0}) and the model card</summary>
            <ul className="small">{(model.caveats ?? []).map((c: string) => <li key={c}>{c}</li>)}</ul>
            <p className="muted small">Full model card: <span className="code">data/baseline/model-v1.json</span> (version {model.version}); method and per-city results: <span className="code">analysis/REPORT.md</span>.</p>
          </details>
        </>
      ) : (
        <p className="notice">The map-context baseline is still being computed for this build, so the ranking treats "map context" as unknown (0.5) and says so on every stream. Method, features and evaluation plan: <span className="code">analysis/</span> in the repository.</p>
      )}

      <h2>What is real and what is simulated</h2>
      <ul>
        <li>Real: OneAquaHealth site list and lab health-risk scores (Resilience Map snapshot), map features, FHIR resources and their validation, the workflow.</li>
        <li>Synthetic: the demo scenario's volunteer checks, and every lab <i>result</i> recorded in the app (tagged <span className="code">simulated</span>).</li>
        <li>Not claimed: that trust rules or the baseline predict contamination on new data beyond the evaluation shown.</li>
        <li>No biological indicator (macroinvertebrates, diatoms): the OneAquaHealth citizen form has none. Those come from the professional protocol and the lab, which is what a lab visit request asks for.</li>
      </ul>

      <h2>Data sources</h2>
      <ul>
        <li>OneAquaHealth Resilience Map (sites, lab health-risk), © OneAquaHealth, EU Horizon Europe.</li>
        <li>OneAquaHealth FHIR IG and sandbox, HL7 Europe.</li>
        <li>OpenStreetMap contributors (map features and base map).</li>
      </ul>
      <p className="muted small">{catalogue.sites.length} sites in {catalogue.cities.length} cities in this build.</p>
    </div>
  );
}
