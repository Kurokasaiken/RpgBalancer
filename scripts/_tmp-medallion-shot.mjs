import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 1600 } });
await p.goto('http://localhost:5173/bezel-variants', { waitUntil: 'domcontentloaded', timeout: 45000 });
await p.waitForTimeout(4000);
const h2 = await p.getByText('MEDAGLIONE BATTEZZATO');
if (h2) {
  await h2.scrollIntoViewIfNeeded();
  await p.waitForTimeout(600);
  const section = await h2.evaluateHandle(el => el.closest('section'));
  const box = await (await section.asElement()).boundingBox();
  if (box) await p.screenshot({ path: '/tmp/medallion-new.png', clip: box });
}
console.log('done');
await b.close();
