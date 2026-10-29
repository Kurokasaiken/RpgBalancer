const { chromium } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto('http://127.0.0.1:5173/mappa2-lab');
  await page.waitForFunction(() => document.querySelector('[data-testid="mappa2-lab-hud"]')?.textContent?.includes('ready: yes'), null, { timeout: 90000 });
  const probe = () => page.evaluate(() => {
    const out = [];
    const walk = (n) => {
      if (n && n.tilePosition) out.push({ tpY: n.tilePosition.y, w: n.width, h: n.height, x: n.x, y: n.y, alpha: n.alpha, visible: n.visible, tileScaleY: n.tileScale?.y });
      for (const c of n.children ?? []) walk(c);
    };
    walk(window.__pixiApp?.stage);
    return out;
  });
  console.log('t0', JSON.stringify(await probe()));
  await page.waitForTimeout(500);
  console.log('t1', JSON.stringify(await probe()));
  await browser.close();
})();
