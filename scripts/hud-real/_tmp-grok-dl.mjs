import { chromium } from 'playwright';
import fs from 'fs';
const b = await chromium.connectOverCDP('http://localhost:9222');
const ctx = b.contexts()[0];
const p = ctx.pages().filter(pg => pg.url().includes('grok.com')).pop();
const url = 'https://assets.grok.com/users/29da3c02-572c-46ac-a620-621f03aec1b0/generated/df7c8210-59b9-4bcf-846a-18d80962491c/image.jpg';
// try in-page fetch first
const b64 = await p.evaluate(async (u) => {
  try {
    const r = await fetch(u, {credentials:'include'});
    if (!r.ok) return 'ERR:'+r.status;
    const buf = await r.arrayBuffer();
    let bin=''; const bytes=new Uint8Array(buf);
    for (let i=0;i<bytes.length;i+=8192) bin += String.fromCharCode.apply(null, bytes.subarray(i,i+8192));
    return 'OK:'+btoa(bin);
  } catch(e){ return 'ERR:'+e.message; }
}, url);
if (b64.startsWith('OK:')) {
  fs.writeFileSync('.mw/runs/20261110-chatgpt-ghiera/gen/grok-denti-fini.jpg', Buffer.from(b64.slice(3),'base64'));
  console.log('saved', fs.statSync('.mw/runs/20261110-chatgpt-ghiera/gen/grok-denti-fini.jpg').size);
} else {
  console.log('fetch failed:', b64);
  // fallback: screenshot the img element
  const img = p.locator(`img[src*="${'df7c8210-59b9-4bcf-846a-18d80962491c'}"]`).first();
  await img.screenshot({path:'.mw/runs/20261110-chatgpt-ghiera/gen/grok-denti-fini-shot.png'});
  console.log('screenshot saved');
}
process.exit(0);
