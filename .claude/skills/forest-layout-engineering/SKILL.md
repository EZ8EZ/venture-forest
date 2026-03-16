# Skill: Forest Layout Engineering

## Purpose
Design and implement the spatial layout algorithm that places company trees into sector groves within the 3D forest.

## When to Use
- Adjusting grove positions, sizes, or spacing.
- Changing how trees are distributed within a grove.
- Fixing overlap or collision issues between trees.
- Adding a new sector and its corresponding grove.

## Steps
1. Review the current layout algorithm in `apps/web/src/layout/`.
2. Groves are positioned on a 2D plane (X, Z). Each sector gets a circular grove region.
3. Within each grove, trees are placed using a Poisson disk sampling pattern to avoid overlaps.
4. Tree scale (derived from valuation) affects minimum spacing; larger trees need more room.
5. After placement, write `CompanyPlacement` records to the database.
6. Validate: no two trees overlap, all trees fall within their grove radius, edge cases (empty sector, single company) are handled.
7. Visually verify by loading the scene and orbiting through each grove.

## Key Files
- `apps/web/src/layout/groveLayout.ts` - grove positioning logic.
- `apps/web/src/layout/treeLayout.ts` - intra-grove tree placement.
- `packages/db/src/schema.ts` - CompanyPlacement and Grove tables.
- `design-system.md` - sector-to-species mapping.
