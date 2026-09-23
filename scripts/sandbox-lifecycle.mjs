// Continues the demo check on the official OAH sandbox through the rest of the lifecycle
// (verify → lab visit request → simulated result → volunteer message) so the whole loop can be
// shown running on a real FHIR server. Every id it creates is appended to out/sandbox-demo.json,
// so `node scripts/sandbox-demo.mjs --cleanup` removes everything again.
import { readFileSync, writeFileSync } from "node:fs";
import { RemoteStore } from "../src/core/store.ts";
import { loadSiteRecord } from "../src/core/record.ts";
import { oahCatalogue } from "../src/core/sites.ts";
import { DEFAULT_WEIGHTS } from "../src/core/triage.ts";
import { createReferral, recordSimulatedLabResult, verifyCheck } from "../src/core/workflow.ts";

const RECORD = "out/sandbox-demo.json";
const state = JSON.parse(readFileSync(RECORD, "utf8"));
const inner = new RemoteStore(state.base, "OAH sandbox");
const created = [];
const store = {
  kind: inner.kind, label: inner.label, base: inner.base,
  read: inner.read.bind(inner), search: inner.search.bind(inner),
  transaction: async (b) => {
    const res = await inner.transaction(b);
    for (const [full, ref] of Object.entries(res.locations)) if (full.startsWith("urn:uuid:")) created.push(ref);
    return res;
  },
};

const site = oahCatalogue(
  JSON.parse(readFileSync("data/oah/sites.snapshot.json", "utf8")),
  JSON.parse(readFileSync("data/oah/health-risks.snapshot.json", "utf8")),
).sites.find((s) => s.code === "C5");
// Attach the map baseline the app uses, so the referral's stated reasons match what a judge sees.
const feats = JSON.parse(readFileSync("data/baseline/site-features.json", "utf8"));
const f = feats.sites?.[site.code];
if (f?.baselineScore != null) {
  site.baseline = {
    score: f.baselineScore,
    percentile: f.percentile,
    features: { distWastewaterM: f.osm?.distWastewaterM, distFarmlandM: f.osm?.distFarmlandM, urbanFraction2km: f.osm?.urbanFraction2km },
    model: `StreamLink baseline ${feats.model?.version ?? "v1"}`,
  };
}

let rec = await loadSiteRecord(store, site);
console.log(`record on the sandbox: ${rec.checks.length} check(s), ${rec.checks[0]?.observations.length} observations, trust ${rec.checks[0]?.trust}`);
const check = rec.checks[0];
if (!check) throw new Error("no check found on the sandbox; run sandbox-demo.mjs --write first");

if (check.status !== "final") {
  await verifyCheck(store, rec, check.qr.id, "Reviewed for the StreamLink demo");
  rec = await loadSiteRecord(store, site);
  console.log(`verified: newest check is now ${rec.checks[0].status}; profiles ${JSON.stringify(rec.checks[0].observations[0].meta.profile)}`);
}
let referral = rec.referrals.find((r) => r.status === "active");
if (!referral) {
  const id = await createReferral(store, rec, DEFAULT_WEIGHTS);
  rec = await loadSiteRecord(store, site);
  referral = rec.referrals.find((r) => r.id === id);
  console.log(`lab visit requested: ServiceRequest/${id}, reasons: ${referral.reasonReference?.length ?? 0} observations`);
}
if (!rec.labResults.length) {
  await recordSimulatedLabResult(store, rec, referral.id, 2400);
  rec = await loadSiteRecord(store, site);
  console.log(`lab result: ${rec.labResults[0].valueQuantity.value} ${rec.labResults[0].valueQuantity.unit} (tagged ${rec.labResults[0].meta.tag.map((t) => t.code).join("+")}), referral now ${rec.referrals[0].status}`);
}
state.created = [...new Set([...state.created, ...created])];
state.lifecycleWhen = new Date().toISOString();
writeFileSync(RECORD, JSON.stringify(state, null, 2));
console.log(`\ntimeline on the sandbox: ${rec.timeline.map((t) => t.kind).join(" → ")}`);
console.log(`total resources to clean up: ${state.created.length}`);
