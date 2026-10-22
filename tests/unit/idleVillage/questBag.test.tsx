/**
 * PLAN-043 WS-5 — questBag helper + quest-window companion belt.
 *
 * (Formerly `bagStrip.test.tsx`, PLAN-032 SP-4. The `BagStrip` readout was
 * removed in WS-5 — the WS-4 quest window shows the bag through the
 * title-row popover and the interactive `ConsumableBelt`, so the strip's
 * derivations went with it. What survives under test: `questBagItems`, the
 * single derivation both bag views consume, and the belt/tab contract of
 * `QuestRunWindow`.)
 */
import React from 'react';
import { describe, it, expect } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { readFileSync } from 'fs';
import path from 'path';
import { QUEST_STASH } from '@/balancing/config/idleVillage/quests/questStash';
import { questBagItems } from '@/ui/idleVillage/components/gameFrame/questBag';
import { QuestRunWindow } from '@/ui/idleVillage/components/gameFrame/QuestRunWindow';
import { createRun, type QuestRunState } from '@/ui/idleVillage/questS1Lab/questRun';
import { emptyPhase } from '@/ui/idleVillage/questS1Lab/questPhaseRecord';
import { GOBLIN_PRESETS } from '@/ui/idleVillage/questS1Lab/questLabPresets';
import { GOBLIN_SCENARIO } from '@/balancing/config/idleVillage/quests/scenarios/goblin';
import type { QuestBeat } from '@/ui/idleVillage/questS1Lab/beatSequencer';

const PRESET = GOBLIN_PRESETS[0].id;

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

describe('questBagItems — single derivation', () => {
  // INV:quest-lab-presets.INV-1
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

describe('QuestRunWindow — companion belt (R-196 → WS-4 tabbed column)', () => {
  /* bagSlots = 3: pack the full kind spread — check, action, passive. */
  const packedRun = (loadout: string[] = ['hasBonusPerc', 'hasHealing', 'hasGuardianBanner']): QuestRunState => {
    const run = createRun(PRESET, 7, 'goblin', loadout);
    expect(run.flags.length).toBeGreaterThan(0);
    return run;
  };

  /* WS-4 (artifact-r003 §2): ONE left companion column, tabbed by the header
   * pills — Party / Bag / Chronicle never paint side by side; the "right
   * column" is now the SkillCheckColumn wing. */
  it('the header pills open ONE tab at a time in the single left column', () => {
    renderWindow(packedRun());
    // closed by default
    expect(screen.queryByTestId('quest-companion-left')).toBeNull();
    fireEvent.click(screen.getByTestId('quest-party-toggle'));
    expect(within(screen.getByTestId('quest-companion-left')).getByTestId('quest-party-roster')).toBeInTheDocument();
    // switching pills swaps the tab, never stacks
    fireEvent.click(screen.getByTestId('quest-belt-toggle'));
    const left = screen.getByTestId('quest-companion-left');
    expect(within(left).getByTestId('quest-belt')).toBeInTheDocument();
    expect(within(left).queryByTestId('quest-party-roster')).toBeNull();
    fireEvent.click(screen.getByTestId('quest-log-toggle'));
    expect(within(screen.getByTestId('quest-companion-left')).getByTestId('quest-log-panel')).toBeInTheDocument();
    // no right companion column exists at all — the wing is the check's
    expect(screen.queryByTestId('quest-companion-right')).toBeNull();
  });

  it('belt items are rich rows (icon + name + effect); the passive banner is a row, never a toggle', () => {
    renderWindow(packedRun());
    fireEvent.click(screen.getByTestId('quest-belt-toggle'));
    const belt = screen.getByTestId('quest-belt');
    const rows = Array.from(belt.querySelectorAll<HTMLElement>('button[data-belt-item]'));
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.querySelector('svg')).toBeTruthy();
      expect(row.textContent).not.toBe(''); // R-244: name + effect live in the row, not only in aria-label
      expect(row).toHaveAccessibleName();
    }
    /* the effect description is rendered inline (item.descKey), not only in
     * the tooltip — en locale of the packed check item. */
    expect(belt.textContent).toContain('+15 to Perception checks');
    expect(belt.textContent).toContain('+20 HP to the most hurt member — usable before a check');
    const banner = belt.querySelector('[data-belt-item="hasGuardianBanner"]')!;
    expect(banner.tagName).not.toBe('BUTTON');
    expect(banner).not.toHaveAttribute('aria-pressed');
    expect(banner.getAttribute('data-belt-status')).toBe('passive');
    expect(banner.textContent).toContain('Guardian banner');
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
    fireEvent.click(screen.getByTestId('quest-belt-toggle'));
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
    // pills start collapsed; opening reflects aria-expanded
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });

  /* R-199 pt.1: NO Continue/skip control anywhere — the beat stage itself is
   * the advancement affordance (click / any key). */
  it('no «Skip to the frontier» or «Continue» control exists — the beat stage itself advances', () => {
    renderWindow(packedRun(), { queuedBeats: [sceneBeat('b1'), sceneBeat('b2')] });
    expect(screen.queryByText(/skip to the frontier|vai al bivio|continua|continue/i)).toBeNull();
    expect(screen.queryByTestId('quest-window-beat-continue')).toBeNull();
    // The stage is the live region — never a nested interactive control.
    const stage = screen.getByTestId('quest-window-beat');
    expect(stage.tagName).not.toBe('BUTTON');
    expect(stage).not.toHaveAttribute('role', 'button');
    expect(stage).not.toHaveAttribute('tabindex', '0');
  });
});

describe('boundary — questBag stays pure', () => {
  const SRC = path.resolve(__dirname, '../../../src');

  it('no React/DOM imports — presentation-free derivations only', () => {
    const src = readFileSync(path.join(SRC, 'ui/idleVillage/components/gameFrame/questBag.ts'), 'utf8');
    expect(/from\s+['"]react['"]/.test(src)).toBe(false);
    expect(/\b(document|window)\b/.test(src)).toBe(false);
  });
});
