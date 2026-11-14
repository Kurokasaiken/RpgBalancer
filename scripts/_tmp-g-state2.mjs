import { chromium } from 'playwright';
const browser = await chromium.connectOverCDP('http://127.0.0.1:9222', { timeout: 90000 });
const pages = browser.contexts()[0].pages();
const gem = pages.filter(p => p.url().includes('gemini.google.com'));
console.log('gemini tabs:', gem.length);
for (const p of gem) console.log(' -', p.url().slice(0, 80));
const last = gem.filter(p => /\/app$|\/app\//.test(p.url())).pop() ?? gem[gem.length-1];
if (last) {
  await last.screenshot({ path: 'test-results/gemini-state2.png' });
  const info = await last.evaluate(() => ({
    editor: !!document.querySelector('.ql-editor, div[contenteditable="true"]'),
    textbox: !!document.querySelector('[role="textbox"]'),
    title: document.title,
    bodyText: document.body.innerText.slice(0, 300),
  }));
  console.log(JSON.stringify(info, null, 1));
}
process.exit(0);
