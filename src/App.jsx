import React, { useState } from 'react';
import { motion } from 'framer-motion';
import useTeam from './hooks/useTeam';
import Background from './components/Background';
import { Entrance, Header } from './components/Header';
import PlayerCard3D from './components/PlayerCard3D';
import { StatsRadar } from './components/Panels';
import Armory from './components/Armory';
import Roster from './components/Roster';
import TacticalCommand from './TacticalCommand';

export default function App() {
  const { team, current, booting, loading, error, search, select } = useTeam();
  const [query, setQuery] = useState('');
  const submit = (e) => { e.preventDefault(); search(query); };

  return (
    <div className="min-h-screen bg-[#030305] text-white font-sans relative selection:bg-[#D4AF37] selection:text-black overflow-x-hidden">
      <Background />
      <Entrance show={booting} />
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Header query={query} setQuery={setQuery} onSubmit={submit} loading={loading} error={error} />

        {/* <TacticalCommand team={team} selectedName={current?.name} onSelectName={(n) => select(team.find((p) => p.name === n))} /> */}

        {current && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
            <PlayerCard3D player={current} />
            <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-7 flex flex-col gap-6">
              <StatsRadar player={current} />
            </motion.div>
          </div>
        )}

        {current && <Armory player={current} />}
        <Roster players={team} activeName={current?.name} onSelect={select} loading={booting} />
      </main>
    </div>
  );
}
