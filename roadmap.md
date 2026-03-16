# Roadmap

Venture Forest development is organized into six milestones, each building on the last.

## Milestone 1: Foundation
- Monorepo scaffolding with pnpm workspaces.
- Vite + React + R3F hello-world scene.
- Hono API skeleton with health-check endpoint.
- Neon database provisioning and Drizzle schema for core tables.

## Milestone 2: Static Forest
- Seed database with a curated snapshot (~200 companies, ~50 investors).
- Implement grove layout algorithm (sector clustering).
- Render instanced trees with sector-based species and valuation-based scale.
- Basic orbit camera controls.

## Milestone 3: Investor Roots
- Compute shared-investor edges between companies.
- Render underground root network with emissive highlights.
- Add camera tilt to reveal roots on interaction.

## Milestone 4: Interactive Overlays
- Company detail panel (hover/click) with funding timeline.
- Investor detail panel showing portfolio connections.
- Search bar with fuzzy matching.
- Filter controls for sector, stage, and funding range.

## Milestone 5: Data Pipeline v1
- Implement at least one live provider adapter (Crunchbase or equivalent).
- Nightly cron job to refresh snapshots.
- Conflict detection and manual review queue.

## Milestone 6: Polish and Launch
- Quality presets (low, medium, high) with auto-detection.
- Visual regression tests via Playwright screenshots.
- Performance audit: confirm 60 fps on target hardware.
- Landing page, documentation, open-source release prep.
