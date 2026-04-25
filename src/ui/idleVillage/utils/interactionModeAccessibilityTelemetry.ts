/**
 * Interaction Mode Accessibility Telemetry
 * 
 * Telemetry system for tracking accessibility usage and events
 * in Interaction Mode components.
 * 
 * @since NP-082 – Idle Village Interaction Mode Accessibility Sweep
 */

import { recordWorkerPickerEvent } from './workerPickerTelemetry';

/**
 * Accessibility telemetry event types
 */
export type AccessibilityTelemetryEventType = 
  | 'iv_interaction_mode_a11y_checked'
  | 'accessibility_announcement'
  | 'drop_status_announced'
  | 'focus_changed'
  | 'keyboard_navigation_used'
  | 'touch_interaction_used'
  | 'screen_reader_detected'
  | 'high_contrast_mode_detected'
  | 'reduced_motion_detected'
  | 'accessibility_feature_used'
  | 'accessibility_error_occurred';

/**
 * Base telemetry event structure
 */
export interface AccessibilityTelemetryEvent {
  /** Event type */
  type: AccessibilityTelemetryEventType;
  /** Timestamp */
  timestamp: number;
  /** User session identifier */
  sessionId?: string;
  /** Context for the event */
  context?: string;
  /** Additional event data */
  data?: Record<string, any>;
}

/**
 * Accessibility announcement event
 */
export interface AccessibilityAnnouncementEvent extends AccessibilityTelemetryEvent {
  type: 'accessibility_announcement';
  data: {
    message: string;
    priority: 'polite' | 'assertive';
    context?: string;
    duration?: number;
  };
}

/**
 * Drop status announcement event
 */
export interface DropStatusAnnouncedEvent extends AccessibilityTelemetryEvent {
  type: 'drop_status_announced';
  data: {
    status: string;
    message: string;
    priority: 'polite' | 'assertive';
    residentId?: string;
    activityId?: string;
    locationName?: string;
    residentName?: string;
  };
}

/**
 * Focus change event
 */
export interface FocusChangedEvent extends AccessibilityTelemetryEvent {
  type: 'focus_changed';
  data: {
    fromElement?: string;
    toElement?: string;
    triggerMethod: 'keyboard' | 'mouse' | 'touch' | 'programmatic';
  };
}

/**
 * Keyboard navigation event
 */
export interface KeyboardNavigationEvent extends AccessibilityTelemetryEvent {
  type: 'keyboard_navigation_used';
  data: {
    key: string;
    element: string;
    action: 'navigate' | 'activate' | 'dismiss';
    success: boolean;
  };
}

/**
 * Touch interaction event
 */
export interface TouchInteractionEvent extends AccessibilityTelemetryEvent {
  type: 'touch_interaction_used';
  data: {
    action: 'tap' | 'swipe' | 'pinch' | 'long_press';
    element: string;
    targetSize: { width: number; height: number };
    success: boolean;
    duration: number;
  };
}

/**
 * Screen reader detection event
 */
export interface ScreenReaderDetectedEvent extends AccessibilityTelemetryEvent {
  type: 'screen_reader_detected';
  data: {
    screenReader: 'nvda' | 'jaws' | 'voiceover' | 'talkback' | 'unknown';
    userAgent: string;
    detectedVia: 'aria_live' | 'focus_behavior' | 'user_agent' | 'explicit';
  };
}

/**
 * High contrast mode detection event
 */
export interface HighContrastModeDetectedEvent extends AccessibilityTelemetryEvent {
  type: 'high_contrast_mode_detected';
  data: {
    enabled: boolean;
    detectedVia: 'media_query' | 'forced_colors' | 'user_preference';
    browser: string;
  };
}

/**
 * Reduced motion detection event
 */
export interface ReducedMotionDetectedEvent extends AccessibilityTelemetryEvent {
  type: 'reduced_motion_detected';
  data: {
    enabled: boolean;
    detectedVia: 'media_query' | 'user_preference';
    browser: string;
  };
}

/**
 * Accessibility feature usage event
 */
export interface AccessibilityFeatureUsedEvent extends AccessibilityTelemetryEvent {
  type: 'accessibility_feature_used';
  data: {
    feature: 'focus_trap' | 'live_region' | 'keyboard_shortcut' | 'touch_enhancement' | 'voice_control';
    component: string;
    success: boolean;
    duration?: number;
  };
}

/**
 * Accessibility error event
 */
export interface AccessibilityErrorEvent extends AccessibilityTelemetryEvent {
  type: 'accessibility_error_occurred';
  data: {
    error: string;
    component: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    context?: string;
    stack?: string;
  };
}

/**
 * Main accessibility telemetry event type
 */
export type InteractionModeAccessibilityTelemetryEvent = 
  | AccessibilityAnnouncementEvent
  | DropStatusAnnouncedEvent
  | FocusChangedEvent
  | KeyboardNavigationEvent
  | TouchInteractionEvent
  | ScreenReaderDetectedEvent
  | HighContrastModeDetectedEvent
  | ReducedMotionDetectedEvent
  | AccessibilityFeatureUsedEvent
  | AccessibilityErrorEvent;

/**
 * Telemetry emitter for accessibility events
 */
export class AccessibilityTelemetry {
  private sessionId: string;
  private enabled: boolean;

  constructor(sessionId?: string, enabled: boolean = true) {
    this.sessionId = sessionId || this.generateSessionId();
    this.enabled = enabled;
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `a11y_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Record an accessibility telemetry event
   */
  private recordEvent(event: Omit<InteractionModeAccessibilityTelemetryEvent, 'timestamp' | 'sessionId'>): void {
    if (!this.enabled) return;

    const fullEvent: InteractionModeAccessibilityTelemetryEvent = {
      ...event,
      timestamp: Date.now(),
      sessionId: this.sessionId,
    };

    // Use existing worker picker telemetry system
    recordWorkerPickerEvent(fullEvent as any);
  }

  /**
   * Record accessibility check completion
   */
  recordAccessibilityCheck(context: string, results: {
    passed: number;
    failed: number;
    warnings: number;
    score: number;
  }): void {
    this.recordEvent({
      type: 'iv_interaction_mode_a11y_checked',
      context,
      data: results,
    });
  }

  /**
   * Record accessibility announcement
   */
  recordAnnouncement(
    message: string,
    priority: 'polite' | 'assertive',
    context?: string,
    duration?: number
  ): void {
    this.recordEvent({
      type: 'accessibility_announcement',
      data: {
        message,
        priority,
        context,
        duration,
      },
    });
  }

  /**
   * Record drop status announcement
   */
  recordDropStatusAnnounced(
    status: string,
    message: string,
    priority: 'polite' | 'assertive',
    context?: {
      residentId?: string;
      activityId?: string;
      locationName?: string;
      residentName?: string;
    }
  ): void {
    this.recordEvent({
      type: 'drop_status_announced',
      data: {
        status,
        message,
        priority,
        ...context,
      },
    });
  }

  /**
   * Record focus change
   */
  recordFocusChange(
    fromElement?: string,
    toElement?: string,
    triggerMethod: 'keyboard' | 'mouse' | 'touch' | 'programmatic' = 'programmatic'
  ): void {
    this.recordEvent({
      type: 'focus_changed',
      data: {
        fromElement,
        toElement,
        triggerMethod,
      },
    });
  }

  /**
   * Record keyboard navigation
   */
  recordKeyboardNavigation(
    key: string,
    element: string,
    action: 'navigate' | 'activate' | 'dismiss',
    success: boolean
  ): void {
    this.recordEvent({
      type: 'keyboard_navigation_used',
      data: {
        key,
        element,
        action,
        success,
      },
    });
  }

  /**
   * Record touch interaction
   */
  recordTouchInteraction(
    action: 'tap' | 'swipe' | 'pinch' | 'long_press',
    element: string,
    targetSize: { width: number; height: number },
    success: boolean,
    duration: number
  ): void {
    this.recordEvent({
      type: 'touch_interaction_used',
      data: {
        action,
        element,
        targetSize,
        success,
        duration,
      },
    });
  }

  /**
   * Record screen reader detection
   */
  recordScreenReaderDetected(
    screenReader: 'nvda' | 'jaws' | 'voiceover' | 'talkback' | 'unknown',
    userAgent: string,
    detectedVia: 'aria_live' | 'focus_behavior' | 'user_agent' | 'explicit'
  ): void {
    this.recordEvent({
      type: 'screen_reader_detected',
      data: {
        screenReader,
        userAgent,
        detectedVia,
      },
    });
  }

  /**
   * Record high contrast mode detection
   */
  recordHighContrastModeDetected(
    enabled: boolean,
    detectedVia: 'media_query' | 'forced_colors' | 'user_preference',
    browser: string
  ): void {
    this.recordEvent({
      type: 'high_contrast_mode_detected',
      data: {
        enabled,
        detectedVia,
        browser,
      },
    });
  }

  /**
   * Record reduced motion detection
   */
  recordReducedMotionDetected(
    enabled: boolean,
    detectedVia: 'media_query' | 'user_preference',
    browser: string
  ): void {
    this.recordEvent({
      type: 'reduced_motion_detected',
      data: {
        enabled,
        detectedVia,
        browser,
      },
    });
  }

  /**
   * Record accessibility feature usage
   */
  recordAccessibilityFeatureUsed(
    feature: 'focus_trap' | 'live_region' | 'keyboard_shortcut' | 'touch_enhancement' | 'voice_control',
    component: string,
    success: boolean,
    duration?: number
  ): void {
    this.recordEvent({
      type: 'accessibility_feature_used',
      data: {
        feature,
        component,
        success,
        duration,
      },
    });
  }

  /**
   * Record accessibility error
   */
  recordAccessibilityError(
    error: string,
    component: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    context?: string,
    stack?: string
  ): void {
    this.recordEvent({
      type: 'accessibility_error_occurred',
      data: {
        error,
        component,
        severity,
        context,
        stack,
      },
    });
  }

  /**
   * Get current session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Enable/disable telemetry
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Check if telemetry is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}

// Global telemetry instance
let globalAccessibilityTelemetry: AccessibilityTelemetry | null = null;

/**
 * Get or create the global accessibility telemetry instance
 */
export function getAccessibilityTelemetry(): AccessibilityTelemetry {
  if (!globalAccessibilityTelemetry) {
    globalAccessibilityTelemetry = new AccessibilityTelemetry();
  }
  return globalAccessibilityTelemetry;
}

/**
 * Reset the global telemetry instance (for testing)
 */
export function resetAccessibilityTelemetry(): void {
  globalAccessibilityTelemetry = null;
}

/**
 * Convenience functions for common telemetry events
 */
export const accessibilityTelemetry = {
  /**
   * Record accessibility check completion
   */
  recordCheck: (context: string, results: {
    passed: number;
    failed: number;
    warnings: number;
    score: number;
  }) => getAccessibilityTelemetry().recordAccessibilityCheck(context, results),

  /**
   * Record announcement
   */
  recordAnnouncement: (
    message: string,
    priority: 'polite' | 'assertive',
    context?: string,
    duration?: number
  ) => getAccessibilityTelemetry().recordAnnouncement(message, priority, context, duration),

  /**
   * Record drop status
   */
  recordDropStatus: (
    status: string,
    message: string,
    priority: 'polite' | 'assertive',
    context?: {
      residentId?: string;
      activityId?: string;
      locationName?: string;
      residentName?: string;
    }
  ) => getAccessibilityTelemetry().recordDropStatusAnnounced(status, message, priority, context),

  /**
   * Record focus change
   */
  recordFocusChange: (
    fromElement?: string,
    toElement?: string,
    triggerMethod?: 'keyboard' | 'mouse' | 'touch' | 'programmatic'
  ) => getAccessibilityTelemetry().recordFocusChange(fromElement, toElement, triggerMethod),

  /**
   * Record keyboard navigation
   */
  recordKeyboardNavigation: (
    key: string,
    element: string,
    action: 'navigate' | 'activate' | 'dismiss',
    success: boolean
  ) => getAccessibilityTelemetry().recordKeyboardNavigation(key, element, action, success),

  /**
   * Record touch interaction
   */
  recordTouchInteraction: (
    action: 'tap' | 'swipe' | 'pinch' | 'long_press',
    element: string,
    targetSize: { width: number; height: number },
    success: boolean,
    duration: number
  ) => getAccessibilityTelemetry().recordTouchInteraction(action, element, targetSize, success, duration),

  /**
   * Record error
   */
  recordError: (
    error: string,
    component: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    context?: string
  ) => getAccessibilityTelemetry().recordAccessibilityError(error, component, severity, context),
};

export default accessibilityTelemetry;
