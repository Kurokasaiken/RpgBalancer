#!/usr/bin/env tsx
/**
 * mapping:propose / mapping:approve — batch di modifica alla mappa
 * file→superficie con approvazione Director sullo sha256 esatto (PLAN-044
 * T-002 hardening).
 *
 * Flow:
 *   npm run mapping:propose              → scrive .mw/mapping-proposals/<ts>.json
 *                                          con la diff funzionale vs HEAD
 *   Director: npm run mapping:approve -- .mw/mapping-proposals/<file>
 *                                          → appende {batch_sha256, approved_at}
 *                                            a .mw/mapping-approvals.jsonl e
 *                                            stampa approved_at sugli entry
 *   npm run mapping:status               → diff mappa non ancora approvata
 *
 * Il gate ricalcola lo sha256 dei proposal-file: un batch editato dopo
 * l'approvazione esce dall'insieme approvato → modifiche non attive.
 */
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import path from 'node:path';
import { sha256File } from './verification/gateCore';
import {
  APPROVALS_REL,
  PROPOSALS_DIR_REL,
  SURFACE_MAP_REL,
  diffSurfaceMaps,
  functionalKey,
  loadSurfaceMap,
  type MappingProposal,
} from './verification/surfaceMap';
import { baselineSurfaceMap } from './verification/contractsCheck';

const repoRoot = process.cwd();
const args = process.argv.slice(2);

function cmdCreate(): void {
  const byIdx = args.indexOf('--by');
  const created_by = byIdx >= 0 ? args[byIdx + 1] : 'agent';
  const map = loadSurfaceMap(repoRoot);
  if (!map) {
    console.error(`${SURFACE_MAP_REL} assente — niente da proporre`);
    process.exit(2);
  }
  const diff = diffSurfaceMaps(baselineSurfaceMap(repoRoot), map);
  if (!diff.added.length && !diff.changed.length && !diff.removedIds.length) {
    console.log('Nessuna diff di mappa vs HEAD — niente da proporre.');
    return;
  }
  const proposal: MappingProposal = {
    created_at: new Date().toISOString(),
    created_by,
    entries: [...diff.added, ...diff.changed],
    removed_ids: diff.removedIds,
  };
  const dir = path.join(repoRoot, PROPOSALS_DIR_REL);
  mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `proposal-${proposal.created_at.replace(/[:.]/g, '-')}.json`);
  writeFileSync(file, JSON.stringify(proposal, null, 2) + '\n');
  const batchSha = sha256File(file) ?? '';
  console.log(`Proposal scritta: ${path.relative(repoRoot, file)}`);
  console.log(`  entries: ${proposal.entries.length} (${diff.added.length} nuove, ${diff.changed.length} modificate), rimosse: ${diff.removedIds.length}`);
  console.log(`  batch_sha256 (del file): ${batchSha}`);
  console.log(`\nPer approvarla il Director esegue:`);
  console.log(`  npm run mapping:approve -- ${path.relative(repoRoot, file)}`);
}

function cmdApprove(fileArg: string | undefined): void {
  if (!fileArg) {
    console.error('Uso: npm run mapping:approve -- <path-del-proposal>');
    process.exit(2);
  }
  const file = path.resolve(repoRoot, fileArg);
  if (!existsSync(file)) {
    console.error(`Proposal non trovata: ${fileArg}`);
    process.exit(2);
  }
  const sha = sha256File(file);
  if (!sha) {
    console.error('Impossibile hashare il proposal file');
    process.exit(2);
  }
  const approvalsPath = path.join(repoRoot, APPROVALS_REL);
  mkdirSync(path.dirname(approvalsPath), { recursive: true });
  const approved_at = new Date().toISOString();
  appendFileSync(
    approvalsPath,
    JSON.stringify({
      batch_sha256: sha,
      approved_at,
      approved_by: 'director',
      source: 'mapping:approve',
      proposal: path.relative(repoRoot, file),
    }) + '\n',
  );
  // Stamp audit: segna approved_at sugli entry correnti che corrispondono
  // alla chiave funzionale del batch (i campi audit non contano nel match).
  const proposal = JSON.parse(readFileSync(file, 'utf8')) as MappingProposal;
  const map = loadSurfaceMap(repoRoot);
  let stamped = 0;
  if (map) {
    const keys = new Map(proposal.entries.map((e) => [e.id, functionalKey(e)]));
    const raw = JSON.parse(readFileSync(path.join(repoRoot, SURFACE_MAP_REL), 'utf8'));
    for (const s of raw.surfaces) {
      if (keys.get(s.id) === functionalKey(s)) {
        s.approved_at = approved_at;
        stamped++;
      }
    }
    writeFileSync(path.join(repoRoot, SURFACE_MAP_REL), JSON.stringify(raw, null, 2) + '\n');
  }
  console.log(`Approvato batch ${sha.slice(0, 12)}… → ${APPROVALS_REL}`);
  console.log(`  ${proposal.entries.length} entry nel batch, ${stamped} marcate approved_at nella mappa.`);
}

function cmdStatus(): void {
  const map = loadSurfaceMap(repoRoot);
  if (!map) {
    console.log('Nessuna surface-map.');
    return;
  }
  const diff = diffSurfaceMaps(baselineSurfaceMap(repoRoot), map);
  if (!diff.added.length && !diff.changed.length && !diff.removedIds.length) {
    console.log('Mappa allineata a HEAD — nessuna diff pendente.');
    return;
  }
  console.log(`Diff mappa pendente: ${diff.added.length} nuove, ${diff.changed.length} modificate, ${diff.removedIds.length} rimosse.`);
  for (const s of [...diff.added, ...diff.changed]) console.log(`  entry: ${s.id}`);
  for (const id of diff.removedIds) console.log(`  rimossa: ${id}`);
  console.log('Approva con: npm run mapping:propose → npm run mapping:approve -- <file>');
}

const cmd = args[0];
if (cmd === 'create' || cmd === '--create') cmdCreate();
else if (cmd === 'approve' || cmd === '--approve') cmdApprove(args[1]);
else if (cmd === 'status' || cmd === '--status') cmdStatus();
else {
  console.error('Uso: tsx scripts/mappingProposal.ts create|approve <file>|status');
  process.exit(2);
}
