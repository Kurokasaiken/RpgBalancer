/**
 * DEF-06 probe — empirical check of CSS `zoom` strategies on /game.
 */
import { chromium } from 'playwright';

const W = 2560;
const H = 1440;
const URL_ = 'http://localhost:5173/game';

const MEASURE = `(() => {
  const sel = (s) => {
    const el = document.querySelector(s);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.x), y: Math.round(r.y) };
  };
  const canvas = document.querySelector('canvas');
  const cRect = canvas ? canvas.getBoundingClientRect() : null;
  const t = document.querySelector('[data-hud-hide-toggle]');
  let hit = null;
  if (t) {
    const r = t.getBoundingClientRect();
    const el = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    hit = el === t || t.contains(el);
  }
  return {
    toggle: sel('[data-hud-hide-toggle]'),
    canvas: cRect ? { devW: Math.round(cRect.width), devH: Math.round(cRect.height), cssW: canvas.clientWidth, cssH: canvas.clientHeight, bufW: canvas.width, bufH: canvas.height } : null,
    innerW: window.innerWidth,
    dpr: window.devicePixelRatio,
    hit,
  };
})()`;

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: W, height: H } });
await page.goto(URL_, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(3500);

console.log('BEFORE', JSON.stringify(await page.evaluate(MEASURE)));

await page.evaluate(`(() => { document.body.style.zoom = '1.3333'; })()`);
await page.waitForTimeout(800);
console.log('BODY zoom=1.3333', JSON.stringify(await page.evaluate(MEASURE)));

const counter = await page.evaluate(`(() => {
  const canvas = document.querySelector('canvas');
  if (!canvas) return 'no canvas';
  let el = canvas;
  let marked = null;
  while (el && el !== document.body) {
    const cs = getComputedStyle(el);
    if (cs.position === 'absolute' && el.clientWidth > 500) { marked = el; break; }
    el = el.parentElement;
  }
  if (!marked) return 'no wrapper found';
  marked.dataset.zoomMarked = '1';
  marked.style.zoom = String(1 / 1.3333);
  return { tag: marked.tagName, cls: String(marked.className).slice(0, 60) };
})()`);
console.log('counter-zoom applied to', JSON.stringify(counter));
await page.waitForTimeout(800);
console.log('AFTER counter', JSON.stringify(await page.evaluate(MEASURE)));

await page.screenshot({ path: 'test-results/plan-043/ws5/zoom-body-133.png' });
await browser.close();
console.log('shot saved');
