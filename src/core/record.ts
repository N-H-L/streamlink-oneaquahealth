// The per-stream One Health record: everything the FHIR store holds about one site, assembled
// into a timeline and three pillars (environment · animals & vectors · people), each with its age.
import { CS, EXT, NS } from "./constants";
import type { Resource } from "./fhir";
import { daysBetween, type Site } from "./sites";
import type { FhirStore } from "./store";

export interface CheckSummary {
  qr: Resource;
  observations: Resource[];
  wellbeing?: Resource;
  provenance?: Resource;
  trust: number | null;
  flags: { rule: string; message: string; resolution: string }[];
  status: "preliminary" | "final" | "mixed";
  authored: string;
  volunteerRef?: string;
  events: EventSign[];
}

export type EventSign = "sewage" | "drain" | "foam" | "colour" | "turbid" | "construction" | "poor-rating";

export interface SiteRecord {
  site: Site;
  locationId: string | null;
  checks: CheckSummary[];
  referrals: Resource[];
  labResults: Resource[];
  baselineObs?: Resource;
  timeline: TimelineItem[];
  pillars: Pillar[];
}

export interface TimelineItem {
  when: string;
  kind: "check" | "verification" | "referral" | "referral-done" | "lab" | "lab-campaign";
  title: string;
  detail?: string;
  status?: string;
  ref?: string;
}

export interface Pillar {
  id: "environment" | "animals" | "people";
  title: string;
  items: { label: string; value: string; tone: "ok" | "warn" | "bad" | "info"; source: string; when?: string }[];
  newest?: string; // ISO date of the newest item
}

const codeOf = (o: Resource, system: string) => o.code?.coding?.find((c: any) => c.system === system)?.code;
const valueCode = (o: Resource) => o.valueCodeableConcept?.coding?.[0]?.code;

export function eventSigns(obs: Resource[]): EventSign[] {
  const out = new Set<EventSign>();
  for (const o of obs) {
    const sl = codeOf(o, CS.sl);
    const v = valueCode(o);
    if (sl === "sewage-discharge" && v === "present") out.add("sewage");
    if (sl === "drain-outflow" && v === "present") out.add("drain");
    if (sl === "construction-works" && v === "present") out.add("construction");
    if (sl === "water-aspect") {
      if (v === "foam") out.add("foam");
      if (v === "altered-colour") out.add("colour");
      if (v === "turbid") out.add("turbid");
    }
    if (sl === "citizen-overall-rating" && v === "poor") out.add("poor-rating");
  }
  return [...out];
}

export const EVENT_LABEL: Record<EventSign, string> = {
  sewage: "Sewage flowing in",
  drain: "Polluted pipe discharge",
  foam: "Foam on the water",
  colour: "Unusual water colour",
  turbid: "Muddy or cloudy water",
  construction: "Works in the stream",
  "poor-rating": "Rated poor by a volunteer",
};

function trustFrom(prov?: Resource) {
  const ext = prov?.extension?.find((e: any) => e.url === EXT.trust);
  if (!ext) return { trust: null, flags: [] };
  const score = ext.extension?.find((e: any) => e.url === "score")?.valueDecimal ?? null;
  const flags = (ext.extension ?? [])
    .filter((e: any) => e.url === "flag")
    .map((f: any) => {
      const get = (u: string) => f.extension?.find((x: any) => x.url === u);
      return { rule: get("rule")?.valueCode, message: get("message")?.valueString, resolution: get("resolution")?.valueCode };
    });
  return { trust: score, flags };
}

export async function findLocationId(store: FhirStore, siteCode: string): Promise<string | null> {
  const found = await store.search("Location", { identifier: `${NS.site}|${siteCode}` });
  return found[0]?.id ?? null;
}

export async function loadSiteRecord(store: FhirStore, site: Site, now = new Date()): Promise<SiteRecord> {
  const locationId = await findLocationId(store, site.code);
  let observations: Resource[] = [];
  let qrs: Resource[] = [];
  let referrals: Resource[] = [];
  let provenances: Resource[] = [];
  if (locationId) {
    const subject = `Location/${locationId}`;
    [observations, qrs, referrals] = await Promise.all([
      store.search("Observation", { subject }),
      store.search("QuestionnaireResponse", { subject }),
      store.search("ServiceRequest", { subject }),
    ]);
    if (qrs.length) provenances = await store.search("Provenance", { target: qrs.map((q) => `QuestionnaireResponse/${q.id}`).join(",") });
  }
  return assembleRecord(site, locationId, observations, qrs, referrals, provenances, now);
}

export function assembleRecord(
  site: Site, locationId: string | null, observations: Resource[], qrs: Resource[], referrals: Resource[], provenances: Resource[], now = new Date(),
): SiteRecord {
  const checks: CheckSummary[] = qrs.map((qr) => {
    const ref = `QuestionnaireResponse/${qr.id}`;
    const derived = observations.filter((o) => (o.derivedFrom ?? []).some((d: any) => d.reference === ref));
    const wellbeing = derived.find((o) => codeOf(o, CS.sl) === "perceived-wellbeing");
    const obs = derived.filter((o) => o !== wellbeing);
    const creation = provenances.find((p) => (p.target ?? []).some((t: any) => t.reference === ref) && p.extension?.some((e: any) => e.url === EXT.trust));
    const statuses = new Set(obs.map((o) => o.status));
    const { trust, flags } = trustFrom(creation);
    return {
      qr, observations: obs, wellbeing, provenance: creation, trust, flags,
      status: statuses.size === 1 ? ([...statuses][0] as any) : statuses.size === 0 ? "preliminary" : "mixed",
      authored: qr.authored,
      volunteerRef: qr.author?.reference,
      events: eventSigns(obs),
    };
  }).sort((a, b) => b.authored.localeCompare(a.authored));

  const labResults = observations.filter((o) => (o.basedOn ?? []).length > 0);
  const baselineObs = observations.find((o) => codeOf(o, CS.sl) === "map-context-risk");

  const timeline: TimelineItem[] = [];
  for (const c of checks) {
    timeline.push({
      when: c.authored, kind: "check",
      title: "Volunteer check-in",
      detail: c.events.length ? c.events.map((e) => EVENT_LABEL[e]).join(" · ") : "No pollution signs reported",
      status: c.status, ref: `QuestionnaireResponse/${c.qr.id}`,
    });
    const verified = c.observations.find((o) => o.status === "final");
    if (verified) timeline.push({ when: verified.meta?.lastUpdated ?? c.authored, kind: "verification", title: "Verified by an expert", detail: "Now also conforms to the official OneAquaHealth indicator profile", status: "final" });
  }
  for (const r of referrals) {
    timeline.push({ when: r.authoredOn, kind: "referral", title: "Lab visit requested", detail: r.extension?.find((e: any) => e.url === EXT.priorityExplanation)?.valueString, status: r.status, ref: `ServiceRequest/${r.id}` });
  }
  for (const l of labResults) {
    const simulated = (l.meta?.tag ?? []).some((t: any) => t.code === "simulated");
    timeline.push({
      when: l.effectiveDateTime, kind: "lab",
      title: `Lab result: coliforms ${l.valueQuantity?.value} CFU/100 mL${simulated ? " (simulated)" : ""}`,
      detail: "Closes the lab visit request", status: "final", ref: `Observation/${l.id}`,
    });
  }
  if (site.lab) {
    timeline.push({ when: site.lab.date, kind: "lab-campaign", title: "OneAquaHealth lab campaign", detail: `Health-risk score ${site.lab.score.toFixed(2)} (pathogens ${site.lab.pathogen.toFixed(2)}, fecal ${site.lab.fecal.toFixed(2)}, antibiotic resistance ${site.lab.arg.toFixed(2)})` });
  }
  timeline.sort((a, b) => b.when.localeCompare(a.when));

  return { site, locationId, checks, referrals, labResults, baselineObs, timeline, pillars: buildPillars(site, checks, labResults, now) };
}

function ago(iso: string, now: Date) {
  const d = daysBetween(iso, now);
  return d === 0 ? "today" : d === 1 ? "1 day ago" : `${d} days ago`;
}

export function buildPillars(site: Site, checks: CheckSummary[], labResults: Resource[], _now = new Date()): Pillar[] {
  const latest = checks[0];
  const env: Pillar = { id: "environment", title: "Stream & banks", items: [] };
  const animals: Pillar = { id: "animals", title: "Animals & disease vectors", items: [] };
  const people: Pillar = { id: "people", title: "People's health", items: [] };
  const srcCitizen = (c: CheckSummary) => `Volunteer check, ${c.status === "final" ? "verified" : "not yet verified"}`;

  if (latest) {
    const obs = latest.observations;
    const find = (sl: string) => obs.filter((o) => codeOf(o, CS.sl) === sl);
    const aspect = valueCode(find("water-aspect")[0] ?? {});
    if (aspect) {
      const label: Record<string, string> = { clear: "Clear", turbid: "Muddy or cloudy", foam: "Foam on the surface", "altered-colour": "Unusual colour" };
      env.items.push({ label: "Water", value: label[aspect] ?? aspect, tone: aspect === "clear" ? "ok" : aspect === "turbid" ? "warn" : "bad", source: srcCitizen(latest), when: latest.authored });
    }
    const signs = latest.events.filter((e) => e === "sewage" || e === "drain" || e === "construction");
    env.items.push({ label: "Pollution sources", value: signs.length ? signs.map((e) => EVENT_LABEL[e]).join(", ") : "None seen", tone: signs.length ? "bad" : "ok", source: srcCitizen(latest), when: latest.authored });
    const bed = valueCode(find("bottom-type")[0] ?? {});
    const bank = valueCode(find("bank-type")[0] ?? {});
    if (bed || bank) {
      const natural = [bed, bank].filter((x) => x === "natural").length;
      env.items.push({ label: "Channel", value: natural === 2 ? "Natural bed and banks" : natural === 1 ? "Partly artificial" : "Artificial (concrete)", tone: natural === 2 ? "ok" : natural === 1 ? "warn" : "bad", source: srcCitizen(latest), when: latest.authored });
    }
    const vegYes = obs.filter((o) => codeOf(o, CS.sl)?.startsWith("vegetated-") && valueCode(o) === "present").length;
    const vegAny = obs.filter((o) => codeOf(o, CS.sl)?.startsWith("vegetated-")).length;
    if (vegAny) env.items.push({ label: "Bank vegetation", value: `${vegYes} of ${vegAny} banks covered`, tone: vegYes === vegAny ? "ok" : vegYes ? "warn" : "bad", source: srcCitizen(latest), when: latest.authored });

    // Animals & vectors: still/slow water with plants is breeding habitat for mosquitoes and
    // other Diptera that OneAquaHealth tracks (DipteraCAST), plus invasive species.
    const flow = valueCode(find("water-flow")[0] ?? {});
    const plantsInWater = find("habitats").some((o) => valueCode(o) === "aquatic-vegetation");
    if (flow) {
      const breeding = flow === "stagnant" || (flow === "slow" && plantsInWater);
      animals.items.push({ label: "Mosquito breeding habitat", value: breeding ? (flow === "stagnant" ? "Likely: still water" : "Possible: slow water with plants") : flow === "dry" ? "Dry at the time" : "Unlikely: flowing water", tone: breeding ? "warn" : "ok", source: srcCitizen(latest), when: latest.authored });
    }
    const inv = find("invasive-plants")[0];
    if (inv) animals.items.push({ label: "Invasive plants", value: valueCode(inv) === "present" ? "Reported" : "None seen", tone: valueCode(inv) === "present" ? "warn" : "ok", source: srcCitizen(latest), when: latest.authored });
    const habitats = find("habitats").length;
    animals.items.push({ label: "Habitat variety", value: `${habitats} habitat type${habitats === 1 ? "" : "s"} seen`, tone: habitats >= 3 ? "ok" : habitats >= 1 ? "warn" : "bad", source: srcCitizen(latest), when: latest.authored });
  }

  const lastLab = labResults.sort((a, b) => String(b.effectiveDateTime).localeCompare(String(a.effectiveDateTime)))[0];
  if (lastLab) {
    const v = lastLab.valueQuantity?.value ?? 0;
    const simulated = (lastLab.meta?.tag ?? []).some((t: any) => t.code === "simulated");
    people.items.push({ label: "Latest lab result", value: `Coliforms ${v} CFU/100 mL${simulated ? " (simulated)" : ""}`, tone: v > 1000 ? "bad" : v > 200 ? "warn" : "ok", source: "Lab, via lab visit request", when: lastLab.effectiveDateTime });
  }
  if (site.lab) {
    const s = site.lab.score;
    people.items.push({ label: "Lab health-risk (pathogens, fecal, antibiotic resistance)", value: `${s.toFixed(2)} on a 0–1 scale`, tone: s >= 0.5 ? "bad" : s >= 0.3 ? "warn" : "ok", source: site.lab.source, when: site.lab.date });
  } else {
    people.items.push({ label: "Lab health-risk", value: "Never sampled", tone: "info", source: "No lab data for this site" });
  }
  const wb = checks.map((c) => c.wellbeing).filter(Boolean) as Resource[];
  if (wb.length) {
    const avg = (code: string) => {
      const vals = wb.map((w) => w.component?.find((c: any) => c.code?.coding?.[0]?.code === code)?.valueInteger).filter((x: any) => typeof x === "number");
      return vals.length ? vals.reduce((a: number, b: number) => a + b, 0) / vals.length : null;
    };
    const pos = [avg("joy"), avg("serenity")].filter((x) => x !== null) as number[];
    const neg = [avg("anger"), avg("fear")].filter((x) => x !== null) as number[];
    const p = pos.length ? pos.reduce((a, b) => a + b) / pos.length : 0;
    const n = neg.length ? neg.reduce((a, b) => a + b) / neg.length : 0;
    people.items.push({ label: "How visitors feel here", value: `Positive ${p.toFixed(1)} / negative ${n.toFixed(1)} (0–10, ${wb.length} visit${wb.length === 1 ? "" : "s"})`, tone: p >= n ? "ok" : "warn", source: "Self-reported by volunteers", when: wb[0].effectiveDateTime });
  }
  if (site.baseline) {
    people.items.push({ label: "Map-context risk", value: `${Math.round(site.baseline.score * 100)} / 100${site.baseline.percentile != null ? ` (higher than ${Math.round(site.baseline.percentile)}% of sites in this city)` : ""}`, tone: site.baseline.score >= 0.66 ? "bad" : site.baseline.score >= 0.33 ? "warn" : "ok", source: site.baseline.model });
  }

  for (const p of [env, animals, people]) {
    const dates = p.items.map((i) => i.when).filter(Boolean) as string[];
    p.newest = dates.sort().at(-1);
  }
  if (!latest) {
    env.items.push({ label: "No volunteer check yet", value: "Be the first to check this stream", tone: "info", source: "" });
    animals.items.push({ label: "No volunteer check yet", value: "Habitat unknown", tone: "info", source: "" });
  }
  return [env, animals, people].map((p) => ({ ...p, items: p.items.map((i) => ({ ...i, when: i.when })) }));
}

export function freshnessLabel(iso: string | undefined, now = new Date()): string {
  return iso ? `updated ${ago(iso, now)}` : "no data yet";
}

/** Loads the records of many sites with a handful of batched searches (works on any FhirStore). */
export async function loadRecords(store: FhirStore, sites: Site[], now = new Date()): Promise<Map<string, SiteRecord>> {
  const out = new Map<string, SiteRecord>();
  const chunks = <T,>(xs: T[], n: number) => Array.from({ length: Math.ceil(xs.length / n) }, (_, i) => xs.slice(i * n, i * n + n));
  const locs: Resource[] = [];
  for (const part of chunks(sites, 40)) {
    locs.push(...(await store.search("Location", { identifier: part.map((s) => `${NS.site}|${s.code}`).join(",") })));
  }
  const idByCode = new Map<string, string>();
  for (const l of locs) {
    const code = l.identifier?.find((i: any) => i.system === NS.site)?.value;
    if (code && l.id && !idByCode.has(code)) idByCode.set(code, l.id);
  }
  const subjects = [...idByCode.values()].map((id) => `Location/${id}`);
  let obs: Resource[] = [], qrs: Resource[] = [], srs: Resource[] = [], provs: Resource[] = [];
  for (const part of chunks(subjects, 40)) {
    const subject = part.join(",");
    const [o, q, s] = await Promise.all([
      store.search("Observation", { subject }),
      store.search("QuestionnaireResponse", { subject }),
      store.search("ServiceRequest", { subject }),
    ]);
    obs.push(...o); qrs.push(...q); srs.push(...s);
  }
  for (const part of chunks(qrs.map((q) => `QuestionnaireResponse/${q.id}`), 40)) {
    provs.push(...(await store.search("Provenance", { target: part.join(",") })));
  }
  const bySubject = <T extends Resource>(xs: T[], ref: string) => xs.filter((x) => x.subject?.reference === ref);
  for (const site of sites) {
    const id = idByCode.get(site.code) ?? null;
    const ref = id ? `Location/${id}` : "";
    const q = id ? bySubject(qrs, ref) : [];
    const qRefs = new Set(q.map((x) => `QuestionnaireResponse/${x.id}`));
    out.set(site.code, assembleRecord(site, id, id ? bySubject(obs, ref) : [], q, id ? bySubject(srs, ref) : [], provs.filter((p) => (p.target ?? []).some((t: any) => qRefs.has(t.reference))), now));
  }
  return out;
}

/** The newest lab result recorded through a referral, in the shape triage expects. */
export function latestLabResult(rec: SiteRecord): { when: string; coliformsCfu: number } | undefined {
  const l = [...rec.labResults].sort((a, b) => String(b.effectiveDateTime).localeCompare(String(a.effectiveDateTime)))[0];
  return l ? { when: l.effectiveDateTime, coliformsCfu: l.valueQuantity?.value ?? 0 } : undefined;
}
