/**
 * Minimal Destiny Astrolabe Test Page
 * Tests the reusable DestinyAstrolabeV10Component with various configurations
 */

import React, { useRef, useState } from 'react';
import { DestinyAstrolabeV10Standalone } from '@/ui/idleVillage/frozen/kits/destinyAstrolabeV10Kit';
import type { AstrolabeResult as DestinyAstrolabeV10Result, AstrolabeSkill as DestinyAstrolabeV10Skill, DestinyAstrolabeV10Handle } from '@/ui/idleVillage/frozen/kits/destinyAstrolabeV10Kit';

/**
 * Glifo per skill. Il progetto non ha ancora un set di icone per le skill
 * (`public/assets/icons` contiene solo icone app), quindi qui sta una mappa
 * nome → glifo, sostituibile con veri asset senza toccare il resto.
 */
const SKILL_GLYPHS: Record<string, string> = {
  Atletica: '⤴',
  Destrezza: '✦',
  Forza: '⬢',
  Intelletto: '◈',
  Carisma: '☼',
};
const glyphFor = (name: string) => SKILL_GLYPHS[name] ?? '◈';

const SKILL_PRESETS = {
  hard: [{ name: 'Atletica', stat: 30, difficulty: 80 }],
  single: [{ name: 'Atletica', stat: 85, difficulty: 50 }],
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

export default function MinimalDestinyAstrolabeV10() {
  const astrolabeRef = useRef<DestinyAstrolabeV10Handle>(null);
  const [lastResult, setLastResult] = useState<DestinyAstrolabeV10Result | null>(null);
  const [skills, setSkills] = useState<DestinyAstrolabeV10Skill[]>(SKILL_PRESETS.single);
  const [critChance, setCritChance] = useState(5);
  const [woundChance, setWoundChance] = useState(10);
  const [deathChance, setDeathChance] = useState(5);
  const [forcedVerdict, setForcedVerdict] = useState<string>('');
  const [forcedRisk, setForcedRisk] = useState<string>('');

  const handleComplete = (result: DestinyAstrolabeV10Result) => {
    setLastResult(result);
    console.log('Skill check completed:', result);
  };

  const updateSkill = (idx: number, patch: Partial<DestinyAstrolabeV10Skill>) => {
    setSkills((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };

  const rollAgain = () => {
    setLastResult(null);
    astrolabeRef.current?.roll();
  };

  return (
    <>
      <div className="bg-gray-900 text-gray-100" style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header bar */}
      <div className="flex items-center justify-between px-6 py-3 flex-shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-amber-400">Destiny Astrolabe — Test Hub</h1>
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
            <a
              href="/minimal-destiny-astrolabe-v6"
              className="px-3 py-1 rounded text-sm font-semibold bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
            >
              V6
            </a>
            <a href="/minimal-destiny-astrolabe-v7" className="px-3 py-1 rounded text-sm font-semibold bg-amber-600 text-black hover:bg-amber-500 transition-colors">V7</a>
            <span className="px-3 py-1 rounded text-sm font-semibold bg-amber-500 text-black">V10</span>
            <a
              href="/minimal-destiny-astrolabe-v8"
              className="px-3 py-1 rounded text-sm font-semibold bg-amber-600 text-black hover:bg-amber-500 transition-colors"
            >
              V8
            </a>
            <a
              href="/minimal-destiny-astrolabe-v9"
              className="px-3 py-1 rounded text-sm font-semibold bg-amber-600 text-black hover:bg-amber-500 transition-colors"
            >
              V9
            </a>
            <a
              href="/minimal-skillcheck-v6"
              className="px-3 py-1 rounded text-sm font-semibold bg-indigo-700 text-indigo-100 hover:bg-indigo-600 transition-colors"
              title="AltVisuals V6 · Asterism (Skill Check Preview Lab)"
            >
              Asterism V6
            </a>
          </div>
        </div>
        <button
          onClick={rollAgain}
          className="px-5 py-2 rounded-full font-bold transition-colors text-sm"
          style={{ background: 'linear-gradient(135deg, #e4b048, #a05c18)', color: '#2a1606' }}
        >
          Rolla di nuovo
        </button>
      </div>

      {/* Skill in prova — FUORI dal board: solo il glifo, il nome resta nel tooltip */}
      <div className="flex items-center justify-center gap-3 pb-2 flex-shrink-0">
        {skills.map((skill, i) => {
          const tst = Math.max(1, Math.min(99, 50 + (skill.stat - skill.difficulty)));
          return (
            <div
              key={i}
              title={`${skill.name} — stat ${skill.stat} vs difficoltà ${skill.difficulty}`}
              aria-label={`${skill.name}, soglia ${tst}`}
              className="flex items-center gap-2 px-3 py-1 rounded-full border border-amber-700/40 bg-black/40"
            >
              <span className="text-lg leading-none text-amber-300">{glyphFor(skill.name)}</span>
              <span className="text-sm font-bold text-amber-100 tabular-nums">{tst}</span>
            </div>
          );
        })}
      </div>

      {/* Astrolabe — fills remaining height, clipping the suite's 100vw/100vh overflow */}
      <div className="flex-1 border-2 border-amber-600 rounded-lg mx-6 mb-3 overflow-hidden" style={{ minHeight: 0 }}>
        <DestinyAstrolabeV10Standalone
          ref={astrolabeRef}
          skills={skills}
          config={{
            crit: critChance,
            wound: woundChance,
            dead: deathChance,
            mode: forcedVerdict || 'random',
            forceRisk: forcedRisk || undefined,
          }}
          onResolve={handleComplete}
          autoStart
        />
      </div>
    </div>

    {/* ── Scrollable section below the fold ── */}
    <div className="bg-gray-900 text-gray-100 p-6">
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
                {lastResult.dead ? 'DEAD' : lastResult.wounded ? 'WOUNDED' : 'OK'}
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
          <button
            onClick={() => setSkills(SKILL_PRESETS.hard.map((s) => ({ ...s })))}
            className="px-3 h-10 rounded font-semibold bg-red-900 text-red-300 hover:bg-red-800 transition-colors text-sm"
            title="Stat 30 / Difficoltà 80 → forza SCONFITTA"
          >
            ⚡ HARD (forza fail)
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
          <div>
            {/* il rischio pesa il 15% fra ferita e morte: senza un modo di
                chiamarlo, il beat del terremoto si collauda per tentativi */}
            <label className="block text-xs font-semibold mb-1 text-gray-300">Force Risk (terremoto)</label>
            <select value={forcedRisk} onChange={(e) => setForcedRisk(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1">
              <option value="">Random</option>
              <option value="none">Nessuno</option>
              <option value="wound">Ferita — la fenditura si chiude</option>
              <option value="death">Morte — lo spacco resta aperto</option>
            </select>
          </div>
        </div>
      </div>

      {/* ════════ BOARD SHAPE EXAMPLE — circle + star ════════ */}
      <div className="bg-gray-800 p-6 rounded-lg border border-amber-600/30 mt-6">
        <h2 className="text-xl font-bold text-amber-400 mb-4">Example D100 Board (circle = SKILL, star = CHECK)</h2>
        <div className="flex flex-col md:flex-row items-start gap-8">
          <img
            src="/example-circle-star.svg"
            alt="D100 board example: circle = SKILL, star = CHECK"
            className="w-full max-w-sm rounded-lg block"
          />
          <ul className="text-sm space-y-2 mt-2 md:mt-0">
            <li><span className="inline-block w-3 h-3 rounded-full mr-2" style={{ background: '#000' }} />Black lines = <b>5 stat axes</b> (length = stat value, drawn on top)</li>
            <li><span className="inline-block w-3 h-3 rounded-full mr-2" style={{ background: '#fdd97b' }} />Gold star = <b>win</b> (tips touch boundary at parity)</li>
            <li><span className="inline-block w-3 h-3 rounded-full mr-2" style={{ background: '#b08035' }} />Bronze stroke = <b>almost</b> (fixed %, border of the star)</li>
            <li><span className="inline-block w-3 h-3 rounded-full mr-2" style={{ background: '#fff' }} />White dot = <b>bigwin</b> (center)</li>
            <li><span className="inline-block w-3 h-3 rounded-full mr-2" style={{ background: '#5a6bff' }} />Indigo ring = <b>fail</b></li>
            <li><span className="inline-block w-3 h-3 rounded-full mr-2" style={{ background: '#9e2b20' }} />Crimson ring = <b>epicfail</b> (inner rim)</li>
            <li><span className="inline-block w-3 h-3 rounded-full mr-2" style={{ background: '#ff3df0' }} />Magenta band = <b>wounded</b> (cross-cutting)</li>
            <li><span className="inline-block w-3 h-3 rounded-full mr-2" style={{ background: '#02020b' }} />Black band = <b>dead</b> (cross-cutting)</li>
            <li><span className="inline-block w-3 h-3 rounded-full mr-2" style={{ background: '#3fa9f5' }} />Cyan dot = <b>dice ball</b></li>
          </ul>
        </div>
      </div>
    </div>
    </>
  );
}
