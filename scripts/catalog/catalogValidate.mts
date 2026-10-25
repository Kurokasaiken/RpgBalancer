/**
 * catalog:validate — PLAN-086 OB-1.
 * Validates .mw/ui-catalog/manifest.json against the Zod schema plus
 * mechanical integrity: unique ids, legal status values, referenced
 * artifacts exist, contract-link coverage for existing contracts,
 * and ground_truth leakage guard vs page.md (string check).
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { CatalogManifest, LEGAL_TRANSITIONS } from './manifestSchema';

const root = process.cwd();
const manifestPath = '.mw/ui-catalog/manifest.json';
const errors: string[] = [];

const raw = JSON.parse(readFileSync(manifestPath, 'utf8'));
const parsed = CatalogManifest.safeParse(raw);
if (!parsed.success) {
  console.error('SCHEMA FAIL', parsed.error.format());
  process.exit(1);
}
const m = parsed.data;
const ids = new Set<string>();
for (const e of m.entries) {
  if (ids.has(e.id)) errors.push(`duplicate id ${e.id}`);
  ids.add(e.id);
  if (!(e.status in LEGAL_TRANSITIONS)) errors.push(`${e.id}: unknown status ${e.status}`);
  for (const f of e.scopeFiles) {
    if (!existsSync(path.join(root, f))) errors.push(`${e.id}: missing scopeFile ${f}`);
  }
  const dir = `.mw/catalog/components/${e.id}`.replace('.mw/catalog/', '.mw/ui-catalog/');
  for (const v of e.versions) for (const s of v.shots) {
    if (!existsSync(path.join(root, dir, s))) errors.push(`${e.id}: missing shot ${s}`);
  }
  // contract coverage: if a contract file exists for this id it must be linked
  const contractFile = `.mw/contracts/components/${e.id}.md`;
  if (existsSync(path.join(root, contractFile)) && e.links.contract.length === 0) {
    errors.push(`${e.id}: contract exists but links.contract empty`);
  }
  // leakage guard: ground_truth facts must not appear in page.md
  const pageFile = path.join(root, dir, 'page.md');
  if (existsSync(pageFile)) {
    const page = readFileSync(pageFile, 'utf8').toLowerCase();
    for (const f of e.groundTruth) {
      if (f.expectedValue && page.includes(f.expectedValue.toLowerCase())) {
        errors.push(`${e.id}: ground_truth fact "${f.attribute}" leaks into page.md`);
      }
    }
  }
}
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`catalog:validate OK — ${m.entries.length} entries`);
