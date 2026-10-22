/**
 * worktreeTaintGuard — T-13 shared-worktree protection for PLAN-078.
 *
 * A Sentinel run takes minutes on a worktree other sessions may be editing.
 * If tracked files under the audited scope (`src/`, `public/`) change mid-run,
 * every finding from that run becomes suspect (the page was served by Vite
 * with hot-reloaded, possibly half-compiled sources). The guard snapshots
 * `git rev-parse HEAD` + `git status --porcelain` + a content hash of the
 * `git diff` on the audited scope at run start; `worktreeDrifted()` compares
 * a fresh snapshot. A drifted run is `tainted`: findings are digested but
 * never ingested into PLAN-077.
 */
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';

/** Immutable point-in-time worktree signature. */
export interface WorktreeSnapshot {
  headSha: string;
  statusHash: string;
  diffHash: string;
  takenAt: string;
}

function sh(cmd: string, cwd: string): string {
  return execSync(cmd, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
}

function hash(s: string): string {
  return createHash('sha256').update(s).digest('hex').slice(0, 24);
}

/** Captures the worktree signature for `scopePaths` (default: source + assets). */
export function snapshotWorktree(cwd = '.', scopePaths = 'src public'): WorktreeSnapshot {
  const headSha = sh('git rev-parse HEAD', cwd);
  const status = sh(`git status --porcelain -- ${scopePaths}`, cwd);
  const diff = sh(`git diff -- ${scopePaths}`, cwd) + sh(`git diff --cached -- ${scopePaths}`, cwd);
  return {
    headSha,
    statusHash: hash(status),
    diffHash: hash(diff),
    takenAt: new Date().toISOString(),
  };
}

/**
 * True when the current worktree differs from `base` in HEAD, scoped
 * porcelain status or scoped diff content. Untracked Sentinel output under
 * `.mw/` stays outside the default scope on purpose.
 */
export function worktreeDrifted(base: WorktreeSnapshot, cwd = '.', scopePaths = 'src public'): boolean {
  const now = snapshotWorktree(cwd, scopePaths);
  return now.headSha !== base.headSha || now.statusHash !== base.statusHash || now.diffHash !== base.diffHash;
}
