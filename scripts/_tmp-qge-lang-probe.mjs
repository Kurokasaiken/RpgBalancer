import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console:' + m.text().slice(0, 200)); });
const out = { toggle: null, en: null, it: null, marks: 0, errors, ok: false };
try {
  await page.goto('http://localhost:5173/quest-editor', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForSelector('text=/lingua:/', { timeout: 15000 });
  await page.waitForTimeout(800);
  out.en = await page.locator('text=Exploration').count();
  const btn = page.locator('button', { hasText: 'lingua:' });
  out.toggleBefore = (await btn.textContent())?.trim();
  await btn.click();
  await page.waitForTimeout(400);
  out.toggleAfter = (await btn.textContent())?.trim();
  out.it = await page.locator('text=Esplorazione').count();
  out.marks = await page.locator('text=/IT (missing|stale)/').count();
  out.ok = out.en > 0 && out.it > 0;
} catch (e) { out.error = String(e).slice(0, 300); }
console.log(JSON.stringify(out, null, 1));
await browser.close();
process.exit(out.ok ? 0 : 1);
