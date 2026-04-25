/**
 * Telemetry hook for tracking accessibility metrics
 * Monitors drag and drop accessibility compliance
 */

import { useCallback, useRef, useEffect } from 'react';
import type { DragAnnouncement } from './useDragAnnouncements';

export interface AccessibilityTelemetryEvent {
  type: 'drag_start' | 'drag_end' | 'drag_cancel' | 'validation_error' | 'screen_reader_announcement';
  timestamp: number;
  data: {
    residentId?: string;
    residentName?: string;
    slotId?: string;
    success?: boolean;
    errorType?: string;
    announcement?: string;
    announcementType?: string;
    userAgent?: string;
    screenReaderActive?: boolean;
    keyboardNavigation?: boolean;
    reducedMotion?: boolean;
  };
}

export interface AccessibilityMetrics {
  totalDragOperations: number;
  successfulDrops: number;
  failedDrops: number;
  cancelledDrops: number;
  validationErrors: number;
  screenReaderAnnouncements: number;
  keyboardOnlyOperations: number;
  reducedMotionUsers: number;
  averageDragTime: number;
  accessibilityScore: number; // 0-100
}

export interface UseAccessibilityTelemetryOptions {
  enabled?: boolean;
  sampleRate?: number;
  batchSize?: number;
}

/**
 * Hook for collecting accessibility telemetry data
 * Tracks user interactions and accessibility compliance
 */
export function useAccessibilityTelemetry(options: UseAccessibilityTelemetryOptions = {}) {
  const { enabled = true, sampleRate = 1.0, batchSize = 10 } = options;
  const events = useRef<AccessibilityTelemetryEvent[]>([]);
  const dragStartTime = useRef<number | null>(null);
  const isKeyboardUser = useRef(false);
  const hasScreenReader = useRef(false);
  const prefersReducedMotion = useRef(false);

  // Detect user preferences and capabilities
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    // Detect screen reader usage
    hasScreenReader.current = window.speechSynthesis !== undefined || 
      'webkitSpeechSynthesis' in window ||
      navigator.userAgent.includes('NVDA') ||
      navigator.userAgent.includes('JAWS') ||
      navigator.userAgent.includes('VoiceOver');

    // Detect reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    prefersReducedMotion.current = mediaQuery.matches;

    // Detect keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        isKeyboardUser.current = true;
      }
    };

    const handleMouseDown = () => {
      isKeyboardUser.current = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleMouseDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, [enabled]);

  const recordEvent = useCallback((event: Omit<AccessibilityTelemetryEvent, 'timestamp'>) => {
    if (!enabled || Math.random() > sampleRate) return;

    const fullEvent: AccessibilityTelemetryEvent = {
      ...event,
      timestamp: Date.now(),
      data: {
        ...event.data,
        userAgent: navigator.userAgent,
        screenReaderActive: hasScreenReader.current,
        keyboardNavigation: isKeyboardUser.current,
        reducedMotion: prefersReducedMotion.current,
      },
    };

    events.current.push(fullEvent);

    // Batch send events
    if (events.current.length >= batchSize) {
      sendEvents();
    }
  }, [enabled, sampleRate, batchSize]);

  const sendEvents = useCallback(() => {
    if (events.current.length === 0) return;

    const eventsToSend = events.current.splice(0, batchSize);
    
    // Send to analytics service
    if (typeof window !== 'undefined' && 'gtag' in window) {
      eventsToSend.forEach(event => {
        (window as any).gtag('event', `accessibility_${event.type}`, {
          event_category: 'accessibility',
          event_label: event.data.residentName || event.data.slotId || 'unknown',
          value: event.data.success ? 1 : 0,
          custom_parameters: {
            screen_reader_active: event.data.screenReaderActive,
            keyboard_navigation: event.data.keyboardNavigation,
            reduced_motion: event.data.reducedMotion,
          },
        });
      });
    }

    // Also send to custom telemetry endpoint if available
    if (typeof fetch !== 'undefined') {
      fetch('/api/telemetry/accessibility', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events: eventsToSend }),
      }).catch(() => {
        // Silently fail - don't interrupt user experience
      });
    }
  }, [batchSize]);

  const recordDragStart = useCallback((residentId: string, residentName: string) => {
    dragStartTime.current = Date.now();
    recordEvent({
      type: 'drag_start',
      data: { residentId, residentName },
    });
  }, [recordEvent]);

  const recordDragEnd = useCallback((residentId: string, residentName: string, success: boolean, slotId?: string) => {
    const dragTime = dragStartTime.current ? Date.now() - dragStartTime.current : 0;
    dragStartTime.current = null;
    
    recordEvent({
      type: 'drag_end',
      data: { residentId, residentName, success, slotId },
    });
  }, [recordEvent]);

  const recordDragCancel = useCallback((residentId: string, residentName: string) => {
    dragStartTime.current = null;
    recordEvent({
      type: 'drag_cancel',
      data: { residentId, residentName },
    });
  }, [recordEvent]);

  const recordValidationError = useCallback((residentId: string, residentName: string, errorType: string) => {
    recordEvent({
      type: 'validation_error',
      data: { residentId, residentName, errorType },
    });
  }, [recordEvent]);

  const recordScreenReaderAnnouncement = useCallback((announcement: string, type: string) => {
    recordEvent({
      type: 'screen_reader_announcement',
      data: { announcement, announcementType: type },
    });
  }, [recordEvent]);

  const getMetrics = useCallback((): AccessibilityMetrics => {
    const allEvents = events.current;
    const dragStarts = allEvents.filter(e => e.type === 'drag_start');
    const dragEnds = allEvents.filter(e => e.type === 'drag_end');
    const dragCancels = allEvents.filter(e => e.type === 'drag_cancel');
    const validationErrors = allEvents.filter(e => e.type === 'validation_error');
    const announcements = allEvents.filter(e => e.type === 'screen_reader_announcement');

    const successfulDrops = dragEnds.filter(e => e.data.success).length;
    const failedDrops = dragEnds.filter(e => !e.data.success).length;
    
    // Calculate average drag time
    const dragTimes = dragEnds.map(end => {
      const start = dragStarts.find(s => s.data.residentId === end.data.residentId);
      return start ? end.timestamp - start.timestamp : 0;
    }).filter(time => time > 0);
    
    const averageDragTime = dragTimes.length > 0 
      ? dragTimes.reduce((sum, time) => sum + time, 0) / dragTimes.length 
      : 0;

    // Calculate accessibility score (0-100)
    const totalOperations = dragStarts.length;
    const successRate = totalOperations > 0 ? successfulDrops / totalOperations : 1;
    const errorRate = totalOperations > 0 ? validationErrors.length / totalOperations : 0;
    const announcementRate = totalOperations > 0 ? announcements.length / totalOperations : 0;
    
    const accessibilityScore = Math.max(0, Math.min(100, 
      (successRate * 50) + 
      ((1 - errorRate) * 30) + 
      (announcementRate * 20)
    ));

    return {
      totalDragOperations: dragStarts.length,
      successfulDrops,
      failedDrops,
      cancelledDrops: dragCancels.length,
      validationErrors: validationErrors.length,
      screenReaderAnnouncements: announcements.length,
      keyboardOnlyOperations: allEvents.filter(e => e.data.keyboardNavigation).length,
      reducedMotionUsers: allEvents.filter(e => e.data.reducedMotion).length,
      averageDragTime,
      accessibilityScore,
    };
  }, []);

  // Send remaining events on unmount
  useEffect(() => {
    return () => {
      sendEvents();
    };
  }, [sendEvents]);

  return {
    recordDragStart,
    recordDragEnd,
    recordDragCancel,
    recordValidationError,
    recordScreenReaderAnnouncement,
    getMetrics,
    sendEvents,
    isKeyboardUser: isKeyboardUser.current,
    hasScreenReader: hasScreenReader.current,
    prefersReducedMotion: prefersReducedMotion.current,
  };
}
