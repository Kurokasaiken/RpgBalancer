/**
 * NP-088 – Idle Village Multi-Village Scheduler Monitor CLI
 *
 * Command-line interface for monitoring and comparing scheduler performance across multiple village environments.
 * Provides real-time monitoring, KPI export, and comparative analysis capabilities.
 *
 * @since 2026-01-13
 * @author Cascade
 */

import { writeFileSync } from 'fs';
import { join } from 'path';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type { CrewSchedulerConfig } from '@/balancing/config/idleVillage/crewScheduler';
import {
  MultiVillageSchedulerMonitor,
  type VillageEnvironment,
  type SchedulerKPIs,
  type MonitorAlert,
  type ComparativeAnalysis,
  type MultiVillageMonitorConfig,
} from './multiVillageSchedulerMonitor';

/**
 * CLI configuration options
 */
export interface MonitorCLIConfig {
  /** Command to execute */
  command: 'monitor' | 'export' | 'compare' | 'alerts' | 'status';
  /** Village configuration files */
  villageConfigs?: string[];
  /** Output format */
  format: 'json' | 'csv' | 'table';
  /** Output file path */
  outputPath?: string;
  /** Monitoring duration in minutes */
  duration?: number;
  /** Monitoring interval in seconds */
  interval?: number;
  /** Time window for analysis in minutes */
  timeWindow?: number;
  /** Village IDs to filter */
  villageIds?: string[];
  /** Enable real-time display */
  realTime?: boolean;
  /** Pretty print JSON */
  prettyPrint?: boolean;
  /** CSV delimiter */
  csvDelimiter?: string;
}

/**
 * Default CLI configuration
 */
export const DEFAULT_MONITOR_CLI_CONFIG: Partial<MonitorCLIConfig> = {
  format: 'table',
  duration: 5,
  interval: 30,
  timeWindow: 60,
  realTime: true,
  prettyPrint: true,
  csvDelimiter: ',',
};

/**
 * Sample village configurations for demonstration
 */
export const SAMPLE_VILLAGES: VillageEnvironment[] = [
  {
    id: 'village-alpha',
    name: 'Village Alpha',
    state: {
      residents: {},
      activities: {},
      currentTime: Date.now(),
    },
    schedulerConfig: {
      priorityWeights: {
        statTagMatch: 10.0,
        fatiguePenalty: -8.0,
        questUrgency: 12.0,
        specializationBonus: 5.0,
        difficultyBonus: 2.0,
        baseWeight: 1.0,
      },
      seeding: {
        lcgSeed: 1337,
        deterministic: false,
      },
      thresholds: {
        fatiguePenaltyThreshold: 0.7,
        questUrgencyThreshold: 3.0,
        statTagMatchThreshold: 0.5,
      },
      maxQueueSize: 50,
      enableDiagnostics: true,
      analytics: {
        enableChannel: true,
      },
    },
    metadata: {
      version: '1.0.0',
      region: 'Northern Plains',
      population: 25,
      activeActivities: 8,
    },
  },
  {
    id: 'village-beta',
    name: 'Village Beta',
    state: {
      residents: {},
      activities: {},
      currentTime: Date.now(),
    },
    schedulerConfig: {
      priorityWeights: {
        statTagMatch: 8.0,
        fatiguePenalty: -6.0,
        questUrgency: 15.0,
        specializationBonus: 7.0,
        difficultyBonus: 3.0,
        baseWeight: 1.0,
      },
      seeding: {
        lcgSeed: 1338,
        deterministic: false,
      },
      thresholds: {
        fatiguePenaltyThreshold: 0.8,
        questUrgencyThreshold: 2.5,
        statTagMatchThreshold: 0.6,
      },
      maxQueueSize: 40,
      enableDiagnostics: true,
      analytics: {
        enableChannel: true,
      },
    },
    metadata: {
      version: '1.0.0',
      region: 'Southern Hills',
      population: 30,
      activeActivities: 10,
    },
  },
  {
    id: 'village-gamma',
    name: 'Village Gamma',
    state: {
      residents: {},
      activities: {},
      currentTime: Date.now(),
    },
    schedulerConfig: {
      priorityWeights: {
        statTagMatch: 12.0,
        fatiguePenalty: -10.0,
        questUrgency: 10.0,
        specializationBonus: 4.0,
        difficultyBonus: 1.5,
        baseWeight: 1.0,
      },
      seeding: {
        lcgSeed: 1339,
        deterministic: false,
      },
      thresholds: {
        fatiguePenaltyThreshold: 0.6,
        questUrgencyThreshold: 3.5,
        statTagMatchThreshold: 0.4,
      },
      maxQueueSize: 60,
      enableDiagnostics: true,
      analytics: {
        enableChannel: true,
      },
    },
    metadata: {
      version: '1.0.0',
      region: 'Eastern Forest',
      population: 20,
      activeActivities: 6,
    },
  },
];

/**
 * Multi-Village Scheduler Monitor CLI
 */
export class MultiVillageSchedulerMonitorCLI {
  private monitor: MultiVillageSchedulerMonitor;
  private config: MonitorCLIConfig;

  constructor(config: MonitorCLIConfig) {
    this.config = { ...DEFAULT_MONITOR_CLI_CONFIG, ...config };
    this.monitor = new MultiVillageSchedulerMonitor({
      monitoringInterval: (this.config.interval || 30) * 1000,
    });
  }

  /**
   * Parses command line arguments
   */
  private parseArgs(args: string[]): MonitorCLIConfig {
    const parsed: MonitorCLIConfig = {
      command: 'monitor',
      format: 'table',
    };

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      switch (arg) {
        case 'monitor':
        case 'export':
        case 'compare':
        case 'alerts':
        case 'status':
          parsed.command = arg;
          break;
        case '--format':
        case '-f':
          parsed.format = args[++i] as 'json' | 'csv' | 'table';
          break;
        case '--output':
        case '-o':
          parsed.outputPath = args[++i];
          break;
        case '--duration':
        case '-d':
          parsed.duration = parseInt(args[++i], 10);
          break;
        case '--interval':
        case '-i':
          parsed.interval = parseInt(args[++i], 10);
          break;
        case '--window':
        case '-w':
          parsed.timeWindow = parseInt(args[++i], 10);
          break;
        case '--villages':
        case '-v':
          parsed.villageIds = args[++i].split(',');
          break;
        case '--configs':
        case '-c':
          parsed.villageConfigs = args[++i].split(',');
          break;
        case '--no-realtime':
          parsed.realTime = false;
          break;
        case '--pretty':
          parsed.prettyPrint = true;
          break;
        case '--delimiter':
          parsed.csvDelimiter = args[++i];
          break;
        case '--help':
        case '-h':
          this.showHelp();
          process.exit(0);
          break;
      }
    }

    return { ...DEFAULT_MONITOR_CLI_CONFIG, ...parsed };
  }

  /**
   * Shows help information
   */
  private showHelp(): void {
    console.log(`
Idle Village Multi-Village Scheduler Monitor CLI

Usage: multi-village-scheduler-monitor <command> [options]

Commands:
  monitor    Start real-time monitoring of village schedulers
  export     Export KPI data for analysis
  compare    Perform comparative analysis across villages
  alerts     Display active alerts
  status     Show monitor status and statistics

Options:
  -f, --format <format>        Output format (json|csv|table) [default: table]
  -o, --output <path>          Output file path
  -d, --duration <minutes>     Monitoring duration [default: 5]
  -i, --interval <seconds>     Monitoring interval [default: 30]
  -w, --window <minutes>       Analysis time window [default: 60]
  -v, --villages <ids>         Comma-separated village IDs to monitor
  -c, --configs <paths>        Comma-separated village config file paths
  --no-realtime               Disable real-time display
  --pretty                    Pretty print JSON output
  --delimiter <char>          CSV delimiter [default: ,]
  -h, --help                  Show this help message

Examples:
  multi-village-scheduler-monitor monitor --duration 10 --interval 15
  multi-village-scheduler-monitor export --format json --output kpis.json
  multi-village-scheduler-monitor compare --window 120 --format table
  multi-village-scheduler-monitor alerts --villages village-alpha,village-beta
  multi-village-scheduler-monitor status

Sample Villages:
  Available for demo: village-alpha, village-beta, village-gamma
`);
  }

  /**
   * Initializes sample villages for demonstration
   */
  private initializeSampleVillages(): void {
    SAMPLE_VILLAGES.forEach(village => {
      // Filter by requested village IDs if specified
      if (this.config.villageIds && !this.config.villageIds.includes(village.id)) {
        return;
      }

      // Populate with sample residents and activities
      village.state.residents = this.generateSampleResidents(village.metadata?.population || 25);
      village.state.activities = this.generateSampleActivities(village.metadata?.activeActivities || 8);

      this.monitor.registerVillage(village);
    });
  }

  /**
   * Generates sample residents for a village
   */
  private generateSampleResidents(count: number): Record<string, ResidentState> {
    const residents: Record<string, ResidentState> = {};

    for (let i = 0; i < count; i++) {
      const id = `resident-${i + 1}`;
      residents[id] = {
        id,
        name: `Resident ${i + 1}`,
        stats: {
          strength: 5 + Math.random() * 10,
          agility: 5 + Math.random() * 10,
          intelligence: 5 + Math.random() * 10,
          charisma: 5 + Math.random() * 10,
        },
        fatigue: Math.random(),
        currentActivity: Math.random() > 0.5 ? `activity-${Math.floor(Math.random() * 8) + 1}` : undefined,
        lastActivityEnd: Date.now() - Math.random() * 3600000,
        activityHistory: [],
        status: Math.random() > 0.8 ? 'injured' : 'healthy',
        location: 'village',
      };
    }

    return residents;
  }

  /**
   * Generates sample activities for a village
   */
  private generateSampleActivities(count: number): Record<string, ActivityDefinition> {
    const activityTypes = [
      { id: 'forest-work', name: 'Forest Work', category: 'gathering', requiredStats: ['strength'] },
      { id: 'mining', name: 'Mining', category: 'gathering', requiredStats: ['strength', 'agility'] },
      { id: 'farming', name: 'Farming', category: 'production', requiredStats: ['agility'] },
      { id: 'crafting', name: 'Crafting', category: 'production', requiredStats: ['intelligence'] },
      { id: 'guard-duty', name: 'Guard Duty', category: 'security', requiredStats: ['strength', 'agility'] },
      { id: 'research', name: 'Research', category: 'intellectual', requiredStats: ['intelligence'] },
      { id: 'teaching', name: 'Teaching', category: 'intellectual', requiredStats: ['intelligence', 'charisma'] },
      { id: 'healing', name: 'Healing', category: 'service', requiredStats: ['intelligence', 'charisma'] },
    ];

    const activities: Record<string, ActivityDefinition> = {};

    for (let i = 0; i < Math.min(count, activityTypes.length); i++) {
      const type = activityTypes[i];
      activities[type.id] = {
        id: type.id,
        name: type.name,
        category: type.category,
        description: `${type.name} activity`,
        duration: 1800000 + Math.random() * 1800000, // 30-60 minutes
        requiredStats: type.requiredStats,
        difficulty: 1 + Math.random() * 4,
        reward: {
          experience: Math.floor(10 + Math.random() * 20),
          resources: Math.random() > 0.5 ? { gold: Math.floor(5 + Math.random() * 15) } : undefined,
        },
        prerequisites: [],
        cooldown: 0,
        maxParticipants: Math.floor(3 + Math.random() * 7),
        location: 'village',
        priority: Math.floor(1 + Math.random() * 5),
      };
    }

    return activities;
  }

  /**
   * Executes the monitor command
   */
  private async executeMonitor(): Promise<void> {
    console.log('🏘️  Starting Multi-Village Scheduler Monitor...');
    console.log(`Duration: ${this.config.duration} minutes`);
    console.log(`Interval: ${this.config.interval} seconds`);
    console.log(`Real-time: ${this.config.realTime ? 'enabled' : 'disabled'}`);
    console.log('');

    this.initializeSampleVillages();

    const villages = this.monitor.getVillages();
    console.log(`Monitoring ${villages.length} villages:`);
    villages.forEach(village => {
      console.log(`  • ${village.name} (${village.id}) - ${village.metadata?.population} residents, ${village.metadata?.activeActivities} activities`);
    });
    console.log('');

    this.monitor.startMonitoring();

    const startTime = Date.now();
    const durationMs = (this.config.duration || 5) * 60 * 1000;

    // Real-time display loop
    if (this.config.realTime) {
      const displayInterval = setInterval(() => {
        this.displayRealTimeStatus();
      }, 5000);

      // Wait for monitoring duration
      await new Promise(resolve => setTimeout(resolve, durationMs));
      clearInterval(displayInterval);
    } else {
      // Just wait for the duration
      await new Promise(resolve => setTimeout(resolve, durationMs));
    }

    this.monitor.stopMonitoring();
    console.log('');
    console.log('✅ Monitoring completed.');

    // Show final summary
    this.displayFinalSummary();
  }

  /**
   * Displays real-time monitoring status
   */
  private displayRealTimeStatus(): void {
    console.clear();
    console.log('🏘️  Multi-Village Scheduler Monitor (Real-time)');
    console.log(`Time: ${new Date().toLocaleTimeString()}`);
    console.log('');

    const villages = this.monitor.getVillages();
    const alerts = this.monitor.getActiveAlerts();

    villages.forEach(village => {
      const kpis = this.monitor.getLatestKPIs(village.id);
      if (!kpis) return;

      console.log(`📍 ${village.name} (${village.id})`);
      console.log(`   Queue: ${kpis.queue.size}/${kpis.queue.maxSize} (${(kpis.queue.utilization * 100).toFixed(1)}%)`);
      console.log(`   Assignments: ${kpis.assignments.successful}/${kpis.assignments.total} (${(kpis.assignments.successRate * 100).toFixed(1)}%)`);
      console.log(`   Residents: ${kpis.residents.active}/${kpis.residents.total} active (${(kpis.residents.utilization * 100).toFixed(1)}%)`);
      console.log(`   Throughput: ${kpis.performance.throughput.toFixed(1)} assignments/min`);
      console.log('');
    });

    if (alerts.length > 0) {
      console.log('🚨 Active Alerts:');
      alerts.slice(0, 5).forEach(alert => {
        const severity = alert.severity === 'critical' ? '🔴' :
                        alert.severity === 'error' ? '🟠' :
                        alert.severity === 'warning' ? '🟡' : '🔵';
        console.log(`   ${severity} ${alert.message}`);
      });
      console.log('');
    }
  }

  /**
   * Displays final monitoring summary
   */
  private displayFinalSummary(): void {
    const villages = this.monitor.getVillages();
    const stats = this.monitor.getStats();
    const alerts = this.monitor.getActiveAlerts();

    console.log('📊 Final Summary:');
    console.log(`   Villages monitored: ${stats.villagesMonitored}`);
    console.log(`   Total KPIs collected: ${stats.totalKpisCollected}`);
    console.log(`   Active alerts: ${stats.activeAlerts}`);
    console.log(`   Monitoring uptime: ${Math.floor(stats.uptime / 1000)}s`);
    console.log('');

    if (alerts.length > 0) {
      console.log('🚨 Active Alerts:');
      alerts.forEach(alert => {
        const severity = alert.severity === 'critical' ? '🔴' :
                        alert.severity === 'error' ? '🟠' :
                        alert.severity === 'warning' ? '🟡' : '🔵';
        console.log(`   ${severity} ${alert.message}`);
      });
      console.log('');
    }

    // Show comparative analysis
    const analysis = this.monitor.performComparativeAnalysis((this.config.timeWindow || 60) * 60 * 1000);
    console.log('🏆 Comparative Analysis:');
    console.log(`   Best performing: ${analysis.summary.bestPerforming}`);
    console.log(`   Worst performing: ${analysis.summary.worstPerforming}`);
    console.log(`   Average efficiency: ${(analysis.summary.averageEfficiency * 100).toFixed(1)}%`);
    console.log(`   Performance variance: ${(analysis.summary.standardDeviation * 100).toFixed(1)}%`);

    if (analysis.recommendations.length > 0) {
      console.log('💡 Recommendations:');
      analysis.recommendations.forEach(rec => console.log(`   • ${rec}`));
    }
  }

  /**
   * Executes the export command
   */
  private async executeExport(): Promise<void> {
    console.log('📊 Exporting KPI data...');

    this.initializeSampleVillages();
    this.monitor.startMonitoring();

    // Wait a bit for data collection
    await new Promise(resolve => setTimeout(resolve, 10000));

    const villages = this.monitor.getVillages();
    const exportData: Record<string, SchedulerKPIs[]> = {};

    villages.forEach(village => {
      const history = this.monitor.getKPIHistory(village.id);
      exportData[village.id] = history;
    });

    this.monitor.stopMonitoring();

    const outputPath = this.config.outputPath || `multi-village-scheduler-kpis.${this.config.format}`;

    if (this.config.format === 'json') {
      const jsonData = JSON.stringify(exportData, null, this.config.prettyPrint ? 2 : 0);
      writeFileSync(outputPath, jsonData, 'utf8');
    } else if (this.config.format === 'csv') {
      const csvData = this.convertToCSV(exportData);
      writeFileSync(outputPath, csvData, 'utf8');
    }

    console.log(`✅ Exported data to: ${outputPath}`);
    console.log(`   Villages: ${villages.length}`);
    console.log(`   Total KPIs: ${Object.values(exportData).reduce((sum, kpis) => sum + kpis.length, 0)}`);
  }

  /**
   * Executes the compare command
   */
  private async executeCompare(): Promise<void> {
    console.log('🔍 Performing comparative analysis...');

    this.initializeSampleVillages();
    this.monitor.startMonitoring();

    // Wait for data collection
    await new Promise(resolve => setTimeout(resolve, 15000));

    const analysis = this.monitor.performComparativeAnalysis((this.config.timeWindow || 60) * 60 * 1000);

    this.monitor.stopMonitoring();

    if (this.config.format === 'json') {
      const outputPath = this.config.outputPath || 'comparative-analysis.json';
      const jsonData = JSON.stringify(analysis, null, this.config.prettyPrint ? 2 : 0);
      writeFileSync(outputPath, jsonData, 'utf8');
      console.log(`✅ Analysis exported to: ${outputPath}`);
    } else {
      this.displayComparativeAnalysis(analysis);
    }
  }

  /**
   * Executes the alerts command
   */
  private executeAlerts(): void {
    console.log('🚨 Checking active alerts...');

    this.initializeSampleVillages();

    // Generate some alerts by starting monitoring briefly
    this.monitor.startMonitoring();
    setTimeout(() => {
      this.monitor.stopMonitoring();
      this.displayAlerts();
    }, 5000);
  }

  /**
   * Executes the status command
   */
  private executeStatus(): void {
    console.log('📈 Monitor Status:');

    const stats = this.monitor.getStats();
    const villages = this.monitor.getVillages();
    const alerts = this.monitor.getActiveAlerts();

    console.log(`   Villages monitored: ${stats.villagesMonitored}`);
    console.log(`   Total KPIs collected: ${stats.totalKpisCollected}`);
    console.log(`   Active alerts: ${stats.activeAlerts}`);
    console.log(`   Monitoring active: ${stats.uptime > 0 ? 'Yes' : 'No'}`);
    if (stats.uptime > 0) {
      console.log(`   Uptime: ${Math.floor(stats.uptime / 1000)}s`);
      console.log(`   Last collection: ${new Date(stats.lastCollectionTime).toLocaleTimeString()}`);
    }

    if (villages.length > 0) {
      console.log('');
      console.log('🏘️  Villages:');
      villages.forEach(village => {
        const kpis = this.monitor.getLatestKPIs(village.id);
        console.log(`   • ${village.name} (${village.id}): ${kpis ? 'Active' : 'No data'}`);
      });
    }

    if (alerts.length > 0) {
      console.log('');
      console.log('🚨 Active Alerts:');
      alerts.forEach(alert => {
        const severity = alert.severity === 'critical' ? '🔴' :
                        alert.severity === 'error' ? '🟠' :
                        alert.severity === 'warning' ? '🟡' : '🔵';
        console.log(`   ${severity} ${alert.message}`);
      });
    }
  }

  /**
   * Displays alerts
   */
  private displayAlerts(): void {
    const alerts = this.monitor.getActiveAlerts();

    if (alerts.length === 0) {
      console.log('✅ No active alerts.');
      return;
    }

    console.log(`Found ${alerts.length} active alert(s):`);
    console.log('');

    alerts.forEach((alert, index) => {
      const severity = alert.severity === 'critical' ? '🔴 CRITICAL' :
                      alert.severity === 'error' ? '🟠 ERROR' :
                      alert.severity === 'warning' ? '🟡 WARNING' : '🔵 INFO';

      console.log(`${index + 1}. ${severity}`);
      console.log(`   Village: ${alert.villageId}`);
      console.log(`   Message: ${alert.message}`);
      console.log(`   Time: ${new Date(alert.timestamp).toLocaleString()}`);

      if (Object.keys(alert.context).length > 0) {
        console.log(`   Context: ${JSON.stringify(alert.context, null, 2)}`);
      }
      console.log('');
    });
  }

  /**
   * Displays comparative analysis
   */
  private displayComparativeAnalysis(analysis: ComparativeAnalysis): void {
    console.log('🏆 Comparative Analysis Results');
    console.log(`Analysis period: ${Math.floor(analysis.timeWindow / (60 * 1000))} minutes`);
    console.log(`Analysis time: ${new Date(analysis.timestamp).toLocaleString()}`);
    console.log('');

    console.log('📊 Summary:');
    console.log(`   Best performing village: ${analysis.summary.bestPerforming}`);
    console.log(`   Worst performing village: ${analysis.summary.worstPerforming}`);
    console.log(`   Average efficiency: ${(analysis.summary.averageEfficiency * 100).toFixed(1)}%`);
    console.log(`   Performance standard deviation: ${(analysis.summary.standardDeviation * 100).toFixed(1)}%`);
    console.log('');

    const metrics = ['queueEfficiency', 'assignmentSuccess', 'residentUtilization', 'throughput'] as const;
    const metricNames = {
      queueEfficiency: 'Queue Efficiency',
      assignmentSuccess: 'Assignment Success',
      residentUtilization: 'Resident Utilization',
      throughput: 'Throughput',
    };

    metrics.forEach(metric => {
      console.log(`📈 ${metricNames[metric]} Rankings:`);
      analysis.rankings[metric].forEach((ranking, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '📍';
        console.log(`   ${medal} #${ranking.rank} ${ranking.villageId}: ${(ranking.score * 100).toFixed(1)}${metric === 'throughput' ? '/min' : '%'}`);
      });
      console.log('');
    });

    if (analysis.recommendations.length > 0) {
      console.log('💡 Recommendations:');
      analysis.recommendations.forEach(rec => console.log(`   • ${rec}`));
      console.log('');
    }
  }

  /**
   * Converts KPI data to CSV format
   */
  private convertToCSV(data: Record<string, SchedulerKPIs[]>): string {
    const delimiter = this.config.csvDelimiter || ',';

    const headers = [
      'villageId',
      'timestamp',
      'queue_size',
      'queue_averageSize',
      'queue_maxSize',
      'queue_utilization',
      'assignments_total',
      'assignments_successful',
      'assignments_failed',
      'assignments_successRate',
      'assignments_averageDuration',
      'residents_total',
      'residents_active',
      'residents_idle',
      'residents_utilization',
      'residents_fatigue_low',
      'residents_fatigue_medium',
      'residents_fatigue_high',
      'residents_fatigue_critical',
      'activities_total',
      'activities_active',
      'activities_utilization',
      'performance_averageProcessingTime',
      'performance_throughput',
      'performance_efficiency',
      'performance_loadFactor',
    ];

    const rows: string[] = [headers.join(delimiter)];

    Object.entries(data).forEach(([villageId, kpis]) => {
      kpis.forEach(kpi => {
        const row = [
          villageId,
          new Date(kpi.timestamp).toISOString(),
          kpi.queue.size.toString(),
          kpi.queue.averageSize.toFixed(2),
          kpi.queue.maxSize.toString(),
          kpi.queue.utilization.toFixed(4),
          kpi.assignments.total.toString(),
          kpi.assignments.successful.toString(),
          kpi.assignments.failed.toString(),
          kpi.assignments.successRate.toFixed(4),
          kpi.assignments.averageDuration.toString(),
          kpi.residents.total.toString(),
          kpi.residents.active.toString(),
          kpi.residents.idle.toString(),
          kpi.residents.utilization.toFixed(4),
          kpi.residents.fatigueDistribution.low.toString(),
          kpi.residents.fatigueDistribution.medium.toString(),
          kpi.residents.fatigueDistribution.high.toString(),
          kpi.residents.fatigueDistribution.critical.toString(),
          kpi.activities.total.toString(),
          kpi.activities.active.toString(),
          kpi.activities.utilization.toFixed(4),
          kpi.performance.averageProcessingTime.toFixed(2),
          kpi.performance.throughput.toFixed(2),
          kpi.performance.efficiency.toFixed(4),
          kpi.performance.loadFactor.toFixed(4),
        ];
        rows.push(row.join(delimiter));
      });
    });

    return rows.join('\n');
  }

  /**
   * Runs the CLI
   */
  public async run(args: string[]): Promise<void> {
    try {
      this.config = this.parseArgs(args);

      switch (this.config.command) {
        case 'monitor':
          await this.executeMonitor();
          break;
        case 'export':
          await this.executeExport();
          break;
        case 'compare':
          await this.executeCompare();
          break;
        case 'alerts':
          this.executeAlerts();
          break;
        case 'status':
          this.executeStatus();
          break;
        default:
          console.error(`Unknown command: ${this.config.command}`);
          this.showHelp();
          process.exit(1);
      }
    } catch (error) {
      console.error('CLI execution failed:', error);
      process.exit(1);
    }
  }
}

/**
 * Main CLI entry point
 */
export async function main(): Promise<void> {
  const cli = new MultiVillageSchedulerMonitorCLI({} as MonitorCLIConfig);
  await cli.run(process.argv.slice(2));
}
