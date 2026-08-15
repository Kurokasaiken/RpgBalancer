/**
 * rosterKit
 *
 * Frozen re-export of the canonical {@link VillageRosterSection} together with
 * a thin data binder. This kit is the source of truth for the `/minimal-roster`
 * isolation page.
 *
 * Design (Plan v2 §S2):
 * - This file contains NO new component code. It re-exports the canonical
 *   `VillageRosterSection` and exposes a single binder hook
 *   ({@link useRosterKitData}) that returns the canonical resident bundle.
 * - Total original code in this file must stay below ~50 LOC. If it grows,
 *   the logic belongs in `VillageRosterSection` or in the bridge — not here.
 *
 * Part of the Component Freezing & Certification system (see
 * src/docs/docs/plans/component_freezing_certification_plan_v2.md).
 */

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
import { useCanonicalRosterBundle } from '../_infra/CanonicalDataBridge';
import type { CanonicalRosterBundle } from '../_infra/CanonicalDataBridge';
import { createKitShell, FULL_PROVIDER_CHAIN } from '../_infra/KitShell';
import { DragProvider } from '@/ui/idleVillage/components/DragContext';
import { CustomDragOverlay } from '@/ui/idleVillage/components/CustomDragOverlay';
import { SandboxTimingProvider } from '@/ui/idleVillage/hooks/useSandboxTimingBridge';
import { SkinSystemProvider } from '@/ui/idleVillage/hooks/useSkinSystem';
import { VillageRosterSection } from '@/ui/idleVillage/roster';
import type { VillageRosterSectionProps } from '@/ui/idleVillage/components/VillageRosterSection';
import { DEFAULT_ROSTER_SORT_MODE, type RosterSortMode } from '@/ui/idleVillage/config/rosterSortConfig';
import { useDragOutcome, elementCenter } from '@/ui/idleVillage/interaction/useDragOutcome';
import { DragOutcomeFlight } from '@/ui/idleVillage/interaction/DragOutcomeFlight';
import { useState } from 'react';

/**
 * Result of the consumer's onDragEnd:
 * - `false` → invalid drop, spring-back to the roster card
 * - `{ flightToSlot }` → valid drop: the kit flies the token into the slot
 *   (from the actual release point) and then calls `onFlightComplete`
 * - `true`/`void` → nothing special, reset to idle
 */
export type RosterDropVerdict =
  | void
  | boolean
  | { flightToSlot: { slotId: string; element: Element | null } };

// Canonical component — re-exported, not re-implemented.
export { VillageRosterSection } from '@/ui/idleVillage/roster';
export type { VillageRosterSectionProps } from '@/ui/idleVillage/components/VillageRosterSection';

// Canonical data binder — returns the same bundle TestRosterPage uses.
export function useRosterKitData(defaultFatigue: number = 0): CanonicalRosterBundle {
  return useCanonicalRosterBundle(defaultFatigue);
}

/**
 * RosterKitShell
 *
 * Mounts the canonical provider chain required by `VillageRosterSection` and
 * its descendants (`ResidentRosterPanel`, `PgCard`, ...). The chain mirrors
 * exactly what `TestRosterPage` wraps the roster with (Audit §2.5):
 *
 *   SkinSystemProvider → SandboxTimingProvider → DragProvider → DndContext
 *
 * Using this shell guarantees provider parity between `/test` and
 * `/minimal-roster`, which is a prerequisite for the contract test.
 * Smart: mounts only the providers missing above in the tree.
 */
export const RosterKitShell = createKitShell(FULL_PROVIDER_CHAIN, 'RosterKitShell');

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
 * RosterDraggable
 *
 * Pre-configured roster component with full drag & drop context.
 * Includes sorting, filtering, and all necessary providers.
 * Use this for a drop-in roster with drag functionality.
 */
export function RosterDraggable({
  defaultFatigue = 0,
  componentId = 'roster-draggable',
  pillar = 'frontier',
  useWanderlustSkin = false,
  onDragEnd: externalOnDragEnd,
  onFlightComplete,
  useExternalDndContext = false,
  activeResidentId,
  ...props
}: Omit<VillageRosterSectionProps, 'residents' | 'sortMode' | 'onSortModeChange' | 'onDragEnd'> & {
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
      <VillageRosterSection
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

// Re-export the kit contract for convenience.
export { ROSTER_KIT_VERSION, type RosterKitContract } from './rosterKit.contract';
