import { DEFAULT_MAINTENANCE_FORECAST_CONFIG } from '@/balancing/config/idleVillage/maintenanceForecastConfig';
import type {
  MaintenanceForecastConfig,
  MaintenanceForecastPresentationConfig,
} from '@/balancing/config/idleVillage/maintenanceForecastConfig';
import type { MaintenanceCategory } from '@/ui/idleVillage/hooks/useMaintenanceInsights';

/**
 * Maintenance KPI observation aggregated per day (or time bucket).
 */
export interface MaintenanceKPIObservation {
  /** Unix epoch milliseconds representing the end of the bucket. */
  timestamp: number;
  /** Maintenance category represented by the KPI sample. */
  category: MaintenanceCategory;
  /** Total tasks completed within the bucket. */
  tasksCompleted: number;
  /** Optional derived severity metric (0-1). */
  severityIndex?: number;
}

/**
 * Single point in the maintenance forecast series.
 */
export interface MaintenanceForecastPoint {
  timestamp: number;
  /** Forecasted mean (or historical actual) task count. */
  mean: number;
  /** Lower bound of the confidence interval. */
  lower: number;
  /** Upper bound of the confidence interval. */
  upper: number;
  /** Whether the point originates from forecast or historical data. */
  source: 'historical' | 'forecast';
}

/**
 * Forecast series bucketed by category.
 */
export interface MaintenanceForecastSeries {
  category: MaintenanceCategory;
  points: MaintenanceForecastPoint[];
}

/**
 * Forecast alert raised when a category exceeds configured thresholds.
 */
export interface MaintenanceForecastAlert {
  category: MaintenanceCategory;
  severity: 'warning' | 'critical';
  forecastValue: number;
  threshold: number;
  timestamp: number;
}

/**
 * Final analytics payload returned by the maintenance forecast engine.
 */
export interface MaintenanceForecastResult {
  config: MaintenanceForecastConfig;
  series: Record<MaintenanceCategory, MaintenanceForecastSeries>;
  alerts: MaintenanceForecastAlert[];
  generatedAt: number;
}

interface HoltWintersState {
  level: number;
  trend: number;
  residuals: number[];
}

/**
 * Generates maintenance task forecasts per category using a lightweight Holt smoothing model.
 *
 * @param history Gathered KPI observations sorted or unsorted.
 * @param config Optional override for forecast parameters.
 */
export function computeMaintenanceForecast(
  history: MaintenanceKPIObservation[],
  config: Partial<MaintenanceForecastConfig> = {}
): MaintenanceForecastResult {
  const mergedConfig: MaintenanceForecastConfig = {
    ...DEFAULT_MAINTENANCE_FORECAST_CONFIG,
    ...config,
    smoothing: {
      ...DEFAULT_MAINTENANCE_FORECAST_CONFIG.smoothing,
      ...config.smoothing,
    },
    presentation: mergePresentationConfig(
      DEFAULT_MAINTENANCE_FORECAST_CONFIG.presentation,
      config.presentation
    ),
    alertThresholds: {
      ...DEFAULT_MAINTENANCE_FORECAST_CONFIG.alertThresholds,
      ...config.alertThresholds,
    },
  };

  const categorized = groupObservationsByCategory(
    history,
    mergedConfig.presentation.maxHistoricalPoints
  );

  const series: Record<MaintenanceCategory, MaintenanceForecastSeries> = {
    food: createEmptySeries('food'),
    injury: createEmptySeries('injury'),
    repair: createEmptySeries('repair'),
    cleaning: createEmptySeries('cleaning'),
    security: createEmptySeries('security'),
  };

  const alerts: MaintenanceForecastAlert[] = [];
  const now = Date.now();

  (Object.keys(series) as MaintenanceCategory[]).forEach((category) => {
    const points = categorized[category];
    if (points.length === 0) {
      series[category] = createEmptySeries(category);
      return;
    }

    const sortedPoints = [...points].sort((a, b) => a.timestamp - b.timestamp);
    const values = sortedPoints.map((point) => point.tasksCompleted);
    const baseInterval = computeAverageInterval(sortedPoints);

    const { level, trend, residuals } = runHoltSmoothing(
      values,
      mergedConfig.smoothing.alpha,
      mergedConfig.smoothing.beta
    );

    const stdDev = computeStdDev(residuals);
    const confidenceDelta = stdDev * mergedConfig.presentation.confidenceMultiplier;

    const historicalSeries: MaintenanceForecastPoint[] = sortedPoints.map((point) => ({
      timestamp: point.timestamp,
      mean: point.tasksCompleted,
      lower: Math.max(0, point.tasksCompleted - confidenceDelta),
      upper: point.tasksCompleted + confidenceDelta,
      source: 'historical',
    }));

    const forecastSeries: MaintenanceForecastPoint[] = [];
    const horizon = mergedConfig.presentation.forecastHorizon;

    for (let i = 1; i <= horizon; i += 1) {
      const forecastValue = level + trend * i;
      const timestamp = (sortedPoints.at(-1)?.timestamp ?? now) + baseInterval * i;
      const lower = Math.max(0, forecastValue - confidenceDelta);
      const upper = forecastValue + confidenceDelta;

      forecastSeries.push({
        timestamp,
        mean: forecastValue,
        lower,
        upper,
        source: 'forecast',
      });

      evaluateThresholdAlert(
        category,
        forecastValue,
        mergedConfig.alertThresholds[category],
        timestamp,
        alerts
      );
    }

    series[category] = {
      category,
      points: [...historicalSeries, ...forecastSeries],
    };
  });

  return {
    config: mergedConfig,
    series,
    alerts,
    generatedAt: now,
  };
}

/**
 * Serializes a forecast result to CSV.
 */
export function maintenanceForecastToCsv(result: MaintenanceForecastResult): string {
  const header = ['timestamp', 'category', 'type', 'mean', 'lower', 'upper'];
  const rows: string[] = [header.join(',')];

  (Object.values(result.series) as MaintenanceForecastSeries[]).forEach((series) => {
    series.points.forEach((point) => {
      rows.push(
        [
          new Date(point.timestamp).toISOString(),
          series.category,
          point.source,
          point.mean.toFixed(4),
          point.lower.toFixed(4),
          point.upper.toFixed(4),
        ].join(',')
      );
    });
  });

  return rows.join('\n');
}

function mergePresentationConfig(
  base: MaintenanceForecastPresentationConfig,
  overrides?: Partial<MaintenanceForecastPresentationConfig>
): MaintenanceForecastPresentationConfig {
  if (!overrides) {
    return base;
  }

  return {
    ...base,
    ...overrides,
    palette: {
      ...base.palette,
      ...(overrides.palette ?? {}),
      series: {
        ...base.palette.series,
        ...(overrides.palette?.series ?? {}),
      },
      confidenceFill: {
        ...base.palette.confidenceFill,
        ...(overrides.palette?.confidenceFill ?? {}),
      },
    },
  };
}

function groupObservationsByCategory(
  history: MaintenanceKPIObservation[],
  limit: number
): Record<MaintenanceCategory, MaintenanceKPIObservation[]> {
  const grouped: Record<MaintenanceCategory, MaintenanceKPIObservation[]> = {
    food: [],
    injury: [],
    repair: [],
    cleaning: [],
    security: [],
  };

  history.forEach((observation) => {
    grouped[observation.category].push(observation);
  });

  (Object.keys(grouped) as MaintenanceCategory[]).forEach((category) => {
    grouped[category] = grouped[category]
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-limit);
  });

  return grouped;
}

function createEmptySeries(category: MaintenanceCategory): MaintenanceForecastSeries {
  return {
    category,
    points: [],
  };
}

function computeAverageInterval(points: MaintenanceKPIObservation[]): number {
  if (points.length < 2) {
    return 24 * 60 * 60 * 1000; // default daily window
  }

  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    total += points[i].timestamp - points[i - 1].timestamp;
  }
  return total / (points.length - 1);
}

function runHoltSmoothing(values: number[], alpha: number, beta: number): HoltWintersState {
  let level = values[0] ?? 0;
  let trend = values[1] !== undefined ? values[1] - values[0] : 0;
  const residuals: number[] = [];

  values.forEach((value, index) => {
    if (index === 0) return;
    const prevLevel = level;
    level = alpha * value + (1 - alpha) * (level + trend);
    trend = beta * (level - prevLevel) + (1 - beta) * trend;
    const fitted = level + trend;
    residuals.push(value - fitted);
  });

  return { level, trend, residuals };
}

function computeStdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function evaluateThresholdAlert(
  category: MaintenanceCategory,
  value: number,
  thresholds: { upper: number; lower: number },
  timestamp: number,
  alerts: MaintenanceForecastAlert[]
): void {
  if (value >= thresholds.upper) {
    alerts.push({
      category,
      severity: 'critical',
      forecastValue: value,
      threshold: thresholds.upper,
      timestamp,
    });
  } else if (value <= thresholds.lower) {
    alerts.push({
      category,
      severity: 'warning',
      forecastValue: value,
      threshold: thresholds.lower,
      timestamp,
    });
  }
}
