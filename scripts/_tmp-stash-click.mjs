import { chromium } from 'playwright';
const page = await (await chromium.launch({ args: ['--enable-unsafe-swiftshader'] })).newPage({ viewport: { width: 1600, height: 900 } });
await page.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded', timeout: 120000 });
await page.waitForFunction(() => window.__worldCam?.zoom > 0, null, { timeout: 240000 });
// wait until the boot veil is fully unmounted — it intercepts clicks while mounted
await page.waitForFunction(() => !document.querySelector('[data-testid="game-boot-screen"]'), null, { timeout: 60000 });
await page.waitForTimeout(500);
const info = await page.evaluate(() => {
  const nav = document.querySelector('[data-hudslot="nav"]');
  const btns = [...nav.querySelectorAll('button')];
  return btns.map(b => {
    const r = b.getBoundingClientRect();
    const cx = r.x + r.width / 2, cy = r.y + r.height / 2;
    const el = document.elementFromPoint(cx, cy);
    return { label: b.getAttribute('aria-label'), cx: +cx.toFixed(0), cy: +cy.toFixed(0),
      hit: el ? `${el.tagName}:${el.getAttribute?.('aria-label') ?? el.tagName.toLowerCase()}` : 'none',
      insideBtn: b.contains(el) || el === b };
  });
});
console.log(JSON.stringify(info));
const stash = info.find(b => /stash/i.test(b.label ?? ''));
if (stash) {
  await page.mouse.click(stash.cx, stash.cy);
  await page.waitForTimeout(900);
  const state = await page.evaluate(() => ({
    stashPanel: !!document.querySelector('[class*="stash" i], [data-panel="villageStash"]'),
    anyPanel: [...document.querySelectorAll('[data-testid], [role="dialog"]')].filter(e => /stash|panel|dialog/i.test(e.getAttribute('data-testid') ?? '') || e.getAttribute('role') === 'dialog').map(e => e.tagName + ':' + (e.getAttribute('data-testid') ?? e.getAttribute('role'))),
  }));
  console.log('after click:', JSON.stringify(state));
  await page.screenshot({ path: '.mw/runs/20261124-hud-critique-multi-ai/witness-stash-click.jpg', type: 'jpeg', quality: 80, timeout: 60000 });
}
await page.close();
process.exit(0);
