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
  const bb = await page.locator('[data-hud-panel="villageStash"]').boundingBox();
  await page.screenshot({ path: 'test-results/r251b-expanded-header.png', clip: { x: bb.x - 10, y: bb.y - 10, width: bb.width + 20, height: 80 } });
  await browser.close();
})();
