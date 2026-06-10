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

## Rendering

- Quality preset auto-detection (hardwareConcurrency plus GPU tier) from
  `.claude/rules/performance.md` is not implemented; quality starts at high
  for everyone.
- No `?stats` hidden panel for FPS, draw calls, and triangles as specified in
  the performance rules.
