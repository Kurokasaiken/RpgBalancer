/**
 * MinimalSkillCheckPage — Fase 9: SkillCheckPanel Isolato
 *
 * Pagina di test per il SkillCheckPanel stile "Dispatch":
 * - Cerchio centrale con 3 zone: safe (scuro), injury (giallo), death (rosso)
 * - Le proporzioni derivano da injuryChance e deathChance della quest
 * - Mostra percentuali e simboli per ogni zona
 * - Simulazione del tiro: anima un punto che cade in una zona
 * - Esito: safe / injury / death con colore relativo
 *
 * Questo è il momento critico del FTUE (§6 del piano FTUE):
 * il rischio diventa VISIVO e PERCEPIBILE prima ancora del tiro.
 *
 * Spec: minimal_slice/09_skillcheck.md
 * Route: /minimal-skillcheck
 * Allineato: idle_village_ftue_plan.md § 6.4
 */

import React, { useState, useCallback } from 'react';

// ─── Tipi locali ──────────────────────────────────────────────────────────────

type SkillCheckOutcome = 'safe' | 'injury' | 'death';
type SkillCheckState = 'pending' | 'rolling' | 'resolved';

interface SkillCheckConfig {
  questName: string;
  questIcon: string;
  residentName: string;
  injuryChance: number;
  deathChance: number;
  safeBonus: string;
  injuryPenalty: string;
}

// ─── Costanti ──────────────────────────────────────────────────────────────────

const MOCK_CHECKS: SkillCheckConfig[] = [
  {
    questName: 'Invasione di Topi',
    questIcon: '🐀',
    residentName: 'Aelin Swiftblade (Lv.2)',
    injuryChance: 0.08,
    deathChance: 0.01,
    safeBonus: 'Torna con 20g e 20 XP',
    injuryPenalty: 'Ferita lieve (–15% efficacia per 1 giorno)',
  },
  {
    questName: 'Campo dei Banditi',
    questIcon: '⚔️',
    residentName: 'Borin Stonefist (Lv.3)',
    injuryChance: 0.35,
    deathChance: 0.08,
    safeBonus: 'Torna con 45g, 80 XP + Armatura',
    injuryPenalty: 'Ferita grave (–30% efficacia per 2 giorni)',
  },
  {
    questName: 'Villaggio Appestato',
    questIcon: '☠️',
    residentName: 'Theron the Wise (Lv.4)',
    injuryChance: 0.55,
    deathChance: 0.18,
    safeBonus: 'Torna con 80g, 150 XP + Catalogo',
    injuryPenalty: 'Malattia (–50% efficacia per 3 giorni)',
  },
];

// ─── Cerchio Dispatch-style ───────────────────────────────────────────────────

function DispatchCircle({
  safeChance,
  injuryChance,
  deathChance,
  outcome,
  state,
}: {
  safeChance: number;
  injuryChance: number;
  deathChance: number;
  outcome: SkillCheckOutcome | null;
  state: SkillCheckState;
}): React.ReactElement {
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const r = 80;
  const circumference = 2 * Math.PI * r;

  const safeArc = safeChance * circumference;
  const injuryArc = injuryChance * circumference;
  const deathArc = deathChance * circumference;

  const safeOffset = 0;
  const injuryOffset = safeArc;
  const deathOffset = safeArc + injuryArc;

  const glowColor =
    outcome === 'safe'   ? '#22c55e' :
    outcome === 'injury' ? '#facc15' :
    outcome === 'death'  ? '#ef4444' :
                           'transparent';

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Base circle */}
        <circle cx={cx} cy={cy} r={r} fill="#1f2937" stroke="#374151" strokeWidth={2} />

        {/* Safe zone (green) */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="#166534"
          strokeWidth={24}
          strokeDasharray={`${safeArc} ${circumference - safeArc}`}
          strokeDashoffset={-safeOffset}
          data-testid="skillcheck-safe-arc"
        />
        {/* Injury zone (yellow) */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="#854d0e"
          strokeWidth={24}
          strokeDasharray={`${injuryArc} ${circumference - injuryArc}`}
          strokeDashoffset={-injuryOffset}
          data-testid="skillcheck-injury-arc"
        />
        {/* Death zone (red) */}
        {deathArc > 0 && (
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke="#7f1d1d"
            strokeWidth={24}
            strokeDasharray={`${deathArc} ${circumference - deathArc}`}
            strokeDashoffset={-deathOffset}
            data-testid="skillcheck-death-arc"
          />
        )}

        {/* Glow on resolved */}
        {outcome && (
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={glowColor}
            strokeWidth={4}
            opacity={0.6}
            strokeDasharray="4 8"
          />
        )}
      </svg>

      {/* Center label */}
      <div className="absolute flex flex-col items-center" style={{ transform: 'rotate(0deg)' }}>
        {state === 'pending' && (
          <span className="text-3xl">🎯</span>
        )}
        {state === 'rolling' && (
          <span className="text-3xl animate-spin">🎲</span>
        )}
        {outcome === 'safe' && (
          <>
            <span className="text-3xl">✅</span>
            <span className="text-xs text-green-400 mt-1 font-bold">SALVO</span>
          </>
        )}
        {outcome === 'injury' && (
          <>
            <span className="text-3xl">🩹</span>
            <span className="text-xs text-yellow-400 mt-1 font-bold">FERITO</span>
          </>
        )}
        {outcome === 'death' && (
          <>
            <span className="text-3xl">💀</span>
            <span className="text-xs text-red-400 mt-1 font-bold">MORTO</span>
          </>
        )}
      </div>
    </div>
  );
}

// ─── SkillCheckPanel ──────────────────────────────────────────────────────────

function SkillCheckPanel({
  check,
  onRoll,
  onReset,
}: {
  check: SkillCheckConfig;
  onRoll: (check: SkillCheckConfig) => { outcome: SkillCheckOutcome };
  onReset: () => void;
}): React.ReactElement {
  const [state, setState] = useState<SkillCheckState>('pending');
  const [outcome, setOutcome] = useState<SkillCheckOutcome | null>(null);

  const safeChance = 1 - check.injuryChance - check.deathChance;

  const handleRoll = useCallback(() => {
    setState('rolling');
    setTimeout(() => {
      const result = onRoll(check);
      setOutcome(result.outcome);
      setState('resolved');
    }, 800);
  }, [check, onRoll]);

  const handleReset = () => {
    setState('pending');
    setOutcome(null);
    onReset();
  };

  const outcomeColor =
    outcome === 'safe'   ? 'text-green-400'  :
    outcome === 'injury' ? 'text-yellow-400' :
    outcome === 'death'  ? 'text-red-400'    :
                           'text-gray-300';

  const outcomeMessage =
    outcome === 'safe'   ? check.safeBonus      :
    outcome === 'injury' ? check.injuryPenalty  :
    outcome === 'death'  ? '💀 Il personaggio è caduto in battaglia.' :
                           '';

  return (
    <div
      className="bg-gray-800 rounded-xl border border-gray-700 p-6 flex flex-col items-center gap-5"
      data-testid="skillcheck-panel"
    >
      {/* Quest info */}
      <div className="text-center">
        <div className="text-2xl mb-1">{check.questIcon}</div>
        <h3 className="font-bold text-white text-base" data-testid="skillcheck-quest-name">
          {check.questName}
        </h3>
        <p className="text-xs text-gray-400 mt-0.5" data-testid="skillcheck-resident-name">
          👤 {check.residentName}
        </p>
      </div>

      {/* Dispatch circle */}
      <DispatchCircle
        safeChance={safeChance}
        injuryChance={check.injuryChance}
        deathChance={check.deathChance}
        outcome={outcome}
        state={state}
      />

      {/* Legend */}
      <div className="flex gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-800 border border-green-600" />
          <span className="text-green-400" data-testid="skillcheck-safe-pct">
            Salvo {Math.round(safeChance * 100)}%
          </span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-yellow-800 border border-yellow-600" />
          <span className="text-yellow-400" data-testid="skillcheck-injury-pct">
            🩹 {Math.round(check.injuryChance * 100)}%
          </span>
        </div>
        {check.deathChance > 0 && (
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-900 border border-red-600" />
            <span className="text-red-400" data-testid="skillcheck-death-pct">
              ☠️ {Math.round(check.deathChance * 100)}%
            </span>
          </div>
        )}
      </div>

      {/* Outcome message */}
      {outcome && (
        <div
          className={`text-center text-sm ${outcomeColor} bg-gray-700/50 rounded-lg p-3 w-full`}
          data-testid="skillcheck-outcome-message"
        >
          {outcomeMessage}
        </div>
      )}

      {/* Action button */}
      {state !== 'resolved' ? (
        <button
          onClick={handleRoll}
          disabled={state === 'rolling'}
          className="w-full bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors"
          data-testid="skillcheck-roll-btn"
        >
          {state === 'rolling' ? 'Risoluzione...' : '🎲 Esegui Skill Check'}
        </button>
      ) : (
        <button
          onClick={handleReset}
          className="w-full bg-gray-600 hover:bg-gray-500 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
          data-testid="skillcheck-reset-btn"
        >
          ↩ Ripeti
        </button>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function rollOutcome(check: SkillCheckConfig): { outcome: SkillCheckOutcome } {
  const rng = Math.random();
  if (rng < check.deathChance) return { outcome: 'death' };
  if (rng < check.deathChance + check.injuryChance) return { outcome: 'injury' };
  return { outcome: 'safe' };
}

export default function MinimalSkillCheckPage(): React.ReactNode {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [resetKey, setResetKey] = useState(0);

  return (
    <div className="min-h-screen bg-gray-900 p-6 text-white">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">Fase 9: SkillCheck Dispatch-Style</h1>
          <p className="text-gray-400 text-sm">
            Il cerchio mostra visualmente la distribuzione del rischio.
            Premi il tasto per simulare il tiro.
          </p>
        </div>

        {/* Quest selector */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {MOCK_CHECKS.map((c, i) => (
            <button
              key={i}
              onClick={() => { setSelectedIdx(i); setResetKey((k) => k + 1); }}
              className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                i === selectedIdx
                  ? 'bg-amber-700 border-amber-500 text-white'
                  : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-400'
              }`}
              data-testid={`skillcheck-quest-selector-${i}`}
            >
              {c.questIcon} {c.questName}
            </button>
          ))}
        </div>

        {/* Panel */}
        <div className="flex justify-center">
          <div className="w-full max-w-sm">
            <SkillCheckPanel
              key={resetKey}
              check={MOCK_CHECKS[selectedIdx]}
              onRoll={rollOutcome}
              onReset={() => {}}
            />
          </div>
        </div>

        {/* Spec */}
        <div className="mt-8 bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <h3 className="text-sm font-semibold text-gray-400 mb-2">
            📋 Spec Fase 9 (minimal_slice/09_skillcheck.md)
          </h3>
          <ul className="text-xs text-gray-500 space-y-1">
            <li>✓ Cerchio con 3 zone: safe (verde), injury (giallo), death (rosso)</li>
            <li>✓ Proporzioni derivate da injuryChance / deathChance della quest</li>
            <li>✓ Percentuali leggibili accanto al cerchio (legenda)</li>
            <li>✓ Animazione di risoluzione (spinner 800ms)</li>
            <li>✓ Esito visivo nel centro del cerchio con messaggio conseguenza</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
