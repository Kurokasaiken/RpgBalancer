/**
 * PLAN-078 T-004 — ledgerBridge tests: dedup by fingerprint, dry-run safety,
 * evidence_attached on re-observation, divergent-observation quarantine,
 * per-run cap, software-renderer advisory.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { bridgeFindings } from '../../../scripts/sentinel/ledgerBridge';
import { initLedger, validateJournal } from '../../../scripts/ledger/ledgerCore';
import { DEFAULT_SENTINEL_CONFIG, type SentinelConfig } from '../../../scripts/sentinel/sentinelConfig';
import type { GatedFinding } from '../../../scripts/sentinel/oracles/index';

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'sentinel-bridge-'));

/** Builds a scratch repo: contract + scope file + surface map + journal. */
function scaffold() {
  const root = tmp();
  fs.mkdirSync(path.join(root, 'src'), { recursive: true });
  fs.mkdirSync(path.join(root, 'contracts'), { recursive: true });
  fs.mkdirSync(path.join(root, 'ledger'), { recursive: true });
  fs.writeFileSync(path.join(root, 'src', 'Foo.ts'), 'export const T = "[data-testid=\\"quest-window\\"]";\n');
  fs.writeFileSync(
    path.join(root, 'contracts', 'quest-run-window.md'),
    '---\nid: quest-run-window\nroot_file: src/Foo.ts\nscope_files:\n  - src/Foo.ts\n---\n',
  );
  fs.writeFileSync(
    path.join(root, 'surface-map.json'),
    JSON.stringify({ surfaces: [{ id: 'game-hud', globs: ['src/**'] }] }),
  );
  initLedger(path.join(root, 'ledger'));

  const cfg: SentinelConfig = {
    ...DEFAULT_SENTINEL_CONFIG,
    ingest: {
      ...DEFAULT_SENTINEL_CONFIG.ingest,
      ledgerDir: path.join(root, 'ledger'),
      surfaceMapPath: path.join(root, 'surface-map.json'),
      contractsDir: path.join(root, 'contracts'),
      ingestLockFile: path.join(root, 'ledger', '.ingest.lock'),
    },
  };
  return { root, cfg };
}

const finding = (over: Partial<GatedFinding> = {}): GatedFinding => ({
  oracle_id: 'geometry:outside-viewport',
  signature: 'sig-001',
  signature_family: 'geo-overflow',
  title: 'panel outside viewport',
  severity: 'defect',
  state_node: 'S1_WorldMapIdle',
  perturbation_kind: 'VP_SWEEP',
  target: '[data-testid="quest-window"]',
  evidence: { box: [0, 0, 9999, 40] },
  exactMatches: 2,
  familyMatches: 1,
  gate: 'confirmed',
  ...over,
});

describe('ledgerBridge', () => {
  it('dry-run emits payloads without touching the journal', async () => {
    const { root, cfg } = scaffold();
    const out = await bridgeFindings([finding()], cfg, {
      runId: 'r1',
      outDir: path.join(root, 'out'),
      dryRun: true,
      rootDir: root,
    });
    expect(out.ingested).toHaveLength(1);
    expect(fs.existsSync(path.join(root, 'out', 'ingest-dryrun.json'))).toBe(true);
    // journal has only the genesis record
    const j = validateJournal(path.join(root, 'ledger'));
    expect(j.records.filter((r) => r.type === 'item_ingested')).toHaveLength(0);
    // reproducer spec was generated
    const reproDir = path.join(root, 'out', 'reproducers');
    expect(fs.readdirSync(reproDir).some((f) => f.endsWith('.spec.ts'))).toBe(true);
  });

  it('live ingest appends item_ingested once; re-observation appends evidence_attached', async () => {
    const { root, cfg } = scaffold();
    const first = await bridgeFindings([finding()], cfg, {
      runId: 'r1',
      outDir: path.join(root, 'out'),
      dryRun: false,
      rootDir: root,
    });
    expect(first.ingested).toHaveLength(1);

    const second = await bridgeFindings([finding()], cfg, {
      runId: 'r2',
      outDir: path.join(root, 'out'),
      dryRun: false,
      rootDir: root,
    });
    expect(second.ingested).toHaveLength(0);
    expect(second.evidenced).toHaveLength(1);

    const j = validateJournal(path.join(root, 'ledger'));
    expect(j.records.filter((r) => r.type === 'item_ingested')).toHaveLength(1);
    expect(j.records.filter((r) => r.type === 'evidence_attached')).toHaveLength(1);
  });

  it('unresolved ownership degrades to observation — never ingested', async () => {
    const { root, cfg } = scaffold();
    const out = await bridgeFindings([finding({ target: '[data-testid="nonexistent"]' })], cfg, {
      runId: 'r1',
      outDir: path.join(root, 'out'),
      dryRun: false,
      rootDir: root,
    });
    expect(out.ingested).toHaveLength(0);
    expect(out.observations.some((o) => o.startsWith('unresolved:'))).toBe(true);
  });

  it('divergent-observation produces SENTINEL-<hash> digest entries only', async () => {
    const { root, cfg } = scaffold();
    const out = await bridgeFindings(
      [finding({ gate: 'divergent-observation', signature: 'sigA', observedSignatures: ['sigA', 'sigB'] })],
      cfg,
      { runId: 'r1', outDir: path.join(root, 'out'), dryRun: false, rootDir: root },
    );
    expect(out.ingested).toHaveLength(0);
    expect(out.observations.some((o) => o.startsWith('SENTINEL-'))).toBe(true);
  });

  it('software-renderer findings are advisory — skipped, not ingested', async () => {
    const { root, cfg } = scaffold();
    const out = await bridgeFindings([finding()], cfg, {
      runId: 'r1',
      outDir: path.join(root, 'out'),
      dryRun: false,
      rootDir: root,
      rendererClass: 'software',
    });
    expect(out.ingested).toHaveLength(0);
    expect(out.skipped.some((s) => s.includes('software'))).toBe(true);
  });

  it('respects the per-run ingest cap', async () => {
    const { root, cfg } = scaffold();
    const capped = { ...cfg, ingest: { ...cfg.ingest, maxPerRun: 1 } };
    const out = await bridgeFindings([finding(), finding({ signature: 'sig-002', oracle_id: 'geometry:collision' })], capped, {
      runId: 'r1',
      outDir: path.join(root, 'out'),
      dryRun: false,
      rootDir: root,
    });
    expect(out.ingested).toHaveLength(1);
    expect(out.skipped.some((s) => s.includes('cap'))).toBe(true);
  });
});
