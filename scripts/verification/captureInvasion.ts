/**
 * captureInvasion — capture visuale della scena invasione su /game (R-185).
 *
 * Scrive nella run dir ($RUN_DIR o argv):
 *   frames/f_XX.jpg   — screenshot full-page a ~150 ms per ~7 s dopo il click
 *   metrics.json      — { env: <attestazione gate>, samples: [...], errors: [] }
 *
 * Attestazione ambiente raccolta DENTRO il run (visibilityState, viewport,
 * rAF ticks, frame-diff): il gate la richiede per obbligazioni pixel-temporal.
 * Se il preview su :5179 non risponde, lo lancia e lo chiude alla fine.
 *
 * Uso: npx tsx scripts/verification/captureInvasion.ts <runDir>
 */
import { chromium, type Page } from 'playwright';
import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const RUN_DIR = path.resolve(process.argv[2] ?? process.env.RUN_DIR ?? '.');
const BASE = 'http://127.0.0.1:5179';
const FRAMES = path.join(RUN_DIR, 'frames');

async function serverUp(): Promise<boolean> {
  try {
    const r = await fetch(`${BASE}/game`, { method: 'HEAD' });
    return r.status < 500;
  } catch {
    return false;
  }
}

async function waitForServer(timeoutMs: number): Promise<void> {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    if (await serverUp()) return;
    await new Promise((r) => setTimeout(r, 3000));
  }
  throw new Error(`preview server non raggiungibile su ${BASE} dopo ${timeoutMs / 1000}s`);
}

interface Rect {
  cx: number;
  cy: number;
  w: number;
  h: number;
  op: number;
}

async function envAttestation(page: Page) {
  const viewport = page.viewportSize() ?? { width: 0, height: 0 };
  const dom = await page.evaluate(async () => {
    const count = await new Promise<number>((resolve) => {
      let ticks = 0;
      const start = performance.now();
      const loop = () => {
        ticks += 1;
        if (performance.now() - start < 500) requestAnimationFrame(loop);
        else resolve(ticks);
      };
      requestAnimationFrame(loop);
    });
    return { visibilityState: document.visibilityState, rafTicks: count };
  });
  const a = await page.screenshot({ type: 'jpeg', quality: 50 });
  // Sonda deliberata: un div a copertura piena prova che il compositor
  // produce frame diversi — la scena a riposo è statica e darebbe un
  // falso INVALID_ENV (villaggio idle, frameDiff=0 su cambi reali).
  await page.evaluate(() => {
    const d = document.createElement('div');
    d.id = '__env_probe';
    d.style.cssText = 'position:fixed;inset:0;background:#f0f;z-index:2147483647;';
    document.body.appendChild(d);
  });
  const b = await page.screenshot({ type: 'jpeg', quality: 50 });
  await page.evaluate(() => document.getElementById('__env_probe')?.remove());
  let diff = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i += 1) if (a[i] !== b[i]) diff += 1;
  return {
    visibilityState: dom.visibilityState,
    viewport,
    rafTicks: dom.rafTicks,
    frameDiff: len > 0 ? Math.round((diff / len) * 10000) / 10000 : 0,
    headed: false,
    collectedAt: new Date().toISOString(),
  };
}

async function sample(page: Page) {
  return page.evaluate(() => {
    const r = (el: Element | null): Rect | null => {
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return {
        cx: Math.round(b.x + b.width / 2),
        cy: Math.round(b.y + b.height / 2),
        w: Math.round(b.width),
        h: Math.round(b.height),
        op: +getComputedStyle(el).opacity,
      };
    };
    const goblins = [...document.querySelectorAll('img')]
      .filter((i) => /goblin-march|no-sticker/.test((i as HTMLImageElement).src))
      .map((i) => ({
        kind: i.closest('[data-testid="world-event-card-body"]')
          ? 'card'
          : i.dataset.testid === 'invasion-goblin-marker'
            ? 'marker'
            : 'sticker',
        ...r(i),
      }))
      .filter((g) => (g.op ?? 0) > 0.05 && (g.w ?? 0) > 0);
    return {
      day: (window as unknown as { __idleVillageTestHooks?: { getInvasion?: () => { currentDay: number } | null } })
        .__idleVillageTestHooks?.getInvasion?.()?.currentDay ?? -1,
      goblins,
      marker: r(document.querySelector('[data-testid="invasion-goblin-marker"]')),
      row: r(document.querySelector('[data-event-id="invasion"]')),
      card: r(document.querySelector('[data-testid="world-event-card-body"]')),
    };
  });
}

async function main(): Promise<void> {
  let server: ChildProcess | null = null;
  if (!(await serverUp())) {
    console.log('preview server assente: lancio preview:playwright...');
    server = spawn('npm', ['run', 'preview:playwright'], { stdio: 'ignore', detached: true });
    await waitForServer(600_000);
  } else {
    console.log('preview server già attivo');
  }

  rmSync(FRAMES, { recursive: true, force: true });
  mkdirSync(FRAMES, { recursive: true });
  const errors: string[] = [];
  const browser = await chromium.launch();
  try {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    // tsx/esbuild wraps page.evaluate callbacks with __name(); expose a no-op in the page.
    await ctx.addInitScript('window.__name = function (f) { return f; };');
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push(String(e.stack ?? e)));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

    const partial: { env?: unknown; samples: unknown[] } = { samples: [] };
    const dumpPartial = async (stage: string) => {
      try {
        await page.screenshot({
          path: path.join(RUN_DIR, 'debug-failure.jpg'),
          type: 'jpeg',
          quality: 70,
        });
      } catch { /* best-effort */ }
      writeFileSync(
        path.join(RUN_DIR, 'metrics.json'),
        JSON.stringify({ failedAt: stage, env: partial.env ?? null, errors, samples: partial.samples }, null, 1),
      );
    };

    await page.goto(`${BASE}/game`, { waitUntil: 'domcontentloaded' });
    try {
      await page.waitForFunction(
        () => !!(window as unknown as { __idleVillageTestHooks?: { startInvasion?: () => void } })
          .__idleVillageTestHooks?.startInvasion,
        null,
        { timeout: 240_000 },
      );
    } catch (e) {
      await dumpPartial('waitForFunction(startInvasion)');
      throw e;
    }
    await page.waitForTimeout(15_000); // boot + warm-up come un giocatore reale

    const env = await envAttestation(page);
    partial.env = env;
    await page.evaluate(() =>
      (window as unknown as { __idleVillageTestHooks?: { startInvasion?: () => void } })
        .__idleVillageTestHooks?.startInvasion?.(),
    );
    try {
      await page.waitForSelector('[data-testid="world-event-card-body"] button', { timeout: 30_000 });
    } catch (e) {
      await dumpPartial('waitForSelector(card button)');
      throw e;
    }
    await page.waitForTimeout(1_500);

    const samples: unknown[] = partial.samples;
    const t0 = Date.now();
    let i = 0;
    const snap = async (tag: string) => {
      const m = await sample(page);
      samples.push({ tag, t: Date.now() - t0, ...m });
      await page.screenshot({
        path: path.join(FRAMES, `f_${String(i).padStart(2, '0')}.jpg`),
        type: 'jpeg',
        quality: 70,
      });
      i += 1;
    };

    await snap('pre');
    await page.click('[data-testid="world-event-card-body"] button');
    const end = Date.now() + 7_000;
    while (Date.now() < end) {
      await snap('post');
      await page.waitForTimeout(150);
    }

    writeFileSync(
      path.join(RUN_DIR, 'metrics.json'),
      JSON.stringify({ env, errors, samples }, null, 1),
    );
    console.log(`capture: ${i} frames, ${samples.length} samples, ${errors.length} errors`);
  } finally {
    await browser.close();
    if (server) {
      try {
        process.kill(-server.pid!, 'SIGTERM');
      } catch {
        server.kill('SIGTERM');
      }
      // vite può sopravvivere al gruppo npm: sweep esplicito sulla porta
      // (il server è nostro — l'abbiamo lanciato noi in questo processo).
      await new Promise((r) => setTimeout(r, 500));
      try {
        const { execSync } = await import('node:child_process');
        const pids = execSync('lsof -ti:5179 2>/dev/null || true').toString().split('\n').filter(Boolean);
        for (const p of pids) process.kill(Number(p), 'SIGTERM');
      } catch { /* sweep best-effort */ }
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
