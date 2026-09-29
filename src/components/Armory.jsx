import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Crosshair, Search } from 'lucide-react';
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { GOLD, PURPLE } from '../config';
import { rng } from '../services/valorant';

// ---- dữ liệu vũ khí + skin từ valorant-api.com (không cần key), cache 1 lần ----
let cache;
function useWeapons() {
  const [weapons, setWeapons] = useState(cache || []);
  const [err, setErr] = useState(false);
  useEffect(() => {
    if (cache) return;
    fetch('https://valorant-api.com/v1/weapons').then((r) => r.json())
      .then((d) => { cache = d.data; setWeapons(cache); }).catch(() => setErr(true));
  }, []);
  return { weapons, err };
}

const cat = (w) => w.category.split('::')[1];
const skinIcon = (s) => s.displayIcon || s.levels?.[0]?.displayIcon || s.chromas?.[0]?.fullRender;
const d0 = (w) => w.weaponStats.damageRanges?.[0] || {};
const METRICS = {
  fireRate: ['Tốc độ bắn', (w) => w.weaponStats.fireRate],
  magazineSize: ['Băng đạn', (w) => w.weaponStats.magazineSize],
  reload: ['Nạp đạn (giây)', (w) => w.weaponStats.reloadTimeSeconds],
  head: ['Sát thương đầu', (w) => d0(w).headDamage],
  body: ['Sát thương thân', (w) => d0(w).bodyDamage],
  leg: ['Sát thương chân', (w) => d0(w).legDamage],
};
const tip = { backgroundColor: '#000', border: `1px solid ${GOLD}`, fontSize: 12 };
const box = 'bg-white/5 border border-white/10 rounded-3xl p-5 backdrop-blur-xl';
const h = 'text-xs font-black uppercase tracking-widest mb-3';

export default function Armory({ player }) {
  const { weapons, err } = useWeapons();
  const [selId, setSelId] = useState(null);
  const [skinId, setSkinId] = useState(null);
  const [filter, setFilter] = useState('Tất cả');
  const [q, setQ] = useState('');
  const [metric, setMetric] = useState('fireRate');

  const cats = useMemo(() => ['Tất cả', ...new Set(weapons.map(cat))], [weapons]);
  const shown = useMemo(() => weapons.filter((w) => filter === 'Tất cả' || cat(w) === filter), [weapons, filter]);
  const sel = weapons.find((w) => w.uuid === selId) || weapons.find((w) => w.displayName === 'Vandal') || weapons[0];

  useEffect(() => { setSkinId(null); setQ(''); }, [sel?.uuid]);

  const skins = useMemo(() => (sel?.skins || []).filter((s) => skinIcon(s) && s.displayName.toLowerCase().includes(q.toLowerCase())), [sel, q]);
  const skin = skins.find((s) => s.uuid === skinId) || (sel?.skins || []).find((s) => s.uuid === skinId);

  // Thống kê theo danh sách súng đang lọc
  const ranked = useMemo(() => shown.filter((w) => w.weaponStats).map((w) => ({
    name: w.displayName, value: +(+METRICS[metric][1](w) || 0).toFixed(2), self: w.uuid === sel?.uuid,
  })).sort((a, b) => b.value - a.value), [shown, metric, sel]);

  const damage = useMemo(() => shown.filter((w) => w.weaponStats?.damageRanges?.length).map((w) => {
    const d = d0(w);
    return { name: w.displayName, Đầu: Math.round(d.headDamage), Thân: Math.round(d.bodyDamage), Chân: Math.round(d.legDamage) };
  }), [shown]);

  // Chart 3: tỉ lệ dùng súng của người chơi (ước lượng, cố định theo tên)
  const usage = useMemo(() => {
    const r = rng(player.name + player.tag);
    const rows = weapons.filter((w) => w.weaponStats).map((w) => ({ name: w.displayName, v: r() ** 2 }))
      .sort((a, b) => b.v - a.v).slice(0, 6);
    const sum = rows.reduce((a, b) => a + b.v, 0);
    return rows.map((x) => ({ name: x.name, pct: Math.round((x.v / sum) * 100) }));
  }, [weapons, player.name, player.tag]);

  if (err) return <p className="text-red-400 text-sm mb-12">Không tải được danh sách vũ khí.</p>;
  if (!sel) return <p className="text-zinc-500 text-sm mb-12">Đang tải kho vũ khí...</p>;
  const st = sel.weaponStats;

  return (
    <section className="mb-12 space-y-4">
      <h2 className="text-xl font-black uppercase flex items-center gap-3"><Crosshair className="text-[#D4AF37] w-6 h-6" /> Kho vũ khí</h2>

      <div className={box}>
        <div className="flex flex-wrap gap-2 mb-4">
          {cats.map((c) => (
            <button key={c} onClick={() => setFilter(c)} aria-pressed={filter === c}
              className={`px-3 py-1 rounded-full text-xs font-bold border ${filter === c ? 'bg-[#D4AF37] text-black border-[#D4AF37]' : 'border-white/15 text-zinc-400 hover:text-white'}`}>{c}</button>
          ))}
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-8 gap-2">
          {shown.map((w) => (
            <motion.button key={w.uuid} whileHover={{ y: -3 }} onClick={() => setSelId(w.uuid)} aria-pressed={sel.uuid === w.uuid}
              className={`rounded-2xl p-2 border text-center ${sel.uuid === w.uuid ? 'border-[#D4AF37] bg-[#D4AF37]/10' : 'border-white/10 bg-black/40 hover:border-white/30'}`}>
              <img src={w.displayIcon} alt="" loading="lazy" className="h-10 mx-auto object-contain" />
              <p className="text-[10px] font-bold mt-1 truncate">{w.displayName}</p>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className={`${box} lg:col-span-5`}>
          <p className={h}>{sel.displayName}{skin ? ` · ${skin.displayName}` : ''}</p>
          <div className="h-40 flex items-center justify-center bg-gradient-to-t from-[#D4AF37]/10 to-transparent rounded-2xl mb-3">
            <img src={(skin && skinIcon(skin)) || sel.displayIcon} alt={sel.displayName} className="max-h-32 max-w-[90%] object-contain drop-shadow-[0_10px_20px_rgba(212,175,55,0.3)]" />
          </div>
          {st && (
            <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
              {[['Tốc độ bắn', st.fireRate.toFixed(1)], ['Băng đạn', st.magazineSize], ['Nạp đạn (s)', st.reloadTimeSeconds.toFixed(1)]].map(([k, v]) => (
                <div key={k} className="bg-black/40 rounded-xl p-2 border border-white/10"><p className="text-zinc-500 text-[10px]">{k}</p><p className="font-black">{v}</p></div>
              ))}
            </div>
          )}
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Tìm skin ${sel.displayName}...`} aria-label="Tìm skin"
              className="w-full bg-black/40 border border-white/10 rounded-full py-1.5 pl-9 pr-3 text-xs outline-none focus:border-[#D4AF37]" />
          </div>
          <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
            {skins.slice(0, 60).map((s) => (
              <button key={s.uuid} onClick={() => setSkinId(s.uuid)} aria-pressed={skinId === s.uuid} title={s.displayName}
                className={`rounded-xl p-1.5 border bg-black/40 ${skinId === s.uuid ? 'border-[#D4AF37]' : 'border-white/5 hover:border-white/30'}`}>
                <img src={skinIcon(s)} alt="" loading="lazy" className="h-10 mx-auto object-contain" />
                <p className="text-[9px] text-zinc-400 truncate mt-1">{s.displayName.replace(sel.displayName, '').trim() || 'Standard'}</p>
              </button>
            ))}
          </div>
          <p className="text-[10px] text-zinc-500 mt-2">{Math.min(60, skins.length)}/{skins.length} skin</p>
        </div>

        <div className="lg:col-span-7 grid gap-4">
          <div className={box}>
            <p className={h}>Thống kê {filter === 'Tất cả' ? 'toàn bộ súng' : `nhóm ${filter}`} · {METRICS[metric][0]}</p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {Object.entries(METRICS).map(([k, [label]]) => (
                <button key={k} onClick={() => setMetric(k)} aria-pressed={metric === k}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${metric === k ? 'bg-[#D4AF37] text-black border-[#D4AF37]' : 'border-white/15 text-zinc-400 hover:text-white'}`}>{label}</button>
              ))}
            </div>
            <div className="h-56">
              {ranked.length ? (
                <ResponsiveContainer><BarChart data={ranked}>
                  <XAxis dataKey="name" stroke="#71717a" fontSize={9} interval={0} angle={-35} textAnchor="end" height={50} /><YAxis stroke="#71717a" fontSize={10} />
                  <Tooltip contentStyle={tip} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                  <Bar dataKey="value" name={METRICS[metric][0]}>{ranked.map((c) => <Cell key={c.name} fill={c.self ? GOLD : '#3f3f46'} />)}</Bar>
                </BarChart></ResponsiveContainer>
              ) : <p className="text-xs text-zinc-500 pt-16 text-center">Nhóm này không có dữ liệu thống kê.</p>}
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className={box}>
              <p className={h}>Sát thương đầu / thân / chân</p>
              <div className="h-48">
                {damage.length ? (
                  <ResponsiveContainer><BarChart data={damage}>
                    <XAxis dataKey="name" stroke="#71717a" fontSize={8} interval={0} angle={-35} textAnchor="end" height={50} /><YAxis stroke="#71717a" fontSize={10} />
                    <Tooltip contentStyle={tip} cursor={{ fill: 'rgba(255,255,255,0.05)' }} /><Legend wrapperStyle={{ fontSize: 10 }} />
                    <Bar dataKey="Đầu" fill={GOLD} /><Bar dataKey="Thân" fill={PURPLE} /><Bar dataKey="Chân" fill="#71717a" />
                  </BarChart></ResponsiveContainer>
                ) : <p className="text-xs text-zinc-500 pt-16 text-center">Không có dữ liệu.</p>}
              </div>
            </div>
            <div className={box}>
              <p className={h}>Súng hay dùng · {player.name}</p>
              <div className="h-48">
                <ResponsiveContainer><BarChart data={usage} layout="vertical">
                  <XAxis type="number" hide /><YAxis type="category" dataKey="name" stroke="#a1a1aa" fontSize={10} width={62} />
                  <Tooltip contentStyle={tip} formatter={(v) => `${v}%`} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                  <Bar dataKey="pct" name="Tỉ lệ" fill={PURPLE} radius={[0, 4, 4, 0]} />
                </BarChart></ResponsiveContainer>
              </div>
              <p className="text-[10px] text-zinc-600">Số liệu ước lượng (chưa có nguồn thật).</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
