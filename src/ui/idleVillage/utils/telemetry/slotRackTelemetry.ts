/**
 * Slot Rack Telemetry Utilities
 * 
 * Centralized telemetry helpers for slot rack interactions, rendering,
 * and drop feedback events. Provides consistent payload structure and
 * validation for all slot rack telemetry events.
 */

import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import type { DropValidationResult } from '@/ui/idleVillage/config/residentDropRules';
import type { SkinPresetConfig } from '@/ui/idleVillage/skins/skinSchemas';

export interface SlotRackRenderedPayload {
  /** Skin configuration identifier */
  skinId: string;
  /** Skin version number */
  skinVersion: number;
  /** Style Lab pillar (wilderness/empire/frontier) */
  pillar: string;
  /** Number of slots in the rack */
  slotCount: number;
  /** Scenario/layout identifier */
  scenarioId: string;
  /** Preset identifier from registry */
  skinPresetId: string;
  /** Current drag state on the rack */
  dragState: 'idle' | 'dragging' | 'validating' | 'processing';
  /** Event timestamp */
  timestamp: number;
}

export interface SlotRackDropFeedbackPayload {
  /** Whether the drop was successful */
  success: boolean;
  /** Drop validation reason (enum from validator) */
  reason: string;
  /** Detailed validation message */
  details?: string;
  /** Target slot identifier */
  slotId: string;
  /** Resident ID being dropped */
  residentId?: string;
  /** Skin configuration at time of drop */
  skinConfig: {
    skinId: string;
    skinVersion: number;
    pillar: string;
  };
  /** Performance metrics */
  performance: {
    validationTimeMs: number;
    totalTimeMs: number;
  };
  /** Event timestamp */
  timestamp: number;
}

/**
 * Emits telemetry event when slot rack skin is rendered
 */
export function trackSlotRackSkinRendered(
  skinConfig: SkinPresetConfig,
  slotCount: number,
  scenarioId: string,
  dragState: SlotRackRenderedPayload['dragState'] = 'idle'
): void {
  const payload: SlotRackRenderedPayload = {
    skinId: skinConfig.id,
    skinVersion: skinConfig.version,
    pillar: skinConfig.defaultPillar || 'frontier',
    slotCount,
    scenarioId,
    skinPresetId: skinConfig.id,
    dragState,
    timestamp: Date.now(),
  };

  trackTelemetryEvent('slot_rack_skin_rendered', payload as unknown as Record<string, unknown>);
}

/**
 * Emits telemetry event for drop feedback with validation results
 */
export function trackSlotRackDropFeedback(
  validationResult: DropValidationResult,
  slotId: string,
  residentId?: string,
  skinConfig?: SkinPresetConfig,
  performanceMetrics?: { validationTimeMs: number; totalTimeMs: number }
): void {
  const payload: SlotRackDropFeedbackPayload = {
    success: (validationResult as any).success || false,
    reason: (validationResult as any).reason || 'unknown',
    details: (validationResult as any).details,
    slotId,
    residentId,
    skinConfig: {
      skinId: skinConfig?.id || 'unknown',
      skinVersion: skinConfig?.version || 0,
      pillar: skinConfig?.defaultPillar || 'frontier',
    },
    performance: {
      validationTimeMs: performanceMetrics?.validationTimeMs || 0,
      totalTimeMs: performanceMetrics?.totalTimeMs || 0,
    },
    timestamp: Date.now(),
  };

  trackTelemetryEvent('slot_rack_drop_feedback', payload as unknown as Record<string, unknown>);
}

/**
 * Updates drag state in telemetry when rack interaction changes
 */
export function trackSlotRackDragState(
  skinConfig: SkinPresetConfig,
  slotCount: number,
  scenarioId: string,
  dragState: SlotRackRenderedPayload['dragState']
): void {
  // Re-use the skin rendered event with updated drag state
  trackSlotRackSkinRendered(skinConfig, slotCount, scenarioId, dragState);
}

/**
 * Performance monitoring wrapper for drop validation
 */
export function createDropPerformanceTracker() {
  const startTime = performance.now();
  
  return {
    validationTime: (validationStart: number) => {
      const validationEnd = performance.now();
      return validationEnd - validationStart;
    },
    
    totalTime: () => performance.now() - startTime,
  };
}

/**
 * Validates telemetry payload structure before emission
 */
export function validateSlotRackPayload(payload: SlotRackRenderedPayload | SlotRackDropFeedbackPayload): boolean {
  // Basic validation for required fields
  if (!payload.timestamp || typeof payload.timestamp !== 'number') {
    return false;
  }

  if ('skinId' in payload && !payload.skinId) {
    return false;
  }

  if ('success' in payload && typeof payload.success !== 'boolean') {
    return false;
  }

  return true;
}

/**
 * Creates a mock telemetry helper for testing
 */
export function createMockSlotRackTelemetry() {
  const events: Array<{ name: string; payload: any }> = [];

  return {
    trackSlotRackSkinRendered: (skinConfig: any, slotCount: number, scenarioId: string, dragState?: string) => {
      events.push({
        name: 'slot_rack_skin_rendered',
        payload: { skinConfig, slotCount, scenarioId, dragState, timestamp: Date.now() },
      });
    },
    
    trackSlotRackDropFeedback: (validationResult: any, slotId: string, residentId?: string) => {
      events.push({
        name: 'slot_rack_drop_feedback',
        payload: { validationResult, slotId, residentId, timestamp: Date.now() },
      });
    },
    
    getEvents: () => events,
    clearEvents: () => { events.length = 0; },
  };
}
