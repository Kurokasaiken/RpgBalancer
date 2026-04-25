import React, { useMemo } from 'react';
import type { ActivitySlotData } from '@/ui/idleVillage/types/ActivitySlotData';
import type { VerbSummary } from '@/ui/idleVillage/verbSummaries';
import { ActiveHUDSelectors } from '@/ui/idleVillage/hooks/useActiveHUDStateSync';
import TheaterOverlay from './TheaterOverlay';
import ResidentSlotRack from './ResidentSlotRack';
import { useResidentSlotController } from '@/ui/idleVillage/slots/useResidentSlotController';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import { useActivityScheduler } from '@/ui/idleVillage/hooks/useActivityScheduler';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';

/**
 * TheaterView Component - IV-RS-C Resident Slot Parity Implementation
 *
 * This component provides the theater overlay experience with resident slot management.
 * It implements IV-RS-C Phase C of the resident slot expansion plan, bringing board-map
 * parity to the theater view using ResidentSlotRack and useResidentSlotController.
 *
 * @param slotLabel - Display label for the theater slot
 * @param slotIcon - Icon to display for the slot
 * @param verbs - Legacy verb summaries for backward compatibility
 * @param onClose - Callback to close the theater
 * @param acceptResidentDrop - Whether to accept resident drops (legacy)
 * @param onResidentDrop - Callback for resident drops (legacy)
 * @param onAssignResident - Callback for resident assignment (new IV-RS-C)
 * @param slotDropStates - Drop state mapping (legacy)
 * @param onVerbDrop - Callback for verb drops
 * @param activity - Activity definition for slot controller (IV-RS-C)
 * @param residents - Resident data for slot controller (IV-RS-C)
 * @param scheduler - Activity scheduler for progress data (IV-RS-C)
 *
 * ## IV-RS-C Features:
 * - ResidentSlotRack integration with 'detail' layout
 * - Real-time progress from useActivityScheduler
 * - Bloom state feedback from slot controller
 * - Multi-slot support with badge count display
 * - Telemetry events: theater_slot_rendered, theater_slot_assignment_attempt
 *
 * ## Phase D Linkage (VerbDetail Parity):
 * In Phase D, VerbDetailCard will consume TheaterView with similar props:
 * - activity: ActivityDefinition from verb context
 * - residents: ResidentState[] from verb assignments
 * - scheduler: useActivityScheduler hook for progress tracking
 * - onAssignResident: Integrated with verb assignment flow
 *
 * This enables consistent slot management across theater, verb detail, and board views.
 */

export interface TheaterViewProps {
  slotLabel: string;
  slotIcon?: string;
  verbs: VerbSummary[];
  onClose: () => void;
  acceptResidentDrop?: boolean;
  onResidentDrop?: (residentId: string | null) => void;
  onAssignResident?: (slotId: string, residentId: string | null) => void;
  slotDropStates?: Record<string, 'idle' | 'valid' | 'invalid'>;
  onVerbDrop?: (verbId: string, residentId: string | null) => void;
  // New props for IV-RS-C parity
  activity?: ActivityDefinition;
  residents?: Record<string, any>;
  scheduler?: ReturnType<typeof useActivityScheduler>;
}

const TheaterView: React.FC<TheaterViewProps> = (props) => {
  const {
    slotLabel,
    slotIcon,
    verbs,
    onClose,
    acceptResidentDrop,
    onResidentDrop,
    onAssignResident,
    slotDropStates,
    onVerbDrop,
    activity,
    residents = {},
    scheduler,
  } = props;

  // IV-RS-C: Resident Slot Controller for detail layout parity
  const residentSlotData = useMemo(() => {
    if (!activity || !scheduler) {
      return null;
    }

    // Extract assignments from scheduler state
    const assignments: Record<string, string | null> = {};
    const scheduledActivities = scheduler.scheduledActivities;
    for (const [_, scheduled] of scheduledActivities) {
      if (scheduled.activityId === activity.id && scheduled.characterIds.length > 0) {
        // Map slot by index for multi-slot activities
        const slotIndex = assignments.length.toString();
        assignments[slotIndex] = scheduled.characterIds[0];
      }
    }

    return {
      activity,
      assignments,
      residents,
    };
  }, [activity, scheduler, residents]);

  const slotController = useResidentSlotController({
    activity: residentSlotData?.activity || ({} as ActivityDefinition),
    assignments: residentSlotData?.assignments || {},
    residents: residentSlotData?.residents || {},
  });

  // Progress data from scheduler
  const slotProgress = useMemo(() => {
    if (!scheduler || !activity) return null;

    const scheduledActivity = Array.from(scheduler.scheduledActivities.values()).find(
      (scheduled) => scheduled.activityId === activity.id,
    );

    if (!scheduledActivity) return null;

    const state = scheduler.getActivityState(activity.id, scheduledActivity.characterIds[0]);
    if (!state) return null;

    return {
      progressFraction: state.progress,
      totalDuration: state.duration,
      remainingSeconds: state.duration - state.elapsed,
    };
  }, [scheduler, activity]);

  // Telemetry: theater_slot_rendered
  React.useEffect(() => {
    if (slotController.slots.length > 0) {
      slotController.slots.forEach((slot) => {
        trackTelemetryEvent('theater_slot_rendered', {
          activityId: activity?.id || 'unknown',
          slotId: slot.id,
          dropState: slot.dropState,
          assignedResidents: slot.assignedResidentId ? [slot.assignedResidentId] : [],
          hasProgress: !!slotProgress,
        });
      });
    }
  }, [slotController.slots, activity?.id, slotProgress]);

  const handleSlotClick = React.useCallback(
    (slotId: string) => {
      // Telemetry: theater_slot_assignment_attempt
      trackTelemetryEvent('theater_slot_assignment_attempt', {
        activityId: activity?.id || 'unknown',
        slotId,
        attemptType: 'click',
      });

      onAssignResident?.(slotId, null); // Trigger assignment UI
    },
    [activity?.id, onAssignResident],
  );

  const handleSlotDrop = React.useCallback(
    (slotId: string, residentId: string | null) => {
      // Telemetry: theater_slot_assignment_attempt
      trackTelemetryEvent('theater_slot_assignment_attempt', {
        activityId: activity?.id || 'unknown',
        slotId,
        attemptType: 'drop',
        residentId,
      });

      onAssignResident?.(slotId, residentId);
    },
    [activity?.id, onAssignResident],
  );

  // IV-RS-C: Render ResidentSlotRack when we have slot controller data, otherwise fallback to TheaterOverlay
  if (residentSlotData && slotController.slots.length > 0) {
    return (
      <div className="theater-view-with-slots">
        <div className="theater-header">
          <h2 className="theater-title">{slotLabel}</h2>
          <button
            onClick={onClose}
            className="theater-close-btn"
            aria-label="Close theater"
          >
            ×
          </button>
        </div>

        <div className="theater-content">
          <ResidentSlotRack
            slots={slotController.slots}
            layout="detail"
            overflowBehavior="wrap"
            getSlotProgress={(slotId) => {
              if (!slotProgress) return null;
              // For theater, return progress data for the assigned resident in this slot
              const slot = slotController.slots.find(s => s.id === slotId);
              if (!slot?.assignedResidentId) return null;

              return {
                slotId,
                residentId: slot.assignedResidentId,
                elapsedSeconds: slotProgress.progressFraction * slotProgress.totalDuration,
                totalSeconds: slotProgress.totalDuration,
                ratio: slotProgress.progressFraction,
                state: {
                  scheduledId: 'theater-slot',
                  activityId: activity?.id || 'unknown',
                  residentId: slot.assignedResidentId,
                  startTime: 0,
                  duration: slotProgress.totalDuration,
                  elapsed: slotProgress.progressFraction * slotProgress.totalDuration,
                  progress: slotProgress.progressFraction,
                  status: 'running' as const,
                },
              };
            }}
            resolveDisplayInfo={(slot) => ({
              icon: slotIcon || '◎',
              label: slot.label,
            })}
            onSlotDrop={handleSlotDrop}
            onSlotClear={(slotId) => handleSlotDrop(slotId, null)}
            onSlotClick={handleSlotClick}
            draggingResidentId={null} // TODO: Wire from drag context in Phase D
          />

          {/* Legacy verb display */}
          {verbs.length > 0 && (
            <div className="theater-verbs">
              <h3>Available Actions</h3>
              {verbs.map((verb) => (
                <div key={verb.key} className="verb-item">
                  {verb.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Fallback to legacy TheaterOverlay when no slot controller data
  return (
    <TheaterOverlay
      isOpen={true}
      theaterPrimarySlot={{
        slotId: 'legacy-slot',
        label: slotLabel,
        iconName: slotIcon || '◎',
        assignedWorkerId: null,
        visualVariant: 'azure',
        activity: {
          id: 'legacy-activity',
          label: slotLabel,
          tags: [],
          slotTags: [],
          resolutionEngineId: 'legacy',
          durationFormula: '60',
        }
      } as ActivitySlotData}
      theaterVerbs={verbs}
      draggingResidentId={null}
      acceptResidentDrop={acceptResidentDrop}
      onClose={onClose}
      onResidentDrop={onResidentDrop}
    />
  );
};

export default TheaterView;
