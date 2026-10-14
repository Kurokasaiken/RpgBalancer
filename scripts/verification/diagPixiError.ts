/**
 * diagPixiError — diagnostica R-192: quando scatta il pageerror Pixi
 * RenderTargetSystem.push su /game e cosa succede al canvas in quel momento.
 *
 * Strumenta:
 *  - timestamp di ogni pageerror / console.error
 *  - MutationObserver sul canvas pixi-world-canvas (add/remove = remount = destroy race)
 *  - eventi webglcontextlost sul canvas (context loss SwiftShader)
 *  - stato dei test hooks ai momenti chiave
 *
 * Uso: npx tsx scripts/verification/diagPixiError.ts [baseUrl]
 */
import { chromium } from 'playwright';

const BASE = process.argv[2] ?? 'http://localhost:5199';

async function main(): Promise<void> {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript('window.__name = function (f) { return f; };');
  // Osservatori installati prima di qualsiasi script della pagina.
  await ctx.addInitScript(`
    window.__diag = { events: [] };
    const log = (kind, detail) => window.__diag.events.push({ t: performance.now() | 0, kind, detail });
    window.__diagLog = log;
    const install = () => {
      // lifecycle del canvas pixi: add/remove dal DOM
      new MutationObserver((muts) => {
        for (const m of muts) {
          for (const n of [...m.addedNodes, ...m.removedNodes]) {
            if (n instanceof HTMLCanvasElement) {
              log(m.removedNodes.length && [...m.removedNodes].includes(n) ? 'canvas-removed' : 'canvas-added',
                { testid: n.dataset?.testid ?? '', w: n.width, h: n.height });
            }
          }
        }
      }).observe(document.documentElement, { childList: true, subtree: true });
      document.addEventListener('webglcontextlost', (e) => log('webglcontextlost', { testid: e.target?.dataset?.testid ?? '' }), true);
      document.addEventListener('webglcontextrestored', () => log('webglcontextrestored', {}), true);
    };
    if (document.documentElement) install();
    else new MutationObserver((m, o) => { if (document.documentElement) { o.disconnect(); install(); } })
      .observe(document, { childList: true });
    window.addEventListener('error', (e) => log('window-error', String(e.message ?? e)));
    window.addEventListener('unhandledrejection', (e) => log('unhandledrejection', String(e.reason?.stack ?? e.reason)));
    window.addEventListener('resize', () => log('window-resize', { w: innerWidth, h: innerHeight }));
    document.addEventListener('visibilitychange', () => log('visibility', document.visibilityState));
  `);

  const page = await ctx.newPage();
  page.on('pageerror', async (e) => {
    console.log(`[pageerror ${rel()}]\n${String(e.stack ?? e)}`);
    try {
      const diag = await page.evaluate(() => {
        const app = (window as unknown as { __pixiApp?: Record<string, unknown> }).__pixiApp;
        if (!app) return { app: null };
        const r = app.renderer as Record<string, unknown> | undefined;
        return {
          app: true,
          rendererType: r?.type,
          renderTargetSystem: typeof r?.renderTarget,
          globalUniforms: typeof r?.globalUniforms,
          glContextLost: (r as { gl?: WebGL2RenderingContext })?.gl?.isContextLost?.() ?? 'n/a',
          tickerStarted: (app.ticker as { started?: boolean })?.started,
          canvasInDom: document.querySelector('[data-testid="pixi-world-canvas"]') !== null,
        };
      });
      console.log('   stato al momento dell\'errore:', JSON.stringify(diag));
    } catch (err) {
      console.log('   diag fallita:', String(err).split('\n')[0]);
    }
  });

  const t0 = Date.now();
  const rel = () => `+${Date.now() - t0}ms`;
  const QUICK = process.env.QUICK === '1';
  console.log(rel(), 'goto /game');
  await page.goto(`${BASE}/game`, { waitUntil: 'domcontentloaded' });

  await page.waitForFunction(
    () => !!(window as unknown as { __idleVillageTestHooks?: { startInvasion?: () => void } })
      .__idleVillageTestHooks?.startInvasion,
    null, { timeout: 240_000 },
  );
  console.log(rel(), 'hooks pronti');
  if (QUICK) {
    // l'errore scatta a ~3-4s di boot: attendi 8s, dump eventi, esci
    await page.waitForTimeout(8_000);
    for (const ev of await page.evaluate(() => (window as any).__diag.events)) console.log('  ', JSON.stringify(ev));
    await browser.close();
    return;
  }
  await page.waitForTimeout(15_000);
  console.log(rel(), 'warm-up finito — dump eventi pre-invasione:');
  for (const ev of await page.evaluate(() => (window as any).__diag.events)) console.log('  ', JSON.stringify(ev));

  await page.evaluate(() => (window as any).__idleVillageTestHooks?.startInvasion?.());
  await page.waitForSelector('[data-testid="world-event-card-body"] button', { timeout: 30_000 });
  console.log(rel(), 'card comparsa — click');
  await page.click('[data-testid="world-event-card-body"] button');

  const end = Date.now() + 8_000;
  let lastLen = 0;
  while (Date.now() < end) {
    const evs = await page.evaluate(() => (window as any).__diag.events);
    for (; lastLen < evs.length; lastLen++) console.log(rel(), 'evento:', JSON.stringify(evs[lastLen]));
    await page.waitForTimeout(200);
  }
  const canvases = await page.evaluate(() => [...document.querySelectorAll('canvas')].map((c) => c.dataset.testid ?? c.className));
  console.log(rel(), 'canvas finali:', JSON.stringify(canvases));
  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
