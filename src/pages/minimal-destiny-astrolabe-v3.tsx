import React, { useState } from 'react';
import DestinyAstrolabeV3 from '../ui/idleVillage/components/destinyAstrolabeV3/DestinyAstrolabeV3';

const MinimalDestinyAstrolabeV3 = () => {
  const [difficulty, setDifficulty] = useState(1);
  const [critPercent, setCritPercent] = useState(0);
  const [woundPercent, setWoundPercent] = useState(0);
  const [deathPercent, setDeathPercent] = useState(0);
  const [nearMissBand, setNearMissBand] = useState(0);
  const [spinDuration, setSpinDuration] = useState(0);
  const [slowMo, setSlowMo] = useState(false);
  const [hitStop, setHitStop] = useState(false);

  return (
    <div className="bg-gray-900 text-gray-100" style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="flex items-center justify-between px-6 py-3 flex-shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-amber-400">Destiny Astrolabe · V3</h1>
          <div className="flex gap-2">
            <a
              href="/minimal-destiny-astrolabe"
              className="px-3 py-1 rounded text-sm font-semibold bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
            >
              V1
            </a>
            <a
              href="/minimal-destiny-astrolabe-v2"
              className="px-3 py-1 rounded text-sm font-semibold bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
            >
              V2
            </a>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
        <DestinyAstrolabeV3 />
      </div>

      <div className="p-6">
        <div className="bg-gray-800 p-6 rounded-lg border border-amber-600/30">
          <h2 className="text-xl font-bold text-amber-400 mb-4">⚙️ Configurazione V3</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-300">Difficulty</label>
              <input type="number" value={difficulty} onChange={(e) => setDifficulty(e.target.valueAsNumber)} className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-300">Crit Percent</label>
              <input type="number" value={critPercent} onChange={(e) => setCritPercent(e.target.valueAsNumber)} className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-300">Wound Percent</label>
              <input type="number" value={woundPercent} onChange={(e) => setWoundPercent(e.target.valueAsNumber)} className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-300">Death Percent</label>
              <input type="number" value={deathPercent} onChange={(e) => setDeathPercent(e.target.valueAsNumber)} className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-300">Near Miss Band</label>
              <input type="number" value={nearMissBand} onChange={(e) => setNearMissBand(e.target.valueAsNumber)} className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-300">Spin Duration</label>
              <input type="number" value={spinDuration} onChange={(e) => setSpinDuration(e.target.valueAsNumber)} className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-300">Slow Mo</label>
              <input type="checkbox" checked={slowMo} onChange={(e) => setSlowMo(e.target.checked)} className="w-5 h-5" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-300">Hit Stop</label>
              <input type="checkbox" checked={hitStop} onChange={(e) => setHitStop(e.target.checked)} className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MinimalDestinyAstrolabeV3;