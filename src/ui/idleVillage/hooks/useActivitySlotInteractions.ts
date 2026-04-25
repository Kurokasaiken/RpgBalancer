/**
 * Activity Slot Interactions Hook
 * 
 * Manages keyboard shortcuts, focus flow, and accessibility interactions
 * for ActivitySlotMiniCard components across map, HUD, and TheaterView.
 * 
 * @module useActivitySlotInteractions
 * @since 2026-01-11
 * @author Aurora-UX
 */

import { useCallback, useEffect, useRef } from 'react';

/**
 * Keyboard shortcuts configuration
 */
export interface KeyboardShortcut {
  /** Keyboard key */
  key: string;
  /** Modifier keys required */
  modifiers?: {
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    meta?: boolean;
  };
  /** Shortcut description for ARIA */
  description: string;
  /** Handler function */
  handler: () => void;
}

/**
 * Hook options
 */
export interface UseActivitySlotInteractionsOptions {
  /** Unique ID for the activity slot */
  activityId: string;
  /** Whether the slot is currently focused */
  isFocused?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Focus handler */
  onFocus?: () => void;
  /** Blur handler */
  onBlur?: () => void;
  /** Keyboard shortcuts */
  shortcuts?: KeyboardShortcut[];
  /** Whether to enable arrow key navigation */
  enableArrowNavigation?: boolean;
}

/**
 * Hook return value
 */
export interface UseActivitySlotInteractionsReturn {
  /** Ref to attach to the interactive element */
  ref: React.RefObject<HTMLDivElement | null>;
  /** Props to spread on the interactive element */
  interactionProps: {
    role: 'button';
    tabIndex: number;
    'aria-describedby'?: string;
    'data-shortcut'?: string;
    onKeyDown: (e: React.KeyboardEvent) => void;
    onClick?: () => void;
    onFocus?: () => void;
    onBlur?: () => void;
  };
  /** ID for aria-describedby */
  descriptionId: string;
  /** Formatted shortcuts description */
  shortcutsDescription: string;
}

/**
 * Check if keyboard event matches shortcut
 */
const matchesShortcut = (event: KeyboardEvent | React.KeyboardEvent, shortcut: KeyboardShortcut): boolean => {
  if (event.key !== shortcut.key) return false;
  
  const modifiers = shortcut.modifiers || {};
  return (
    (modifiers.ctrl ?? false) === event.ctrlKey &&
    (modifiers.shift ?? false) === event.shiftKey &&
    (modifiers.alt ?? false) === event.altKey &&
    (modifiers.meta ?? false) === event.metaKey
  );
};

/**
 * Format shortcut for display
 */
const formatShortcut = (shortcut: KeyboardShortcut): string => {
  const parts: string[] = [];
  const modifiers = shortcut.modifiers || {};
  
  if (modifiers.ctrl) parts.push('Ctrl');
  if (modifiers.shift) parts.push('Shift');
  if (modifiers.alt) parts.push('Alt');
  if (modifiers.meta) parts.push('Cmd');
  parts.push(shortcut.key.toUpperCase());
  
  return parts.join('+');
};

/**
 * Hook for managing activity slot interactions with keyboard shortcuts and focus
 * 
 * @param options - Configuration options
 * @returns Interaction props and utilities
 * 
 * @example
 * ```tsx
 * const { ref, interactionProps, descriptionId, shortcutsDescription } = useActivitySlotInteractions({
 *   activityId: 'job_training',
 *   onClick: handleClick,
 *   shortcuts: [
 *     { key: 'Enter', description: 'Open activity details', handler: handleOpen },
 *     { key: 'p', description: 'Pause activity', handler: handlePause },
 *   ],
 * });
 * 
 * return (
 *   <div ref={ref} {...interactionProps}>
 *     <span id={descriptionId} className="sr-only">{shortcutsDescription}</span>
 *   </div>
 * );
 * ```
 */
export function useActivitySlotInteractions(
  options: UseActivitySlotInteractionsOptions
): UseActivitySlotInteractionsReturn {
  const {
    activityId,
    isFocused = false,
    onClick,
    onFocus,
    onBlur,
    shortcuts = [],
    enableArrowNavigation = true,
  } = options;

  const ref = useRef<HTMLDivElement>(null);
  const descriptionId = `activity-slot-${activityId}-description`;

  // Format shortcuts description for ARIA
  const shortcutsDescription = shortcuts.length > 0
    ? `Keyboard shortcuts: ${shortcuts.map(s => `${formatShortcut(s)} to ${s.description}`).join(', ')}`
    : '';

  // Handle keyboard events
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Check for custom shortcuts
    for (const shortcut of shortcuts) {
      if (matchesShortcut(e, shortcut)) {
        e.preventDefault();
        shortcut.handler();
        return;
      }
    }

    // Handle standard interactions
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
      return;
    }

    // Handle arrow navigation if enabled
    if (enableArrowNavigation && ref.current) {
      const currentElement = ref.current;
      let nextElement: HTMLElement | null = null;

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          nextElement = findNextFocusableSlot(currentElement, 'forward');
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          nextElement = findNextFocusableSlot(currentElement, 'backward');
          break;
        case 'Home':
          e.preventDefault();
          nextElement = findFirstFocusableSlot(currentElement);
          break;
        case 'End':
          e.preventDefault();
          nextElement = findLastFocusableSlot(currentElement);
          break;
      }

      if (nextElement) {
        nextElement.focus();
      }
    }
  }, [shortcuts, onClick, enableArrowNavigation]);

  // Auto-focus when isFocused changes
  useEffect(() => {
    if (isFocused && ref.current) {
      ref.current.focus();
    }
  }, [isFocused]);

  const interactionProps = {
    role: 'button' as const,
    tabIndex: 0,
    'aria-describedby': shortcutsDescription ? descriptionId : undefined,
    'data-shortcut': shortcuts.length > 0 ? shortcuts.map(formatShortcut).join(', ') : undefined,
    onKeyDown: handleKeyDown,
    onClick,
    onFocus,
    onBlur,
  };

  return {
    ref,
    interactionProps,
    descriptionId,
    shortcutsDescription,
  };
}

/**
 * Find next focusable activity slot in DOM
 */
function findNextFocusableSlot(current: HTMLElement, direction: 'forward' | 'backward'): HTMLElement | null {
  const container = current.closest('[data-activity-slots-container]');
  if (!container) return null;

  const slots = Array.from(container.querySelectorAll('[data-activity-id]')) as HTMLElement[];
  const currentIndex = slots.indexOf(current);
  
  if (currentIndex === -1) return null;

  const nextIndex = direction === 'forward' 
    ? (currentIndex + 1) % slots.length 
    : (currentIndex - 1 + slots.length) % slots.length;

  return slots[nextIndex] || null;
}

/**
 * Find first focusable activity slot in container
 */
function findFirstFocusableSlot(current: HTMLElement): HTMLElement | null {
  const container = current.closest('[data-activity-slots-container]');
  if (!container) return null;

  const slots = container.querySelectorAll('[data-activity-id]');
  return slots.length > 0 ? (slots[0] as HTMLElement) : null;
}

/**
 * Find last focusable activity slot in container
 */
function findLastFocusableSlot(current: HTMLElement): HTMLElement | null {
  const container = current.closest('[data-activity-slots-container]');
  if (!container) return null;

  const slots = container.querySelectorAll('[data-activity-id]');
  return slots.length > 0 ? (slots[slots.length - 1] as HTMLElement) : null;
}
