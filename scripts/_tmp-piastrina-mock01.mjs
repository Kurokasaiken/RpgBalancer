/* R-367 piastrina icone — mock sheet 01 via Director's Gemini web (CDP :9222,
 * background target). T-25: download only after img count increments;
 * rewrite lh3 size suffix -> full res; wait for real generation (~60s). */
import { chromium } from 'playwright';
import fs from 'node:fs';

const OUT = '.mw/runs/20261120-piastrina-icone/gen';
const REF = '/Users/faustoboni/progetti_personali/RPG/.mw/specs/expedition-ui/refs/controls-sheet-g2.png';
const PROMPT = `Generate a NEW image: a 2x2 grid of FOUR variants of the same painted game icon — one object on a square ornate brass plate — on a FLAT UNIFORM dark grey-green background (#2e3533). Each cell contains ONE centered square brass-plate icon filling about 75% of the cell, generous even margins, no labels, no captions.

SUBJECT — identical in all four cells: a heavy polished steel dumbbell with ornate brass caps, the "strength bonus" item of a fantasy strategy game stash. Painted oil-impasto, bold readable silhouette, warm key light from the upper left, deep teal shadow lower right.

THE PLATE is the variable — four different treatments of the same square brass plate over a dark lacquer well:
(top-left) thin champagne-brass rim, small engraved acanthus-leaf corners, deep petrol-black lacquer well inside;
(top-right) heavier ornate frame — an engraved scrollwork band with rounded corner bosses, dark lacquer well inside;
(bottom-left) minimal beveled brass rim with a single engraved inner line, dark lacquer well inside;
(bottom-right) brass rim with four tiny round emerald studs at the corners, dark lacquer well inside — and here the dumbbell reads as a small die-cut RELIEF cut-out pinned on the lacquer, with a hair of rim light separating it.

SHARED MATERIAL LAW in every cell: hand-cast champagne brass (same warm gold as the reference controls), deep petrol-black lacquer well (never grey, never muddy brown), painted dumbbell with warm-metal highlights and teal shadows. Same light direction in all four cells. Painterly semi-realistic style — impasto on the object, crisper engraved metal on the plate.

FORBIDDEN: text, letters, numbers, watermarks, captions, UI text; gems except the four studs of the bottom-right cell; drop shadows between cells; any outer bevel on the cell edge; purple or magenta; plastic 3D render look; flat vector look; more than one object per plate.`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fullRes = (u) => {
  if (!u) return u;
  // lh3/googleusercontent: strip =sNN/-wNN-hNN/eNN-… suffix, request 2048
  return u.replace(/=s\d[^/]*$/, '').replace(/=w\d[^/]*$/, '').replace(/=[a-z]\d+[^/]*$/i, '') + '=s2048';
};

const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
const ctx = browser.contexts()[0];
let targetId = null;
try {
  const cdp = await ctx.newCDPSession(await ctx.newPage());
  const { targetId: tid } = await cdp.send('Target.createTarget', { url: 'about:blank', background: true });
  targetId = tid;
  await cdp.detach();
  let page = null;
  for (let i = 0; i < 20 && !page; i++) {
    page = ctx.pages().find((p) => p.url() === 'about:blank' || p.url().includes('gemini'));
    if (!page) await sleep(400);
  }
  if (!page) page = ctx.pages()[ctx.pages().length - 1];
  await page.goto('https://gemini.google.com/app', { waitUntil: 'domcontentloaded' });
  await sleep(4000);

  const imgInfo = () => page.evaluate(() =>
    [...document.querySelectorAll('img[src*="googleusercontent"], img[src*="lh3"], .generated-image img, response-element img')]
      .map((i) => ({ s: i.src, w: i.naturalWidth })));

  const before = (await imgInfo()).length;
  console.log('imgs before:', before);

  const editor = page.locator('.ql-editor[contenteditable="true"], rich-textarea .ql-editor, div[contenteditable="true"]').first();
  await editor.waitFor({ timeout: 20000 });
  const fileInput = page.locator('input[type="file"]');
  if (await fileInput.count()) {
    await fileInput.first().setInputFiles(REF);
  } else {
    await page.locator('button[aria-label*="pload"], button[aria-label*="image"], button[aria-label*="add" i]').first().click();
    await sleep(1000);
    await page.locator('input[type="file"]').first().setInputFiles(REF);
  }
  await sleep(5000);
  await editor.click();
  await editor.fill(PROMPT);
  await sleep(600);
  await page.keyboard.press('Enter');
  console.log('prompt sent');

  // wait until a NEW large img (naturalWidth>400) exists and src stable >=6s
  let lastSrc = '', stable = 0, good = null;
  for (let i = 0; i < 80; i++) {
    await sleep(3000);
    const info = await imgInfo();
    const big = info.filter((x) => x.w > 400).sort((a, b) => b.w - a.w)[0];
    if (big) {
      if (big.s === lastSrc) stable++; else { stable = 0; lastSrc = big.s; }
      if (stable >= 2) { good = big; break; }
    }
    if (i % 10 === 0) console.log(`wait ${i * 3}s n=${info.length} big=${big ? big.w : '-'} stable=${stable}`);
  }
  if (!good) {
    const info = await imgInfo();
    console.log('TIMEOUT imgs:', JSON.stringify(info.map((x) => ({ w: x.w, s: x.s.slice(-40) }))));
    throw new Error('no generated image');
  }
  console.log('harvest w=', good.w, good.s.slice(-50));
  let buf = null;
  for (const url of [good.s, fullRes(good.s), good.s + '=s2048']) {
    try {
      const r = await ctx.request.get(url, { timeout: 20000 });
      if (r.ok()) { const b = await r.body(); if (b.length > 20000) { buf = b; console.log('fetched via', url.slice(-60)); break; } }
    } catch (e) { console.log('fetch fail', url.slice(-40), e.message.slice(0, 60)); }
  }
  if (!buf) { // fallback: element screenshot at displayed res
    const el = page.locator(`img[src="${good.s}"]`).first();
    buf = await el.screenshot();
    console.log('fallback element screenshot');
  }
  fs.writeFileSync(`${OUT}/mock-01-sheet.png`, buf);
  console.log('SAVED', `${OUT}/mock-01-sheet.png`, buf.length, 'bytes');
} finally {
  try {
    if (targetId) {
      const cdp2 = await ctx.newCDPSession(ctx.pages()[0]);
      await cdp2.send('Target.closeTarget', { targetId });
    }
  } catch { /* best effort */ }
  await browser.close();
}
