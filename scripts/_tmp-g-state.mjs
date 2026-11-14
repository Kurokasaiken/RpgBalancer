import { chromium } from 'playwright';
const browser = await chromium.connectOverCDP('http://127.0.0.1:9222', { timeout: 90000 });
const page = browser.contexts()[0].pages().find(p => p.url().includes('685d5d8b80949fcf'));
await page.screenshot({ path: 'test-results/gemini-state.png' });
const info = await page.evaluate(() => ({
  generating: !!document.querySelector('[aria-label*="stop" i], [aria-label*="ferma" i], .loading, progress'),
  menuOpen: document.querySelectorAll('[role="menu"], mat-action-list').length,
  caricaBtn: !!document.querySelector('button[aria-label="Caricamento e strumenti"]'),
  caricaFile: [...document.querySelectorAll('button')].filter(b => /Carica file/i.test(b.textContent)).length,
}));
console.log(JSON.stringify(info));
process.exit(0);
