import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Building2, User, Tag, X } from 'lucide-react';
import Fuse from 'fuse.js';
import { useForestStore } from '@/stores/forest-store';
import { useSnapshot } from '@/hooks/useSnapshot';

interface SearchResult {
  type: 'company' | 'investor' | 'sector';
  id: string;
  name: string;
  detail: string;
  portfolioCount?: number;
}

export function SearchPalette() {
  const showSearch = useForestStore((s) => s.showSearch);
  const toggleSearch = useForestStore((s) => s.toggleSearch);
  const selectCompany = useForestStore((s) => s.selectCompany);
  const selectInvestor = useForestStore((s) => s.selectInvestor);
  const setCameraTarget = useForestStore((s) => s.setCameraTarget);
  const { data: snapshot } = useSnapshot();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut to open search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && !showSearch) {
        e.preventDefault();
        toggleSearch();
      }
      if (e.key === 'Escape' && showSearch) {
        toggleSearch();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showSearch, toggleSearch]);

  // Focus input when opened
  useEffect(() => {
    if (showSearch && inputRef.current) {
      inputRef.current.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [showSearch]);

  // Count unique portfolio companies per investor
  const investorPortfolioCounts = useMemo(() => {
    if (!snapshot) return new Map<string, number>();
    const counts = new Map<string, number>();
    snapshot.investors.forEach((inv) => {
      const companyIds = new Set(
        snapshot.edges.filter((e) => e.investor_id === inv.id).map((e) => e.company_id),
      );
      counts.set(inv.id, companyIds.size);
    });
    return counts;
  }, [snapshot]);

  // Build search index
  const fuse = useMemo(() => {
    if (!snapshot) return null;

    const items: SearchResult[] = [
      ...snapshot.companies.map((c) => ({
        type: 'company' as const,
        id: c.id,
        name: c.name,
        detail: `${c.sector} | ${c.hq_city || 'Unknown'}`,
      })),
      ...snapshot.investors.map((i) => ({
        type: 'investor' as const,
        id: i.id,
        name: i.name,
        detail: `${i.type} | ${i.location || 'Unknown'}`,
        portfolioCount: investorPortfolioCounts.get(i.id) || 0,
      })),
    ];

    return new Fuse(items, {
      keys: ['name', 'detail'],
      threshold: 0.3,
      minMatchCharLength: 1,
    });
  }, [snapshot, investorPortfolioCounts]);

  const results = useMemo(() => {
    if (!fuse || !query.trim()) return [];
    return fuse.search(query).slice(0, 8).map((r) => r.item);
  }, [fuse, query]);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      if (result.type === 'company') {
        selectCompany(result.id);
        const placement = snapshot?.placements.find((p) => p.company_id === result.id);
        if (placement) {
          setCameraTarget({
            x: placement.world_x,
            y: placement.elevation + placement.tree_height * 1.5,
            z: placement.world_z,
          });
        }
      } else if (result.type === 'investor') {
        // Select investor: triggers portfolio highlighting
        selectInvestor(result.id);
        // Center camera on portfolio centroid
        if (snapshot) {
          const companyIds = new Set(
            snapshot.edges.filter((e) => e.investor_id === result.id).map((e) => e.company_id),
          );
          const portfolioPlacements = snapshot.placements.filter((p) => companyIds.has(p.company_id));
          if (portfolioPlacements.length > 0) {
            const avgX = portfolioPlacements.reduce((s, p) => s + p.world_x, 0) / portfolioPlacements.length;
            const avgZ = portfolioPlacements.reduce((s, p) => s + p.world_z, 0) / portfolioPlacements.length;
            setCameraTarget({ x: avgX, y: 18, z: avgZ });
          }
        }
      }
      toggleSearch();
    },
    [selectCompany, selectInvestor, setCameraTarget, toggleSearch, snapshot],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      handleSelect(results[selectedIndex]);
    }
  };

  return (
    <AnimatePresence>
      {showSearch && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={toggleSearch}
          />

          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed top-[15%] left-1/2 -translate-x-1/2 z-50 w-[520px] max-w-[90vw]"
          >
            <div className="glass-panel-solid shadow-2xl overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-overlay-border">
                <Search size={16} className="text-overlay-muted/50 flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search companies, investors..."
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-transparent text-sm text-overlay-text placeholder-overlay-muted/40 outline-none"
                />
                <button onClick={toggleSearch} className="text-overlay-muted/40 hover:text-overlay-muted">
                  <X size={14} />
                </button>
              </div>

              {results.length > 0 && (
                <div className="max-h-[300px] overflow-y-auto py-1">
                  {results.map((result, i) => (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleSelect(result)}
                      className={`
                        w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors
                        ${i === selectedIndex ? 'bg-white/5' : 'hover:bg-white/3'}
                      `}
                    >
                      <div className="flex-shrink-0 text-overlay-muted/40">
                        {result.type === 'company' ? <Building2 size={14} /> :
                         result.type === 'investor' ? <User size={14} /> :
                         <Tag size={14} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-overlay-text truncate">{result.name}</p>
                        <p className="text-[10px] text-overlay-muted/50 truncate">
                          {result.detail}
                          {result.type === 'investor' && result.portfolioCount
                            ? ` | ${result.portfolioCount} companies in forest`
                            : ''}
                        </p>
                      </div>
                      <span className="text-[9px] text-overlay-muted/30 uppercase">{result.type}</span>
                    </button>
                  ))}
                </div>
              )}

              {query.trim() && results.length === 0 && (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-overlay-muted/40">No results found</p>
                </div>
              )}

              {!query.trim() && (
                <div className="px-4 py-3 text-[10px] text-overlay-muted/30 flex items-center gap-3">
                  <span>Type to search</span>
                  <span className="w-px h-3 bg-overlay-border" />
                  <span>Search investors to explore portfolios</span>
                  <span className="w-px h-3 bg-overlay-border" />
                  <span>Enter to select</span>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
