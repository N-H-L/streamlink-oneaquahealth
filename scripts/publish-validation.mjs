// Copies the headline of out/validation/summary.md into data/validation-summary.json (committed),
// so the app's About page shows the latest real validator result. Run after scripts/validate.sh.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const md = readFileSync("out/validation/summary.md", "utf8");
const grab = (re) => (md.match(re) ?? [])[1]?.trim() ?? null;
const rows = [...md.matchAll(/^\| (ig|bundle|negative) \| `([^`]+)` \| (\d+) \| (\d+) \| (\d+) \| ([^|]+)\|/gm)].map((m) => ({ kind: m[1], file: m[2], errors: +m[3], warnings: +m[4], expectedOk: !m[6].includes("**") }));
const sum = (k) => rows.filter((r) => r.kind === k);
const out = {
  result: grab(/Result: \*\*(\w+)\*\*/),
  generated: grab(/Generated: (.+)/),
  validator: grab(/Validator: (FHIR Validation tool Version [^;]+)/),
  terminology: grab(/Terminology: `([^`]+)`/),
  igResources: { files: sum("ig").length, errors: sum("ig").reduce((a, r) => a + r.errors, 0) },
  engineOutputs: { files: sum("bundle").length, errors: sum("bundle").reduce((a, r) => a + r.errors, 0) },
  negativeTests: { files: sum("negative").length, failedAsExpected: sum("negative").filter((r) => r.errors > 0).length },
};
mkdirSync("data", { recursive: true });
writeFileSync("data/validation-summary.json", JSON.stringify(out, null, 2));
console.log(out);
