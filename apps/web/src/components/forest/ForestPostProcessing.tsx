import { EffectComposer, Bloom, Vignette, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';

export function ForestPostProcessing() {
  return (
    <EffectComposer multisampling={0}>
      {/* Conservative threshold: only the sky near the sun and the brightest
          canopy highlights bloom; the forest itself stays crisp */}
      <Bloom
        intensity={0.45}
        luminanceThreshold={0.85}
        luminanceSmoothing={0.4}
        mipmapBlur
      />
      <Vignette
        darkness={0.15}
        offset={0.45}
      />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}
