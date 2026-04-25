/**
 * Minimal Feedback Page – Visual Feedback Integration
 *
 * Integrates drop feedback animations and telemetry.
 * Implements bloom green (valid) and shake red (invalid) animations based on config.
 */

import type { JSX } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { DndContext, PointerSensor, TouchSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import type { DragEndEvent as DragEndEventType, DragStartEvent as DragStartEventType } from '@dnd-kit/core';
import { useMinimalGameplayStore } from '@/store/useMinimalGameplay';
import { initializeMinimalGameplayStore } from '@/store/useMinimalGameplay';
import { DropFeedbackAnimations, DROP_FEEDBACK_CSS } from '@/ui/idleVillage/components/DropFeedbackAnimations';
import { useDropFeedbackTelemetry } from '@/ui/idleVillage/hooks/useDropFeedbackTelemetry';
import { useDropFeedback } from '@/ui/idleVillage/hooks/useDropFeedback';
import { DEFAULT_DROP_FEEDBACK_CONFIG } from '@/ui/idleVillage/config/dropFeedbackConfig';
import { useMinimalActivitySlots } from '@/ui/idleVillage/hooks/useMinimalActivitySlots';
import { MINIMAL_GAMEPLAY_CONFIG } from '@/balancing/config/idleVillage/minimalGameplayConfig';
import type { MinimalGameplayDropReason } from '@/balancing/config/idleVillage/minimalConfig';

// Inject CSS animations (in real app, this would be done globally)
if (typeof document !== 'undefined' && !document.getElementById('drop-feedback-styles')) {
  const style = document.createElement('style');
  style.id = 'drop-feedback-styles';
  style.textContent = DROP_FEEDBACK_CSS;
  document.head.appendChild(style);
}

/**
 * Mock WorkerCard component for demonstration.
 */
function MockWorkerCard({ id, isDragging }: { id: string; isDragging: boolean }): JSX.Element {
  return (
    <div
      style={{
        padding: '12px 16px',
        borderRadius: '8px',
        border: '1px solid #ccc',
        background: isDragging ? '#f0f0f0' : '#fff',
        cursor: 'grab',
        userSelect: 'none',
        boxShadow: isDragging ? '0 4px 12px rgba(0,0,0,0.2)' : '0 2px 4px rgba(0,0,0,0.1)',
        transform: isDragging ? 'scale(1.05)' : 'scale(1)',
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{id}</div>
      <div style={{ fontSize: '12px', color: '#666' }}>Worker</div>
    </div>
  );
}

/**
 * Mock ActivitySlot component with feedback animations.
 */
function MockActivitySlot({
  slotId,
  label,
  icon,
  feedbackType,
  feedbackMessage,
  isActive,
}: {
  slotId: string;
  label: string;
  icon: string;
  feedbackType: 'valid' | 'invalid' | 'warning' | 'blocked' | null;
  feedbackMessage?: string;
  isActive: boolean;
}): JSX.Element {
  return (
    <DropFeedbackAnimations feedbackType={feedbackType} enabled={true}>
      <div
        style={{
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid #ccc',
          background: isActive ? '#e8f5e8' : '#f9f9f9',
          minHeight: '80px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          opacity: isActive ? 1 : 0.6,
        }}
        data-slot-id={slotId}
      >
        <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{icon}</div>
        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{label}</div>
        <div style={{ fontSize: '12px', color: '#666' }}>
          {isActive ? 'Active' : 'Available'}
        </div>
        {feedbackType && (
          <div
            style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '4px',
              background: feedbackType === 'valid' ? '#22c55e' : feedbackType === 'invalid' ? '#ef4444' : '#f59e0b',
              color: '#fff',
            }}
          >
            {feedbackType}
          </div>
        )}
        {feedbackMessage && (
          <div style={{ marginTop: '8px', fontSize: '11px', textAlign: 'center', color: '#475569' }}>
            {feedbackMessage}
          </div>
        )}
      </div>
    </DropFeedbackAnimations>
  );
}

/**
 * Main feedback page.
 */
export function MinimalFeedbackPage(): JSX.Element {
  const [initialized, setInitialized] = useState(false);
  const [draggedResidentId, setDraggedResidentId] = useState<string | null>(null);
  const [validationTime, setValidationTime] = useState<number>(0);
  type FeedbackState = {
    slotId: string | null;
    type: 'valid' | 'invalid' | 'warning' | 'blocked' | null;
    message?: string;
  };
  const [feedbackState, setFeedbackState] = useState<FeedbackState>({ slotId: null, type: null });

  const isLoading = useMinimalGameplayStore((s) => s.isLoading);
  const error = useMinimalGameplayStore((s) => s.error);
  const state = useMinimalGameplayStore((s) => s.state);
  const startActivity = useMinimalGameplayStore((s) => s.startActivity);
  const config = useMinimalGameplayStore((s) => s.config);
  const { slots, slotByActivityId } = useMinimalActivitySlots(config);
  const dropCopy = MINIMAL_GAMEPLAY_CONFIG.ui.dropCopy;

  // Drop feedback and telemetry
  const dropFeedback = useDropFeedback({
    config: DEFAULT_DROP_FEEDBACK_CONFIG,
    enableTelemetry: true,
    context: 'minimal-feedback',
  });

  const telemetry = useDropFeedbackTelemetry({
    source: 'minimal-feedback-page',
    enabled: true,
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

  useEffect(() => {
    if (!initialized) {
      setInitialized(true);
      initializeMinimalGameplayStore().catch((err) => {
        console.error('Failed to initialize minimal gameplay store:', err);
      });
    }
  }, [initialized]);

  const handleDragStart = (event: DragStartEventType) => {
    const residentId = event.active.id as string;
    setDraggedResidentId(residentId);
    setFeedbackState({ slotId: null, type: null });
  };

  const handleDragEnd = (event: DragEndEventType) => {
    const { active, over } = event;
    const residentId = active.id as string;
    const startTime = performance.now();

    setDraggedResidentId(null);

    if (!over) {
      setFeedbackState({ slotId: null, type: null });
      telemetry.trackFeedbackHidden();
      return;
    }

    const slotId = over.id as string;
    const activityId = slotId.replace('slot-', '');
    const slotMeta = slotByActivityId[activityId];

    // Simulate validation timing
    const validationStart = performance.now();
    const validation = useMinimalGameplayStore.getState().canStartActivity(residentId, activityId);
    const validationEnd = performance.now();
    const validationTimeMs = validationEnd - validationStart;

    setValidationTime(validationTimeMs);

    const resolveDropMessage = (reasonCode?: MinimalGameplayDropReason) =>
      dropCopy[reasonCode ?? 'default'] ?? dropCopy.default;

    const successMessage = slotMeta ? `Residente assegnato a ${slotMeta.label}.` : dropCopy.default;
    const slotFeedbackId = slotId;
    let newFeedbackType: 'valid' | 'invalid' | 'warning' | 'blocked' | null = null;
    let feedbackMessage: string | undefined;
    if (validation.canStart) {
      newFeedbackType = 'valid';
      startActivity(residentId, activityId);
      feedbackMessage = successMessage;
    } else {
      newFeedbackType = validation.reasonCode === 'resident_injured' ? 'blocked' : 'invalid';
      feedbackMessage = resolveDropMessage(validation.reasonCode);
    }

    setFeedbackState({ slotId: slotFeedbackId, type: newFeedbackType, message: feedbackMessage });

    // Track telemetry
    telemetry.trackValidation({
      residentId,
      activityId,
      isValid: validation.canStart,
      reason: validation.reason,
      validationTimeMs,
    });

    if (newFeedbackType) {
      telemetry.trackFeedbackShown({
        feedbackType: newFeedbackType,
        residentId,
        activityId,
      });
      dropFeedback.showSlotFeedback({
        slotId: slotFeedbackId,
        feedbackType: newFeedbackType,
        message: feedbackMessage,
        residentId,
        activityId,
      });
    }

    // Clear feedback after animation
    setTimeout(() => {
      setFeedbackState({ slotId: null, type: null });
      telemetry.trackFeedbackHidden();
      dropFeedback.clearSlotFeedback(slotFeedbackId);
    }, 1200);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>Error: {error}</div>;
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: 14, padding: 20 }}>
        <h1>Minimal Visual Feedback</h1>
        <p>Bloom green (valid) and shake red (invalid) animations with telemetry.</p>
        
        <div style={{ marginBottom: 20 }}>
          <h3>Validation Performance</h3>
          <div>Last validation time: {validationTime.toFixed(2)}ms</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
          <div style={{ border: '1px solid #ccc', borderRadius: 8, padding: 16 }}>
            <h3>Residents</h3>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {state.residents.map((resident) => (
                <MockWorkerCard
                  key={resident.id}
                  id={resident.id}
                  isDragging={draggedResidentId === resident.id}
                />
              ))}
            </div>
          </div>

          <div style={{ border: '1px solid #ccc', borderRadius: 8, padding: 16 }}>
            <h3>Activity Slots</h3>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {slots.map((slot) => {
                const dropSlotId = `slot-${slot.activityId}`;
                const isActive = state.activeActivities.some((a) => a.activityId === slot.activityId);
                const isCurrentFeedback = feedbackState.slotId === dropSlotId;
                return (
                  <MockActivitySlot
                    key={dropSlotId}
                    slotId={dropSlotId}
                    label={slot.label}
                    icon={slot.icon}
                    feedbackType={isCurrentFeedback ? feedbackState.type : null}
                    feedbackMessage={isCurrentFeedback ? feedbackState.message : undefined}
                    isActive={isActive}
                  />
                );
              })}
            </div>
          </div>

          <div style={{ border: '1px solid #ccc', borderRadius: 8, padding: 16 }}>
            <h3>Game State</h3>
            <div style={{ fontFamily: 'monospace', fontSize: 12 }}>
              <div>Day: {state.currentDay}</div>
              <div>Gold: {state.gold}</div>
              <div>Food: {state.food}/{state.maxFood}</div>
              <div>Residents: {state.residents.length}</div>
              <div>Active Activities: {state.activeActivities.length}</div>
              <div>Paused: {state.isPaused ? 'YES' : 'NO'}</div>
            </div>
          </div>
        </div>
      </div>

      <DragOverlay>
        {draggedResidentId && (
          <MockWorkerCard id={draggedResidentId} isDragging={true} />
        )}
      </DragOverlay>
    </DndContext>
  );
}
