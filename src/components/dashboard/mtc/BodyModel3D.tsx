import { useState, useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame, ThreeEvent } from "@react-three/fiber";
import { OrbitControls, useGLTF, Text } from "@react-three/drei";
import * as THREE from "three";
import { BODY_REGIONS, ACUPOINTS, type BodyRegion, type AcuPoint } from "./bodyRegions";

/**
 * Coordinate mapping between bodyRegions.ts positions and GLB model local space.
 *
 * bodyRegions.ts:
 *   x = left(-) / right(+)
 *   y = height  (feet ≈ -0.1, head ≈ 1.85)
 *   z = front(+) / back(-)
 *
 * GLB model local space (after rotation=[0, -PI/2, 0]):
 *   x = front(+) / back(-)
 *   y = height  (feet ≈ -0.42, head ≈ 0.38)
 *   z = left(-) / right(+)
 *
 * Conversion: region → modelLocal
 *   modelX = regionZ / 3.3
 *   modelY = (regionY - 0.93) / 2.44
 *   modelZ = regionX / 3.5
 */
function regionToModelLocal(regionPos: [number, number, number]): THREE.Vector3 {
  return new THREE.Vector3(
    regionPos[2] / 3.3,               // front/back
    (regionPos[1] - 0.93) / 2.44,     // height
    regionPos[0] / 3.5                 // left/right
  );
}

function findClosestRegion(localPoint: THREE.Vector3): BodyRegion | null {
  let best: BodyRegion | null = null;
  let bestDist = Infinity;

  for (const region of BODY_REGIONS) {
    const mapped = regionToModelLocal(region.position);
    const dist = localPoint.distanceTo(mapped);
    if (dist < bestDist) {
      bestDist = dist;
      best = region;
    }
  }

  // Only match if reasonably close (threshold in model-local units)
  return bestDist < 0.12 ? best : null;
}

function HumanBodyModel({
  sex,
  selectedRegions,
  onSelectRegion,
  onHoverRegion,
  showAcupoints,
  relevantMeridians,
}: {
  sex: "M" | "F";
  selectedRegions: Set<string>;
  onSelectRegion: (region: BodyRegion) => void;
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

  // Scale adjustments for female body shape
  const bodyScale: [number, number, number] = sex === "F"
    ? [3.8, 4.0, 3.8]   // slightly narrower shoulders
    : [4.0, 4.0, 4.0];

  // Hip scale for female (applied to a wrapper)
  // We apply a non-uniform scale to approximate female proportions

  // Selected region markers (in model-local space)
  const selectedMarkers = useMemo(() => {
    return BODY_REGIONS.filter((r) => selectedRegions.has(r.id)).map((region) => {
      const pos = regionToModelLocal(region.position);
      return { id: region.id, pos: [pos.x, pos.y, pos.z] as [number, number, number] };
    });
  }, [selectedRegions]);

  // Visible acupoints (in model-local space)
  const visibleAcupoints = useMemo(() => {
    if (!showAcupoints) return [];
    return ACUPOINTS.filter((p) => relevantMeridians.has(p.meridian)).map((point) => {
      const pos = regionToModelLocal(point.position);
      return { ...point, mappedPos: [pos.x, pos.y, pos.z] as [number, number, number] };
    });
  }, [showAcupoints, relevantMeridians]);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.point && modelRef.current) {
      const localPoint = modelRef.current.worldToLocal(e.point.clone());
      const region = findClosestRegion(localPoint);
      if (region) onSelectRegion(region);
    }
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (e.point && modelRef.current) {
      const localPoint = modelRef.current.worldToLocal(e.point.clone());
      const region = findClosestRegion(localPoint);
      onHoverRegion(region);
      document.body.style.cursor = region ? "pointer" : "default";
    }
  };

  const handlePointerOut = () => {
    onHoverRegion(null);
    document.body.style.cursor = "default";
  };

  return (
    <group position={[0, 0.1, 0]} scale={bodyScale}>
      <group ref={modelRef} rotation={[0, -Math.PI / 2, 0]}>
        <primitive
          object={clonedScene}
          onClick={handleClick}
          onPointerMove={handlePointerMove}
          onPointerOut={handlePointerOut}
        />

        {/* Red markers on selected regions */}
        {selectedMarkers.map((m) => (
          <PulsingMarker
            key={`sel-${m.id}`}
            position={m.pos}
            color="#ef4444"
            emissive="#dc2626"
            size={0.014}
          />
        ))}

        {/* Acupoint markers */}
        {visibleAcupoints.map((p) => (
          <group key={p.id}>
            <PulsingMarker
              position={p.mappedPos}
              color="#22c55e"
              emissive="#16a34a"
              size={0.008}
            />
            <Text
              position={[p.mappedPos[0], p.mappedPos[1] + 0.015, p.mappedPos[2]]}
              fontSize={0.008}
              color="#16a34a"
              anchorX="center"
              anchorY="bottom"
              outlineWidth={0.001}
              outlineColor="#ffffff"
            >
              {p.id.replace(/R$/, "")}
            </Text>
          </group>
        ))}
      </group>
    </group>
  );
}

function PulsingMarker({
  position,
  color,
  emissive,
  size,
}: {
  position: [number, number, number];
  color: string;
  emissive: string;
  size: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      const s = 1 + Math.sin(clock.elapsedTime * 3) * 0.25;
      ref.current.scale.setScalar(s);
    }
  });
  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[size, 12, 12]} />
      <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.7} />
    </mesh>
  );
}

interface BodyModel3DProps {
  sex: "M" | "F";
  selectedRegions: Set<string>;
  onToggleRegion: (region: BodyRegion) => void;
  showAcupoints: boolean;
  relevantMeridians: Set<string>;
}

export default function BodyModel3D({
  sex,
  selectedRegions,
  onToggleRegion,
  showAcupoints,
  relevantMeridians,
}: BodyModel3DProps) {
  const [hoveredRegion, setHoveredRegion] = useState<BodyRegion | null>(null);

  return (
    <div className="relative w-full" style={{ height: "520px" }}>
      <Canvas
        camera={{ position: [0, 0.3, 1.8], fov: 50 }}
        gl={{ antialias: true }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={0.7} castShadow />
        <directionalLight position={[-5, 5, -5]} intensity={0.35} />
        <pointLight position={[0, 3, 3]} intensity={0.3} />
        <hemisphereLight args={["#c8e0ff", "#b08050", 0.25]} />
        <Suspense fallback={null}>
          <HumanBodyModel
            sex={sex}
            selectedRegions={selectedRegions}
            onSelectRegion={onToggleRegion}
            onHoverRegion={setHoveredRegion}
            showAcupoints={showAcupoints}
            relevantMeridians={relevantMeridians}
          />
        </Suspense>
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={1.0}
          maxDistance={4}
          minPolarAngle={Math.PI * 0.1}
          maxPolarAngle={Math.PI * 0.9}
        />
      </Canvas>

      {/* Hover tooltip */}
      {hoveredRegion && (
        <div className="absolute top-3 left-3 bg-card/95 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-lg pointer-events-none max-w-xs">
          <p className="font-display text-xs font-bold text-foreground">{hoveredRegion.name}</p>
          <p className="font-body text-[10px] text-muted-foreground mt-0.5">{hoveredRegion.description}</p>
          <p className="font-body text-[10px] text-primary/70 mt-1">
            Meridiani: {hoveredRegion.meridians.join(", ")}
          </p>
        </div>
      )}

      {/* Sex indicator */}
      <div className="absolute top-3 right-3 bg-card/90 backdrop-blur-sm border border-border rounded-lg px-3 py-1.5">
        <span className="font-body text-xs text-muted-foreground">
          {sex === "M" ? "♂ Maschile" : "♀ Femminile"}
        </span>
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 bg-card/90 backdrop-blur-sm border border-border rounded-lg px-3 py-2 space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-destructive/80" />
          <span className="font-body text-[10px] text-muted-foreground">Punto doloroso</span>
        </div>
        {showAcupoints && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="font-body text-[10px] text-muted-foreground">Agopunto consigliato</span>
          </div>
        )}
        <p className="font-body text-[10px] text-muted-foreground/60 mt-1">
          Ruota con il mouse • Clicca per segnare
        </p>
      </div>
    </div>
  );
}

// Preload model
useGLTF.preload("/geometries/human_body.glb");
