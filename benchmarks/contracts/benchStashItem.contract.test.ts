/**
 * PLAN-039 / R-204 replay benchmark — B3 contract test.
 *
 * Seeded into the worktree before the executor runs. The executor must add a
 * new stash item to `src/balancing/config/idleVillage/quests/questStash.ts`
 * plus its i18n keys in `public/locales/{en,it-IT,pseudo}/idleVillage.json`.
 * Scoring is done independently by the benchmark driver.
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { QUEST_STASH } from '@/balancing/config/idleVillage/quests/questStash';

function localeJson(locale: string): Record<string, unknown> {
  const file = path.resolve(`public/locales/${locale}/idleVillage.json`);
  return JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>;
}

function nestedValue(root: Record<string, unknown>, dotted: string): unknown {
  return dotted.split('.').reduce<unknown>((acc, k) => {
    if (acc && typeof acc === 'object' && k in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[k];
    }
    return undefined;
  }, root);
}

describe('PLAN-039 B3 — benchmark stash item', () => {
  it('QUEST_STASH contains hasLuckyCharm with the authored contract', () => {
    const item = QUEST_STASH.items.find((i) => i.flag === 'hasLuckyCharm');
    expect(item, 'stash item hasLuckyCharm missing').toBeDefined();
    expect(item!.labelKey).toBe('questS1Lab.item.luckyCharm');
    expect(item!.descKey).toBe('questS1Lab.stash.desc.luckyCharm');
    expect(item!.kind).toBe('check');
    expect(item!.bonus).toBe(10);
    expect(item!.stats).toEqual(['cha']);
    expect(item!.icon).toBeTruthy();
  });

  it.each(['en', 'it-IT', 'pseudo'])(
    'locale %s defines questS1Lab.item.luckyCharm and questS1Lab.stash.desc.luckyCharm',
    (locale) => {
      const json = localeJson(locale);
      expect(nestedValue(json, 'questS1Lab.item.luckyCharm'), `missing item label in ${locale}`).toBeTruthy();
      expect(nestedValue(json, 'questS1Lab.stash.desc.luckyCharm'), `missing desc in ${locale}`).toBeTruthy();
    },
  );
});
