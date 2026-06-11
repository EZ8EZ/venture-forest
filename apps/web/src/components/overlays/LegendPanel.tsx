import { motion, AnimatePresence } from 'framer-motion';
import { X, TreePine, ArrowUpDown, Maximize2, Clock, GitBranch } from 'lucide-react';
import { useForestStore } from '@/stores/forest-store';
import { SPECIES_MAP, SECTOR_ORDER } from '@/lib/species-config';

export function LegendPanel() {
  const showLegend = useForestStore((s) => s.showLegend);
  const toggleLegend = useForestStore((s) => s.toggleLegend);
  const groupingMode = useForestStore((s) => s.groupingMode);

  return (
    <AnimatePresence>
      {showLegend && (
        <motion.div
          initial={{ x: -300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -300, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed left-4 top-16 z-40 w-[280px]"
        >
          <div className="glass-panel-solid p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium uppercase tracking-widest text-overlay-text/70">
                How to Read the Forest
              </h3>
              <button onClick={toggleLegend} className="text-overlay-muted/40 hover:text-overlay-muted">
                <X size={14} />
              </button>
            </div>

            {/* Visual encodings */}
            <div className="space-y-3">
              <LegendRow
                icon={<ArrowUpDown size={13} />}
                label="Tree height"
                description="Total funding raised"
              />
              <LegendRow
                icon={<Maximize2 size={13} />}
                label="Trunk thickness"
                description="Employee headcount"
              />
              <LegendRow
                icon={<TreePine size={13} />}
                label="Tree species"
                description="Company sector"
              />
              <LegendRow
                icon={<Clock size={13} />}
                label="Bark maturity"
                description="Company age"
              />
              <LegendRow
                icon={<GitBranch size={13} />}
                label="Underground roots"
                description="Investor relationships"
              />
            </div>

            {/* Sector colors */}
            <div>
              <h4 className="text-[10px] uppercase tracking-widest text-overlay-muted/40 mb-2">
                Sector Species
              </h4>
              <div className="space-y-1">
                {SECTOR_ORDER.map((sector) => {
                  const species = SPECIES_MAP[sector];
                  return (
                    <div key={sector} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-sm flex-shrink-0"
                        style={{ backgroundColor: species.canopyColor }}
                      />
                      <span className="text-[11px] text-overlay-muted/70">{species.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Position explanation */}
            <div className="pt-2 border-t border-overlay-border">
              <h4 className="text-[10px] uppercase tracking-widest text-overlay-muted/40 mb-1.5">
                Position Logic
              </h4>
              <p className="text-[11px] text-overlay-muted/50 leading-relaxed">
                {groupingMode === 'sector'
                  ? 'Sector clusters form natural groves. Within each grove, companies with more funding stand closer to the grove center.'
                  : 'Trees are grouped by founding year. Each clearing holds one vintage, from 2020 through 2026.'}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function LegendRow({ icon, label, description }: { icon: React.ReactNode; label: string; description: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="text-overlay-accent/60 mt-0.5">{icon}</div>
      <div>
        <p className="text-xs text-overlay-text/70 font-medium">{label}</p>
        <p className="text-[10px] text-overlay-muted/50">{description}</p>
      </div>
    </div>
  );
}
