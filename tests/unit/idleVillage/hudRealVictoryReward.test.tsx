/**
 * R-348 — `HudRealVictoryReward`: the signed pergamena end-of-run report on
 * /game (ruling «approvato, battezza» 2026-11-16). Baptized frame + DOM zones
 * on painted affordances; same behaviour contract as `QuestRewardPopup`:
 * staged reveal hurried by click/key, Escape closes, every close path
 * convoglia su `onClose` — the settlement commit boundary (R-260).
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { applyChoice, availableOptions, createRun, type QuestRunState } from '@/ui/idleVillage/questS1Lab/questRun';
import { GOBLIN_PRESETS } from '@/ui/idleVillage/questS1Lab/questLabPresets';
import { GOBLIN_SCENARIO } from '@/balancing/config/idleVillage/quests/scenarios/goblin';
import { HudRealVictoryReward } from '@/ui/idleVillage/hudReal/HudRealVictoryReward';
import { HUD_SCROLL_BAND } from '@/balancing/config/idleVillage/hudScrollBandConfig';

const PRESET = GOBLIN_PRESETS[0].id;
const STAGE_MS = 400;

/** A real ended run: drive greedy until the engine terminates. */
const endedRun = (seed: number): QuestRunState => {
  const run = createRun(PRESET, seed, 'goblin');
  for (let step = 0; step < 80 && !run.ended; step += 1) {
    const options = availableOptions(run).filter((o) => !o.disabled);
    if (!options.length) break;
    applyChoice(run, options[0].id);
  }
  return run;
};

const renderReward = (run: QuestRunState, onClose = vi.fn()) =>
  render(<HudRealVictoryReward run={run} scenario={GOBLIN_SCENARIO} stageMs={STAGE_MS} onClose={onClose} />);

/** Hurry the reveal to the last stage (CTA unlatched). */
const revealAll = () => {
  for (let i = 0; i < 4; i += 1) act(() => vi.advanceTimersByTime(STAGE_MS + 10));
};

describe('HudRealVictoryReward — baptized pergamena report (R-348)', () => {
  // INV:hudreal-victory-reward.INV-1
  it('mounts on the baptized frame with a dialog role', () => {
    renderReward(endedRun(7));
    const root = screen.getByTestId('hudreal-victory-reward');
    expect(root.querySelector('[role="dialog"]')).not.toBeNull();
    const frame = root.querySelector('img');
    expect(frame?.getAttribute('src')).toBe('/assets/ui/hud-real/victory/frame.webp');
    // INV:R-234-report-one-title — the report says its title once.
    const titles = screen.getAllByText('Expedition report');
    expect(titles).toHaveLength(1);
  });

  // INV:hudreal-victory-reward.INV-4
  it('reveals in stages: ribbon → crew → rewards → echoes → CTA', () => {
    vi.useFakeTimers();
    try {
      const run = endedRun(7);
      renderReward(run);
      // Stage 0 — outcome ribbon only; zones still closed.
      expect(screen.queryByTestId('hudreal-victory-crew')).toBeNull();
      expect(screen.queryByTestId('quest-reward-collect')).toBeNull();
      act(() => vi.advanceTimersByTime(STAGE_MS + 10));
      expect(screen.getByTestId('hudreal-victory-crew')).toBeInTheDocument();
      act(() => vi.advanceTimersByTime(STAGE_MS + 10));
      expect(screen.getByTestId('hudreal-victory-rewards')).toBeInTheDocument();
      act(() => vi.advanceTimersByTime(STAGE_MS + 10));
      expect(screen.getByTestId('hudreal-victory-echoes')).toBeInTheDocument();
      act(() => vi.advanceTimersByTime(STAGE_MS + 10));
      expect(screen.getByTestId('quest-reward-collect')).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  // INV:hudreal-victory-reward.INV-3
  it('paints one crew row per party member with state and real data', () => {
    vi.useFakeTimers();
    try {
      const run = endedRun(7);
      renderReward(run);
      act(() => vi.advanceTimersByTime(STAGE_MS + 10));
      const crew = screen.getByTestId('hudreal-victory-crew');
      const rows = crew.querySelectorAll('[data-crew-state]');
      expect(rows.length).toBe(run.party.length);
      for (const m of run.party) {
        const row = crew.querySelector(`[data-testid="hudreal-crew-${m.id}"]`);
        expect(row).not.toBeNull();
        expect(row?.getAttribute('data-crew-state')).toBe(
          m.dead ? 'fallen' : m.wounded ? 'wounded' : 'returned',
        );
      }
    } finally {
      vi.useRealTimers();
    }
  });

  // INV:hudreal-victory-reward.INV-2
  it('every close path convoglia su onClose — CTA, Escape, X', () => {
    vi.useFakeTimers();
    try {
      const run = endedRun(7);
      const onClose = vi.fn();
      renderReward(run, onClose);
      revealAll();
      fireEvent.click(screen.getByTestId('quest-reward-collect'));
      expect(onClose).toHaveBeenCalledTimes(1);
      fireEvent.keyDown(screen.getByTestId('hudreal-victory-reward').querySelector('[role="dialog"]')!, { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(2);
      fireEvent.click(screen.getByLabelText('Close'));
      expect(onClose).toHaveBeenCalledTimes(3);
    } finally {
      vi.useRealTimers();
    }
  });

  // INV:hudreal-victory-reward.INV-5
  it('rewards paint real epilogue sections (consumed/reward/loot/xp), never placeholders', () => {
    vi.useFakeTimers();
    try {
      const run = endedRun(7);
      renderReward(run);
      revealAll();
      const rewards = screen.getByTestId('hudreal-victory-rewards');
      const text = rewards.textContent ?? '';
      expect(text.trim().length).toBeGreaterThan(0);
      expect(text).not.toMatch(/placeholder|lorem|TODO/i);
      expect(screen.getByTestId('hudreal-victory-echoes')).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  // INV:hudreal-victory-reward.INV-6
  it('mounts the shared HudScrollBand on the three scroll zones (PLAN-125 7d)', () => {
    vi.useFakeTimers();
    try {
      renderReward(endedRun(7));
      revealAll();
      const root = screen.getByTestId('hudreal-victory-reward');
      for (const id of ['hudreal-victory-crew', 'hudreal-victory-rewards', 'hudreal-victory-echoes']) {
        expect(screen.getByTestId(id).hasAttribute('data-hud-scroll-band')).toBe(true);
      }
      const bands = root.querySelectorAll('[data-hud-band]');
      expect(bands.length).toBe(3);
      for (const band of bands) {
        expect(band.getAttribute('data-variant')).toBe(HUD_SCROLL_BAND.variant);
      }
    } finally {
      vi.useRealTimers();
    }
  });

  // INV:hudreal-victory-reward.INV-7
  it('Director eye-review: no black halo, readable title, optically centered CTA, aired center copy (R-357)', () => {
    vi.useFakeTimers();
    try {
      renderReward(endedRun(7));
      revealAll();
      const root = screen.getByTestId('hudreal-victory-reward');
      const shell = root.querySelector('[role="dialog"]') as HTMLElement;
      // No near-black veil or heavy drop-shadow halo behind the parchment.
      expect(root.style.background).not.toContain('0.75');
      expect(shell.style.filter).not.toContain('0.78');
      // The webp's painted black surround is cut to real alpha — the ragged
      // silhouette is the edge; no CSS edge-feather hack must come back.
      const frameImg = root.querySelector('img[src*="victory/frame"]') as HTMLElement;
      const mask = frameImg?.style.maskImage || frameImg?.style.webkitMaskImage || '';
      expect(mask).not.toContain('linear-gradient');
      // The report is exempt from the skin base-button specular streak, which
      // otherwise resolves against the positioned scroller = stray light rect.
      expect(shell.hasAttribute('data-victory-report')).toBe(true);
      // Title must be a light ink on the dark painted cartouche (was #16241f).
      const title = screen.getByText('Expedition report') as HTMLElement;
      const rgb = title.style.color.match(/\d+/g)?.map(Number) ?? [0, 0, 0];
      expect((rgb[0] + rgb[1] + rgb[2]) / 3).toBeGreaterThan(150);
      // CTA copy carries the optical lift so it sits on the plaque's visual center.
      const cta = screen.getByTestId('quest-reward-collect');
      const lifted = cta.querySelector('span');
      expect(lifted?.style.transform).toContain('translateY(-');
      // Center copy breathes: a real gap between column labels and row zones.
      const pctOf = (v: string) => parseFloat(v);
      const crewLabel = screen.getByText(/who came back/i).closest('span') as HTMLElement;
      const crewRows = screen.getByTestId('hudreal-victory-crew');
      const gap = pctOf(crewRows.style.top) - (pctOf(crewLabel.style.top) + pctOf(crewLabel.style.height));
      expect(gap).toBeGreaterThanOrEqual(1);
    } finally {
      vi.useRealTimers();
    }
  });

  // INV:hudreal-victory-reward.INV-8
  it('anchor portrait sits inside the painted ring holder as a disc (R-357)', () => {
    vi.useFakeTimers();
    try {
      renderReward(endedRun(7));
      act(() => vi.advanceTimersByTime(STAGE_MS + 10));
      const medal = screen.getByTestId('hudreal-victory-medal');
      // The zone hugs the painted ring (~140 art-px ≈ 13.7% of the 1024 art
      // width) — not the old 156px+ oversized mount.
      expect(parseFloat(medal.style.width)).toBeLessThanOrEqual(14);
      // Portrait is a disc inside the holder — not the ornate C1 ring asset.
      const disc = medal.querySelector('img') as HTMLImageElement | null;
      expect(disc).not.toBeNull();
      expect(disc?.style.borderRadius).toBe('50%');
      expect(disc?.getAttribute('src') ?? '').not.toContain('C1/ring.webp');
    } finally {
      vi.useRealTimers();
    }
  });
});
