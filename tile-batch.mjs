import { chromium } from 'playwright';
import fs from 'fs';
const PROMPT = process.env.TILE_PROMPT || "questa è la parte zoomata di una mappa dipinta vista dall'alto. Ridisegna tutti gli alberi e gli arbusti in modo che sembrino ben fatti a mano — alberi singoli leggibili con tronchi, aghi o ciuffi di foglie dipinti, varietà naturale — mantenendo la scena identica: stessi fiumi, stesse coste, stessa vegetazione nelle stesse posizioni, stessi colori gouache.";
const queue = fs.readFileSync(process.argv[2], 'utf8').trim().split('\n'); // each: name<TAB>/abs/in.png
const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
const ctx = b.contexts()[0];

async function collect(p, out) {
  // 1) canvas → dataURL on the biggest generated img (blob/gg)
  const dataUrl = await p.evaluate(() => {
    const imgs = [...document.querySelectorAll('img')].filter(i => i.naturalWidth > 400);
    if (!imgs.length) return null;
    const im = imgs[imgs.length - 1];
    try {
      const c = document.createElement('canvas');
      c.width = im.naturalWidth; c.height = im.naturalHeight;
      c.getContext('2d').drawImage(im, 0, 0);
      return c.toDataURL('image/png');
    } catch { return null; }
  });
  if (dataUrl && dataUrl.length > 50000) {
    fs.writeFileSync(out, Buffer.from(dataUrl.split(',')[1], 'base64'));
    return 'canvas';
  }
  // 2) fallback: element screenshot
  const ims = await p.$$('img');
  let best = null, ba = 0;
  for (const im of ims) { const bb = await im.boundingBox().catch(() => null); if (bb && bb.width * bb.height > ba) { ba = bb.width * bb.height; best = im; } }
  if (best) { await best.screenshot({ path: out }); return 'shot'; }
  return 'fail';
}

async function gemini(p, infile, out) {
  await p.goto('https://gemini.google.com/app', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await p.waitForTimeout(9000);
  await p.keyboard.press('Escape').catch(() => {});
  let ok = false;
  for (let t = 0; t < 3 && !ok; t++) {
    try {
      const fi = p.locator('input[type="file"]').first();
      if (await fi.count()) { await fi.setInputFiles(infile); ok = true; break; }
      const fcP = p.waitForEvent('filechooser', { timeout: 20000 }).catch(() => null);
      await p.evaluate(() => { const x = [...document.querySelectorAll('button')].find(e => /caricamento|upload|tools|add|file/i.test((e.getAttribute('aria-label') || '') + (e.getAttribute('mattooltip') || '') + (e.title || ''))); x && x.click(); });
      await p.waitForTimeout(2500);
      await p.locator('button:has-text("File"), [role="menuitem"]:has-text("File")').first().click({ force: true, timeout: 8000 }).catch(() => {});
      const fc = await fcP;
      if (fc) { await fc.setFiles(infile); ok = true; }
    } catch { console.log('upload retry', t); }
  }
  if (!ok) return 'UPLOAD_FAIL';
  await p.waitForTimeout(6000);
  const box = p.locator('div[contenteditable="true"], .ql-editor, textarea').first();
  await box.click(); await p.keyboard.type(PROMPT, { delay: 1 });
  await p.waitForTimeout(700); await p.keyboard.press('Enter');
  await p.waitForTimeout(110000);
  return await collect(p, out);
}

async function chatgpt(p, infile, out) {
  await p.goto('https://chatgpt.com/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await p.waitForTimeout(9000);
  const fi = p.locator('input[type=file]').first();
  if (await fi.count()) await fi.setInputFiles(infile);
  else {
    await p.locator('button').filter({ hasText: /plus|attach|aggiungi|file/i }).first().click({ force: true }).catch(() => {});
    await p.waitForTimeout(1500);
    const mi = p.locator('[role="menuitem"],button').filter({ hasText: /upload|carica|file/i }).first();
    const [fc] = await Promise.all([p.waitForEvent('filechooser', { timeout: 15000 }), mi.click({ force: true }).catch(() => {})]);
    await fc.setFiles(infile);
  }
  await p.waitForTimeout(5000);
  const box = p.locator('#prompt-textarea, div[contenteditable=true]').first();
  await box.click(); await box.fill(PROMPT);
  await p.waitForTimeout(700); await p.keyboard.press('Enter');
  await p.waitForTimeout(170000);
  return await collect(p, out);
}

const g = ctx.pages().find(x => x.url().includes('gemini')) || await ctx.newPage();
const c = ctx.pages().find(x => x.url().includes('chatgpt')) || await ctx.newPage();
let i = 0;
for (const line of queue) {
  const [name, infile] = line.split('\t');
  const out = `test-results/mappa2-upscale/batch/${name}.png`;
  if (fs.existsSync(out)) { console.log('skip', name); continue; }
  const mode = process.argv[3]; const useChatgpt = mode === 'chatgpt' ? true : mode === 'gemini' ? false : i % 2 === 1;
  let r = 'fail';
  try { r = await (useChatgpt ? chatgpt(c, infile, out) : gemini(g, infile, out)); }
  catch (e) { console.log(name, 'ERR', String(e).slice(0, 80)); }
  console.log(name, useChatgpt ? 'chatgpt' : 'gemini', '→', r);
  i++;
}
console.log('BATCH DONE');
process.exit(0);
