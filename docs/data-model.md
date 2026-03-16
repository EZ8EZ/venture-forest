# Data Model

## Overview

The data model captures the core entities of the startup ecosystem: companies, investors, funding rounds, and their relationships. It also includes spatial placement data used by the rendering layer. All entities are stored in Neon Postgres and defined in the `data-schema` package.

## Entities

### Company

The central entity. Each company becomes one tree in the forest.

| Field               | Type        | Constraints          | Description                                                    |
|---------------------|-------------|----------------------|----------------------------------------------------------------|
| id                  | UUID        | PK                   | Stable identifier                                              |
| name                | text        | NOT NULL, UNIQUE     | Company name                                                   |
| slug                | text        | NOT NULL, UNIQUE     | URL-safe identifier                                            |
| sector              | text        | NOT NULL             | Primary sector (maps to tree species)                          |
| sub_sector          | text        | nullable             | More specific classification                                   |
| founded_date        | date        | nullable             | Incorporation or founding date                                 |
| hq_location         | text        | nullable             | Headquarters city/country                                      |
| headcount           | integer     | nullable, >= 0       | Current employee count (maps to trunk thickness)               |
| headcount_range     | text        | nullable             | Bucket estimate when exact count is unavailable                |
| total_funding_usd   | bigint      | nullable, >= 0       | Cumulative funding in USD (maps to tree height)                |
| last_funding_date   | date        | nullable             | Date of most recent funding round                              |
| last_funding_stage  | text        | nullable             | Stage of most recent round (seed, series-a, etc.)              |
| status              | text        | NOT NULL, default 'active' | One of: active, acquired, closed, ipo                    |
| website             | text        | nullable             | Primary URL                                                    |
| description         | text        | nullable             | Short company description                                      |
| completeness_score  | float       | NOT NULL, 0.0-1.0    | Fraction of fields populated (see below)                       |
| confidence_flags    | jsonb       | NOT NULL, default {} | Per-field confidence metadata (see below)                      |
| created_at          | timestamptz | NOT NULL             | Record creation time                                           |
| updated_at          | timestamptz | NOT NULL             | Last modification time                                         |

### Investor

Represents a venture capital firm, angel investor, or institutional investor.

| Field           | Type        | Constraints          | Description                                    |
|-----------------|-------------|----------------------|------------------------------------------------|
| id              | UUID        | PK                   | Stable identifier                              |
| name            | text        | NOT NULL, UNIQUE     | Investor name                                  |
| slug            | text        | NOT NULL, UNIQUE     | URL-safe identifier                            |
| type            | text        | NOT NULL             | One of: vc, angel, cvc, pe, accelerator, other |
| website         | text        | nullable             | Primary URL                                    |
| description     | text        | nullable             | Short description                              |
| created_at      | timestamptz | NOT NULL             | Record creation time                           |
| updated_at      | timestamptz | NOT NULL             | Last modification time                         |

### FundingRound

A single funding event for a company.

| Field           | Type        | Constraints          | Description                                    |
|-----------------|-------------|----------------------|------------------------------------------------|
| id              | UUID        | PK                   | Stable identifier                              |
| company_id      | UUID        | FK -> Company        | The company that received funding              |
| round_type      | text        | NOT NULL             | e.g., pre-seed, seed, series-a, series-b, etc.|
| amount_usd      | bigint      | nullable, >= 0       | Amount raised in USD                           |
| announced_date  | date        | nullable             | Public announcement date                       |
| investors       | UUID[]      | nullable             | Array of Investor IDs participating            |
| lead_investor_id| UUID        | FK -> Investor, nullable | Lead investor for this round               |
| created_at      | timestamptz | NOT NULL             | Record creation time                           |
| updated_at      | timestamptz | NOT NULL             | Last modification time                         |

### CompanyInvestorEdge

Join table capturing the relationship between a company and an investor, independent of individual rounds. Used for the root/network visualization.

| Field           | Type        | Constraints                   | Description                          |
|-----------------|-------------|-------------------------------|--------------------------------------|
| id              | UUID        | PK                            | Stable identifier                    |
| company_id      | UUID        | FK -> Company, NOT NULL       | The invested company                 |
| investor_id     | UUID        | FK -> Investor, NOT NULL      | The investing entity                 |
| relationship    | text        | NOT NULL                      | One of: lead, participant, advisor   |
| first_round_date| date        | nullable                      | Earliest round they participated in  |
| round_count     | integer     | NOT NULL, default 1           | Number of rounds this investor joined|
| created_at      | timestamptz | NOT NULL                      | Record creation time                 |

Unique constraint on (company_id, investor_id).

### CompanyPlacement

Spatial coordinates and rendering parameters assigned by the layout-engine.

| Field           | Type        | Constraints                   | Description                          |
|-----------------|-------------|-------------------------------|--------------------------------------|
| id              | UUID        | PK                            | Stable identifier                    |
| company_id      | UUID        | FK -> Company, UNIQUE         | One placement per company            |
| grove_id        | UUID        | FK -> Grove                   | Which grove (sector cluster) it belongs to |
| x               | float       | NOT NULL                      | World-space x position               |
| z               | float       | NOT NULL                      | World-space z position               |
| rotation_y      | float       | NOT NULL, default 0           | Y-axis rotation in radians           |
| computed_height | float       | NOT NULL                      | Tree height derived from funding     |
| computed_radius | float       | NOT NULL                      | Trunk radius derived from headcount  |
| lod_bias        | integer     | NOT NULL, default 0           | LOD level offset for this tree       |
| created_at      | timestamptz | NOT NULL                      | Record creation time                 |
| updated_at      | timestamptz | NOT NULL                      | Last modification time               |

### Grove

A spatial cluster of trees, typically grouped by sector. Groves define regions of the forest.

| Field           | Type        | Constraints          | Description                                    |
|-----------------|-------------|----------------------|------------------------------------------------|
| id              | UUID        | PK                   | Stable identifier                              |
| name            | text        | NOT NULL             | Display name (usually the sector name)         |
| sector          | text        | NOT NULL             | Sector this grove represents                   |
| center_x        | float       | NOT NULL             | World-space center x                           |
| center_z        | float       | NOT NULL             | World-space center z                           |
| radius          | float       | NOT NULL             | Approximate extent of the grove                |
| created_at      | timestamptz | NOT NULL             | Record creation time                           |

## completeness_score

A float between 0.0 and 1.0 calculated during the data pipeline's validation stage. It represents the fraction of "essential" and "very useful" fields that are populated for a given company record.

**Calculation:**

Each field is assigned a weight based on its priority tier (see data-strategy.md):
- Essential fields (name, sector, total_funding_usd): weight 2
- Very useful fields (headcount, founded_date, last_funding_stage): weight 1
- Optional fields (website, description): weight 0 (not counted)

`completeness_score = sum(populated field weights) / sum(all counted field weights)`

Records with a completeness_score below 0.4 may be excluded from the forest or rendered as stumps/saplings to signal incomplete data.

## confidence_flags

A JSONB object attached to each Company record. Each key is a field name; the value describes confidence in that field's accuracy.

Example:

```json
{
  "total_funding_usd": { "source": "crunchbase", "confidence": "high", "last_verified": "2025-11-01" },
  "headcount": { "source": "linkedin_estimate", "confidence": "medium", "last_verified": "2025-09-15" },
  "sector": { "source": "manual", "confidence": "high" }
}
```

Possible confidence levels: `high`, `medium`, `low`, `inferred`.

This metadata lets the frontend decide whether to show a data quality indicator on a tree or flag uncertain values in the detail panel.

## Relationships

```
Company  1---*  FundingRound
Company  *---*  Investor       (via CompanyInvestorEdge)
Company  1---1  CompanyPlacement
Company  *---1  Grove          (via CompanyPlacement.grove_id)
FundingRound *---1 Investor    (via lead_investor_id)
```

## Indexing

Recommended indexes:
- `company.sector` - grove assignment and filtering
- `company.total_funding_usd` - sorting and visual encoding
- `company.status` - filtering active vs. inactive
- `funding_round.company_id` - round lookups per company
- `company_investor_edge(company_id)` and `company_investor_edge(investor_id)` - bidirectional edge traversal
- `company_placement(grove_id)` - spatial queries within a grove
