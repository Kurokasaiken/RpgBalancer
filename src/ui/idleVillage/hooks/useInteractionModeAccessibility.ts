/**
 * Interaction Mode Accessibility Hook
 * 
 * Provides accessibility utilities and drop status announcements
 * for Interaction Mode components following WCAG 2.1 guidelines.
 * 
 * @since NP-082 – Idle Village Interaction Mode Accessibility Sweep
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { recordWorkerPickerEvent } from '@/ui/idleVillage/utils/workerPickerTelemetry';

/**
 * Drop status types for accessibility announcements
 */
export type DropStatusType = 
  | 'valid_drop'
  | 'invalid_drop' 
  | 'blocked_drop'
  | 'fatigue_blocked'
  | 'crew_full'
  | 'stat_requirements_not_met'
  | 'assignment_success'
  | 'assignment_failed';

/**
 * Accessibility announcement configuration
 */
export interface AccessibilityAnnouncement {
  /** Message to announce */
  message: string;
  /** Announcement priority */
  priority: 'polite' | 'assertive';
  /** Whether announcement should be atomic */
  atomic?: boolean;
  /** Announcement duration in milliseconds */
  duration?: number;
  /** Context for the announcement */
  context?: string;
}

/**
 * Accessibility configuration
 */
export interface InteractionModeAccessibilityConfig {
  /** Enable screen reader announcements */
  enableAnnouncements: boolean;
  /** Enable keyboard navigation enhancements */
  enableKeyboardEnhancements: boolean;
  /** Enable touch accessibility features */
  enableTouchAccessibility: boolean;
  /** Minimum touch target size in pixels */
  minTouchTargetSize: number;
  /** Enable focus management */
  enableFocusManagement: boolean;
  /** Enable high contrast mode support */
  enableHighContrastSupport: boolean;
  /** Enable reduced motion support */
  enableReducedMotionSupport: boolean;
}

/**
 * Default accessibility configuration
 */
export const DEFAULT_ACCESSIBILITY_CONFIG: InteractionModeAccessibilityConfig = {
  enableAnnouncements: true,
  enableKeyboardEnhancements: true,
  enableTouchAccessibility: true,
  minTouchTargetSize: 44,
  enableFocusManagement: true,
  enableHighContrastSupport: true,
  enableReducedMotionSupport: true,
};

/**
 * Drop status message templates
 */
const DROP_STATUS_MESSAGES: Record<DropStatusType, string> = {
  valid_drop: 'Valid drop location. Resident can be assigned here.',
  invalid_drop: 'Invalid drop location. Cannot assign resident here.',
  blocked_drop: 'Location is blocked. Please choose a different location.',
  fatigue_blocked: 'Resident is too exhausted to work. Please allow rest.',
  crew_full: 'Activity is at full capacity. Please choose a different activity.',
  stat_requirements_not_met: 'Resident does not meet requirements for this activity.',
  assignment_success: 'Resident successfully assigned to activity.',
  assignment_failed: 'Failed to assign resident. Please try again.',
};

/**
 * Hook for Interaction Mode accessibility features
 */
export function useInteractionModeAccessibility(
  config: Partial<InteractionModeAccessibilityConfig> = {}
) {
  const accessibilityConfig = { ...DEFAULT_ACCESSIBILITY_CONFIG, ...config };
  const [announcementQueue, setAnnouncementQueue] = useState<AccessibilityAnnouncement[]>([]);
  const [currentFocus, setCurrentFocus] = useState<string | null>(null);
  const [isHighContrastMode, setIsHighContrastMode] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  const announcementTimeoutRef = useRef<number | null>(null);
  const focusTrapRef = useRef<HTMLElement | null>(null);

  // Detect user preferences
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect high contrast mode
    const highContrastQuery = window.matchMedia('(forced-colors: active)');
    setIsHighContrastMode(highContrastQuery.matches);
    
    const handleHighContrastChange = (e: MediaQueryListEvent) => {
      setIsHighContrastMode(e.matches);
    };
    highContrastQuery.addEventListener('change', handleHighContrastChange);

    // Detect reduced motion preference
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(reducedMotionQuery.matches);
    
    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    reducedMotionQuery.addEventListener('change', handleReducedMotionChange);

    return () => {
      highContrastQuery.removeEventListener('change', handleHighContrastChange);
      reducedMotionQuery.removeEventListener('change', handleReducedMotionChange);
    };
  }, []);

  // Process announcement queue
  useEffect(() => {
    if (announcementQueue.length === 0) return;

    const currentAnnouncement = announcementQueue[0];
    const duration = currentAnnouncement.duration || 2000;

    // Clear existing timeout
    if (announcementTimeoutRef.current) {
      window.clearTimeout(announcementTimeoutRef.current);
    }

    // Set timeout to remove announcement
    announcementTimeoutRef.current = window.setTimeout(() => {
      setAnnouncementQueue(prev => prev.slice(1));
      announcementTimeoutRef.current = null;
    }, duration);
  }, [announcementQueue]);

  /**
   * Announce a message to screen readers
   */
  const announce = useCallback((
    message: string,
    priority: 'polite' | 'assertive' = 'polite',
    options: {
      atomic?: boolean;
      duration?: number;
      context?: string;
    } = {}
  ) => {
    if (!accessibilityConfig.enableAnnouncements) return;

    const announcement: AccessibilityAnnouncement = {
      message,
      priority,
      atomic: options.atomic ?? true,
      duration: options.duration,
      context: options.context,
    };

    setAnnouncementQueue(prev => [...prev, announcement]);

    // Emit telemetry
    recordWorkerPickerEvent({
      type: 'accessibility_announcement',
      slotId: null,
      message,
      priority,
      context: options.context,
    } as any);
  }, [accessibilityConfig.enableAnnouncements]);

  /**
   * Announce drop status for accessibility
   */
  const announceDropStatus = useCallback((
    status: DropStatusType,
    context?: {
      residentId?: string;
      activityId?: string;
      locationName?: string;
      residentName?: string;
    }
  ) => {
    const baseMessage = DROP_STATUS_MESSAGES[status];
    let contextualMessage = baseMessage;

    // Add context to message if available
    if (context) {
      const parts = [baseMessage];
      
      if (context.residentName) {
        parts.push(`Resident: ${context.residentName}`);
      }
      
      if (context.locationName) {
        parts.push(`Location: ${context.locationName}`);
      }
      
      if (context.activityId) {
        parts.push(`Activity: ${context.activityId}`);
      }

      contextualMessage = parts.join('. ');
    }

    // Determine announcement priority based on status
    const priority = status === 'assignment_success' ? 'assertive' : 'polite';

    announce(contextualMessage, priority, {
      context: `drop_status_${status}`,
      duration: status.includes('success') ? 3000 : 2000,
    });

    // Emit specific telemetry for drop status
    recordWorkerPickerEvent({
      type: 'drop_status_announced',
      slotId: context?.activityId || null,
      status,
      message: contextualMessage,
      priority,
    } as any);
  }, [announce]);

  /**
   * Set focus to an element with proper management
   */
  const setFocus = useCallback((element: HTMLElement | null) => {
    if (!accessibilityConfig.enableFocusManagement || !element) return;

    // Save current focus for potential restoration
    const previousFocus = document.activeElement as HTMLElement;
    setCurrentFocus(previousFocus?.id || null);

    // Set focus to new element
    element.focus();

    // Emit telemetry
    recordWorkerPickerEvent({
      type: 'focus_changed',
      slotId: null,
      fromElement: previousFocus?.tagName,
      toElement: element.tagName,
    } as any);
  }, [accessibilityConfig.enableFocusManagement]);

  /**
   * Restore focus to previous element
   */
  const restoreFocus = useCallback(() => {
    if (!accessibilityConfig.enableFocusManagement || !currentFocus) return;

    const previousElement = document.getElementById(currentFocus);
    if (previousElement) {
      previousElement.focus();
      setCurrentFocus(null);
    }
  }, [accessibilityConfig.enableFocusManagement, currentFocus]);

  /**
   * Trap focus within a container (for modals/drawers)
   */
  const trapFocus = useCallback((container: HTMLElement | null) => {
    if (!accessibilityConfig.enableFocusManagement || !container) return;

    focusTrapRef.current = container;

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);

    // Set initial focus
    firstElement.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
      focusTrapRef.current = null;
    };
  }, [accessibilityConfig.enableFocusManagement]);

  /**
   * Check if touch target meets minimum size requirements
   */
  const validateTouchTargetSize = useCallback((element: HTMLElement): boolean => {
    if (!accessibilityConfig.enableTouchAccessibility) return true;

    const rect = element.getBoundingClientRect();
    const minSize = accessibilityConfig.minTouchTargetSize;

    return rect.width >= minSize && rect.height >= minSize;
  }, [accessibilityConfig.enableTouchAccessibility, accessibilityConfig.minTouchTargetSize]);

  /**
   * Get accessibility props for an element
   */
  const getAccessibilityProps = useCallback((options: {
    role?: string;
    label?: string;
    description?: string;
    required?: boolean;
    invalid?: boolean;
    expanded?: boolean;
    selected?: boolean;
    pressed?: boolean;
    checked?: boolean;
  } = {}) => {
    const props: Record<string, any> = {};

    if (options.role) {
      props.role = options.role;
    }

    if (options.label) {
      props['aria-label'] = options.label;
    }

    if (options.description) {
      props['aria-describedby'] = options.description;
    }

    if (options.required !== undefined) {
      props['aria-required'] = options.required;
    }

    if (options.invalid !== undefined) {
      props['aria-invalid'] = options.invalid;
    }

    if (options.expanded !== undefined) {
      props['aria-expanded'] = options.expanded;
    }

    if (options.selected !== undefined) {
      props['aria-selected'] = options.selected;
    }

    if (options.pressed !== undefined) {
      props['aria-pressed'] = options.pressed;
    }

    if (options.checked !== undefined) {
      props['aria-checked'] = options.checked;
    }

    // Add high contrast mode classes if needed
    if (isHighContrastMode) {
      props.className = `${props.className || ''} high-contrast-mode`;
    }

    // Add reduced motion classes if needed
    if (prefersReducedMotion) {
      props.className = `${props.className || ''} reduce-motion`;
    }

    return props;
  }, [isHighContrastMode, prefersReducedMotion]);

  /**
   * Generate unique ID for accessibility elements
   */
  const generateId = useCallback((prefix: string, suffix?: string) => {
    const base = prefix.replace(/[^a-zA-Z0-9]/g, '-');
    const unique = suffix || Math.random().toString(36).substr(2, 9);
    return `${base}-${unique}`;
  }, []);

  return {
    // Configuration
    config: accessibilityConfig,
    isHighContrastMode,
    prefersReducedMotion,
    
    // Announcement system
    announce,
    announceDropStatus,
    announcementQueue,
    
    // Focus management
    setFocus,
    restoreFocus,
    trapFocus,
    currentFocus,
    
    // Touch accessibility
    validateTouchTargetSize,
    
    // Utilities
    getAccessibilityProps,
    generateId,
  };
}

/**
 * Hook for managing accessibility in interaction mode components
 */
export function useInteractionModeA11y() {
  const accessibility = useInteractionModeAccessibility();

  /**
   * Enhanced drop status announcement with context
   */
  const announceDropStatus = useCallback((
    status: DropStatusType,
    residentId?: string,
    activityId?: string,
    locationName?: string,
    residentName?: string
  ) => {
    accessibility.announceDropStatus(status, {
      residentId,
      activityId,
      locationName,
      residentName,
    });
  }, [accessibility]);

  /**
   * Get accessibility props for interaction mode controls
   */
  const getInteractionModeProps = useCallback((mode: 'desktop' | 'mobile') => {
    return accessibility.getAccessibilityProps({
      role: 'button',
      label: `Current mode: ${mode}. Click to switch to ${mode === 'desktop' ? 'mobile' : 'desktop'} mode`,
      pressed: mode === 'desktop',
    });
  }, [accessibility]);

  /**
   * Get accessibility props for auto-detect toggle
   */
  const getAutoDetectProps = useCallback((enabled: boolean) => {
    return accessibility.getAccessibilityProps({
      role: 'switch',
      label: `Auto-detect is ${enabled ? 'enabled' : 'disabled'}. Click to toggle auto-detection`,
      checked: enabled,
    });
  }, [accessibility]);

  return {
    ...accessibility,
    announceDropStatus,
    getInteractionModeProps,
    getAutoDetectProps,
  };
}
