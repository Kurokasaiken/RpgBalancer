#!/usr/bin/env node

import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..');
const TIME_TRACKING_DIR = resolve(PROJECT_ROOT, 'test-results/time-tracking');

/**
 * Time tracking system for task execution analysis.
 * Supports both automatic and manual time logging with Kanban integration.
 */

interface TimeEntry {
  taskId: string;
  taskDescription: string;
  agent: string;
  startTime?: string;
  endTime?: string;
  duration?: number; // in minutes
  estimatedDuration?: number; // in minutes
  category: string;
  status: 'planning' | 'in_progress' | 'completed' | 'paused';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface TimeTrackingData {
  entries: TimeEntry[];
  metadata: {
    version: string;
    lastUpdated: string;
    totalTasks: number;
    totalCompletedTasks: number;
    totalTrackedMinutes: number;
  };
}

const TIME_TRACKING_VERSION = '1.0.0';

/**
 * Ensure time tracking directory exists.
 */
function ensureTimeTrackingDirectory(): void {
  if (!existsSync(TIME_TRACKING_DIR)) {
    mkdirSync(TIME_TRACKING_DIR, { recursive: true });
  }
}

/**
 * Load existing time tracking data or create new structure.
 */
function loadTimeTrackingData(): TimeTrackingData {
  const dataFile = join(TIME_TRACKING_DIR, 'time-tracking.json');
  
  if (existsSync(dataFile)) {
    try {
      const data = JSON.parse(readFileSync(dataFile, 'utf8'));
      return data;
    } catch (error) {
      console.warn('⚠️  Failed to load time tracking data, creating new structure:', error);
    }
  }

  return {
    entries: [],
    metadata: {
      version: TIME_TRACKING_VERSION,
      lastUpdated: new Date().toISOString(),
      totalTasks: 0,
      totalCompletedTasks: 0,
      totalTrackedMinutes: 0,
    },
  };
}

/**
 * Save time tracking data to file.
 */
function saveTimeTrackingData(data: TimeTrackingData): void {
  ensureTimeTrackingDirectory();
  const dataFile = join(TIME_TRACKING_DIR, 'time-tracking.json');
  
  data.metadata.lastUpdated = new Date().toISOString();
  
  // Update metadata
  data.metadata.totalTasks = data.entries.length;
  data.metadata.totalCompletedTasks = data.entries.filter(e => e.status === 'completed').length;
  data.metadata.totalTrackedMinutes = data.entries
    .filter(e => e.duration)
    .reduce((sum, e) => sum + (e.duration || 0), 0);
  
  writeFileSync(dataFile, JSON.stringify(data, null, 2), 'utf8');
  console.log(`💾 Time tracking data saved to ${dataFile}`);
}

/**
 * Start tracking time for a task.
 */
function startTask(taskId: string, taskDescription: string, agent: string, estimatedDuration?: number): void {
  const data = loadTimeTrackingData();
  
  // Check if task already exists
  const existingEntry = data.entries.find(e => e.taskId === taskId);
  
  if (existingEntry) {
    if (existingEntry.status === 'in_progress') {
      console.log(`⏱️  Task ${taskId} is already in progress`);
      return;
    }
    
    // Resume existing task
    existingEntry.startTime = new Date().toISOString();
    existingEntry.status = 'in_progress';
    existingEntry.updatedAt = new Date().toISOString();
    if (estimatedDuration) {
      existingEntry.estimatedDuration = estimatedDuration;
    }
  } else {
    // Create new task entry
    const newEntry: TimeEntry = {
      taskId,
      taskDescription,
      agent,
      startTime: new Date().toISOString(),
      estimatedDuration,
      category: inferCategory(taskDescription),
      status: 'in_progress',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    data.entries.push(newEntry);
  }
  
  saveTimeTrackingData(data);
  console.log(`▶️  Started tracking task: ${taskId}`);
}

/**
 * Stop tracking time for a task.
 */
function stopTask(taskId: string, notes?: string): void {
  const data = loadTimeTrackingData();
  const entry = data.entries.find(e => e.taskId === taskId);
  
  if (!entry) {
    console.error(`❌ Task ${taskId} not found`);
    return;
  }
  
  if (entry.status !== 'in_progress') {
    console.log(`⏸️  Task ${taskId} is not currently in progress`);
    return;
  }
  
  const endTime = new Date();
  entry.endTime = endTime.toISOString();
  entry.status = 'completed';
  entry.updatedAt = endTime.toISOString();
  
  if (entry.startTime) {
    const start = new Date(entry.startTime);
    const durationMs = endTime.getTime() - start.getTime();
    entry.duration = Math.round(durationMs / (1000 * 60)); // Convert to minutes
  }
  
  if (notes) {
    entry.notes = notes;
  }
  
  saveTimeTrackingData(data);
  console.log(`⏹️  Stopped tracking task: ${taskId} (Duration: ${entry.duration} minutes)`);
}

/**
 * Pause tracking for a task.
 */
function pauseTask(taskId: string): void {
  const data = loadTimeTrackingData();
  const entry = data.entries.find(e => e.taskId === taskId);
  
  if (!entry) {
    console.error(`❌ Task ${taskId} not found`);
    return;
  }
  
  if (entry.status !== 'in_progress') {
    console.log(`⏸️  Task ${taskId} is not currently in progress`);
    return;
  }
  
  const pauseTime = new Date();
  entry.endTime = pauseTime.toISOString();
  entry.status = 'paused';
  entry.updatedAt = pauseTime.toISOString();
  
  if (entry.startTime) {
    const start = new Date(entry.startTime);
    const durationMs = pauseTime.getTime() - start.getTime();
    entry.duration = Math.round(durationMs / (1000 * 60));
  }
  
  saveTimeTrackingData(data);
  console.log(`⏸️  Paused tracking task: ${taskId}`);
}

/**
 * Resume tracking for a paused task.
 */
function resumeTask(taskId: string): void {
  const data = loadTimeTrackingData();
  const entry = data.entries.find(e => e.taskId === taskId);
  
  if (!entry) {
    console.error(`❌ Task ${taskId} not found`);
    return;
  }
  
  if (entry.status !== 'paused') {
    console.log(`▶️  Task ${taskId} is not paused`);
    return;
  }
  
  entry.startTime = new Date().toISOString();
  entry.endTime = undefined;
  entry.status = 'in_progress';
  entry.updatedAt = new Date().toISOString();
  
  saveTimeTrackingData(data);
  console.log(`▶️  Resumed tracking task: ${taskId}`);
}

/**
 * List all tracked tasks.
 */
function listTasks(filter?: 'all' | 'active' | 'completed'): void {
  const data = loadTimeTrackingData();
  let entries = data.entries;
  
  if (filter === 'active') {
    entries = entries.filter(e => e.status === 'in_progress');
  } else if (filter === 'completed') {
    entries = entries.filter(e => e.status === 'completed');
  }
  
  if (entries.length === 0) {
    console.log(`📋 No tasks found${filter ? ` with filter: ${filter}` : ''}`);
    return;
  }
  
  console.log(`\n📋 Time Tracking Entries (${filter || 'all'}):`);
  console.log('─'.repeat(80));
  
  entries.forEach(entry => {
    const statusIcon = getStatusIcon(entry.status);
    const duration = entry.duration ? `${entry.duration}m` : 'ongoing';
    const estimated = entry.estimatedDuration ? ` (est. ${entry.estimatedDuration}m)` : '';
    
    console.log(`${statusIcon} ${entry.taskId} - ${entry.taskDescription}`);
    console.log(`   Agent: ${entry.agent} | Category: ${entry.category} | Duration: ${duration}${estimated}`);
    
    if (entry.notes) {
      console.log(`   Notes: ${entry.notes}`);
    }
    console.log('');
  });
}

/**
 * Get status icon for task status.
 */
function getStatusIcon(status: string): string {
  switch (status) {
    case 'in_progress': return '▶️';
    case 'completed': return '✅';
    case 'paused': return '⏸️';
    case 'planning': return '📋';
    default: return '❓';
  }
}

/**
 * Infer task category from description.
 */
function inferCategory(description: string): string {
  const desc = description.toLowerCase();
  
  if (desc.includes('test') || desc.includes('spec') || desc.includes('e2e')) {
    return 'Testing';
  } else if (desc.includes('config') || desc.includes('balancer') || desc.includes('ui')) {
    return 'Development';
  } else if (desc.includes('doc') || desc.includes('guide') || desc.includes('readme')) {
    return 'Documentation';
  } else if (desc.includes('fix') || desc.includes('bug') || desc.includes('issue')) {
    return 'Bug Fix';
  } else if (desc.includes('refactor') || desc.includes('cleanup') || desc.includes('optimize')) {
    return 'Refactoring';
  } else {
    return 'General';
  }
}

/**
 * Parse command line arguments.
 */
function parseArgs(argv: string[]): { command: string; taskId?: string; description?: string; agent?: string; estimated?: number; notes?: string; filter?: string } {
  const result: { command: string; taskId?: string; description?: string; agent?: string; estimated?: number; notes?: string; filter?: string } = { command: argv[2] };
  
  for (let i = 3; i < argv.length; i += 1) {
    const arg = argv[i];
    
    if (arg === '--task' || arg === '-t') {
      result.taskId = argv[i + 1];
      i += 1;
      continue;
    }
    
    if (arg === '--description' || arg === '-d') {
      result.description = argv[i + 1];
      i += 1;
      continue;
    }
    
    if (arg === '--agent' || arg === '-a') {
      result.agent = argv[i + 1];
      i += 1;
      continue;
    }
    
    if (arg === '--estimated' || arg === '-e') {
      result.estimated = parseInt(argv[i + 1], 10);
      i += 1;
      continue;
    }
    
    if (arg === '--notes' || arg === '-n') {
      result.notes = argv[i + 1];
      i += 1;
      continue;
    }
    
    if (arg === '--filter' || arg === '-f') {
      result.filter = argv[i + 1];
      i += 1;
      continue;
    }
  }
  
  return result;
}

/**
 * Main CLI handler.
 */
function main(): void {
  const args = parseArgs(process.argv);
  
  switch (args.command) {
    case 'start':
      if (!args.taskId || !args.description || !args.agent) {
        console.error('❌ Missing required arguments for start command');
        console.log('Usage: npm run time-tracker start --task <taskId> --description <desc> --agent <agent> [--estimated <minutes>]');
        process.exit(1);
      }
      startTask(args.taskId, args.description, args.agent, args.estimated);
      break;
      
    case 'stop':
      if (!args.taskId) {
        console.error('❌ Missing required task ID for stop command');
        console.log('Usage: npm run time-tracker stop --task <taskId> [--notes <notes>]');
        process.exit(1);
      }
      stopTask(args.taskId, args.notes);
      break;
      
    case 'pause':
      if (!args.taskId) {
        console.error('❌ Missing required task ID for pause command');
        console.log('Usage: npm run time-tracker pause --task <taskId>');
        process.exit(1);
      }
      pauseTask(args.taskId);
      break;
      
    case 'resume':
      if (!args.taskId) {
        console.error('❌ Missing required task ID for resume command');
        console.log('Usage: npm run time-tracker resume --task <taskId>');
        process.exit(1);
      }
      resumeTask(args.taskId);
      break;
      
    case 'list':
      listTasks(args.filter as 'all' | 'active' | 'completed');
      break;
      
    default:
      console.log('🕐 Time Tracking System');
      console.log('');
      console.log('Commands:');
      console.log('  start    - Start tracking a new task');
      console.log('  stop     - Stop tracking a task');
      console.log('  pause    - Pause tracking a task');
      console.log('  resume   - Resume a paused task');
      console.log('  list     - List tracked tasks');
      console.log('');
      console.log('Examples:');
      console.log('  npm run time-tracker start --task KS-067 --description "Time Tracking System" --agent Cascade --estimated 120');
      console.log('  npm run time-tracker stop --task KS-067 --notes "Implementation completed successfully"');
      console.log('  npm run time-tracker list --filter active');
      break;
  }
}

// Run main function if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { startTask, stopTask, pauseTask, resumeTask, listTasks, loadTimeTrackingData, saveTimeTrackingData };
export type { TimeEntry, TimeTrackingData };
