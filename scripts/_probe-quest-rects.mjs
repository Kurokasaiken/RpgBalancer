import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true, args: ['--use-angle=metal'] });
const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
await p.goto('http://localhost:5173/quest-window-lab?seed=42', { waitUntil: 'domcontentloaded' });
await p.getByRole('button', { name: /Avvia quest goblin|Start goblin quest/ }).click();
await p.locator('[data-testid="quest-window"]').waitFor();
const dump = async (tag) => {
  const info = await p.evaluate(() => {
    const pl = document.querySelector('[data-testid="quest-window"]');
    if (!pl) return null;
    const r = pl.getBoundingClientRect();
    const kids = [...pl.children].map((c) => {
      const cr = c.getBoundingClientRect();
      return { tag: c.tagName, testid: c.getAttribute('data-testid'), top: Math.round(cr.top - r.top), bottom: Math.round(cr.bottom - r.top), h: Math.round(cr.height), shrinks: getComputedStyle(c).flexShrink + '/' + getComputedStyle(c).minHeight };
    });
    return { plaqueH: Math.round(r.height), scrollH: pl.scrollHeight, clientH: pl.clientHeight, kids };
  });
  if (!info) { console.log(tag, 'GONE'); return false; }
  console.log('===', tag, 'plaqueH', info.plaqueH, 'scrollH', info.scrollH);
  for (const k of info.kids) console.log('   ', k.tag, k.testid ?? '', `top ${k.top} bottom ${k.bottom}`, k.shrinks);
  return info.scrollH > info.clientH + 2;
};
for (let step = 0; step < 14; step++) {
  const overflow = await dump(`step ${step}`);
  if (overflow) break;
  // press first enabled numbered choice like the bot
  const pressed = await p.evaluate(() => {
    const btns = [...document.querySelectorAll('[data-hud-choices] button[data-skin="choice"]')].filter(b => !b.disabled);
    return btns.length;
  });
  if (!pressed) {
    // wait out beat/pending, clicking THROW if armed
    const deadline = Date.now() + 30000;
    while (Date.now() < deadline) {
      const st = await p.evaluate(() => ({
        beat: !!document.querySelector('[data-testid="quest-window-beat"]'),
        armed: !!document.querySelector('.da-tira'),
        ch: [...document.querySelectorAll('[data-hud-choices] button[data-skin="choice"]')].filter(b=>!b.disabled).length,
        gone: !document.querySelector('[data-testid="quest-window"]'),
      }));
      if (st.gone) break;
      if (st.armed) await p.locator('.da-tira').click().catch(()=>{});
      if (st.ch) break;
      await p.waitForTimeout(400);
    }
    continue;
  }
  await p.keyboard.press('1');
  await p.waitForTimeout(700);
}
await b.close();
