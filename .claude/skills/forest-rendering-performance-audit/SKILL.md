# Skill: Forest Rendering Performance Audit

## Purpose
Profile and optimize the R3F rendering pipeline to meet the 60 fps target on mid-range hardware.

## When to Use
- Frame rate drops below 60 fps during development.
- Adding new visual features (postprocessing passes, particle effects, new geometry).
- Before a release to confirm performance budgets are met.

## Steps
1. Enable the stats panel (`?stats` query param) and note baseline FPS, draw calls, and triangle count.
2. Open browser DevTools Performance tab; record a 5-second capture while orbiting the scene.
3. Identify the bottleneck: CPU (React reconciliation, layout math) or GPU (draw calls, fill rate, shader complexity).
4. Check for React re-render leaks: no `useState`/`useEffect` inside `<Canvas>` tree components.
5. Verify instancing: confirm `InstancedMesh` is used for repeated geometry; check draw call count.
6. Review LOD transitions: confirm distant trees switch to lower-detail tiers.
7. Audit postprocessing: disable passes one by one to measure their individual cost.
8. Confirm quality presets work: low preset should run at 60 fps on integrated GPUs.
9. Document findings and any changes made.

## Key Files
- `apps/web/src/scene/ForestScene.tsx` - top-level scene.
- `apps/web/src/scene/TreeInstance.tsx` - instanced tree rendering.
- `.claude/rules/performance.md` - performance budgets.
- `.claude/rules/rendering.md` - rendering rules.
