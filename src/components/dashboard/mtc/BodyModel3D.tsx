import { useState, useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame, ThreeEvent } from "@react-three/fiber";
import { OrbitControls, useGLTF, Text } from "@react-three/drei";
import * as THREE from "three";
import { BODY_REGIONS, ACUPOINTS, type BodyRegion } from "./bodyRegions";

/**
 * Maps a local-space point (in the GLB model's coordinate system after rotation)
 * to a generic body zone ID. These thresholds come from the reference implementation
 * that was built for this exact GLB model.
 *
 * Model local coords (after rotation=[0, -PI/2, 0]):
 *   y = height (feet ≈ -0.44, head ≈ 0.40)
 *   x = front(+) / back(-)
 *   z = left(-) / right(+)
 */
function getZoneFromPoint(p: THREE.Vector3): string {
  const { x, y, z } = p;

  if (y > 0.36) return "head";
  if (y > 0.30) return "neck";

  if (y > 0.22) {
    if (Math.abs(z) > 0.08) return z < 0 ? "leftShoulder" : "rightShoulder";
    if (x < -0.03) return "upperBack";
    return "upperChest";
  }

  if (y > 0.12) {
    if (Math.abs(z) > 0.10) return z < 0 ? "leftArm" : "rightArm";
    if (x < -0.03) return "midBack";
    return "chest";
  }

  if (y > -0.04) {
    if (Math.abs(z) > 0.10) return z < 0 ? "leftForearm" : "rightForearm";
    if (x < -0.03) return "lowerBack";
    if (y > 0.06) return "epigastrium";
    return "abdomen";
  }

  if (y > -0.18) {
    if (x < -0.02) return "sacrum";
    return z < 0 ? "hipLeft" : "hipRight";
  }

  if (y > -0.30) return z < 0 ? "thighLeft" : "thighRight";
  if (y > -0.38) return z < 0 ? "kneeLeft" : "kneeRight";
  if (y > -0.42) return z < 0 ? "lowerLegLeft" : "lowerLegRight";

  return z < 0 ? "footLeft" : "footRight";
}

// Map generic zone IDs to our detailed body region IDs
const ZONE_TO_REGIONS: Record<string, string[]> = {
  head: ["head_top", "forehead", "temple_l", "temple_r", "jaw_l", "jaw_r", "occiput"],
  neck: ["neck_front", "neck_back"],
  leftShoulder: ["shoulder_l"],
  rightShoulder: ["shoulder_r"],
  upperChest: ["chest_upper"],
  chest: ["chest_l", "chest_r", "chest_upper"],
  upperBack: ["upper_back"],
  midBack: ["mid_back", "upper_back"],
  lowerBack: ["lower_back"],
  epigastrium: ["epigastrium", "flank_l", "flank_r"],
  abdomen: ["umbilical", "lower_abdomen", "flank_l", "flank_r"],
  leftArm: ["upper_arm_l"],
  rightArm: ["upper_arm_r"],
  leftForearm: ["forearm_l", "hand_l"],
  rightForearm: ["forearm_r", "hand_r"],
  sacrum: ["sacrum", "lower_back"],
  hipLeft: ["hip_l"],
  hipRight: ["hip_r"],
  thighLeft: ["thigh_l"],
  thighRight: ["thigh_r"],
  kneeLeft: ["knee_l"],
  kneeRight: ["knee_r"],
  lowerLegLeft: ["lower_leg_l", "ankle_l"],
  lowerLegRight: ["lower_leg_r", "ankle_r"],
  footLeft: ["foot_l"],
  footRight: ["foot_r"],
};

// Refine zone selection using click position details
function refineRegionInZone(zone: string, localPoint: THREE.Vector3): BodyRegion {
  const candidateIds = ZONE_TO_REGIONS[zone] || ["chest_upper"];
  const candidates = BODY_REGIONS.filter((r) => candidateIds.includes(r.id));
  if (candidates.length === 1) return candidates[0];

  // For head zone, use position to pick sub-region
  if (zone === "head") {
    const { x, y, z } = localPoint;
    if (y > 0.42) return BODY_REGIONS.find((r) => r.id === "head_top")!;
    if (x < -0.02) return BODY_REGIONS.find((r) => r.id === "occiput")!;
    if (z < -0.04) return BODY_REGIONS.find((r) => r.id === (y > 0.38 ? "temple_l" : "jaw_l"))!;
    if (z > 0.04) return BODY_REGIONS.find((r) => r.id === (y > 0.38 ? "temple_r" : "jaw_r"))!;
    return BODY_REGIONS.find((r) => r.id === "forehead")!;
  }

  if (zone === "neck") {
    return BODY_REGIONS.find((r) => r.id === (localPoint.x < 0 ? "neck_back" : "neck_front"))!;
  }

  if (zone === "chest") {
    if (localPoint.z < -0.03) return BODY_REGIONS.find((r) => r.id === "chest_l")!;
    if (localPoint.z > 0.03) return BODY_REGIONS.find((r) => r.id === "chest_r")!;
    return BODY_REGIONS.find((r) => r.id === "chest_upper")!;
  }

  if (zone === "abdomen") {
    if (Math.abs(localPoint.z) > 0.06) return BODY_REGIONS.find((r) => r.id === (localPoint.z < 0 ? "flank_l" : "flank_r"))!;
    if (localPoint.y > -0.01) return BODY_REGIONS.find((r) => r.id === "umbilical")!;
    return BODY_REGIONS.find((r) => r.id === "lower_abdomen")!;
  }

  if (zone === "epigastrium") {
    if (Math.abs(localPoint.z) > 0.06) return BODY_REGIONS.find((r) => r.id === (localPoint.z < 0 ? "flank_l" : "flank_r"))!;
    return BODY_REGIONS.find((r) => r.id === "epigastrium")!;
  }

  if (zone === "leftForearm" || zone === "rightForearm") {
    const side = zone === "leftForearm" ? "l" : "r";
    return BODY_REGIONS.find((r) => r.id === (localPoint.y < 0.02 ? `hand_${side}` : `forearm_${side}`))!;
  }

  if (zone === "lowerLegLeft" || zone === "lowerLegRight") {
    const side = zone.includes("Left") ? "l" : "r";
    return BODY_REGIONS.find((r) => r.id === (localPoint.y < -0.40 ? `ankle_${side}` : `lower_leg_${side}`))!;
  }

  return candidates[0];
}

/**
 * Convert a body region position to approximate model-local coordinates
 * for placing markers on the 3D model surface.
 *
 * These are calibrated approximate positions — they don't need to be pixel-perfect
 * since markers just need to appear near the correct body part.
 */
function regionPosToModelLocal(regionPos: [number, number, number]): [number, number, number] {
  // regionY [−0.1, 1.85] → modelY [−0.44, 0.40]
  const modelY = regionPos[1] * 0.42 - 0.38;
  // regionX (left/right) → modelZ (left/right), same sign
  const modelZ = regionPos[0] * 0.29;
  // regionZ (front/back) → modelX (front/back), same sign
  const modelX = regionPos[2] * 0.30;

  return [modelX, modelY, modelZ];
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

  // Female proportions: narrower shoulders, slightly wider hips
  const bodyScale: [number, number, number] = sex === "F"
    ? [3.7, 3.9, 3.7]
    : [4.0, 4.0, 4.0];

  const selectedMarkers = useMemo(() => {
    return BODY_REGIONS.filter((r) => selectedRegions.has(r.id)).map((region) => ({
      id: region.id,
      pos: regionPosToModelLocal(region.position),
    }));
  }, [selectedRegions]);

  const visibleAcupoints = useMemo(() => {
    if (!showAcupoints) return [];
    return ACUPOINTS.filter((p) => relevantMeridians.has(p.meridian)).map((point) => ({
      ...point,
      mappedPos: regionPosToModelLocal(point.position),
    }));
  }, [showAcupoints, relevantMeridians]);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.point && modelRef.current) {
      const localPoint = modelRef.current.worldToLocal(e.point.clone());
      const zone = getZoneFromPoint(localPoint);
      const region = refineRegionInZone(zone, localPoint);
      if (region) onSelectRegion(region);
    }
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (e.point && modelRef.current) {
      const localPoint = modelRef.current.worldToLocal(e.point.clone());
      const zone = getZoneFromPoint(localPoint);
      const region = refineRegionInZone(zone, localPoint);
      onHoverRegion(region);
      document.body.style.cursor = "pointer";
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

        {/* Red pulsing markers on selected regions */}
        {selectedMarkers.map((m) => (
          <PulsingMarker
            key={`sel-${m.id}`}
            position={m.pos}
            color="#ef4444"
            emissive="#dc2626"
            size={0.015}
          />
        ))}

        {/* Green acupoint markers */}
        {visibleAcupoints.map((p) => (
          <group key={p.id}>
            <PulsingMarker
              position={p.mappedPos}
              color="#22c55e"
              emissive="#16a34a"
              size={0.008}
            />
            <Text
              position={[p.mappedPos[0], p.mappedPos[1] + 0.016, p.mappedPos[2]]}
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
          enableZoom={false}
          enableRotate={true}
          minPolarAngle={Math.PI * 0.15}
          maxPolarAngle={Math.PI * 0.85}
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

useGLTF.preload("/geometries/human_body.glb");
