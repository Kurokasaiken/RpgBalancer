/**
 * Dispatch gates for the Coordinator (TypeScript version for harness).
 *
 * Implements two mandatory checks before dispatching any task to any executor:
 * 1. DEPENDENCY GATE: Verifies all dependencies are completed
 * 2. CROSS-CHANNEL FILE-TARGET AUDIT: Verifies file_targets are not occupied by other channels
 */

import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import * as path from 'node:path';
import { loadKanbanRows, type KanbanRow } from './kanbanManager.js';

const AGENT_ASSIGNMENTS_PATH = path.resolve(
  'src',
  'docs',
  'docs',
  'coordinator',
  'agent_assignments.md',
);
const AI_KANBAN_PATH = path.resolve('coordinator', 'ai-worker', 'kanban.json');
const DISPATCH_BLOCKS_LOG = path.resolve('coordinator', 'dispatch-blocks.log');

interface KanbanRow {
  id: string;
  status: string;
  dependencies: string;
  agent: string;
  lastUpdate: string;
  notes: string;
  executor: string;
  executorReason: string;
}

interface AiKanbanTask {
  id: string;
  status: string;
  target_file: string;
  prompt: string;
  complexity: number;
}

interface AiKanban {
  tasks: AiKanbanTask[];
}

/** Log a dispatch block event to coordinator/dispatch-blocks.log. */
async function logDispatchBlock(taskId: string, reason: string, blockingInfo: string): Promise<void> {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] BLOCKED ${taskId} | ${reason} | ${blockingInfo}\n`;

  const logDir = path.dirname(DISPATCH_BLOCKS_LOG);
  await writeFile(DISPATCH_BLOCKS_LOG, logEntry, { flag: 'a' });
  console.log(`[BLOCK] ${taskId}: ${reason} (${blockingInfo})`);
}

/** Parse agent_assignments.md and return list of row dicts. */
async function parseAgentAssignmentsRows(): Promise<KanbanRow[]> {
  if (!existsSync(AGENT_ASSIGNMENTS_PATH)) {
    return [];
  }

  const content = await readFile(AGENT_ASSIGNMENTS_PATH, 'utf8');
  const lines = content.split(/\r?\n/);
  const rows: KanbanRow[] = [];

  for (const line of lines) {
    if (!line.trim().startsWith('|')) continue;
    if (line.includes('---')) continue;

    const columns = line.split('|').slice(1, -1).map((col) => col.trim());
    if (columns.length < 5) continue;
    if (columns[0] === 'Prompt ID/Descrizione') continue;

    // Parse based on column count (5, 8, or 10 columns)
    let row: KanbanRow;
    if (columns.length >= 10) {
      // 10-column format (harness-generated with timestamps)
      row = {
        id: columns[0],
        status: columns[1],
        dependencies: columns[2],
        agent: columns[3],
        lastUpdate: columns[8],
        notes: columns[9],
        executor: columns[5],
        executorReason: columns[6],
      };
    } else if (columns.length >= 8) {
      // 8-column format with executor columns
      row = {
        id: columns[0],
        status: columns[1],
        dependencies: columns[2],
        agent: columns[3],
        lastUpdate: columns[4],
        notes: columns[5],
        executor: columns[6],
        executorReason: columns[7],
      };
    } else {
      // Legacy format (5 columns)
      row = {
        id: columns[0],
        status: columns[1],
        dependencies: '',
        agent: columns[2],
        lastUpdate: columns[3],
        notes: columns[4],
        executor: '',
        executorReason: '',
      };
    }

    rows.push(row);
  }

  return rows;
}

/** Extract FILE TARGET entries from notes. */
function extractFileTargetsFromNotes(notes: string): Set<string> {
  const match = notes.match(/FILE TARGET:\s*([\s\S]+?)(?=\n\n|\n[A-Z]|\n#|$)/);
  if (!match) {
    return new Set();
  }

  const targetsText = match[1]!.trim();
  const targets = new Set<string>();
  const parts = targetsText.split(/,|\n/);
  for (let i = 0; i < parts.length; i++) {
    const trimmed = parts[i]!.trim();
    if (trimmed) {
      targets.add(trimmed);
    }
  }

  return targets;
}

/** Get file_targets currently occupied by tasks in progress. */
async function getInProgressFileTargets(): Promise<Set<[string, string]>> {
  const rows = await loadKanbanRows(AGENT_ASSIGNMENTS_PATH);
  const occupied = new Set<[string, string]>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    if (row.status !== 'In corso' && row.status !== 'Delegato ad ai-worker (in attesa)') {
      continue;
    }

    const fileTargets = extractFileTargetsFromNotes(row.notes);
    const targetArray = Array.from(fileTargets);
    for (let j = 0; j < targetArray.length; j++) {
      const target = targetArray[j]!;
      occupied.add([target, row.id]);
    }
  }

  return occupied;
}

/** Get file_targets occupied by ai-worker tasks. */
async function getAiWorkerFileTargets(): Promise<Set<[string, string]>> {
  if (!existsSync(AI_KANBAN_PATH)) {
    return new Set();
  }

  const content = await readFile(AI_KANBAN_PATH, 'utf8');
  const kanban: AiKanban = JSON.parse(content);
  const occupied = new Set<[string, string]>();

  for (let i = 0; i < kanban.tasks.length; i++) {
    const task = kanban.tasks[i]!;
    const status = task.status;
    if (status === 'todo' || status === 'in_progress') {
      const targetFile = task.target_file;
      const taskId = task.id;
      if (targetFile && taskId) {
        occupied.add([targetFile, taskId]);
      }
    }
  }

  return occupied;
}

/** Get file_targets occupied by harness worktrees. */
async function getHarnessFileTargets(): Promise<Set<[string, string]>> {
  // TODO: Implement harness worktree state tracking if needed
  return new Set();
}

/** Check if all dependencies are completed. */
async function checkDependencyGate(taskId: string, dependencies: string): Promise<[boolean, string]> {
  if (!dependencies || dependencies === '-') {
    return [true, ''];
  }

  const rows = await loadKanbanRows(AGENT_ASSIGNMENTS_PATH);
  const rowById = new Map<string, KanbanRow>();
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    rowById.set(row.canonicalId, row);
  }

  const depIds = dependencies
    .split(/,|\s+/)
    .map((d) => d.trim())
    .filter((d) => d.length > 0 && d !== '-');

  const incompleteDeps: string[] = [];
  for (let i = 0; i < depIds.length; i++) {
    const depId = depIds[i]!;
    const depRow = rowById.get(depId);
    if (!depRow) {
      incompleteDeps.push(`${depId} (not found)`);
    } else if (depRow.status !== 'Completato') {
      incompleteDeps.push(`${depId} (status: ${depRow.status})`);
    }
  }

  if (incompleteDeps.length > 0) {
    const reason = `Dependencies not completed: ${incompleteDeps.join(', ')}`;
    return [false, reason];
  }

  return [true, ''];
}

/** Check if file_targets conflict with occupied files across channels. */
async function checkFileTargetAudit(taskId: string, fileTargets: Set<string>): Promise<[boolean, string]> {
  if (fileTargets.size === 0) {
    return [true, ''];
  }

  // Get occupied files from all channels
  const inProgress = await getInProgressFileTargets();
  const aiWorker = await getAiWorkerFileTargets();
  const harness = await getHarnessFileTargets();

  const allOccupied = new Set(Array.from(inProgress).concat(Array.from(aiWorker)).concat(Array.from(harness)));

  const conflicts: string[] = [];
  const targetArray = Array.from(fileTargets);
  for (let i = 0; i < targetArray.length; i++) {
    const target = targetArray[i]!;
    const occupiedArray = Array.from(allOccupied);
    for (let j = 0; j < occupiedArray.length; j++) {
      const [occupiedFile, occupiedTaskId] = occupiedArray[j]!;
      if (target === occupiedFile || target.includes(occupiedFile) || occupiedFile.includes(target)) {
        // Determine channel
        let channel = 'unknown';
        if (inProgress.has([occupiedFile, occupiedTaskId])) {
          channel = 'agent_assignments';
        } else if (aiWorker.has([occupiedFile, occupiedTaskId])) {
          channel = 'ai-worker';
        } else if (harness.has([occupiedFile, occupiedTaskId])) {
          channel = 'harness';
        }

        conflicts.push(`${target} occupied by ${occupiedTaskId} (${channel})`);
      }
    }
  }

  if (conflicts.length > 0) {
    const reason = `File conflicts: ${conflicts.join(', ')}`;
    return [false, reason];
  }

  return [true, ''];
}

/** Run both dispatch gates before dispatching a task. */
export async function checkDispatchGates(
  taskId: string,
  dependencies: string,
  fileTargets: Set<string>,
): Promise<[boolean, string]> {
  // Check dependency gate
  const [depAllowed, depReason] = await checkDependencyGate(taskId, dependencies);
  if (!depAllowed) {
    await logDispatchBlock(taskId, 'DEPENDENCY GATE', depReason);
    return [false, `In attesa di dipendenze: ${depReason}`];
  }

  // Check file target audit
  const [fileAllowed, fileReason] = await checkFileTargetAudit(taskId, fileTargets);
  if (!fileAllowed) {
    await logDispatchBlock(taskId, 'FILE TARGET AUDIT', fileReason);
    return [false, `In attesa - file occupato: ${fileReason}`];
  }

  return [true, ''];
}

/** Extract FILE TARGET entries from prompt notes (exported for use in dispatch.ts). */
export { extractFileTargetsFromNotes };
