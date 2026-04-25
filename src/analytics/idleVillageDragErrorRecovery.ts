import { nanoid } from 'nanoid';
import { createHeadlessDiagnostics } from '@/shared/telemetry/headlessDiagnostics';
import { getDragErrorRecoveryConfig } from '@/ui/idleVillage/config/dragErrorRecoveryConfig';
import type { DragDropErrorCode } from '@/ui/idleVillage/config/dragErrorRecoveryConfig';

export type DragErrorOverlayEventType =
  | 'overlay_shown'
  | 'overlay_dismissed'
  | 'action_performed'
  | 'auto_open_changed';

export interface DragErrorOverlayEvent {
  eventId: string;
  type: DragErrorOverlayEventType;
  timestamp: number;
  errorCode?: DragDropErrorCode;
  actionId?: string;
  actionType?: string;
  residentId?: string;
  metadata?: Record<string, unknown>;
}

class DragErrorRecoveryAnalytics {
  private events: DragErrorOverlayEvent[] = [];
  private diagnostics = createHeadlessDiagnostics('drag-error-analytics', 'drag');

  recordEvent(event: Omit<DragErrorOverlayEvent, 'eventId' | 'timestamp'>): DragErrorOverlayEvent {
    const config = getDragErrorRecoveryConfig();
    const payload: DragErrorOverlayEvent = {
      ...event,
      eventId: nanoid(),
      timestamp: Date.now(),
    };

    this.events.push(payload);
    if (this.events.length > config.telemetry.maxEvents) {
      this.events.shift();
    }

    this.diagnostics.debug('drag_error_overlay_event', {
      type: payload.type,
      errorCode: payload.errorCode,
      actionId: payload.actionId,
    });

    return payload;
  }

  getEvents(): DragErrorOverlayEvent[] {
    return this.events;
  }

  clearEvents(): void {
    this.events = [];
  }
}

export const dragErrorRecoveryAnalytics = new DragErrorRecoveryAnalytics();
