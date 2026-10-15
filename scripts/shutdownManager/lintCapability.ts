#!/usr/bin/env tsx
/**
 * Static capability guard (OPS-SHUTDOWN-009).
 *
 * Scans the repository and fails if shutdown-capable commands appear outside
 * `scripts/shutdownManager/` — enforcing capability ownership per
 * `.windsurf/rules/50-shutdown-governance.md`.
 *
 * Exits 1 on any violation. Allowlist: `archive/` (disabled legacy),
 * `test-results/`, documentation, and this guard's own pattern list.
 *
 * CLI:
 *   tsx scripts/shutdownManager/lintCapability.ts [--root DIR]
 *
 * @module lintCapability
 */

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const ALLOWED_DIR = 'scripts/shutdownManager';
const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', 'venv', '.venv', '.mw',
  'archive', 'test-results', 'coverage', '.next', '.turbo', 'out',
  'prompts', // spec JSON describe patterns to search for; they cannot execute
]);
const SKIP_PATH_PREFIXES = ['src/docs/']; // documentation trees
const SKIP_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.psd', '.zip',
  '.mp3', '.wav', '.mp4', '.mov', '.woff', '.woff2', '.ttf', '.otf',
]);
const SCAN_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.sh', '.py', '.json', '.plist',
]);
const DOC_EXTENSIONS = new Set(['.md', '.mdx', '.txt', '.rst', '.adoc']);

/**
 * Patterns that indicate shutdown-capable code. Each entry is a pair of
 * regexes that must BOTH match the same file content (AND-combination),
 * or a single regex when `single` is set.
 */
const RULES: { name: string; patterns: RegExp[] }[] = [
  { name: 'shutdown command', patterns: [/\bshutdown\b\s+(?:-h|-r|now|\+)/] },
  { name: 'sudo shutdown', patterns: [/sudo\s+shutdown\b/] },
  { name: 'poweroff', patterns: [/\bpoweroff\b/] },
  { name: 'halt', patterns: [/\bhalt\s+(?:now|-p|--poweroff)\b/] },
  { name: 'pmset sleep', patterns: [/pmset\s+(?:sleepnow|displaysleepnow|sleep\b|schedule\s+shutdown)/] },
  {
    name: 'osascript system shutdown',
    patterns: [/osascript/, /tell\s+application\s+"System Events"\s+to\s+(?:shut\s*down|log\s*out|restart|sleep)/],
  },
];

interface Violation {
  file: string;
  rule: string;
}

async function* walk(dir: string): AsyncGenerator<string> {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name) && !entry.name.startsWith('.claude')) {
        yield* walk(full);
      }
    } else if (entry.isFile()) {
      yield full;
    }
  }
}

async function scan(root: string): Promise<Violation[]> {
  const violations: Violation[] = [];
  for await (const file of walk(root)) {
    const rel = path.relative(root, file).split(path.sep).join('/');
    const ext = path.extname(file).toLowerCase();
    if (SKIP_EXTENSIONS.has(ext) || DOC_EXTENSIONS.has(ext)) continue;
    if (!SCAN_EXTENSIONS.has(ext) && ext !== '') continue;
    if (rel.startsWith(`${ALLOWED_DIR}/`)) continue;
    if (SKIP_PATH_PREFIXES.some((p) => rel.startsWith(p))) continue;

    let content: string;
    try {
      content = await readFile(file, 'utf8');
    } catch {
      continue;
    }
    // Extensionless files only count if they are executable scripts (shebang).
    if (ext === '' && !content.startsWith('#!')) continue;
    for (const rule of RULES) {
      if (rule.patterns.every((p) => p.test(content))) {
        violations.push({ file: rel, rule: rule.name });
      }
    }
  }
  return violations;
}

const rootIdx = process.argv.indexOf('--root');
const root = rootIdx >= 0 ? path.resolve(process.argv[rootIdx + 1]) : process.cwd();

const violations = await scan(root);
if (violations.length === 0) {
  console.log(`shutdown:lint-capability OK — no shutdown-capable code outside ${ALLOWED_DIR}/`);
} else {
  console.error('shutdown:lint-capability FAILED — capability violations:');
  for (const v of violations) console.error(`  ${v.file}: ${v.rule}`);
  process.exit(1);
}
