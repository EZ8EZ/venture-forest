import { useMemo, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Link2, Check, Building2, MapPin, Calendar, Users, TrendingUp, Info, User } from 'lucide-react';
import { useForestStore, DEFAULT_CAMERA } from '@/stores/forest-store';
import { useSnapshot } from '@/hooks/useSnapshot';
import { getCompanyInvestors } from '@/lib/snapshot-loader';
import { getSpecies } from '@/lib/species-config';
import type { Company } from '@/lib/types';

export function CompanyDetailPanel() {
  const selectedCompanyId = useForestStore((s) => s.selectedCompanyId);
  const selectCompany = useForestStore((s) => s.selectCompany);
  const selectInvestor = useForestStore((s) => s.selectInvestor);
  const setCameraTarget = useForestStore((s) => s.setCameraTarget);
  const { data: snapshot } = useSnapshot();

  const company = useMemo(() => {
    if (!snapshot || !selectedCompanyId) return null;
    return snapshot.companies.find((c) => c.id === selectedCompanyId) || null;
  }, [snapshot, selectedCompanyId]);

  const placement = useMemo(() => {
    if (!snapshot || !selectedCompanyId) return null;
    return snapshot.placements.find((p) => p.company_id === selectedCompanyId) || null;
  }, [snapshot, selectedCompanyId]);

  const investors = useMemo(() => {
    if (!snapshot || !selectedCompanyId) return [];
    return getCompanyInvestors(snapshot, selectedCompanyId);
  }, [snapshot, selectedCompanyId]);

  // Click an investor in the panel -> trigger portfolio highlight mode
  const handleInvestorClick = useCallback(
    (investorId: string) => {
      selectInvestor(investorId);
      // Center camera on portfolio
      if (snapshot) {
        const companyIds = new Set(
          snapshot.edges.filter((e) => e.investor_id === investorId).map((e) => e.company_id),
        );
        const portfolioPlacements = snapshot.placements.filter((p) => companyIds.has(p.company_id));
        if (portfolioPlacements.length > 0) {
          const avgX = portfolioPlacements.reduce((s, p) => s + p.world_x, 0) / portfolioPlacements.length;
          const avgZ = portfolioPlacements.reduce((s, p) => s + p.world_z, 0) / portfolioPlacements.length;
          setCameraTarget({ x: avgX, y: 18, z: avgZ });
        }
      }
    },
    [selectInvestor, setCameraTarget, snapshot],
  );

  // Handle close: deselect and trigger camera return
  const handleClose = useCallback(() => {
    selectCompany(null);
    setCameraTarget({ x: DEFAULT_CAMERA.x, y: DEFAULT_CAMERA.y, z: DEFAULT_CAMERA.z });
  }, [selectCompany, setCameraTarget]);

  return (
    <AnimatePresence>
      {company && placement && (
        <motion.div
          key={company.id}
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed right-0 top-0 bottom-0 w-full sm:w-[380px] z-40 pointer-events-auto"
        >
          <div className="h-full glass-panel-solid rounded-none rounded-l-xl overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-[rgba(10,12,16,0.98)] backdrop-blur-lg border-b border-overlay-border p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-overlay-text truncate">
                    {company.name}
                  </h2>
                  <p className="text-xs text-overlay-accent mt-0.5">
                    {getSpecies(company.sector).label}
                    {company.subsector && ` / ${company.subsector}`}
                  </p>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  {/* Compare affordance removed until compare mode ships a
                      real UI; the store plumbing remains for that feature */}
                  <button
                    onClick={handleClose}
                    aria-label="Close company details"
                    className="p-1.5 text-overlay-muted hover:text-overlay-text transition-colors focus-ring"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-5">
              {/* Description */}
              {company.description && (
                <p className="text-sm text-overlay-muted leading-relaxed">
                  {company.description}
                </p>
              )}

              {/* Founders */}
              {company.founders && company.founders.length > 0 && (
                <div>
                  <SectionTitle>Founders</SectionTitle>
                  <div className="flex flex-wrap gap-2">
                    {company.founders.map((f) => (
                      <div
                        key={f}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/3 border border-overlay-border text-sm text-overlay-text/80"
                      >
                        <User size={12} className="text-overlay-muted/50" />
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key metrics */}
              <div className="grid grid-cols-2 gap-3">
                <MetricCard
                  icon={<TrendingUp size={13} />}
                  label="Total Funding"
                  value={formatFunding(company.total_funding_usd)}
                />
                <MetricCard
                  icon={<Users size={13} />}
                  label="Headcount"
                  value={company.headcount_display || company.headcount_bucket || 'Unknown'}
                />
                <MetricCard
                  icon={<Calendar size={13} />}
                  label="Founded"
                  value={company.founded_year?.toString() || 'Unknown'}
                />
                <MetricCard
                  icon={<Building2 size={13} />}
                  label="Status"
                  value={company.status.charAt(0).toUpperCase() + company.status.slice(1)}
                />
                {company.latest_round_type && (
                  <MetricCard
                    icon={<TrendingUp size={13} />}
                    label="Latest Round"
                    value={formatRoundType(company.latest_round_type)}
                  />
                )}
                {company.hq_city && (
                  <MetricCard
                    icon={<MapPin size={13} />}
                    label="Location"
                    value={`${company.hq_city}${company.hq_country ? `, ${company.hq_country}` : ''}`}
                  />
                )}
              </div>

              {/* Tags */}
              {company.tags && company.tags.length > 0 && (
                <div>
                  <SectionTitle>Tags</SectionTitle>
                  <div className="flex flex-wrap gap-1.5">
                    {company.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 text-[10px] rounded-full bg-white/5 text-overlay-muted border border-overlay-border"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Investors - clickable to trigger portfolio highlighting */}
              {investors.length > 0 && (
                <div>
                  <SectionTitle>Investors</SectionTitle>
                  <p className="text-[10px] text-overlay-muted/40 mb-2">Click to explore portfolio</p>
                  <div className="space-y-1.5">
                    {investors.map(({ investor, edge }) => (
                      <button
                        key={investor!.id}
                        onClick={() => handleInvestorClick(investor!.id)}
                        className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg bg-white/3 hover:bg-overlay-accent/10 hover:border-overlay-accent/20 border border-transparent transition-colors cursor-pointer text-sm text-left"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <User size={12} className="text-overlay-muted/40 flex-shrink-0" />
                          <span className="text-overlay-text/80 truncate">{investor!.name}</span>
                        </div>
                        <span className="text-[10px] text-overlay-muted/60 uppercase flex-shrink-0 ml-2">
                          {edge.role}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Visual explainer */}
              <VisualExplainer company={company} placement={placement} />

              {/* Actions */}
              <div className="flex flex-col gap-2">
                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-overlay-accent/10 text-overlay-accent text-sm hover:bg-overlay-accent/20 transition-colors"
                  >
                    <ExternalLink size={14} />
                    Visit website
                  </a>
                )}
                <CopyLinkButton />
              </div>

              {/* Data confidence */}
              <div className="pt-2 border-t border-overlay-border">
                <div className="flex items-center gap-1.5 text-[10px] text-overlay-muted/40">
                  <Info size={10} />
                  <span>Data completeness: {Math.round(company.completeness_score * 100)}%</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CopyLinkButton() {
  const [copied, setCopied] = useState(false);

  // The URL always carries ?company=<slug> for the open panel (useDeepLink
  // mirrors selection into the address bar), so copying the current URL is
  // copying a stable link to this company
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be unavailable (permissions, insecure context);
      // silently keep the button in its default state
    }
  }, []);

  return (
    <button
      onClick={handleCopy}
      className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-overlay-muted text-sm hover:bg-white/8 transition-colors focus-ring"
    >
      {copied ? <Check size={14} className="text-overlay-accent" /> : <Link2 size={14} />}
      {copied ? 'Link copied' : 'Copy link'}
    </button>
  );
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="p-2.5 rounded-lg bg-white/3 border border-overlay-border">
      <div className="flex items-center gap-1.5 text-overlay-muted/60 mb-1">
        {icon}
        <span className="text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-sm font-medium text-overlay-text">{value}</p>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[10px] uppercase tracking-widest text-overlay-muted/50 mb-2">
      {children}
    </h3>
  );
}

function VisualExplainer({ company }: { company: Company; placement?: unknown }) {
  const species = getSpecies(company.sector);

  return (
    <div className="p-3 rounded-lg bg-white/3 border border-overlay-border space-y-2">
      <h3 className="text-[10px] uppercase tracking-widest text-overlay-accent/60 flex items-center gap-1.5">
        <Info size={10} />
        Why this tree looks like this
      </h3>
      <div className="space-y-1.5 text-xs text-overlay-muted/70">
        <p>
          <span className="text-overlay-text/60">Height:</span>{' '}
          {formatFunding(company.total_funding_usd)} in total funding
        </p>
        <p>
          <span className="text-overlay-text/60">Trunk width:</span>{' '}
          {company.headcount_display || company.headcount_bucket || 'estimated'} employees
        </p>
        <p>
          <span className="text-overlay-text/60">Species:</span>{' '}
          {species.label} ({species.description.toLowerCase()})
        </p>
        <p>
          <span className="text-overlay-text/60">Bark maturity:</span>{' '}
          {company.age_years ? `${company.age_years} years old` : 'age unknown'}
        </p>
      </div>
    </div>
  );
}

function formatFunding(amount: number): string {
  if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount}`;
}

function formatRoundType(type: string): string {
  return type
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
