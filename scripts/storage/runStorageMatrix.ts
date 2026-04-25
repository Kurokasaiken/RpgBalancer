#!/usr/bin/env tsx

/**
 * CLI runner that executes the StorageTestFramework suite against the
 * BalancerConfigStore using realistic datasets. Outputs a JSON summary and
 * writes a detailed log under test-results/storage/.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createMemoryStorage } from '../../src/shared/testing/createMemoryStorage';
import {
  buildPrimaryBalancerStorageDataset,
  buildAlternateBalancerStorageDataset,
} from '../../src/balancing/config/testData/balancerStorageDataset';
import { testBalancerConfigStore } from '../../src/shared/testing/StorageTestExamples';
import type { TestSuite, TestResult } from '../../src/shared/testing/StorageTestFramework';

function ensureLocalStorage(): void {
  if (typeof globalThis.localStorage === 'undefined') {
    globalThis.localStorage = createMemoryStorage();
  }
}

function formatLogPath(): string {
  const now = new Date();
  const dateStamp = now.toISOString().slice(0, 10).replace(/-/g, '');
  const logDir = join(process.cwd(), 'test-results', 'storage');
  mkdirSync(logDir, { recursive: true });
  return join(logDir, `balancer-config-${dateStamp}.log`);
}

function formatSuiteSummary(suite: TestSuite): string {
  return [
    `Storage Suite: ${suite.name}`,
    `Total tests: ${suite.tests.length}`,
    `Passed: ${suite.passedCount}`,
    `Failed: ${suite.failedCount}`,
    `Success Rate: ${suite.successRate.toFixed(2)}%`,
    `Duration: ${suite.totalDuration.toFixed(2)}ms`,
    '─'.repeat(60),
    ...suite.tests.map((test: TestResult) => {
      const status = test.passed ? 'PASS' : 'FAIL';
      const base = `${status.padEnd(5)} ${test.name.padEnd(30)} ${test.duration.toFixed(2)}ms`;
      return test.error ? `${base} :: ${test.error}` : base;
    }),
  ].join('\n');
}

async function run(): Promise<void> {
  ensureLocalStorage();

  const primaryDataset = buildPrimaryBalancerStorageDataset();
  const alternateDataset = buildAlternateBalancerStorageDataset();

  console.log('🔐 Running BalancerConfigStore storage suite…');
  const suite = await testBalancerConfigStore(primaryDataset, alternateDataset);
  const summary = formatSuiteSummary(suite);
  console.log(summary);

  const logPath = formatLogPath();
  writeFileSync(
    logPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        suite,
      },
      null,
      2
    )
  );
  console.log(`📝 Storage log saved to ${logPath}`);

  if (suite.failedCount > 0) {
    process.exitCode = 1;
  }
}

if (import.meta.url === fileURLToPath(import.meta.url)) {
  run().catch((error) => {
    console.error('Storage matrix runner failed:', error);
    process.exit(1);
  });
}
