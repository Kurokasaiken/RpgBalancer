import { chromium } from 'playwright';
const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
const ctx = b.contexts()[0];
const pages = ctx.pages();
console.log('before:', pages.length);
// keep the FIRST gemini tab (Director's original session); close the rest + about:blank
let kept = false;
for (const p of pages) {
  const u = p.url();
  if (u === 'about:blank') { try { await p.close(); } catch {} }
  else if (u.includes('gemini.google.com/app')) {
    if (kept) { try { await p.close(); console.log('closed dup gemini'); } catch {} }
    else { kept = true; console.log('keep gemini:', u.slice(0, 60)); }
  }
}
console.log('after:', ctx.pages().length);
process.exit(0);
