import { describe, it, expect } from "vitest";
import { Sector, type CompanyPlacement } from "@venture-forest/shared-types";
import {
  getTreeHeight,
  getTrunkRadius,
  getCanopyParams,
  generateTreeParams,
} from "./tree-generator.js";

function makePlacement(overrides: Partial<CompanyPlacement> = {}): CompanyPlacement {
  return {
    company_id: "c-test",
    world_x: 0,
    world_z: 0,
    elevation: 0,
    radial_rank: 0,
    grove_id: "grove-ai_ml",
    local_cluster_id: null,
    tree_height: 10,
    trunk_radius: 0.5,
    species_type: Sector.AI_ML,
    canopy_variant: 0,
    bark_variant: 0,
    visual_importance_score: 0.5,
    ...overrides,
  };
}

describe("tree-generator", () => {
  it("clamps tree height to the visible range", () => {
    expect(getTreeHeight(makePlacement({ tree_height: 0 }))).toBe(0.5);
    expect(getTreeHeight(makePlacement({ tree_height: 999 }))).toBe(25);
    expect(getTreeHeight(makePlacement({ tree_height: 12 }))).toBe(12);
  });

  it("clamps trunk radius to sane bounds", () => {
    expect(getTrunkRadius(makePlacement({ trunk_radius: 0 }))).toBeGreaterThanOrEqual(0.05);
    expect(getTrunkRadius(makePlacement({ trunk_radius: 50 }))).toBeLessThanOrEqual(1.5);
  });

  it("resolves a valid canopy color for every variant", () => {
    for (const variant of [0, 1, 2, 3] as const) {
      const params = getCanopyParams(makePlacement({ canopy_variant: variant }));
      expect(typeof params.color).toBe("string");
      expect(params.color.length).toBeGreaterThan(0);
    }
  });

  it("generates complete tree params for every sector", () => {
    for (const sector of Object.values(Sector)) {
      const params = generateTreeParams(makePlacement({ species_type: sector }));
      expect(params.height).toBeGreaterThan(0);
      expect(params.trunkRadius).toBeGreaterThan(0);
      expect(params.canopy.radius).toBeGreaterThan(0);
      expect(params.species).toBeDefined();
    }
  });
});
