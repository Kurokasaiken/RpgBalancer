/**
 * Unit tests for the systems governance validation gate.
 */

import { describe, it, expect } from 'vitest';
import { validateSystems, parseMasterIndex, findKitRow, type IndexRow } from '../../../scripts/validate-systems.js';
import type { KitRegistryEntry } from '../../../src/ui/idleVillage/frozen/registry.js';

const EXISTING_DOC = 'scripts/validate-systems.ts';
const MISSING_DOC = 'src/ui/idleVillage/frozen/kits/doesNotExist.md';

function makeKit(overrides: Partial<KitRegistryEntry> = {}): KitRegistryEntry {
  return {
    kitId: 'testKit',
    kitModule: './kits/testKit',
    status: 'draft',
    ...overrides,
  } as KitRegistryEntry;
}

function makeRow(overrides: Partial<IndexRow> = {}): IndexRow {
  return {
    component: 'testKit',
    area: 'test',
    status: 'draft',
    source: 'TBD',
    runtime: 'N/A',
    lastCertified: '2026-07-14',
    notes: '',
    ...overrides,
  };
}

describe('parseMasterIndex', () => {
  it('parses a 7-column markdown table', () => {
    const md = `| Component / Contract | Area | Status | Source of Truth | Runtime | Last Certified | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Test Component | test | trusted | \`scripts/validate-systems.ts\` | /test | 2026-07-14 | ok |`;
    const rows = parseMasterIndex(md);
    expect(rows).toHaveLength(1);
    expect(rows[0].component).toBe('Test Component');
    expect(rows[0].source).toBe('scripts/validate-systems.ts');
  });

  it('parses a 6-column Frozen Kits table', () => {
    const md = `| Kit ID | Status | Source of Truth | Runtime/Test Page | Last Certified | Owner / Notes |
| --- | --- | --- | --- | --- | --- |
| testKit | draft | TBD | N/A | 2026-07-14 | notes |`;
    const rows = parseMasterIndex(md);
    expect(rows).toHaveLength(1);
    expect(rows[0].component).toBe('testKit');
    expect(rows[0].status).toBe('draft');
  });
});

describe('findKitRow', () => {
  it('finds a row by kitId', () => {
    const row = makeRow();
    expect(findKitRow([row], 'testKit')).toBe(row);
  });

  it('finds a row whose component contains the kitId', () => {
    const row = makeRow({ component: 'Test Kit' });
    expect(findKitRow([row], 'testKit')).toBe(row);
  });
});

describe('validateSystems', () => {
  it('errors when a kit is missing from the index', () => {
    const { errors } = validateSystems([makeKit()], []);
    expect(errors).toContain('Kit "testKit" is missing from COMPONENT_MASTER_INDEX.md.');
  });

  it('errors when a kit docPath does not exist', () => {
    const kit = makeKit({ status: 'certified', docPath: MISSING_DOC });
    const row = makeRow({ status: 'frozen' });
    const { errors } = validateSystems([kit], [row]);
    expect(errors).toContain(`Kit "testKit" docPath does not exist: ${MISSING_DOC}`);
  });

  it('errors when a component status is not canonical', () => {
    const row = makeRow({ status: 'unknown' });
    const { errors } = validateSystems([], [row]);
    expect(errors).toContain('Row "testKit" has non-canonical status "unknown".');
  });

  it('errors when a Source of Truth file is missing', () => {
    const row = makeRow({ source: MISSING_DOC });
    const { errors } = validateSystems([], [row]);
    expect(errors).toContain(`Row "testKit" Source of Truth not found: ${MISSING_DOC}`);
  });

  it('errors when a certified kit has a doc but the index status is wrong', () => {
    const kit = makeKit({ status: 'certified', docPath: EXISTING_DOC });
    const row = makeRow({ status: 'draft' });
    const { errors } = validateSystems([kit], [row]);
    expect(errors).toContain('Kit "testKit" expected status "frozen" but got "draft".');
  });

  it('passes when a certified kit and its index row are aligned', () => {
    const kit = makeKit({
      status: 'certified',
      docPath: EXISTING_DOC,
      contract: { kitId: 'testKit', referenceRoute: '/test', minimalRoute: '/minimal-test', subtreeSelector: '[data-testid="test"]' },
      certManifestPath: 'scripts/validate-systems.ts',
    });
    const row = makeRow({ status: 'frozen', source: EXISTING_DOC });
    const { errors } = validateSystems([kit], [row]);
    expect(errors).toHaveLength(0);
  });
});
