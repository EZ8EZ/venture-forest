# System Architecture

Venture Forest is a 3D data visualization platform that renders venture capital ecosystems as stylized forests. This document describes the system's structure, components, and data flow.

## Monorepo Structure

```
venture-forest/
  apps/
    web/          # React + R3F frontend (Vite)
    api/          # Hono API server
  packages/
    db/           # Drizzle ORM schema, migrations, seed scripts
    data-pipeline/ # Provider adapters, normalization, validation
    shared/       # Shared types, constants, utilities
  .claude/        # Agent rules and skills
```

The monorepo uses pnpm workspaces. Each package exposes a typed public API via `exports` in its `package.json`.

## Frontend (apps/web)

- **Framework**: React 18 with TypeScript, bundled by Vite.
- **3D Engine**: React Three Fiber (R3F) with drei helpers and Three.js underneath.
- **State Management**: Zustand for global app state (selected company, camera target, quality preset). Refs for per-frame mutable state.
- **Styling**: Tailwind CSS for overlay UI, Framer Motion for animations.
- **Routing**: Simple client-side routing via React Router (forest view, detail view, settings).

### Key Frontend Modules
- `ForestScene` - top-level R3F canvas, lighting, environment, postprocessing.
- `GroveCluster` - renders a sector grove (group of trees).
- `TreeInstance` - instanced tree mesh representing a single company.
- `InvestorRoots` - underground root network connecting co-invested companies.
- `OverlayPanel` - HTML overlay for company details, search, and filters.
- `CameraController` - smooth camera transitions between points of interest.

## API (apps/api)

- **Framework**: Hono, deployed as a Vercel Edge Function.
- **Responsibilities**: serve normalized snapshots, handle search queries, proxy provider APIs.
- **Auth**: API key for provider proxying; public read access for snapshots.
- **Endpoints**:
  - `GET /api/snapshot` - latest normalized dataset.
  - `GET /api/company/:slug` - single company detail.
  - `GET /api/search?q=` - full-text search across companies and investors.

## Database (packages/db)

- **Provider**: Neon (serverless Postgres).
- **ORM**: Drizzle ORM with typed schema definitions.
- **Tables**: companies, investors, funding_rounds, company_investor_edges, company_placements, groves.
- **Migrations**: managed via `drizzle-kit` with version-controlled SQL files.

## Data Pipeline (packages/data-pipeline)

- Fetches raw data from providers (Crunchbase, PitchBook, CSV imports).
- Normalizes records into the canonical schema (see `data-model.md`).
- Validates with Zod schemas, flags conflicts, writes to Neon.
- Runs on a scheduled basis (nightly cron) or on-demand via CLI.

## Deployment

- **Frontend**: Vite build deployed to Vercel as a static site.
- **API**: Hono server deployed as Vercel Edge Functions.
- **Database**: Neon serverless Postgres, auto-scaling, branching for preview environments.
- **CI/CD**: GitHub Actions for lint, test, build, deploy. Preview deploys on every PR.

## Data Flow

```
Provider APIs / CSVs
       |
  data-pipeline (normalize, validate)
       |
  Neon Postgres (canonical store)
       |
  Hono API (serve snapshots)
       |
  React frontend (fetch on load)
       |
  Zustand store (in-memory dataset)
       |
  R3F scene (trees, roots, groves)
       |
  HTML overlays (detail panels)
```

## Key Design Decisions

1. **Snapshot-first**: the frontend loads a single snapshot rather than streaming individual records, keeping the rendering pipeline simple.
2. **Edge functions**: Hono on Vercel Edge keeps API latency low globally without managing servers.
3. **Monorepo with shared types**: a single `shared` package ensures the API response types match the frontend's expectations at compile time.
4. **Provider abstraction**: adding a new data source means implementing one interface, not rewiring the pipeline.
