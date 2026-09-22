// The record lifecycle as actions against any FhirStore:
// check-in → verify → refer → lab result (+ feedback to citizens).
import { NS } from "./constants";
import {
  buildBaselineObservation, buildCheckBundle, buildLabResultBundle, buildReferral, buildVerificationBundle,
  labOrganization, locationResource, staffResource, uuid, type Resource,
} from "./fhir";
import type { CheckInput } from "./questions";
import { findLocationId, type SiteRecord } from "./record";
import type { Site } from "./sites";
import type { FhirStore } from "./store";
import { checkTrust, type TrustFlag } from "./trust";
import { explain, prioritise, type Weights } from "./triage";

export const DEMO_STAFF = {
  coordinator: { id: "coordinator-demo", name: "Stream-health coordinator (demo)" },
  reviewer: { id: "ecologist-demo", name: "Freshwater ecologist (demo)" },
};

async function ensure(store: FhirStore, r: Resource, system: string, value: string): Promise<string> {
  const found = await store.search(r.resourceType, { identifier: `${system}|${value}` });
  if (found[0]?.id) return found[0].id;
  const full = `urn:uuid:${uuid()}`;
  const res = await store.transaction({
    resourceType: "Bundle", type: "transaction",
    entry: [{ fullUrl: full, resource: r, request: { method: "POST", url: r.resourceType, ifNoneExist: `identifier=${system}|${value}` } }],
  });
  return res.locations[full].split("/")[1];
}

export const ensureLocation = (store: FhirStore, site: Site) => ensure(store, locationResource(site), NS.site, site.code);
export const ensureStaff = (store: FhirStore, who: { id: string; name: string }) => ensure(store, staffResource(who.id, who.name), NS.staff, who.id);
export const ensureLab = (store: FhirStore, cityName: string) => ensure(store, labOrganization(cityName), NS.staff, `lab-${cityName.toLowerCase()}`);

export interface SubmitResult {
  flags: TrustFlag[];
  questionnaireResponseId: string;
  observationIds: string[];
  locationId: string;
}

/** Citizen check-in. `flags` must be the (possibly citizen-resolved) output of checkTrust. */
export async function submitCheck(store: FhirStore, site: Site, input: CheckInput, flags = checkTrust(input, site)): Promise<SubmitResult> {
  const { bundle, ids } = buildCheckBundle(input, site, flags);
  const { locations } = await store.transaction(bundle);
  const id = (u: string) => locations[u]?.split("/")[1];
  return {
    flags,
    questionnaireResponseId: id(ids.questionnaireResponse),
    observationIds: ids.observations.map(id),
    locationId: id(bundle.entry[0].fullUrl!),
  };
}

export async function verifyCheck(store: FhirStore, record: SiteRecord, qrId: string, note?: string, when = new Date().toISOString()) {
  const check = record.checks.find((c) => c.qr.id === qrId);
  if (!check) throw new Error("Check not found in this record");
  const reviewerId = await ensureStaff(store, DEMO_STAFF.reviewer);
  const toVerify = [...check.observations, ...(check.wellbeing ? [check.wellbeing] : [])].filter((o) => o.status === "preliminary");
  // Wellbeing is self-reported: it is confirmed as final but never claims the OAH indicator profile.
  const indicatorObs = toVerify.filter((o) => o !== check.wellbeing);
  const bundle = buildVerificationBundle(indicatorObs, { resourceType: "Practitioner", id: reviewerId }, when, note, store.base);
  if (check.wellbeing && check.wellbeing.status === "preliminary") {
    bundle.entry.unshift({
      fullUrl: `${store.base}/Observation/${check.wellbeing.id}`,
      resource: { ...check.wellbeing, status: "final" },
      request: { method: "PUT", url: `Observation/${check.wellbeing.id}` },
    });
    (bundle.entry.at(-1)!.resource!.target as any[]).push({ reference: `Observation/${check.wellbeing.id}` });
  }
  await store.transaction(bundle);
}

export async function createReferral(store: FhirStore, record: SiteRecord, weights: Weights, now = new Date()): Promise<string> {
  const locationId = record.locationId ?? (await ensureLocation(store, record.site));
  const requesterId = await ensureStaff(store, DEMO_STAFF.coordinator);
  const labId = await ensureLab(store, record.site.cityName);
  const p = prioritise(record.site, record.checks, false, weights, now);
  const reasonIds = record.checks.filter((c) => c.events.length).flatMap((c) => c.observations.filter((o) => isEventObs(o)).map((o) => o.id!));
  let baselineId = record.baselineObs?.id;
  if (!baselineId && record.site.baseline) {
    const full = `urn:uuid:${uuid()}`;
    const res = await store.transaction({
      resourceType: "Bundle", type: "transaction",
      entry: [{
        fullUrl: full,
        resource: buildBaselineObservation({ locationRef: `Location/${locationId}`, siteName: record.site.name, score: record.site.baseline.score, features: record.site.baseline.features, when: now.toISOString() }),
        request: { method: "POST", url: "Observation" },
      }],
    });
    baselineId = res.locations[full].split("/")[1];
  }
  const sr = buildReferral({
    locationId, siteName: record.site.name, requesterId, labOrgId: labId,
    reasonObservationIds: reasonIds, baselineObservationId: baselineId, explanation: explain(p, weights), when: now.toISOString(),
  });
  const full = `urn:uuid:${uuid()}`;
  const res = await store.transaction({ resourceType: "Bundle", type: "transaction", entry: [{ fullUrl: full, resource: sr, request: { method: "POST", url: "ServiceRequest" } }] });
  return res.locations[full].split("/")[1];
}

function isEventObs(o: Resource): boolean {
  const code = o.code?.coding?.find((c: any) => c.system?.includes("streamlink"))?.code;
  const v = o.valueCodeableConcept?.coding?.[0]?.code;
  if (["sewage-discharge", "drain-outflow", "construction-works"].includes(code)) return v === "present";
  if (code === "water-aspect") return ["foam", "altered-colour", "turbid"].includes(v);
  return code === "citizen-overall-rating" && v === "poor";
}

/** Records a SIMULATED lab result for a referral (demo only; tagged "simulated"). */
export async function recordSimulatedLabResult(store: FhirStore, record: SiteRecord, referralId: string, coliforms: number, when = new Date().toISOString()) {
  const referral = record.referrals.find((r) => r.id === referralId);
  if (!referral) throw new Error("Referral not found");
  const labId = (referral.performer?.[0]?.reference ?? "").split("/")[1] || (await ensureLab(store, record.site.cityName));
  const volunteerIds = [...new Set(record.checks.filter((c) => c.events.length).map((c) => c.volunteerRef?.split("/")[1]).filter(Boolean) as string[])];
  const bundle = buildLabResultBundle({
    referral: referral as Resource & { id: string }, locationId: record.locationId!, siteName: record.site.name, labOrgId: labId,
    volunteerIds, coliformsCfuPer100ml: coliforms, when, base: store.base,
  });
  await store.transaction(bundle);
}

export async function volunteerInbox(store: FhirStore, volunteerId: string): Promise<Resource[]> {
  const found = await store.search("Practitioner", { identifier: `${NS.volunteer}|${volunteerId}` });
  if (!found[0]) return [];
  return store.search("Communication", { recipient: `Practitioner/${found[0].id}` });
}

export { findLocationId };
