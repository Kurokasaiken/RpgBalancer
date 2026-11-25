import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 300, height: 140 } });
await p.goto('file:///private/tmp/glyph-preview.html', { waitUntil: 'load' });
await p.screenshot({ path: '/tmp/glyph-preview.png' });
await b.close();
console.log('done');
