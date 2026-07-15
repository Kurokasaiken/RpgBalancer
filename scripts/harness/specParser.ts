/**
 * Compact spec parser for the executor harness.
 *
 * Fase 4: the Strategist writes a small, token-lean spec; the Coordinator
 * (or this parser) expands it into the full prompt template from
 * src/docs/docs/prompts/prompt_library.md before dispatch.
 */

import { readFile, writeFile } from 'node:fs/promises';

/** Compact task spec. */
export interface TaskSpec {
  id: string;
  agent?: string;
  objective: string;
  file_targets?: string[];
  dependencies?: string[];
  execution_hint?: 'atomic' | 'verified' | 'architectural';
  invariants?: string[];
  operations?: string[];
  forbidden?: string[];
  assumptions?: string[];
  safeguards?: string[];
  output?: string[];
  notes?: string[];
  /** Computed by the Coordinator before dispatch. */
  executor?: 'ai-worker' | 'harness' | 'manual';
  executor_reason?: string;
}

/** Parse a compact spec from a JSON file. */
export async function parseSpecFile(path: string): Promise<TaskSpec> {
  const raw = await readFile(path, 'utf8');
  return JSON.parse(raw) as TaskSpec;
}

/** Expand a compact spec into the full agent prompt template. */
export interface ExecutorResolution {
  executor: 'ai-worker' | 'harness' | 'manual';
  executor_reason: string;
}

/**
 * Resolve the executor for a spec based on execution_hint, file targets and safeguards.
 *
 * Priority:
 * 1. architectural -> manual
 * 2. safeguards.length > 0 -> manual unless within harness scope
 * 3. file_targets.length > 1 -> never ai-worker
 * 4. atomic + single file + no safeguards -> ai-worker
 * 5. verified + safeguards -> harness
 * 6. default -> manual
 */
export function resolveExecutor(spec: TaskSpec): ExecutorResolution {
  const hint = spec.execution_hint ?? 'verified';
  const fileTargets = spec.file_targets ?? [];
  const safeguards = spec.safeguards ?? [];

  if (hint === 'architectural') {
    return { executor: 'manual', executor_reason: 'architectural: touches invariants or requires design judgement' };
  }

  if (safeguards.length > 0) {
    const harnessScope = hint === 'verified' && fileTargets.length <= 3;
    if (harnessScope) {
      return { executor: 'harness', executor_reason: 'verified with safeguards within harness scope' };
    }
    return { executor: 'manual', executor_reason: 'safeguards present but outside harness scope' };
  }

  if (fileTargets.length > 1) {
    return { executor: 'manual', executor_reason: 'multi-file target, never ai-worker' };
  }

  if (hint === 'atomic' && fileTargets.length === 1 && safeguards.length === 0) {
    return { executor: 'ai-worker', executor_reason: 'atomic single-file, no safeguards' };
  }

  if (hint === 'verified' && safeguards.length > 0) {
    return { executor: 'harness', executor_reason: 'verified with safeguards' };
  }

  return { executor: 'manual', executor_reason: 'default routing' };
}

/**
 * Enrich a spec with the coordinator-computed executor.
 * If the strategist already wrote executor/executor_reason, they are ignored and recomputed.
 */
export function enrichSpec(spec: TaskSpec): TaskSpec {
  if (spec.executor !== undefined || spec.executor_reason !== undefined) {
    console.warn('executor ignorato, ricalcolato');
  }
  const resolved = resolveExecutor(spec);
  return {
    ...spec,
    executor: resolved.executor,
    executor_reason: resolved.executor_reason,
  };
}

/** Write a compact spec to a JSON file. */
export async function writeSpecFile(path: string, spec: TaskSpec): Promise<void> {
  const raw = JSON.stringify(spec, null, 2) + '\n';
  await writeFile(path, raw, 'utf8');
}

export function expandSpec(spec: TaskSpec): string {
  const fileTargets = spec.file_targets?.join(', ') ?? '-';
  const deps = spec.dependencies?.join(', ') ?? '-';
  const invariants = spec.invariants?.length
    ? spec.invariants.map((i) => `  - ${i}`).join('\n')
    : '  - Rispetta `.windsurf/rules/` — skin di default, i18n, persistenza, config-first, tema Gilded Observatory.';
  const operations = spec.operations?.map((op, idx) => `  ${idx + 1}. ${op}`).join('\n') ?? '';
  const forbidden = spec.forbidden?.map((f) => `  - ${f}`).join('\n') ?? '  - Nessuna modifica collaterale non richiesta.';
  const assumptions = spec.assumptions?.map((a) => `  - ${a}`).join('\n') ?? '  - Esegui direttamente i passi noti senza chiedere conferma.';
  const safeguards = spec.safeguards?.length
    ? spec.safeguards.map((s) => `  - ${s}`).join('\n')
    : '  - npm run lint -- <scope>\n  - npm run test -- <scope>\n  - npm run build:check\n  - npm run kanban:lint';
  const output = spec.output?.map((o) => `  - ${o}`).join('\n') ?? '';
  const notes = Array.isArray(spec.notes)
    ? spec.notes.map((n) => `  - ${n}`).join('\n')
    : spec.notes
      ? `  - ${spec.notes}`
      : '';
  const executor = spec.executor ?? 'manual';
  const executorReason = spec.executor_reason ?? 'not resolved';

  return `EXECUTOR: ${executor} (${executorReason})
AGENT: ${spec.agent ?? 'harness'}
OBIETTIVO: ${spec.objective}
FILE TARGET: ${fileTargets}
DIPENDENZE: ${deps}
INVARIANTI (NON DEROGABILI):
${invariants}
OPERAZIONI DA ESEGUIRE:
${operations}
OPERAZIONI VIETATE:
${forbidden}
ASSUNZIONI:
${assumptions}
SAFEGUARD MANDATORY STEPS:
${safeguards}
OUTPUT ATTESI:
${output}
NOTE:
${notes}
`;
}
