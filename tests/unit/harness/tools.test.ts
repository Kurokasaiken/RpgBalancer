/**
 * Offline unit tests for the harness tool layer.
 *
 * These validate the safety-critical behavior (path sandboxing, edit
 * uniqueness, command whitelist) without needing any API key.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { loadHarnessConfig } from '../../../scripts/harness/config.js';
import { createToolExecutor } from '../../../scripts/harness/tools.js';

describe('harness tool executor', () => {
  let workspace: string;

  beforeEach(() => {
    workspace = mkdtempSync(path.join(tmpdir(), 'harness-test-'));
  });

  afterEach(() => {
    rmSync(workspace, { recursive: true, force: true });
  });

  function makeExecutor() {
    const config = loadHarnessConfig({ repoRoot: workspace, apiKey: 'test' });
    return createToolExecutor(workspace, config);
  }

  it('writes and reads a file inside the workspace', () => {
    const tools = makeExecutor();
    const write = tools.execute('write_file', { path: 'a/b.txt', content: 'hello' });
    expect(write.ok).toBe(true);
    expect(readFileSync(path.join(workspace, 'a/b.txt'), 'utf8')).toBe('hello');

    const read = tools.execute('read_file', { path: 'a/b.txt' });
    expect(read.ok).toBe(true);
    expect(read.output).toContain('1\thello');
    expect(tools.touchedFiles).toContain('a/b.txt');
  });

  it('rejects path traversal outside the workspace', () => {
    const tools = makeExecutor();
    const result = tools.execute('write_file', { path: '../escape.txt', content: 'x' });
    expect(result.ok).toBe(false);
    expect(result.output).toMatch(/escapes the workspace/);
  });

  it('edit_file requires a unique match', () => {
    const tools = makeExecutor();
    writeFileSync(path.join(workspace, 'dup.txt'), 'foo foo', 'utf8');
    const ambiguous = tools.execute('edit_file', {
      path: 'dup.txt',
      old_string: 'foo',
      new_string: 'bar',
    });
    expect(ambiguous.ok).toBe(false);
    expect(ambiguous.output).toMatch(/appears 2 times/);

    writeFileSync(path.join(workspace, 'uniq.txt'), 'alpha beta', 'utf8');
    const ok = tools.execute('edit_file', {
      path: 'uniq.txt',
      old_string: 'beta',
      new_string: 'gamma',
    });
    expect(ok.ok).toBe(true);
    expect(readFileSync(path.join(workspace, 'uniq.txt'), 'utf8')).toBe('alpha gamma');
  });

  it('blocks non-whitelisted commands', () => {
    const tools = makeExecutor();
    const result = tools.execute('run_command', { command: 'rm -rf /' });
    expect(result.ok).toBe(false);
    expect(result.output).toMatch(/not allowed/);
  });

  it('records task completion summary', () => {
    const tools = makeExecutor();
    expect(tools.completed).toBeNull();
    tools.execute('task_complete', { summary: 'done the thing' });
    expect(tools.completed).toBe('done the thing');
  });
});
