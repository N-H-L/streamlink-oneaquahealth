// "Load demo scenario": synthetic volunteer checks for Coimbra, so a first-time visitor sees a
// living board. Everything written here is tagged demo; the UI labels it as synthetic.
import { loadRecords } from "../core/record";
import { cleanCheck, sewageCheck } from "../core/samples";
import type { CheckInput } from "../core/questions";
import type { FhirStore } from "../core/store";
import { checkTrust } from "../core/trust";
import { submitCheck, verifyCheck } from "../core/workflow";
import { siteByCode } from "./data";

const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString();

function variant(base: CheckInput, patch: Partial<CheckInput["answers"]>, extra: Partial<CheckInput> = {}): CheckInput {
  return { ...base, ...extra, answers: { ...base.answers, ...patch } };
}

export async function loadDemoScenario(store: FhirStore) {
  const plan: { code: string; input: CheckInput; verify?: boolean }[] = [
    { code: "C6", input: variant(sewageCheck("C6", daysAgo(3), "vol-demo-rita"), { "sewage-discharge": "no", "drain-pipes": "yes", "water-aspect": "foam" }), verify: true },
    { code: "C1", input: variant(cleanCheck("C1", daysAgo(6), "vol-demo-joao"), { "water-aspect": "turbid", "overall-health": "moderate", "water-flow": "stagnant" }, { photos: 0 }) },
    { code: "C12", input: cleanCheck("C12", daysAgo(9), "vol-demo-ana"), verify: true },
    { code: "C19", input: variant(cleanCheck("C19", daysAgo(12), "vol-demo-rita"), { "overall-health": "poor", "bank-type": "artificial", "bottom-type": "artificial", "vegetated-left": "no", "dominant-veg-left": "not-sure" }) },
    { code: "C3", input: variant(cleanCheck("C3", daysAgo(20), "vol-demo-joao"), { "water-aspect": "altered-colour", construction: "yes", "overall-health": "moderate" }) },
  ];
  for (const p of plan) {
    const site = siteByCode(p.code);
    if (!site) continue;
    await submitCheck(store, site, p.input, checkTrust(p.input, site));
  }
  const toVerify = plan.filter((p) => p.verify).map((p) => siteByCode(p.code)!).filter(Boolean);
  const records = await loadRecords(store, toVerify);
  for (const site of toVerify) {
    const rec = records.get(site.code)!;
    const c = rec.checks[0];
    if (c) await verifyCheck(store, rec, c.qr.id!, "Photos reviewed (demo)");
  }
}
