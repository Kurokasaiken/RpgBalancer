import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type { IdleVillageConfig } from '@/balancing/config/idleVillage/types';
import type { WorkerPickerTelemetryStore } from './workerPickerTelemetry';

/**
 * Result of validating a resident drop attempt on a location slot.
 */
export interface DropValidationResult {
  /** Whether the drop is allowed. */
  valid: boolean;
  /** Optional reason why the drop is invalid, for debugging/UI feedback. */
  reason?: string;
}

/**
 * Parameters for validating a resident drop on a location slot.
 */
export interface ValidateResidentDropParams {
  /** Resident being dragged. */
  resident: ResidentState;
  /** Target slot identifier. */
  slotId: string;
  /** Activity identifier for the slot. */
  activityId: string;
  /** Current assignments map (slotId -> residentId). */
  currentAssignments: Record<string, string | null>;
  /** Idle Village config for activity definitions. */
  config: IdleVillageConfig;
  /** Optional diagnostics logger for deterministic logging. */
  diagnostics?: {
    debug: (message: string, payload: Record<string, unknown>) => void;
    info: (message: string, payload: Record<string, unknown>) => void;
    warn: (message: string, payload: Record<string, unknown>) => void;
  };
  /** Current invasion type for invasion-aware validation. */
  invasionType?: string;
  /** Enable telemetry event emission. */
  enableTelemetry?: boolean;
}

/**
 * Validates whether a resident can be dropped on a location slot.
 * Checks stat tag requirements, fatigue thresholds, crew limits, and invasion-specific rules.
 */
export function validateResidentDrop({
  resident,
  slotId,
  activityId,
  currentAssignments,
  config,
  diagnostics,
  invasionType,
  enableTelemetry,
}: ValidateResidentDropParams): DropValidationResult {
  const startTime = performance.now();
  
  diagnostics?.debug('validateResidentDrop:start', {
    residentId: resident.id,
    slotId,
    activityId,
    residentStatus: resident.status,
    residentFatigue: resident.fatigue,
    residentTags: resident.statTags,
    invasionType,
    enableTelemetry,
  });

  // Check if resident is already assigned to this slot
  const currentAssigned = currentAssignments[slotId];
  if (currentAssigned === resident.id) {
    diagnostics?.info('validateResidentDrop:already-assigned', {
      residentId: resident.id,
      slotId,
      duration: performance.now() - startTime,
    });

    // Emit telemetry for already assigned case
    if (enableTelemetry && typeof window !== 'undefined') {
      const telemetryEvent = {
        type: 'assignment_success' as const,
        slotId,
        residentId: resident.id,
        latencyMs: performance.now() - startTime,
        timestamp: Date.now(),
      };
      
      const telemetryStore = (window as { __sandboxTelemetry?: WorkerPickerTelemetryStore }).__sandboxTelemetry;
      if (telemetryStore?.events) {
        telemetryStore.events.push(telemetryEvent);
      }
    }

    return { valid: true }; // Already assigned, allow re-drop
  }

  // Check if resident is assigned to another slot
  const assignedSlots = Object.entries(currentAssignments).filter(([, residentId]) => residentId === resident.id);
  if (assignedSlots.length > 0 && !assignedSlots.some(([slot]) => slot === slotId)) {
    diagnostics?.warn('validateResidentDrop:already-assigned-elsewhere', {
      residentId: resident.id,
      slotId,
      assignedSlots: assignedSlots.map(([slot]) => slot),
      duration: performance.now() - startTime,
    });
    return { valid: false, reason: 'Resident already assigned to another activity' };
  }

  // Get activity definition
  const activity = config.activities[activityId];
  if (!activity) {
    diagnostics?.warn('validateResidentDrop:activity-not-found', {
      activityId,
      availableActivities: Object.keys(config.activities),
      duration: performance.now() - startTime,
    });
    return { valid: false, reason: `Activity ${activityId} not found in config` };
  }

  // Check stat tag requirements
  const requirement = activity.statRequirement;
  if (requirement) {
    const residentTags = resident.statTags ?? [];
    if (requirement.allOf && !requirement.allOf.every(tag => residentTags.includes(tag))) {
      const missing = requirement.allOf.filter(tag => !residentTags.includes(tag));
      diagnostics?.warn('validateResidentDrop:missing-required-tags', {
        residentId: resident.id,
        slotId,
        activityId,
        requiredTags: requirement.allOf,
        residentTags,
        missing,
        duration: performance.now() - startTime,
      });
      return { valid: false, reason: `Missing required tags: ${missing.join(', ')}` };
    }
    if (requirement.anyOf && !requirement.anyOf.some(tag => residentTags.includes(tag))) {
      diagnostics?.warn('validateResidentDrop:missing-any-tags', {
        residentId: resident.id,
        slotId,
        activityId,
        anyOfTags: requirement.anyOf,
        residentTags,
        duration: performance.now() - startTime,
      });
      return { valid: false, reason: `Requires one of: ${requirement.anyOf.join(', ')}` };
    }
    if (requirement.noneOf && requirement.noneOf.some(tag => residentTags.includes(tag))) {
      const forbidden = requirement.noneOf.filter(tag => residentTags.includes(tag));
      diagnostics?.warn('validateResidentDrop:forbidden-tags', {
        residentId: resident.id,
        slotId,
        activityId,
        forbiddenTags: requirement.noneOf,
        residentTags,
        forbidden,
        duration: performance.now() - startTime,
      });
      return { valid: false, reason: `Forbidden tags: ${forbidden.join(', ')}` };
    }
  }

  // Check fatigue threshold
  const fatigueThreshold = (activity.metadata as { fatigueThreshold?: number })?.fatigueThreshold ?? 100;
  if (resident.fatigue > fatigueThreshold) {
    diagnostics?.warn('validateResidentDrop:fatigue-exceeded', {
      residentId: resident.id,
      slotId,
      activityId,
      residentFatigue: resident.fatigue,
      fatigueThreshold,
      duration: performance.now() - startTime,
    });
    return { valid: false, reason: `Fatigue ${resident.fatigue} exceeds threshold ${fatigueThreshold}` };
  }

  // Check crew limits
  const crewLimit = (activity.metadata as { crewLimit?: number })?.crewLimit ?? 1;
  const currentCrew = Object.values(currentAssignments).filter(id => id !== resident.id).length;
  if (currentCrew >= crewLimit) {
    diagnostics?.warn('validateResidentDrop:crew-limit-reached', {
      residentId: resident.id,
      slotId,
      activityId,
      currentCrew,
      crewLimit,
      duration: performance.now() - startTime,
    });
    return { valid: false, reason: `Crew limit ${crewLimit} reached` };
  }

  // Invasion-aware validation
  if (invasionType) {
    const invasionResult = validateInvasionRequirements({
      resident,
      activity,
      invasionType,
      config,
      diagnostics,
    });
    if (!invasionResult.valid) {
      diagnostics?.warn('validateResidentDrop:invasion-failed', {
        residentId: resident.id,
        slotId,
        activityId,
        invasionType,
        reason: invasionResult.reason,
        duration: performance.now() - startTime,
      });
      return invasionResult;
    }
  }

  diagnostics?.info('validateResidentDrop:success', {
    residentId: resident.id,
    slotId,
    activityId,
    duration: performance.now() - startTime,
  });

  // Emit telemetry event if enabled
  if (enableTelemetry && typeof window !== 'undefined') {
    const telemetryEvent = {
      type: 'assignment_success' as const,
      slotId,
      residentId: resident.id,
      latencyMs: performance.now() - startTime,
      timestamp: Date.now(),
    };
    
    // Send to mobilePlaytestLogger if available
    const telemetryStore = (window as { __sandboxTelemetry?: WorkerPickerTelemetryStore }).__sandboxTelemetry;
    if (telemetryStore?.events) {
      telemetryStore.events.push(telemetryEvent);
    }
  }

  return { valid: true };
}

/**
 * Parameters for invasion-aware validation.
 */
interface ValidateInvasionRequirementsParams {
  resident: ResidentState;
  activity: { id: string; invasionRequirements?: Record<string, unknown> };
  invasionType: string;
  config: IdleVillageConfig;
  diagnostics?: {
    debug: (message: string, payload: Record<string, unknown>) => void;
    info: (message: string, payload: Record<string, unknown>) => void;
    warn: (message: string, payload: Record<string, unknown>) => void;
  };
}

/**
 * Validates invasion-specific requirements for resident assignment.
 */
function validateInvasionRequirements({
  resident,
  activity,
  invasionType,
  config,
  diagnostics,
}: ValidateInvasionRequirementsParams): DropValidationResult {
  // Example invasion-specific rules (config-first)
  const invasionRules = (config as { global?: { invasionRules?: Record<string, Record<string, unknown>> } }).global?.invasionRules?.[invasionType];
  
  if (!invasionRules) {
    // No specific rules for this invasion type, allow by default
    diagnostics?.debug('validateInvasionRequirements:no-rules', {
      invasionType,
      activityId: activity.id,
    });
    return { valid: true };
  }

  // Check for invasion-specific forbidden tags
  if (invasionRules.forbiddenTags) {
    const residentTags = resident.statTags ?? [];
    const forbiddenTags = invasionRules.forbiddenTags as string[];
    const hasForbiddenTag = forbiddenTags.some(tag => residentTags.includes(tag));
    
    if (hasForbiddenTag) {
      return {
        valid: false,
        reason: `Resident has tag forbidden during ${invasionType}: ${forbiddenTags.join(', ')}`,
      };
    }
  }

  // Check for invasion-specific required tags
  if (invasionRules.requiredTags) {
    const residentTags = resident.statTags ?? [];
    const requiredTags = invasionRules.requiredTags as string[];
    const hasRequiredTag = requiredTags.some(tag => residentTags.includes(tag));
    
    if (!hasRequiredTag) {
      return {
        valid: false,
        reason: `Resident requires one of these tags during ${invasionType}: ${requiredTags.join(', ')}`,
      };
    }
  }

  // Check for invasion-specific activity restrictions
  if (invasionRules.restrictedActivities) {
    const restrictedActivities = invasionRules.restrictedActivities as string[];
    if (restrictedActivities.includes(activity.id)) {
      return {
        valid: false,
        reason: `Activity ${activity.id} is restricted during ${invasionType}`,
      };
    }
  }

  diagnostics?.debug('validateInvasionRequirements:success', {
    invasionType,
    activityId: activity.id,
    residentId: resident.id,
  });

  return { valid: true };
}
