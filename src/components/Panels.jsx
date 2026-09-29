import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart2, Target } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { WEAPONS } from '../config';

const card = 'bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl';
const title = 'text-sm font-black uppercase flex items-center gap-2 tracking-widest';

export function StatsRadar({ player }) {
  const data = useMemo(() => [
    { subject: 'K/D', value: Math.min(100, player.kd * 60) },
    { subject: 'Win Rate', value: player.winrate },
    { subject: 'Headshot', value: Math.min(100, player.hs * 1.5) },
    { subject: 'Entry', value: player.entry },
    { subject: 'Clutch', value: player.clutch },
  ], [player]);
  return (
    <div className={`${card} flex-1 flex flex-col min-h-[300px] relative overflow-hidden`}>
      <h2 className={title}><BarChart2 className="text-[#D4AF37] w-5 h-5" /> Phân tích thông số</h2>
      <div className="flex-1 w-full min-h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart outerRadius="70%" data={data}>
            <defs>
              <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.8} /><stop offset="95%" stopColor="#8A2BE2" stopOpacity={0.2} />
              </linearGradient>
            </defs>
            <PolarGrid stroke="rgba(255,255,255,0.1)" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#A1A1AA', fontSize: 11, fontWeight: 'bold' }} />
            <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #D4AF37' }} />
            <Radar name={player.name} dataKey="value" stroke="#D4AF37" strokeWidth={2} fill="url(#gold)" fillOpacity={0.5} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function WeaponsGrid() {
  return (
    <div className={card}>
      <h2 className={`${title} mb-4`}><Target className="text-[#D4AF37] w-5 h-5" /> Vũ khí nổi bật</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {WEAPONS.map((w) => (
          <motion.div key={w.name} whileHover={{ y: -3 }} className="bg-black/40 border border-white/5 hover:border-[#D4AF37]/50 rounded-2xl p-3 flex flex-col justify-between items-center h-28 transition-colors">
            <p className="text-[10px] font-bold text-zinc-400 uppercase">{w.name}</p>
            <img src={w.img} alt={w.name} loading="lazy" className="w-[80%] object-contain" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
