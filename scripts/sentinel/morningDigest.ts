/**
 * morningDigest — end-of-run human digest for PLAN-078.
 *
 * Groups gated findings into the five verdict buckets and renders a compact
 * Markdown report for the Director. Findings marked `observation`,
 * `advisory` or `divergent` are listed explicitly as NOT ingested; a tainted
 * run banner is prepended when the worktree drifted mid-run.
 */
import fs from 'node:fs';
import path from 'node:path';
import type { GatedFinding } from './oracles/index';
import type { BridgeOutcome } from './ledgerBridge';

/** Inputs needed to render the digest. */
export interface DigestInput {
  runId: string;
  startedAt: string;
  finishedAt: string;
  tainted: boolean;
  dryRun: boolean;
  degradedCells: string[];
  unreachedStates: string[];
  findings: GatedFinding[];
  bridge?: BridgeOutcome | null;
}

function row(f: GatedFinding): string {
  const cell = f.cell ? ` · ${f.cell}` : '';
  return `- \`${f.oracle_id}\` **${f.title}** — ${f.state_node}/${f.perturbation_kind}${cell} (sig \`${f.signature.slice(0, 12)}\`)`;
}

function bucket(findings: GatedFinding[], gate: GatedFinding['gate']): GatedFinding[] {
  return findings.filter((f) => f.gate === gate);
}

/** Renders the digest Markdown (pure — testable without fs). */
export function renderDigest(input: DigestInput): string {
  const f = input.findings;
  const confirmed = bucket(f, 'confirmed');
  const flaky = bucket(f, 'flaky');
  const divergent = bucket(f, 'divergent-observation');
  const rejected = bucket(f, 'rejected');
  const advisory = f.filter((x) => x.severity === 'observation' && x.gate !== 'divergent-observation');
  const lines: string[] = [
    `# Sentinel Morning Digest — ${input.runId}`,
    '',
    `window: ${input.startedAt} → ${input.finishedAt} · ingest: ${input.dryRun ? 'DRY-RUN' : 'LIVE'}`,
    '',
  ];
  if (input.tainted) {
    lines.push(
      '> **RUN TAINTED** — worktree drifted mid-run (T-13). All findings are',
      '> observations only; nothing was ingested into PLAN-077.',
      '',
    );
  }
  lines.push(
    `## Confirmed defects (${confirmed.length}) — replay-gated, ingest-eligible`,
    ...(confirmed.length ? confirmed.map(row) : ['- (none)']),
    '',
    `## Flaky / race candidates (${flaky.length}) — reproduced <2x, trace attached`,
    ...(flaky.length ? flaky.map(row) : ['- (none)']),
    '',
    `## Divergent observations (${divergent.length}) — same-family, Director adjudication only`,
    ...(divergent.length ? divergent.map(row) : ['- (none)']),
    '',
    `## Rejected by repeat gate (${rejected.length}) — did not reproduce`,
    ...(rejected.length ? rejected.map(row) : ['- (none)']),
    '',
    `## Visual / advisory observations (${advisory.length})`,
    ...(advisory.length ? advisory.map(row) : ['- (none)']),
    '',
  );
  if (input.bridge) {
    const b = input.bridge;
    lines.push(
      '## PLAN-077 bridge',
      `- ingested: ${b.ingested.length ? b.ingested.join(', ') : '(none)'}`,
      `- evidence attached: ${b.evidenced.length ? b.evidenced.join(', ') : '(none)'}`,
      `- reopened (manifest drift): ${b.reopened.length ? b.reopened.join(', ') : '(none)'}`,
      `- observations queued: ${b.observations.length ? b.observations.join(', ') : '(none)'}`,
      `- skipped: ${b.skipped.length ? b.skipped.join(', ') : '(none)'}`,
      '',
    );
  }
  if (input.degradedCells.length || input.unreachedStates.length) {
    lines.push('## Coverage notes');
    if (input.degradedCells.length) lines.push(`- degraded cells: ${input.degradedCells.join(', ')}`);
    if (input.unreachedStates.length) lines.push(`- unreached states: ${input.unreachedStates.join(', ')}`);
    lines.push('');
  }
  return lines.join('\n');
}

/** Writes `morning-digest.md` into `outDir`; returns the file path. */
export function writeDigest(input: DigestInput, outDir: string): string {
  fs.mkdirSync(outDir, { recursive: true });
  const p = path.join(outDir, 'morning-digest.md');
  fs.writeFileSync(p, renderDigest(input));
  return p;
}
