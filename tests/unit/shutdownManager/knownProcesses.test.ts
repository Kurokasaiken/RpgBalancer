/**
 * Unit tests for the known-process classifier (R-212).
 *
 * Server fixtures report but never veto; real work vetoes; unknown
 * commands are ignored.
 */

import { describe, it, expect } from 'vitest';
import { classifyWorkCommand } from '../../../scripts/shutdownManager/knownProcesses.js';

describe('classifyWorkCommand — server leftovers (never veto, R-212)', () => {
  const leftovers = [
    'bash -c cd /repo && nohup npx vite preview --mode playwright --outDir dist-playwright --port 5173 & sleep 4 && curl localhost',
    'npm exec vite preview --mode playwright --outDir dist-playwright --port 5173 --strictPort',
    'node /repo/node_modules/.bin/vite preview --mode playwright --outDir dist-playwright --port 5173',
    'node /repo/node_modules/.bin/vite preview --port 5173',
    'npm run dev',
    'node /repo/node_modules/vite/bin/vite.js',
    'node /repo/node_modules/.bin/vite --host 127.0.0.1',
  ];
  for (const command of leftovers) {
    it(`classifies as server: ${command.slice(0, 60)}`, () => {
      expect(classifyWorkCommand(command)).toBe('server');
    });
  }
});

describe('classifyWorkCommand — real work (veto)', () => {
  const work = [
    'node /repo/node_modules/.bin/vite build',
    'npm run build',
    'npm run test -- tests/unit',
    'node /repo/node_modules/vitest/vitest.mjs run',
    '/venv/.../playwright/driver/package/cli.js run-driver',
    'npx playwright test tests/x.spec.ts --workers=1',
    'node /repo/node_modules/.bin/playwright test',
    'tsx scripts/runPrompt.ts --task x',
    'tsx scripts/harness/dispatch.ts',
    'python coordinator/coordinator.py',
    'python scripts/mw-iterative-deliberate.py',
    'python scripts/mw-orchestrate.py',
  ];
  for (const command of work) {
    it(`classifies as work: ${command.slice(0, 60)}`, () => {
      expect(classifyWorkCommand(command)).toBe('work');
    });
  }
});

describe('classifyWorkCommand — unmatched commands', () => {
  const unmatched = ['Finder', '/usr/sbin/cfprefsd agent', 'node -e "console.log(1)"', 'code .'];
  for (const command of unmatched) {
    it(`returns null: ${command.slice(0, 40)}`, () => {
      expect(classifyWorkCommand(command)).toBeNull();
    });
  }
});
