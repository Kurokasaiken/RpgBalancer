import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const MENU_DIR = 'src/ui/idleVillage/components/gameFrame/menu';
const LOCALES = ['en', 'it-IT'] as const;

/** Every `t('gameFrame.menu.…')` literal in the menu screens and the menu itself. */
function usedKeys(): string[] {
  const files = [
    ...fs.readdirSync(MENU_DIR).filter((f) => /\.tsx?$/.test(f)).map((f) => path.join(MENU_DIR, f)),
    'src/ui/idleVillage/components/gameFrame/HudGameMenu.tsx',
  ];
  const keys = new Set<string>();
  for (const file of files) {
    for (const m of fs.readFileSync(file, 'utf8').matchAll(/['"`](gameFrame\.menu\.[A-Za-z0-9_.-]+?)['"`]/g)) keys.add(m[1]);
  }
  return [...keys].filter((k) => !k.includes('${'));
}

function parseNoDuplicates(raw: string): { value: unknown; duplicates: string[] } {
  const duplicates: string[] = [];
  const value = JSON.parse(raw, function (this: Record<string, unknown>, key) {
    return key === '' ? this[''] : this[key];
  });
  // JSON.parse silently keeps the last of two equal keys: re-scan each object's own keys textually.
  const stack: Set<string>[] = [];
  for (const m of raw.matchAll(/"((?:[^"\\]|\\.)*)"\s*:|[{}]/g)) {
    if (m[0] === '{') stack.push(new Set());
    else if (m[0] === '}') stack.pop();
    else if (stack.length) {
      const top = stack[stack.length - 1];
      if (top.has(m[1])) duplicates.push(m[1]);
      top.add(m[1]);
    }
  }
  return { value, duplicates };
}

describe('menu i18n', () => {
  // INV:game-menu-screens.INV-12 — every text key the menu screens use is a string in en and it-IT, and the menu namespace has no duplicate key (a duplicate silently turns a label into an object and crashes the page)
  it.each(LOCALES)('%s: every used gameFrame.menu key resolves to a string, no duplicate keys', (locale) => {
    const { value, duplicates } = parseNoDuplicates(fs.readFileSync(`public/locales/${locale}/idleVillage.json`, 'utf8'));
    expect(duplicates.filter((k) => ['quit', 'load', 'settings', 'loadGame', 'newGame', 'close', 'cancel', 'title'].includes(k))).toEqual([]);
    const menu = (value as { gameFrame: { menu: Record<string, unknown> } }).gameFrame.menu;
    for (const key of usedKeys()) {
      const resolved = key.replace('gameFrame.menu.', '').split('.').reduce<unknown>((o, part) => (o as Record<string, unknown> | undefined)?.[part], menu);
      expect({ key, type: typeof resolved }).toEqual({ key, type: 'string' });
    }
  });
});
