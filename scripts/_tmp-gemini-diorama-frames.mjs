#!/usr/bin/env node
// F2-T0 frames: anchored edits in the SAME chat (d9c147e0b3b074e6).
// c0 (final 3/4) -> f_front (front view) -> f_mid (halfway). c0 stays last frame.
import { chromium } from 'playwright';
import fs from 'fs';
const CHAT = 'd9c147e0b3b074e6';
const DIR = '.mw/specs/poi-radial/diorama/gen/';
const STEPS = [
  { attach: DIR + 'diorama-final-c0.png', out: DIR + 'diorama-frame-front.png', expect: 4,
    prompt: `Edit this image: show the EXACT same miniature village diorama on its engraved antique-gold pedestal with inset gems, identical subjects and identical impasto painterly style, but rotate the viewpoint to a straight FRONT view of the diorama (camera in front of the pedestal, looking straight at it, symmetric composition). Keep the deep dark navy flat background, the pedestal fully visible, no text, no frame, no border.` },
  { attach: DIR + 'diorama-final-c0.png', out: DIR + 'diorama-frame-mid.png', expect: 5,
    prompt: `Edit this image: show the EXACT same miniature village diorama on its engraved antique-gold pedestal with inset gems, identical subjects and identical impasto painterly style, but rotate the viewpoint to HALFWAY between a straight front view and this three-quarter view (a gentle 15-20 degree turn, still mostly frontal). Keep the deep dark navy flat background, the pedestal fully visible, no text, no frame, no border.` },
];
const browser = await chromium.connectOverCDP('http://127.0.0.1:9222', { timeout: 90000 });
const ctx = browser.contexts()[0];
const cdp = await browser.newBrowserCDPSession();
await cdp.send('Target.createTarget', { url: 'about:blank', background: true });
let page;
for (let i = 0; i < 40; i++) { page = ctx.pages().find(p => p.url() === 'about:blank'); if (page) break; await new Promise(r => setTimeout(r, 250)); }
if (!page) { console.error('no bg tab'); process.exit(3); }
await page.goto('https://gemini.google.com/app/' + CHAT, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForSelector('div[contenteditable="true"], .ql-editor', { timeout: 30000 });
const SEL = 'GENERATED-IMAGE img, SINGLE-IMAGE img, model-response img, message-content img';
for (const st of STEPS) {
  let attached = false;
  const menuBtn = page.locator('button[aria-label*="Caricamento e strumenti" i], button[aria-label*="pload" i]').first();
  await menuBtn.click({ timeout: 8000 });
  await page.waitForSelector('input[type="file"]', { state: 'attached', timeout: 10000 });
  const fis = page.locator('input[type="file"]');
  for (let i = 0; i < await fis.count(); i++) {
    const accept = (await fis.nth(i).getAttribute('accept')) || '';
    if (accept && !/image|\*/.test(accept)) continue;
    try { await fis.nth(i).setInputFiles(st.attach); attached = true; break; } catch {}
  }
  console.log('attached:', attached);
  if (!attached) process.exit(4);
  await page.waitForTimeout(3000);
  const box = page.locator('div[contenteditable="true"]').first();
  await box.click(); await box.fill(st.prompt); await page.waitForTimeout(400); await box.press('Enter');
  console.log('sent ->', st.out);
  let last = { n: st.expect - 1, stable: 0 };
  const deadline = Date.now() + 300000;
  while (Date.now() < deadline) {
    const n = await page.evaluate((s) => [...document.querySelectorAll(s)].filter(e => e.naturalWidth > 64).length, SEL);
    if (n === last.n && n >= st.expect) { if (++last.stable >= 4) break; } else last = { n, stable: 0 };
    await page.waitForTimeout(2500);
  }
  const b64 = await page.evaluate((s) => {
    const els = [...document.querySelectorAll(s)].filter(e => e.naturalWidth > 64);
    const el = els[els.length - 1];
    const c = document.createElement('canvas'); c.width = el.naturalWidth; c.height = el.naturalHeight;
    c.getContext('2d').drawImage(el, 0, 0);
    return { w: c.width, h: c.height, data: c.toDataURL('image/png').split(',')[1] };
  }, SEL);
  fs.writeFileSync(st.out, Buffer.from(b64.data, 'base64'));
  console.log('saved', st.out, b64.w + 'x' + b64.h);
}
await page.close();
process.exit(0);
