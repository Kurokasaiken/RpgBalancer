import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage();
const t0 = Date.now();
try {
  await p.goto('http://127.0.0.1:5179/gameOld', { timeout: 30000 });
  await p.waitForSelector('[data-testid="pixi-world-canvas"]', { state: 'attached', timeout: 60000 });
  console.log('CANVAS_ATTACHED_MS:', Date.now() - t0);
} catch (e) { console.log('FAIL:', e.message.split('\n')[0]); }
await b.close();
