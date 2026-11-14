import { chromium } from 'playwright';
const b = await chromium.launch({args:['--enable-unsafe-swiftshader']});
const p = await b.newPage({viewport:{width:500,height:500}, deviceScaleFactor:3});
await p.goto('http://localhost:5173/bezel-variants', {waitUntil:'networkidle'});
await p.waitForTimeout(2500);
// the isolated baptized medallion in the reference panel (first C1Medallion instance)
const el = p.locator('img[src*="ring-fused"]').first();
await el.scrollIntoViewIfNeeded();
await p.waitForTimeout(600);
const box = await el.boundingBox();
// capture a bit larger than the img to include full ornament
const pad = 6;
await p.screenshot({
  path: '.mw/runs/20261110-chatgpt-ghiera/medaglione-battezzato-completo.png',
  clip: {x: Math.max(0,box.x-pad), y: Math.max(0,box.y-pad), width: box.width+pad*2, height: box.height+pad*2},
  omitBackground: false,
});
console.log('box', JSON.stringify(box));
await b.close();
