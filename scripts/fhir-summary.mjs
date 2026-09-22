// Turns the HL7 validator's -output (a Bundle of OperationOutcomes, or one OperationOutcome)
// into out/validation/summary.md and sets the exit code for scripts/validate.sh.
import { readFileSync, writeFileSync } from "node:fs";

const [resultsPath, summaryPath, tx, sushiLine = "", validatorVersion = ""] = process.argv.slice(2);
const raw = JSON.parse(readFileSync(resultsPath, "utf8"));
const oos = raw.resourceType === "Bundle" ? raw.entry.map((e) => e.resource) : [raw];

const FILE_EXT = "http://hl7.org/fhir/StructureDefinition/operationoutcome-file";
const norm = (p) => p.replace(/\\/g, "/");
const rel = (p) => {
  const n = norm(p);
  for (const k of ["fhir/fsh-generated/", "fhir/negative-tests/", "out/bundles/"]) {
    const i = n.lastIndexOf(k);
    if (i >= 0) return n.slice(i);
  }
  return n;
};
const kindOf = (f) => (f.startsWith("fhir/negative-tests/") ? "negative" : f.startsWith("out/bundles/") ? "bundle" : "ig");

const rows = oos.map((oo) => {
  const file = rel(oo.extension?.find((x) => x.url === FILE_EXT)?.valueString ?? oo.id ?? "?");
  const issues = oo.issue ?? [];
  const sev = (s) => issues.filter((i) => (s === "error" ? i.severity === "error" || i.severity === "fatal" : i.severity === s));
  const loc = (i) => (i.expression?.[0] ?? i.location?.[0] ?? "").replace(/\s+/g, " ");
  const msg = (i) => `${loc(i)}: ${(i.details?.text ?? i.diagnostics ?? "").replace(/\s+/g, " ").replace(/\|/g, "\\|")}`;
  // The validator reports "All OK" as a single information issue.
  const infos = sev("information").filter((i) => !/^All OK/.test(i.details?.text ?? ""));
  return { file, kind: kindOf(file), errors: sev("error"), warnings: sev("warning"), infos, msg };
});
rows.sort((a, b) => a.kind.localeCompare(b.kind) || a.file.localeCompare(b.file));

const failures = [];
for (const r of rows) {
  if (r.kind === "negative" && r.errors.length === 0) failures.push(`negative test unexpectedly PASSED: ${r.file}`);
  if (r.kind !== "negative" && r.errors.length > 0) failures.push(`${r.errors.length} error(s): ${r.file}`);
}
const ok = failures.length === 0;
const count = (k) => rows.filter((r) => r.kind === k).length;

let md = `# StreamLink FHIR validation summary

- Result: **${ok ? "PASS" : "FAIL"}**${ok ? "" : ` (${failures.length} problem(s))`}
- Generated: ${new Date().toISOString()}
- SUSHI (fhir/): ${sushiLine.trim() || "n/a"}
- Validator: ${validatorVersion || "HL7 validator_cli"}; FHIR 4.0.1; IGs loaded: \`hl7.eu.fhir.oah#0.1.0-ci-build\` (local build of github.com/hl7-eu/oah b907cf0) + \`fhir/fsh-generated/resources\` (streamlink.fhir.oah-citizen 0.1.0)
- Files: ${count("ig")} IG resources, ${count("bundle")} bundles from \`out/bundles\`, ${count("negative")} negative tests (expected to fail)
- Terminology: \`-tx ${tx}\`. ${tx === "n/a"
  ? "Offline and deterministic. Codes in code systems loaded locally (StreamLink, OAH, HL7 core and terminology.hl7.org) ARE checked against our required bindings; only codes needing an external server (UCUM unit validity, SNOMED, LOINC) are reported as 'unable to validate' warnings. Run with `TX=https://tx.fhir.org/r4` to also check UCUM units (network-dependent, slower)."
  : "Online terminology server: UCUM and external code systems are checked; results depend on the server's availability and content."}
- Display-name mismatches are warnings (\`-display-issues-are-warnings\`); example.org URLs allowed (\`-allow-example-urls\`).

`;
if (!ok) md += `## Problems\n\n${failures.map((f) => `- ${f}`).join("\n")}\n\n`;
md += `## Per file\n\n| Kind | File | Errors | Warnings | Info | Expected |\n|---|---|---:|---:|---:|---|\n`;
for (const r of rows) {
  const expect = r.kind === "negative" ? (r.errors.length ? "fails (OK)" : "**should fail**") : r.errors.length ? "**0 errors**" : "OK";
  md += `| ${r.kind} | \`${r.file}\` | ${r.errors.length} | ${r.warnings.length} | ${r.infos.length} | ${expect} |\n`;
}
md += `\n## First errors per file\n\n`;
for (const r of rows.filter((r) => r.errors.length)) {
  md += `### ${r.file}${r.kind === "negative" ? " (expected)" : ""}\n\n${r.errors.slice(0, 6).map((i) => `- ${r.msg(i)}`).join("\n")}\n\n`;
}
const noisy = (i) => /dom-6|without terminology services/.test(i.details?.text ?? "");
const warnRows = rows.filter((r) => r.kind !== "negative" && r.warnings.some((i) => !noisy(i)));
if (warnRows.length) {
  md += `## Notable warnings (IG resources and bundles)\n\nOmitted here: dom-6 (no narrative) and UCUM "unable to validate without terminology services".\n\n`;
  for (const r of warnRows) md += `### ${r.file}\n\n${r.warnings.filter((i) => !noisy(i)).slice(0, 4).map((i) => `- ${r.msg(i)}`).join("\n")}\n\n`;
}
writeFileSync(summaryPath, md);

const tot = (k, f) => rows.filter((r) => r.kind === k).reduce((s, r) => s + r[f].length, 0);
console.log(`IG resources: ${count("ig")} files, ${tot("ig", "errors")} errors, ${tot("ig", "warnings")} warnings`);
console.log(`Bundles:      ${count("bundle")} files, ${tot("bundle", "errors")} errors, ${tot("bundle", "warnings")} warnings`);
console.log(`Negative:     ${count("negative")} files, ${rows.filter((r) => r.kind === "negative" && r.errors.length).length} failed as expected`);
for (const f of failures) console.log(`  FAIL ${f}`);
console.log(`${ok ? "PASS" : "FAIL"} -> ${summaryPath}`);
process.exit(ok ? 0 : 1);
