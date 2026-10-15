/**
 * Pre-shutdown git backup (opt-in per project).
 *
 * Commits and pushes the working tree of each registered project directory
 * before the executor fires. This is a backup step owned by the manager
 * flow — it is never a shutdown *criterion* (rule 50), and a failure here
 * is reported but does not veto an otherwise-allowed shutdown unless
 * `requireCleanTree` is set in policy.
 *
 * @module preShutdownBackup
 */

import { execFile } from 'node:child_process';
import { access } from 'node:fs/promises';
import path from 'node:path';

export interface BackupResult {
  projectDir: string;
  hadChanges: boolean;
  committed: boolean;
  pushed: boolean;
  detail: string;
}

const GIT_TIMEOUT_MS = 120_000;

function git(args: string[], cwd: string): Promise<{ code: number; out: string }> {
  return new Promise((resolve) => {
    execFile('git', args, { cwd, timeout: GIT_TIMEOUT_MS }, (error, stdout, stderr) => {
      const code = error && typeof error.code === 'number' ? error.code : error ? 1 : 0;
      resolve({ code, out: `${stdout}${stderr}`.trim() });
    });
  });
}

/**
 * Commits and pushes pending changes in a project directory.
 *
 * @param projectDir - Absolute path of the git working tree.
 * @returns Per-project backup result.
 */
export async function backupProjectTree(projectDir: string): Promise<BackupResult> {
  const dir = path.resolve(projectDir);
  try {
    await access(path.join(dir, '.git'));
  } catch {
    return { projectDir: dir, hadChanges: false, committed: false, pushed: false, detail: 'not a git repo, skipped' };
  }

  const status = await git(['status', '--porcelain'], dir);
  if (status.code !== 0) {
    return { projectDir: dir, hadChanges: false, committed: false, pushed: false, detail: `git status failed: ${status.out}` };
  }
  if (status.out.length === 0) {
    const push = await git(['push'], dir);
    return { projectDir: dir, hadChanges: false, committed: false, pushed: push.code === 0, detail: push.code === 0 ? 'clean; pushed' : `clean; push failed: ${push.out}` };
  }

  await git(['add', '-A'], dir);
  const stamp = new Date().toISOString();
  const commit = await git(
    ['commit', '-m', `chore(ops): pre-shutdown auto-commit ${stamp}`],
    dir,
  );
  if (commit.code !== 0) {
    return { projectDir: dir, hadChanges: true, committed: false, pushed: false, detail: `commit failed: ${commit.out}` };
  }
  const push = await git(['push'], dir);
  return {
    projectDir: dir,
    hadChanges: true,
    committed: true,
    pushed: push.code === 0,
    detail: push.code === 0 ? 'committed and pushed' : `committed; push failed: ${push.out}`,
  };
}
