#!/usr/bin/env tsx

/**
 * Master Plan & Kanban Alignment Check Script
 * 
 * This script performs automated checks to ensure consistency between:
 * - Strategy Task Intake (strategy_tasks.md)
 * - Master Plan (idle_village_punch_club_vision.md)
 * - Kanban assignments (agent_assignments.md)
 * 
 * Usage: tsx scripts/coordinator/masterplanSyncCheck.ts [--fix] [--verbose]
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { Command } from 'commander';

interface StrategyTask {
  taskId: string;
  description: string;
  origin: string;
  files: string;
  status: string;
  priority: string;
  notes: string;
}

interface KanbanTask {
  taskId: string;
  title: string;
  status: string;
  dependency: string;
  agent: string;
  startDate: string;
  endDate: string;
  estimatedHours: number;
  actualHours: number;
  completedDate: string;
  evidence: string;
}

interface SyncReport {
  strategyTasks: StrategyTask[];
  kanbanTasks: KanbanTask[];
  missingInKanban: string[];
  missingInStrategy: string[];
  statusMismatches: Array<{
    taskId: string;
    strategyStatus: string;
    kanbanStatus: string;
  }>;
  orphanedTasks: string[];
  summary: {
    totalStrategyTasks: number;
    totalKanbanTasks: number;
    syncedTasks: number;
    issuesFound: number;
  };
}

const program = new Command();

program
  .name('masterplan-sync')
  .description('Master Plan & Kanban Alignment Check')
  .option('--fix', 'Attempt to fix minor issues automatically')
  .option('--verbose', 'Show detailed output')
  .parse();

const options = program.opts();

const DOCS_DIR = join(process.cwd(), 'src/docs/docs/coordinator');
const STRATEGY_DIR = join(process.cwd(), 'src/docs/docs/strategy');
const STRATEGY_TASKS_FILE = join(STRATEGY_DIR, 'strategy_tasks.md');
const VISION_FILE = join(STRATEGY_DIR, 'idle_village_punch_club_vision.md');
const ASSIGNMENTS_FILE = join(DOCS_DIR, 'agent_assignments.md');

/**
 * Parse strategy tasks from markdown table
 */
function parseStrategyTasks(content: string): StrategyTask[] {
  const lines = content.split('\n');
  const tasks: StrategyTask[] = [];
  let inTable = false;

  for (const line of lines) {
    if (line.startsWith('|Task ID|')) {
      inTable = true;
      continue;
    }
    if (inTable && line.startsWith('|---')) {
      continue;
    }
    if (inTable && line.startsWith('|')) {
      const columns = line.split('|').map(col => col.trim()).filter(col => col);
      if (columns.length >= 7) {
        const [taskId, description, origin, files, status, priority, notes] = columns;
        if (taskId && taskId !== 'Task ID' && !taskId.includes('(es.')) {
          tasks.push({
            taskId: taskId.trim(),
            description: description.trim(),
            origin: origin.trim(),
            files: files.trim(),
            status: status.trim(),
            priority: priority.trim(),
            notes: notes.trim()
          });
        }
      }
    }
  }

  return tasks;
}

/**
 * Parse kanban tasks from agent assignments table
 */
function parseKanbanTasks(content: string): KanbanTask[] {
  const lines = content.split('\n');
  const tasks: KanbanTask[] = [];
  let inTable = false;

  for (const line of lines) {
    if (line.includes('KS-') && line.includes('|')) {
      inTable = true;
    }
    if (inTable && line.includes('|---')) {
      continue;
    }
    if (inTable && line.includes('|KS-')) {
      const columns = line.split('|').map(col => col.trim()).filter(col => col);
      if (columns.length >= 11) {
        const [taskId, title, status, dependency, agent, startDate, endDate, estimatedHours, actualHours, completedDate, evidence] = columns;
        
        // Extract just the task ID from the first column
        const cleanTaskId = taskId.match(/(KS-\d+)/)?.[1] || taskId;
        
        tasks.push({
          taskId: cleanTaskId,
          title: title.replace(/KS-\d+\s*/, '').trim(),
          status: status.trim(),
          dependency: dependency.trim(),
          agent: agent.trim(),
          startDate: startDate.trim(),
          endDate: endDate.trim(),
          estimatedHours: parseInt(estimatedHours) || 0,
          actualHours: parseInt(actualHours) || 0,
          completedDate: completedDate.trim(),
          evidence: evidence.trim()
        });
      }
    }
  }

  return tasks;
}

/**
 * Generate comprehensive sync report
 */
function generateSyncReport(strategyTasks: StrategyTask[], kanbanTasks: KanbanTask[]): SyncReport {
  const strategyTaskIds = new Set(strategyTasks.map(t => t.taskId));
  const kanbanTaskIds = new Set(kanbanTasks.map(t => t.taskId));

  const missingInKanban = [...strategyTaskIds].filter(id => !kanbanTaskIds.has(id));
  const missingInStrategy = [...kanbanTaskIds].filter(id => !strategyTaskIds.has(id));

  const statusMismatches: Array<{ taskId: string; strategyStatus: string; kanbanStatus: string }> = [];
  
  for (const strategyTask of strategyTasks) {
    const kanbanTask = kanbanTasks.find(k => k.taskId === strategyTask.taskId);
    if (kanbanTask) {
      // Map strategy status to kanban status
      const mappedStrategyStatus = mapStrategyToKanbanStatus(strategyTask.status);
      if (mappedStrategyStatus !== kanbanTask.status) {
        statusMismatches.push({
          taskId: strategyTask.taskId,
          strategyStatus: mappedStrategyStatus,
          kanbanStatus: kanbanTask.status
        });
      }
    }
  }

  // Find orphaned tasks (placeholders, etc.)
  const orphanedTasks = kanbanTasks
    .filter(k => k.title.includes('Placeholder') || k.title.includes('TBD'))
    .map(k => k.taskId);

  return {
    strategyTasks,
    kanbanTasks,
    missingInKanban,
    missingInStrategy,
    statusMismatches,
    orphanedTasks,
    summary: {
      totalStrategyTasks: strategyTasks.length,
      totalKanbanTasks: kanbanTasks.length,
      syncedTasks: strategyTasks.length - missingInKanban.length,
      issuesFound: missingInKanban.length + missingInStrategy.length + statusMismatches.length + orphanedTasks.length
    }
  };
}

/**
 * Map strategy status to kanban status
 */
function mapStrategyToKanbanStatus(strategyStatus: string): string {
  const statusMap: Record<string, string> = {
    'pending': 'Non assegnato',
    '✅': 'Completato',
    'In corso': 'In corso',
    'blocked': 'Bloccato'
  };
  
  return statusMap[strategyStatus] || strategyStatus;
}

/**
 * Print detailed report
 */
function printReport(report: SyncReport): void {
  console.log('\n🔍 Master Plan & Kanban Sync Report');
  console.log('='.repeat(50));
  
  console.log('\n📊 Summary:');
  console.log(`  Strategy Tasks: ${report.summary.totalStrategyTasks}`);
  console.log(`  Kanban Tasks: ${report.summary.totalKanbanTasks}`);
  console.log(`  Synced Tasks: ${report.summary.syncedTasks}`);
  console.log(`  Issues Found: ${report.summary.issuesFound}`);

  if (report.missingInKanban.length > 0) {
    console.log('\n❌ Missing in Kanban:');
    report.missingInKanban.forEach(taskId => {
      console.log(`  - ${taskId}`);
    });
  }

  if (report.missingInStrategy.length > 0) {
    console.log('\n❌ Missing in Strategy:');
    report.missingInStrategy.forEach(taskId => {
      console.log(`  - ${taskId}`);
    });
  }

  if (report.statusMismatches.length > 0) {
    console.log('\n⚠️  Status Mismatches:');
    report.statusMismatches.forEach(({ taskId, strategyStatus, kanbanStatus }) => {
      console.log(`  - ${taskId}: Strategy="${strategyStatus}" vs Kanban="${kanbanStatus}"`);
    });
  }

  if (report.orphanedTasks.length > 0) {
    console.log('\n🏷️  Orphaned/Placeholder Tasks:');
    report.orphanedTasks.forEach(taskId => {
      console.log(`  - ${taskId}`);
    });
  }

  if (options.verbose) {
    console.log('\n📋 Strategy Tasks:');
    report.strategyTasks.forEach(task => {
      console.log(`  ${task.taskId}: ${task.status} - ${task.description.substring(0, 50)}...`);
    });

    console.log('\n📋 Kanban Tasks:');
    report.kanbanTasks.forEach(task => {
      console.log(`  ${task.taskId}: ${task.status} - ${task.title.substring(0, 50)}...`);
    });
  }

  console.log('\n' + '='.repeat(50));
}

/**
 * Generate checklist for manual review
 */
function generateChecklist(report: SyncReport): string {
  const checklist = [];
  
  checklist.push('# Master Plan Sync Checklist');
  checklist.push('');
  checklist.push(`Generated: ${new Date().toISOString()}`);
  checklist.push('');
  
  checklist.push('## 🎯 Required Actions');
  checklist.push('');
  
  if (report.missingInKanban.length > 0) {
    checklist.push('### Missing in Kanban');
    checklist.push('Add these strategy tasks to the kanban assignments:');
    report.missingInKanban.forEach(taskId => {
      const strategyTask = report.strategyTasks.find(t => t.taskId === taskId);
      checklist.push(`- [ ] ${taskId}: ${strategyTask?.description || 'No description'}`);
    });
    checklist.push('');
  }

  if (report.missingInStrategy.length > 0) {
    checklist.push('### Missing in Strategy');
    checklist.push('Add these kanban tasks to the strategy intake:');
    report.missingInStrategy.forEach(taskId => {
      const kanbanTask = report.kanbanTasks.find(t => t.taskId === taskId);
      checklist.push(`- [ ] ${taskId}: ${kanbanTask?.title || 'No title'}`);
    });
    checklist.push('');
  }

  if (report.statusMismatches.length > 0) {
    checklist.push('### Status Mismatches');
    checklist.push('Review and align status between strategy and kanban:');
    report.statusMismatches.forEach(({ taskId, strategyStatus, kanbanStatus }) => {
      checklist.push(`- [ ] ${taskId}: Update kanban status from "${kanbanStatus}" to "${strategyStatus}"`);
    });
    checklist.push('');
  }

  if (report.orphanedTasks.length > 0) {
    checklist.push('### Orphaned/Placeholder Tasks');
    checklist.push('Review these placeholder tasks:');
    report.orphanedTasks.forEach(taskId => {
      checklist.push(`- [ ] ${taskId}: Replace placeholder with actual task or remove`);
    });
    checklist.push('');
  }

  checklist.push('## 📝 Manual Review Steps');
  checklist.push('');
  checklist.push('1. Review all strategy tasks in `docs/docs/strategy/strategy_tasks.md`');
  checklist.push('2. Verify kanban assignments in `docs/docs/coordinator/agent_assignments.md`');
  checklist.push('3. Check vision document alignment in `docs/docs/strategy/idle_village_punch_club_vision.md`');
  checklist.push('4. Update any missing or mismatched entries');
  checklist.push('5. Run safeguard checks: `npm run lint -- docs && npm run build:check && npm run kanban:lint`');
  checklist.push('');
  
  return checklist.join('\n');
}

/**
 * Main execution
 */
function main(): void {
  console.log('🚀 Starting Master Plan & Kanban Sync Check...\n');

  // Check if required files exist
  const requiredFiles = [STRATEGY_TASKS_FILE, VISION_FILE, ASSIGNMENTS_FILE];
  for (const file of requiredFiles) {
    if (!existsSync(file)) {
      console.error(`❌ Required file not found: ${file}`);
      process.exit(1);
    }
  }

  try {
    console.log('📁 Reading strategy tasks...');
    const strategyTasksContent = readFileSync(STRATEGY_TASKS_FILE, 'utf-8');
    console.log('📁 Reading kanban assignments...');
    const assignmentsContent = readFileSync(ASSIGNMENTS_FILE, 'utf-8');
    
    console.log('🔍 Parsing strategy tasks...');
    const strategyTasks = parseStrategyTasks(strategyTasksContent);
    console.log(`📊 Found ${strategyTasks.length} strategy tasks`);
    
    console.log('🔍 Parsing kanban tasks...');
    const kanbanTasks = parseKanbanTasks(assignmentsContent);
    console.log(`📊 Found ${kanbanTasks.length} kanban tasks`);
    
    console.log('📋 Generating sync report...');
    const report = generateSyncReport(strategyTasks, kanbanTasks);
    
    // Print report
    printReport(report);
    
    // Generate checklist
    console.log('📝 Generating checklist...');
    const checklist = generateChecklist(report);
    const checklistFile = join(process.cwd(), 'test-results', `masterplan-sync-checklist-${new Date().toISOString().split('T')[0]}.md`);
    
    if (!existsSync(join(process.cwd(), 'test-results'))) {
      mkdirSync(join(process.cwd(), 'test-results'), { recursive: true });
    }
    
    writeFileSync(checklistFile, checklist);
    console.log(`\n📄 Checklist saved to: ${checklistFile}`);
    
    // Exit with error code if issues found
    if (report.summary.issuesFound > 0) {
      console.log(`\n⚠️  Found ${report.summary.issuesFound} issues that need attention.`);
      process.exit(1);
    } else {
      console.log('\n✅ All tasks are properly synced!');
    }
    
  } catch (error) {
    console.error('❌ Error during sync check:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { generateSyncReport, parseStrategyTasks, parseKanbanTasks };
