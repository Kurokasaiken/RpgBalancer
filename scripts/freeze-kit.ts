#!/usr/bin/env tsx
/**
 * freeze-kit.ts
 *
 * Generator that scaffolds a new frozen component kit under
 * `src/ui/idleVillage/frozen/kits/<kitName>/`.
 *
 * Usage:
 *   tsx scripts/freeze-kit.ts <kitName>
 *   tsx scripts/freeze-kit.ts <kitName> --dry-run
 *
 * Produces:
 *   src/ui/idleVillage/frozen/kits/<kitName>.ts
 *   src/ui/idleVillage/frozen/kits/<kitName>.contract.ts
 *   src/ui/idleVillage/frozen/kits/<kitName>.fixture.ts
 *   src/ui/idleVillage/frozen/kits/<kitName>.md
 *   src/ui/idleVillage/frozen/kits/__tests__/<kitName>.contract.test.tsx
 *   src/ui/idleVillage/frozen/kits/__tests__/<kitName>.dom.test.tsx
 *
 * And appends an entry to `src/ui/idleVillage/frozen/registry.ts` (creates the
 * registry if it does not exist).
 *
 * Part of the Component Freezing & Certification system (see
 * src/docs/docs/plans/component_freezing_certification_plan_v2.md).
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// CLI parsing
// ---------------------------------------------------------------------------

const argv = process.argv.slice(2);
const dryRun = argv.includes('--dry-run');
const kitName = argv.find((a) => !a.startsWith('--'));

if (!kitName) {
  console.error('Usage: tsx scripts/freeze-kit.ts <kitName> [--dry-run]');
  process.exit(1);
}

if (!/^[a-z][a-zA-Z0-9]*Kit$/.test(kitName)) {
  console.error(
    `Kit name must be camelCase and end with "Kit". Got: "${kitName}". Example: rosterKit`
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');
const kitsDir = resolve(repoRoot, 'src/ui/idleVillage/frozen/kits');
const testsDir = resolve(kitsDir, '__tests__');
const registryPath = resolve(repoRoot, 'src/ui/idleVillage/frozen/registry.ts');
const indexPath = resolve(repoRoot, 'src/ui/idleVillage/frozen/index.ts');

const files = {
  kit: join(kitsDir, `${kitName}.ts`),
  contract: join(kitsDir, `${kitName}.contract.ts`),
  fixture: join(kitsDir, `${kitName}.fixture.ts`),
  doc: join(kitsDir, `${kitName}.md`),
  contractTest: join(testsDir, `${kitName}.contract.test.tsx`),
  domTest: join(testsDir, `${kitName}.dom.test.tsx`),
};

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

const kebab = kitName.replace(/Kit$/, '').replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
const componentNamePascal = kitName.replace(/Kit$/, '');
const componentNamePascalCap = componentNamePascal.charAt(0).toUpperCase() + componentNamePascal.slice(1);

const kitTemplate = `/**
 * ${kitName}
 *
 * Frozen re-export of the canonical ${componentNamePascalCap} component plus
 * its data binder. This file MUST stay small (< ~50 LOC of original logic) —
 * if you find yourself adding behavior here, that behavior probably belongs in
 * the canonical component instead.
 *
 * Part of the Component Freezing & Certification system.
 */

// TODO: replace with the actual canonical import for this kit.
// Example:
//   export { VillageRosterSection as ${componentNamePascalCap} } from '@/ui/idleVillage/roster';

export {} from './${kitName}.contract';
`;

const contractTemplate = `/**
 * ${kitName}.contract
 *
 * Frozen TypeScript contract for ${componentNamePascalCap}. Any change to this
 * file (props, version, defaults) requires a version bump and re-certification.
 */

export interface ${componentNamePascalCap}KitContract {
  version: \`\${number}.\${number}.\${number}\`;
}

export const ${componentNamePascal}KitVersion: ${componentNamePascalCap}KitContract['version'] = '1.0.0';
`;

const fixtureTemplate = `/**
 * ${kitName}.fixture
 *
 * Re-exports of canonical data sources used by ${componentNamePascalCap}.
 * NEVER define inline mock data here — go through CanonicalDataBridge.
 */

// Example:
// export { MINIMAL_GAMEPLAY_RESIDENTS as ${componentNamePascal}Fixture } from '../_infra/CanonicalDataBridge';
`;

const docTemplate = `# ${componentNamePascalCap}Kit

**Status:** Draft
**Version:** 1.0.0

## Source
- Canonical component: TBD
- Reference route: TBD (e.g. \`/test\` or \`/minimal-gameplay\`)
- Minimal route: \`/minimal-${kebab}\`

## Usage
\`\`\`tsx
import { ${componentNamePascalCap} } from '@/ui/idleVillage/frozen/kits/${kitName}';
\`\`\`

## Contract
See \`${kitName}.contract.ts\` for the frozen TypeScript contract.

## Fixture
See \`${kitName}.fixture.ts\` for canonical data sources.

## Certification
- Status: Pending
- Manifest: \`${kitName}.cert.json\`
- Evidence: TBD
`;

const contractTestTemplate = `/**
 * ${kitName}.contract.test
 *
 * Contract test: ensures /minimal-${kebab} renders the same subtree as the
 * reference route. See plan v2 §S5.
 */

import { describe, test } from 'vitest';

describe('${kitName} contract', () => {
  test.todo('reference and minimal subtree are byte-identical after normalization');
});
`;

const domTestTemplate = `/**
 * ${kitName}.dom.test
 *
 * Snapshot test for the kit's rendered DOM with canonical fixture data.
 */

import { describe, test } from 'vitest';

describe('${kitName} DOM snapshot', () => {
  test.todo('renders deterministically with canonical fixture');
});
`;

// ---------------------------------------------------------------------------
// Registry helpers
// ---------------------------------------------------------------------------

const registryHeader = `/**
 * Frozen kit registry — single source of truth for all certified kits.
 *
 * Entries are appended by \`scripts/freeze-kit.ts\` and consumed by
 * \`tests/contract/minimal-vs-test.spec.ts\` to drive the contract sweep.
 *
 * Part of the Component Freezing & Certification system (see
 * src/docs/docs/plans/component_freezing_certification_plan_v2.md).
 */

import type { ContractConfig } from './_infra/contract';

export interface KitRegistryEntry {
  kitId: string;
  contract: ContractConfig;
  /** Module specifier (resolvable) of the kit file. */
  kitModule: string;
}

export const KIT_REGISTRY: KitRegistryEntry[] = [
  // entries appended here
];
`;

function ensureRegistry(): string {
  if (!existsSync(registryPath)) return registryHeader;
  return readFileSync(registryPath, 'utf8');
}

function appendRegistryEntry(content: string): string {
  const entry = `  {
    kitId: '${kitName}',
    kitModule: './kits/${kitName}',
    contract: {
      kitId: '${kitName}',
      referenceRoute: '/test',
      minimalRoute: '/minimal-${kebab}',
      subtreeSelector: '[data-testid="${kebab}"]', // TODO: confirm in audit
    },
  },`;
  const marker = '// entries appended here';
  if (!content.includes(marker)) {
    throw new Error('Registry file is malformed: missing marker comment');
  }
  if (content.includes(`kitId: '${kitName}'`)) {
    console.log(`  ↳ Registry entry for ${kitName} already exists; skipping.`);
    return content;
  }
  return content.replace(marker, `${entry}\n  ${marker}`);
}

const indexTemplate = `/**
 * Public surface of the frozen component kits.
 * Re-export only what consumers (minimal-* pages) should depend on.
 */
export { IsolatedShowcase } from './_infra/IsolatedShowcase';
export * from './_infra/CanonicalDataBridge';
export { KIT_REGISTRY, type KitRegistryEntry } from './registry';
`;

// ---------------------------------------------------------------------------
// Write files
// ---------------------------------------------------------------------------

function writeFile(path: string, contents: string): void {
  if (dryRun) {
    console.log(`  [dry-run] would write: ${path} (${contents.length} bytes)`);
    return;
  }
  mkdirSync(dirname(path), { recursive: true });
  if (existsSync(path)) {
    console.log(`  ↳ exists, skipping: ${path}`);
    return;
  }
  writeFileSync(path, contents, 'utf8');
  console.log(`  ✓ wrote: ${path}`);
}

console.log(`Generating kit "${kitName}" ${dryRun ? '(dry run)' : ''}…`);
writeFile(files.kit, kitTemplate);
writeFile(files.contract, contractTemplate);
writeFile(files.fixture, fixtureTemplate);
writeFile(files.doc, docTemplate);
writeFile(files.contractTest, contractTestTemplate);
writeFile(files.domTest, domTestTemplate);

const updatedRegistry = appendRegistryEntry(ensureRegistry());
if (dryRun) {
  console.log(`  [dry-run] would update: ${registryPath}`);
} else {
  writeFileSync(registryPath, updatedRegistry, 'utf8');
  console.log(`  ✓ updated registry: ${registryPath}`);
}

if (!existsSync(indexPath)) {
  if (dryRun) {
    console.log(`  [dry-run] would write: ${indexPath}`);
  } else {
    writeFileSync(indexPath, indexTemplate, 'utf8');
    console.log(`  ✓ wrote: ${indexPath}`);
  }
}

console.log(`Done. Next: implement TODOs in ${kitName}.ts and update audit/registry contract.`);
