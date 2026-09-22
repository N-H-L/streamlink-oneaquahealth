import { useEffect, useMemo, useState } from "react";
import { latestLabResult, loadRecords, type SiteRecord } from "../../core/record";
import { daysBetween } from "../../core/sites";
import { DEFAULT_WEIGHTS, prioritise, type Priority, type Weights } from "../../core/triage";
import { SiteMap, priorityColor } from "../components/SiteMap";
import { catalogue, cityById, sitesOf } from "../data";
import { loadDemoScenario } from "../demo";
import { go, useApp } from "../state";

export function Board({ cityId }: { cityId: string }) {
  const app = useApp();
  const city = cityById(cityId) ?? catalogue.cities[0];
  const sites = useMemo(() => sitesOf(city.id), [city.id]);
  const [records, setRecords] = useState<Map<string, SiteRecord> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showWeights, setShowWeights] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    setRecords(null);
    setError(null);
    loadRecords(app.store, sites)
      .then((r) => live && setRecords(r))
      .catch((e) => live && setError(e.message));
    return () => {
      live = false;
    };
  }, [app.store, app.version, sites]);

  const now = new Date();
  const ranked: Priority[] = useMemo(() => {
    if (!records) return [];
    return sites
      .map((s) => {
        const r = records.get(s.code)!;
        const open = r.referrals.some((x) => x.status === "active");
        return prioritise(s, r.checks, open, app.weights, now, latestLabResult(r));
      })
      .sort((a, b) => b.score - a.score);
  }, [records, sites, app.weights]); // eslint-disable-line react-hooks/exhaustive-deps

  const labAges = sites.filter((s) => s.lab).map((s) => daysBetween(s.lab!.date, now)).sort((a, b) => a - b);
  const medianAge = labAges.length ? labAges[Math.floor(labAges.length / 2)] : null;
  const recentChecks = records ? [...records.values()].flatMap((r) => r.checks).filter((c) => daysBetween(c.authored, now) <= 30).length : 0;
  const openRefs = records ? [...records.values()].flatMap((r) => r.referrals).filter((r) => r.status === "active").length : 0;
  const anyChecks = records ? [...records.values()].some((r) => r.checks.length > 0) : true;

  async function seed() {
    setBusy(true);
    try {
      await loadDemoScenario(app.store);
      app.refresh();
      app.toast("Demo scenario loaded: 5 synthetic volunteer checks in Coimbra.");
    } catch (e: any) {
      app.toast(e.message, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <div className="city-tabs" role="tablist" aria-label="City">
        {catalogue.cities.map((c) => (
          <button key={c.id} role="tab" aria-selected={c.id === city.id} className={c.id === city.id ? "tab active" : "tab"} onClick={() => go(`/board/${c.id}`)}>
            {c.name}
            {!c.hasLabData && <span className="tab-badge">new</span>}
          </button>
        ))}
      </div>

      <section className="stats" aria-label="Summary">
        <div className="stat">
          <div className="stat-value">{medianAge !== null ? `${medianAge} days` : "No lab data"}</div>
          <div className="stat-label">{medianAge !== null ? "since the lab last visited a typical stream here" : "this city has never been lab-sampled: map baseline only"}</div>
        </div>
        <div className="stat">
          <div className="stat-value">{records ? recentChecks : "…"}</div>
          <div className="stat-label">volunteer checks in the last 30 days</div>
        </div>
        <div className="stat">
          <div className="stat-value">{records ? openRefs : "…"}</div>
          <div className="stat-label">open lab visit requests</div>
        </div>
      </section>

      {city.note && <p className="notice">{city.note}</p>}
      {records && !anyChecks && app.store.kind === "local" && city.id === "CO" && (
        <div className="notice notice-action">
          <span>No volunteer checks yet. Load a demo scenario with 5 synthetic checks in Coimbra, or do your own check.</span>
          <button className="btn" onClick={seed} disabled={busy}>{busy ? "Loading…" : "Load demo scenario"}</button>
        </div>
      )}
      {error && <p className="notice notice-error" role="alert">Could not load records from {app.store.label}: {error}</p>}

      <div className="board">
        <div className="board-map">
          <SiteMap
            center={[city.lat, city.lon]}
            zoom={city.zoom ?? 12}
            points={sites.map((s) => {
              const p = ranked.find((x) => x.site.code === s.code);
              return { code: s.code, name: s.name, lat: s.lat, lon: s.lon, score: p ? p.score : null, label: p ? `priority ${Math.round(p.score * 100)}` : undefined };
            })}
            onSelect={(code) => go(`/site/${code}`)}
            height={460}
          />
          <p className="legend">
            <span><i style={{ background: priorityColor(0.7) }} /> visit soon</span>
            <span><i style={{ background: priorityColor(0.5) }} /> elevated</span>
            <span><i style={{ background: priorityColor(0.35) }} /> watch</span>
            <span><i style={{ background: priorityColor(0.1) }} /> low</span>
          </p>
        </div>

        <section className="board-list" aria-labelledby="needs-lab">
          <div className="section-head">
            <h2 id="needs-lab">Needs a lab visit</h2>
            <button className="link" onClick={() => setShowWeights((v) => !v)} aria-expanded={showWeights}>
              {showWeights ? "Hide" : "How is this ranked?"}
            </button>
          </div>
          {showWeights && <WeightsPanel />}
          {!records && !error && <p className="muted">Loading records from {app.store.label}…</p>}
          <ol className="rank">
            {ranked.slice(0, 12).map((p, i) => {
              const r = records!.get(p.site.code)!;
              const latest = r.checks[0];
              return (
                <li key={p.site.code}>
                  <button className="rank-row" onClick={() => go(`/site/${p.site.code}`)}>
                    <span className="rank-n">{i + 1}</span>
                    <span className="rank-main">
                      <span className="rank-name">{p.site.name} <span className="code">{p.site.code}</span></span>
                      <span className="rank-reason">{p.topReason}</span>
                      <span className="badges">
                        {latest && daysBetween(latest.authored, now) <= 14 && <span className={`badge ${latest.status === "final" ? "b-ok" : "b-warn"}`}>{latest.status === "final" ? "verified report" : "new report"}</span>}
                        {p.openReferral && <span className="badge b-info">lab visit requested</span>}
                        {r.labResults.length > 0 && <span className="badge b-muted">lab result in</span>}
                      </span>
                    </span>
                    <span className="rank-score" aria-label={`priority ${Math.round(p.score * 100)} out of 100`}>
                      <span className="bar"><span style={{ width: `${Math.round(p.score * 100)}%`, background: priorityColor(p.score) }} /></span>
                      {Math.round(p.score * 100)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </section>
      </div>
    </div>
  );
}

const LABELS: Record<keyof Weights, { title: string; help: string }> = {
  events: { title: "Fresh volunteer reports", help: "Sewage, polluted pipes, foam, colour. Halves every 14 days; unverified reports count 70%, scaled by trust." },
  lastLab: { title: "Last lab result", help: "OneAquaHealth lab health-risk score (pathogens, fecal indicators, antibiotic resistance)." },
  baseline: { title: "Map context", help: "Nearness to wastewater plants and farmland, and how built-up the area is. Calibrated on OAH lab data (see About the model)." },
  labAge: { title: "Age of lab picture", help: "Two years or more without a lab visit counts fully." },
};

function WeightsPanel() {
  const app = useApp();
  const w = app.weights;
  const total = Object.values(w).reduce((a, b) => a + b, 0) || 1;
  return (
    <div className="weights">
      <p className="muted small">The ranking is a weighted mean of four factors. Defaults are a starting point; adjust them to your city's priorities. Only the map-context factor is fitted to data.</p>
      {(Object.keys(LABELS) as (keyof Weights)[]).map((k) => (
        <label key={k} className="weight">
          <span className="weight-head">
            <b>{LABELS[k].title}</b>
            <span>{Math.round((w[k] / total) * 100)}%</span>
          </span>
          <input type="range" min={0} max={1} step={0.05} value={w[k]} onChange={(e) => app.update({ weights: { ...w, [k]: Number(e.target.value) } })} />
          <span className="muted small">{LABELS[k].help}</span>
        </label>
      ))}
      <button className="link" onClick={() => app.update({ weights: DEFAULT_WEIGHTS })}>Reset to defaults</button>
    </div>
  );
}
