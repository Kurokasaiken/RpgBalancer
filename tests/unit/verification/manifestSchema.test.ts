import { describe, it, expect } from 'vitest';
import { parseManifest, obligationSchema } from '../../../scripts/verification/manifestSchema';
import { skeletonManifest } from '../../../scripts/verification/bundle';

const validObligation = {
  id: 'OB-1',
  requirement: 'the suite passes',
  source: 'PLAN-XXX T-001',
  type: 'state',
  environment: 'headless-ok',
  command: 'npm run test -- scope',
  artifacts: [{ path: 'command-logs/OB-1.log', kind: 'log' }],
  blocking: true,
};

describe('manifestSchema — PLAN-051 T-005', () => {
  it('accepts the --init skeleton manifest', () => {
    const res = parseManifest(skeletonManifest('synthetic'));
    expect(res.ok).toBe(true);
  });

  it('accepts a real-shape manifest (extra keys, no run_id, artifact without kind)', () => {
    const res = parseManifest({
      task: 'plan033-bv36',
      created_at: '2026-10-20T00:00:00.000Z',
      created_by: 'agent',
      context: { note: 'extra field tolerated' },
      obligations: [
        { ...validObligation, artifacts: [{ path: 'x.log' }] },
      ],
    });
    expect(res.ok).toBe(true);
  });

  it('rejects an empty obligations list (prose-only manifest)', () => {
    const res = parseManifest({ task: 't', created_at: 'now', obligations: [] });
    expect(res.ok).toBe(false);
  });

  it('rejects a missing obligations field entirely', () => {
    const res = parseManifest({ task: 't', created_at: 'now' });
    expect(res.ok).toBe(false);
  });

  it('rejects an obligation type outside the enum', () => {
    const res = parseManifest({
      task: 't',
      created_at: 'now',
      obligations: [{ ...validObligation, type: 'vibes' }],
    });
    expect(res.ok).toBe(false);
  });

  it('rejects a waiver by anyone but the director', () => {
    const res = obligationSchema.safeParse({
      ...validObligation,
      waived: { by: 'agent', reason: 'trust me' },
    });
    expect(res.success).toBe(false);
  });

  it('rejects malformed obligation ids and missing artifact paths', () => {
    expect(
      obligationSchema.safeParse({ ...validObligation, id: ' bad id ' }).success,
    ).toBe(false);
    expect(
      obligationSchema.safeParse({
        ...validObligation,
        artifacts: [{ kind: 'log' }],
      }).success,
    ).toBe(false);
  });

  it('reports readable issue paths on failure', () => {
    const res = parseManifest({
      task: 't',
      created_at: 'now',
      obligations: [{ ...validObligation, environment: 'moon' }],
    });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.issues.some((i) => i.includes('environment'))).toBe(true);
    }
  });
});
