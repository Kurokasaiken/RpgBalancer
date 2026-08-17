/**
 * Minimal Destiny Astrolabe V2 Test Page
 *
 * V9-skinned rebuild of the D100 skill-check. Same config surface as V1 so the
 * two can be compared side by side (/minimal-destiny-astrolabe vs -v2).
 */
import React, { useRef, useState } from 'react';
import { SkinSystemProvider } from '@/ui/idleVillage/hooks/useSkinSystem';
import {
  DestinyAstrolabeV2,
  type AstrolabeResult,
  type AstrolabeSkill,
  type DestinyAstrolabeV2Handle,
} from '@/ui/idleVillage/frozen/kits/destinyAstrolabeV2Kit';

const SKILL_PRESETS = {
  single: [{ name: 'Atletica', stat: 65, difficulty: 50 }],
  double: [
    { name: 'Atletica', stat: 65, difficulty: 50 },
    { name: 'Destrezza', stat: 55, difficulty: 60 },
  ],
  triple: [
    { name: 'Atletica', stat: 65, difficulty: 50 },
    { name: 'Destrezza', stat: 55, difficulty: 60 },
    { name: 'Forza', stat: 70, difficulty: 45 },
  ],
  quadruple: [
    { name: 'Atletica', stat: 65, difficulty: 50 },
    { name: 'Destrezza', stat: 55, difficulty: 60 },
    { name: 'Forza', stat: 70, difficulty: 45 },
    { name: 'Intelletto', stat: 50, difficulty: 55 },
  ],
  five: [
    { name: 'Atletica', stat: 65, difficulty: 50 },
    { name: 'Destrezza', stat: 55, difficulty: 60 },
    { name: 'Forza', stat: 70, difficulty: 45 },
    { name: 'Intelletto', stat: 50, difficulty: 55 },
    { name: 'Carisma', stat: 60, difficulty: 48 },
  ],
};

export default function MinimalDestinyAstrolabeV2() {
  const astrolabeRef = useRef<DestinyAstrolabeV2Handle>(null);
  const [lastResult, setLastResult] = useState<AstrolabeResult | null>(null);
  const [skills, setSkills] = useState<AstrolabeSkill[]>(SKILL_PRESETS.single);
  const [critChance, setCritChance] = useState(5);
  const [woundChance, setWoundChance] = useState(10);
  const [deathChance, setDeathChance] = useState(5);
  const [forcedVerdict, setForcedVerdict] = useState<string>('');

  const handleComplete = (result: AstrolabeResult) => {
    setLastResult(result);
    console.log('Skill check V2 completed:', result);
  };

  const updateSkill = (idx: number, patch: Partial<AstrolabeSkill>) => {
    setSkills((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };

  const rollAgain = () => {
    setLastResult(null);
    astrolabeRef.current?.roll();
  };

  return (
    <SkinSystemProvider>
      <div className="bg-gray-900 text-gray-100" style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="flex items-center justify-between px-6 py-3 flex-shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold" style={{ color: '#dfb857', letterSpacing: '0.12em' }}>
              Destiny Astrolabe · V2 <span style={{ color: '#00e5ff', fontSize: 12, letterSpacing: '0.28em' }}>V9 OBSIDIAN</span>
            </h1>
            <div className="flex gap-2">
              <a
                href="/minimal-destiny-astrolabe"
                className="px-3 py-1 rounded text-sm font-semibold bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
              >
                V1
              </a>
              <a
                href="/minimal-destiny-astrolabe-v3"
                className="px-3 py-1 rounded text-sm font-semibold bg-amber-600 text-black hover:bg-amber-500 transition-colors"
              >
                V3
              </a>
              <a
                href="/minimal-destiny-astrolabe-v4"
                className="px-3 py-1 rounded text-sm font-semibold bg-amber-600 text-black hover:bg-amber-500 transition-colors"
              >
                V4
              </a>
            <a
              href="/minimal-destiny-astrolabe-v5"
              className="px-3 py-1 rounded text-sm font-semibold bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
            >
              V5
            </a>
            </div>
          </div>
          <button
            onClick={rollAgain}
            className="px-5 py-2 rounded-full font-bold transition-colors text-sm"
            style={{ background: 'linear-gradient(135deg, #f7dd80, #dfb857 45%, #a05c18)', color: '#1a1208' }}
          >
            Rolla di nuovo
          </button>
        </div>

        <div className="flex-1 mx-6 mb-3 overflow-hidden" style={{ minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <DestinyAstrolabeV2
            ref={astrolabeRef}
            skills={skills}
            config={{ crit: critChance, wound: woundChance, dead: deathChance, mode: forcedVerdict || 'random' }}
            onResolve={handleComplete}
            autoStart
          />
        </div>
      </div>

      <div className="bg-gray-900 text-gray-100 p-6">
        {lastResult && (
          <div className="mb-6 border p-4 rounded-lg" style={{ background: 'rgba(0,229,255,0.06)', borderColor: 'rgba(223,184,87,0.4)' }}>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div><p className="text-xs text-gray-400">Verdict</p><p className="text-lg font-bold" style={{ color: '#f7dd80' }}>{lastResult.verdict.toUpperCase()}</p></div>
              <div><p className="text-xs text-gray-400">Skill</p><p className="text-lg font-bold" style={{ color: '#00e5ff' }}>{lastResult.skillName}</p></div>
              <div><p className="text-xs text-gray-400">D100</p><p className="text-lg font-bold" style={{ color: '#F5F2E8' }}>{lastResult.roll}</p></div>
              <div><p className="text-xs text-gray-400">Soglia</p><p className="text-lg font-bold" style={{ color: '#dfb857' }}>{lastResult.tst}</p></div>
              <div><p className="text-xs text-gray-400">Margine</p><p className="text-lg font-bold" style={{ color: lastResult.delta >= 0 ? '#7bc96f' : '#d98a4a' }}>{lastResult.delta >= 0 ? `+${lastResult.delta}` : lastResult.delta}</p></div>
              <div><p className="text-xs text-gray-400">Status</p><p className="text-lg font-bold">{lastResult.dead ? 'DEAD' : lastResult.wounded ? 'WOUNDED' : 'OK'}</p></div>
            </div>
          </div>
        )}

        <div className="bg-gray-800 p-6 rounded-lg border" style={{ borderColor: 'rgba(223,184,87,0.3)' }}>
          <h2 className="text-xl font-bold mb-4" style={{ color: '#dfb857' }}>⚙️ Configurazione Skill Check</h2>

          <div className="flex flex-wrap items-center gap-3 mb-5">
            <span className="text-sm font-semibold text-gray-300">Numero di skill:</span>
            {[1, 2, 3, 4, 5].map((num) => (
              <button
                key={num}
                onClick={() => setSkills((prev) => Array.from({ length: num }, (_, i) => prev[i] ? { ...prev[i] } : { name: `Skill ${i + 1}`, stat: 60, difficulty: 50 }))}
                className={`w-10 h-10 rounded font-bold transition-colors ${skills.length === num ? 'text-black' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                style={skills.length === num ? { background: '#dfb857' } : undefined}
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
              className="px-3 h-10 rounded font-semibold bg-gray-700 hover:bg-gray-600 transition-colors text-sm"
              style={{ color: '#f7dd80' }}
            >
              ↺ Carica preset
            </button>
          </div>

          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-700">
                  <th className="py-2 pr-4">#</th>
                  <th className="py-2 pr-4">Skill</th>
                  <th className="py-2 pr-4">Stat PG</th>
                  <th className="py-2 pr-4">Check (Difficoltà)</th>
                  <th className="py-2 pr-4">Soglia (TST)</th>
                </tr>
              </thead>
              <tbody>
                {skills.map((skill, idx) => {
                  const tst = Math.max(1, Math.min(99, 50 + (skill.stat - skill.difficulty)));
                  return (
                    <tr key={idx} className="border-b border-gray-700/50">
                      <td className="py-2 pr-4 text-gray-500">{idx + 1}</td>
                      <td className="py-2 pr-4"><input type="text" value={skill.name} onChange={(e) => updateSkill(idx, { name: e.target.value })} className="w-32 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white" /></td>
                      <td className="py-2 pr-4"><input type="number" min={1} max={100} value={skill.stat} onChange={(e) => updateSkill(idx, { stat: Number(e.target.value) })} className="w-20 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white" /></td>
                      <td className="py-2 pr-4"><input type="number" min={1} max={100} value={skill.difficulty} onChange={(e) => updateSkill(idx, { difficulty: Number(e.target.value) })} className="w-20 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white" /></td>
                      <td className="py-2 pr-4 font-bold" style={{ color: '#dfb857' }}>{tst}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-700">
            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-300">Critical Fail % ({critChance})</label>
              <input type="range" min="1" max="20" value={critChance} onChange={(e) => setCritChance(Number(e.target.value))} className="w-full" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-300">Wounded % ({woundChance})</label>
              <input type="range" min="1" max="50" value={woundChance} onChange={(e) => setWoundChance(Number(e.target.value))} className="w-full" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-300">Death % ({deathChance})</label>
              <input type="range" min="1" max="50" value={deathChance} onChange={(e) => setDeathChance(Number(e.target.value))} className="w-full" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-300">Force Verdict</label>
              <select value={forcedVerdict} onChange={(e) => setForcedVerdict(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1">
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
