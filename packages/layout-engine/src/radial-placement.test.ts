import { describe, it, expect } from "vitest";
import { Sector, CompanyStatus, type Company } from "@venture-forest/shared-types";
import { computeRadialPlacements } from "./radial-placement.js";
import { allocateGroves } from "./grove-allocator.js";

function makeCompany(id: string, sector: Sector, funding: number): Company {
  return {
    id,
    slug: id,
    name: id,
    website: null,
    description: null,
    founded_year: null,
    age_years: null,
    hq_city: null,
    hq_country: null,
    sector,
    subsector: null,
    tags: [],
    total_funding_usd: funding,
    latest_round_type: null,
    latest_round_date: null,
    headcount_min: null,
    headcount_max: null,
    headcount_display: null,
    headcount_bucket: null,
    status: CompanyStatus.ACTIVE,
    logo_url: null,
    external_source_url: null,
    source_ids: [],
    completeness_score: 1,
    confidence_flags: {},
  };
}

describe("computeRadialPlacements", () => {
  const companies = [
    makeCompany("a", Sector.AI_ML, 500_000_000),
    makeCompany("b", Sector.AI_ML, 50_000_000),
    makeCompany("c", Sector.AI_ML, 5_000_000),
    makeCompany("d", Sector.FINTECH, 120_000_000),
  ];
  const groves = allocateGroves(companies);

  it("produces one placement per company", () => {
    const placements = computeRadialPlacements(companies, groves);
    expect(placements).toHaveLength(companies.length);
    expect(new Set(placements.map((p) => p.company_id)).size).toBe(companies.length);
  });

  it("is deterministic for the same input and seed", () => {
    const run1 = computeRadialPlacements(companies, groves, { seed: 42 });
    const run2 = computeRadialPlacements(companies, groves, { seed: 42 });
    expect(run1).toEqual(run2);
  });

  it("places higher-funded companies closer to their grove center", () => {
    const placements = computeRadialPlacements(companies, groves);
    const grove = groves.find((g) => g.sector === Sector.AI_ML)!;
    const dist = (id: string) => {
      const p = placements.find((pl) => pl.company_id === id)!;
      return Math.hypot(p.world_x - grove.center_x, p.world_z - grove.center_z);
    };
    expect(dist("a")).toBeLessThan(dist("c"));
  });

  it("enforces minimum spacing between trees", () => {
    const placements = computeRadialPlacements(companies, groves, { minSpacing: 3 });
    for (let i = 0; i < placements.length; i++) {
      for (let j = i + 1; j < placements.length; j++) {
        const d = Math.hypot(
          placements[i].world_x - placements[j].world_x,
          placements[i].world_z - placements[j].world_z,
        );
        expect(d).toBeGreaterThan(1);
      }
    }
  });

  it("scales tree height with funding within bounds", () => {
    const placements = computeRadialPlacements(companies, groves);
    for (const p of placements) {
      expect(p.tree_height).toBeGreaterThanOrEqual(1.2);
      expect(p.tree_height).toBeLessThanOrEqual(38);
    }
    const heightOf = (id: string) => placements.find((p) => p.company_id === id)!.tree_height;
    expect(heightOf("a")).toBeGreaterThan(heightOf("c"));
  });

  it("differentiates mid-band funding heights visibly (cube-root scale)", () => {
    const mids = [
      makeCompany("m500", Sector.AI_ML, 500_000_000),
      makeCompany("m2000", Sector.AI_ML, 2_000_000_000),
    ];
    const midGroves = allocateGroves(mids);
    const placements = computeRadialPlacements(mids, midGroves);
    const h = (id: string) => placements.find((p) => p.company_id === id)!.tree_height;
    // $2B should be clearly taller than $500M (was a ~7% difference on the
    // old log curve; cube root gives ~59%)
    expect(h("m2000") / h("m500")).toBeGreaterThan(1.4);
  });

  it("derives trunk radius from headcount, not funding", () => {
    const big = { ...makeCompany("hc-big", Sector.AI_ML, 10_000_000), headcount_min: 5000, headcount_max: 10000 };
    const small = { ...makeCompany("hc-small", Sector.AI_ML, 10_000_000), headcount_min: 11, headcount_max: 50 };
    const g = allocateGroves([big, small]);
    const placements = computeRadialPlacements([big, small], g);
    const r = (id: string) => placements.find((p) => p.company_id === id)!.trunk_radius;
    expect(r("hc-big")).toBeGreaterThan(r("hc-small"));
  });

  it("falls back to sector median headcount when missing", () => {
    const withHc = { ...makeCompany("w1", Sector.FINTECH, 1_000_000_000), headcount_min: 400, headcount_max: 600 };
    const noHc = makeCompany("n1", Sector.FINTECH, 1_000_000_000); // headcount null
    const g = allocateGroves([withHc, noHc]);
    const placements = computeRadialPlacements([withHc, noHc], g);
    const r = (id: string) => placements.find((p) => p.company_id === id)!.trunk_radius;
    // The fallback uses the sector median (500), same as withHc's midpoint
    expect(r("n1")).toBeCloseTo(r("w1"), 5);
  });

  it("differentiates decacorn heights instead of clamping at one cap", () => {
    const giants = [
      makeCompany("g1", Sector.AI_ML, 120_000_000_000),
      makeCompany("g2", Sector.AI_ML, 30_000_000_000),
    ];
    const giantGroves = allocateGroves(giants);
    const placements = computeRadialPlacements(giants, giantGroves);
    const h = (id: string) => placements.find((p) => p.company_id === id)!.tree_height;
    expect(h("g1")).toBeGreaterThan(h("g2"));
  });

  it("handles an empty company list", () => {
    expect(computeRadialPlacements([], [])).toEqual([]);
  });

  it("handles a single company without dividing by zero", () => {
    const single = [makeCompany("solo", Sector.OTHER, 1_000_000)];
    const singleGroves = allocateGroves(single);
    const placements = computeRadialPlacements(single, singleGroves);
    expect(placements).toHaveLength(1);
    expect(Number.isFinite(placements[0].world_x)).toBe(true);
    expect(Number.isFinite(placements[0].world_z)).toBe(true);
  });
});
