import { chromium } from 'playwright';
const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
const ctx = b.contexts()[0];
const p = await ctx.newPage();
await p.goto('https://gemini.google.com/app', {waitUntil:'commit', timeout:60000});
await p.waitForTimeout(6000);
await p.locator('button[aria-label*="Caricamento"]').first().click();
await p.waitForTimeout(1500);
const [fc] = await Promise.all([
  p.waitForEvent('filechooser', {timeout: 15000}),
  p.locator('button:has-text("File")').first().click(),
]);
await fc.setFiles(['/Users/faustoboni/Downloads/mappa2.jpeg','/tmp/mappa2-upscale-test/hero_waterfall_x4.png']);
await p.waitForTimeout(6000);
const prompt = `First image: a complete hand-painted fantasy game map — this is the STYLE REFERENCE, showing how the artist paints at normal view (soft gouache/oil brushwork, painterly forests, painterly water, painterly mountains). Second image: a closeup crop of ONE region of that same map (the waterfall + lake area), currently looking blurry because it is zoomed.

TASK: repaint ONLY the second image (the closeup) as if the same artist had painted that exact region at closeup resolution from the start — with the SAME brushwork language, SAME palette, SAME paint density and finish as the reference map, just with the natural extra strokes a painter would add at that zoom. Do NOT do cross-hatching, engraving lines, oil-pastel scratches or any unnatural stylization — match the soft blended gouache strokes of the reference. Preserve EXACTLY the composition: same coastline, river course, waterfall, tree positions, colors and lighting. No new objects, no moved shapes, no text, same aspect ratio.`;
const box = p.locator('div[contenteditable="true"], .ql-editor, textarea').first();
await box.click(); await p.keyboard.type(prompt, {delay: 1});
await p.waitForTimeout(800); await p.keyboard.press('Enter');
console.log('SUBMITTED');
await p.waitForTimeout(100000);
const imgs = await p.$$('img');
let best=null,ba=0;
for (const im of imgs){const bb=await im.boundingBox().catch(()=>null);if(bb&&bb.width*bb.height>ba){ba=bb.width*bb.height;best=im;}}
if(best){await best.screenshot({path:'/tmp/mappa2-upscale-test/hero_gemini_ref.png'});console.log('SAVED',Math.round(best ? (await best.boundingBox()).width : 0));}
console.log('URL', p.url());
await b.close();
