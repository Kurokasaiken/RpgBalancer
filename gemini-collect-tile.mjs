import { chromium } from 'playwright';
const [, , convUrl, out] = process.argv;
const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
const ctx = b.contexts()[0];
const p = ctx.pages().find(x => x.url().includes('gemini')) || ctx.pages()[0];
await p.goto(convUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForTimeout(9000);
// scroll to bottom
await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await p.waitForTimeout(3000);
// generated images: imgs whose src is googleusercontent or blob, inside response cards
const src = await p.evaluate(() => {
  const imgs = [...document.querySelectorAll('img')].filter(i => {
    const r = i.getBoundingClientRect();
    return r.width > 300 && (i.src.includes('googleusercontent') || i.src.startsWith('blob:'));
  });
  const last = imgs[imgs.length - 1];
  return last ? last.src : null;
});
console.log('gen-src:', (src || 'none').slice(0, 100));
if (src) {
  // download via CDP: fetch the blob/http in page context
  const data = await p.evaluate(async (u) => {
    const r = await fetch(u); const b = await r.blob();
    const ab = await b.arrayBuffer();
    return btoa(String.fromCharCode(...new Uint8Array(ab.slice(0, 8000000))));
  }, src).catch(() => null);
  if (data) { require('fs').writeFileSync(out, Buffer.from(data, 'base64')); console.log('SAVED fetch'); }
  else {
    // fallback: screenshot the img element
    const im = p.locator(`img[src="${src}"]`).first();
    await im.screenshot({ path: out });
    console.log('SAVED shot');
  }
}
process.exit(0);
