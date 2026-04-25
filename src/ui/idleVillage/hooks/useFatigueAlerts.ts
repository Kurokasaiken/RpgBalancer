import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ResidentState, ScheduledActivity } from '@/engine/game/idleVillage/TimeEngine';
import {
  DEFAULT_FATIGUE_ALERT_PREFERENCES,
  DEFAULT_FATIGUE_ANOMALY_CONFIG,
  FATIGUE_ALERT_STORAGE_KEY,
  findResidentActivity,
  type FatigueAlertPreferences,
  type FatigueAnomalyConfig,
} from '@/balancing/config/idleVillage/fatigueAnomalyConfig';
import {
  FatigueAnomalyDetector,
  type FatigueAnomalyAlert,
  type ResidentFatigueSample,
} from '@/balancing/idleVillage/FatigueAnomalyDetector';
import { loadData, saveData } from '@/shared/persistence/PersistenceService';

const DEFAULT_TOAST_COOLDOWN_MS = 60_000;
const MAX_ALERT_BUFFER = 20;

interface UseFatigueAlertsParams {
  residents: ResidentState[];
  activities: Record<string, ScheduledActivity>;
  /** Time units from the idle village clock (optional). */
  currentTimeUnits?: number;
  /** Seconds represented by a single time unit (defaults to 60s). */
  secondsPerTimeUnit?: number;
  anomalyConfig?: Partial<FatigueAnomalyConfig>;
  storageKey?: string;
  toastCooldownMs?: number;
}

export interface UseFatigueAlertsResult {
  alerts: FatigueAnomalyAlert[];
  dismissAlert: (alertId: string) => void;
  clearAlerts: () => void;
  snoozeResident: (residentId: string, minutes: number) => Promise<void>;
  isResidentSnoozed: (residentId: string) => boolean;
  snoozedResidents: Record<string, number>;
  preferencesReady: boolean;
}

const mergeAnomalyConfig = (override?: Partial<FatigueAnomalyConfig>): FatigueAnomalyConfig => {
  if (!override) {
    return DEFAULT_FATIGUE_ANOMALY_CONFIG;
  }
  return {
    ...DEFAULT_FATIGUE_ANOMALY_CONFIG,
    ...override,
    residentSegments: {
      ...DEFAULT_FATIGUE_ANOMALY_CONFIG.residentSegments,
      ...override.residentSegments,
    },
    activityBaselines: {
      ...DEFAULT_FATIGUE_ANOMALY_CONFIG.activityBaselines,
      ...override.activityBaselines,
    },
    alertRules: override.alertRules ?? DEFAULT_FATIGUE_ANOMALY_CONFIG.alertRules,
    snoozeDurationsMinutes:
      override.snoozeDurationsMinutes ?? DEFAULT_FATIGUE_ANOMALY_CONFIG.snoozeDurationsMinutes,
  };
};

export function useFatigueAlerts({
  residents,
  activities,
  currentTimeUnits,
  secondsPerTimeUnit = 60,
  anomalyConfig,
  storageKey = FATIGUE_ALERT_STORAGE_KEY,
  toastCooldownMs = DEFAULT_TOAST_COOLDOWN_MS,
}: UseFatigueAlertsParams): UseFatigueAlertsResult {
  const mergedConfig = useMemo(() => mergeAnomalyConfig(anomalyConfig), [anomalyConfig]);
  const detectorRef = useRef<FatigueAnomalyDetector>();
  if (!detectorRef.current) {
    detectorRef.current = new FatigueAnomalyDetector({ config: mergedConfig });
  }

  useEffect(() => {
    detectorRef.current?.updateConfig(mergedConfig);
  }, [mergedConfig]);

  const [alerts, setAlerts] = useState<FatigueAnomalyAlert[]>([]);
  const [preferencesReady, setPreferencesReady] = useState(false);
  const [snoozedResidents, setSnoozedResidents] = useState<Record<string, number>>(
    DEFAULT_FATIGUE_ALERT_PREFERENCES.snoozedResidents,
  );
  const lastToastTimesRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const stored = await loadData<FatigueAlertPreferences>(
          storageKey,
          DEFAULT_FATIGUE_ALERT_PREFERENCES,
        );
        if (!mounted) return;
        setSnoozedResidents(stored.snoozedResidents ?? {});
      } catch (error) {
        console.warn('[useFatigueAlerts] Failed to load alert preferences', error);
      } finally {
        if (mounted) setPreferencesReady(true);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [storageKey]);

  useEffect(() => {
    if (!preferencesReady) return;
    const payload: FatigueAlertPreferences = { snoozedResidents };
    saveData(storageKey, payload).catch((error) => {
      console.warn('[useFatigueAlerts] Failed to persist alert preferences', error);
    });
  }, [preferencesReady, snoozedResidents, storageKey]);

  const computeTimestamp = useCallback(() => {
    if (typeof currentTimeUnits === 'number' && Number.isFinite(currentTimeUnits)) {
      return currentTimeUnits * secondsPerTimeUnit * 1000;
    }
    return Date.now();
  }, [currentTimeUnits, secondsPerTimeUnit]);

  const isResidentSnoozed = useCallback(
    (residentId: string) => {
      const until = snoozedResidents[residentId];
      if (!until) {
        return false;
      }
      const now = Date.now();
      if (now >= until) {
        return false;
      }
      return true;
    },
    [snoozedResidents],
  );

  const enqueueAlerts = useCallback(
    (incoming: FatigueAnomalyAlert[], timestamp: number) => {
      if (!incoming.length) return;
      setAlerts((prev) => {
        const buffer = [...prev];
        incoming.forEach((alert) => {
          if (isResidentSnoozed(alert.residentId)) {
            return;
          }
          const key = `${alert.residentId}::${alert.ruleId}`;
          const lastToast = lastToastTimesRef.current.get(key) ?? 0;
          if (timestamp - lastToast < toastCooldownMs) {
            return;
          }
          lastToastTimesRef.current.set(key, timestamp);
          buffer.push(alert);
        });
        const unique = dedupeAlerts(buffer);
        return unique.slice(-MAX_ALERT_BUFFER);
      });
    },
    [isResidentSnoozed, toastCooldownMs],
  );

  useEffect(() => {
    if (!residents.length) {
      return;
    }
    const timestamp = computeTimestamp();
    const samples: ResidentFatigueSample[] = residents
      .filter((resident) => Number.isFinite(resident.fatigue))
      .map((resident) => ({
        residentId: resident.id,
        fatigue: resident.fatigue ?? 0,
        timestamp,
        status: resident.status,
        activityId: findResidentActivity(resident.id, activities),
      }));

    if (!samples.length) {
      return;
    }

    const newAlerts = detectorRef.current?.ingestSamples(samples) ?? [];
    if (newAlerts.length) {
      enqueueAlerts(newAlerts, timestamp);
    }
  }, [activities, residents, computeTimestamp, enqueueAlerts]);

  const dismissAlert = useCallback((alertId: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
  }, []);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  const snoozeResident = useCallback(
    async (residentId: string, minutes: number) => {
      const durationMs = Math.max(1, minutes) * 60 * 1000;
      const until = Date.now() + durationMs;
      setSnoozedResidents((prev) => ({
        ...prev,
        [residentId]: until,
      }));
      await saveData(storageKey, { snoozedResidents: { ...snoozedResidents, [residentId]: until } }).catch(
        (error) => {
          console.warn('[useFatigueAlerts] Failed to persist snooze preference', error);
        },
      );
      setAlerts((prev) => prev.filter((alert) => alert.residentId !== residentId));
    },
    [snoozedResidents, storageKey],
  );

  return {
    alerts,
    dismissAlert,
    clearAlerts,
    snoozeResident,
    isResidentSnoozed,
    snoozedResidents,
    preferencesReady,
  };
}

const dedupeAlerts = (list: FatigueAnomalyAlert[]): FatigueAnomalyAlert[] => {
  const seen = new Set<string>();
  const result: FatigueAnomalyAlert[] = [];
  list.forEach((alert) => {
    if (seen.has(alert.id)) {
      return;
    }
    seen.add(alert.id);
    result.push(alert);
  });
  return result;
};
