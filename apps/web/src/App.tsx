import { useEffect } from 'react';
import { ForestScene } from '@/components/forest/ForestScene';
import { LoadingScreen } from '@/components/overlays/LoadingScreen';
import { HUD } from '@/components/overlays/HUD';
import { SearchPalette } from '@/components/overlays/SearchPalette';
import { LegendPanel } from '@/components/overlays/LegendPanel';
import { FilterPanel } from '@/components/overlays/FilterPanel';
import { Minimap } from '@/components/overlays/Minimap';
import { SettingsPanel } from '@/components/overlays/SettingsPanel';
import { InvestorDetailPanel } from '@/components/panels/InvestorDetailPanel';
import { CompanyDetailPanel } from '@/components/panels/CompanyDetailPanel';
import { useForestStore } from '@/stores/forest-store';
import { useDeepLink } from '@/hooks/useDeepLink';

export function App() {
  const resetCamera = useForestStore((s) => s.resetCamera);

  // ?company= and ?investor= deep links, synced both ways
  useDeepLink();

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
      {/* Mounted before CompanyDetailPanel: both are fixed right-0 z-40,
          so DOM order lets the company panel paint on top during the
          swap animation */}
      <InvestorDetailPanel />
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
