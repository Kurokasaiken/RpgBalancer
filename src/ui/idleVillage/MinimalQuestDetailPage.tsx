/**
 * MinimalQuestDetailPage — Quest info brief, no roster/slot assignment.
 *
 * Mostra le informazioni di una quest (nome, difficoltà, fasi, requisiti,
 * ricompense) con la QuestCard canonica. Nessun roster, nessun slot rack,
 * nessun drag/drop. Il flusso di assegnazione party avviene in
 * /poi-quest-detail-roster-integration.
 *
 * Route: /minimal-quest-detail
 */

import type { JSX } from 'react';
import { useState, useMemo } from 'react';
import { defaultQuestBlueprints } from '@/balancing/config/idleVillage/quests/questBlueprints';
import type { QuestBlueprint, QuestPhase } from '@/balancing/config/idleVillage/quests/questBlueprints.schema';
import { DEFAULT_IDLE_VILLAGE_CONFIG } from '@/balancing/config/idleVillage/defaultConfig';
import { QuestCard } from '@/ui/idleVillage/map/actionCards/wrappers/QuestCard';
import { SkinSystemProvider } from '@/ui/idleVillage/hooks/useSkinSystem';
import { SandboxTimingProvider } from '@/ui/idleVillage/hooks/useSandboxTimingBridge';

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'Facile',
  medium: 'Medio',
  hard: 'Difficile',
  dangerous: 'Pericoloso',
  deadly: 'Letale',
};

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'text-emerald-300 border-emerald-700/50',
  medium: 'text-sky-300 border-sky-700/50',
  hard: 'text-amber-300 border-amber-700/50',
  dangerous: 'text-orange-300 border-orange-700/50',
  deadly: 'text-rose-300 border-rose-700/50',
};

function PhaseRow({ phase, index }: { phase: QuestPhase; index: number }) {
  const typeIcon =
    phase.type === 'combat' ? '⚔' :
    phase.type === 'exploration' ? '🌿' :
    phase.type === 'check' ? '🔍' :
    phase.type === 'negotiation' ? '💬' : '•';

  const req = (phase.requirements as Record<string, unknown> | undefined);
  const statReq = req?.['statRequirement'] as { label?: string; allOf?: string[]; anyOf?: string[] } | undefined;
  const reqLabel = statReq?.label ?? (statReq?.allOf ?? statReq?.anyOf ?? []).join(', ');

  return (
    <div className="flex items-start gap-3 rounded border border-slate-800/50 bg-slate-900/40 px-3 py-2.5">
      <span className="mt-0.5 text-base leading-none">{typeIcon}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-[9px] font-mono text-slate-500">{String(index + 1).padStart(2, '0')}</span>
          <span className="text-xs font-semibold text-slate-200">{phase.title}</span>
          <span className="ml-auto text-[9px] uppercase tracking-wide text-slate-500">
            {phase.durationValue} {phase.durationUnits}
          </span>
        </div>
        {reqLabel && (
          <p className="mt-0.5 text-[10px] text-slate-500">
            Requisito: <span className="text-slate-400">{reqLabel}</span>
          </p>
        )}
        {phase.successEffects?.notes && (
          <p className="mt-0.5 text-[10px] italic text-slate-600">{phase.successEffects.notes}</p>
        )}
      </div>
    </div>
  );
}

function RewardChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-amber-800/40 bg-amber-950/20 px-3 py-2 text-center">
      <p className="text-[9px] uppercase tracking-wide text-amber-500/70">{label}</p>
      <p className="text-sm font-semibold text-amber-200">×{value}</p>
    </div>
  );
}

const BLUEPRINTS = Object.values(defaultQuestBlueprints);

export default function MinimalQuestDetailPage(): JSX.Element {
  const [selectedId, setSelectedId] = useState<string>(BLUEPRINTS[0]?.id ?? '');

  const blueprint = useMemo<QuestBlueprint | undefined>(
    () => BLUEPRINTS.find((b) => b.id === selectedId),
    [selectedId],
  );

  const activity = blueprint
    ? DEFAULT_IDLE_VILLAGE_CONFIG.activities[blueprint.activityId]
    : undefined;

  const difficultyKey = blueprint?.difficulty ?? 'medium';
  const difficultyColor = DIFFICULTY_COLORS[difficultyKey] ?? 'text-slate-300 border-slate-700/50';

  const resources = blueprint?.rewards?.resources ?? [];
  const items = blueprint?.rewards?.items ? Object.entries(blueprint.rewards.items) : [];
  const reputation = blueprint?.rewards?.reputation ? Object.entries(blueprint.rewards.reputation) : [];

  return (
    <SkinSystemProvider>
      <SandboxTimingProvider>
        <div data-testid="minimal-quest-detail-page" className="min-h-screen bg-slate-950 p-6 text-ivory">
          <div className="mx-auto flex max-w-3xl flex-col gap-6">

            <header>
              <p className="text-[10px] uppercase tracking-[0.45em] text-amber-200/70">
                Minimal Slice · Quest Detail
              </p>
              <h1 className="text-2xl font-semibold tracking-[0.2em] text-amber-100">
                QUEST BRIEF
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                Informazioni sulla quest. Nessun roster o assegnazione — vedi{' '}
                <a
                  href="/poi-quest-detail-roster-integration"
                  className="text-amber-300 underline underline-offset-2 hover:text-amber-200"
                >
                  poi-quest-detail-roster-integration
                </a>{' '}
                per assegnare il party.
              </p>
            </header>

            {BLUEPRINTS.length > 1 && (
              <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-700/50 bg-slate-900/30 p-4">
                <label className="text-xs font-semibold uppercase tracking-wider text-amber-200">
                  Quest:
                </label>
                <select
                  className="rounded border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-ivory"
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                >
                  {BLUEPRINTS.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {blueprint && (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-[auto_1fr]">
                {/* QuestCard POI */}
                <div className="flex justify-center sm:justify-start">
                  <QuestCard
                    label={activity?.label ?? blueprint.name}
                    icon={blueprint.icon ?? '⚔'}
                    progressFraction={0}
                    elapsedSeconds={0}
                    totalDurationSeconds={0}
                    injuryPercentage={0}
                    deathPercentage={0}
                    dataTestId="quest-brief-card"
                    pillar="wilderness"
                  />
                </div>

                {/* Info column */}
                <div className="space-y-4">
                  <div>
                    <h2 className="text-lg font-semibold text-amber-100">{blueprint.name}</h2>
                    {blueprint.narrative && (
                      <p className="mt-1 text-sm leading-relaxed text-slate-400">{blueprint.narrative}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className={`rounded border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${difficultyColor}`}>
                      {DIFFICULTY_LABELS[difficultyKey] ?? difficultyKey}
                    </span>
                    {blueprint.tags.map((tag) => (
                      <span key={tag} className="rounded border border-slate-700/50 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-500">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {blueprint && blueprint.phases.length > 0 && (
              <section className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-200">
                  Fasi ({blueprint.phases.length})
                </h3>
                <div className="space-y-1.5">
                  {blueprint.phases.map((phase, i) => (
                    <PhaseRow key={phase.id} phase={phase} index={i} />
                  ))}
                </div>
              </section>
            )}

            {blueprint && (resources.length > 0 || items.length > 0 || reputation.length > 0) && (
              <section className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-200">
                  Ricompense
                </h3>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {resources.map((r) => (
                    <RewardChip key={r.resourceId} label={r.resourceId} value={r.amountFormula ?? '?'} />
                  ))}
                  {items.map(([id, qty]) => (
                    <RewardChip key={id} label={id} value={String(qty)} />
                  ))}
                  {reputation.map(([faction, pts]) => (
                    <RewardChip key={faction} label={faction} value={String(pts)} />
                  ))}
                </div>
              </section>
            )}

            {blueprint && activity && (
              <section className="rounded-lg border border-slate-800/60 bg-slate-900/20 p-4 space-y-1">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-200 mb-2">
                  Dati Attività
                </h3>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <dt className="text-slate-500">ID</dt>
                  <dd className="font-mono text-slate-300">{activity.id}</dd>
                  <dt className="text-slate-500">Livello</dt>
                  <dd className="text-slate-300">{activity.level ?? '—'}</dd>
                  <dt className="text-slate-500">Pericolo</dt>
                  <dd className="text-slate-300">{activity.dangerRating ?? '—'}</dd>
                  <dt className="text-slate-500">Durata</dt>
                  <dd className="text-slate-300">{activity.durationFormula ?? '—'}</dd>
                  {activity.rewards && activity.rewards.length > 0 && (
                    <>
                      <dt className="text-slate-500">Ricompense attività</dt>
                      <dd className="text-slate-300">
                        {activity.rewards.map((r) => `${r.resourceId} ×${r.amountFormula}`).join(', ')}
                      </dd>
                    </>
                  )}
                </dl>
              </section>
            )}

            <footer className="pt-2">
              <a
                href="/poi-quest-detail-roster-integration"
                className="inline-flex items-center gap-2 rounded border border-amber-500/50 bg-amber-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-amber-200 transition-colors hover:bg-amber-500/20"
              >
                <span>Assegna Party</span>
                <span>→</span>
              </a>
            </footer>

          </div>
        </div>
      </SandboxTimingProvider>
    </SkinSystemProvider>
  );
}
