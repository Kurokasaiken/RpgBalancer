import { chromium } from 'playwright';
import fs from 'node:fs';
const DL = '/Users/faustoboni/progetti_personali/RPG/.mw/runs/stash-frame-slice/dl';
const b = await chromium.connectOverCDP('http://localhost:9222', { timeout: 60000 });
const bs = await b.newBrowserCDPSession();
await bs.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: DL, eventsEnabled: true });
const ctx = b.contexts()[0];
const sel = '[aria-label*="Scarica questa immagine"]';
let best = null;
for (const p of ctx.pages()) {
  const url = p.url();
  const n = await p.locator(sel).count().catch(() => -1);
  console.log('tab', url.slice(0, 70), 'downloads', n);
  if (/google\.com\/search/.test(url) && n > 0 && (!best || n > best.n)) best = { p, n };
}
if (!best) { console.log('NO_TAB_WITH_IMAGES'); await b.close(); process.exit(1); }
const page = best.p;
const files0 = new Set(fs.readdirSync(DL));
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)).catch(() => {});
await page.waitForTimeout(2000);
const dl = page.locator(sel);
const n = await dl.count();
for (let attempt = 0; attempt < 3; attempt++) {
  for (let k = n - 1; k >= 0; k--) {
    const el = dl.nth(k);
    if (await el.isVisible().catch(() => false)) { await el.click({ timeout: 8000 }).catch(() => {}); console.log('clicked', k, 'of', n); break; }
  }
  await page.waitForTimeout(6000);
  const added = fs.readdirSync(DL).filter((f) => !files0.has(f));
  if (added.length) { console.log('downloaded', added.join(',')); break; }
}
await b.close();
