/**
 * approve — trust anchor Director (PLAN-051 T-003, artifact-r004).
 *
 * Storicamente solo-Director; dal 2026-10-19 (direttiva Director «nn voglio
 * + cose in attesa del direttore») anche gli agenti lo eseguono per drift
 * legittimo — l'entry porta `actor` (`director` default, `--actor=agent:<id>`
 * obbligatorio per l'agente) così il journal resta onesto e auditabile.
 * Con self-approval il trust-set non è più un confine di autorità ma un
 * TRIPWIRE tamper-evident: drift silenzioso (file protetto toccato senza
 * risigillo) resta BLOCKED; la copertura da un agente malintenzionato è
 * fuori threat model (bound onesto già documentato).
 *
 * Uso:
 *   npm run approve -- --kind=trust-set                    # Director
 *   npm run approve -- --kind=trust-set --actor=agent:x    # agente
 *   npm run approve -- --kind=trust-set --note="motivo"    # nota nel journal
 *
 * Bound onesto (registrato nel dibattito): stesso account → un agente
 * potrebbe tecnicamente scrivere il ledger; questo alza il costo della
 * falsificazione da "sloppy" a "circumvention deliberata". Il confine
 * reale arriva con la firma GPG/SSH su chiave Director con passphrase —
 * upgrade path documentato in PLAN-051 §3/OUT.
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  APPROVALS_DIR,
  APPROVALS_FILE,
  LOCK_FILE,
  TrustedLock,
  protectedSet,
  setAggregateHash,
} from './trustedLock';
import { sha256File } from './gateCore';

function main(): void {
  const kind = process.argv.find((a) => a.startsWith('--kind='))?.split('=')[1];
  const actor = process.argv.find((a) => a.startsWith('--actor='))?.split('=')[1] ?? 'director';
  const note = process.argv.find((a) => a.startsWith('--note='))?.split('=').slice(1).join('=');
  if (kind !== 'trust-set') {
    console.error('Uso: npm run approve -- --kind=trust-set [--actor=<who>] [--note="…"]');
    process.exit(2);
  }
  if (actor.startsWith('agent') && !note) {
    console.error('--note obbligatoria per actor=agent:* (il journal deve dire perché)');
    process.exit(2);
  }
  const repoRoot = process.cwd();
  // Il Director deve VEDERE cosa approva: mostra il drift vs il lock
  // corrente prima di registrare l'entry (approvazione informata).
  const lockPath = path.join(repoRoot, LOCK_FILE);
  if (existsSync(lockPath)) {
    try {
      const lock = JSON.parse(readFileSync(lockPath, 'utf8')) as TrustedLock;
      const current = new Set(protectedSet(repoRoot));
      for (const rel of [...current].sort()) {
        const expected = lock.entries[rel];
        const actual = sha256File(path.join(repoRoot, rel));
        if (!expected) console.log(`  + nuovo protetto: ${rel}`);
        else if (!actual) console.log(`  - rimosso: ${rel}`);
        else if (actual !== expected) console.log(`  ~ drift: ${rel}`);
      }
    } catch {
      console.log('  (lock corrotto — drift non visualizzabile)');
    }
  } else {
    console.log('  (nessun lock — approvazione dello stato corrente come baseline)');
  }
  const hash = setAggregateHash(repoRoot);
  mkdirSync(APPROVALS_DIR, { recursive: true });
  const rec = {
    kind,
    set_sha256: hash,
    at: new Date().toISOString(),
    repo: path.basename(process.cwd()),
    user: os.userInfo().username,
    actor,
    ...(note ? { note } : {}),
  };
  const existed = existsSync(APPROVALS_FILE);
  appendFileSync(APPROVALS_FILE, JSON.stringify(rec) + '\n');
  console.log(
    `approvazione registrata ${existed ? '(append) ' : '(ledger creato) '}→ ${APPROVALS_FILE}`,
  );
  console.log(`trust-set sha256: ${hash.slice(0, 16)}…`);
}

main();
