import { chromium } from 'playwright';
const grads = {
  a2: 'linear-gradient(180deg, #12735a 0%, #0a4a38 52%, #062a20 100%)',
  a3: 'linear-gradient(180deg, #2ea377 0%, #14705a 50%, #0a3f30 100%)',
};
const b = await chromium.launch({ timeout: 240000, headless: true, args: ['--use-angle=metal', '--enable-unsafe-swiftshader'] });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })).newPage();
await p.goto('http://localhost:5173/?frame=thin&band=a', { timeout: 120000 });
await p.locator('[data-testid="game-mappa2"]').waitFor({ state: 'visible', timeout: 120000 });
await p.locator('[data-testid="game-boot-screen"]').waitFor({ state: 'detached', timeout: 240000 });
await p.waitForTimeout(2000);
await p.keyboard.press('r'); await p.waitForTimeout(600);
await p.keyboard.press('v'); await p.waitForTimeout(1500);
await p.evaluate(() => { const s = document.querySelector('[data-hud-scroll-band]'); if (s) s.scrollTop = 60; });
await p.waitForTimeout(400);
await p.screenshot({ path: '.mw/runs/20261120-verify-frame7/grad-a1.png', timeout: 60000 });
for (const [id, grad] of Object.entries(grads)) {
  await p.addStyleTag({ content: `.skin-scope [data-hud-band][data-variant="a"] .hb-thumb { background: radial-gradient(circle at 50% 0%, rgba(255,240,200,0.18) 0%, transparent 55%), ${grad} !important; }` });
  await p.waitForTimeout(300);
  await p.screenshot({ path: `.mw/runs/20261120-verify-frame7/grad-${id}.png`, timeout: 60000 });
  console.log(id, 'ok');
}
await b.close();
