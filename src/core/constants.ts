// Identifiers shared with the FSH project in fhir/. Keep in sync with docs/SPEC-fhir.md.

export const SL = "https://example.org/fhir/streamlink";
export const OAH = "http://hl7.eu/fhir/ig/oah";

export const CS = {
  oah: `${OAH}/CodeSystem/temporarySystem-oah-eu`,
  sl: `${SL}/CodeSystem/streamlink`,
  tags: `${SL}/CodeSystem/streamlink-tags`,
  obsCategory: "http://terminology.hl7.org/CodeSystem/observation-category",
  dataOperation: "http://terminology.hl7.org/CodeSystem/v3-DataOperation",
  provenanceAgent: "http://terminology.hl7.org/CodeSystem/provenance-participant-type",
  ucum: "http://unitsofmeasure.org",
} as const;

export const NS = {
  site: `${SL}/NamingSystem/oah-site-code`,
  volunteer: `${SL}/NamingSystem/volunteer`,
  staff: `${SL}/NamingSystem/staff`,
  check: `${SL}/NamingSystem/check`,
} as const;

export const PROFILE = {
  location: `${OAH}/StructureDefinition/location-oah`,
  oahIndicator: `${OAH}/StructureDefinition/observation-indicators-oah`,
  citizenScientist: `${SL}/StructureDefinition/sl-citizen-scientist`,
  checkResponse: `${SL}/StructureDefinition/sl-stream-check-response`,
  citizenObservation: `${SL}/StructureDefinition/sl-citizen-observation`,
  wellbeing: `${SL}/StructureDefinition/sl-perceived-wellbeing`,
  baseline: `${SL}/StructureDefinition/sl-context-baseline`,
  checkProvenance: `${SL}/StructureDefinition/sl-check-provenance`,
  verificationProvenance: `${SL}/StructureDefinition/sl-verification-provenance`,
  referral: `${SL}/StructureDefinition/sl-lab-sampling-referral`,
  feedback: `${SL}/StructureDefinition/sl-citizen-feedback`,
} as const;

export const EXT = {
  trust: `${SL}/StructureDefinition/sl-trust-assessment`,
  priorityExplanation: `${SL}/StructureDefinition/sl-priority-explanation`,
} as const;

export const QUESTIONNAIRE_URL = `${SL}/Questionnaire/oah-citizen-stream-check`;

export const TAG_DEMO = { system: CS.tags, code: "demo", display: "StreamLink demo record" };
export const TAG_SIMULATED = { system: CS.tags, code: "simulated", display: "Simulated data (demo only)" };

/** Trust-rule threshold: GPS further than this from the chosen site is flagged. */
export const FAR_FROM_SITE_M = 300;
