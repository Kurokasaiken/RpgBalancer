/**
 * cinemaFx — PLAN-025 T-009: the configured beat→fx mapping, letterbox on
 * tone-changing beats only, typewriter reveal under fake timers, and I-5:
 * reduced motion renders no effect at all.
 */
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import {
  EdgeFlash,
  Letterbox,
  TypewriterText,
  fxForBeat,
} from '@/ui/idleVillage/skins/primitives';
import { DEFAULT_QUEST_THEATRE_FX, QuestTheatreFxSchema } from '@/balancing/config/idleVillage/quests/questTheatreFx';
import type { QuestBeat } from '@/ui/idleVillage/questS1Lab/beatSequencer';
import type { ResolvedCheck } from '@/ui/idleVillage/questS1Lab/questRun';

const FX = DEFAULT_QUEST_THEATRE_FX;

const scene = (nodeKind: 'choice' | 'harm' | 'combat' | 'info'): QuestBeat => ({
  id: 'scene-1',
  kind: 'scene',
  nodeId: 'n',
  title: 'Scena',
  body: 'Il bosco tace.',
  nodeKind,
});

const check = (verdict: ResolvedCheck['verdict'], kills?: number): QuestBeat => ({
  id: 'chk-1',
  kind: 'check',
  check: {
    id: 'chk-1',
    title: 'Prova',
    verdict,
    score: 50,
    rollPct: 30,
    harm: 'none',
    woundPct: 10,
    deathPct: 2,
    harms: [],
    harmLines: [],
    authoredText: '',
    exposure: {},
    kills,
  } as ResolvedCheck,
});

const harm = (kind: 'harm' | 'wound' | 'death'): QuestBeat => ({
  id: 'harm-1',
  kind: 'harm',
  harm: { seq: 1, memberId: 'm1', amount: 10, kind, hpBefore: 30, hpAfter: 20 },
  memberName: 'Bruna',
  line: 'Bruna è ferita.',
});

describe('fxForBeat — the configured beat→fx mapping', () => {
  it('letterbox only on tone changes: harm/combat scenes, combat turns, deaths, end', () => {
    expect(fxForBeat(scene('harm'), FX).letterbox).toBe(true);
    expect(fxForBeat(scene('combat'), FX).letterbox).toBe(true);
    expect(fxForBeat(scene('choice'), FX).letterbox).toBe(false);
    expect(fxForBeat(scene('info'), FX).letterbox).toBe(false);
    expect(fxForBeat(check('fail', 3), FX).letterbox).toBe(true); // combat turn
    expect(fxForBeat(check('fail'), FX).letterbox).toBe(false); // non-combat check
    expect(fxForBeat(harm('death'), FX).letterbox).toBe(true);
    expect(fxForBeat(harm('wound'), FX).letterbox).toBe(false);
    expect(fxForBeat({ id: 'end', kind: 'end', outcome: 'wipe', text: '' }, FX).letterbox).toBe(true);
    expect(fxForBeat({ id: 'recap', kind: 'recap', scenes: 1, checks: 1, deaths: 0, wounds: 0 }, FX).letterbox).toBe(false);
  });

  it('check beats flash the configured verdict tone', () => {
    expect(fxForBeat(check('bigwin'), FX).flashTone).toBe('ok');
    expect(fxForBeat(check('fail'), FX).flashTone).toBe('danger');
    expect(fxForBeat(check('epicfail'), FX).flashTone).toBe('death');
    expect(fxForBeat(harm('death'), FX).flashTone).toBeNull();
    expect(fxForBeat(scene('harm'), FX).flashTone).toBeNull();
  });

  it('typewriter only where config earns it (scene body on, flavor off)', () => {
    expect(fxForBeat(scene('info'), FX).typewriter).toBe('body');
    expect(fxForBeat(check('win'), FX).typewriter).toBeNull();
  });

  it('a config override can silence a whole fx channel', () => {
    const muted = QuestTheatreFxSchema.parse({ letterbox: { enabled: false } });
    expect(fxForBeat(scene('harm'), muted).letterbox).toBe(false);
    expect(fxForBeat(harm('death'), muted).letterbox).toBe(false);
  });
});

describe('Letterbox — bars over the theater', () => {
  it('renders two bars, open when active', () => {
    const { container } = render(<Letterbox active heightPct={12} inMs={400} outMs={350} color="black" />);
    const bars = container.querySelectorAll('[aria-hidden] > div');
    expect(bars).toHaveLength(2);
    expect((bars[0] as HTMLElement).style.transform).toBe('translateY(0)');
  });

  it('bars sit off-screen when inactive', () => {
    const { container } = render(<Letterbox active={false} heightPct={12} inMs={400} outMs={350} color="black" />);
    const bars = container.querySelectorAll('[aria-hidden] > div');
    expect((bars[0] as HTMLElement).style.transform).toBe('translateY(-101%)');
    expect((bars[1] as HTMLElement).style.transform).toBe('translateY(101%)');
  });

  it('reduced motion renders nothing at all (I-5)', () => {
    const { container } = render(
      <Letterbox active heightPct={12} inMs={400} outMs={350} color="black" reducedMotion />,
    );
    expect(container.firstChild).toBeNull();
  });
});

describe('EdgeFlash — one-shot verdict flash', () => {
  it('renders the flash layer keyed per beat; reduced motion → nothing', () => {
    const { container } = render(<EdgeFlash flashKey="chk-1" color="red" durationMs={400} />);
    expect(container.firstChild).not.toBeNull();
    const reduced = render(<EdgeFlash flashKey="chk-1" color="red" durationMs={400} reducedMotion />);
    expect(reduced.container.firstChild).toBeNull();
  });
});

describe('TypewriterText — char-by-char reveal', () => {
  it('reveals progressively under fake timers', () => {
    vi.useFakeTimers();
    try {
      const { container } = render(<TypewriterText text="Il bosco tace" charsPerSecond={100} />);
      expect(container.textContent).toBe('');
      act(() => vi.advanceTimersByTime(2000));
      expect(screen.getByText('Il bosco tace')).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('reduced motion shows the full text immediately', () => {
    render(<TypewriterText text="Il bosco tace" charsPerSecond={100} reducedMotion />);
    expect(screen.getByText('Il bosco tace')).toBeInTheDocument();
  });
});
