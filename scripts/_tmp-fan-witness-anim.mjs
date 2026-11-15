import { chromium } from 'playwright';
const b = await chromium.launch({ timeout: 120000 });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://127.0.0.1:5173/lab/poi-luogo', { waitUntil: 'domcontentloaded', timeout: 180000 });
for (let i = 0; i < 60; i++) {
  if (await p.locator('[data-testid="place-village-hit"]').count().catch(() => 0)) break;
  await p.waitForTimeout(5000);
}
const rm = await p.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
console.error('prefers-reduced-motion:', rm);
await p.addStyleTag({ content: '.pfr-diorama-rise{animation-duration:2.6s !important;animation-play-state:running !important}' });
const expanded = await p.locator('[data-testid="place-village-hit"]').getAttribute('aria-expanded').catch(() => null);
if (expanded !== 'true') await p.locator('[data-testid="place-village-hit"]').dispatchEvent('click');
await p.waitForSelector('[data-testid="place-fancards"]', { timeout: 60000 });
await p.evaluate(() => {
  const el = document.querySelector('[data-testid="place-fancards"]');
  const l = el.style.left, t = el.style.top;
  document.body.appendChild(el);
  el.style.position = 'fixed';
  el.style.left = `calc(50% + ${l})`;
  el.style.top = `calc(50% + ${t})`;
  el.style.zIndex = '9999';
  // debug: check the anim element + computed style
  const g = el.querySelector('.pfr-diorama-rise');
  const cs = g ? getComputedStyle(g) : null;
  console.log('ANIM', !!g, cs && cs.animationName, cs && cs.animationDuration, cs && cs.transform);
});
const dbg = await p.evaluate(() => 'see console');
await p.waitForTimeout(350);
await p.screenshot({ path: '/tmp/fan-anim-1.png' });
await p.waitForTimeout(500);
await p.screenshot({ path: '/tmp/fan-anim-2.png' });
await p.waitForTimeout(2400);
await p.screenshot({ path: '/tmp/fan-anim-3.png' });
// dump computed style to stderr via title
const info = await p.evaluate(() => {
  const g = document.querySelector('.pfr-diorama-rise');
  const cs = g ? getComputedStyle(g) : null;
  return { has: !!g, name: cs?.animationName, dur: cs?.animationDuration, tf: cs?.transform?.slice(0, 60) };
});
console.error('animInfo', JSON.stringify(info));
await b.close();
