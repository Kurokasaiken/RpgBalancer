/**
 * useExtractionStateMachine Hook
 * 
 * State machine for slot extraction animations with precise timing control.
 * Replaces scattered boolean flags in DetailSlot with discrete phases.
 * 
 * Phases:
 * idle -> extracting -> bezelAnimating -> completing -> springBack -> clearing -> idle
 * idle -> slogAnimating -> idle (when removing PG from slot)
 * 
 * On cancel (mouse release mid-extraction):
 * extracting|bezelAnimating -> springBack -> clearing -> idle
 * The bezel animates back elastically instead of snapping to 0.
 * 
 * Timing:
 * - bezelAnimating: 560ms (CSS transition in SlotV12Renderer)
 * - springBack: 600ms (PgCard bounce-spring animation)
 * - clearing: 200ms (cleanup delay)
 * - slogAnimating: 600ms (PG returns to roster with spring animation)
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export type ExtractionPhase = 'idle' | 'extracting' | 'bezelAnimating' | 'completing' | 'springBack' | 'clearing' | 'slogAnimating';

export interface ExtractionState {
  phase: ExtractionPhase;
  extractionProgress: number;     // 0-1 for extracting, 1+ for spring overshoot
  isBezelAnimationDone: boolean;  // true after 560ms CSS transition
  isMedalFadingOut: boolean;      // true during bezelAnimating
  isSloggingOut: boolean;         // true during slogAnimating (PG returning to roster)
}

export interface UseExtractionStateMachineOptions {
  /** Duration of bezel CSS transition in ms */
  bezelDuration?: number;
  /** Duration of spring animation in ms */
  springDuration?: number;
  /** Cleanup delay in ms */
  cleanupDelay?: number;
}

export interface UseExtractionStateMachineReturn {
  state: ExtractionState;
  startExtraction: () => void;
  cancelExtraction: () => void;
  startSlog: () => void;
  /** For testing only: force phase transition */
  _forcePhase: (phase: ExtractionPhase) => void;
}

const DEFAULT_OPTIONS = {
  bezelDuration: 560,    // Matches CSS transition in SlotV12Renderer
  springDuration: 600,  // Matches PgCard bounce-spring duration
  cleanupDelay: 200,    // Matches EXTRACTION_TIMING.cleanupDelay
} as const;

export function useExtractionStateMachine(options: UseExtractionStateMachineOptions = {}): UseExtractionStateMachineReturn {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // State machine state
  const [state, setState] = useState<ExtractionState>({
    phase: 'idle',
    extractionProgress: 0,
    isBezelAnimationDone: false,
    isMedalFadingOut: false,
    isSloggingOut: false,
  });

  // Refs for cleanup
  const timersRef = useRef<number[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const extractionStartTimeRef = useRef<number>(0);

  // Clear all timers and animation frames
  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach(timerId => window.clearTimeout(timerId));
    timersRef.current = [];
    
    if (animationFrameRef.current) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  // Schedule a timer that tracks it for cleanup
  const scheduleTimer = useCallback((callback: () => void, delay: number) => {
    const timerId = window.setTimeout(() => {
      callback();
      // Remove from tracking
      timersRef.current = timersRef.current.filter(id => id !== timerId);
    }, delay);
    timersRef.current.push(timerId);
    return timerId;
  }, []);

  // Animation loop for extraction progress (0 -> 1)
  const animateExtractionProgress = useCallback(() => {
    const EXTRACTION_DURATION = 560; // Same as bezel duration
    const animate = () => {
      const elapsed = Date.now() - extractionStartTimeRef.current;
      const progress = Math.min(elapsed / EXTRACTION_DURATION, 1);
      
      setState(prev => ({
        ...prev,
        extractionProgress: progress,
      }));
      
      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
  }, []);

  // Start extraction sequence
  const startExtraction = useCallback(() => {
    // Cancel any ongoing extraction
    clearAllTimers();
    
    // Reset to extracting phase
    setState({
      phase: 'extracting',
      extractionProgress: 0,
      isBezelAnimationDone: false,
      isMedalFadingOut: false,
      isSloggingOut: false,
    });
    
    // Start extraction progress animation
    extractionStartTimeRef.current = Date.now();
    animateExtractionProgress();
    
    // After extraction completes (progress = 1), start bezel animation
    scheduleTimer(() => {
      setState(prev => ({
        ...prev,
        phase: 'bezelAnimating',
        isMedalFadingOut: true,
      }));
      
      // After bezel animation completes, enter 'completing' (the pop)
      scheduleTimer(() => {
        setState(prev => ({
          ...prev,
          phase: 'completing',
          isBezelAnimationDone: true,
          extractionProgress: 1.12, // Pop overshoot (scale 1→1.12→1)
        }));
        
        // After the pop, start spring back (medal flies to roster)
        scheduleTimer(() => {
          setState(prev => ({
            ...prev,
            phase: 'springBack',
            extractionProgress: 1.0, // Back to 1 after pop
          }));
          
          // After spring flight completes, start clearing
          scheduleTimer(() => {
            setState(prev => ({
              ...prev,
              phase: 'clearing',
              extractionProgress: 0,
            }));
            
            // After cleanup, return to idle
            scheduleTimer(() => {
              setState({
                phase: 'idle',
                extractionProgress: 0,
                isBezelAnimationDone: false,
                isMedalFadingOut: false,
                isSloggingOut: false,
              });
            }, opts.cleanupDelay);
          }, opts.springDuration);
        }, 280); // 280ms for the pop animation
      }, opts.bezelDuration);
    }, opts.bezelDuration);
  }, [clearAllTimers, scheduleTimer, animateExtractionProgress, opts]);

  // Cancel extraction with elastic spring-back instead of hard reset.
  // The bezel smoothly returns to 0 via the springBack → clearing → idle sequence.
  const cancelExtraction = useCallback(() => {
    clearAllTimers();

    setState(prev => {
      // If already idle or slog, nothing to spring back from
      if (prev.phase === 'idle' || prev.phase === 'slogAnimating') {
        return prev;
      }

      return {
        ...prev,
        phase: 'springBack',
        // extractionProgress stays at its current value;
        // the CSS transition on the bezel will animate it back to 0.
      };
    });

    // Animate extractionProgress back to 0 over the spring duration
    const SPRING_MS = opts.springDuration;
    const start = performance.now();
    let progressAtStart: number | null = null;

    const tick = () => {
      setState(prev => {
        if (prev.phase !== 'springBack') return prev;
        if (progressAtStart === null) progressAtStart = prev.extractionProgress;
        const elapsed = performance.now() - start;
        const t = Math.min(elapsed / SPRING_MS, 1);
        // Ease-out-back curve for elastic feel
        const eased = 1 - Math.pow(1 - t, 3);
        const progress = (progressAtStart ?? 0) * (1 - eased);
        return { ...prev, extractionProgress: progress };
      });

      if (performance.now() - start < SPRING_MS) {
        animationFrameRef.current = requestAnimationFrame(tick);
      } else {
        // Spring complete → clearing
        setState(prev => ({
          ...prev,
          phase: 'clearing',
          extractionProgress: 0,
        }));
        scheduleTimer(() => {
          setState({
            phase: 'idle',
            extractionProgress: 0,
            isBezelAnimationDone: false,
            isMedalFadingOut: false,
            isSloggingOut: false,
          });
        }, opts.cleanupDelay);
      }
    };

    animationFrameRef.current = requestAnimationFrame(tick);
  }, [clearAllTimers, scheduleTimer, opts.springDuration, opts.cleanupDelay]);

  // Force phase transition (for testing only)
  const _forcePhase = useCallback((phase: ExtractionPhase) => {
    clearAllTimers();
    
    const newState: ExtractionState = {
      phase,
      extractionProgress: 0,
      isBezelAnimationDone: false,
      isMedalFadingOut: false,
      isSloggingOut: false,
    };
    
    // Set appropriate values based on phase
    switch (phase) {
      case 'idle':
        newState.extractionProgress = 0;
        break;
      case 'extracting':
        newState.extractionProgress = 0;
        break;
      case 'bezelAnimating':
        newState.extractionProgress = 1.0;
        newState.isMedalFadingOut = true;
        break;
      case 'completing':
        newState.extractionProgress = 1.12;
        newState.isBezelAnimationDone = true;
        break;
      case 'springBack':
        newState.extractionProgress = 1.0;
        break;
      case 'clearing':
        newState.extractionProgress = 0;
        break;
    }
    
    setState(newState);
  }, [clearAllTimers]);

  // Start slog animation (PG returns to roster)
  // Uses CSS transition in the UI layer — state machine just sets the target values
  const startSlog = useCallback(() => {
    // Cancel any ongoing animation
    clearAllTimers();
    
    // Start slog: set extractionProgress to 1.2 (spring overshoot)
    // The UI wrapper uses CSS transition to animate this smoothly
    setState({
      phase: 'slogAnimating',
      extractionProgress: 1.2, // Spring overshoot — UI animates via CSS transition
      isBezelAnimationDone: true,
      isMedalFadingOut: false,
      isSloggingOut: true,
    });
    
    // After spring out, return to idle
    scheduleTimer(() => {
      setState({
        phase: 'idle',
        extractionProgress: 0,
        isBezelAnimationDone: false,
        isMedalFadingOut: false,
        isSloggingOut: false,
      });
    }, opts.springDuration);
  }, [clearAllTimers, scheduleTimer, opts.springDuration]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  return {
    state,
    startExtraction,
    cancelExtraction,
    startSlog,
    _forcePhase,
  };
}
