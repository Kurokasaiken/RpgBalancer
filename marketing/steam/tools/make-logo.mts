/**
 * make-logo.mts — renders the "Wanderlust: Triumph" wordmark in the game's
 * own display font (Cinzel, bundled in public/fonts) onto a transparent
 * PNG at Steam's Library Logo size (1280×720).
 *
 * Typographic placeholder — the real logo should be commissioned/designed,
 * but this is honest text-on-art for Coming Soon assets.
 *
 * Usage: npx tsx marketing/steam/tools/make-logo.mts
 */

import { chromium } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const FONT = path.join(ROOT, 'public/fonts/cinzel-latin-wght-normal.woff2');
const OUT = path.join(ROOT, 'marketing/steam/assets/library-logo-1280x720.png');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.setContent(`<!DOCTYPE html><html><body style="margin:0">
<style>
  @font-face { font-family: 'Cinzel'; src: url('file://${FONT}'); font-weight: 400 900; }
  .logo {
    width: 1280px; height: 720px; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 8px;
    font-family: 'Cinzel', serif;
    color: #f0e2b6;
    text-shadow:
      0 0 22px rgba(0,0,0,.95),
      0 2px 6px rgba(0,0,0,.9),
      0 0 60px rgba(30,20,5,.6);
  }
  .wander { font-size: 118px; font-weight: 700; letter-spacing: 14px; }
  .sub { font-size: 44px; font-weight: 500; letter-spacing: 26px; color: #d9c98e; margin-left: 14px; }
  .rule { width: 560px; height: 1px; background: linear-gradient(90deg, transparent, #c9b06a, transparent); margin: 6px 0; }
</style>
<div class="logo">
  <div class="wander">WANDERLUST</div>
  <div class="rule"></div>
  <div class="sub">TRIUMPH</div>
</div></body></html>`);
await page.waitForTimeout(800); // font load
await page.screenshot({ path: OUT, omitBackground: true });
await browser.close();
console.log('logo →', OUT);
