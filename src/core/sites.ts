// Site catalogue: OneAquaHealth research sites (Resilience Map snapshot, data/oah/) plus any
// city added through a config file (data/cities/*.json). Pure functions, no I/O.

export interface LabSnapshot {
  date: string; // ISO date of the (single) OAH lab campaign
  pathogen: number;
  fecal: number;
  arg: number;
  score: number; // OAH healthRiskScore, 0–1
  source: string;
}

export interface Baseline {
  score: number; // 0–1, higher = map context suggests higher lab risk
  percentile?: number; // within its city, 0–100
  features: { distWastewaterM?: number | null; distFarmlandM?: number | null; urbanFraction2km?: number | null };
  model: string;
}

export interface Site {
  code: string;
  name: string;
  city: string; // city id, e.g. "CO"
  cityName: string;
  lat: number;
  lon: number;
  lab?: LabSnapshot;
  baseline?: Baseline;
}

export interface City {
  id: string;
  name: string;
  country: string;
  lat: number;
  lon: number;
  zoom?: number;
  hasLabData: boolean;
  note?: string;
}

/** Fix mojibake in the snapshot (UTF-8 bytes decoded as Latin-1 upstream, e.g. "ExploratÃ³rio"). */
export function fixMojibake(s: string): string {
  if (!/[ÃÂ]/.test(s)) return s;
  try {
    const bytes = Uint8Array.from([...s].map((c) => c.charCodeAt(0) & 0xff));
    const out = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return out;
  } catch {
    return s;
  }
}

const COUNTRY: Record<string, string> = { CO: "Portugal", GH: "Belgium", TO: "France", BE: "Italy", OS: "Norway" };

export function oahCatalogue(sitesRaw: any[], risksRaw: any[]): { sites: Site[]; cities: City[] } {
  const risk = new Map<string, any>(risksRaw.map((r) => [r.researchSiteCode, r]));
  const cities = new Map<string, City>();
  const sites: Site[] = sitesRaw.map((s) => {
    const c = s.city ?? {};
    if (!cities.has(c.id)) {
      cities.set(c.id, {
        id: c.id, name: fixMojibake(c.name), country: COUNTRY[c.id] ?? "", lat: c.latitude, lon: c.longitude, zoom: 12, hasLabData: true,
      });
    }
    const r = risk.get(s.code);
    return {
      code: s.code,
      name: fixMojibake(s.name ?? s.code),
      city: c.id,
      cityName: fixMojibake(c.name),
      lat: s.latitude,
      lon: s.longitude,
      lab: r
        ? {
            date: String(r.samplingDate).slice(0, 10),
            pathogen: r.scaledPathogenRisk,
            fecal: r.scaledFecalRisk,
            arg: r.scaledArgRisk,
            score: r.healthRiskScore,
            source: "OneAquaHealth Resilience Map (lab campaign)",
          }
        : undefined,
    };
  });
  return { sites, cities: [...cities.values()] };
}

export function daysBetween(fromIso: string, to: Date): number {
  return Math.max(0, Math.floor((to.getTime() - new Date(fromIso).getTime()) / 86_400_000));
}
