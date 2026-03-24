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

  // Head
  if (y > 0.36) return "head";
  // Neck
  if (y > 0.30) {
    if (Math.abs(z) > 0.05) return z < 0 ? "neckLateralL" : "neckLateralR";
    return "neck";
  }
  // Upper torso / shoulders
  if (y > 0.22) {
    if (Math.abs(z) > 0.08) return z < 0 ? "leftShoulder" : "rightShoulder";
    if (x < -0.03) return "scapulaBack";
    return "upperChest";
  }
  // Mid torso / arms
  if (y > 0.12) {
    if (Math.abs(z) > 0.10) {
      // Distinguish elbow from upper arm
      if (y < 0.16) return z < 0 ? "leftElbow" : "rightElbow";
      return z < 0 ? "leftArm" : "rightArm";
    }
    if (x < -0.03) return "midBack";
    if (Math.abs(z) > 0.06) return z < 0 ? "ribsLateralL" : "ribsLateralR";
    return "chest";
  }
  // Lower torso / forearms
  if (y > -0.04) {
    if (Math.abs(z) > 0.10) {
      if (y < 0.02) return z < 0 ? "leftHand" : "rightHand";
      if (y < 0.06) return z < 0 ? "leftWrist" : "rightWrist";
      return z < 0 ? "leftForearm" : "rightForearm";
    }
    if (x < -0.03) return "lowerBack";
    if (y > 0.06) {
      if (Math.abs(z) > 0.06) return z < 0 ? "flankL" : "flankR";
      return "epigastrium";
    }
    if (y < -0.01) {
      if (Math.abs(z) > 0.04) return z < 0 ? "inguinalL" : "inguinalR";
      return "lowerAbdomen";
    }
    return "abdomen";
  }
  // Pelvis / hips
  if (y > -0.18) {
    if (x < -0.02) {
      if (Math.abs(z) > 0.04) return z < 0 ? "glutealL" : "glutealR";
      return "sacrum";
    }
    return z < 0 ? "hipLeft" : "hipRight";
  }
  // Thighs
  if (y > -0.30) {
    if (x < -0.02) return z < 0 ? "thighBackL" : "thighBackR";
    if (Math.abs(z) > 0.05) return z < 0 ? "thighLateralL" : "thighLateralR";
    return z < 0 ? "thighFrontL" : "thighFrontR";
  }
  // Knees
  if (y > -0.36) {
    if (x < -0.01) return z < 0 ? "kneeBackL" : "kneeBackR";
    return z < 0 ? "kneeLeft" : "kneeRight";
  }
  // Lower legs
  if (y > -0.42) {
    if (x < -0.01) return z < 0 ? "calfL" : "calfR";
    return z < 0 ? "lowerLegLeft" : "lowerLegRight";
  }
  // Ankles & feet
  if (y > -0.44) return z < 0 ? "ankleL" : "ankleR";
  if (x < -0.01) return z < 0 ? "heelL" : "heelR";
  return z < 0 ? "footLeft" : "footRight";
}

// Direct zone → region ID mapping
const ZONE_TO_REGION: Record<string, string> = {
  // Head sub-zones handled separately in refineRegionInZone
  head: "forehead",
  neck: "neck_front",
  neckLateralL: "neck_lateral_l",
  neckLateralR: "neck_lateral_r",
  leftShoulder: "shoulder_l",
  rightShoulder: "shoulder_r",
  scapulaBack: "upper_back",
  upperChest: "chest_upper",
  leftArm: "upper_arm_l",
  rightArm: "upper_arm_r",
  leftElbow: "elbow_l",
  rightElbow: "elbow_r",
  chest: "chest_upper",
  ribsLateralL: "ribs_lateral_l",
  ribsLateralR: "ribs_lateral_r",
  midBack: "mid_back",
  leftForearm: "forearm_l",
  rightForearm: "forearm_r",
  leftWrist: "wrist_l",
  rightWrist: "wrist_r",
  leftHand: "hand_l",
  rightHand: "hand_r",
  lowerBack: "lower_back",
  epigastrium: "epigastrium",
  flankL: "flank_l",
  flankR: "flank_r",
  abdomen: "umbilical",
  lowerAbdomen: "lower_abdomen",
  inguinalL: "inguinal_l",
  inguinalR: "inguinal_r",
  sacrum: "sacrum",
  glutealL: "gluteal_l",
  glutealR: "gluteal_r",
  hipLeft: "hip_l",
  hipRight: "hip_r",
  thighFrontL: "thigh_front_l",
  thighFrontR: "thigh_front_r",
  thighLateralL: "thigh_lateral_l",
  thighLateralR: "thigh_lateral_r",
  thighBackL: "thigh_back_l",
  thighBackR: "thigh_back_r",
  kneeLeft: "knee_l",
  kneeRight: "knee_r",
  kneeBackL: "knee_back_l",
  kneeBackR: "knee_back_r",
  lowerLegLeft: "lower_leg_l",
  lowerLegRight: "lower_leg_r",
  calfL: "calf_l",
  calfR: "calf_r",
  ankleL: "ankle_l",
  ankleR: "ankle_r",
  heelL: "heel_l",
  heelR: "heel_r",
  footLeft: "foot_l",
  footRight: "foot_r",
};

function refineRegionInZone(zone: string, localPoint: THREE.Vector3): BodyRegion {
  // Head has sub-zone refinement
  if (zone === "head") {
    const { x, y, z } = localPoint;
    if (y > 0.42) return BODY_REGIONS.find((r) => r.id === "head_top")!;
    if (x < -0.02) return BODY_REGIONS.find((r) => r.id === "occiput")!;
    if (Math.abs(z) > 0.04) {
      const side = z < 0 ? "l" : "r";
      if (y > 0.38) return BODY_REGIONS.find((r) => r.id === `temple_${side}`)!;
      // Check for ear vs jaw
      if (Math.abs(z) > 0.06) return BODY_REGIONS.find((r) => r.id === `ear_${side}`)!;
      if (y < 0.37) return BODY_REGIONS.find((r) => r.id === `jaw_${side}`)!;
      return BODY_REGIONS.find((r) => r.id === `temple_${side}`)!;
    }
    if (y < 0.38 && x > 0) {
      // Lower central face
      if (y < 0.37) return BODY_REGIONS.find((r) => r.id === "nose")!;
      // Eyes
      if (z < -0.01) return BODY_REGIONS.find((r) => r.id === "eye_l")!;
      if (z > 0.01) return BODY_REGIONS.find((r) => r.id === "eye_r")!;
    }
    return BODY_REGIONS.find((r) => r.id === "forehead")!;
  }

  // Neck front/back refinement
  if (zone === "neck") {
    return BODY_REGIONS.find((r) => r.id === (localPoint.x < 0 ? "neck_back" : "neck_front"))!;
  }

  // Chest left/right
  if (zone === "chest") {
    if (localPoint.z < -0.03) return BODY_REGIONS.find((r) => r.id === "chest_l")!;
    if (localPoint.z > 0.03) return BODY_REGIONS.find((r) => r.id === "chest_r")!;
    return BODY_REGIONS.find((r) => r.id === "chest_upper")!;
  }

  // Scapula back zone - distinguish left/right scapula from upper back center
  if (zone === "scapulaBack") {
    if (localPoint.z < -0.04) return BODY_REGIONS.find((r) => r.id === "scapula_l")!;
    if (localPoint.z > 0.04) return BODY_REGIONS.find((r) => r.id === "scapula_r")!;
    return BODY_REGIONS.find((r) => r.id === "upper_back")!;
  }

  // Direct mapping for all other zones
  const regionId = ZONE_TO_REGION[zone];
  const region = regionId ? BODY_REGIONS.find((r) => r.id === regionId) : null;
  return region || BODY_REGIONS.find((r) => r.id === "chest_upper")!;
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
        camera={{ position: [0, 0.3, 2.2], fov: 45 }}
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
