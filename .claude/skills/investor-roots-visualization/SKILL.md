# Skill: Investor Roots Visualization

## Purpose
Implement and refine the underground root network that visualizes investor-company relationships.

## When to Use
- Building or modifying the root network rendering.
- Adjusting root interaction behavior (hover, click, camera tilt).
- Optimizing root geometry performance.

## Steps
1. Compute the bipartite graph of investors to companies from `CompanyInvestorEdge` records.
2. Generate root spline curves connecting shared-investor companies through anchor points at Y = -2 to -5.
3. Encode visual properties: thickness from investment size, emissive glow from recency, color from investor type.
4. Merge root geometry into a single mesh for performance; use `BufferGeometry` merging.
5. Implement the reveal mechanic: semi-transparent ground on hover, camera tilt on click.
6. Ensure roots within the frustum are rendered at full fidelity; cull distant roots.
7. Test with edge cases: company with zero investors, investor with 50+ portfolio companies.
8. Profile: roots should add no more than 2 ms to the frame budget.

## Key Files
- `apps/web/src/scene/InvestorRoots.tsx` - root network component.
- `apps/web/src/scene/CameraController.tsx` - camera tilt logic.
- `investor-visualization-rationale.md` - design rationale.
- `data-model.md` - CompanyInvestorEdge schema.
