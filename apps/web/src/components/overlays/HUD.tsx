import { useForestStore } from '@/stores/forest-store';
import { useSnapshot } from '@/hooks/useSnapshot';
import { Search, SlidersHorizontal, HelpCircle, Map, Settings, X, Trees, Calendar } from 'lucide-react';
import type { GroupingMode } from '@/stores/forest-store';

export function HUD() {
  const toggleSearch = useForestStore((s) => s.toggleSearch);
  const toggleFilters = useForestStore((s) => s.toggleFilters);
  const toggleLegend = useForestStore((s) => s.toggleLegend);
  const toggleMinimap = useForestStore((s) => s.toggleMinimap);
  const toggleSettings = useForestStore((s) => s.toggleSettings);
  const selectedCompanyId = useForestStore((s) => s.selectedCompanyId);
  const selectedInvestorId = useForestStore((s) => s.selectedInvestorId);
  const selectCompany = useForestStore((s) => s.selectCompany);
  const resetCamera = useForestStore((s) => s.resetCamera);
  const groupingMode = useForestStore((s) => s.groupingMode);
  const setGroupingMode = useForestStore((s) => s.setGroupingMode);
  const { data: snapshot } = useSnapshot();

  const investorName = selectedInvestorId && snapshot
    ? snapshot.investors.find((i) => i.id === selectedInvestorId)?.name
    : null;

  return (
    <>
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-30 pointer-events-none">
        <div className="flex items-center justify-between p-4">
          {/* Logo */}
          <div className="pointer-events-auto">
            <h1 className="text-sm font-medium tracking-[0.2em] text-overlay-text/70 uppercase select-none">
              Venture Forest
            </h1>
          </div>

          {/* Tool buttons */}
          <div className="pointer-events-auto flex items-center gap-1">
            <GroupingToggle mode={groupingMode} onChange={setGroupingMode} />
            <div className="w-px h-5 bg-overlay-border mx-1" />
            <HUDButton icon={<Search size={16} />} label="Search" onClick={toggleSearch} shortcut="/" />
            <HUDButton icon={<SlidersHorizontal size={16} />} label="Filters" onClick={toggleFilters} />
            <HUDButton icon={<HelpCircle size={16} />} label="Legend" onClick={toggleLegend} />
            <HUDButton icon={<Map size={16} />} label="Map" onClick={toggleMinimap} />
            <HUDButton icon={<Settings size={16} />} label="Settings" onClick={toggleSettings} />
          </div>
        </div>
      </div>

      {/* Investor mode banner */}
      {investorName && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
          <div className="glass-panel-solid px-4 py-2 flex items-center gap-3 rounded-lg border border-overlay-accent/30">
            <span className="text-xs text-overlay-accent font-medium">
              Viewing portfolio: {investorName}
            </span>
            <button
              onClick={resetCamera}
              className="text-overlay-muted/60 hover:text-overlay-text transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Escape hint when company selected */}
      {selectedCompanyId && !selectedInvestorId && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30">
          <button
            onClick={() => selectCompany(null)}
            className="glass-panel px-3 py-1.5 text-xs text-overlay-muted/60 hover:text-overlay-text transition-colors flex items-center gap-1.5"
          >
            <X size={12} />
            <span>Press Esc to deselect</span>
          </button>
        </div>
      )}

      {/* First visit hint */}
      <FirstVisitHint />
    </>
  );
}

function HUDButton({
  icon,
  label,
  onClick,
  shortcut,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  shortcut?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="glass-panel p-2 text-overlay-muted hover:text-overlay-text hover:bg-white/5 transition-all duration-200 group relative"
      title={`${label}${shortcut ? ` (${shortcut})` : ''}`}
    >
      {icon}
    </button>
  );
}

function GroupingToggle({ mode, onChange }: { mode: GroupingMode; onChange: (m: GroupingMode) => void }) {
  return (
    <div className="flex items-center rounded-lg overflow-hidden border border-overlay-border bg-black/30">
      <button
        onClick={() => onChange('sector')}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] transition-colors ${
          mode === 'sector'
            ? 'bg-overlay-accent/15 text-overlay-accent'
            : 'text-overlay-muted/60 hover:text-overlay-text'
        }`}
        title="Group by sector"
      >
        <Trees size={13} />
        <span>Sector</span>
      </button>
      <div className="w-px h-4 bg-overlay-border" />
      <button
        onClick={() => onChange('vintage')}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] transition-colors ${
          mode === 'vintage'
            ? 'bg-overlay-accent/15 text-overlay-accent'
            : 'text-overlay-muted/60 hover:text-overlay-text'
        }`}
        title="Group by vintage year"
      >
        <Calendar size={13} />
        <span>Vintage</span>
      </button>
    </div>
  );
}

function FirstVisitHint() {
  // Show hint briefly on first visit
  const isLoading = useForestStore((s) => s.isLoading);

  if (isLoading) return null;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-20 animate-fade-in-up pointer-events-none">
      <div className="glass-panel px-4 py-2 text-xs text-overlay-muted/50 flex items-center gap-4">
        <span>Click to select</span>
        <span className="w-px h-3 bg-overlay-border" />
        <span>Scroll to zoom</span>
        <span className="w-px h-3 bg-overlay-border" />
        <span>Drag to orbit</span>
        <span className="w-px h-3 bg-overlay-border" />
        <span>/ to search</span>
      </div>
    </div>
  );
}
