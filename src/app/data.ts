// Site catalogue for the app: the OAH snapshot + map baselines + any city config in data/cities/.
import sitesRaw from "../../data/oah/sites.snapshot.json";
import risksRaw from "../../data/oah/health-risks.snapshot.json";
import { oahCatalogue, type City, type Site } from "../core/sites";

// Optional files produced by analysis/ (loaded if present, so the app builds before they exist).
const baselineFiles = import.meta.glob("../../data/baseline/site-features.json", { eager: true, import: "default" }) as Record<string, any>;
const modelFiles = import.meta.glob("../../data/baseline/model-v1.json", { eager: true, import: "default" }) as Record<string, any>;
const cityFiles = import.meta.glob("../../data/cities/*.json", { eager: true, import: "default" }) as Record<string, any>;

export const model: any | null = Object.values(modelFiles)[0] ?? null;
const validationFiles = import.meta.glob("../../data/validation-summary.json", { eager: true, import: "default" }) as Record<string, any>;
export const validation: any | null = Object.values(validationFiles)[0] ?? null;

function num(v: any): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/** Reads a site-features entry regardless of small naming differences in the analysis output. */
function toBaseline(f: any, modelName: string): Site["baseline"] | undefined {
  if (!f) return undefined;
  const score = num(f.baseline_score ?? f.baselineScore ?? f.score);
  if (score === null) return undefined;
  const osm = f.osm ?? f.features ?? f;
  return {
    score,
    percentile: num(f.city_percentile ?? f.percentile ?? f.cityPercentile) ?? undefined,
    features: {
      distWastewaterM: num(osm.dist_wastewater_m ?? osm.distWastewaterM ?? osm.dist_wwtp_m),
      distFarmlandM: num(osm.dist_farmland_m ?? osm.distFarmlandM),
      urbanFraction2km: num(osm.urban_frac_2km_pct ?? osm.urbanFraction2km ?? (osm.urban_frac_2km != null ? osm.urban_frac_2km * 100 : null)),
    },
    model: modelName,
  };
}

function build(): { sites: Site[]; cities: City[] } {
  const { sites, cities } = oahCatalogue(sitesRaw as any[], risksRaw as any[]);
  const modelName = model ? `StreamLink baseline ${model.version ?? "v1"} (map features calibrated on OAH lab data)` : "StreamLink baseline";
  const feat = Object.values(baselineFiles)[0];
  const lookup = (code: string) => (Array.isArray(feat) ? feat.find((x: any) => (x.site_code ?? x.code) === code) : feat?.[code] ?? feat?.sites?.[code]);
  for (const s of sites) s.baseline = toBaseline(lookup(s.code), modelName);

  for (const cfg of Object.values(cityFiles)) {
    const c = cfg.city ?? cfg;
    const id = c.id ?? c.code;
    if (!id || cities.some((x) => x.id === id)) continue; // OAH cities come from the snapshot
    cities.push({
      id, name: c.name, country: c.country ?? "", lat: c.lat ?? c.centre?.lat ?? c.center?.lat, lon: c.lon ?? c.centre?.lon ?? c.center?.lon,
      zoom: c.zoom ?? 12, hasLabData: false, note: cfg.note ?? c.note,
    });
    for (const s of cfg.sites ?? []) {
      sites.push({ code: s.code, name: s.name, city: id, cityName: c.name, lat: s.lat, lon: s.lon, baseline: toBaseline(s, modelName) });
    }
  }
  return { sites, cities };
}

export const catalogue = build();
export const siteByCode = (code: string) => catalogue.sites.find((s) => s.code === code);
export const sitesOf = (cityId: string) => catalogue.sites.filter((s) => s.city === cityId);
export const cityById = (id: string) => catalogue.cities.find((c) => c.id === id);
