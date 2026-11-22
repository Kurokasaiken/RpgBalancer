/* R-374 V2 headless witness: geometry + screenshots at 1440×900 and 1280×800. */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const OUT = '.mw/runs/20261122-cassetto-v3-ob7';
mkdirSync(OUT, { recursive: true });

const URL = 'http://localhost:5173/hud-compose?comp=cassetto&poi=poi-goblin&risk=3&pcts=28,74&reward=4';
const sizes = [[1440, 900], [1280, 800]];

const browser = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader'] });
for (const [w, h] of sizes) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForSelector('[data-cassetto-column]', { timeout: 120000 });
  await page.waitForTimeout(1200);
  const geo = await page.evaluate(() => {
    const r = (el) => { const b = el.getBoundingClientRect(); return { x: +b.x.toFixed(1), y: +b.y.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1), cx: +(b.x + b.width / 2).toFixed(1) }; };
    const col = document.querySelector('[data-cassetto-column]');
    const cta = document.querySelector('[data-testid="cassetto-confirm"]');
    const q = (sel) => document.querySelector(sel);
    const wells = ['party-slots', 'bag-slots', 'journey-strip'].map((b) => ({ b, rect: q(`[data-block="${b}"]`) ? r(q(`[data-block="${b}"]`)) : null }));
    const riskWell = q('[data-testid="cassetto-risk-well"]');
    const rewardWell = q('[data-testid="cassetto-reward-well"]');
    const scroller = q('[data-cassetto-party-scroll]');
    const rack = q('[data-testid="resident-slot-rack"]');
    const seats = rack ? [...rack.children].map(r) : [];
    const bag = q('[data-cassetto-bag]');
    const niches = bag ? [...bag.children].map(r) : [];
    const journeyArt = q('[data-cassetto-journey-art]');
    const cart = q('[data-cassetto-cartouche]');
    const briefing = cart ? cart.querySelector('p') : null;
    const title = cart ? cart.children[2] : null;
    const vig = q('[data-cassetto-vignette]');
    const mask = scroller ? getComputedStyle(scroller).webkitMaskImage || getComputedStyle(scroller).maskImage : null;
    const riskStyle = riskWell ? getComputedStyle(riskWell) : null;
    return {
      col: col ? r(col) : null,
      cta: cta ? r(cta) : null,
      ctaText: cta ? r(cta.querySelector('.confirm-text')) : null,
      wells, riskWell: riskWell ? r(riskWell) : null, rewardWell: rewardWell ? r(rewardWell) : null,
      riskBorderImage: riskStyle ? riskStyle.borderImageSource.slice(0, 60) : null,
      scroller: scroller ? { ...r(scroller), sw: scroller.scrollWidth, cw: scroller.clientWidth, mask: mask && mask.includes('linear-gradient') } : null,
      seats, seatCount: seats.length,
      niches,
      journeyArt: journeyArt ? r(journeyArt) : null,
      cart: cart ? r(cart) : null,
      briefing: briefing ? r(briefing) : null,
      title: title ? r(title) : null,
      vignette: vig ? r(vig) : null,
      riskWellComputed: riskStyle ? { border: riskStyle.border, radius: riskStyle.borderRadius } : null,
    };
  });
  await page.screenshot({ animations: 'disabled', timeout: 60000, path: `${OUT}/v3-${w}x${h}.png` });
  // detail crops: party well + CTA zone
  const colBox = geo.col;
  if (colBox) {
    const clip = (x, y, cw, ch) => ({ x: Math.max(0, x), y: Math.max(0, y), width: cw, height: ch });
    const party = geo.wells[0].rect;
    if (party) await page.screenshot({ animations: 'disabled', timeout: 60000, path: `${OUT}/v3-${w}-party.png`, clip: clip(party.x - 8, party.y - 8, party.w + 16, party.h + 16) });
    if (geo.cta) await page.screenshot({ animations: 'disabled', timeout: 60000, path: `${OUT}/v3-${w}-cta.png`, clip: clip(colBox.x, geo.cta.y - 40, colBox.w, geo.cta.h + 60) });
    const bag = geo.wells[1].rect;
    if (bag) await page.screenshot({ animations: 'disabled', timeout: 60000, path: `${OUT}/v3-${w}-bag.png`, clip: clip(bag.x - 8, bag.y - 8, bag.w + 16, bag.h + 16) });
    const jr = geo.wells[2].rect;
    if (jr) await page.screenshot({ animations: 'disabled', timeout: 60000, path: `${OUT}/v3-${w}-journey.png`, clip: clip(jr.x - 8, jr.y - 8, jr.w + 16, jr.h + 16) });
    if (geo.riskWell) await page.screenshot({ animations: 'disabled', timeout: 60000, path: `${OUT}/v3-${w}-risk.png`, clip: clip(geo.riskWell.x - 8, geo.riskWell.y - 8, geo.riskWell.w + geo.rewardWell.w + 30, geo.riskWell.h + 16) });
    if (geo.cart) await page.screenshot({ animations: 'disabled', timeout: 60000, path: `${OUT}/v3-${w}-cart.png`, clip: clip(geo.cart.x - 10, geo.cart.y - 30, geo.cart.w + 20, geo.cart.h + 40) });
  }
  console.log(`=== ${w}x${h} ===`);
  console.log(JSON.stringify(geo, null, 1));
  console.log('pageErrors:', errors.length ? errors : 'none');
  await page.close();
}
await browser.close();
