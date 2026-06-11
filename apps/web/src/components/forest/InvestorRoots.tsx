import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { CompanyInvestorEdge, CompanyPlacement, Investor } from '@/lib/types';
import { useForestStore } from '@/stores/forest-store';

// Underground root network revealing investor relationships.
//
// Approach (see docs/investor-visualization-rationale.md):
// - Company selected: spokes from the selected tree to co-invested trees,
//   diving to Y -2.5..-4.5, a few connections per shared investor.
// - Investor selected: hub-and-spoke. One underground hub at the portfolio
//   centroid, one spline per portfolio company. This stays O(n) where the
//   old all-pairs approach exploded to O(n^2) on 50-company portfolios.
// - All tubes are merged into a single BufferGeometry with vertex colors
//   (color encodes investor type, radius encodes edge strength), so the
//   whole network costs one draw call and one material.
// - The material skips the depth test and renders late, so roots read as a
//   subterranean glow through the opaque ground rather than being hidden
//   by it. A short grow-in fade plays on every selection change.

const MAX_CONNECTIONS = 40;
const MAX_PER_INVESTOR = 4;
const MAX_PORTFOLIO = 50;
const TUBE_SEGMENTS = 24;
const RADIAL_SEGMENTS = 5;
const GROW_IN_SECONDS = 0.55;

const TYPE_COLORS: Record<Investor['type'], string> = {
  vc: '#2dd4a7',
  angel: '#f5b352',
  corporate: '#9f7aea',
  accelerator: '#5eead4',
  government: '#7da2f0',
};

interface InvestorRootsProps {
  edges: CompanyInvestorEdge[];
  placements: CompanyPlacement[];
  placementIndex: Map<string, number>;
  investorsById: Map<string, Investor>;
}

interface RootSpec {
  points: THREE.Vector3[];
  radius: number;
  color: THREE.Color;
  // World-space focus point for the brightness falloff (the selected tree
  // or the portfolio hub); distant strands dim so cross-map connections
  // read as fading into the earth instead of lasers across the sky
  focus: THREE.Vector3;
}

const FALLOFF_START = 18;
const FALLOFF_END = 90;
const MIN_INTENSITY = 0.12;

export function InvestorRoots({ edges, placements, placementIndex, investorsById }: InvestorRootsProps) {
  const selectedCompanyId = useForestStore((s) => s.selectedCompanyId);
  const selectedInvestorId = useForestStore((s) => s.selectedInvestorId);
  const viewMode = useForestStore((s) => s.viewMode);

  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  const growT = useRef(1);

  const geometry = useMemo(() => {
    const specs: RootSpec[] = [];
    const colorFor = (investorId: string) =>
      new THREE.Color(TYPE_COLORS[investorsById.get(investorId)?.type || 'vc'] || TYPE_COLORS.vc);
    const posOf = (companyId: string): CompanyPlacement | undefined => {
      const idx = placementIndex.get(companyId);
      return idx === undefined ? undefined : placements[idx];
    };

    if (viewMode === 'investor' && selectedInvestorId) {
      // Hub-and-spoke: portfolio trees connect to one underground hub
      const portfolio = edges
        .filter((e) => e.investor_id === selectedInvestorId)
        .slice(0, MAX_PORTFOLIO);
      const members = portfolio
        .map((e) => ({ edge: e, p: posOf(e.company_id) }))
        .filter((m): m is { edge: CompanyInvestorEdge; p: CompanyPlacement } => !!m.p);
      if (members.length > 0) {
        const hub = new THREE.Vector3(
          members.reduce((s, m) => s + m.p.world_x, 0) / members.length,
          -4.5,
          members.reduce((s, m) => s + m.p.world_z, 0) / members.length,
        );
        const color = colorFor(selectedInvestorId);
        for (const { edge, p } of members) {
          specs.push({
            points: [
              new THREE.Vector3(p.world_x, p.elevation + 0.2, p.world_z),
              new THREE.Vector3(p.world_x, -2.2 - edge.edge_strength, p.world_z),
              new THREE.Vector3((p.world_x + hub.x) / 2, hub.y, (p.world_z + hub.z) / 2),
              hub,
            ],
            radius: 0.1 + edge.edge_strength * 0.18,
            color,
            focus: hub,
          });
        }
      }
    } else if (selectedCompanyId) {
      // Spokes from the selected tree to co-invested trees, grouped per
      // shared investor so the type color stays meaningful
      const origin = posOf(selectedCompanyId);
      if (origin) {
        const companyEdges = edges.filter((e) => e.company_id === selectedCompanyId);
        let total = 0;
        for (const ce of companyEdges) {
          if (total >= MAX_CONNECTIONS) break;
          const color = colorFor(ce.investor_id);
          const depth = -2.5 - ce.edge_strength * 2;
          const siblings = edges.filter(
            (e) => e.investor_id === ce.investor_id && e.company_id !== selectedCompanyId,
          );
          for (const sib of siblings.slice(0, MAX_PER_INVESTOR)) {
            if (total >= MAX_CONNECTIONS) break;
            const p2 = posOf(sib.company_id);
            if (!p2) continue;
            // Sag deepens with span so long connections dive well below
            // the surface instead of skimming it like wires
            const span = Math.hypot(p2.world_x - origin.world_x, p2.world_z - origin.world_z);
            const sag = depth - 1.5 - span * 0.08;
            specs.push({
              points: [
                new THREE.Vector3(origin.world_x, origin.elevation + 0.2, origin.world_z),
                new THREE.Vector3(origin.world_x, depth, origin.world_z),
                new THREE.Vector3(
                  (origin.world_x + p2.world_x) / 2,
                  sag,
                  (origin.world_z + p2.world_z) / 2,
                ),
                new THREE.Vector3(p2.world_x, depth, p2.world_z),
                new THREE.Vector3(p2.world_x, p2.elevation + 0.2, p2.world_z),
              ],
              radius: 0.08 + ((ce.edge_strength + sib.edge_strength) / 2) * 0.14,
              color,
              focus: new THREE.Vector3(origin.world_x, 0, origin.world_z),
            });
            total++;
          }
        }
        // Tap root: anchors the selection visually even when co-investments
        // are far away or absent
        if (companyEdges.length > 0) {
          specs.push({
            points: [
              new THREE.Vector3(origin.world_x, origin.elevation + 0.2, origin.world_z),
              new THREE.Vector3(origin.world_x, -4, origin.world_z),
            ],
            radius: 0.16,
            color: colorFor(companyEdges[0].investor_id),
            focus: new THREE.Vector3(origin.world_x, 0, origin.world_z),
          });
        }
      }
    }

    if (specs.length === 0) return null;

    // Merge every tube into one geometry; per-tube color via vertex colors
    const parts: THREE.BufferGeometry[] = [];
    for (const spec of specs) {
      const curve = new THREE.CatmullRomCurve3(spec.points, false, 'catmullrom', 0.5);
      const tube = new THREE.TubeGeometry(curve, TUBE_SEGMENTS, spec.radius, RADIAL_SEGMENTS, false);
      const count = tube.attributes.position.count;
      const pos = tube.attributes.position;
      const colors = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const dx = pos.getX(i) - spec.focus.x;
        const dz = pos.getZ(i) - spec.focus.z;
        const dist = Math.hypot(dx, dz);
        const t = Math.min(1, Math.max(0, (dist - FALLOFF_START) / (FALLOFF_END - FALLOFF_START)));
        const intensity = 1 - (1 - MIN_INTENSITY) * t * t;
        colors[i * 3] = spec.color.r * intensity;
        colors[i * 3 + 1] = spec.color.g * intensity;
        colors[i * 3 + 2] = spec.color.b * intensity;
      }
      tube.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      parts.push(tube);
    }
    const merged = mergeGeometries(parts);
    parts.forEach((p) => p.dispose());
    return merged;
  }, [edges, placements, placementIndex, investorsById, selectedCompanyId, selectedInvestorId, viewMode]);

  // Restart the grow-in whenever the network changes; dispose the old
  // geometry (GPU memory rule in .claude/rules/performance.md)
  useEffect(() => {
    growT.current = 0;
    return () => {
      geometry?.dispose();
    };
  }, [geometry]);

  useFrame((state, delta) => {
    if (!matRef.current) return;
    growT.current = Math.min(1, growT.current + delta / GROW_IN_SECONDS);
    const pulse = 0.05 * Math.sin(state.clock.elapsedTime * 1.8);
    matRef.current.opacity = (0.32 + pulse) * easeOutCubic(growT.current);
  });

  if (!geometry) return null;

  return (
    <mesh geometry={geometry} renderOrder={5}>
      <meshBasicMaterial
        ref={matRef}
        vertexColors
        transparent
        opacity={0}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}
