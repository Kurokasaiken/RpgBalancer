/**
 * Hook for managing drag and drop accessibility announcements
 * Provides screen reader support for drag operations
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export interface DragAnnouncement {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
  timestamp: number;
}

export interface UseDragAnnouncementsOptions {
  enabled?: boolean;
  clearDelay?: number;
}

/**
 * Hook for managing drag and drop accessibility announcements
 * Provides ARIA live region support for screen readers
 */
export function useDragAnnouncements(options: UseDragAnnouncementsOptions = {}) {
  const { enabled = true, clearDelay = 3000 } = options;
  const [announcements, setAnnouncements] = useState<DragAnnouncement[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearAnnouncements = useCallback(() => {
    setAnnouncements([]);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const announce = useCallback((message: string, type: DragAnnouncement['type'] = 'info') => {
    if (!enabled) return;

    const announcement: DragAnnouncement = {
      id: `drag-announcement-${Date.now()}-${Math.random()}`,
      message,
      type,
      timestamp: Date.now(),
    };

    setAnnouncements(prev => [...prev.slice(-2), announcement]); // Keep only last 3 announcements

    // Auto-clear announcements after delay
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      clearAnnouncements();
    }, clearDelay);
  }, [enabled, clearDelay, clearAnnouncements]);

  const announceDragStart = useCallback((residentName: string, targetSlot?: string) => {
    announce(
      `Dragging ${residentName}${targetSlot ? ` to ${targetSlot}` : ''}`,
      'info'
    );
  }, [announce]);

  const announceDragEnd = useCallback((residentName: string, success: boolean, targetSlot?: string) => {
    if (success) {
      announce(
        `Dropped ${residentName}${targetSlot ? ` in ${targetSlot}` : ' successfully'}`,
        'success'
      );
    } else {
      announce(
        `Failed to drop ${residentName}${targetSlot ? ` in ${targetSlot}` : ''}`,
        'error'
      );
    }
  }, [announce]);

  const announceDragCancel = useCallback((residentName: string) => {
    announce(`Cancelled dragging ${residentName}`, 'info');
  }, [announce]);

  const announceValidationError = useCallback((residentName: string, error: string) => {
    announce(`Cannot drop ${residentName}: ${error}`, 'error');
  }, [announce]);

  const announceSlotHover = useCallback((slotName: string, canAccept: boolean, residentName?: string) => {
    if (canAccept) {
      announce(
        `${slotName} slot${residentName ? ` can accept ${residentName}` : ' is available for drop'}`,
        'info'
      );
    } else {
      announce(
        `${slotName} slot${residentName ? ` cannot accept ${residentName}` : ' is not available for drop'}`,
        'warning'
      );
    }
  }, [announce]);

  const announcePhaseChange = useCallback((phase: 'day' | 'night') => {
    announce(
      phase === 'night' ? 'Night phase: dragging disabled' : 'Day phase: dragging enabled',
      'info'
    );
  }, [announce]);

  const announceFilterChange = useCallback((filterType: string, value: string, count: number) => {
    announce(`Filter changed: ${filterType} set to ${value}, showing ${count} residents`, 'info');
  }, [announce]);

  return {
    announcements,
    announce,
    clearAnnouncements,
    announceDragStart,
    announceDragEnd,
    announceDragCancel,
    announceValidationError,
    announceSlotHover,
    announcePhaseChange,
    announceFilterChange,
  };
}
