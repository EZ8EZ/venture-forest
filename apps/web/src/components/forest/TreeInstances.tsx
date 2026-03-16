import { useRef, useMemo, useCallback } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import type { CompanyPlacement } from '@/lib/types';
import { getSpecies } from '@/lib/species-config';
import { useForestStore } from '@/stores/forest-store';

interface TreeInstancesProps {
  placements: CompanyPlacement[];
  companyIds: string[];
  filteredIds?: Set<string>;
}

const tempObject = new THREE.Object3D();
const tempColor = new THREE.Color();

// Canopy geometry generators by shape (used for future per-species instancing)
export function createCanopyGeometry(shape: string): THREE.BufferGeometry {
  switch (shape) {
    case 'cone':
      return new THREE.ConeGeometry(1, 1.6, 8);
    case 'dome':
      return new THREE.SphereGeometry(1, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    case 'broad':
      return new THREE.SphereGeometry(1, 12, 8);
    case 'organic': {
      const geo = new THREE.IcosahedronGeometry(1, 1);
      // Distort vertices for organic feel
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        const noise = 1 + Math.sin(x * 3) * Math.cos(z * 3) * 0.15;
        pos.setXYZ(i, x * noise, y * noise, z * noise);
      }
      geo.computeVertexNormals();
      return geo;
    }
    case 'round':
      return new THREE.SphereGeometry(1, 16, 12);
    case 'angular':
      return new THREE.OctahedronGeometry(1, 0);
    case 'spire':
      return new THREE.ConeGeometry(0.6, 2.2, 6);
    case 'columnar':
      return new THREE.CylinderGeometry(0.7, 0.9, 1.8, 8);
    case 'spreading': {
      const geo = new THREE.SphereGeometry(1, 12, 8);
      geo.scale(1.3, 0.6, 1.3);
      return geo;
    }
    case 'weeping': {
      const geo = new THREE.SphereGeometry(1, 12, 10);
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i);
        if (y < 0) {
          const droopFactor = 1 + Math.abs(y) * 0.4;
          pos.setX(i, pos.getX(i) * droopFactor);
          pos.setZ(i, pos.getZ(i) * droopFactor);
          pos.setY(i, y * 1.3);
        }
      }
      geo.computeVertexNormals();
      return geo;
    }
    default:
      return new THREE.SphereGeometry(1, 12, 8);
  }
}

export function TreeInstances({ placements, companyIds, filteredIds }: TreeInstancesProps) {
  const trunkRef = useRef<THREE.InstancedMesh>(null);
  const canopyRef = useRef<THREE.InstancedMesh>(null);
  const selectCompany = useForestStore((s) => s.selectCompany);
  const hoverCompany = useForestStore((s) => s.hoverCompany);
  const selectedCompanyId = useForestStore((s) => s.selectedCompanyId);
  const hoveredCompanyId = useForestStore((s) => s.hoveredCompanyId);

  const count = placements.length;

  // Precompute canopy and trunk colors
  const { trunkColors, canopyColors } = useMemo(() => {
    const tc = new Float32Array(count * 3);
    const cc = new Float32Array(count * 3);

    placements.forEach((p, i) => {
      const species = getSpecies(p.species_type);

      // Bark varies by age via bark_variant
      const barkLerp = p.bark_variant / 3;
      tempColor.set(species.barkColor).lerp(new THREE.Color(species.barkColorDark), barkLerp);
      tc[i * 3] = tempColor.r;
      tc[i * 3 + 1] = tempColor.g;
      tc[i * 3 + 2] = tempColor.b;

      // Canopy color with slight variant
      const canopyLerp = p.canopy_variant / 6;
      tempColor.set(species.canopyColor).lerp(new THREE.Color(species.canopyColorHighlight), canopyLerp);
      cc[i * 3] = tempColor.r;
      cc[i * 3 + 1] = tempColor.g;
      cc[i * 3 + 2] = tempColor.b;
    });

    return { trunkColors: tc, canopyColors: cc };
  }, [placements, count]);

  // Default canopy geometry (we use a single shape and scale differently per sector)
  // For v1, we use a combined approach: single instanced mesh with sphere geometry
  // and scale it to approximate different shapes
  const trunkGeo = useMemo(() => new THREE.CylinderGeometry(1, 1.2, 1, 8), []);
  const canopyGeo = useMemo(() => new THREE.IcosahedronGeometry(1, 2), []);

  // Update instance matrices and colors
  useMemo(() => {
    if (!trunkRef.current || !canopyRef.current) return;

    const trunkMesh = trunkRef.current;
    const canopyMesh = canopyRef.current;

    // Set instance colors
    trunkMesh.instanceColor = new THREE.InstancedBufferAttribute(trunkColors, 3);
    canopyMesh.instanceColor = new THREE.InstancedBufferAttribute(canopyColors, 3);

    placements.forEach((p, i) => {
      const species = getSpecies(p.species_type);

      // Trunk
      tempObject.position.set(p.world_x, p.elevation + p.tree_height / 2, p.world_z);
      tempObject.scale.set(p.trunk_radius, p.tree_height, p.trunk_radius);
      tempObject.updateMatrix();
      trunkMesh.setMatrixAt(i, tempObject.matrix);

      // Canopy: position on top of trunk, scale by funding importance
      const canopyRadius = p.trunk_radius * 2.5 + p.tree_height * 0.15;
      const canopyHeight = canopyRadius * getCanopyHeightMultiplier(species.canopyShape);
      tempObject.position.set(
        p.world_x,
        p.elevation + p.tree_height + canopyHeight * 0.4,
        p.world_z,
      );

      const scaleX = canopyRadius * getCanopyWidthMultiplier(species.canopyShape);
      const scaleY = canopyHeight;
      const scaleZ = canopyRadius * getCanopyWidthMultiplier(species.canopyShape);
      tempObject.scale.set(scaleX, scaleY, scaleZ);
      tempObject.updateMatrix();
      canopyMesh.setMatrixAt(i, tempObject.matrix);
    });

    trunkMesh.instanceMatrix.needsUpdate = true;
    canopyMesh.instanceMatrix.needsUpdate = true;
  }, [placements, trunkColors, canopyColors]);

  // Animate selected/hovered states through color modulation
  useFrame(() => {
    if (!canopyRef.current || !canopyRef.current.instanceColor) return;

    const colors = canopyRef.current.instanceColor;
    let needsUpdate = false;

    placements.forEach((p, i) => {
      const id = companyIds[i];
      const isSelected = id === selectedCompanyId;
      const isHovered = id === hoveredCompanyId;
      const isFiltered = filteredIds && !filteredIds.has(id);
      const species = getSpecies(p.species_type);

      if (isSelected) {
        tempColor.set(species.canopyColorHighlight);
        tempColor.multiplyScalar(1.5);
        needsUpdate = true;
      } else if (isHovered) {
        tempColor.set(species.canopyColorHighlight);
        tempColor.multiplyScalar(1.2);
        needsUpdate = true;
      } else if (isFiltered) {
        tempColor.set(species.canopyColorDark);
        tempColor.multiplyScalar(0.3);
        needsUpdate = true;
      } else {
        const canopyLerp = p.canopy_variant / 6;
        tempColor.set(species.canopyColor).lerp(new THREE.Color(species.canopyColorHighlight), canopyLerp);
      }

      colors.setXYZ(i, tempColor.r, tempColor.g, tempColor.b);
    });

    if (needsUpdate) {
      colors.needsUpdate = true;
    }
  });

  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      const instanceId = e.instanceId;
      if (instanceId !== undefined && instanceId < companyIds.length) {
        selectCompany(companyIds[instanceId]);
      }
    },
    [companyIds, selectCompany],
  );

  const handlePointerOver = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      const instanceId = e.instanceId;
      if (instanceId !== undefined && instanceId < companyIds.length) {
        hoverCompany(companyIds[instanceId]);
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
      {/* Trunks */}
      <instancedMesh
        ref={trunkRef}
        args={[trunkGeo, undefined, count]}
        castShadow
        receiveShadow
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <meshStandardMaterial
          roughness={0.9}
          metalness={0.05}
          vertexColors
        />
      </instancedMesh>

      {/* Canopies */}
      <instancedMesh
        ref={canopyRef}
        args={[canopyGeo, undefined, count]}
        castShadow
        receiveShadow
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <meshStandardMaterial
          roughness={0.7}
          metalness={0.1}
          vertexColors
        />
      </instancedMesh>
    </group>
  );
}

function getCanopyHeightMultiplier(shape: string): number {
  switch (shape) {
    case 'cone': return 1.6;
    case 'spire': return 2.0;
    case 'dome': return 0.8;
    case 'broad': return 0.7;
    case 'spreading': return 0.5;
    case 'columnar': return 1.4;
    case 'angular': return 1.0;
    case 'weeping': return 1.1;
    default: return 1.0;
  }
}

function getCanopyWidthMultiplier(shape: string): number {
  switch (shape) {
    case 'cone': return 0.7;
    case 'spire': return 0.5;
    case 'dome': return 1.1;
    case 'broad': return 1.4;
    case 'spreading': return 1.5;
    case 'columnar': return 0.6;
    case 'angular': return 0.9;
    case 'weeping': return 1.2;
    default: return 1.0;
  }
}
