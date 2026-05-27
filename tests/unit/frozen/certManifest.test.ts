/**
 * Unit tests for the cert manifest schema.
 *
 * Validates that the Zod schema accepts well-formed manifests and rejects
 * malformed ones.
 */

import { describe, test, expect } from 'vitest';
import {
  CertManifestSchema,
  parseCertManifest,
  safeParseCertManifest,
  buildCertManifest,
} from '@/ui/idleVillage/frozen/_infra/certManifest';

const baseManifest = {
  kitId: 'rosterKit',
  version: '1.0.0',
  gitSha: 'abc1234',
  fixtureSha: 'deadbeef00112233',
  contractSha: 'cafebabe00112233',
  certifiedAt: '2026-05-21T12:00:00+00:00',
  certifiedBy: 'wave-0-day-5',
  evidence: [
    { label: 'contract test', path: 'tests/contract/minimal-vs-test.spec.ts' },
  ],
  certified: true,
};

describe('CertManifestSchema', () => {
  test('accepts a well-formed manifest', () => {
    expect(() => CertManifestSchema.parse(baseManifest)).not.toThrow();
  });

  test('rejects bad version strings', () => {
    expect(() =>
      CertManifestSchema.parse({ ...baseManifest, version: '1.0' })
    ).toThrow();
    expect(() =>
      CertManifestSchema.parse({ ...baseManifest, version: 'v1.0.0' })
    ).toThrow();
  });

  test('rejects bad git sha', () => {
    expect(() =>
      CertManifestSchema.parse({ ...baseManifest, gitSha: 'xyz' })
    ).toThrow();
  });

  test('rejects empty evidence array', () => {
    expect(() =>
      CertManifestSchema.parse({ ...baseManifest, evidence: [] })
    ).toThrow();
  });

  test('rejects non-ISO certifiedAt', () => {
    expect(() =>
      CertManifestSchema.parse({ ...baseManifest, certifiedAt: 'yesterday' })
    ).toThrow();
  });
});

describe('parseCertManifest / safeParseCertManifest', () => {
  test('parseCertManifest throws on invalid input', () => {
    expect(() => parseCertManifest({ kitId: 'x' })).toThrow();
  });

  test('safeParseCertManifest returns ok:false instead of throwing', () => {
    const result = safeParseCertManifest({ kitId: 'x' });
    expect(result.ok).toBe(false);
  });

  test('safeParseCertManifest returns ok:true for valid manifest', () => {
    const result = safeParseCertManifest(baseManifest);
    expect(result.ok).toBe(true);
  });
});

describe('buildCertManifest', () => {
  test('produces a schema-valid manifest with certifiedAt populated', () => {
    const manifest = buildCertManifest({
      kitId: 'rosterKit',
      version: '1.0.0',
      gitSha: 'abc1234',
      fixtureSha: 'fixturehash',
      contractSha: 'contracthash',
      certifiedBy: 'unit-test',
      evidence: [{ label: 'unit', path: 'tests/unit/frozen/certManifest.test.ts' }],
    });
    expect(manifest.kitId).toBe('rosterKit');
    expect(manifest.certified).toBe(true);
    expect(manifest.certifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
