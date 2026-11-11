import { chromium } from 'playwright';
import { writeFileSync } from 'fs';
const b = await chromium.connectOverCDP('http://localhost:9222');
const ctx = b.contexts()[0];
const p = ctx.pages().filter(pg => pg.url().includes('gemini.google.com')).pop();
// scroll to bottom, find generated imgs
const data = await p.evaluate(async () => {
  const imgs = [...document.querySelectorAll('img')].filter(i => i.src.startsWith('blob:'));
  const last = imgs[imgs.length - 1];
  if (!last) return null;
  const r = await fetch(last.src); const buf = await r.arrayBuffer();
  return { b64: btoa(String.fromCharCode(...new Uint8Array(buf))), w: last.naturalWidth, h: last.naturalHeight };
});
if (data) {
  writeFileSync('/Users/faustoboni/progetti_personali/RPG/.mw/runs/20261110-chatgpt-ghiera/gen/gemini-ghiera-v2.png', Buffer.from(data.b64, 'base64'));
  console.log('saved', data.w, 'x', data.h);
} else console.log('no blob img');
