// Shared shader extensions for the forest scene.
//
// All materials here extend MeshStandardMaterial via onBeforeCompile so we
// keep three.js lighting, shadows, and instancing for free. Each material is
// created once at module scope (rendering rule: no runtime shader creation
// per object) and shares a single time uniform so the whole forest sways on
// one clock.
import * as THREE from 'three';

// -- Sun -------------------------------------------------------------------
// Single source of truth for the golden-hour sun. The directional light, the
// sky shader, and the canopy translucency term all read from this so the
// scene stays physically coherent when tuned.

// Side light relative to the default camera so trees model with light and
// shadow instead of silhouetting; low elevation (~16 degrees) for long shadows
export const SUN_POSITION: [number, number, number] = [150, 30, 14];

export const SUN_DIRECTION = new THREE.Vector3(...SUN_POSITION).normalize();

export const SUN_COLOR = new THREE.Color('#ffc37e');

// -- Shared uniforms ---------------------------------------------------------

export const sharedUniforms = {
  uTime: { value: 0 },
  uWindStrength: { value: 0.055 },
  uSunDir: { value: SUN_DIRECTION },
  uSunColor: { value: SUN_COLOR },
  uTranslucency: { value: 0.55 },
};

// -- GLSL noise --------------------------------------------------------------
// Hash-based 3D value noise plus a small fbm. Cheap enough to run per
// fragment on integrated GPUs; no texture fetches.

const NOISE_GLSL = /* glsl */ `
  float vfHash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float vnoise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(vfHash(i + vec3(0,0,0)), vfHash(i + vec3(1,0,0)), f.x),
          mix(vfHash(i + vec3(0,1,0)), vfHash(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(vfHash(i + vec3(0,0,1)), vfHash(i + vec3(1,0,1)), f.x),
          mix(vfHash(i + vec3(0,1,1)), vfHash(i + vec3(1,1,1)), f.x), f.y),
      f.z);
  }
  float vfbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 3; i++) {
      v += a * vnoise(p);
      p *= 2.1;
      a *= 0.5;
    }
    return v;
  }
`;

// Varying carrying a stable per-fragment noise coordinate: local position
// offset by the instance's world origin, so every tree samples a different
// slice of the noise field and no two trunks or canopies look identical.
const VARYING_DECL = /* glsl */ `
  varying vec3 vShaderPos;
`;

const VERTEX_WORLD_BASE = /* glsl */ `
  vec3 vfWorldBase;
  #ifdef USE_INSTANCING
    vfWorldBase = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  #else
    vfWorldBase = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  #endif
  vShaderPos = position + vfWorldBase * 0.37;
`;

function wireUniforms(shader: { uniforms: Record<string, THREE.IUniform> }) {
  shader.uniforms.uTime = sharedUniforms.uTime;
  shader.uniforms.uWindStrength = sharedUniforms.uWindStrength;
  shader.uniforms.uSunDir = sharedUniforms.uSunDir;
  shader.uniforms.uSunColor = sharedUniforms.uSunColor;
  shader.uniforms.uTranslucency = sharedUniforms.uTranslucency;
}

// -- Bark material -----------------------------------------------------------
// Vertical striations (low frequency, stretched along Y) plus fine grain.
// Color variation per instance still comes from instanceColor; the noise
// breaks up the smooth cylinder reads.

export function createBarkMaterial(): THREE.MeshStandardMaterial {
  // vertexColors stays off: per-instance color arrives via instanceColor,
  // which three.js applies regardless of this flag. Setting it with no
  // color attribute on the geometry multiplies the surface to black.
  const mat = new THREE.MeshStandardMaterial({
    roughness: 0.92,
    metalness: 0.0,
  });
  mat.onBeforeCompile = (shader) => {
    wireUniforms(shader);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${VARYING_DECL}`)
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>\n${VERTEX_WORLD_BASE}`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${VARYING_DECL}\n${NOISE_GLSL}`)
      .replace(
        '#include <color_fragment>',
        /* glsl */ `
        #include <color_fragment>
        float vfStriae = vnoise(vec3(vShaderPos.x * 7.0, vShaderPos.y * 1.1, vShaderPos.z * 7.0));
        float vfGrain = vnoise(vShaderPos * 24.0);
        diffuseColor.rgb *= 0.86 + vfStriae * 0.30 + vfGrain * 0.10;
        `,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        /* glsl */ `
        #include <roughnessmap_fragment>
        roughnessFactor = clamp(roughnessFactor + (vfStriae - 0.5) * 0.16, 0.05, 1.0);
        `,
      );
  };
  mat.customProgramCacheKey = () => 'vf-bark';
  return mat;
}

// -- Canopy material ---------------------------------------------------------
// Three extensions over the standard material:
// 1. Wind: vertex sway driven by time with phase from instance world position
//    so trees never sync. Displacement scales with local height so canopy
//    tops move more than the base.
// 2. Leaf dappling: albedo noise breaking up the flat primitive surface.
// 3. Translucency: when the camera looks toward the sun through a canopy,
//    add transmitted sun light. This is the cheap subsurface approximation;
//    it reads as foliage catching the light.

export function createCanopyMaterial(): THREE.MeshStandardMaterial {
  const mat = new THREE.MeshStandardMaterial({
    roughness: 0.75,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });
  mat.onBeforeCompile = (shader) => {
    wireUniforms(shader);
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        /* glsl */ `
        #include <common>
        ${VARYING_DECL}
        uniform float uTime;
        uniform float uWindStrength;
        `,
      )
      .replace(
        '#include <begin_vertex>',
        /* glsl */ `
        #include <begin_vertex>
        ${VERTEX_WORLD_BASE}
        float vfPhase = vfWorldBase.x * 0.43 + vfWorldBase.z * 0.31;
        float vfTopness = clamp(position.y * 0.5 + 0.6, 0.0, 1.2);
        float vfSwayX = sin(uTime * 1.15 + vfPhase) + 0.45 * sin(uTime * 2.3 + vfPhase * 1.7);
        float vfSwayZ = cos(uTime * 0.95 + vfPhase * 1.1) + 0.4 * sin(uTime * 1.9 + vfPhase * 0.6);
        transformed.x += vfSwayX * uWindStrength * vfTopness;
        transformed.z += vfSwayZ * uWindStrength * vfTopness * 0.8;
        `,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        /* glsl */ `
        #include <common>
        ${VARYING_DECL}
        ${NOISE_GLSL}
        uniform vec3 uSunDir;
        uniform vec3 uSunColor;
        uniform float uTranslucency;
        `,
      )
      .replace(
        '#include <color_fragment>',
        /* glsl */ `
        #include <color_fragment>
        float vfLeaf = vnoise(vShaderPos * 9.0);
        diffuseColor.rgb *= 0.86 + vfLeaf * 0.26;
        `,
      )
      .replace(
        '#include <lights_fragment_end>',
        /* glsl */ `
        #include <lights_fragment_end>
        {
          vec3 vfSunView = normalize((viewMatrix * vec4(uSunDir, 0.0)).xyz);
          float vfFacingSun = clamp(dot(geometryViewDir, -vfSunView), 0.0, 1.0);
          float vfRim = pow(1.0 - clamp(dot(geometryViewDir, geometryNormal), 0.0, 1.0), 2.0);
          float vfTrans = pow(vfFacingSun, 3.0) * (0.45 + 0.55 * vfRim);
          reflectedLight.indirectDiffuse += diffuseColor.rgb * uSunColor * vfTrans * uTranslucency;
        }
        `,
      );
  };
  mat.customProgramCacheKey = () => 'vf-canopy';
  return mat;
}

// -- Terrain material --------------------------------------------------------
// Broad moss patches plus fine grain on top of the vertex-colored base.

export function createTerrainMaterial(): THREE.MeshStandardMaterial {
  const mat = new THREE.MeshStandardMaterial({
    roughness: 0.96,
    metalness: 0.0,
    vertexColors: true,
  });
  mat.onBeforeCompile = (shader) => {
    wireUniforms(shader);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${VARYING_DECL}`)
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>\n${VERTEX_WORLD_BASE}`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${VARYING_DECL}\n${NOISE_GLSL}`)
      .replace(
        '#include <color_fragment>',
        /* glsl */ `
        #include <color_fragment>
        float vfPatch = vfbm(vShaderPos * 0.05);
        float vfFine = vnoise(vShaderPos * 2.2);
        vec3 vfMoss = vec3(0.14, 0.20, 0.09);
        diffuseColor.rgb = mix(diffuseColor.rgb, vfMoss, smoothstep(0.55, 0.78, vfPatch) * 0.5);
        diffuseColor.rgb *= 0.88 + vfFine * 0.24;
        `,
      );
  };
  mat.customProgramCacheKey = () => 'vf-terrain';
  return mat;
}

// Module-scope singletons: one program each, shared by every mesh that uses
// them. Canopy meshes share one material because per-tree color comes from
// instanceColor, not the material.
export const barkMaterial = createBarkMaterial();
export const canopyMaterial = createCanopyMaterial();
export const terrainMaterial = createTerrainMaterial();
