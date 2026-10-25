import { chromium } from 'playwright';
const dir = '.mw/ui-catalog/components/hud-top-tabs/mockups';
const b = await chromium.launch({ headless: true });
const pg = await b.newPage({ viewport: { width: 1440, height: 320 } });
for (const n of ['P1-brace', 'P2-regolo', 'P3-appese', 'D-ruled', 'D2-learned', 'D3-carestia', 'E-bigday']) {
  await pg.goto(`file://${process.cwd()}/${dir}/${n}.html`);
  await pg.waitForTimeout(300);
  await pg.screenshot({ path: `${dir}/${n}.png` });
  console.log(n, 'ok');
}
await b.close();
