import { useEffect, useMemo, useRef, useState } from "react";
import { buildCheckBundle } from "../../core/fhir";
import { EMOTIONS, NOT_SURE, QUESTIONS, STEPS, type Answers, type CheckInput, type EmotionCode, type Question } from "../../core/questions";
import { sewageCheck } from "../../core/samples";
import type { Site } from "../../core/sites";
import { FhirError } from "../../core/store";
import { checkTrust, distanceM, trustScore, type TrustFlag } from "../../core/trust";
import { submitCheck } from "../../core/workflow";
import { FhirJson } from "../components/FhirJson";
import { Pictogram } from "../components/Icons";
import { catalogue, cityById, siteByCode, sitesOf } from "../data";
import { enqueue } from "../outbox";
import { go, useApp } from "../state";

type Phase = "site" | 0 | 1 | 2 | 3 | "review" | "done";

const DRAFT_KEY = "streamlink.draft.v1";

/** A half-finished check survives a reload, but never moves to another stream. */
function loadDraft(code?: string): { answers: Answers; emotions: Partial<Record<EmotionCode, number>>; invasiveWhich: string } | null {
  try {
    const d = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "null");
    return d && d.siteCode === code ? d : null;
  } catch {
    return null;
  }
}

export function CheckIn({ siteCode }: { siteCode?: string }) {
  const app = useApp();
  const [site, setSite] = useState<Site | undefined>(siteCode ? siteByCode(siteCode) : undefined);
  const draft = loadDraft(siteCode);
  const [phase, setPhase] = useState<Phase>(site ? 0 : "site");
  const [answers, setAnswers] = useState<Answers>(draft?.answers ?? {});
  const [emotions, setEmotions] = useState<Partial<Record<EmotionCode, number>>>(draft?.emotions ?? {});
  const [photos, setPhotos] = useState<string[]>([]);
  const [gps, setGps] = useState<{ lat: number; lon: number } | null>(null);
  const [invasiveWhich, setInvasiveWhich] = useState(draft?.invasiveWhich ?? "");
  const [flags, setFlags] = useState<TrustFlag[]>([]);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ queued: boolean; bundle: any } | null>(null);
  const top = useRef<HTMLDivElement>(null);

  useEffect(() => top.current?.focus(), [phase]);
  useEffect(() => {
    if (!site) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ siteCode: site.code, answers, emotions, invasiveWhich }));
    } catch {
      /* private mode: the draft simply will not survive a reload */
    }
  }, [site, answers, emotions, invasiveWhich]);
  useEffect(() => () => photos.forEach((p) => URL.revokeObjectURL(p)), []); // eslint-disable-line react-hooks/exhaustive-deps

  const input = (): CheckInput => ({
    siteCode: site!.code, answers, emotions, photos: photos.length, gps, authored: new Date().toISOString(), volunteerId: app.volunteerId,
    invasiveWhich: invasiveWhich || undefined,
  });

  function fillExample() {
    const ex = sewageCheck(site!.code, new Date().toISOString());
    setAnswers(ex.answers);
    setEmotions(ex.emotions);
    setInvasiveWhich(ex.invasiveWhich ?? "");
    app.toast("Example answers filled in: a sewage discharge with foam. Rating it \"Good\" will show a trust flag.", "info");
  }

  function toReview() {
    const f = checkTrust(input(), site!);
    // Keep earlier decisions on flags that still apply.
    setFlags(f.map((x) => flags.find((o) => o.rule === x.rule && o.resolution === "confirmed-by-citizen") ?? x));
    setPhase("review");
  }

  async function submit() {
    setSaving(true);
    const inp = input();
    try {
      await submitCheck(app.store, site!, inp, flags);
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        /* ignore */
      }
      setResult({ queued: false, bundle: buildCheckBundle(inp, site!, flags).bundle });
      app.refresh();
      setPhase("done");
    } catch (e: any) {
      if (e instanceof FhirError && e.status === undefined) {
        enqueue({ siteCode: site!.code, input: inp, flags, target: app.mode });
        setResult({ queued: true, bundle: buildCheckBundle(inp, site!, flags).bundle });
        setPhase("done");
      } else {
        app.toast(`Could not save: ${e.message}`, "error");
      }
    } finally {
      setSaving(false);
    }
  }

  const stepIndex = typeof phase === "number" ? phase : phase === "review" ? 4 : phase === "done" ? 5 : -1;

  return (
    <div className="page narrow">
      <div ref={top} tabIndex={-1} className="focus-anchor" />
      {site && phase !== "site" && (
        <div className="check-head">
          <div>
            <div className="eyebrow">Stream check · {site.cityName}</div>
            <h1>{site.name} <span className="code">{site.code}</span></h1>
          </div>
          {phase !== "done" && <button className="link" onClick={() => setPhase("site")}>Change site</button>}
        </div>
      )}
      {stepIndex >= 0 && stepIndex < 5 && (
        <>
        <p className="step-count">Step {stepIndex + 1} of 5</p>
        <ol className="progress" aria-label="Progress">
          {[...STEPS.map((s) => s.title), "Review"].map((t, i) => (
            <li key={t} className={i < stepIndex ? "step-done" : i === stepIndex ? "step-current" : ""} aria-current={i === stepIndex ? "step" : undefined}>{t}</li>
          ))}
        </ol>
        </>
      )}

      {phase === "site" && (
        <SitePicker
          onPick={(s, g) => {
            // Answers describe one stream, so switching streams starts fresh.
            if (site && s.code !== site.code) {
              setAnswers({});
              setEmotions({});
              setInvasiveWhich("");
              setPhotos([]);
              setFlags([]);
            }
            setSite(s);
            if (g) setGps(g);
            setPhase(0);
          }}
          gps={gps}
          setGps={setGps}
        />
      )}

      {typeof phase === "number" && site && (
        <section aria-labelledby="step-title">
          <div className="step-head">
            <h2 id="step-title">{STEPS[phase].title}</h2>
            <p className="muted">{STEPS[phase].subtitle}</p>
            {phase === 0 && Object.keys(answers).length === 0 && (
              <button className="btn ghost small" onClick={fillExample}>Fill with an example</button>
            )}
          </div>
          {QUESTIONS.filter((q) => q.step === STEPS[phase].id).map((q) => (
            <QuestionField key={q.linkId} q={q} value={answers[q.linkId]} onChange={(v) => setAnswers((a) => ({ ...a, [q.linkId]: v }))} />
          ))}
          {phase === 2 && answers["invasive-plants"] === "yes" && (
            <label className="q">
              <span className="q-label">Which invasive plants? <span className="muted">(optional)</span></span>
              <input className="input" value={invasiveWhich} onChange={(e) => setInvasiveWhich(e.target.value)} placeholder="e.g. giant reed" />
            </label>
          )}
          {phase === 3 && (
            <>
              <fieldset className="q">
                <legend className="q-label">How does this place make you feel?</legend>
                <p className="muted small">0 = not at all, 10 = very strongly. Streams can affect how people feel; this is part of their One Health value.</p>
                {EMOTIONS.map((e) => (
                  <label key={e.code} className="slider">
                    <span>{e.label}</span>
                    <input type="range" min={0} max={10} value={emotions[e.code] ?? 5} onChange={(ev) => setEmotions((m) => ({ ...m, [e.code]: Number(ev.target.value) }))} aria-valuetext={`${emotions[e.code] ?? 5} of 10`} />
                    <output>{emotions[e.code] ?? "–"}</output>
                  </label>
                ))}
              </fieldset>
              <PhotoField photos={photos} setPhotos={setPhotos} />
            </>
          )}
          <div className="nav">
            {phase > 0 ? <button className="btn ghost" onClick={() => setPhase((phase - 1) as Phase)}>Back</button> : <span />}
            {phase < 3 ? <button className="btn" onClick={() => setPhase((phase + 1) as Phase)}>Next</button> : <button className="btn" onClick={toReview}>Review</button>}
          </div>
        </section>
      )}

      {phase === "review" && site && (
        <Review
          flags={flags}
          setFlags={setFlags}
          answered={Object.keys(answers).length}
          definite={Object.values(answers).filter((v) => v !== undefined && v !== "" && v !== NOT_SURE && !(Array.isArray(v) && v.length === 0)).length}
          onFix={(linkId) => {
            const q = QUESTIONS.find((x) => x.linkId === linkId);
            if (linkId === "photos") setPhase(3);
            else if (q) setPhase(STEPS.findIndex((s) => s.id === q.step) as Phase);
            else setPhase("site");
          }}
          onBack={() => setPhase(3)}
          onSubmit={submit}
          saving={saving}
          target={app.store.label}
        />
      )}

      {phase === "done" && site && result && (
        <section className="done" aria-live="polite">
          <h2>{result.queued ? "Saved on this device" : "Thank you, your check is in the stream's record"}</h2>
          {result.queued ? (
            <p>You seem to be offline. The check is queued and will be sent to {app.store.label} when you're back online.</p>
          ) : (
            <p>It is stored as <b>preliminary</b> until an expert verifies it. If it points to pollution, the city may send a lab team, and you'll get a message when that happens.</p>
          )}
          <div className="row">
            <button className="btn" onClick={() => go(`/site/${site.code}`)}>Open the stream's record</button>
            <button className="btn ghost" onClick={() => go("/inbox")}>My messages</button>
          </div>
          <FhirJson title={`What was sent: a FHIR transaction with ${result.bundle.entry.length} resources`} data={result.bundle} />
        </section>
      )}
    </div>
  );
}

function QuestionField({ q, value, onChange }: { q: Question; value: any; onChange: (v: any) => void }) {
  const id = `q-${q.linkId}`;
  if (q.kind === "decimal") {
    return (
      <label className="q" htmlFor={id}>
        <span className="q-label">{q.label}</span>
        {q.help && <span className="muted small">{q.help}</span>}
        <span className="with-unit">
          <input id={id} className="input" type="number" inputMode="decimal" min={0} step={0.1} value={value ?? ""} onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))} />
          <span>{q.unit}</span>
        </span>
      </label>
    );
  }
  const options = q.kind === "yesno" ? [{ code: "yes", label: "Yes" }, { code: "no", label: "No" }] : q.options ?? [];
  const multi = q.kind === "multi";
  const selected: string[] = multi ? (value as string[]) ?? [] : value ? [value] : [];
  const toggle = (code: string) => {
    if (!multi) onChange(value === code ? undefined : code);
    else onChange(selected.includes(code) ? selected.filter((c) => c !== code) : [...selected, code]);
  };
  const hasIcons = options.some((o: any) => o.icon);
  return (
    <fieldset className="q">
      <legend className="q-label">{q.label}</legend>
      {q.help && <p className="muted small">{q.help}</p>}
      <div className={`choices ${hasIcons ? "with-icons" : ""} ${q.kind === "yesno" ? "yesno" : ""}`} role={multi ? "group" : "radiogroup"}>
        {options.map((o: any) => (
          <button
            key={o.code}
            type="button"
            className={selected.includes(o.code) ? "choice on" : "choice"}
            role={multi ? "checkbox" : "radio"}
            aria-checked={selected.includes(o.code)}
            onClick={() => toggle(o.code)}
          >
            <Pictogram name={o.icon} />
            <span className="choice-label">{o.label}</span>
            {o.hint && <span className="choice-hint">{o.hint}</span>}
          </button>
        ))}
        {!multi && (
          <button type="button" className={value === NOT_SURE ? "choice unsure on" : "choice unsure"} role="radio" aria-checked={value === NOT_SURE} onClick={() => toggle(NOT_SURE)}>
            <span className="choice-label">Not sure</span>
          </button>
        )}
      </div>
    </fieldset>
  );
}

function PhotoField({ photos, setPhotos }: { photos: string[]; setPhotos: (p: string[]) => void }) {
  return (
    <div className="q">
      <span className="q-label">Photos <span className="muted">(upstream, downstream, anything unusual)</span></span>
      <p className="muted small">Photos help an expert verify your report. In this prototype they stay on your device and are not uploaded.</p>
      <label className="btn ghost photo-btn">
        Add photo
        <input type="file" accept="image/*" capture="environment" multiple hidden onChange={(e) => {
          const files = [...(e.target.files ?? [])].slice(0, 4);
          setPhotos([...photos, ...files.map((f) => URL.createObjectURL(f))].slice(0, 4));
        }} />
      </label>
      {photos.length > 0 && (
        <div className="thumbs">
          {photos.map((p, i) => <img key={p} src={p} alt={`Photo ${i + 1}`} />)}
        </div>
      )}
    </div>
  );
}

function Review({ flags, setFlags, answered, definite, onFix, onBack, onSubmit, saving, target }: {
  flags: TrustFlag[]; setFlags: (f: TrustFlag[]) => void; answered: number; definite: number;
  onFix: (linkId: string) => void; onBack: () => void; onSubmit: () => void; saving: boolean; target: string;
}) {
  const score = trustScore(flags);
  const open = flags.filter((f) => f.resolution === "open");
  return (
    <section aria-labelledby="review-title">
      <h2 id="review-title">Before you send</h2>
      {definite === 0 ? (
        <p className="notice notice-error">
          {answered === 0
            ? "You haven't answered anything yet. Go back and answer what you can see."
            : "Everything is still “Not sure”. That is honest, but there is nothing here for an expert to look at — answer at least one thing you can see."}
        </p>
      ) : (
        <div className="trust">
          <div className="trust-meter" aria-label={`Trust score ${Math.round(score * 100)} percent`}>
            <span style={{ width: `${score * 100}%` }} />
          </div>
          <p><b>Trust score {Math.round(score * 100)}%.</b> {flags.filter((f) => f.resolution === "open").length === 0 ? "Nothing left to check." : "A few answers don't quite fit together. Fixing them makes your report count for more."}</p>
        </div>
      )}
      {flags.length > 0 && (
        <ul className="flags">
          {flags.map((f, i) => (
            <li key={f.rule} className={f.resolution === "open" ? "flag" : "flag resolved"}>
              <span>{f.message}</span>
              <span className="row">
                {f.fix.length > 0 && <button className="btn small" onClick={() => onFix(f.fix[0])}>{f.rule === "no-photos" ? "Add a photo" : "Fix"}</button>}
                {f.resolution === "open" ? (
                  <button className="btn ghost small" onClick={() => setFlags(flags.map((x, j) => (j === i ? { ...x, resolution: "confirmed-by-citizen" } : x)))}>
                    {f.rule === "no-photos" ? "Skip" : "It's correct"}
                  </button>
                ) : (
                  <span className="badge b-muted">{f.rule === "no-photos" ? "Skipped" : "You confirmed this"}</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="muted small">{answered} answers. Your report is stored under a pseudonym: no name or contact details, and your location is rounded to about 100 m in the stored record. Destination: {target}.</p>
      <div className="nav">
        <button className="btn ghost" onClick={onBack}>Back</button>
        <button className="btn" onClick={onSubmit} disabled={saving || definite === 0}>{saving ? "Sending…" : "Send my check"}</button>
      </div>
      {open.length > 0 && definite > 0 && (
        <p className="muted small right">{open.length} flag{open.length === 1 ? "" : "s"} still open — you can send anyway, but fixing them makes the report count for more.</p>
      )}
    </section>
  );
}

function SitePicker({ onPick, gps, setGps }: { onPick: (s: Site, gps?: { lat: number; lon: number }) => void; gps: { lat: number; lon: number } | null; setGps: (g: { lat: number; lon: number } | null) => void }) {
  const [cityId, setCityId] = useState("CO");
  const [locating, setLocating] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const sites = useMemo(() => {
    const all = gps ? catalogue.sites : sitesOf(cityId);
    const withD = all.map((s) => ({ s, d: gps ? distanceM(gps, s) : null }));
    return gps ? withD.sort((a, b) => a.d! - b.d!).slice(0, 8) : withD;
  }, [cityId, gps]);

  function locate() {
    if (!navigator.geolocation) return setErr("Location is not available in this browser.");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => { setGps({ lat: p.coords.latitude, lon: p.coords.longitude }); setLocating(false); },
      () => { setErr("Could not get your location. Pick a site from the list instead."); setLocating(false); },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  return (
    <section aria-labelledby="pick-title">
      <h1 id="pick-title">Which stream are you at?</h1>
      <p className="muted">A check takes about 3 minutes. You don't need to be an expert: "Not sure" is always fine.</p>
      <div className="row">
        <button className="btn" onClick={locate} disabled={locating}>{locating ? "Finding you…" : "Use my location"}</button>
        {!gps && (
          <select className="input" value={cityId} onChange={(e) => setCityId(e.target.value)} aria-label="City">
            {catalogue.cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
        {gps && <button className="link" onClick={() => setGps(null)}>Browse by city instead</button>}
      </div>
      {err && <p className="notice notice-error">{err}</p>}
      <ul className="site-list">
        {sites.map(({ s, d }) => (
          <li key={s.code}>
            <button className="site-row" onClick={() => onPick(s, gps ?? undefined)}>
              <span><b>{s.name}</b> <span className="code">{s.code}</span></span>
              <span className="muted small">{d !== null ? `${d < 1000 ? `${Math.round(d)} m` : `${(d / 1000).toFixed(1)} km`} away · ` : ""}{cityById(s.city)?.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
