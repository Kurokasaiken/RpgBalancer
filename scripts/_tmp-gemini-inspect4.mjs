import { chromium } from 'playwright';
const browser = await chromium.connectOverCDP('http://127.0.0.1:9222', { timeout: 90000 });
const page = browser.contexts()[0].pages().find(p => p.url().includes('685d5d8b80949fcf'));
const info = await page.evaluate(() => {
  const scope = document.querySelector('input-area-v2, chat-input-container, .input-area, form, footer') ?? document.body;
  const all = [...document.querySelectorAll('button')].slice(-25).map(b => (b.getAttribute('aria-label') || b.textContent.trim() || b.className).slice(0, 70));
  return { lastButtons: all, overlays: document.querySelectorAll('.cdk-overlay-pane, [role="menu"]').length };
});
console.log(JSON.stringify(info, null, 1));
process.exit(0);
