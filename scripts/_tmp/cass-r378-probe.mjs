/* R-378 headless witness: after-shots + geometry deltas + jewel anim check. */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const OUT = '.mw/runs/20261124-cassetto-r378';
mkdirSync(OUT, { recursive: true });

const URL = 'http://localhost:5173/hud-compose?comp=cassetto&poi=poi-goblin&risk=3&pcts=28,74&reward=4';
const browser = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
await page.waitForSelector('[data-cassetto-column]', { timeout: 120000 });
await page.waitForTimeout(1200);

const r = (el) => { const b = el.getBoundingClientRect(); return { x: +b.x.toFixed(1), y: +b.y.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1) }; };
const geo = await page.evaluate(() => {
  const r = (el) => { const b = el.getBoundingClientRect(); return { x: +b.x.toFixed(1), y: +b.y.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1) }; };
  const q = (s) => document.querySelector(s);
  const col = q('[data-cassetto-column]');
  const cta = q('[data-testid="cassetto-confirm"]');
  const rack = q('[data-testid="resident-slot-rack"]');
  const seats = rack ? [...rack.children].map(r) : [];
  const bands = [...document.querySelectorAll('[data-hud-band-x]')].map((b) => r(b));
  const cart = q('[data-cassetto-cartouche]');
  const rewardWell = q('[data-testid="cassetto-reward-well"]');
  const chests = rewardWell ? [...rewardWell.querySelectorAll('[data-chest]')].length : -1;
  const jewels = [...document.querySelectorAll('.cta-jewel')];
  const jewelAnim = jewels.length ? getComputedStyle(jewels[0]).animationName : null;
  const ctaDisabled = cta ? cta.disabled : null;
  return {
    col: col ? r(col) : null, cta: cta ? r(cta) : null, ctaDisabled,
    seats, seatCount: seats.length, seatW: seats[0]?.w ?? null,
    bands, chestsInRewardWell: chests,
    jewels: jewels.length, jewelAnim,
    cart: cart ? { ...r(cart), childCount: cart.children.length } : null,
    wells: ['party-slots', 'bag-slots', 'journey-strip'].map((b) => ({ b, rect: q(`[data-block="${b}"]`) ? r(q(`[data-block="${b}"]`)) : null })),
    journeyIcons: [...document.querySelectorAll('[data-cassetto-journey-art] ~ * svg, [data-block="journey-strip"] svg')].map((s) => r(s)),
  };
});

await page.screenshot({ animations: 'disabled', timeout: 60000, path: `${OUT}/r378-1440x900.png` });
const clip = (x, y, w, h) => ({ x: Math.max(0, x), y: Math.max(0, y), width: w, height: h });
const col = geo.col;
if (col) {
  const party = geo.wells[0].rect;
  if (party) await page.screenshot({ animations: 'disabled', path: `${OUT}/r378-party.png`, clip: clip(party.x - 8, party.y - 8, party.w + 16, party.h + 16) });
  if (geo.cta) await page.screenshot({ animations: 'disabled', path: `${OUT}/r378-cta.png`, clip: clip(col.x, geo.cta.y - 40, col.w, geo.cta.h + 60) });
  if (geo.cart) await page.screenshot({ animations: 'disabled', path: `${OUT}/r378-title.png`, clip: clip(geo.cart.x - 10, geo.cart.y - 30, geo.cart.w + 20, geo.cart.h + 40) });
  const jr = geo.wells[2].rect;
  if (jr) await page.screenshot({ animations: 'disabled', path: `${OUT}/r378-journey.png`, clip: clip(jr.x - 8, jr.y - 8, jr.w + 16, jr.h + 16) });
  const bag = geo.wells[1].rect;
  if (bag) await page.screenshot({ animations: 'disabled', path: `${OUT}/r378-bag.png`, clip: clip(bag.x - 8, bag.y - 8, bag.w + 16, bag.h + 16) });
}
const riskWell = await page.$('[data-testid="cassetto-risk-well"]');
const rw = riskWell ? await riskWell.boundingBox() : null;
const rewEl = await page.$('[data-testid="cassetto-reward-well"]');
const rewB = rewEl ? await rewEl.boundingBox() : null;
if (rw && rewB) {
  const c = clip(rw.x - 8, rw.y - 8, rw.width + rewB.width + 30, rw.height + 16);
  console.log('wells clip:', JSON.stringify(c), 'rw:', JSON.stringify(rw), 'rew:', JSON.stringify(rewB));
  try { await page.screenshot({ animations: 'disabled', path: `${OUT}/r378-wells.png`, clip: c }); } catch (e) { console.log('wells shot failed:', e.message.split('\n')[0]); }
}
// CTA jewel pulse mid-frame (animations running)
try { await page.screenshot({ timeout: 60000, path: `${OUT}/r378-cta-live.png`, clip: col ? clip(col.x, geo.cta.y - 40, col.w, geo.cta.h + 60) : undefined }); } catch (e) { console.log('cta-live failed:', e.message.split('\n')[0]); }
console.log(JSON.stringify(geo, null, 1));
console.log('pageErrors:', errors.length ? errors : 'none');
await page.close();

/* Pass 2: cansend=1 — plaque lit, jewels pulsing. Three timed CTA shots to catch pulse phases. */
const page2 = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page2.goto(URL + '&cansend=1', { waitUntil: 'domcontentloaded', timeout: 90000 });
await page2.waitForSelector('[data-cassetto-column]', { timeout: 120000 });
await page2.waitForTimeout(400);
const lit = await page2.evaluate(() => {
  const q = (s) => document.querySelector(s);
  const cta = q('[data-testid="cassetto-confirm"]');
  const jewels = [...document.querySelectorAll('.cta-jewel')];
  return {
    ctaDisabled: cta ? cta.disabled : null,
    jewels: jewels.length,
    anim: jewels.length ? getComputedStyle(jewels[0]).animationName : null,
  };
});
console.log('LIT:', JSON.stringify(lit));
const ctaEl = await page2.$('[data-testid="cassetto-confirm"]');
const cb = ctaEl ? await ctaEl.boundingBox() : null;
const colEl = await page2.$('[data-cassetto-column]');
const colb = colEl ? await colEl.boundingBox() : null;
if (cb && colb) {
  for (const [tag, ms] of [['t0', 0], ['t400', 400], ['t800', 400]]) {
    if (ms) await page2.waitForTimeout(ms);
    await page2.screenshot({ path: `${OUT}/r378-cta-lit-${tag}.png`, clip: clip(colb.x, cb.y - 40, colb.width, cb.height + 60) });
  }
}
await browser.close();
