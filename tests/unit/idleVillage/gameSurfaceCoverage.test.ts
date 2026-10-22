import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  COVERAGE_JSON_REL,
  COVERAGE_MD_REL,
  computeCoverage,
  type CoverageReport,
} from '../../../scripts/verification/gameSurfaceCoverage';

/**
 * R-232 — anti-drift guard for the generated /game coverage matrix.
 *
 * The matrix (unit → tests → docs) is derived mechanically by
 * `scripts/verification/gameSurfaceCoverage.ts` from the PLAN-054
 * partition, the tests import graph, `data-testid` references in e2e
 * specs, and doc mentions. A new component landing on /game, a renamed
 * test, or a doc change shifts the matrix: regenerate with
 * `npm run surface:coverage` after reviewing the delta — same contract
 * as gameSurfaceManifest.ts in hudGuards.
 */
const ROOT = resolve(__dirname, '../../..');

describe('game surface coverage (R-232)', () => {
  it('keeps the generated matrix in sync with the live surface (anti-drift)', () => {
    const committedPath = resolve(ROOT, COVERAGE_JSON_REL);
    expect(existsSync(committedPath), `${COVERAGE_JSON_REL} missing — run npm run surface:coverage`).toBe(true);
    const committed = JSON.parse(readFileSync(committedPath, 'utf8')) as CoverageReport;
    const { report, errors } = computeCoverage(ROOT);
    expect(errors).toEqual([]);
    expect(
      report.content_sha256,
      `coverage drift (live ${report.content_sha256.slice(0, 12)} ≠ committed ${committed.content_sha256.slice(0, 12)}) — ` +
        'a component, test or doc changed the /game surface map; regenerate with npm run surface:coverage',
    ).toBe(committed.content_sha256);
  }, 300_000);

  it('keeps the generated MD stamped with the same matrix sha', () => {
    const md = readFileSync(resolve(ROOT, COVERAGE_MD_REL), 'utf8');
    const committed = JSON.parse(readFileSync(resolve(ROOT, COVERAGE_JSON_REL), 'utf8')) as CoverageReport;
    expect(md).toContain(`coverage-sha256: ${committed.content_sha256}`);
  });

  it('resolves every claimed test, doc and contract path on disk', () => {
    const committed = JSON.parse(readFileSync(resolve(ROOT, COVERAGE_JSON_REL), 'utf8')) as CoverageReport;
    const missing: string[] = [];
    for (const u of committed.units) {
      const paths = [
        u.root_file,
        ...u.scope_files,
        ...(u.contract_md ? [u.contract_md] : []),
        ...u.declared.fast_checks,
        ...u.declared.e2e_checks,
        ...u.detected.unit_tests,
        ...u.detected.e2e_specs,
        ...u.detected.docs,
      ];
      for (const p of paths) if (!existsSync(resolve(ROOT, p))) missing.push(`${u.id}: ${p}`);
    }
    for (const p of committed.page_level_e2e) {
      if (!existsSync(resolve(ROOT, p))) missing.push(`page_level_e2e: ${p}`);
    }
    expect(missing).toEqual([]);
  });
});
