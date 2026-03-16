# System Architecture

## Overview

Venture Forest is an interactive 3D visualization that maps the startup ecosystem onto a forest metaphor. Each tree represents a company; its visual properties encode real data dimensions (funding, headcount, sector, age, investors). The system is built as a pnpm monorepo with a React/R3F frontend, a lightweight API layer, a Neon Postgres database, and a Python data pipeline.

## Monorepo Structure

```
venture-forest/
  apps/
    web/          # React + R3F + Vite frontend
    api/          # Fastify or Hono API server
  packages/
    forest-engine/   # Tree generation, visual encoding, 3D scene logic
    layout-engine/   # Spatial placement algorithms (groves, spacing, terrain)
    shared-types/    # TypeScript types shared across frontend and API
    data-schema/     # Database schema definitions, migrations, validation
    ui/              # Reusable UI components (overlays, panels, labels)
  data/
    raw/             # Unprocessed source files
    normalized/      # Cleaned, schema-conformant records
    fixtures/        # Test and development seed data
    snapshots/       # Versioned point-in-time data exports
  scripts/           # Build, deploy, and pipeline orchestration scripts
```

All packages use TypeScript except the data pipeline, which is Python. The monorepo is managed with pnpm workspaces.

## Frontend (apps/web)

- **Framework:** React 18+ with React Three Fiber (R3F)
- **Bundler:** Vite (fast HMR, optimized production builds)
- **State management:** Zustand for UI and scene state
- **Server state:** TanStack Query for data fetching, caching, and background refetching
- **Styling:** Tailwind CSS for overlay UI; shader-based materials for 3D content

The frontend owns the full render loop: camera, scene graph, input handling, overlay panels, and label rendering. It consumes data from the API and transforms it into tree geometry via the forest-engine package.

## API (apps/api)

- **Runtime:** Node.js
- **Framework:** Fastify or Hono (lightweight, typed routes)
- **Responsibilities:** serve company/investor data, handle search and filter queries, provide placement data for the forest layout

The API is intentionally thin. It reads from Neon Postgres and returns JSON. No complex business logic lives here; the rendering logic stays in the frontend packages.

## Database (Neon Postgres)

- **Provider:** Neon (serverless Postgres with branching)
- **Schema:** defined in the `data-schema` package
- **Key tables:** companies, investors, funding_rounds, company_investor_edges, company_placements, groves
- **Advantages:** serverless scaling, database branching for preview environments, standard Postgres compatibility

## Data Pipeline (Python)

The pipeline is responsible for ingesting, cleaning, normalizing, and loading startup data into Postgres.

**Stages:**

1. **Ingest** - read from source files (CSV, JSON, API responses)
2. **Normalize** - map fields to the canonical schema, handle missing values
3. **Validate** - check constraints, compute completeness_score and confidence_flags
4. **Load** - upsert into Neon Postgres

The pipeline runs as a batch process (not streaming). It is designed to be idempotent so re-runs are safe.

## Deployment

- **Frontend:** Vercel (static build from Vite, edge CDN)
- **API:** Vercel serverless functions or a lightweight container
- **Database:** Neon (managed, no infrastructure to maintain)
- **Pipeline:** runs locally or in CI; writes directly to Neon

## Data Flow

```
  Data Sources (CSV, APIs)
         |
         v
  Python Pipeline
    ingest -> normalize -> validate -> load
         |
         v
  Neon Postgres
         |
         v
  API (Fastify/Hono)
    /companies, /investors, /groves, /search
         |
         v
  TanStack Query (fetch + cache)
         |
         v
  Zustand (UI state, selection, camera)
         |
         v
  forest-engine + layout-engine
    visual encoding -> tree geometry -> placement
         |
         v
  React Three Fiber
    scene graph -> instanced meshes -> shaders -> frame
         |
         v
  Browser (WebGL canvas + HTML overlays)
```

## Package Dependency Graph

```
shared-types  <--  data-schema
     ^                 ^
     |                 |
forest-engine    layout-engine
     ^                 ^
     |                 |
     +--------+--------+
              |
              v
           apps/web
              |
              v
             ui
```

The `shared-types` package is the foundation; it defines the core domain types that every other package depends on. The `ui` package depends on React but not on R3F, keeping overlay components decoupled from the 3D scene.
