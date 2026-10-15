/**
 * foregroundLint — static enforcement for .windsurf/rules/16-no-foreground-windows.md.
 *
 * Scans scripts/tests/marketing/src/tools and package.json for patterns that
 * open a window, app, or browser in the foreground. Automated runs must be
 * headless or background; headed mode is opt-in only (`HEADLESS=false`,
 * manual headed npm scripts). Exits 1 on any violation.
 */
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname, relative } from 'node:path';

const ROOT = process.cwd();
const SCAN_DIRS = ['scripts', 'tests', 'marketing', 'tools'];
const CODE_EXT = new Set(['.ts', '.tsx', '.js', '.cjs', '.mjs', '.mts']);
const SKIP_DIRS = new Set(['node_modules', 'dist', 'dist-playwright', '.git', 'venv', '.mw', 'test-results', 'coverage']);

interface Violation {
  file: string;
  line: number;
  rule: string;
  text: string;
}

const violations: Violation[] = [];

function* walk(dir: string): Generator<string> {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    try {
      if (statSync(full).isDirectory()) {
        yield* walk(full);
      } else if (CODE_EXT.has(extname(entry))) {
        yield full;
      }
    } catch {
      continue;
    }
  }
}

const SELF = join(ROOT, 'scripts', 'foregroundLint.ts');

function checkFile(path: string): void {
  const rel = relative(ROOT, path);
  const lines = readFileSync(path, 'utf8').split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) continue;
    const push = (rule: string) =>
      violations.push({ file: rel, line: i + 1, rule, text: line.trim() });

    if (/headless:\s*false\b/.test(line)) push('headless:false literal (use `headless: process.env.HEADLESS !== \'false\'`)');
    if (/(execSync|exec|spawn|spawnSync|execFile)\(\s*[`'"]open[`'"]/.test(line)) {
      const window2 = `${line}\n${lines[i + 1] ?? ''}`;
      if (!/['"`][-]g['"`]|\bopen\s+-g\b/.test(window2)) push('foreground `open` (use `open -g` for background)');
    }
    if (/\bxdg-open\b/.test(line) && !/background|--background/.test(line)) push('xdg-open (foreground)');
    if (/osascript[^\n]*\bactivate\b/.test(line)) push('osascript activate (steals focus)');
    if (/\bbringToFront\b/.test(line)) push('bringToFront (steals focus)');
    if (/(playwright[^'"`\n]*)?--(headed|ui|debug)\b|show-report/.test(line) && !/HEADLESS|headed\b.*manual/i.test(line)) {
      push('headed/ui flag or show-report inside automation');
    }
  }
}

function checkPackageJson(): void {
  const pkgPath = join(ROOT, 'package.json');
  if (!existsSync(pkgPath)) return;
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { scripts?: Record<string, string> };
  for (const [name, cmd] of Object.entries(pkg.scripts ?? {})) {
    if (/--(headed|ui|debug)\b|\bshow-report\b/.test(cmd) && !/(headed|ui|debug|manual|report)/i.test(name)) {
      violations.push({ file: 'package.json', line: 0, rule: `headed/ui script "${name}" is not marked manual`, text: cmd });
    }
  }
}

for (const dir of SCAN_DIRS) {
  for (const file of walk(join(ROOT, dir))) {
    if (file !== SELF) checkFile(file);
  }
}
checkPackageJson();

if (violations.length === 0) {
  console.log('foreground:lint OK — no foreground-window patterns found.');
  process.exit(0);
}

console.error(`foreground:lint FAILED — ${violations.length} violation(s):`);
for (const v of violations) {
  console.error(`  ${v.file}:${v.line}  [${v.rule}]\n    ${v.text}`);
}
console.error('\nSee .windsurf/rules/16-no-foreground-windows.md — automated runs must be headless/background.');
process.exit(1);
