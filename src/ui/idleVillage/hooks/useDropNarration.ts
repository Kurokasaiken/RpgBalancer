/**
 * Drop Narration Hook
 * 
 * React hook for VoiceOver narrations of drag/drop outcomes
 * with config-first design and moodboard token support.
 * 
 * @since NP-086 – Idle Village Drop VoiceOver Narration
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { loadData, saveData } from '@/shared/persistence/PersistenceService';
import {
  DEFAULT_DROP_FEEDBACK_CONFIG,
  getFeedbackMessage as getDropFeedbackMessage,
  getFeedbackType,
  type DropFeedbackConfig,
  type DropFeedbackType,
} from '@/ui/idleVillage/config/dropFeedbackConfig';
import type { DropOutcomeType, NarrationContext } from '../accessibility/dropNarrationConfig';
import {
  DEFAULT_DROP_NARRATION_CONFIG,
  getNarrationTemplates,
  substituteMoodboardTokens,
  type DropNarrationConfig,
  type LocaleNarrationConfig,
  type NarrationTemplate,
} from '../accessibility/dropNarrationConfig';

const DROP_NARRATION_PREFERENCES_KEY = 'idleVillage_drop_narration_prefs';

interface DropNarrationPreferences {
  enabled: boolean;
  locale: string;
  voice: Required<LocaleNarrationConfig>['defaultVoice'];
}

/**
 * Drop feedback event data
 */
export interface DropFeedbackEvent {
  /** Drop outcome type */
  outcome: DropOutcomeType;
  /** Narration context */
  context: NarrationContext;
  /** Resident information */
  resident?: {
    id: string;
    name: string;
    fatigue?: number;
    stats?: Record<string, number>;
  };
  /** Activity information */
  activity?: {
    id: string;
    name: string;
    type: string;
    capacity?: number;
    currentOccupancy?: number;
  };
  /** Location information */
  location?: {
    id: string;
    name: string;
    type: string;
    description?: string;
  };
  /** Equipment information (for transfers) */
  equipment?: {
    id: string;
    name: string;
    type: string;
  };
  /** Recipient information (for transfers) */
  recipient?: {
    id: string;
    name: string;
  };
  /** Failure reason */
  reason?: string;
  /** Suggestion for improvement */
  suggestion?: string;
  /** Validation rule linked to drop feedback */
  validationRule?: string;
  /** Optional message override coming from drop feedback */
  customMessage?: string;
  /** Drop feedback type, if precomputed */
  feedbackType?: DropFeedbackType;
  /** Previous activity (for swaps) */
  previousActivity?: {
    id: string;
    name: string;
  };
  /** Event timestamp */
  timestamp: number;
}

/**
 * Narration request data
 */
export interface NarrationRequest {
  /** Generated text to narrate */
  text: string;
  /** Template used */
  template: NarrationTemplate;
  /** Locale used */
  locale: string;
  /** Voice configuration */
  voice: Required<LocaleNarrationConfig>['defaultVoice'];
  /** Priority for announcement */
  priority: 'polite' | 'assertive';
  /** Estimated duration */
  durationMs: number;
  /** Original event data */
  event: DropFeedbackEvent;
}

/**
 * Narration state
 */
export interface NarrationState {
  /** Current narration being spoken */
  current: NarrationRequest | null;
  /** Queue of pending narrations */
  queue: NarrationRequest[];
  /** Is narration system active */
  isActive: boolean;
  /** Last narration timestamp */
  lastNarratedAt: number | null;
  /** Total narrations spoken */
  totalNarrated: number;
  /** Narration history */
  history: NarrationRequest[];
}

/**
 * Hook options
 */
export interface UseDropNarrationOptions {
  /** Custom configuration override */
  config?: Partial<DropNarrationConfig>;
  /** Enable/disable narration */
  enabled?: boolean;
  /** Custom locale override */
  locale?: string;
  /** Custom voice settings */
  voice?: Partial<Required<LocaleNarrationConfig>['defaultVoice']>;
  /** Drop feedback config for message alignment */
  dropFeedbackConfig?: DropFeedbackConfig;
  /** Callback when narration starts */
  onNarrationStart?: (request: NarrationRequest) => void;
  /** Callback when narration ends */
  onNarrationEnd?: (request: NarrationRequest) => void;
  /** Callback when narration fails */
  onNarrationError?: (error: Error, request: NarrationRequest) => void;
}

/**
 * Hook return value
 */
export interface UseDropNarrationReturn {
  /** Current narration state */
  state: NarrationState;
  /** Configuration */
  config: DropNarrationConfig;
  /** Process a drop feedback event */
  processDropFeedback: (event: DropFeedbackEvent) => void;
  /** Speak a custom narration */
  speak: (text: string, options?: {
    priority?: 'polite' | 'assertive';
    voice?: Partial<Required<LocaleNarrationConfig>['defaultVoice']>;
  }) => void;
  /** Stop current narration */
  stop: () => void;
  /** Clear queue */
  clearQueue: () => void;
  /** Set locale */
  setLocale: (locale: string) => void;
  /** Set voice configuration */
  setVoice: (voice: Partial<Required<LocaleNarrationConfig>['defaultVoice']>) => void;
  /** Enable/disable narration */
  setEnabled: (enabled: boolean) => void;
}

/**
 * Generate narration text from event and template
 */
function generateNarrationText(
  event: DropFeedbackEvent,
  template: NarrationTemplate,
  locale: string,
  feedbackMessage?: string
): string {
  // Build token map from event data
  const tokens: Record<string, string> = {};

  // Resident tokens
  if (event.resident) {
    tokens.residentName = event.resident.name;
    tokens.residentId = event.resident.id;
    if (event.resident.fatigue !== undefined) {
      tokens.residentFatigue = event.resident.fatigue.toString();
    }
  }

  // Activity tokens
  if (event.activity) {
    tokens.activityName = event.activity.name;
    tokens.activityId = event.activity.id;
    tokens.activityType = event.activity.type;
    if (event.activity.capacity !== undefined) {
      tokens.activityCapacity = event.activity.capacity.toString();
    }
    if (event.activity.currentOccupancy !== undefined) {
      tokens.activityOccupancy = event.activity.currentOccupancy.toString();
    }
  }

  // Location tokens
  if (event.location) {
    tokens.locationName = event.location.name;
    tokens.locationId = event.location.id;
    tokens.locationType = event.location.type;
    tokens.locationDescription = event.location.description || '';
  }

  // Equipment tokens
  if (event.equipment) {
    tokens.itemName = event.equipment.name;
    tokens.itemId = event.equipment.id;
    tokens.itemType = event.equipment.type;
  }

  // Recipient tokens
  if (event.recipient) {
    tokens.recipientName = event.recipient.name;
    tokens.recipientId = event.recipient.id;
  }

  // Reason and suggestion tokens
  if (event.reason) {
    tokens.reason = event.reason;
  }
  if (event.suggestion) {
    tokens.suggestion = event.suggestion;
  }

  if (feedbackMessage) {
    tokens.feedbackMessage = feedbackMessage;
    if (!tokens.reason) {
      tokens.reason = feedbackMessage;
    }
  }

  // Previous activity tokens
  if (event.previousActivity) {
    tokens.oldActivity = event.previousActivity.name;
    tokens.oldActivityId = event.previousActivity.id;
  }

  // Substitute tokens in template
  return substituteMoodboardTokens(template.template, tokens, locale);
}

/**
 * Main drop narration hook
 */
export function useDropNarration(options: UseDropNarrationOptions = {}): UseDropNarrationReturn {
  const {
    config: userConfig,
    enabled: userEnabled = true,
    locale: userLocale,
    voice: userVoice,
    dropFeedbackConfig,
    onNarrationStart,
    onNarrationEnd,
    onNarrationError,
  } = options;

  const config = useMemo(() => ({
    ...DEFAULT_DROP_NARRATION_CONFIG,
    ...userConfig,
  }), [userConfig]);

  const mergedVoice = useMemo(() => ({
    ...config.globalVoice,
    ...userVoice,
  }), [config.globalVoice, userVoice]);

  const feedbackConfig = useMemo(
    () => ({
      ...DEFAULT_DROP_FEEDBACK_CONFIG,
      ...dropFeedbackConfig,
    }),
    [dropFeedbackConfig]
  );

  const [enabled, setEnabledState] = useState(userEnabled && config.enabled);
  const [currentLocale, setCurrentLocaleState] = useState(userLocale || config.currentLocale);
  const [currentVoice, setCurrentVoiceState] = useState(mergedVoice);

  // Narration state
  const [state, setState] = useState<NarrationState>({
    current: null,
    queue: [],
    isActive: false,
    lastNarratedAt: null,
    totalNarrated: 0,
    history: [],
  });

  // Refs for cleanup and timing
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const queueTimeoutRef = useRef<number | null>(null);
  const lastNarrationTimeRef = useRef<number>(0);

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      speechSynthesisRef.current = window.speechSynthesis;
    }
  }, []);

  // Load persisted preferences
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const prefs = await loadData<DropNarrationPreferences>(DROP_NARRATION_PREFERENCES_KEY, {
          enabled: config.enabled,
          locale: config.currentLocale,
          voice: mergedVoice,
        });
        if (!mounted) return;
        setEnabledState(prefs.enabled);
        setCurrentLocaleState(prefs.locale);
        setCurrentVoiceState(prefs.voice);
      } catch (error) {
        console.warn('[useDropNarration] Failed to load preferences, using defaults', error);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [config.enabled, config.currentLocale, mergedVoice]);

  const persistPreferences = useCallback(async (prefs: DropNarrationPreferences) => {
    try {
      await saveData(DROP_NARRATION_PREFERENCES_KEY, prefs);
    } catch (error) {
      console.warn('[useDropNarration] Failed to persist preferences', error);
    }
  }, []);

  const persistLatestPreferences = useCallback((next: Partial<DropNarrationPreferences> = {}) => {
    const payload: DropNarrationPreferences = {
      enabled,
      locale: currentLocale,
      voice: currentVoice,
      ...next,
    };
    void persistPreferences(payload);
  }, [enabled, currentLocale, currentVoice, persistPreferences]);

  // Emit telemetry for voiceover
  const emitDropVoiceoverTelemetry = useCallback((request: NarrationRequest) => {
    // This would integrate with the existing telemetry system
    if (typeof window !== 'undefined' && (window as any).__IDLE_VILLAGE_TELEMETRY) {
      (window as any).__IDLE_VILLAGE_TELEMETRY.emit('iv_drop_voiceover_played', {
        text: request.text,
        outcome: request.event.outcome,
        context: request.event.context,
        locale: request.locale,
        durationMs: request.durationMs,
        priority: request.priority,
        timestamp: Date.now(),
        residentId: request.event.resident?.id,
        activityId: request.event.activity?.id,
        locationId: request.event.location?.id,
      });
    }
  }, []);

  // Refs to avoid circular dependencies
  const processQueueRef = useRef<(() => void) | null>(null);

  // Speak a narration request
  const speakRequest = useCallback((request: NarrationRequest) => {
    if (!speechSynthesisRef.current || !enabled) {
      return;
    }

    // Create speech synthesis utterance
    const utterance = new SpeechSynthesisUtterance(request.text);
    
    // Configure voice
    utterance.lang = currentLocale;
    utterance.rate = request.voice.rate === 'slow' ? 0.8 : 
                    request.voice.rate === 'fast' ? 1.2 : 1.0;
    utterance.pitch = request.voice.pitch === 'low' ? 0.8 : 
                     request.voice.pitch === 'high' ? 1.2 : 1.0;
    utterance.volume = request.voice.volume;

    // Event handlers
    utterance.onstart = () => {
      lastNarrationTimeRef.current = Date.now();
      onNarrationStart?.(request);
      
      // Emit telemetry
      emitDropVoiceoverTelemetry(request);
    };

    utterance.onend = () => {
      setState(prev => ({
        ...prev,
        current: null,
        isActive: false,
        lastNarratedAt: Date.now(),
        totalNarrated: prev.totalNarrated + 1,
        history: [...prev.history.slice(-9), request], // Keep last 10
      }));
      
      onNarrationEnd?.(request);
      
      // Process next in queue using ref
      processQueueRef.current?.();
    };

    utterance.onerror = (event) => {
      const error = new Error(`Speech synthesis error: ${event.error}`);
      onNarrationError?.(error, request);
      
      setState(prev => ({
        ...prev,
        current: null,
        isActive: false,
      }));
      
      // Continue with queue despite error using ref
      processQueueRef.current?.();
    };

    // Store reference and speak
    currentUtteranceRef.current = utterance;
    speechSynthesisRef.current.speak(utterance);
  }, [enabled, currentLocale, onNarrationStart, onNarrationEnd, onNarrationError, emitDropVoiceoverTelemetry]);

  // Process queue
  const processQueue = useCallback(() => {
    const currentState = state; // Capture current state to avoid dependency issues
    if (!enabled || currentState.queue.length === 0 || currentState.current) {
      return;
    }

    const next = currentState.queue[0];
    const remainingQueue = currentState.queue.slice(1);

    // Check minimum interval
    const now = Date.now();
    const timeSinceLastNarration = now - lastNarrationTimeRef.current;
    const minInterval = config.timing.minIntervalMs;

    if (timeSinceLastNarration < minInterval) {
      // Schedule for later
      const delay = minInterval - timeSinceLastNarration;
      queueTimeoutRef.current = window.setTimeout(() => {
        processQueueRef.current?.();
      }, delay);
      return;
    }

    // Start narration
    speakRequest(next);
    setState(prev => ({
      ...prev,
      current: next,
      queue: remainingQueue,
      isActive: true,
    }));
  }, [enabled, config.timing.minIntervalMs, speakRequest]);

  // Update ref whenever processQueue changes
  useEffect(() => {
    processQueueRef.current = processQueue;
  }, [processQueue]);

  // Process drop feedback event
  const processDropFeedback = useCallback((event: DropFeedbackEvent) => {
    if (!enabled) {
      return;
    }

    const feedbackMessage = getDropFeedbackMessage(
      feedbackConfig,
      event.validationRule,
      event.customMessage
    );

    const enrichedEvent: DropFeedbackEvent = {
      ...event,
      reason: event.reason || feedbackMessage,
      feedbackType: event.feedbackType || (event.validationRule ? getFeedbackType(event.validationRule) : event.feedbackType),
    };

    // Get templates for this outcome and context
    const templates = getNarrationTemplates(enrichedEvent.outcome, enrichedEvent.context, currentLocale);
    
    if (templates.length === 0) {
      console.warn(`No narration templates found for outcome: ${event.outcome}, context: ${event.context}`);
      return;
    }

    // Select template (could add logic for contextual variation)
    const template = templates[0]; // For now, use first template
    
    // Generate narration text
    const text = generateNarrationText(enrichedEvent, template, currentLocale, feedbackMessage);

    // Create narration request
    const request: NarrationRequest = {
      text,
      template,
      locale: currentLocale,
      voice: currentVoice,
      priority: template.priority,
      durationMs: template.durationMs,
      event: enrichedEvent,
    };

    // Add to queue
    setState(prev => ({
      ...prev,
      queue: [...prev.queue, request],
    }));
  }, [enabled, currentLocale, currentVoice, feedbackConfig]);

  // Speak custom text
  const speak = useCallback((
    text: string, 
    options: {
      priority?: 'polite' | 'assertive';
      voice?: Partial<Required<LocaleNarrationConfig>['defaultVoice']>;
    } = {}
  ) => {
    if (!enabled) {
      return;
    }

    const request: NarrationRequest = {
      text,
      template: {
        template: text,
        tokens: [],
        priority: options.priority || 'polite',
        durationMs: 2000,
      },
      locale: currentLocale,
      voice: { ...currentVoice, ...options.voice },
      priority: options.priority || 'polite',
      durationMs: 2000,
      event: {
        outcome: 'valid',
        context: 'resident_to_activity',
        timestamp: Date.now(),
      },
    };

    setState(prev => ({
      ...prev,
      queue: [...prev.queue, request],
    }));
  }, [enabled, currentLocale, currentVoice, feedbackConfig]);

  // Stop current narration
  const stop = useCallback(() => {
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel();
    }
    
    if (queueTimeoutRef.current) {
      window.clearTimeout(queueTimeoutRef.current);
      queueTimeoutRef.current = null;
    }

    setState(prev => ({
      ...prev,
      current: null,
      isActive: false,
      queue: [],
    }));
  }, []);

  // Clear queue
  const clearQueue = useCallback(() => {
    setState(prev => ({
      ...prev,
      queue: [],
    }));
  }, []);

  // Set locale
  const setLocale = useCallback((locale: string) => {
    setCurrentLocaleState(locale);
    persistLatestPreferences({ locale });
  }, [persistLatestPreferences]);

  // Set voice
  const setVoice = useCallback((voice: Partial<Required<LocaleNarrationConfig>['defaultVoice']>) => {
    setCurrentVoiceState(prev => {
      const updated = { ...prev, ...voice };
      persistLatestPreferences({ voice: updated });
      return updated;
    });
  }, [persistLatestPreferences]);

  const setEnabled = useCallback((nextEnabled: boolean) => {
    setEnabledState(nextEnabled);
    persistLatestPreferences({ enabled: nextEnabled });
  }, [persistLatestPreferences]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  // Process queue when it changes
  useEffect(() => {
    // Use setTimeout to avoid calling setState synchronously
    const timeoutId = setTimeout(() => {
      processQueueRef.current?.();
    }, 0);
    
    return () => clearTimeout(timeoutId);
  }, [processQueue]);

  return {
    state,
    config,
    processDropFeedback,
    speak,
    stop,
    clearQueue,
    setLocale,
    setVoice,
    setEnabled,
  };
}

/**
 * Convenience hook for drop narration with default configuration
 */
export function useDropNarrationDefault() {
  return useDropNarration();
}

/**
 * Hook for testing drop narration without actual speech synthesis
 */
export function useDropNarrationMock(options: UseDropNarrationOptions = {}) {
  const realHook = useDropNarration(options);
  
  // Override speak to just log instead of using speech synthesis
  const mockSpeak = useCallback((text: string, opts?: any) => {
    console.log('[MOCK NARRATION]', text, opts);
  }, []);

  return {
    ...realHook,
    speak: mockSpeak,
  };
}
