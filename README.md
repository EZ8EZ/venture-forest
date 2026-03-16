# Venture Forest

**An interactive 3D forest where each tree represents a startup, revealing the shape of the venture ecosystem.**

Venture Forest transforms raw company and investor data into a spatial, explorable world. Instead of spreadsheets and dashboards, you navigate a living forest where tree height encodes funding, trunk thickness represents headcount, species correspond to sectors, and underground root networks reveal investor relationships.

![Venture Forest](docs/assets/screenshot-placeholder.png)
<!-- Replace with actual screenshot once the first forest scene is polished -->

## Why a Forest?

Startups are often described as ecosystems, yet we analyze them in flat tables. Venture Forest makes the ecosystem spatial and legible:

- **Tall trees** are heavily funded companies. You notice them from across the forest.
- **Thick trunks** indicate large teams. Presence and scale are immediately visible.
- **Species and canopy shape** group companies by sector, forming distinct groves.
- **Bark maturity** reflects company age. Older companies look weathered and established.
- **Underground roots** connect companies through shared investors, revealing hidden networks.
- **Position** encodes importance: the most funded companies cluster near the center, and sector groves form organically around them.

The result is a data sculpture you want to wander through, not just query.

## Features

- **Immediate 3D immersion**: no landing page, no dashboard. You enter the forest directly.
- **Instanced tree rendering** for smooth performance with hundreds of companies.
- **Company detail panel** with funding, headcount, investors, tags, and visual explainers.
- **Command palette search** with fuzzy matching across companies, investors, and sectors.
- **Sector filtering** that dims non-matching trees while preserving spatial context.
- **Investor root visualization**: select a company to reveal underground investor connections.
- **Investor mode**: highlight an entire portfolio to see sector concentration at a glance.
- **Compare mode**: select up to four companies side-by-side.
- **Minimap** for orientation in the forest.
- **Visual legend** explaining every encoding: height, width, species, bark, roots.
- **Quality presets** and reduced motion mode for accessibility.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, TypeScript, Vite |
| 3D Rendering | Three.js via React Three Fiber, Drei |
| State | Zustand (scene/UI), TanStack Query (async) |
| Styling | Tailwind CSS, Framer Motion |
| API | Hono (TypeScript) |
| Database | PostgreSQL via Neon |
| ORM | Drizzle |
| Data Pipeline | Python (ingestion, normalization, layout) |
| Monorepo | pnpm workspaces |
| Testing | Vitest, Playwright |

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 10+
- Python 3.10+ (for data pipeline, optional for frontend-only dev)
- A Neon account (optional; the app runs on local snapshot data without a database)

### Install

```bash
git clone https://github.com/your-org/venture-forest.git
cd venture-forest
pnpm install
```

### Environment Setup

Copy the example env file:

```bash
cp .env.example .env
```

If you have a Neon database, add your connection strings:

```env
# Pooled connection for runtime (app and serverless functions)
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# Direct connection for migrations and schema operations
DIRECT_URL=postgresql://user:password@host/dbname?sslmode=require
```

The app runs without a database by loading snapshot data from the local filesystem.

### Run Locally

```bash
# Start the web app (3D forest)
pnpm dev

# Start the API server (optional)
pnpm dev:api
```

Open [http://localhost:5173](http://localhost:5173) and you will enter the forest.

### Database Operations

If using Neon:

```bash
pnpm db:push      # Push schema to database
pnpm db:migrate   # Run migrations
pnpm db:seed      # Seed demo data
```

## Repository Structure

```
venture-forest/
  apps/
    web/          # React + R3F frontend (the forest)
    api/          # Hono API server
  packages/
    shared-types/ # TypeScript type definitions
    forest-engine/# Tree generation and species logic
    layout-engine/# Deterministic placement algorithm
    ui/           # Shared UI components
    data-schema/  # Drizzle database schema
  data/
    raw/          # Raw source data
    normalized/   # Cleaned and normalized data
    snapshots/    # Pre-computed forest snapshots
    fixtures/     # Test fixtures
  scripts/        # Data pipeline scripts (Python)
  docs/           # Architecture and design documentation
```

## Data Strategy

Venture Forest takes a phased approach to data:

1. **Phase A (current)**: Local curated snapshot. A JSON file with pre-computed company data, investor relationships, and tree placements. No external API dependency.
2. **Phase B**: Provider abstraction. Source adapters allow plugging in different data providers (Crunchbase, PitchBook, public datasets) without changing the rendering model.
3. **Phase C**: Multi-source reconciliation. Multiple providers enriched and merged with conflict resolution and field-level provenance.

See [data-strategy.md](data-strategy.md) for details.

## Environment Variables

| Variable | Purpose | Required |
|----------|---------|----------|
| `DATABASE_URL` | Neon pooled connection string (runtime) | No (snapshot mode works without it) |
| `DIRECT_URL` | Neon direct connection string (migrations) | No |
| `VITE_APP_ENV` | Environment identifier | No |
| `VITE_APP_URL` | App base URL | No |

**Why two connection strings?** Neon uses connection pooling for runtime performance. Migrations and schema operations require a direct connection to avoid pooler limitations. See the [Neon docs](https://neon.tech/docs/connect/connection-pooling) for details.

## Architecture and Design

Detailed documentation is available in the project root:

- [architecture.md](architecture.md): System architecture and data flow
- [rendering-strategy.md](rendering-strategy.md): 3D rendering approach, LOD, instancing
- [data-model.md](data-model.md): Full data schema documentation
- [design-system.md](design-system.md): Visual design language, colors, typography
- [visual-encoding-rationale.md](visual-encoding-rationale.md): Why each tree property maps to each metric
- [investor-visualization-rationale.md](investor-visualization-rationale.md): Investor root design decisions
- [data-source-tradeoffs.md](data-source-tradeoffs.md): Data provider comparison

## Development Workflow

```bash
pnpm lint         # Lint all packages
pnpm typecheck    # Type check all packages
pnpm test         # Run unit tests
pnpm test:e2e     # Run end-to-end tests
pnpm format       # Format code with Prettier
pnpm format:check # Check formatting
pnpm build        # Build all packages
```

## Roadmap

| Milestone | Status | Description |
|-----------|--------|-------------|
| M1: Scaffolding | Done | Monorepo, types, docs, CI |
| M2: First Forest | Done | 3D scene, trees, terrain, camera |
| M3: World Logic | In Progress | Layout engine, groves, clustering |
| M4: Product Layer | In Progress | Detail panel, search, filters |
| M5: Investor Systems | Planned | Root visualization, portfolio mode |
| M6: Polish | Planned | Materials, lighting, performance, testing |

See [roadmap.md](roadmap.md) for the full plan.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for local setup instructions, code style guidelines, and the pull request process.

## License

[MIT](LICENSE.md)

---

Built with curiosity about how ecosystems take shape.
