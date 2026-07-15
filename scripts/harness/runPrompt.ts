#!/usr/bin/env tsx
/**
 * Harness CLI: run a single prompt through the cheap executor.
 *
 * Usage:
 *   npm run harness:run -- --file <prompt.md> [--workspace <dir>] [--id <TASK_ID>] [--json]
 *   npm run harness:run -- --text "..." [--workspace <dir>]
 *
 * Fase 1 scope: executes one prompt end-to-end in a workspace and writes an
 * evidence log. Lock/Kanban/safeguard-gate wiring arrives in Fase 2.
 */

import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { loadHarnessConfig } from './config.js';
import { createGroqAdapter } from './providers/groqAdapter.js';
import { runAgentLoop } from './agentLoop.js';
import type { AgentRunResult } from './agentLoop.js';
import { findKanbanRow, updateKanbanRow, extractFileTargets } from './kanbanManager.js';
import { lockFilesForPrompt, unlockFilesForPrompt } from '../fileLockManager.js';
import { runSafeguardGate } from './safeguardGate.js';
import { parseSpecFile, expandSpec } from './specParser.js';

interface CliArgs {
  file?: string;
  text?: string;
  spec?: string;
  workspace?: string;
  id?: string;
  promptId?: string;
  agent?: string;
  json: boolean;
  skipSafeguards: boolean;
  noKanban: boolean;
  timeout?: number;
}

/** Parse process argv into typed CLI args. */
function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { json: false, skipSafeguards: false, noKanban: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    switch (arg) {
      case '--file':
        args.file = argv[++i];
        break;
      case '--text':
        args.text = argv[++i];
        break;
      case '--spec':
        args.spec = argv[++i];
        break;
      case '--workspace':
        args.workspace = argv[++i];
        break;
      case '--id':
        args.id = argv[++i];
        break;
      case '--prompt-id':
        args.promptId = argv[++i];
        break;
      case '--agent':
        args.agent = argv[++i];
        break;
      case '--json':
        args.json = true;
        break;
      case '--skip-safeguards':
        args.skipSafeguards = true;
        break;
      case '--no-kanban':
        args.noKanban = true;
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

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const config = loadHarnessConfig();

  if (!config.apiKey) {
    console.error(
      `Missing ${config.apiKeyEnv}. Add it to your environment or a .env file at the repo root.`,
    );
    process.exitCode = 1;
    return;
  }

  let promptText: string;
  if (args.text) {
    promptText = args.text;
  } else if (args.file) {
    const filePath = path.resolve(config.repoRoot, args.file);
    if (!existsSync(filePath)) {
      console.error(`Prompt file not found: ${filePath}`);
      process.exitCode = 1;
      return;
    }
    promptText = readFileSync(filePath, 'utf8');
  } else if (args.spec) {
    const specPath = path.resolve(config.repoRoot, args.spec);
    if (!existsSync(specPath)) {
      console.error(`Spec file not found: ${specPath}`);
      process.exitCode = 1;
      return;
    }
    const spec = await parseSpecFile(specPath);
    promptText = expandSpec(spec);
  } else if (args.promptId) {
    // For Kanban-driven tasks, the prompt may be provided in a file named after the ID.
    const promptPath = path.resolve(config.repoRoot, 'prompts', `${args.promptId}.md`);
    if (existsSync(promptPath)) {
      promptText = readFileSync(promptPath, 'utf8');
    } else {
      console.error(`Provide --file <prompt.md>, --text "...", --spec <spec.json>, or a file prompts/${args.promptId}.md.`);
      process.exitCode = 1;
      return;
    }
  } else {
    console.error('Provide --file <prompt.md>, --text "...", or --spec <spec.json>.');
    process.exitCode = 1;
    return;
  }

  const workspaceRoot = path.resolve(config.repoRoot, args.workspace ?? '.');
  const taskId = args.promptId ?? args.id ?? 'harness-task';
  const agentName = args.agent ?? 'harness';

  console.log(`Harness executor: provider=${config.provider} model=${config.model}`);
  console.log(`Workspace: ${workspaceRoot}`);
  console.log(`Task: ${taskId}\n`);

  // Fase 2: Kanban + lock integration.
  const promptId = args.promptId;
  const kanbanRow = promptId ? await findKanbanRow(promptId) : undefined;
  let lockedFiles: string[] = [];
  let executionHint: 'atomic' | 'verified' | 'architectural' | undefined;

  // Extract execution_hint from spec if available
  if (args.spec) {
    const specPath = path.resolve(config.repoRoot, args.spec);
    if (existsSync(specPath)) {
      const spec = await parseSpecFile(specPath);
      executionHint = spec.execution_hint;
    }
  }

  if (kanbanRow && promptId && !args.noKanban) {
    if (kanbanRow.status !== 'Non assegnato' && kanbanRow.status !== 'Assegnato') {
      console.error(`Prompt "${promptId}" is already "${kanbanRow.status}".`);
      process.exitCode = 1;
      return;
    }

    lockedFiles = extractFileTargets(promptText);
    if (lockedFiles.length > 0) {
      await lockFilesForPrompt(promptId, agentName, lockedFiles);
      console.log(`Locked ${lockedFiles.length} file(s) for ${promptId}`);
    }

    await updateKanbanRow(promptId, {
      status: 'In corso',
      agent: agentName,
      lastUpdate: new Date().toISOString(),
    });
    console.log(`Kanban: ${promptId} -> In corso`);
  }

  const provider = createGroqAdapter(config);
  const timeoutMs = args.timeout ?? config.taskTimeout;
  const startedAt = Date.now();

  const runPromise = (async (): Promise<{ result: AgentRunResult; safeguard: { ok: boolean; results: unknown[] } | undefined }> => {
    const result = await runAgentLoop(
      promptText,
      provider,
      config,
      workspaceRoot,
      (event) => console.log(`  · ${event}`),
    );

    // Fase 2: safeguard gate before marking complete.
    let safeguard: { ok: boolean; results: unknown[] } | undefined;
    if (result.completed && !args.skipSafeguards) {
      console.log('\n  Running safeguard gate...');
      safeguard = await runSafeguardGate(taskId, undefined, executionHint);
      const gateStatus = safeguard.ok ? 'PASSED' : 'FAILED';
      console.log(`  Safeguard gate: ${gateStatus}`);
      if (!safeguard.ok) {
        result.completed = false;
      }
    }

    return { result, safeguard };
  })();

  let result: AgentRunResult;
  let safeguard: { ok: boolean; results: unknown[] } | undefined;
  let timedOut = false;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    const outcome = await Promise.race([
      runPromise,
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('timeout')), timeoutMs);
      }),
    ]);
    clearTimeout(timeoutId);
    result = outcome.result;
    safeguard = outcome.safeguard;
  } catch {
    timedOut = true;
    console.error(`\nTask ${taskId} timed out after ${timeoutMs}ms`);
    result = {
      completed: false,
      summary: `Task timed out after ${timeoutMs}ms`,
      touchedFiles: [],
      iterations: 0,
      transcript: [],
    };
    safeguard = undefined;
  }

  const durationMs = Date.now() - startedAt;

  // Write evidence log.
  const evidenceDir = path.join(config.repoRoot, 'test-results');
  mkdirSync(evidenceDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const evidenceFile = path.join(evidenceDir, `${taskId}-harness-${stamp}.json`);
  writeFileSync(
    evidenceFile,
    JSON.stringify(
      {
        taskId,
        provider: config.provider,
        model: config.model,
        usedProvider: result.usedProvider,
        completed: result.completed,
        summary: result.summary,
        touchedFiles: result.touchedFiles,
        iterations: result.iterations,
        durationMs,
        timedOut,
        timestamp: new Date().toISOString(),
        transcript: result.transcript,
        safeguard,
      },
      null,
      2,
    ),
    'utf8',
  );

  // Fase 2: update Kanban status.
  if (kanbanRow && promptId) {
    if (timedOut) {
      await updateKanbanRow(promptId, {
        status: 'Assegnato',
        lastUpdate: new Date().toISOString(),
      });
      console.log(`Kanban: ${promptId} -> Assegnato (timeout)`);
    } else if (result.completed) {
      await updateKanbanRow(promptId, {
        status: 'Completato',
        lastUpdate: new Date().toISOString(),
        endTime: new Date().toISOString(),
      });
      console.log(`Kanban: ${promptId} -> Completato`);
    } else {
      await updateKanbanRow(promptId, {
        status: 'Assegnato',
        lastUpdate: new Date().toISOString(),
      });
      console.log(`Kanban: ${promptId} -> Assegnato (needs rework)`);
    }

    if (lockedFiles.length > 0) {
      await unlockFilesForPrompt(promptId);
      console.log(`Unlocked files for ${promptId}`);
    }
  }

  console.log('\n──────── Result ────────');
  console.log(`Completed: ${result.completed}`);
  console.log(`Iterations: ${result.iterations}`);
  console.log(`Touched files: ${result.touchedFiles.join(', ') || '(none)'}`);
  console.log(`Summary: ${result.summary ?? '(none)'}`);
  console.log(`Evidence: ${path.relative(config.repoRoot, evidenceFile)}`);

  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
  }

  process.exitCode = result.completed && !timedOut ? 0 : 2;
  if (timedOut) {
    process.exit(process.exitCode);
  }
}

main().catch((error) => {
  console.error('Harness error:', error);
  process.exitCode = 1;
});
