/**
 * Sentinel `geometry:fold-straddle` (run sentinel-2026-10-23T0829, S6,
 * R-270) — the roster list fold never cuts a resident card in half.
 *
 * The probe traced the straddling element to a `PgCard` row
 * (`div[role="button"].w-full`, resident «Lisetta 50/50 100/100») inside
 * `drag-test-container`'s scrollable list: the 184px default cap is not a
 * multiple of the 36px compact row pitch (184 % 36 = 4 — the probe saw the
 * row sticking out 32px past the fold). Same defect class as PLAN-071 T-A5
 * (R-239): the cap must be rounded DOWN to a multiple of the row pitch.
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import DragTestContainer from '@/ui/idleVillage/components/DragTestContainer';

vi.mock('@/ui/idleVillage/residentName', () => ({
  formatResidentLabel: (resident: ResidentState) => resident.name ?? resident.id,
}));
vi.mock('@/ui/idleVillage/utils/sandboxDiagnostics', () => ({
  createSandboxDiagnostics: () => ({ info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));
vi.mock('@/ui/idleVillage/components/PgCard', () => ({
  default: (props: Record<string, unknown>) => <div data-testid="pg-card-mock" />,
}));
vi.mock('@/ui/idleVillage/components/WanderlustRosterCard', () => ({
  default: (props: Record<string, unknown>) => <div data-testid="wl-card-mock" />,
}));

const resident = (id: string): ResidentState => ({
  id,
  name: id,
  type: 'artisan',
  level: 1,
  hp: 10,
  maxHp: 10,
  fatigue: 0,
  isAway: false,
  isInjured: false,
  isBusy: false,
  assignedSlot: null,
  portraitUrl: '',
  statSnapshot: { strength: 10, perception: 10, wisdom: 10, charisma: 10, rarity: 1 },
} as ResidentState);

const RESIDENTS = Array.from({ length: 9 }, (_, i) => resident(`res-${i}`));
const LIST_SEL = '[data-resident-count]';

describe('DragTestContainer — list fold lands on a row boundary', () => {
  // INV:drag-test-container.INV-1 — the scrollable cap is a whole multiple of
  // the row pitch: floor(184/36)·36 = 180 compact, floor(184/80)·80 = 160
  // horizontal — never the raw 184 that clipped the 6th compact row.
  it('caps the compact list to a multiple of the 36px pitch', () => {
    render(<DragTestContainer residents={RESIDENTS} density="compact" />);
    const list = document.querySelector<HTMLElement>(LIST_SEL);
    expect(list).toBeTruthy();
    expect(parseFloat(list!.style.maxHeight)).toBe(Math.floor(184 / 36) * 36);
  });

  it('caps the horizontal-card list to a multiple of the 80px pitch', () => {
    render(<DragTestContainer residents={RESIDENTS} layout="inline" cardVariant="horizontal" />);
    const list = document.querySelector<HTMLElement>(LIST_SEL);
    expect(list).toBeTruthy();
    expect(parseFloat(list!.style.maxHeight)).toBe(Math.floor(184 / 80) * 80);
  });
});
