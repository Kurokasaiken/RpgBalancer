#!/usr/bin/env tsx
/**
 * coverage:exception — disposition `coverage_exception` auditabile
 * (PLAN-044 T-002/T-003). Append a `.mw/coverage-exceptions.jsonl`.
 *
 * Un file toccato senza superficie mappata è coperto se una exception con
 * glob corrispondente esiste. Con `--unverified-behavior` (il file ha
 * comportamento non verificato da check meccanici) l'eccezione va in
 * `awaiting_director`: blocca la chiusura finché non esiste un
 * `director_answer` (npm run director:answer -- --exception <id>) legato
 * a hash del record + canonical hash del file coperto — l'agente non si
 * auto-approva.
 *
 * Uso:
 *   tsx scripts/coverageException.ts --glob "<glob>" --reason "<motivo>"
 *       [--scope "<ambito>"] [--unverified-behavior] [--id <id>]
 */
import { appendFileSync, mkdirSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { EXCEPTIONS_REL } from './verification/surfaceMap';

const args = process.argv.slice(2);
function arg(name: string): string | undefined {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
}
const flag = (name: string) => args.includes(`--${name}`);

const glob = arg('glob');
const reason = arg('reason');
const scope = arg('scope');
const unverified = flag('unverified-behavior');
if (!glob || !reason) {
  console.error('Uso: tsx scripts/coverageException.ts --glob "<glob>" --reason "<motivo>" [--scope "<ambito>"] [--unverified-behavior] [--id <id>]');
  process.exit(2);
}

const stamp = new Date().toISOString().replace(/[-:.T]/g, '').slice(0, 14);
const record = {
  id: arg('id') ?? `EXC-${stamp}-${randomBytes(2).toString('hex')}`,
  glob,
  reason,
  scope: scope ?? 'file',
  unverified_behavior: unverified,
  created_at: new Date().toISOString(),
  created_by: process.env.USER ?? 'agent',
};
const file = path.join(process.cwd(), EXCEPTIONS_REL);
mkdirSync(path.dirname(file), { recursive: true });
appendFileSync(file, JSON.stringify(record) + '\n');
console.log(`coverage_exception ${record.id} registrata → ${EXCEPTIONS_REL}`);
console.log(`  glob: ${glob}\n  reason: ${reason}\n  scope: ${record.scope}`);
if (unverified) {
  console.log(`\nawaiting_director: comportamento non verificato — la chiusura resta`);
  console.log(`rossa finché il Director non esegue:`);
  console.log(`  npm run director:answer -- --exception ${record.id} --answer "<testo>"`);
}
