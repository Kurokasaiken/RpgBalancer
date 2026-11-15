/**
 * invariantMatrixCheck — completeness guard for the invariant→enforcement
 * matrix (PLAN-121, T-1 / contract OB-1).
 *
 * Verifies that EVERY entry in `context/governance/invariant-ledger.json`
 * appears exactly once in `context/governance/invariant-enforcement-matrix.md`
 * with a non-empty disposition (`check:` | `kernel:` | `human-review:` | `GAP`),
 * and that every `GAP` row carries an explicit `gap_approval:` marker
 * (pending | approved:<ruling> | rejected) — a GAP without the marker fails,
 * because an undeclared gap is an omission, not a decision (T-06).
 *
 * Usage:
 *   npx tsx scripts/verification/invariantMatrixCheck.ts
 *   npx tsx scripts/verification/invariantMatrixCheck.ts --kernel <ruleFile>
 *
 * `--kernel <ruleFile>` (T-6 parity mode): for every matrix row whose ledger
 * entry comes from <ruleFile> and whose disposition is `kernel:`, verifies
 * that the entry's binding verbatim (whitespace-normalized) still appears in
 * the file — i.e. the kernel rewrite preserved the binding line.
 *
 * Exit 0 on success, 1 on any violation.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const LEDGER_PATH = join(ROOT, 'context/governance/invariant-ledger.json');
const MATRIX_PATH = join(ROOT, 'context/governance/invariant-enforcement-matrix.md');

interface LedgerEntry {
  id: string;
  source_file: string;
  line: number;
  line_end?: number;
  section: string;
  verbatim: string;
  enforcement_candidate: string;
}

interface MatrixRow {
  id: string;
  disposition: string;
  target: string;
  raw: string;
  lineNo: number;
}

const VALID_DISPOSITION = /^(check:|kernel:|human-review:|GAP\b)/;

/**
 * Aggressive normalization for verbatim matching: lowercase + every
 * non-alphanumeric run → single space. Makes markdown bullets, backticks,
 * pipes, list numbers' punctuation and line wraps transparent so a verbatim
 * quote spanning several source lines still matches.
 */
function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** File text ready for substring matching (code-fence delimiter lines dropped). */
function fileToMatchText(text: string): string {
  const noFences = text
    .split('\n')
    .filter((l) => !/^\s*```/.test(l))
    .join('\n');
  return normalizeForMatch(noFences);
}

/**
 * Split a verbatim quote into checkable segments on elision markers
 * (`…` / `...`). Only segments ≥30 normalized chars are checked — shorter
 * fragments are too weak as proof of presence.
 */
function verbatimSegments(verbatim: string): string[] {
  const segments = verbatim
    .split(/…|\.\.\./)
    .map(normalizeForMatch)
    .filter((s) => s.length >= 30);
  if (segments.length === 0) {
    const longest = verbatim
      .split(/…|\.\.\./)
      .map(normalizeForMatch)
      .sort((a, b) => b.length - a.length)[0] ?? '';
    return longest.length >= 15 ? [longest] : [];
  }
  return segments;
}

function loadLedger(): LedgerEntry[] {
  if (!existsSync(LEDGER_PATH)) {
    console.error(`invariantMatrixCheck: ledger not found at ${LEDGER_PATH}`);
    process.exit(1);
  }
  const parsed = JSON.parse(readFileSync(LEDGER_PATH, 'utf8')) as { entries: LedgerEntry[] };
  return parsed.entries;
}

function parseMatrix(): MatrixRow[] {
  if (!existsSync(MATRIX_PATH)) {
    console.error(`invariantMatrixCheck: matrix not found at ${MATRIX_PATH}`);
    process.exit(1);
  }
  const rows: MatrixRow[] = [];
  const lines = readFileSync(MATRIX_PATH, 'utf8').split('\n');
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed.startsWith('| INV-')) return;
    const cells = trimmed.split('|').map((c) => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length);
    // Expected: [id, short, disposition, checkOrKernel, notes]
    if (cells.length < 4) return;
    rows.push({
      id: cells[0],
      disposition: cells[2] ?? '',
      target: cells[3] ?? '',
      raw: trimmed,
      lineNo: idx + 1,
    });
  });
  return rows;
}

function main(): void {
  const kernelIdx = process.argv.indexOf('--kernel');
  const kernelPath = kernelIdx >= 0 ? process.argv[kernelIdx + 1] : undefined;

  const ledger = loadLedger();
  const rows = parseMatrix();
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Orphans & duplicates: every matrix row ID must exist in the ledger, once.
  const ledgerIds = new Set(ledger.map((e) => e.id));
  const seen = new Map<string, number[]>();
  for (const row of rows) {
    if (!ledgerIds.has(row.id)) {
      errors.push(`orphan matrix row: ${row.id} (line ${row.lineNo}) is not in the ledger`);
      continue;
    }
    const list = seen.get(row.id) ?? [];
    list.push(row.lineNo);
    seen.set(row.id, list);
  }
  for (const [id, lineNos] of seen) {
    if (lineNos.length > 1) {
      errors.push(`duplicate matrix rows for ${id} at lines ${lineNos.join(', ')}`);
    }
  }

  // 2. Missing: every ledger ID must appear in the matrix.
  for (const entry of ledger) {
    if (!seen.has(entry.id)) {
      errors.push(`ledger entry ${entry.id} (${entry.source_file}:${entry.line}) missing from matrix`);
    }
  }

  // 3. Disposition validity: non-empty, recognized prefix, target non-empty
  //    (except GAP), GAP requires gap_approval marker.
  const counts = { check: 0, kernel: 0, 'human-review': 0, GAP: 0 };
  for (const row of rows) {
    if (!VALID_DISPOSITION.test(row.disposition)) {
      errors.push(`${row.id} (line ${row.lineNo}): invalid/empty disposition "${row.disposition}" — expected check: | kernel: | human-review: | GAP`);
      continue;
    }
    const kind = row.disposition.startsWith('GAP') ? 'GAP' : (row.disposition.slice(0, -1) as 'check' | 'kernel' | 'human-review');
    counts[kind] += 1;
    if (kind === 'GAP') {
      if (!/gap_approval\s*:/.test(row.raw)) {
        errors.push(`${row.id} (line ${row.lineNo}): GAP without gap_approval marker — a gap must be declared and Director-approved, not hidden`);
      }
    } else if (!row.target || row.target === '—' || row.target === '-') {
      errors.push(`${row.id} (line ${row.lineNo}): disposition "${row.disposition}" has empty check-name/kernel-line target`);
    }
  }

  // 4. --kernel parity mode: kernel-disposition rows from <kernelPath> must
  //    still have their binding verbatim inside that file.
  if (kernelPath) {
    const absKernel = join(ROOT, kernelPath);
    if (!existsSync(absKernel)) {
      errors.push(`--kernel file not found: ${kernelPath}`);
    } else {
      const kernelText = fileToMatchText(readFileSync(absKernel, 'utf8'));
      const rowIds = new Set(rows.filter((r) => r.disposition.startsWith('kernel:')).map((r) => r.id));
      let checked = 0;
      let unverifiable = 0;
      for (const entry of ledger) {
        if (entry.source_file !== kernelPath) continue;
        if (!rowIds.has(entry.id)) continue;
        checked += 1;
        const segments = verbatimSegments(entry.verbatim);
        if (segments.length === 0) {
          unverifiable += 1;
          warnings.push(`--kernel parity: ${entry.id} verbatim too short/elided to verify — review manually`);
          continue;
        }
        for (const segment of segments) {
          if (!kernelText.includes(segment)) {
            errors.push(`--kernel parity: ${entry.id} binding text not found in ${kernelPath} (fragment: "${segment.slice(0, 70)}…")`);
          }
        }
      }
      console.log(`--kernel parity: ${checked} kernel rows checked against ${kernelPath}${unverifiable ? ` (${unverifiable} too short to verify)` : ''}`);
    }
  }

  // Report
  console.log(`invariantMatrixCheck: ${ledger.length} ledger entries, ${rows.length} matrix rows`);
  console.log(`  dispositions: check=${counts.check} kernel=${counts.kernel} human-review=${counts['human-review']} GAP=${counts.GAP}`);
  for (const w of warnings) console.warn(`  warning: ${w}`);
  if (errors.length > 0) {
    console.error(`\nFAILED — ${errors.length} violation(s):`);
    for (const e of errors) console.error(`  • ${e}`);
    process.exit(1);
  }
  console.log('OK — every ledger invariant has exactly one matrix row with a valid disposition.');
}

main();
