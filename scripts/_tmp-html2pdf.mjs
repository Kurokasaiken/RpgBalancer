import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
const files = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage();
for (const f of files) {
  await page.goto(pathToFileURL(f).href);
  await page.pdf({ path: f.replace(/\.html$/, '.pdf'), format: 'A4', printBackground: true });
  console.log('PDF:', f.replace(/\.html$/, '.pdf'));
}
await browser.close();
