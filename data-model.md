# Data Model

This document defines the core entities, their fields, and relationships used throughout Venture Forest.

## Company

Represents a startup or venture-backed company, visualized as a tree.

| Field             | Type     | Description                                      |
|-------------------|----------|--------------------------------------------------|
| id                | uuid     | Primary key.                                     |
| slug              | string   | URL-safe unique identifier (lowercase, hyphens). |
| name              | string   | Display name.                                    |
| sector            | enum     | Industry sector; maps to tree species.           |
| stage             | enum     | Funding stage: seed, seriesA, seriesB, seriesC, late, public. |
| totalFundingCents | integer  | Total funding raised, in USD cents.              |
| valuationCents    | integer  | Latest known valuation, in USD cents.            |
| foundedDate       | string   | ISO 8601 date (YYYY-MM-DD).                      |
| hqCity            | string   | Headquarters city.                               |
| hqCountry         | string   | ISO 3166-1 alpha-2 country code.                 |
| employeeCount     | integer  | Approximate headcount.                           |
| description       | string   | One-sentence company summary.                    |
| logoUrl           | string   | URL to company logo image.                       |
| website           | string   | Company website URL.                             |
| createdAt         | datetime | Record creation timestamp.                       |
| updatedAt         | datetime | Record last-updated timestamp.                   |

### Sector Enum Values
`ai`, `fintech`, `health`, `saas`, `consumer`, `climate`, `web3`, `infra`, `biotech`, `other`

## Investor

Represents a venture capital firm, angel investor, or institutional fund. Visualized as an underground root system.

| Field         | Type     | Description                              |
|---------------|----------|------------------------------------------|
| id            | uuid     | Primary key.                             |
| slug          | string   | URL-safe unique identifier.              |
| name          | string   | Display name.                            |
| type          | enum     | vc, angel, cvc, pe, other.               |
| aum           | integer  | Assets under management, USD cents.      |
| hqCity        | string   | Headquarters city.                       |
| hqCountry     | string   | ISO 3166-1 alpha-2 country code.         |
| website       | string   | Investor website URL.                    |
| createdAt     | datetime | Record creation timestamp.               |
| updatedAt     | datetime | Record last-updated timestamp.           |

## FundingRound

A single funding event linking a company to one or more investors.

| Field           | Type     | Description                                |
|-----------------|----------|--------------------------------------------|
| id              | uuid     | Primary key.                               |
| companyId       | uuid     | Foreign key to Company.                    |
| roundType       | enum     | seed, seriesA, seriesB, seriesC, late, other. |
| amountCents     | integer  | Round size in USD cents.                   |
| preValCents     | integer  | Pre-money valuation in USD cents.          |
| announcedDate   | string   | ISO 8601 date.                             |
| leadInvestorId  | uuid     | Foreign key to Investor (nullable).        |
| createdAt       | datetime | Record creation timestamp.                 |
| updatedAt       | datetime | Record last-updated timestamp.             |

## CompanyInvestorEdge

Join table connecting investors to funding rounds.

| Field       | Type   | Description                          |
|-------------|--------|--------------------------------------|
| id          | uuid   | Primary key.                         |
| companyId   | uuid   | Foreign key to Company.              |
| investorId  | uuid   | Foreign key to Investor.             |
| roundId     | uuid   | Foreign key to FundingRound.         |
| role        | enum   | lead, co-lead, participant.          |

## CompanyPlacement

Stores the computed 3D position for a company tree within the forest.

| Field     | Type   | Description                              |
|-----------|--------|------------------------------------------|
| id        | uuid   | Primary key.                             |
| companyId | uuid   | Foreign key to Company.                  |
| groveId   | uuid   | Foreign key to Grove.                    |
| x         | float  | World-space X coordinate.                |
| z         | float  | World-space Z coordinate.                |
| species   | string | Tree species key (derived from sector).  |
| scale     | float  | Tree scale factor (derived from valuation). |

## Grove

A spatial cluster of trees representing a sector.

| Field      | Type   | Description                            |
|------------|--------|----------------------------------------|
| id         | uuid   | Primary key.                           |
| sector     | enum   | The sector this grove represents.      |
| centerX    | float  | Grove center X coordinate.             |
| centerZ    | float  | Grove center Z coordinate.             |
| radius     | float  | Approximate grove radius.              |
| label      | string | Display label for the grove.           |

## Relationships

- A Company belongs to one Grove (via CompanyPlacement).
- A Company has many FundingRounds.
- A FundingRound has many Investors (via CompanyInvestorEdge).
- An Investor appears in many FundingRounds across many Companies.
- The root network is derived from shared CompanyInvestorEdges: two companies sharing an investor are connected underground.
