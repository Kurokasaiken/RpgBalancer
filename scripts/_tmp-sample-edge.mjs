import { chromium } from 'playwright';
const page = await (await chromium.launch()).newPage();
await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
const res = await page.evaluate(async () => {
  const img = new Image();
  img.src = '/assets/world/mappa2/base/layers/base_flat.webp';
  await img.decode();
  const c = document.createElement('canvas');
  c.width = img.width; c.height = img.height;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const band = 40;
  const zones = { top: [0, 0, c.width, band], bottom: [0, c.height - band, c.width, band], left: [0, 0, band, c.height], right: [c.width - band, 0, band, c.height], centerSea: [c.width*0.1, c.height*0.5, band, band] };
  const out = {};
  for (const [k, [x, y, w, h]] of Object.entries(zones)) {
    const d = ctx.getImageData(x, y, w, h).data;
    let r = 0, g = 0, b = 0, n = 0;
    for (let i = 0; i < d.length; i += 16) { r += d[i]; g += d[i+1]; b += d[i+2]; n++; }
    out[k] = `rgb(${Math.round(r/n)},${Math.round(g/n)},${Math.round(b/n)})`;
  }
  return { w: img.width, h: img.height, ...out };
});
console.log(JSON.stringify(res));
process.exit(0);
