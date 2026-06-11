import { useEffect, useRef, useState } from 'react';
import { useForestStore } from '@/stores/forest-store';
import { useSnapshot } from '@/hooks/useSnapshot';
import { getSpecies } from '@/lib/species-config';
import { formatFunding, formatRoundType } from '@/lib/format';
import { getCompanyRankLine } from '@/lib/sector-stats';

// Rich hover tooltip for trees. A screen-space DOM card (not drei Html):
// it costs nothing in the render loop and never scales with camera
// distance. Subscribes to hoveredCompanyId from the store; hover changes a
// few times per second at most, which the UI-overlay performance rules
// explicitly allow.

// Pointer-capability gate, evaluated once. On touch devices hover does not
// exist and the card must never block tap-to-select.
const FINE_POINTER =
  typeof window !== 'undefined' &&
  window.matchMedia('(hover: hover) and (pointer: fine)').matches;

// Module-level cursor cache so the card is positioned correctly the moment
// it first appears (before its own pointermove listener fires)
const cursor = { x: 0, y: 0 };
if (FINE_POINTER) {
  window.addEventListener('pointermove', (e) => {
    cursor.x = e.clientX;
    cursor.y = e.clientY;
  });
}

const OFFSET = 16;
const CARD_W = 240;
const CARD_H = 150;

function positionCard(el: HTMLDivElement) {
  // Flip to the other side of the cursor near the right/bottom edges
  const x =
    cursor.x + OFFSET + CARD_W > window.innerWidth
      ? cursor.x - OFFSET - CARD_W
      : cursor.x + OFFSET;
  const y =
    cursor.y + OFFSET + CARD_H > window.innerHeight
      ? cursor.y - OFFSET - CARD_H
      : cursor.y + OFFSET;
  el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
}

export function HoverTooltip() {
  const hoveredCompanyId = useForestStore((s) => s.hoveredCompanyId);
  const selectedCompanyId = useForestStore((s) => s.selectedCompanyId);
  const { data: snapshot } = useSnapshot();
  const cardRef = useRef<HTMLDivElement>(null);

  // Debounced hide: trunks and canopies are separate instanced meshes, so
  // sweeping across one tree fires pointerOut(null) then pointerOver(id)
  // back to back; without the grace period the card flickers
  const [displayId, setDisplayId] = useState<string | null>(null);
  useEffect(() => {
    if (hoveredCompanyId) {
      setDisplayId(hoveredCompanyId);
      return;
    }
    const t = window.setTimeout(() => setDisplayId(null), 100);
    return () => window.clearTimeout(t);
  }, [hoveredCompanyId]);

  // Track the cursor by mutating the transform directly; no React state
  // per pointer move
  useEffect(() => {
    if (!displayId) return;
    const el = cardRef.current;
    if (el) positionCard(el);
    const onMove = () => {
      if (cardRef.current) positionCard(cardRef.current);
    };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, [displayId]);

  if (!FINE_POINTER || !snapshot || !displayId) return null;
  // The detail panel already covers the selected tree
  if (displayId === selectedCompanyId) return null;

  const company = snapshot.companies.find((c) => c.id === displayId);
  if (!company) return null;
  const species = getSpecies(company.sector);

  return (
    <div
      ref={cardRef}
      className="fixed top-0 left-0 z-30 pointer-events-none select-none"
      style={{ width: CARD_W, willChange: 'transform' }}
    >
      <div className="glass-panel-solid p-3 space-y-2">
        <div>
          <p className="text-sm font-semibold text-overlay-text truncate">{company.name}</p>
          <p className="text-[10px] text-overlay-accent">{species.label}</p>
        </div>
        <div className="space-y-1 text-[11px]">
          <TooltipRow label="Funding" value={formatFunding(company.total_funding_usd)} />
          {(company.headcount_display || company.headcount_bucket) && (
            <TooltipRow
              label="Headcount"
              value={company.headcount_display || company.headcount_bucket || ''}
            />
          )}
          {company.founded_year && (
            <TooltipRow label="Founded" value={String(company.founded_year)} />
          )}
          {company.latest_round_type && (
            <TooltipRow
              label="Latest round"
              value={`${formatRoundType(company.latest_round_type)}${
                company.latest_round_date ? ` (${company.latest_round_date.slice(0, 4)})` : ''
              }`}
            />
          )}
        </div>
        {(() => {
          const rankLine = getCompanyRankLine(snapshot, company);
          return rankLine ? (
            <p className="text-[10px] text-overlay-accent/70">{rankLine}</p>
          ) : null;
        })()}
        <p className="text-[9px] text-overlay-muted/40 pt-1 border-t border-overlay-border">
          Click to explore
        </p>
      </div>
    </div>
  );
}

function TooltipRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-overlay-muted/50">{label}</span>
      <span className="text-overlay-text/85 font-medium truncate">{value}</span>
    </div>
  );
}
