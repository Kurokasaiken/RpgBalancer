#!/usr/bin/env tsx
/**
 * validate-systems.ts
 *
 * Governance gate for the systems alignment between KIT_REGISTRY and
 * COMPONENT_MASTER_INDEX.md.
 *
 * Commands:
 *   tsx scripts/validate-systems.ts audit   -> writes COMPONENT_MASTER_INDEX_AUDIT.md
 *   tsx scripts/validate-systems.ts apply   -> updates COMPONENT_MASTER_INDEX.md from KIT_REGISTRY
 *   tsx scripts/validate-systems.ts validate (default) -> exits 1 if misalignment is found
 */

import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { KIT_REGISTRY, type KitRegistryEntry } from '../src/ui/idleVillage/frozen/registry.js';

const REPO_ROOT = resolve(import.meta.dirname, '..');
const INDEX_PATH = resolve(REPO_ROOT, 'src/docs/docs/idle_village/COMPONENT_MASTER_INDEX.md');
const AUDIT_PATH = resolve(REPO_ROOT, 'src/docs/docs/idle_village/COMPONENT_MASTER_INDEX_AUDIT.md');

const CANONICAL_STATUSES = new Set(['draft', 'candidate', 'trusted', 'frozen', 'deprecated']);

export interface IndexRow {
  component: string;
  area: string;
  status: string;
  source: string;
  runtime: string;
  lastCertified: string;
  notes: string;
}

export interface AuditRow {
  kitId: string;
  registryStatus: string;
  docExists: string;
  indexStatus: string;
  expectedStatus: string;
  sourceOfTruth: string;
  recommendedAction: string;
}

/**
 * Parse all markdown table rows from the master index.
 * Skips headers and separator lines. Supports both the 7-column main table
 * and the 6-column Frozen Kits table. Strips surrounding backticks.
 */
export function parseMasterIndex(content: string): IndexRow[] {
  const rows: IndexRow[] = [];
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|')) continue;
    const parts = trimmed.split('|').map((c) => c.trim().replace(/^`|`$/g, '')).slice(1, -1);
    if (parts.length < 6) continue;
    if (parts[0] === 'Component / Contract' || parts[0] === 'Kit ID') continue;
    if (parts.every((c) => c.replace(/-/g, '').trim() === '')) continue;

    if (parts.length === 6) {
      rows.push({
        component: parts[0],
        area: '',
        status: parts[1],
        source: parts[2],
        runtime: parts[3],
        lastCertified: parts[4],
        notes: parts[5],
      });
    } else {
      rows.push({
        component: parts[0],
        area: parts[1],
        status: parts[2],
        source: parts[3],
        runtime: parts[4],
        lastCertified: parts[5],
        notes: parts[6],
      });
    }
  }

  return rows;
}

/**
 * Find the master-index row that represents a kit.
 */
export function findKitRow(rows: IndexRow[], kitId: string): IndexRow | undefined {
  const lower = kitId.toLowerCase().replace(/[^a-z0-9]/g, '');
  return rows.find((r) => {
    const component = r.component.toLowerCase().replace(/[^a-z0-9]/g, '');
    return component === lower || component.includes(lower);
  });
}

/**
 * Resolve whether a docPath exists and return the path.
 */
export function resolveDocPath(entry: KitRegistryEntry): { path: string | undefined; exists: boolean } {
  if (!entry.docPath) return { path: undefined, exists: false };
  const full = resolve(REPO_ROOT, entry.docPath);
  return { path: entry.docPath, exists: existsSync(full) };
}

/**
 * Determine the governance status that the index row should have.
 * Certified kits are "frozen" only when a doc exists; otherwise they remain "draft" debt.
 */
export function renderGovernanceStatus(entry: KitRegistryEntry): 'draft' | 'frozen' {
  const { exists } = resolveDocPath(entry);
  return entry.status === 'certified' && exists ? 'frozen' : 'draft';
}

/**
 * Resolve the Source of Truth value for a kit.
 */
export function resolveSourceOfTruth(entry: KitRegistryEntry): string {
  const { path, exists } = resolveDocPath(entry);
  if (path && exists) return path;
  return 'TBD';
}

/**
 * Run the validation gate and return a report.
 */
export function validateSystems(
  registry: KitRegistryEntry[],
  indexRows: IndexRow[],
): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  const seenSources = new Map<string, IndexRow[]>();

  for (const row of indexRows) {
    if (!CANONICAL_STATUSES.has(row.status.toLowerCase())) {
      errors.push(`Row "${row.component}" has non-canonical status "${row.status}".`);
    }
    if (row.source !== 'TBD') {
      const full = resolve(REPO_ROOT, row.source);
      if (!existsSync(full)) {
        errors.push(`Row "${row.component}" Source of Truth not found: ${row.source}`);
      } else if (statSync(full).size === 0) {
        errors.push(`Row "${row.component}" Source of Truth is empty: ${row.source}`);
      }
    } else {
      warnings.push(`Row "${row.component}" has Source of Truth TBD.`);
    }

    const sourceKey = row.source.toLowerCase();
    if (!seenSources.has(sourceKey)) seenSources.set(sourceKey, []);
    seenSources.get(sourceKey)!.push(row);
  }

  for (const [source, rows] of seenSources.entries()) {
    if (source !== 'tbd' && rows.length > 1) {
      errors.push(`Duplicate Source of Truth "${source}" used by: ${rows.map((r) => r.component).join(', ')}`);
    }
  }

  for (const entry of registry) {
    const row = findKitRow(indexRows, entry.kitId);
    if (!row) {
      errors.push(`Kit "${entry.kitId}" is missing from COMPONENT_MASTER_INDEX.md.`);
      continue;
    }

    const expectedStatus = renderGovernanceStatus(entry);
    if (row.status.toLowerCase() !== expectedStatus) {
      errors.push(`Kit "${entry.kitId}" expected status "${expectedStatus}" but got "${row.status}".`);
    }

    const doc = resolveDocPath(entry);
    if (entry.docPath && !doc.exists) {
      errors.push(`Kit "${entry.kitId}" docPath does not exist: ${entry.docPath}`);
    }

    if (entry.status === 'certified') {
      if (!entry.contract) warnings.push(`Kit "${entry.kitId}" is certified but missing contract.`);
      if (!entry.certManifestPath) warnings.push(`Kit "${entry.kitId}" is certified but missing certManifestPath.`);
      if (!entry.hub) warnings.push(`Kit "${entry.kitId}" is certified but missing hub metadata.`);
    }

    const source = resolveSourceOfTruth(entry);
    if (row.source !== source && source !== 'TBD' && row.source !== 'TBD') {
      warnings.push(`Kit "${entry.kitId}" Source of Truth mismatch: index "${row.source}" vs expected "${source}".`);
    }
  }

  return { errors, warnings };
}

/**
 * Generate audit rows for the KIT_REGISTRY vs COMPONENT_MASTER_INDEX comparison.
 */
export function buildAuditRows(registry: KitRegistryEntry[], indexRows: IndexRow[]): AuditRow[] {
  return registry.map((entry) => {
    const row = findKitRow(indexRows, entry.kitId);
    const doc = resolveDocPath(entry);
    const expectedStatus = renderGovernanceStatus(entry);
    const source = resolveSourceOfTruth(entry);

    let recommendedAction = 'OK';
    if (!row) {
      recommendedAction = `Add to index as ${expectedStatus}`;
    } else if (row.status.toLowerCase() !== expectedStatus) {
      recommendedAction = `Update status from ${row.status} to ${expectedStatus}`;
    } else if (entry.docPath && !doc.exists) {
      recommendedAction = `Create docPath ${entry.docPath}`;
    }

    return {
      kitId: entry.kitId,
      registryStatus: entry.status,
      docExists: doc.exists ? 'yes' : 'no',
      indexStatus: row ? row.status : 'missing',
      expectedStatus,
      sourceOfTruth: source,
      recommendedAction,
    };
  });
}

/**
 * Write the markdown audit report.
 */
export function writeAudit(rows: AuditRow[], path: string): void {
  const header = `# COMPONENT_MASTER_INDEX_AUDIT\n\n` +
    `Audit generated from KIT_REGISTRY vs COMPONENT_MASTER_INDEX.md.\n\n`;
  const tableHeader = '| Kit ID | Registry Status | Doc Exists | Index Status | Expected Status | Source of Truth | Recommended Action |\n' +
    '| --- | --- | --- | --- | --- | --- | --- |\n';
  const tableRows = rows.map((r) =>
    `| ${r.kitId} | ${r.registryStatus} | ${r.docExists} | ${r.indexStatus} | ${r.expectedStatus} | ${r.sourceOfTruth} | ${r.recommendedAction} |`,
  ).join('\n');

  writeFileSync(path, header + tableHeader + tableRows + '\n', 'utf8');
}

/**
 * Build the Frozen Kits table for the master index.
 */
function buildFrozenKitsTable(registry: KitRegistryEntry[]): string {
  const header = `## Frozen Kits\n\n` +
    `| Kit ID | Status | Source of Truth | Runtime/Test Page | Last Certified | Owner / Notes |\n` +
    `| --- | --- | --- | --- | --- | --- |\n`;
  const rows = registry.map((entry) => {
    const status = renderGovernanceStatus(entry);
    const source = resolveSourceOfTruth(entry);
    const runtime = entry.hub ? entry.hub.path : 'N/A';
    const notes = `KIT_REGISTRY status: ${entry.status}`;
    return `| ${entry.kitId} | ${status} | ${source} | ${runtime} | 2026-07-14 | ${notes} |`;
  }).join('\n');

  return header + rows + '\n';
}

/**
 * Update COMPONENT_MASTER_INDEX.md by inserting or replacing the Frozen Kits section.
 */
function applyIndexUpdates(registry: KitRegistryEntry[], indexPath: string): void {
  const content = readFileSync(indexPath, 'utf8');
  const table = buildFrozenKitsTable(registry);
  const startMarker = '<!-- GOV-006-FROZEN-KITS-START -->';
  const endMarker = '<!-- GOV-006-FROZEN-KITS-END -->';

  let updated: string;
  if (content.includes(startMarker) && content.includes(endMarker)) {
    const start = content.indexOf(startMarker);
    const end = content.indexOf(endMarker) + endMarker.length;
    updated = content.slice(0, start) + startMarker + '\n' + table + endMarker + '\n' + content.slice(end);
  } else {
    const footerRegex = /\n---\n\n\*Last Updated:[\s\S]*$/;
    const footerMatch = content.match(footerRegex);
    if (footerMatch) {
      const footer = footerMatch[0];
      const today = new Date().toISOString().split('T')[0];
      const newFooter = `\n${startMarker}\n${table}\n${endMarker}\n\n---\n\n*Last Updated: ${today}*\n*Status: Reconciled from KIT_REGISTRY.*`;
      updated = content.replace(footer, newFooter);
    } else {
      updated = content + '\n' + startMarker + '\n' + table + endMarker + '\n';
    }
  }

  writeFileSync(indexPath, updated, 'utf8');
}

/**
 * Execute the requested command.
 */
function runCommand(command: string): number {
  const indexContent = readFileSync(INDEX_PATH, 'utf8');
  const indexRows = parseMasterIndex(indexContent);

  if (command === 'audit') {
    const rows = buildAuditRows(KIT_REGISTRY, indexRows);
    writeAudit(rows, AUDIT_PATH);
    console.log(`Audit written to ${AUDIT_PATH}`);
    return 0;
  }

  if (command === 'apply') {
    applyIndexUpdates(KIT_REGISTRY, INDEX_PATH);
    console.log(`Updated ${INDEX_PATH} from KIT_REGISTRY`);
    return 0;
  }

  const { errors, warnings } = validateSystems(KIT_REGISTRY, indexRows);

  for (const warning of warnings) {
    console.warn(`⚠️  ${warning}`);
  }

  if (errors.length === 0) {
    console.log('✅ Systems governance alignment OK');
    return 0;
  }

  for (const error of errors) {
    console.error(`❌ ${error}`);
  }
  return 1;
}

function main(): void {
  const command = process.argv[2] || 'validate';
  const allowed = ['audit', 'apply', 'validate'];
  if (!allowed.includes(command)) {
    console.error(`Unknown command: ${command}. Use one of ${allowed.join(', ')}`);
    process.exit(1);
  }

  process.exit(runCommand(command));
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
