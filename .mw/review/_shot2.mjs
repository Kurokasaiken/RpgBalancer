import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1200, height: 1400 } });
await p.goto('http://127.0.0.1:5199/', { waitUntil: 'networkidle', timeout: 20000 });
await p.evaluate(() => { document.querySelector('details.q')?.setAttribute('open',''); document.querySelectorAll('details.q')[1]?.setAttribute('open',''); });
await p.screenshot({ path: '/tmp/review-open-q.png' });
await b.close(); console.log('ok');
