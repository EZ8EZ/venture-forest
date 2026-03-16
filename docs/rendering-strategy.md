# Rendering Strategy

## Aesthetic Direction

Venture Forest targets a **stylized realism** look: organic shapes and natural lighting, but with enough abstraction that the forest reads as a data visualization rather than a photorealistic nature scene. Think illustrated field guide, not Unreal Engine demo reel.

Key qualities: warm twilight atmosphere, readable silhouettes, clear visual hierarchy between tree types.

## Instanced Rendering

With potentially hundreds or thousands of trees visible at once, instanced rendering is essential.

- Each tree species has a single base geometry (trunk + canopy) drawn as an `InstancedMesh`
- Per-instance attributes encode: position, scale (height, thickness), rotation, color variation, age-driven bark parameters
- Instance buffers are updated when the dataset changes or when the camera moves enough to trigger LOD transitions
- R3F's `<instancedMesh>` component manages the WebGL instance buffer

This keeps draw calls low regardless of tree count.

## Level of Detail (LOD)

Three LOD levels, driven by distance from the camera:

| Level | Distance   | Geometry                        | Material             |
|-------|------------|---------------------------------|----------------------|
| LOD 0 | < 50 units | Full mesh, branch detail        | Full shader, normals |
| LOD 1 | 50-200     | Simplified trunk + canopy hull  | Reduced shader       |
| LOD 2 | > 200      | Billboard or impostor quad      | Texture card         |

Transitions use distance-based blending to avoid popping. The layout-engine provides spatial indexing so LOD checks are fast.

## Frustum Culling

R3F and Three.js handle basic frustum culling automatically via `Object3D.frustumCulled`. Additional optimizations:

- Spatial grid partitioning in the layout-engine for coarse rejection before the GPU
- Off-screen groves are excluded from instance buffer updates entirely
- Trees behind the camera are never submitted for rendering

## Material System

### Bark

- Custom ShaderMaterial with a procedural bark pattern
- Inputs: age (drives crack depth and roughness), species (base color, pattern frequency), lighting
- Uses layered Perlin noise for organic texture variation
- Older companies get deeper grooves and darker tones

### Canopy

- Semi-transparent leaf volume using alpha-tested geometry or shell layers
- Color driven by sector mapping (see design-system.md)
- Subtle wind animation via vertex displacement (sinusoidal, per-instance phase offset)
- Seasonal variation available for future use

### Terrain

- Ground plane with subtle undulation (low-frequency noise displacement)
- Grass/ground cover via instanced quads near the camera
- Muted palette so trees remain the visual focus

## Shader Approach

All custom shaders are written in GLSL and integrated via Three.js ShaderMaterial or R3F's `shaderMaterial` helper.

Key principles:
- Keep shader complexity proportional to LOD level
- Avoid branching in fragment shaders where possible
- Use uniforms for global parameters (time, fog, lighting) and instance attributes for per-tree variation
- Compile shaders once at startup; swap programs only across LOD levels

## Post-Processing Pipeline

Post-processing is applied via R3F's `@react-three/postprocessing` (built on pmndrs postprocessing):

1. **Tone mapping** - ACES filmic, to compress HDR values into a cinematic range
2. **Bloom** - subtle, threshold-gated; makes canopy highlights and UI elements glow softly without washing out the scene
3. **Fog** - exponential distance fog blending to the background color; reinforces depth and hides LOD transitions at the far plane
4. **Vignette** - light darkening at screen edges to draw focus inward

The pipeline is deliberately restrained. The goal is atmosphere, not spectacle.

## Label Rendering

Labels (company names, funding amounts, sector tags) are rendered as HTML overlays positioned via CSS transforms, not as 3D text geometry.

**Distance-aware behavior:**

- Labels appear only when the camera is within a threshold distance of a tree
- Opacity fades with distance (fully visible at close range, invisible beyond a cutoff)
- Font size is constant in screen space, not in world space

**Contextual behavior:**

- On hover: show company name and primary metric
- On click/select: show expanded detail panel (rendered in the overlay UI, not in the 3D scene)
- In overview mode: show grove-level labels (sector names) instead of individual trees
- Labels are culled if they would overlap; priority is given to taller trees (higher funding)

This approach keeps labels sharp (native font rendering), avoids SDF text complexity, and sidesteps z-fighting issues.

## Performance Budget

Target: 60fps on mid-range hardware (integrated GPU, 2022-era laptop).

Levers to pull if performance degrades:
- Reduce max instance count and increase LOD 2 distance
- Disable wind animation
- Simplify post-processing (drop bloom, reduce fog samples)
- Use lower-resolution impostor textures
