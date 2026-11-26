/**
 * resourceLifecycleGate — gate "no unowned resources" (MW PLAN-071, R-LIFECYCLE).
 *
 * Delegates the mechanical check to the canonical `mw-reap --gate <repoRoot>`
 * exposed through `tools/resource-lifecycle` (live Mind Weaver symlink), with
 * `~/.mw/bin` as legacy fallback. If the tool is absent the gate is a warning,
 * never a silent pass — the invariant is a rule, the tool is its enforcement.
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * Resolve the canonical lifecycle reaper. RPG keeps `tools/resource-lifecycle`
 * as a live symlink to the Mind Weaver source tree; `~/.mw/bin` remains the
 * legacy machine-wide fallback for worktrees created before PLAN-075.
 */
export function resolveResourceLifecycleTool(
  repoRoot: string,
  toolName = 'mw-reap',
  homeDir = os.homedir(),
): string | null {
  const repoTool = path.join(repoRoot, 'tools', 'resource-lifecycle', toolName);
  if (existsSync(repoTool)) return repoTool;

  const globalTool = path.join(homeDir, '.mw', 'bin', toolName);
  if (existsSync(globalTool)) return globalTool;

  return null;
}

export function checkResourceLifecycleGate(
  repoRoot: string,
  homeDir = os.homedir(),
): {
  errors: string[];
  warnings: string[];
} {
  const reaper = resolveResourceLifecycleTool(repoRoot, 'mw-reap', homeDir);
  if (!reaper) {
    return {
      errors: [],
      warnings: [
        'resource-lifecycle gate: mw-reap non trovato né in tools/resource-lifecycle né in ~/.mw/bin — ripristinare il symlink RPG o installare i tool MW (PLAN-071/PLAN-075)',
      ],
    };
  }
  try {
    const out = execFileSync(reaper, ['--gate', repoRoot], {
      encoding: 'utf8',
      timeout: 60_000,
    });
    return { errors: [], warnings: out.trim() ? [out.trim()] : [] };
  } catch (err) {
    const msg =
      err && typeof err === 'object' && 'stdout' in err
        ? String((err as { stdout?: unknown }).stdout ?? '').trim()
        : String(err);
    return {
      errors: [
        `resource-lifecycle gate: risorse unowned nel progetto — chiudi, adopta (mw-adopt) o uccidi (mw-kill): ${msg}`,
      ],
      warnings: [],
    };
  }
}
