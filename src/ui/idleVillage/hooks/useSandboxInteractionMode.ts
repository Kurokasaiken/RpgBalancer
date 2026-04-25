import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createSandboxDiagnostics, type PickerDiagnosticsPayload } from '@/ui/idleVillage/utils/sandboxDiagnostics';
import { recordWorkerPickerEvent, type WorkerPickerTelemetryEvent } from '@/ui/idleVillage/utils/workerPickerTelemetry';
import { useInteractionModeStore } from './useInteractionModeStore';

/**
 * Interaction modes supported by the sandbox.
 */
export type InteractionMode = 'desktop' | 'mobile';

/**
 * Sources that can trigger picker interactions.
 */
export type InteractionSource = 'keyboard' | 'touch' | 'click' | null;

/**
 * CTA highlight state for mobile interactions.
 */
export type CtaHighlightState = 'idle' | 'highlight' | 'success' | 'error';

/**
 * Hook parameters for useSandboxInteractionMode.
 */
export interface UseSandboxInteractionModeParams {
  /** Current interaction mode override (for testing) */
  forceMode?: InteractionMode;
  /** Mobile detection override */
  isMobile?: boolean;
  /** Callback when resident selection is handled (e.g. for desktop detail view) */
  handleResidentSelect?: (residentId: string) => void;
  /** Callback when desktop slot focus changes */
  onDesktopSlotFocus?: (slotId: string | null) => void;
  /** Callback when picker opens */
  onPickerOpen?: (slotId: string | null, source: InteractionSource) => void;
  /** Callback when picker closes */
  onPickerClose?: (slotId: string | null, reason?: string) => void;
  /** Callback when resident is assigned */
  onResidentAssign?: (slotId: string | null, residentId: string, tapCount: number) => void;
  /** Enable diagnostics logging */
  enableDiagnostics?: boolean;
  /** Diagnostics scope name */
  diagnosticsScope?: string;
}

/**
 * Hook return type for useSandboxInteractionMode.
 */
export interface UseSandboxInteractionModeReturn {
  /** Current interaction mode */
  mode: InteractionMode;
  /** Whether picker is currently active */
  isPickerActive: boolean;
  /** Current CTA highlight state */
  ctaHighlightState: CtaHighlightState;
  /** Current tap count for active assignment */
  currentTapCount: number;
  /** Max allowed taps per assignment (Mind Studios KPI: ≤3) */
  readonly maxTapsPerAssignment: number;
  /** Open picker with source tracking */
  openPicker: (slotId: string | null, source?: InteractionSource) => void;
  /** Close picker with reason */
  closePicker: (reason?: string) => void;
  /** Handle resident assignment with tap tracking */
  assignResident: (slotId: string | null, residentId: string) => void;
  /** Reset tap count and CTA state */
  resetInteractionState: () => void;
  /** Highlight CTA for mobile affordance */
  highlightCta: (state: CtaHighlightState, durationMs?: number) => void;
  /** Handle resident selection */
  handleResidentSelect: (residentId: string) => void;
  /** Handle slot click interaction */
  handleSlotClick: (slotId: string) => void;
  /** Exposed internal picker state for diagnostics/test-hooks */
  pickerState: {
    slotId: string | null;
    trigger: InteractionSource;
  };
  /** Exposed interaction mode for components */
  interactionMode: 'drag' | 'tap';
  /** Store methods for interaction mode management */
  setPreferredMode: (mode: InteractionMode) => void;
  setAutoDetect: (autoDetect: boolean) => void;
  updateSessionStats: (mode: InteractionMode, sessionDuration: number) => void;
  updateUIPreferences: (preferences: Partial<{
    showModeSwitcher: boolean;
    enableHapticFeedback: boolean;
    animationSpeedMultiplier: number;
    touchTargetSizeMultiplier: number;
  }>) => void;
  /** Store state for UI components */
  preference: {
    preferredMode: InteractionMode;
    autoDetect: boolean;
    uiPreferences: {
      showModeSwitcher: boolean;
      enableHapticFeedback: boolean;
      animationSpeedMultiplier: number;
      touchTargetSizeMultiplier: number;
    };
  };
}

/**
 * Mind Studios KPI: Maximum taps per assignment for optimal UX.
 */
const MAX_TAPS_PER_ASSIGNMENT = 3;

/**
 * Default CTA highlight duration for mobile affordance.
 */
const DEFAULT_CTA_HIGHLIGHT_DURATION_MS = 800;

/**
 * Detects the current interaction mode based on device capabilities.
 */
function detectInteractionMode(forceMode?: InteractionMode): InteractionMode {
  if (forceMode) {
    return forceMode;
  }

  // Check for touch capability
  if (typeof window !== 'undefined') {
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

    // Prioritize mobile for touch devices or mobile user agents
    if (hasTouch || isMobileUserAgent) {
      return 'mobile';
    }
  }

  return 'desktop';
}

/**
 * Hook to manage sandbox interaction modes (desktop drag vs mobile tap).
 * Implements Mind Studios KPIs: ≤3 taps, clear CTAs, immediate feedback.
 * Config-first: reads interaction preferences, provides mobile affordances.
 */
export function useSandboxInteractionMode({
  forceMode,
  isMobile: isMobileProp,
  handleResidentSelect: _onResidentSelect,
  onDesktopSlotFocus: _onDesktopSlotFocus,
  onPickerOpen,
  onPickerClose,
  onResidentAssign,
  enableDiagnostics = false,
  diagnosticsScope = 'useSandboxInteractionMode',
}: UseSandboxInteractionModeParams = {}): UseSandboxInteractionModeReturn {
  const diagnostics = useMemo(
    () => createSandboxDiagnostics<PickerDiagnosticsPayload>(diagnosticsScope, 'picker'),
    [diagnosticsScope],
  );

  // Get interaction mode store
  const {
    preference,
    setPreferredMode,
    setAutoDetect,
    updateSessionStats,
    updateUIPreferences,
    getEffectiveMode,
  } = useInteractionModeStore();

  // Detect auto mode
  const detectedMode = useMemo(() => {
    if (forceMode) return forceMode;
    if (isMobileProp) return 'mobile';
    return detectInteractionMode();
  }, [forceMode, isMobileProp]);

  // Get effective mode based on preferences
  const mode = useMemo(() => {
    return getEffectiveMode(detectedMode);
  }, [detectedMode, getEffectiveMode]);

  // Core state
  const [isPickerActive, setIsPickerActive] = useState(false);
  const [ctaHighlightState, setCtaHighlightState] = useState<CtaHighlightState>('idle');
  const [currentTapCount, setCurrentTapCount] = useState(0);
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);
  const [interactionSource, setInteractionSource] = useState<InteractionSource>(null);

  // Refs for state management
  const currentSlotIdRef = useRef<string | null>(null);
  const highlightTimeoutRef = useRef<number | null>(null);
  const currentTapCountRef = useRef(0);
  const isTestModeRef = useRef(typeof window !== 'undefined' && window.__ENABLE_IDLE_VILLAGE_TEST_HOOKS);

  // Reset timeout on unmount
  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        window.clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);

  // Log diagnostics when picker state changes
  useEffect(() => {
    if (enableDiagnostics && isTestModeRef.current) {
      diagnostics.info('Interaction mode state', {
        mode,
        isPickerActive,
        ctaHighlightState,
        currentTapCount,
        slotId: currentSlotIdRef.current,
      });
    }
  }, [mode, isPickerActive, ctaHighlightState, currentTapCount, enableDiagnostics, diagnostics]);

  const openPicker = useCallback(
    (slotId: string | null, source: InteractionSource = null) => {
      currentSlotIdRef.current = slotId;
      setActiveSlotId(slotId);
      setInteractionSource(source);
      setIsPickerActive(true);
      setCurrentTapCount(0);
      currentTapCountRef.current = 0; // Reset ref as well
      setCtaHighlightState('idle');

      // Emit telemetry
      const telemetryEvent: WorkerPickerTelemetryEvent = {
        type: 'open',
        slotId,
        candidateCount: 0, // Will be updated by picker component
      };
      recordWorkerPickerEvent(telemetryEvent);

      // Call external callback
      onPickerOpen?.(slotId, source);

      if (enableDiagnostics && isTestModeRef.current) {
        diagnostics.debug('Picker opened', { slotId, source, mode });
      }
    },
    [mode, onPickerOpen, enableDiagnostics, diagnostics],
  );

  const closePicker = useCallback(
    (reason?: string) => {
      const slotId = currentSlotIdRef.current;
      setIsPickerActive(false);
      setCurrentTapCount(0);
      setCtaHighlightState('idle');
      currentSlotIdRef.current = null;
      setActiveSlotId(null);
      setInteractionSource(null);

      // Emit telemetry
      const telemetryEvent: WorkerPickerTelemetryEvent = {
        type: 'close',
        slotId,
        closeDurationMs: 0, // Will be tracked by picker component
        closedWithinThreshold: false,
      };
      recordWorkerPickerEvent(telemetryEvent);

      // Call external callback
      onPickerClose?.(slotId, reason);

      if (enableDiagnostics && isTestModeRef.current) {
        diagnostics.debug('Picker closed', { slotId, reason });
      }
    },
    [onPickerClose, enableDiagnostics, diagnostics],
  );

  const assignResident = useCallback(
    (slotId: string | null, residentId: string) => {
      const newTapCount = currentTapCountRef.current + 1;

      // Mind Studios KPI: Track tap count, warn if exceeding 3
      if (newTapCount > MAX_TAPS_PER_ASSIGNMENT) {
        if (enableDiagnostics && isTestModeRef.current) {
          diagnostics.warn('Tap count exceeded KPI threshold', {
            slotId,
            residentId,
            tapCount: newTapCount,
            threshold: MAX_TAPS_PER_ASSIGNMENT,
          });
        }
      }

      // Update both ref and state
      currentTapCountRef.current = newTapCount;
      setCurrentTapCount(newTapCount);

      // Highlight CTA on success for mobile affordance
      if (mode === 'mobile') {
        setCtaHighlightState('success');
        if (highlightTimeoutRef.current) {
          window.clearTimeout(highlightTimeoutRef.current);
        }
        highlightTimeoutRef.current = window.setTimeout(() => {
          setCtaHighlightState('idle');
        }, DEFAULT_CTA_HIGHLIGHT_DURATION_MS);
      }

      // Emit telemetry
      const telemetryEvent: WorkerPickerTelemetryEvent = {
        type: 'assignment_success',
        slotId,
        residentId,
        latencyMs: 0, // Will be tracked by picker component
        compatibilityScore: 0, // Will be set by picker component
        tapCount: newTapCount,
      };
      recordWorkerPickerEvent(telemetryEvent);

      // Call external callback
      onResidentAssign?.(slotId, residentId, newTapCount);

      if (enableDiagnostics && isTestModeRef.current) {
        diagnostics.debug('Resident assigned', {
          slotId,
          residentId,
          tapCount: newTapCount,
          mode,
        });
      }
    },
    [mode, onResidentAssign, enableDiagnostics, diagnostics],
  );

  const resetInteractionState = useCallback(() => {
    setCurrentTapCount(0);
    currentTapCountRef.current = 0; // Reset ref as well
    setCtaHighlightState('idle');
    if (highlightTimeoutRef.current) {
      window.clearTimeout(highlightTimeoutRef.current);
      highlightTimeoutRef.current = null;
    }

    if (enableDiagnostics && isTestModeRef.current) {
      diagnostics.debug('Interaction state reset');
    }
  }, [enableDiagnostics, diagnostics]);

  const highlightCta = useCallback(
    (state: CtaHighlightState, durationMs = DEFAULT_CTA_HIGHLIGHT_DURATION_MS) => {
      setCtaHighlightState(state);

      if (state !== 'idle' && durationMs > 0) {
        if (highlightTimeoutRef.current) {
          window.clearTimeout(highlightTimeoutRef.current);
        }
        highlightTimeoutRef.current = window.setTimeout(() => {
          setCtaHighlightState('idle');
        }, durationMs);
      }

      if (enableDiagnostics && isTestModeRef.current) {
        diagnostics.debug('CTA highlighted', { state, durationMs, mode });
      }
    },
    [mode, enableDiagnostics, diagnostics],
  );

  const handleSlotClick = useCallback(
    (slotId: string) => {
      if (mode === 'mobile') {
        openPicker(slotId, 'click');
      }
    },
    [mode, openPicker]
  );

  return {
    mode,
    isPickerActive,
    ctaHighlightState,
    currentTapCount,
    maxTapsPerAssignment: MAX_TAPS_PER_ASSIGNMENT,
    openPicker,
    closePicker,
    assignResident,
    resetInteractionState,
    highlightCta,
    handleSlotClick,
    pickerState: {
      slotId: activeSlotId,
      trigger: interactionSource,
    },
    interactionMode: mode === 'desktop' ? 'drag' : 'tap',
    // Store methods and state
    setPreferredMode,
    setAutoDetect,
    updateSessionStats,
    updateUIPreferences,
    preference: {
      preferredMode: preference.preferredMode,
      autoDetect: preference.autoDetect,
      uiPreferences: preference.uiPreferences,
    },
    handleResidentSelect: (residentId: string) => {
      const slotId = currentSlotIdRef.current;
      
      if (slotId) {
        // Assign the resident to the current slot
        assignResident(slotId, residentId);
        
        // Close the picker after assignment in mobile mode
        if (mode === 'mobile') {
          closePicker('resident_selected');
        }
      }
      
      // Log the selection for diagnostics
      if (enableDiagnostics && isTestModeRef.current) {
        diagnostics.debug('Resident selected', { residentId, slotId, mode });
      }
    },
  };
}
