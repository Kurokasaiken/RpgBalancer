/**
 * Sentinel `geometry:fold-straddle` (run sentinel-2026-10-23T0829, S3,
 * R-270) — the registry scroll fold never cuts a row in half.
 *
 * Same defect class as PLAN-071 T-A5 (R-239): at rest, a scrollable list
 * must clip on an element boundary, never mid-row. The registry's content
 * is mixed (compact section headers + two-line rows), so the cap is the
 * largest element boundary that fits the scroller's natural height —
 * the boundary-based generalisation of the choices-list pitch cap.
 */
import React from 'react';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { render } from '@testing-library/react';
import { VILLAGE_BUILDINGS_CONFIG } from '@/balancing/config/idleVillage/villageBuildingsConfig';
import { VillageRegistry } from '@/ui/idleVillage/components/gameFrame/VillageRegistry';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

const SCROLLER_SEL = '[data-registry-scroll]';
const BOUNDARY_SEL = '[data-registry-section] > button[aria-expanded], [data-registry-row]';
const HEADER_PX = 26;
const ROW_PX = 46;
const GAP_PX = 4;
const BUDGET_PX = 150;
const CONTENT_PX = 900;

/* jsdom has no layout — emulate a scroller of CONTENT_PX content squeezed
 * into BUDGET_PX, with mixed-height boundary elements stacked GAP_PX apart
 * (offsetTop cumulative, offsetHeight by element kind). */
const boundaryHeight = (el: HTMLElement) => (el.hasAttribute('data-registry-row') ? ROW_PX : HEADER_PX);
const boundaryTop = (el: HTMLElement) => {
  const els = [...document.querySelectorAll<HTMLElement>(BOUNDARY_SEL)];
  const idx = els.indexOf(el);
  let top = 0;
  for (let i = 0; i < idx; i += 1) top += boundaryHeight(els[i]) + GAP_PX;
  return idx >= 0 ? top : 0;
};
beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'offsetTop', {
    configurable: true,
    get(this: HTMLElement) {
      return this.matches?.(BOUNDARY_SEL) ? boundaryTop(this) : 0;
    },
  });
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
    configurable: true,
    get(this: HTMLElement) {
      return this.matches?.(BOUNDARY_SEL) ? boundaryHeight(this) : 0;
    },
  });
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
    configurable: true,
    get(this: HTMLElement) {
      return this.matches?.(SCROLLER_SEL) ? BUDGET_PX : 0;
    },
  });
  Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
    configurable: true,
    get(this: HTMLElement) {
      return this.matches?.(SCROLLER_SEL) ? CONTENT_PX : 0;
    },
  });
});
afterAll(() => {
  for (const key of ['offsetTop', 'offsetHeight', 'clientHeight', 'scrollHeight']) {
    delete (HTMLElement.prototype as Record<string, unknown>)[key];
  }
});

describe('VillageRegistry — scroll fold lands on a row boundary', () => {
  // INV:village-registry.INV-1 — no boundary element straddles the scroller's
  // fold: every header/row is either fully above the cap or fully below it,
  // and the cap never exceeds the natural (flex-given) height.
  it('caps the scrollable to the largest element boundary that fits', () => {
    render(
      <VillageRegistry
        open
        buildings={VILLAGE_BUILDINGS_CONFIG.buildings}
        activeId={null}
        onActiveChange={() => {}}
        onShowTooltip={() => {}}
      />,
    );
    const scroller = document.querySelector<HTMLElement>(SCROLLER_SEL);
    expect(scroller).toBeTruthy();
    const cap = parseFloat(scroller!.style.maxHeight);
    expect(Number.isFinite(cap)).toBe(true);
    expect(cap).toBeLessThanOrEqual(BUDGET_PX);
    const els = [...document.querySelectorAll<HTMLElement>(BOUNDARY_SEL)];
    expect(els.length).toBeGreaterThan(0);
    for (const el of els) {
      const top = boundaryTop(el);
      const bottom = top + boundaryHeight(el);
      expect(bottom <= cap || top >= cap).toBe(true);
    }
    /* And the cap is not lazier than needed: at least one element must end
     * exactly at the fold. */
    expect(els.some((el) => boundaryTop(el) + boundaryHeight(el) === cap)).toBe(true);
  });
});
