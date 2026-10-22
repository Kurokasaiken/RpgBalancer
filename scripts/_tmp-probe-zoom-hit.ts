/* TMP — hit-test probe inside zoomed layer. */
import { chromium } from 'playwright';
const main = async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 2560, height: 1440 } });
  await page.goto('http://localhost:5173/game', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForFunction(() => Boolean((window as any).__idleVillageTestHooks?.expedition), { timeout: 30000 });
  await page.keyboard.press('r');
  await page.waitForSelector('[data-testid="resident-roster-panel"], [data-testid="drag-test-container"]', { timeout: 15000 });
  await page.evaluate(() => (window as any).__idleVillageTestHooks.expedition['poi-goblin'].openDetail());
  await page.waitForTimeout(1200);
  const info = await page.evaluate(`(() => {
    const card = document.querySelector('[data-resident-id="hero-giggiolillo"]');
    if (!card) return { err: 'no card' };
    const b = card.getBoundingClientRect();
    const hit = document.elementFromPoint(b.x + b.width/2, b.y + b.height/2);
    const chain = [];
    let n = card;
    while (n && n !== document.body) { chain.push(n.tagName + (n.dataset.testid ? '#'+n.dataset.testid : '') + (getComputedStyle(n).pointerEvents === 'none' ? '[pe:none]' : '')); n = n.parentElement; }
    return {
      box: { x: b.x, y: b.y, w: b.width, h: b.height },
      hitTag: hit ? hit.tagName + '#' + (hit.dataset?.testid ?? '') + ' ' + (hit.className || '').toString().slice(0, 60) : null,
      hitIsCardOrInside: hit ? (card.contains(hit) || hit.contains(card)) : null,
      chain: chain.slice(0, 8),
      trayTile: !!document.querySelector('[data-testid^="tray-resident-hero-giggiolillo"], [data-testid="tray-resident-hero-giggiolillo"]'),
    };
  })()`);
  console.log(JSON.stringify(info, null, 1));
  await browser.close();
};
void main();
