// Explainable, rule-based consistency checks on a stream check (docs/SPEC-fhir.md, "Trust rules").
// No AI: every flag names the rule, says why in plain words, and can be fixed by the citizen.
import { FAR_FROM_SITE_M } from "./constants";
import type { Answers, CheckInput } from "./questions";
import { YES } from "./questions";

export type Resolution = "open" | "corrected" | "confirmed-by-citizen" | "dismissed-by-expert";

export interface TrustFlag {
  rule: TrustRule;
  message: string;
  /** Questions the citizen should look at again to resolve it. */
  fix: string[];
  resolution: Resolution;
}

export type TrustRule =
  | "far-from-site"
  | "dry-but-wet"
  | "stagnant-riffles"
  | "no-veg-dominant"
  | "good-but-sewage"
  | "implausible-height"
  | "no-photos"
  | "future-time";

/** How much an unresolved flag lowers the trust score (0–1). Chosen so that one serious
 * contradiction halves trust and minor issues barely matter. Documented in the README. */
export const RULE_WEIGHT: Record<TrustRule, number> = {
  "far-from-site": 0.4,
  "dry-but-wet": 0.3,
  "stagnant-riffles": 0.2,
  "no-veg-dominant": 0.15,
  "good-but-sewage": 0.3,
  "implausible-height": 0.2,
  "no-photos": 0.1,
  "future-time": 0.5,
};

const is = (a: Answers, id: string, code: string) => a[id] === code;
const has = (a: Answers, id: string, code: string) => Array.isArray(a[id]) && (a[id] as string[]).includes(code);

export function distanceM(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function checkTrust(input: CheckInput, site: { lat: number; lon: number }, now = new Date()): TrustFlag[] {
  const a = input.answers;
  const flags: TrustFlag[] = [];
  const add = (rule: TrustRule, message: string, fix: string[]) => flags.push({ rule, message, fix, resolution: "open" });

  if (input.gps) {
    const d = distanceM(input.gps, site);
    if (d > FAR_FROM_SITE_M) {
      add("far-from-site", `Your location is about ${Math.round(d)} m from this site. Is this the right stream?`, ["site"]);
    }
  }
  const height = typeof a["water-height"] === "number" ? (a["water-height"] as number) : undefined;
  if (is(a, "water-flow", "dry") && ((a["water-aspect"] && a["water-aspect"] !== "not-sure") || (height ?? 0) > 0)) {
    add("dry-but-wet", "You said the stream is dry, but also described the water. Which is right?", ["water-flow", "water-aspect", "water-height"]);
  }
  if (is(a, "water-flow", "stagnant") && has(a, "habitats", "riffles")) {
    add("stagnant-riffles", "Still water and riffles/rapids rarely appear together. Please check the flow.", ["water-flow", "habitats"]);
  }
  for (const side of ["left", "right"] as const) {
    const dom = a[`dominant-veg-${side}`];
    if (is(a, `vegetated-${side}`, "no") && dom && dom !== "not-sure") {
      add("no-veg-dominant", `The ${side} bank has no plants, but a main plant type is given.`, [`vegetated-${side}`, `dominant-veg-${side}`]);
    }
  }
  if (is(a, "overall-health", "good") && (is(a, "sewage-discharge", YES) || is(a, "drain-pipes", YES))) {
    add("good-but-sewage", "You rated the stream as good, but reported sewage or polluted pipes.", ["overall-health", "sewage-discharge", "drain-pipes"]);
  }
  if (height !== undefined && height > 3) {
    add("implausible-height", `A depth of ${height} m is unusual for an urban stream. Is that right?`, ["water-height"]);
  }
  if (input.photos === 0) {
    add("no-photos", "No photos. A photo helps an expert confirm your report.", ["photos"]);
  }
  if (new Date(input.authored).getTime() > now.getTime() + 5 * 60_000) {
    add("future-time", "The time of this check is in the future.", []);
  }
  return flags;
}

export function trustScore(flags: TrustFlag[]): number {
  const open = flags.filter((f) => f.resolution === "open" || f.resolution === "confirmed-by-citizen");
  // A citizen confirming an odd answer halves its penalty; an expert dismissing removes it.
  const penalty = open.reduce((s, f) => s + RULE_WEIGHT[f.rule] * (f.resolution === "confirmed-by-citizen" ? 0.5 : 1), 0);
  return Math.max(0, Math.round((1 - penalty) * 100) / 100);
}
