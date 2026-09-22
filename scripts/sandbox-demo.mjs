// Writes ONE clearly labelled demo check to the official OneAquaHealth FHIR sandbox and reads it
// back, to evidence that StreamLink's records work on a real server.
//
//   node scripts/sandbox-demo.mjs --write     write + read back (needs the project owner's OK)
//   node scripts/sandbox-demo.mjs --cleanup   delete what this script wrote (ids in out/sandbox-demo.json)
//
// Without a flag it does nothing but print what it would send. Everything it writes is tagged
// `demo` in meta.tag and uses the site the OAH sandbox already knows.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { RemoteStore } from "../src/core/store.ts";
import { buildCheckBundle } from "../src/core/fhir.ts";
import { checkTrust } from "../src/core/trust.ts";
import { sewageCheck } from "../src/core/samples.ts";
import { oahCatalogue } from "../src/core/sites.ts";

const BASE = "https://sandbox.hl7europe.eu/oneaquahealth/fhir";
const RECORD = "out/sandbox-demo.json";
const mode = process.argv[2] ?? "--dry-run";

const sites = oahCatalogue(
  JSON.parse(readFileSync("data/oah/sites.snapshot.json", "utf8")),
  JSON.parse(readFileSync("data/oah/health-risks.snapshot.json", "utf8")),
).sites;
const site = sites.find((s) => s.code === "C5");
const store = new RemoteStore(BASE, "OAH sandbox");

if (mode === "--cleanup") {
  const written = JSON.parse(readFileSync(RECORD, "utf8"));
  for (const ref of written.created.reverse()) {
    const res = await fetch(`${BASE}/${ref}`, { method: "DELETE" });
    console.log(`DELETE ${ref} → ${res.status}`);
  }
  process.exit(0);
}

const input = sewageCheck(site.code, new Date().toISOString(), "vol-streamlink-demo");
const { bundle } = buildCheckBundle(input, site, checkTrust(input, site));
console.log(`Would POST a transaction with ${bundle.entry.length} entries to ${BASE}`);
console.log(`Resource types: ${[...new Set(bundle.entry.map((e) => e.resource.resourceType))].join(", ")}`);
console.log(`Every resource is tagged: ${JSON.stringify(bundle.entry[2].resource.meta.tag)}`);

if (mode !== "--write") {
  console.log("\nDry run only. Re-run with --write once the project owner has approved writing to the shared sandbox.");
  process.exit(0);
}

const { locations } = await store.transaction(bundle);
const created = Object.values(locations);
mkdirSync("out", { recursive: true });
writeFileSync(RECORD, JSON.stringify({ base: BASE, when: new Date().toISOString(), created }, null, 2));
console.log(`\nWrote ${created.length} resources:`);
for (const ref of created) console.log("  " + ref);

// Read back: prove the server stored and can search what we sent.
const [type, id] = created.find((r) => r.startsWith("QuestionnaireResponse")).split("/");
const back = await store.read(type, id);
console.log(`\nRead back ${type}/${id}: questionnaire=${back.questionnaire}, items=${back.item.length}, authored=${back.authored}`);
const locId = created.find((r) => r.startsWith("Location")).split("/")[1];
const obs = await store.search("Observation", { subject: `Location/${locId}` });
console.log(`Search Observation?subject=Location/${locId} → ${obs.length} resources; statuses: ${[...new Set(obs.map((o) => o.status))].join(", ")}`);
console.log(`\nCleanup later with: node scripts/sandbox-demo.mjs --cleanup`);
