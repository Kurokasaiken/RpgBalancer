#!/usr/bin/env tsx
/**
 * runSentinel — PLAN-078 T-005 night-run controller.
 *
 * Lifecycle:
 *   1. load config (Zod) → snapshot worktree (T-13) → register session
 *      (Rule 50, `~/.rpg-shutdown/session-registry.json`);
 *   2. sweep cells (viewport × dpr × locale — shrunk when loadavg is high);
 *      per cell: openGame → for each enabled node: reach → per enabled
 *      perturbation: apply → auditState → collect findings;
 *   3. repeat gate: each first-pass finding replays its recipe in isolation
 *      (fresh context per replay) until the gate decides;
 *   4. ledger bridge (skipped entirely when the run is tainted);
 *   5. morning digest + run manifest;
 *   6. `finally`: heartbeat stop + releaseSession + browser close.
 *
 * The Sentinel never fixes code, never promotes baselines, never commits —
 * and never touches shutdown itself (Rule 50 capability boundary).
 */
import { program } from 'commander';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import { loadSentinelConfig, type SentinelConfig, type PerturbationKind } from './sentinelConfig';
import {
  openGame, close as closeHarness, reachState, setLocale, GAME_SURFACE_GRAPH,
  type HarnessCtx, type SurfaceNode,
} from './gameSurfaceHarness';
import { auditState, applyRepeatGate, type OracleFinding, type GatedFinding } from './oracles/index';
import { applyPerturbation } from './perturbationApplier';
import { resolveAngleBackend } from './rendererBackend';
import { snapshotWorktree, worktreeDrifted, type WorktreeSnapshot } from './worktreeTaintGuard';
import { bridgeFindings } from './ledgerBridge';
import { writeDigest } from './morningDigest';
import {
  registerSession, heartbeatSession, releaseSession, getRegistryFilePath,
} from '../shutdownManager/sessionRegistry';

/** A sweep cell: one (viewport, dpr, locale) combination. */
interface Cell {
  viewport: { width: number; height: number };
  dpr: number;
  locale: string;
  key: string;
}

function buildCells(cfg: SentinelConfig, shrink: boolean): Cell[] {
  const viewports = shrink ? cfg.viewports.slice(0, 1) : cfg.viewports;
  const dpis = shrink ? cfg.dpis.slice(0, 1) : cfg.dpis;
  const cells: Cell[] = [];
  for (const viewport of viewports)
    for (const dpr of dpis)
      for (const locale of cfg.locales)
        cells.push({ viewport, dpr, locale, key: `${viewport.width}x${viewport.height}@${dpr}x/${locale}` });
  return cells;
}

/** Tags findings with the cell they were observed under. */
function tagCell(findings: OracleFinding[], cell: Cell): OracleFinding[] {
  return findings.map((f) => ({ ...f, cell: cell.key }));
}

interface FirstPassRow {
  cell: Cell;
  node: SurfaceNode;
  pert: PerturbationKind;
  audit: Awaited<ReturnType<typeof auditState>>;
}

/** Runs one full audit of `node`+`pert` inside a fresh context for `cell`. */
async function runCellAudit(
  cfg: SentinelConfig,
  outDir: string,
  cell: Cell,
  node: SurfaceNode,
  pert: PerturbationKind,
  backend: ReturnType<typeof resolveAngleBackend>,
) {
  const ctx: HarnessCtx = await openGame({
    baseURL: cfg.baseURL,
    viewport: cell.viewport,
    deviceScaleFactor: cell.dpr,
    locale: cell.locale === 'en' ? 'en-US' : cell.locale,
    outDir,
    fakeClock: true,
    backend,
  });
  try {
    if (cell.locale !== 'en') await setLocale(ctx, cell.locale as 'it-IT');
    if (!(await reachState(ctx, node))) return null;
    const { postGestureAt } = await applyPerturbation(ctx, node, pert, cfg);
    return await auditState(ctx, cfg, node.id, pert, { locale: cell.locale, postGestureAt });
  } finally {
    await closeHarness(ctx).catch(() => {});
  }
}

async function main() {
  program
    .name('runSentinel')
    .option('--config <path>', 'sentinel config JSON')
    .option('--out <dir>', 'output dir (default .mw/runs/<runId>)')
    .option('--states <csv>', 'restrict to node ids')
    .option('--tier <n>', 'matrix tier: 1 = single smoke cell (default: full matrix)')
    .option('--live', 'ingest into PLAN-077 for real (default: dry-run)')
    .option('--dry-run', 'explicit no-op — dry-run is the default (contract fidelity)')
    .option('--no-register', 'skip shutdown-registry session (local dry runs)')
    .parse();
  const opts = program.opts<{ config?: string; out?: string; states?: string; tier?: string; live?: boolean; register?: boolean }>();

  const cfg = loadSentinelConfig(opts.config);
  const startedAt = new Date();
  const runId = `${cfg.nightrun.runIdPrefix}-${startedAt.toISOString().replace(/[:.]/g, '').slice(0, 15)}`;
  const outDir = opts.out ?? path.join('.mw', 'runs', runId);
  fs.mkdirSync(outDir, { recursive: true });

  const dryRun = !opts.live;
  const backend = resolveAngleBackend();
  const taintBase: WorktreeSnapshot = snapshotWorktree();
  const registryPath = getRegistryFilePath(cfg.nightrun.registryPath);
  const nodes = GAME_SURFACE_GRAPH.filter((n) => !opts.states || opts.states.split(',').includes(n.id));

  /* ---- Rule 50: register + heartbeat; release in `finally` ---- */
  let heartbeat: NodeJS.Timeout | null = null;
  if (opts.register !== false) {
    await registerSession(
      {
        projectId: 'RpgBalancer',
        sessionId: runId,
        pid: process.pid,
        owner: 'sentinel',
        state: 'RUNNING',
        ttlSeconds: Math.ceil((cfg.nightrun.heartbeatIntervalMs * 3) / 1000),
        blockingReason: 'sentinel night-run',
      },
      registryPath,
    );
    heartbeat = setInterval(() => {
      heartbeatSession({ projectId: 'RpgBalancer', sessionId: runId }, registryPath).catch(() => {});
    }, cfg.nightrun.heartbeatIntervalMs);
    heartbeat.unref();
  }

  let aborted = false;
  const onSig = () => {
    aborted = true;
  };
  process.on('SIGINT', onSig);
  process.on('SIGTERM', onSig);

  const firstPass: FirstPassRow[] = [];
  const unreachedStates: string[] = [];
  const degradedCells: string[] = [];

  try {
    const cells = (opts.tier === '1' ? buildCells(cfg, true).slice(0, 1) : buildCells(cfg, os.loadavg()[0] > cfg.nightrun.loadavgMax));
    if (cells.length < cfg.viewports.length * cfg.dpis.length * cfg.locales.length) {
      degradedCells.push(`loadavg ${os.loadavg()[0].toFixed(1)} > ${cfg.nightrun.loadavgMax}: matrix shrunk to ${cells.length} cell(s)`);
    }

    /* ---------- first pass: sweep cells × states × perturbations ---------- */
    for (const cell of cells) {
      if (aborted || Date.now() - startedAt.getTime() > cfg.nightrun.maxDurationMs) break;
      const cellDir = path.join(outDir, 'cells', cell.key.replace(/[^\w@-]/g, '_'));
      const ctx = await openGame({
        baseURL: cfg.baseURL,
        viewport: cell.viewport,
        deviceScaleFactor: cell.dpr,
        locale: cell.locale === 'en' ? 'en-US' : cell.locale,
        outDir: cellDir,
        fakeClock: true,
        backend,
      });
      try {
        if (cell.locale !== 'en') await setLocale(ctx, cell.locale as 'it-IT');
        for (const node of nodes) {
          if (aborted || Date.now() - startedAt.getTime() > cfg.nightrun.maxDurationMs) break;
          const reached = await reachState(ctx, node).catch((e) => {
            unreachedStates.push(`${node.id}@${cell.key}: ${e instanceof Error ? e.message : e}`);
            return false;
          });
          if (!reached) continue;
          for (const pert of node.perturbations.filter((p) => cfg.perturbations.includes(p))) {
            /* A failed perturbation or audit (e.g. rehydration not
             * recovering the node) is evidence, not a fatal — record it
             * and move on. */
            try {
              const { postGestureAt } = await applyPerturbation(ctx, node, pert, cfg);
              const audit = await auditState(ctx, cfg, node.id, pert, { locale: cell.locale, postGestureAt });
              audit.findings = tagCell(audit.findings, cell);
              if (audit.degraded) degradedCells.push(`${node.id}@${cell.key}`);
              if (audit.findings.length) firstPass.push({ cell, node, pert, audit });
            } catch (e) {
              unreachedStates.push(`${node.id}:${pert}@${cell.key}: ${e instanceof Error ? e.message : e}`);
            }
          }
        }
      } finally {
        await closeHarness(ctx).catch(() => {});
      }
    }

    /* ---------- repeat gate: isolated replays per first-pass row ---------- */
    const gated: GatedFinding[] = [];
    for (const row of firstPass) {
      if (aborted) break;
      const isTemporalRow = row.audit.findings.some((f) => f.oracle_id.startsWith('temporal'));
      const totalRuns = isTemporalRow ? cfg.repeatGate.temporalPixelRuns : cfg.repeatGate.structuralRuns;
      const runFindings: OracleFinding[][] = [row.audit.findings];
      for (let i = 1; i < totalRuns; i++) {
        const replay = await runCellAudit(cfg, outDir, row.cell, row.node, row.pert, backend).catch(() => null);
        if (replay) runFindings.push(replay.findings);
      }
      gated.push(...applyRepeatGate(runFindings, cfg.repeatGate));
    }

    /* ---------- taint check (T-13) before any ledger write ---------- */
    const tainted = worktreeDrifted(taintBase);

    /* ---------- bridge + digest ---------- */
    const bridge = tainted
      ? null
      : await bridgeFindings(gated, cfg, {
          runId,
          outDir,
          dryRun,
          rendererClass: backend.rendererClass,
        });
    const digestPath = writeDigest(
      {
        runId,
        startedAt: startedAt.toISOString(),
        finishedAt: new Date().toISOString(),
        tainted,
        dryRun,
        degradedCells,
        unreachedStates,
        findings: gated,
        bridge,
      },
      outDir,
    );

    fs.writeFileSync(
      path.join(outDir, 'run-manifest.json'),
      JSON.stringify(
        {
          runId,
          config: cfg,
          taintBase,
          tainted,
          dryRun,
          cells: cells.map((c) => c.key),
          states: nodes.map((n) => n.id),
          renderer_class: backend.rendererClass,
          softwareRenderer: backend.software,
          findings: gated.length,
          digest: path.basename(digestPath),
          aborted,
        },
        null,
        2,
      ),
    );
    console.log(`[sentinel] run ${runId} complete — ${gated.length} findings, digest: ${digestPath}${tainted ? ' [TAINTED]' : ''}${dryRun ? ' [dry-run]' : ''}`);
  } finally {
    if (heartbeat) clearInterval(heartbeat);
    process.off('SIGINT', onSig);
    process.off('SIGTERM', onSig);
    if (opts.register !== false) {
      await releaseSession(
        { projectId: 'RpgBalancer', sessionId: runId, state: aborted ? 'FAILED' : 'COMPLETED' },
        registryPath,
      ).catch(() => {});
    }
  }
}

main().catch((e) => {
  console.error(`[sentinel] fatal: ${e instanceof Error ? e.stack ?? e.message : e}`);
  process.exit(1);
});
