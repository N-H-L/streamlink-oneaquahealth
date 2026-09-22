import { describe, expect, it } from "vitest";
import sitesRaw from "../../data/oah/sites.snapshot.json";
import risksRaw from "../../data/oah/health-risks.snapshot.json";
import { CS, PROFILE } from "./constants";
import { buildCheckBundle } from "./fhir";
import { QUESTIONS } from "./questions";
import { loadSiteRecord } from "./record";
import { cleanCheck, contradictoryCheck, sewageCheck } from "./samples";
import { oahCatalogue } from "./sites";
import { LocalStore } from "./store";
import { DEFAULT_WEIGHTS, prioritise } from "./triage";
import { checkTrust, trustScore } from "./trust";
import { createReferral, recordSimulatedLabResult, submitCheck, verifyCheck, volunteerInbox } from "./workflow";

const { sites, cities } = oahCatalogue(sitesRaw as any[], risksRaw as any[]);
const site = sites.find((s) => s.code === "C1")!;
const NOW = new Date("2026-09-23T10:00:00Z");

describe("catalogue", () => {
  it("loads the 5 OAH cities, 106 sites and 96 lab snapshots", () => {
    expect(cities.map((c) => c.name).sort()).toEqual(["Benevento", "Coimbra", "Ghent", "Oslo", "Toulouse"]);
    expect(sites).toHaveLength(106);
    expect(sites.filter((s) => s.lab)).toHaveLength(96);
    expect(site.name).toBe("Exploratório");
  });
});

describe("trust rules", () => {
  it("flags a contradiction and a missing photo, and scores it", () => {
    const flags = checkTrust(contradictoryCheck("C1", NOW.toISOString()), site, NOW);
    expect(flags.map((f) => f.rule).sort()).toEqual(["good-but-sewage", "no-photos"]);
    expect(trustScore(flags)).toBeCloseTo(0.6);
  });
  it("citizen confirmation halves a penalty; expert dismissal removes it", () => {
    const flags = checkTrust(contradictoryCheck("C1", NOW.toISOString()), site, NOW);
    flags[0].resolution = "confirmed-by-citizen";
    flags[1].resolution = "dismissed-by-expert";
    expect(trustScore(flags)).toBeGreaterThan(0.6);
  });
  it("detects GPS far from the site, dry-but-wet, stagnant riffles, odd depth, future time", () => {
    const c = cleanCheck("C1", new Date(NOW.getTime() + 3600_000).toISOString());
    c.gps = { lat: site.lat + 0.01, lon: site.lon };
    c.answers["water-flow"] = "dry";
    c.answers["water-height"] = 4;
    const rules = checkTrust(c, site, NOW).map((f) => f.rule);
    expect(rules).toEqual(expect.arrayContaining(["far-from-site", "dry-but-wet", "implausible-height", "future-time"]));
    const d = cleanCheck("C1", NOW.toISOString());
    d.answers["water-flow"] = "stagnant";
    expect(checkTrust(d, site, NOW).map((f) => f.rule)).toContain("stagnant-riffles");
  });
  it("a clean check has no flags", () => {
    expect(checkTrust(cleanCheck("C1", NOW.toISOString()), site, NOW)).toEqual([]);
  });
});

describe("FHIR extraction", () => {
  const input = sewageCheck("C1", NOW.toISOString());
  const { bundle, ids } = buildCheckBundle(input, site, checkTrust(input, site, NOW));
  const types = bundle.entry.map((e) => e.resource!.resourceType);

  it("builds one transaction with QR, observations, wellbeing and provenance", () => {
    expect(bundle.type).toBe("transaction");
    expect(types.filter((t) => t === "QuestionnaireResponse")).toHaveLength(1);
    expect(types.filter((t) => t === "Provenance")).toHaveLength(1);
    expect(ids.wellbeing).toBeTruthy();
    // 22 answered questions; "not-sure" answers (2) create no observation; multi-selects expand.
    const expected = QUESTIONS.reduce((n, q) => {
      const v = input.answers[q.linkId];
      if (v === undefined || v === "not-sure") return n;
      return n + (Array.isArray(v) ? v.length : 1);
    }, 0);
    expect(ids.observations).toHaveLength(expected);
  });
  it("citizen observations are preliminary, profiled and derived from the QR", () => {
    const obs = bundle.entry.filter((e) => e.resource!.resourceType === "Observation").map((e) => e.resource!);
    for (const o of obs) {
      expect(o.status).toBe("preliminary");
      expect(o.derivedFrom[0].reference).toBe(ids.questionnaireResponse);
    }
    const sewage = obs.find((o) => o.code.coding.some((c: any) => c.code === "sewage-discharge"))!;
    expect(sewage.valueCodeableConcept.coding[0]).toMatchObject({ system: CS.oah, code: "present" });
    const morph = obs.find((o) => o.code.coding.some((c: any) => c.code === "channel-form"))!;
    expect(morph.code.coding[0]).toMatchObject({ system: CS.oah, code: "morophology" });
    expect(morph.meta.profile).toEqual([PROFILE.citizenObservation]);
  });
  it("carries the volunteer pseudonym only", () => {
    const vol = bundle.entry.find((e) => e.resource!.resourceType === "Practitioner")!.resource!;
    expect(vol.name).toBeUndefined();
    expect(vol.telecom).toBeUndefined();
    expect(bundle.entry[1].request?.ifNoneExist).toContain("volunteer");
  });
});

describe("full lifecycle on the local store", () => {
  it("check-in → verify → refer → simulated result → citizen feedback", async () => {
    const store = new LocalStore();
    const input = sewageCheck("C1", NOW.toISOString(), "vol-lifecycle");
    const sub = await submitCheck(store, site, input, checkTrust(input, site, NOW));
    expect(sub.observationIds.every(Boolean)).toBe(true);

    // A second check on the same site reuses the Location (ifNoneExist).
    const clean = cleanCheck("C1", new Date(NOW.getTime() - 86400_000 * 20).toISOString());
    await submitCheck(store, site, clean, checkTrust(clean, site, NOW));
    expect(await store.search("Location")).toHaveLength(1);

    let rec = await loadSiteRecord(store, site, NOW);
    expect(rec.checks).toHaveLength(2);
    expect(rec.checks[0].events).toEqual(expect.arrayContaining(["sewage", "drain", "foam"]));
    expect(rec.checks[0].status).toBe("preliminary");
    const before = prioritise(site, rec.checks, false, DEFAULT_WEIGHTS, NOW).score;

    await verifyCheck(store, rec, sub.questionnaireResponseId, "Photos confirm grey discharge", NOW.toISOString());
    rec = await loadSiteRecord(store, site, NOW);
    expect(rec.checks[0].status).toBe("final");
    const verifiedObs = rec.checks[0].observations[0];
    expect(verifiedObs.meta.profile).toEqual([PROFILE.citizenObservation, PROFILE.oahIndicator]);
    expect(prioritise(site, rec.checks, false, DEFAULT_WEIGHTS, NOW).score).toBeGreaterThan(before);

    const srId = await createReferral(store, rec, DEFAULT_WEIGHTS, NOW);
    rec = await loadSiteRecord(store, site, NOW);
    expect(rec.referrals[0].id).toBe(srId);
    expect(rec.referrals[0].reasonReference.length).toBeGreaterThan(0);

    await recordSimulatedLabResult(store, rec, srId, 2400, NOW.toISOString());
    rec = await loadSiteRecord(store, site, NOW);
    expect(rec.referrals[0].status).toBe("completed");
    expect(rec.labResults).toHaveLength(1);
    expect(rec.labResults[0].meta.tag.map((t: any) => t.code)).toContain("simulated");
    expect(rec.timeline.map((t) => t.kind)).toEqual(expect.arrayContaining(["check", "verification", "referral", "lab", "lab-campaign"]));

    const inbox = await volunteerInbox(store, "vol-lifecycle");
    expect(inbox).toHaveLength(1);
    expect(inbox[0].payload[0].contentString).toContain("led to a lab visit");
  });
});

describe("triage", () => {
  it("a fresh sewage report outranks the same site without reports; reports decay with age", async () => {
    const store = new LocalStore();
    const input = sewageCheck("C1", NOW.toISOString());
    await submitCheck(store, site, input, checkTrust(input, site, NOW));
    const rec = await loadSiteRecord(store, site, NOW);
    const withReport = prioritise(site, rec.checks, false, DEFAULT_WEIGHTS, NOW);
    const without = prioritise(site, [], false, DEFAULT_WEIGHTS, NOW);
    const later = prioritise(site, rec.checks, false, DEFAULT_WEIGHTS, new Date(NOW.getTime() + 86400_000 * 28));
    expect(withReport.score).toBeGreaterThan(without.score);
    expect(later.score).toBeLessThan(withReport.score);
    expect(withReport.topReason).toContain("Sewage");
  });
});
