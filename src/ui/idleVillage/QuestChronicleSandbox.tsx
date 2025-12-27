import { useCallback, useEffect, useMemo, useState } from 'react';
import QuestChronicle from '@/ui/idleVillage/components/QuestChronicle';
import VerbCard from '@/ui/idleVillage/VerbCard';
import CombatCardDetail from '@/ui/idleVillage/components/CombatCardDetail';
import {
  applyPhaseResult,
  buildQuestChroniclePhases,
  createInitialQuestState,
  revertPhase,
} from '@/ui/idleVillage/questChronicleHelpers';
import { useIdleVillageConfig } from '@/balancing/hooks/useIdleVillageConfig';
import type { QuestState, QuestPhase, QuestPhaseResult } from '@/balancing/config/idleVillage/types';

const VISUAL_VARIANT_BY_PHASE: Record<QuestPhase['type'], 'amethyst' | 'ember' | 'jade'> = {
  TRIAL: 'amethyst',
  COMBAT: 'ember',
  WORK: 'jade',
};

const QuestChronicleSandbox = () => {
  const { config } = useIdleVillageConfig();
  const questBlueprint = config.questBlueprints?.quest_frontier_showcase ?? null;

  const [questState, setQuestState] = useState<QuestState | null>(() =>
    questBlueprint ? createInitialQuestState(questBlueprint) : null,
  );

  const [showCombatCard, setShowCombatCard] = useState(false);

  const handleCombatComplete = useCallback((result: QuestPhaseResult) => {
    if (!questBlueprint || !questState) return;
    const newState = applyPhaseResult({ state: questState, blueprint: questBlueprint, result: result.result });
    setQuestState(newState);
    setShowCombatCard(false);
  }, [questBlueprint, questState]);

  const handleCombatStart = useCallback(async (): Promise<'success' | 'failure'> => {
    // Simulate combat logic - for now, random outcome
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate combat time
    return Math.random() > 0.3 ? 'success' : 'failure'; // 70% success rate
  }, []);

  useEffect(() => {
    if (!questBlueprint) {
      setQuestState(null);
      return;
    }
    setQuestState((prev) => {
      if (!prev || prev.blueprintId !== questBlueprint.id) {
        return createInitialQuestState(questBlueprint);
      }
      return prev;
    });
  }, [questBlueprint]);

  const chronicle = useMemo(() => {
    if (!questBlueprint) {
      return { phases: [], activeIndex: 0 };
    }
    return buildQuestChroniclePhases({ blueprint: questBlueprint, questState });
  }, [questBlueprint, questState]);

  const activePhase = useMemo(() => {
    if (!questBlueprint) return null;
    return questBlueprint.phases[chronicle.activeIndex] ?? null;
  }, [questBlueprint, chronicle.activeIndex]);

  const questStatus = questState?.status ?? 'available';

  const resolvePhaseResult = (phaseId: string | undefined) =>
    questState?.phaseResults.find((entry) => entry.phaseId === phaseId);

  const verbCards = useMemo(() => {
    if (!questBlueprint) return [];
    return questBlueprint.phases.map((phase, index) => {
      const result = resolvePhaseResult(phase.id);
      const isActive = index === chronicle.activeIndex && questStatus === 'in_progress';
      const isCompleted = result?.result === 'success';
      const isFailed = result?.result === 'failure' || questStatus === 'failed';

      const progressFraction = isCompleted ? 1 : isActive ? 0.35 : 0;
      const injury = phase.type === 'COMBAT' ? 35 : phase.type === 'TRIAL' ? 18 : 6;
      const death = phase.type === 'COMBAT' ? 12 : 0;

      return {
        phase,
        index,
        state: result?.result ?? (isActive ? 'active' : 'pending'),
        progressFraction,
        injuryPercentage: injury,
        deathPercentage: death,
        isActive,
        isFailed,
        isCompleted,
        icon: phase.icon ?? (phase.type === 'COMBAT' ? '⚔️' : phase.type === 'TRIAL' ? '🎲' : '🛠️'),
        visualVariant: VISUAL_VARIANT_BY_PHASE[phase.type],
      };
    });
  }, [chronicle.activeIndex, questBlueprint, questStatus, questState]);

  if (!questBlueprint) {
    return (
      <div className="p-6 text-ivory">
        Nessuna quest blueprint configurata per il Sandbox. Assicurati che `quest_frontier_showcase` sia presente nel config.
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10 p-6 text-ivory">
      <header className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.45em] text-amber-200/70">Village Sandbox · Quest Chronicle</p>
        <h1 className="text-3xl font-semibold tracking-[0.25em] text-amber-100">{questBlueprint.label}</h1>
        <p className="text-sm text-slate-300">
          Blueprint multi-fase esposta in una pagina dedicata. Usa i controlli per simulare i risultati e osserva come la
          timeline aggiorna la sequenza di VerbCard sul margine inferiore.
        </p>
      </header>

      <section className="rounded-3xl border border-amber-200/30 bg-slate-950/60 p-6 shadow-[0_40px_70px_rgba(0,0,0,0.65)] backdrop-blur">
        <div className="flex flex-col gap-6 lg:flex-row">
          <QuestChronicle
            title={questBlueprint.label}
            summary={questBlueprint.summary}
            phases={chronicle.phases}
            currentPhaseIndex={chronicle.activeIndex}
            onOpenTheater={() => {
              if (activePhase?.type === 'COMBAT') {
                setShowCombatCard(true);
              } else {
                const message = activePhase ? `Apri il Teatro per ${activePhase.label}` : 'Apre Teatro (mock)';
                console.info(message);
              }
            }}
          />
          <div className="flex flex-1 flex-col gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.4em] text-amber-200/70">Debug Controls</p>
              <p className="text-sm text-slate-200">
                Avanza o riavvolgi la quest per verificare come il Chronicle e le VerbCard reagiscono senza il TimeEngine.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="rounded-full border border-emerald-400/60 bg-emerald-500/10 px-4 py-2 text-[11px] uppercase tracking-[0.3em] text-emerald-100 hover:bg-emerald-500/20 disabled:opacity-40"
                onClick={() => {
                  if (!questBlueprint || !questState) return;
                  setQuestState(applyPhaseResult({ state: questState, blueprint: questBlueprint, result: 'success' }));
                }}
                disabled={!questState || questState.status === 'completed'}
              >
                Segna Successo
              </button>
              <button
                type="button"
                className="rounded-full border border-rose-400/60 bg-rose-500/10 px-4 py-2 text-[11px] uppercase tracking-[0.3em] text-rose-100 hover:bg-rose-500/20 disabled:opacity-40"
                onClick={() => {
                  if (!questBlueprint || !questState) return;
                  setQuestState(applyPhaseResult({ state: questState, blueprint: questBlueprint, result: 'failure' }));
                }}
                disabled={!questState || questState.status === 'failed'}
              >
                Segna Fallimento
              </button>
              <button
                type="button"
                className="rounded-full border border-slate-500/60 bg-black/30 px-4 py-2 text-[11px] uppercase tracking-[0.3em] text-slate-200 hover:bg-slate-800/40 disabled:opacity-40"
                onClick={() => {
                  if (!questBlueprint || !questState) return;
                  setQuestState(revertPhase({ state: questState, blueprint: questBlueprint }));
                }}
                disabled={!questState}
              >
                Rewind Fase
              </button>
              <button
                type="button"
                className="rounded-full border border-amber-300/60 bg-amber-400/10 px-4 py-2 text-[11px] uppercase tracking-[0.3em] text-amber-100 hover:bg-amber-400/20"
                onClick={() => questBlueprint && setQuestState(createInitialQuestState(questBlueprint))}
              >
                Reset Quest
              </button>
            </div>
            {activePhase && (
              <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-4">
                <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Fase attiva</p>
                <h3 className="text-lg font-semibold tracking-[0.2em] text-amber-100">{activePhase.label}</h3>
                <p className="text-sm text-slate-200">{activePhase.narrative ?? 'Nessuna narrativa configurata.'}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <p className="text-xs uppercase tracking-[0.45em] text-slate-400">Sequenza VerbCard</p>
          <p className="text-sm text-slate-300">
            Affronta ogni carta in ordine: la fascia inferiore mostra lo stato di ciascuna fase come se fosse una VerbCard
            reale, con alone amethyst/ember/jade in base al tipo.
          </p>
        </div>
        <div className="rounded-3xl border border-slate-800/60 bg-black/40 p-4">
          <div className="flex flex-col gap-3">
            <div className="flex w-full gap-4 overflow-x-auto pb-2">
              {verbCards.map((card) => (
                <div
                  key={card.phase.id}
                  className={`flex w-48 min-w-48 flex-col items-center gap-3 rounded-2xl border border-slate-800/60 bg-slate-950/40 p-3 ${
                    card.isActive ? 'opacity-100' : 'opacity-60'
                  }`}
                >
                  <div className="text-center text-[11px] uppercase tracking-[0.35em] text-slate-300">
                    {card.phase.label}
                  </div>
                  <VerbCard
                    icon={card.icon}
                    progressFraction={card.progressFraction}
                    elapsedSeconds={card.isCompleted ? 120 : card.isActive ? 30 : 0}
                    totalDuration={120}
                    injuryPercentage={card.injuryPercentage}
                    deathPercentage={card.deathPercentage}
                    assignedCount={1}
                    totalSlots={1}
                    isInteractive={false}
                    visualVariant={card.visualVariant}
                    progressStyle="halo"
                    className={`w-full transition-transform ${
                      card.isActive ? 'scale-100 drop-shadow-[0_0_40px_rgba(251,191,36,0.3)]' : 'scale-95'
                    }`}
                  />
                  <div className="text-center text-xs text-slate-400">
                    {card.phase.narrative ?? 'Nessuna nota.'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {showCombatCard && activePhase && (
        <CombatCardDetail
          questLabel={questBlueprint.label}
          phase={activePhase}
          onStartCombat={handleCombatStart}
          onCombatComplete={handleCombatComplete}
          onClose={() => setShowCombatCard(false)}
        />
      )}
    </div>
  );
};

export default QuestChronicleSandbox;
