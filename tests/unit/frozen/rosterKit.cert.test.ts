/**
 * Validates that rosterKit.cert.json conforms to the cert manifest schema.
 *
 * This guards against hand-edits or stale manifests slipping into CI.
 */

import { describe, test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CertManifestSchema } from '@/ui/idleVillage/frozen/_infra/certManifest';

const certPath = resolve(
  process.cwd(),
  'src/ui/idleVillage/frozen/kits/rosterKit.cert.json'
);

describe('rosterKit.cert.json', () => {
  test('exists and is valid JSON', () => {
    const raw = readFileSync(certPath, 'utf8');
    expect(() => JSON.parse(raw)).not.toThrow();
  });

  test('matches the cert manifest schema', () => {
    const raw = readFileSync(certPath, 'utf8');
    const parsed = JSON.parse(raw);
    expect(() => CertManifestSchema.parse(parsed)).not.toThrow();
  });

  test('references the rosterKit kitId', () => {
    const raw = readFileSync(certPath, 'utf8');
    const parsed = JSON.parse(raw);
    expect(parsed.kitId).toBe('rosterKit');
  });
});
