// "Which stream needs a lab visit next?" A transparent, expert-adjustable ranking.
// Each factor is 0–1 and carries a plain-language reason; the priority is their weighted mean.
import { daysBetween, type Site } from "./sites";
import { EVENT_LABEL, type CheckSummary, type EventSign } from "./record";

export interface Weights {
  events: number; // fresh volunteer-reported pollution events
  lastLab: number; // the site's last lab health-risk result
  baseline: number; // map-context baseline (calibrated on OAH lab data)
  labAge: number; // how old the lab picture is
}

/** Defaults are an expert-judgement starting point, not fitted values: coordinators can change them.
 * Only the baseline factor is calibrated on data (see data/baseline/model-v1.json). */
export const DEFAULT_WEIGHTS: Weights = { events: 0.4, lastLab: 0.25, baseline: 0.2, labAge: 0.15 };

/** How strongly each sign suggests a health-relevant contamination event (0–1). */
export const EVENT_SEVERITY: Record<EventSign, number> = {
  sewage: 1,
  drain: 0.8,
  foam: 0.6,
  colour: 0.6,
  construction: 0.4,
  turbid: 0.3,
  "poor-rating": 0.2,
};

/** Reports lose half their weight every 14 days; unverified reports count at 70%. */
export const EVENT_HALF_LIFE_DAYS = 14;
export const UNVERIFIED_FACTOR = 0.7;
export const LAB_AGE_FULL_DAYS = 730; // two years without a lab visit = maximum age factor

export interface Factor {
  key: keyof Weights;
  label: string;
  value: number; // 0–1
  reason: string;
}

export interface Priority {
  site: Site;
  score: number; // 0–1
  factors: Factor[];
  openReferral: boolean;
  topReason: string;
}

export function eventFactor(checks: CheckSummary[], now: Date): { value: number; reason: string; sign?: EventSign; check?: CheckSummary } {
  let best = { value: 0, reason: "No recent pollution signs reported" } as { value: number; reason: string; sign?: EventSign; check?: CheckSummary };
  for (const c of checks) {
    const age = daysBetween(c.authored, now);
    const decay = Math.pow(0.5, age / EVENT_HALF_LIFE_DAYS);
    const verified = c.status === "final";
    const trust = c.trust ?? 1;
    for (const s of c.events) {
      const v = EVENT_SEVERITY[s] * decay * trust * (verified ? 1 : UNVERIFIED_FACTOR);
      if (v > best.value) {
        best = {
          value: v,
          sign: s,
          check: c,
          reason: `${EVENT_LABEL[s]} reported ${age === 0 ? "today" : `${age} day${age === 1 ? "" : "s"} ago`}${verified ? ", verified" : ", not yet verified"}${trust < 1 ? `, trust ${Math.round(trust * 100)}%` : ""}`,
        };
      }
    }
  }
  return best;
}

export interface NewLabResult {
  when: string;
  coliformsCfu: number;
}

/** Coliform result → 0–1 risk, using common recreational-water bands (≤200 low, ≤1000 moderate). */
export function coliformRisk(cfu: number): number {
  return cfu <= 200 ? 0.15 : cfu <= 1000 ? 0.5 : 0.9;
}

export function prioritise(site: Site, checks: CheckSummary[], openReferral: boolean, weights: Weights, now = new Date(), newLab?: NewLabResult): Priority {
  // A lab visit settles the reports made before it: only later reports count as "fresh".
  const ev = eventFactor(newLab ? checks.filter((c) => c.authored > newLab.when) : checks, now);
  const labDate = newLab?.when ?? site.lab?.date;
  const labAgeDays = labDate ? daysBetween(labDate, now) : null;
  const lastLab: Factor = newLab
    ? { key: "lastLab", label: "Last lab result", value: coliformRisk(newLab.coliformsCfu), reason: `Coliforms ${newLab.coliformsCfu} CFU/100 mL on ${newLab.when.slice(0, 10)}` }
    : {
        key: "lastLab", label: "Last lab result",
        value: site.lab ? site.lab.score : 0.5,
        reason: site.lab ? `Health-risk ${site.lab.score.toFixed(2)} at the ${site.lab.date.slice(0, 4)} lab campaign` : "Never sampled: treated as unknown (0.5)",
      };
  const factors: Factor[] = [
    { key: "events", label: "Fresh volunteer reports", value: ev.value, reason: newLab && ev.value === 0 ? "Earlier reports were followed up by a lab visit" : ev.reason },
    lastLab,
    {
      key: "baseline", label: "Map context",
      // Supported use is ranking WITHIN one city, so the factor is the site's city percentile,
      // never the raw score (which must not be compared between cities). See data/baseline/model-v1.json.
      value: baselineFactor(site),
      reason: site.baseline ? baselineReason(site) : "No map features for this site: treated as unknown (0.5)",
    },
    {
      key: "labAge", label: "Age of lab picture",
      value: labAgeDays === null ? 1 : Math.min(1, labAgeDays / LAB_AGE_FULL_DAYS),
      reason: labAgeDays === null ? "No lab visit on record" : `Last lab visit ${labAgeDays} days ago`,
    },
  ];
  const total = Object.values(weights).reduce((a, b) => a + b, 0) || 1;
  const score = factors.reduce((s, f) => s + f.value * weights[f.key], 0) / total;
  const top = [...factors].sort((a, b) => b.value * weights[b.key] - a.value * weights[a.key])[0];
  return { site, score, factors, openReferral, topReason: top.reason };
}

export function baselineFactor(site: Site): number {
  const b = site.baseline;
  if (!b) return 0.5;
  return b.percentile != null ? b.percentile / 100 : b.score;
}

function baselineReason(site: Site): string {
  const b = site.baseline!;
  const f = b.features;
  const where = f.distWastewaterM != null ? `${fmtDist(f.distWastewaterM)} from the nearest wastewater plant` : "map context";
  const rank = b.percentile != null ? `, closer than ${Math.round(b.percentile)}% of this city's sites` : "";
  return `${where}${rank}`;
}

export function fmtDist(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
}

export function explain(p: Priority, weights: Weights): string {
  const total = Object.values(weights).reduce((a, b) => a + b, 0) || 1;
  return `Priority ${Math.round(p.score * 100)}/100. ` + p.factors
    .map((f) => `${f.label} (${Math.round((weights[f.key] / total) * 100)}% weight): ${f.reason}`)
    .join("; ") + ".";
}
