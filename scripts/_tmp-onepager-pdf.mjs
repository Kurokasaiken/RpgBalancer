import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--headless=new'] });
const p = await b.newPage();
await p.goto('file:///Users/faustoboni/progetti_personali/RPG/deliverables/uni-collab/one-pager.html');
await p.waitForTimeout(600);
await p.pdf({ path: 'deliverables/uni-collab/one-pager.pdf', format: 'A4', printBackground: true });
await b.close();
console.log('PDF ok');
