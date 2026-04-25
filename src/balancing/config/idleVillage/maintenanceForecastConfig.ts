import type { MaintenanceCategory } from '@/ui/idleVillage/hooks/useMaintenanceInsights';

/**
 * Forecast smoothing parameters for Holt-style exponential smoothing.
 */
export interface MaintenanceForecastSmoothingConfig {
  /** Level smoothing factor (0-1). */
  alpha: number;
  /** Trend smoothing factor (0-1). */
  beta: number;
  /** Optional seasonal smoothing factor (0-1). */
  gamma: number;
  /** Season length expressed in number of samples. */
  seasonalPeriod: number;
}

/**
 * Alert threshold configuration per maintenance category.
 */
export interface MaintenanceForecastAlertThreshold {
  /** Upper bound before raising an alert (tasks per day). */
  upper: number;
  /** Lower bound before raising an alert. */
  lower: number;
}

/**
 * Chart and presentation options for the maintenance forecast UI.
 */
export interface MaintenanceForecastPresentationConfig {
  /** Maximum number of historical points to visualize. */
  maxHistoricalPoints: number;
  /** Number of forecast steps to display. */
  forecastHorizon: number;
  /** Multiplier used to compute confidence bands (in standard deviations). */
  confidenceMultiplier: number;
  /** Palette tokens for chart rendering. */
  palette: {
    background: string;
    grid: string;
    text: string;
    series: Record<MaintenanceCategory, string>;
    confidenceFill: Record<MaintenanceCategory, string>;
  };
}

/**
 * Complete maintenance forecast configuration.
 */
export interface MaintenanceForecastConfig {
  smoothing: MaintenanceForecastSmoothingConfig;
  presentation: MaintenanceForecastPresentationConfig;
  alertThresholds: Record<MaintenanceCategory, MaintenanceForecastAlertThreshold>;
  persistenceKey: string;
}

/**
 * Default configuration tuned for Phase 12 maintenance cadence.
 */
export const DEFAULT_MAINTENANCE_FORECAST_CONFIG: MaintenanceForecastConfig = {
  smoothing: {
    alpha: 0.5,
    beta: 0.3,
    gamma: 0.15,
    seasonalPeriod: 7,
  },
  presentation: {
    maxHistoricalPoints: 60,
    forecastHorizon: 7,
    confidenceMultiplier: 1.65,
    palette: {
      background: 'rgba(6, 8, 14, 0.8)',
      grid: 'rgba(255, 255, 255, 0.08)',
      text: 'rgba(255, 247, 235, 0.92)',
      series: {
        food: '#f7b500',
        injury: '#f87272',
        repair: '#5ac8fa',
        cleaning: '#a3e635',
        security: '#c084fc',
      },
      confidenceFill: {
        food: 'rgba(247, 181, 0, 0.18)',
        injury: 'rgba(248, 114, 114, 0.18)',
        repair: 'rgba(90, 200, 250, 0.18)',
        cleaning: 'rgba(163, 230, 53, 0.18)',
        security: 'rgba(192, 132, 252, 0.18)',
      },
    },
  },
  alertThresholds: {
    food: { upper: 140, lower: 40 },
    injury: { upper: 60, lower: 5 },
    repair: { upper: 80, lower: 10 },
    cleaning: { upper: 55, lower: 8 },
    security: { upper: 45, lower: 5 },
  },
  persistenceKey: 'idleVillageMaintenanceForecast',
};
