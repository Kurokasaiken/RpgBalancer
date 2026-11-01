import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
await p.goto('http://localhost:5173/hud-lab');
await p.waitForTimeout(16000);
const info = await p.evaluate(() => {
  const out = {};
  for (const el of document.querySelectorAll('[data-hud-lab-slot]')) {
    out[el.dataset.hudLabSlot] = {
      label: el.querySelector('span:nth-child(3)')?.textContent?.trim().slice(0, 50),
      imgs: el.querySelectorAll('img').length,
      hasReactSpike: el.innerHTML.includes('LE CASCATE') || el.innerHTML.includes('KAEL'),
    };
  }
  return out;
});
console.log(JSON.stringify(info, null, 1));
await b.close();
