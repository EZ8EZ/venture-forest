# R3F Rendering Rules

## Instancing
- Use `InstancedMesh` for any object rendered more than ~20 times (trees, leaves, particles).
- Never create individual `<mesh>` elements in a loop when instancing is viable.
- Update instance matrices via `instanceMatrix.needsUpdate = true`; avoid full re-creation.

## Level of Detail (LOD)
- Every tree model must ship with at least two LOD tiers: full geometry and a simplified proxy.
- Use `<Detailed>` (drei) or manual distance checks to swap tiers.
- Billboard impostor sprites are acceptable beyond ~200 units from the camera.

## Frustum Culling
- Keep `frustumCulled={true}` (the default) on all meshes.
- Group objects spatially so entire groups cull together when off-screen.
- Do not disable culling unless a mesh intentionally extends beyond its bounding sphere.

## Material Discipline
- Reuse materials across instances; never create a new material per object.
- Prefer `MeshStandardMaterial` with minimal texture maps for the stylized look.
- Avoid runtime shader compilation; define all custom shaders at module scope.

## Postprocessing Restraint
- Limit the postprocessing stack to two or three passes (e.g., bloom, tone mapping, vignette).
- Disable heavy passes (SSAO, SSR) on low-end quality presets.
- Always profile before adding a new pass; each pass costs a full-screen draw.

## General
- Prefer drei helpers over hand-rolled equivalents; they are tree-shakeable and well-tested.
- Keep the scene graph shallow; deeply nested groups hurt traversal performance.
- All rendering decisions should be measurable; if you cannot profile it, do not ship it.
