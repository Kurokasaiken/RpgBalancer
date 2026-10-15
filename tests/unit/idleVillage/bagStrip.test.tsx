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
import { describe, it, expect } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { readFileSync } from 'fs';
import path from 'path';
import { i18n } from '@/localization/i18n';
import { QUEST_STASH, type StashItem } from '@/balancing/config/idleVillage/quests/questStash';
import { BagStrip } from '@/ui/idleVillage/components/gameFrame/BagStrip';
import { bagEverPacked, bagItemShortLabel, bagStripVisible, questBagItems } from '@/ui/idleVillage/components/gameFrame/questBag';
import { QuestRunWindow } from '@/ui/idleVillage/components/gameFrame/QuestRunWindow';
import { createRun, type QuestRunState } from '@/ui/idleVillage/questS1Lab/questRun';
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

const COMPANIONS = { widthPx: 260, gapPx: 8, minWidthPx: 180, edgeInsetPx: 18 };

/** jsdom starts at 1024px — the companion predicate (≥1052px) needs room. */
const setViewportWidth = (w: number) => {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: w });
};

interface RenderWindowOpts {
  queuedBeats?: QuestBeat[];
  armedFlags?: ReadonlySet<string>;
  onToggleArmedFlag?: (flag: string) => void;
  vw?: number;
}

const renderWindow = (run: QuestRunState, opts: RenderWindowOpts = {}) => {
  setViewportWidth(opts.vw ?? 1440);
  return render(
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
        armedFlags={opts.armedFlags ?? new Set()}
        onToggleArmedFlag={opts.onToggleArmedFlag ?? (() => undefined)}
        onClose={() => undefined}
        anchor={{ left: 0, top: 0 }}
        widthPx={640}
        theaterAspect={2.9}
        tooltipLines={6}
        companions={COMPANIONS}
      />
    </Tooltip.Provider>,
  );
};

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

describe('QuestRunWindow — companion belt (R-196)', () => {
  /* bagSlots = 3: pack the full kind spread — check, action, passive. */
  const packedRun = (loadout: string[] = ['hasBonusPerc', 'hasHealing', 'hasGuardianBanner']): QuestRunState => {
    const run = createRun(PRESET, 7, 'goblin', loadout);
    expect(run.flags.length).toBeGreaterThan(0);
    return run;
  };

  it('left column stacks party roster over the belt; right column carries the chronicle — all visible at once at 1440px', () => {
    renderWindow(packedRun());
    const left = screen.getByTestId('quest-companion-left');
    const right = screen.getByTestId('quest-companion-right');
    expect(within(left).getByTestId('quest-party-roster')).toBeInTheDocument();
    expect(within(left).getByTestId('quest-belt')).toBeInTheDocument();
    // roster above belt in the same column
    expect(left.firstElementChild).toBe(screen.getByTestId('quest-party-roster'));
    expect(within(right).getByTestId('quest-log-panel')).toBeInTheDocument();
  });

  it('belt items are icon-only buttons; the passive banner is a badge, never a toggle', () => {
    renderWindow(packedRun());
    const belt = screen.getByTestId('quest-belt');
    for (const btn of within(belt).getAllByRole('button')) {
      const icon = btn.querySelector('svg');
      expect(icon).toBeTruthy();
      expect(btn.textContent).toBe(''); // zero visible text — the name lives in aria-label
      expect(btn).toHaveAccessibleName();
    }
    const banner = belt.querySelector('[data-belt-item="hasGuardianBanner"]')!;
    expect(banner.tagName).not.toBe('BUTTON');
    expect(banner).not.toHaveAttribute('aria-pressed');
    expect(banner.getAttribute('data-belt-status')).toBe('passive');
  });

  it('a check item arms on first click and disarms on the second (per-item flags)', () => {
    const run = packedRun();
    const Harness: React.FC = () => {
      const [flags, setFlags] = React.useState<ReadonlySet<string>>(new Set());
      return (
        <Tooltip.Provider>
          <QuestRunWindow
            run={run}
            phases={[emptyPhase(0)]}
            beats={GOBLIN_SCENARIO.beats}
            queuedBeats={[]}
            beatTiming={{ sceneMs: 60_000, checkMs: 60_000, harmMs: 60_000, endMs: 60_000, recapMs: 60_000 }}
            title={GOBLIN_SCENARIO.title}
            flavour={GOBLIN_SCENARIO.flavour}
            artFor={() => undefined}
            time={{ progress: 0, label: 'Giorno 1 di 2' }}
            onChoose={() => undefined}
            armedFlags={flags}
            onToggleArmedFlag={(f) =>
              setFlags((prev) => {
                const next = new Set(prev);
                if (next.has(f)) next.delete(f);
                else next.add(f);
                return next;
              })
            }
            onClose={() => undefined}
            anchor={{ left: 0, top: 0 }}
            widthPx={640}
            theaterAspect={2.9}
            tooltipLines={6}
            companions={COMPANIONS}
          />
        </Tooltip.Provider>
      );
    };
    render(<Harness />);
    const item = screen.getByTestId('quest-belt').querySelector('[data-belt-item="hasBonusPerc"]')!;
    expect(item).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(item);
    expect(item).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(item);
    expect(item).toHaveAttribute('aria-pressed', 'false');
  });

  it('a spent item leaves the belt (the committed flags drive the list)', () => {
    const run = packedRun();
    run.flags = run.flags.filter((f) => f !== 'hasBonusPerc');
    run.consumablesUsed = [...(run.consumablesUsed ?? []), 'hasBonusPerc'];
    renderWindow(run);
    expect(document.querySelector('[data-belt-item="hasBonusPerc"]')).toBeNull();
    expect(questBagItems(run.flags).map((i) => i.flag)).not.toContain('hasBonusPerc');
  });

  it('the companion columns auto-collapse below the shared predicate (1024px < 1052px)', () => {
    renderWindow(packedRun(), { vw: 1024 });
    expect(screen.queryByTestId('quest-belt')).toBeNull();
    expect(screen.queryByTestId('quest-companion-left')).toBeNull();
    expect(screen.queryByTestId('quest-companion-right')).toBeNull();
  });

  it('the log toggle carries the parchment glyph (ico-scroll), not the book', () => {
    renderWindow(packedRun());
    const toggle = screen.getByTestId('quest-log-toggle');
    expect(toggle.querySelector('[data-engraved="ico-scroll"]')).toBeTruthy();
    expect(toggle.querySelector('[data-engraved="nav-chronicle"]')).toBeNull();
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });

  it('no «Skip to the frontier» control exists — beats show only a Continue button', () => {
    renderWindow(packedRun(), { queuedBeats: [sceneBeat('b1'), sceneBeat('b2')] });
    expect(screen.queryByText(/skip to the frontier|vai al bivio/i)).toBeNull();
    const cont = screen.getByTestId('quest-window-beat-continue');
    expect(cont.tagName).toBe('BUTTON');
    // BeatStage's outer stage is never a nested interactive control.
    const stage = screen.getByTestId('quest-window-beat');
    expect(stage).not.toHaveAttribute('role', 'button');
    expect(stage).not.toHaveAttribute('tabindex', '0');
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
