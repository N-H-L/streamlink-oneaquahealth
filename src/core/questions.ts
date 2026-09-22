// The stream check, mirroring the OneAquaHealth Citizen Science App form field for field
// (see docs/hackathon/research/oah-ecosystem.md §1b). Each question declares how its answer
// maps to an OAH indicator code (docs/SPEC-fhir.md, "Questionnaire items").
import { CS } from "./constants";

export type Coding = { system: string; code: string; display?: string };

export type Option = { code: string; label: string; hint?: string; icon?: string };

export type QuestionKind = "choice" | "multi" | "yesno" | "decimal";

export interface Question {
  linkId: string;
  step: StepId;
  kind: QuestionKind;
  label: string;
  help?: string;
  options?: Option[];
  unit?: string;
  /** OAH (or proposed StreamLink) indicator the answer is recorded under. */
  indicator: Coding;
  /** Free-text qualifier stored in Observation.note, e.g. "left bank". */
  side?: "left" | "right";
  /** Whether this answer describes a short-lived event (what maps can't see). */
  event?: boolean;
}

export type StepId = "channel" | "water" | "margins" | "feel";

export const STEPS: { id: StepId; title: string; subtitle: string }[] = [
  { id: "channel", title: "The channel", subtitle: "What you see within about 100 m of where you stand" },
  { id: "water", title: "The water", subtitle: "Look at the water and anything flowing into it" },
  { id: "margins", title: "The banks", subtitle: "The 5–10 m strip on each side, facing downstream" },
  { id: "feel", title: "How it feels", subtitle: "Your overall impression and how the place makes you feel" },
];

const oah = (code: string, display: string): Coding => ({ system: CS.oah, code, display });
const sl = (code: string, display: string): Coding => ({ system: CS.sl, code, display });

export const IND = {
  morphology: oah("morophology", "Morphology of the streams"),
  hydrology: oah("hydrology", "Hydrology of the stream"),
  foam: oah("foam", "Foam/colour/smell"),
  landUse: oah("LandUse", "Land use in the margins"),
  riparian: oah("riparianVegetation", "Riparian vegetation"),
  invasive: oah("invasiveOrganisms", "Invasive invertebrate, plants and fish"),
  sewage: sl("sewage-discharge", "Sewage discharge observed"),
  drain: sl("drain-outflow", "Draining pipe outflow observed"),
  construction: sl("construction-works", "Construction or works in the stream"),
  overall: sl("citizen-overall-rating", "Citizen overall stream-health rating"),
};

export const QUESTIONS: Question[] = [
  // Step 1: channel
  {
    linkId: "channel-form", step: "channel", kind: "choice", label: "Shape of the channel", indicator: IND.morphology,
    options: [
      { code: "flat", label: "Flat", hint: "wide and shallow", icon: "chan-flat" },
      { code: "u-shape", label: "U shape", icon: "chan-u" },
      { code: "v-shape", label: "V shape", hint: "deep and narrow", icon: "chan-v" },
    ],
  },
  {
    linkId: "bottom-type", step: "channel", kind: "choice", label: "Stream bed", indicator: IND.morphology,
    options: [
      { code: "natural", label: "Natural", hint: "stones, gravel, sand, mud", icon: "natural" },
      { code: "artificial", label: "Artificial", hint: "concrete or cemented stones", icon: "concrete" },
    ],
  },
  {
    linkId: "bank-type", step: "channel", kind: "choice", label: "Banks", indicator: IND.morphology,
    options: [
      { code: "natural", label: "Natural", icon: "natural" },
      { code: "laid-stones", label: "Laid stones", hint: "no concrete", icon: "stones" },
      { code: "artificial", label: "Artificial", hint: "concrete walls", icon: "concrete" },
    ],
  },
  {
    linkId: "habitats", step: "channel", kind: "multi", label: "Habitats you can see", help: "Pick all that apply", indicator: IND.morphology,
    options: [
      { code: "sand-banks", label: "Sand banks" },
      { code: "sand-islands", label: "Sand islands" },
      { code: "stone-deposits", label: "Stone deposits" },
      { code: "riffles", label: "Riffles, rapids or small falls" },
      { code: "aquatic-vegetation", label: "Plants growing in the water" },
    ],
  },
  {
    linkId: "natural-debris", step: "channel", kind: "multi", label: "Natural debris in the water", help: "Pick all that apply", indicator: IND.morphology,
    options: [
      { code: "fallen-trees", label: "Fallen trees" },
      { code: "fallen-branches", label: "Fallen branches" },
      { code: "leaf-deposits", label: "Piles of fallen leaves" },
    ],
  },
  // Step 2: water
  {
    linkId: "water-flow", step: "water", kind: "choice", label: "How is the water moving?", indicator: IND.hydrology,
    options: [
      { code: "fast", label: "Fast", icon: "flow-fast" },
      { code: "slow", label: "Slow", icon: "flow-slow" },
      { code: "stagnant", label: "Still or on and off", icon: "flow-still" },
      { code: "dry", label: "Dry", icon: "flow-dry" },
    ],
  },
  {
    linkId: "water-aspect", step: "water", kind: "choice", label: "How does the water look?", indicator: IND.foam, event: true,
    options: [
      { code: "clear", label: "Clear", icon: "water-clear" },
      { code: "turbid", label: "Muddy or cloudy", icon: "water-turbid" },
      { code: "foam", label: "Foam on the surface", icon: "water-foam" },
      { code: "altered-colour", label: "Unusual colour", icon: "water-colour" },
    ],
  },
  { linkId: "sewage-discharge", step: "water", kind: "yesno", label: "Sewage flowing in", help: "Grey or brown water, toilet paper, a sewage smell", indicator: IND.sewage, event: true },
  { linkId: "drain-pipes", step: "water", kind: "yesno", label: "Pipes discharging polluted water", indicator: IND.drain, event: true },
  { linkId: "construction", step: "water", kind: "yesno", label: "Construction or works in the stream", indicator: IND.construction, event: true },
  { linkId: "water-withdrawal", step: "water", kind: "yesno", label: "Water being pumped or taken out", indicator: IND.hydrology },
  { linkId: "barriers", step: "water", kind: "yesno", label: "Dams or weirs", indicator: IND.hydrology },
  { linkId: "water-height", step: "water", kind: "decimal", label: "Water depth (rough guess)", unit: "m", help: "Leave empty if you can't tell", indicator: IND.hydrology },
  // Step 3: margins
  { linkId: "impervious-left", step: "margins", kind: "yesno", side: "left", label: "Left bank: more than a third paved or built on", indicator: IND.landUse },
  { linkId: "impervious-right", step: "margins", kind: "yesno", side: "right", label: "Right bank: more than a third paved or built on", indicator: IND.landUse },
  { linkId: "vegetated-left", step: "margins", kind: "yesno", side: "left", label: "Left bank: covered by plants", indicator: IND.riparian },
  { linkId: "vegetated-right", step: "margins", kind: "yesno", side: "right", label: "Right bank: covered by plants", indicator: IND.riparian },
  {
    linkId: "dominant-veg-left", step: "margins", kind: "choice", side: "left", label: "Left bank: main plants", indicator: IND.riparian,
    options: [
      { code: "herbs", label: "Grass and herbs", icon: "veg-herbs" },
      { code: "shrubs", label: "Shrubs", icon: "veg-shrubs" },
      { code: "trees", label: "Trees", icon: "veg-trees" },
    ],
  },
  {
    linkId: "dominant-veg-right", step: "margins", kind: "choice", side: "right", label: "Right bank: main plants", indicator: IND.riparian,
    options: [
      { code: "herbs", label: "Grass and herbs", icon: "veg-herbs" },
      { code: "shrubs", label: "Shrubs", icon: "veg-shrubs" },
      { code: "trees", label: "Trees", icon: "veg-trees" },
    ],
  },
  { linkId: "invasive-plants", step: "margins", kind: "yesno", label: "Invasive or non-native plants", help: "e.g. giant reed, Japanese knotweed, water hyacinth", indicator: IND.invasive },
  { linkId: "recent-cuts", step: "margins", kind: "yesno", label: "Vegetation recently cut", indicator: IND.riparian },
  // Step 4: feel
  {
    linkId: "overall-health", step: "feel", kind: "choice", label: "Overall, this stream looks…", indicator: IND.overall,
    options: [
      { code: "good", label: "Good", hint: "natural, plants, clean water, wildlife", icon: "rating-good" },
      { code: "moderate", label: "Moderate", hint: "some changes, still some life", icon: "rating-moderate" },
      { code: "poor", label: "Poor", hint: "concrete, polluted, few plants", icon: "rating-poor" },
    ],
  },
];

export const EMOTIONS = [
  { code: "joy", label: "Joy" },
  { code: "serenity", label: "Calm" },
  { code: "anger", label: "Anger" },
  { code: "fear", label: "Unease" },
] as const;
export type EmotionCode = (typeof EMOTIONS)[number]["code"];

export const NOT_SURE = "not-sure";
export const YES = "yes";
export const NO = "no";

/** Maps a dominant-vegetation answer to the OAH riparian code. */
export const VEG_TO_OAH: Record<string, Coding> = {
  herbs: { system: CS.oah, code: "herbaceous", display: "Herbaceous (height < 1.5m)" },
  shrubs: { system: CS.oah, code: "bushes", display: "Bushes (height (1.5-3m)" },
  trees: { system: CS.oah, code: "trees", display: "Trees (height >3m)" },
};

export const PRESENT: Coding = { system: CS.oah, code: "present", display: "Present" };
export const ABSENT: Coding = { system: CS.oah, code: "absent", display: "Absent" };

export function questionById(linkId: string): Question {
  const q = QUESTIONS.find((x) => x.linkId === linkId);
  if (!q) throw new Error(`Unknown question ${linkId}`);
  return q;
}

/** Answers keyed by linkId. choice/yesno: code; multi: codes[]; decimal: number. */
export type Answers = Partial<Record<string, string | string[] | number>>;

export interface CheckInput {
  siteCode: string;
  answers: Answers;
  emotions: Partial<Record<EmotionCode, number>>;
  photos: number; // count only; photos are never uploaded to shared servers
  gps?: { lat: number; lon: number } | null;
  authored: string; // ISO datetime
  volunteerId: string; // pseudonym
  invasiveWhich?: string;
}
