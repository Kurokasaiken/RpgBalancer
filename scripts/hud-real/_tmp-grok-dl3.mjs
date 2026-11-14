import { chromium } from 'playwright';
import fs from 'fs';
const b = await chromium.connectOverCDP('http://localhost:9222');
const p = b.contexts()[0].pages().filter(pg => pg.url().includes('grok.com')).pop();
const url = 'https://assets.grok.com/users/29da3c02-572c-46ac-a620-621f03aec1b0/generated/ff8e4a85-a748-4f6f-b8fd-1d3221946940/image.jpg';
const b64 = await p.evaluate(async (u) => {
  const r = await fetch(u, {credentials:'include'});
  const buf = await r.arrayBuffer();
  let bin=''; const bytes=new Uint8Array(buf);
  for (let i=0;i<bytes.length;i+=8192) bin += String.fromCharCode.apply(null, bytes.subarray(i,i+8192));
  return btoa(bin);
}, url);
fs.writeFileSync('.mw/runs/20261110-chatgpt-ghiera/gen/grok-denti-fini3.jpg', Buffer.from(b64,'base64'));
console.log('saved', fs.statSync('.mw/runs/20261110-chatgpt-ghiera/gen/grok-denti-fini3.jpg').size);
process.exit(0);
