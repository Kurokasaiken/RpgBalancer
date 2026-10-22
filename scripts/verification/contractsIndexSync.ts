#!/usr/bin/env tsx
/**
 * contractsIndexSync — PLAN-054 T-004: sincronizza la sezione generata di
 * `src/docs/docs/idle_village/COMPONENT_MASTER_INDEX.md` con l'inventario e
 * i contratti `.mw/contracts/**`.
 *
 * La tabella curated del master index resta manuale; la sezione tra
 * `plan054:index-begin` / `plan054:index-end` è rigenerata byte-per-byte:
 * una riga per unità (ruolo, tier, root, copertura: n. INV + fast/e2e
 * checks) e una riga per CTR d'integrazione.
 *
 * CLI:
 *   npm run contracts:index-sync            # riscrive la sezione
 *   npm run contracts:index-sync -- --check # fail-closed su drift
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { COMPONENTS_DIR_REL, loadInventory, type InventoryUnit } from './componentInventory';
import { CONTRACTS_DIR_REL, parseContractFile } from './contractSchema';

export const MASTER_INDEX_REL = 'src/docs/docs/idle_village/COMPONENT_MASTER_INDEX.md';
export const INDEX_BEGIN = '<!-- plan054:index-begin -->';
export const INDEX_END = '<!-- plan054:index-end -->';

/* ------------------------------------------------------------------ */

interface CtrRow {
  id: string;
  components: number;
  invs: number;
}

function loadCtrRows(repoRoot: string): CtrRow[] {
  const dir = join(repoRoot, CONTRACTS_DIR_REL);
  if (!existsSync(dir)) return [];
  const rows: CtrRow[] = [];
  for (const name of readdirSync(dir).sort()) {
    if (!/^CTR-game-\d+\.md$/.test(name)) continue;
    const parsed = parseContractFile(name, readFileSync(join(dir, name), 'utf8'));
    if (parsed.contract?.kind === 'integration') {
      rows.push({
        id: parsed.contract.data.id,
        components: parsed.contract.data.components.length,
        invs: parsed.contract.data.invariants.length,
      });
    }
  }
  return rows;
}

function unitRow(u: InventoryUnit, contractPath: string): string {
  return `| \`${u.id}\` | ${u.role} | ${u.tier} | \`${u.root_file}\` | ${contractPath} |`;
}

/** Sezione generata canonica (byte-stabile: input identico → output identico). */
export function generatedIndexSection(units: InventoryUnit[], ctrs: CtrRow[]): string {
  const lines: string[] = [
    INDEX_BEGIN,
    '',
    '## Contratti vivi PLAN-054 (sezione generata — NON editare a mano)',
    '',
    'Rigenerare con `npm run contracts:index-sync`; verificata da `contracts:check` (drift = FAIL).',
    'La fonte normativa è `.mw/contracts/**` + `.mw/contracts/components/inventory.json`.',
    '',
    '### Integration contracts',
    '',
    '| CTR | Componenti legati | INV |',
    '|---|---|---|',
    ...ctrs.map((c) => `| \`${c.id}\` | ${c.components} | ${c.invs} |`),
    '',
    '### Component units',
    '',
    '| Unit | Ruolo | Tier | Root | Contratto |',
    '|---|---|---|---|---|',
    ...units.map((u) => unitRow(u, `\`.mw/contracts/components/${u.id}.md\``)),
    '',
    INDEX_END,
    '',
  ];
  return lines.join('\n');
}

/**
 * Sostituisce (o inserisce in coda) la sezione generata nel master index.
 * Ritorna il contenuto risultante.
 */
export function syncMasterIndex(indexText: string, section: string): string {
  const begin = indexText.indexOf(INDEX_BEGIN);
  const end = indexText.indexOf(INDEX_END);
  if (begin >= 0 && end > begin) {
    const after = end + INDEX_END.length;
    return indexText.slice(0, begin) + section.replace(/\n$/, '') + indexText.slice(after).replace(/^\n*/, '\n');
  }
  return indexText.replace(/\s*$/, '\n\n') + section;
}

export interface IndexSyncResult {
  drift: boolean;
  updated: boolean;
  errors: string[];
}

export function checkOrSyncIndex(repoRoot: string, write: boolean): IndexSyncResult {
  const res: IndexSyncResult = { drift: false, updated: false, errors: [] };
  const inv = loadInventory(repoRoot);
  if (!inv) {
    res.errors.push(`${COMPONENTS_DIR_REL}/inventory.json assente`);
    return res;
  }
  const idxPath = join(repoRoot, MASTER_INDEX_REL);
  if (!existsSync(idxPath)) {
    res.errors.push(`${MASTER_INDEX_REL} assente`);
    return res;
  }
  const section = generatedIndexSection(inv.units, loadCtrRows(repoRoot));
  const current = readFileSync(idxPath, 'utf8');
  const next = syncMasterIndex(current, section);
  res.drift = next !== current;
  if (res.drift && write) {
    writeFileSync(idxPath, next);
    res.updated = true;
  }
  return res;
}

/* ------------------------------------------------------------------ */

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMain) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
  const check = process.argv.includes('--check');
  const res = checkOrSyncIndex(root, !check);
  for (const e of res.errors) console.error(`✗ ${e}`);
  if (check) {
    if (res.drift) {
      console.error(`✗ ${MASTER_INDEX_REL}: sezione PLAN-054 non sincronizzata — esegui npm run contracts:index-sync`);
      process.exit(1);
    }
    console.log('contracts:index-sync --check OK (drift zero)');
  } else {
    console.log(res.updated ? `contracts:index-sync — ${MASTER_INDEX_REL} aggiornato` : 'contracts:index-sync — già sincronizzato');
  }
  process.exit(res.errors.length ? 1 : 0);
}
