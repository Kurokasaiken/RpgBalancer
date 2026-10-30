import { chromium } from 'playwright';
const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
const ctx = b.contexts()[0];
const page = ctx.pages().find(p => p.url().includes('0b99710d00e37e5e')) || ctx.pages()[0];
for (let i=0;i<3;i++){ await page.keyboard.press('Escape'); await page.waitForTimeout(400); }
const menuOpen = await page.evaluate(() => !!document.querySelector('[role="menu"]'));
console.log('menu still open:', menuOpen);
await b.close();
