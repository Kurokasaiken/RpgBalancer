/**
 * Punch Club Log Processor
 * 
 * Processes Punch Club telemetry logs with schema validation and filtering.
 */

import { createSandboxDiagnostics } from '@/ui/idleVillage/utils/sandboxDiagnostics';

const logProcessorDiagnostics = createSandboxDiagnostics('PunchClubLogProcessor');

/**
 * Schema for Punch Club session log entry
 */
export const PunchClubLogEntrySchema = {
  timestamp: 'number',
  eventType: 'string',
  sessionId: 'string',
  payload: 'object',
  source: 'string',
  metadata: 'object',
};

export type PunchClubLogEntry = {
  timestamp: number;
  eventType: string;
  sessionId?: string;
  payload?: Record<string, unknown>;
  source?: string;
  metadata?: Record<string, unknown>;
};

/**
 * Schema for session metrics
 */
export const SessionMetricsSchema = {
  sessionId: 'string',
  startTime: 'number',
  endTime: 'number',
  duration: 'number',
  levelStart: 'number',
  levelEnd: 'number',
  experienceGained: 'number',
  moneyGained: 'number',
  combatsFought: 'number',
  combatsWon: 'number',
  combatsLost: 'number',
  trainingCompleted: 'number',
  statPointsAllocated: 'number',
  winRate: 'number',
  averageTurnsPerCombat: 'number',
  longestWinStreak: 'number',
  totalDamageDealt: 'number',
  totalDamageTaken: 'number',
  mostUsedMove: 'string',
  preferredTrainingType: 'string',
};

export type SessionMetrics = {
  sessionId: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  levelStart: number;
  levelEnd: number;
  experienceGained: number;
  moneyGained: number;
  combatsFought: number;
  combatsWon: number;
  combatsLost: number;
  trainingCompleted: number;
  statPointsAllocated: number;
  winRate: number;
  averageTurnsPerCombat: number;
  longestWinStreak: number;
  totalDamageDealt: number;
  totalDamageTaken: number;
  mostUsedMove?: string;
  preferredTrainingType?: string;
};

/**
 * Schema for session tag
 */
export const SessionTagSchema = {
  id: 'string',
  type: 'string',
  name: 'string',
  value: 'string|number|boolean',
  confidence: 'number',
  source: 'string',
  timestamp: 'number',
  metadata: 'object',
};

export type SessionTag = {
  id: string;
  type: string;
  name: string;
  value: string | number | boolean;
  confidence: number;
  source: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
};

/**
 * Schema for complete session data
 */
export const SessionDataSchema = {
  sessionId: 'string',
  metrics: 'object',
  tags: 'array',
  startTime: 'number',
  endTime: 'number',
  duration: 'number',
  events: 'array',
};

export type SessionData = {
  sessionId: string;
  metrics: SessionMetrics;
  tags: SessionTag[];
  startTime: number;
  endTime?: number;
  duration?: number;
  events: PunchClubLogEntry[];
};

/**
 * Processing options for log ingestion
 */
export interface LogProcessingOptions {
  /** Date range filter (start timestamp) */
  startDate?: number;
  /** Date range filter (end timestamp) */
  endDate?: number;
  /** Session ID filter */
  sessionId?: string;
  /** Event type filter */
  eventType?: string;
  /** Include only events with specified source */
  source?: string;
  /** Minimum confidence level for tags */
  minConfidence?: number;
  /** Maximum number of entries to process */
  maxEntries?: number;
  /** Sort order */
  sortOrder?: 'asc' | 'desc';
  /** Sort field */
  sortField?: 'timestamp' | 'eventType' | 'sessionId';
}

/**
 * Processing statistics
 */
export interface ProcessingStats {
  totalEntries: number;
  processedEntries: number;
  invalidEntries: number;
  filteredEntries: number;
  sessionsFound: number;
  tagsFound: number;
  processingTimeMs: number;
  errors: string[];
}

/**
 * KPI metrics extracted from processed data
 */
export interface KPIs {
  totalSessions: number;
  averageSessionDuration: number;
  totalCombats: number;
  overallWinRate: number;
  totalTags: number;
  tagsByType: Record<string, number>;
  eventTypes: Record<string, number>;
  sessionsByDate: Record<string, number>;
  averageTagsPerSession: number;
  topEventTypes: Array<{ type: string; count: number }>;
}

/**
 * Punch Club Log Processor class
 */
export class PunchClubLogProcessor {
  private entries: PunchClubLogEntry[] = [];
  private sessions: Map<string, SessionData> = new Map();
  private stats: ProcessingStats = {
    totalEntries: 0,
    processedEntries: 0,
    invalidEntries: 0,
    filteredEntries: 0,
    sessionsFound: 0,
    tagsFound: 0,
    processingTimeMs: 0,
    errors: [],
  };

  /**
   * Process log entries from a string or array
   */
  processLogs(logs: string | string[], options: LogProcessingOptions = {}): void {
    const startTime = Date.now();
    
    try {
      // Parse logs
      const logLines = Array.isArray(logs) ? logs : logs.split('\n').filter((line: string) => line.trim());
      this.stats.totalEntries = logLines.length;

      // Validate and parse each entry
      for (const line of logLines) {
        try {
          const entry = JSON.parse(line);
          
          // Basic validation
          if (!entry.timestamp || !entry.eventType) {
            this.stats.invalidEntries++;
            this.stats.errors.push(`Invalid entry: missing required fields`);
            continue;
          }
          
          // Apply filters
          if (this.shouldIncludeEntry(entry, options)) {
            this.entries.push(entry as PunchClubLogEntry);
            this.stats.processedEntries++;
          } else {
            this.stats.filteredEntries++;
          }
        } catch (error) {
          this.stats.invalidEntries++;
          this.stats.errors.push(`Invalid entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Group entries by session
      this.groupEntriesBySession();
      
      // Calculate final stats
      this.stats.processingTimeMs = Date.now() - startTime;
      this.stats.sessionsFound = this.sessions.size;
      this.stats.tagsFound = Array.from(this.sessions.values()).reduce((sum, session) => sum + session.tags.length, 0);

      logProcessorDiagnostics.info('processing_completed', {
        totalEntries: this.stats.totalEntries,
        processedEntries: this.stats.processedEntries,
        sessionsFound: this.stats.sessionsFound,
        processingTimeMs: this.stats.processingTimeMs,
      });

    } catch (error) {
      logProcessorDiagnostics.error('processing_failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      this.stats.errors.push(`Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if an entry should be included based on filters
   */
  private shouldIncludeEntry(entry: PunchClubLogEntry, options: LogProcessingOptions): boolean {
    // Date range filter
    if (options.startDate && entry.timestamp < options.startDate) return false;
    if (options.endDate && entry.timestamp > options.endDate) return false;

    // Session ID filter
    if (options.sessionId && entry.sessionId !== options.sessionId) return false;

    // Event type filter
    if (options.eventType && !entry.eventType.includes(options.eventType)) return false;

    // Source filter
    if (options.source && entry.source !== options.source) return false;

    return true;
  }

  /**
   * Group entries by session ID and extract session data
   */
  private groupEntriesBySession(): void {
    const sessionGroups = new Map<string, PunchClubLogEntry[]>();

    // Group entries by session
    for (const entry of this.entries) {
      const sessionId = entry.sessionId || 'unknown';
      if (!sessionGroups.has(sessionId)) {
        sessionGroups.set(sessionId, []);
      }
      sessionGroups.get(sessionId)!.push(entry);
    }

    // Process each session
    for (const [sessionId, sessionEntries] of sessionGroups) {
      const sessionData = this.extractSessionData(sessionId, sessionEntries);
      this.sessions.set(sessionId, sessionData);
    }
  }

  /**
   * Extract session data from grouped entries
   */
  private extractSessionData(sessionId: string, entries: PunchClubLogEntry[]): SessionData {
    const sortedEntries = entries.sort((a, b) => a.timestamp - b.timestamp);
    const startTime = sortedEntries[0]?.timestamp || Date.now();
    const endTime = sortedEntries[sortedEntries.length - 1]?.timestamp;

    // Extract metrics from entries
    const metrics = this.extractMetrics(sortedEntries);
    
    // Extract tags from entries
    const tags = this.extractTags(sortedEntries);

    return {
      sessionId,
      metrics,
      tags,
      startTime,
      endTime,
      duration: endTime ? endTime - startTime : undefined,
      events: sortedEntries,
    };
  }

  /**
   * Extract session metrics from entries
   */
  private extractMetrics(entries: PunchClubLogEntry[]): SessionMetrics {
    const defaultMetrics: SessionMetrics = {
      sessionId: entries[0]?.sessionId || 'unknown',
      startTime: entries[0]?.timestamp || Date.now(),
      levelStart: 1,
      levelEnd: 1,
      experienceGained: 0,
      moneyGained: 0,
      combatsFought: 0,
      combatsWon: 0,
      combatsLost: 0,
      trainingCompleted: 0,
      statPointsAllocated: 0,
      winRate: 0,
      averageTurnsPerCombat: 0,
      longestWinStreak: 0,
      totalDamageDealt: 0,
      totalDamageTaken: 0,
    };

    return entries.reduce((metrics, entry) => {
      const payload = entry.payload || {};
      
      // Update metrics based on event type
      switch (entry.eventType) {
        case 'combat_completed':
          metrics.combatsFought++;
          if (payload.won) {
            metrics.combatsWon++;
          } else {
            metrics.combatsLost++;
          }
          metrics.totalDamageDealt += (payload.damageDealt as number) || 0;
          metrics.totalDamageTaken += (payload.damageTaken as number) || 0;
          break;
          
        case 'level_up':
          metrics.levelEnd = (payload.newLevel as number) || metrics.levelEnd;
          break;
          
        case 'experience_gained':
          metrics.experienceGained += (payload.amount as number) || 0;
          break;
          
        case 'money_gained':
          metrics.moneyGained += (payload.amount as number) || 0;
          break;
          
        case 'training_completed':
          metrics.trainingCompleted++;
          break;
          
        case 'stat_points_allocated':
          metrics.statPointsAllocated += (payload.points as number) || 0;
          break;
      }

      return metrics;
    }, defaultMetrics);
  }

  /**
   * Extract tags from entries
   */
  private extractTags(entries: PunchClubLogEntry[]): SessionTag[] {
    const tags: SessionTag[] = [];

    for (const entry of entries) {
      if (entry.eventType === 'tag_added' && entry.payload) {
        try {
          const tag = {
            ...entry.payload,
            timestamp: entry.timestamp,
          } as SessionTag;
          tags.push(tag);
        } catch (error) {
          logProcessorDiagnostics.warning('invalid_tag_entry', {
            entryId: entry.timestamp,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    }

    return tags;
  }

  /**
   * Get processing statistics
   */
  getStats(): ProcessingStats {
    return { ...this.stats };
  }

  /**
   * Get processed sessions
   */
  getSessions(): SessionData[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Get processed entries
   */
  getEntries(): PunchClubLogEntry[] {
    return this.entries;
  }

  /**
   * Calculate KPIs from processed data
   */
  calculateKPIs(): KPIs {
    const sessions = this.getSessions();
    
    // Basic session metrics
    const totalSessions = sessions.length;
    const totalDuration = sessions.reduce((sum, session) => sum + (session.duration || 0), 0);
    const averageSessionDuration = totalSessions > 0 ? totalDuration / totalSessions : 0;

    // Combat metrics
    const totalCombats = sessions.reduce((sum, session) => sum + session.metrics.combatsFought, 0);
    const totalWins = sessions.reduce((sum, session) => sum + session.metrics.combatsWon, 0);
    const overallWinRate = totalCombats > 0 ? totalWins / totalCombats : 0;

    // Tag metrics
    const allTags = sessions.flatMap(session => session.tags);
    const tagsByType = allTags.reduce((acc, tag) => {
      acc[tag.type] = (acc[tag.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Event type metrics
    const eventTypes = this.entries.reduce((acc, entry) => {
      acc[entry.eventType] = (acc[entry.eventType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Sessions by date
    const sessionsByDate = sessions.reduce((acc, session) => {
      const date = new Date(session.startTime).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Top event types
    const topEventTypes = Object.entries(eventTypes)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([type, count]) => ({ type, count }));

    return {
      totalSessions,
      averageSessionDuration,
      totalCombats,
      overallWinRate,
      totalTags: allTags.length,
      tagsByType,
      eventTypes,
      sessionsByDate,
      averageTagsPerSession: totalSessions > 0 ? allTags.length / totalSessions : 0,
      topEventTypes,
    };
  }

  /**
   * Export data to JSON format
   */
  exportToJSON(): string {
    const exportData = {
      metadata: {
        exportTimestamp: Date.now(),
        stats: this.getStats(),
        kpis: this.calculateKPIs(),
      },
      sessions: this.getSessions(),
      entries: this.getEntries(),
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Export data to CSV format
   */
  exportToCSV(): string {
    const headers = [
      'timestamp',
      'eventType',
      'sessionId',
      'source',
      'payload',
    ];

    const rows = this.entries.map(entry => [
      entry.timestamp,
      entry.eventType,
      entry.sessionId || '',
      entry.source || '',
      JSON.stringify(entry.payload || {}),
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  /**
   * Export sessions to CSV format
   */
  exportSessionsToCSV(): string {
    const headers = [
      'sessionId',
      'startTime',
      'endTime',
      'duration',
      'levelStart',
      'levelEnd',
      'experienceGained',
      'moneyGained',
      'combatsFought',
      'combatsWon',
      'combatsLost',
      'winRate',
      'trainingCompleted',
      'statPointsAllocated',
      'totalTags',
    ];

    const rows = this.getSessions().map(session => [
      session.sessionId,
      session.startTime,
      session.endTime || '',
      session.duration || '',
      session.metrics.levelStart,
      session.metrics.levelEnd,
      session.metrics.experienceGained,
      session.metrics.moneyGained,
      session.metrics.combatsFought,
      session.metrics.combatsWon,
      session.metrics.combatsLost,
      session.metrics.winRate,
      session.metrics.trainingCompleted,
      session.metrics.statPointsAllocated,
      session.tags.length,
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  /**
   * Clear processed data
   */
  clear(): void {
    this.entries = [];
    this.sessions.clear();
    this.stats = {
      totalEntries: 0,
      processedEntries: 0,
      invalidEntries: 0,
      filteredEntries: 0,
      sessionsFound: 0,
      tagsFound: 0,
      processingTimeMs: 0,
      errors: [],
    };
  }
}

/**
 * Default export for convenience
 */
export const punchClubLogProcessor = new PunchClubLogProcessor();
