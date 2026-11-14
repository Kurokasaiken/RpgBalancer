import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const pg = await (await b.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true })).newPage();
await pg.goto('http://localhost:5199/game', { waitUntil: 'domcontentloaded' });
await pg.waitForSelector('[data-hudslot="time"]', { timeout: 120000 });
await pg.waitForTimeout(3000);
const out = await pg.evaluate(() => {
  const dump = (slot) => {
    const el = document.querySelector(`[data-hudslot="${slot}"]`);
    if (!el) return null;
    const walk = (n, d) => d > 4 ? [] : [...n.children].flatMap(c => {
      const r = c.getBoundingClientRect();
      return [{ tag: c.tagName, cls: (c.className.baseVal ?? c.className ?? '').toString().slice(0, 60), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }, ...walk(c, d + 1)];
    });
    const r = el.getBoundingClientRect();
    return { slotRect: { w: Math.round(r.width), h: Math.round(r.height) }, offset: { w: el.offsetWidth, h: el.offsetHeight }, kids: walk(el, 0) };
  };
  return { time: dump('time'), resources: dump('resources') };
});
console.log(JSON.stringify(out, null, 1));
await b.close();
