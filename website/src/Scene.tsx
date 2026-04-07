import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  Float, 
  ContactShadows, 
  PresentationControls,
  Stars,
} from '@react-three/drei';
import * as THREE from 'three';

const LowPolyTree = ({ position, scale, rotation }: { position: [number, number, number], scale: number, rotation: [number, number, number] }) => {
  return (
    <group position={position} scale={scale} rotation={rotation}>
      {/* Trunk */}
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.1, 0.15, 1, 5]} />
        <meshStandardMaterial color="#5c4033" roughness={0.8} />
      </mesh>
      {/* Leaves (Cone) */}
      <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
        <coneGeometry args={[0.8, 1.5, 6]} />
        <meshStandardMaterial color="#22c55e" roughness={0.6} />
      </mesh>
    </group>
  );
};

const FocusIsland = () => {
  const groupRef = useRef<THREE.Group>(null);
  
  // Subtle ambient floating rotation for depth
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <Float floatIntensity={1} rotationIntensity={0.2} speed={1.5}>
      <group ref={groupRef} position={[2, -1, 0]}>
        
        {/* Floating Earth Base */}
        <mesh position={[0, -0.4, 0]} receiveShadow castShadow>
          <cylinderGeometry args={[2.5, 1.8, 1, 8]} />
          <meshStandardMaterial color="#3f2e24" roughness={0.9} />
        </mesh>
        
        {/* Grass Top */}
        <mesh position={[0, 0.1, 0]} receiveShadow castShadow>
          <cylinderGeometry args={[2.5, 2.5, 0.15, 8]} />
          <meshStandardMaterial color="#16a34a" roughness={0.4} />
        </mesh>

        {/* Trees */}
        <LowPolyTree position={[0, 0.2, 0]} scale={1.2} rotation={[0, 0, 0]} />
        <LowPolyTree position={[1, 0.2, 1]} scale={0.8} rotation={[0, 1, 0]} />
        <LowPolyTree position={[-1.2, 0.2, 0.5]} scale={0.9} rotation={[0, 2, 0]} />
        <LowPolyTree position={[-0.5, 0.2, -1]} scale={1} rotation={[0, 3, 0]} />
        
        {/* Little decorative stones */}
        <mesh position={[1.5, 0.25, -0.5]} castShadow receiveShadow>
          <dodecahedronGeometry args={[0.2, 0]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.7} />
        </mesh>
        <mesh position={[-1.5, 0.2, -1.2]} castShadow receiveShadow>
          <dodecahedronGeometry args={[0.15, 0]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.8} />
        </mesh>

        {/* Floating Particles around the island (Fireflies) */}
        {Array.from({ length: 8 }).map((_, i) => (
          <mesh key={i} position={[
            (Math.random() - 0.5) * 4,
            Math.random() * 3,
            (Math.random() - 0.5) * 4
          ]}>
            <sphereGeometry args={[0.03, 8, 8]} />
            <meshBasicMaterial color="#eab308" />
          </mesh>
        ))}

      </group>
    </Float>
  );
};

export default function Scene() {
  return (
    <div className="canvas-container">
      <Canvas camera={{ position: [0, 1, 6], fov: 45 }} shadows>
        <color attach="background" args={['#070e0a']} />
        
        {/* Lighting setup specifically for the rich forest theme */}
        <ambientLight intensity={0.4} color="#bbf7d0" />
        <directionalLight 
          position={[5, 10, 5]} 
          intensity={1.5} 
          color="#fef08a" 
          castShadow 
          shadow-mapSize={1024}
        />
        <pointLight position={[-5, -5, -5]} intensity={0.5} color="#22c55e" />
        
        <Stars radius={100} depth={50} count={2000} factor={3} saturation={0} fade speed={1} />
        
        {/* PresentationControls makes the island highly interactive and 'springy' on drag */}
        <PresentationControls 
          global 
          rotation={[0, -Math.PI / 6, 0]} 
          polar={[-Math.PI / 4, Math.PI / 4]} 
          azimuth={[-Math.PI / 2, Math.PI / 2]}
        >
          <FocusIsland />
        </PresentationControls>
        
        <ContactShadows 
          position={[2, -2.5, 0]} 
          opacity={0.5} 
          scale={20} 
          blur={2.5} 
          far={4} 
          color="#064e3b"
        />
        
      </Canvas>
    </div>
  );
}
