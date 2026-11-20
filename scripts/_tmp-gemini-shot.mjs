import { chromium } from 'playwright';
const browser = await chromium.connectOverCDP('http://127.0.0.1:9222', { timeout: 60000 });
const ctx = browser.contexts()[0];
const page = ctx.pages().find(p => p.url().includes('gemini.google.com'));
if (!page) { console.error('no gemini tab'); process.exit(1); }
await page.screenshot({ path: 'test-results/slicekit/frame-smeraldo/stash-interior/gen/gemini-tab-state.png', fullPage: false });
const st = await page.evaluate(() => {
  const resps = [...document.querySelectorAll('MODEL-RESPONSE, model-response')];
  const last = resps[resps.length-1];
  const stop = [...document.querySelectorAll('button')].find(b => /stop|interrompi|ferma/i.test(b.getAttribute('aria-label')||''));
  const sendBtn = [...document.querySelectorAll('button')].map(b => b.getAttribute('aria-label')).filter(Boolean);
  return { nResp: resps.length, lastLen: last ? last.innerText.length : 0, stopBtn: !!stop, sendLabels: sendBtn.slice(-15) };
});
console.log(JSON.stringify(st, null, 1));
process.exit(0);
