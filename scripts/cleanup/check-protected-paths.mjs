#!/usr/bin/env node
/**
 * PLAN-132 / R-381 — permanent guard: every path in protected.txt must exist.
 * Exit 1 listing the missing ones. Re-runnable at any time.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const list = path.join(ROOT, 'test-results', 'cleanup', 'protected.txt');
if (!fs.existsSync(list)) {
  console.error('protected.txt not found — run scripts/cleanup/build-cleanup-manifest.mjs first');
  process.exit(2);
}
const missing = fs
  .readFileSync(list, 'utf8')
  .split('\n')
  .filter(Boolean)
  .filter((p) => !fs.existsSync(path.join(ROOT, p)));
if (missing.length) {
  console.error(`PROTECTED PATHS MISSING (${missing.length}):`);
  missing.forEach((p) => console.error(`  ${p}`));
  process.exit(1);
}
console.log('check-protected-paths: all protected paths exist');
