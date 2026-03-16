# Data Source Trade-offs

## Overview

Venture Forest needs structured data about startups: company profiles, funding rounds, headcount, sector classification, and investor relationships. Several data sources exist, each with distinct strengths, costs, and limitations. This document evaluates the options and explains why the project starts with a local curated snapshot.

## Source Evaluation

### Crunchbase

**What it offers:** the most comprehensive commercial database of startups, funding rounds, investors, and acquisitions. REST and bulk-export APIs. Good coverage of US and European companies.

**Strengths:**
- Broad coverage (millions of records)
- Structured funding round data with investor attribution
- Regular updates
- Well-documented API

**Limitations:**
- API pricing is significant: the Basic plan is limited; the Enterprise API (needed for bulk access and investor data) costs thousands per year
- Rate limits on lower tiers make large dataset construction slow
- Data is not always current for headcount (often lags by months)
- Sector/category taxonomy is their own; may not align perfectly with the species mapping

**Verdict:** excellent data quality, but cost and rate limits make it impractical as the sole source during early development. Worth integrating in Phase B or C via the provider abstraction.

### PitchBook

**What it offers:** deep institutional-grade data on private companies, PE/VC firms, deals, and fund performance. Used heavily by professional investors.

**Strengths:**
- Very detailed funding and valuation data
- Strong investor and fund-level data
- High accuracy for institutional deals

**Limitations:**
- Extremely expensive (five-figure annual contracts)
- API access is restricted and requires a sales conversation
- Designed for institutional users, not developer side projects
- Terms of service may restrict use in public-facing visualizations

**Verdict:** out of scope for this project's budget and access model. Useful to know it exists for reference, but not a practical source.

### Public Datasets and Open Sources

Examples: OpenCorporates, SEC EDGAR filings, Y Combinator's public company list, ProductHunt launches, government business registries.

**Strengths:**
- Free
- No API keys or rate limits (usually)
- Some datasets are well-structured (SEC filings, for instance)

**Limitations:**
- Sparse and inconsistent coverage
- Rarely include funding amounts or investor details
- Require significant cleaning and normalization
- No single public source covers all the fields Venture Forest needs
- Many are US-centric

**Verdict:** useful as supplementary data in Phase C (multi-source enrichment), but cannot serve as a primary source alone. Good for validating data from other providers.

### Curated CSV / Local Snapshot

Hand-researched dataset compiled from public sources (press releases, company websites, LinkedIn, news articles, Crunchbase free-tier profiles).

**Strengths:**
- Free
- Full control over data quality and completeness
- No API dependencies, rate limits, or authentication
- Can be version-controlled and committed to the repo
- Fields can be tailored exactly to the schema
- Ideal for development and demos

**Limitations:**
- Manual effort to compile and maintain
- Does not scale beyond a few hundred companies without significant time investment
- Data freshness depends on manual updates
- Potential for human error in data entry

**Verdict:** the right choice for Phase A. Gets the project running without external dependencies. The 100-500 company range is sufficient to build and validate the entire visualization pipeline.

## Why Start with a Local Snapshot

The first priority is building and proving the visualization, not solving data infrastructure. A local snapshot:

1. **Eliminates blocking dependencies.** No API keys to provision, no billing to set up, no rate limits to navigate.
2. **Gives full control.** Every field can be populated deliberately, making it easy to test edge cases (very large funding, very old companies, missing fields).
3. **Is fast to iterate on.** Fixing a data issue is editing a JSON file, not re-running an API pipeline.
4. **Is reproducible.** Anyone who clones the repo gets the same dataset, making development and review predictable.
5. **Is free.** No ongoing cost for a dataset that will be rewritten once the pipeline matures.

The snapshot is not a permanent solution. It is scaffolding that gets replaced as the data pipeline evolves.

## Provider Abstraction Design

To avoid coupling to any single data source, the pipeline uses a provider abstraction:

```
interface DataProvider:
    name: str

    search_companies(query: str, limit: int) -> list[CompanyStub]
    get_company_detail(identifier: str) -> CompanyDetail | None
    get_funding_rounds(company_id: str) -> list[FundingRound]
    get_investors(company_id: str) -> list[InvestorStub]
```

Each provider implements this interface. The pipeline orchestrator:

1. Calls one or more providers for each company
2. Passes results through a merge layer that deduplicates and picks the highest-confidence value per field
3. Tags each field with its source in `confidence_flags`
4. Computes `completeness_score` after merging

Adding a new data source means writing a new provider class. No changes to the pipeline core, the schema, or the frontend.

### Provider Priority and Fallback

When multiple providers return data for the same field, the merge layer uses a priority order:

1. Manually curated data (highest trust)
2. Crunchbase or equivalent commercial API
3. Public datasets
4. Inferred or estimated values (lowest trust)

If a higher-priority source has a value, it wins. If not, the system falls through to lower-priority sources. This ensures the best available data is used without silently dropping fields.

## Cost Summary

| Source           | Cost               | Coverage   | Quality    | Access Friction |
|------------------|--------------------|-----------|-----------|--------------------|
| Local snapshot   | Free (labor only)  | Limited    | High (manual) | None            |
| Crunchbase Basic | ~$300/year         | Good       | Good       | API key, rate limits|
| Crunchbase Enterprise | ~$5k+/year   | Excellent  | Good       | Sales process      |
| PitchBook        | ~$20k+/year        | Excellent  | Excellent  | Enterprise sales   |
| Public datasets  | Free               | Sparse     | Variable   | None               |
| Curated CSV      | Free (labor only)  | Flexible   | Variable   | None               |

For a project in its early stages, the local snapshot is the clear winner. The provider abstraction ensures the system can grow into more sophisticated data sources without rearchitecting.
