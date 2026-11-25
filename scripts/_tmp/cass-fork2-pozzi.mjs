/* Fork pozzi round-2 (2026-11-25 sera) — Director: «i pozzetti cn quei frame sn ancora un po' debolucci».
 * Varianti più forti della ricetta C attuale. Solo preview in-page, nessuna modifica al codice. */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const OUT = '.mw/runs/20261125-cassetto-fork2';
mkdirSync(OUT, { recursive: true });

const WELLS = ['[data-block="party-slots"]', '[data-block="bag-slots"]', '[data-block="journey-strip"]', '[data-testid="cassetto-risk-well"]', '[data-testid="cassetto-reward-well"]'];

const RIM = 'inset 0 1px 0 rgba(255,222,140,.30), inset 0 0 0 1px rgba(46,150,108,.5), inset 0 0 24px rgba(34,140,96,.42), inset 0 -16px 34px rgba(0,0,0,.58)';

const VARIANTS = {
  'A-attuale': null,
  'B-velluto-imperiale': {
    bg: [
      'radial-gradient(ellipse 120% 85% at 50% 0%, rgba(46,170,116,.46) 0%, transparent 55%)',
      'radial-gradient(ellipse 150% 130% at 50% 118%, rgba(0,0,0,.72) 0%, transparent 62%)',
      'linear-gradient(180deg, #053332 0%, #011820 48%, #043c31 100%)',
    ].join(', '),
    shadow: RIM,
  },
  'C-marmo-vellutato': {
    bg: [
      'radial-gradient(ellipse 120% 85% at 50% 0%, rgba(46,170,116,.30) 0%, transparent 55%)',
      'radial-gradient(ellipse 150% 130% at 50% 118%, rgba(0,0,0,.66) 0%, transparent 62%)',
      'linear-gradient(rgba(4,22,24,.52), rgba(2,12,16,.60))',
      'url(/assets/ui/hud-real/slicekit/cassetto/ground.webp) center / cover no-repeat',
      '#04222b',
    ].join(', '),
    shadow: RIM,
  },
  'D-notturno-damascato': {
    bg: [
      'repeating-linear-gradient(45deg, rgba(52,180,124,.07) 0 5px, transparent 5px 11px)',
      'repeating-linear-gradient(-45deg, rgba(52,180,124,.07) 0 5px, transparent 5px 11px)',
      'radial-gradient(ellipse 120% 85% at 50% 0%, rgba(46,170,116,.40) 0%, transparent 55%)',
      'radial-gradient(ellipse 150% 130% at 50% 118%, rgba(0,0,0,.70) 0%, transparent 62%)',
      'linear-gradient(180deg, #053332 0%, #011820 48%, #043c31 100%)',
    ].join(', '),
    shadow: RIM,
  },
};

const boot = async (browser) => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.setDefaultTimeout(120000);
  await page.goto('http://localhost:5173/hud-compose?comp=cassetto&poi=poi-goblin&risk=3&pcts=28,74', { waitUntil: 'domcontentloaded', timeout: 120000 });
  const exp = await page.waitForSelector('[data-testid="expedition-drawer-expand"]', { timeout: 30000 }).catch(() => null);
  if (exp) await exp.click();
  await page.waitForSelector('[data-cassetto-column]', { state: 'attached' });
  await page.waitForTimeout(2500);
  return page;
};

const browser = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader'] });
for (const [name, v] of Object.entries(VARIANTS)) {
  const page = await boot(browser);
  if (v) {
    await page.evaluate(([selectors, bg, shadow]) => {
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el) { el.style.background = bg; el.style.boxShadow = shadow; }
      }
    }, [WELLS, v.bg, v.shadow]);
    await page.waitForTimeout(1000);
  }
  const crop = await page.evaluate(() => {
    const col = document.querySelector('[data-cassetto-column]').getBoundingClientRect();
    const party = document.querySelector('[data-block="party-slots"]').getBoundingClientRect();
    const risk = document.querySelector('[data-block="risk-rewards"]').getBoundingClientRect();
    return { x: col.x, y: party.y - 8, w: col.width, h: (risk.y + risk.height) - party.y + 16 };
  });
  await page.screenshot({ timeout: 120000, path: `${OUT}/pozzi-${name}.png`, clip: { x: Math.max(0, crop.x), y: crop.y, width: crop.w, height: crop.h } });
  console.log('pozzi', name, 'ok');
  await page.close();
}
await browser.close();
console.log('DONE');
