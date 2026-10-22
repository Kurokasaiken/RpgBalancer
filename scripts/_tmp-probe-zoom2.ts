/** DEF-06 probe 2 — per-element `zoom` on edge-anchored chrome clusters. */
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 2560, height: 1440 } });
await page.goto('http://localhost:5173/game', { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(3500);

const MEASURE = `(() => {
  const sel = (s) => {
    const el = document.querySelector(s);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.x), y: Math.round(r.y), r: Math.round(r.right), b: Math.round(r.bottom) };
  };
  return {
    toggle: sel('[data-hud-hide-toggle]'),
    plaqueTop: (() => { const p = document.querySelectorAll('[data-skin="plaque"]'); return [...p].map((e) => { const r = e.getBoundingClientRect(); return { w: Math.round(r.width), x: Math.round(r.x), y: Math.round(r.y) }; }); })(),
    nav: sel('nav'),
  };
})()`;

console.log('BEFORE', JSON.stringify(await page.evaluate(MEASURE)));

// zoom the toggle's cluster (bottom-right anchored flex div) directly
const info = await page.evaluate(`(() => {
  const t = document.querySelector('[data-hud-hide-toggle]');
  const cluster = t.closest('div[style*="position: absolute"], div');
  // walk to the absolutely positioned parent
  let el = t.parentElement;
  while (el && getComputedStyle(el).position !== 'absolute') el = el.parentElement;
  el.dataset.zoomMarked = '1';
  el.style.zoom = '1.3333';
  return { anchored: getComputedStyle(el).right };
})()`);
console.log('zoomed cluster:', JSON.stringify(info));
await page.waitForTimeout(500);
console.log('AFTER element-zoom', JSON.stringify(await page.evaluate(MEASURE)));

// hit test inside zoomed chrome
const hit = await page.evaluate(`(() => {
  const t = document.querySelector('[data-hud-hide-toggle]');
  const r = t.getBoundingClientRect();
  const el = document.elementFromPoint(r.x + r.width/2, r.y + r.height/2);
  return el === t || t.contains(el);
})()`);
console.log('hit inside zoomed chrome:', hit);

// bottom-center nav plaque: left:50% + translateX(-50%)
const nav = await page.evaluate(`(() => {
  const n = document.querySelector('nav');
  let el = n.parentElement;
  while (el && getComputedStyle(el).position !== 'absolute') el = el.parentElement;
  el.dataset.zoomMarked = '1';
  el.style.zoom = '1.3333';
  const r = n.getBoundingClientRect();
  return { navCx: Math.round(r.x + r.width/2), vw: window.innerWidth };
})()`);
await page.waitForTimeout(400);
console.log('nav after zoom:', JSON.stringify(await page.evaluate(MEASURE)), JSON.stringify(nav));

await page.screenshot({ path: 'test-results/plan-043/ws5/zoom-element-133.png' });
await browser.close();
