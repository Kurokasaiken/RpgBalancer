import { useState } from 'react';
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDndMonitor,
  pointerWithin,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { DragProvider } from '@/ui/idleVillage/components/DragContext';
import { CustomDragOverlay } from '@/ui/idleVillage/components/CustomDragOverlay';
import { SandboxTimingProvider } from '@/ui/idleVillage/hooks/useSandboxTimingBridge';
import { SkinSystemProvider } from '@/ui/idleVillage/hooks/useSkinSystem';
import { DEFAULT_ROSTER_SORT_MODE, type RosterSortMode } from '@/ui/idleVillage/config/rosterSortConfig';
import { useDragOutcome, elementCenter } from '@/ui/idleVillage/interaction/useDragOutcome';
import { DragOutcomeFlight } from '@/ui/idleVillage/interaction/DragOutcomeFlight';
import { useRosterKitData, type RosterDropVerdict } from '@/ui/idleVillage/frozen/kits/rosterKit';
import { VillageRosterSectionV2, type VillageRosterSectionV2Props } from './VillageRosterSectionV2';

/**
 * Roster V2 — a copy of the certified `RosterDraggable` (rosterKit 1.1.0) that renders
 * the HUD material (`HudPlaque`) and meets the HUD text floor. The V1 kit is untouched.
 */
/**
 * Subscribes to drag events of the nearest DndContext (internal or external)
 * and forwards them to the kit's handlers. Must be rendered INSIDE a DndContext.
 */
function RosterDragMonitor({
  onDragStart,
  onDragEnd,
}: {
  onDragStart: (event: DragStartEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
}) {
  useDndMonitor({ onDragStart, onDragEnd });
  return null;
}

/**
 * RosterDraggableV2
 *
 * Pre-configured roster component with full drag & drop context.
 * Includes sorting, filtering, and all necessary providers.
 * Use this for a drop-in roster with drag functionality.
 */
export function RosterDraggableV2({
  defaultFatigue = 0,
  componentId = 'roster-draggable',
  pillar = 'frontier',
  useWanderlustSkin = false,
  onDragEnd: externalOnDragEnd,
  onFlightComplete,
  useExternalDndContext = false,
  activeResidentId,
  ...props
}: Omit<VillageRosterSectionV2Props, 'residents' | 'sortMode' | 'onSortModeChange' | 'onDragEnd'> & {
  defaultFatigue?: number;
  componentId?: string;
  pillar?: string;
  useWanderlustSkin?: boolean;
  onDragEnd?: (event: DragEndEvent) => RosterDropVerdict;
  /** Called when a `flightToSlot` verdict finishes landing: apply the assignment here. */
  onFlightComplete?: (residentId: string, slotId?: string) => void;
  useExternalDndContext?: boolean; // If true, don't create internal DndContext
  /** Optional resident id forced into the drag overlay (e.g. via test hooks). */
  activeResidentId?: string | null;
}) {
  const { residents, residentsById } = useRosterKitData(defaultFatigue);
  const [sortMode, setSortMode] = useState<RosterSortMode>(DEFAULT_ROSTER_SORT_MODE);

  // Shared drag-outcome state machine (idle → dragging → flight|returning → idle)
  const { state: dragVisualState, startDrag, startFlight, springBack, settle } = useDragOutcome();

  // Sensors configuration
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
    startDrag(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    // Call external handler if provided; see RosterDropVerdict for the protocol
    const verdict = externalOnDragEnd?.(event);
    const residentId = event.active.id as string;

    // Spring-back when dropped outside any target OR the target rejected the drop
    // (the hook auto-resets to idle after the bounce-spring completes)
    if (!event.over || verdict === false) {
      springBack(residentId);
      return;
    }

    // Valid drop with a slot destination: magnetic flight from the release
    // point into the slot, then onFlightComplete applies the assignment.
    if (verdict && typeof verdict === 'object' && 'flightToSlot' in verdict) {
      const { slotId, element } = verdict.flightToSlot;
      const target = elementCenter(element);
      if (target) {
        startFlight({ residentId, slotId, isInset: true, toX: target.x, toY: target.y });
      } else {
        // Slot not rendered (e.g. lives in a closed POI detail): no animation,
        // apply the assignment immediately.
        settle();
        onFlightComplete?.(residentId, slotId);
      }
      return;
    }

    settle();
  };

  const handleFlightComplete = (residentId: string, slotId?: string) => {
    settle();
    onFlightComplete?.(residentId, slotId);
  };

  const rosterContent = (
    <>
      {/* Bridges drag events from whichever DndContext is above (internal or
          external) into the kit's visual state — required so the drag overlay
          and spring-back animation also work with useExternalDndContext. */}
      <RosterDragMonitor onDragStart={handleDragStart} onDragEnd={handleDragEnd} />
      <VillageRosterSectionV2
        residents={residents}
        sortMode={sortMode}
        onSortModeChange={setSortMode}
        componentId={componentId}
        getResidentCompatibility={() => undefined}
        context={{ locationType: 'roster', residentType: 'worker', scenarioType: 'test' }}
        dragVisualState={dragVisualState}
        pillar={pillar as any}
        useWanderlustSkin={useWanderlustSkin}
        {...props}
      />
      <CustomDragOverlay
        residentsById={residentsById}
        usePgCardPreview={true}
        dragVisualState={dragVisualState}
        forcedResidentId={activeResidentId}
      />
      {/* Magnetic flight into the slot on a flightToSlot verdict */}
      <DragOutcomeFlight
        state={dragVisualState}
        residentsById={residentsById}
        onComplete={handleFlightComplete}
      />
    </>
  );

  // If using external DndContext, return just the content without providers
  if (useExternalDndContext) {
    return rosterContent;
  }

  // Otherwise, wrap with full provider chain
  return (
    <SkinSystemProvider>
      <SandboxTimingProvider>
        <DragProvider>
          {/* Drag events are handled via RosterDragMonitor inside rosterContent */}
          <DndContext sensors={sensors} collisionDetection={pointerWithin}>
            {rosterContent}
          </DndContext>
        </DragProvider>
      </SandboxTimingProvider>
    </SkinSystemProvider>
  );
}
