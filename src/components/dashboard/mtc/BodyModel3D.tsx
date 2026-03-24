import { useState, useRef, useMemo, useEffect, Suspense } from "react";
import { Canvas, useFrame, ThreeEvent } from "@react-three/fiber";
import { OrbitControls, useGLTF, Text } from "@react-three/drei";
import * as THREE from "three";
import { BODY_REGIONS, ACUPOINTS, type BodyRegion } from "./bodyRegions";

const BACK_REGION_IDS = new Set([
  "occiput",
  "neck_back",
  "scapula_l",
  "scapula_r",
  "upper_back",
  "mid_back",
  "lower_back",
  "sacrum",
  "gluteal_l",
  "gluteal_r",
  "thigh_back_l",
  "thigh_back_r",
  "knee_back_l",
  "knee_back_r",
  "calf_l",
  "calf_r",
  "heel_l",
  "heel_r",
]);

type RegionSide = "left" | "right" | "center";

interface RegionAnchor {
  region: BodyRegion;
  center: [number, number, number];
  verticalBand: number;
  side: RegionSide;
  isBack: boolean;
}

interface Bounds3D {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  zMin: number;
  zMax: number;
}

const ANATOMY_SPACE_BOUNDS = (() => {
  const points: [number, number, number][] = [
    ...BODY_REGIONS.map((r) => r.position),
    ...ACUPOINTS.map((p) => p.position),
  ];

  return points.reduce<Bounds3D>(
    (acc, [x, y, z]) => ({
      xMin: Math.min(acc.xMin, x),
      xMax: Math.max(acc.xMax, x),
      yMin: Math.min(acc.yMin, y),
      yMax: Math.max(acc.yMax, y),
      zMin: Math.min(acc.zMin, z),
      zMax: Math.max(acc.zMax, z),
    }),
    {
      xMin: Number.POSITIVE_INFINITY,
      xMax: Number.NEGATIVE_INFINITY,
      yMin: Number.POSITIVE_INFINITY,
      yMax: Number.NEGATIVE_INFINITY,
      zMin: Number.POSITIVE_INFINITY,
      zMax: Number.NEGATIVE_INFINITY,
    }
  );
})();

function mapLinear(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  if (Math.abs(inMax - inMin) < 1e-6) return (outMin + outMax) / 2;
  const t = (value - inMin) / (inMax - inMin);
  return outMin + t * (outMax - outMin);
}

/**
 * Region coords: x=left/right, y=height, z=front/back
 * Model local (after rotation [0,-PI/2,0]):
 *   y ∈ [≈-0.44, ≈0.42], x=front(+)/back(-), z=left(-)/right(+)
 */
function regionPosToModelLocal(
  regionPos: [number, number, number],
  modelBounds: Bounds3D
): [number, number, number] {
  const modelY = mapLinear(
    regionPos[1],
    ANATOMY_SPACE_BOUNDS.yMin,
    ANATOMY_SPACE_BOUNDS.yMax,
    modelBounds.yMin,
    modelBounds.yMax
  );

  const modelZ = mapLinear(
    regionPos[0],
    ANATOMY_SPACE_BOUNDS.xMin,
    ANATOMY_SPACE_BOUNDS.xMax,
    modelBounds.zMin,
    modelBounds.zMax
  );

  const modelX = mapLinear(
    regionPos[2],
    ANATOMY_SPACE_BOUNDS.zMin,
    ANATOMY_SPACE_BOUNDS.zMax,
    modelBounds.xMin,
    modelBounds.xMax
  );

  return [modelX, modelY, modelZ];
}

function getRegionSide(regionId: string): RegionSide {
  if (regionId.endsWith("_l")) return "left";
  if (regionId.endsWith("_r")) return "right";
  return "center";
}

function getVerticalBand(y: number, bounds: Bounds3D): number {
  const t = (y - bounds.yMin) / Math.max(bounds.yMax - bounds.yMin, 1e-6);
  if (t > 0.89) return 0; // head
  if (t > 0.79) return 1; // neck
  if (t > 0.57) return 2; // torso/arms
  if (t > 0.43) return 3; // pelvis
  if (t > 0.30) return 4; // thighs
  if (t > 0.22) return 5; // knees
  if (t > 0.10) return 6; // lower legs
  return 7; // feet/ankles
}

function getRegionAnchors(modelBounds: Bounds3D): RegionAnchor[] {
  return BODY_REGIONS.map((region) => ({
    region,
    center: regionPosToModelLocal(region.position, modelBounds),
    verticalBand: getVerticalBand(
      regionPosToModelLocal(region.position, modelBounds)[1],
      modelBounds
    ),
    side: getRegionSide(region.id),
    isBack: BACK_REGION_IDS.has(region.id) || region.position[2] < -0.02,
  }));
}

function findClosestRegion(
  localPoint: THREE.Vector3,
  anchors: RegionAnchor[],
  modelBounds: Bounds3D
): BodyRegion {
  let bestRegion = anchors[0]?.region ?? BODY_REGIONS[0];
  let bestScore = Number.POSITIVE_INFINITY;

  const pointIsBack = localPoint.x < -0.01;
  const pointBand = getVerticalBand(localPoint.y, modelBounds);

  for (const anchor of anchors) {
    const [cx, cy, cz] = anchor.center;

    // Pure Euclidean distance with Y weighted more (body is tall & narrow)
    const dx = localPoint.x - cx;
    const dy = (localPoint.y - cy) * 2.0;
    const dz = localPoint.z - cz;

    let score = dx * dx + dy * dy + dz * dz;

    // Penalize wrong left/right side
    if (anchor.side === "left" && localPoint.z > 0.01) score += 0.06;
    if (anchor.side === "right" && localPoint.z < -0.01) score += 0.06;

    // Penalize front/back mismatch
    if (anchor.isBack !== pointIsBack) score += 0.04;

    // Stronger anatomical vertical gating (prevents knee->thigh swaps)
    if (Math.abs(anchor.verticalBand - pointBand) >= 2) score += 0.12;
    else if (Math.abs(anchor.verticalBand - pointBand) === 1) score += 0.03;

    if (score < bestScore) {
      bestScore = score;
      bestRegion = anchor.region;
    }
  }

  return bestRegion;
}

function HumanBodyModel({
  sex,
  selectedRegions,
  selectedMarkerPositions,
  onSelectRegion,
  onSelectMarkerPoint,
  onHoverRegion,
  showAcupoints,
  relevantMeridians,
}: {
  sex: "M" | "F";
  selectedRegions: Set<string>;
  selectedMarkerPositions: Map<string, [number, number, number]>;
  onSelectRegion: (region: BodyRegion) => void;
  onSelectMarkerPoint: (
    regionId: string,
    point: [number, number, number],
    wasSelected: boolean
  ) => void;
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

  const modelBounds = useMemo(() => {
    const box = new THREE.Box3().setFromObject(clonedScene);
    const size = new THREE.Vector3();
    box.getSize(size);
    const padX = size.x * 0.02;
    const padY = size.y * 0.01;
    const padZ = size.z * 0.02;

    return {
      xMin: box.min.x - padX,
      xMax: box.max.x + padX,
      yMin: box.min.y - padY,
      yMax: box.max.y + padY,
      zMin: box.min.z - padZ,
      zMax: box.max.z + padZ,
    } as Bounds3D;
  }, [clonedScene]);

  const regionAnchors = useMemo(() => getRegionAnchors(modelBounds), [modelBounds]);

  // Female proportions: narrower shoulders, slightly wider hips
  const bodyScale: [number, number, number] = sex === "F"
    ? [3.7, 3.9, 3.7]
    : [4.0, 4.0, 4.0];

  const selectedMarkers = useMemo(() => {
    return BODY_REGIONS.filter((r) => selectedRegions.has(r.id)).map((region) => ({
      id: region.id,
      pos: selectedMarkerPositions.get(region.id) ?? regionPosToModelLocal(region.position, modelBounds),
    }));
  }, [selectedRegions, selectedMarkerPositions, modelBounds]);

  const visibleAcupoints = useMemo(() => {
    if (!showAcupoints) return [];
    return ACUPOINTS.filter((p) => relevantMeridians.has(p.meridian)).map((point) => ({
      ...point,
      mappedPos: regionPosToModelLocal(point.position, modelBounds),
    }));
  }, [showAcupoints, relevantMeridians, modelBounds]);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.point && modelRef.current) {
      const localPoint = modelRef.current.worldToLocal(e.point.clone());
      const region = findClosestRegion(localPoint, regionAnchors, modelBounds);
      const wasSelected = selectedRegions.has(region.id);
      onSelectMarkerPoint(region.id, [localPoint.x, localPoint.y, localPoint.z], wasSelected);
      onSelectRegion(region);
    }
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (e.point && modelRef.current) {
      const localPoint = modelRef.current.worldToLocal(e.point.clone());
      const region = findClosestRegion(localPoint, regionAnchors, modelBounds);
      onHoverRegion(region);
      document.body.style.cursor = "pointer";
    }
  };

  const handlePointerOut = () => {
    onHoverRegion(null);
    document.body.style.cursor = "default";
  };

  return (
    <group position={[0, -0.14, 0]} scale={bodyScale}>
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
  const [selectedMarkerPositions, setSelectedMarkerPositions] = useState<Map<string, [number, number, number]>>(new Map());

  useEffect(() => {
    setSelectedMarkerPositions((prev) => {
      const next = new Map(prev);
      let changed = false;
      for (const regionId of Array.from(next.keys())) {
        if (!selectedRegions.has(regionId)) {
          next.delete(regionId);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [selectedRegions]);

  const handleSelectMarkerPoint = (
    regionId: string,
    point: [number, number, number],
    wasSelected: boolean
  ) => {
    setSelectedMarkerPositions((prev) => {
      const next = new Map(prev);
      if (wasSelected) {
        next.delete(regionId);
      } else {
        next.set(regionId, point);
      }
      return next;
    });
  };

  return (
    <div className="relative w-full" style={{ height: "640px" }}>
      <Canvas
        camera={{ position: [0, 0, 3.8], fov: 46 }}
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
            selectedMarkerPositions={selectedMarkerPositions}
            onSelectRegion={onToggleRegion}
            onSelectMarkerPoint={handleSelectMarkerPoint}
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
