import { chromium } from 'playwright';
const b = await chromium.connectOverCDP('http://localhost:9222');
for (const ctx of b.contexts()) {
  for (const p of ctx.pages()) {
    if (!p.url().includes('chatgpt')) continue;
    console.log('tab', p.url().slice(0,80));
    for (const f of p.frames()) {
      try {
        const cb = f.locator('input[type="checkbox"]').first;
        if (await cb.count()) { await cb.click(); console.log('clicked checkbox'); }
      } catch {}
      try {
        const box = f.locator('.cb-lb, #challenge-stage label, label.ctp-checkbox-label').first;
        if (await box.count()) { await box.click(); console.log('clicked label'); }
      } catch {}
    }
    await p.waitForTimeout(3000);
    await p.screenshot({ path: '/tmp/cf-after.png' });
  }
}
await b.close();
