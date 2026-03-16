# Roadmap

## Milestone 1 - Scaffolding

Set up the foundation: monorepo, build tooling, empty shells for all packages, basic dev workflow.

- Initialize pnpm workspace with apps/web, apps/api, and all packages
- Configure Vite for the web app with React, TypeScript, and Tailwind
- Set up R3F with a blank scene (camera, lights, ground plane)
- Create shared-types package with initial domain type stubs
- Configure linting, formatting, and TypeScript project references
- Basic CI pipeline (lint + typecheck on push)

## Milestone 2 - First Forest

Render a static forest from fixture data. Prove the visual encoding pipeline end to end.

- Define Company and Grove types in shared-types
- Build forest-engine: accept an array of companies, output tree parameters (height, radius, species, age)
- Build layout-engine: assign x/z positions within groves, handle spacing
- Create instanced tree renderer in R3F (single species, placeholder geometry)
- Load fixture data (20-50 hand-crafted companies) and render the forest
- Implement basic orbit camera controls
- First-pass bark and canopy shaders

## Milestone 3 - World Logic

Make the forest interactive and data-aware. Connect to real backend.

- Set up Neon Postgres database with schema from data-schema
- Build the API layer (company list, company detail, grove list endpoints)
- Integrate TanStack Query in the frontend for data fetching
- Implement Zustand stores for selection state and camera mode
- Add hover tooltips and click-to-select with detail panel
- Implement grove labels (sector names)
- Add frustum culling and basic LOD (2 levels)
- Implement search overlay with typeahead

## Milestone 4 - Product Layer

Polish the visualization. Add filtering, multiple species, post-processing.

- Implement all sector-to-species mappings with distinct geometries
- Full 3-level LOD with billboard impostors at distance
- Post-processing pipeline: tone mapping, bloom, fog, vignette
- Filtering by sector, funding range, headcount range, status
- Keyboard navigation and accessibility basics
- URL-based deep linking to specific companies or groves
- Responsive layout for the overlay UI
- Performance profiling and optimization pass

## Milestone 5 - Investor Systems

Add the investor/root network layer.

- Load investor and CompanyInvestorEdge data into the database
- Build root visualization system (subterranean geometry, selective rendering)
- Implement investor mode: select an investor, highlight their portfolio trees, reveal root connections
- Local reveal: clicking a single tree shows its investor roots
- Investor detail panel with portfolio summary
- Performance tuning for root geometry (instanced lines/tubes, LOD)

## Milestone 6 - Polish

Production readiness, data pipeline, and final visual quality.

- Build Python data pipeline (ingest, normalize, validate, load)
- Implement completeness_score and confidence_flags in the pipeline
- Data quality indicators in the UI (visual markers on low-confidence trees)
- Wind animation on canopy vertices
- Ground-level mist and atmospheric particles
- Screenshot/share functionality
- Loading states and error handling throughout
- Documentation for contributors
- Deploy to Vercel + Neon production environment
