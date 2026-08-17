/**
 * Test hub della V5 — il reliquiario.
 *
 * Differenza sostanziale rispetto agli hub V1..V4: la V5 non riempie il
 * viewport. È una SCATOLA di dimensione dichiarata, e la pagina serve proprio a
 * verificarne la leggibilità a misure diverse — è il "test del 25%". Il
 * selettore di preset (quest card / pannello / minimo / gigante) è quindi il
 * controllo più importante della pagina, non un accessorio.
 */
import React, { useMemo, useRef, useState } from 'react';
import {
  DestinyAstrolabeV5,
  type DestinyAstrolabeV5Handle,
} from '../ui/idleVillage/components/destinyAstrolabeV5/DestinyAstrolabeV5';
import type { AstrolabeV5Result } from '../ui/idleVillage/components/destinyAstrolabeV5/engineV5';
import { astrolabeV5Config } from '@/balancing/config/idleVillage/destinyAstrolabeV5/astrolabeV5Config';

interface StatRow {
  name: string;
  stat: number;
  difficulty: number;
}

const DEFAULT_STATS: StatRow[] = [
  { name: 'Atletica', stat: 78, difficulty: 50 },
  { name: 'Astuzia', stat: 62, difficulty: 50 },
  { name: 'Vigore', stat: 41, difficulty: 50 },
];

/** Le misure reali in cui il componente dovrà vivere. */
const SIZE_PRESETS = [
  { id: 'quest', label: 'Quest card', px: 380 },
  { id: 'panel', label: 'Pannello', px: 300 },
  { id: 'tight', label: 'Stretto', px: 250 },
  { id: 'glyph', label: 'Minimo', px: 190 },
  { id: 'large', label: 'Grande', px: 560 },
] as const;

export default function MinimalDestinyAstrolabeV5Page() {
  const astroRef = useRef<DestinyAstrolabeV5Handle>(null);
  const [lastResult, setLastResult] = useState<AstrolabeV5Result | null>(null);

  const [skillCount, setSkillCount] = useState(3);
  const [stats, setStats] = useState<StatRow[]>(DEFAULT_STATS);
  const [difficulty, setDifficulty] = useState(50);
  const [critPct, setCritPct] = useState(5);
  const [woundPct, setWoundPct] = useState(10);
  const [deathPct, setDeathPct] = useState(5);

  const [sizePx, setSizePx] = useState<number>(380);
  const [arenaFraction, setArenaFraction] = useState(astrolabeV5Config.arenaRadiusFraction);
  const [perAxisDifficulty, setPerAxisDifficulty] = useState(false);
  const [riskDeclaredAtArm, setRiskDeclaredAtArm] = useState(true);
  const [fractureEnabled, setFractureEnabled] = useState(true);

  const skills = useMemo(
    () => stats.slice(0, skillCount).map((s) => ({ ...s, difficulty: perAxisDifficulty ? s.difficulty : difficulty })),
    [stats, skillCount, difficulty, perAxisDifficulty],
  );

  const num = (
    v: number,
    set: (n: number) => void,
    min = 0,
    max = 99,
    step = 1,
  ) => (
    <input
      type="number"
      value={v}
      min={min}
      max={max}
      step={step}
      onChange={(e) =>
        set(Math.max(min, Math.min(max, Number.isFinite(e.target.valueAsNumber) ? e.target.valueAsNumber : min)))
      }
      className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm"
    />
  );

  const link = (href: string, label: string, active = false) => (
    <a
      key={href}
      href={href}
      className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${
        active ? 'bg-amber-500 text-black' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
      }`}
    >
      {label}
    </a>
  );

  return (
    <div
      className="bg-gray-900 text-gray-100"
      style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
    >
      <div className="flex items-center justify-between px-6 py-3 flex-shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-amber-400">Destiny Astrolabe · V5</h1>
          <div className="flex gap-2">
            {link('/minimal-destiny-astrolabe', 'V1')}
            {link('/minimal-destiny-astrolabe-v2', 'V2')}
            {link('/minimal-destiny-astrolabe-v3', 'V3')}
            {link('/minimal-destiny-astrolabe-v4', 'V4')}
            {link('/minimal-destiny-astrolabe-v5', 'V5', true)}
          </div>
        </div>
        {lastResult && (
          <div className="text-sm text-gray-300">
            roll <span className="text-amber-300 font-bold">{lastResult.outcome.roll}</span> · zona{' '}
            <span className="text-amber-300 font-bold">{lastResult.zone}</span>
            {lastResult.outcome.nearMiss && <span className="text-orange-400"> · per un soffio</span>}
            {lastResult.outcome.crit && <span className="text-gray-400"> · rovina</span>}
            <span className="text-gray-500"> · rischio d100 {lastResult.outcome.riskRoll}</span>
            {lastResult.outcome.wounded && <span className="text-red-400"> · ferito</span>}
            {lastResult.outcome.dead && <span className="text-purple-400"> · caduto</span>}
          </div>
        )}
      </div>

      {/* la scatola NON riempie il viewport: è centrata alla sua misura vera */}
      <div
        className="flex-1 overflow-auto flex items-center justify-center p-4"
        style={{ minHeight: 0 }}
      >
        <div style={{ width: sizePx }}>
          <DestinyAstrolabeV5
            key={`${sizePx}-${arenaFraction}-${perAxisDifficulty}-${riskDeclaredAtArm}-${fractureEnabled}`}
            ref={astroRef}
            skills={skills}
            difficulty={difficulty}
            critPct={critPct}
            woundPct={woundPct}
            deathPct={deathPct}
            config={{
              arenaRadiusFraction: arenaFraction,
              perAxisDifficultyEnabled: perAxisDifficulty,
              riskDeclaredAtArm,
              fractureEnabled,
            }}
            onResolve={setLastResult}
          />
        </div>
      </div>

      <div className="p-4 flex-shrink-0 overflow-auto" style={{ maxHeight: '38vh' }}>
        <div className="bg-gray-800 p-4 rounded-lg border border-amber-600/30 grid gap-4 md:grid-cols-3">
          {/* ── misura: il controllo più importante della pagina ── */}
          <div>
            <h2 className="text-sm font-bold text-amber-400 mb-2">📐 Misura della scatola</h2>
            <div className="flex flex-wrap gap-2 mb-3">
              {SIZE_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSizePx(p.px)}
                  className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
                    sizePx === p.px ? 'bg-amber-500 text-black' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {p.label}
                  <span className="opacity-60"> {p.px}</span>
                </button>
              ))}
            </div>
            <label className="block text-xs font-semibold mb-1 text-gray-300">
              Larghezza ({sizePx}px)
            </label>
            <input
              type="range"
              min={180}
              max={720}
              step={10}
              value={sizePx}
              onChange={(e) => setSizePx(Number(e.target.value))}
              className="w-full"
            />

            <label className="block text-xs font-semibold mt-3 mb-1 text-gray-300">
              Raggio del fiore ({arenaFraction.toFixed(2)}) — 0.44 = parità V3
            </label>
            <input
              type="range"
              min={0.25}
              max={0.5}
              step={0.01}
              value={arenaFraction}
              onChange={(e) => setArenaFraction(Number(e.target.value))}
              className="w-full"
            />
            <p className="text-[10px] text-gray-500 mt-1">
              Più basso = più spazio ai monoliti graduati. Più alto = fiore più grande.
            </p>
          </div>

          {/* ── regole ── */}
          <div>
            <h2 className="text-sm font-bold text-amber-400 mb-2">⚙️ Regole</h2>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-300">N. Skill</label>
                {num(skillCount, setSkillCount, 1, 5)}
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-300">Difficoltà</label>
                {num(difficulty, setDifficulty, 1, 99)}
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-300">Crit %</label>
                {num(critPct, setCritPct, 0, 60)}
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-300">Ferita %</label>
                {num(woundPct, setWoundPct, 0, 60)}
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-300">Morte %</label>
                {num(deathPct, setDeathPct, 0, 60)}
              </div>
            </div>

            <div className="mt-3 space-y-1">
              <label className="flex items-center gap-2 text-xs text-gray-300">
                <input
                  type="checkbox"
                  checked={perAxisDifficulty}
                  onChange={(e) => setPerAxisDifficulty(e.target.checked)}
                />
                Difficoltà per asse
              </label>
              <label className="flex items-center gap-2 text-xs text-gray-300">
                <input
                  type="checkbox"
                  checked={riskDeclaredAtArm}
                  onChange={(e) => setRiskDeclaredAtArm(e.target.checked)}
                />
                Rischio dichiarato prima del tiro
              </label>
              <label className="flex items-center gap-2 text-xs text-gray-300">
                <input
                  type="checkbox"
                  checked={fractureEnabled}
                  onChange={(e) => setFractureEnabled(e.target.checked)}
                />
                Terremoto attivo
              </label>
            </div>
          </div>

          {/* ── stat per asse ── */}
          <div>
            <h2 className="text-sm font-bold text-amber-400 mb-2">🎯 Assi</h2>
            <div className="space-y-2">
              {stats.slice(0, skillCount).map((s, i) => (
                <div key={i} className="grid grid-cols-[1fr_64px_64px] gap-2 items-center">
                  <input
                    type="text"
                    value={s.name}
                    onChange={(e) =>
                      setStats((prev) => prev.map((p, j) => (j === i ? { ...p, name: e.target.value } : p)))
                    }
                    className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm"
                  />
                  {num(
                    s.stat,
                    (n) => setStats((prev) => prev.map((p, j) => (j === i ? { ...p, stat: n } : p))),
                    1,
                    99,
                  )}
                  {num(
                    s.difficulty,
                    (n) => setStats((prev) => prev.map((p, j) => (j === i ? { ...p, difficulty: n } : p))),
                    1,
                    99,
                  )}
                </div>
              ))}
              <p className="text-[10px] text-gray-500">
                Colonne: nome · stat · difficoltà (usata solo con «Difficoltà per asse»).
              </p>
            </div>

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => astroRef.current?.roll()}
                className="px-3 py-1 rounded text-xs font-semibold bg-gray-700 text-gray-200 hover:bg-gray-600"
              >
                Ricarica
              </button>
              <button
                type="button"
                onClick={() => astroRef.current?.throw()}
                className="px-3 py-1 rounded text-xs font-semibold bg-amber-500 text-black hover:bg-amber-400"
              >
                Tira
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
