// Builders for every FHIR resource StreamLink writes. Shapes follow docs/SPEC-fhir.md and are
// checked by the HL7 validator against fhir/ (our profiles) and the OAH IG (scripts/validate.sh).
import { CS, EXT, NS, PROFILE, QUESTIONNAIRE_URL, TAG_DEMO, TAG_SIMULATED } from "./constants";
import {
  ABSENT, EMOTIONS, NOT_SURE, PRESENT, QUESTIONS, VEG_TO_OAH, YES,
  type CheckInput, type Coding, type Question,
} from "./questions";
import type { TrustFlag } from "./trust";
import { trustScore } from "./trust";

export type Resource = { resourceType: string; id?: string; meta?: any; [k: string]: any };
export type BundleEntry = { fullUrl?: string; resource?: Resource; request?: { method: string; url: string; ifNoneExist?: string } };
export type Bundle = { resourceType: "Bundle"; type: string; entry: BundleEntry[]; [k: string]: any };

export interface SiteRef {
  code: string;
  name: string;
  cityName: string;
  lat: number;
  lon: number;
}

export const uuid = () => (globalThis.crypto as Crypto).randomUUID();
const urn = (id: string) => `urn:uuid:${id}`;
const meta = (profile: string | string[], simulated = false) => ({
  profile: Array.isArray(profile) ? profile : [profile],
  tag: simulated ? [TAG_DEMO, TAG_SIMULATED] : [TAG_DEMO],
});
const cc = (c: Coding | Coding[], text?: string) => ({ coding: Array.isArray(c) ? c : [c], ...(text ? { text } : {}) });
const slc = (code: string, display?: string): Coding => ({ system: CS.sl, code, ...(display ? { display } : {}) });
const survey = [{ coding: [{ system: CS.obsCategory, code: "survey", display: "Survey" }] }];

export function locationResource(site: SiteRef): Resource {
  return {
    resourceType: "Location",
    meta: meta(PROFILE.location),
    identifier: [{ system: NS.site, value: site.code }],
    status: "active",
    name: site.name,
    description: `Urban stream monitoring site ${site.code}, ${site.cityName}`,
    mode: "instance",
    position: { longitude: site.lon, latitude: site.lat },
  };
}

export function volunteerResource(pseudonym: string): Resource {
  // Pseudonymous by design: no name, telecom or address (profile sl-citizen-scientist).
  return { resourceType: "Practitioner", meta: meta(PROFILE.citizenScientist), identifier: [{ system: NS.volunteer, value: pseudonym }], active: true };
}

export function staffResource(id: string, name: string): Resource {
  return { resourceType: "Practitioner", meta: { tag: [TAG_DEMO] }, identifier: [{ system: NS.staff, value: id }], active: true, name: [{ text: name }] };
}

export function labOrganization(cityName: string): Resource {
  return {
    resourceType: "Organization",
    meta: { tag: [TAG_DEMO] },
    identifier: [{ system: NS.staff, value: `lab-${cityName.toLowerCase()}` }],
    active: true,
    name: `${cityName} municipal water lab (demo)`,
  };
}

const conditional = (r: Resource, system: string, value: string, fullUrl: string): BundleEntry => ({
  fullUrl,
  resource: r,
  request: { method: "POST", url: r.resourceType, ifNoneExist: `identifier=${encodeURIComponent(system)}|${encodeURIComponent(value)}` },
});
const create = (r: Resource, fullUrl: string): BundleEntry => ({ fullUrl, resource: r, request: { method: "POST", url: r.resourceType } });

function answerCoding(q: Question, code: string): Coding {
  const opt = q.options?.find((o) => o.code === code);
  if (q.kind === "yesno") return slc(code, code === YES ? "Yes" : code === "no" ? "No" : "Not sure");
  return slc(code, opt?.label ?? code);
}

/** Observation value for an answer, in OAH terms where OAH has a concept. */
function observationValue(q: Question, code: string): Coding {
  if (q.kind === "yesno") return code === YES ? PRESENT : ABSENT;
  if (q.linkId.startsWith("dominant-veg-")) return VEG_TO_OAH[code];
  return answerCoding(q, code);
}

export interface CheckBundleResult {
  bundle: Bundle;
  ids: { questionnaireResponse: string; observations: string[]; wellbeing?: string; provenance: string };
}

/** Citizen check → transaction Bundle: QuestionnaireResponse, preliminary Observations,
 * perceived-wellbeing Observation, Provenance carrying the trust assessment. */
export function buildCheckBundle(input: CheckInput, site: SiteRef, flags: TrustFlag[]): CheckBundleResult {
  const locUrl = urn(uuid());
  const volUrl = urn(uuid());
  const qrUrl = urn(uuid());
  const provUrl = urn(uuid());
  const entries: BundleEntry[] = [
    conditional(locationResource(site), NS.site, site.code, locUrl),
    conditional(volunteerResource(input.volunteerId), NS.volunteer, input.volunteerId, volUrl),
  ];

  // QuestionnaireResponse: the complete, unmodified answers (including "not sure").
  const items: any[] = [{ linkId: "site", text: "Site", answer: [{ valueReference: { reference: locUrl, display: site.name } }] }];
  for (const q of QUESTIONS) {
    const v = input.answers[q.linkId];
    if (v === undefined || v === "" || (Array.isArray(v) && v.length === 0)) continue;
    let answer: any[];
    if (q.kind === "decimal") answer = [{ valueDecimal: v as number }];
    else if (Array.isArray(v)) answer = v.map((c) => ({ valueCoding: answerCoding(q, c) }));
    else answer = [{ valueCoding: v === NOT_SURE ? slc(NOT_SURE, "Not sure") : answerCoding(q, v as string) }];
    items.push({ linkId: q.linkId, text: q.label, answer });
  }
  if (input.invasiveWhich) items.push({ linkId: "invasive-which", text: "Which invasive plants?", answer: [{ valueString: input.invasiveWhich }] });
  const emo = EMOTIONS.filter((e) => typeof input.emotions[e.code] === "number");
  if (emo.length) {
    items.push({
      linkId: "emotions", text: "How does this place make you feel? (0–10)",
      item: emo.map((e) => ({ linkId: `emotion-${e.code}`, text: e.label, answer: [{ valueInteger: input.emotions[e.code] }] })),
    });
  }
  items.push({ linkId: "photos", text: "Photos taken", answer: [{ valueInteger: input.photos }] });
  if (input.gps) items.push({ linkId: "gps", text: "Location when submitted", answer: [{ valueString: `${input.gps.lat.toFixed(5)},${input.gps.lon.toFixed(5)}` }] });

  entries.push(create({
    resourceType: "QuestionnaireResponse",
    meta: meta(PROFILE.checkResponse),
    questionnaire: QUESTIONNAIRE_URL,
    status: "completed",
    subject: { reference: locUrl, display: site.name },
    authored: input.authored,
    author: { reference: volUrl },
    item: items,
  }, qrUrl));

  // One Observation per definite answer ("not sure" stays only in the QuestionnaireResponse).
  const obsUrls: string[] = [];
  for (const q of QUESTIONS) {
    const v = input.answers[q.linkId];
    if (v === undefined || v === "" || v === NOT_SURE) continue;
    const values = q.kind === "decimal" ? [v] : Array.isArray(v) ? v : [v];
    for (const val of values) {
      const url = urn(uuid());
      const codings = q.indicator.system === CS.oah ? [q.indicator, slc(q.linkId, q.label)] : [q.indicator];
      const obs: Resource = {
        resourceType: "Observation",
        meta: meta(PROFILE.citizenObservation),
        status: "preliminary",
        category: survey,
        code: cc(codings, q.label),
        subject: { reference: locUrl, display: site.name },
        effectiveDateTime: input.authored,
        performer: [{ reference: volUrl }],
        derivedFrom: [{ reference: qrUrl }],
        ...(q.kind === "decimal"
          ? { valueQuantity: { value: val as number, unit: "m", system: CS.ucum, code: "m" } }
          : { valueCodeableConcept: cc(observationValue(q, val as string)) }),
        ...(q.side ? { note: [{ text: `${q.side} bank (facing downstream)` }] } : {}),
      };
      entries.push(create(obs, url));
      obsUrls.push(url);
    }
  }

  let wbUrl: string | undefined;
  if (emo.length) {
    wbUrl = urn(uuid());
    entries.push(create({
      resourceType: "Observation",
      meta: meta(PROFILE.wellbeing),
      status: "preliminary",
      category: survey,
      code: cc(slc("perceived-wellbeing", "Perceived wellbeing at the stream"), "How this place makes a visitor feel"),
      subject: { reference: locUrl, display: site.name },
      effectiveDateTime: input.authored,
      performer: [{ reference: volUrl }],
      derivedFrom: [{ reference: qrUrl }],
      note: [{ text: "Self-reported by a volunteer; not a clinical measure." }],
      component: emo.map((e) => ({ code: cc(slc(e.code, e.label)), valueInteger: input.emotions[e.code] })),
    }, wbUrl));
  }

  const targets = [qrUrl, ...obsUrls, ...(wbUrl ? [wbUrl] : [])];
  entries.push(create({
    resourceType: "Provenance",
    meta: meta(PROFILE.checkProvenance),
    target: targets.map((reference) => ({ reference })),
    recorded: input.authored,
    activity: cc({ system: CS.dataOperation, code: "CREATE", display: "create" }),
    agent: [{ type: cc({ system: CS.provenanceAgent, code: "author", display: "Author" }), who: { reference: volUrl } }],
    entity: [{ role: "source", what: { reference: qrUrl } }],
    extension: [trustExtension(flags)],
  }, provUrl));

  return {
    bundle: { resourceType: "Bundle", type: "transaction", entry: entries },
    ids: { questionnaireResponse: qrUrl, observations: obsUrls, wellbeing: wbUrl, provenance: provUrl },
  };
}

export function trustExtension(flags: TrustFlag[]) {
  return {
    url: EXT.trust,
    extension: [
      { url: "score", valueDecimal: trustScore(flags) },
      ...flags.map((f) => ({
        url: "flag",
        extension: [
          { url: "rule", valueCode: f.rule },
          { url: "message", valueString: f.message },
          { url: "resolution", valueCode: f.resolution },
        ],
      })),
    ],
  };
}

/** Expert verification: preliminary → final. Verified records also claim the official OAH
 * indicator profile, which requires status=final. Returns a transaction Bundle of updates. */
export function buildVerificationBundle(observations: Resource[], reviewer: Resource & { id: string }, when: string, note?: string): Bundle {
  const updated = observations.map((o) => ({
    ...o,
    status: "final",
    meta: { ...o.meta, profile: [PROFILE.citizenObservation, PROFILE.oahIndicator] },
  }));
  const entries: BundleEntry[] = updated.map((o) => ({ fullUrl: `Observation/${o.id}`, resource: o, request: { method: "PUT", url: `Observation/${o.id}` } }));
  entries.push(create({
    resourceType: "Provenance",
    meta: meta(PROFILE.verificationProvenance),
    target: updated.map((o) => ({ reference: `Observation/${o.id}` })),
    recorded: when,
    activity: cc(slc("expert-verification", "Expert verification of citizen observations")),
    agent: [{ type: cc({ system: CS.provenanceAgent, code: "verifier", display: "Verifier" }), who: { reference: `Practitioner/${reviewer.id}` } }],
    ...(note ? { reason: [{ text: note }] } : {}),
  }, urn(uuid())));
  return { resourceType: "Bundle", type: "transaction", entry: entries };
}

export interface ReferralInput {
  locationId: string;
  siteName: string;
  requesterId: string;
  labOrgId: string;
  reasonObservationIds: string[];
  baselineObservationId?: string;
  explanation: string;
  when: string;
}

export function buildReferral(r: ReferralInput): Resource {
  return {
    resourceType: "ServiceRequest",
    meta: meta(PROFILE.referral),
    status: "active",
    intent: "order",
    priority: "urgent",
    code: cc(slc("stream-lab-sampling", "Lab sampling visit to a stream site"), "Lab sampling visit"),
    subject: { reference: `Location/${r.locationId}`, display: r.siteName },
    authoredOn: r.when,
    requester: { reference: `Practitioner/${r.requesterId}` },
    performer: [{ reference: `Organization/${r.labOrgId}` }],
    reasonReference: r.reasonObservationIds.map((id) => ({ reference: `Observation/${id}` })),
    ...(r.baselineObservationId ? { supportingInfo: [{ reference: `Observation/${r.baselineObservationId}` }] } : {}),
    extension: [{ url: EXT.priorityExplanation, valueString: r.explanation }],
  };
}

export interface LabResultInput {
  referral: Resource & { id: string };
  locationId: string;
  siteName: string;
  labOrgId: string;
  volunteerIds: string[];
  coliformsCfuPer100ml: number;
  when: string;
}

/** Simulated lab result closing a referral + feedback to the citizens whose reports triggered it. */
export function buildLabResultBundle(r: LabResultInput): Bundle {
  const resultUrl = urn(uuid());
  const result: Resource = {
    resourceType: "Observation",
    meta: meta(PROFILE.oahIndicator, true),
    status: "final",
    basedOn: [{ reference: `ServiceRequest/${r.referral.id}` }],
    code: cc({ system: CS.oah, code: "coliforms", display: "Coliforms" }),
    subject: { reference: `Location/${r.locationId}`, display: r.siteName },
    effectiveDateTime: r.when,
    performer: [{ reference: `Organization/${r.labOrgId}` }],
    valueQuantity: { value: r.coliformsCfuPer100ml, unit: "CFU/100 mL", system: CS.ucum, code: "{CFU}/100mL" },
    note: [{ text: "SIMULATED result for demonstration. No real sample was taken." }],
  };
  const closed = { ...r.referral, status: "completed" };
  const entries: BundleEntry[] = [
    create(result, resultUrl),
    { fullUrl: `ServiceRequest/${r.referral.id}`, resource: closed, request: { method: "PUT", url: `ServiceRequest/${r.referral.id}` } },
  ];
  for (const v of r.volunteerIds) {
    entries.push(create({
      resourceType: "Communication",
      meta: meta(PROFILE.feedback),
      status: "completed",
      recipient: [{ reference: `Practitioner/${v}` }],
      about: [{ reference: `ServiceRequest/${r.referral.id}` }, { reference: resultUrl }],
      sent: r.when,
      payload: [{ contentString: `Your report at ${r.siteName} led to a lab visit. Thank you: the result is now part of this stream's record.` }],
    }, urn(uuid())));
  }
  return { resourceType: "Bundle", type: "transaction", entry: entries };
}

export interface BaselineInput {
  locationRef: string;
  siteName: string;
  score: number;
  features: { distWastewaterM?: number | null; distFarmlandM?: number | null; urbanFraction2km?: number | null };
  when: string;
}

export function buildBaselineObservation(b: BaselineInput): Resource {
  const q = (v: number, unit: string, code: string) => ({ value: Math.round(v * 100) / 100, unit, system: CS.ucum, code });
  const comps: any[] = [];
  if (b.features.distWastewaterM != null) comps.push({ code: cc(slc("dist-wastewater-plant", "Distance to nearest wastewater plant")), valueQuantity: q(b.features.distWastewaterM, "m", "m") });
  if (b.features.distFarmlandM != null) comps.push({ code: cc(slc("dist-farmland", "Distance to nearest farmland")), valueQuantity: q(b.features.distFarmlandM, "m", "m") });
  if (b.features.urbanFraction2km != null) comps.push({ code: cc(slc("urban-fraction-2km", "Built-up share within 2 km")), valueQuantity: q(b.features.urbanFraction2km, "%", "%") });
  return {
    resourceType: "Observation",
    meta: meta(PROFILE.baseline),
    status: "final",
    code: cc(slc("map-context-risk", "Map-context baseline risk"), "Map-context baseline risk"),
    subject: { reference: b.locationRef, display: b.siteName },
    effectiveDateTime: b.when,
    valueQuantity: { value: Math.round(b.score * 1000) / 1000, unit: "1", system: CS.ucum, code: "1" },
    method: { text: "StreamLink baseline v1: map features calibrated on OneAquaHealth lab data (96 sites, 5 cities)" },
    component: comps,
  };
}
