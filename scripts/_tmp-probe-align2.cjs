const { chromium } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto('http://127.0.0.1:5173/game');
  await page.waitForFunction(() => window.__idleVillageTestHooks?.expedition?.['poi-goblin'], null, { timeout: 60000 });
  await page.waitForFunction(() => {
    const b = document.querySelector('[data-testid="game-boot-screen"]');
    return !b || getComputedStyle(b).pointerEvents === 'none';
  }, null, { timeout: 15000 }).catch(() => {});
  await page.keyboard.press('v');
  await page.waitForSelector('[data-testid="stash-minimise"]', { timeout: 15000 });
  await page.waitForTimeout(400);
  const measure = () => page.evaluate(() => {
    const rect = (sel) => { const e = document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width) }; };
    return { chest: rect('[data-hud-panel="villageStash"] svg[data-engraved="ico-chest"]'),
      toggle: rect('[data-testid="stash-minimise"]') ?? rect('[data-testid="stash-restore"]'),
      close: rect('[data-hud-panel="villageStash"] [data-skin="close"]') };
  });
  const expanded = await measure();
  await page.getByTestId('stash-minimise').click();
  await page.waitForSelector('[data-testid="stash-minimised"]');
  await page.mouse.move(20, 20); // move pointer OFF the panel — no hover-lift
  await page.waitForTimeout(200);
  const collapsed = await measure();
  const delta = {};
  for (const k of ['chest', 'toggle', 'close']) delta[k] = { dx: collapsed[k].x - expanded[k].x, dy: collapsed[k].y - expanded[k].y };
  console.log(JSON.stringify({ delta }));
  const bb = await page.locator('[data-hud-panel="villageStash"]').boundingBox();
  await page.screenshot({ path: 'test-results/r251b-expanded.png', clip: { x: bb.x - 10, y: bb.y - 10, width: bb.width + 20, height: bb.height + 20 } });
  await browser.close();
})();
