import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('R-359 — /game warms the full asset set at mount', () => {
  // Ignore comments so commented-out imports/calls cannot satisfy the guard,
  // while whitespace and comments between live tokens remain interchangeable.
  const source = readFileSync(resolve(process.cwd(), 'src/pages/game-mappa2.tsx'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\/|\/\/[^\r\n]*/g, ' ');

  it('imports warmGameAssets from the shared game asset warmup module', () => {
    expect(source).toMatch(
      /import\s*\{[^}]*\bwarmGameAssets\b[^}]*\}\s*from\s*['"]@\/ui\/idleVillage\/utils\/gameAssetWarmup['"]/,
    );
  });

  it('calls warmGameAssets inside an empty-dependency mount effect', () => {
    expect(source).toMatch(
      /\buseEffect\s*\(\s*\(\s*\)\s*=>\s*\{[^{}]*\bwarmGameAssets\s*\(\s*\)[^{}]*\}\s*,\s*\[\s*\]\s*\)/,
    );
  });

  it('does not import or call the cursor-only warmup directly', () => {
    expect(source).not.toMatch(/\bwarmGameCursors\b/);
  });
});
