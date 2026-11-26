import { chmodSync, lstatSync, mkdirSync, mkdtempSync, readlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  checkResourceLifecycleGate,
  resolveResourceLifecycleTool,
} from '../../../scripts/verification/resourceLifecycleGate';

function fixtureRoot(): string {
  return mkdtempSync(path.join(tmpdir(), 'rpg-lifecycle-gate-'));
}

function writeExecutable(filePath: string, output: string): void {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, `#!/bin/sh\necho '${output}'\n`);
  chmodSync(filePath, 0o755);
}

describe('resource lifecycle canonical link', () => {
  it('keeps RPG tools/resource-lifecycle as a symlink to the Mind Weaver source', () => {
    const linkPath = path.join(process.cwd(), 'tools', 'resource-lifecycle');

    expect(lstatSync(linkPath).isSymbolicLink()).toBe(true);
    expect(readlinkSync(linkPath)).toBe('../../mind-weaver/tools/resource-lifecycle');
  });
});

describe('resolveResourceLifecycleTool', () => {
  it('prefers the repo symlinked lifecycle tool over the legacy home install', () => {
    const root = fixtureRoot();
    const repo = path.join(root, 'repo');
    const home = path.join(root, 'home');
    const repoTool = path.join(repo, 'tools', 'resource-lifecycle', 'mw-reap');
    const homeTool = path.join(home, '.mw', 'bin', 'mw-reap');
    writeExecutable(repoTool, 'repo');
    writeExecutable(homeTool, 'home');

    expect(resolveResourceLifecycleTool(repo, 'mw-reap', home)).toBe(repoTool);
  });

  it('falls back to ~/.mw/bin when the repo tool is unavailable', () => {
    const root = fixtureRoot();
    const repo = path.join(root, 'repo');
    const home = path.join(root, 'home');
    const homeTool = path.join(home, '.mw', 'bin', 'mw-reap');
    mkdirSync(repo, { recursive: true });
    writeExecutable(homeTool, 'home');

    expect(resolveResourceLifecycleTool(repo, 'mw-reap', home)).toBe(homeTool);
  });

  it('returns null when neither canonical nor fallback tool exists', () => {
    const root = fixtureRoot();

    expect(resolveResourceLifecycleTool(path.join(root, 'repo'), 'mw-reap', path.join(root, 'home'))).toBeNull();
  });
});

describe('checkResourceLifecycleGate', () => {
  it('executes the repo lifecycle tool when both repo and fallback are present', () => {
    const root = fixtureRoot();
    const repo = path.join(root, 'repo');
    const home = path.join(root, 'home');
    writeExecutable(path.join(repo, 'tools', 'resource-lifecycle', 'mw-reap'), 'repo-reap-used');
    writeExecutable(path.join(home, '.mw', 'bin', 'mw-reap'), 'home-reap-used');

    const result = checkResourceLifecycleGate(repo, home);

    expect(result.errors).toEqual([]);
    expect(result.warnings.join('\n')).toContain('repo-reap-used');
    expect(result.warnings.join('\n')).not.toContain('home-reap-used');
  });
});
