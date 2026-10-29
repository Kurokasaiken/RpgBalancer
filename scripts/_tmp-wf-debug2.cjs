const { chromium } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on('console', (m) => console.log('[console]', m.type(), m.text().slice(0, 200)));
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await page.goto('http://127.0.0.1:5173/mappa2-lab');
  await page.waitForFunction(() => document.querySelector('[data-testid="mappa2-lab-hud"]')?.textContent?.includes('ready: yes'), null, { timeout: 90000 });
  const dump = await page.evaluate(async () => {
    const world = window.__pixiApp?.stage?.children?.[0];
    const counts = {};
    const walk = (n) => { const k = n?.constructor?.name ?? '?'; counts[k] = (counts[k] ?? 0) + 1; for (const c of n.children ?? []) walk(c); };
    walk(world);
    const man = await fetch('/assets/world/mappa2/base/manifest.json').then(r => r.json());
    return { counts, wf: man.pack?.waterfall ? 'present' : 'absent', fxa: Object.keys(man.pack?.fxAtlases ?? {}) };
  });
  console.log(JSON.stringify(dump, null, 1));
  await browser.close();
})();
