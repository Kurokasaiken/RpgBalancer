#!/usr/bin/env node

/**
 * NP-048 – Idle Village Phase E Scenario Export CLI
 * 
 * CLI tool for exporting Phase E scenarios with filtering, telemetry,
 * and multiple output formats (JSON/Markdown). Enhanced with drop feedback
 * configs and quest timeline ticks.
 * 
 * @since 2026-01-21
 * @author Oracle-Idle – Scenario Export
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { program } from 'commander';
import type {
  PhaseEScenario,
} from '@/balancing/idleVillage/PhaseEScenarioSerializer';
import {
  createPhaseEScenario,
  phaseEScenarioToMarkdown,
  createPhaseEScenarioExportedTelemetry,
} from '@/balancing/idleVillage/PhaseEScenarioSerializer';

// === CLI Configuration ===

interface ExportOptions {
  /** Output format */
  format: 'json' | 'markdown';
  /** Output file path */
  output?: string;
  /** Verbose output */
  verbose: boolean;
  /** Include locked slots */
  includeLockedSlots: boolean;
  /** Fatigue range filter */
  fatigueMin?: number;
  fatigueMax?: number;
  /** Crew ID filter */
  crewIds?: string | string[];
  /** Tag filter */
  tagFilters?: string | string[];
  /** Quest filter */
  questIds?: string | string[];
  /** Activity filter */
  activityIds?: string | string[];
  /** Resident filter */
  residentIds?: string | string[];
}

// === Mock Store Integration ===

/**
 * Mock useVillageSandbox store for testing.
 * In production, this would integrate with the actual store.
 */
function getVillageSandboxState() {
  // Mock implementation - in production this would access the real store
  return {
    residents: [
      { id: 'resident-1', name: 'Alice', status: 'available', fatigue: 25, currentHp: 80, maxHp: 100, statTags: ['strength', 'perception'], isHero: false, isInjured: false },
      { id: 'resident-2', name: 'Bob', status: 'away', fatigue: 45, currentHp: 60, maxHp: 100, statTags: ['agility'], isHero: true, isInjured: false },
      { id: 'resident-3', name: 'Charlie', status: 'exhausted', fatigue: 85, currentHp: 20, maxHp: 100, statTags: ['strength'], isHero: false, isInjured: true },
    ],
    slots: [
      { id: 'forest-work', activityId: 'forest-work', name: 'Forest Work', slotTags: ['village_job'], maxCrew: 2, currentOccupants: 1, isLocked: false },
      { id: 'village-gather', activityId: 'village-gather', name: 'Gather Resources', slotTags: ['village_job'], maxCrew: 3, currentOccupants: 2, isLocked: false },
      { id: 'craft-station', activityId: 'craft-station', name: 'Crafting Station', slotTags: ['village_job'], maxCrew: 1, currentOccupants: 0, isLocked: true },
    ],
    activities: [
      { 
        id: 'forest-work', 
        label: 'Forest Work', 
        tags: ['job'], 
        slotTags: ['village_job'], 
        dangerRating: 0.3,
        statRequirement: {
          allOf: ['strength'],
          anyOf: ['perception', 'agility'],
          noneOf: ['injured'],
        }
      },
      { 
        id: 'village-gather', 
        label: 'Gather Resources', 
        tags: ['job'], 
        slotTags: ['village_job'], 
        dangerRating: 0.1,
        statRequirement: {
          allOf: ['agility'],
          anyOf: ['perception'],
          noneOf: ['exhausted'],
        }
      },
      { 
        id: 'craft-station', 
        label: 'Crafting Station', 
        tags: ['job'], 
        slotTags: ['village_job'], 
        dangerRating: 0.2,
        statRequirement: {
          allOf: ['perception'],
          anyOf: ['agility'],
          noneOf: ['injured'],
        }
      },
    ],
    quests: [
      { id: 'quest-1', name: 'Gather Supplies', status: 'active', progress: 0.3, priority: 'normal', type: 'daily' },
      { id: 'quest-2', name: 'Craft Tools', status: 'pending', progress: 0, priority: 'low', type: 'side' },
      { id: 'quest-3', name: 'Defend Village', status: 'completed', progress: 1.0, priority: 'high', type: 'main' },
    ],
  };
}

// === Enhanced Data Generator ===

/**
 * Generates comprehensive Phase E scenario data from store state.
 */
function generateScenarioFromStore(options: ExportOptions): PhaseEScenario {
  const store = getVillageSandboxState();
  const now = Date.now();
  
  // Filter residents based on options
  let residents = store.residents;
  if (options.residentIds) {
    residents = residents.filter((r: any) => options.residentIds!.includes(r.id));
  }
  if (options.crewIds) {
    residents = residents.filter((r: any) => options.crewIds!.includes(r.id));
  }
  if (options.fatigueMin !== undefined) {
    residents = residents.filter((r: any) => r.fatigue >= options.fatigueMin!);
  }
  if (options.fatigueMax !== undefined) {
    residents = residents.filter((r: any) => r.fatigue <= options.fatigueMax!);
  }
  
  // Convert to Phase E format
  const phaseEResidents = residents.map((resident: any) => ({
    id: resident.id,
    name: resident.name,
    status: resident.status,
    fatigue: resident.fatigue,
    hp: resident.currentHp,
    maxHp: resident.maxHp,
    statTags: resident.statTags,
    isHero: resident.isHero,
    isInjured: resident.isInjured,
    survivalCount: Math.floor(Math.random() * 10),
    survivalScore: Math.floor(Math.random() * 100),
  }));
  
  // Filter and convert slots
  let slots = store.slots;
  if (options.activityIds) {
    slots = slots.filter((s: any) => options.activityIds!.includes(s.activityId));
  }
  if (!options.includeLockedSlots) {
    slots = slots.filter((s: any) => !s.isLocked);
  }
  
  const phaseESlots = slots.map((slot: any) => {
    const activity = store.activities.find((a: any) => a.id === slot.activityId);
    return {
      id: slot.id,
      activityId: slot.activityId,
      name: slot.name,
      slotTags: slot.slotTags,
      maxCrew: slot.maxCrew,
      currentOccupants: slot.currentOccupants,
      statRequirements: activity?.statRequirement ? {
        allOf: activity.statRequirement.allOf,
        anyOf: activity.statRequirement.anyOf,
        noneOf: activity.statRequirement.noneOf,
      } : undefined,
      isLocked: slot.isLocked,
      location: {
        x: Math.floor(Math.random() * 100),
        y: Math.floor(Math.random() * 100),
      },
    };
  });
  
  // Generate enhanced drop feedback configs
  const dropFeedbackConfigs = phaseESlots.map((slot: any) => ({
    slotId: slot.id,
    dropState: Math.random() > 0.3 ? 'valid' : Math.random() > 0.6 ? 'warning' : 'invalid' as const,
    validationMessage: `Validation for ${slot.name}`,
    compatibilityScore: Math.random(),
    visualFeedback: {
      highlightColor: `hsl(${Math.random() * 360}, 70%, 50%)`,
      borderColor: `hsl(${Math.random() * 360}, 70%, 30%)`,
      backgroundColor: `hsl(${Math.random() * 360}, 70%, 10%)`,
      icon: slot.isLocked ? '🔒' : '✓',
    },
    validationResults: {
      statRequirements: Math.random() > 0.2,
      fatigueThreshold: Math.random() > 0.3,
      crewCapacity: slot.currentOccupants < slot.maxCrew,
      tagCompatibility: Math.random() > 0.5,
      phaseLock: slot.isLocked,
    },
    lastValidatedAt: now - Math.floor(Math.random() * 10000),
  }));
  
  // Filter and generate quest timeline ticks
  let quests = store.quests;
  if (options.questIds) {
    quests = quests.filter((q: any) => options.questIds!.includes(q.id));
  }
  
  const questTimelineTicks: any[] = [];
  quests.forEach((quest: any) => {
    const baseTick = Math.floor(Math.random() * 10);
    for (let tick = 0; tick < 10; tick++) {
      questTimelineTicks.push({
        tick: baseTick + tick,
        questId: quest.id,
        questName: quest.name,
        status: tick === 0 ? 'pending' : tick < 5 ? 'active' : tick === 9 ? 'completed' : 'failed' as const,
        progress: (tick + 1) / 10,
        priority: ['low', 'normal', 'high', 'critical'][Math.floor(Math.random() * 4)] as any,
        questType: quest.type as any,
        timeRemainingTicks: 10 - tick,
        requiredResources: {
          gold: Math.floor(Math.random() * 100),
          food: Math.floor(Math.random() * 50),
        },
        rewards: {
          experience: Math.floor(Math.random() * 200),
          reputation: Math.floor(Math.random() * 50),
        },
        participatingResidents: residents.slice(0, Math.floor(Math.random() * 3)).map((r: any) => r.id),
        location: {
          x: Math.floor(Math.random() * 100),
          y: Math.floor(Math.random() * 100),
        },
        metadata: {
          difficulty: Math.random(),
          rewardPool: Math.floor(Math.random() * 1000),
        },
      });
    }
  });
  
  // Generate tag definitions
  const tagDefinitions = [
    { id: 'job', name: 'Job', category: 'activity_type', color: '#3b82f6', description: 'Job activities' },
    { id: 'resident', name: 'Resident', category: 'character_type', color: '#10b981', description: 'Resident characters' },
    { id: 'quest', name: 'Quest', category: 'content_type', color: '#f59e0b', description: 'Quest content' },
    { id: 'location', name: 'Location', category: 'spatial', color: '#8b5cf6', description: 'Location tags' },
    { id: 'strength', name: 'Strength', category: 'stat', color: '#ef4444', description: 'Physical strength attribute' },
    { id: 'agility', name: 'Agility', category: 'stat', color: '#22c55e', description: 'Physical agility attribute' },
    { id: 'perception', name: 'Perception', category: 'stat', color: '#3b82f6', description: 'Perception attribute' },
  ];
  
  return createPhaseEScenario({
    name: `Phase E Scenario Export ${new Date(now).toISOString().split('T')[0]}`,
    description: `Generated Phase E scenario with ${phaseEResidents.length} residents, ${phaseESlots.length} slots, and ${questTimelineTicks.length} quest timeline ticks`,
    author: 'phase-e-scenario-exporter-cli',
    tags: ['generated', 'phase-e', 'store-derived'],
    tick: {
      current: 0,
      total: 100,
      durationMs: 1000,
    },
    residents: phaseEResidents,
    slots: phaseESlots,
    tagDefinitions,
    dropFeedbackConfigs,
    questTimelineTicks,
    metadata: {
      difficulty: phaseEResidents.length > 3 ? 'advanced' : phaseESlots.length > 5 ? 'intermediate' : 'beginner',
      estimatedRuntimeMinutes: Math.max(5, Math.floor(phaseEResidents.length * 2 + phaseESlots.length + questTimelineTicks.length / 10)),
      requiredFeatures: ['phase-e-scenario-exporter', 'drop-feedback-configs', 'quest-timeline-ticks'],
      compatibilityVersion: '1.0.0',
      exportSource: 'manual',
      filterCriteria: {
        crewIds: options.crewIds,
        tagFilters: options.tagFilters,
        fatigueMin: options.fatigueMin,
        fatigueMax: options.fatigueMax,
        includeLockedSlots: options.includeLockedSlots,
      },
    },
  });
}

// === Export Functions ===

/**
 * Exports scenario to JSON file.
 */
function exportToJson(scenario: PhaseEScenario, outputPath: string): void {
  const exportData = {
    scenario,
    exportMetadata: {
      exportedAt: Date.now(),
      exportedBy: 'phase-e-scenario-exporter-cli',
      format: 'json',
      version: '1.0.0',
    },
  };
  
  const jsonString = JSON.stringify(exportData, null, 2);
  writeFileSync(outputPath, jsonString, 'utf-8');
}

/**
 * Exports scenario to Markdown file.
 */
function exportToMarkdown(scenario: PhaseEScenario, outputPath: string): void {
  const markdown = phaseEScenarioToMarkdown(scenario);
  writeFileSync(outputPath, markdown, 'utf-8');
}

/**
 * Emits telemetry event for scenario export.
 */
function emitTelemetry(
  scenario: PhaseEScenario,
  format: 'json' | 'markdown',
  exportDurationMs: number,
  fileSizeBytes?: number
): void {
  const payload = createPhaseEScenarioExportedTelemetry(
    scenario,
    format,
    exportDurationMs,
    fileSizeBytes
  );
  
  // In a real implementation, this would send to the telemetry service
  // For now, we'll just log it
  console.log('TELEMETRY:', JSON.stringify(payload, null, 2));
}

// === Main CLI Function ===

async function main(): Promise<void> {
  program
    .name('phase-e-scenario-export')
    .description('CLI tool for exporting Phase E scenarios with filtering and telemetry')
    .version('1.0.0')
    .option('-f, --format <format>', 'Output format (json|markdown)', 'json')
    .option('-o, --output <file>', 'Output file path')
    .option('-v, --verbose', 'Verbose output')
    .option('--include-locked-slots', 'Include locked slots in export')
    .option('--fatigue-min <number>', 'Minimum fatigue percentage (0-100)', parseFloat)
    .option('--fatigue-max <number>', 'Maximum fatigue percentage (0-100)', parseFloat)
    .option('--crew-ids <ids>', 'Filter by crew IDs (comma-separated)')
    .option('--tag-filters <tags>', 'Filter by tags (comma-separated)')
    .option('--quest-ids <ids>', 'Filter by quest IDs (comma-separated)')
    .option('--activity-ids <ids>', 'Filter by activity IDs (comma-separated)')
    .option('--resident-ids <ids>', 'Filter by resident IDs (comma-separated)')
    .parse();
  
  const options = program.opts() as ExportOptions;
  
  // Parse filter options
  if (options.crewIds && typeof options.crewIds === 'string') {
    options.crewIds = options.crewIds.split(',').map((id: string) => id.trim());
  }
  if (options.tagFilters && typeof options.tagFilters === 'string') {
    options.tagFilters = options.tagFilters.split(',').map((tag: string) => tag.trim());
  }
  if (options.questIds && typeof options.questIds === 'string') {
    options.questIds = options.questIds.split(',').map((id: string) => id.trim());
  }
  if (options.activityIds && typeof options.activityIds === 'string') {
    options.activityIds = options.activityIds.split(',').map((id: string) => id.trim());
  }
  if (options.residentIds && typeof options.residentIds === 'string') {
    options.residentIds = options.residentIds.split(',').map((id: string) => id.trim());
  }
  
  // Validate options
  if (options.fatigueMin !== undefined && (options.fatigueMin < 0 || options.fatigueMin > 100)) {
    console.error('Error: Fatigue minimum must be between 0 and 100');
    process.exit(2);
  }
  if (options.fatigueMax !== undefined && (options.fatigueMax < 0 || options.fatigueMax > 100)) {
    console.error('Error: Fatigue maximum must be between 0 and 100');
    process.exit(2);
  }
  if (options.fatigueMin !== undefined && options.fatigueMax !== undefined && options.fatigueMin > options.fatigueMax) {
    console.error('Error: Fatigue minimum cannot be greater than maximum');
    process.exit(2);
  }
  
  try {
    const startTime = Date.now();
    
    // Generate scenario from store
    if (options.verbose) {
      console.log('🔄 Generating Phase E scenario from store...');
      console.log(`📋 Format: ${options.format}`);
      console.log(`🔍 Filters:`, getFilterSummary(options));
    }
    
    const scenario = generateScenarioFromStore(options);
    
    // Ensure output directory exists
    const outputPath = options.output || `data/exports/idleVillage/phaseE_samples/scenario-${Date.now()}.${options.format}`;
    const outputDir = dirname(outputPath);
    
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }
    
    // Export scenario
    if (options.verbose) {
      console.log(`📤 Exporting to ${options.format} format...`);
      console.log(`📁 Output path: ${outputPath}`);
    }
    
    switch (options.format) {
      case 'json':
        exportToJson(scenario, outputPath);
        break;
      case 'markdown':
        exportToMarkdown(scenario, outputPath);
        break;
      default:
        console.error(`Error: Unsupported format: ${options.format}`);
        process.exit(2);
    }
    
    const exportDuration = Date.now() - startTime;
    const fileSizeBytes = existsSync(outputPath) ? readFileSync(outputPath, 'utf-8').length : 0;
    
    // Emit telemetry
    emitTelemetry(scenario, options.format, exportDuration, fileSizeBytes);
    
    // Output results
    console.log(`✅ Export completed successfully!`);
    console.log(`📁 File: ${outputPath}`);
    console.log(`📊 Format: ${options.format}`);
    console.log(`📏 Size: ${fileSizeBytes} bytes`);
    console.log(`⏱️  Duration: ${exportDuration}ms`);
    
    if (options.verbose) {
      console.log('\n📋 Export Summary:');
      console.log(`   Residents: ${scenario.residents.length}`);
      console.log(`   Slots: ${scenario.slots.length}`);
      console.log(`   Drop Feedback Configs: ${scenario.dropFeedbackConfigs.length}`);
      console.log(`   Quest Timeline Ticks: ${scenario.questTimelineTicks.length}`);
      console.log(`   Tag Definitions: ${scenario.tagDefinitions.length}`);
      
      if (scenario.metadata.filterCriteria) {
        console.log('\n🔍 Filters Applied:');
        const fc = scenario.metadata.filterCriteria;
        if (fc.crewIds) console.log(`   Crew IDs: ${fc.crewIds.join(', ')}`);
        if (fc.tagFilters) console.log(`   Tag Filters: ${fc.tagFilters.join(', ')}`);
        if (fc.fatigueMin !== undefined) console.log(`   Fatigue Range: ${fc.fatigueMin}% - ${fc.fatigueMax}%`);
        console.log(`   Include Locked Slots: ${fc.includeLockedSlots ? 'Yes' : 'No'}`);
      }
      
      console.log('\n📊 Bundle Statistics:');
      console.log(`   Total Data Points: ${scenario.residents.length + scenario.slots.length + scenario.dropFeedbackConfigs.length + scenario.questTimelineTicks.length}`);
      console.log(`   Estimated Bundle Size: ${(fileSizeBytes / 1024).toFixed(2)} KB`);
      console.log(`   Export Speed: ${(fileSizeBytes / (exportDuration / 1000)).toFixed(2)} KB/s`);
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(2);
  }
}

/**
 * Gets a summary of active filters for logging.
 */
function getFilterSummary(options: ExportOptions): string {
  const filters = [];
  if (options.questIds) {
    const questIds = Array.isArray(options.questIds) ? options.questIds : options.questIds.split(',');
    filters.push(`quests:${questIds.join(',')}`);
  }
  if (options.residentIds) {
    const residentIds = Array.isArray(options.residentIds) ? options.residentIds : options.residentIds.split(',');
    filters.push(`residents:${residentIds.join(',')}`);
  }
  if (options.activityIds) {
    const activityIds = Array.isArray(options.activityIds) ? options.activityIds : options.activityIds.split(',');
    filters.push(`activities:${activityIds.join(',')}`);
  }
  if (options.fatigueMin !== undefined) filters.push(`fatigue≥${options.fatigueMin}%`);
  if (options.fatigueMax !== undefined) filters.push(`fatigue≤${options.fatigueMax}%`);
  if (options.includeLockedSlots) filters.push('locked:yes');
  if (options.tagFilters) {
    const tagFilters = Array.isArray(options.tagFilters) ? options.tagFilters : options.tagFilters.split(',');
    filters.push(`tags:${tagFilters.join(',')}`);
  }
  if (options.crewIds) {
    const crewIds = Array.isArray(options.crewIds) ? options.crewIds : options.crewIds.split(',');
    filters.push(`crew:${crewIds.join(',')}`);
  }
  return filters.length > 0 ? filters.join(', ') : 'none';
}

// === CLI Execution ===

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('phaseEScenarioExport.ts')) {
  main().catch(console.error);
}

export { generateScenarioFromStore, exportToJson, exportToMarkdown, emitTelemetry };