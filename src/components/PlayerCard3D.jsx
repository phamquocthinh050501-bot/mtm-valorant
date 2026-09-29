import React, { useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import { GOLD } from '../config';

const SKILL_ANIM = {
  initial: { opacity: 0, scale: 0.85, filter: 'blur(15px)', y: 20 },
  animate: { opacity: 1, scale: 1, filter: 'blur(0px)', y: 0, transition: { type: 'spring', stiffness: 220, damping: 20 } },
  exit: { opacity: 0, scale: 0.95, filter: 'blur(10px)', transition: { duration: 0.2 } },
};

function Core() {
  const mesh = useRef(), ring = useRef();
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    mesh.current.rotation.y = t * 0.4; mesh.current.rotation.x = Math.sin(t * 0.5) * 0.2;
    ring.current.rotation.z = t * 0.5; ring.current.rotation.x = Math.PI / 2.5;
  });
  return (
    <group>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={1.5}>
        <mesh ref={mesh} scale={1.2}><icosahedronGeometry args={[1, 0]} /><meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={0.6} wireframe /></mesh>
        <mesh scale={0.9}><octahedronGeometry args={[1, 1]} /><meshStandardMaterial color="#4B0082" emissive="#4B0082" emissiveIntensity={0.8} /></mesh>
      </Float>
      <mesh ref={ring} scale={2.8}><torusGeometry args={[1, 0.015, 16, 100]} /><meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={2} /></mesh>
    </group>
  );
}

export default function PlayerCard3D({ player }) {
  const x = useMotionValue(0), y = useMotionValue(0);
  const sx = useSpring(x, { damping: 40, stiffness: 150 }), sy = useSpring(y, { damping: 40, stiffness: 150 });
  const rotateX = useTransform(sy, [-0.5, 0.5], ['12deg', '-12deg']);
  const rotateY = useTransform(sx, [-0.5, 0.5], ['-12deg', '12deg']);
  const onMove = (e) => { // chuẩn hoá về [-0.5, 0.5]
    const r = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - r.left) / r.width - 0.5); y.set((e.clientY - r.top) / r.height - 0.5);
  };
  return (
    <motion.div key={player.name} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="lg:col-span-5" style={{ perspective: 1200 }}>
      <motion.div style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }} onMouseMove={onMove} onMouseLeave={() => { x.set(0); y.set(0); }}
        className="relative w-full h-[520px] sm:h-[600px] rounded-[2.5rem] bg-gradient-to-b from-zinc-900/80 to-black/90 border border-white/10 backdrop-blur-2xl flex flex-col justify-between overflow-visible">
        <motion.div style={{ translateZ: '30px' }} className="absolute inset-0 z-0 pointer-events-none opacity-60">
          <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 5], fov: 45 }}>
            <ambientLight intensity={1} /><pointLight position={[10, 10, 10]} intensity={2} color={GOLD} /><Core />
          </Canvas>
        </motion.div>

        <motion.div style={{ translateZ: '100px' }} className="absolute bottom-0 right-[-5%] w-[110%] h-[105%] pointer-events-none flex justify-end z-10">
          <AnimatePresence mode="wait">
            <motion.img key={player.customImg} {...SKILL_ANIM} src={player.customImg} alt={player.name}
              className="h-full object-contain object-bottom origin-bottom drop-shadow-[0_20px_30px_rgba(212,175,55,0.3)] contrast-125" />
          </AnimatePresence>
        </motion.div>

        <motion.div style={{ translateZ: '140px' }} className="w-full h-full p-8 flex flex-col justify-between z-20 pointer-events-none">
          <div className="max-w-[70%]">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-black/50 rounded-full border border-white/10 mb-4">
              <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
              <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Đang chọn · Lv {player.level}</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black italic tracking-tighter break-words leading-none mb-1 drop-shadow-[0_5px_15px_rgba(0,0,0,0.8)]">{player.name}</h2>
            <p className="text-[#D4AF37] font-bold text-xl">#{player.tag}</p>
          </div>
          <div className="max-w-[80%] grid grid-cols-2 gap-3">
            <div className="bg-black/60 p-4 rounded-2xl border border-white/10">
              <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-widest mb-1">Rank</p>
              <p className="text-lg font-black truncate">{player.rank}</p>
              <p className="text-xs text-zinc-400">{player.rr} RR</p>
            </div>
            <div className="bg-gradient-to-t from-[#D4AF37]/30 to-transparent p-4 rounded-2xl border border-[#D4AF37]/50">
              <p className="text-[10px] text-[#D4AF37] font-black uppercase tracking-widest mb-1">K/D Ratio</p>
              <p className="text-2xl font-black">{player.kd}</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
