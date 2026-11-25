import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu'] });
const pg = await b.newPage({ viewport: { width: 1440, height: 900 } });
await pg.goto('http://localhost:5173/poi-marker-lab', { waitUntil: 'domcontentloaded', timeout: 30000 });
await pg.waitForTimeout(6000);
await pg.screenshot({ path: '.mw/runs/20261124-poi-nav-icone/gen/emblems2/markerlab.png' });
await b.close();
console.log('done');
