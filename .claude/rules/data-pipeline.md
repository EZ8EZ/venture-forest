# Data Pipeline Rules

## Snapshot Format
- The canonical data format is a typed JSON snapshot conforming to the schema in `data-model.md`.
- Snapshots are versioned with a `schemaVersion` field; always migrate old snapshots forward.
- Store raw provider responses separately from normalized snapshots.

## Normalization
- All monetary values are stored in USD as integers (cents) to avoid floating-point drift.
- Dates use ISO 8601 strings (YYYY-MM-DD). No Unix timestamps in the normalized layer.
- Company names are stored as-is but matched via a slugified key (lowercase, hyphens, no punctuation).

## Provider Abstraction
- Each data provider (Crunchbase, PitchBook, manual CSV) implements a common `DataProvider` interface.
- The interface exposes: `fetchCompanies`, `fetchInvestors`, `fetchRounds`.
- Provider-specific quirks (rate limits, pagination) are encapsulated inside the provider; consumers never see them.

## Field Priority
- When multiple providers supply the same field, use the priority order defined in `data-strategy.md`.
- Always prefer the most recently updated value unless a provider is explicitly marked authoritative.
- Flag conflicts for manual review rather than silently overwriting.

## Validation
- Validate every inbound record against Zod schemas before writing to the database.
- Reject records missing required fields; log warnings for missing optional fields.
- Run a nightly consistency check comparing provider counts to database counts.
