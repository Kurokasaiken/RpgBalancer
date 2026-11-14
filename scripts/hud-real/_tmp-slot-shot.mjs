import { chromium } from 'playwright';
const b = await chromium.launch({args:['--enable-unsafe-swiftshader']});
const p = await b.newPage({viewport:{width:1400,height:2000}, deviceScaleFactor:3});
await p.goto('http://localhost:5173/bezel-variants', {waitUntil:'networkidle'});
await p.waitForTimeout(2500);
// capture the stock preset row (production bezel) and the zanara row
for (const name of ['stock','zanara']) {
  const el = p.locator(`[data-testid="bezel-row-${name}"]`);
  if (await el.count()) {
    await el.scrollIntoViewIfNeeded();
    await p.waitForTimeout(600);
    await el.screenshot({path:`/tmp/slot-${name}.png`});
    console.log('captured', name);
  } else console.log('missing', name);
}
await b.close();
