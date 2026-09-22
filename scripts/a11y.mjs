// Accessibility audit of the main screens with axe-core in a real browser.
// Usage: npm run dev, then `node scripts/a11y.mjs [baseUrl]`. Writes out/a11y.json.
import { chromium } from "playwright-core";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const BASE = process.argv[2] ?? "http://localhost:5173/";
const EDGE = process.env.EDGE_PATH ?? "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const axe = readFileSync("node_modules/axe-core/axe.min.js", "utf8");
const PAGES = [["board", "#/board/CO"], ["check", "#/check/C5"], ["record", "#/site/C5"], ["inbox", "#/inbox"], ["about", "#/about"], ["settings", "#/settings"]];

const browser = await chromium.launch({ executablePath: EDGE, headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const results = [];
for (const [name, hash] of PAGES) {
  await page.goto(BASE + hash);
  await page.waitForTimeout(1200);
  await page.addScriptTag({ content: axe });
  const r = await page.evaluate(async () => await window.axe.run(document, { resultTypes: ["violations"] }));
  const violations = r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length, target: v.nodes[0]?.target?.[0] }));
  results.push({ page: name, violations });
  console.log(`${name}: ${violations.length ? violations.map((v) => `${v.id}(${v.impact}×${v.nodes})`).join(", ") : "no violations"}`);
}
await browser.close();
mkdirSync("out", { recursive: true });
const total = results.reduce((n, r) => n + r.violations.length, 0);
writeFileSync("out/a11y.json", JSON.stringify({ tool: "axe-core 4 (WCAG 2.1 A/AA rules)", generated: new Date().toISOString(), totalViolations: total, results }, null, 2));
console.log(total === 0 ? "A11Y OK" : `${total} violation types found`);
