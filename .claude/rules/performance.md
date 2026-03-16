# Performance Budgets and Rules

## Frame Budget
- Target: 60 fps on mid-range hardware (M1 MacBook Air, GTX 1060 equivalent).
- Hard ceiling: 16.6 ms per frame. Aim for < 12 ms to leave headroom.
- Monitor with `useFrame` sparingly; prefer `useFrame` with priority ordering.

## React and R3F Boundary
- Never trigger React re-renders from the render loop. Use refs and mutate directly.
- Keep React state for UI overlays; keep Three.js state in refs or Zustand stores.
- Avoid `useState` or `useEffect` inside components that live in the `<Canvas>` tree.

## Asset Loading
- Lazy-load heavy assets (GLTF models, HDR environments) with `<Suspense>`.
- Use Draco or meshopt compression for all GLTF models.
- Compress textures to KTX2/Basis where supported; fall back to WebP.

## Quality Presets
- Ship three presets: low, medium, high.
- Low: reduced instance count, no postprocessing, billboard LODs only.
- Medium: moderate instance count, bloom only, one LOD tier.
- High: full instance count, full postprocessing stack, all LOD tiers.
- Detect preset automatically via `navigator.hardwareConcurrency` and GPU tier (detect-gpu).

## Memory
- Keep total GPU memory under 256 MB on the high preset.
- Dispose textures, geometries, and materials when components unmount.
- Use `useLoader` with caching; never fetch the same asset twice.

## Monitoring
- Include a hidden stats panel (toggled via `?stats`) showing FPS, draw calls, and triangles.
- Log slow frames (> 20 ms) in development builds.
- Run Lighthouse performance audits on every deploy preview.
