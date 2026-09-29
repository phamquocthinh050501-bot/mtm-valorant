

import { API_KEY, TEAM, FALLBACK_IMG } from '../config';

const enc = encodeURIComponent;
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const henrik = (path) => fetch(`https://api.henrikdev.xyz/valorant/${path}`, { headers: { Authorization: API_KEY } });

// RNG cố định theo tên: chỉ số mock không đổi mỗi lần render/tìm lại
export const rng = (s) => {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ (h >>> 13)) >>> 0) / 4294967296;
};

export async function fetchAgents() {
  try {
    const r = await fetch('https://valorant-api.com/v1/agents?isPlayableCharacter=true');
    return (await r.json()).data;
  } catch (e) { console.error(e); return []; }
}

const resolveImg = (img, agents, rand) => {
  if (img?.startsWith('AGENT:')) return agents.find((a) => a.displayName === img.slice(6))?.fullPortrait || FALLBACK_IMG;
  if (img) return img;
  return agents[Math.floor(rand() * agents.length)]?.fullPortrait || FALLBACK_IMG;
};

export async function loadPlayer(p, agents) {
  let acc = null, mmr = null, region = p.region || 'ap';
  for (let i = 0; i < 2 && !acc; i++) {
    try {
      const r = await henrik(`v1/account/${enc(p.name)}/${enc(p.tag)}`);
      if (r.ok) { acc = (await r.json()).data; region = acc.region || region; }
      else if (r.status === 429) await sleep(1500);
      else break;
    } catch (e) { console.warn(p.name, e); }
  }
  try {
    const r = await henrik(`v1/mmr/${region}/${enc(p.name)}/${enc(p.tag)}`);
    if (r.ok) mmr = (await r.json()).data;
  } catch (e) { console.warn(p.name, e); }

  const name = (acc?.name || p.name).toUpperCase(), tag = (acc?.tag || p.tag).toUpperCase();
  const rand = rng(name + tag);
  return {
    name, tag, offline: !acc,
    level: acc?.account_level ?? '—',
    rank: mmr?.currenttierpatched || 'Unranked',
    rr: mmr?.ranking_in_tier ?? 0,
    lastChange: mmr?.mmr_change_to_last_game ?? 0,
    kd: (0.9 + rand() * 0.6).toFixed(2),
    winrate: Math.floor(45 + rand() * 20),
    hs: Math.floor(15 + rand() * 25),
    entry: Math.floor(50 + rand() * 40),
    clutch: Math.floor(40 + rand() * 40),
    customImg: resolveImg(p.img, agents, rand),
  };
}

export async function searchPlayer(query, agents) {
  const [name, tag] = query.split('#').map((s) => s?.trim());
  if (!name || !tag) throw new Error('Nhập đúng định dạng Tên#Tag');
  const known = TEAM.find((t) => t.name.toLowerCase() === name.toLowerCase());
  const player = await loadPlayer({ name, tag, img: known?.img }, agents);
  if (player.offline) throw new Error('Tài khoản không tồn tại.');
  return player;
}

// Thẻ tạm hiển thị ngay khi vào trang, trong lúc chờ API trả về
export const placeholder = (p) => ({
  name: p.name.toUpperCase(), tag: p.tag.toUpperCase(), pending: true, offline: false,
  level: '—', rank: 'Đang tải...', rr: 0, lastChange: 0, kd: '—',
  winrate: 50, hs: 20, entry: 60, clutch: 50,
  customImg: p.img?.startsWith('AGENT:') ? FALLBACK_IMG : p.img,
});
