/* TMP probe — DEF-06 browser HUD zoom verification (headless). */
import { chromium } from 'playwright';

const BASE = 'http://localhost:5173';

interface Rect { x: number; y: number; w: number; h: number; r: number; b: number; cx: number }

const probe = async (viewport: { width: number; height: number }, mode: string) => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(`${BASE}/game`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForSelector('[data-testid="hud-hide-toggle"], .game-frame', { timeout: 30000 }).catch(() => undefined);
  await page.waitForTimeout(1800);

  // Set mode through the persistence-backed control: open menu, click radio.
  if (mode !== 'auto') {
    // Drive the UI: open the game menu (aria-haspopup="menu" button), pick the radio.
    const menuBtn = page.locator('[data-hud-controls] button[aria-haspopup="menu"]').first();
    if (await menuBtn.count()) {
      await menuBtn.click().catch(() => undefined);
      await page.waitForTimeout(400);
      const pct = mode === '1' ? '100' : mode === '1.25' ? '125' : mode === '1.5' ? '150' : '200';
      const opt = page.locator(`[role="menuitemradio"]`, { hasText: `${pct}%` }).first();
      if (await opt.count()) await opt.click().catch(() => undefined);
      await page.waitForTimeout(600);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    } else {
      console.log('  !! menu button not found');
    }
  }

  const m = await page.evaluate(`(() => {
    const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect();
      return { x: +b.x.toFixed(1), y: +b.y.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1), r: +b.right.toFixed(1), b: +b.bottom.toFixed(1), cx: +(b.x + b.width/2).toFixed(1) }; };
    const toggle = document.querySelector('[data-testid="hud-hide-toggle"]');
    const zoomLayer = document.querySelector('[data-hud-zoom-layer]');
    const nav = document.querySelector('[data-testid="game-nav"], nav, [data-hud-panel="nav"]');
    // bottom nav: find centered element near bottom
    let navEl = nav;
    if (!navEl) {
      const cands = [...document.querySelectorAll('body *')].filter(e => {
        const b = e.getBoundingClientRect(); return b.bottom > window.innerHeight - 90 && b.width > 300 && b.width < window.innerWidth * 0.8 && b.height > 20 && b.height < 120;
      });
      navEl = cands[0] ?? null;
    }
    const hit = toggle ? (() => { const b = toggle.getBoundingClientRect();
      const el = document.elementFromPoint(b.x + b.width/2, b.y + b.height/2);
      return el ? (toggle.contains(el) || el.contains(toggle)) : false; })() : null;
    return {
      vw: window.innerWidth, vh: window.innerHeight,
      zoomAttr: zoomLayer ? getComputedStyle(zoomLayer).zoom : null,
      toggle: r(toggle), nav: r(navEl), hit,
      canvas: r(document.querySelector('canvas')),
    };
  })()`);
  const shot = `test-results/plan-043/ws5/zoom-${viewport.width}x${viewport.height}-${String(mode).replace('.', '_')}.png`;
  await page.screenshot({ path: shot });
  await browser.close();
  console.log(`== ${viewport.width}x${viewport.height} mode=${mode}`);
  console.log(JSON.stringify(m), '| errors:', errors.slice(0, 3));
};

const arg = process.argv[2] ?? '2560';
const main = async () => {
  if (arg === 'all') {
    await probe({ width: 1366, height: 768 }, 'auto');
    await probe({ width: 1920, height: 1080 }, 'auto');
    await probe({ width: 2560, height: 1440 }, 'auto');
    await probe({ width: 2560, height: 1440 }, '1');
    await probe({ width: 2560, height: 1440 }, '2');
  } else {
    await probe({ width: 2560, height: 1440 }, 'auto');
  }
};
void main();
