/**
 * MinimalJobCardPage — Fase 7: JobCard Isolato
 *
 * Pagina di test per il componente JobCard in isolamento.
 * Mostra 4 varianti di job card con stati diversi:
 * - Empty (nessun residente assegnato)
 * - Occupied (1 residente assegnato)
 * - In progress (timer attivo, barra di avanzamento)
 * - Locked (requisiti non soddisfatti)
 *
 * Il job card è la scheda visiva di un'attività lavorativa.
 * Agisce come drop-target per i PgToken dal Roster.
 *
 * Spec: minimal_slice/07_jobcard.md
 * Route: /minimal-jobcard
 */

import React, { useState } from 'react';

// ─── Tipi locali ──────────────────────────────────────────────────────────────

type JobDifficulty = 'easy' | 'medium' | 'hard';
type JobState = 'empty' | 'occupied' | 'in_progress' | 'locked';

interface MockJob {
  id: string;
  name: string;
  icon: string;
  description: string;
  difficulty: JobDifficulty;
  rewards: { gold: number; xp: number; resource?: string };
  durationSeconds: number;
  maxSlots: number;
  requiredLevel?: number;
}

interface JobCardDisplayProps {
  job: MockJob;
  assignedName: string | null;
  progress: number;
  state: JobState;
  onAssign: (jobId: string, residentId: string) => void;
  onCollect?: (jobId: string) => void;
  availableResidentId?: string;
}

// ─── Costanti ─────────────────────────────────────────────────────────────────

const DIFFICULTY_COLORS: Record<JobDifficulty, { bg: string; text: string; label: string }> = {
  easy:   { bg: 'bg-green-900/40',  text: 'text-green-400',  label: 'Facile' },
  medium: { bg: 'bg-yellow-900/40', text: 'text-yellow-400', label: 'Medio' },
  hard:   { bg: 'bg-red-900/40',    text: 'text-red-400',    label: 'Difficile' },
};

const MOCK_JOBS: MockJob[] = [
  {
    id: 'job-woodcutting',
    name: 'Taglio Legna',
    icon: '🪓',
    description: 'Abbatti alberi nella foresta vicina per raccogliere legname.',
    difficulty: 'easy',
    rewards: { gold: 5, xp: 10, resource: '8 legname' },
    durationSeconds: 30,
    maxSlots: 2,
  },
  {
    id: 'job-farming',
    name: 'Coltivazione',
    icon: '🌾',
    description: 'Lavora nei campi per produrre cibo per il villaggio.',
    difficulty: 'easy',
    rewards: { gold: 3, xp: 8, resource: '12 cibo' },
    durationSeconds: 45,
    maxSlots: 3,
  },
  {
    id: 'job-blacksmith',
    name: 'Forgiatura',
    icon: '⚒️',
    description: 'Forgia armi e strumenti nella fucina. Richiede esperienza.',
    difficulty: 'medium',
    rewards: { gold: 15, xp: 25, resource: '3 strumenti' },
    durationSeconds: 60,
    maxSlots: 1,
    requiredLevel: 2,
  },
  {
    id: 'job-alchemy',
    name: 'Alchimia',
    icon: '⚗️',
    description: 'Prepara pozioni e rimedi. Richiede vasta conoscenza.',
    difficulty: 'hard',
    rewards: { gold: 30, xp: 50, resource: '2 pozioni' },
    durationSeconds: 90,
    maxSlots: 1,
    requiredLevel: 4,
  },
];

// ─── JobCard Component ────────────────────────────────────────────────────────

function JobCardDisplay({
  job,
  assignedName,
  progress,
  state,
  onAssign,
  onCollect,
  availableResidentId,
}: JobCardDisplayProps): React.ReactElement {
  const diff = DIFFICULTY_COLORS[job.difficulty];
  const progressPct = Math.round(progress * 100);

  const borderColor =
    state === 'locked'      ? 'border-gray-600'    :
    state === 'in_progress' ? 'border-blue-500'    :
    state === 'occupied'    ? 'border-orange-500'  :
                              'border-dashed border-gray-500';

  const bgColor =
    state === 'locked'      ? 'bg-gray-800/30' :
    state === 'in_progress' ? 'bg-gray-800'    :
    state === 'occupied'    ? 'bg-gray-800'    :
                              'bg-gray-800/50';

  return (
    <div
      className={`rounded-xl border-2 ${borderColor} ${bgColor} p-5 flex flex-col gap-3 transition-all`}
      data-testid={`job-card-${job.id}`}
      data-job-state={state}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="text-3xl" role="img" aria-label={job.name}>{job.icon}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-white text-base" data-testid={`job-name-${job.id}`}>
              {job.name}
            </h3>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${diff.bg} ${diff.text}`}
              data-testid={`job-difficulty-${job.id}`}
            >
              {diff.label}
            </span>
            {state === 'locked' && (
              <span
                className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-400"
                data-testid={`job-locked-badge-${job.id}`}
              >
                🔒 Lv.{job.requiredLevel}+
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{job.description}</p>
        </div>
      </div>

      {/* Rewards */}
      <div className="flex gap-4 text-sm" data-testid={`job-rewards-${job.id}`}>
        <span className="text-yellow-400">💰 {job.rewards.gold}g</span>
        <span className="text-blue-400">⭐ {job.rewards.xp} XP</span>
        {job.rewards.resource && (
          <span className="text-green-400">📦 {job.rewards.resource}</span>
        )}
      </div>

      {/* Slot & assignment */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">
          Slot: {assignedName ? 1 : 0}/{job.maxSlots}
        </span>
        {assignedName && (
          <span
            className="text-xs text-orange-300 bg-orange-900/30 px-2 py-0.5 rounded-full"
            data-testid={`job-assignee-${job.id}`}
          >
            👤 {assignedName}
          </span>
        )}
      </div>

      {/* Progress bar */}
      {state === 'in_progress' && (
        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>In corso...</span>
            <span data-testid={`job-progress-pct-${job.id}`}>{progressPct}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-blue-500 transition-all"
              style={{ width: `${progressPct}%` }}
              data-testid={`job-progress-bar-${job.id}`}
            />
          </div>
        </div>
      )}

      {/* Drop zone */}
      {state === 'empty' && (
        <div
          className="border border-dashed border-gray-600 rounded-lg p-3 text-center text-gray-500 text-xs"
          data-testid={`job-drop-zone-${job.id}`}
        >
          Trascina un personaggio qui
          {availableResidentId && (
            <button
              onClick={() => onAssign(job.id, availableResidentId)}
              className="block mx-auto mt-2 text-xs bg-blue-700 hover:bg-blue-600 text-white px-3 py-1 rounded transition-colors"
              data-testid={`job-assign-btn-${job.id}`}
            >
              Assegna rapido →
            </button>
          )}
        </div>
      )}

      {/* Collect button (ready) */}
      {state === 'in_progress' && progress >= 1 && onCollect && (
        <button
          onClick={() => onCollect(job.id)}
          className="w-full bg-green-600 hover:bg-green-500 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
          data-testid={`job-collect-btn-${job.id}`}
        >
          ✓ Raccolta Risorse
        </button>
      )}

      {/* Locked overlay info */}
      {state === 'locked' && (
        <p className="text-xs text-gray-500 italic">
          Richiede un personaggio di livello {job.requiredLevel}+ per sbloccarsi.
        </p>
      )}
    </div>
  );
}

// ─── Page Component ───────────────────────────────────────────────────────────

export default function MinimalJobCardPage(): React.ReactNode {
  const [assignments, setAssignments] = useState<Record<string, string | null>>({
    'job-woodcutting': null,
    'job-farming': 'Borin Stonefist',
    'job-blacksmith': null,
    'job-alchemy': null,
  });

  const [progress] = useState<Record<string, number>>({
    'job-woodcutting': 0,
    'job-farming': 0.65,
    'job-blacksmith': 0,
    'job-alchemy': 0,
  });

  const getJobState = (jobId: string): JobState => {
    const job = MOCK_JOBS.find((j) => j.id === jobId)!;
    if (job.requiredLevel && job.requiredLevel > 3) return 'locked';
    if (!assignments[jobId]) return 'empty';
    if (progress[jobId] > 0) return 'in_progress';
    return 'occupied';
  };

  const handleAssign = (jobId: string, residentId: string) => {
    setAssignments((prev) => ({ ...prev, [jobId]: residentId }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-6 text-white">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">Fase 7: JobCard Isolato</h1>
          <p className="text-gray-400 text-sm">
            Componente JobCard in 4 stati: vuoto, occupato, in corso, locked.
            Drop-target per PgToken dal Roster.
          </p>
        </div>

        {/* Grid 2x2 */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
          data-testid="job-card-grid"
        >
          {MOCK_JOBS.map((job) => (
            <JobCardDisplay
              key={job.id}
              job={job}
              assignedName={assignments[job.id] ?? null}
              progress={progress[job.id] ?? 0}
              state={getJobState(job.id)}
              onAssign={handleAssign}
              availableResidentId={!assignments[job.id] ? 'Aelin Swiftblade' : undefined}
            />
          ))}
        </div>

        {/* Spec */}
        <div className="mt-8 bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <h3 className="text-sm font-semibold text-gray-400 mb-2">
            📋 Spec Fase 7 (minimal_slice/07_jobcard.md)
          </h3>
          <ul className="text-xs text-gray-500 space-y-1">
            <li>✓ Card rende nome, icona, difficoltà, ricompense</li>
            <li>✓ Stato empty: drop zone visibile con suggerimento</li>
            <li>✓ Stato occupied: badge residente assegnato</li>
            <li>✓ Stato in_progress: barra progresso con percentuale</li>
            <li>✓ Stato locked: badge livello richiesto + testo disabilitato</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
