/**
 * Quest Detail Lens Hook
 * 
 * Manages state for the Quest Detail Lens overlay component.
 * Handles quest selection, lens visibility, keyboard navigation,
 * and telemetry integration with QuestTelemetry data.
 * 
 * @since IV-Phase12-quest-detail-lens
 * @author Aurora-Quest
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import type { QuestResult } from '@/engine/quest/types';
import { useQuestTelemetry } from '@/ui/idleVillage/hooks/useQuestTelemetry';
import { trackQuestEvent } from '@/ui/idleVillage/utils/questTelemetry';

/**
 * Quest lens state interface
 */
export interface QuestLensState {
  /** Whether the lens is currently visible */
  isOpen: boolean;
  /** Currently selected quest ID */
  selectedQuestId: string | null;
  /** Quest result data for the selected quest */
  questResult: QuestResult | null;
  /** Whether the lens is currently loading */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
}

/**
 * Quest lens actions interface
 */
export interface QuestLensActions {
  /** Open the lens for a specific quest */
  openLens: (questId: string) => void;
  /** Close the lens */
  closeLens: () => void;
  /** Toggle lens visibility */
  toggleLens: () => void;
  /** Navigate to previous quest in recent list */
  navigatePrevious: () => void;
  /** Navigate to next quest in recent list */
  navigateNext: () => void;
  /** Clear error state */
  clearError: () => void;
}

/**
 * Props for useQuestLensState hook
 */
export interface UseQuestLensStateProps {
  /** Initial visibility state (default: false) */
  initialIsOpen?: boolean;
  /** Initial selected quest ID (optional) */
  initialQuestId?: string;
  /** Whether to enable keyboard navigation (default: true) */
  enableKeyboardNavigation?: boolean;
  /** Whether to auto-track telemetry events (default: true) */
  enableTelemetry?: boolean;
}

/**
 * Hook return type
 */
export interface UseQuestLensStateReturn extends QuestLensState, QuestLensActions {
  /** Current navigation index in recent quests list */
  navigationIndex: number;
  /** Total number of recent quests available */
  totalRecentQuests: number;
  /** Whether previous navigation is available */
  canNavigatePrevious: boolean;
  /** Whether next navigation is available */
  canNavigateNext: boolean;
}

/**
 * Quest Detail Lens Hook
 * 
 * Manages the state and behavior of the Quest Detail Lens overlay.
 * Integrates with QuestTelemetry to display quest details, risk assessment,
 * and recent quest navigation with keyboard support.
 * 
 * @param props - Hook configuration options
 * @returns Quest lens state and actions
 */
export function useQuestLensState(props: UseQuestLensStateProps = {}): UseQuestLensStateReturn {
  const {
    initialIsOpen = false,
    initialQuestId = null,
    enableKeyboardNavigation = true,
    enableTelemetry = true,
  } = props;

  // Quest telemetry integration
  const { telemetry } = useQuestTelemetry();

  // Internal state
  const [isOpen, setIsOpen] = useState(initialIsOpen);
  const [selectedQuestId, setSelectedQuestId] = useState(initialQuestId);
  const [navigationIndex, setNavigationIndex] = useState(0);
  // Refs for keyboard navigation
  const lensRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  /**
   * Get quest result data for a specific quest ID
   */
  const getQuestResult = useCallback((questId: string): QuestResult | null => {
    // Search in recent quests first
    const recentQuest = telemetry.recentQuests.find(q => q.questId === questId);
    if (recentQuest) {
      return recentQuest.result;
    }

    // Branch decisions don't have questId or questResult properties
    // We'll need to search differently or extend the interface
    return null;
  }, [telemetry.recentQuests]);

  /**
   * Error state derived from quest data availability
   */
  const error = useMemo(() => {
    if (selectedQuestId && !getQuestResult(selectedQuestId)) {
      return `Quest data not found for ID: ${selectedQuestId}`;
    }
    return null;
  }, [selectedQuestId, getQuestResult]);

  /**
   * Current quest result data
   */
  const questResult = selectedQuestId ? getQuestResult(selectedQuestId) : null;

  /**
   * Loading state (simulated - could be enhanced with async loading)
   */
  const isLoading = false;

  /**
   * Total number of recent quests available for navigation
   */
  const totalRecentQuests = telemetry.recentQuests.length;

  /**
   * Navigation availability flags
   */
  const canNavigatePrevious = navigationIndex > 0;
  const canNavigateNext = navigationIndex < totalRecentQuests - 1;

  /**
   * Open the lens for a specific quest
   */
  const openLens = useCallback((questId: string) => {
    // Store current focus for restoration
    if (typeof document !== 'undefined') {
      previousFocusRef.current = document.activeElement as HTMLElement;
    }

    setSelectedQuestId(questId);
    setIsOpen(true);
    // Error is derived state, no manual setting needed

    // Find navigation index for this quest
    const index = telemetry.recentQuests.findIndex(q => q.questId === questId);
    setNavigationIndex(index >= 0 ? index : 0);

    // Track telemetry event
    if (enableTelemetry) {
      trackQuestEvent('quest_lens_opened', {
        questId,
        source: 'hud_mini_card',
        timestamp: Date.now(),
        recentQuestsCount: totalRecentQuests,
        navigationIndex: index >= 0 ? index : 0,
      });
    }
  }, [telemetry.recentQuests, totalRecentQuests, enableTelemetry]);

  /**
   * Close the lens
   */
  const closeLens = useCallback(() => {
    setIsOpen(false);
    setSelectedQuestId(null);
    setNavigationIndex(0);
    // Error is derived state, no manual setting needed

    // Restore focus to previous element
    if (previousFocusRef.current && typeof document !== 'undefined') {
      previousFocusRef.current.focus();
    }

    // Track telemetry event
    if (enableTelemetry && selectedQuestId) {
      trackQuestEvent('quest_lens_closed', {
        questId: selectedQuestId,
        timestamp: Date.now(),
        duration: 0, // Could be enhanced with actual duration tracking
      });
    }
  }, [selectedQuestId, enableTelemetry]);

  /**
   * Toggle lens visibility
   */
  const toggleLens = useCallback(() => {
    if (isOpen) {
      closeLens();
    } else if (selectedQuestId) {
      openLens(selectedQuestId);
    }
  }, [isOpen, selectedQuestId, closeLens, openLens]);

  /**
   * Navigate to previous quest in recent list
   */
  const navigatePrevious = useCallback(() => {
    if (canNavigatePrevious) {
      const newIndex = navigationIndex - 1;
      const previousQuest = telemetry.recentQuests[newIndex];
      if (previousQuest) {
        setSelectedQuestId(previousQuest.questId);
        setNavigationIndex(newIndex);

        // Track telemetry event
        if (enableTelemetry) {
          trackQuestEvent('quest_lens_navigate', {
            questId: previousQuest.questId,
            direction: 'previous',
            navigationIndex: newIndex,
            timestamp: Date.now(),
          });
        }
      }
    }
  }, [canNavigatePrevious, navigationIndex, telemetry.recentQuests, enableTelemetry]);

  /**
   * Navigate to next quest in recent list
   */
  const navigateNext = useCallback(() => {
    if (canNavigateNext) {
      const newIndex = navigationIndex + 1;
      const nextQuest = telemetry.recentQuests[newIndex];
      if (nextQuest) {
        setSelectedQuestId(nextQuest.questId);
        setNavigationIndex(newIndex);

        // Track telemetry event
        if (enableTelemetry) {
          trackQuestEvent('quest_lens_navigate', {
            questId: nextQuest.questId,
            direction: 'next',
            navigationIndex: newIndex,
            timestamp: Date.now(),
          });
        }
      }
    }
  }, [canNavigateNext, navigationIndex, telemetry.recentQuests, enableTelemetry]);

  /**
   * Clear error state (derived state, no action needed)
   */
  const clearError = useCallback(() => {
    // Error is derived state, no action needed
  }, []);

  /**
   * Keyboard navigation handler
   */
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isOpen || !enableKeyboardNavigation) return;

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        closeLens();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        navigatePrevious();
        break;
      case 'ArrowRight':
        event.preventDefault();
        navigateNext();
        break;
      case 'Tab':
        // Allow default tab behavior within the lens
        break;
      default:
        break;
    }
  }, [isOpen, enableKeyboardNavigation, closeLens, navigatePrevious, navigateNext]);

  /**
   * Set up keyboard event listeners
   */
  useEffect(() => {
    if (enableKeyboardNavigation && isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [enableKeyboardNavigation, isOpen, handleKeyDown]);

  /**
   * Focus management when lens opens
   */
  useEffect(() => {
    if (isOpen && lensRef.current) {
      // Focus the lens container for keyboard navigation
      lensRef.current.focus();
    }
  }, [isOpen]);

  /**
   * Handle quest ID changes from external sources (error is derived state)
   */
  // No effect needed - error is derived from useMemo

  return {
    // State
    isOpen,
    selectedQuestId,
    questResult,
    isLoading,
    error,
    navigationIndex,
    totalRecentQuests,
    canNavigatePrevious,
    canNavigateNext,

    // Actions
    openLens,
    closeLens,
    toggleLens,
    navigatePrevious,
    navigateNext,
    clearError,
  };
}

/**
 * Default export for convenience
 */
export default useQuestLensState;
