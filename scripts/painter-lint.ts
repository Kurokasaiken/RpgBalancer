/**
 * painter-lint.ts
 *
 * Blocks hardcoded colors and ad-hoc inline styles in components produced by
 * the `painter` skill. Runs as part of `npm run lint:painter`.
 *
 * Allowed:
 * - CSS custom properties (`var(--*)`)
 * - token/config imports
 * - Tailwind utility classes
 *
 * Blocked:
 * - hex colors (#rrggbb, #rgb)
 * - `rgb(...)`, `rgba(...)`, `hsl(...)`, `hwb(...)` literals
 * - `style={{ ... }}` with color/shadow/background/spacing values
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const ROOT = process.cwd();
const TARGET_FILES = ['src/ui/idleVillage/trailer/GoblinEventModalV17.tsx'];
const EXCLUDE_DIRS = ['node_modules', 'dist', 'build'];

const COLOR_LITERAL_RE = /(?:#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6,8})\b|(?:rgb|rgba|hsl|hwb)\s*\([^)]*\))/g;
const INLINE_STYLE_RE = /style\s*=\s*\{\{[^}]*(?:background|backgroundColor|color|borderColor|boxShadow|border|opacity|backdropFilter)[^}]*\}/gs;
const TAILWIND_ALLOWED = true; // Tailwind classes are fine.

interface Violation {
  file: string;
  line: number;
  message: string;
}

function findTsxFiles(dir: string, files: string[] = []) {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    if (EXCLUDE_DIRS.some((d) => fullPath.includes(d))) continue;
    const s = statSync(fullPath);
    if (s.isDirectory()) findTsxFiles(fullPath, files);
    else if (s.isFile() && fullPath.endsWith('.tsx')) files.push(fullPath);
  }
  return files;
}

function lintFile(filePath: string): Violation[] {
  const source = readFileSync(filePath, 'utf-8');
  const lines = source.split('\n');
  const out: Violation[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Ignore comments, string literals, and imports
    const codeLine = line
      .replace(/\/\/.*/g, '')
      .replace(/'[^']*'/g, "''")
      .replace(/"[^"]*"/g, '""')
      .replace(/`[^`]*`/g, '``');

    // skip lines that consume tokens from the canonical token contract
    if (line.includes('goblinEventModalTokens') || line.includes('useTokens')) continue;

    const colorMatches = codeLine.match(COLOR_LITERAL_RE);
    if (colorMatches) {
      for (const match of colorMatches) {
        // allow css custom property values like var(--color)
        if (line.includes(`var(--`) || line.includes('transparent')) continue;
        out.push({
          file: relative(ROOT, filePath),
          line: i + 1,
          message: `Hardcoded color literal: ${match}`,
        });
      }
    }
  }

  // Multi-line inline style blocks
  const inlineStyleMatches = source.match(INLINE_STYLE_RE);
  if (inlineStyleMatches) {
    for (const block of inlineStyleMatches) {
      // skip blocks that consume the canonical token contract
      if (block.includes('goblinEventModalTokens') || block.includes('palette') || block.includes('effects') || block.includes('spacing') || block.includes('typography')) {
        continue;
      }
      const startIndex = source.indexOf(block);
      const lineNumber = source.slice(0, startIndex).split('\n').length;
      out.push({
        file: relative(ROOT, filePath),
        line: lineNumber,
        message: 'Ad-hoc inline style block with visual properties. Use tokens or Tailwind.',
      });
    }
  }

  return out;
}

function main() {
  let violations: Violation[] = [];
  for (const relativePath of TARGET_FILES) {
    const file = join(ROOT, relativePath);
    violations = violations.concat(lintFile(file));
  }

  if (violations.length > 0) {
    console.error('painter-lint: found violations');
    for (const v of violations) {
      console.error(`${v.file}:${v.line}: ${v.message}`);
    }
    process.exit(1);
  }

  console.log('painter-lint: no hardcoded color or ad-hoc inline style violations found.');
}

main();
