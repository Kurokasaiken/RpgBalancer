/**
 * sync:bug — PLAN-054 T-005: dichiara un bug sulla superficie `/game`
 * e aggiorna il living contract in un colpo solo.
 *
 *   npm run sync:bug -- --component <id> --source-ref <R-NNN> --desc "..."
 *       [--invariant <INV-id>] [--test <file>]
 *
 * Fa tre cose:
 *  1. valida `--component` contro `.mw/contracts/components/<id>.md` e
 *     `--source-ref` contro `RICHIESTE.md`/`plans/` (worktree);
 *  2. aggiunge (o aggiorna con `--invariant`) un invariant
 *     `source: director-bug` nel frontmatter del contratto;
 *  3. appende un record `sync-bug` in `.mw/red-first.jsonl` — la
 *     dichiarazione. Il flusso Mode A si completa poi con
 *     `redfirst:record` (run rossa attestata) e il tag `// INV:<id>` nel
 *     test di regressione.
 *
 * Fail-closed: componente sconosciuto, source_ref irrisolvibile o
 * contratto malformato → exit 1 senza scrivere nulla.
 */
import { execSync } from 'node:child_process';
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import {
  CONTRACTS_DIR_REL,
  parseContractFile,
  sourceRefExists,
  type ComponentContract,
} from './contractSchema';
import { RED_FIRST_REL, type RedFirstRecord } from './redFirst';

const FM_RE = /^---\n([\s\S]*?)\n---/;

interface Args {
  component?: string;
  sourceRef?: string;
  desc?: string;
  invariant?: string;
  test?: string;
}

export function parseSyncBugArgs(argv: string[]): Args {
  const arg = (name: string) => {
    const i = argv.indexOf(`--${name}`);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  return {
    component: arg('component'),
    sourceRef: arg('source-ref'),
    desc: arg('desc'),
    invariant: arg('invariant'),
    test: arg('test'),
  };
}

/** Risultato dell'applicazione: contratto riscritto + record appendato. */
export interface SyncBugResult {
  invId: string;
  contractPath: string;
  created: boolean;
}

/**
 * Applica la dichiarazione al contratto del componente. Errori di
 * validazione → lancia Error (il CLI esce 1).
 */
export function applySyncBug(repoRoot: string, args: Args): SyncBugResult {
  if (!args.component || !args.sourceRef || !args.desc) {
    throw new Error('uso: --component <id> --source-ref <R-NNN> --desc "..." [--invariant <id>] [--test <file>]');
  }
  if (!sourceRefExists(repoRoot, args.sourceRef)) {
    throw new Error(`source_ref ${args.sourceRef} non risolvibile — serve un R-NNN in RICHIESTE.md (o PLAN-NNN in plans/)`);
  }
  const rel = `components/${args.component}.md`;
  const abs = path.join(repoRoot, CONTRACTS_DIR_REL, rel);
  let parsed;
  try {
    parsed = parseContractFile(rel, readFileSync(abs, 'utf8'));
  } catch {
    throw new Error(`contratto componente assente: ${CONTRACTS_DIR_REL}/${rel}`);
  }
  if (!parsed.contract || parsed.contract.kind !== 'component') {
    throw new Error(`${rel}: contratto non parsabile o non di kind component — ${parsed.errors.join('; ')}`);
  }
  const c = parsed.contract.data as ComponentContract;

  /* INV id: --invariant (update) o prossimo numero libero del componente.
   * Il massimo si calcola su contratto E tag a BASE: un id di INV ritirato
   * a BASE non viene riciclato, altrimenti il ratchet lo confronta con le
   * asserzioni del blocco BASE orfano (collisione d'identità). */
  let invId = args.invariant;
  let created = false;
  if (!invId) {
    const prefix = args.component.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`^${prefix}\\.INV-(\\d+)$`);
    let n = 0;
    const bump = (id: string) => {
      const m = id.match(re);
      if (m) n = Math.max(n, Number(m[1]));
    };
    for (const inv of c.invariants) bump(inv.id);
    try {
      const out = execSync(`git grep -h "INV:${prefix}.INV-" HEAD -- "tests/**"`, {
        cwd: repoRoot,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
      for (const m of out.matchAll(new RegExp(`INV:(${prefix}\\.INV-\\d+)`, 'g'))) bump(m[1]);
    } catch {
      /* nessun tag BASE per il componente */
    }
    invId = `${args.component}.INV-${n + 1}`;
    created = true;
  } else if (!c.invariants.some((i) => i.id === invId)) {
    created = true;
  }

  const invariants = [...c.invariants];
  const idx = invariants.findIndex((i) => i.id === invId);
  if (idx >= 0) {
    invariants[idx] = {
      ...invariants[idx],
      source: 'director-bug',
      source_ref: args.sourceRef,
      statement: args.desc.replace(/\s+/g, ' ').trim(),
      ...(args.test ? { test_refs: [...new Set([...invariants[idx].test_refs, args.test])] } : {}),
    };
  } else {
    invariants.push({
      id: invId,
      source: 'director-bug',
      source_ref: args.sourceRef,
      statement: args.desc.replace(/\s+/g, ' ').trim(),
      test_refs: args.test ? [args.test] : [],
    });
  }

  /* Riscrittura canonica del frontmatter, corpo intatto. */
  const fm: ComponentContract = { ...c, invariants };
  const head = `---\n${yaml.dump(fm, { lineWidth: 120, noRefs: true, sortKeys: false })}---\n`;
  const body = readFileSync(abs, 'utf8').replace(FM_RE, '').replace(/^\s+/, '');
  writeFileSync(abs, head + body);

  const rec: RedFirstRecord = {
    kind: 'sync-bug',
    test_file: args.test ?? '',
    component: args.component,
    invariant: invId,
    source_ref: args.sourceRef,
    reason: args.desc.slice(0, 300),
    recorded_at: new Date().toISOString(),
    recorded_by: process.env.USER,
  };
  appendFileSync(path.join(repoRoot, RED_FIRST_REL), `${JSON.stringify(rec)}\n`);
  return { invId, contractPath: `${CONTRACTS_DIR_REL}/${rel}`, created };
}

function main(): void {
  try {
    const r = applySyncBug(process.cwd(), parseSyncBugArgs(process.argv.slice(2)));
    console.log(
      `sync:bug ${r.created ? 'creato' : 'aggiornato'} INV:${r.invId} in ${r.contractPath}\n` +
        `  prossimi passi (Mode A): tag // INV:${r.invId} nel test di regressione, ` +
        `poi npm run redfirst:record -- --test <file> --command "<cmd>" --component <id> --invariant ${r.invId} --source-ref <R-NNN>`,
    );
  } catch (e) {
    console.error(`sync:bug FAIL: ${(e as Error).message}`);
    process.exit(1);
  }
}

if (process.argv[1]?.endsWith('syncBug.ts')) main();
