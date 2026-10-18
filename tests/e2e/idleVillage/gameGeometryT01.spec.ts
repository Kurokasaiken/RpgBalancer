/**
 * gameGeometryT01.spec.ts — contratto geometrico /game classe T-01 (PLAN-044 T-004).
 *
 * Recurring trap T-01: l'isola può scivolare sotto il chrome HUD quando la
 * copertura del floor e il fit del contenuto confliggono (R-148 risolve con
 * sea margin ampi + minZoom — qui si asserisce il CONTRATTO, non la ricetta).
 *
 * Livello DOM-assertabile v1:
 *  - il canvas del mondo copre l'intero viewport (nessuna banda scoperta
 *    dove il contenuto possa nascondersi dietro il chrome);
 *  - ogni elemento di chrome HUD visibile è interamente dentro il viewport;
 *  - le ancore di chrome top-level (placca, hide-toggle, panels trigger,
 *    strip tab) non si sovrappongono fra loro.
 *
 * Rischio residuo documentato: la posizione dell'isola DENTRO il canvas è
 * pixel-level WebGL, non osservabile via bounding box DOM — quella parte del
 * contratto T-01 resta coperta da visual/canvas-level checks fuori da v1.
 *
 * Eseguito a tre viewport: il conflitto floor-coverage vs content-fit si
 * manifesta cambiando il rapporto viewport/mappa.
 */

import { test, expect } from '@playwright/test';
import {
  expectCoversViewport,
  expectDisjoint,
  expectInsideViewport,
  rectOf,
  type Rect,
} from '../../helpers/geometry';

const CANVAS = '[data-testid="pixi-world-canvas"]';
const BOOT = '[data-testid="game-boot-screen"]';

/** Ancore di chrome top-level: elementi distinti, mai annidati l'uno nell'altro. */
const CHROME_ANCHORS = [
  '[data-testid="village-plaque"]',
  '[data-testid="hud-hide-toggle"]',
  '[data-hud-panels-trigger]',
];

/** Qualunque chrome HUD, incluse le zone annidate (data-hud-controls, strip tab). */
const ALL_CHROME =
  '[data-hud-controls], [data-hud-hide-toggle], [data-hud-panels-trigger], [data-hud-strip-tab], [data-testid="village-plaque"]';

const VIEWPORTS = [
  { width: 1280, height: 720, label: 'default' },
  { width: 800, height: 600, label: 'small' },
  { width: 1920, height: 1080, label: 'large' },
];

test.describe('contratto geometrico /game — classe T-01', () => {
  for (const vp of VIEWPORTS) {
    test(`canvas copre il viewport e chrome dentro/disgiunto @${vp.label} ${vp.width}x${vp.height}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/game');
      await page.waitForSelector(CANVAS, { state: 'attached' });
      await page.waitForSelector(BOOT, { state: 'detached' });
      // un frame perché refit() sia applicato al nuovo viewport
      await page.waitForTimeout(300);

      // 1) il canvas del mondo copre l'intero viewport — nessuna banda scoperta
      const canvas = await rectOf(page.locator(CANVAS));
      expect(canvas, 'pixi-world-canvas non visibile').not.toBeNull();
      expectCoversViewport(canvas!, page, 'pixi-world-canvas');

      // 2) ogni chrome HUD visibile sta interamente dentro il viewport
      const chromeSel = page.locator(ALL_CHROME);
      const n = await chromeSel.count();
      const seen: { label: string; rect: Rect }[] = [];
      for (let i = 0; i < n; i++) {
        const loc = chromeSel.nth(i);
        const rect = await rectOf(loc);
        if (rect) {
          expectInsideViewport(rect, page, `${ALL_CHROME}[${i}]`);
          seen.push({ label: `${ALL_CHROME}[${i}]`, rect });
        }
      }
      expect(seen.length, 'nessun chrome HUD visibile — la pagina ha caricato?').toBeGreaterThan(0);

      // 3) le ancore top-level non si sovrappongono fra loro
      const anchors: { label: string; rect: Rect }[] = [];
      for (const sel of CHROME_ANCHORS) {
        const rect = await rectOf(page.locator(sel).first());
        if (rect) anchors.push({ label: sel, rect });
      }
      for (let i = 0; i < anchors.length; i++) {
        for (let j = i + 1; j < anchors.length; j++) {
          expectDisjoint(anchors[i].rect, anchors[j].rect, anchors[i].label, anchors[j].label);
        }
      }
    });
  }
});
