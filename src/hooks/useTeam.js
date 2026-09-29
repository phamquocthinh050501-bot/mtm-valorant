import { useEffect, useState, useCallback, useRef } from 'react';
import { API_KEY, TEAM } from '../config';
import { fetchAgents, loadPlayer, searchPlayer, placeholder, sleep } from '../services/valorant';

export default function useTeam() {
  const [team, setTeam] = useState(() => TEAM.map(placeholder)); // hiện đủ 5 thẻ ngay lập tức
  const [current, setCurrent] = useState(() => placeholder(TEAM[0]));
  const [booting, setBooting] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(API_KEY ? '' : 'Thiếu VITE_HENRIK_KEY trong file .env nên chưa gọi được API.');
  const agentsRef = useRef([]);

  // Tự động gọi API cho 5 thành viên khi vào trang (chạy song song)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      agentsRef.current = await fetchAgents();
      await Promise.all(TEAM.map(async (p, i) => {
        const pl = await loadPlayer(p, agentsRef.current);
        if (cancelled) return;
        setTeam((t) => t.map((x, j) => (j === i ? pl : x)));
        setCurrent((c) => (c.pending && c.tag === pl.tag ? pl : c));
      }));
      await sleep(600);
      if (!cancelled) setBooting(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const select = useCallback((p) => {
    if (!p) return;
    setCurrent(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const search = useCallback(async (q) => {
    setLoading(true); setError('');
    try {
      const pl = await searchPlayer(q, agentsRef.current);
      setCurrent(pl);
      setTeam((t) => (t.some((x) => x.name === pl.name) ? t : [pl, ...t]));
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  return { team, current, booting, loading, error, search, select };
}
