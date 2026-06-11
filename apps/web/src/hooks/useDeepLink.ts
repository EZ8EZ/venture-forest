import { useEffect, useRef } from 'react';
import { useSnapshot } from '@/hooks/useSnapshot';
import { useForestStore } from '@/stores/forest-store';

// URL deep linking: ?company=<slug> or ?investor=<slug>.
//
// On load, the param selects the entity and flies the camera to it (the
// cinematic intro is skipped so the link lands directly on its subject).
// While browsing, the URL tracks the current selection via replaceState,
// so the address bar is always a shareable link. Unknown slugs are
// ignored: a stale link still opens the forest rather than erroring.

export function hasDeepLink(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.has('company') || params.has('investor');
}

export function useDeepLink() {
  const { data: snapshot } = useSnapshot();
  const selectCompany = useForestStore((s) => s.selectCompany);
  const selectInvestor = useForestStore((s) => s.selectInvestor);
  const setCameraTarget = useForestStore((s) => s.setCameraTarget);
  const selectedCompanyId = useForestStore((s) => s.selectedCompanyId);
  const selectedInvestorId = useForestStore((s) => s.selectedInvestorId);
  const appliedInitial = useRef(false);

  // Apply the inbound link once the snapshot is available
  useEffect(() => {
    if (!snapshot || appliedInitial.current) return;
    appliedInitial.current = true;

    const params = new URLSearchParams(window.location.search);
    const companySlug = params.get('company');
    const investorSlug = params.get('investor');

    if (companySlug) {
      const company = snapshot.companies.find((c) => c.slug === companySlug);
      const placement = company
        ? snapshot.placements.find((p) => p.company_id === company.id)
        : undefined;
      if (company && placement) {
        selectCompany(company.id);
        setCameraTarget({
          x: placement.world_x,
          y: placement.elevation + placement.tree_height,
          z: placement.world_z,
        });
      }
      return;
    }

    if (investorSlug) {
      const investor = snapshot.investors.find((i) => i.slug === investorSlug);
      if (investor) {
        selectInvestor(investor.id);
        const ids = new Set(
          snapshot.edges.filter((e) => e.investor_id === investor.id).map((e) => e.company_id),
        );
        const portfolio = snapshot.placements.filter((p) => ids.has(p.company_id));
        if (portfolio.length > 0) {
          const avgX = portfolio.reduce((s, p) => s + p.world_x, 0) / portfolio.length;
          const avgZ = portfolio.reduce((s, p) => s + p.world_z, 0) / portfolio.length;
          setCameraTarget({ x: avgX, y: 18, z: avgZ });
        }
      }
    }
  }, [snapshot, selectCompany, selectInvestor, setCameraTarget]);

  // Mirror the live selection into the URL (preserving unrelated params)
  useEffect(() => {
    if (!snapshot || typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    params.delete('company');
    params.delete('investor');

    if (selectedCompanyId) {
      const company = snapshot.companies.find((c) => c.id === selectedCompanyId);
      if (company) params.set('company', company.slug);
    } else if (selectedInvestorId) {
      const investor = snapshot.investors.find((i) => i.id === selectedInvestorId);
      if (investor) params.set('investor', investor.slug);
    }

    const query = params.toString();
    const next = `${window.location.pathname}${query ? `?${query}` : ''}`;
    window.history.replaceState(null, '', next);
  }, [snapshot, selectedCompanyId, selectedInvestorId]);
}
