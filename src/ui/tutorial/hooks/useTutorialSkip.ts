/**
 * Tutorial Skip Hook - NP-219
 *
 * Config-first tutorial skip management with PersistenceService storage.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { clearData, loadData, saveData } from '@/shared/persistence/PersistenceService';
import {
  DEFAULT_TUTORIAL_SKIP_CONFIG,
  type TutorialSkipConfig,
  type SkipDecision,
  type SkipReason,
  type ExperienceLevel,
  type SkipTracking,
  type SkipAnalytics,
  STORAGE_KEYS,
  generateTrackingId,
  shouldShowSkipPrompt as evaluateSkipPrompt,
  getExperienceLevel,
  formatSessionCount,
  formatTime,
  generateSkipSummary,
  validateConfig,
} from '../config/tutorialSkipConfig';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

interface UserData {
  sessionCount: number;
  completionCount: number;
  timeInSession: number;
  lastSkipTime?: number;
  skipCount: number;
  firstVisit: number;
  lastVisit: number;
  totalPlayTime: number;
}

function mergeConfig(overrides: Partial<TutorialSkipConfig>): TutorialSkipConfig {
  if (!overrides || Object.keys(overrides).length === 0) {
    return DEFAULT_TUTORIAL_SKIP_CONFIG;
  }

  return {
    ...DEFAULT_TUTORIAL_SKIP_CONFIG,
    ...overrides,
    detection: {
      ...DEFAULT_TUTORIAL_SKIP_CONFIG.detection,
      ...(overrides.detection ?? {}),
    },
    prompt: {
      ...DEFAULT_TUTORIAL_SKIP_CONFIG.prompt,
      ...(overrides.prompt ?? {}),
    },
    analytics: {
      ...DEFAULT_TUTORIAL_SKIP_CONFIG.analytics,
      ...(overrides.analytics ?? {}),
    },
    ui: {
      ...DEFAULT_TUTORIAL_SKIP_CONFIG.ui,
      ...(overrides.ui ?? {}),
    },
    replay: {
      ...DEFAULT_TUTORIAL_SKIP_CONFIG.replay,
      ...(overrides.replay ?? {}),
    },
    telemetry: {
      ...DEFAULT_TUTORIAL_SKIP_CONFIG.telemetry,
      ...(overrides.telemetry ?? {}),
    },
  };
}

interface UseTutorialSkipReturn {
  shouldShowPrompt: boolean;
  experienceLevel: ExperienceLevel;
  userData: UserData;
  showSkipPrompt: () => void;
  hideSkipPrompt: () => void;
  handleSkipDecision: (decision: SkipDecision, reason?: SkipReason) => void;
  skipDecision: SkipDecision | null;
  analytics: SkipAnalytics | null;
  resetUserData: () => void;
  exportAnalytics: () => string;
  isReturningUser: boolean;
  isExperiencedUser: boolean;
  hasCompletedTutorial: boolean;
}

function createDefaultUserData(): UserData {
  const now = Date.now();
  return {
    sessionCount: 0,
    completionCount: 0,
    timeInSession: 0,
    skipCount: 0,
    firstVisit: now,
    lastVisit: now,
    totalPlayTime: 0,
  };
}

async function hydrateUserData(config: TutorialSkipConfig): Promise<UserData> {
  if (!config.detection.enableLocalStorage) {
    return createDefaultUserData();
  }

  try {
    return await loadData<UserData>(STORAGE_KEYS.USER_DATA, createDefaultUserData());
  } catch (error) {
    console.warn('[useTutorialSkip] Failed to load user data', error);
    return createDefaultUserData();
  }
}

async function persistUserData(data: UserData, config: TutorialSkipConfig): Promise<void> {
  if (!config.detection.enableLocalStorage) {
    return;
  }

  try {
    await saveData(STORAGE_KEYS.USER_DATA, data);
  } catch (error) {
    console.warn('[useTutorialSkip] Failed to save user data', error);
  }
}

async function hydrateAnalytics(config: TutorialSkipConfig): Promise<SkipAnalytics | null> {
  if (!config.analytics.enableTracking) {
    return null;
  }

  try {
    return await loadData<SkipAnalytics | null>(STORAGE_KEYS.ANALYTICS, null);
  } catch (error) {
    console.warn('[useTutorialSkip] Failed to load analytics data', error);
    return null;
  }
}

async function persistAnalytics(analytics: SkipAnalytics, config: TutorialSkipConfig): Promise<void> {
  if (!config.analytics.enableTracking) {
    return;
  }

  try {
    await saveData(STORAGE_KEYS.ANALYTICS, analytics);
  } catch (error) {
    console.warn('[useTutorialSkip] Failed to save analytics data', error);
  }
}

function applyTrackingRetention(tracking: SkipTracking[], config: TutorialSkipConfig): SkipTracking[] {
  if (!tracking.length) {
    return tracking;
  }

  const cutoff = Date.now() - config.analytics.retentionDays * DAY_IN_MS;
  const filtered = tracking.filter((item) => item.timestamp > cutoff);

  if (filtered.length > config.detection.maxSessionsForTracking) {
    return filtered.slice(-config.detection.maxSessionsForTracking);
  }

  return filtered;
}

async function hydrateTracking(config: TutorialSkipConfig): Promise<SkipTracking[]> {
  if (!config.analytics.enableTracking) {
    return [];
  }

  try {
    const stored = await loadData<SkipTracking[]>(STORAGE_KEYS.SESSION_DATA, []);
    return applyTrackingRetention(Array.isArray(stored) ? stored : [], config);
  } catch (error) {
    console.warn('[useTutorialSkip] Failed to load tracking data', error);
    return [];
  }
}

async function persistTracking(tracking: SkipTracking[], config: TutorialSkipConfig): Promise<void> {
  if (!config.analytics.enableTracking) {
    return;
  }

  try {
    const retained = applyTrackingRetention(tracking, config);
    await saveData(STORAGE_KEYS.SESSION_DATA, retained);
  } catch (error) {
    console.warn('[useTutorialSkip] Failed to save tracking data', error);
  }
}

async function clearTutorialSkipStorage(): Promise<void> {
  await Promise.all([
    clearData(STORAGE_KEYS.USER_DATA),
    clearData(STORAGE_KEYS.ANALYTICS),
    clearData(STORAGE_KEYS.SESSION_DATA),
  ]);
}

function emitTelemetryEvent(
  eventName: string,
  data: Record<string, unknown>,
  config: TutorialSkipConfig
): void {
  if (!config.telemetry.enableEvents) {
    return;
  }

  try {
    console.log('Telemetry Event:', eventName, data);

    if (config.telemetry.includeMetadata) {
      console.log('Metadata:', {
        timestamp: Date.now(),
        config: {
          detection: config.detection,
          prompt: config.prompt,
          analytics: config.analytics,
        },
      });
    }
  } catch (error) {
    console.warn('Failed to emit telemetry event:', error);
  }
}

export function useTutorialSkip(
  tutorialId: string,
  overrides: Partial<TutorialSkipConfig> = {}
): UseTutorialSkipReturn {
  const fullConfig = useMemo(() => mergeConfig(overrides), [overrides]);

  const validation = useMemo(() => validateConfig(fullConfig), [fullConfig]);
  if (!validation.isValid) {
    console.error('Invalid tutorial skip configuration:', validation.errors);
  }

  const [userData, setUserData] = useState<UserData>(createDefaultUserData);
  const [analytics, setAnalytics] = useState<SkipAnalytics | null>(null);
  const [shouldShowPrompt, setShouldShowPrompt] = useState(false);
  const [skipDecision, setSkipDecision] = useState<SkipDecision | null>(null);
  const [, setIsPromptVisible] = useState(false);

  const experienceLevel = useMemo(
    () => getExperienceLevel(userData.sessionCount, fullConfig),
    [userData.sessionCount, fullConfig]
  );

  const isReturningUser = userData.sessionCount > 1;
  const isExperiencedUser = userData.sessionCount >= fullConfig.detection.experiencedUserThreshold;
  const hasCompletedTutorial = userData.completionCount > 0;

  useEffect(() => {
    let mounted = true;

    const hydrate = async () => {
      const [loadedUserData, loadedAnalytics] = await Promise.all([
        hydrateUserData(fullConfig),
        hydrateAnalytics(fullConfig),
      ]);

      if (!mounted) {
        return;
      }

      setUserData(loadedUserData);
      setAnalytics(loadedAnalytics);
    };

    void hydrate();

    return () => {
      mounted = false;
    };
  }, [fullConfig]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setUserData((prev) => ({
        ...prev,
        timeInSession: Date.now() - prev.lastVisit,
        totalPlayTime: prev.totalPlayTime + 1000,
      }));
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    setShouldShowPrompt(evaluateSkipPrompt(userData, fullConfig));
  }, [userData, fullConfig]);

  useEffect(() => {
    if (shouldShowPrompt) {
      setIsPromptVisible(true);
    }
  }, [shouldShowPrompt]);

  const persistUpdatedUserData = useCallback(
    (updater: (prev: UserData) => UserData) => {
      setUserData((prev) => {
        const updated = updater(prev);
        void persistUserData(updated, fullConfig);
        return updated;
      });
    },
    [fullConfig]
  );

  const handleSessionStart = useCallback(() => {
    persistUpdatedUserData((prev) => ({
      ...prev,
      sessionCount: prev.sessionCount + 1,
      lastVisit: Date.now(),
      timeInSession: 0,
    }));
  }, [persistUpdatedUserData]);

  const handleSessionEnd = useCallback(() => {
    persistUpdatedUserData((prev) => ({
      ...prev,
      totalPlayTime: prev.totalPlayTime + prev.timeInSession,
    }));
  }, [persistUpdatedUserData]);

  const handleTutorialCompletion = useCallback(() => {
    persistUpdatedUserData((prev) => ({
      ...prev,
      completionCount: prev.completionCount + 1,
    }));
  }, [persistUpdatedUserData]);

  const showSkipPrompt = useCallback(() => {
    setShouldShowPrompt(true);
    setIsPromptVisible(true);
  }, []);

  const hideSkipPrompt = useCallback(() => {
    setIsPromptVisible(false);
    setShouldShowPrompt(false);
  }, []);

  const handleSkipDecision = useCallback(
    (decision: SkipDecision, reason?: SkipReason) => {
      setSkipDecision(decision);

      persistUpdatedUserData((prev) => ({
        ...prev,
        lastSkipTime: Date.now(),
        skipCount: prev.skipCount + 1,
      }));

      const userSnapshot = {
        sessionCount: userData.sessionCount,
        completionCount: userData.completionCount,
        timeInSession: userData.timeInSession,
      };

      const tracking: SkipTracking = {
        id: generateTrackingId(),
        userId: `user_${userSnapshot.sessionCount}`,
        sessionId: `session_${Date.now()}`,
        tutorialId,
        skipDecision: decision,
        skipReason: reason,
        experienceLevel,
        sessionCount: userSnapshot.sessionCount,
        completionCount: userSnapshot.completionCount,
        timeInSession: userSnapshot.timeInSession,
        timestamp: Date.now(),
        metadata: {
          configVersion: '1.0.0',
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        },
      };

      hideSkipPrompt();

      void (async () => {
        const existingTracking = await hydrateTracking(fullConfig);
        const updatedTracking = [...existingTracking, tracking];
        await persistTracking(updatedTracking, fullConfig);

        if (fullConfig.analytics.enableTracking) {
          const updatedAnalytics = generateSkipSummary(updatedTracking);
          setAnalytics(updatedAnalytics);
          await persistAnalytics(updatedAnalytics, fullConfig);
        }
      })();

      emitTelemetryEvent(
        fullConfig.telemetry.eventName,
        {
          tutorialId,
          decision,
          reason,
          experienceLevel,
          sessionCount: userSnapshot.sessionCount,
          completionCount: userSnapshot.completionCount,
          timeInSession: userSnapshot.timeInSession,
          trackingId: tracking.id,
        },
        fullConfig
      );

      if (decision === 'defer') {
        window.setTimeout(() => {
          setShouldShowPrompt(true);
        }, fullConfig.prompt.cooldownPeriod);
      }
    },
    [experienceLevel, fullConfig, hideSkipPrompt, tutorialId, userData.sessionCount, userData.completionCount, userData.timeInSession, persistUpdatedUserData]
  );

  const resetUserData = useCallback(() => {
    const reset = createDefaultUserData();
    setUserData(reset);
    setAnalytics(null);
    setSkipDecision(null);
    setShouldShowPrompt(false);
    setIsPromptVisible(false);

    void (async () => {
      await persistUserData(reset, fullConfig);
      await clearTutorialSkipStorage();
    })();
  }, [fullConfig]);

  const exportAnalytics = useCallback(() => {
    if (!analytics) {
      return 'No analytics data available';
    }

    switch (fullConfig.analytics.exportFormat) {
      case 'json':
        return JSON.stringify(analytics, null, 2);
      case 'csv': {
        const headers = ['Metric', 'Value'];
        const rows = [
          `totalSkipRequests,${analytics.totalSkipRequests}`,
          ...Object.entries(analytics.skipDecisions).map(([key, value]) => `skipDecision_${key},${value}`),
          ...Object.entries(analytics.skipReasons).map(([key, value]) => `skipReason_${key},${value}`),
          `overallSkipRate,${analytics.skipRates.overall}`,
          `averageTimeToDecision,${analytics.averageTimeToDecision}`,
        ];
        return [headers.join(','), ...rows].join('\n');
      }
      default:
        return JSON.stringify(analytics, null, 2);
    }
  }, [analytics, fullConfig.analytics.exportFormat]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.tutorialSkipSessionManagement = {
      handleSessionStart,
      handleSessionEnd,
      handleTutorialCompletion,
    };

    return () => {
      if (window.tutorialSkipSessionManagement) {
        delete window.tutorialSkipSessionManagement;
      }
    };
  }, [handleSessionStart, handleSessionEnd, handleTutorialCompletion]);

  return {
    shouldShowPrompt,
    experienceLevel,
    userData,
    showSkipPrompt,
    hideSkipPrompt,
    handleSkipDecision,
    skipDecision,
    analytics,
    resetUserData,
    exportAnalytics,
    isReturningUser,
    isExperiencedUser,
    hasCompletedTutorial,
  };
}

declare global {
  interface Window {
    tutorialSkipSessionManagement?: {
      handleSessionStart: () => void;
      handleSessionEnd: () => void;
      handleTutorialCompletion: () => void;
    };
  }
}

export const TutorialSkipUtils = {
  shouldShowSkipPrompt: (userData: UserData, config: TutorialSkipConfig) =>
    evaluateSkipPrompt(userData, config),
  getExperienceLevel: (sessionCount: number, config: TutorialSkipConfig) =>
    getExperienceLevel(sessionCount, config),
  formatSessionCount: (count: number) => formatSessionCount(count),
  formatTime: (milliseconds: number) => formatTime(milliseconds),
  calculateSkipRate: (skipCount: number, totalCount: number) => {
    if (totalCount === 0) {
      return 0;
    }
    return (skipCount / totalCount) * 100;
  },
  validateConfig: (config: Partial<TutorialSkipConfig>) => validateConfig(config),
  generateSkipSummary: (trackingData: SkipTracking[]) => generateSkipSummary(trackingData),
};
