// Example checks used by tests, the validation fixtures (scripts/gen-bundles.ts) and the app's
// "Fill with an example" button. They describe plausible situations; they are not real reports.
import type { CheckInput } from "./questions";

export function sewageCheck(siteCode: string, authored: string, volunteerId = "vol-demo-a"): CheckInput {
  return {
    siteCode,
    authored,
    volunteerId,
    photos: 2,
    gps: null,
    answers: {
      "channel-form": "u-shape",
      "bottom-type": "natural",
      "bank-type": "laid-stones",
      habitats: ["stone-deposits", "aquatic-vegetation"],
      "natural-debris": ["fallen-branches"],
      "water-flow": "slow",
      "water-aspect": "foam",
      "sewage-discharge": "yes",
      "drain-pipes": "yes",
      construction: "no",
      "water-withdrawal": "no",
      barriers: "not-sure",
      "water-height": 0.4,
      "impervious-left": "yes",
      "impervious-right": "no",
      "vegetated-left": "no",
      "vegetated-right": "yes",
      "dominant-veg-left": "not-sure",
      "dominant-veg-right": "shrubs",
      "invasive-plants": "yes",
      "recent-cuts": "no",
      "overall-health": "poor",
    },
    invasiveWhich: "Giant reed (Arundo donax)",
    emotions: { joy: 2, serenity: 3, anger: 6, fear: 4 },
  };
}

export function cleanCheck(siteCode: string, authored: string, volunteerId = "vol-demo-b"): CheckInput {
  return {
    siteCode,
    authored,
    volunteerId,
    photos: 3,
    gps: null,
    answers: {
      "channel-form": "v-shape",
      "bottom-type": "natural",
      "bank-type": "natural",
      habitats: ["riffles", "stone-deposits", "sand-banks"],
      "natural-debris": ["fallen-trees", "leaf-deposits"],
      "water-flow": "fast",
      "water-aspect": "clear",
      "sewage-discharge": "no",
      "drain-pipes": "no",
      construction: "no",
      "water-withdrawal": "no",
      barriers: "no",
      "impervious-left": "no",
      "impervious-right": "no",
      "vegetated-left": "yes",
      "vegetated-right": "yes",
      "dominant-veg-left": "trees",
      "dominant-veg-right": "trees",
      "invasive-plants": "no",
      "recent-cuts": "no",
      "overall-health": "good",
    },
    emotions: { joy: 8, serenity: 9, anger: 0, fear: 1 },
  };
}

/** A check containing a contradiction the trust rules should catch ("good" + sewage). */
export function contradictoryCheck(siteCode: string, authored: string): CheckInput {
  const c = sewageCheck(siteCode, authored, "vol-demo-c");
  c.answers["overall-health"] = "good";
  c.photos = 0;
  return c;
}
