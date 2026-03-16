# Data Source Trade-offs

This document compares the data sources considered for Venture Forest, noting their strengths, weaknesses, and recommended usage.

## Crunchbase

**Strengths**:
- Broad coverage of global startups and funding rounds.
- Well-structured API with company, investor, and round endpoints.
- Widely recognized as an industry standard.

**Weaknesses**:
- API pricing can be prohibitive for small projects (Basic tier is limited).
- Data can lag behind real-time announcements by days or weeks.
- Self-reported data from companies may contain inaccuracies.

**Recommended for**: primary source for funding rounds, company metadata, and investor profiles.

## PitchBook

**Strengths**:
- Deep coverage of private market valuations and deal terms.
- More reliable valuation data than Crunchbase in many cases.
- Strong coverage of LP and fund-level data.

**Weaknesses**:
- Enterprise pricing only; not accessible for open-source or bootstrapped projects.
- API access requires a sales conversation and contract.
- Data export restrictions in terms of service.

**Recommended for**: valuation data and late-stage deal terms, if budget allows.

## LinkedIn (Company Data)

**Strengths**:
- Best source for employee count and growth trends.
- Company descriptions are often well-maintained.

**Weaknesses**:
- No public API for bulk company data.
- Scraping violates terms of service.
- Requires third-party enrichment services (e.g., Proxycurl) for programmatic access.

**Recommended for**: employee count enrichment via a compliant third-party proxy.

## Clearbit (now part of HubSpot)

**Strengths**:
- Excellent for company logos, domains, and firmographic data.
- Fast API with generous free tier.

**Weaknesses**:
- Limited funding and investor data.
- Primarily a sales-intelligence tool; VC-specific fields are sparse.

**Recommended for**: logo URLs, company domain verification, basic firmographics.

## Manual CSV / JSON

**Strengths**:
- Full control over data quality and coverage.
- No API costs or rate limits.
- Can fill gaps that no provider covers.

**Weaknesses**:
- Does not scale; manual curation is time-intensive.
- Data becomes stale unless actively maintained.

**Recommended for**: initial seed dataset (Phase A), corrections, and overrides for provider errors.

## Summary Table

| Source     | Coverage    | Freshness | Cost       | Recommended Role       |
|-----------|------------|-----------|------------|------------------------|
| Crunchbase | Broad      | Days lag  | Moderate   | Primary provider       |
| PitchBook  | Deep       | Near-live | High       | Valuation enrichment   |
| LinkedIn   | Employees  | Real-time | Via proxy  | Headcount enrichment   |
| Clearbit   | Firmographic| Real-time | Low/Free   | Logos, domains         |
| Manual CSV | Custom     | Manual    | Free       | Seed data, overrides   |
