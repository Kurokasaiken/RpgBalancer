/**
 * Minimal Destiny Astrolabe Test Page
 * Tests the reusable DestinyAstrolabeComponent with various configurations
 */

import React, { useState } from 'react';
import { SkinSystemProvider } from '@/ui/idleVillage/hooks/useSkinSystem';
import { DestinyAstrolabe } from '@/ui/idleVillage/components/destinyAstrolabe/DestinyAstrolabe';
import type { AstrolabeResult as DestinyAstrolabeResult, AstrolabeSkill as DestinyAstrolabeSkill } from '@/ui/idleVillage/components/destinyAstrolabe/DestinyAstrolabe';

const SKILL_PRESETS = {
  single: [{ name: 'Atletica', stat: 65, difficulty: 50 }],
  double: [
    { name: 'Atletica', stat: 65, difficulty: 50 },      // Saltare burraco
    { name: 'Destrezza', stat: 55, difficulty: 60 },     // Disarmare trappola
  ],
  triple: [
    { name: 'Atletica', stat: 65, difficulty: 50 },      // Saltare
    { name: 'Destrezza', stat: 55, difficulty: 60 },     // Disarmare
    { name: 'Forza', stat: 70, difficulty: 45 },         // Rompere porta
  ],
  quadruple: [
    { name: 'Atletica', stat: 65, difficulty: 50 },      // Saltare
    { name: 'Destrezza', stat: 55, difficulty: 60 },     // Disarmare
    { name: 'Forza', stat: 70, difficulty: 45 },         // Rompere
    { name: 'Intelletto', stat: 50, difficulty: 55 },    // Risolvere enigma
  ],
  five: [
    { name: 'Atletica', stat: 65, difficulty: 50 },      // Saltare
    { name: 'Destrezza', stat: 55, difficulty: 60 },     // Disarmare
    { name: 'Forza', stat: 70, difficulty: 45 },         // Rompere
    { name: 'Intelletto', stat: 50, difficulty: 55 },    // Enigma
    { name: 'Carisma', stat: 60, difficulty: 48 },       // Persuadere
  ],
};

export default function MinimalDestinyAstrolabe() {
  const [lastResult, setLastResult] = useState<DestinyAstrolabeResult | null>(null);
  const [skills, setSkills] = useState<DestinyAstrolabeSkill[]>(SKILL_PRESETS.single);
  const [critChance, setCritChance] = useState(5);
  const [woundChance, setWoundChance] = useState(10);
  const [deathChance, setDeathChance] = useState(5);
  const [forcedVerdict, setForcedVerdict] = useState<string>('');

  const handleComplete = (result: DestinyAstrolabeResult) => {
    setLastResult(result);
    console.log('Skill check completed:', result);
  };

  const updateSkill = (idx: number, patch: Partial<DestinyAstrolabeSkill>) => {
    setSkills((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };

  return (
    <SkinSystemProvider>
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-4 text-amber-400">Destiny Astrolabe - Multi-Skill Test Hub</h1>

      {/* Astrolabe (reduced height so the config panel below stays in view) */}
      <div className="border-2 border-amber-600 rounded-lg overflow-hidden mb-6" style={{ height: '70vh' }}>
        <DestinyAstrolabe
          skills={skills}
          config={{
            crit: critChance,
            wound: woundChance,
            dead: deathChance,
            mode: forcedVerdict || 'random',
          }}
          onResolve={handleComplete}
          autoStart
        />
      </div>

      {/* Last Result */}
      {lastResult && (
        <div className="mb-6 bg-green-900/30 border border-green-700 p-4 rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <p className="text-xs text-gray-400">Verdict</p>
              <p className="text-lg font-bold text-amber-400">{lastResult.verdict.toUpperCase()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Tested Skill</p>
              <p className="text-lg font-bold text-cyan-400">{lastResult.skillName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">D100 Roll</p>
              <p className="text-lg font-bold text-blue-400">{lastResult.roll}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Risk Roll</p>
              <p className="text-lg font-bold text-red-400">{lastResult.riskRoll}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Status</p>
              <p className="text-lg font-bold">
                {lastResult.dead ? '☠️ DEAD' : lastResult.wounded ? '🩹 WOUNDED' : '✅ OK'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ════════ CONFIG PANEL — always visible, editable skill table ════════ */}
      <div className="bg-gray-800 p-6 rounded-lg border border-amber-600/30">
        <h2 className="text-xl font-bold text-amber-400 mb-4">⚙️ Configurazione Skill Check</h2>

        {/* Skill count (keeps your edits) + load-preset shortcut */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <span className="text-sm font-semibold text-gray-300">Numero di skill:</span>
          {[1, 2, 3, 4, 5].map((num) => (
            <button
              key={num}
              onClick={() => {
                // Resize keeping existing edited rows; new rows get sensible defaults
                setSkills((prev) =>
                  Array.from({ length: num }, (_, i) =>
                    prev[i] ? { ...prev[i] } : { name: `Skill ${i + 1}`, stat: 60, difficulty: 50 }
                  )
                );
              }}
              className={`w-10 h-10 rounded font-bold transition-colors ${
                skills.length === num ? 'bg-amber-500 text-black' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {num}
            </button>
          ))}
          <span className="mx-1 text-gray-600">|</span>
          <button
            onClick={() => {
              const presetKey = ['single', 'double', 'triple', 'quadruple', 'five'][skills.length - 1] as keyof typeof SKILL_PRESETS;
              setSkills(SKILL_PRESETS[presetKey].map((s) => ({ ...s })));
            }}
            className="px-3 h-10 rounded font-semibold bg-gray-700 text-amber-300 hover:bg-gray-600 transition-colors text-sm"
            title="Ricarica i valori di esempio per il numero di skill corrente"
          >
            ↺ Carica preset
          </button>
        </div>

        {/* Editable skill table */}
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-700">
                <th className="py-2 pr-4">#</th>
                <th className="py-2 pr-4">Skill</th>
                <th className="py-2 pr-4">Stat PG</th>
                <th className="py-2 pr-4">Check (Difficoltà)</th>
                <th className="py-2 pr-4">Soglia (TST)</th>
                <th className="py-2">Punte</th>
              </tr>
            </thead>
            <tbody>
              {skills.map((skill, idx) => {
                const tst = Math.max(1, Math.min(99, 50 + (skill.stat - skill.difficulty)));
                const punteMap: Record<number, number[]> = {
                  1: [5], 2: [3, 2], 3: [2, 2, 1], 4: [2, 1, 1, 1], 5: [1, 1, 1, 1, 1],
                };
                const punte = (punteMap[skills.length] || [])[idx] ?? 1;
                return (
                  <tr key={idx} className="border-b border-gray-700/50">
                    <td className="py-2 pr-4 text-gray-500">{idx + 1}</td>
                    <td className="py-2 pr-4">
                      <input
                        type="text"
                        value={skill.name}
                        onChange={(e) => updateSkill(idx, { name: e.target.value })}
                        className="w-32 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white"
                      />
                    </td>
                    <td className="py-2 pr-4">
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={skill.stat}
                        onChange={(e) => updateSkill(idx, { stat: Number(e.target.value) })}
                        className="w-20 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white"
                      />
                    </td>
                    <td className="py-2 pr-4">
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={skill.difficulty}
                        onChange={(e) => updateSkill(idx, { difficulty: Number(e.target.value) })}
                        className="w-20 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white"
                      />
                    </td>
                    <td className="py-2 pr-4 font-bold text-amber-400">{tst}</td>
                    <td className="py-2 text-cyan-400">{punte}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Risk & Force controls */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-700">
          <div>
            <label className="block text-xs font-semibold mb-1 text-gray-300">Critical Fail % ({critChance})</label>
            <input type="range" min="1" max="20" value={critChance}
              onChange={(e) => setCritChance(Number(e.target.value))} className="w-full" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1 text-gray-300">Wounded % ({woundChance})</label>
            <input type="range" min="1" max="50" value={woundChance}
              onChange={(e) => setWoundChance(Number(e.target.value))} className="w-full" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1 text-gray-300">Death % ({deathChance})</label>
            <input type="range" min="1" max="50" value={deathChance}
              onChange={(e) => setDeathChance(Number(e.target.value))} className="w-full" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1 text-gray-300">Force Verdict</label>
            <select value={forcedVerdict} onChange={(e) => setForcedVerdict(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1">
              <option value="">Random</option>
              <option value="bigwin">Big Win</option>
              <option value="win">Win</option>
              <option value="almost">Almost</option>
              <option value="fail">Failure</option>
              <option value="epicfail">Epic Fail</option>
            </select>
          </div>
        </div>
      </div>
    </div>
    </SkinSystemProvider>
  );
}
