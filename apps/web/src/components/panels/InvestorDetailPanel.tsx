import { useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Briefcase, TrendingUp, MapPin, User } from 'lucide-react';
import { useForestStore } from '@/stores/forest-store';
import { useSnapshot } from '@/hooks/useSnapshot';
import { getInvestorById, getInvestorPortfolio } from '@/lib/snapshot-loader';
import { getSpecies } from '@/lib/species-config';
import { formatFunding } from '@/lib/format';
import { MetricCard, SectionTitle } from './CompanyDetailPanel';
import type { Sector } from '@/lib/types';

// Right-side panel for investor mode. Renders only while an investor is
// selected and no company is: clicking a portfolio row selects the company,
// which slides this panel out and the company panel in while the root
// network stays lit (the store keeps investor mode alive until the company
// is deselected, which then exits everything).
export function InvestorDetailPanel() {
  const selectedInvestorId = useForestStore((s) => s.selectedInvestorId);
  const selectedCompanyId = useForestStore((s) => s.selectedCompanyId);
  const selectCompany = useForestStore((s) => s.selectCompany);
  const setCameraTarget = useForestStore((s) => s.setCameraTarget);
  const resetCamera = useForestStore((s) => s.resetCamera);
  const { data: snapshot } = useSnapshot();

  const investor = useMemo(() => {
    if (!snapshot || !selectedInvestorId) return null;
    return getInvestorById(snapshot, selectedInvestorId) || null;
  }, [snapshot, selectedInvestorId]);

  const portfolio = useMemo(() => {
    if (!snapshot || !selectedInvestorId) return [];
    return getInvestorPortfolio(snapshot, selectedInvestorId);
  }, [snapshot, selectedInvestorId]);

  const totalFunding = useMemo(
    () => portfolio.reduce((sum, { company }) => sum + (company!.total_funding_usd || 0), 0),
    [portfolio],
  );

  // Sector concentration, sorted by count descending
  const sectorMix = useMemo(() => {
    const counts = new Map<Sector, number>();
    portfolio.forEach(({ company }) => {
      counts.set(company!.sector, (counts.get(company!.sector) || 0) + 1);
    });
    const entries = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    const max = entries.length > 0 ? entries[0][1] : 1;
    return { entries, max };
  }, [portfolio]);

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

  const visible = !!investor && !selectedCompanyId;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={investor.id}
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
                  <h2 className="text-lg font-semibold text-overlay-text truncate">
                    {investor.name}
                  </h2>
                  <p className="text-xs text-overlay-accent mt-0.5 uppercase tracking-wide">
                    {investor.type}
                    {investor.location && (
                      <span className="normal-case text-overlay-muted/60 tracking-normal">
                        {' '}<MapPin size={10} className="inline -mt-0.5" /> {investor.location}
                      </span>
                    )}
                  </p>
                </div>
                <button
                  onClick={resetCamera}
                  aria-label="Exit investor view"
                  className="p-1.5 text-overlay-muted hover:text-overlay-text transition-colors focus-ring ml-2"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-5">
              {investor.description && (
                <p className="text-sm text-overlay-muted leading-relaxed">{investor.description}</p>
              )}

              {/* Summary metrics */}
              <div className="grid grid-cols-2 gap-3">
                <MetricCard
                  icon={<Briefcase size={13} />}
                  label="In Forest"
                  value={`${portfolio.length} ${portfolio.length === 1 ? 'company' : 'companies'}`}
                />
                <MetricCard
                  icon={<TrendingUp size={13} />}
                  label="Portfolio Funding"
                  value={formatFunding(totalFunding)}
                />
              </div>

              {/* Sector concentration */}
              {sectorMix.entries.length > 0 && (
                <div>
                  <SectionTitle>Sector Mix</SectionTitle>
                  <div className="space-y-1.5">
                    {sectorMix.entries.map(([sector, count]) => {
                      const species = getSpecies(sector);
                      return (
                        <div key={sector} className="flex items-center gap-2">
                          <span className="text-[11px] text-overlay-muted/70 w-32 truncate flex-shrink-0">
                            {species.label}
                          </span>
                          <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${(count / sectorMix.max) * 100}%`,
                                backgroundColor: species.canopyColorHighlight,
                                opacity: 0.65,
                              }}
                            />
                          </div>
                          <span className="text-[11px] text-overlay-text/70 w-5 text-right flex-shrink-0">
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Portfolio list */}
              {portfolio.length > 0 && (
                <div>
                  <SectionTitle>Portfolio ({portfolio.length})</SectionTitle>
                  <p className="text-[10px] text-overlay-muted/40 mb-2">Click to visit the tree</p>
                  <div className="space-y-1.5">
                    {portfolio.map(({ company, edge }) => (
                      <button
                        key={company!.id}
                        onClick={() => handleCompanyClick(company!.id)}
                        className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg bg-white/3 hover:bg-overlay-accent/10 hover:border-overlay-accent/20 border border-transparent transition-colors cursor-pointer text-sm text-left focus-ring"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <User size={12} className="text-overlay-muted/40 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-overlay-text/80 truncate">{company!.name}</p>
                            <p className="text-[10px] text-overlay-muted/50 truncate">
                              {getSpecies(company!.sector).label}
                              {company!.total_funding_usd > 0 &&
                                ` | ${formatFunding(company!.total_funding_usd)}`}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] text-overlay-muted/60 uppercase flex-shrink-0 ml-2">
                          {edge.role}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Exit hint */}
              <div className="pt-2 border-t border-overlay-border">
                <p className="text-[10px] text-overlay-muted/40">Press Esc to exit investor view</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
