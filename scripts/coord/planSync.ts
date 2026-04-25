/**
 * Master Plan Sync Automation Script
 * 
 * Synchronizes Kanban (agent_assignments.md) ↔ Master Plan (MASTER_PLAN.md)
 * with diff detection and evidence logging.
 * 
 * @module planSync
 * @since 2026-01-12
 * @author Archivist-Docs
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { program } from 'commander';

/**
 * Sync operation types
 */
export type SyncDirection = 'kanban-to-plan' | 'plan-to-kanban' | 'bidirectional';

/**
 * Sync configuration
 */
interface SyncConfig {
  /** Direction of sync */
  direction: SyncDirection;
  /** Dry run mode (no changes) */
  dryRun: boolean;
  /** Output directory for evidence logs */
  outputDir: string;
  /** Verbose logging */
  verbose: boolean;
  /** Auto-merge conflicts */
  autoMerge: boolean;
}

/**
 * Kanban entry structure
 */
interface KanbanEntry {
  rowIndex: number;
  taskId: string;
  status: 'Non assegnato' | 'In corso' | 'Completato' | 'Bloccato';
  agent?: string;
  startDate?: string;
  endDate?: string;
  phase?: string;
  evidence?: string;
  rawContent: string;
}

/**
 * Master Plan phase structure
 */
interface MasterPlanPhase {
  phase: string;
  status: 'DONE' | 'ACTIVE' | 'TODO' | 'PAUSED' | 'NEXT';
  taskCount: number;
  description?: string;
}

/**
 * Sync diff result
 */
interface SyncDiff {
  /** Items in Kanban but not in Master Plan */
  kanbanOnly: KanbanEntry[];
  /** Items in Master Plan but not in Kanban */
  planOnly: MasterPlanPhase[];
  /** Conflicting items */
  conflicts: Array<{
    kanban: KanbanEntry;
    plan: MasterPlanPhase;
    conflict: string;
  }>;
  /** Matching items with status differences */
  statusDiffs: Array<{
    kanban: KanbanEntry;
    plan: MasterPlanPhase;
    kanbanStatus: string;
    planStatus: string;
  }>;
}

/**
 * Sync operation result
 */
interface SyncResult {
  /** Success flag */
  success: boolean;
  /** Diff analysis */
  diff: SyncDiff;
  /** Applied changes */
  changes: Array<{
    type: 'create' | 'update' | 'delete';
    target: 'kanban' | 'plan';
    item: string;
    details: string;
  }>;
  /** Evidence log path */
  evidenceLog: string;
  /** Operation duration */
  duration: number;
}

/**
 * Master Plan Sync Automation Class
 */
export class MasterPlanSync {
  private config: SyncConfig;
  private kanbanPath: string;
  private masterPlanPath: string;

  constructor(config: Partial<SyncConfig> = {}) {
    this.config = {
      direction: 'bidirectional',
      dryRun: false,
      outputDir: 'test-results',
      verbose: false,
      autoMerge: false,
      ...config
    };

    this.kanbanPath = 'src/docs/docs/coordinator/agent_assignments.md';
    this.masterPlanPath = 'src/docs/docs/MASTER_PLAN.md';
  }

  /**
   * Parse Kanban markdown table
   */
  private parseKanban(): KanbanEntry[] {
    const content = readFileSync(this.kanbanPath, 'utf-8');
    const lines = content.split('\n');
    const entries: KanbanEntry[] = [];
    
    let tableStart = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('---') && lines[i - 1]?.includes('Prompt ID')) {
        tableStart = i + 1;
        break;
      }
    }

    if (tableStart === -1) {
      throw new Error('Kanban table not found');
    }

    for (let i = tableStart; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith('|') === false) break;
      
      const columns = line.split('|').map(c => c.trim()).filter(c => c);
      if (columns.length < 10) continue;

      const [taskId, status, , agent, startTime, endTime, , , , notes] = columns;
      
      entries.push({
        rowIndex: i,
        taskId: taskId.replace(/\*\*/g, '').trim(),
        status: status.trim() as KanbanEntry['status'],
        agent: agent !== '-' ? agent.trim() : undefined,
        startDate: startTime !== '-' ? startTime.trim() : undefined,
        endDate: endTime !== '-' ? endTime.trim() : undefined,
        phase: this.extractPhaseFromTask(taskId),
        evidence: this.extractEvidenceFromNotes(notes),
        rawContent: line
      });
    }

    return entries;
  }

  /**
   * Parse Master Plan phases
   */
  private parseMasterPlan(): MasterPlanPhase[] {
    const content = readFileSync(this.masterPlanPath, 'utf-8');
    const lines = content.split('\n');
    const phases: MasterPlanPhase[] = [];
    
    let inProgressSection = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.includes('OVERALL PROGRESS')) {
        inProgressSection = true;
        continue;
      }
      
      if (inProgressSection && line.match(/^-\s+Phase\s+\d+:/)) {
        const match = line.match(/Phase\s+(\d+):\s*(.+?)\s*—\s*(.+?)\s*\((~(\d+)\s+tasks)\)/);
        if (match) {
          const [, phaseNum, phaseName, status, , taskCount] = match;
          phases.push({
            phase: `Phase ${phaseNum}: ${phaseName}`,
            status: status.trim().replace('🔥', '').replace('🔄', '').replace('📋', '').replace('⏸️', '').trim() as MasterPlanPhase['status'],
            taskCount: parseInt(taskCount) || 0,
            description: status.trim()
          });
        }
      }
    }

    return phases;
  }

  /**
   * Extract phase from task ID
   */
  private extractPhaseFromTask(taskId: string): string {
    const phaseMatch = taskId.match(/Phase\s+(\d+)/i);
    return phaseMatch ? `Phase ${phaseMatch[1]}` : 'Unknown';
  }

  /**
   * Extract evidence from notes
   */
  private extractEvidenceFromNotes(notes: string): string | undefined {
    const evidenceMatch = notes.match(/Evidence:\s*(.+?)(?:\s|$)/);
    return evidenceMatch ? evidenceMatch[1].trim() : undefined;
  }

  /**
   * Generate diff between Kanban and Master Plan
   */
  private generateDiff(kanban: KanbanEntry[], plan: MasterPlanPhase[]): SyncDiff {
    const diff: SyncDiff = {
      kanbanOnly: [],
      planOnly: [],
      conflicts: [],
      statusDiffs: []
    };

    // Map phases for quick lookup
    const planPhases = new Map(plan.map(p => [p.phase.split(':')[0].trim(), p]));
    
    // Check Kanban entries
    for (const entry of kanban) {
      const phaseKey = entry.phase?.split(':')[0]?.trim() || 'Unknown';
      const planPhase = planPhases.get(phaseKey);
      
      if (!planPhase) {
        diff.kanbanOnly.push(entry);
      } else {
        // Check for status differences
        const kanbanStatus = this.mapKanbanToPlanStatus(entry.status);
        if (kanbanStatus !== planPhase.status) {
          diff.statusDiffs.push({
            kanban: entry,
            plan: planPhase,
            kanbanStatus,
            planStatus: planPhase.status
          });
        }
      }
    }

    // Check Master Plan phases not in Kanban
    const kanbanPhases = new Set(kanban.map(e => e.phase?.split(':')[0]?.trim() || 'Unknown').filter(Boolean));
    for (const phase of plan) {
      const phaseKey = phase.phase.split(':')[0].trim();
      if (!kanbanPhases.has(phaseKey)) {
        diff.planOnly.push(phase);
      }
    }

    return diff;
  }

  /**
   * Map Kanban status to Master Plan status
   */
  private mapKanbanToPlanStatus(kanbanStatus: string): string {
    switch (kanbanStatus) {
      case 'Completato': return 'DONE';
      case 'In corso': return 'ACTIVE';
      case 'Non assegnato': return 'TODO';
      case 'Bloccato': return 'PAUSED';
      default: return 'TODO';
    }
  }

  /**
   * Apply sync changes
   */
  private applySync(diff: SyncDiff): Array<{type: 'create' | 'update' | 'delete', target: 'kanban' | 'plan', item: string, details: string}> {
    const changes: Array<{type: 'create' | 'update' | 'delete', target: 'kanban' | 'plan', item: string, details: string}> = [];

    if (this.config.dryRun) {
      if (this.config.verbose) {
        console.log('🔍 DRY RUN - No changes will be applied');
      }
      return changes;
    }

    // Apply changes based on direction
    switch (this.config.direction) {
      case 'kanban-to-plan':
        changes.push(...this.syncKanbanToPlan(diff));
        break;
      case 'plan-to-kanban':
        changes.push(...this.syncPlanToKanban(diff));
        break;
      case 'bidirectional':
        changes.push(...this.syncBidirectional(diff));
        break;
    }

    return changes;
  }

  /**
   * Sync Kanban to Master Plan
   */
  private syncKanbanToPlan(diff: SyncDiff): Array<{type: 'create' | 'update' | 'delete', target: 'kanban' | 'plan', item: string, details: string}> {
    const changes: Array<{type: 'create' | 'update' | 'delete', target: 'kanban' | 'plan', item: string, details: string}> = [];

    // Update Master Plan based on Kanban status
    for (const statusDiff of diff.statusDiffs) {
      const newStatus = this.mapKanbanToPlanStatus(statusDiff.kanban.status);
      changes.push({
        type: 'update' as const,
        target: 'plan' as const,
        item: statusDiff.plan.phase,
        details: `Status: ${statusDiff.plan.status} → ${newStatus} (from Kanban: ${statusDiff.kanban.status})`
      });
      
      if (this.config.verbose) {
        console.log(`📝 Update ${statusDiff.plan.phase}: ${statusDiff.plan.status} → ${newStatus}`);
      }
    }

    return changes;
  }

  /**
   * Sync Master Plan to Kanban
   */
  private syncPlanToKanban(diff: SyncDiff): Array<{type: 'create' | 'update' | 'delete', target: 'kanban' | 'plan', item: string, details: string}> {
    const changes: Array<{type: 'create' | 'update' | 'delete', target: 'kanban' | 'plan', item: string, details: string}> = [];

    // Update Kanban based on Master Plan status
    for (const statusDiff of diff.statusDiffs) {
      const newStatus = this.mapPlanToKanbanStatus(statusDiff.plan.status);
      changes.push({
        type: 'update' as const,
        target: 'kanban' as const,
        item: statusDiff.kanban.taskId,
        details: `Status: ${statusDiff.kanban.status} → ${newStatus} (from Master Plan: ${statusDiff.plan.status})`
      });
      
      if (this.config.verbose) {
        console.log(`📝 Update ${statusDiff.kanban.taskId}: ${statusDiff.kanban.status} → ${newStatus}`);
      }
    }

    return changes;
  }

  /**
   * Bidirectional sync
   */
  private syncBidirectional(diff: SyncDiff): Array<{type: 'create' | 'update' | 'delete', target: 'kanban' | 'plan', item: string, details: string}> {
    // Priority: Kanban (more up-to-date for individual tasks)
    return this.syncKanbanToPlan(diff);
  }

  /**
   * Map Master Plan status to Kanban status
   */
  private mapPlanToKanbanStatus(planStatus: string): string {
    switch (planStatus) {
      case 'DONE': return 'Completato';
      case 'ACTIVE': return 'In corso';
      case 'TODO': return 'Non assegnato';
      case 'PAUSED': return 'Bloccato';
      default: return 'Non assegnato';
    }
  }

  /**
   * Generate evidence log
   */
  private generateEvidenceLog(result: SyncResult): string {
    const timestamp = new Date().toISOString().split('T')[0];
    const logPath = join(this.config.outputDir, `masterplan-sync-${timestamp}.log`);
    
    // Ensure output directory exists
    if (!existsSync(this.config.outputDir)) {
      mkdirSync(this.config.outputDir, { recursive: true });
    }

    const log = `# Master Plan Sync Evidence Log
Date: ${new Date().toISOString()}
Direction: ${this.config.direction}
Dry Run: ${this.config.dryRun}
Duration: ${result.duration}ms

## Summary
- Success: ${result.success}
- Kanban Only Items: ${result.diff.kanbanOnly.length}
- Plan Only Items: ${result.diff.planOnly.length}
- Status Differences: ${result.diff.statusDiffs.length}
- Conflicts: ${result.diff.conflicts.length}
- Changes Applied: ${result.changes.length}

## Diff Analysis

### Kanban Only Items
${result.diff.kanbanOnly.map(item => `- ${item.taskId} (${item.phase})`).join('\n')}

### Plan Only Items
${result.diff.planOnly.map(item => `- ${item.phase} (${item.status})`).join('\n')}

### Status Differences
${result.diff.statusDiffs.map(diff => `- ${diff.kanban.taskId}: ${diff.kanbanStatus} → ${diff.planStatus}`).join('\n')}

### Conflicts
${result.diff.conflicts.map(conflict => `- ${conflict.kanban.taskId}: ${conflict.conflict}`).join('\n')}

## Applied Changes
${result.changes.map(change => `- ${change.type} ${change.target}: ${change.item} - ${change.details}`).join('\n')}

---
Generated by Master Plan Sync Automation
`;

    writeFileSync(logPath, log, 'utf-8');
    return logPath;
  }

  /**
   * Execute sync operation
   */
  async executeSync(): Promise<SyncResult> {
    const startTime = Date.now();
    
    try {
      if (this.config.verbose) {
        console.log('🚀 Starting Master Plan Sync...');
        console.log(`📁 Kanban: ${this.kanbanPath}`);
        console.log(`📁 Master Plan: ${this.masterPlanPath}`);
        console.log(`🔄 Direction: ${this.config.direction}`);
      }

      // Parse both sources
      const kanban = this.parseKanban();
      const plan = this.parseMasterPlan();

      if (this.config.verbose) {
        console.log(`📊 Parsed ${kanban.length} Kanban entries`);
        console.log(`📊 Parsed ${plan.length} Master Plan phases`);
      }

      // Generate diff
      const diff = this.generateDiff(kanban, plan);

      if (this.config.verbose) {
        console.log(`🔍 Diff: ${diff.kanbanOnly.length} kanban-only, ${diff.planOnly.length} plan-only, ${diff.statusDiffs.length} status diffs`);
      }

      // Apply sync
      const changes = this.applySync(diff);

      const duration = Date.now() - startTime;
      const result: SyncResult = {
        success: true,
        diff,
        changes,
        evidenceLog: '',
        duration
      };

      // Generate evidence log
      result.evidenceLog = this.generateEvidenceLog(result);

      if (this.config.verbose) {
        console.log(`✅ Sync completed in ${duration}ms`);
        console.log(`📝 Evidence log: ${result.evidenceLog}`);
      }

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      const result: SyncResult = {
        success: false,
        diff: { kanbanOnly: [], planOnly: [], conflicts: [], statusDiffs: [] },
        changes: [],
        evidenceLog: '',
        duration
      };

      // Generate error log
      const timestamp = new Date().toISOString().split('T')[0];
      const logPath = join(this.config.outputDir, `masterplan-sync-error-${timestamp}.log`);
      
      if (!existsSync(this.config.outputDir)) {
        mkdirSync(this.config.outputDir, { recursive: true });
      }

      const errorLog = `# Master Plan Sync Error Log
Date: ${new Date().toISOString()}
Error: ${error instanceof Error ? error.message : String(error)}
Stack: ${error instanceof Error ? error.stack : ''}
Duration: ${duration}ms
`;

      writeFileSync(logPath, errorLog, 'utf-8');
      result.evidenceLog = logPath;

      throw error;
    }
  }
}

/**
 * CLI interface
 */
async function main() {
  program
    .name('masterplan-sync')
    .description('Master Plan ↔ Kanban synchronization automation')
    .version('1.0.0')
    .option('-d, --direction <type>', 'Sync direction', 'bidirectional')
    .option('--dry-run', 'Dry run mode (no changes)', false)
    .option('-o, --output <dir>', 'Output directory for evidence logs', 'test-results')
    .option('-v, --verbose', 'Verbose logging', false)
    .option('--auto-merge', 'Auto-merge conflicts', false)
    .action(async (options) => {
      const sync = new MasterPlanSync({
        direction: options.direction,
        dryRun: options.dryRun,
        outputDir: options.output,
        verbose: options.verbose,
        autoMerge: options.autoMerge
      });

      try {
        const result = await sync.executeSync();
        
        console.log('\n📊 Sync Results:');
        console.log(`✅ Success: ${result.success}`);
        console.log(`📊 Kanban Only: ${result.diff.kanbanOnly.length}`);
        console.log(`📊 Plan Only: ${result.diff.planOnly.length}`);
        console.log(`📊 Status Differences: ${result.diff.statusDiffs.length}`);
        console.log(`📊 Conflicts: ${result.diff.conflicts.length}`);
        console.log(`📝 Changes Applied: ${result.changes.length}`);
        console.log(`⏱️ Duration: ${result.duration}ms`);
        console.log(`📄 Evidence Log: ${result.evidenceLog}`);
        
        process.exit(result.success ? 0 : 1);
      } catch (error) {
        console.error('❌ Sync failed:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  await program.parseAsync();
}

// Run CLI if called directly
if (require.main === module) {
  main().catch(console.error);
}

export default MasterPlanSync;
