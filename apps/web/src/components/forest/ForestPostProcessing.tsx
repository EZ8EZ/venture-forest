import { EffectComposer, Bloom, Vignette, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';

export function ForestPostProcessing() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={0.25}
        luminanceThreshold={0.4}
        luminanceSmoothing={0.7}
        mipmapBlur
      />
      <Vignette
        darkness={0.25}
        offset={0.35}
      />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}
