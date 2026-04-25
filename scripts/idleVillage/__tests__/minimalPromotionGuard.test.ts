import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { tmpdir } from 'node:os';
import type { PromotionGuardOptions, CommandExecutionResult } from '../minimalPromotionGuard';
import { runPromotionGuard } from '../minimalPromotionGuard';

const FIXED_TIMESTAMP = '2026-02-15T00:00:00.000Z';

function createTempRoot(): string {
  return mkdtempSync(join(tmpdir(), 'promotion-guard-'));
}

function createBaseOptions(rootDir: string): PromotionGuardOptions {
  return {
    featureId: 'test-feature',
    implementedPlanPath: join(rootDir, 'IMPLEMENTED_PLAN.md'),
    testResultsDir: join(rootDir, 'test-results'),
    rootDir,
    timestamp: FIXED_TIMESTAMP,
  };
}

function createResult(name: string, success: boolean): CommandExecutionResult {
  return {
    name,
    command: name === 'lint' || name === 'test' ? `npm run ${name}` : `npm run ${name}`,
    success,
    stdout: success ? `${name} success` : '',
    stderr: success ? '' : `${name} failure`,
    exitCode: success ? 0 : 1,
    durationMs: 25,
  };
}

describe('runPromotionGuard', () => {
  let tempRoot: string;

  beforeEach(() => {
    tempRoot = createTempRoot();
    writeFileSync(join(tempRoot, 'IMPLEMENTED_PLAN.md'), '# Implemented Plan');
  });

  afterEach(() => {
    rmSync(tempRoot, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('stops executing commands after the first failure and skips doc updates', async () => {
    const options = createBaseOptions(tempRoot);
    const runner = vi.fn(async (_command: string, name: string) => {
      if (name === 'test') {
        return createResult(name, false);
      }
      return createResult(name, true);
    });

    const summary = await runPromotionGuard(options, runner);

    expect(runner).toHaveBeenCalledTimes(2);
    expect(runner).toHaveBeenNthCalledWith(1, 'npm run lint', 'lint');
    expect(runner).toHaveBeenNthCalledWith(2, 'npm run test', 'test');
    expect(summary.overallSuccess).toBe(false);
    expect(summary.commands).toHaveLength(2);
    expect(existsSync(summary.logPath)).toBe(true);
    const docContent = readFileSync(options.implementedPlanPath, 'utf8');
    expect(docContent).not.toContain('Promotion Guard Runs');
  });

  it('writes evidence, copies screenshots, and records doc rows when all commands succeed', async () => {
    const options = { ...createBaseOptions(tempRoot), featureId: 'night-threat' };
    const screenshotSource = join(tempRoot, 'evidence.png');
    writeFileSync(screenshotSource, 'fake-image-data');
    options.screenshotPath = screenshotSource;
    const runner = vi.fn(async (_command: string, name: string) => createResult(name, true));

    const summary = await runPromotionGuard(options, runner);

    expect(runner).toHaveBeenCalledTimes(4);
    expect(summary.overallSuccess).toBe(true);
    expect(existsSync(summary.logPath)).toBe(true);
    expect(existsSync(summary.summaryPath)).toBe(true);
    expect(summary.screenshot?.source).toBe(screenshotSource);
    expect(summary.screenshot && existsSync(summary.screenshot.copiedPath)).toBe(true);

    const docContent = readFileSync(options.implementedPlanPath, 'utf8');
    expect(docContent).toContain('Promotion Guard Runs');
    const relativeLogPath = relative(options.rootDir, summary.logPath).replace(/\\/g, '/');
    expect(docContent).toContain(`| ${options.featureId} | ${summary.timestamp} | ${relativeLogPath} |`);
  });
});

