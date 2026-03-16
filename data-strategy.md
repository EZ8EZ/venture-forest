# Data Strategy

This document outlines how Venture Forest acquires, normalizes, and serves venture capital data across three phases.

## Phase A: Static Snapshot

The initial launch uses a manually curated JSON snapshot.

- Source: hand-assembled CSV or JSON covering ~200-500 companies and ~50-100 investors.
- Data is cleaned, validated against Zod schemas, and seeded into Neon Postgres.
- The API serves this snapshot as a single JSON payload on `GET /api/snapshot`.
- Updates are manual: edit the seed file, re-run the migration, redeploy.

**Tradeoff**: low operational complexity, but data becomes stale without manual effort.

## Phase B: Single Provider Integration

Add a live data provider to refresh the snapshot automatically.

- Implement the `DataProvider` interface for one provider (e.g., Crunchbase Basic API or a similar service).
- A nightly cron job fetches new and updated records.
- The normalization layer converts provider-specific schemas to the canonical model.
- Conflict resolution: provider data overwrites the snapshot for fields it covers; manually added fields are preserved.

**Tradeoff**: fresher data, but provider rate limits and API costs constrain update frequency.

## Phase C: Multi-Source Enrichment

Layer multiple providers to fill gaps and cross-validate.

- Add additional providers (PitchBook, LinkedIn company data, Clearbit, manual CSV overrides).
- Each field has a priority ranking per provider, defined in a config file.
- When providers disagree, the highest-priority provider wins, but conflicts are logged for review.
- Enrichment fields (employee count, description, logo) may come from a different provider than core funding data.

**Tradeoff**: comprehensive coverage, but increased complexity in conflict resolution and operational cost.

## Provider Priority Table

| Field           | Priority 1     | Priority 2   | Priority 3    |
|-----------------|---------------|--------------|---------------|
| Funding rounds  | Crunchbase    | PitchBook    | Manual CSV    |
| Valuation       | PitchBook     | Crunchbase   | Manual CSV    |
| Employee count  | LinkedIn      | Crunchbase   | Manual CSV    |
| Company logo    | Clearbit      | Crunchbase   | Manual upload |
| Description     | Crunchbase    | Manual CSV   | -             |

## Data Freshness Targets

- Phase A: updated quarterly or on-demand.
- Phase B: nightly refresh for core fields.
- Phase C: nightly refresh with hourly checks for breaking news (large rounds, IPOs).

## Validation and Quality

- All records pass Zod validation before database insertion.
- Records missing required fields (name, sector) are rejected and logged.
- A weekly report summarizes: total records, new additions, conflicts flagged, records rejected.
