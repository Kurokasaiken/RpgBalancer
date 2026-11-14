import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1400, height: 1400 }, deviceScaleFactor: 1.5 });
await p.goto('http://localhost:5173/bezel-variants', { waitUntil: 'load', timeout: 30000 });
await p.locator('[data-testid="bezel-row-draghi"]').locator('text=TESTA').first().waitFor({ timeout: 30000 });
await p.waitForTimeout(2000);
await p.screenshot({ path: '/tmp/page-top.png' });
await b.close();
console.log('done');
