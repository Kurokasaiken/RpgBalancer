import { chromium } from 'playwright';
const browser = await chromium.connectOverCDP('http://127.0.0.1:9222', { timeout: 60000 });
const ctx = browser.contexts()[0];
const page = ctx.pages().find(p => p.url().includes('gemini.google.com'));
if (!page) { console.error('no gemini tab'); process.exit(1); }
const st = await page.evaluate(() => {
  const resps = document.querySelectorAll('MODEL-RESPONSE, model-response').length;
  const msgs = document.querySelectorAll('USER-QUERY, user-query, .user-query').length;
  const ed = document.querySelector('.ql-editor, div[contenteditable="true"]');
  const pending = !!document.querySelector('[class*="loading"], [class*="thinking"], mat-progress-spinner, .progress-indicator');
  const lastResp = [...document.querySelectorAll('MODEL-RESPONSE, model-response')].pop();
  return { resps, msgs, editorTxt: ed ? ed.innerText.slice(0,80) : null, pending, lastRespHead: lastResp ? lastResp.innerText.slice(0,120) : null };
});
console.log(JSON.stringify(st, null, 1));
process.exit(0);
