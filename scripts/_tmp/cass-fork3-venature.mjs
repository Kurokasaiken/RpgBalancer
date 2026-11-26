/* Fork pozzi round-3 — Director: «C, ma le venature devono essere + visibili». 3 livelli di velo sul marmo. */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const OUT = '.mw/runs/20261125-cassetto-fork3';
mkdirSync(OUT, { recursive: true });

const WELLS = ['[data-block="party-slots"]', '[data-block="bag-slots"]', '[data-block="journey-strip"]', '[data-testid="cassetto-risk-well"]', '[data-testid="cassetto-reward-well"]'];
const RIM = 'inset 0 1px 0 rgba(255,222,140,.30), inset 0 0 0 1px rgba(46,150,108,.5), inset 0 0 24px rgba(34,140,96,.42), inset 0 -16px 34px rgba(0,0,0,.58)';

const mk = (v1, v2) => ({
  bg: [
    'radial-gradient(ellipse 120% 85% at 50% 0%, rgba(46,170,116,.30) 0%, transparent 55%)',
    'radial-gradient(ellipse 150% 130% at 50% 118%, rgba(0,0,0,.66) 0%, transparent 62%)',
    `linear-gradient(rgba(4,22,24,${v1}), rgba(2,12,16,${v2}))`,
    'url(/assets/ui/hud-real/slicekit/cassetto/ground.webp) center / cover no-repeat',
    '#04222b',
  ].join(', '),
  shadow: RIM,
});

const VARIANTS = {
  'C1-velo-medio': mk('.38', '.48'),
  'C2-velo-leggero': mk('.24', '.34'),
  'C3-velo-minimo': mk('.12', '.22'),
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
  await page.evaluate(([selectors, bg, shadow]) => {
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) { el.style.background = bg; el.style.boxShadow = shadow; }
    }
  }, [WELLS, v.bg, v.shadow]);
  await page.waitForTimeout(1100);
  const crop = await page.evaluate(() => {
    const col = document.querySelector('[data-cassetto-column]').getBoundingClientRect();
    const bag = document.querySelector('[data-block="bag-slots"]').getBoundingClientRect();
    const journey = document.querySelector('[data-block="journey-strip"]').getBoundingClientRect();
    return { x: col.x, y: bag.y - 6, w: col.width, h: (journey.y + journey.height) - bag.y + 12 };
  });
  await page.screenshot({ timeout: 120000, path: `${OUT}/${name}.png`, clip: { x: Math.max(0, crop.x), y: crop.y, width: crop.w, height: crop.h } });
  console.log(name, 'ok');
  await page.close();
}
await browser.close();
console.log('DONE');
