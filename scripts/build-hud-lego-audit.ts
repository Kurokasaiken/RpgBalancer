/**
 * PLAN-134 T-001/OB-1/OB-5 — generate the HUD LEGO inventory audit and perform
 * the static no-writeback scan. Writes only inside `.mw/runs/plan134-hud-lego-board`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { buildInventoryAudit, computeInventoryRev, createInventorySnapshot } from '../src/pages/hud-lab/lego/inventory';

const RUN_DIR = path.resolve('.mw/runs/plan134-hud-lego-board');
const checkOnly = process.argv.includes('--check');
const checkNoWriteback = process.argv.includes('--check-no-writeback');

/** Scan board-owned source for forbidden persistence/writeback channels. */
function scanNoWriteback(): string[] {
  const files = [path.resolve('src/pages/hud-lab.tsx')];
  const legoDir = path.resolve('src/pages/hud-lab/lego');
  for (const name of fs.readdirSync(legoDir)) if (/\.(ts|tsx)$/.test(name)) files.push(path.join(legoDir, name));
  const forbidden = [/\blocalStorage\b/, /\bsessionStorage\b/, /\bwriteFile(?:Sync)?\s*\(/, /\bPersistenceService\b/, /\bfetch\s*\([^)]*method:\s*['"](?:POST|PUT|PATCH|DELETE)['"]/];
  const violations: string[] = [];
  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    for (const pattern of forbidden) if (pattern.test(source)) violations.push(`${path.relative(process.cwd(), file)} matches ${pattern}`);
  }
  return violations;
}

/** Render the audit as a compact human-readable markdown table/report. */
function renderAuditMarkdown(audit: ReturnType<typeof buildInventoryAudit>, inventoryRev: string): string {
  const lines = [
    '# HUD LEGO inventory audit — PLAN-134 T-001',
    '',
    `- inventoryRev: \`${inventoryRev}\``,
    `- valid pieces: ${audit.pieceCount}`,
    `- invalid registry entries: ${audit.invalidRegistryCount}`,
    `- classifications: ${Object.entries(audit.classificationCounts).map(([key, count]) => `${key}=${count}`).join(', ')}`,
    '',
    '## Unmapped valid pieces (coverage/gap input)',
    ...audit.unmappedPieceIds.map((id) => `- \`${id}\``),
    '',
    '## Invalid registry entries (unresolved inventory defects)',
    ...audit.schemaIssues.map((issue) => `- \`${issue.id}\` — ${issue.issues.join('; ')}`),
    '',
    '## Coverage matrix',
    '| surface | need | role | reusable pieces | missing delta |',
    '|---|---|---|---|---|',
    ...audit.coverageMatrix.map((row) => `| ${row.surface} | ${row.need} | ${row.role} | ${row.reusablePieceIds.join('<br>') || '—'} | ${row.missingDelta ?? '—'} |`),
    '',
    '## Control patterns observed (read-only)',
    ...audit.controlPatterns.map((pattern) => `- \`${pattern.id}\` — ${pattern.surface}: ${pattern.pattern} (${pattern.observedIn.join(', ')})`),
    '',
  ];
  return `${lines.join('\n')}\n`;
}

function main(): void {
  const snapshot = createInventorySnapshot();
  const audit = buildInventoryAudit(snapshot);
  const inventoryRev = computeInventoryRev(snapshot);
  const violations = scanNoWriteback();
  const report = {
    generatedAt: new Date().toISOString(),
    inventoryRev,
    ...audit,
    noWritebackViolations: violations,
  };
  fs.mkdirSync(RUN_DIR, { recursive: true });
  fs.writeFileSync(path.join(RUN_DIR, 'audit.json'), `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(path.join(RUN_DIR, 'audit.md'), renderAuditMarkdown(audit, inventoryRev));
  console.log(`audit pieces=${audit.pieceCount} invalid=${audit.invalidRegistryCount} unmapped=${audit.unmappedPieceIds.length} orphans=${audit.orphanMappings.length}`);
  console.log(`inventoryRev=${inventoryRev}`);
  console.log(`no-writeback violations=${violations.length}`);
  if (checkNoWriteback) process.exit(violations.length ? 1 : 0);
  if (checkOnly) process.exit(audit.orphanMappings.length || violations.length ? 1 : 0);
}

main();
