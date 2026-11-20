import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://localhost:5173/hud-compose?comp=cassetto&poi=poi-goblin', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForSelector('[data-testid="expedition-drawer"]', { timeout: 30000 }).catch(() => null);
const exp = await p.$('[data-testid="expedition-drawer-expand"]');
if (exp) { await exp.click(); await p.waitForTimeout(1000); }
const info = await p.evaluate(() => {
  const c = document.querySelector('[data-hudreal-cassetto]');
  if (!c) return { missing: 'cassetto' };
  return {
    roleGlyphs: c.querySelectorAll('[data-layer="role-glyph"]').length,
    slotButtons: c.querySelectorAll('[data-testid^="slot-button-"]').length,
    tokens: c.querySelectorAll('[data-testid^="slot-token-"]').length,
    medals: c.querySelectorAll('[data-layer="medal"]').length,
    seatTexts: Array.from(c.querySelectorAll('[data-slot-id]')).map((e) => e.textContent?.slice(0, 40)),
    bagEmptyIcons: c.querySelectorAll('[data-cassetto-vignette]').length,
    pouchIcons: Array.from(c.querySelectorAll('[data-engraved]')).map((e) => e.getAttribute('data-engraved')).slice(0, 12),
    riskCell: c.querySelector('[data-testid="cassetto-risk-value"]')?.textContent,
    deathPct: c.querySelector('[data-testid="cassetto-death-pct"]')?.textContent ?? null,
    successPct: c.querySelector('[data-testid="cassetto-success-pct"]')?.textContent ?? null,
  };
});
console.log(JSON.stringify(info, null, 1));
await b.close();
