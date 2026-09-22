// Removes everything StreamLink wrote to the OneAquaHealth sandbox, in reverse dependency order
// (a server refuses to delete a resource another one still points at).
//   node scripts/sandbox-cleanup.mjs           what would be deleted
//   node scripts/sandbox-cleanup.mjs --delete  delete it
const BASE = "https://sandbox.hl7europe.eu/oneaquahealth/fhir";
const TAGS = [
  "https://n-h-l.github.io/streamlink-oneaquahealth/fhir/CodeSystem/streamlink-tags|demo",
  "https://example.org/fhir/streamlink/CodeSystem/streamlink-tags|demo", // earlier placeholder canonical
];
// Most dependent first: nothing points at a Communication; everything points at a Location.
const ORDER = ["Communication", "Provenance", "ServiceRequest", "Observation", "QuestionnaireResponse", "Practitioner", "Organization", "Location"];
const doDelete = process.argv.includes("--delete");

const found = new Map();
for (const type of ORDER) {
  for (const tag of TAGS) {
    const url = `${BASE}/${type}?_tag=${encodeURIComponent(tag)}&_count=100`;
    const b = await fetch(url, { headers: { Accept: "application/fhir+json", "Cache-Control": "no-cache" } }).then((r) => r.json());
    for (const e of b.entry ?? []) if (e.resource?.resourceType === type) found.set(`${type}/${e.resource.id}`, type);
  }
}
const byType = ORDER.map((t) => [t, [...found].filter(([, ty]) => ty === t).length]).filter(([, n]) => n);
console.log(`StreamLink-tagged resources on the sandbox: ${found.size} (${byType.map(([t, n]) => `${t} ${n}`).join(", ")})`);
if (!doDelete) {
  console.log("Dry run. Re-run with --delete to remove them.");
  process.exit(0);
}
let gone = 0;
const failed = [];
for (const type of ORDER) {
  for (const [ref, ty] of found) {
    if (ty !== type) continue;
    let res = await fetch(`${BASE}/${ref}`, { method: "DELETE" });
    if (!res.ok) res = await fetch(`${BASE}/${ref}?_cascade=delete`, { method: "DELETE", headers: { "X-Cascade": "delete" } });
    if (res.ok) gone++;
    else failed.push(`${ref} (${res.status})`);
  }
}
console.log(`deleted ${gone}; ${failed.length ? "failed: " + failed.join(", ") : "nothing left behind"}`);
