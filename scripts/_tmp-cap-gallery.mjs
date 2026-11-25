import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu'] });
const pg = await b.newPage({ viewport: { width: 1440, height: 2400 } });
await pg.goto('http://localhost:5173/icon-gallery', { waitUntil: 'networkidle', timeout: 45000 });
await pg.waitForTimeout(2500);
await pg.screenshot({ path: '.mw/runs/20261124-poi-nav-icone/gen/live-icon-gallery.png', fullPage: true });
await b.close();
console.log('done');
