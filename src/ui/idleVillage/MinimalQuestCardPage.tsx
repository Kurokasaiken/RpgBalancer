/**
 * MinimalQuestCardPage — Fase 8: QuestCard Isolato
 *
 * Pagina di test per il componente QuestCard in isolamento.
 * Mostra 4 varianti di quest card:
 * - Available (vuota, requisiti soddisfatti)
 * - Occupied (residente assegnato, danger rating visibile)
 * - In progress (timer + barra avanzamento + risk stripes)
 * - Locked (livello insufficiente)
 *
 * La quest card è diversa dalla job card perché mostra:
 * - Danger rating (% injury e % death)
 * - Requisiti di stat specifici (es. combat >= 5)
 * - Difficoltà come dangerRating (1–5 stelle)
 *
 * Spec: minimal_slice/08_questcard.md
 * Route: /minimal-questcard
 */

import React, { useState } from 'react';

// ─── Tipi locali ──────────────────────────────────────────────────────────────

type QuestState = 'available' | 'occupied' | 'in_progress' | 'locked';

interface StatRequirement {
  statId: string;
  label: string;
  minValue: number;
}

interface MockQuest {
  id: string;
  name: string;
  icon: string;
  description: string;
  dangerRating: number;
  injuryChance: number;
  deathChance: number;
  rewards: { gold: number; xp: number; items?: string };
  durationSeconds: number;
  maxParticipants: number;
  requiredLevel?: number;
  statRequirements?: StatRequirement[];
}

// ─── Costanti ─────────────────────────────────────────────────────────────────

const DANGER_STARS = (rating: number): string =>
  '⭐'.repeat(Math.min(5, Math.max(0, rating))) + '☆'.repeat(Math.max(0, 5 - rating));

const MOCK_QUESTS: MockQuest[] = [
  {
    id: 'quest-rats',
    name: 'Invasione di Topi',
    icon: '🐀',
    description: 'Sgombera i ratti dal granaio del villaggio. Missione di addestramento per i nuovi arrivati.',
    dangerRating: 1,
    injuryChance: 0.08,
    deathChance: 0.01,
    rewards: { gold: 10, xp: 20 },
    durationSeconds: 20,
    maxParticipants: 2,
    statRequirements: [{ statId: 'combat', label: 'Combattimento', minValue: 1 }],
  },
  {
    id: 'quest-bandit-camp',
    name: 'Campo dei Banditi',
    icon: '⚔️',
    description: 'Infiltrati nel campo dei banditi a est del villaggio e recupera le scorte rubate.',
    dangerRating: 3,
    injuryChance: 0.35,
    deathChance: 0.08,
    rewards: { gold: 45, xp: 80, items: 'Armatura di cuoio' },
    durationSeconds: 60,
    maxParticipants: 3,
    requiredLevel: 2,
    statRequirements: [
      { statId: 'combat', label: 'Combattimento', minValue: 4 },
      { statId: 'mobility', label: 'Mobilità', minValue: 2 },
    ],
  },
  {
    id: 'quest-plague-village',
    name: 'Villaggio Appestato',
    icon: '☠️',
    description: 'Indaga sulla misteriosa malattia che ha decimato il villaggio vicino. Pericolo di contagio.',
    dangerRating: 4,
    injuryChance: 0.55,
    deathChance: 0.18,
    rewards: { gold: 80, xp: 150, items: 'Catalogo di cure rare' },
    durationSeconds: 90,
    maxParticipants: 2,
    requiredLevel: 3,
    statRequirements: [
      { statId: 'vigor', label: 'Vigore', minValue: 5 },
      { statId: 'knowledge', label: 'Conoscenza', minValue: 3 },
    ],
  },
  {
    id: 'quest-dragon',
    name: 'La Caverna del Drago',
    icon: '🐉',
    description: 'La bestia antica si è risvegliata. Solo gli eroi più forti possono affrontarla.',
    dangerRating: 5,
    injuryChance: 0.70,
    deathChance: 0.35,
    rewards: { gold: 300, xp: 500, items: 'Scaglie di drago' },
    durationSeconds: 180,
    maxParticipants: 3,
    requiredLevel: 6,
    statRequirements: [
      { statId: 'combat', label: 'Combattimento', minValue: 10 },
      { statId: 'vigor', label: 'Vigore', minValue: 8 },
    ],
  },
];

const MOCK_RESIDENT = { name: 'Borin Stonefist', level: 2, combat: 5, vigor: 4, mobility: 3, knowledge: 2 };

// ─── QuestCard Component ──────────────────────────────────────────────────────

function QuestCardDisplay({
  quest,
  state,
  assignedName,
  progress,
  onAssign,
}: {
  quest: MockQuest;
  state: QuestState;
  assignedName: string | null;
  progress: number;
  onAssign: (questId: string) => void;
}): React.ReactElement {
  const progressPct = Math.round(progress * 100);

  const checkStatReq = (req: StatRequirement): boolean => {
    return (MOCK_RESIDENT as Record<string, unknown>)[req.statId] as number >= req.minValue;
  };

  const borderColor =
    state === 'locked'      ? 'border-gray-600'   :
    state === 'in_progress' ? 'border-purple-500' :
    state === 'occupied'    ? 'border-orange-400' :
                              'border-amber-600/60';

  const dangerColor =
    quest.dangerRating <= 1 ? 'text-green-400'  :
    quest.dangerRating <= 2 ? 'text-yellow-400' :
    quest.dangerRating <= 3 ? 'text-orange-400' :
                              'text-red-400';

  return (
    <div
      className={`rounded-xl border-2 ${borderColor} bg-gray-800 p-5 flex flex-col gap-3 transition-all`}
      data-testid={`quest-card-${quest.id}`}
      data-quest-state={state}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <span className="text-3xl mt-0.5">{quest.icon}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-white" data-testid={`quest-name-${quest.id}`}>
              {quest.name}
            </h3>
            {state === 'locked' && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-400"
                data-testid={`quest-locked-${quest.id}`}>
                🔒 Lv.{quest.requiredLevel}+
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1">{quest.description}</p>
        </div>
      </div>

      {/* Danger rating */}
      <div className="flex items-center gap-2" data-testid={`quest-danger-${quest.id}`}>
        <span className="text-xs text-gray-400 uppercase tracking-wide">Pericolo</span>
        <span className={`text-sm font-mono ${dangerColor}`}>
          {DANGER_STARS(quest.dangerRating)}
        </span>
      </div>

      {/* Risk indicators */}
      <div className="flex gap-4 text-sm" data-testid={`quest-risks-${quest.id}`}>
        <span className="text-yellow-400">
          🩹 Ferita: {Math.round(quest.injuryChance * 100)}%
        </span>
        {quest.deathChance > 0 && (
          <span className="text-red-400">
            ☠️ Morte: {Math.round(quest.deathChance * 100)}%
          </span>
        )}
      </div>

      {/* Stat requirements */}
      {quest.statRequirements && quest.statRequirements.length > 0 && (
        <div className="space-y-1" data-testid={`quest-stat-reqs-${quest.id}`}>
          {quest.statRequirements.map((req) => {
            const passes = checkStatReq(req);
            return (
              <div key={req.statId} className="flex items-center gap-2 text-xs">
                <span className={passes ? 'text-green-400' : 'text-red-400'}>
                  {passes ? '✓' : '✗'}
                </span>
                <span className="text-gray-300">
                  {req.label} ≥ {req.minValue}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Rewards */}
      <div className="flex gap-4 text-sm" data-testid={`quest-rewards-${quest.id}`}>
        <span className="text-yellow-400">💰 {quest.rewards.gold}g</span>
        <span className="text-blue-400">⭐ {quest.rewards.xp} XP</span>
        {quest.rewards.items && (
          <span className="text-purple-400">📦 {quest.rewards.items}</span>
        )}
      </div>

      {/* Participants */}
      {assignedName && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-orange-300 bg-orange-900/30 px-2 py-0.5 rounded-full"
            data-testid={`quest-assignee-${quest.id}`}>
            👤 {assignedName}
          </span>
          <span className="text-xs text-gray-500">
            1/{quest.maxParticipants}
          </span>
        </div>
      )}

      {/* Progress bar (in_progress) */}
      {state === 'in_progress' && (
        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Missione in corso...</span>
            <span data-testid={`quest-progress-pct-${quest.id}`}>{progressPct}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-purple-500 transition-all"
              style={{ width: `${progressPct}%` }}
              data-testid={`quest-progress-bar-${quest.id}`}
            />
          </div>
        </div>
      )}

      {/* Action */}
      {state === 'available' && (
        <button
          onClick={() => onAssign(quest.id)}
          className="w-full bg-amber-700 hover:bg-amber-600 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
          data-testid={`quest-assign-btn-${quest.id}`}
        >
          Assegna personaggio →
        </button>
      )}
      {state === 'locked' && (
        <p className="text-xs text-gray-500 italic">
          Richiede personaggio di livello {quest.requiredLevel}+.
        </p>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MinimalQuestCardPage(): React.ReactNode {
  const [assignments, setAssignments] = useState<Record<string, string | null>>({
    'quest-rats': null,
    'quest-bandit-camp': MOCK_RESIDENT.name,
    'quest-plague-village': null,
    'quest-dragon': null,
  });
  const [progress] = useState<Record<string, number>>({
    'quest-rats': 0,
    'quest-bandit-camp': 0.42,
    'quest-plague-village': 0,
    'quest-dragon': 0,
  });

  const getState = (questId: string): QuestState => {
    const q = MOCK_QUESTS.find((q) => q.id === questId)!;
    if (q.requiredLevel && q.requiredLevel > MOCK_RESIDENT.level + 1) return 'locked';
    if (!assignments[questId]) return 'available';
    if (progress[questId] > 0) return 'in_progress';
    return 'occupied';
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6 text-white">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">Fase 8: QuestCard Isolato</h1>
          <p className="text-gray-400 text-sm">
            Componente QuestCard con danger rating, requisiti stat, risk indicators (ferita/morte).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-testid="quest-card-grid">
          {MOCK_QUESTS.map((quest) => (
            <QuestCardDisplay
              key={quest.id}
              quest={quest}
              state={getState(quest.id)}
              assignedName={assignments[quest.id] ?? null}
              progress={progress[quest.id] ?? 0}
              onAssign={(qid) =>
                setAssignments((prev) => ({ ...prev, [qid]: MOCK_RESIDENT.name }))
              }
            />
          ))}
        </div>

        <div className="mt-8 bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <h3 className="text-sm font-semibold text-gray-400 mb-2">
            📋 Spec Fase 8 (minimal_slice/08_questcard.md)
          </h3>
          <ul className="text-xs text-gray-500 space-y-1">
            <li>✓ Danger rating (1–5 stelle) con colore proporzionale al rischio</li>
            <li>✓ % Ferita e % Morte sempre visibili</li>
            <li>✓ Requisiti stat con check pass/fail per residente corrente</li>
            <li>✓ Ricompense: gold, XP, item speciali</li>
            <li>✓ 4 stati: available, occupied, in_progress, locked</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
