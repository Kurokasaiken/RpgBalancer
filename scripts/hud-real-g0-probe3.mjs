#!/usr/bin/env node
/** G-0 read-only: opens "Visualizza utilizzo" and the reasoning-level control; reads text; no submission. */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
const [outDir] = process.argv.slice(2);
const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
const ctx = browser.contexts()[0];
const session = await browser.newBrowserCDPSession();
const marker = `g0c-${process.pid}-${Date.now().toString(36)}`;
await session.send('Target.createTarget', { url: `https://gemini.google.com/app#${marker}`, background: true });
let page; for (let i = 0; i < 60 && !page; i++) { page = ctx.pages().find((p) => { try { return p.url().includes(marker); } catch { return false; } }); if (!page) await new Promise((r) => setTimeout(r, 200)); }
await page.waitForSelector('div[contenteditable="true"], .ql-editor, textarea', { state: 'attached', timeout: 60000 });
await page.waitForTimeout(3000);
const rep = {};
try {
  await page.locator('text=Visualizza utilizzo').first().click({ timeout: 4000 });
  await page.waitForTimeout(2500);
  rep.usageText = await page.evaluate(() => document.body.innerText.replace(/\s+\n/g, '\n').slice(0, 2500));
  rep.url = page.url();
  await page.screenshot({ path: path.join(outDir, 'ui-usage.png') });
} catch (e) { rep.usageError = String(e).slice(0, 160); }
fs.writeFileSync(path.join(outDir, 'probe3.json'), JSON.stringify(rep, null, 2));
console.log(rep.usageText ? rep.usageText.slice(0, 1800) : JSON.stringify(rep));
try { await page.close(); } catch {}
await browser.close();
