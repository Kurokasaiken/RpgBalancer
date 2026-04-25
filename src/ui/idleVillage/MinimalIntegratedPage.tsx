/**
 * Minimal Integrated Page – UI Integration
 *
 * Sostituisce il wireframe con WorkerCard/ActivitySlot e integra @dnd-kit.
 * Collega dropFeedbackConfig + useDropFeedback.
 */

import type { JSX } from 'react';
import { useEffect, useState } from 'react';
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, PointerSensor, TouchSensor, useSensor, useSensors, pointerWithin } from '@dnd-kit/core';
import { useMinimalGameplayStore } from '@/store/useMinimalGameplay';
import { initializeMinimalGameplayStore } from '@/store/useMinimalGameplay';
import { WorkerCard } from '@/ui/idleVillage/components/WorkerCard';
import { ActivitySlot } from '@/ui/idleVillage/components/ActivitySlot';
import { useDropFeedback } from '@/ui/idleVillage/hooks/useDropFeedback';
import { DEFAULT_DROP_FEEDBACK_CONFIG } from '@/ui/idleVillage/config/dropFeedbackConfig';
import { TooltipProvider } from '@/ui/idleVillage/components/TooltipProvider';

/**
 * Residents section with WorkerCard components.
 */
function ResidentsSection(): JSX.Element {
  const residents = useMinimalGameplayStore((s) => s.state.residents);
  const activeActivities = useMinimalGameplayStore((s) => s.state.activeActivities);

  return (
    <div style={{ padding: 16 }}>
      <h2>Residents</h2>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {residents.map((resident) => {
          const isActive = activeActivities.some((a) => a.residentId === resident.id);
          return (
            <WorkerCard
              key={resident.id}
              id={resident.id}
              name={resident.id}
              hp={resident.isInjured ? 0 : 100 - resident.fatigue}
              fatigue={resident.fatigue}
              isDragging={false}
              isHovering={false}
            />
          );
        })}
      </div>
    </div>
  );
}

/**
 * Activity slots section with drag-and-drop.
 */
function ActivitySlotsSection(): JSX.Element {
  const state = useMinimalGameplayStore((s) => s.state);
  const startActivity = useMinimalGameplayStore((s) => s.startActivity);
  const [draggedResidentId, setDraggedResidentId] = useState<string | null>(null);

  // Drop feedback integration
  const dropFeedback = useDropFeedback({
    config: DEFAULT_DROP_FEEDBACK_CONFIG,
    enableTelemetry: true,
    context: 'minimal-integrated',
  });

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const residentId = event.active.id as string;
    setDraggedResidentId(residentId);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const residentId = active.id as string;
    setDraggedResidentId(null);

    if (!over) {
      return;
    }

    const slotId = over.id as string;
    const activityId = slotId.replace('slot-', '');

    // Validate and start activity
    const validation = useMinimalGameplayStore.getState().canStartActivity(residentId, activityId);
    if (validation.canStart) {
      startActivity(residentId, activityId);
    } else {
      console.warn('Cannot start activity:', validation.reason);
    }

    // Trigger drop feedback
    dropFeedback.validateDropWithFeedback({
      residentId,
      activityId,
      validationResult: validation.canStart ? { isValid: true, reason: '' } : { isValid: false, reason: validation.reason ?? '' },
    });
  };

  // Mock activity slots based on config
  const activitySlots = [
    { id: 'slot-job_gold_mine_minimal', iconName: 'pickaxe', label: 'Gold Mine' },
    { id: 'slot-quest_forest_hunt_minimal', iconName: 'bow', label: 'Forest Hunt' },
    { id: 'slot-market_trade_minimal', iconName: 'coins', label: 'Market Trade' },
  ];

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div style={{ padding: 16 }}>
        <h2>Activity Slots</h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {activitySlots.map((slot) => {
            const activityId = slot.id.replace('slot-', '');
            const activeActivity = state.activeActivities.find((a) => a.activityId === activityId);
            const assignedResident = activeActivity ? state.residents.find((r) => r.id === activeActivity.residentId) : null;

            return (
              <ActivitySlot
                key={slot.id}
                slotId={slot.id}
                iconName={slot.iconName}
                label={slot.label}
                assignedWorkerName={assignedResident?.id}
                progressFraction={activeActivity ? (1 - activeActivity.ticksRemaining / 5) : 0} // Mock duration
                elapsedSeconds={activeActivity ? (5 - activeActivity.ticksRemaining) * 10 : 0}
                totalDuration={50}
                isInteractive={!activeActivity}
                canAcceptDrop={!activeActivity}
                showDropFeedback={true}
                validationResult={dropFeedback.lastValidationResult}
              />
            );
          })}
        </div>
      </div>

      <DragOverlay>
        {draggedResidentId && (
          <WorkerCard
            id={draggedResidentId}
            name={draggedResidentId}
            hp={100}
            fatigue={0}
            isDragging={true}
            isHovering={false}
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}

/**
 * Game controls section.
 */
function GameControls(): JSX.Element {
  const tick = useMinimalGameplayStore((s) => s.tick);
  const pauseGame = useMinimalGameplayStore((s) => s.pauseGame);
  const resumeGame = useMinimalGameplayStore((s) => s.resumeGame);
  const resetGame = useMinimalGameplayStore((s) => s.resetGame);
  const buyFood = useMinimalGameplayStore((s) => s.buyFood);
  const state = useMinimalGameplayStore((s) => s.state);

  return (
    <div style={{ padding: 16 }}>
      <h2>Controls</h2>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={tick} disabled={state.isPaused}>
          Tick
        </button>
        <button onClick={state.isPaused ? resumeGame : pauseGame}>
          {state.isPaused ? 'Resume' : 'Pause'}
        </button>
        <button onClick={resetGame}>Reset</button>
        <button onClick={() => buyFood(5)}>Buy 5 Food</button>
      </div>
    </div>
  );
}

/**
 * State display section.
 */
function StateDisplay(): JSX.Element {
  const state = useMinimalGameplayStore((s) => s.state);
  const gameOver = useMinimalGameplayStore((s) => s.gameOver());
  const daysRemaining = useMinimalGameplayStore((s) => s.daysRemaining());

  return (
    <div style={{ padding: 16 }}>
      <h2>State</h2>
      <div style={{ fontFamily: 'monospace', fontSize: 12 }}>
        <div>Day: {state.currentDay}</div>
        <div>Gold: {state.gold}</div>
        <div>Food: {state.food}/{state.maxFood}</div>
        <div>Residents: {state.residents.length}</div>
        <div>Active Activities: {state.activeActivities.length}</div>
        <div>Paused: {state.isPaused ? 'YES' : 'NO'}</div>
        <div>Days Remaining: {daysRemaining === Infinity ? '∞' : daysRemaining}</div>
        {gameOver.isOver && <div style={{ color: 'red' }}>GAME OVER: {gameOver.reason}</div>}
      </div>
    </div>
  );
}

/**
 * Main integrated page.
 */
export function MinimalIntegratedPage(): JSX.Element {
  const [initialized, setInitialized] = useState(false);
  const isLoading = useMinimalGameplayStore((s) => s.isLoading);
  const error = useMinimalGameplayStore((s) => s.error);

  useEffect(() => {
    if (!initialized) {
      setInitialized(true);
      initializeMinimalGameplayStore().catch((err) => {
        console.error('Failed to initialize minimal gameplay store:', err);
      });
    }
  }, [initialized]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>Error: {error}</div>;
  }

  return (
    <TooltipProvider testId="minimal-integrated-tooltip-provider">
      <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: 14, padding: 20 }}>
        <h1>Minimal Integrated Gameplay</h1>
        <p>WorkerCard + ActivitySlot + @dnd-kit + dropFeedback integration.</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
          <div style={{ border: '1px solid #ccc', borderRadius: 8 }}>
            <StateDisplay />
          </div>
          <div style={{ border: '1px solid #ccc', borderRadius: 8 }}>
            <GameControls />
          </div>
          <div style={{ border: '1px solid #ccc', borderRadius: 8 }}>
            <ResidentsSection />
          </div>
          <div style={{ border: '1px solid #ccc', borderRadius: 8 }}>
            <ActivitySlotsSection />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
