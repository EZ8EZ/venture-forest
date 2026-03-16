import { EffectComposer, Bloom, Vignette, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';

export function ForestPostProcessing() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={0.3}
        luminanceThreshold={0.6}
        luminanceSmoothing={0.9}
        mipmapBlur
      />
      <Vignette
        darkness={0.5}
        offset={0.3}
      />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}
