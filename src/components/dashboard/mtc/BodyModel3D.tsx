import { useState, useRef, useMemo, useEffect, useCallback, Suspense } from "react";
import { Canvas, useFrame, useThree, ThreeEvent } from "@react-three/fiber";
import { OrbitControls, useGLTF, Text } from "@react-three/drei";
import * as THREE from "three";
import { BODY_REGIONS, ACUPOINTS, type BodyRegion } from "./bodyRegions";

/* ─────────────────────── Bounds helpers ─────────────────────── */

interface Bounds3D {
  xMin: number; xMax: number;
  yMin: number; yMax: number;
  zMin: number; zMax: number;
}

function mapLinear(v: number, a: number, b: number, c: number, d: number) {
  if (Math.abs(b - a) < 1e-8) return (c + d) / 2;
  return c + ((v - a) / (b - a)) * (d - c);
}

/** Pre-computed anatomy-space bounds (from region + acupoint positions). */
const ANAT: Bounds3D = (() => {
  const pts = [...BODY_REGIONS.map(r => r.position), ...ACUPOINTS.map(p => p.position)];
  const b: Bounds3D = { xMin: Infinity, xMax: -Infinity, yMin: Infinity, yMax: -Infinity, zMin: Infinity, zMax: -Infinity };
  for (const [x, y, z] of pts) {
    if (x < b.xMin) b.xMin = x; if (x > b.xMax) b.xMax = x;
    if (y < b.yMin) b.yMin = y; if (y > b.yMax) b.yMax = y;
    if (z < b.zMin) b.zMin = z; if (z > b.zMax) b.zMax = z;
  }
  return b;
})();

/* ─────────────── Compute GLB local-space bounding box ─────────────── */

function computeLocalBounds(obj: THREE.Object3D): Bounds3D {
  const min = new THREE.Vector3(Infinity, Infinity, Infinity);
  const max = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
  const v = new THREE.Vector3();

  // Force-update internal transforms (scene is not yet mounted)
  obj.updateMatrixWorld(true);

  obj.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const pos = child.geometry?.attributes?.position;
    if (!pos) return;
    for (let i = 0; i < pos.count; i++) {
      v.set(pos.getX(i), pos.getY(i), pos.getZ(i));
      // Apply the mesh's own chain of local transforms within the GLB
      v.applyMatrix4(child.matrixWorld);
      min.min(v);
      max.max(v);
    }
  });

  console.log("[BodyModel3D] GLB local bounds", {
    x: [min.x.toFixed(4), max.x.toFixed(4)],
    y: [min.y.toFixed(4), max.y.toFixed(4)],
    z: [min.z.toFixed(4), max.z.toFixed(4)],
  });

  return { xMin: min.x, xMax: max.x, yMin: min.y, yMax: max.y, zMin: min.z, zMax: max.z };
}

/* ─── Mapping: GLB local space ↔ anatomy region space ─── */
/*
 * GLB model (original orientation, before parent rotation):
 *   The model originally faces +X → rotated -90° Y so it faces camera (+Z).
 *   In the group's local space (what worldToLocal gives us):
 *     X = front(+)/back(-)  →  maps to regionZ (front/back)
 *     Y = height             →  maps to regionY (height)
 *     Z = left/right         →  maps to regionX (left/right)
 */

function glbToRegion(local: THREE.Vector3, glb: Bounds3D): [number, number, number] {
  return [
    mapLinear(local.z, glb.zMin, glb.zMax, ANAT.xMin, ANAT.xMax),
    mapLinear(local.y, glb.yMin, glb.yMax, ANAT.yMin, ANAT.yMax),
    mapLinear(local.x, glb.xMin, glb.xMax, ANAT.zMin, ANAT.zMax),
  ];
}

function regionToGlb(regionPos: [number, number, number], glb: Bounds3D): [number, number, number] {
  return [
    mapLinear(regionPos[2], ANAT.zMin, ANAT.zMax, glb.xMin, glb.xMax),
    mapLinear(regionPos[1], ANAT.yMin, ANAT.yMax, glb.yMin, glb.yMax),
    mapLinear(regionPos[0], ANAT.xMin, ANAT.xMax, glb.zMin, glb.zMax),
  ];
}

/* ─── Find nearest region purely in anatomy space ─── */

function findClosestRegion(regionPt: [number, number, number]): BodyRegion {
  let best = BODY_REGIONS[0];
  let bestD = Infinity;

  for (const r of BODY_REGIONS) {
    const dx = r.position[0] - regionPt[0];
    const dy = (r.position[1] - regionPt[1]) * 1.6; // weight height (body is tall & narrow)
    const dz = r.position[2] - regionPt[2];
    const d = dx * dx + dy * dy + dz * dz;
    if (d < bestD) { bestD = d; best = r; }
  }
  return best;
}

/* ─── Inner scene component (inside Canvas) ─── */

function HumanBodyModel({
  sex,
  selectedRegions,
  markerPositions,
  onSelectRegion,
  onMarkerPoint,
  onHoverRegion,
  showAcupoints,
  relevantMeridians,
}: {
  sex: "M" | "F";
  selectedRegions: Set<string>;
  markerPositions: Map<string, [number, number, number]>;
  onSelectRegion: (region: BodyRegion) => void;
  onMarkerPoint: (id: string, pt: [number, number, number], wasSel: boolean) => void;
  onHoverRegion: (region: BodyRegion | null) => void;
  showAcupoints: boolean;
  relevantMeridians: Set<string>;
}) {
  const modelRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF("/geometries/human_body.glb");

  const clonedScene = useMemo(() => {
    const clone = scene.clone();
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = new THREE.MeshStandardMaterial({
          color: "#e8d0b8",
          roughness: 0.55,
          metalness: 0.02,
        });
      }
    });
    return clone;
  }, [scene]);

  // Compute bounding box from raw geometry vertices (reliable, no world-matrix issues)
  const glb = useMemo(() => computeLocalBounds(clonedScene), [clonedScene]);

  const bodyScale: [number, number, number] = sex === "F" ? [3.7, 3.9, 3.7] : [4.0, 4.0, 4.0];

  const selectedMarkers = useMemo(() =>
    BODY_REGIONS.filter(r => selectedRegions.has(r.id)).map(r => ({
      id: r.id,
      pos: markerPositions.get(r.id) ?? regionToGlb(r.position, glb),
    })),
  [selectedRegions, markerPositions, glb]);

  const visibleAcupoints = useMemo(() => {
    if (!showAcupoints) return [];
    return ACUPOINTS.filter(p => relevantMeridians.has(p.meridian)).map(p => ({
      ...p,
      mapped: regionToGlb(p.position, glb),
    }));
  }, [showAcupoints, relevantMeridians, glb]);

  const resolveRegion = useCallback((e: { point: THREE.Vector3 }) => {
    if (!modelRef.current) return null;
    const local = modelRef.current.worldToLocal(e.point.clone());
    const regionPt = glbToRegion(local, glb);
    return { region: findClosestRegion(regionPt), local, regionPt };
  }, [glb]);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const result = resolveRegion(e);
    if (!result) return;
    console.log("[BodyModel3D] CLICK local:", result.local.toArray().map(n => n.toFixed(4)),
      "→ region:", result.regionPt.map(n => Number(n.toFixed(2))),
      "→", result.region.name);
    const wasSel = selectedRegions.has(result.region.id);
    onMarkerPoint(result.region.id, [result.local.x, result.local.y, result.local.z], wasSel);
    onSelectRegion(result.region);
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const result = resolveRegion(e);
    if (result) { onHoverRegion(result.region); document.body.style.cursor = "pointer"; }
  };

  const handlePointerOut = () => { onHoverRegion(null); document.body.style.cursor = "default"; };

  return (
    <group position={[0, -0.14, 0]} scale={bodyScale}>
      <group ref={modelRef} rotation={[0, -Math.PI / 2, 0]}>
        <primitive
          object={clonedScene}
          onClick={handleClick}
          onPointerMove={handlePointerMove}
          onPointerOut={handlePointerOut}
        />
        {selectedMarkers.map(m => (
          <PulsingMarker key={`sel-${m.id}`} position={m.pos} color="#ef4444" emissive="#dc2626" size={0.015} />
        ))}
        {visibleAcupoints.map(p => (
          <group key={p.id}>
            <PulsingMarker position={p.mapped} color="#22c55e" emissive="#16a34a" size={0.008} />
            <Text
              position={[p.mapped[0], p.mapped[1] + 0.016, p.mapped[2]]}
              fontSize={0.008} color="#16a34a" anchorX="center" anchorY="bottom"
              outlineWidth={0.001} outlineColor="#ffffff"
            >{p.id.replace(/R$/, "")}</Text>
          </group>
        ))}
      </group>
    </group>
  );
}

/* ─── Pulsing marker ─── */

function PulsingMarker({ position, color, emissive, size }: {
  position: [number, number, number]; color: string; emissive: string; size: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 3) * 0.25);
  });
  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[size, 12, 12]} />
      <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.7} />
    </mesh>
  );
}

/* ─── Public component ─── */

interface BodyModel3DProps {
  sex: "M" | "F";
  selectedRegions: Set<string>;
  onToggleRegion: (region: BodyRegion) => void;
  showAcupoints: boolean;
  relevantMeridians: Set<string>;
}

export default function BodyModel3D({ sex, selectedRegions, onToggleRegion, showAcupoints, relevantMeridians }: BodyModel3DProps) {
  const [hoveredRegion, setHoveredRegion] = useState<BodyRegion | null>(null);
  const [markerPositions, setMarkerPositions] = useState<Map<string, [number, number, number]>>(new Map());

  useEffect(() => {
    setMarkerPositions(prev => {
      const next = new Map(prev);
      let changed = false;
      for (const id of Array.from(next.keys())) {
        if (!selectedRegions.has(id)) { next.delete(id); changed = true; }
      }
      return changed ? next : prev;
    });
  }, [selectedRegions]);

  const handleMarkerPoint = (id: string, pt: [number, number, number], wasSel: boolean) => {
    setMarkerPositions(prev => {
      const next = new Map(prev);
      wasSel ? next.delete(id) : next.set(id, pt);
      return next;
    });
  };

  return (
    <div className="relative w-full" style={{ height: "620px" }}>
      <Canvas camera={{ position: [0, 0.05, 3.6], fov: 44 }} gl={{ antialias: true }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={0.7} castShadow />
        <directionalLight position={[-5, 5, -5]} intensity={0.35} />
        <pointLight position={[0, 3, 3]} intensity={0.3} />
        <hemisphereLight args={["#c8e0ff", "#b08050", 0.25]} />
        <Suspense fallback={null}>
          <HumanBodyModel
            sex={sex}
            selectedRegions={selectedRegions}
            markerPositions={markerPositions}
            onSelectRegion={onToggleRegion}
            onMarkerPoint={handleMarkerPoint}
            onHoverRegion={setHoveredRegion}
            showAcupoints={showAcupoints}
            relevantMeridians={relevantMeridians}
          />
        </Suspense>
        <OrbitControls enablePan={false} enableZoom={false} enableRotate={true}
          minPolarAngle={Math.PI * 0.15} maxPolarAngle={Math.PI * 0.85} />
      </Canvas>

      {hoveredRegion && (
        <div className="absolute top-3 left-3 bg-card/95 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-lg pointer-events-none max-w-xs">
          <p className="font-display text-xs font-bold text-foreground">{hoveredRegion.name}</p>
          <p className="font-body text-[10px] text-muted-foreground mt-0.5">{hoveredRegion.description}</p>
          <p className="font-body text-[10px] text-primary/70 mt-1">Meridiani: {hoveredRegion.meridians.join(", ")}</p>
        </div>
      )}

      <div className="absolute top-3 right-3 bg-card/90 backdrop-blur-sm border border-border rounded-lg px-3 py-1.5">
        <span className="font-body text-xs text-muted-foreground">{sex === "M" ? "♂ Maschile" : "♀ Femminile"}</span>
      </div>

      <div className="absolute bottom-3 left-3 bg-card/90 backdrop-blur-sm border border-border rounded-lg px-3 py-2 space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-destructive/80" />
          <span className="font-body text-[10px] text-muted-foreground">Punto doloroso</span>
        </div>
        {showAcupoints && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="font-body text-[10px] text-muted-foreground">Agopunto consigliato</span>
          </div>
        )}
        <p className="font-body text-[10px] text-muted-foreground/60 mt-1">Ruota con il mouse • Clicca per segnare</p>
      </div>
    </div>
  );
}

useGLTF.preload("/geometries/human_body.glb");
