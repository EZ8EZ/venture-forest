# Data Strategy

## Phased Approach

The data strategy evolves in three phases, starting with maximum control and minimal external dependencies.

### Phase A - Local Curated Snapshot

Start with a hand-curated dataset stored as versioned JSON/CSV files in the `data/snapshots/` directory.

- 100-500 companies, manually researched and verified
- All fields filled to the extent possible from public sources (press releases, Crunchbase free tier, LinkedIn)
- Snapshot is committed to the repo and loaded into Neon via the pipeline
- No external API calls at runtime
- Full control over data quality and completeness

**Why start here:** eliminates API cost, rate limits, and authentication complexity during early development. Lets the team focus on rendering and interaction before solving data infrastructure.

### Phase B - Provider Abstraction

Introduce a data provider interface so the pipeline can pull from multiple sources without coupling to any single vendor.

```
DataProvider interface:
  search_companies(query) -> CompanyStub[]
  get_company(id) -> CompanyDetail
  get_funding_rounds(company_id) -> FundingRound[]
  get_investors(company_id) -> Investor[]
```

Concrete implementations:
- `LocalSnapshotProvider` - reads from data/snapshots (Phase A, kept as fallback)
- `CrunchbaseProvider` - wraps Crunchbase API
- `CsvProvider` - reads from uploaded CSV files
- Future: PitchBook, custom scrapers, etc.

The pipeline orchestrator calls providers through this interface. A merge/dedup layer handles combining results from multiple providers.

### Phase C - Enriched Multi-Source

Run multiple providers in parallel, merge results, and compute confidence per field.

- Each provider tags its output with a source identifier
- The merge layer picks the highest-confidence value for each field when sources disagree
- confidence_flags record which source provided each field and when
- completeness_score is recomputed after merging
- Scheduled pipeline runs keep data fresh (daily or weekly)

## Field Priority

Fields are categorized by their importance to the visualization and the overall product.

### Essential (must have for a tree to render)

- `name` - identity
- `sector` - determines species
- `total_funding_usd` - determines height

Without these three fields, a company cannot be meaningfully placed in the forest.

### Very Useful (significantly improves the tree)

- `headcount` or `headcount_range` - determines trunk thickness
- `founded_date` - determines bark maturity/age
- `last_funding_stage` - contextual information
- `hq_location` - potential future spatial encoding
- At least one investor relationship - enables root visualization

### Optional (enriches the detail panel but not the tree)

- `website`
- `description`
- `sub_sector`
- `status` (defaults to "active")

## Graceful Degradation

When data is incomplete, the visualization degrades gracefully rather than breaking.

| Missing Field       | Fallback Behavior                                          |
|---------------------|------------------------------------------------------------|
| total_funding_usd   | Cannot render tree; record excluded or shown as seed/sprout|
| headcount           | Use median thickness for the sector                        |
| headcount_range     | Map range to approximate value (e.g., "11-50" -> 30)      |
| founded_date        | Use neutral bark maturity (mid-range)                      |
| sector              | Assign to "Other / General" grove                          |
| investor data       | Tree has no roots; root visualization is simply absent     |
| description         | Detail panel shows "No description available"              |
| website             | Omit link from detail panel                                |

Trees with low completeness_score (< 0.4) are rendered as small stumps or saplings with a visual indicator that data is limited.

## Snapshot Format

Snapshots in `data/snapshots/` follow this structure:

```
snapshots/
  2025-11-01/
    companies.json
    investors.json
    funding_rounds.json
    edges.json
    metadata.json      # snapshot date, source, record counts
```

Each file is a JSON array of objects conforming to the schema defined in `data-schema`. The `metadata.json` file records provenance: when the snapshot was created, which sources contributed, and total record counts.

Snapshots are immutable once created. New data produces a new dated directory.

## Pipeline Architecture

```
Source Files / API Responses
         |
         v
    Ingest Layer
    (provider-specific readers)
         |
         v
    Normalize Layer
    (map to canonical schema, parse dates, convert currencies)
         |
         v
    Merge Layer (Phase C)
    (deduplicate, pick highest-confidence values)
         |
         v
    Validate Layer
    (check constraints, compute completeness_score, set confidence_flags)
         |
         v
    Load Layer
    (upsert into Neon Postgres, update computed fields)
```

The pipeline is written in Python, runs as a CLI tool, and is idempotent. It can be invoked locally during development or triggered in CI for production refreshes.

Key libraries: `pydantic` for schema validation, `psycopg` for Postgres access, `httpx` for API calls (Phase B+).
