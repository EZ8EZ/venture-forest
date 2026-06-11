# Engineering Notes

Out-of-scope issues found during development, recorded here per the working
agreement instead of fixing them off-track. Each item should become a task.

## Architecture

- `packages/forest-engine` and `packages/layout-engine` are implemented and
  tested but the web app does not import them. `apps/web/src/lib/types.ts`
  duplicates `packages/shared-types`. The web app consumes pre-computed
  placements from the snapshot JSON instead of running the layout engine.
  Long term: generate placements at build/pipeline time using the layout
  engine so the algorithm and the rendered forest cannot drift.
- `apps/api` is a placeholder shell. Its snapshot route reads
  `data/snapshots/latest.json`, which does not exist. The web app never calls
  the API. Decide: wire it up or remove it until the database phase starts.
- `apps/api` has no eslint or vitest installed; its `lint` and `test` scripts
  were removed because they could not run. Re-add them with real configs when
  the API becomes a real service.

## Documentation

- All design docs exist twice: at repo root and under `docs/`. The `docs/`
  copies are substantially richer and newer in every case. The root copies
  should be deleted or turned into pointers. README links the root copies.
- CLAUDE.md describes packages (`data-models`, shadcn `ui`) and commands
  (`pnpm db:reset`, `data/pipeline/*.py` paths) that do not match the repo.
- README references `docs/assets/screenshot-placeholder.png`, which does not
  exist.

## Testing

- `test:e2e` script exists in `apps/web` but there is no Playwright config or
  spec. The testing rules call for e2e on page load, camera navigation, and
  detail panel, plus screenshot regression baselines.

## Data

- The snapshot dataset mixes about 52 fictional companies (and nearly all 50
  investors) with about 58 real companies. Fictional entries cannot be
  enriched from external providers and will sit in the unmatched log.
  Product decision needed: replace fictional entries with real ones, or keep
  the demo flavor.

## Product

- Compare mode exists in the store (compareIds, add/remove/clear) but has
  no UI. The detail panel's compare button was removed as a dead end;
  build the compare view before reintroducing the affordance.
- Investor detail panel (M5) not built: selecting an investor highlights
  the portfolio and shows roots, but there is no panel with portfolio
  summary stats.

## Data quality (post-expansion)

- Four roster entries cannot be sourced from Harmonic and were dropped
  (see data/enrichment-unmatched.json): Revolut and SHEIN have junk
  records at their domains, Heirloom and Bolt (EU) fail name/domain
  agreement. Adding them requires manual data entry or another provider.
- Some Harmonic funding totals diverge from public knowledge (example:
  Kairos Power shows $3M against publicly reported hundreds of millions
  plus DOE awards). The pipeline is source-honest by design; corrections
  belong in a manual-override layer if they matter.
- JetBrains shows $0 funding, which is factually correct (bootstrapped),
  so it renders as the smallest tree despite being a large company.
  Height encodes funding raised, not company size; the legend says so.

## Rendering

- Quality preset auto-detection (hardwareConcurrency plus GPU tier) from
  `.claude/rules/performance.md` is not implemented; quality starts at high
  for everyone.
- LOD tiers and billboard impostors (rendering-strategy.md) are not
  implemented; the current instanced primitives are cheap at 271 trees,
  but LOD becomes necessary if the dataset grows toward 1000.
- The minimap always shows sector-mode placements; in vintage grouping
  the dots do not follow the regrouped trees (pre-existing behavior).
