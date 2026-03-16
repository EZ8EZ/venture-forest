import { EffectComposer, Bloom, Vignette, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';

export function ForestPostProcessing() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={0.25}
        luminanceThreshold={0.5}
        luminanceSmoothing={0.8}
        mipmapBlur
      />
      <Vignette
        darkness={0.6}
        offset={0.25}
      />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}
