import { useState, useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import { BODY_REGIONS, ACUPOINTS, type BodyRegion, type AcuPoint } from "./bodyRegions";

// Generate a human body silhouette using LatheGeometry from a spline curve
function useBodyGeometry(isFemale: boolean) {
  return useMemo(() => {
    // Profile points [radius, height] - from feet (0) to head top (~1.8)
    const profilePoints: [number, number][] = isFemale
      ? [
          // Feet
          [0.04, 0], [0.05, 0.02], [0.04, 0.06],
          // Ankles
          [0.035, 0.10],
          // Calves
          [0.055, 0.20], [0.06, 0.30], [0.055, 0.40],
          // Knees
          [0.05, 0.48], [0.055, 0.50],
          // Thighs
          [0.07, 0.60], [0.09, 0.70], [0.10, 0.78],
          // Hips (wider for female)
          [0.14, 0.82], [0.155, 0.85],
          // Waist (narrower for female)
          [0.11, 0.95], [0.105, 1.00],
          // Ribcage
          [0.12, 1.08], [0.125, 1.15],
          // Chest
          [0.13, 1.22], [0.125, 1.28],
          // Shoulders
          [0.14, 1.32], [0.16, 1.35],
          // Neck
          [0.05, 1.42], [0.045, 1.48],
          // Head
          [0.08, 1.52], [0.09, 1.58], [0.085, 1.65],
          [0.07, 1.72], [0.04, 1.76], [0.01, 1.78],
        ]
      : [
          // Feet
          [0.05, 0], [0.055, 0.02], [0.045, 0.06],
          // Ankles
          [0.04, 0.10],
          // Calves
          [0.06, 0.20], [0.065, 0.30], [0.06, 0.40],
          // Knees
          [0.055, 0.48], [0.06, 0.50],
          // Thighs
          [0.075, 0.60], [0.09, 0.70], [0.095, 0.78],
          // Hips
          [0.12, 0.82], [0.125, 0.85],
          // Waist
          [0.12, 0.95], [0.125, 1.00],
          // Ribcage
          [0.14, 1.08], [0.15, 1.15],
          // Chest
          [0.155, 1.22], [0.15, 1.28],
          // Shoulders (broader for male)
          [0.17, 1.32], [0.19, 1.36],
          // Neck
          [0.06, 1.42], [0.055, 1.48],
          // Head
          [0.085, 1.52], [0.095, 1.58], [0.09, 1.65],
          [0.075, 1.72], [0.045, 1.76], [0.01, 1.78],
        ];

    const points = profilePoints.map(([r, y]) => new THREE.Vector2(r, y));
    const curve = new THREE.SplineCurve(points);
    const smoothPoints = curve.getPoints(60);
    return new THREE.LatheGeometry(smoothPoints, 32);
  }, [isFemale]);
}

// Arm geometry using TubeGeometry along a curve
function useArmGeometry(isLeft: boolean) {
  return useMemo(() => {
    const sign = isLeft ? -1 : 1;
    const armPath = new THREE.CatmullRomCurve3([
      new THREE.Vector3(sign * 0.16, 1.34, 0),
      new THREE.Vector3(sign * 0.22, 1.28, 0),
      new THREE.Vector3(sign * 0.28, 1.15, 0.02),
      new THREE.Vector3(sign * 0.30, 1.02, 0.03),
      new THREE.Vector3(sign * 0.29, 0.90, 0.02),
      new THREE.Vector3(sign * 0.28, 0.80, 0),
    ]);
    return new THREE.TubeGeometry(armPath, 20, 0.028, 12, false);
  }, [isLeft]);
}

// Forearm + hand
function useForearmGeometry(isLeft: boolean) {
  return useMemo(() => {
    const sign = isLeft ? -1 : 1;
    const path = new THREE.CatmullRomCurve3([
      new THREE.Vector3(sign * 0.28, 0.80, 0),
      new THREE.Vector3(sign * 0.27, 0.70, -0.01),
      new THREE.Vector3(sign * 0.25, 0.58, -0.02),
      new THREE.Vector3(sign * 0.24, 0.50, -0.01),
    ]);
    return new THREE.TubeGeometry(path, 16, 0.022, 10, false);
  }, [isLeft]);
}

function HumanBody({ isFemale }: { isFemale: boolean }) {
  const bodyGeo = useBodyGeometry(isFemale);
  const leftArmGeo = useArmGeometry(true);
  const rightArmGeo = useArmGeometry(false);
  const leftForearmGeo = useForearmGeometry(true);
  const rightForearmGeo = useForearmGeometry(false);

  const skinMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#e8c4a0",
        roughness: 0.7,
        metalness: 0.02,
      }),
    []
  );

  return (
    <group>
      <mesh geometry={bodyGeo} material={skinMaterial} />
      <mesh geometry={leftArmGeo} material={skinMaterial} />
      <mesh geometry={rightArmGeo} material={skinMaterial} />
      <mesh geometry={leftForearmGeo} material={skinMaterial} />
      <mesh geometry={rightForearmGeo} material={skinMaterial} />
    </group>
  );
}

interface BodyRegionMeshProps {
  region: BodyRegion;
  isSelected: boolean;
  onSelect: (region: BodyRegion) => void;
  isHovered: boolean;
  onHover: (id: string | null) => void;
}

function BodyRegionMesh({ region, isSelected, onSelect, isHovered, onHover }: BodyRegionMeshProps) {
  const color = isSelected ? "#ef4444" : isHovered ? "#f59e0b" : "#e8d4b8";
  const opacity = isSelected ? 0.7 : isHovered ? 0.5 : 0.0;

  let geometry;
  if (region.geometry === "sphere") {
    geometry = <sphereGeometry args={[1, 16, 16]} />;
  } else if (region.geometry === "capsule") {
    geometry = <capsuleGeometry args={[0.8, 1.2, 8, 16]} />;
  } else {
    geometry = <boxGeometry args={[2, 2, 2]} />;
  }

  return (
    <mesh
      position={region.position}
      scale={region.scale}
      onClick={(e) => { e.stopPropagation(); onSelect(region); }}
      onPointerOver={(e) => { e.stopPropagation(); onHover(region.id); document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { onHover(null); document.body.style.cursor = "default"; }}
    >
      {geometry}
      <meshStandardMaterial
        color={color}
        transparent
        opacity={opacity}
        depthWrite={false}
      />
    </mesh>
  );
}

// Selected region marker (visible red dot)
function SelectedMarker({ region }: { region: BodyRegion }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      const s = 1 + Math.sin(clock.elapsedTime * 3) * 0.15;
      ref.current.scale.setScalar(s);
    }
  });
  return (
    <mesh ref={ref} position={region.position}>
      <sphereGeometry args={[0.018, 12, 12]} />
      <meshStandardMaterial color="#ef4444" emissive="#dc2626" emissiveIntensity={0.6} />
    </mesh>
  );
}

interface AcuPointMarkerProps {
  point: AcuPoint;
}

function AcuPointMarker({ point }: AcuPointMarkerProps) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.scale.setScalar(0.012 + Math.sin(clock.elapsedTime * 3) * 0.003);
    }
  });

  return (
    <group position={point.position}>
      <mesh ref={ref}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshStandardMaterial color="#22c55e" emissive="#16a34a" emissiveIntensity={0.5} />
      </mesh>
      <Text
        position={[0, 0.025, 0]}
        fontSize={0.025}
        color="#16a34a"
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.002}
        outlineColor="#ffffff"
      >
        {point.id.replace(/R$/, "")}
      </Text>
    </group>
  );
}

function Mannequin({
  sex,
  selectedRegions,
  onSelectRegion,
  hoveredRegion,
  onHoverRegion,
  showAcupoints,
  relevantMeridians,
}: {
  sex: "M" | "F";
  selectedRegions: Set<string>;
  onSelectRegion: (region: BodyRegion) => void;
  hoveredRegion: string | null;
  onHoverRegion: (id: string | null) => void;
  showAcupoints: boolean;
  relevantMeridians: Set<string>;
}) {
  const visibleAcupoints = showAcupoints
    ? ACUPOINTS.filter((p) => relevantMeridians.has(p.meridian))
    : [];

  return (
    <group position={[0, -0.9, 0]}>
      <HumanBody isFemale={sex === "F"} />

      {/* Clickable overlay regions (invisible until hovered/selected) */}
      {BODY_REGIONS.map((region) => (
        <BodyRegionMesh
          key={region.id}
          region={region}
          isSelected={selectedRegions.has(region.id)}
          onSelect={onSelectRegion}
          isHovered={hoveredRegion === region.id}
          onHover={onHoverRegion}
        />
      ))}

      {/* Red markers on selected regions */}
      {BODY_REGIONS.filter((r) => selectedRegions.has(r.id)).map((region) => (
        <SelectedMarker key={`marker-${region.id}`} region={region} />
      ))}

      {/* Acupuncture points */}
      {visibleAcupoints.map((point) => (
        <AcuPointMarker key={point.id} point={point} />
      ))}
    </group>
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
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const hoveredData = hoveredRegion ? BODY_REGIONS.find((r) => r.id === hoveredRegion) : null;

  return (
    <div className="relative w-full" style={{ height: "500px" }}>
      <Canvas camera={{ position: [0, 0.5, 2.2], fov: 45 }} shadows>
        <ambientLight intensity={0.5} />
        <directionalLight position={[3, 4, 3]} intensity={0.7} />
        <directionalLight position={[-2, 2, -2]} intensity={0.3} />
        <hemisphereLight args={["#b1e1ff", "#b97a20", 0.3]} />
        <Suspense fallback={null}>
          <Mannequin
            sex={sex}
            selectedRegions={selectedRegions}
            onSelectRegion={onToggleRegion}
            hoveredRegion={hoveredRegion}
            onHoverRegion={setHoveredRegion}
            showAcupoints={showAcupoints}
            relevantMeridians={relevantMeridians}
          />
        </Suspense>
        <OrbitControls
          enablePan={false}
          minDistance={1.2}
          maxDistance={4}
          minPolarAngle={Math.PI * 0.1}
          maxPolarAngle={Math.PI * 0.9}
        />
      </Canvas>

      {/* Hover tooltip */}
      {hoveredData && (
        <div className="absolute top-3 left-3 bg-card/95 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-lg pointer-events-none max-w-xs">
          <p className="font-display text-xs font-bold text-foreground">{hoveredData.name}</p>
          <p className="font-body text-[10px] text-muted-foreground mt-0.5">{hoveredData.description}</p>
          <p className="font-body text-[10px] text-primary/70 mt-1">
            Meridiani: {hoveredData.meridians.join(", ")}
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
