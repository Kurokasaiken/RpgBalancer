/**
 * taskClose — chiusura meccanica della contabilità di stato (PLAN-052 T-002,
 * R-230). Converte in un comando ciò che oggi sono 4-6 edit manuali:
 *
 *   1. RICHIESTE.md     — `in corso` → `fatta` + riga di chiusura col bundle
 *   2. plans/INDEX.md   — colonna stato del plan → `completato`
 *   3. SESSION_HANDOFF  — riga di chiusura in testa
 *   4. plan:stamp close  — chiude il ledger di misura (best-effort)
 *   5. stampa una bozza di entry per context/INDEX (review manuale)
 *
 * Fail-closed: richiede un `bundle.json` con verdict PASS in un run dir
 * legato all'entità (nome dir o campo `task` del bundle). Senza bundle PASS
 * non scrive nulla — la prova resta il contratto, lo script è solo il
 * cancelliere. Il gate resta `closure:lint`: questo script non decide se
 * qualcosa è chiuso, scrive ciò che il bundle ha già provato.
 *
 * Uso: npm run task:close -- R-230 | PLAN-052
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const RUNS_DIR = '.mw/runs';

/* ---------- pure ---------- */

/** Normalizza `PLAN-052`/`R-230` nelle forme ricercabili nei nomi dir. */
export function entityAliases(entity: string): string[] {
  const e = entity.toUpperCase();
  const m = e.match(/^(PLAN|R)-(\d+)$/);
  if (!m) return [e.toLowerCase()];
  const kind = m[1] === 'PLAN' ? 'plan' : 'r';
  return [`${kind}-${m[2]}`, `${kind}${m[2]}`];
}

/** Trova il run dir con bundle PASS per l'entità (repo-relativo o null). */
export function findPassBundle(repoRoot: string, entity: string): string | null {
  const root = path.join(repoRoot, RUNS_DIR);
  if (!existsSync(root)) return null;
  const aliases = entityAliases(entity);
  const cands: { rel: string; producedAt: string }[] = [];
  for (const name of readdirSync(root)) {
    const bundlePath = path.join(root, name, 'bundle.json');
    if (!existsSync(bundlePath)) continue;
    const nameHit = aliases.some((a) => name.toLowerCase().includes(a));
    try {
      const b = JSON.parse(readFileSync(bundlePath, 'utf8')) as {
        verdict?: string;
        produced_at?: string;
        task?: string;
      };
      const taskHit = (b.task ?? '').toLowerCase().includes(aliases[0]);
      if (b.verdict !== 'PASS' || (!nameHit && !taskHit)) continue;
      cands.push({ rel: path.join(RUNS_DIR, name, 'bundle.json'), producedAt: b.produced_at ?? '' });
    } catch {
      /* malformed bundle — skip */
    }
  }
  cands.sort((a, b) => b.producedAt.localeCompare(a.producedAt));
  return cands[0]?.rel ?? null;
}

/** Sezione `## <entity>` → `fatta` + riga chiusura; null se non in `in corso`. */
export function closeRichiesta(
  text: string,
  entity: string,
  bundleRel: string,
  today: string,
): string | null {
  const re = new RegExp(`(^## ${entity}\\b[\\s\\S]*?)(?=^## |$(?![\\s\\S]))`, 'm');
  const m = text.match(re);
  if (!m) return null;
  const section = m[1];
  const stato = section.match(/\*\*Stato:\*\*[^\n]*/);
  if (!stato || !stato[0].includes('in corso')) return null;
  const closed = section.replace(
    stato[0],
    `**Stato:** \`fatta\` (${today}) — bundle: \`${bundleRel}\` PASS`,
  );
  return text.replace(section, closed);
}

/** Riga plans/INDEX del plan → colonna stato `completato`. */
export function closePlanIndex(text: string, planId: string): string | null {
  const lines = text.split('\n');
  const idx = lines.findIndex((l) => l.includes(`[${planId}](`));
  if (idx < 0) return null;
  const cells = lines[idx].split('|');
  if (cells.length < 5) return null;
  // cella 3 = status (0 = leading empty before first |)
  if (!/(in corso|baptized|draft)/i.test(cells[3])) return null;
  cells[3] = ' completato ';
  lines[idx] = cells.join('|');
  return lines.join('\n');
}

/** Prepend della riga di chiusura dopo il titolo di SESSION_HANDOFF. */
export function prependHandoff(
  text: string,
  entity: string,
  today: string,
  bundleRel: string,
): string {
  const entry =
    `## ${today} — ${entity} chiuso (task:close)\n\n` +
    `- bundle: \`${bundleRel}\` PASS. Contabilità scritta da \`scripts/taskClose.ts\`.\n\n`;
  const m = text.match(/^# [^\n]*\n/);
  if (!m) return entry + text;
  return m[0] + '\n' + entry + text.slice(m[0].length);
}

/** Bozza entry context/INDEX per review manuale. */
export function indexDraft(entity: string, bundleRel: string): string {
  return `|[${bundleRel}](${bundleRel}) — bundle chiusura ${entity} (PASS) — \`verification\` \`bundle\` \`${entity.toLowerCase()}\``;
}

/* ---------- main ---------- */

function main(): void {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const entity = args.find((a) => /^(r|plan)-\d+$/i.test(a))?.toUpperCase();
  if (!entity) {
    console.error('Uso: npm run task:close -- R-230 | PLAN-059 [--dry-run]');
    process.exit(2);
  }
  const repoRoot = process.cwd();
  const bundleRel = findPassBundle(repoRoot, entity);
  if (!bundleRel) {
    console.error(
      `Nessun bundle PASS trovato per ${entity} in ${RUNS_DIR}/<run>/bundle.json ` +
        '(nome dir o `task` devono contenere l\'id). Il gate decide la chiusura, non questo script.',
    );
    process.exit(1);
  }
  const today = new Date().toISOString().slice(0, 10);
  const writes: string[] = [];

  if (entity.startsWith('R-')) {
    const p = path.join(repoRoot, 'RICHIESTE.md');
    const next = closeRichiesta(readFileSync(p, 'utf8'), entity, bundleRel, today);
    if (next) {
      if (!dryRun) writeFileSync(p, next);
      writes.push('RICHIESTE.md → fatta');
    } else {
      console.log(`RICHIESTE.md: ${entity} non in stato 'in corso' o sezione assente — skip`);
    }
  }
  if (entity.startsWith('PLAN-')) {
    const p = path.join(repoRoot, 'plans', 'INDEX.md');
    const next = closePlanIndex(readFileSync(p, 'utf8'), entity);
    if (next) {
      if (!dryRun) writeFileSync(p, next);
      writes.push('plans/INDEX.md → completato');
    } else {
      console.log(`plans/INDEX.md: riga ${entity} non chiudibile (stato non in corso/baptized) — skip`);
    }
  }
  const hp = path.join(repoRoot, 'SESSION_HANDOFF.md');
  if (existsSync(hp)) {
    if (!dryRun) {
      writeFileSync(hp, prependHandoff(readFileSync(hp, 'utf8'), entity, today, bundleRel));
    }
    writes.push('SESSION_HANDOFF.md → riga in testa');
  }

  if (dryRun) {
    console.log('plan:stamp close: skipped (--dry-run)');
  } else {
    try {
      execFileSync('npx', ['tsx', 'scripts/planTime.ts', 'close', entity], {
        cwd: repoRoot,
        stdio: 'inherit',
      });
    } catch {
      console.log('plan:stamp close: skipped (ledger non aperto o comando fallito — best effort)');
    }
  }

  console.log(`\n${entity} → ${dryRun ? 'dry-run, nessuna scrittura' : 'chiusura registrata'} (${bundleRel})`);
  for (const w of writes) console.log(`  • ${w}`);
  console.log(`\nbozza context/INDEX (review manuale):\n  ${indexDraft(entity, bundleRel)}`);
}

if (process.argv[1]?.endsWith('taskClose.ts')) main();
