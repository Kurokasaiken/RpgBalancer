/* R-238 — misura dev-mode: pointerdown → medaglione visibile + longtask */
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  const client = await page.createCDPSession();
  await client.send('Profiler.enable');
  await client.send('Profiler.start');

  await page.goto('http://127.0.0.1:5173/game', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-testid="pixi-world-canvas"]', { timeout: 60000 });
  await page.waitForFunction(
    () => !document.querySelector('[data-testid="game-boot-screen"]'),
    { timeout: 60000 },
  );
  await page.keyboard.press('r');
  await page.waitForSelector('[data-resident-id]', { timeout: 15000 });
  await new Promise((r) => setTimeout(r, 1500)); // settle + warm paths

  // strumentazione: pointerdown timestamp + DOM insert detection + longtasks
  await page.evaluate(() => {
    window.__m = { downAt: 0, previewAt: 0, activeAt: 0, tasks: [] };
    window.addEventListener('pointerdown', () => { window.__m.downAt = performance.now(); }, true);
    new MutationObserver(() => {
      const n = document.querySelector('[data-debug-active-id]');
      if (n && !window.__m.previewAt) window.__m.previewAt = performance.now();
    }).observe(document.body, { subtree: true, childList: true, attributes: true });
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) window.__m.tasks.push(Math.round(e.startTime - window.__m.downAt) + 'ms:' + Math.round(e.duration));
    }).observe({ entryTypes: ['longtask'] });
  });

  const card = await page.$('[data-resident-id]');
  const bb = await card.boundingBox();
  const cx = bb.x + bb.width / 2, cy = bb.y + bb.height / 2;

  const hold = async (n) => {
    await page.evaluate(() => { window.__m.previewAt = 0; window.__m.downAt = 0; });
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    // attesa preview fino a 3s
    await page.waitForFunction(() => window.__m.previewAt > 0, { timeout: 3000 }).catch(() => {});
    await page.mouse.up();
    const r = await page.evaluate(() => ({
      total: window.__m.previewAt - window.__m.downAt,
      tasks: window.__m.tasks.splice(0),
    }));
    console.log(`hold${n}: pointerdown→preview = ${Math.round(r.total)}ms | longtasks: ${r.tasks.join(', ') || 'none'}`);
    await new Promise((s) => setTimeout(s, 800));
    // chiudi hero sheet se aperta
    const closeBtn = await page.$('#hero-sheet button[data-skin="close"]');
    if (closeBtn) await closeBtn.click().catch(() => {});
    await new Promise((s) => setTimeout(s, 400));
  };

  await hold(1);
  await hold(2);
  await hold(3);

  const { profile } = await client.send('Profiler.stop');
  // top self-time functions
  const nodes = profile.nodes;
  const selfTime = new Map();
  const byId = new Map(nodes.map((n) => [n.id, n]));
  if (profile.timeDeltas && profile.samples) {
    profile.samples.forEach((id, i) => {
      const dt = profile.timeDeltas[i] || 0;
      selfTime.set(id, (selfTime.get(id) || 0) + dt / 1000);
    });
    const agg = new Map();
    for (const [id, t] of selfTime) {
      const n = byId.get(id);
      if (!n) continue;
      const name = `${n.callFrame.functionName || '(anon)'}@${(n.callFrame.url || '').split('/').pop()}`;
      agg.set(name, (agg.get(name) || 0) + t);
    }
    const top = [...agg.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15);
    console.log('--- top self-time (ms) durante sessione ---');
    top.forEach(([n, t]) => console.log(`  ${t.toFixed(0)}  ${n}`));
  }
  await browser.close();
})();
