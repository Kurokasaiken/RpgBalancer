import { chromium } from 'playwright';
import fs from 'node:fs';

const outDir = '/Users/faustoboni/progetti_personali/RPG/test-results/r386-events-bar';
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (error) => errors.push(String(error)));
page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
await page.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded', timeout: 45000 });
await page.waitForSelector('canvas', { timeout: 120000 }).catch(() => {});
try { await page.waitForSelector('[data-boot-phase]', { state: 'detached', timeout: 120000 }); } catch {}
await page.waitForTimeout(1800);
const probe = async (label) => {
  const info = await page.evaluate(() => {
    const rectOf = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height, right: r.right, bottom: r.bottom };
    };
    const events = document.querySelector('[data-testid="chrome-events"]');
    const button = document.querySelector('[data-hudreal-events-bar]');
    const resources = document.querySelector('[data-testid="chrome-resources"]');
    const time = document.querySelector('[data-testid="chrome-day-banner"]');
    const gem = document.querySelector('[data-events-gem-filter]');
    return {
      viewport: { w: innerWidth, h: innerHeight },
      eventsRect: rectOf(events),
      resourcesRect: rectOf(resources),
      timeRect: rectOf(time),
      button: button ? {
        eventId: button.getAttribute('data-event-id'),
        eventType: button.getAttribute('data-event-type'),
        gemTone: button.getAttribute('data-gem-tone'),
        count: button.getAttribute('data-events-count'),
        ariaExpanded: button.getAttribute('aria-expanded'),
        ariaLabel: button.getAttribute('aria-label'),
        title: button.querySelector('[data-events-bar-title]')?.textContent,
        type: button.querySelector('[data-events-bar-type]')?.textContent,
        countdown: button.querySelector('[data-events-bar-countdown]')?.textContent,
      } : null,
      gemFilter: gem ? getComputedStyle(gem).filter : null,
      overlapResourcesEvents: (() => {
        if (!events || !resources) return null;
        const a = events.getBoundingClientRect(); const b = resources.getBoundingClientRect();
        return Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
      })(),
    };
  });
  await page.screenshot({ path: `${outDir}/${label}-full.png`, fullPage: false });
  const clip = info.eventsRect ? { x: Math.max(0, info.eventsRect.x - 40), y: 0, width: Math.min(1440, info.eventsRect.w + 110), height: 120 } : undefined;
  if (clip) await page.screenshot({ path: `${outDir}/${label}-events-closeup.png`, clip });
  return info;
};
const before = await probe('before');
await page.click('[data-hudreal-events-bar]').catch(() => {});
await page.waitForTimeout(500);
const afterClick = await probe('after-click');
await page.click('[data-hudreal-events-bar]').catch(() => {});
await page.evaluate(() => window.__idleVillageTestHooks?.confirmInvasion?.());
await page.waitForTimeout(700);
const threat = await probe('threat');
await page.click('[data-hudreal-events-bar]').catch(() => {});
await page.waitForTimeout(500);
const threatOpen = await probe('threat-open');
console.log(JSON.stringify({ before, afterClick, threat, threatOpen, errors }, null, 2));
await browser.close();
if (errors.length) process.exitCode = 2;
