import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

describe('PLAN-135 pilot strip validator', () => {
  it('does not hard-fail sub-threshold foam/noise in the strict outer-water band', { timeout: 90000 }, () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'plan135-validator-'));
    const out = path.join(dir, 'validation.json');
    const proc = spawnSync('python3', [
      'scripts/plan135/validate-pilot-strip.py',
      '--crop', 'top-04',
      '--image', '.mw/specs/mappa2-apron/pilot/generated/top-04-attempt1-download.jpg',
      '--out', out,
    ], { encoding: 'utf8' });
    expect(proc.status).toBe(2);
    const payload = JSON.parse(readFileSync(out, 'utf8'));
    expect(payload.status).toBe('FAIL');
    expect(payload.errors.join('\n')).not.toContain('outer strict water band');
    expect(payload.reviewFlags.join('\n')).toContain('foam/noise ambiguity');
    expect(payload.landReview.outerStrictReviewComponents).toHaveLength(1);
  });
});
