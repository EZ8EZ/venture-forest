import { describe, it, expect } from "vitest";
import { Sector, CompanyStatus, type Company } from "@venture-forest/shared-types";
import { allocateGroves } from "./grove-allocator.js";

function makeCompany(id: string, sector: Sector): Company {
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
    total_funding_usd: 1_000_000,
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

describe("allocateGroves", () => {
  it("creates groves only for sectors that have companies", () => {
    const companies = [
      makeCompany("a", Sector.AI_ML),
      makeCompany("b", Sector.AI_ML),
      makeCompany("c", Sector.BIOTECH),
    ];
    const groves = allocateGroves(companies);
    expect(groves).toHaveLength(2);
    expect(new Set(groves.map((g) => g.sector))).toEqual(
      new Set([Sector.AI_ML, Sector.BIOTECH]),
    );
  });

  it("is deterministic for the same seed", () => {
    const companies = [makeCompany("a", Sector.AI_ML), makeCompany("b", Sector.FINTECH)];
    expect(allocateGroves(companies, { seed: 7 })).toEqual(
      allocateGroves(companies, { seed: 7 }),
    );
  });

  it("returns an empty list for no companies", () => {
    expect(allocateGroves([])).toEqual([]);
  });

  it("scales grove radius with company count", () => {
    const few = allocateGroves([makeCompany("a", Sector.AI_ML)]);
    const many = allocateGroves(
      Array.from({ length: 30 }, (_, i) => makeCompany(`c${i}`, Sector.AI_ML)),
    );
    expect(many[0].radius).toBeGreaterThan(few[0].radius);
  });
});
