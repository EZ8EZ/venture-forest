import { useEffect } from 'react';
import { ForestScene } from '@/components/forest/ForestScene';
import { LoadingScreen } from '@/components/overlays/LoadingScreen';
import { HUD } from '@/components/overlays/HUD';
import { SearchPalette } from '@/components/overlays/SearchPalette';
import { LegendPanel } from '@/components/overlays/LegendPanel';
import { FilterPanel } from '@/components/overlays/FilterPanel';
import { Minimap } from '@/components/overlays/Minimap';
import { SettingsPanel } from '@/components/overlays/SettingsPanel';
import { CompanyDetailPanel } from '@/components/panels/CompanyDetailPanel';
import { useForestStore } from '@/stores/forest-store';

export function App() {
  const resetCamera = useForestStore((s) => s.resetCamera);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        resetCamera();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [resetCamera]);

  return (
    <div className="w-full h-full relative">
      {/* The 3D world is the entire viewport */}
      <ForestScene />

      {/* Overlay layers */}
      <LoadingScreen />
      <HUD />
      <SearchPalette />
      <LegendPanel />
      <FilterPanel />
      <Minimap />
      <SettingsPanel />
      <CompanyDetailPanel />

      {/* WebGL fallback */}
      <noscript>
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a0c10] text-overlay-text">
          <div className="text-center p-8">
            <h1 className="text-2xl font-light mb-4">Venture Forest</h1>
            <p className="text-overlay-muted">This experience requires JavaScript and WebGL to run.</p>
          </div>
        </div>
      </noscript>
    </div>
  );
}
