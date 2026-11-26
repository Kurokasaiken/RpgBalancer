import { chromium } from 'playwright';
const URL_ARG = process.argv[2];
const OUT = '.mw/runs/stash-frame-slice';
const b = await chromium.connectOverCDP('http://localhost:9222', { timeout: 60000 });
const bs = await b.newBrowserCDPSession();
const ctx = b.contexts()[0];
console.log('open tabs:', ctx.pages().map((p) => p.url().slice(0, 90)).join(' | '));
if (URL_ARG) {
  const before = new Set(ctx.pages());
  await bs.send('Target.createTarget', { url: URL_ARG, background: true });
  let page = null;
  for (let i = 0; i < 40 && !page; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    for (const p of ctx.pages()) if (!before.has(p) && /google\.com/.test(p.url())) page = p;
  }
  await page.setViewportSize({ width: 2600, height: 1600 });
  await page.waitForTimeout(16000);
  await page.keyboard.press('Escape').catch(() => {});
  console.log('URL', page.url().slice(0, 140));
  const info = await page.evaluate(() => ({
    downloads: document.querySelectorAll('[aria-label*="Scarica questa immagine"]').length,
    tail: document.body.innerText.slice(-1200),
  }));
  console.log('downloads', info.downloads);
  console.log('TAIL', info.tail);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/inspect-bottom.png` });
  await page.close().catch(() => {});
}
await b.close();
