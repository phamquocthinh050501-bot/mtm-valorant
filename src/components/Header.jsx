import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Search, Loader2 } from 'lucide-react';

export function Entrance({ show }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div className="fixed inset-0 z-50 bg-[#030305] flex flex-col items-center justify-center"
          exit={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }} transition={{ duration: 1.2 }}>
          <Crown className="w-24 h-24 text-[#D4AF37] mb-6 animate-pulse drop-shadow-[0_0_30px_rgba(212,175,55,0.8)]" />
          <h1 className="text-5xl sm:text-7xl font-black italic tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-white to-[#8A2BE2]">MTM TEAM</h1>
          <p className="mt-4 text-[#D4AF37] tracking-widest font-mono text-sm uppercase">Thiết lập kết nối máy chủ...</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Header({ query, setQuery, onSubmit, loading, error }) {
  return (
    <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
      className="flex flex-col md:flex-row justify-between items-center mb-10 bg-white/5 p-4 rounded-3xl backdrop-blur-xl border border-white/10 gap-4">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#8A2BE2] flex items-center justify-center">
          <Crown className="text-black w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black italic tracking-wider uppercase">MTM<span className="text-[#D4AF37]">NEXUS</span></h1>
          <p className="text-[9px] text-zinc-400 tracking-widest uppercase">Command Center</p>
        </div>
      </div>
      <form onSubmit={onSubmit} className="w-full md:w-auto flex-1 max-w-md">
        <div className="flex gap-2">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4 group-focus-within:text-[#D4AF37]" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tên#Tag" aria-label="Tìm người chơi"
              className="w-full bg-black/40 border border-white/10 rounded-full py-2.5 pl-11 pr-4 focus:border-[#D4AF37] outline-none text-sm" />
          </div>
          <button type="submit" disabled={loading} className="px-6 bg-[#D4AF37] text-black font-black rounded-full text-sm disabled:opacity-60">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'TÌM'}
          </button>
        </div>
        {error && <p role="alert" className="mt-1 ml-4 text-xs text-red-400">{error}</p>}
      </form>
    </motion.header>
  );
}
