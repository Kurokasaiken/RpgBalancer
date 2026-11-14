import { chromium } from 'playwright';
import { writeFileSync } from 'fs';
import { createHash } from 'crypto';
const b = await chromium.connectOverCDP('http://localhost:9222');
const ctx = b.contexts()[0];
const p = ctx.pages().filter(pg => pg.url().includes('chatgpt.com')).pop();
if (!p) { console.log('no chatgpt tab'); process.exit(1); }
// generated images: images.openai.com or blob
const srcs = await p.evaluate(() =>
  [...document.querySelectorAll('img')].map(i => i.src).filter(s => s && (s.includes('openai') || s.startsWith('blob:'))).slice(-12)
);
console.log(srcs.join('\n'));
// download the last few via authenticated request context
const req = ctx.request;
let n = 0;
for (const s of srcs.slice(-4)) {
  try {
    const r = await req.get(s, {timeout: 30000});
    if (r.ok()) {
      const buf = await r.body();
      const h = createHash('md5').update(buf).digest('hex').slice(0,8);
      writeFileSync(`/Users/faustoboni/progetti_personali/RPG/.mw/runs/20261110-chatgpt-ghiera/gen/v5-${n}-${h}.png`, buf);
      console.log('saved v5-'+n, buf.length);
      n++;
    }
  } catch(e) { console.log('fail', s.slice(0,60), String(e).slice(0,80)); }
}
