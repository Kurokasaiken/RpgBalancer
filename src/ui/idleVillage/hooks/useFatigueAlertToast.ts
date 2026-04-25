import { useCallback, useEffect } from 'react';
import { useToast } from '@/ui/balancing/ToastContext';
import type { FatigueAnomalyAlert } from '@/balancing/idleVillage/FatigueAnomalyDetector';

interface UseFatigueAlertToastParams {
  alerts: FatigueAnomalyAlert[];
  onDismiss: (alertId: string) => void;
  onSnooze?: (residentId: string, minutes: number) => Promise<void>;
  snoozeOptions?: number[];
}

export function useFatigueAlertToast({
  alerts,
  onDismiss,
  onSnooze,
  snoozeOptions,
}: UseFatigueAlertToastParams) {
  const { showToast, removeToast } = useToast();

  const handleDismiss = useCallback(
    (alertId: string) => {
      onDismiss(alertId);
      removeToast(alertId);
    },
    [onDismiss, removeToast],
  );

  useEffect(() => {
    alerts.forEach((alert) => {
      const message = `${alert.residentId}: Fatigue ${alert.severity === 'critical' ? 'critical' : 'warning'} anomaly (${alert.deltaPercent?.toFixed(1)}% above expected)`;
      showToast(message, alert.severity === 'critical' ? 'error' : 'info', 0);
    });

    return () => {
      alerts.forEach((alert) => {
        removeToast(`fatigue-alert-${alert.id}`);
      });
    };
  }, [alerts, onDismiss, onSnooze, snoozeOptions, showToast, removeToast, handleDismiss]);
}
