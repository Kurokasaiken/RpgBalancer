import { chromium } from 'playwright';
const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 800, height: 600 } });
await page.goto('http://127.0.0.1:5179/game');
await page.waitForFunction(() => window.__idleVillageTestHooks?.expedition?.['poi-goblin'], null, { timeout: 30000 });
await page.evaluate(() => window.__idleVillageTestHooks.revealQuestPois?.());
await page.evaluate(() => window.__idleVillageTestHooks.expedition['poi-goblin'].openDetail());
await page.waitForTimeout(1200);
const chain = await page.evaluate(() => {
  const el = document.querySelector('[data-testid="floating-panel-quest-expedition-poi-goblin"]');
  const out = [];
  for (let n = el; n && n !== document.body; n = n.parentElement) {
    const cs = getComputedStyle(n);
    out.push({ tag: n.tagName, cls: (n.getAttribute('class')||'').slice(0,60), tid: n.getAttribute('data-testid')||n.getAttribute('data-stage-panel')||'', pos: cs.position, left: cs.left, transform: cs.transform === 'none' ? '' : cs.transform, w: Math.round(n.getBoundingClientRect().width), x: Math.round(n.getBoundingClientRect().x) });
    if (out.length > 8) break;
  }
  return out;
});
console.log(JSON.stringify(chain, null, 1));
await b.close();
