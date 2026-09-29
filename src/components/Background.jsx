import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Sparkles } from '@react-three/drei';
import { GOLD, PURPLE } from '../config';

function Universe() {
  const g = useRef();
  useFrame((s) => { g.current.rotation.y = s.clock.elapsedTime * 0.015; });
  return (
    <group ref={g}>
      <Stars radius={150} depth={100} count={5000} factor={5} saturation={1} fade speed={1.5} />
      <Sparkles count={250} scale={35} size={6} speed={0.3} opacity={0.5} color={GOLD} />
      <Sparkles count={250} scale={35} size={6} speed={0.5} opacity={0.5} color={PURPLE} />
    </group>
  );
}

export default function Background() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 10], fov: 60 }}>
        <ambientLight intensity={0.2} /><Universe />
      </Canvas>
    </div>
  );
}
