import React from 'react';
import clsx from 'clsx';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type { ActivitySlotData } from '@/ui/idleVillage/types/ActivitySlotData';
import { DetailPanelCard, type ActivitySchedulerBridge } from '@/ui/idleVillage/components/DetailPanelCard';

/**
 * Minimal context required to render a DetailPanelCard inside the stacked overlay.
 * Mirrors the data produced by useMapContext without importing that hook directly.
 */
export interface DetailPanelContext {
  slotId: string;
  slot: ActivitySlotData;
  activity: ActivityDefinition;
}

/**
 * Props required by the DetailPanelStack orchestration layer.
 */
export interface DetailPanelStackProps {
  /** Stacked contexts defining which slots/activities should surface drawers. */
  detailContexts: DetailPanelContext[];
  /** Map of slotId -> residentId assignments (mirrors scheduler store). */
  slotAssignments: Record<string, string | null>;
  /** Resident lookup used by DetailPanelCard for stat displays. */
  residentsById: Record<string, ResidentState>;
  /** Conversion factor from abstract time units to seconds. */
  secondsPerTimeUnit: number;
  /** Active drag token so cards can show drop states. */
  draggingResidentId: string | null;
  /** Bridge exposing scheduler operations (pause, resume, etc.). */
  schedulerBridge: ActivitySchedulerBridge;
  /** Handler invoked when a worker gets dropped on a slot action. */
  onWorkerDrop: (
    activityId: string,
    residentId: string | null,
    options?: { autoStart?: boolean }
  ) => void;
  /** Starts a slot run from the stack (usually proxies to the scheduler). */
  onStart: (slotId: string) => boolean | void;
  /** Removes a slot from the stack, closing its drawer. */
  onClose: (slotId: string) => void;
  /** Mirrors theater state to offset the overlay when necessary. */
  isTheaterOpen: boolean;
}

/**
 * Pointer-safe overlay that stacks DetailPanelCard drawers while mirroring the scheduler state from
 * useVillageSandbox.
 *
 * @param props.detailContexts - Ordered contexts describing which slots to surface.
 * @param props.slotAssignments - Snapshot of resident assignments per slot.
 * @param props.residentsById - Resident lookup injected into each card.
 * @param props.draggingResidentId - Drag token propagated for drop affordances.
 * @param props.schedulerBridge - Adapter exposing scheduler operations.
 * @param props.onWorkerDrop - Handler fired when a worker is dropped on a CTA.
 * @param props.onStart - Starts executions from the stacked cards.
 * @param props.onClose - Removes a context from the stack.
 * @param props.isTheaterOpen - Shifts the overlay when Theater is visible.
 */
export const DetailPanelStack: React.FC<DetailPanelStackProps> = ({
  detailContexts,
  slotAssignments,
  residentsById,
  secondsPerTimeUnit,
  draggingResidentId,
  schedulerBridge,
  onWorkerDrop,
  onStart,
  onClose,
  isTheaterOpen,
}) => {
  if (detailContexts.length === 0) {
    return null;
  }

  return (
    <div
      data-testid="detail-panel-stack"
      className={clsx(
        'pointer-events-none fixed inset-0 z-30 flex items-center justify-center px-4 py-8 sm:px-6',
        isTheaterOpen ? 'lg:justify-start lg:pl-16' : 'lg:justify-center'
      )}
      style={{ pointerEvents: 'none' }}
    >
      <div
        className={clsx(
          'pointer-events-none flex w-full max-w-6xl flex-wrap justify-center gap-4',
          isTheaterOpen ? 'lg:justify-start' : 'lg:justify-center'
        )}
        style={{ pointerEvents: 'none' }}
      >
        {detailContexts.map((context) => (
          <div
            key={context.slotId}
            className="pointer-events-none flex w-full max-w-[420px] justify-center"
          >
            <div className="pointer-events-auto">
              <DetailPanelCard
                slotId={context.slotId}
                slot={context.slot}
                activity={context.activity}
                slotAssignments={slotAssignments}
                residents={residentsById}
                secondsPerTimeUnit={secondsPerTimeUnit}
                draggingResidentId={draggingResidentId}
                scheduler={schedulerBridge}
                onWorkerDrop={onWorkerDrop}
                onStart={onStart}
                onClose={onClose}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DetailPanelStack;
