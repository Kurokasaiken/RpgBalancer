import { chromium } from 'playwright';
const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
const ctx = b.contexts()[0];
const page = ctx.pages().find((p) => p.url().includes('gemini.google.com'));
if (page) {
  await page.screenshot({ path: 'test-results/gemini-auth-check.png' });
  console.log('shot taken, url:', page.url());
} else console.log('no gemini tab');
await b.close().catch(() => {});
