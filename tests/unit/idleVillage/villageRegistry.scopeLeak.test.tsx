/**
 * PLAN-067 T-A10 (R-234, trap T-03) — the village registry is a LIST mounted
 * inside the village toolbar's `data-hud-controls` scope (`VillageScreenView`).
 * The control-pill rule (`.skin-scope [data-hud-controls] button`, skinScope.css)
 * reached its row buttons: 26 px fixed height, `line-height: 1`, uppercase caps
 * — each two-line row was squeezed into a pill and the description ran over the
 * next row's name (audit F5: 10 collisions, 8 truncations). Rows and section
 * headers declare their own geometry.
 */
import React from 'react';
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { VILLAGE_BUILDINGS_CONFIG } from '@/balancing/config/idleVillage/villageBuildingsConfig';
import { VillageRegistry } from '@/ui/idleVillage/components/gameFrame/VillageRegistry';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

/** The control-pill rule's real SELECTOR, lifted from skinScope.css, carrying the three
 *  properties that leaked with literal values (jsdom drops the original block: it cannot
 *  parse its `color-mix()`/`var()` declarations, so nothing would cascade). */
const SELECTOR = '.skin-scope [data-hud-controls] button:not([data-skin="cta"])';
const pillRule = (() => {
  const css = fs.readFileSync(path.resolve(__dirname, '../../../src/ui/idleVillage/skins/skinScope.css'), 'utf8');
  const start = css.indexOf(`${SELECTOR},`);
  const block = start >= 0 ? css.slice(start, css.indexOf('}', start) + 1) : '';
  if (!/height: var\(--skin-hud-control-height\)/.test(block) || !/text-transform: uppercase/.test(block) || !/line-height: 1;/.test(block)) return '';
  return `${SELECTOR} { height: 26px; line-height: 1; text-transform: uppercase; }`;
})();

describe('VillageRegistry — not a control bar (R-234, T-03)', () => {
  // INV:R-234-registry-rows-own-geometry — inside a data-hud-controls scope the registry rows and
  // section headers keep their own geometry: no fixed pill height, no line-height 1, no forced caps.
  it('rows do not inherit the control-pill height, line-height or caps', () => {
    expect(pillRule).not.toBe('');
    render(
      <>
        <style>{pillRule}</style>
        <div className="skin-scope">
          <div className="skin-scope" data-hud-controls="">
          <VillageRegistry
            open
            buildings={VILLAGE_BUILDINGS_CONFIG.buildings}
            activeId={null}
            onActiveChange={() => {}}
            onShowTooltip={() => {}}
          />
          </div>
        </div>
      </>,
    );
    const rows = [...document.querySelectorAll<HTMLButtonElement>('button[data-state]')];
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0].matches(SELECTOR)).toBe(true); // the leak path exists: the rule does reach the rows
    for (const row of rows) {
      const cs = getComputedStyle(row);
      expect(cs.height).not.toBe('26px');
      expect(cs.lineHeight).not.toBe('1');
      expect(cs.textTransform).not.toBe('uppercase');
    }
    const headers = [...document.querySelectorAll<HTMLButtonElement>('section[data-registry-section] > button[aria-expanded]')];
    expect(headers.length).toBeGreaterThan(0);
    for (const h of headers) expect(getComputedStyle(h).height).not.toBe('26px');
  });
});
