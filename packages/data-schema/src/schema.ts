import {
  pgTable,
  pgEnum,
  text,
  varchar,
  integer,
  real,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
  bigint,
} from "drizzle-orm/pg-core";

export const sectorEnum = pgEnum("sector", [
  "AI_ML",
  "FINTECH",
  "CLIMATE_ENERGY",
  "BIOTECH",
  "CONSUMER",
  "DEVELOPER_TOOLS",
  "ENTERPRISE",
  "HEALTHCARE",
  "EDUCATION",
  "OTHER",
]);

export const headcountBucketEnum = pgEnum("headcount_bucket", [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1001-5000",
  "5001+",
]);

export const companyStatusEnum = pgEnum("company_status", [
  "active",
  "acquired",
  "public",
  "closed",
]);

export const investorTypeEnum = pgEnum("investor_type", [
  "vc",
  "angel",
  "corporate",
  "accelerator",
  "government",
]);

export const roundTypeEnum = pgEnum("round_type", [
  "pre_seed",
  "seed",
  "series_a",
  "series_b",
  "series_c",
  "series_d",
  "series_e",
  "series_f",
  "series_g",
  "series_h",
  "growth",
  "debt",
  "grant",
  "ipo",
  "acquired",
  "unknown",
]);

export const edgeRoleEnum = pgEnum("edge_role", [
  "lead",
  "participant",
  "unknown",
]);

// ---- Tables ----

export const companies = pgTable(
  "companies",
  {
    id: text("id").primaryKey(),
    slug: varchar("slug", { length: 255 }).notNull(),
    name: varchar("name", { length: 512 }).notNull(),
    website: text("website"),
    description: text("description"),
    founded_year: integer("founded_year"),
    age_years: integer("age_years"),
    hq_city: varchar("hq_city", { length: 255 }),
    hq_country: varchar("hq_country", { length: 128 }),
    sector: sectorEnum("sector").notNull(),
    subsector: varchar("subsector", { length: 255 }),
    tags: jsonb("tags").$type<string[]>().default([]),
    total_funding_usd: bigint("total_funding_usd", { mode: "number" }),
    latest_round_type: varchar("latest_round_type", { length: 64 }),
    latest_round_date: varchar("latest_round_date", { length: 32 }),
    headcount_min: integer("headcount_min"),
    headcount_max: integer("headcount_max"),
    headcount_display: varchar("headcount_display", { length: 64 }),
    headcount_bucket: headcountBucketEnum("headcount_bucket"),
    status: companyStatusEnum("status").notNull().default("active"),
    logo_url: text("logo_url"),
    external_source_url: text("external_source_url"),
    source_ids: jsonb("source_ids").$type<string[]>().default([]),
    completeness_score: real("completeness_score").notNull().default(0),
    confidence_flags: jsonb("confidence_flags")
      .$type<Record<string, string>>()
      .default({}),
    created_at: timestamp("created_at").defaultNow(),
    updated_at: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    slugIdx: uniqueIndex("companies_slug_idx").on(table.slug),
    sectorIdx: index("companies_sector_idx").on(table.sector),
    statusIdx: index("companies_status_idx").on(table.status),
    totalFundingIdx: index("companies_total_funding_idx").on(table.total_funding_usd),
    foundedYearIdx: index("companies_founded_year_idx").on(table.founded_year),
  })
);

export const investors = pgTable(
  "investors",
  {
    id: text("id").primaryKey(),
    slug: varchar("slug", { length: 255 }).notNull(),
    name: varchar("name", { length: 512 }).notNull(),
    type: investorTypeEnum("type").notNull(),
    website: text("website"),
    description: text("description"),
    location: varchar("location", { length: 255 }),
    external_source_url: text("external_source_url"),
    created_at: timestamp("created_at").defaultNow(),
    updated_at: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    slugIdx: uniqueIndex("investors_slug_idx").on(table.slug),
    typeIdx: index("investors_type_idx").on(table.type),
  })
);

export const fundingRounds = pgTable(
  "funding_rounds",
  {
    id: text("id").primaryKey(),
    company_id: text("company_id")
      .notNull()
      .references(() => companies.id),
    round_type: roundTypeEnum("round_type").notNull(),
    announced_date: varchar("announced_date", { length: 32 }),
    amount_usd: bigint("amount_usd", { mode: "number" }),
    lead_investor_ids: jsonb("lead_investor_ids").$type<string[]>().default([]),
    investor_ids: jsonb("investor_ids").$type<string[]>().default([]),
    created_at: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    companyIdx: index("funding_rounds_company_idx").on(table.company_id),
    typeIdx: index("funding_rounds_type_idx").on(table.round_type),
    dateIdx: index("funding_rounds_date_idx").on(table.announced_date),
  })
);

export const companyInvestorEdges = pgTable(
  "company_investor_edges",
  {
    company_id: text("company_id")
      .notNull()
      .references(() => companies.id),
    investor_id: text("investor_id")
      .notNull()
      .references(() => investors.id),
    edge_strength: real("edge_strength").notNull().default(1),
    role: edgeRoleEnum("role").notNull().default("unknown"),
    source: text("source"),
  },
  (table) => ({
    companyIdx: index("edges_company_idx").on(table.company_id),
    investorIdx: index("edges_investor_idx").on(table.investor_id),
  })
);

export const companyPlacements = pgTable(
  "company_placements",
  {
    company_id: text("company_id")
      .primaryKey()
      .references(() => companies.id),
    world_x: real("world_x").notNull(),
    world_z: real("world_z").notNull(),
    elevation: real("elevation").notNull().default(0),
    radial_rank: integer("radial_rank").notNull(),
    grove_id: text("grove_id")
      .notNull()
      .references(() => groves.id),
    local_cluster_id: text("local_cluster_id"),
    tree_height: real("tree_height").notNull(),
    trunk_radius: real("trunk_radius").notNull(),
    species_type: sectorEnum("species_type").notNull(),
    canopy_variant: integer("canopy_variant").notNull().default(0),
    bark_variant: integer("bark_variant").notNull().default(0),
    visual_importance_score: real("visual_importance_score").notNull().default(0),
  },
  (table) => ({
    groveIdx: index("placements_grove_idx").on(table.grove_id),
    speciesIdx: index("placements_species_idx").on(table.species_type),
  })
);

export const groves = pgTable("groves", {
  id: text("id").primaryKey(),
  sector: sectorEnum("sector").notNull(),
  center_x: real("center_x").notNull(),
  center_z: real("center_z").notNull(),
  radius: real("radius").notNull(),
  label: varchar("label", { length: 255 }).notNull(),
});
