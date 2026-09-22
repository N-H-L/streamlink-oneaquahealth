import { useEffect, useState } from "react";
import { freshnessLabel, latestLabResult, loadSiteRecord, type SiteRecord } from "../../core/record";
import { explain, prioritise } from "../../core/triage";
import { createReferral, recordSimulatedLabResult, verifyCheck } from "../../core/workflow";
import { FhirJson } from "../components/FhirJson";
import { SiteMap, priorityColor } from "../components/SiteMap";
import { siteByCode } from "../data";
import { go, useApp } from "../state";

export function SiteRecordView({ code }: { code: string }) {
  const app = useApp();
  const site = siteByCode(code);
  const [rec, setRec] = useState<SiteRecord | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [coliforms, setColiforms] = useState(2400);

  useEffect(() => {
    if (!site) return;
    let live = true;
    setErr(null);
    loadSiteRecord(app.store, site).then((r) => live && setRec(r)).catch((e) => live && setErr(e.message));
    return () => {
      live = false;
    };
  }, [app.store, app.version, code]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!site) return <div className="page"><p>Unknown site {code}.</p></div>;

  async function act(label: string, fn: () => Promise<unknown>, done: string) {
    setBusy(label);
    try {
      await fn();
      app.refresh();
      app.toast(done);
    } catch (e: any) {
      app.toast(e.message, "error");
    } finally {
      setBusy(null);
    }
  }

  const latest = rec?.checks[0];
  const openRef = rec?.referrals.find((r) => r.status === "active");
  const p = rec ? prioritise(site, rec.checks, !!openRef, app.weights, new Date(), latestLabResult(rec)) : null;
  const coordinator = app.role === "coordinator";

  return (
    <div className="page">
      <button className="link back" onClick={() => go(`/board/${site.city}`)}>← {site.cityName} board</button>
      <div className="record-head">
        <div>
          <div className="eyebrow">One Health record · {site.cityName}</div>
          <h1>{site.name} <span className="code">{site.code}</span></h1>
          <p className="muted">
            {site.lab ? `Last OneAquaHealth lab campaign: ${site.lab.date}` : "Never lab-sampled"} ·{" "}
            {rec ? `${rec.checks.length} volunteer check${rec.checks.length === 1 ? "" : "s"}` : "loading…"}
          </p>
        </div>
        <div className="row">
          <button className="btn" onClick={() => go(`/check/${site.code}`)}>Check this stream</button>
        </div>
      </div>
      {err && <p className="notice notice-error" role="alert">Could not load this record from {app.store.label}: {err}</p>}

      <div className="record-grid">
        <div className="pillars">
          {(rec?.pillars ?? []).map((pl) => (
            <section key={pl.id} className={`pillar pillar-${pl.id}`} aria-labelledby={`pl-${pl.id}`}>
              <header>
                <h2 id={`pl-${pl.id}`}>{pl.title}</h2>
                <span className="fresh">{freshnessLabel(pl.newest)}</span>
              </header>
              <ul>
                {pl.items.map((i) => (
                  <li key={i.label} className={`tone-${i.tone}`}>
                    <span className="item-label">{i.label}</span>
                    <span className="item-value">{i.value}</span>
                    {i.source && <span className="item-source">{i.source}{i.when ? ` · ${i.when.slice(0, 10)}` : ""}</span>}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <aside className="side">
          <SiteMap center={[site.lat, site.lon]} zoom={15} points={[{ code: site.code, name: site.name, lat: site.lat, lon: site.lon, score: p?.score ?? null, highlight: true }]} height={200} />
          {p && (
            <section className="card" aria-labelledby="prio">
              <h2 id="prio">Lab visit priority <span className="prio" style={{ background: priorityColor(p.score) }}>{Math.round(p.score * 100)}</span></h2>
              <ul className="factors">
                {p.factors.map((f) => (
                  <li key={f.key}>
                    <span className="f-head"><b>{f.label}</b><span>{Math.round(f.value * 100)}</span></span>
                    <span className="bar"><span style={{ width: `${f.value * 100}%` }} /></span>
                    <span className="muted small">{f.reason}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {rec && coordinator && (
            <section className="card actions" aria-labelledby="act">
              <h2 id="act">Coordinator actions</h2>
              {latest && latest.status !== "final" ? (
                <div className="action">
                  <p><b>Newest check is not yet verified.</b> Trust {latest.trust !== null ? `${Math.round(latest.trust * 100)}%` : "n/a"}{latest.flags.length ? `: ${latest.flags.map((f) => f.message).join(" ")}` : ""}</p>
                  <button className="btn" disabled={!!busy} onClick={() => act("verify", () => verifyCheck(app.store, rec, latest.qr.id!, "Reviewed in StreamLink"), "Verified. The observations are now final and conform to the OAH indicator profile.")}>
                    {busy === "verify" ? "Verifying…" : "Verify check"}
                  </button>
                </div>
              ) : latest ? (
                <p className="muted small">Newest check verified.</p>
              ) : (
                <p className="muted small">No volunteer checks to verify yet.</p>
              )}

              {!openRef ? (
                <div className="action">
                  <p>Request a lab visit. The request records why, in the words below.</p>
                  {p && <p className="explain">{explain(p, app.weights)}</p>}
                  <button className="btn" disabled={!!busy} onClick={() => act("refer", () => createReferral(app.store, rec, app.weights), "Lab visit requested (FHIR ServiceRequest created).")}>
                    {busy === "refer" ? "Requesting…" : "Request lab visit"}
                  </button>
                </div>
              ) : (
                <div className="action">
                  <p><b>Lab visit requested</b> on {String(openRef.authoredOn).slice(0, 10)}. When the lab reports, the request is closed and volunteers are told.</p>
                  <label className="inline">
                    Coliforms (CFU/100 mL)
                    <input className="input small" type="number" min={0} value={coliforms} onChange={(e) => setColiforms(Number(e.target.value))} />
                  </label>
                  <button className="btn" disabled={!!busy} onClick={() => act("lab", () => recordSimulatedLabResult(app.store, rec, openRef.id!, coliforms), "Lab result recorded (simulated). Volunteers were notified.")}>
                    {busy === "lab" ? "Saving…" : "Record lab result (simulated)"}
                  </button>
                  <p className="muted small">Simulated for this prototype: the result is tagged "simulated" in FHIR.</p>
                </div>
              )}
            </section>
          )}
          {!coordinator && <p className="muted small">Switch to the coordinator view (top right) to verify checks and request lab visits.</p>}
        </aside>
      </div>

      <section aria-labelledby="tl">
        <h2 id="tl">Timeline</h2>
        <ol className="timeline">
          {(rec?.timeline ?? []).map((t, i) => (
            <li key={i} className={`tl tl-${t.kind}`}>
              <span className="tl-when">{t.when.slice(0, 10)}</span>
              <span className="tl-body">
                <b>{t.title}</b>
                {t.status && <span className={`badge ${t.status === "final" || t.status === "completed" ? "b-ok" : t.status === "active" ? "b-info" : "b-warn"}`}>{t.status}</span>}
                {t.detail && <span className="muted small tl-detail">{t.detail}</span>}
              </span>
            </li>
          ))}
        </ol>
        {rec && rec.checks.length + rec.referrals.length + rec.labResults.length > 0 && (
          <FhirJson title="This record as stored (FHIR resources)" data={[...rec.checks.flatMap((c) => [c.qr, ...c.observations, ...(c.wellbeing ? [c.wellbeing] : []), ...(c.provenance ? [c.provenance] : [])]), ...rec.referrals, ...rec.labResults]} />
        )}
      </section>
    </div>
  );
}
