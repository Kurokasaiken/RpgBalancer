/**
 * catalog:document — PLAN-086 T-003 documenter.
 * For one manifest entry: reach each declared state via typed driver on a
 * FROZEN build (vite preview, source SHA + build hash recorded), run the
 * observable assertion, capture in-context + isolated screenshots (double
 * capture for determinism), write meta.json, then update the manifest:
 * status documenting → documented | documented_partial | documenter_blocked.
 *
 * Usage:
 *   npm run catalog:document -- --component hud-top-tabs --base-url http://localhost:5198
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import path from 'node:path';
import {
  openGame, waitBootCleared, snap, advanceTicks, surfaceNode, reachState, type HarnessCtx,
} from '../sentinel/gameSurfaceHarness';
import { CatalogManifest, LEGAL_TRANSITIONS } from './manifestSchema';

const ROOT = process.cwd();
const MANIFEST = path.join(ROOT, '.mw/ui-catalog/manifest.json');

/** Reach a surface state — pilot-level registry; unknown ids fail closed. */
async function reachSurface(ctx: HarnessCtx, surfaceId: string): Promise<boolean> {
  switch (surfaceId) {
    case 'S1_WorldMapIdle':
    case 'S0_Boot': {
      await waitBootCleared(ctx);
      await advanceTicks(ctx, 2);
      return true;
    }
    default: {
      /* PLAN-086: delegate every other declared surface to the canonical
       * S-graph (gameSurfaceHarness) instead of failing closed — the graph
       * already owns the real-input reaches (village view, registry chip,
       * building pins, Panels menu). Unknown ids still fail closed. */
      try {
        return await reachState(ctx, surfaceNode(surfaceId));
      } catch {
        return false; // unreachable on this build — documented_partial
      }
    }
  }
}

async function runDriver(ctx: HarnessCtx, driver: { kind: string; id?: string; surface?: string; key?: string; name?: string; ref?: string }): Promise<boolean> {
  switch (driver.kind) {
    case 'surface':
      return reachSurface(ctx, driver.id!);
    case 'surface+key': {
      if (!(await reachSurface(ctx, driver.surface!))) return false;
      await ctx.page.keyboard.press(driver.key!);
      await ctx.page.waitForTimeout(400);
      return true;
    }
    case 'hook': {
      const ok = await ctx.page.evaluate(
        (name) => Boolean((window as unknown as { __idleVillageTestHooks?: Record<string, unknown> }).__idleVillageTestHooks?.[name as never]),
        driver.name!,
      );
      return ok;
    }
    case 'script': {
      const p = path.join(ROOT, driver.ref!);
      if (!existsSync(p)) return false;
      const mod = await import(p);
      if (typeof mod.drive !== 'function') return false;
      return Boolean(await mod.drive(ctx));
    }
    default:
      return false;
  }
}

async function checkAssertion(ctx: HarnessCtx, a: { selector: string; property?: string; expected?: string }): Promise<boolean> {
  try {
    const els = a.selector.split(', ').map((s) => s.trim());
    for (const sel of els) {
      const loc = ctx.page.locator(sel).first();
      if (await loc.count() > 0 && await loc.isVisible({ timeout: 3000 })) {
        if (!a.property || a.property === 'visible') return true;
        const val = await loc.getAttribute(a.property);
        if (val === a.expected) return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

function sha256File(p: string): string {
  return createHash('sha256').update(readFileSync(p)).digest('hex').slice(0, 16);
}

async function main() {
  const args = process.argv.slice(2);
  const getArg = (k: string, d = '') => {
    const i = args.indexOf(k);
    return i >= 0 ? args[i + 1] : d;
  };
  const componentId = getArg('--component');
  const baseURL = getArg('--base-url', 'http://localhost:5198');
  if (!componentId) {
    console.error('usage: --component <id> [--base-url URL]');
    process.exit(1);
  }
  const manifest = CatalogManifest.parse(JSON.parse(readFileSync(MANIFEST, 'utf8')));
  const entry = manifest.entries.find((e) => e.id === componentId);
  if (!entry) {
    console.error(`component ${componentId} not in manifest`);
    process.exit(1);
  }
  if (entry.status !== 'documenting' && entry.status !== 'unassigned') {
    console.error(`component ${componentId} in status ${entry.status} — expected unassigned/documenting`);
    process.exit(1);
  }

  const sourceSha = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  const sourceHash = createHash('sha256')
    .update(entry.scopeFiles.map((f) => (existsSync(path.join(ROOT, f)) ? sha256File(path.join(ROOT, f)) : 'missing')).join(''))
    .digest('hex')
    .slice(0, 16);
  const outDir = path.join(ROOT, `.mw/ui-catalog/components/${componentId}`);
  const shotsDir = path.join(outDir, `shots/V${entry.currentVersion}`);
  mkdirSync(shotsDir, { recursive: true });

  const ctx = await openGame({ baseURL, outDir: shotsDir, reducedMotion: 'reduce' });
  const meta: Record<string, unknown> = {
    componentId, sourceSha, sourceHash, baseURL,
    backend: ctx.backend.rendererClass, viewport: ctx.viewport,
    capturedAt: new Date().toISOString(), states: [] as unknown[],
  };
  let allOk = true;
  const stateResults: { id: string; ok: boolean; reason?: string }[] = [];

  for (const st of entry.states) {
    const reached = await runDriver(ctx, st.driver);
    const asserted = reached && (await checkAssertion(ctx, st.assertion));
    if (!asserted) {
      allOk = false;
      stateResults.push({ id: st.id, ok: false, reason: reached ? 'assertion failed' : 'driver unreachable/unimplemented' });
      (meta.states as unknown[]).push({ id: st.id, reached, asserted: false });
      continue;
    }
    // in-context shot + isolated shot, captured twice for determinism
    const inCtx1 = await snap(ctx, `${st.id}-ctx-a`);
    await ctx.page.waitForTimeout(300);
    const inCtx2 = await snap(ctx, `${st.id}-ctx-b`);
    const isoPaths: string[] = [];
    if (entry.captureSelector) {
      for (const sel of entry.captureSelector.split('|').map((x) => x.trim()).filter(Boolean)) {
        const loc = ctx.page.locator(sel).first();
        if (await loc.count() > 0 && await loc.isVisible().catch(() => false)) {
          isoPaths.push(await snap(ctx, `${st.id}-iso-${isoPaths.length}`, loc));
        }
      }
    }
    const sameBytes = readFileSync(inCtx1).equals(readFileSync(inCtx2));
    (meta.states as unknown[]).push({
      id: st.id, reached: true, asserted: true,
      shots: { inContext: [path.basename(inCtx1), path.basename(inCtx2)], isolated: isoPaths.map((p) => path.basename(p)) },
      deterministicSameBytes: sameBytes,
      driver: st.driver, assertion: st.assertion,
    });
    stateResults.push({ id: st.id, ok: true });
  }

  meta.consoleErrors = ctx.consoleErrors.slice(0, 20);
  meta.networkFailures = ctx.networkFailures.slice(0, 20);
  writeFileSync(path.join(shotsDir, 'meta.json'), JSON.stringify(meta, null, 2));

  // manifest update — single writer, atomic rename
  entry.status = allOk ? 'documented' : 'documenting';
  entry.sourceHash = sourceHash;
  const v = entry.versions.find((vv) => vv.v === entry.currentVersion);
  if (v) {
    v.shots = stateResults.filter((r) => r.ok).flatMap((r) => [`shots/V${entry.currentVersion}/${r.id}-ctx-a.png`]);
    v.meta = { partial: !allOk, failedStates: stateResults.filter((r) => !r.ok).map((r) => r.id) };
  }
  const tmp = `${MANIFEST}.tmp`;
  writeFileSync(tmp, JSON.stringify(manifest, null, 2));
  execSync(`mv ${JSON.stringify(tmp)} ${JSON.stringify(MANIFEST)}`);

  await ctx.browser.close();
  console.log(JSON.stringify({ componentId, status: entry.status, states: stateResults }));
  process.exit(allOk ? 0 : 2);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
