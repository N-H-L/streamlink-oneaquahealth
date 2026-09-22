// Guards the hand-off between the analysis pipeline (Python, data/baseline/, data/cities/) and the
// app. If those files land in a shape the app can't read, this fails instead of the UI silently
// showing "map context: unknown".
import { describe, expect, it } from "vitest";
import { catalogue, model } from "./data";

const oahSites = catalogue.sites.filter((s) => ["CO", "GH", "TO", "BE", "OS"].includes(s.city));
const withBaseline = oahSites.filter((s) => s.baseline);

describe("site catalogue", () => {
  it("always has the 5 OAH cities and their sites", () => {
    expect(oahSites.length).toBe(106);
    expect(new Set(oahSites.map((s) => s.city)).size).toBe(5);
    for (const s of catalogue.sites) {
      expect(Number.isFinite(s.lat) && Number.isFinite(s.lon)).toBe(true);
      expect(s.name.length).toBeGreaterThan(0);
    }
  });
});

describe.runIf(withBaseline.length > 0)("map-context baseline, once the analysis has produced it", () => {
  it("covers nearly every OAH site with a usable score", () => {
    expect(withBaseline.length / oahSites.length).toBeGreaterThan(0.9);
    for (const s of withBaseline) {
      expect(s.baseline!.score).toBeGreaterThanOrEqual(0);
      expect(s.baseline!.score).toBeLessThanOrEqual(1);
    }
  });
  it("carries the features the UI explains the score with", () => {
    const named = withBaseline.filter((s) => {
      const f = s.baseline!.features;
      return f.distWastewaterM != null || f.distFarmlandM != null || f.urbanFraction2km != null;
    });
    expect(named.length / withBaseline.length).toBeGreaterThan(0.9);
  });
});

describe.runIf(!!model)("model card", () => {
  it("states an evaluation and caveats, so the About page is not empty", () => {
    expect(model.evaluation ?? model.results).toBeTruthy();
    expect(model.caveats ?? model.limitations).toBeTruthy();
  });
});

describe.runIf(catalogue.cities.some((c) => !c.hasLabData))("an added city (no lab data)", () => {
  const city = catalogue.cities.find((c) => !c.hasLabData)!;
  it("has sites with coordinates and no lab snapshot", () => {
    const sites = catalogue.sites.filter((s) => s.city === city.id);
    expect(sites.length).toBeGreaterThan(3);
    expect(sites.every((s) => !s.lab)).toBe(true);
    expect(sites.every((s) => Number.isFinite(s.lat) && Number.isFinite(s.lon))).toBe(true);
  });
});
