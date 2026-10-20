/**
 * PLAN-067 T-A13 (R-234) — authored quest prose in it-IT.
 *
 * Three promises, each its own test:
 *   1. COMPLETE — every translatable string of a scenario has an it-IT entry. A new or changed line
 *      in the manuscript fails here, naming the path, instead of showing English in an Italian game.
 *   2. FRESH — an entry's English source matches the manuscript today. A reworded line makes its
 *      translation stale: it is ignored at runtime (English shows) and listed here.
 *   3. APPLIED — the engine hands out Italian node text (`nodesFor`) and the UI Italian scenario
 *      text (`scenarioForQuest`); English leaves both untouched.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { GOBLIN_SCENARIO } from '@/balancing/config/idleVillage/quests/scenarios/goblin';
import { ROVINE_SCENARIO } from '@/balancing/config/idleVillage/quests/scenarios/rovine';
import {
  CONTENT_LOCALES,
  CONTENT_OVERLAYS,
  applyContentOverlay,
  setQuestContentLocale,
  staleOverlayPaths,
  untranslatedPaths,
} from '@/balancing/config/idleVillage/quests/questContentLocale';
import { createRun, nodesFor } from '@/ui/idleVillage/questS1Lab/questRun';
import { GOBLIN_PRESETS } from '@/ui/idleVillage/questS1Lab/questLabPresets';
import { scenarioForQuest } from '@/ui/idleVillage/questS1Lab/questOffer';

const SCENARIOS = { goblin: GOBLIN_SCENARIO, rovine: ROVINE_SCENARIO } as const;
const cases = CONTENT_LOCALES.flatMap((locale) => (Object.keys(SCENARIOS) as Array<keyof typeof SCENARIOS>).map((q) => [locale, q] as const));

afterEach(() => setQuestContentLocale('en'));

describe('quest content overlay — completeness and freshness', () => {
  // Every translatable string of every scenario has a fresh overlay entry in each content locale.
  it.each(cases)('%s · %s: no untranslated and no stale strings', (locale, quest) => {
    const overlay = CONTENT_OVERLAYS[locale]?.[quest];
    expect(overlay, `${locale}/${quest} overlay`).toBeTruthy();
    expect({ untranslated: untranslatedPaths(SCENARIOS[quest], overlay!) }).toEqual({ untranslated: [] });
    expect({ stale: staleOverlayPaths(SCENARIOS[quest], overlay!) }).toEqual({ stale: [] });
  });

  it('ignores an entry whose English source changed — English shows, never a stale translation', () => {
    const base = { nodes: { a: { title: 'Rewritten title' } } };
    const overlay = { 'nodes.a.title': ['Old title', 'Vecchio titolo'] } as const;
    expect(applyContentOverlay(base, overlay).nodes.a.title).toBe('Rewritten title');
    expect(applyContentOverlay({ nodes: { a: { title: 'Old title' } } }, overlay).nodes.a.title).toBe('Vecchio titolo');
  });
});

describe('quest content overlay — applied where the player reads it', () => {
  it('English leaves the engine nodes and the scenario untouched', () => {
    setQuestContentLocale('en');
    const run = createRun(GOBLIN_PRESETS[0].id, 1, 'goblin');
    expect(nodesFor(run)['gob-esplora'].title).toBe('Exploration');
    expect(scenarioForQuest('goblin')!.title).toBe('Goblin Extermination');
  });

  // INV:R-234-quest-content-translated — with it-IT active, the engine reads Italian node text and the
  // UI an Italian scenario (title, slot roles); the base scenario is never touched.
  it('it-IT hands the engine Italian node text and the UI an Italian scenario', () => {
    setQuestContentLocale('it-IT');
    const run = createRun(GOBLIN_PRESETS[0].id, 1, 'goblin');
    expect(nodesFor(run)['gob-esplora'].title).toBe('Esplorazione');
    expect(scenarioForQuest('goblin')!.title).toBe('Sterminio dei goblin');
    expect(scenarioForQuest('goblin')!.offer.slots.required[0].label).toBe('Capospedizione');
  });

  it('never changes the base scenario or the offer hash input', () => {
    setQuestContentLocale('it-IT');
    nodesFor(createRun(GOBLIN_PRESETS[0].id, 1, 'goblin'));
    expect(GOBLIN_SCENARIO.nodes['gob-esplora'].title).toBe('Exploration');
  });
});
