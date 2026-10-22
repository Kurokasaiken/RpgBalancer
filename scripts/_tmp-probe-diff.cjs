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
  await page.getByTestId('stash-minimise').click();
  await page.waitForSelector('[data-testid="stash-minimised"]');
  const out = await page.evaluate(() => {
    const strip = document.querySelector('[data-testid="stash-minimised"]');
    const r = document.querySelector('[data-testid="stash-restore"]');
    const c = strip.querySelector('[data-skin="close"]');
    const pick = (el) => { const s = getComputedStyle(el); const b = el.getBoundingClientRect();
      return { y: b.y, h: b.height, display: s.display, alignItems: s.alignItems, height: s.height, minH: s.minHeight, padding: s.padding, border: s.borderWidth, lineHeight: s.lineHeight, transform: s.transform, margin: s.margin, alignSelf: s.alignSelf, boxSizing: s.boxSizing }; };
    const span = r.parentElement;
    const spanS = getComputedStyle(span);
    return {
      restore: pick(r), close: pick(c),
      span: { alignItems: spanS.alignItems, height: span.getBoundingClientRect().height, y: span.getBoundingClientRect().y, display: spanS.display },
      plaqueAlignItems: getComputedStyle(strip).alignItems,
      plaqueY: strip.getBoundingClientRect().y, plaqueH: strip.getBoundingClientRect().height,
      svgR: r.querySelector('svg').getBoundingClientRect().y,
      svgC: c.querySelector('svg').getBoundingClientRect().y,
    };
  });
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
})();
