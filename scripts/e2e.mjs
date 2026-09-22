// End-to-end walkthrough of the core journey in a real browser (headless Microsoft Edge via
// playwright-core). Saves screenshots to out/e2e/ and fails on any console error.
// Usage: start `npm run dev` (port 5173), then `node scripts/e2e.mjs [baseUrl]`.
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const BASE = process.argv[2] ?? "http://localhost:5173/";
const EDGE = process.env.EDGE_PATH ?? "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
mkdirSync("out/e2e", { recursive: true });

const browser = await chromium.launch({ executablePath: EDGE, headless: true });
const errors = [];
async function run(name, viewport, fn) {
  const page = await browser.newPage({ viewport });
  page.on("console", (m) => m.type() === "error" && !/tile|cartocdn|favicon/i.test(m.text()) && errors.push(`[${name}] ${m.text()}`));
  page.on("pageerror", (e) => errors.push(`[${name}] ${e.message}`));
  await fn(page);
  await page.close();
}
const shot = (page, n) => page.screenshot({ path: `out/e2e/${n}.png`, fullPage: true });
const step = (s) => console.log("•", s);

await run("desktop", { width: 1366, height: 900 }, async (page) => {
  await page.goto(BASE);
  await page.evaluate(() => localStorage.clear());
  await page.goto(BASE + "#/board/CO");
  await page.getByRole("heading", { name: "Needs a lab visit" }).waitFor();
  await page.getByRole("complementary", { name: "Guided tour" }).waitFor();
  await page.waitForTimeout(800);
  await shot(page, "01-board-empty");
  await page.getByRole("button", { name: "Close tour" }).click();
  step("board renders (empty store)");

  await page.getByRole("button", { name: "Load demo scenario" }).click();
  await page.getByText("Demo scenario loaded").waitFor();
  await page.waitForTimeout(600);
  await shot(page, "02-board-demo");
  step("demo scenario loaded");

  await page.getByRole("button", { name: "How is this ranked?" }).click();
  await shot(page, "03-weights");
  step("weights panel opens");

  // Citizen check at the hero site (C5 Mina Hospital) with the example answers.
  await page.goto(BASE + "#/check/C5");
  await page.getByRole("button", { name: "Fill with an example" }).click();
  await shot(page, "04-check-step1");
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Next" }).click();
  // Make the answers contradictory: rate "Good" despite sewage.
  await page.getByRole("radio", { name: /^Good/ }).click();
  await shot(page, "05-check-step4");
  await page.getByRole("button", { name: "Review" }).click();
  await page.getByText(/rated the stream as good/).waitFor();
  await shot(page, "06-review-flag");
  step("trust flag shown for good+sewage");

  // Fix it: go back to the rating and choose Poor.
  await page.getByRole("button", { name: "Fix" }).first().click();
  await page.getByRole("radio", { name: /^Poor/ }).click();
  await page.getByRole("button", { name: "Review" }).click();
  await page.getByRole("button", { name: /Send/ }).click();
  await page.getByText("your check is in the stream's record").waitFor();
  await shot(page, "07-done");
  step("check submitted");

  await page.getByRole("button", { name: "Open the stream's record" }).click();
  await page.getByRole("heading", { name: "Coordinator actions" }).waitFor();
  await page.waitForTimeout(500);
  await shot(page, "08-record-preliminary");
  await page.getByRole("button", { name: "Verify check" }).click();
  await page.getByText(/Verified\. The observations/).waitFor();
  await page.getByRole("button", { name: "Request lab visit" }).click();
  await page.getByText(/Lab visit requested \(FHIR/).waitFor();
  await page.waitForTimeout(300);
  await shot(page, "09-record-referral");
  await page.getByRole("button", { name: "Record lab result (simulated)" }).click();
  await page.getByText(/Volunteers were notified/).waitFor();
  await page.waitForTimeout(300);
  await shot(page, "10-record-result");
  step("verify → referral → result");

  await page.goto(BASE + "#/board/CO");
  await page.getByRole("heading", { name: "Needs a lab visit" }).waitFor();
  await page.waitForTimeout(600);
  await shot(page, "11-board-after");
  await page.goto(BASE + "#/about");
  await shot(page, "12-about");
});

await run("mobile", { width: 390, height: 844 }, async (page) => {
  await page.goto(BASE + "#/check/C1");
  await page.getByRole("button", { name: "Fill with an example" }).waitFor();
  await shot(page, "20-mobile-check");
  await page.goto(BASE + "#/site/C5");
  await page.waitForTimeout(800);
  await shot(page, "21-mobile-record");
  await page.goto(BASE + "#/board/CO");
  await page.waitForTimeout(800);
  await shot(page, "22-mobile-board");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  if (overflow) errors.push("[mobile] horizontal overflow on board");
});

await browser.close();
if (errors.length) {
  console.error("ERRORS:\n" + errors.join("\n"));
  process.exit(1);
}
console.log("E2E OK: screenshots in out/e2e/");
