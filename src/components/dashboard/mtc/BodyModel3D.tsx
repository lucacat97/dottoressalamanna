import { useState, useRef, useMemo, useEffect, Suspense } from "react";
import { Canvas, useFrame, ThreeEvent } from "@react-three/fiber";
import { OrbitControls, useGLTF, Text } from "@react-three/drei";
import * as THREE from "three";
import { BODY_REGIONS, ACUPOINTS, type BodyRegion, type AcuPoint } from "./bodyRegions";

// Map a click point (in model-local space) to the nearest BodyRegion
function findClosestRegion(localPoint: THREE.Vector3, modelScale: number): BodyRegion | null {
  let best: BodyRegion | null = null;
  let bestDist = Infinity;

  for (const region of BODY_REGIONS) {
    // Convert region position to model-local coordinates
    // The model is scaled by modelScale and positioned at groupPosition
    const rp = new THREE.Vector3(...region.position);
    // Region positions are in the old coordinate system centered around y~0.9
    // The GLB model space: y from ~-0.1 (feet) to ~0.45 (head), z is front/back, x is left/right
    // Transform: modelLocalY ≈ (regionY - 0.9) * 0.28, modelLocalX ≈ regionX * 0.35, modelLocalZ ≈ -regionZ * 0.35
    const mappedX = rp.x * 0.35;
    const mappedY = (rp.y - 0.9) * 0.28;
    const mappedZ = -rp.z * 0.35;

    const dist = localPoint.distanceTo(new THREE.Vector3(mappedX, mappedY, mappedZ));
    if (dist < bestDist) {
      bestDist = dist;
      best = region;
    }
  }

  // Only match if reasonably close
  return bestDist < 0.15 ? best : null;
}

function HumanBodyModel({
  selectedRegions,
  onSelectRegion,
  onHoverRegion,
  showAcupoints,
  relevantMeridians,
}: {
  selectedRegions: Set<string>;
  onSelectRegion: (region: BodyRegion) => void;
  onHoverRegion: (region: BodyRegion | null) => void;
  showAcupoints: boolean;
  relevantMeridians: Set<string>;
}) {
  const groupRef = useRef<THREE.Group>(null);
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

  // Highlight selected regions with markers
  const selectedMarkers = useMemo(() => {
    return BODY_REGIONS.filter((r) => selectedRegions.has(r.id)).map((region) => {
      // Map region position to model space
      const x = region.position[0] * 0.35;
      const y = (region.position[1] - 0.9) * 0.28;
      const z = -region.position[2] * 0.35;
      return { ...region, mappedPos: [x, y, z] as [number, number, number] };
    });
  }, [selectedRegions]);

  // Visible acupoints
  const visibleAcupoints = useMemo(() => {
    if (!showAcupoints) return [];
    return ACUPOINTS.filter((p) => relevantMeridians.has(p.meridian)).map((point) => {
      const x = point.position[0] * 0.35;
      const y = (point.position[1] - 0.9) * 0.28;
      const z = -point.position[2] * 0.35;
      return { ...point, mappedPos: [x, y, z] as [number, number, number] };
    });
  }, [showAcupoints, relevantMeridians]);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.point && modelRef.current) {
      const localPoint = modelRef.current.worldToLocal(e.point.clone());
      const region = findClosestRegion(localPoint, 4);
      if (region) onSelectRegion(region);
    }
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (e.point && modelRef.current) {
      const localPoint = modelRef.current.worldToLocal(e.point.clone());
      const region = findClosestRegion(localPoint, 4);
      onHoverRegion(region);
      document.body.style.cursor = region ? "pointer" : "default";
    }
  };

  const handlePointerOut = () => {
    onHoverRegion(null);
    document.body.style.cursor = "default";
  };

  return (
    <group ref={groupRef} position={[0, 0.1, 0]} scale={[4.0, 4.0, 4.0]}>
      <group ref={modelRef} rotation={[0, -Math.PI / 2, 0]}>
        <primitive
          object={clonedScene}
          onClick={handleClick}
          onPointerMove={handlePointerMove}
          onPointerOut={handlePointerOut}
        />

        {/* Selected region markers */}
        {selectedMarkers.map((m) => (
          <PulsingMarker key={`sel-${m.id}`} position={m.mappedPos} color="#ef4444" emissive="#dc2626" size={0.012} />
        ))}

        {/* Acupoint markers */}
        {visibleAcupoints.map((p) => (
          <group key={p.id}>
            <PulsingMarker position={p.mappedPos} color="#22c55e" emissive="#16a34a" size={0.008} />
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
      const s = 1 + Math.sin(clock.elapsedTime * 3) * 0.2;
      ref.current.scale.setScalar(s);
    }
  });
  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[size, 12, 12]} />
      <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.6} />
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

export default function BodyModel3D({ sex, selectedRegions, onToggleRegion, showAcupoints, relevantMeridians }: BodyModel3DProps) {
  const [hoveredRegion, setHoveredRegion] = useState<BodyRegion | null>(null);

  return (
    <div className="relative w-full" style={{ height: "520px" }}>
      <Canvas
        camera={{ position: [0, 0.3, 1.8], fov: 50 }}
        shadows
        gl={{ antialias: true }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={0.7} castShadow />
        <directionalLight position={[-5, 5, -5]} intensity={0.35} />
        <pointLight position={[0, 3, 3]} intensity={0.3} />
        <hemisphereLight args={["#c8e0ff", "#b08050", 0.25]} />
        <Suspense fallback={null}>
          <HumanBodyModel
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
        <p className="font-body text-[10px] text-muted-foreground/60 mt-1">Ruota con il mouse • Clicca per segnare</p>
      </div>
    </div>
  );
}

// Preload the model
useGLTF.preload("/geometries/human_body.glb");
