import { useRef, useMemo, useCallback, useEffect } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import type { CompanyPlacement, Sector } from '@/lib/types';
import { getSpecies, SECTOR_ORDER } from '@/lib/species-config';
import { barkMaterial, canopyMaterial } from '@/lib/forest-shaders';
import { useForestStore } from '@/stores/forest-store';

interface TreeInstancesProps {
  placements: CompanyPlacement[];
  companyIds: string[];
  filteredIds?: Set<string>;
  highlightedIds?: Set<string>;
}

const tempObject = new THREE.Object3D();
const tempColor = new THREE.Color();

// Height multiplier applied to data tree_height values
const HEIGHT_SCALE = 1.0;

// -- Sector-specific canopy geometries (all must read as tree canopies) --

function createCanopyGeometry(shape: string): THREE.BufferGeometry {
  switch (shape) {
    case 'cone': {
      // Classic conifer: tall narrow cone
      return new THREE.ConeGeometry(1, 2.2, 8);
    }
    case 'dome': {
      // Deciduous dome: half-sphere cap
      const geo = new THREE.SphereGeometry(1, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55);
      geo.scale(1.05, 0.95, 1.05);
      return geo;
    }
    case 'broad': {
      // Broad oak: moderately wide with real height
      const geo = new THREE.SphereGeometry(1, 10, 8);
      geo.scale(1.15, 0.85, 1.15);
      return geo;
    }
    case 'organic': {
      // Biotech: irregular bumpy canopy
      const geo = new THREE.IcosahedronGeometry(1, 1);
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        const n = 1 + Math.sin(x * 4.5) * Math.cos(z * 3.7) * 0.18;
        pos.setXYZ(i, x * n, y * (0.9 + Math.abs(Math.sin(x * 2)) * 0.2), z * n);
      }
      geo.computeVertexNormals();
      return geo;
    }
    case 'round': {
      // Full rounded canopy
      const geo = new THREE.SphereGeometry(1, 12, 10);
      geo.scale(1.05, 0.95, 1.05);
      return geo;
    }
    case 'spire': {
      // Tall pointed spire (like a spruce) - replaces old angular octahedron
      const geo = new THREE.ConeGeometry(1, 2.8, 6);
      geo.scale(0.85, 1.0, 0.85);
      return geo;
    }
    case 'columnar': {
      // Tall narrow canopy like a cypress/poplar
      const geo = new THREE.ConeGeometry(0.7, 2.4, 8);
      geo.scale(0.75, 1.0, 0.75);
      return geo;
    }
    case 'spreading': {
      // Spreading canopy with real height, like a mature oak
      const geo = new THREE.SphereGeometry(1, 12, 8);
      geo.scale(1.1, 0.85, 1.1);
      return geo;
    }
    case 'weeping': {
      // Drooping willow-like canopy
      const geo = new THREE.SphereGeometry(1, 10, 10);
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i);
        if (y < -0.15) {
          const droop = 1 + Math.abs(y) * 0.45;
          pos.setX(i, pos.getX(i) * droop);
          pos.setZ(i, pos.getZ(i) * droop);
          pos.setY(i, y * 1.3);
        }
      }
      geo.computeVertexNormals();
      return geo;
    }
    default:
      return new THREE.SphereGeometry(1, 10, 8);
  }
}

// -- Group placements by sector for per-sector canopy instancing --

function groupBySector(placements: CompanyPlacement[], companyIds: string[]) {
  const groups = new Map<Sector, { placements: CompanyPlacement[]; ids: string[] }>();
  placements.forEach((p, i) => {
    let g = groups.get(p.species_type);
    if (!g) {
      g = { placements: [], ids: [] };
      groups.set(p.species_type, g);
    }
    g.placements.push(p);
    g.ids.push(companyIds[i]);
  });
  return groups;
}

// -- Main component --

export function TreeInstances({ placements, companyIds, filteredIds, highlightedIds }: TreeInstancesProps) {
  const selectCompany = useForestStore((s) => s.selectCompany);
  const hoverCompany = useForestStore((s) => s.hoverCompany);
  const selectedCompanyId = useForestStore((s) => s.selectedCompanyId);
  const hoveredCompanyId = useForestStore((s) => s.hoveredCompanyId);
  const setCameraTarget = useForestStore((s) => s.setCameraTarget);

  const count = placements.length;

  // Shared tapered trunk geometry
  const trunkGeo = useMemo(() => new THREE.CylinderGeometry(0.5, 0.85, 1, 8), []);

  // Build per-sector canopy geometry map
  const canopyGeos = useMemo(() => {
    const m = new Map<string, THREE.BufferGeometry>();
    SECTOR_ORDER.forEach((s) => m.set(s, createCanopyGeometry(getSpecies(s).canopyShape)));
    return m;
  }, []);

  const sectorGroups = useMemo(() => groupBySector(placements, companyIds), [placements, companyIds]);

  // -- Trunk instanced mesh (all companies) --
  const trunkRef = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    const mesh = trunkRef.current;
    if (!mesh) return;
    const colors = new Float32Array(count * 3);

    placements.forEach((p, i) => {
      const sp = getSpecies(p.species_type);
      tempColor.set(sp.barkColor).lerp(new THREE.Color(sp.barkColorDark), p.bark_variant / 3);
      colors[i * 3] = tempColor.r;
      colors[i * 3 + 1] = tempColor.g;
      colors[i * 3 + 2] = tempColor.b;

      const h = p.tree_height * HEIGHT_SCALE;
      const radius = p.trunk_radius * 1.2;
      tempObject.position.set(p.world_x, p.elevation + h * 0.5, p.world_z);
      tempObject.scale.set(radius, h, radius);
      tempObject.rotation.set(0, pseudoRandom(p.world_x, p.world_z) * Math.PI * 2, 0);
      tempObject.updateMatrix();
      mesh.setMatrixAt(i, tempObject.matrix);
    });

    mesh.instanceColor = new THREE.InstancedBufferAttribute(colors, 3);
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [placements, count]);

  // Trunk click: select + camera target
  const handleTrunkClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      if (e.instanceId !== undefined && e.instanceId < companyIds.length) {
        const id = companyIds[e.instanceId];
        const p = placements[e.instanceId];
        selectCompany(id);
        setCameraTarget({
          x: p.world_x,
          y: p.elevation + p.tree_height * HEIGHT_SCALE,
          z: p.world_z,
        });
      }
    },
    [companyIds, placements, selectCompany, setCameraTarget],
  );

  const handleTrunkOver = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      if (e.instanceId !== undefined && e.instanceId < companyIds.length) {
        hoverCompany(companyIds[e.instanceId]);
        document.body.style.cursor = 'pointer';
      }
    },
    [companyIds, hoverCompany],
  );

  const handlePointerOut = useCallback(() => {
    hoverCompany(null);
    document.body.style.cursor = 'default';
  }, [hoverCompany]);

  if (count === 0) return null;

  return (
    <group>
      {/* All trunks: single instanced mesh with the procedural bark shader */}
      <instancedMesh
        ref={trunkRef}
        args={[trunkGeo, undefined, count]}
        material={barkMaterial}
        castShadow
        receiveShadow
        onClick={handleTrunkClick}
        onPointerOver={handleTrunkOver}
        onPointerOut={handlePointerOut}
        frustumCulled
      />

      {/* Per-sector canopy meshes with distinct shapes */}
      {SECTOR_ORDER.map((sector) => {
        const g = sectorGroups.get(sector);
        if (!g || g.placements.length === 0) return null;
        return (
          <SectorCanopies
            key={sector}
            sector={sector}
            geometry={canopyGeos.get(sector)!}
            placements={g.placements}
            ids={g.ids}
            filteredIds={filteredIds}
            highlightedIds={highlightedIds}
            selectedCompanyId={selectedCompanyId}
            hoveredCompanyId={hoveredCompanyId}
            onSelect={selectCompany}
            onHover={hoverCompany}
            allPlacements={placements}
            setCameraTarget={setCameraTarget}
          />
        );
      })}
    </group>
  );
}

// -- Per-sector canopy instanced mesh --

function SectorCanopies({
  sector,
  geometry,
  placements,
  ids,
  filteredIds,
  highlightedIds,
  selectedCompanyId,
  hoveredCompanyId,
  onSelect,
  onHover,
  setCameraTarget,
}: {
  sector: Sector;
  geometry: THREE.BufferGeometry;
  placements: CompanyPlacement[];
  ids: string[];
  filteredIds?: Set<string>;
  highlightedIds?: Set<string>;
  selectedCompanyId: string | null;
  hoveredCompanyId: string | null;
  onSelect: (id: string | null) => void;
  onHover: (id: string | null) => void;
  allPlacements: CompanyPlacement[];
  setCameraTarget: (target: { x: number; y: number; z: number } | null) => void;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const species = getSpecies(sector);
  const n = placements.length;

  // Refs to avoid stale closures in useFrame
  const highlightedRef = useRef(highlightedIds);
  highlightedRef.current = highlightedIds;
  const filteredRef = useRef(filteredIds);
  filteredRef.current = filteredIds;
  const selectedRef = useRef(selectedCompanyId);
  selectedRef.current = selectedCompanyId;
  const hoveredRef = useRef(hoveredCompanyId);
  hoveredRef.current = hoveredCompanyId;
  // Track whether we were dirty last frame so we can reset colors
  const wasDirty = useRef(false);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const colors = new Float32Array(n * 3);

    placements.forEach((p, i) => {
      tempColor
        .set(species.canopyColor)
        .lerp(new THREE.Color(species.canopyColorHighlight), p.canopy_variant / 5);
      colors[i * 3] = tempColor.r;
      colors[i * 3 + 1] = tempColor.g;
      colors[i * 3 + 2] = tempColor.b;

      const h = p.tree_height * HEIGHT_SCALE;
      // Canopy size: height-dominant now that trunk encodes headcount
      // rather than funding; a small trunk term keeps thick-trunked squat
      // trees (large team, little funding) reading as full bushes
      const baseR = 0.55 + h * 0.13 + p.trunk_radius * 0.6;
      const hRatio = canopyHeightRatio(species.canopyShape);
      const wRatio = canopyWidthRatio(species.canopyShape);
      const cH = baseR * hRatio;
      const cW = baseR * wRatio;
      const cY = p.elevation + h * 0.85 + cH * 0.35;

      tempObject.position.set(p.world_x, cY, p.world_z);
      tempObject.scale.set(cW, cH, cW);
      tempObject.rotation.set(0, pseudoRandom(p.world_x, p.world_z) * Math.PI * 2, 0);
      tempObject.updateMatrix();
      mesh.setMatrixAt(i, tempObject.matrix);
    });

    mesh.instanceColor = new THREE.InstancedBufferAttribute(colors, 3);
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [placements, n, species]);

  // Animate selection/hover/filter/highlight colors using refs for freshness
  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh || !mesh.instanceColor) return;
    const c = mesh.instanceColor;
    let dirty = false;

    const curHighlighted = highlightedRef.current;
    const curFiltered = filteredRef.current;
    const curSelected = selectedRef.current;
    const curHovered = hoveredRef.current;

    for (let i = 0; i < n; i++) {
      const id = ids[i];
      const p = placements[i];

      if (id === curSelected) {
        tempColor.set(species.canopyColorHighlight).multiplyScalar(1.8);
        dirty = true;
      } else if (id === curHovered) {
        tempColor.set(species.canopyColorHighlight).multiplyScalar(1.4);
        dirty = true;
      } else if (curHighlighted && curHighlighted.size > 0) {
        // Investor portfolio mode: bright for portfolio, dim for others
        if (curHighlighted.has(id)) {
          tempColor.set(species.canopyColorHighlight).multiplyScalar(1.5);
        } else {
          tempColor.set(species.canopyColorDark).multiplyScalar(0.25);
        }
        dirty = true;
      } else if (curFiltered && !curFiltered.has(id)) {
        tempColor.set(species.canopyColorDark).multiplyScalar(0.25);
        dirty = true;
      } else {
        tempColor
          .set(species.canopyColor)
          .lerp(new THREE.Color(species.canopyColorHighlight), p.canopy_variant / 5);
      }
      c.setXYZ(i, tempColor.r, tempColor.g, tempColor.b);
    }

    // Always update if dirty, or if we WERE dirty last frame (to reset colors)
    if (dirty || wasDirty.current) {
      c.needsUpdate = true;
    }
    wasDirty.current = dirty;
  });

  const onClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      if (e.instanceId !== undefined && e.instanceId < ids.length) {
        const p = placements[e.instanceId];
        onSelect(ids[e.instanceId]);
        setCameraTarget({
          x: p.world_x,
          y: p.elevation + p.tree_height * HEIGHT_SCALE,
          z: p.world_z,
        });
      }
    },
    [ids, placements, onSelect, setCameraTarget],
  );
  const onPointerOver = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      if (e.instanceId !== undefined && e.instanceId < ids.length) {
        onHover(ids[e.instanceId]);
        document.body.style.cursor = 'pointer';
      }
    },
    [ids, onHover],
  );
  const onPointerOut = useCallback(() => {
    onHover(null);
    document.body.style.cursor = 'default';
  }, [onHover]);

  // Shared wind + translucency canopy material; per-tree color comes from
  // instanceColor so one material (one shader program) covers all sectors.
  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, undefined, n]}
      material={canopyMaterial}
      castShadow
      receiveShadow
      onClick={onClick}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      frustumCulled
    />
  );
}

// -- Helpers --

function canopyHeightRatio(shape: string): number {
  switch (shape) {
    case 'cone':      return 1.5;
    case 'dome':      return 0.9;
    case 'broad':     return 0.85;
    case 'organic':   return 1.0;
    case 'round':     return 0.95;
    case 'spire':     return 1.8;
    case 'columnar':  return 1.6;
    case 'spreading': return 0.85;
    case 'weeping':   return 1.05;
    default:          return 0.95;
  }
}

function canopyWidthRatio(shape: string): number {
  switch (shape) {
    case 'cone':      return 0.7;
    case 'dome':      return 0.9;
    case 'broad':     return 1.0;
    case 'organic':   return 0.85;
    case 'round':     return 0.85;
    case 'spire':     return 0.55;
    case 'columnar':  return 0.5;
    case 'spreading': return 1.0;
    case 'weeping':   return 0.95;
    default:          return 0.85;
  }
}

function pseudoRandom(a: number, b: number): number {
  const s = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return s - Math.floor(s);
}
