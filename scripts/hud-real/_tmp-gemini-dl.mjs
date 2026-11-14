import { chromium } from 'playwright';
import fs from 'fs';
const b = await chromium.connectOverCDP('http://localhost:9222');
const p = b.contexts()[0].pages().find(pg => pg.url().includes('gemini.google.com'));
const url = 'blob:https://gemini.google.com/4738ab21-481a-4014-9b35-5f7392ddd1cc';
const b64 = await p.evaluate(async (u) => {
  const r = await fetch(u);
  const buf = await r.arrayBuffer();
  let bin=''; const bytes=new Uint8Array(buf);
  for (let i=0;i<bytes.length;i+=8192) bin += String.fromCharCode.apply(null, bytes.subarray(i,i+8192));
  return btoa(bin);
}, url);
fs.writeFileSync('.mw/runs/20261110-chatgpt-ghiera/gen/gemini-dentini.png', Buffer.from(b64,'base64'));
console.log('saved', fs.statSync('.mw/runs/20261110-chatgpt-ghiera/gen/gemini-dentini.png').size);
process.exit(0);
