import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.locator('[data-map-ready]').waitFor({ state: 'attached', timeout: 150000 }).catch(() => {});
await page.locator('[data-testid="game-boot-screen"]').waitFor({ state: 'detached', timeout: 60000 }).catch(() => {});
await page.waitForTimeout(3000);
await page.keyboard.press('v'); await page.waitForTimeout(1200);
await page.keyboard.press('r'); await page.waitForTimeout(1200);
const out = await page.evaluate(() => {
  const find = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    // walk up until a non-transparent bg
    let cur = el;
    const chain = [];
    for (let i = 0; i < 8 && cur; i++) {
      const bg = getComputedStyle(cur).backgroundColor;
      const bgI = getComputedStyle(cur).backgroundImage;
      chain.push({ tag: cur.tagName, cls: (cur.getAttribute('data-testid') || cur.className || '').toString().slice(0, 60), bg, bgI: bgI.slice(0, 80) });
      if (bg !== 'rgba(0, 0, 0, 0)' || bgI !== 'none') break;
      cur = cur.parentElement;
    }
    return chain;
  };
  return {
    stash: find('[data-testid="stash-shelf"]'),
    roster: find('[data-testid="roster-grid"], [data-hud-panel="roster"]'),
  };
});
console.log(JSON.stringify(out, null, 1).slice(0, 3500));
await browser.close();
