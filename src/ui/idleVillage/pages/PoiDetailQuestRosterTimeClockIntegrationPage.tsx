/**
 * PoiDetailQuestRosterTimeClockIntegrationPage — POI quest completo
 *
 * Banco di prova del quest system della famiglia POI (R-005, desiderata v3):
 * - `DayNightTimeEngineStrip` (clockKit) trapianta clock + day/night con una riga.
 * - Durata dalle fasi del `QuestBlueprint` (non da `durationFormula`), milestone
 *   equispaziate una per fase.
 * - `MagicCircleHalo`: attorno al POI si *scrive* un'iscrizione arcana dalle ore 12;
 *   a cerchio chiuso si ferma e pulsa.
 * - A ogni milestone un `MilestoneCheckModal` (consumabili → Destiny Astrolabe).
 *   Se la quest card è chiusa il check si risolve comunque, fuori scena.
 * - Il fallimento di una fase non interrompe la quest; il giocatore può però
 *   interromperla a mano.
 * - A spedizione avviata il click sul POI apre la quest card al posto del detail;
 *   a quest conclusa la card diventa `QuestRewardPanel` e le ricompense si
 *   applicano solo con "Raccogli ricompense".
 *
 * Desiderata v4:
 * - Detail, quest card e skill check sono `FloatingPanel`: spostabili,
 *   riducibili a icona, e senza backdrop — la pagina resta sempre usabile.
 * - Le fasi si risolvono una alla volta: mentre un check attende il giocatore il
 *   tempo della quest non avanza, quindi fra una fase e l'altra passa davvero
 *   tempo. Ridurre a icona il check lo affida al destino e la quest riprende.
 *
 * Route: /poi-quest-detail-roster-time-clock
 */

import type { FC } from 'react';
import { useState } from 'react';
import { FloatingPanel } from '@/ui/idleVillage/components/FloatingPanel';
import { MissionPlannerLive } from '@/ui/idleVillage/components/missionPlanner/MissionPlannerLive';
import type { LaunchPayloadResult } from '@/engine/game/idleVillage/missionPlannerDraft';
import {
  DndContext,
  pointerWithin,
  useDroppable,
  useDndContext,
} from '@dnd-kit/core';
import { getBloomStyle, type BloomState } from '@/ui/idleVillage/interaction/bloomEffect';
import { TooltipProvider } from '@radix-ui/react-tooltip';
import { RosterDraggable, RosterKitShell } from '@/ui/idleVillage/frozen/kits/rosterKit';
import { DayNightTimeEngineStrip } from '@/ui/idleVillage/frozen/kits/clockKit';
import { QuestPOI, type QuestPOIPhase } from '@/ui/idleVillage/frozen/kits/poiKit';
import { MagicCircleHalo } from '@/ui/idleVillage/components/MagicCircleHalo';
import { StyleLabSurface } from '@/ui/styleLab/StyleLabSurface';
import type { QuestPowerResult } from '@/engine/game/idleVillage/QuestPowerEngine';
import { QuestAssignmentPreview } from '@/ui/idleVillage/components/QuestAssignmentPreview';
import { MOCK_QUEST_ITEMS } from '@/balancing/config/idleVillage/quests/questItemsMock';
import {
  OUTCOME_CONFIG,
  QUEST_OUTCOME_LABELS,
  useQuestPoiSession,
} from '@/ui/idleVillage/quests/useQuestPoiSession';

/** Medallion size; the magic circle shares it so the two stay concentric. */
const QUEST_POI_SIZE = 200;

interface EmbarkResultModalProps {
  result: QuestPowerResult;
  residentsById: Record<string, { displayName?: string; id: string }>;
  onClose: () => void;
}

function EmbarkResultModal({ result, residentsById, onClose }: EmbarkResultModalProps) {
  const cfg = OUTCOME_CONFIG[result.outcome];
  const injured = result.consequences.filter((c) => c.consequence === 'injured');
  const dead = result.consequences.filter((c) => c.consequence === 'dead');
  const unscathed = result.consequences.filter((c) => c.consequence === 'none');

  return (
    <div
      data-testid="quest-embark-result"
      role="dialog"
      aria-modal="true"
      aria-label="Esito missione"
      className="rounded-xl border bg-slate-950/95 p-5 space-y-4 shadow-2xl"
      style={{ borderColor: 'inherit' }}
    >
      <div className={`rounded-lg border p-4 text-center ${cfg.bg} ${cfg.border}`}>
        <p className="text-3xl">{cfg.icon}</p>
        <p className={`mt-1 text-xl font-semibold tracking-wider ${cfg.color}`}>
          {QUEST_OUTCOME_LABELS[result.outcome]}
        </p>
        <p className="mt-1 text-[11px] text-slate-400">
          Power ratio: <span className="text-slate-200">{result.powerRatio.toFixed(2)}</span>
          {' · '}
          Reward ×<span className="text-slate-200">{result.rewardMultiplier.toFixed(2)}</span>
        </p>
      </div>

      {(dead.length > 0 || injured.length > 0 || unscathed.length > 0) && (
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">Conseguenze del party</p>
          <div className="grid grid-cols-1 gap-1.5">
            {dead.map((c) => (
              <div key={c.residentId} className="flex items-center gap-2 rounded border border-rose-700/40 bg-rose-950/30 px-3 py-1.5 text-xs text-rose-200">
                <span>☠</span>
                <span>{residentsById[c.residentId]?.displayName ?? c.residentId}</span>
                <span className="ml-auto text-rose-400 font-medium">Morto</span>
              </div>
            ))}
            {injured.map((c) => (
              <div key={c.residentId} className="flex items-center gap-2 rounded border border-amber-700/40 bg-amber-950/30 px-3 py-1.5 text-xs text-amber-200">
                <span>🩹</span>
                <span>{residentsById[c.residentId]?.displayName ?? c.residentId}</span>
                <span className="ml-auto text-amber-400 font-medium">Ferito</span>
              </div>
            ))}
            {unscathed.map((c) => (
              <div key={c.residentId} className="flex items-center gap-2 rounded border border-slate-700/40 bg-slate-900/30 px-3 py-1.5 text-xs text-slate-300">
                <span>✓</span>
                <span>{residentsById[c.residentId]?.displayName ?? c.residentId}</span>
                <span className="ml-auto text-slate-500 font-medium">Illeso</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onClose}
        className="w-full rounded border border-slate-600 bg-slate-800 py-2 text-xs uppercase tracking-widest text-slate-200 hover:bg-slate-700 transition-colors"
      >
        Chiudi
      </button>
    </div>
  );
}

interface DroppablePoiProps {
  dropId: string;
  questId: string;
  icon: string;
  label: string;
  progress: number;
  questStatus: 'available' | 'in_progress' | 'completed' | 'failed';
  phases: QuestPOIPhase[];
  currentPhaseIndex: number;
  /** True once the inscription has closed: the halo stops and pulses. */
  isHaloComplete: boolean;
  timeRemainingMs?: number;
  isExpirable?: boolean;
  injuryRisk?: number;
  deathRisk?: number;
  dangerRating?: number;
  canAcceptDrop: boolean;
  draggingResidentId?: string | null;
  onClick: (event: React.MouseEvent<HTMLDivElement>) => void;
}

function DroppablePoi({
  dropId,
  questId,
  icon,
  label,
  progress,
  questStatus,
  phases,
  currentPhaseIndex,
  isHaloComplete,
  timeRemainingMs,
  isExpirable,
  injuryRisk,
  deathRisk,
  dangerRating,
  canAcceptDrop,
  draggingResidentId,
  onClick,
}: DroppablePoiProps) {
  const { setNodeRef } = useDroppable({
    id: dropId,
    disabled: !canAcceptDrop,
    data: { accepts: ['resident'] },
  });

  const { active } = useDndContext();
  const isActive = Boolean(active || draggingResidentId);
  const highlightState: BloomState = isActive
    ? (canAcceptDrop ? 'valid' : 'invalid')
    : 'idle';

  return (
    <div
      ref={setNodeRef}
      className="poi-detail-stage__medallion relative flex cursor-pointer flex-col items-center gap-2"
      onClick={onClick}
      style={getBloomStyle(highlightState, 200)}
      role="button"
      tabIndex={0}
      aria-label={`${label} — clicca per aprire il detail`}
    >
      <QuestPOI
        questId={questId}
        label={label}
        icon={icon}
        status={questStatus}
        phases={phases}
        currentPhaseIndex={currentPhaseIndex}
        progress={progress}
        size={QUEST_POI_SIZE}
        timeRemainingMs={timeRemainingMs}
        isExpirable={isExpirable}
        showRiskBadges
        injuryRisk={injuryRisk}
        deathRisk={deathRisk}
        dangerRating={dangerRating}
        // Concentric with the medallion. At progress 0 it draws nothing at all,
        // so no ring or track telegraphs the path before the first character.
        medallionOverlay={
          <MagicCircleHalo
            progress={progress}
            isComplete={isHaloComplete}
            size={QUEST_POI_SIZE}
          />
        }
      />
    </div>
  );
}
const PoiDetailQuestRosterTimeClockIntegrationPage: FC = () => {
  const {
    t,
    gameplay,
    residentsById,
    ACTIVITIES,
    activity,
    activityIcon,
    selectedActivityId,
    setSelectedActivityId,
    isQuestRunning,
    handleAbandon,
    elapsedMs,
    questDurationMs,
    questPhases,
    phaseResults,
    currentPhaseIndex,
    poiPhaseDots,
    activityProgress,
    isHaloComplete,
    status,
    questStatus,
    preview,
    embarkResult,
    isConsequencesOpen,
    setIsConsequencesOpen,
    selectedItemIds,
    toggleItem,
    poiDropId,
    canAcceptPoiDrop,
    handlePoiClick,
    draggingResidentId,
    setDraggingResidentId,
    sensors,
    handleDragStart,
    handleDragEnd,
    handleFlightComplete,
    handleResidentSelect,
    getResidentCompatibility,
    lockedResidentIds,
    overlays,
    startQuestWithPayload,
  } = useQuestPoiSession();

  const [isPlannerOpen, setIsPlannerOpen] = useState(false);

  const handlePlannerLaunch = (result: unknown) => {
    const launch = result as LaunchPayloadResult;
    if (!launch.ok) return;
    if (startQuestWithPayload(launch.payload)) {
      setIsPlannerOpen(false);
    }
  };

  return (
    <TooltipProvider>
      <RosterKitShell>
        <DndContext
          sensors={sensors}
          collisionDetection={pointerWithin}
          onDragStart={handleDragStart}
          onDragCancel={() => setDraggingResidentId(null)}
        >
          <div
            data-testid="poi-detail-quest-roster-time-clock-integration-page"
            className="min-h-screen bg-slate-950 p-4 text-ivory sm:p-8"
          >
            <div className="mx-auto max-w-7xl space-y-6">
              <header>
                <p className="text-[10px] uppercase tracking-[0.45em] text-amber-200/70">
                  Test Hub · Quest POI Detail + Roster + Time Clock Integration
                </p>
                <h1 className="text-2xl font-semibold tracking-[0.2em] text-amber-100">
                  QUEST POI DETAIL + ROSTER + TIME CLOCK
                </h1>
                <p className="mt-1 text-sm text-slate-400">
                  Assegna il party e avvia: attorno al POI si scrive un cerchio magico che misura
                  la durata delle fasi del blueprint. A ogni milestone scatta uno skill check;
                  a cerchio chiuso clicca il POI per leggere la cronaca e raccogliere le ricompense.
                </p>
              </header>

              {/* Day/Night time engine — drop-in from clockKit. */}
              <DayNightTimeEngineStrip gameplay={gameplay} compact />

              <div className="flex flex-wrap items-center gap-4 rounded-lg border border-slate-700/50 bg-slate-900/30 p-4">
                <label className="text-xs font-semibold uppercase tracking-wider text-amber-200">
                  Attività:
                </label>
                <select
                  className="rounded border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-ivory"
                  value={selectedActivityId}
                  onChange={(e) => setSelectedActivityId(e.target.value)}
                >
                  {ACTIVITIES.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.label}
                    </option>
                  ))}
                </select>
                {!isQuestRunning && !embarkResult && questPhases.length > 0 && (
                  <button
                    type="button"
                    data-testid="open-mission-planner"
                    onClick={() => setIsPlannerOpen(true)}
                    className="rounded border border-amber-600/60 bg-amber-950/30 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-amber-200 transition-colors hover:bg-amber-900/40"
                  >
                    {t('idleVillage:missionPlanner.open', { defaultValue: 'Mission Planner' })}
                  </button>
                )}
                {isQuestRunning && (
                  <button
                    type="button"
                    data-testid="quest-abandon-button"
                    onClick={handleAbandon}
                    className="rounded border border-rose-700/50 bg-rose-950/30 px-3 py-1.5 text-xs text-rose-200 transition-colors hover:bg-rose-900/40"
                  >
                    Interrompi quest
                  </button>
                )}
                <div className="ml-auto text-xs text-slate-400" data-testid="quest-countdown">
                  Countdown: {(elapsedMs / 1000).toFixed(1)}s / {(questDurationMs / 1000).toFixed(1)}s
                  {' · '}
                  Fasi: {phaseResults.filter(Boolean).length}/{questPhases.length}
                </div>
              </div>

              {/* items-start: the POI panel must not stretch to the roster's
                  height, or the medallion floats in a tall empty band. */}
              <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
                <div className="space-y-6">
                  <div
                    className="rounded-lg border border-slate-700/50 bg-slate-900/30 p-6"
                    data-page-dragging-resident-id={draggingResidentId ?? 'null'}
                  >
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-amber-200">
                      Village Roster
                    </h2>
                    <RosterDraggable
                      componentId="poi-detail-quest-roster"
                      useWanderlustSkin={true}
                      useExternalDndContext={true}
                      onDragEnd={handleDragEnd as unknown as any}
                      onFlightComplete={handleFlightComplete}
                      onResidentSelect={handleResidentSelect}
                      getResidentCompatibility={getResidentCompatibility}
                      lockedResidentIds={lockedResidentIds}
                      lockedStatusLabel="Away"
                      activeResidentId={draggingResidentId}
                    />
                  </div>

                  <div className="rounded-lg border border-slate-700/50 bg-slate-900/30 p-4">
                    <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-amber-200">
                      Oggetti (mock)
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {MOCK_QUEST_ITEMS.map((item) => {
                        const isSelected = selectedItemIds.includes(item.id);
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => toggleItem(item.id)}
                            data-testid={`quest-item-${item.id}`}
                            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-colors ${
                              isSelected
                                ? 'border-amber-400 bg-amber-400/10 text-amber-200'
                                : 'border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-500'
                            }`}
                          >
                            <span>{item.icon}</span>
                            <span>{t(item.labelKey, { defaultValue: item.id })}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <QuestAssignmentPreview preview={preview} />

                  {embarkResult && isConsequencesOpen && (
                    <EmbarkResultModal
                      result={embarkResult}
                      residentsById={residentsById}
                      onClose={() => setIsConsequencesOpen(false)}
                    />
                  )}
                </div>

                <StyleLabSurface className="poi-detail-surface" variant="panel">
                  <section className="poi-detail-stage">
                    <DroppablePoi
                      dropId={poiDropId}
                      questId={activity.id}
                      icon={activityIcon}
                      label={activity.label}
                      progress={activityProgress}
                      questStatus={questStatus}
                      phases={poiPhaseDots}
                      currentPhaseIndex={currentPhaseIndex}
                      isHaloComplete={isHaloComplete && (isQuestRunning || !!embarkResult)}
                      timeRemainingMs={Math.max(0, questDurationMs - elapsedMs)}
                      isExpirable={status === 'in-progress'}
                      // Rounded: the projection is a float and the badge would
                      // otherwise read "19.849999999999998%".
                      injuryRisk={Math.round(preview.projectedInjuryChance * 10) / 10}
                      deathRisk={Math.round(preview.projectedDeathChance * 10) / 10}
                      dangerRating={activity.dangerRating}
                      canAcceptDrop={canAcceptPoiDrop}
                      draggingResidentId={draggingResidentId}
                      onClick={handlePoiClick}
                    />
                  </section>
                </StyleLabSurface>
              </div>
            </div>
          </div>

          {isPlannerOpen && (
            <FloatingPanel
              panelId="mission-planner"
              title={t('idleVillage:missionPlanner.title', { defaultValue: 'Mission Planner' })}
              icon="🗺"
              width={1020}
              initialPosition={{ x: 120, y: 60 }}
              onClose={() => setIsPlannerOpen(false)}
            >
              <MissionPlannerLive questId={selectedActivityId} onLaunch={handlePlannerLaunch} />
            </FloatingPanel>
          )}

          {overlays}
        </DndContext>
      </RosterKitShell>
    </TooltipProvider>
  );
};

export default PoiDetailQuestRosterTimeClockIntegrationPage;
