import React from 'react';
import { motion } from 'framer-motion';
import { Users, Loader2, ChevronRight } from 'lucide-react';
import { FALLBACK_IMG } from '../config';

export default function Roster({ players, activeName, onSelect, loading }) {
  if (!players.length) return null;
  return (
    <section className="bg-white/5 border border-[#D4AF37]/20 rounded-[2.5rem] p-6 sm:p-8 backdrop-blur-xl">
      <div className="flex justify-between items-end mb-6">
        <h2 className="text-xl sm:text-2xl font-black uppercase flex items-center gap-3">
          <Users className="text-[#D4AF37] w-6 h-6" /> Đội hình MTM {loading && <Loader2 className="w-5 h-5 text-[#D4AF37] animate-spin" />}
        </h2>
        <p className="text-[10px] text-zinc-500 uppercase tracking-widest hidden sm:block">Click vào thẻ để xem chi tiết</p>
      </div>
      <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-6 snap-x snap-mandatory [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:bg-[#D4AF37]/50 [&::-webkit-scrollbar-thumb]:rounded-full">
        {players.map((p) => {
          const active = activeName === p.name;
          return (
            <motion.button key={`${p.name}#${p.tag}`} onClick={() => onSelect(p)} whileHover={{ y: -5 }} aria-pressed={active}
              className={`min-w-[260px] text-left p-1 rounded-3xl snap-center ${active ? 'bg-gradient-to-b from-[#D4AF37] to-[#8A2BE2]' : 'bg-white/5 hover:bg-white/10 border border-white/10'}`}>
              <div className="bg-black/90 rounded-[1.3rem] p-5 flex flex-col justify-between min-h-[140px]">
                <div className="flex gap-4 items-center">
                  <div className="w-14 h-14 rounded-2xl border-2 border-[#D4AF37]/50 overflow-hidden bg-zinc-900 shrink-0">
                    <img src={p.customImg} alt="" loading="lazy" onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }} className="w-full h-full object-cover object-top" />
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="font-black text-lg truncate">{p.name}</h3>
                    <p className="text-xs text-[#D4AF37] font-mono">#{p.tag}{p.offline && <span className="ml-2 text-amber-400">OFFLINE</span>}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-4">
                  <span className="text-xs font-bold text-zinc-300 bg-white/10 px-2 py-1 rounded-md">
                    {p.rank} · {p.rr}RR
                    <span className={p.lastChange >= 0 ? 'text-emerald-400' : 'text-red-400'}> {p.lastChange >= 0 ? '+' : ''}{p.lastChange}</span>
                  </span>
                  <span className="text-[#D4AF37] font-mono font-bold flex items-center gap-1 text-sm">{p.kd} KD <ChevronRight className="w-4 h-4" /></span>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
