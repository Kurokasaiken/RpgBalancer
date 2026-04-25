/**
 * Idle Village Crew Scheduler CLI Export
 * 
 * Command-line interface for exporting crew scheduler data including
 * assignment timelines and rejection reasons. Supports JSON and CSV formats
 * with comprehensive analytics and filtering options.
 * 
 * @since NP-018
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type { CrewSchedulerConfig, CrewSchedulerDiagnostics } from '@/balancing/config/idleVillage/crewScheduler';

/**
 * Assignment event in the crew scheduler timeline
 */
export interface AssignmentEvent {
  /** Unique event identifier */
  id: string;
  /** Event timestamp (Unix ms) */
  timestamp: number;
  /** Event type */
  type: 'queued' | 'assigned' | 'skipped' | 'rejected' | 'completed';
  /** Resident identifier */
  residentId: string;
  /** Activity identifier */
  activityId: string;
  /** Priority score at time of event */
  priorityScore: number;
  /** Assignment factors */
  factors: {
    statTagMatch: number;
    fatigue: number;
    questUrgency: number;
    specialization: number;
    difficulty: number;
  };
  /** Event-specific data */
  data: {
    /** Reason for rejection/skip */
    reason?: string;
    /** Processing time in milliseconds */
    processingTime?: number;
    /** Queue position at time of event */
    queuePosition?: number;
    /** Assignment duration (for completed events) */
    duration?: number;
    /** Success metrics */
    successMetrics?: {
      efficiency: number;
      satisfaction: number;
      productivity: number;
    };
  };
  /** Session identifier for correlation */
  sessionId: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Crew scheduler export data structure
 */
export interface CrewSchedulerExport {
  /** Export metadata */
  metadata: {
    /** Export timestamp */
    exportedAt: string;
    /** Export version */
    version: string;
    /** Data source */
    source: string;
    /** Export configuration */
    config: ExportConfig;
    /** Session information */
    session: {
      id: string;
      startTime: string;
      endTime: string;
      duration: number;
    };
  };
  /** Configuration used */
  configuration: CrewSchedulerConfig;
  /** Assignment timeline */
  timeline: AssignmentEvent[];
  /** Summary statistics */
  summary: {
    /** Total events */
    totalEvents: number;
    /** Events by type */
    eventsByType: Record<string, number>;
    /** Events by resident */
    eventsByResident: Record<string, number>;
    /** Events by activity */
    eventsByActivity: Record<string, number>;
    /** Rejection analysis */
    rejectionAnalysis: {
      totalRejections: number;
      rejectionRate: number;
      topRejectionReasons: Array<{
        reason: string;
        count: number;
        percentage: number;
      }>;
      rejectionByResident: Record<string, number>;
      rejectionByActivity: Record<string, number>;
    };
    /** Performance metrics */
    performanceMetrics: {
      averageProcessingTime: number;
      averagePriorityScore: number;
      averageAssignmentDuration: number;
      queueEfficiency: number;
      residentUtilization: Record<string, number>;
      activityUtilization: Record<string, number>;
    };
    /** Timeline statistics */
    timelineStats: {
      earliestEvent: string;
      latestEvent: string;
      peakActivityTime: string;
      averageEventsPerHour: number;
      busiestHour: number;
    };
  };
}

/**
 * Export configuration options
 */
export interface ExportConfig {
  /** Export format */
  format: 'json' | 'csv';
  /** Time range filter */
  timeRange?: {
    startTime?: string;
    endTime?: string;
  };
  /** Event type filter */
  eventTypes?: AssignmentEvent['type'][];
  /** Resident filter */
  residentIds?: string[];
  /** Activity filter */
  activityIds?: string[];
  /** Include detailed factors */
  includeFactors?: boolean;
  /** Include performance metrics */
  includePerformanceMetrics?: boolean;
  /** Include rejection analysis */
  includeRejectionAnalysis?: boolean;
  /** Output file path */
  outputPath?: string;
  /** Pretty print JSON */
  prettyPrint?: boolean;
  /** CSV delimiter */
  csvDelimiter?: string;
}

/**
 * Default export configuration
 */
export const DEFAULT_EXPORT_CONFIG: ExportConfig = {
  format: 'json',
  includeFactors: true,
  includePerformanceMetrics: true,
  includeRejectionAnalysis: true,
  prettyPrint: true,
  csvDelimiter: ',',
};

/**
 * Crew Scheduler Export Engine
 */
export class CrewSchedulerExportEngine {
  private config: ExportConfig;
  private sessionId: string;
  private startTime: number;

  constructor(config: Partial<ExportConfig> = {}) {
    this.config = { ...DEFAULT_EXPORT_CONFIG, ...config };
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
  }

  /**
   * Generates a unique session identifier
   */
  private generateSessionId(): string {
    return `export-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Creates a mock assignment event for testing
   */
  private createMockEvent(
    type: AssignmentEvent['type'],
    residentId: string,
    activityId: string,
    timestamp: number,
    priorityScore: number
  ): AssignmentEvent {
    const factors = {
      statTagMatch: Math.random(),
      fatigue: Math.random(),
      questUrgency: Math.random() * 5,
      specialization: Math.random(),
      difficulty: Math.random() * 3,
    };

    const data: AssignmentEvent['data'] = {
      queuePosition: Math.floor(Math.random() * 10) + 1,
      processingTime: Math.random() * 100,
    };

    if (type === 'rejected' || type === 'skipped') {
      const reasons = [
        'Resident too exhausted',
        'Poor stat match for activity',
        'Activity at maximum capacity',
        'Quest time expired',
        'Resident unavailable',
        'Activity locked',
        'Insufficient specialization',
        'High fatigue penalty',
      ];
      data.reason = reasons[Math.floor(Math.random() * reasons.length)];
    }

    if (type === 'completed') {
      data.duration = Math.random() * 3600000; // Up to 1 hour
      data.successMetrics = {
        efficiency: Math.random(),
        satisfaction: Math.random() * 5,
        productivity: Math.random() * 100,
      };
    }

    return {
      id: `event-${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp,
      type,
      residentId,
      activityId,
      priorityScore,
      factors,
      data,
      sessionId: this.sessionId,
    };
  }

  /**
   * Generates sample assignment timeline for demonstration
   */
  private generateSampleTimeline(residentIds: string[], activityIds: string[]): AssignmentEvent[] {
    const events: AssignmentEvent[] = [];
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);

    // Generate events over the past 24 hours
    for (let i = 0; i < 500; i++) {
      const timestamp = oneDayAgo + Math.random() * (24 * 60 * 60 * 1000);
      const residentId = residentIds[Math.floor(Math.random() * residentIds.length)];
      const activityId = activityIds[Math.floor(Math.random() * activityIds.length)];
      const priorityScore = Math.random() * 20 - 5; // -5 to 15

      // Weight event types towards more assignments
      const rand = Math.random();
      let type: AssignmentEvent['type'];
      if (rand < 0.6) {
        type = 'assigned';
      } else if (rand < 0.8) {
        type = 'queued';
      } else if (rand < 0.9) {
        type = 'rejected';
      } else if (rand < 0.95) {
        type = 'skipped';
      } else {
        type = 'completed';
      }

      events.push(this.createMockEvent(type, residentId, activityId, timestamp, priorityScore));
    }

    // Sort by timestamp
    events.sort((a, b) => a.timestamp - b.timestamp);

    return events;
  }

  /**
   * Filters events based on configuration
   */
  private filterEvents(events: AssignmentEvent[]): AssignmentEvent[] {
    let filtered = [...events];

    // Time range filter
    if (this.config.timeRange) {
      const startTime = this.config.timeRange.startTime 
        ? new Date(this.config.timeRange.startTime).getTime()
        : 0;
      const endTime = this.config.timeRange.endTime
        ? new Date(this.config.timeRange.endTime).getTime()
        : Date.now();

      filtered = filtered.filter(event => 
        event.timestamp >= startTime && event.timestamp <= endTime
      );
    }

    // Event type filter
    if (this.config.eventTypes && this.config.eventTypes.length > 0) {
      filtered = filtered.filter(event => 
        this.config.eventTypes!.includes(event.type)
      );
    }

    // Resident filter
    if (this.config.residentIds && this.config.residentIds.length > 0) {
      filtered = filtered.filter(event => 
        this.config.residentIds!.includes(event.residentId)
      );
    }

    // Activity filter
    if (this.config.activityIds && this.config.activityIds.length > 0) {
      filtered = filtered.filter(event => 
        this.config.activityIds!.includes(event.activityId)
      );
    }

    return filtered;
  }

  /**
   * Calculates summary statistics from events
   */
  private calculateSummary(events: AssignmentEvent[]): CrewSchedulerExport['summary'] {
    const summary: CrewSchedulerExport['summary'] = {
      totalEvents: events.length,
      eventsByType: {},
      eventsByResident: {},
      eventsByActivity: {},
      rejectionAnalysis: {
        totalRejections: 0,
        rejectionRate: 0,
        topRejectionReasons: [],
        rejectionByResident: {},
        rejectionByActivity: {},
      },
      performanceMetrics: {
        averageProcessingTime: 0,
        averagePriorityScore: 0,
        averageAssignmentDuration: 0,
        queueEfficiency: 0,
        residentUtilization: {},
        activityUtilization: {},
      },
      timelineStats: {
        earliestEvent: '',
        latestEvent: '',
        peakActivityTime: '',
        averageEventsPerHour: 0,
        busiestHour: 0,
      },
    };

    // Count events by type
    events.forEach(event => {
      summary.eventsByType[event.type] = (summary.eventsByType[event.type] || 0) + 1;
      summary.eventsByResident[event.residentId] = (summary.eventsByResident[event.residentId] || 0) + 1;
      summary.eventsByActivity[event.activityId] = (summary.eventsByActivity[event.activityId] || 0) + 1;

      // Rejection analysis
      if (event.type === 'rejected' || event.type === 'skipped') {
        summary.rejectionAnalysis.totalRejections++;
        summary.rejectionAnalysis.rejectionByResident[event.residentId] = 
          (summary.rejectionAnalysis.rejectionByResident[event.residentId] || 0) + 1;
        summary.rejectionAnalysis.rejectionByActivity[event.activityId] = 
          (summary.rejectionAnalysis.rejectionByActivity[event.activityId] || 0) + 1;

        if (event.data.reason) {
          // This would be tracked in a more complete implementation
        }
      }

      // Performance metrics
      if (event.data.processingTime) {
        summary.performanceMetrics.averageProcessingTime += event.data.processingTime;
      }
      summary.performanceMetrics.averagePriorityScore += event.priorityScore;

      if (event.type === 'completed' && event.data.duration) {
        summary.performanceMetrics.averageAssignmentDuration += event.data.duration;
      }
    });

    // Calculate averages
    const totalEvents = events.length;
    if (totalEvents > 0) {
      summary.performanceMetrics.averageProcessingTime /= totalEvents;
      summary.performanceMetrics.averagePriorityScore /= totalEvents;
      
      const completedEvents = events.filter(e => e.type === 'completed');
      if (completedEvents.length > 0) {
        summary.performanceMetrics.averageAssignmentDuration /= completedEvents.length;
      }

      summary.rejectionAnalysis.rejectionRate = summary.rejectionAnalysis.totalRejections / totalEvents;
    }

    // Timeline statistics
    if (events.length > 0) {
      const timestamps = events.map(e => e.timestamp);
      const earliest = Math.min(...timestamps);
      const latest = Math.max(...timestamps);

      summary.timelineStats.earliestEvent = new Date(earliest).toISOString();
      summary.timelineStats.latestEvent = new Date(latest).toISOString();

      // Calculate events per hour
      const hourGroups: Record<number, number> = {};
      events.forEach(event => {
        const hour = new Date(event.timestamp).getHours();
        hourGroups[hour] = (hourGroups[hour] || 0) + 1;
      });

      const hours = Object.keys(hourGroups).map(Number);
      const totalHours = hours.length || 1;
      summary.timelineStats.averageEventsPerHour = totalEvents / totalHours;

      // Find busiest hour
      let maxEvents = 0;
      hours.forEach(hour => {
        if (hourGroups[hour] > maxEvents) {
          maxEvents = hourGroups[hour];
          summary.timelineStats.busiestHour = hour;
        }
      });

      summary.timelineStats.peakActivityTime = `${summary.timelineStats.busiestHour}:00`;
    }

    return summary;
  }

  /**
   * Creates sample configuration
   */
  private createSampleConfiguration(): CrewSchedulerConfig {
    return {
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
    };
  }

  /**
   * Exports crew scheduler data
   */
  public async exportData(
    residentIds: string[] = [],
    activityIds: string[] = []
  ): Promise<CrewSchedulerExport> {
    // Generate sample data (in real implementation, this would come from actual scheduler)
    const timeline = this.generateSampleTimeline(
      residentIds.length > 0 ? residentIds : [
        'resident-1', 'resident-2', 'resident-3', 'resident-4', 'resident-5',
        'resident-6', 'resident-7', 'resident-8', 'resident-9', 'resident-10'
      ],
      activityIds.length > 0 ? activityIds : [
        'forest-work', 'mining', 'farming', 'crafting', 'guard-duty',
        'research', 'teaching', 'healing', 'construction', 'hunting'
      ]
    );

    // Filter events based on configuration
    const filteredTimeline = this.filterEvents(timeline);

    // Calculate summary statistics
    const summary = this.calculateSummary(filteredTimeline);

    const endTime = Date.now();

    return {
      metadata: {
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        source: 'Idle Village Crew Scheduler',
        config: this.config,
        session: {
          id: this.sessionId,
          startTime: new Date(this.startTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
          duration: endTime - this.startTime,
        },
      },
      configuration: this.createSampleConfiguration(),
      timeline: filteredTimeline,
      summary,
    };
  }

  /**
   * Exports data to JSON format
   */
  public async exportToJson(
    residentIds: string[] = [],
    activityIds: string[] = []
  ): Promise<string> {
    const data = await this.exportData(residentIds, activityIds);
    
    return JSON.stringify(data, null, this.config.prettyPrint ? 2 : 0);
  }

  /**
   * Exports data to CSV format
   */
  public async exportToCsv(
    residentIds: string[] = [],
    activityIds: string[] = []
  ): Promise<string> {
    const data = await this.exportData(residentIds, activityIds);
    const delimiter = this.config.csvDelimiter || ',';

    // CSV headers
    const headers = [
      'timestamp',
      'type',
      'residentId',
      'activityId',
      'priorityScore',
      'statTagMatch',
      'fatigue',
      'questUrgency',
      'specialization',
      'difficulty',
      'reason',
      'processingTime',
      'queuePosition',
      'duration',
      'efficiency',
      'satisfaction',
      'productivity',
      'sessionId',
    ];

    // Convert events to CSV rows
    const rows = data.timeline.map(event => [
      new Date(event.timestamp).toISOString(),
      event.type,
      event.residentId,
      event.activityId,
      event.priorityScore.toFixed(2),
      event.factors.statTagMatch.toFixed(3),
      event.factors.fatigue.toFixed(3),
      event.factors.questUrgency.toFixed(2),
      event.factors.specialization.toFixed(3),
      event.factors.difficulty.toFixed(2),
      event.data.reason || '',
      event.data.processingTime?.toFixed(2) || '',
      event.data.queuePosition?.toString() || '',
      event.data.duration?.toString() || '',
      event.data.successMetrics?.efficiency.toFixed(3) || '',
      event.data.successMetrics?.satisfaction.toFixed(2) || '',
      event.data.successMetrics?.productivity.toFixed(2) || '',
      event.sessionId,
    ]);

    // Combine headers and rows
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(delimiter))
      .join('\n');

    return csvContent;
  }

  /**
   * Saves export to file
   */
  public async saveToFile(
    filePath: string,
    residentIds: string[] = [],
    activityIds: string[] = []
  ): Promise<void> {
    const outputPath = filePath || this.config.outputPath || 'crew-scheduler-export';
    const extension = this.config.format === 'csv' ? '.csv' : '.json';
    const fullPath = `${outputPath}${extension}`;

    let content: string;
    if (this.config.format === 'csv') {
      content = await this.exportToCsv(residentIds, activityIds);
    } else {
      content = await this.exportToJson(residentIds, activityIds);
    }

    writeFileSync(fullPath, content, 'utf8');
    console.log(`Export saved to: ${fullPath}`);
  }

  /**
   * Updates export configuration
   */
  public updateConfig(newConfig: Partial<ExportConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Gets current configuration
   */
  public getConfig(): ExportConfig {
    return { ...this.config };
  }

  /**
   * Gets current session ID
   */
  public getSessionId(): string {
    return this.sessionId;
  }
}

/**
 * CLI interface for crew scheduler export
 */
export class CrewSchedulerCLI {
  private exportEngine: CrewSchedulerExportEngine;

  constructor() {
    this.exportEngine = new CrewSchedulerExportEngine();
  }

  /**
   * Parses command line arguments
   */
  private parseArgs(args: string[]): {
    format: 'json' | 'csv';
    outputPath?: string;
    residentIds?: string[];
    activityIds?: string[];
    eventTypes?: string[];
    startTime?: string;
    endTime?: string;
    help: boolean;
  } {
    const parsed = {
      format: 'json' as 'json' | 'csv',
      outputPath: undefined as string | undefined,
      residentIds: undefined as string[] | undefined,
      activityIds: undefined as string[] | undefined,
      eventTypes: undefined as string[] | undefined,
      startTime: undefined as string | undefined,
      endTime: undefined as string | undefined,
      help: false,
    };

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      switch (arg) {
        case '--format':
        case '-f':
          parsed.format = args[++i] as 'json' | 'csv';
          break;
        case '--output':
        case '-o':
          parsed.outputPath = args[++i];
          break;
        case '--residents':
        case '-r':
          parsed.residentIds = args[++i].split(',');
          break;
        case '--activities':
        case '-a':
          parsed.activityIds = args[++i].split(',');
          break;
        case '--events':
        case '-e':
          parsed.eventTypes = args[++i].split(',');
          break;
        case '--start':
        case '-s':
          parsed.startTime = args[++i];
          break;
        case '--end':
        case '-t':
          parsed.endTime = args[++i];
          break;
        case '--help':
        case '-h':
          parsed.help = true;
          break;
      }
    }

    return parsed;
  }

  /**
   * Shows help information
   */
  private showHelp(): void {
    console.log(`
Idle Village Crew Scheduler CLI Export

Usage: crew-scheduler-export [options]

Options:
  -f, --format <format>        Export format (json|csv) [default: json]
  -o, --output <path>          Output file path [default: crew-scheduler-export.<format>]
  -r, --residents <ids>        Comma-separated resident IDs to filter
  -a, --activities <ids>       Comma-separated activity IDs to filter
  -e, --events <types>         Comma-separated event types to filter
  -s, --start <time>           Start time filter (ISO string)
  -t, --end <time>             End time filter (ISO string)
  -h, --help                   Show this help message

Examples:
  crew-scheduler-export --format json --output scheduler-data.json
  crew-scheduler-export --format csv --residents resident-1,resident-2
  crew-scheduler-export --events assigned,rejected --start "2026-01-01T00:00:00Z"
  crew-scheduler-export --format csv --activities forest-work,mining --output daily-report.csv

Event Types:
  queued      - Task added to queue
  assigned    - Task successfully assigned
  rejected    - Task rejected due to constraints
  skipped     - Task skipped during processing
  completed   - Task completed successfully

Output Formats:
  JSON - Complete export with all metadata and analysis
  CSV  - Tabular format for spreadsheet analysis
`);
  }

  /**
   * Runs the CLI export
   */
  public async run(args: string[]): Promise<void> {
    const parsed = this.parseArgs(args);

    if (parsed.help) {
      this.showHelp();
      return;
    }

    // Update export engine configuration
    this.exportEngine.updateConfig({
      format: parsed.format,
      outputPath: parsed.outputPath,
      residentIds: parsed.residentIds,
      activityIds: parsed.activityIds,
      eventTypes: parsed.eventTypes as AssignmentEvent['type'][],
      timeRange: {
        startTime: parsed.startTime,
        endTime: parsed.endTime,
      },
    });

    try {
      console.log('Starting crew scheduler export...');
      console.log(`Format: ${parsed.format.toUpperCase()}`);
      console.log(`Session: ${this.exportEngine.getSessionId()}`);

      if (parsed.residentIds) {
        console.log(`Filtering residents: ${parsed.residentIds.join(', ')}`);
      }
      if (parsed.activityIds) {
        console.log(`Filtering activities: ${parsed.activityIds.join(', ')}`);
      }
      if (parsed.eventTypes) {
        console.log(`Filtering events: ${parsed.eventTypes.join(', ')}`);
      }

      // Export data
      const data = await this.exportEngine.exportData(
        parsed.residentIds || [],
        parsed.activityIds || []
      );

      console.log(`Exported ${data.timeline.length} events`);
      console.log(`Time range: ${data.summary.timelineStats.earliestEvent} to ${data.summary.timelineStats.latestEvent}`);
      console.log(`Rejection rate: ${(data.summary.rejectionAnalysis.rejectionRate * 100).toFixed(1)}%`);
      console.log(`Average processing time: ${data.summary.performanceMetrics.averageProcessingTime.toFixed(2)}ms`);

      // Save to file
      await this.exportEngine.saveToFile(
        parsed.outputPath,
        parsed.residentIds || [],
        parsed.activityIds || []
      );

      console.log('Export completed successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      process.exit(1);
    }
  }
}

/**
 * Main CLI entry point
 */
export async function main(): Promise<void> {
  const cli = new CrewSchedulerCLI();
  await cli.run(process.argv.slice(2));
}
