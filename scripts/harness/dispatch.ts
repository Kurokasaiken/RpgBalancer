#!/usr/bin/env tsx
/**
 * Parallel dispatcher for the executor harness.
 *
 * Reads the Kanban board, groups tasks into dependency waves, and dispatches
 * each wave in parallel. Tasks in a wave have no unresolved dependencies.
 * Supports git worktree isolation (Fase 3).
 */

import { execSync, spawn } from 'node:child_process';
import { mkdirSync, rmSync, existsSync } from 'node:fs';
import path from 'node:path';
import { loadKanbanRows, updateKanbanRow, type KanbanRow } from './kanbanManager.js';
import { loadHarnessConfig } from './config.js';
import { checkDispatchGates, extractFileTargetsFromNotes } from './dispatchGates.js';

interface CliArgs {
  dryRun: boolean;
  maxParallel: number;
  statusFilter: string;
  worktreeBase: string;
  idFilter?: string[];
  limit?: number;
  timeout?: number;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { dryRun: false, maxParallel: 3, statusFilter: 'Non assegnato', worktreeBase: 'tmp/harness-worktrees' };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    switch (arg) {
      case '--dry-run':
        args.dryRun = true;
        break;
      case '--max-parallel':
        args.maxParallel = Number(argv[++i]) || 3;
        break;
      case '--status':
        args.statusFilter = argv[++i] ?? 'Non assegnato';
        break;
      case '--worktree-base':
        args.worktreeBase = argv[++i] ?? 'tmp/harness-worktrees';
        break;
      case '--id-filter':
        args.idFilter = argv[++i]?.split(/[,\s]+/).map((id) => id.trim()).filter((id) => id.length > 0) ?? undefined;
        break;
      case '--limit':
        args.limit = Number(argv[++i]) || undefined;
        break;
      case '--timeout':
        args.timeout = Number(argv[++i]) || undefined;
        break;
      default:
        break;
    }
  }
  return args;
}

/** Compute dependency waves from all Kanban rows and a set of candidates. */
function computeWaves(allRows: KanbanRow[], candidateIds: Set<string>): string[][] {
  const rowById = new Map<string, KanbanRow>(allRows.map((r) => [r.canonicalId, r]));
  const completed = new Set<string>();
  const remaining = new Map<string, KanbanRow>(
    allRows.filter((r) => candidateIds.has(r.canonicalId)).map((r) => [r.canonicalId, r]),
  );
  const waves: string[][] = [];

  function isDependencyDone(depId: string): boolean {
    if (completed.has(depId)) {
      return true;
    }
    const depRow = rowById.get(depId);
    if (!depRow) {
      return true; // unknown dependency ID, treat as done
    }
    return depRow.status === 'Completato';
  }

  while (remaining.size > 0) {
    const wave: string[] = [];

    for (const [id, row] of remaining) {
      const deps = row.dependencies
        .split(/[,\s]+/)
        .map((d: string) => d.trim())
        .filter((d: string) => d.length > 0 && d !== '-');

      const allDepsDone = deps.every((dep: string) => isDependencyDone(dep));

      if (allDepsDone) {
        wave.push(id);
      }
    }

    if (wave.length === 0) {
      // Cyclic dependency or blocked. Break to avoid infinite loop.
      break;
    }

    for (const id of wave) {
      completed.add(id);
      remaining.delete(id);
    }

    waves.push(wave);
  }

  return waves;
}

/**
 * Create a git worktree for a task.
 *
 * @param taskId Task identifier.
 * @param worktreePath Absolute path for the worktree.
 * @param dryRun If true, do not modify git state.
 */
function createWorktree(taskId: string, worktreePath: string, dryRun: boolean): void {
  const branch = `harness/${taskId}`;
  if (existsSync(worktreePath)) {
    return;
  }

  if (dryRun) {
    console.log(`[dry-run] git worktree add -b ${branch} ${worktreePath}`);
    return;
  }

  execSync(`git worktree add -b ${branch} ${worktreePath} HEAD`, {
    stdio: 'pipe',
    encoding: 'utf8',
  });
}

/**
 * Remove a git worktree.
 */
function removeWorktree(worktreePath: string, dryRun: boolean): void {
  if (!existsSync(worktreePath)) {
    return;
  }

  if (dryRun) {
    console.log(`[dry-run] git worktree remove ${worktreePath}`);
    return;
  }

  try {
    execSync(`git worktree remove ${worktreePath}`, { stdio: 'pipe', encoding: 'utf8' });
  } catch {
    // If worktree is dirty, force remove.
    try {
      execSync(`git worktree remove -f ${worktreePath}`, { stdio: 'pipe', encoding: 'utf8' });
    } catch {
      // fallback: delete directory
      rmSync(worktreePath, { recursive: true, force: true });
    }
  }
}

/**
 * Run the harness for a single task in a worktree.
 */
async function runTask(
  taskId: string,
  worktreePath: string,
  dryRun: boolean,
  timeoutMs: number,
): Promise<{ taskId: string; ok: boolean; output: string }> {
  const promptMdPath = path.join('prompts', `${taskId}.md`);
  const promptSpecPath = path.join('prompts', `${taskId}.spec.json`);
  const mdAbsPath = path.resolve(promptMdPath);
  const specAbsPath = path.resolve(promptSpecPath);

  let command: string;
  const timeoutArg = ` --timeout ${timeoutMs}`;
  if (existsSync(specAbsPath)) {
    command = `npm run harness:run -- --spec ${promptSpecPath} --id ${taskId} --workspace ${worktreePath} --no-kanban --skip-safeguards${timeoutArg}`;
  } else if (existsSync(mdAbsPath)) {
    command = `npm run harness:run -- --prompt-id ${taskId} --workspace ${worktreePath} --no-kanban --skip-safeguards${timeoutArg}`;
  } else {
    return { taskId, ok: false, output: `Prompt file not found: ${promptMdPath} or ${promptSpecPath}` };
  }

  if (dryRun) {
    console.log(`[dry-run] ${command}`);
    return { taskId, ok: true, output: '[dry-run] skipped' };
  }

  return new Promise((resolve) => {
    const [cmd, ...args] = command.split(' ');
    const child = spawn(cmd, args, { shell: true, stdio: 'pipe' });
    let output = '';
    let finished = false;

    const timeout = setTimeout(() => {
      if (finished) return;
      finished = true;
      child.kill('SIGTERM');
      const message = `Task timed out after ${timeoutMs}ms`;
      console.error(`  ${taskId}: ${message}`);
      resolve({ taskId, ok: false, output: `${output.slice(-4000)}\n${message}` });
    }, timeoutMs);

    child.stdout?.on('data', (data: Buffer) => {
      output += data.toString();
    });
    child.stderr?.on('data', (data: Buffer) => {
      output += data.toString();
    });
    child.on('close', (code) => {
      if (finished) return;
      finished = true;
      clearTimeout(timeout);
      resolve({ taskId, ok: code === 0, output: output.slice(-4000) });
    });
  });
}

/**
 * Run tasks in a wave with limited concurrency.
 */
async function runWave(
  taskIds: string[],
  worktreeBase: string,
  dryRun: boolean,
  maxParallel: number,
  timeoutMs: number,
  allRows: KanbanRow[],
): Promise<{ taskId: string; ok: boolean; output: string }[]> {
  const results: { taskId: string; ok: boolean; output: string }[] = [];

  for (let i = 0; i < taskIds.length; i += maxParallel) {
    const batch = taskIds.slice(i, i + maxParallel);
    const batchResults = await Promise.all(
      batch.map(async (taskId) => {
        // Check dispatch gates before running task
        const row = allRows.find((r) => r.canonicalId === taskId);
        if (!row) {
          return { taskId, ok: false, output: `Task ${taskId} not found in Kanban` };
        }

        const fileTargets = extractFileTargetsFromNotes(row.notes);
        const [allowed, reason] = await checkDispatchGates(taskId, row.dependencies, fileTargets);

        if (!allowed) {
          console.log(`  ⏸️  ${taskId} BLOCKED: ${reason} (rimane in coda)`);
          if (!dryRun) {
            await updateKanbanRow(taskId, {
              status: 'Non assegnato',  // Task remains candidate for next dispatch cycle
              agent: 'harness',
              lastUpdate: new Date().toISOString(),
            });
          }
          return { taskId, ok: false, output: reason };
        }

        const worktreePath = path.resolve(worktreeBase, taskId);
        createWorktree(taskId, worktreePath, dryRun);
        const result = await runTask(taskId, worktreePath, dryRun, timeoutMs);
        if (!dryRun) {
          removeWorktree(worktreePath, dryRun);
        }
        return result;
      }),
    );
    results.push(...batchResults);
  }

  return results;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const config = loadHarnessConfig();

  if (!config.apiKey) {
    console.error('Missing API key. Set GROQ_API_KEY in .env.');
    process.exitCode = 1;
    return;
  }

  const rows = await loadKanbanRows();
  let candidateRows = rows.filter((r) => r.status === args.statusFilter);

  if (args.idFilter && args.idFilter.length > 0) {
    const allowed = new Set(args.idFilter);
    candidateRows = candidateRows.filter((r) => allowed.has(r.canonicalId));
  }

  if (args.limit !== undefined && args.limit > 0) {
    candidateRows = candidateRows.slice(0, args.limit);
  }

  if (candidateRows.length === 0) {
    console.log(`No rows with status "${args.statusFilter}" found.`);
    return;
  }

  const candidateIds = new Set(candidateRows.map((r) => r.canonicalId));
  const waves = computeWaves(rows, candidateIds);

  console.log(`Dispatching ${candidateRows.length} tasks in ${waves.length} waves (max ${args.maxParallel} parallel).`);
  if (args.dryRun) {
    console.log('Dry-run mode: no git or filesystem changes.\n');
  }

  mkdirSync(path.resolve(args.worktreeBase), { recursive: true });

  for (let waveIndex = 0; waveIndex < waves.length; waveIndex += 1) {
    const wave = waves[waveIndex];
    console.log(`\nWave ${waveIndex + 1}/${waves.length}: ${wave.join(', ')}`);

    const results = await runWave(wave, args.worktreeBase, args.dryRun, args.maxParallel, args.timeout ?? config.taskTimeout, rows);

    for (const result of results) {
      console.log(`  ${result.ok ? '✅' : '❌'} ${result.taskId}`);
      if (!result.ok) {
        console.log(`     ${result.output.split('\n').slice(-3).join('\n     ')}`);
      }

      if (!args.dryRun) {
        const newStatus = result.ok ? 'Completato' : 'Assegnato';
        await updateKanbanRow(result.taskId, {
          status: newStatus,
          agent: 'harness',
          lastUpdate: new Date().toISOString(),
          endTime: result.ok ? new Date().toISOString() : undefined,
        });
      }
    }
  }

  console.log('\nDispatch complete.');
}

main().catch((error) => {
  console.error('Dispatch error:', error);
  process.exitCode = 1;
});
