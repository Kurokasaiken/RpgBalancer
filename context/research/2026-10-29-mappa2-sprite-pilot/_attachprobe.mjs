import { chromium } from 'playwright';
const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
const ctx = b.contexts()[0];
const page = ctx.pages().find(p => p.url().includes('0b99710d00e37e5e')) || ctx.pages()[0];
console.log('page:', page.url());
// pulisci chip stale
for (const btn of await page.locator('button[aria-label*="chiudi allegato" i]:visible').all()) {
  await btn.click().catch(()=>{}); await page.waitForTimeout(300);
}
// attach diretto
const inputs = page.locator('input[type="file"]');
const n = await inputs.count();
console.log('file inputs:', n);
if (n) {
  await inputs.nth(0).setInputFiles('/Users/faustoboni/progetti_personali/RPG/context/research/2026-10-29-mappa2-sprite-pilot/refs/villaggio-rb.jpg');
  await page.waitForTimeout(8000);
  // dump del contenitore anteprime
  const dump = await page.evaluate(() => {
    const box = document.querySelector('div[contenteditable="true"], .ql-editor');
    const root = box ? (box.closest('form') || box.parentElement.parentElement.parentElement.parentElement) : document.body;
    const out = [];
    root.querySelectorAll('*').forEach(e => {
      const al = e.getAttribute('aria-label');
      const cls = e.className && typeof e.className === 'string' ? e.className : '';
      if ((al && /allegat|attach|error|riprova|file|immagine|image/i.test(al)) || /error|warn|fail/i.test(cls)) {
        if (e.offsetParent !== null) out.push(`${e.tagName}.${cls.slice(0,60)} aria="${(al||'').slice(0,80)}" txt="${(e.textContent||'').trim().slice(0,60)}"`);
      }
    });
    return out.slice(0, 25);
  });
  console.log(JSON.stringify(dump, null, 1));
  await page.screenshot({ path: '/tmp/attachprobe.png', clip: {x:0,y:300,width:900,height:700} }).catch(async()=>{ await page.screenshot({path:'/tmp/attachprobe.png'}); });
}
await b.close();
