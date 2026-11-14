import { chromium } from 'playwright';
const b = await chromium.connectOverCDP('http://localhost:9222');
const p = b.contexts()[0].pages().filter(pg => pg.url().includes('grok.com')).pop();
// find the visible composer
const box = p.locator('textarea:visible, [contenteditable="true"]:visible').first();
await box.click({timeout:10000});
const msg = `Wrong output — that's a landscape, not what I asked. Please GENERATE AN IMAGE of the object described in my previous message: a single ornate circular mechanical bezel/clutch ring (game UI asset), antique matte bronze, dark emerald enamel band, FOUR THIN ELEGANT CLAW TEETH on the diagonals (X formation), small round hinge pins, an emerald gem at 12 o'clock, empty circular hole in the center, plain dark background, straight-on top view, no callouts, no text. Rich AAA sculptural quality like the reference images I attached.`;
await box.fill(msg);
await p.keyboard.press('Enter');
console.log('sent, waiting...');
await p.waitForTimeout(70000);
await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await p.waitForTimeout(3000);
await p.screenshot({path:'/tmp/grok-tail2.png'});
const srcs = await p.evaluate(() => [...document.querySelectorAll('img')].map(i=>({src:i.src.slice(0,160),w:i.naturalWidth})).filter(i=>i.src.includes('generated')));
console.log(JSON.stringify(srcs));
process.exit(0);
