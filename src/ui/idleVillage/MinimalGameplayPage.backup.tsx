// Backup of original MinimalGameplayPage.tsx
// This file was backed up before creating the new minimal version

import type { JSX } from 'react';
import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  DragOverlay,
} from '@dnd-kit/core';
import { StyleLaboratoryPanel } from '@/ui/styleLab/StyleLaboratoryPanel';
import { useThemeSwitcher } from '@/hooks/useThemeSwitcher';
import DayNightActionCard from '@/ui/idleVillage/map/actionCards/DayNightActionCard';
import WorkerPanel from '@/ui/idleVillage/components/WorkerPanel';
import WorkerCard from '@/ui/idleVillage/components/WorkerCard';
import { getCurrentDragConfig } from '@/ui/idleVillage/config/dragConfig';
import { useMinimalActivitySlotsWithState } from '@/ui/idleVillage/hooks/useMinimalActivitySlots';
import { ResourceTicker } from '@/ui/idleVillage/components/ResourceTicker';
import MinimalGameOverModal from '@/ui/idleVillage/components/MinimalGameOverModal';
import ActionToolbar from '@/ui/idleVillage/components/minimal/ActionToolbar';
import { TooltipProvider } from '@/ui/idleVillage/components/TooltipProvider';
import { useTooltipCopy } from '@/ui/idleVillage/hooks/useTooltipCopy';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import { getMinimalFeedbackConfig } from '@/ui/idleVillage/config/minimalFeedbackConfig';
import {
  useMinimalGameplayStore,
  initializeMinimalGameplayStore,
  selectRosterWithWarnings,
  selectLoopWarnings,
  selectResidentStatus,
  type LoopWarningsResult,
} from '@/store/useMinimalGameplay';
import { useDropFeedback } from '@/ui/idleVillage/hooks/useDropFeedback';
import { useDropFeedbackTelemetry } from '@/ui/idleVillage/hooks/useDropFeedbackTelemetry';
import { useMinimalStyleLabTokens } from '@/ui/idleVillage/hooks/useMinimalStyleLabTokens';
import type { MinimalGameplayConfig } from '@/balancing/config/idleVillage/minimalGameplayConfig';
import type { MinimalConfig } from '@/balancing/config/idleVillage/minimalConfig';
import { MINIMAL_GAMEPLAY_CONFIG } from '@/balancing/config/idleVillage/minimalGameplayConfig';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type { DropValidationRule } from '@/ui/idleVillage/config/residentDropRules';

/**
 * Minimal placeholder page showing only the Style Laboratory controls (same look as Moodboard).
 */
export default function MinimalGameplayPage(): JSX.Element {
  const { activePreset, presets, isRandomized, setPreset, randomizeTheme, resetRandomization } = useThemeSwitcher();
  const state = useMinimalGameplayStore((s) => s.state);
  const gameOverState = useMinimalGameplayStore((s) => s.gameOverState);
  const config = useMinimalGameplayStore((s) => s.config);
  const pauseGame = useMinimalGameplayStore((s) => s.pauseGame);
  const resumeGame = useMinimalGameplayStore((s) => s.resumeGame);
  const resetGame = useMinimalGameplayStore((s) => s.resetGame);
  const startActivity = useMinimalGameplayStore((s) => s.startActivity);
  const canStartActivity = useMinimalGameplayStore((s) => s.canStartActivity);
  const buyFood = useMinimalGameplayStore((s) => s.buyFood);
  const startQuestDemo = useMinimalGameplayStore((s) => s.startQuestDemo);
  const initializedRef = useRef(false);
  const [selectedResidentId, setSelectedResidentId] = useState<string | null>(null);
  const [activeResidentId, setActiveResidentId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [previousResources, setPreviousResources] = useState({
    gold: state.gold,
    food: state.food,
    day: state.currentDay,
    fatigue: 0,
  });
  const [resourceDeltas, setResourceDeltas] = useState({
    gold: 0,
    food: 0,
    day: 0,
    fatigue: 0,
  });
  const [previousWarnings, setPreviousWarnings] = useState<LoopWarningsResult>({
    fatigue: { active: false, message: '' },
    food: { active: false, message: '' },
    ariaLiveMessage: '',
  });

  // Use the new MinimalGameplayConfig
  const gameplayConfig: MinimalGameplayConfig = MINIMAL_GAMEPLAY_CONFIG;
  const feedbackConfig = getMinimalFeedbackConfig();
  const modalStyleTokens = useMinimalStyleLabTokens(config.ui);

  // Initialize drop feedback hook
  const {
    validateDropWithFeedback,
    showSlotFeedback,
    clearSlotFeedback,
    slotFeedbackState,
  } = useDropFeedback({});

  // Initialize telemetry hook
  const dropFeedbackTelemetry = useDropFeedbackTelemetry({
    source: 'minimal-gameplay-page',
    enabled: true,
  });

  // Initialize tooltip hook with config
  const { getTooltipCopy } = useTooltipCopy({
    tooltipConfig: config.ui.tooltips,
    telemetryEnabled: true,
    telemetrySource: 'minimal-gameplay-page',
  });

  // Get roster with warnings using selector - memoized to prevent infinite loop
  const rosterWithWarnings = React.useMemo(() => 
    useMinimalGameplayStore.getState() 
      ? selectRosterWithWarnings(useMinimalGameplayStore.getState().state, gameplayConfig)
      : []
    , [gameplayConfig]);

  // Get loop warnings using selector
  const loopWarnings = React.useMemo(() => 
    useMinimalGameplayStore.getState()
      ? selectLoopWarnings(useMinimalGameplayStore.getState().state, gameplayConfig)
      : { fatigue: { active: false, message: '' }, food: { active: false, message: '' } }
    , [gameplayConfig]);

  // Action callbacks with async feedback
  const handleBuyFood = useCallback(async () => {
    const result = buyFood(gameplayConfig.ui.actionPanel.buyFood.defaultQuantity);
    if (!result.success && result.message) {
      setStatusMessage(result.message);
      // Announce error to screen readers
      const announcement = `Errore: ${result.message}`;
      const ariaLive = document.createElement('div');
      ariaLive.setAttribute('aria-live', 'assertive');
      ariaLive.setAttribute('aria-atomic', 'true');
      ariaLive.style.position = 'absolute';
      ariaLive.style.left = '-10000px';
      ariaLive.style.width = '1px';
      ariaLive.style.height = '1px';
      ariaLive.style.overflow = 'hidden';
      document.body.appendChild(ariaLive);
      ariaLive.textContent = announcement;
      setTimeout(() => document.body.removeChild(ariaLive), 1000);
    } else {
      setStatusMessage('');
    }
    return result;
  }, [buyFood, gameplayConfig.ui.actionPanel.buyFood.defaultQuantity]);

  const handleStartQuestDemo = useCallback(async () => {
    // For demo, use the first available resident
    const availableResidents = rosterWithWarnings.filter(r => !r.isWorking && !r.isInjured);
    if (availableResidents.length === 0) {
      const message = 'Nessun residente disponibile per la quest';
      setStatusMessage(message);
      return { success: false, message };
    }

    const residentIds = [availableResidents[0].id];
    const result = startQuestDemo(gameplayConfig.locations[1]?.activityId || 'quest_forest_hunt_minimal', residentIds);

    if (!result.success && result.message) {
      setStatusMessage(result.message);
      // Announce error to screen readers
      const announcement = `Errore: ${result.message}`;
      const ariaLive = document.createElement('div');
      ariaLive.setAttribute('aria-live', 'assertive');
      ariaLive.setAttribute('aria-atomic', 'true');
      ariaLive.style.position = 'absolute';
      ariaLive.style.left = '-10000px';
      ariaLive.style.width = '1px';
      ariaLive.style.height = '1px';
      ariaLive.style.overflow = 'hidden';
      document.body.appendChild(ariaLive);
      ariaLive.textContent = announcement;
      setTimeout(() => document.body.removeChild(ariaLive), 1000);
    } else {
      setStatusMessage('');
    }
    return result;
  }, [startQuestDemo, rosterWithWarnings, gameplayConfig.locations]);

  // Memoized callback for ResourceTicker to prevent infinite loop
  const handleAnimationComplete = useCallback(() => {
    setResourceDeltas({ gold: 0, food: 0, day: 0, fatigue: 0 });
  }, []);

  // Track resource changes for ticker animations
  useEffect(() => {
    const currentResources = {
      gold: state.gold,
      food: state.food,
      day: state.currentDay,
      fatigue: rosterWithWarnings.length > 0
        ? rosterWithWarnings.reduce((sum, r) => sum + r.fatigue, 0) / rosterWithWarnings.length
        : 0,
    };

    const deltas = {
      gold: state.gold - previousResources.gold,
      food: state.food - previousResources.food,
      day: state.currentDay - previousResources.day,
      fatigue: currentResources.fatigue - previousResources.fatigue,
    };

    // Only set deltas if there are actual changes
    if (deltas.gold !== 0 || deltas.food !== 0 || deltas.day !== 0 || deltas.fatigue !== 0) {
      setResourceDeltas(deltas);
      setPreviousResources(currentResources);
    }
  }, [state.gold, state.food, state.currentDay, rosterWithWarnings]); // Removed previousResources to prevent loop

  useEffect(() => {
    if (initializedRef.current) {
      return;
    }
    initializedRef.current = true;
    initializeMinimalGameplayStore().catch((err) => {
      console.error('Failed to initialize minimal gameplay store:', err);
    });
  }, []);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault();
        if (state.isPaused) {
          resumeGame('user');
        } else {
          pauseGame('user');
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [state.isPaused, pauseGame, resumeGame]);

  // Aria-live announcements for warnings
  useEffect(() => {
    const newAnnouncements: string[] = [];

    if (loopWarnings.fatigue.active && !previousWarnings.fatigue.active) {
      newAnnouncements.push(loopWarnings.fatigue.message);
    }
    if (loopWarnings.food.active && !previousWarnings.food.active) {
      newAnnouncements.push(loopWarnings.food.message);
    }

    if (newAnnouncements.length > 0) {
      // Announce new warnings to screen readers
      const announcement = newAnnouncements.join('. ');
      const ariaLive = document.createElement('div');
      ariaLive.setAttribute('aria-live', 'assertive');
      ariaLive.setAttribute('aria-atomic', 'true');
      ariaLive.style.position = 'absolute';
      ariaLive.style.left = '-10000px';
      ariaLive.style.width = '1px';
      ariaLive.style.height = '1px';
      ariaLive.style.overflow = 'hidden';
      document.body.appendChild(ariaLive);
      ariaLive.textContent = announcement;
      setTimeout(() => document.body.removeChild(ariaLive), 1000);
    }

    setPreviousWarnings(loopWarnings);
  }, [loopWarnings, previousWarnings]);

  // DnD sensors configuration
  const dragConfig = getCurrentDragConfig();
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: dragConfig.thresholds.minDragDistance },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: dragConfig.timing.feedbackDelayMs,
        tolerance: dragConfig.thresholds.minDragDistance,
      },
    }),
  );

  // Get activity slots with state
  const { slotProps } = useMinimalActivitySlotsWithState({
    locations: gameplayConfig.locations,
    gameState: state,
    onResidentDrop: (slotId, residentId) => {
      // Handle resident drop on activity slot with feedback
      if (!residentId) return;

      // Find the activity for this slot
      const location = gameplayConfig.locations.find(loc => loc.slotId === slotId);
      if (!location) {
        console.log('Slot not found:', slotId);
        return;
      }

      // Use validateDropWithFeedback for validation and visual feedback
      const resident = rosterWithWarnings.find(r => r.id === residentId);
      if (!resident) {
        trackTelemetryEvent('minimal_gameplay_drop_failure', {
          slotId,
          residentId,
          reason: 'resident_not_found',
          activityId: location.activityId,
        });
        return;
      }

      // Convert minimal resident to ResidentState format expected by the hook
      const residentStatuses = selectResidentStatus(state);
      const storeStatus = residentStatuses[resident.id] || 'available';
      
      // Map store status to TimeEngine status
      const timeEngineStatus = storeStatus === 'working' ? 'away' : storeStatus;
      
      const residentState: ResidentState = {
        id: resident.id,
        displayName: resident.name,
        status: timeEngineStatus as ResidentState['status'],
        fatigue: resident.fatigue,
        currentHp: 100, // Default for minimal gameplay
        maxHp: 100, // Default for minimal gameplay
        isHero: false, // Default for minimal gameplay
        isInjured: resident.isInjured || false,
        survivalCount: 0, // Default for minimal gameplay
        survivalScore: 0, // Default for minimal gameplay
        statSnapshot: resident.stats ? { ...resident.stats } : undefined,
      };

      const result = validateDropWithFeedback({
        resident: residentState,
        activity: { id: location.activityId } as any, // Simplified for this context
      });

      if (!result.isValid) {
        // Feedback already shown by the hook
        // Telemetry for drop failure
        trackTelemetryEvent('minimal_gameplay_drop_failure', {
          slotId,
          residentId,
          reason: result.validationRule || 'unknown',
          activityId: location.activityId,
        });
        return;
      }

      // Telemetry for drop success
      trackTelemetryEvent('minimal_gameplay_drop_success', {
        slotId,
        residentId,
        activityId: location.activityId,
      });

      // Start activity with resident
      startActivity(residentId, location.activityId);
    },
    onSlotInspect: (slotId) => console.log('Inspect slot:', slotId),
  });

  // Get active resident for drag overlay
  const activeResident = activeResidentId
    ? rosterWithWarnings.find(r => r.id === activeResidentId)
    : null;

  const shellStyle = useMemo(
    () => ({
      minHeight: '100vh',
      background: 'var(--surface-base)',
      color: 'var(--text-primary)',
      fontFamily: 'var(--font-body)',
    }),
    [],
  );

  return (
    <TooltipProvider
      policy={config.ui.tooltips?.policy}
      testId="minimal-gameplay-tooltip-provider"
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={(event) => {
          const activeId = event.active?.id ? String(event.active.id) : null;
          setActiveResidentId(activeId);
        }}
        onDragEnd={(event) => {
          setActiveResidentId(null);
          // Clear any active slot feedback for all slots
          Object.keys(slotFeedbackState).forEach(slotId => {
            clearSlotFeedback(slotId);
          });
          // Drop handling is done in the slot components
        }}
        onDragCancel={() => {
          setActiveResidentId(null);
        }}
      >
        <div style={shellStyle} className="minimal-gameplay-shell">
        <GameTicker />

        {/* Hidden aria-live region for warnings */}
        <div
          aria-live="assertive"
          aria-atomic="true"
          className="sr-only"
          role="status"
          aria-label="Game warnings"
        />

        <div className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-16" data-testid="minimal-gameplay-page">
          <section
            className="rounded-2xl border p-6 shadow-xl backdrop-blur-sm"
            style={{
              borderRadius: `${gameplayConfig.ui.tokens.cardRadiusPx}px`,
              borderColor: 'var(--panel-border)',
              background: `linear-gradient(120deg, rgba(255,255,255,0.02), transparent), var(--panel-surface)`,
              boxShadow: `0 30px 60px var(--card-shadow-color)`,
            }}
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.45em]" style={{ color: 'var(--text-muted)' }}>Day / Night Cycle</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Day {state.currentDay}</p>
              </div>
              <button
                type="button"
                onClick={() => (state.isPaused ? resumeGame('user') : pauseGame('user'))}
                className="rounded-full border px-4 py-2 text-xs uppercase tracking-[0.35em] transition-all"
                style={{
                  borderColor: 'var(--panel-border)',
                  backgroundColor: 'var(--button-bg)',
                  color: 'var(--button-text)',
                  borderWidth: '1px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-color)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--panel-border)';
                  e.currentTarget.style.color = 'var(--button-text)';
                }}
              >
                {state.isPaused ? 'Riprendi' : 'Pausa'}
              </button>
            </div>
            <div className="mt-6 flex justify-center">
              <DayNightCard
                currentTime={state.currentTime ?? 0}
                config={config}
                isPaused={state.isPaused}
                onToggle={() => (state.isPaused ? resumeGame('user') : pauseGame('user'))}
              />
            </div>

            {/* Resource Ticker */}
            <div className="mt-4 flex justify-center">
              <ResourceTicker
                resources={{
                  gold: state.gold,
                  food: state.food,
                  day: state.currentDay,
                  fatigue: rosterWithWarnings.length > 0
                    ? rosterWithWarnings.reduce((sum, r) => sum + r.fatigue, 0) / rosterWithWarnings.length
                    : 0,
                }}
                deltas={resourceDeltas}
                tickerConfig={feedbackConfig.resourceTicker}
                tooltips={{
                  gold: getTooltipCopy('hudResources', 'gold'),
                  food: getTooltipCopy('hudResources', 'food'),
                  day: getTooltipCopy('hudResources', 'day'),
                  fatigue: getTooltipCopy('hudResources', 'fatigue'),
                }}
                // onAnimationComplete={handleAnimationComplete} // TEMPORARILY DISABLED
              />
            </div>
          </section>

          {/* Action Toolbar */}
          <ActionToolbar
            actionPanel={gameplayConfig.ui.actionPanel}
            onBuyFood={handleBuyFood}
            onStartQuest={handleStartQuestDemo}
            statusMessage={statusMessage}
            disabled={loopWarnings.fatigue.active || loopWarnings.food.active}
          />

          {/* Warning Display */}
          {(loopWarnings.fatigue.active || loopWarnings.food.active) && (
            <section
              className="rounded-2xl border p-6 shadow-xl backdrop-blur-sm"
              style={{
                borderRadius: `${gameplayConfig.ui.tokens.cardRadiusPx}px`,
                borderColor: gameplayConfig.ui.tokens.dangerHex,
                backgroundColor: loopWarnings.fatigue.active
                  ? 'var(--card-highlight)'
                  : 'var(--panel-surface)',
              }}
              aria-live="polite"
              aria-label="Active game warnings"
            >
              <div className="flex items-center gap-3">
                <span
                  className="text-lg"
                  role="img"
                  aria-label={loopWarnings.fatigue.active ? 'Fatigue warning' : 'Food warning'}
                >
                  ⚠️
                </span>
                <div className="flex-1">
                  <p
                    className="text-sm font-medium"
                    style={{ color: gameplayConfig.ui.warningTokens.warningTextHex }}
                  >
                    {loopWarnings.fatigue.active
                      ? loopWarnings.fatigue.message
                      : loopWarnings.food.message}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Activity Slots for Drag & Drop */}
          <section
            className="rounded-2xl border p-6 shadow-xl backdrop-blur-sm"
            style={{
              borderRadius: `${gameplayConfig.ui.tokens.cardRadiusPx}px`,
              borderColor: 'var(--panel-border)',
              background: `linear-gradient(120deg, rgba(255,255,255,0.02), transparent), var(--panel-surface)`,
              boxShadow: `0 30px 60px var(--card-shadow-color)`,
            }}
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.45em]" style={{ color: 'var(--text-muted)' }}>Activity Slots</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Drag residents to start activities</p>
              </div>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {/* ActivitySlotCard component removed - needs replacement */}
              {/* {slotProps.map((slot) => {
                const feedback = slotFeedbackState[slot.slotId];
                return (
                  <ActivitySlotCard
                    key={slot.slotId}
                    slotId={slot.slotId}
                    iconName={slot.iconName}
                    label={slot.label}
                    totalDuration={slot.totalDuration}
                    progressFraction={slot.progressFraction}
                    elapsedSeconds={slot.elapsedSeconds}
                    assignedWorkerName={slot.assignedWorkerName}
                    isInteractive={slot.isInteractive}
                    canAcceptDrop={slot.canAcceptDrop}
                    visualVariant={slot.visualVariant}
                    validationResult={feedback?.validationRule ? {
                      isValid: false,
                      message: feedback.message || 'Invalid drop',
                      failedRule: feedback.validationRule as DropValidationRule,
                    } : undefined}
                    showDropFeedback={feedback?.visible ?? false}
                    onWorkerDrop={(workerId) => {
                      // This should not be called since drops are handled by useMinimalActivitySlotsWithState
                      console.warn('Unexpected onWorkerDrop call in ActivitySlotCard, should be handled by useMinimalActivitySlotsWithState');
                    }}
                    onInspect={slotId => console.log('Inspect slot:', slotId)}
                    testId={`minimal-activity-slot-${slot.slotId}`}
                  />
                );
              })} */}
            </div>
          </section>

          {/* Worker Panel */}
          <WorkerPanel
            residents={rosterWithWarnings}
            selectedResidentId={selectedResidentId}
            onWorkerSelect={setSelectedResidentId}
            fatigueWarningPercent={gameplayConfig.ui.thresholds.fatigueDangerPercent}
            injuryBadgeCopy={gameplayConfig.ui.thresholds.injuryBadgeCopy}
          />

          <StyleLaboratoryPanel
            activePreset={activePreset}
            presets={presets}
            isRandomized={isRandomized}
            onSelectPreset={setPreset}
            onRandomize={randomizeTheme}
            onResetRandomization={resetRandomization}
            kickerLabel="Style Laboratory"
            className="bg-black/20"
          />
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeResident ? (
            <div className="rotate-3 opacity-90">
              <WorkerCard
                id={activeResident.id}
                name={activeResident.name}
                hp={Math.round((activeResident.stats.hp ?? 100) / 10) * 10}
                fatigue={Math.round(activeResident.fatigue * 10) / 10}
                isHovering={false}
                isDragging={true}
              />
            </div>
          ) : null}
        </DragOverlay>
      </div>

      {/* Game Over Modal */}
      <MinimalGameOverModal
        isOpen={gameOverState.isGameOver}
        gameOverState={{
          isGameOver: gameOverState.isGameOver,
          reason: gameOverState.reason || 'food_depleted',
          summary: gameOverState.summary || {
            daysSurvived: 0,
            goldEarned: 0,
            questsCompleted: 0,
            residentsLost: 0,
            finalRoster: [],
          }
        }}
        config={gameplayConfig.ui.gameOver}
        onRestart={() => resetGame()}
        styleTokens={modalStyleTokens}
      />
      </DndContext>
    </TooltipProvider>
  );
}

function GameTicker(): null {
  const tick = useMinimalGameplayStore((s) => s.tick);
  const isPaused = useMinimalGameplayStore((s) => s.state.isPaused);
  const frameRef = useRef<number>();
  const lastRef = useRef<number | null>(null);

  useEffect(() => {
    const loop = (time: number) => {
      if (lastRef.current === null) {
        lastRef.current = time;
      }
      const delta = time - lastRef.current;
      lastRef.current = time;
      if (!isPaused && delta > 0) {
        tick(delta);
      }
      frameRef.current = requestAnimationFrame(loop);
    };
    frameRef.current = requestAnimationFrame(loop);
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      lastRef.current = null;
    };
  }, [isPaused, tick]);

  return null;
}

function DayNightCard({
  currentTime,
  config,
  isPaused,
  onToggle,
}: {
  currentTime: number;
  config: MinimalConfig;
  isPaused: boolean;
  onToggle: () => void;
}): JSX.Element {
  const secondsPerTimeUnit = config.globalRules.secondsPerTimeUnit ?? 1;
  const dayUnits = Math.max(1, config.globalRules.dayNightCycle?.dayTimeUnits ?? config.globalRules.dayLengthInTimeUnits ?? 60);
  const nightUnits = Math.max(1, config.globalRules.dayNightCycle?.nightTimeUnits ?? config.globalRules.dayLengthInTimeUnits ?? 60);
  const totalUnits = Math.max(1, dayUnits + nightUnits);
  const totalSeconds = totalUnits * secondsPerTimeUnit;
  const normalizedTime = ((currentTime % totalUnits) + totalUnits) % totalUnits;
  const isDayPhase = normalizedTime < dayUnits;
  const progressFraction = totalUnits > 0 ? normalizedTime / totalUnits : 0;
  const phaseIcon = isDayPhase ? (
    <span role="img" aria-label="Sun" className="text-4xl">
      ☀️
    </span>
  ) : (
    <span role="img" aria-label="Moon" className="text-4xl">
      🌙
    </span>
  );
  const label = isDayPhase ? 'Day Cycle' : 'Night Cycle';
  const variant = isDayPhase ? 'solar' : 'azure';

  return (
    <DayNightActionCard
      phaseIcon={phaseIcon}
      isPlaying={!isPaused}
      progressFraction={progressFraction}
      totalSeconds={totalSeconds}
      variant={variant}
      onToggle={onToggle}
      label={label}
    />
  );
}
