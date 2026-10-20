/**
 * PLAN-067 T-A15 (R-234) — every Director action label the page asks for exists in both locales.
 * `gameFrame.director.resetInitial` had no entry: the raw key was painted in the panel and ran past
 * its right edge (audit F6). The page's literal `t('gameFrame.director.<key>')` calls are read from
 * the source, so a new action cannot ship without its labels.
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = path.resolve(__dirname, '../../..');
const page = fs.readFileSync(path.join(root, 'src/pages/game-frame-pixi.tsx'), 'utf8');
const keys = [...new Set([...page.matchAll(/t\('gameFrame\.director\.([A-Za-z0-9_]+)'/g)].map((m) => m[1]))];
const locale = (l: string) => JSON.parse(fs.readFileSync(path.join(root, `public/locales/${l}/idleVillage.json`), 'utf8'));

describe('Director action labels — translated (R-234)', () => {
  // INV:R-234-director-labels-translated — every literal director label key has a non-empty en and it-IT string.
  it.each(['en', 'it-IT'])('%s has every Director label', (l) => {
    const dir = locale(l).gameFrame?.director ?? {};
    const missing = keys.filter((k) => typeof dir[k] !== 'string' || dir[k].trim() === '');
    expect(keys.length).toBeGreaterThan(5);
    expect(missing).toEqual([]);
  });
});
