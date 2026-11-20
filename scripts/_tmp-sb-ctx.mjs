/* TEMP: mount scroll-band candidates on the REAL roster panel (DOM injection,
 * no code change), capture each variant in context at 1440x900 DPR2. */
import { chromium } from 'playwright';

const CSS = `
  .sbb-band { position:absolute; top:0; bottom:0; right:6px; width:14px; z-index:30; pointer-events:none; }
  .sbb-well { position:absolute; inset:0; border-radius:8px;
    background: linear-gradient(180deg,#04141a 0%,#071e26 50%,#04141a 100%);
    box-shadow: inset 0 2px 4px rgba(0,0,0,.85), inset 0 -1px 1px rgba(216,189,120,.14), 0 0 0 1px rgba(0,0,0,.55); }
  .sbb-well::before,.sbb-well::after{content:'';position:absolute;top:4px;bottom:4px;width:1px;
    background:linear-gradient(180deg,transparent,rgba(216,189,120,.38),transparent);}
  .sbb-well::before{left:1.5px}.sbb-well::after{right:1.5px}
  .sbb-thumbA{position:absolute;left:2px;right:2px;border-radius:6px;
    background:radial-gradient(circle at 50% 0%,rgba(255,240,200,.20) 0%,transparent 55%),linear-gradient(180deg,#2c7683 0%,#1b5360 52%,#113743 100%);
    box-shadow:inset 0 0 0 1px rgba(216,189,120,.55),inset 0 1px 0 rgba(255,255,255,.22),inset 0 -2px 3px rgba(0,0,0,.5),0 1px 3px rgba(0,0,0,.6);}
  .sbb-thumbA::after{content:'';position:absolute;left:3px;right:3px;top:50%;height:1px;background:rgba(216,189,120,.45);box-shadow:0 -4px 0 rgba(216,189,120,.22),0 4px 0 rgba(216,189,120,.22);}
  .sbb-thumbB{position:absolute;left:2px;right:2px;border-radius:6px;
    background:linear-gradient(90deg,rgba(255,255,255,.14),transparent 30%,transparent 70%,rgba(0,0,0,.28)),linear-gradient(180deg,#d8bd78 0%,#c2a355 42%,#a0762f 78%,#71501f 100%);
    box-shadow:inset 0 0 0 1px rgba(60,38,10,.6),inset 0 1px 0 rgba(255,240,200,.5),inset 0 -2px 3px rgba(60,38,10,.65),0 1px 3px rgba(0,0,0,.65);}
  .sbb-thumbB::after{content:'';position:absolute;left:3px;right:3px;top:50%;height:1px;background:rgba(60,38,10,.55);box-shadow:0 -4px 0 rgba(60,38,10,.35),0 4px 0 rgba(60,38,10,.35),0 -4.5px 0 rgba(255,240,200,.25),0 4.5px 0 rgba(255,240,200,.25);}
  .sbb-stud{position:absolute;left:50%;transform:translateX(-50%);width:8px;height:8px;border-radius:50%;
    background:radial-gradient(circle at 35% 30%,#e8d094,#a0762f 70%,#5f3f16);
    box-shadow:0 1px 2px rgba(0,0,0,.7),inset 0 -1px 1px rgba(60,38,10,.6);}
  .sbb-stud.top{top:3px}.sbb-stud.bot{bottom:3px}
  .sbb-channel{position:absolute;left:6px;top:0;bottom:0;width:2px;
    background:linear-gradient(180deg,rgba(216,189,120,.30),rgba(216,189,120,.14),rgba(216,189,120,.30));
    box-shadow:0 0 0 1px rgba(0,0,0,.4),inset 0 2px 3px rgba(0,0,0,.7);border-radius:1px;}
  .sbb-loz{position:absolute;left:50%;width:10px;height:10px;transform:translate(-50%,-50%) rotate(45deg);border-radius:2px;
    background:radial-gradient(circle at 35% 30%,rgba(255,255,255,.35),transparent 50%),linear-gradient(135deg,#2c7683 0%,#1b5360 55%,#0f3844 100%);
    box-shadow:inset 0 0 0 1px rgba(216,189,120,.75),0 0 6px rgba(60,170,170,.45),0 1px 2px rgba(0,0,0,.7);}
  .sbb-loz::after{content:'';position:absolute;inset:2.5px;border-radius:1px;background:linear-gradient(135deg,#0f3844,#2c7683);}
`;

const VARIANTS = {
  A: (t) => `<div class="sbb-band"><div class="sbb-well"></div><div class="sbb-thumbA" style="top:${t.top}%;height:${t.h}%"></div></div>`,
  B: (t) => `<div class="sbb-band"><div class="sbb-well"></div><div class="sbb-stud top"></div><div class="sbb-thumbB" style="top:${t.top}%;height:${t.h}%"></div><div class="sbb-stud bot"></div></div>`,
  C: (t) => `<div class="sbb-band"><div class="sbb-channel"></div><div class="sbb-loz" style="top:${t.top + t.h / 2}%"></div></div>`,
};

const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await page.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded', timeout: 90000 });
await page.waitForSelector('canvas', { state: 'attached', timeout: 60000 }).catch(() => {});
await page.locator('text=Raising the islands').waitFor({ state: 'detached', timeout: 90000 }).catch(() => {});
await page.waitForTimeout(5000);
await page.keyboard.press('r');
const panel = page.locator('[data-testid="resident-roster-panel"]');
await panel.waitFor({ state: 'visible', timeout: 20000 });
await page.waitForTimeout(1500);
const list = panel.locator('[data-resident-count]');
await list.evaluate((el) => { el.style.scrollBehavior = 'auto'; el.scrollTop = 30; });
await page.addStyleTag({ content: CSS });

for (const v of ['A', 'B', 'C']) {
  await page.evaluate((v) => {
    document.querySelectorAll('.sbb-band').forEach((n) => n.remove());
    const list = document.querySelector('[data-resident-count]');
    const host = list.parentElement;
    host.style.position = 'relative';
    const ratio = list.clientHeight / list.scrollHeight;
    const top = (list.scrollTop / (list.scrollHeight - list.clientHeight)) * (100 - ratio * 100);
    const lb = list.getBoundingClientRect(), hb = host.getBoundingClientRect();
    const el = document.createElement('div');
    el.className = 'sbb-band';
    if (v === 'A') el.innerHTML = `<div class="sbb-well"></div><div class="sbb-thumbA" style="top:${top}%;height:${ratio * 100}%"></div>`;
    if (v === 'B') el.innerHTML = `<div class="sbb-well"></div><div class="sbb-stud top"></div><div class="sbb-thumbB" style="top:${top}%;height:${ratio * 100}%"></div><div class="sbb-stud bot"></div>`;
    if (v === 'C') el.innerHTML = `<div class="sbb-channel"></div><div class="sbb-loz" style="top:${top + ratio * 50}%"></div>`;
    el.style.top = `${lb.top - hb.top + 4}px`;
    el.style.bottom = `${hb.bottom - lb.bottom + 4}px`;
    host.appendChild(el);
  }, v);
  await page.waitForTimeout(250);
  const pbox = await panel.boundingBox();
  await page.screenshot({ path: `.mw/runs/20261120-scroll-band/captures/ctx-roster-${v}.png`,
    clip: { x: pbox.x - 10, y: pbox.y - 10, width: pbox.width + 20, height: pbox.height + 20 } });
  await page.screenshot({ path: `.mw/runs/20261120-scroll-band/captures/ctx-full-${v}.png` });
}
await browser.close();
console.log('done');
