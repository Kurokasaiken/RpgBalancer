import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1400, height: 800 } });
await p.goto('http://127.0.0.1:5173/hud-lab', { waitUntil: 'domcontentloaded', timeout: 60000 });
for (let i = 0; i < 90; i++) { if (await p.evaluate(() => !document.body.innerText.includes('warmup') && window.__pixiApp)) break; await p.waitForTimeout(2000); }
await p.waitForTimeout(4000);
await p.keyboard.press('h').catch(() => {});
await p.mouse.move(700, 160);
for (let i = 0; i < 7; i++) { await p.mouse.wheel(0, -240); await p.waitForTimeout(200); }
await p.waitForTimeout(1200);
await p.screenshot({ path: '/tmp/clar2-on.png' });
await p.evaluate(() => {
  const w = window.__pixiApp.stage.children[0];
  const walk = n => { if (n.zIndex === 3.5) { window.__c = n; n.visible = false; } (n.children ?? []).forEach(walk); };
  walk(w);
});
await p.waitForTimeout(400);
await p.screenshot({ path: '/tmp/clar2-off.png' });
await b.close();
