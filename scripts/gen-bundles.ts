// Generates validation fixtures from the real engine code (not hand-written JSON):
//   out/bundles/*.json   — transaction Bundles exactly as the app sends them
//   out/resources/*.json — every resource after a full lifecycle (check → verify → refer → result)
// scripts/validate.sh then runs the HL7 validator over both folders.
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import sitesRaw from "../data/oah/sites.snapshot.json";
import risksRaw from "../data/oah/health-risks.snapshot.json";
import { buildBaselineObservation, buildCheckBundle } from "../src/core/fhir";
import { loadSiteRecord } from "../src/core/record";
import { cleanCheck, contradictoryCheck, sewageCheck } from "../src/core/samples";
import { oahCatalogue } from "../src/core/sites";
import { LocalStore } from "../src/core/store";
import { DEFAULT_WEIGHTS } from "../src/core/triage";
import { checkTrust } from "../src/core/trust";
import { createReferral, recordSimulatedLabResult, submitCheck, verifyCheck } from "../src/core/workflow";

const NOW = new Date("2026-09-23T10:00:00Z");
const { sites } = oahCatalogue(sitesRaw as any[], risksRaw as any[]);
const site = sites.find((s) => s.code === "C1")!;
site.baseline = site.baseline ?? { score: 0.62, percentile: 70, features: { distWastewaterM: 1850, distFarmlandM: 420, urbanFraction2km: 38 }, model: "fixture" };

for (const d of ["out/bundles", "out/resources"]) {
  rmSync(d, { recursive: true, force: true });
  mkdirSync(d, { recursive: true });
}
const write = (path: string, obj: unknown) => writeFileSync(path, JSON.stringify(obj, null, 2));

// 1. Transaction bundles as sent by the check-in screen.
const samples = {
  "check-sewage": sewageCheck("C1", NOW.toISOString()),
  "check-clean": cleanCheck("C1", NOW.toISOString()),
  "check-contradictory": contradictoryCheck("C1", NOW.toISOString()),
};
for (const [name, input] of Object.entries(samples)) {
  write(`out/bundles/${name}.json`, buildCheckBundle(input, site, checkTrust(input, site, NOW)).bundle);
}
write("out/bundles/baseline.json", {
  resourceType: "Bundle", type: "transaction",
  entry: [{ fullUrl: "urn:uuid:7b1f2c1e-0000-4000-8000-000000000001", resource: { ...buildBaselineObservation({ locationRef: "Location/example", siteName: site.name, score: 0.62, features: site.baseline.features, when: NOW.toISOString() }) }, request: { method: "POST", url: "Observation" } }],
});

// 2. Full lifecycle in the local store: every transaction the workflow sends is saved too
//    (verification, referral, lab result), then every stored resource standalone.
const inner = new LocalStore();
let n = 0;
const store = {
  kind: inner.kind, label: inner.label, base: inner.base,
  read: inner.read.bind(inner), search: inner.search.bind(inner),
  transaction: async (b: any) => {
    const first = b.entry[0]?.resource?.resourceType ?? "empty";
    write(`out/bundles/lifecycle-${String(++n).padStart(2, "0")}-${first}.json`, b);
    return inner.transaction(b);
  },
};
const input = sewageCheck("C1", NOW.toISOString(), "vol-fixture");
const sub = await submitCheck(store, site, input, checkTrust(input, site, NOW));
let rec = await loadSiteRecord(store, site, NOW);
await verifyCheck(store, rec, sub.questionnaireResponseId, "Photos confirm grey discharge", NOW.toISOString());
rec = await loadSiteRecord(store, site, NOW);
const srId = await createReferral(store, rec, DEFAULT_WEIGHTS, NOW);
rec = await loadSiteRecord(store, site, NOW);
await recordSimulatedLabResult(store, rec, srId, 2400, NOW.toISOString());

const all = inner.dump();
for (const r of all) {
  // Local-store bookkeeping (versionId/lastUpdated) is fine for FHIR; ids are valid FHIR ids.
  write(`out/resources/${r.resourceType}-${r.id}.json`, r);
}
const counts = all.reduce<Record<string, number>>((m, r) => ((m[r.resourceType] = (m[r.resourceType] ?? 0) + 1), m), {});
console.log(`bundles: ${Object.keys(samples).length + 1}; lifecycle resources: ${all.length}`, counts);
