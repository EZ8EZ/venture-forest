# Venture Forest - Claude Code Guide

Interactive 3D forest visualization of the venture/startup ecosystem, where companies are trees, investors are root networks, and the forest tells the story of innovation.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend framework | React 18 + TypeScript |
| 3D engine | Three.js via React Three Fiber (R3F) + Drei |
| Build tool | Vite |
| State management | Zustand |
| Server state | TanStack Query |
| Styling | Tailwind CSS + shadcn/ui |
| Animation | Framer Motion (UI), custom shaders (3D) |
| Package manager | pnpm (monorepo with workspaces) |
| Database | Neon Postgres (serverless) |
| Data pipeline | Python (ingestion, normalization, snapshots) |
| Testing | Vitest (unit), Playwright (e2e) |

## Repo Structure

```
venture-forest/
  apps/
    web/              # Main R3F application
    api/              # Backend API (if applicable)
  packages/
    ui/               # Shared UI components (shadcn-based)
    shared/           # Shared types, utils, constants
    forest-engine/    # Tree placement, grove logic, layout math
    data-models/      # TypeScript types mirroring DB schema
  data/
    pipeline/         # Python ingestion and normalization scripts
    snapshots/        # Point-in-time data snapshots (JSON)
    seeds/            # Dev seed data
  scripts/            # Build, deploy, and utility scripts
```

## Key Commands

```bash
# Development
pnpm install              # Install all dependencies
pnpm dev                  # Start dev server (web app)
pnpm dev:api              # Start API dev server

# Building
pnpm build                # Build all packages and apps
pnpm build:web            # Build web app only
pnpm typecheck            # Run TypeScript checks across monorepo

# Quality
pnpm lint                 # ESLint across all packages
pnpm lint:fix             # Auto-fix lint issues
pnpm format               # Prettier formatting
pnpm test                 # Run Vitest unit tests
pnpm test:e2e             # Run Playwright e2e tests
pnpm test:coverage        # Unit tests with coverage report

# Database
pnpm db:migrate           # Run pending migrations
pnpm db:seed              # Seed development data
pnpm db:reset             # Reset and re-seed (destructive)

# Data pipeline
python data/pipeline/ingest.py      # Run full ingestion
python data/pipeline/normalize.py   # Normalize raw data
python data/pipeline/snapshot.py    # Generate snapshot
```

## Critical Rules

1. **No em dashes.** Never use the em dash character in any file: code, docs, comments, strings. Use commas, colons, semicolons, or hyphens instead.

2. **Performance first.** The 3D scene must remain interactive at 60fps on mid-range hardware. Every component touching the render loop must be profiled. See `.claude/rules/performance.md`.

3. **World-first design.** The 3D forest is the primary experience. UI overlays are secondary, minimal, and must never obscure the world. See `.claude/rules/ui-overlays.md`.

4. **Graceful data degradation.** Missing or incomplete data must never crash the app or produce visual glitches. Trees render with sensible defaults; tooltips show what is available.

5. **Dependency discipline.** No new packages without justification. The bundle must stay lean. See `.claude/rules/dependency-discipline.md`.

6. **Deterministic layouts.** Given the same data, the forest must produce the same layout. No random placement without seeded RNG.

## Architecture Principles

- Zustand stores are thin; derive computed state with selectors
- TanStack Query handles all server state; no manual fetch/cache
- R3F components never trigger React re-renders from the render loop
- Python pipeline is the single source of truth for data transformation
- TypeScript types in `packages/data-models` are generated from DB schema

## Detailed Documentation

- `.claude/rules/rendering.md` - R3F rendering rules and shader guidelines
- `.claude/rules/performance.md` - Performance budgets and profiling
- `.claude/rules/data-pipeline.md` - Data ingestion and normalization
- `.claude/rules/ui-overlays.md` - Overlay UI principles
- `.claude/rules/testing.md` - Testing strategy and coverage
- `.claude/rules/dependency-discipline.md` - Package management rules
- `.claude/rules/repo-hygiene.md` - Commit, branch, and PR conventions
- `.claude/rules/docs-style.md` - Documentation style rules

## Skills

- `.claude/skills/venture-data-ingest/` - Ingesting company and investor data
- `.claude/skills/forest-layout-engineering/` - Tree placement and grove allocation
- `.claude/skills/forest-rendering-performance-audit/` - 3D performance auditing
- `.claude/skills/forest-ui-polish-pass/` - UI overlay quality review
- `.claude/skills/screenshot-regression-review/` - Visual regression testing
- `.claude/skills/release-readiness-check/` - Pre-release validation
- `.claude/skills/investor-roots-visualization/` - Root/mycelium networks
- `.claude/skills/repo-professionalization-pass/` - Repo presentation quality
- `.claude/skills/readme-excellence-pass/` - README quality review
