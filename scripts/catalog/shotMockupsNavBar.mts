import { chromium } from 'playwright';
const dir = '.mw/ui-catalog/components/nav-bar/mockups';
const b = await chromium.launch({ headless: true });
const pg = await b.newPage({ viewport: { width: 1440, height: 360 } });
for (const n of ['M1-dock-equal', 'M2-sealed-doors', 'M3-brass-rail']) {
  await pg.goto(`file://${process.cwd()}/${dir}/${n}.html`);
  await pg.waitForTimeout(300);
  await pg.screenshot({ path: `${dir}/${n}.png` });
  console.log(n, 'ok');
}
await b.close();
