const { chromium } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto('http://127.0.0.1:5173/mappa2-lab');
  await page.waitForFunction(() => document.querySelector('[data-testid="mappa2-lab-hud"]')?.textContent?.includes('ready: yes'), null, { timeout: 90000 });
  const probe = async () => page.evaluate(() => {
    const out = { found: [], pipes: Object.keys(window.__pixiApp?.renderer?.renderPipes ?? {}) };
    const walk = (n, depth) => {
      if (!n) return;
      if (n.constructor.name === 'TilingSprite' && n.width < 400) out.found.push({ tp: { x: n.tilePosition?.x, y: n.tilePosition?.y }, w: n.width, h: n.height, alpha: n.alpha, visible: n.visible, masked: !!n.mask });
      for (const c of n.children ?? []) walk(c, depth + 1);
    };
    walk(window.__pixiApp?.stage, 0);
    return out;
  });
  console.log('t0', JSON.stringify(await probe()));
  await page.waitForTimeout(600);
  console.log('t1', JSON.stringify(await probe()));
  await browser.close();
})();
