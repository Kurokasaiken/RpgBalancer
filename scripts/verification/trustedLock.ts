/**
 * trustedLock — hash-lock del trust boundary (PLAN-051 T-002, R-220
 * artifact-r004: "convention → mechanism").
 *
 * Il trust-set copre: GATE_FILES (gate scripts), i componenti frozen
 * (`src/ui/idleVillage/frozen/**`), i trusted docs
 * (`src/docs/docs/idle_village/trusted/*.md`) e il bundler.
 * Il lock vive in `.mw/trusted.lock.json`; il check corre dentro
 * `verify:bundle` (unbypassable — il pre-commit è solo convenienza).
 *
 * Semantica:
 *   lock assente  → ok:true, nota non bloccante (finestra di migrazione:
 *                   il sigillo arriva col canale di approvazione, T-003)
 *   drift         → ok:false, fail-closed
 *   lock presente + file nuovo nel perimetro → drift (il lock non copre
 *   ciò che non esisteva al sigillo).
 *
 * Comandi:
 *   npm run trusted:seal    — riscrive il lock con gli hash correnti
 *                             (azione Director: l'approvazione è T-003)
 *   npm run trusted:check   — verifica read-only, exit 1 su drift
 */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { sha256File, sha256Text } from './gateCore';
import { GATE_FILES } from './contractsCheck';
import { collectSealedCounts } from './invCounts';

export const LOCK_FILE = path.join('.mw', 'trusted.lock.json');

/** Ledger delle approvazioni Director — FUORI dal write-path del repo
 *  (artifact-r004 trust anchor). Upgrade path: firma GPG/SSH (chiave con
 *  passphrase); il ledger out-of-repo è il bound accettato finché la
 *  firma non è configurata. */
export const APPROVALS_DIR = path.join(os.homedir(), '.rpg-approvals');
export const APPROVALS_FILE = path.join(APPROVALS_DIR, 'ledger.jsonl');

/** Directory il cui contenuto è interamente protetto (ricorsivo, file regolari). */
const PROTECTED_DIRS = [
  path.join('src', 'ui', 'idleVillage', 'frozen'),
  path.join('src', 'docs', 'docs', 'idle_village', 'trusted'),
];

/** File singoli protetti oltre GATE_FILES (il bundler protegge sé stesso).
 *  verify-tiers.json e surface-map.json sono dati di controllo: mutarli
 *  cambia il perimetro dei gate → nel trust-set. */
const EXTRA_FILES = [
  path.join('scripts', 'verification', 'bundle.ts'),
  path.join('scripts', 'verification', 'trustedLock.ts'),
  path.join('scripts', 'verification', 'directorApprove.ts'),
  path.join('.mw', 'verify-tiers.json'),
  path.join('.mw', 'surface-map.json'),
];

export interface TrustedLock {
  version: 1;
  sealed_at: string;
  sealed_by: string;
  entries: Record<string, string>;
  /**
   * SHA del commit sigillato (`git rev-parse HEAD` al seal) — la
   * `sealed_base` del sync gate PLAN-054 T-005: ogni manifest con
   * `base_sha` diverso da questo valore fallisce il Pass Globale.
   */
  sealed_base_sha?: string;
  /**
   * Snapshot sigillato degli executedCount per `// INV:<id>` (numero di
   * asserzioni del tentativo finale passed; `'unknown'` per blocchi non
   * strumentati — es. Playwright seal senza `SYNC_GATE=1`).
   */
  executed_counts?: Record<string, number | 'unknown'>;
}

export interface TrustedLockReport {
  ok: boolean;
  lock_present: boolean;
  errors: string[];
  notes: string[];
}

function walkFiles(root: string, dir: string): string[] {
  const abs = path.join(root, dir);
  if (!existsSync(abs)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(abs)) {
    const p = path.join(abs, entry);
    if (statSync(p).isDirectory()) {
      out.push(...walkFiles(root, path.join(dir, entry)));
    } else if (statSync(p).isFile()) {
      out.push(path.join(dir, entry).split(path.sep).join('/'));
    }
  }
  return out;
}

/** Insieme protetto: GATE_FILES + bundler/lock + frozen kits + trusted docs. */
export function protectedSet(repoRoot: string): string[] {
  const files = new Set<string>([...GATE_FILES, ...EXTRA_FILES]);
  for (const dir of PROTECTED_DIRS) {
    for (const f of walkFiles(repoRoot, dir)) files.add(f);
  }
  return [...files].sort();
}

export function buildLock(
  repoRoot: string,
  sealedBy = 'director',
  executedCounts?: Record<string, number | 'unknown'>,
): TrustedLock {
  const entries: Record<string, string> = {};
  for (const rel of protectedSet(repoRoot)) {
    const h = sha256File(path.join(repoRoot, rel));
    if (h) entries[rel] = h;
  }
  let sealed_base_sha: string | undefined;
  try {
    sealed_base_sha = execSync('git rev-parse HEAD', {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    /* repo senza HEAD risolvibile: il sync gate fail-closed sul manifest check */
  }
  return {
    version: 1,
    sealed_at: new Date().toISOString(),
    sealed_by: sealedBy,
    entries,
    ...(sealed_base_sha ? { sealed_base_sha } : {}),
    ...(executedCounts ? { executed_counts: executedCounts } : {}),
  };
}

/** Hash aggregato dello stato corrente del trust-set (ciò che il
 *  Director approva con `npm run approve -- --kind=trust-set`). */
export function setAggregateHash(repoRoot: string): string {
  const entries = protectedSet(repoRoot)
    .map((rel) => `${rel}=${sha256File(path.join(repoRoot, rel)) ?? 'absent'}`)
    .sort()
    .join('\n');
  return sha256Text(entries);
}

/** Il ledger è "stabilito" se contiene almeno un record trust-set.
 *  Da quel momento è lui l'ancora: il lock nel repo resta diagnostico. */
export function ledgerEstablished(approvalsFile = APPROVALS_FILE): boolean {
  if (!existsSync(approvalsFile)) return false;
  return readFileSync(approvalsFile, 'utf8')
    .split('\n')
    .filter(Boolean)
    .some((line) => {
      try {
        return (JSON.parse(line) as { kind?: string }).kind === 'trust-set';
      } catch {
        return false;
      }
    });
}

/** Un'approvazione copre lo stato corrente se il ledger fuori-repo
 *  contiene un record trust-set con lo stesso hash aggregato. */
export function approvalCovers(repoRoot: string, approvalsFile = APPROVALS_FILE): string | null {
  const current = setAggregateHash(repoRoot);
  if (!existsSync(approvalsFile)) return null;
  const lines = readFileSync(approvalsFile, 'utf8').split('\n').filter(Boolean);
  for (const line of lines) {
    try {
      const rec = JSON.parse(line) as { kind?: string; set_sha256?: string; at?: string };
      if (rec.kind === 'trust-set' && rec.set_sha256 === current) {
        return rec.at ?? 'unknown-time';
      }
    } catch {
      /* linea corrotta nel ledger fuori-repo: ignorata, non fidata */
    }
  }
  return null;
}

export function checkTrustedLock(
  repoRoot: string,
  opts: { approvalsFile?: string } = {},
): TrustedLockReport {
  const lockPath = path.join(repoRoot, LOCK_FILE);
  if (!existsSync(lockPath)) {
    return {
      ok: true,
      lock_present: false,
      errors: [],
      notes: ['trusted.lock.json assente — integrity del trust-set non verificata (sigillo in T-003)'],
    };
  }
  const lock = JSON.parse(readFileSync(lockPath, 'utf8')) as TrustedLock;
  const errors: string[] = [];
  const notes: string[] = [];
  const now = protectedSet(repoRoot);
  for (const rel of now) {
    const expected = lock.entries[rel];
    const actual = sha256File(path.join(repoRoot, rel));
    if (!expected) {
      errors.push(`file protetto non coperto dal lock: ${rel}`);
    } else if (!actual) {
      errors.push(`file protetto rimosso: ${rel}`);
    } else if (actual !== expected) {
      errors.push(`drift su file protetto: ${rel}`);
    }
  }
  const approvalsFile = opts.approvalsFile ?? APPROVALS_FILE;
  if (ledgerEstablished(approvalsFile)) {
    // Modo strict: il ledger fuori-repo è l'ancora. Copre l'intero stato
    // corrente → ok anche se il lock locale è stantio (va risigillato).
    // Un lock falsificato dall'agente non copre nulla: l'aggregato dei
    // CONTENUTI protetti è ciò che viene confrontato col ledger.
    const coveredAt = approvalCovers(repoRoot, approvalsFile);
    if (coveredAt) {
      if (errors.length > 0) {
        notes.push(
          `drift coperto da approvazione Director @ ${coveredAt} ` +
            `(ledger fuori-repo) — risigillare con npm run trusted:seal`,
        );
      }
      return { ok: true, lock_present: true, errors: [], notes };
    }
    errors.push(
      'stato del trust-set non approvato: nessun record nel ledger Director ' +
        `(${approvalsFile}) copre l'aggregato corrente`,
    );
    return { ok: false, lock_present: true, errors, notes };
  }
  // Modo debole (finestra di migrazione): ledger non ancora stabilito →
  // il confronto è solo lock-vs-worktree, un lock riforgiato passerebbe.
  // Nota esplicita: il bound reale arriva col primo `npm run approve`.
  if (errors.length > 0) {
    notes.push('ledger Director assente — lock locale non è trust anchor; attivare npm run approve');
  }
  return { ok: errors.length === 0, lock_present: true, errors, notes };
}

function main(): void {
  const mode = process.argv[2] ?? 'check';
  const repoRoot = process.cwd();
  if (mode === 'seal') {
    /* PLAN-054 T-005: il seal cattura anche sealed_base_sha e lo snapshot
     * executedCount per-INV (counts runtime da test-results/ se presente). */
    const lock = buildLock(repoRoot, 'director', collectSealedCounts(repoRoot));
    writeFileSync(path.join(repoRoot, LOCK_FILE), JSON.stringify(lock, null, 2) + '\n');
    console.log(
      `trusted.lock.json sigillato: ${Object.keys(lock.entries).length} file protetti ` +
        `— l'approvazione Director (T-003) copre questo sigillo.`,
    );
    return;
  }
  const rep = checkTrustedLock(repoRoot);
  for (const n of rep.notes) console.log(`  note: ${n}`);
  for (const e of rep.errors) console.error(`  DRIFT: ${e}`);
  console.log(rep.ok ? 'trusted-lock: OK' : 'trusted-lock: FAIL');
  process.exit(rep.ok ? 0 : 1);
}

if (process.argv[1]?.endsWith('trustedLock.ts')) main();
