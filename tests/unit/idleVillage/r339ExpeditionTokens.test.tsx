/**
 * R-339 / PLAN-119 T1 — the expedition surface tokens (artifact-r004 T1).
 *
 * The mockup's numeric/skin contract is declared once in the Zod
 * `cassettoLayoutSchema` and every painted value traces to the skin
 * registry (`BASE_SKIN_CSS_VARS`): drawer clamp, rail width + medallion
 * bottom inset, mobile sheet detents, bar colors, CTA enabled/muted, and
 * the reserved top-right Chronicle zone. These tests pin the declaration
 * (strict schema, exact numbers) and the traceability chain
 * config → `var(--skin-*)` → registry — the AC8 "no ad-hoc CSS" gate.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  CASSETTO_LAYOUT_CONFIG,
  cassettoLayoutSchema,
} from '@/balancing/config/idleVillage/cassettoLayoutConfig';
import { BASE_SKIN_CSS_VARS } from '@/ui/idleVillage/skins/skinCssVariables';
import {
  cassettoColumnSpec,
  cassettoColumnWidthFor,
  cassettoColumnHeightFor,
} from '@/ui/idleVillage/hudReal/layout/cassettoColumn';
import type { CassettoQuest } from '@/ui/idleVillage/hudReal/HudRealCassetto';
import { HudRealCassetto } from '@/ui/idleVillage/hudReal/HudRealCassetto';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts ? `${key}:${Object.values(opts).join('|')}` : key,
  }),
}));

vi.mock('@/ui/idleVillage/components/ResidentSlotRack', () => ({
  ResidentSlotRack: () => <div data-testid="resident-slot-rack-stub" />,
}));

const QUEST: CassettoQuest = {
  title: 'Goblin Extermination',
  subtitle: 'Pianifica la spedizione',
  briefing: 'briefing',
  legs: [{ label: 'Outbound', days: 3 }],
  riskLabel: 'High',
  rewards: [{ icon: 'gold', qty: '60' }],
};

const renderCassetto = (props: Partial<Parameters<typeof HudRealCassetto>[0]> = {}) =>
  render(
    <div style={{ position: 'relative', width: 420, height: 900 }}>
      <HudRealCassetto quest={QUEST} slots={[]} {...props} />
    </div>,
  );

/** Every `--skin-*` custom property referenced by a `var(...)` string. */
const skinRefsOf = (value: string): string[] =>
  [...value.matchAll(/var\(\s*(--skin-[a-z0-9-]+)\s*\)/g)].map((m) => m[1]);

describe('R-339/T1 — the layout contract is declared once, strict and complete', () => {
  // INV:expedition-layout-tokens.INV-1
  it('the schema parses the shipped config and rejects unknown keys', () => {
    expect(cassettoLayoutSchema.safeParse(CASSETTO_LAYOUT_CONFIG).success).toBe(true);
    expect(
      cassettoLayoutSchema.safeParse({ ...CASSETTO_LAYOUT_CONFIG, bogus: 1 }).success,
    ).toBe(false);
  });

  // INV:expedition-layout-tokens.INV-1
  it('pins the T1 numbers: drawer clamp, rail, sheet detents, topChrome reserve', () => {
    const c = CASSETTO_LAYOUT_CONFIG;
    /* D4 — clamp(360px, 23vw, 460px): the bound that caps the baked column;
     *  + T2 chipWidthPx (the collapsed edge chip's published width). */
    expect(c.drawer).toEqual({ widthMinPx: 360, widthVwFraction: 0.23, widthMaxPx: 460, chipWidthPx: 40 });
    /* T5 — persistent left column + D8 medallion inset + mutex band. */
    expect(c.rail.widthPx).toBe(320);
    expect(c.rail.chipWidthPx).toBe(40);
    expect(c.rail.mutualExclusionBelowPx).toBe(1100);
    expect(c.rail.bottomInsetPx).toBeGreaterThan(0);
    /* T8 — non-modal sheet detents (peek / half / full). */
    expect(c.bottomSheet.peekPx).toBe(56);
    expect(c.bottomSheet.halfFraction).toBe(0.5);
    expect(c.bottomSheet.fullFraction).toBeLessThanOrEqual(1);
    /* T6/D10 — the top-right zone reserved for the future Chronicle. */
    expect(c.topChrome.chronicleReservePx).toBeGreaterThan(0);
    expect(c.topChrome.minFitScale).toBeGreaterThan(0);
    /* T1 — the enabled/muted CTA contract exists and names skin tokens. */
    expect(Object.keys(c.cta.vars).length).toBeGreaterThanOrEqual(8);
  });
});

describe('R-339/T1 — the baked column keeps the clamp as a cap, never a stretch', () => {
  const spec = cassettoColumnSpec(1440);

  // INV:expedition-layout-tokens.INV-2
  it('width = aspect × viewportH below the cap; widthMaxPx above', () => {
    const lowH = 800;
    expect(cassettoColumnWidthFor(spec, lowH)).toBeCloseTo(spec.aspect * lowH, 6);
    const highH = 2000; // aspect × 2000 far beyond the 460px cap
    expect(cassettoColumnWidthFor(spec, highH)).toBe(CASSETTO_LAYOUT_CONFIG.drawer.widthMaxPx);
    expect(cassettoColumnHeightFor(spec, highH)).toBeLessThan(highH);
  });
});

describe('R-339/T1 — every painted CTA/bar color traces config → skin registry (AC8)', () => {
  // INV:expedition-layout-tokens.INV-3
  it('rail.bars fills and cta.vars all name var(--skin-*) tokens present in BASE_SKIN_CSS_VARS', () => {
    const refs = new Set<string>();
    for (const bar of CASSETTO_LAYOUT_CONFIG.rail.bars) {
      for (const stop of bar.fill) for (const ref of skinRefsOf(stop)) refs.add(ref);
    }
    for (const v of Object.values(CASSETTO_LAYOUT_CONFIG.cta.vars)) {
      for (const ref of skinRefsOf(v)) refs.add(ref);
    }
    /* The contract must actually reference tokens — a config that named
     * nothing would pass the loop vacuously. */
    expect(refs.size).toBeGreaterThanOrEqual(12);
    for (const ref of refs) {
      expect(BASE_SKIN_CSS_VARS[ref as keyof typeof BASE_SKIN_CSS_VARS]).toBeTruthy();
    }
  });

  // INV:expedition-layout-tokens.INV-3
  it('the CONFIRM scoped rules contain only var() tokens — no literal colors', () => {
    const { container } = renderCassetto();
    const style = container.querySelector('[data-hudreal-cassetto] style');
    expect(style?.textContent).toContain('var(--skin-cassetto-cta-');
    const confirmRules = (style?.textContent ?? '')
      .split('}')
      .filter((rule) => rule.includes('cassetto-confirm'));
    expect(confirmRules.length).toBeGreaterThan(0);
    for (const rule of confirmRules) {
      expect(rule).not.toMatch(/rgba?\(/);
      expect(rule).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    }
  });

  // INV:expedition-layout-tokens.INV-3
  it('the muted CONFIRM dims via the muted-opacity token and the label reads the text tokens', () => {
    const { container } = renderCassetto({ canSend: false, disabledReason: 'Party incomplete' });
    const confirm = screen.getByTestId('cassetto-confirm');
    expect(confirm).toBeDisabled();
    /* The state look lives in the scoped sheet (the :disabled rule + the
     * .confirm-text color/shadow) — asserted on the raw CSS text because
     * jsdom's CSSOM does not evaluate var() in inline styles. */
    const css = container.querySelector('[data-hudreal-cassetto] style')?.textContent ?? '';
    expect(css).toMatch(
      /\[data-testid="cassetto-confirm"\]:disabled\s*\{\s*opacity:\s*var\(--skin-cassetto-cta-muted-opacity\)/,
    );
    expect(css).toMatch(/\.confirm-text\s*\{[^}]*color:\s*var\(--skin-cassetto-cta-text\)/);
    expect(css).toMatch(/\.confirm-text\s*\{[^}]*text-shadow:\s*var\(--skin-cassetto-cta-text-shadow\)/);
  });
});
