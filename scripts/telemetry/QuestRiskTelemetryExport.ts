#!/usr/bin/env tsx

/**
 * NP-028 – Idle Village Quest Risk Telemetry Export CLI
 * 
 * CLI export telemetria risk (injury/death) in CSV/JSON con filtri e schema.
 * Exports quest risk telemetry data with injury/death statistics, filtering,
 * and comprehensive schema validation.
 * 
 * @since 2026-01-13
 * @author Cascade
 */

import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { execSync } from 'child_process';

// Types for quest risk telemetry
interface QuestRiskEvent {
  id: string;
  timestamp: number;
  questId: string;
  questName: string;
  questType: 'exploration' | 'combat' | 'diplomacy' | 'crafting' | 'social';
  residentId: string;
  residentName: string;
  residentLevel: number;
  eventType: 'injury' | 'death' | 'near_miss' | 'recovery';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  injuryType?: string;
  injurySeverity?: 'minor' | 'moderate' | 'severe' | 'fatal';
  causeOfDeath?: string;
  location: string;
  environmentalFactors: string[];
  mitigatingFactors: string[];
  outcome: 'survived' | 'died' | 'recovered' | 'permanent_injury';
  recoveryTime?: number; // in days
  medicalCost?: number;
  questImpact: 'none' | 'delayed' | 'failed' | 'abandoned';
  teamImpact: 'none' | 'morale_drop' | 'team_disbanded' | 'replacement_needed';
  metadata: {
    sessionId: string;
    deviceId: string;
    gameVersion: string;
    difficulty: 'easy' | 'normal' | 'hard' | 'nightmare';
    weather?: string;
    timeOfDay: 'dawn' | 'day' | 'dusk' | 'night';
  };
}

interface QuestRiskFilter {
  questTypes?: QuestRiskEvent['questType'][];
  eventTypes?: QuestRiskEvent['eventType'][];
  riskLevels?: QuestRiskEvent['riskLevel'][];
  outcomes?: QuestRiskEvent['outcome'][];
  questImpacts?: QuestRiskEvent['questImpact'][];
  residentLevels?: { min?: number; max?: number };
  dateRange?: { start: Date; end: Date };
  residentIds?: string[];
  questIds?: string[];
  locations?: string[];
  injuryTypes?: string[];
  difficulties?: QuestRiskEvent['metadata']['difficulty'][];
  timeOfDay?: QuestRiskEvent['metadata']['timeOfDay'][];
  environmentalFactors?: string[];
  mitigatingFactors?: string[];
}

interface QuestRiskAggregation {
  totalEvents: number;
  injuryEvents: number;
  deathEvents: number;
  nearMissEvents: number;
  recoveryEvents: number;
  survivalRate: number;
  mortalityRate: number;
  injuryRate: number;
  averageRecoveryTime: number;
  totalMedicalCost: number;
  averageMedicalCost: number;
  questFailureRate: number;
  eventsByQuestType: Record<string, number>;
  eventsByRiskLevel: Record<string, number>;
  eventsByLocation: Record<string, number>;
  eventsByDifficulty: Record<string, number>;
  eventsByTimeOfDay: Record<string, number>;
  topInjuryTypes: Array<{ type: string; count: number; severity: string }>;
  topCausesOfDeath: Array<{ cause: string; count: number }>;
  riskLevelDistribution: Record<string, number>;
  outcomeDistribution: Record<string, number>;
}

interface ExportConfig {
  sourceDirectory: string;
  outputDirectory: string;
  outputFormat: 'csv' | 'json' | 'both';
  filename?: string;
  includeAggregation: boolean;
  includeRawData: boolean;
  compression: boolean;
  schema: {
    validate: boolean;
    strict: boolean;
  };
  filters: QuestRiskFilter;
  aggregation: {
    groupBy: 'questType' | 'riskLevel' | 'location' | 'difficulty' | 'timeOfDay' | 'none';
    includePercentages: boolean;
    includeTrends: boolean;
  };
}

// Default configuration
const DEFAULT_CONFIG: ExportConfig = {
  sourceDirectory: join(process.cwd(), 'data/telemetry/quest_risk'),
  outputDirectory: join(process.cwd(), 'data/exports/quest_risk'),
  outputFormat: 'both',
  includeAggregation: true,
  includeRawData: true,
  compression: false,
  schema: {
    validate: true,
    strict: false,
  },
  filters: {},
  aggregation: {
    groupBy: 'none',
    includePercentages: true,
    includeTrends: false,
  },
};

class QuestRiskTelemetryExport {
  private config: ExportConfig;
  private events: QuestRiskEvent[] = [];
  private startTime: number;

  constructor(config?: Partial<ExportConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.startTime = Date.now();
    
    // Ensure output directory exists
    if (!existsSync(this.config.outputDirectory)) {
      mkdirSync(this.config.outputDirectory, { recursive: true });
    }
  }

  /**
   * Load quest risk telemetry data
   */
  private async loadTelemetryData(): Promise<void> {
    console.log('📊 Loading quest risk telemetry data...');
    
    if (!existsSync(this.config.sourceDirectory)) {
      console.log('📝 Creating sample telemetry data...');
      this.createSampleData();
      return;
    }

    // Load all JSON files from source directory
    const files = this.getTelemetryFiles();
    
    for (const file of files) {
      try {
        const content = readFileSync(file, 'utf8');
        const data = JSON.parse(content);
        
        if (Array.isArray(data)) {
          this.events.push(...data);
        } else if (data.events && Array.isArray(data.events)) {
          this.events.push(...data.events);
        }
      } catch (error) {
        console.warn(`⚠️  Warning: Could not parse file ${file}:`, error);
      }
    }
    
    console.log(`✅ Loaded ${this.events.length} quest risk events from ${files.length} files`);
  }

  /**
   * Get telemetry files from source directory
   */
  private getTelemetryFiles(): string[] {
    try {
      const output = execSync(`find "${this.config.sourceDirectory}" -name "*.json" -o -name "*.jsonl"`, {
        encoding: 'utf8',
        cwd: process.cwd(),
      });
      
      return output.split('\n').filter(file => file.trim());
    } catch (error) {
      console.warn('Could not use find command, no telemetry files found');
      return [];
    }
  }

  /**
   * Create sample telemetry data for testing
   */
  private createSampleData(): void {
    const sampleEvents: QuestRiskEvent[] = [
      {
        id: 'qr_001',
        timestamp: Date.now() - 86400000, // 1 day ago
        questId: 'quest_001',
        questName: 'Forest Exploration',
        questType: 'exploration',
        residentId: 'resident_001',
        residentName: 'John Smith',
        residentLevel: 5,
        eventType: 'injury',
        riskLevel: 'medium',
        injuryType: 'sprained_ankle',
        injurySeverity: 'moderate',
        location: 'Dark Forest',
        environmentalFactors: ['rain', 'uneven_terrain'],
        mitigatingFactors: ['proper_equipment', 'cautious_approach'],
        outcome: 'recovered',
        recoveryTime: 7,
        medicalCost: 50,
        questImpact: 'delayed',
        teamImpact: 'morale_drop',
        metadata: {
          sessionId: 'session_001',
          deviceId: 'device_001',
          gameVersion: '1.2.0',
          difficulty: 'normal',
          weather: 'rain',
          timeOfDay: 'day',
        },
      },
      {
        id: 'qr_002',
        timestamp: Date.now() - 172800000, // 2 days ago
        questId: 'quest_002',
        questName: 'Dragon Hunt',
        questType: 'combat',
        residentId: 'resident_002',
        residentName: 'Jane Doe',
        residentLevel: 8,
        eventType: 'death',
        riskLevel: 'critical',
        causeOfDeath: 'dragon_breath',
        location: 'Dragon Lair',
        environmentalFactors: ['fire', 'confined_space'],
        mitigatingFactors: ['fire_resistance_potion', 'team_support'],
        outcome: 'died',
        questImpact: 'failed',
        teamImpact: 'replacement_needed',
        metadata: {
          sessionId: 'session_002',
          deviceId: 'device_001',
          gameVersion: '1.2.0',
          difficulty: 'hard',
          timeOfDay: 'night',
        },
      },
      {
        id: 'qr_003',
        timestamp: Date.now() - 259200000, // 3 days ago
        questId: 'quest_003',
        questName: 'Diplomatic Mission',
        questType: 'diplomacy',
        residentId: 'resident_003',
        residentName: 'Bob Johnson',
        residentLevel: 3,
        eventType: 'near_miss',
        riskLevel: 'low',
        location: 'Royal Court',
        environmentalFactors: ['political_tension'],
        mitigatingFactors: ['diplomatic_training', 'guard_presence'],
        outcome: 'survived',
        questImpact: 'none',
        teamImpact: 'none',
        metadata: {
          sessionId: 'session_003',
          deviceId: 'device_002',
          gameVersion: '1.2.0',
          difficulty: 'easy',
          timeOfDay: 'day',
        },
      },
    ];

    // Create source directory and save sample data
    if (!existsSync(this.config.sourceDirectory)) {
      mkdirSync(this.config.sourceDirectory, { recursive: true });
    }

    const sampleFile = join(this.config.sourceDirectory, 'sample_quest_risk.json');
    writeFileSync(sampleFile, JSON.stringify({ events: sampleEvents }, null, 2));
    
    this.events = sampleEvents;
    console.log(`✅ Created sample data with ${sampleEvents.length} events`);
  }

  /**
   * Apply filters to telemetry data
   */
  private applyFilters(events: QuestRiskEvent[]): QuestRiskEvent[] {
    const { filters } = this.config;
    
    return events.filter(event => {
      // Quest type filter
      if (filters.questTypes && !filters.questTypes.includes(event.questType)) {
        return false;
      }
      
      // Event type filter
      if (filters.eventTypes && !filters.eventTypes.includes(event.eventType)) {
        return false;
      }
      
      // Risk level filter
      if (filters.riskLevels && !filters.riskLevels.includes(event.riskLevel)) {
        return false;
      }
      
      // Outcome filter
      if (filters.outcomes && !filters.outcomes.includes(event.outcome)) {
        return false;
      }
      
      // Quest impact filter
      if (filters.questImpacts && !filters.questImpacts.includes(event.questImpact)) {
        return false;
      }
      
      // Resident level filter
      if (filters.residentLevels) {
        const { min, max } = filters.residentLevels;
        if (min !== undefined && event.residentLevel < min) return false;
        if (max !== undefined && event.residentLevel > max) return false;
      }
      
      // Date range filter
      if (filters.dateRange) {
        const { start, end } = filters.dateRange;
        if (event.timestamp < start.getTime()) return false;
        if (event.timestamp > end.getTime()) return false;
      }
      
      // Resident ID filter
      if (filters.residentIds && !filters.residentIds.includes(event.residentId)) {
        return false;
      }
      
      // Quest ID filter
      if (filters.questIds && !filters.questIds.includes(event.questId)) {
        return false;
      }
      
      // Location filter
      if (filters.locations && !filters.locations.includes(event.location)) {
        return false;
      }
      
      // Injury type filter
      if (filters.injuryTypes && event.injuryType && !filters.injuryTypes.includes(event.injuryType)) {
        return false;
      }
      
      // Difficulty filter
      if (filters.difficulties && !filters.difficulties.includes(event.metadata.difficulty)) {
        return false;
      }
      
      // Time of day filter
      if (filters.timeOfDay && !filters.timeOfDay.includes(event.metadata.timeOfDay)) {
        return false;
      }
      
      // Environmental factors filter
      if (filters.environmentalFactors) {
        const hasFactor = filters.environmentalFactors.some(factor =>
          event.environmentalFactors.includes(factor)
        );
        if (!hasFactor) return false;
      }
      
      // Mitigating factors filter
      if (filters.mitigatingFactors) {
        const hasFactor = filters.mitigatingFactors.some(factor =>
          event.mitigatingFactors.includes(factor)
        );
        if (!hasFactor) return false;
      }
      
      return true;
    });
  }

  /**
   * Validate event data against schema
   */
  private validateEvent(event: any): event is QuestRiskEvent {
    if (!event || typeof event !== 'object') return false;
    
    // Required fields
    const requiredFields = [
      'id', 'timestamp', 'questId', 'questName', 'questType',
      'residentId', 'residentName', 'residentLevel', 'eventType',
      'riskLevel', 'location', 'environmentalFactors',
      'mitigatingFactors', 'outcome', 'metadata'
    ];
    
    for (const field of requiredFields) {
      if (!(field in event)) return false;
    }
    
    // Validate enum values
    const validQuestTypes = ['exploration', 'combat', 'diplomacy', 'crafting', 'social'];
    const validEventTypes = ['injury', 'death', 'near_miss', 'recovery'];
    const validRiskLevels = ['low', 'medium', 'high', 'critical'];
    const validOutcomes = ['survived', 'died', 'recovered', 'permanent_injury'];
    const validDifficulties = ['easy', 'normal', 'hard', 'nightmare'];
    const validTimeOfDay = ['dawn', 'day', 'dusk', 'night'];
    
    if (!validQuestTypes.includes(event.questType)) return false;
    if (!validEventTypes.includes(event.eventType)) return false;
    if (!validRiskLevels.includes(event.riskLevel)) return false;
    if (!validOutcomes.includes(event.outcome)) return false;
    if (!validDifficulties.includes(event.metadata.difficulty)) return false;
    if (!validTimeOfDay.includes(event.metadata.timeOfDay)) return false;
    
    return true;
  }

  /**
   * Aggregate telemetry data
   */
  private aggregateData(events: QuestRiskEvent[]): QuestRiskAggregation {
    const totalEvents = events.length;
    const injuryEvents = events.filter(e => e.eventType === 'injury').length;
    const deathEvents = events.filter(e => e.eventType === 'death').length;
    const nearMissEvents = events.filter(e => e.eventType === 'near_miss').length;
    const recoveryEvents = events.filter(e => e.eventType === 'recovery').length;
    
    const survivalRate = totalEvents > 0 ? (events.filter(e => e.outcome === 'survived').length / totalEvents) * 100 : 0;
    const mortalityRate = totalEvents > 0 ? (deathEvents / totalEvents) * 100 : 0;
    const injuryRate = totalEvents > 0 ? (injuryEvents / totalEvents) * 100 : 0;
    
    const recoveryTimes = events
      .filter(e => e.recoveryTime !== undefined)
      .map(e => e.recoveryTime!);
    const averageRecoveryTime = recoveryTimes.length > 0 
      ? recoveryTimes.reduce((sum, time) => sum + time, 0) / recoveryTimes.length 
      : 0;
    
    const medicalCosts = events
      .filter(e => e.medicalCost !== undefined)
      .map(e => e.medicalCost!);
    const totalMedicalCost = medicalCosts.reduce((sum, cost) => sum + cost, 0);
    const averageMedicalCost = medicalCosts.length > 0 ? totalMedicalCost / medicalCosts.length : 0;
    
    const questFailures = events.filter(e => e.questImpact === 'failed').length;
    const questFailureRate = totalEvents > 0 ? (questFailures / totalEvents) * 100 : 0;
    
    // Group by various dimensions
    const eventsByQuestType = this.groupBy(events, 'questType');
    const eventsByRiskLevel = this.groupBy(events, 'riskLevel');
    const eventsByLocation = this.groupBy(events, 'location');
    const eventsByDifficulty = this.groupBy(events, e => e.metadata.difficulty);
    const eventsByTimeOfDay = this.groupBy(events, e => e.metadata.timeOfDay);
    
    // Top injury types
    const injuryTypeCounts = events
      .filter(e => e.injuryType)
      .reduce((acc, e) => {
        const key = e.injuryType!;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    
    const topInjuryTypes = Object.entries(injuryTypeCounts)
      .map(([type, count]) => ({
        type,
        count,
        severity: events.find(e => e.injuryType === type)?.injurySeverity || 'unknown'
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    // Top causes of death
    const deathCauseCounts = events
      .filter(e => e.causeOfDeath)
      .reduce((acc, e) => {
        const key = e.causeOfDeath!;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    
    const topCausesOfDeath = Object.entries(deathCauseCounts)
      .map(([cause, count]) => ({ cause, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    // Risk level distribution
    const riskLevelDistribution = this.groupBy(events, 'riskLevel');
    
    // Outcome distribution
    const outcomeDistribution = this.groupBy(events, 'outcome');
    
    return {
      totalEvents,
      injuryEvents,
      deathEvents,
      nearMissEvents,
      recoveryEvents,
      survivalRate,
      mortalityRate,
      injuryRate,
      averageRecoveryTime,
      totalMedicalCost,
      averageMedicalCost,
      questFailureRate,
      eventsByQuestType,
      eventsByRiskLevel,
      eventsByLocation,
      eventsByDifficulty,
      eventsByTimeOfDay,
      topInjuryTypes,
      topCausesOfDeath,
      riskLevelDistribution,
      outcomeDistribution,
    };
  }

  /**
   * Group events by a key or key function
   */
  private groupBy<T>(events: QuestRiskEvent[], keyOrFn: keyof QuestRiskEvent | ((e: QuestRiskEvent) => string)): Record<string, number> {
    const groups: Record<string, number> = {};
    
    for (const event of events) {
      const key = typeof keyOrFn === 'function' ? keyOrFn(event) : String(event[keyOrFn]);
      groups[key] = (groups[key] || 0) + 1;
    }
    
    return groups;
  }

  /**
   * Export data to CSV format
   */
  private exportToCSV(events: QuestRiskEvent[], aggregation?: QuestRiskAggregation): string {
    const headers = [
      'id', 'timestamp', 'questId', 'questName', 'questType',
      'residentId', 'residentName', 'residentLevel', 'eventType',
      'riskLevel', 'injuryType', 'injurySeverity', 'causeOfDeath',
      'location', 'outcome', 'recoveryTime', 'medicalCost',
      'questImpact', 'teamImpact', 'sessionId', 'deviceId',
      'gameVersion', 'difficulty', 'weather', 'timeOfDay'
    ];
    
    const csvRows = [headers.join(',')];
    
    // Add event data
    for (const event of events) {
      const row = [
        event.id,
        event.timestamp,
        event.questId,
        `"${event.questName}"`,
        event.questType,
        event.residentId,
        `"${event.residentName}"`,
        event.residentLevel,
        event.eventType,
        event.riskLevel,
        event.injuryType || '',
        event.injurySeverity || '',
        event.causeOfDeath || '',
        `"${event.location}"`,
        event.outcome,
        event.recoveryTime || '',
        event.medicalCost || '',
        event.questImpact,
        event.teamImpact,
        event.metadata.sessionId,
        event.metadata.deviceId,
        event.metadata.gameVersion,
        event.metadata.difficulty,
        event.metadata.weather || '',
        event.metadata.timeOfDay,
      ];
      
      csvRows.push(row.join(','));
    }
    
    // Add aggregation summary if requested
    if (aggregation && this.config.includeAggregation) {
      csvRows.push('');
      csvRows.push('# AGGREGATION SUMMARY');
      csvRows.push(`Total Events,${aggregation.totalEvents}`);
      csvRows.push(`Injury Events,${aggregation.injuryEvents}`);
      csvRows.push(`Death Events,${aggregation.deathEvents}`);
      csvRows.push(`Near Miss Events,${aggregation.nearMissEvents}`);
      csvRows.push(`Recovery Events,${aggregation.recoveryEvents}`);
      csvRows.push(`Survival Rate,${aggregation.survivalRate.toFixed(2)}%`);
      csvRows.push(`Mortality Rate,${aggregation.mortalityRate.toFixed(2)}%`);
      csvRows.push(`Injury Rate,${aggregation.injuryRate.toFixed(2)}%`);
      csvRows.push(`Average Recovery Time,${aggregation.averageRecoveryTime.toFixed(2)} days`);
      csvRows.push(`Total Medical Cost,${aggregation.totalMedicalCost}`);
      csvRows.push(`Average Medical Cost,${aggregation.averageMedicalCost.toFixed(2)}`);
      csvRows.push(`Quest Failure Rate,${aggregation.questFailureRate.toFixed(2)}%`);
    }
    
    return csvRows.join('\n');
  }

  /**
   * Export data to JSON format
   */
  private exportToJSON(events: QuestRiskEvent[], aggregation?: QuestRiskAggregation): string {
    const exportData: any = {
      metadata: {
        exportedAt: new Date().toISOString(),
        totalEvents: events.length,
        filters: this.config.filters,
        config: {
          includeAggregation: this.config.includeAggregation,
          includeRawData: this.config.includeRawData,
          aggregation: this.config.aggregation,
        },
      },
    };
    
    if (this.config.includeRawData) {
      exportData.events = events;
    }
    
    if (aggregation && this.config.includeAggregation) {
      exportData.aggregation = aggregation;
    }
    
    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Generate filename for export
   */
  private generateFilename(format: 'csv' | 'json'): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseName = this.config.filename || `quest_risk_telemetry_${timestamp}`;
    return `${baseName}.${format}`;
  }

  /**
   * Save export data to files
   */
  private async saveExport(events: QuestRiskEvent[], aggregation?: QuestRiskAggregation): Promise<void> {
    console.log('💾 Saving export data...');
    
    const files: string[] = [];
    
    if (this.config.outputFormat === 'csv' || this.config.outputFormat === 'both') {
      const csvData = this.exportToCSV(events, aggregation);
      const csvFile = join(this.config.outputDirectory, this.generateFilename('csv'));
      writeFileSync(csvFile, csvData, 'utf8');
      files.push(csvFile);
      console.log(`✅ CSV export saved: ${csvFile}`);
    }
    
    if (this.config.outputFormat === 'json' || this.config.outputFormat === 'both') {
      const jsonData = this.exportToJSON(events, aggregation);
      const jsonFile = join(this.config.outputDirectory, this.generateFilename('json'));
      writeFileSync(jsonFile, jsonData, 'utf8');
      files.push(jsonFile);
      console.log(`✅ JSON export saved: ${jsonFile}`);
    }
    
    console.log(`📁 Export completed. Files saved to: ${files.join(', ')}`);
  }

  /**
   * Run the complete export process
   */
  async run(): Promise<void> {
    try {
      console.log('🚀 Starting Quest Risk Telemetry Export...');
      console.log(`📁 Source directory: ${this.config.sourceDirectory}`);
      console.log(`📁 Output directory: ${this.config.outputDirectory}`);
      console.log(`📄 Output format: ${this.config.outputFormat}`);
      
      // Load telemetry data
      await this.loadTelemetryData();
      
      // Validate data if required
      if (this.config.schema.validate) {
        console.log('🔍 Validating telemetry data...');
        const validEvents = this.events.filter(event => this.validateEvent(event));
        const invalidCount = this.events.length - validEvents.length;
        
        if (invalidCount > 0) {
          console.warn(`⚠️  Found ${invalidCount} invalid events`);
          if (this.config.schema.strict) {
            throw new Error(`Strict validation enabled: ${invalidCount} invalid events found`);
          }
        }
        
        this.events = validEvents;
        console.log(`✅ Validated ${this.events.length} events`);
      }
      
      // Apply filters
      const filteredEvents = this.applyFilters(this.events);
      console.log(`🔍 Applied filters: ${filteredEvents.length}/${this.events.length} events`);
      
      // Generate aggregation if requested
      let aggregation: QuestRiskAggregation | undefined;
      if (this.config.includeAggregation) {
        aggregation = this.aggregateData(filteredEvents);
        console.log('📊 Generated aggregation summary');
      }
      
      // Save export
      await this.saveExport(filteredEvents, aggregation);
      
      const duration = Date.now() - this.startTime;
      console.log(`\n🎉 Quest Risk Telemetry Export completed successfully!`);
      console.log(`📊 Processed ${this.events.length} events`);
      console.log(`🔍 Filtered to ${filteredEvents.length} events`);
      console.log(`⏱️  Duration: ${(duration / 1000).toFixed(2)}s`);
      
      if (aggregation) {
        console.log(`\n📈 Aggregation Summary:`);
        console.log(`   Total Events: ${aggregation.totalEvents}`);
        console.log(`   Injury Events: ${aggregation.injuryEvents}`);
        console.log(`   Death Events: ${aggregation.deathEvents}`);
        console.log(`   Survival Rate: ${aggregation.survivalRate.toFixed(2)}%`);
        console.log(`   Mortality Rate: ${aggregation.mortalityRate.toFixed(2)}%`);
        console.log(`   Quest Failure Rate: ${aggregation.questFailureRate.toFixed(2)}%`);
      }
      
    } catch (error) {
      console.error(`❌ Quest Risk Telemetry Export failed:`, error);
      process.exit(1);
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  
  // Parse command line arguments
  const config: Partial<ExportConfig> = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--help':
      case '-h':
        console.log(`
NP-028 Quest Risk Telemetry Export

Usage: tsx QuestRiskTelemetryExport.ts [options]

Options:
  --help, -h              Show this help message
  --source-dir, -s        Source directory (default: ./data/telemetry/quest_risk)
  --output-dir, -o        Output directory (default: ./data/exports/quest_risk)
  --format, -f            Output format: csv, json, both (default: both)
  --filename, -n          Custom filename (without extension)
  --no-aggregation        Exclude aggregation summary
  --no-raw-data           Exclude raw event data
  --no-validation         Skip schema validation
  --strict-validation     Enable strict validation (fail on invalid data)
  --quest-types           Filter by quest types (comma-separated)
  --event-types           Filter by event types (comma-separated)
  --risk-levels           Filter by risk levels (comma-separated)
  --outcomes              Filter by outcomes (comma-separated)
  --quest-impacts         Filter by quest impacts (comma-separated)
  --resident-levels       Filter by resident levels (min-max)
  --date-range            Filter by date range (YYYY-MM-DD,YYYY-MM-DD)
  --resident-ids          Filter by resident IDs (comma-separated)
  --quest-ids             Filter by quest IDs (comma-separated)
  --locations             Filter by locations (comma-separated)
  --injury-types          Filter by injury types (comma-separated)
  --difficulties          Filter by difficulties (comma-separated)
  --time-of-day           Filter by time of day (comma-separated)
  --env-factors           Filter by environmental factors (comma-separated)
  --mitigating-factors    Filter by mitigating factors (comma-separated)

Examples:
  tsx QuestRiskTelemetryExport.ts
  tsx QuestRiskTelemetryExport.ts --format csv --no-aggregation
  tsx QuestRiskTelemetryExport.ts --quest-types combat,exploration --risk-levels high,critical
  tsx QuestRiskTelemetryExport.ts --date-range 2024-01-01,2024-12-31 --resident-levels 5-10
  tsx QuestRiskTelemetryExport.ts --event-types injury,death --strict-validation
        `);
        process.exit(0);
        
      case '--source-dir':
      case '-s':
        config.sourceDirectory = args[++i];
        break;
        
      case '--output-dir':
      case '-o':
        config.outputDirectory = args[++i];
        break;
        
      case '--format':
      case '-f':
        const format = args[++i] as 'csv' | 'json' | 'both';
        if (['csv', 'json', 'both'].includes(format)) {
          config.outputFormat = format;
        } else {
          console.error(`Invalid format: ${format}`);
          process.exit(1);
        }
        break;
        
      case '--filename':
      case '-n':
        config.filename = args[++i];
        break;
        
      case '--no-aggregation':
        config.includeAggregation = false;
        break;
        
      case '--no-raw-data':
        config.includeRawData = false;
        break;
        
      case '--no-validation':
        config.schema = { validate: false, strict: false };
        break;
        
      case '--strict-validation':
        config.schema = { validate: true, strict: true };
        break;
        
      case '--quest-types':
        config.filters = config.filters || {};
        config.filters.questTypes = args[++i].split(',').map(t => t.trim()) as QuestRiskEvent['questType'][];
        break;
        
      case '--event-types':
        config.filters = config.filters || {};
        config.filters.eventTypes = args[++i].split(',').map(t => t.trim()) as QuestRiskEvent['eventType'][];
        break;
        
      case '--risk-levels':
        config.filters = config.filters || {};
        config.filters.riskLevels = args[++i].split(',').map(t => t.trim()) as QuestRiskEvent['riskLevel'][];
        break;
        
      case '--outcomes':
        config.filters = config.filters || {};
        config.filters.outcomes = args[++i].split(',').map(t => t.trim()) as QuestRiskEvent['outcome'][];
        break;
        
      case '--quest-impacts':
        config.filters = config.filters || {};
        config.filters.questImpacts = args[++i].split(',').map(t => t.trim()) as QuestRiskEvent['questImpact'][];
        break;
        
      case '--resident-levels':
        config.filters = config.filters || {};
        const levelRange = args[++i].split('-');
        config.filters.residentLevels = {
          min: levelRange[0] ? parseInt(levelRange[0]) : undefined,
          max: levelRange[1] ? parseInt(levelRange[1]) : undefined,
        };
        break;
        
      case '--date-range':
        config.filters = config.filters || {};
        const dateRange = args[++i].split(',');
        config.filters.dateRange = {
          start: new Date(dateRange[0]),
          end: new Date(dateRange[1]),
        };
        break;
        
      case '--resident-ids':
        config.filters = config.filters || {};
        config.filters.residentIds = args[++i].split(',').map(t => t.trim());
        break;
        
      case '--quest-ids':
        config.filters = config.filters || {};
        config.filters.questIds = args[++i].split(',').map(t => t.trim());
        break;
        
      case '--locations':
        config.filters = config.filters || {};
        config.filters.locations = args[++i].split(',').map(t => t.trim());
        break;
        
      case '--injury-types':
        config.filters = config.filters || {};
        config.filters.injuryTypes = args[++i].split(',').map(t => t.trim());
        break;
        
      case '--difficulties':
        config.filters = config.filters || {};
        config.filters.difficulties = args[++i].split(',').map(t => t.trim()) as QuestRiskEvent['metadata']['difficulty'][];
        break;
        
      case '--time-of-day':
        config.filters = config.filters || {};
        config.filters.timeOfDay = args[++i].split(',').map(t => t.trim()) as QuestRiskEvent['metadata']['timeOfDay'][];
        break;
        
      case '--env-factors':
        config.filters = config.filters || {};
        config.filters.environmentalFactors = args[++i].split(',').map(t => t.trim());
        break;
        
      case '--mitigating-factors':
        config.filters = config.filters || {};
        config.filters.mitigatingFactors = args[++i].split(',').map(t => t.trim());
        break;
        
      default:
        console.error(`Unknown option: ${arg}`);
        console.log('Use --help for available options');
        process.exit(1);
    }
  }

  // Run the export
  const exporter = new QuestRiskTelemetryExport(config);
  await exporter.run();
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { QuestRiskTelemetryExport, type QuestRiskEvent, type QuestRiskFilter, type QuestRiskAggregation, type ExportConfig };
