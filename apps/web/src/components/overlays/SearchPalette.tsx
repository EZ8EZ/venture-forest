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

  // Build search index
  const fuse = useMemo(() => {
    if (!snapshot) return null;

    const items: SearchResult[] = [
      ...snapshot.companies.map((c) => ({
        type: 'company' as const,
        id: c.id,
        name: c.name,
        detail: `${c.sector} · ${c.hq_city || 'Unknown location'}`,
      })),
      ...snapshot.investors.map((i) => ({
        type: 'investor' as const,
        id: i.id,
        name: i.name,
        detail: i.type,
      })),
    ];

    return new Fuse(items, {
      keys: ['name', 'detail'],
      threshold: 0.3,
      minMatchCharLength: 1,
    });
  }, [snapshot]);

  const results = useMemo(() => {
    if (!fuse || !query.trim()) return [];
    return fuse.search(query).slice(0, 8).map((r) => r.item);
  }, [fuse, query]);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      if (result.type === 'company') {
        selectCompany(result.id);
        // Find placement for camera target
        const placement = snapshot?.placements.find((p) => p.company_id === result.id);
        if (placement) {
          setCameraTarget({
            x: placement.world_x,
            y: placement.elevation + placement.tree_height,
            z: placement.world_z,
          });
        }
      } else if (result.type === 'investor') {
        selectInvestor(result.id);
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
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={toggleSearch}
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed top-[15%] left-1/2 -translate-x-1/2 z-50 w-[520px] max-w-[90vw]"
          >
            <div className="glass-panel-solid shadow-2xl overflow-hidden">
              {/* Input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-overlay-border">
                <Search size={16} className="text-overlay-muted/50 flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search companies, investors, sectors..."
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-transparent text-sm text-overlay-text placeholder-overlay-muted/40 outline-none"
                />
                <button onClick={toggleSearch} className="text-overlay-muted/40 hover:text-overlay-muted">
                  <X size={14} />
                </button>
              </div>

              {/* Results */}
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
                        <p className="text-[10px] text-overlay-muted/50 truncate">{result.detail}</p>
                      </div>
                      <span className="text-[9px] text-overlay-muted/30 uppercase">{result.type}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Empty state */}
              {query.trim() && results.length === 0 && (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-overlay-muted/40">No results found</p>
                </div>
              )}

              {/* Hints */}
              {!query.trim() && (
                <div className="px-4 py-3 text-[10px] text-overlay-muted/30 flex items-center gap-3">
                  <span>Type to search</span>
                  <span className="w-px h-3 bg-overlay-border" />
                  <span>Arrow keys to navigate</span>
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
