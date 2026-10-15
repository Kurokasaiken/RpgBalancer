/**
 * SP-3 mock-state isolation — allowlist, transitive, fail-closed.
 *
 * Merchant-owned modules (`MerchantPanel`, `merchantConfig`, `MockBuyControl`,
 * `merchantOfferIcons`) may not reach game state, persistence or a backend:
 * every import specifier is checked against an allowlist, allowlisted
 * project modules are treated as leaves (no descent), dynamic `import()` and
 * unresolved imports are failures, and `merchantConfig` keeps a closed set of
 * direct importers — no barrel re-export.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'fs';
import path from 'path';

const SRC = path.resolve(__dirname, '../../../src');
const GAME_FRAME = path.join(SRC, 'ui/idleVillage/components/gameFrame');
const CONFIG_DIR = path.join(SRC, 'balancing/config/idleVillage');

const MERCHANT_OWNED = [
  path.join(GAME_FRAME, 'MerchantPanel.tsx'),
  path.join(GAME_FRAME, 'MockBuyControl.tsx'),
  path.join(GAME_FRAME, 'merchantOfferIcons.tsx'),
  path.join(CONFIG_DIR, 'merchantConfig.ts'),
];

/** Bare specifiers and project modules the merchant boundary may import. */
const ALLOWED_BARE = new Set(['react', 'react-i18next', 'zod']);
const ALLOWED_PROJECT = new Set(
  [
    '@/ui/idleVillage/skins/primitives/HudPlaque',
    '@/ui/idleVillage/skins/primitives/SkinScope',
    './engravedIcons',
    './useHudPanelDrag',
    './merchantOfferIcons',
    './MockBuyControl',
    './MerchantPanel',
    '@/balancing/config/idleVillage/merchantConfig',
  ].map((s) => s.replace(/\\/g, '/')),
);

const IMPORT_RE = /(?:import|export)[^'"]*?from\s+['"]([^'"]+)['"]|import\s+['"]([^'"]+)['"]|require\(\s*['"]([^'"]+)['"]/g;
const DYNAMIC_IMPORT_RE = /import\s*\(/;

/** Resolves a project specifier to a file path, or null when it cannot be resolved. */
const resolveSpecifier = (fromFile: string, spec: string): string | null => {
  const base = spec.startsWith('@/') ? path.join(SRC, spec.slice(2)) : spec.startsWith('.') ? path.resolve(path.dirname(fromFile), spec) : null;
  if (!base) return null;
  for (const cand of [base, `${base}.ts`, `${base}.tsx`, `${base}.ts`, path.join(base, 'index.ts'), path.join(base, 'index.tsx')]) {
    if (existsSync(cand)) return cand;
  }
  return null;
};

const specifiersOf = (file: string): string[] => {
  const src = readFileSync(file, 'utf8');
  expect(DYNAMIC_IMPORT_RE.test(src), `${path.basename(file)} uses dynamic import()`).toBe(false);
  const specs: string[] = [];
  for (const m of src.matchAll(IMPORT_RE)) specs.push(m[1] ?? m[2] ?? m[3]);
  return specs;
};

describe('SP-3 merchant isolation', () => {
  it('merchant-owned modules import only the allowlist', () => {
    for (const file of MERCHANT_OWNED) {
      for (const spec of specifiersOf(file)) {
        if (!spec.startsWith('.') && !spec.startsWith('@/')) {
          expect(ALLOWED_BARE.has(spec), `${path.basename(file)} imports bare "${spec}"`).toBe(true);
          continue;
        }
        const normalized = spec.replace(/\\/g, '/');
        expect(ALLOWED_PROJECT.has(normalized), `${path.basename(file)} imports "${spec}" outside the allowlist`).toBe(true);
        // Unresolved project import = failure (typo must not pass silently).
        expect(resolveSpecifier(file, spec), `${path.basename(file)} unresolved import "${spec}"`).not.toBeNull();
      }
    }
  });

  it('merchantConfig is imported only by its declared boundary and never re-exported by the barrel', () => {
    const allowedImporters = new Set(['MerchantPanel.tsx', 'game-frame-pixi.tsx']);
    const offenders: string[] = [];
    const scan = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
          scan(full);
          continue;
        }
        if (!/\.(ts|tsx)$/.test(entry.name) || /\.test\.(ts|tsx)$/.test(entry.name)) continue;
        const src = readFileSync(full, 'utf8');
        if (!/merchantConfig/.test(src)) continue;
        for (const spec of specifiersOf(full)) {
          if (spec.includes('merchantConfig') && !allowedImporters.has(entry.name)) offenders.push(`${entry.name} → ${spec}`);
        }
        // Re-exports without `from` specifier are rare; catch `export *`/`export {x} from` of the module.
        if (/export\s+(\*|\{[^}]*\})\s+from\s+['"][^'"]*merchantConfig['"]/.test(src) && !allowedImporters.has(entry.name)) {
          offenders.push(`${entry.name} re-exports merchantConfig`);
        }
      }
    };
    scan(SRC);
    expect(offenders).toEqual([]);
  });

  it('MockBuyControl declares no on* handler props in source', () => {
    const src = readFileSync(path.join(GAME_FRAME, 'MockBuyControl.tsx'), 'utf8');
    expect(/\bon[A-Z][A-Za-z]*\s*[=:]/.test(src)).toBe(false);
    expect(/onPointer|onClick|onKeyDown/.test(src)).toBe(false);
  });
});
