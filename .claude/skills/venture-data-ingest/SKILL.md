# Skill: Venture Data Ingest

## Purpose
Ingest, normalize, and validate venture capital data from raw sources into the canonical Venture Forest schema.

## When to Use
- Adding a new batch of companies or investors from a CSV, JSON, or API response.
- Refreshing the dataset from a provider.
- Debugging data quality issues (missing fields, duplicate records, schema mismatches).

## Steps
1. Identify the source format and map its fields to the canonical schema defined in `data-model.md`.
2. Normalize monetary values to USD cents. Convert dates to ISO 8601 strings.
3. Generate slugs for companies and investors (lowercase, hyphens, no punctuation).
4. Validate every record against the Zod schemas in `packages/data-pipeline/src/schemas/`.
5. Flag records that fail validation; log warnings for missing optional fields.
6. Deduplicate against existing records using slug matching.
7. Write validated records to the Neon database via Drizzle ORM.
8. Run the consistency check to confirm record counts match expectations.

## Key Files
- `packages/data-pipeline/src/providers/` - provider adapters.
- `packages/data-pipeline/src/schemas/` - Zod validation schemas.
- `packages/db/src/schema.ts` - Drizzle table definitions.
- `data-model.md` - canonical field reference.
