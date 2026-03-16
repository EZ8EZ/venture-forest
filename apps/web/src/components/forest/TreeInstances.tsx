import { useRef, useMemo, useCallback, useEffect } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import type { CompanyPlacement, Sector } from '@/lib/types';
import { getSpecies, SECTOR_ORDER } from '@/lib/species-config';
import { useForestStore } from '@/stores/forest-store';

interface TreeInstancesProps {
  placements: CompanyPlacement[];
  companyIds: string[];
  filteredIds?: Set<string>;
}

const tempObject = new THREE.Object3D();
const tempColor = new THREE.Color();

// -- Sector-specific canopy geometries --

function createCanopyGeometry(shape: string): THREE.BufferGeometry {
  switch (shape) {
    case 'cone': {
      const geo = new THREE.ConeGeometry(1, 2.0, 8);
      return geo;
    }
    case 'dome': {
      const geo = new THREE.SphereGeometry(1, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55);
      geo.scale(1.05, 0.9, 1.05);
      return geo;
    }
    case 'broad': {
      const geo = new THREE.SphereGeometry(1, 10, 8);
      geo.scale(1.45, 0.6, 1.45);
      return geo;
    }
    case 'organic': {
      const geo = new THREE.IcosahedronGeometry(1, 1);
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        const n = 1 + Math.sin(x * 4.5) * Math.cos(z * 3.7) * 0.22;
        pos.setXYZ(i, x * n, y * (0.85 + Math.abs(Math.sin(x * 2)) * 0.25), z * n);
      }
      geo.computeVertexNormals();
      return geo;
    }
    case 'round': {
      const geo = new THREE.SphereGeometry(1, 12, 10);
      geo.scale(1.1, 0.95, 1.1);
      return geo;
    }
    case 'angular': {
      const geo = new THREE.OctahedronGeometry(1, 1);
      geo.scale(1.0, 0.85, 1.0);
      return geo;
    }
    case 'columnar': {
      return new THREE.CylinderGeometry(0.6, 0.85, 2.2, 8);
    }
    case 'spreading': {
      const geo = new THREE.SphereGeometry(1, 12, 8);
      geo.scale(1.55, 0.42, 1.55);
      return geo;
    }
    case 'weeping': {
      const geo = new THREE.SphereGeometry(1, 10, 10);
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i);
        if (y < -0.15) {
          const droop = 1 + Math.abs(y) * 0.55;
          pos.setX(i, pos.getX(i) * droop);
          pos.setZ(i, pos.getZ(i) * droop);
          pos.setY(i, y * 1.45);
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

export function TreeInstances({ placements, companyIds, filteredIds }: TreeInstancesProps) {
  const selectCompany = useForestStore((s) => s.selectCompany);
  const hoverCompany = useForestStore((s) => s.hoverCompany);
  const selectedCompanyId = useForestStore((s) => s.selectedCompanyId);
  const hoveredCompanyId = useForestStore((s) => s.hoveredCompanyId);

  const count = placements.length;

  // Shared tapered trunk geometry
  const trunkGeo = useMemo(() => new THREE.CylinderGeometry(0.65, 1.0, 1, 8), []);

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

      const radius = p.trunk_radius * 1.3;
      tempObject.position.set(p.world_x, p.elevation + p.tree_height * 0.5, p.world_z);
      tempObject.scale.set(radius, p.tree_height, radius);
      tempObject.rotation.set(0, pseudoRandom(p.world_x, p.world_z) * Math.PI * 2, 0);
      tempObject.updateMatrix();
      mesh.setMatrixAt(i, tempObject.matrix);
    });

    mesh.instanceColor = new THREE.InstancedBufferAttribute(colors, 3);
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [placements, count]);

  // Trunk click/hover
  const handleTrunkClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      if (e.instanceId !== undefined && e.instanceId < companyIds.length) {
        selectCompany(companyIds[e.instanceId]);
      }
    },
    [companyIds, selectCompany],
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
      {/* All trunks: single instanced mesh */}
      <instancedMesh
        ref={trunkRef}
        args={[trunkGeo, undefined, count]}
        castShadow
        receiveShadow
        onClick={handleTrunkClick}
        onPointerOver={handleTrunkOver}
        onPointerOut={handlePointerOut}
        frustumCulled
      >
        <meshStandardMaterial
          roughness={0.88}
          metalness={0.02}
          vertexColors
          emissive="#3a2820"
          emissiveIntensity={0.08}
        />
      </instancedMesh>

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
            selectedCompanyId={selectedCompanyId}
            hoveredCompanyId={hoveredCompanyId}
            onSelect={selectCompany}
            onHover={hoverCompany}
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
  selectedCompanyId,
  hoveredCompanyId,
  onSelect,
  onHover,
}: {
  sector: Sector;
  geometry: THREE.BufferGeometry;
  placements: CompanyPlacement[];
  ids: string[];
  filteredIds?: Set<string>;
  selectedCompanyId: string | null;
  hoveredCompanyId: string | null;
  onSelect: (id: string | null) => void;
  onHover: (id: string | null) => void;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const species = getSpecies(sector);
  const n = placements.length;

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

      // Canopy size: generous, proportional to importance
      const baseR = p.trunk_radius * 3.2 + p.tree_height * 0.22 + 1.2;
      const hRatio = canopyHeightRatio(species.canopyShape);
      const wRatio = canopyWidthRatio(species.canopyShape);
      const cH = baseR * hRatio;
      const cW = baseR * wRatio;
      const cY = p.elevation + p.tree_height * 0.82 + cH * 0.38;

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

  // Animate selection/hover/filter colors
  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh || !mesh.instanceColor) return;
    const c = mesh.instanceColor;
    let dirty = false;

    for (let i = 0; i < n; i++) {
      const id = ids[i];
      const p = placements[i];

      if (id === selectedCompanyId) {
        tempColor.set(species.canopyColorHighlight).multiplyScalar(1.7);
        dirty = true;
      } else if (id === hoveredCompanyId) {
        tempColor.set(species.canopyColorHighlight).multiplyScalar(1.35);
        dirty = true;
      } else if (filteredIds && !filteredIds.has(id)) {
        tempColor.set(species.canopyColorDark).multiplyScalar(0.2);
        dirty = true;
      } else {
        tempColor
          .set(species.canopyColor)
          .lerp(new THREE.Color(species.canopyColorHighlight), p.canopy_variant / 5);
      }
      c.setXYZ(i, tempColor.r, tempColor.g, tempColor.b);
    }
    if (dirty) c.needsUpdate = true;
  });

  const onClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      if (e.instanceId !== undefined && e.instanceId < ids.length) onSelect(ids[e.instanceId]);
    },
    [ids, onSelect],
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

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, undefined, n]}
      castShadow
      receiveShadow
      onClick={onClick}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      frustumCulled
    >
      <meshStandardMaterial
        roughness={0.68}
        metalness={0.03}
        vertexColors
        side={THREE.DoubleSide}
        emissive={species.canopyColor}
        emissiveIntensity={0.15}
      />
    </instancedMesh>
  );
}

// -- Helpers --

function canopyHeightRatio(shape: string): number {
  switch (shape) {
    case 'cone':      return 1.6;
    case 'dome':      return 0.9;
    case 'broad':     return 0.6;
    case 'organic':   return 1.0;
    case 'round':     return 1.0;
    case 'angular':   return 1.1;
    case 'columnar':  return 1.7;
    case 'spreading': return 0.45;
    case 'weeping':   return 1.1;
    default:          return 1.0;
  }
}

function canopyWidthRatio(shape: string): number {
  switch (shape) {
    case 'cone':      return 0.8;
    case 'dome':      return 1.15;
    case 'broad':     return 1.5;
    case 'organic':   return 1.1;
    case 'round':     return 1.15;
    case 'angular':   return 0.9;
    case 'columnar':  return 0.55;
    case 'spreading': return 1.6;
    case 'weeping':   return 1.25;
    default:          return 1.0;
  }
}

function pseudoRandom(a: number, b: number): number {
  const s = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return s - Math.floor(s);
}
