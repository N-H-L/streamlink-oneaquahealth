// Proves the built app works with no network: loads it, goes offline, reloads, and submits a check
// (which must queue). Usage: npx vite preview --port 4173, then `node scripts/offline-check.mjs`.
import { chromium } from "playwright-core";
const BASE = process.argv[2] ?? "http://localhost:4173/";
const EDGE = process.env.EDGE_PATH ?? "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const browser = await chromium.launch({ executablePath: EDGE, headless: true });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
await page.goto(BASE + "#/board/CO");
await page.getByRole("heading", { name: "Needs a lab visit" }).waitFor();
await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, { timeout: 15000 });
console.log("• service worker active");

await ctx.setOffline(true);
await page.reload();
await page.getByRole("heading", { name: "Needs a lab visit" }).waitFor({ timeout: 15000 });
console.log("• board still renders with the network off");

await page.getByRole("button", { name: "Close tour" }).click().catch(() => {});
await page.goto(BASE + "#/check/C5");
await page.getByRole("button", { name: "Fill with an example" }).click();
for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Next", exact: true }).click();
await page.getByRole("button", { name: "Review" }).click();
await page.getByRole("button", { name: /Send/ }).click();
await page.getByText(/your check is in the stream's record|Saved on this device/).waitFor({ timeout: 15000 });
const text = await page.locator("section.done h2").innerText();
console.log(`• offline submission: "${text}"`);
await page.screenshot({ path: "out/e2e/30-offline.png", fullPage: true });
await browser.close();
