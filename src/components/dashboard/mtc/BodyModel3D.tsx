import { useState, useRef, useCallback, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import { BODY_REGIONS, ACUPOINTS, type BodyRegion, type AcuPoint } from "./bodyRegions";

interface BodyRegionMeshProps {
  region: BodyRegion;
  isSelected: boolean;
  onSelect: (region: BodyRegion) => void;
  isHovered: boolean;
  onHover: (id: string | null) => void;
}

function BodyRegionMesh({ region, isSelected, onSelect, isHovered, onHover }: BodyRegionMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const color = isSelected ? "#ef4444" : isHovered ? "#f59e0b" : "#e8d4b8";
  const opacity = isSelected ? 0.85 : isHovered ? 0.7 : 0.45;

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
      ref={meshRef}
      position={region.position}
      scale={region.scale}
      onClick={(e) => { e.stopPropagation(); onSelect(region); }}
      onPointerOver={(e) => { e.stopPropagation(); onHover(region.id); document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { onHover(null); document.body.style.cursor = "default"; }}
    >
      {geometry}
      <meshStandardMaterial color={color} transparent opacity={opacity} roughness={0.6} />
    </mesh>
  );
}

interface AcuPointMarkerProps {
  point: AcuPoint;
  visible: boolean;
}

function AcuPointMarker({ point, visible }: AcuPointMarkerProps) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (ref.current && visible) {
      ref.current.scale.setScalar(0.012 + Math.sin(clock.elapsedTime * 3) * 0.003);
    }
  });

  if (!visible) return null;

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
        font="/fonts/inter.woff"
        outlineWidth={0.002}
        outlineColor="#ffffff"
      >
        {point.id.replace(/R$/, "")}
      </Text>
    </group>
  );
}

function Mannequin({ selectedRegions, onSelectRegion, hoveredRegion, onHoverRegion, showAcupoints, relevantMeridians }: {
  selectedRegions: Set<string>;
  onSelectRegion: (region: BodyRegion) => void;
  hoveredRegion: string | null;
  onHoverRegion: (id: string | null) => void;
  showAcupoints: boolean;
  relevantMeridians: Set<string>;
}) {
  const groupRef = useRef<THREE.Group>(null);

  // Filter acupoints by relevant meridians
  const visibleAcupoints = showAcupoints
    ? ACUPOINTS.filter(p => relevantMeridians.has(p.meridian))
    : [];

  return (
    <group ref={groupRef} position={[0, -0.8, 0]}>
      {/* Body outline - simple wireframe mannequin */}
      {/* Torso */}
      <mesh position={[0, 1.05, 0]}>
        <capsuleGeometry args={[0.16, 0.55, 8, 16]} />
        <meshStandardMaterial color="#f5e6d3" roughness={0.8} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.62, 0]}>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshStandardMaterial color="#f5e6d3" roughness={0.8} />
      </mesh>
      {/* Neck */}
      <mesh position={[0, 1.45, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 0.1, 12]} />
        <meshStandardMaterial color="#f5e6d3" roughness={0.8} />
      </mesh>
      {/* Left arm */}
      <mesh position={[-0.38, 1.05, 0]} rotation={[0, 0, 0.15]}>
        <capsuleGeometry args={[0.045, 0.45, 8, 12]} />
        <meshStandardMaterial color="#f5e6d3" roughness={0.8} />
      </mesh>
      {/* Right arm */}
      <mesh position={[0.38, 1.05, 0]} rotation={[0, 0, -0.15]}>
        <capsuleGeometry args={[0.045, 0.45, 8, 12]} />
        <meshStandardMaterial color="#f5e6d3" roughness={0.8} />
      </mesh>
      {/* Pelvis */}
      <mesh position={[0, 0.7, 0]}>
        <sphereGeometry args={[0.18, 16, 12]} />
        <meshStandardMaterial color="#f5e6d3" roughness={0.8} />
      </mesh>
      {/* Left leg */}
      <mesh position={[-0.1, 0.3, 0]}>
        <capsuleGeometry args={[0.06, 0.55, 8, 12]} />
        <meshStandardMaterial color="#f5e6d3" roughness={0.8} />
      </mesh>
      {/* Right leg */}
      <mesh position={[0.1, 0.3, 0]}>
        <capsuleGeometry args={[0.06, 0.55, 8, 12]} />
        <meshStandardMaterial color="#f5e6d3" roughness={0.8} />
      </mesh>
      {/* Left foot */}
      <mesh position={[-0.1, -0.06, 0.04]}>
        <boxGeometry args={[0.07, 0.03, 0.12]} />
        <meshStandardMaterial color="#f5e6d3" roughness={0.8} />
      </mesh>
      {/* Right foot */}
      <mesh position={[0.1, -0.06, 0.04]}>
        <boxGeometry args={[0.07, 0.03, 0.12]} />
        <meshStandardMaterial color="#f5e6d3" roughness={0.8} />
      </mesh>

      {/* Clickable body regions */}
      {BODY_REGIONS.map(region => (
        <BodyRegionMesh
          key={region.id}
          region={region}
          isSelected={selectedRegions.has(region.id)}
          onSelect={onSelectRegion}
          isHovered={hoveredRegion === region.id}
          onHover={onHoverRegion}
        />
      ))}

      {/* Acupuncture points */}
      {visibleAcupoints.map(point => (
        <AcuPointMarker key={point.id} point={point} visible={true} />
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

  const hoveredData = hoveredRegion ? BODY_REGIONS.find(r => r.id === hoveredRegion) : null;

  return (
    <div className="relative w-full" style={{ height: "500px" }}>
      <Canvas camera={{ position: [0, 0.5, 2.2], fov: 45 }} shadows>
        <ambientLight intensity={0.6} />
        <directionalLight position={[2, 3, 2]} intensity={0.8} />
        <directionalLight position={[-2, 1, -1]} intensity={0.3} />
        <Suspense fallback={null}>
          <Mannequin
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
          minDistance={1.5}
          maxDistance={4}
          minPolarAngle={Math.PI * 0.15}
          maxPolarAngle={Math.PI * 0.85}
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
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
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
