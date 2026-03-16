import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { CompanyInvestorEdge, CompanyPlacement } from '@/lib/types';
import { useForestStore } from '@/stores/forest-store';

interface InvestorRootsProps {
  edges: CompanyInvestorEdge[];
  placements: CompanyPlacement[];
  placementIndex: Map<string, number>;
}

export function InvestorRoots({ edges, placements, placementIndex }: InvestorRootsProps) {
  const selectedCompanyId = useForestStore((s) => s.selectedCompanyId);
  const selectedInvestorId = useForestStore((s) => s.selectedInvestorId);
  const viewMode = useForestStore((s) => s.viewMode);

  const groupRef = useRef<THREE.Group>(null);

  // Determine which edges to show
  const visibleEdges = useMemo(() => {
    if (viewMode === 'investor' && selectedInvestorId) {
      // Show all edges for this investor
      return edges
        .filter((e) => e.investor_id === selectedInvestorId)
        .slice(0, 50); // Cap for performance
    }

    if (selectedCompanyId) {
      // Show edges connected to selected company
      const companyEdges = edges.filter((e) => e.company_id === selectedCompanyId);
      // Also show shared investor connections to nearby companies
      const investorIds = new Set(companyEdges.map((e) => e.investor_id));
      const sharedEdges = edges.filter(
        (e) =>
          e.company_id !== selectedCompanyId &&
          investorIds.has(e.investor_id),
      );
      return [...companyEdges, ...sharedEdges.slice(0, 30)];
    }

    return [];
  }, [edges, selectedCompanyId, selectedInvestorId, viewMode]);

  // Build root curves
  const rootCurves = useMemo(() => {
    const curves: { points: THREE.Vector3[]; strength: number; isSelected: boolean }[] = [];

    // Group edges by investor to create shared root networks
    const edgesByInvestor = new Map<string, CompanyInvestorEdge[]>();
    visibleEdges.forEach((e) => {
      const list = edgesByInvestor.get(e.investor_id) || [];
      list.push(e);
      edgesByInvestor.set(e.investor_id, list);
    });

    edgesByInvestor.forEach((investorEdges, investorId) => {
      // Create underground paths between companies sharing this investor
      for (let i = 0; i < investorEdges.length; i++) {
        const e1 = investorEdges[i];
        const idx1 = placementIndex.get(e1.company_id);
        if (idx1 === undefined) continue;
        const p1 = placements[idx1];

        // Connect to a central "root node" underground
        const rootDepth = -3 - e1.edge_strength * 4;

        // For selected company: connect to underground root point
        if (e1.company_id === selectedCompanyId || investorId === selectedInvestorId) {
          for (let j = i + 1; j < investorEdges.length; j++) {
            const e2 = investorEdges[j];
            const idx2 = placementIndex.get(e2.company_id);
            if (idx2 === undefined) continue;
            const p2 = placements[idx2];

            const midX = (p1.world_x + p2.world_x) / 2;
            const midZ = (p1.world_z + p2.world_z) / 2;

            curves.push({
              points: [
                new THREE.Vector3(p1.world_x, p1.elevation, p1.world_z),
                new THREE.Vector3(p1.world_x, rootDepth, p1.world_z),
                new THREE.Vector3(midX, rootDepth - 2, midZ),
                new THREE.Vector3(p2.world_x, rootDepth, p2.world_z),
                new THREE.Vector3(p2.world_x, p2.elevation, p2.world_z),
              ],
              strength: (e1.edge_strength + e2.edge_strength) / 2,
              isSelected: true,
            });
          }
        }
      }
    });

    return curves;
  }, [visibleEdges, placements, placementIndex, selectedCompanyId, selectedInvestorId]);

  // Animate root glow
  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.children.forEach((child, i) => {
      if (child instanceof THREE.Mesh) {
        const mat = child.material as THREE.MeshBasicMaterial;
        mat.opacity = 0.3 + Math.sin(t * 1.5 + i * 0.5) * 0.1;
      }
    });
  });

  if (rootCurves.length === 0) return null;

  return (
    <group ref={groupRef}>
      {rootCurves.map((curve, i) => (
        <RootCurve key={i} points={curve.points} strength={curve.strength} />
      ))}
    </group>
  );
}

function RootCurve({ points, strength }: { points: THREE.Vector3[]; strength: number }) {
  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
    const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.1 + strength * 0.15, 6, false);
    return tubeGeo;
  }, [points, strength]);

  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial
        color="#44ffaa"
        transparent
        opacity={0.35}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}
