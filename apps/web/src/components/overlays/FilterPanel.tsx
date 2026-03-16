import { motion, AnimatePresence } from 'framer-motion';
import { X, RotateCcw } from 'lucide-react';
import { useForestStore } from '@/stores/forest-store';
import { SPECIES_MAP, SECTOR_ORDER } from '@/lib/species-config';

export function FilterPanel() {
  const showFilters = useForestStore((s) => s.showFilters);
  const toggleFilters = useForestStore((s) => s.toggleFilters);
  const filters = useForestStore((s) => s.filters);
  const setFilters = useForestStore((s) => s.setFilters);
  const clearFilters = useForestStore((s) => s.clearFilters);

  const toggleSector = (sector: string) => {
    const current = filters.sectors;
    setFilters({
      sectors: current.includes(sector)
        ? current.filter((s) => s !== sector)
        : [...current, sector],
    });
  };

  const hasActiveFilters =
    filters.sectors.length > 0 ||
    filters.fundingMin !== null ||
    filters.fundingMax !== null;

  return (
    <AnimatePresence>
      {showFilters && (
        <motion.div
          initial={{ x: -300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -300, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed left-4 top-16 z-40 w-[280px]"
        >
          <div className="glass-panel-solid p-4 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium uppercase tracking-widest text-overlay-text/70">
                Filters
              </h3>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-[10px] text-overlay-accent/60 hover:text-overlay-accent flex items-center gap-1"
                  >
                    <RotateCcw size={10} />
                    Clear
                  </button>
                )}
                <button onClick={toggleFilters} className="text-overlay-muted/40 hover:text-overlay-muted">
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Sector filters */}
            <div>
              <h4 className="text-[10px] uppercase tracking-widest text-overlay-muted/40 mb-2">
                Sector
              </h4>
              <div className="space-y-1">
                {SECTOR_ORDER.map((sector) => {
                  const species = SPECIES_MAP[sector];
                  const isActive = filters.sectors.includes(sector);
                  return (
                    <button
                      key={sector}
                      onClick={() => toggleSector(sector)}
                      className={`
                        w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-all text-xs
                        ${isActive ? 'bg-white/8 text-overlay-text' : 'text-overlay-muted/60 hover:bg-white/3'}
                      `}
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-sm flex-shrink-0 transition-transform"
                        style={{
                          backgroundColor: isActive ? species.canopyColor : species.canopyColorDark,
                          transform: isActive ? 'scale(1.2)' : 'scale(1)',
                        }}
                      />
                      {species.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Funding range */}
            <div>
              <h4 className="text-[10px] uppercase tracking-widest text-overlay-muted/40 mb-2">
                Total Funding
              </h4>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min ($M)"
                  value={filters.fundingMin ? filters.fundingMin / 1_000_000 : ''}
                  onChange={(e) =>
                    setFilters({
                      fundingMin: e.target.value ? Number(e.target.value) * 1_000_000 : null,
                    })
                  }
                  className="w-full bg-white/5 border border-overlay-border rounded px-2 py-1.5 text-xs text-overlay-text placeholder-overlay-muted/30 outline-none focus:border-overlay-accent/30"
                />
                <span className="text-overlay-muted/30 text-xs">to</span>
                <input
                  type="number"
                  placeholder="Max ($M)"
                  value={filters.fundingMax ? filters.fundingMax / 1_000_000 : ''}
                  onChange={(e) =>
                    setFilters({
                      fundingMax: e.target.value ? Number(e.target.value) * 1_000_000 : null,
                    })
                  }
                  className="w-full bg-white/5 border border-overlay-border rounded px-2 py-1.5 text-xs text-overlay-text placeholder-overlay-muted/30 outline-none focus:border-overlay-accent/30"
                />
              </div>
            </div>

            {/* Dimmed explanation */}
            <div className="pt-2 border-t border-overlay-border">
              <p className="text-[10px] text-overlay-muted/30 leading-relaxed">
                Filtered-out trees are dimmed rather than hidden,
                preserving the forest context while highlighting matches.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
