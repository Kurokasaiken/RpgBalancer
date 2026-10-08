/**
 * Temporary playtest driver (R-106 iter 3): plays the goblin quest in the
 * /game QuestRunWindow, screenshotting the window at every step and dumping a
 * transcript of what the player sees. Not part of the app — delete after use.
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const OUT = process.env.OUT ?? 'test-results/quest-window-play';
mkdirSync(OUT, { recursive: true });

/** Picks which numbered option to press at each step: a "reasonable player". */
const pick = (labels: string[]): number => {
  const prefer = [/Arrampicarsi/, /Prendere il bottino/, /Furtiv|silenzio|Stealth/i, /Incalz|Insegu/i, /Frugare|Cercare ancora/i, /Combatti/];
  for (const re of prefer) {
    const i = labels.findIndex((l) => re.test(l));
    if (i >= 0) return i;
  }
  return 0;
};

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist', '--enable-gpu'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.querySelectorAll('button').length > 3, null, { timeout: 90000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `${OUT}/00-game.png`, timeout: 90000 });

  let start = page.getByRole('button', { name: /Avvia quest goblin|Start goblin quest/ });
  if (!(await start.count())) {
    await page.keyboard.press('F10');
    await page.waitForTimeout(800);
    start = page.getByRole('button', { name: /Avvia quest goblin|Start goblin quest/ });
  }
  await start.first().click();
  const win = page.locator('[data-testid="quest-window"]');
  await win.waitFor({ timeout: 10000 });
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/01-full.png`, timeout: 90000 });

  const transcript: unknown[] = [];
  for (let step = 0; step < 60; step++) {
    if (!(await win.count())) {
      await page.screenshot({ path: `${OUT}/vanished.png`, timeout: 90000 });
      const info = await page.evaluate(() => ({ testids: [...document.querySelectorAll('[data-testid]')].map((e) => e.getAttribute('data-testid')).filter((x) => /quest/.test(x ?? '')), body: document.body.innerText.slice(0, 600) }));
      writeFileSync(`${OUT}/vanished.json`, JSON.stringify(info, null, 2));
      break;
    }
    const snap = await win.evaluate((el) => {
      const ps = [...el.querySelectorAll('p')].map((p) => p.textContent?.trim() ?? '');
      const caption = el.querySelector('[style*="aspect-ratio"] div:last-child')?.textContent?.trim() ?? '';
      const choices = [...el.querySelectorAll('[data-hud-choices] button[data-skin="choice"]')]
        .map((b) => b.textContent?.replace(/\s+/g, ' ').trim() ?? '')
        .filter((t) => t && t.length > 1);
      const tiles = [...el.querySelectorAll('ol li')].map((li) => li.textContent?.trim() ?? '');
      const time = [...el.querySelectorAll('[role="progressbar"]')].map((b) => b.getAttribute('aria-valuenow'));
      return { ps, caption, choices, tiles, time };
    });
    await win.screenshot({ path: `${OUT}/step-${String(step).padStart(2, '0')}.png`, timeout: 90000 });
    const real = snap.choices.filter((c) => !/Riduci|Chiudi$|Close$/.test(c));
    transcript.push({ step, ...snap });
    writeFileSync(`${OUT}/transcript.json`, JSON.stringify(transcript, null, 2));
    if (real.some((c) => /Chiudi il rapporto|Close the report/.test(c))) break;
    const idx = pick(real.map((c) => c.replace(/^\d+\.\s*/, '')));
    const t0 = Date.now();
    await page.keyboard.press(String(idx + 1));
    await page.waitForTimeout(400);
    (transcript[transcript.length - 1] as Record<string, unknown>).pressed = real[idx];
    (transcript[transcript.length - 1] as Record<string, unknown>).msToSettle = Date.now() - t0;
  }
  writeFileSync(`${OUT}/transcript.json`, JSON.stringify(transcript, null, 2));
  await browser.close();
  console.log(`steps: ${transcript.length}`);
})();
