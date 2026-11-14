import { chromium } from 'playwright';
import { writeFileSync } from 'fs';
const b = await chromium.connectOverCDP('http://localhost:9222');
const ctx = b.contexts()[0];
const p = ctx.pages().filter(pg => pg.url().includes('chatgpt.com')).pop();
const datas = await p.evaluate(async () => {
  const imgs = [...document.querySelectorAll('img')].filter(i => i.src.startsWith('blob:') && i.naturalWidth > 200);
  const out = [];
  for (const im of imgs) {
    try {
      const c = document.createElement('canvas');
      c.width = im.naturalWidth; c.height = im.naturalHeight;
      const g = c.getContext('2d'); g.drawImage(im, 0, 0);
      out.push({d: c.toDataURL('image/png'), w: im.naturalWidth, h: im.naturalHeight});
    } catch(e) { out.push({err: String(e).slice(0,60)}); }
  }
  return out;
});
let n = 0;
for (const d of datas) {
  if (d.d) { writeFileSync(`/Users/faustoboni/progetti_personali/RPG/.mw/runs/20261110-chatgpt-ghiera/gen/v5-${n}.png`, Buffer.from(d.d.split(',')[1],'base64')); console.log('saved', n, d.w+'x'+d.h); n++; }
  else console.log('err', d.err);
}
