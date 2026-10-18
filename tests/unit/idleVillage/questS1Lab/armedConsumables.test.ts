/**
 * R-196 / PLAN-035 — armed-consumables contract in the quest engine.
 *
 * The belt's per-item selection (`armedFlags`) replaces the legacy boolean:
 * - `stepArmedActionItems` is the ONE deterministic routine shared by preview
 *   (`previewArmedActionItems` on a structuredClone) and commit (live state);
 * - check items are consumed only when they win the coverage-first tie-break
 *   for the check actually entered — shadowed/inert armed siblings stay;
 * - narrative-only options never consume armed items;
 * - invalid commands consume nothing (validation precedes the atomic step).
 */

import { describe, expect, it } from 'vitest';
import { QUEST_STASH } from '@/balancing/config/idleVillage/quests/questStash';
import {
  applyChoice,
  consumableBonusFor,
  createRun,
  nodesFor,
  previewArmedActionItems,
  previewOption,
  stepArmedActionItems,
  submitCommand,
  type QuestRunState,
} from '@/ui/idleVillage/questS1Lab/questRun';

const PRESET = 'gob-band';

/** A goblin run parked at `gob-esplora` — the first two-check frontier
 *  (gob-cerca-tracce → perc, gob-forza-tracce → str+perc). */
const atEsplora = (loadout: string[]): QuestRunState => {
  const run = createRun(PRESET, 7, 'goblin', loadout);
  expect(run.nodeId).toBe('gob-esplora');
  return run;
};

/** Wound the second member so an action item has a target. */
const woundMilo = (run: QuestRunState) => {
  const m = run.party[1];
  m.hp = 40;
  m.wounded = true;
  return m;
};

describe('consumableBonusFor — per-item armed selection', () => {
  const checkNode = () => nodesFor(createRun(PRESET, 7, 'goblin'))['gob-tracce-perfor']; // str + perc

  it('unarmed items never apply when armedFlags is provided', () => {
    const run = createRun(PRESET, 7, 'goblin', ['hasBonusForza', 'hasBonusPerc', 'hasFumogeno']);
    expect(consumableBonusFor(run, checkNode(), new Set())).toBeNull();
    expect(consumableBonusFor(run, checkNode(), new Set(['hasBonusPerc']))?.flag).toBe('hasBonusPerc');
  });

  it('coverage-first tie-break: the armed item covering more of the check wins; ties fall to bonus then catalog order', () => {
    const run = createRun(PRESET, 7, 'goblin', ['hasBonusForza', 'hasBonusPerc', 'hasCorda']);
    const node = checkNode(); // str+perc — every candidate covers exactly 1 stat
    // Equal coverage + equal bonus → catalog order: hasBonusForza is first.
    expect(consumableBonusFor(run, node, new Set(['hasBonusForza', 'hasBonusPerc', 'hasCorda']))?.flag).toBe('hasBonusForza');
    // Remove the catalog-first winner → next in line wins.
    expect(consumableBonusFor(run, node, new Set(['hasBonusPerc', 'hasCorda']))?.flag).toBe('hasBonusPerc');
    // Without armedFlags (legacy path) the same coverage rule picks among held items.
    expect(consumableBonusFor(run, node)?.flag).toBe('hasBonusForza');
  });

  it('items that cover no stat of the check are never candidates', () => {
    const run = createRun(PRESET, 7, 'goblin', ['hasFumogeno', 'hasHealing', 'hasPozione']);
    const percNode = nodesFor(run)['gob-tracce-per']; // perc only
    expect(consumableBonusFor(run, percNode, new Set(['hasFumogeno', 'hasHealing', 'hasPozione']))).toBeNull();
  });
});

describe('stepArmedActionItems — one deterministic routine', () => {
  it('healing targets the most-hurt living member (+20, wound cleared at full)', () => {
    const run = createRun(PRESET, 7, 'goblin', ['hasHealing']);
    const hurt = woundMilo(run); // 40/60 wounded
    run.party[2].hp = 50; // less hurt — not the target
    const res = stepArmedActionItems(run, new Set(['hasHealing']));
    expect(res.consumedFlags).toEqual(['hasHealing']);
    expect(res.memberDeltas[hurt.id].hpDelta).toBe(20);
    expect(run.flags).not.toContain('hasHealing');
    expect(run.consumablesUsed).toContain('hasHealing');
    expect(hurt.hp).toBe(60);
    expect(hurt.wounded).toBe(false);
  });

  it('sequential pass: potion reads the post-heal state (shadowed when the kit took its target)', () => {
    const run = createRun(PRESET, 7, 'goblin', ['hasHealing', 'hasPozione']);
    woundMilo(run); // only injured member — the kit fully heals 40→60
    const res = stepArmedActionItems(run, new Set(['hasHealing', 'hasPozione']));
    expect(res.consumedFlags).toEqual(['hasHealing']);
    expect(res.shadowedFlags).toContain('hasPozione'); // had a target at pass start, kit took it
    expect(run.flags).toContain('hasPozione');
  });

  it('nobody needs a heal → armed action items are inert and stay in the bag', () => {
    const run = createRun(PRESET, 7, 'goblin', ['hasHealing', 'hasPozione']);
    const res = stepArmedActionItems(run, new Set(['hasHealing', 'hasPozione']));
    expect(res.consumedFlags).toEqual([]);
    expect(res.inertFlags).toEqual(expect.arrayContaining(['hasHealing', 'hasPozione']));
    expect(run.flags).toEqual(expect.arrayContaining(['hasHealing', 'hasPozione']));
  });

  it('passive items are never action-stepped', () => {
    const run = createRun(PRESET, 7, 'goblin', ['hasGuardianBanner']);
    woundMilo(run);
    const res = stepArmedActionItems(run, new Set(['hasGuardianBanner']));
    expect(res.consumedFlags).toEqual([]);
    expect(run.flags).toContain('hasGuardianBanner');
  });
});

describe('previewArmedActionItems — parity with the commit path', () => {
  it('runs the same routine on a clone: identical deltas, live state untouched', () => {
    const run = createRun(PRESET, 7, 'goblin', ['hasHealing', 'hasPozione', 'hasBonusPerc']);
    const hurt = woundMilo(run);
    const flagsBefore = [...run.flags];
    const pv = previewArmedActionItems(run, new Set(['hasHealing']));
    expect(pv.memberDeltas[hurt.id].hpDelta).toBe(20);
    expect(pv.consumedFlags).toEqual(['hasHealing']);
    // The clone was mutated; the live state was not.
    expect(pv.state.flags).not.toContain('hasHealing');
    expect(run.flags).toEqual(flagsBefore);
    expect(run.party[1].hp).toBe(40);
    expect(run.party[1].wounded).toBe(true);
  });
});

describe('submitCommand — atomic armed commit boundary', () => {

  it('unknown/invalid options consume nothing', () => {
    const run = atEsplora(['hasHealing', 'hasBonusPerc']);
    woundMilo(run);
    submitCommand(run, 'does-not-exist', { armedFlags: new Set(['hasHealing', 'hasBonusPerc']) });
    expect(run.flags).toEqual(expect.arrayContaining(['hasHealing', 'hasBonusPerc']));
    expect(run.party[1].hp).toBe(40);
    expect(run.nodeId).toBe('gob-esplora');
  });

  it('check options fire armed action items before the roll — even on a failed verdict', () => {
    const run = atEsplora(['hasHealing', 'hasBonusPerc']);
    const hurt = woundMilo(run);
    // forceDie 100 → worst roll; the heal is still committed (same atomic step).
    submitCommand(run, 'gob-cerca-tracce', { armedFlags: new Set(['hasHealing', 'hasBonusPerc']), forceDie: 100 });
    expect(run.flags).not.toContain('hasHealing');
    expect(run.flags).not.toContain('hasBonusPerc'); // perc check → perc item wins and is spent
    expect(run.consumablesUsed).toEqual(expect.arrayContaining(['hasHealing', 'hasBonusPerc']));
    expect(hurt.hp).toBeGreaterThanOrEqual(60 - 100); // healed, then check tolls may land
    expect(run.checkQueue.at(-1)?.verdict).toBeDefined();
  });

  it('armed check items that lose the tie-break are NOT consumed', () => {
    const run = atEsplora(['hasBonusForza', 'hasBonusPerc', 'hasCorda']);
    submitCommand(run, 'gob-forza-tracce', { armedFlags: new Set(['hasBonusForza', 'hasBonusPerc', 'hasCorda']), forceDie: 1 });
    // Winner per coverage/catalog on str+perc: hasBonusForza. Siblings survive.
    expect(run.flags).not.toContain('hasBonusForza');
    expect(run.flags).toEqual(expect.arrayContaining(['hasBonusPerc', 'hasCorda']));
  });

  it('combat turns apply armed action items before resolving the turn', () => {
    const run = createRun(PRESET, 7, 'goblin', ['hasHealing', 'hasBonusPerc']);
    woundMilo(run);
    // Jump the frontier into the combat node as arriveNode would.
    const nodes = nodesFor(run);
    const combat = nodes['gob-combattimento'];
    expect(combat?.kind).toBe('combat');
    run.nodeId = 'gob-combattimento';
    run.goblinLeft = 6;
    submitCommand(run, 'fight-turn', { armedFlags: new Set(['hasHealing']) });
    expect(run.flags).not.toContain('hasHealing');
    expect(run.consumablesUsed).toContain('hasHealing');
    expect(run.combatTurn).toBe(1);
  });

  it('combat: an armed action item with no wounded member is not wasted', () => {
    const run = createRun(PRESET, 7, 'goblin', ['hasHealing']);
    run.nodeId = 'gob-combattimento';
    run.goblinLeft = 6;
    submitCommand(run, 'fight-turn', { armedFlags: new Set(['hasHealing']) });
    expect(run.flags).toContain('hasHealing'); // inert — nobody to heal
    expect(run.combatTurn).toBe(1);
  });
});

describe('previewOption — armed preview reads the post-heal state', () => {
  it('the armed check item lifts the projected score; unarmed siblings do not', () => {
    const run = atEsplora(['hasBonusForza', 'hasBonusPerc', 'hasFumogeno']);
    const perc = QUEST_STASH.items.find((i) => i.flag === 'hasBonusPerc')!;
    const armed = previewOption(run, 'gob-cerca-tracce', { armedFlags: new Set(['hasBonusPerc']) })!;
    const bare = previewOption(run, 'gob-cerca-tracce', { armedFlags: new Set<string>() })!;
    expect(armed.consumableFlag).toBe('hasBonusPerc');
    expect(armed.score).toBe(bare.score + (perc.bonus ?? 0));
    // Arming an item that does not cover the check changes nothing.
    const fumo = previewOption(run, 'gob-cerca-tracce', { armedFlags: new Set(['hasFumogeno']) })!;
    expect(fumo.score).toBe(bare.score);
  });

  it('the healed member shows reduced wound/death risk in the preview', () => {
    const run = atEsplora(['hasHealing']);
    const hurt = woundMilo(run);
    const before = previewOption(run, 'gob-cerca-tracce', { armedFlags: new Set<string>() })!;
    const healed = previewOption(run, 'gob-cerca-tracce', { armedFlags: new Set(['hasHealing']) })!;
    const slotBefore = before.perSlot.find((s) => s.id === hurt.id)!;
    const slotAfter = healed.perSlot.find((s) => s.id === hurt.id)!;
    expect(slotBefore.wounded).toBe(true);
    expect(slotAfter.wounded).toBe(false);
    expect(slotAfter.woundPct).toBeLessThan(slotBefore.woundPct);
    // …and the preview never touched the live run.
    expect(run.party[1].hp).toBe(40);
    expect(run.flags).toContain('hasHealing');
  });
});
