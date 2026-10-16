/**
 * R-199 pt.9/10 — the quest window exposes a per-check presentation panel
 * (skip the whole cinematic / skip only the intro) and docks the frozen
 * `DestinyAstrolabeV62` over the theatre on check beats. The engine stays
 * authoritative: the astrolabe only PAINTS the committed verdict — the test
 * stubs the frozen kit and verifies the wiring, not its internals.
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { applyChoice, availableOptions, createRun, type QuestRunState, type ResolvedCheck } from '@/ui/idleVillage/questS1Lab/questRun';
import { GOBLIN_PRESETS } from '@/ui/idleVillage/questS1Lab/questLabPresets';
import { GOBLIN_SCENARIO } from '@/balancing/config/idleVillage/quests/scenarios/goblin';
import { emptyPhase } from '@/ui/idleVillage/questS1Lab/questPhaseRecord';
import type { CheckBeat, QuestBeat } from '@/ui/idleVillage/questS1Lab/beatSequencer';
import { QuestRunWindow } from '@/ui/idleVillage/components/gameFrame/QuestRunWindow';
import { QuestCheckOptionsPanel } from '@/ui/idleVillage/components/gameFrame/QuestCheckOptionsPanel';

/* Stub the frozen kit: jsdom has no canvas, and the contract under test is
 * the WINDOW's wiring — the imperative handle (`throw`/`skipToResult`), the
 * forced-mode config and the resolve→dwell→advance handoff. */
const astroThrow = vi.fn();
const astroSkip = vi.fn();
vi.mock('@/ui/idleVillage/frozen/kits/destinyAstrolabeV62Kit', () => ({
  DestinyAstrolabeV62Standalone: React.forwardRef(function AstroStub(
    props: { config?: { mode?: string; harm?: string }; onResolve?: () => void },
    ref: React.Ref<unknown>,
  ) {
    React.useImperativeHandle(ref, () => ({
      throw: astroThrow,
      skipToResult: () => {
        astroSkip();
        props.onResolve?.();
      },
      roll: vi.fn(),
    }));
    return (
      <div data-testid="astro-stub" data-mode={props.config?.mode}>
        <button type="button" data-testid="astro-resolve" onClick={() => props.onResolve?.()} />
      </div>
    );
  }),
}));

const PRESET = GOBLIN_PRESETS[0].id;
const TIMING = { sceneMs: 1600, checkMs: 1800, harmMs: 1200, endMs: 1600, recapMs: 1800, checkHoldMs: 60000, checkVerdictMs: 100 };

/** A run with one resolved check in the queue — the authored way (R-106). */
const runWithCheck = (seed = 42): { run: QuestRunState; check: ResolvedCheck } => {
  const run = createRun(PRESET, seed, 'goblin');
  applyChoice(run, availableOptions(run)[0].id); // depart → F1 exploration
  applyChoice(run, 'gob-cerca-tracce', { useConsumable: false });
  const check = run.checkQueue[0];
  expect(check).toBeTruthy();
  return { run, check };
};

const renderWindow = (run: QuestRunState, queuedBeats: QuestBeat[] = []) =>
  render(
    <Tooltip.Provider>
      <QuestRunWindow
        run={run}
        phases={[emptyPhase(0)]}
        beats={GOBLIN_SCENARIO.beats}
        queuedBeats={queuedBeats}
        beatTiming={TIMING}
        title={GOBLIN_SCENARIO.title}
        flavour={GOBLIN_SCENARIO.flavour}
        artFor={() => undefined}
        time={{ progress: 0, label: 'Giorno 1 di 5' }}
        onChoose={() => undefined}
        onClose={() => undefined}
        anchor={{ left: 0, top: 0 }}
        widthPx={820}
        theaterAspect={2.4}
        tooltipLines={6}
      />
    </Tooltip.Provider>,
  );

describe('QuestCheckOptionsPanel — the popover itself', () => {
  it('renders both options as aria-pressed rows and honours the config gates', () => {
    const onToggle = vi.fn();
    const onClose = vi.fn();
    render(
      <QuestCheckOptionsPanel
        panelId="p1"
        options={{ skipIntro: true, skipCheck: false }}
        allowSkipIntro
        allowSkipCheck={false}
        onToggle={onToggle}
        onClose={onClose}
      />,
    );
    const intro = screen.getByTestId('quest-check-opt-skip-intro');
    const whole = screen.getByTestId('quest-check-opt-skip-check');
    expect(intro).toHaveAttribute('aria-pressed', 'true');
    expect(whole).toHaveAttribute('aria-pressed', 'false');
    expect(whole).toBeDisabled(); // allowSkipCheck=false → disabled, not hidden
    fireEvent.click(intro);
    expect(onToggle).toHaveBeenCalledWith('skipIntro');
    fireEvent.keyDown(screen.getByTestId('quest-check-options'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('QuestRunWindow — check options + docked astrolabe (R-199 pt.9/10)', () => {
  it('a check beat docks the astrolabe over the theatre, fed the engine verdict', () => {
    const { run, check } = runWithCheck();
    const beat: CheckBeat = { id: check.id, kind: 'check', check };
    renderWindow(run, [beat]);
    expect(screen.getByTestId('quest-check-astrolabe')).toBeInTheDocument();
    const stub = screen.getByTestId('astro-stub');
    // The engine's verdict/harm drives the painted mode — the astrolabe never rolls.
    expect(stub.dataset.mode).toBe(check.harm === 'death' && check.verdict === 'fail' ? 'fail_dead' : check.harm === 'wound' && check.verdict === 'fail' ? 'fail_wound' : check.verdict);
  });

  it('«skip the whole check» undocks the astrolabe — the verdict beat still presents', () => {
    const { run, check } = runWithCheck();
    const beat: CheckBeat = { id: check.id, kind: 'check', check };
    renderWindow(run, [beat]);
    fireEvent.click(screen.getByTestId('quest-check-options-toggle'));
    fireEvent.click(screen.getByTestId('quest-check-opt-skip-check'));
    expect(screen.queryByTestId('quest-check-astrolabe')).toBeNull();
    // The authored verdict line still lands — presentation, not outcome, was skipped.
    if (check.flavor) expect(screen.getByText(check.flavor)).toBeInTheDocument();
  });

  it('«skip intro» calls the astrolabe throw() — spin and verdict are kept', () => {
    vi.useFakeTimers();
    try {
      const { run, check } = runWithCheck();
      const beat: CheckBeat = { id: check.id, kind: 'check', check };
      renderWindow(run, [beat]);
      fireEvent.click(screen.getByTestId('quest-check-options-toggle'));
      astroThrow.mockClear();
      fireEvent.click(screen.getByTestId('quest-check-opt-skip-intro'));
      act(() => vi.advanceTimersByTime(0)); // the window's 0ms warmup fires
      expect(astroThrow).toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('clicking the theatre while the astrolabe spins routes through skipToResult, then dwells and advances', () => {
    vi.useFakeTimers();
    try {
      const { run, check } = runWithCheck();
      const beat: CheckBeat = { id: check.id, kind: 'check', check };
      const after: QuestBeat = { id: 'scene-after', kind: 'scene', nodeId: run.nodeId, title: 'After' };
      renderWindow(run, [beat, after]);
      astroSkip.mockClear();
      // The dock is over the theatre — a plain click settles the verdict.
      fireEvent.click(screen.getByTestId('astro-stub'));
      expect(astroSkip).toHaveBeenCalledTimes(1);
      // Resolve happened via the stub's skipToResult → dwell → next beat.
      act(() => vi.advanceTimersByTime(TIMING.checkVerdictMs + 50));
      expect(screen.getByText('After')).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});
