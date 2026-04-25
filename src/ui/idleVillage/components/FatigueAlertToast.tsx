import React, { useMemo } from 'react';
import { AlertTriangle, AlertCircle, X, Clock, User } from 'lucide-react';
import type { FatigueAnomalyAlert } from '@/balancing/idleVillage/FatigueAnomalyDetector';

interface FatigueAlertToastProps {
  alert: FatigueAnomalyAlert;
  onDismiss: (alertId: string) => void;
  onSnooze?: (residentId: string, minutes: number) => Promise<void>;
  snoozeOptions?: number[];
}

const DEFAULT_SNOOZE_OPTIONS = [5, 15, 30, 60];

const getSeverityColor = (severity: 'warning' | 'critical') => {
  switch (severity) {
    case 'critical':
      return 'border-red-500 bg-red-50 text-red-900';
    case 'warning':
    default:
      return 'border-amber-500 bg-amber-50 text-amber-900';
  }
};

const formatDelta = (delta: number, type: 'percent' | 'value') => {
  const sign = delta >= 0 ? '+' : '';
  switch (type) {
    case 'percent':
      return `${sign}${delta.toFixed(1)}%`;
    case 'value':
    default:
      return `${sign}${delta.toFixed(0)}`;
  }
};

const formatDuration = (minutes: number) => {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

export const FatigueAlertToast: React.FC<FatigueAlertToastProps> = ({
  alert,
  onDismiss,
  onSnooze,
  snoozeOptions = DEFAULT_SNOOZE_OPTIONS,
}) => {
  const severityColor = getSeverityColor(alert.severity);

  const description = useMemo(() => {
    const parts = [];
    if (alert.deltaPercent !== undefined) {
      parts.push(`Fatigue ${formatDelta(alert.deltaPercent, 'percent')} above expected`);
    }
    if (alert.activityId) {
      parts.push(`during ${alert.activityId}`);
    }
    return parts.join(' ');
  }, [alert.deltaPercent, alert.activityId]);

  const handleSnooze = async (minutes: number) => {
    await onSnooze?.(alert.residentId, minutes);
  };

  return (
    <div
      className={`relative flex items-start gap-3 p-3 rounded-lg border shadow-sm transition-all duration-200 ${severityColor}`}
      role="alert"
      aria-live="polite"
    >
      <div className="shrink-0 mt-0.5">
        {alert.severity === 'critical' ? (
          <AlertTriangle className="h-5 w-5" aria-hidden="true" />
        ) : (
          <AlertCircle className="h-5 w-5" aria-hidden="true" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <User className="h-4 w-4" aria-hidden="true" />
          <span className="font-medium text-sm truncate" title={alert.residentId}>
            {alert.residentId}
          </span>
          <span className="text-xs opacity-75">
            {alert.ruleId}
          </span>
        </div>

        <p className="text-sm font-medium mb-1">
          {alert.severity === 'critical' ? 'Critical fatigue anomaly' : 'Fatigue anomaly'}
        </p>

        <p className="text-xs opacity-90 mb-2">
          {description}
        </p>

        <div className="flex items-center gap-4 text-xs opacity-75">
          <div className="flex items-center gap-1">
            <span>Current:</span>
            <span className="font-mono">{alert.currentFatigue.toFixed(0)}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>Expected:</span>
            <span className="font-mono">{alert.expectedFatigue.toFixed(0)}</span>
          </div>
          {alert.consecutiveBreaches > 1 && (
            <div className="flex items-center gap-1">
              <span>Breaches:</span>
              <span className="font-mono">{alert.consecutiveBreaches}</span>
            </div>
          )}
        </div>

        {onSnooze && (
          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-current border-opacity-20">
            <Clock className="h-3 w-3" aria-hidden="true" />
            <span className="text-xs">Snooze:</span>
            <div className="flex gap-1">
              {snoozeOptions.map((minutes) => (
                <button
                  key={minutes}
                  onClick={() => handleSnooze(minutes)}
                  className="px-2 py-0.5 text-xs rounded border border-current border-opacity-30 hover:bg-current hover:bg-opacity-10 transition-colors"
                  aria-label={`Snooze for ${formatDuration(minutes)}`}
                >
                  {formatDuration(minutes)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <button
        onClick={() => onDismiss(alert.id)}
        className="shrink-0 p-1 rounded hover:bg-current hover:bg-opacity-10 transition-colors"
        aria-label="Dismiss alert"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
};

export default FatigueAlertToast;
