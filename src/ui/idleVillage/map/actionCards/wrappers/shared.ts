import type { ActionCardMetric } from '../ActionCard';

export type MetricsSource = Array<ActionCardMetric | null | undefined>;

/**
 * Resolves ActionCard metrics by preferring explicit props and falling back to
 * contextual defaults provided by wrappers.
 */
export function resolveMetrics(
  explicit: ActionCardMetric[] | undefined,
  fallback: MetricsSource,
): ActionCardMetric[] | undefined {
  if (explicit && explicit.length > 0) {
    return explicit;
  }

  const resolved = fallback.filter((metric): metric is ActionCardMetric => Boolean(metric));
  return resolved.length > 0 ? resolved : undefined;
}

const clamp01 = (value: number | undefined) => {
  if (!Number.isFinite(value ?? 0)) return 0;
  return Math.max(0, Math.min(1, value ?? 0));
};

const formatSecondsLabel = (seconds?: number) => {
  if (seconds == null || Number.isNaN(seconds)) return '--';
  if (seconds < 60) return `${Math.max(0, Math.round(seconds))}s`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainder}`;
  }

  return `${minutes.toString().padStart(2, '0')}:${remainder}`;
};

/**
 * Generates a standard trio of metrics (progress/elapsed/duration) for cards
 * that do not pass explicit config-driven metrics yet.
 */
export function buildTimeMetrics(
  progressFraction: number,
  elapsedSeconds: number,
  totalDurationSeconds: number,
): MetricsSource {
  const progress = `${Math.round(clamp01(progressFraction) * 100)}%`;
  return [
    { label: 'Progress', value: progress },
    { label: 'Elapsed', value: formatSecondsLabel(elapsedSeconds) },
    { label: 'Durata', value: formatSecondsLabel(totalDurationSeconds) },
  ];
}
