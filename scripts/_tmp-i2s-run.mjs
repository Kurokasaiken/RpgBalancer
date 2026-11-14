import { chromium } from 'playwright';
const MOCKUP = '/Users/faustoboni/progetti_personali/RPG/.mw/specs/poi-radial/refs/mockup-hub-fan-village.jpg';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1500, height: 900 } });
page.on('pageerror', e => console.log('PAGEERROR', e.message));
await page.goto('http://127.0.0.1:4173/figma-sim.html', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(4000);
const frame = page.frames().find(f => f.url().includes('ui.html'));
if (!frame) { console.log('NO FRAME'); process.exit(1); }
// dismiss restore-workspace dialog if present
for (let t = 0; t < 10; t++) {
  const dlg = frame.locator('#workspaceRestoreDialog.open');
  if (await dlg.count() === 0) break;
  const closeBtn = dlg.locator('button', { hasText: '×' }).first();
  const newBtn = frame.locator('button', { hasText: '开始新工作' }).first();
  if (await closeBtn.count()) { await closeBtn.click().catch(()=>{}); }
  else if (await newBtn.count()) { await newBtn.click().catch(()=>{}); }
  await page.waitForTimeout(800);
}
console.log('dialogs cleared');
// upload local image
await frame.locator('#localImage').setInputFiles(MOCKUP);
console.log('uploaded');
await page.waitForTimeout(3000);
await page.screenshot({ path: '/tmp/i2s-02-uploaded.png' });
// click AI decompose
const decomp = frame.locator('button', { hasText: 'AI拆图' }).first();
await decomp.click();
console.log('decompose clicked');
// wait for decomposition to finish — poll screenshots
for (let i = 0; i < 24; i++) {
  await page.waitForTimeout(10000);
  const txt = await frame.locator('body').innerText().catch(() => '');
  const done = /\d+\s*个|已识别|确认|补齐|失败|error|Error/.test(txt) && !txt.includes('正在');
  console.log(`t+${(i+1)*10}s done-hint:${done}`);
  if (done) break;
}
await page.screenshot({ path: '/tmp/i2s-03-decomposed.png' });
console.log('done');
await browser.close();
