import type { IdleVillageConfig } from '@/balancing/config/idleVillage/types';
import type { VillageState } from '@/engine/game/idleVillage/TimeEngine';
import {
  DEFAULT_FOOD_CHAIN_ALERT_CONFIG,
  type FoodChainAlertConfig,
  type FoodChainAlertSeverity,
  type FoodChainAlertThresholds,
  deriveFoodConsumptionPerResident,
} from '@/balancing/config/idleVillage/foodChainAlertConfig';
import { createHeadlessDiagnostics } from '@/shared/telemetry/headlessDiagnostics';

const diagnostics = createHeadlessDiagnostics('FoodChainAlert', 'food_chain');

/**
 * Snapshot describing the food chain state at a specific timestamp.
 */
export interface FoodChainSnapshot {
  /** Epoch milliseconds representing when the snapshot was taken. */
  timestamp: number;
  /** Current food stock (units). */
  foodStock: number;
  /** Estimated daily food production rate (units/day). */
  foodProductionPerDay: number;
  /** Estimated daily food consumption (units/day). */
  foodConsumptionPerDay: number;
  /** Number of consecutive in-game days spent in deficit prior to this snapshot. */
  consecutiveDeficitDays?: number;
  /** Optional metadata for downstream reporting (scheduler village id, etc.). */
  metadata?: Record<string, unknown>;
}

/**
 * Scheduler-derived KPIs that can be converted into food production estimates.
 */
export interface FoodChainSchedulerKpi {
  villageId?: string;
  /** Activities per day tagged as food production. */
  productionActivitiesPerDay: number;
  /** Optional ratio of residents currently farming. */
  farmingUtilization?: number;
  /** Optional description for diagnostics. */
  description?: string;
}

/**
 * Computed metrics from a set of snapshots.
 */
export interface FoodChainMetrics {
  /** Latest food stock. */
  currentFoodStock: number;
  /** Days of food available based on current consumption. */
  daysOfFoodAvailable: number;
  /** Target buffer expressed in days (from config). */
  targetDaysOfFood: number;
  /** Average daily production across snapshots. */
  averageProductionPerDay: number;
  /** Average daily consumption across snapshots. */
  averageConsumptionPerDay: number;
  /** Net surplus (positive) or deficit (negative) per day. */
  netProductionPerDay: number;
  /** Maximum observed consecutive deficit days. */
  maxDeficitStreak: number;
  /** Whether data suggests the scheduler is undersupplying food jobs. */
  schedulerUnderAllocation: boolean;
}

/**
 * Alert information produced by the analyzer.
 */
export interface FoodChainAlert {
  id: string;
  severity: FoodChainAlertSeverity;
  /** Alert type identifier for downstream tools. */
  type: 'stock' | 'production_deficit' | 'scheduler_underallocation';
  message: string;
  metrics: FoodChainMetrics;
  recommendations: string[];
  timestamp: number;
  context?: Record<string, unknown>;
}

/**
 * Result returned by the analyzer.
 */
export interface FoodChainAnalysisResult {
  metrics: FoodChainMetrics;
  alerts: FoodChainAlert[];
  /**
   * Simple status derived from the strongest alert, allows CLI to show a badge.
   */
  status: 'stable' | 'warning' | 'critical';
}

const buildId = (type: string): string => `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

/**
 * Analyzes food production/consumption snapshots and emits alerts + telemetry.
 */
export class FoodChainAlertAnalyzer {
  private readonly config: FoodChainAlertConfig;
  private readonly thresholds: FoodChainAlertThresholds;
  private readonly cooldownMs: number;
  private readonly cooldowns = new Map<string, number>();

  constructor(config: Partial<FoodChainAlertConfig> = {}) {
    this.config = {
      ...DEFAULT_FOOD_CHAIN_ALERT_CONFIG,
      ...config,
      thresholds: {
        ...DEFAULT_FOOD_CHAIN_ALERT_CONFIG.thresholds,
        ...(config.thresholds ?? {}),
      },
    };
    this.thresholds = this.config.thresholds;
    this.cooldownMs = this.thresholds.alertCooldownMinutes * 60 * 1000;
  }

  /**
   * Runs full analysis on the provided snapshots, returning metrics and alerts.
   */
  analyzeSnapshots(snapshots: FoodChainSnapshot[]): FoodChainAnalysisResult {
    if (!snapshots.length) {
      throw new Error('FoodChainAlertAnalyzer requires at least one snapshot.');
    }

    const sorted = [...snapshots].sort((a, b) => a.timestamp - b.timestamp);
    const metrics = this.buildMetrics(sorted);
    const alerts = this.detectAlerts(sorted, metrics);
    const status = alerts.some((a) => a.severity === 'critical')
      ? 'critical'
      : alerts.some((a) => a.severity === 'warning')
        ? 'warning'
        : 'stable';

    diagnostics.info('Food chain analysis completed', {
      status,
      alerts: alerts.length,
      metrics,
    });

    return { metrics, alerts, status };
  }

  /**
   * Convenience helper that creates a single snapshot from a VillageState and analyzes it.
   */
  analyzeVillageState(options: {
    config: IdleVillageConfig;
    state: VillageState;
    productionPerDay: number;
    timestamp?: number;
    schedulerKpi?: FoodChainSchedulerKpi;
  }): FoodChainAnalysisResult {
    const consumptionPerResident = deriveFoodConsumptionPerResident(options.config);
    const livingResidents = Object.values(options.state.residents).filter((r) => r.status !== 'dead');
    const consumptionPerDay = livingResidents.length * consumptionPerResident;

    const snapshot: FoodChainSnapshot = {
      timestamp: options.timestamp ?? Date.now(),
      foodStock: options.state.resources.food ?? 0,
      foodProductionPerDay: options.productionPerDay,
      foodConsumptionPerDay: consumptionPerDay,
      metadata: {
        residents: livingResidents.length,
        schedulerVillageId: options.schedulerKpi?.villageId,
      },
    };

    return this.analyzeSnapshots([snapshot]);
  }

  private buildMetrics(snapshots: FoodChainSnapshot[]): FoodChainMetrics {
    const latest = snapshots[snapshots.length - 1];
    const totalProduction = snapshots.reduce((sum, snap) => sum + snap.foodProductionPerDay, 0);
    const totalConsumption = snapshots.reduce((sum, snap) => sum + snap.foodConsumptionPerDay, 0);
    const averageProductionPerDay = totalProduction / snapshots.length;
    const averageConsumptionPerDay = totalConsumption / snapshots.length;
    const netProductionPerDay = averageProductionPerDay - averageConsumptionPerDay;

    let deficitStreak = 0;
    let maxDeficitStreak = 0;
    snapshots.forEach((snap) => {
      if (snap.foodProductionPerDay < snap.foodConsumptionPerDay) {
        deficitStreak += 1;
      } else {
        maxDeficitStreak = Math.max(maxDeficitStreak, deficitStreak);
        deficitStreak = 0;
      }
    });
    maxDeficitStreak = Math.max(maxDeficitStreak, deficitStreak);

    const daysOfFoodAvailable =
      latest.foodConsumptionPerDay > 0 ? latest.foodStock / latest.foodConsumptionPerDay : Infinity;

    const schedulerUnderAllocation =
      (latest.metadata?.schedulerVillageId && latest.metadata?.farmingUtilization !== undefined
        ? (latest.metadata.farmingUtilization as number) < 0.2
        : false) || averageProductionPerDay <= 0;

    return {
      currentFoodStock: latest.foodStock,
      daysOfFoodAvailable: Number.isFinite(daysOfFoodAvailable) ? daysOfFoodAvailable : Infinity,
      targetDaysOfFood: this.thresholds.targetStockpileDays,
      averageProductionPerDay,
      averageConsumptionPerDay,
      netProductionPerDay,
      maxDeficitStreak,
      schedulerUnderAllocation,
    };
  }

  private detectAlerts(snapshots: FoodChainSnapshot[], metrics: FoodChainMetrics): FoodChainAlert[] {
    const alerts: FoodChainAlert[] = [];
    const latest = snapshots[snapshots.length - 1];
    const now = latest.timestamp;

    if (metrics.daysOfFoodAvailable <= this.thresholds.minimumDaysOfFoodCritical) {
      alerts.push(this.buildAlert('critical', 'stock', metrics, now, {
        reason: 'low_stock',
        daysOfFood: metrics.daysOfFoodAvailable,
      }));
    } else if (metrics.daysOfFoodAvailable <= this.thresholds.minimumDaysOfFoodWarning) {
      alerts.push(this.buildAlert('warning', 'stock', metrics, now, {
        reason: 'stock_warning',
        daysOfFood: metrics.daysOfFoodAvailable,
      }));
    }

    const deficitRatio =
      metrics.averageConsumptionPerDay > 0
        ? (metrics.averageConsumptionPerDay - metrics.averageProductionPerDay) / metrics.averageConsumptionPerDay
        : 0;

    if (
      deficitRatio >= this.thresholds.productionDeficitPercent &&
      metrics.maxDeficitStreak >= this.thresholds.consecutiveDeficitDaysCritical
    ) {
      alerts.push(this.buildAlert('critical', 'production_deficit', metrics, now, {
        reason: 'sustained_deficit',
        deficitRatio,
      }));
    } else if (
      deficitRatio >= this.thresholds.productionDeficitPercent &&
      metrics.maxDeficitStreak >= this.thresholds.consecutiveDeficitDaysWarning
    ) {
      alerts.push(this.buildAlert('warning', 'production_deficit', metrics, now, {
        reason: 'deficit_warning',
        deficitRatio,
      }));
    }

    if (metrics.schedulerUnderAllocation) {
      alerts.push(this.buildAlert('warning', 'scheduler_underallocation', metrics, now, {
        reason: 'scheduler_farming_low',
      }));
    }

    return alerts.filter((alert) => this.shouldEmit(alert));
  }

  private buildAlert(
    severity: FoodChainAlertSeverity,
    type: FoodChainAlert['type'],
    metrics: FoodChainMetrics,
    timestamp: number,
    context?: Record<string, unknown>,
  ): FoodChainAlert {
    const recommendations = this.buildRecommendations(type, metrics);
    const message = this.buildMessage(type, metrics);
    return {
      id: buildId(type),
      severity,
      type,
      message,
      metrics,
      recommendations,
      timestamp,
      context,
    };
  }

  private buildRecommendations(type: FoodChainAlert['type'], _metrics: FoodChainMetrics): string[] {
    switch (type) {
      case 'stock':
        return [
          'Trigger emergency food purchase via market config.',
          'Pause high-consumption activities until stock stabilizes.',
        ];
      case 'production_deficit':
        return [
          'Assign additional residents to farming/gathering activities.',
          'Review activity durations to increase food output per day.',
        ];
      case 'scheduler_underallocation':
        return [
          'Adjust scheduler weights to favor food-tagged activities.',
          'Increase crew limit on farming slots.',
        ];
      default:
        return ['Review food economy configuration.'];
    }
  }

  private buildMessage(type: FoodChainAlert['type'], metrics: FoodChainMetrics): string {
    switch (type) {
      case 'stock':
        return `Food reserves cover ${metrics.daysOfFoodAvailable.toFixed(2)} days (target ${metrics.targetDaysOfFood}d).`;
      case 'production_deficit':
        return `Food production is ${Math.abs(metrics.netProductionPerDay).toFixed(1)} units/day below consumption.`;
      case 'scheduler_underallocation':
        return 'Scheduler shows low farming allocation; production may stall soon.';
      default:
        return 'Food chain anomaly detected.';
    }
  }

  private shouldEmit(alert: FoodChainAlert): boolean {
    const key = `${alert.type}-${alert.severity}`;
    const last = this.cooldowns.get(key) ?? 0;
    if (Date.now() - last < this.cooldownMs) {
      return false;
    }
    this.cooldowns.set(key, Date.now());
    diagnostics.warn(alert.message, {
      alertId: alert.id,
      severity: alert.severity,
      recommendations: alert.recommendations,
    });
    return true;
  }
}

/**
 * Builds snapshots from a scheduler KPI export by estimating production rates.
 */
export function snapshotsFromSchedulerKpis(options: {
  kpis: FoodChainSchedulerKpi[];
  state: VillageState;
  config: IdleVillageConfig;
  unitsPerActivity?: number;
}): FoodChainSnapshot[] {
  const consumptionPerResident = deriveFoodConsumptionPerResident(options.config);
  const livingResidents = Object.values(options.state.residents).filter((r) => r.status !== 'dead');
  const consumptionPerDay = livingResidents.length * consumptionPerResident;
  const unitsPerActivity = options.unitsPerActivity ?? DEFAULT_FOOD_CHAIN_ALERT_CONFIG.foodUnitsPerProductionActivity;

  return options.kpis.map((kpi) => ({
    timestamp: Date.now(),
    foodStock: options.state.resources.food ?? 0,
    foodProductionPerDay: kpi.productionActivitiesPerDay * unitsPerActivity,
    foodConsumptionPerDay: consumptionPerDay,
    metadata: {
      schedulerVillageId: kpi.villageId,
      farmingUtilization: kpi.farmingUtilization,
      description: kpi.description,
    },
  }));
}

/**
 * Formats analysis results for human-readable reports.
 */
export function formatFoodChainReport(
  result: FoodChainAnalysisResult,
  format: 'text' | 'markdown' = 'text',
): string {
  const header = format === 'markdown'
    ? `# 🍞 Idle Village Food Chain Report\n\n**Status:** ${result.status.toUpperCase()}\n\n`
    : `🍞 Idle Village Food Chain Report\nStatus: ${result.status.toUpperCase()}\n\n`;

  const metrics = result.metrics;
  const metricsBlock = format === 'markdown'
    ? [
        '## Metrics',
        '',
        `- Days of food available: **${metrics.daysOfFoodAvailable.toFixed(2)}d**`,
        `- Target buffer: **${metrics.targetDaysOfFood}d**`,
        `- Avg production: **${metrics.averageProductionPerDay.toFixed(1)} units/day**`,
        `- Avg consumption: **${metrics.averageConsumptionPerDay.toFixed(1)} units/day**`,
        `- Net production: **${metrics.netProductionPerDay.toFixed(1)} units/day**`,
        `- Max deficit streak: **${metrics.maxDeficitStreak} day(s)**`,
      ].join('\n')
    : [
        'Metrics',
        '-------',
        `Days of food available : ${metrics.daysOfFoodAvailable.toFixed(2)}d`,
        `Target buffer          : ${metrics.targetDaysOfFood}d`,
        `Avg production         : ${metrics.averageProductionPerDay.toFixed(1)} units/day`,
        `Avg consumption        : ${metrics.averageConsumptionPerDay.toFixed(1)} units/day`,
        `Net production         : ${metrics.netProductionPerDay.toFixed(1)} units/day`,
        `Max deficit streak     : ${metrics.maxDeficitStreak} day(s)`,
      ].join('\n');

  const alertsSection = result.alerts.length
    ? result.alerts
        .map((alert) => {
          const recs = alert.recommendations.map((rec) => (format === 'markdown' ? `  - ${rec}` : `    • ${rec}`)).join('\n');
          if (format === 'markdown') {
            return [
              `### ${alert.severity.toUpperCase()} – ${alert.message}`,
              '',
              recs,
              '',
            ].join('\n');
          }
          return [
            `${alert.severity.toUpperCase()} – ${alert.message}`,
            recs,
            '',
          ].join('\n');
        })
        .join('\n')
    : format === 'markdown'
      ? '\n## Alerts\n\nAll clear. No food chain issues detected.\n'
      : '\nAlerts\n------\nAll clear. No food chain issues detected.\n';

  return `${header}${metricsBlock}\n\n${alertsSection}`.trim();
}
