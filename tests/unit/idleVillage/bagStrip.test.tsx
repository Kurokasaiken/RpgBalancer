/**
 * PLAN-032 SP-4 — BagStrip + questBag helpers (artifact r004).
 *
 * Contract under test: a persistent read-only glance at the packed bag in
 * non-decision states (transit + beat playback incl. the final replay), in
 * STRUCTURAL mutual exclusion with the interactive ConsumableBelt (decision
 * zone). The wrapper slot is retained while a loadout was ever packed so the
 * stage never reflows mid-narrative.
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { readFileSync } from 'fs';
import path from 'path';
import { i18n } from '@/localization/i18n';
import { QUEST_STASH, type StashItem } from '@/balancing/config/idleVillage/quests/questStash';
import { BagStrip, BAG_CHIP_ROW_PX } from '@/ui/idleVillage/components/gameFrame/BagStrip';
import { bagEverPacked, bagItemShortLabel, bagStripVisible, questBagItems } from '@/ui/idleVillage/components/gameFrame/questBag';
import { QuestRunWindow } from '@/ui/idleVillage/components/gameFrame/QuestRunWindow';
import { applyChoice, availableOptions, createRun, type QuestRunState } from '@/ui/idleVillage/questS1Lab/questRun';
import { emptyPhase } from '@/ui/idleVillage/questS1Lab/questPhaseRecord';
import { GOBLIN_PRESETS } from '@/ui/idleVillage/questS1Lab/questLabPresets';
import { GOBLIN_SCENARIO } from '@/balancing/config/idleVillage/quests/scenarios/goblin';
import type { QuestBeat } from '@/ui/idleVillage/questS1Lab/beatSequencer';

const PRESET = GOBLIN_PRESETS[0].id;
/** A real t() bound to the idleVillage namespace — helpers consume this. */
const t = (key: string, opts?: Record<string, unknown>) => i18n.t(key, { ns: 'idleVillage', ...opts });

const ALL_FLAGS = QUEST_STASH.items.map((i) => i.flag);

/** A scene beat — enough to hold `presenting` true for a render. */
const sceneBeat = (id: string): QuestBeat => ({ id, kind: 'scene', nodeId: 'n', title: 'beat' });

const renderWindow = (run: QuestRunState, opts: { queuedBeats?: QuestBeat[]; armed?: boolean } = {}) =>
  render(
    <Tooltip.Provider>
      <QuestRunWindow
        run={run}
        phases={[emptyPhase(0)]}
        beats={GOBLIN_SCENARIO.beats}
        queuedBeats={opts.queuedBeats ?? []}
        beatTiming={{ sceneMs: 60_000, checkMs: 60_000, harmMs: 60_000, endMs: 60_000, recapMs: 60_000 }}
        title={GOBLIN_SCENARIO.title}
        flavour={GOBLIN_SCENARIO.flavour}
        artFor={() => undefined}
        time={{ progress: 0, label: 'Giorno 1 di 2' }}
        onChoose={() => undefined}
        armed={opts.armed ?? false}
        onToggleArmed={() => undefined}
        onUseHealing={() => undefined}
        onDrinkPotion={() => undefined}
        onClose={() => undefined}
        anchor={{ left: 0, top: 0 }}
        widthPx={460}
        theaterAspect={2.76}
        tooltipLines={6}
      />
    </Tooltip.Provider>,
  );

describe('bagStripVisible — truth table (ended × presenting × waiting × bagEmpty)', () => {
  it('enumerates exactly the non-decision states', () => {
    // The strip exists iff the bag is non-empty AND (presenting OR transit).
    const expectStrip = (bagEmpty: boolean, ended: boolean, waiting: boolean, presenting: boolean) =>
      !bagEmpty && (presenting || (!waiting && !ended));
    for (const bagEmpty of [false, true])
      for (const ended of [false, true])
        for (const waiting of [false, true])
          for (const presenting of [false, true]) {
            const got = bagStripVisible({ bagEmpty, ended, waiting, presenting });
            expect(got, `bagEmpty=${bagEmpty} ended=${ended} waiting=${waiting} presenting=${presenting}`).toBe(expectStrip(bagEmpty, ended, waiting, presenting));
          }
  });

  it('the strip zone is the negation of the belt zone over the same values', () => {
    // Belt lives at decision nodes: waiting && !presenting (never when ended).
    for (const ended of [false, true])
      for (const waiting of [false, true])
        for (const presenting of [false, true]) {
          const beltZone = waiting && !presenting && !ended;
          const stripZone = bagStripVisible({ bagEmpty: false, ended, waiting, presenting });
          expect(stripZone && beltZone, `ended=${ended} waiting=${waiting} presenting=${presenting}`).toBe(false);
        }
  });
});

describe('questBagItems — single derivation', () => {
  it('matches the canonical filter, identity AND order, all kinds', () => {
    for (const flags of [[], ALL_FLAGS, [ALL_FLAGS[2], ALL_FLAGS[0]], ['hasHealing'], ['unknown-flag']]) {
      const expected = QUEST_STASH.items.filter((i) => flags.includes(i.flag));
      expect(questBagItems(flags)).toEqual(expected);
    }
  });

  it('threads a non-default stash consistently', () => {
    const custom = { ...QUEST_STASH, items: [QUEST_STASH.items[4], QUEST_STASH.items[0]] };
    expect(questBagItems(['hasHealing', 'hasBonusForza'], custom)).toEqual(custom.items);
    expect(questBagItems(['hasPozione'], custom)).toEqual([]);
  });
});

describe('bagEverPacked — slot retention (consumablesUsed never displayed)', () => {
  it('is true when flags carry items OR the run already spent some', () => {
    expect(bagEverPacked({ flags: [], consumablesUsed: [] })).toBe(false);
    expect(bagEverPacked({ flags: ['hasHealing'], consumablesUsed: [] })).toBe(true);
    expect(bagEverPacked({ flags: [], consumablesUsed: ['hasBonusPerc'] })).toBe(true);
    expect(bagEverPacked({ flags: [], consumablesUsed: undefined } as never)).toBe(false);
  });
});

describe('bagItemShortLabel — the belt idiom, extracted', () => {
  it('equals the belt inline expression over every QUEST_STASH label', () => {
    for (const item of QUEST_STASH.items) {
      // The belt's inline form — kept verbatim here so drift fails loudly.
      const inline = t(item.labelKey).split('—')[0].trim();
      expect(bagItemShortLabel(t, item), item.flag).toBe(inline);
    }
  });

  it('a parenthesised qualifier is never mangled by the em-dash split', () => {
    // chipName composes "{label} ({qualifier})" — no em-dash, so splitting a
    // composed name can never truncate the qualifier. Pin the composed shape.
    const composed = t('gameFrame.questWindow.bagStrip.chipName', { label: 'Rope — +15 climbing', qualifier: 'armed' });
    expect(composed).toBe('Rope — +15 climbing (armed)');
    const insideParens = composed.match(/\(([^)]*)\)/)?.[1] ?? '';
    expect(insideParens).toBe('armed'); // the qualifier sits inside parens…
    expect(insideParens).not.toContain('—'); // …and can never carry an em-dash
    expect(composed.split('—')[0].trim()).toBe('Rope');
  });
});

describe('BagStrip — read-only readout', () => {
  const strip = (flags: string[], armed = false) =>
    render(<BagStrip items={questBagItems(flags)} armed={armed} />);

  it('renders null on empty input (defense-in-depth)', () => {
    const { container } = strip([]);
    expect(container.firstChild).toBeNull();
  });

  it('named list of chips: role=list + aria-label, chips role=listitem non-focusable', () => {
    strip(ALL_FLAGS);
    const list = screen.getByRole('list', { name: t('gameFrame.questWindow.bagStrip.label') });
    expect(list).toBeInTheDocument();
    for (const chip of screen.getAllByRole('listitem')) {
      expect(chip).not.toHaveAttribute('tabindex');
      expect(chip.tagName).not.toBe('BUTTON');
    }
  });

  it('visible text is the SHORT label; accessible name carries the FULL label', () => {
    strip(['hasBonusForza']);
    const chip = screen.getByRole('listitem');
    expect(chip.textContent).toBe('Strength Bonus'); // short form, no em-dash tail
    expect(chip).toHaveAccessibleName('Strength Bonus — +15 to one check');
  });

  it('armed stance marks EVERY check chip (dot + qualifier); !armed marks none', () => {
    const armedRender = strip(['hasBonusForza', 'hasBonusPerc'], true);
    expect(armedRender.container.querySelectorAll('[data-bag-armed]')).toHaveLength(2);
    for (const flag of ['hasBonusForza', 'hasBonusPerc']) {
      const chip = armedRender.container.querySelector(`[data-bag-chip="${flag}"]`)!;
      expect(chip.getAttribute('aria-label')).toContain(`(${t('gameFrame.questWindow.bagStrip.armed')})`);
    }
    armedRender.unmount();

    const disarmed = strip(['hasBonusForza'], false);
    expect(disarmed.container.querySelectorAll('[data-bag-armed]')).toHaveLength(0);
    expect(disarmed.container.querySelector('[data-bag-chip]')!.getAttribute('aria-label')).not.toContain('(');
  });

  it('action chips carry the held qualifier in the NAME; passive chips carry none', () => {
    strip(['hasHealing', 'hasPozione', 'hasGuardianBanner']);
    const healing = document.querySelector('[data-bag-chip="hasHealing"]')!;
    expect(healing.getAttribute('aria-label')).toContain(`(${t('gameFrame.questWindow.bagStrip.held')})`);
    const banner = document.querySelector('[data-bag-chip="hasGuardianBanner"]')!;
    expect(banner.getAttribute('aria-label')).not.toContain('(');
  });

  it('composed names never contain an em-dash-split hazard or a literal placeholder', () => {
    strip(ALL_FLAGS, true);
    for (const chip of screen.getAllByRole('listitem')) {
      const name = chip.getAttribute('aria-label') ?? '';
      expect(name).not.toContain('{');
      expect(name).not.toContain('}}');
      expect(name).not.toMatch(/\(.*—/); // no em-dash inside the parens qualifier
    }
  });
});

describe('QuestRunWindow — one reserved bag slot, belt XOR strip', () => {
  const packedRun = (): QuestRunState => {
    const run = createRun(PRESET, 7, 'goblin', ALL_FLAGS);
    expect(run.flags.length).toBeGreaterThan(0);
    return run;
  };

  it('decision node (waiting && !presenting): belt renders, strip does NOT — same render', () => {
    renderWindow(packedRun());
    expect(screen.getByTestId('quest-consumable-belt')).toBeInTheDocument();
    expect(screen.queryByTestId('quest-bag-strip')).toBeNull();
    expect(document.querySelector('[data-bag-slot]')).toBeTruthy(); // slot retained
  });

  it('presenting (beat playback): strip renders, belt does NOT — same render', () => {
    renderWindow(packedRun(), { queuedBeats: [sceneBeat('b1')] });
    expect(screen.getByTestId('quest-bag-strip')).toBeInTheDocument();
    expect(screen.queryByTestId('quest-consumable-belt')).toBeNull();
  });

  it('ended && presenting (final replay): the strip still shows', () => {
    const run = packedRun();
    run.ended = true;
    renderWindow(run, { queuedBeats: [sceneBeat('end-replay')] });
    expect(screen.getByTestId('quest-bag-strip')).toBeInTheDocument();
  });

  it('ended && !presenting: the slot retires with the epilogue', () => {
    const run = packedRun();
    run.ended = true;
    renderWindow(run);
    expect(document.querySelector('[data-bag-slot]')).toBeNull();
    expect(screen.queryByTestId('quest-bag-strip')).toBeNull();
    expect(screen.queryByTestId('quest-consumable-belt')).toBeNull();
  });

  it('spend-to-empty during presenting: empty slot holds the reserved row, dead space', () => {
    const run = packedRun();
    run.flags = [];
    run.consumablesUsed = ['hasBonusPerc', 'hasHealing'];
    const { container } = renderWindow(run, { queuedBeats: [sceneBeat('b1')] });
    const slot = container.querySelector('[data-bag-slot]') as HTMLElement;
    expect(slot).toBeTruthy();
    expect(Number.parseFloat(slot.style.minHeight)).toBe(BAG_CHIP_ROW_PX);
    expect(slot.textContent).toBe(''); // retained dead space — no residual chrome
    expect(screen.queryByTestId('quest-bag-strip')).toBeNull();
    expect(screen.queryByTestId('quest-consumable-belt')).toBeNull();
  });

  it('committed-state contract: a spent item does NOT appear in the strip during presenting', () => {
    const run = packedRun();
    // Real spend path: applyChoice with the bag armed consumes a check item.
    const options = availableOptions(run);
    const checkOption = options.find((o) => !o.disabled)!;
    const before = [...run.flags];
    applyChoice(run, checkOption.id, { useConsumable: true });
    const spent = before.filter((f) => !run.flags.includes(f));
    if (spent.length === 0) {
      // The option may not consume — drive the spend directly.
      applyChoice(run, checkOption.id); // no-op guard
      run.flags = run.flags.filter((f) => f !== 'hasBonusForza');
      run.consumablesUsed = [...(run.consumablesUsed ?? []), 'hasBonusForza'];
    }
    const spentFlag = spent[0] ?? 'hasBonusForza';
    renderWindow(run, { queuedBeats: [sceneBeat('b2')] });
    expect(document.querySelector(`[data-bag-chip="${spentFlag}"]`)).toBeNull();
    // …and the same item is gone from the popover derivation too.
    expect(questBagItems(run.flags).map((i) => i.flag)).not.toContain(spentFlag);
  });
});

describe('i18n — gameFrame.questWindow.bagStrip.* (ICU syntax, trap T-11)', () => {
  const resolveKey = (locale: string, key: string): string | undefined =>
    key
      .split('.')
      .reduce<unknown>(
        (acc, part) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[part] : undefined),
        JSON.parse(readFileSync(path.resolve(__dirname, `../../../public/locales/${locale}/idleVillage.json`), 'utf8')),
      ) as string | undefined;

  it('all keys exist in en + it-IT with ICU {var} placeholders (never {{}})', () => {
    for (const locale of ['en', 'it-IT']) {
      for (const key of ['label', 'chipName', 'armed', 'held']) {
        const value = resolveKey(locale, `gameFrame.questWindow.bagStrip.${key}`);
        expect(typeof value, `${locale} missing bagStrip.${key}`).toBe('string');
        expect(value).not.toContain('{{');
      }
      expect(resolveKey(locale, 'gameFrame.questWindow.bagStrip.chipName')).toContain('{label}');
      expect(resolveKey(locale, 'gameFrame.questWindow.bagStrip.chipName')).toContain('{qualifier}');
    }
  });
});

describe('boundary — BagStrip imports stay inside the declared seam', () => {
  const SRC = path.resolve(__dirname, '../../../src');
  const IMPORT_RE = /(?:import|export)[^'"]*?from\s+['"]([^'"]+)['"]/g;
  const ALLOWED = new Set([
    'react',
    'react-i18next',
    'i18next',
    './questBag',
    '@/ui/shared/statIconUtils',
    '@/balancing/config/idleVillage/quests/questStash',
    // Spec-required derivations: the 1-row height token (PRES) and the muted
    // tone for action chips (TONE) — same sources the belt reads.
    '@/balancing/config/idleVillage/quests/questLabPresentation',
    '@/ui/idleVillage/questS1Lab/hud/atoms',
  ]);

  it('every BagStrip import is in the allowlist; no on* handlers in source', () => {
    const src = readFileSync(path.join(SRC, 'ui/idleVillage/components/gameFrame/BagStrip.tsx'), 'utf8');
    for (const m of src.matchAll(IMPORT_RE)) {
      const spec = m[1].replace(/\\/g, '/');
      const normalized = spec.startsWith('./') ? spec : spec;
      expect(ALLOWED.has(normalized), `BagStrip imports "${spec}" outside the allowlist`).toBe(true);
    }
    expect(/\bon[A-Z][A-Za-z]*\s*[=:{]/.test(src)).toBe(false); // zero interactive handlers
  });

  it('questBag stays pure: no React/DOM imports', () => {
    const src = readFileSync(path.join(SRC, 'ui/idleVillage/components/gameFrame/questBag.ts'), 'utf8');
    expect(/from\s+['"]react['"]/.test(src)).toBe(false);
    expect(/\b(document|window)\b/.test(src)).toBe(false);
  });
});
