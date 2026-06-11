import { useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trees, TrendingUp, Users, BarChart3 } from 'lucide-react';
import { useForestStore } from '@/stores/forest-store';
import { useSnapshot } from '@/hooks/useSnapshot';
import { getSpecies } from '@/lib/species-config';
import { formatFunding } from '@/lib/format';
import { getSectorStats } from '@/lib/sector-stats';
import { MetricCard, SectionTitle } from './CompanyDetailPanel';

// Sector analytics panel, opened by clicking a grove label in the world.
// Same shell and precedence pattern as the investor panel: visible only
// while nothing more specific (company, investor) is selected.
export function SectorGrovePanel() {
  const selectedGroveId = useForestStore((s) => s.selectedGroveId);
  const selectedCompanyId = useForestStore((s) => s.selectedCompanyId);
  const selectedInvestorId = useForestStore((s) => s.selectedInvestorId);
  const selectCompany = useForestStore((s) => s.selectCompany);
  const setCameraTarget = useForestStore((s) => s.setCameraTarget);
  const resetCamera = useForestStore((s) => s.resetCamera);
  const { data: snapshot } = useSnapshot();

  const grove = useMemo(() => {
    if (!snapshot || !selectedGroveId) return null;
    return snapshot.groves.find((g) => g.id === selectedGroveId) || null;
  }, [snapshot, selectedGroveId]);

  const stats = useMemo(() => {
    if (!snapshot || !grove) return null;
    return getSectorStats(snapshot, grove.sector);
  }, [snapshot, grove]);

  const handleCompanyClick = useCallback(
    (companyId: string) => {
      const placement = snapshot?.placements.find((p) => p.company_id === companyId);
      selectCompany(companyId);
      if (placement) {
        setCameraTarget({
          x: placement.world_x,
          y: placement.elevation + placement.tree_height,
          z: placement.world_z,
        });
      }
    },
    [snapshot, selectCompany, setCameraTarget],
  );

  const visible = !!grove && !!stats && !selectedCompanyId && !selectedInvestorId;
  const species = grove ? getSpecies(grove.sector) : null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={grove.id}
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed right-0 top-0 bottom-0 w-full sm:w-[380px] z-40 pointer-events-auto"
        >
          <div className="h-full glass-panel-solid rounded-none rounded-l-xl overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-[rgba(10,12,16,0.98)] backdrop-blur-lg border-b border-overlay-border p-4 z-10">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-overlay-text truncate flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-sm inline-block flex-shrink-0"
                      style={{ backgroundColor: species!.canopyColor }}
                    />
                    {species!.label}
                  </h2>
                  <p className="text-xs text-overlay-muted/60 mt-0.5">{species!.description}</p>
                </div>
                <button
                  onClick={resetCamera}
                  aria-label="Close sector view"
                  className="p-1.5 text-overlay-muted hover:text-overlay-text transition-colors focus-ring ml-2"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-5">
              {/* Summary metrics */}
              <div className="grid grid-cols-2 gap-3">
                <MetricCard
                  icon={<Trees size={13} />}
                  label="Companies"
                  value={String(stats.count)}
                />
                <MetricCard
                  icon={<TrendingUp size={13} />}
                  label="Total Funding"
                  value={formatFunding(stats.totalFunding)}
                />
                <MetricCard
                  icon={<BarChart3 size={13} />}
                  label="Median Funding"
                  value={formatFunding(stats.medianFunding)}
                />
                <MetricCard
                  icon={<Users size={13} />}
                  label="Headcount (est.)"
                  value={stats.totalHeadcountMid.toLocaleString()}
                />
              </div>

              {/* Top companies */}
              <div>
                <SectionTitle>Top Funded</SectionTitle>
                <p className="text-[10px] text-overlay-muted/40 mb-2">Click to visit the tree</p>
                <div className="space-y-1.5">
                  {stats.topByFunding.slice(0, 5).map((company, i) => (
                    <button
                      key={company.id}
                      onClick={() => handleCompanyClick(company.id)}
                      className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg bg-white/3 hover:bg-overlay-accent/10 hover:border-overlay-accent/20 border border-transparent transition-colors cursor-pointer text-sm text-left focus-ring"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-[10px] text-overlay-muted/40 w-4 flex-shrink-0">
                          #{i + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-overlay-text/80 truncate">{company.name}</p>
                          {company.headcount_display && (
                            <p className="text-[10px] text-overlay-muted/50 truncate">
                              {company.headcount_display} people
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-overlay-accent/80 flex-shrink-0 ml-2 font-medium">
                        {formatFunding(company.total_funding_usd)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Exit hint */}
              <div className="pt-2 border-t border-overlay-border">
                <p className="text-[10px] text-overlay-muted/40">Press Esc to exit sector view</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
