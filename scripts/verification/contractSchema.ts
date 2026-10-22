/**
 * contractSchema — PLAN-054 T-002: schema Zod dei contratti vivi,
 * adozione idempotente dei `CTR-game-*` legacy, indice inverso
 * componente→CTR, check kernel↔CTR e ratchet strutturale/asserzioni
 * su `BASE`.
 *
 * Formato contratto: markdown con frontmatter YAML `---` iniziale
 * validato Zod. I contratti `CTR-game-001..004` pre-esistenti (senza
 * frontmatter) sono adottati con `adoptLegacyCtr` — idempotente: lo
 * stesso file ri-emesso produce byte identici.
 */
import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import yaml from 'js-yaml';
import { z } from 'zod';
import { sha256Text } from './gateCore';
import {
  checkInventory,
  COMPONENTS_DIR_REL,
  INVENTORY_REL,
  kernelConsumers,
  loadInventory,
  type ComponentInventory,
  type InventoryUnit,
} from './componentInventory';
import { assertionRatchet, invTagPositions, scanInvBlocks, type InvBlock } from './invBlocks';
import { surfaceImportGraph } from './discoverGameSurface';
import { loadRedFirst, retireAuthorizesInv } from './redFirst';

export const CONTRACTS_DIR_REL = '.mw/contracts';
const CTR_FILE_RE = /^CTR-game-\d+\.md$/;

/* ------------------------------------------------------------------ */
/* Schemi Zod                                                          */
/* ------------------------------------------------------------------ */

export const INV_SOURCE = ['director-bug', 'director-spec', 'plan', 'code-baseline'] as const;
export type InvSource = (typeof INV_SOURCE)[number];

export const invariantSchema = z.object({
  id: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9_.-]*$/),
  source: z.enum(INV_SOURCE),
  source_ref: z.string().optional(),
  statement: z.string().min(1),
  test_refs: z.array(z.string()).default([]),
});
export type ContractInvariant = z.infer<typeof invariantSchema>;

const checksShape = {
  fast_checks: z.array(z.string()).default([]),
  e2e_checks: z.array(z.string()).default([]),
  e2e_trigger_globs: z.array(z.string()).default([]),
  invariants: z.array(invariantSchema).default([]),
};

export const componentContractSchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9.-]*$/),
  kind: z.literal('component'),
  role: z.enum(['ui-component', 'shared-kernel']),
  tier: z.union([z.literal(1), z.literal(2)]),
  root_file: z.string().min(1),
  scope_files: z.array(z.string()).min(1),
  ...checksShape,
});
export type ComponentContract = z.infer<typeof componentContractSchema>;

export const integrationContractSchema = z.object({
  id: z.string().regex(/^CTR-game-\d+$/),
  kind: z.literal('integration'),
  components: z.array(z.string()).min(2),
  /** File esterni a STRICT_FILES citati dal contratto (es. hook/config fuori superficie). */
  external_dependencies: z.array(z.string()).default([]),
  ...checksShape,
});
export type IntegrationContract = z.infer<typeof integrationContractSchema>;

export type Contract =
  | { kind: 'component'; data: ComponentContract }
  | { kind: 'integration'; data: IntegrationContract };

/* ------------------------------------------------------------------ */
/* Parsing                                                             */
/* ------------------------------------------------------------------ */

export interface ParsedContractFile {
  file: string;
  contract: Contract | null;
  /** Formato rilevato: frontmatter nuovo schema o legacy (adozione pendente). */
  format: 'frontmatter' | 'legacy' | 'none';
  errors: string[];
  warnings: string[];
}

const FM_RE = /^---\n([\s\S]*?)\n---/;

/** Parse + validazione Zod del frontmatter di un contratto. */
export function parseContractFile(file: string, text: string): ParsedContractFile {
  const out: ParsedContractFile = { file, contract: null, format: 'none', errors: [], warnings: [] };
  const fm = text.match(FM_RE);
  if (!fm) {
    if (CTR_FILE_RE.test(file)) {
      out.format = 'legacy';
      out.warnings.push(`${file}: formato legacy senza frontmatter — adozione pendente`);
      return out;
    }
    out.errors.push(`${file}: frontmatter YAML mancante`);
    return out;
  }
  out.format = 'frontmatter';
  let raw: unknown;
  try {
    raw = yaml.load(fm[1]);
  } catch (e) {
    out.errors.push(`${file}: frontmatter YAML non parsabile — ${(e as Error).message}`);
    return out;
  }
  if (typeof raw !== 'object' || raw === null) {
    out.errors.push(`${file}: frontmatter non è un oggetto YAML`);
    return out;
  }
  const kind = (raw as { kind?: unknown }).kind;
  const schema = kind === 'component' ? componentContractSchema : kind === 'integration' ? integrationContractSchema : null;
  if (!schema) {
    out.errors.push(`${file}: kind "${String(kind)}" non riconosciuto (atteso component|integration)`);
    return out;
  }
  const res = schema.safeParse(raw);
  if (!res.success) {
    out.errors.push(
      `${file}: schema non valido — ${res.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`,
    );
    return out;
  }
  out.contract =
    kind === 'component'
      ? { kind: 'component', data: res.data as ComponentContract }
      : { kind: 'integration', data: res.data as IntegrationContract };
  return out;
}

/* ------------------------------------------------------------------ */
/* Normalizzazione per il ratchet                                       */
/* ------------------------------------------------------------------ */

/** Insiemi confrontabili di un contratto (3NF). */
export interface ContractFingerprint {
  members: string[]; // scope_files (component) | components (integration)
  externals: string[]; // external_dependencies (solo integration)
  checks: string[];
  invariantIds: string[];
  statements: Record<string, string>;
  fingerprint: string;
}

const canonStatement = (s: string) => s.replace(/\s+/g, ' ').trim();

export function fingerprintContract(c: Contract): ContractFingerprint {
  const data = c.data;
  const members = c.kind === 'component' ? [...data.scope_files] : [...(data as IntegrationContract).components];
  const externals = c.kind === 'integration' ? [...(data as IntegrationContract).external_dependencies] : [];
  const checks = [
    ...(data as IntegrationContract).e2e_checks,
    ...(data as IntegrationContract).fast_checks,
    ...(data as IntegrationContract).e2e_trigger_globs,
  ].sort();
  const invariants = (data as IntegrationContract).invariants ?? [];
  const statements: Record<string, string> = {};
  for (const inv of invariants) statements[inv.id] = canonStatement(inv.statement);
  const invariantIds = invariants.map((i) => i.id).sort();
  return {
    members: [...members].sort(),
    externals: [...externals].sort(),
    checks,
    invariantIds,
    statements,
    fingerprint: sha256Text(
      JSON.stringify({ members: [...members].sort(), externals: [...externals].sort(), checks, invariantIds, statements }),
    ),
  };
}

/* ------------------------------------------------------------------ */
/* Legacy adapter + adozione idempotente                                */
/* ------------------------------------------------------------------ */

export interface LegacyCtr {
  id: string;
  componentFiles: string[];
  invariantTexts: string[];
  sourceLine: string;
  status: string;
}

/** Estrae i campi strutturati di un contratto CTR nel formato legacy. */
export function parseLegacyCtr(file: string, text: string): LegacyCtr {
  const id = file.replace(/\.md$/, '');
  const compLine = text.match(/\*\*components:\*\*\s*([^\n]+)/);
  const componentFiles = compLine
    ? compLine[1]
        .split(',')
        .map((s) => s.trim().replace(/`/g, ''))
        .filter((s) => s.startsWith('src/'))
    : [];
  const invBlock = text.match(/\*\*invariant:\*\*\s*([\s\S]*?)(?=\n\*\*|$)/);
  const invariantTexts: string[] = [];
  if (invBlock) {
    for (const raw of invBlock[1].split('\n')) {
      const line = raw.trim();
      if (!line) continue;
      const item = line.match(/^\d+\.\s*(.*)$/);
      if (item) invariantTexts.push(item[1].trim());
      else if (invariantTexts.length) invariantTexts[invariantTexts.length - 1] += ` ${line}`;
      else invariantTexts.push(line);
    }
  }
  const sourceLine = (text.match(/\*\*source:\*\*\s*([^\n]+)/) ?? [null, ''])[1]!.trim();
  const status = (text.match(/\*\*status:\*\*\s*`?(\w+)`?/) ?? [null, 'draft'])[1]!;
  return { id, componentFiles, invariantTexts, sourceLine, status };
}

/** Mappa la riga `**source:**` legacy alla sorgente INV dello schema. */
export function legacySource(sourceLine: string): { source: InvSource; source_ref?: string } {
  const r = sourceLine.match(/R-(\d+)/);
  if (r) return { source: 'director-bug', source_ref: `R-${r[1]}` };
  const p = sourceLine.match(/PLAN-(\d+)/);
  if (p) return { source: 'plan', source_ref: `PLAN-${p[1]}` };
  const reg = sourceLine.match(/REG-(\d+)/);
  if (reg) return { source: 'code-baseline', source_ref: `REG-${reg[1]}` };
  return { source: 'code-baseline', source_ref: sourceLine || undefined };
}

/** id INV sintetizzati per un CTR legacy (deterministici — stesso schema a BASE e WT). */
export const legacyInvId = (ctrId: string, idx: number) => `${ctrId}.INV-${idx + 1}`;

/** Riferimenti a file di test nel testo del contratto. */
function testRefsIn(text: string): string[] {
  return [...new Set([...text.matchAll(/tests\/[A-Za-z0-9_./-]+\.(?:ts|tsx)/g)].map((m) => m[0]))].sort();
}

/**
 * Emissione canonica del frontmatter di adozione: il corpo legacy resta
 * intatto sotto. Ri-eseguire sul file già adottato produce byte identici.
 */
export function adoptLegacyCtr(
  file: string,
  text: string,
  resolveUnit: (file: string) => string | null,
): { content: string; errors: string[] } {
  const errors: string[] = [];
  const legacy = parseLegacyCtr(file, text);
  const components = new Set<string>();
  const externals = new Set<string>();
  for (const f of legacy.componentFiles) {
    const u = resolveUnit(f);
    if (u) components.add(u);
    else externals.add(f);
  }
  const src = legacySource(legacy.sourceLine);
  const refs = testRefsIn(text);
  const fm: IntegrationContract = {
    id: legacy.id,
    kind: 'integration',
    components: [...components].sort(),
    external_dependencies: [...externals].sort(),
    fast_checks: [],
    e2e_checks: [],
    e2e_trigger_globs: [],
    invariants: legacy.invariantTexts.map((statement, i) => ({
      id: legacyInvId(legacy.id, i),
      source: src.source,
      ...(src.source_ref ? { source_ref: src.source_ref } : {}),
      statement: canonStatement(statement),
      test_refs: refs,
    })),
  };
  const head = `---\n${yaml.dump(fm, { lineWidth: 120, noRefs: true, sortKeys: false })}---\n`;
  const body = text.replace(FM_RE, '').replace(/^\s+/, '');
  return { content: head + body, errors };
}

/* ------------------------------------------------------------------ */
/* Indice inverso component → CTR                                       */
/* ------------------------------------------------------------------ */

/** component_id → CTR che lo includono (derivato, mai duplicato a mano). */
export function inverseCtrIndex(contracts: IntegrationContract[]): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const c of contracts) {
    for (const comp of c.components) out[comp] = [...(out[comp] ?? []), c.id].sort();
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Ratchet strutturale su BASE                                          */
/* ------------------------------------------------------------------ */

function git(repoRoot: string, args: string): string {
  return execSync(`git ${args}`, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
    maxBuffer: 32 * 1024 * 1024,
  });
}

function filesAtBaseline(repoRoot: string, rel: string, baseline: string): string[] {
  try {
    return git(repoRoot, `ls-tree -r ${baseline} --name-only -- ${rel}`).split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

function textAtBaseline(repoRoot: string, rel: string, baseline: string): string | null {
  try {
    return git(repoRoot, `show ${baseline}:${rel}`);
  } catch {
    return null;
  }
}

/**
 * Normalizza anche un CTR legacy a fingerprint: members = unit ids
 * risolti dal componentFiles legacy via `resolveUnit`, invariants
 * sintetizzati `INV-i` — la stessa forma prodotta dall'adozione, così
 * aggiungere il frontmatter è ratchet-neutrale.
 */
function fingerprintAtBaseline(
  file: string,
  text: string,
  resolveUnit: (f: string) => string | null,
): ContractFingerprint | null {
  if (FM_RE.test(text)) {
    const parsed = parseContractFile(file, text);
    return parsed.contract ? fingerprintContract(parsed.contract) : null;
  }
  if (!CTR_FILE_RE.test(file)) return null;
  const legacy = parseLegacyCtr(file, text);
  const members = legacy.componentFiles.map(resolveUnit).filter((u): u is string => !!u).sort();
  const externals = legacy.componentFiles.filter((f) => !resolveUnit(f)).sort();
  const statements: Record<string, string> = {};
  legacy.invariantTexts.forEach((s, i) => (statements[legacyInvId(legacy.id, i)] = canonStatement(s)));
  const invariantIds = Object.keys(statements).sort();
  return {
    members,
    externals,
    checks: [],
    invariantIds,
    statements,
    fingerprint: sha256Text(JSON.stringify({ members, externals, checks: [], invariantIds, statements })),
  };
}

/**
 * Ratchet strutturale `.mw/contracts/**` su BASE (WITNESS-02/09): da un
 * contratto presente a BASE non si possono rimuovere `scope_files` /
 * `components` / check / `invariants[].id`, né mutare lo `statement`
 * di un INV esistente, senza sha256-approval / red:retire (T-005).
 */
export function structuralRatchet(
  repoRoot: string,
  baseline: string,
  resolveUnit: (f: string) => string | null,
): { errors: string[] } {
  const errors: string[] = [];
  const wtAll = new Set(
    listMd(join(repoRoot, CONTRACTS_DIR_REL), '')
      .filter((f) => f !== 'INDEX.md' && !f.endsWith('/INDEX.md'))
      .map((f) => `${CONTRACTS_DIR_REL}/${f}`),
  );

  const baseFiles = filesAtBaseline(repoRoot, CONTRACTS_DIR_REL, baseline).filter(
    (f) => f.endsWith('.md') && !f.endsWith('/INDEX.md') && f !== `${CONTRACTS_DIR_REL}/INDEX.md`,
  );

  for (const rel of baseFiles) {
    if (!wtAll.has(rel)) {
      errors.push(`contratto rimosso: ${rel} — serve sha256-approval Director (ratchet strutturale)`);
      continue;
    }
    const baseText = textAtBaseline(repoRoot, rel, baseline);
    const wtText = readFileSync(join(repoRoot, rel), 'utf8');
    if (!baseText) continue;
    const bFp = fingerprintAtBaseline(rel, baseText, resolveUnit);
    const wParsed = parseContractFile(rel, wtText);
    if (!wParsed.contract) {
      /* Legacy non ancora adottato: confronta legacy→legacy. */
      const wFp = fingerprintAtBaseline(rel, wtText, resolveUnit);
      if (!wFp || !bFp) continue;
      ratchetSets(rel, bFp, wFp, errors);
      continue;
    }
    if (!bFp) continue;
    ratchetSets(rel, bFp, fingerprintContract(wParsed.contract), errors);
  }
  return { errors };
}

function ratchetSets(rel: string, b: ContractFingerprint, w: ContractFingerprint, errors: string[]): void {
  const wMembers = new Set(w.members);
  for (const m of b.members) if (!wMembers.has(m)) errors.push(`${rel}: membro rimosso dal contratto — ${m}`);
  const wExternals = new Set(w.externals);
  for (const m of b.externals) if (!wExternals.has(m)) errors.push(`${rel}: external_dependency rimossa — ${m}`);
  const wChecks = new Set(w.checks);
  for (const c of b.checks) if (!wChecks.has(c)) errors.push(`${rel}: check rimosso — ${c}`);
  const wInv = new Set(w.invariantIds);
  for (const id of b.invariantIds) {
    if (!wInv.has(id)) {
      errors.push(`${rel}: INV ${id} rimosso — serve red:retire/sha256-approval`);
      continue;
    }
    if (b.statements[id] !== w.statements[id]) {
      errors.push(`${rel}: statement di ${id} mutato senza red:retire`);
    }
  }
}

/* ------------------------------------------------------------------ */
/* Provenance + copertura (T-004)                                       */
/* ------------------------------------------------------------------ */

/**
 * Un `source_ref` è risolvibile se punta a un documento presente:
 * `R-NNN` → riga in `RICHIESTE.md`; `PLAN-NNN` → `plans/PLAN-NNN-*.md`;
 * `REG-NNN` → citato in un `*_error_registry.md`. A BASE questa stessa
 * risoluzione gira su `git show <baseline>:<doc>` (usata da
 * `isFullCoverageAtBase`); nel worktree basta la presenza del doc.
 */
export function sourceRefExists(repoRoot: string, ref: string, baseline?: string): boolean {
  const read = (rel: string): string | null => {
    if (baseline) {
      try {
        return git(repoRoot, `show ${baseline}:${rel}`);
      } catch {
        return null;
      }
    }
    try {
      return readFileSync(join(repoRoot, rel), 'utf8');
    } catch {
      return null;
    }
  };
  const rMatch = ref.match(/^R-(\d+)$/);
  if (rMatch) return (read('RICHIESTE.md') ?? '').includes(`R-${rMatch[1]}`);
  const pMatch = ref.match(/^PLAN-(\d+)$/);
  if (pMatch) {
    if (baseline) {
      try {
        return git(repoRoot, `ls-tree ${baseline} --name-only plans/`)
          .split('\n')
          .some((n) => n.startsWith(`PLAN-${pMatch[1]}-`) || n === `PLAN-${pMatch[1]}.md`);
      } catch {
        return false;
      }
    }
    const plansDir = join(repoRoot, 'plans');
    if (!existsSync(plansDir)) return false;
    return readdirSync(plansDir).some((n) => n.startsWith(`PLAN-${pMatch[1]}-`) || n === `PLAN-${pMatch[1]}.md`);
  }
  const regMatch = ref.match(/^REG-(\d+)$/);
  if (regMatch) {
    if (baseline) {
      try {
        return git(repoRoot, `grep -l "${ref}" ${baseline} -- "src/docs/**"`).length > 0;
      } catch {
        return false;
      }
    }
    const docsDir = join(repoRoot, 'src/docs/docs/idle_village');
    if (!existsSync(docsDir)) return false;
    return readdirSync(docsDir)
      .filter((n) => n.endsWith('.md'))
      .some((n) => readFileSync(join(docsDir, n), 'utf8').includes(ref));
  }
  return false;
}

/**
 * `isFullCoverage(contractAtBase)` — definizione artifact-r009:
 * il contratto esiste a `BASE`, ogni INV ha ≥1 test_ref, e almeno un
 * INV ha `source !== 'code-baseline'` con provenance risolvibile a
 * `BASE`. Il join "test_ref passed nello snapshot sigillato + nella run
 * corrente" è la metà runtime: implementato dal sync gate (T-005) con
 * `.mw/trusted.lock.json` e il runner report — qui la parte statica
 * fail-closed valutabile a compile-time del gate.
 */
export function isFullCoverageAtBase(
  repoRoot: string,
  contractRel: string,
  baseline: string,
): { full: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const text = textAtBaseline(repoRoot, contractRel, baseline);
  if (!text) return { full: false, reasons: [`${contractRel} assente a ${baseline}`] };
  const parsed = parseContractFile(contractRel, text);
  if (!parsed.contract) return { full: false, reasons: [`${contractRel}: non parsabile a ${baseline}`] };
  const invs = parsed.contract.data.invariants;
  if (!invs.length) reasons.push('zero invariants a BASE');
  for (const inv of invs) {
    if (!inv.test_refs.length) reasons.push(`${inv.id}: zero test_refs a BASE`);
    if (inv.source !== 'code-baseline' && (!inv.source_ref || !sourceRefExists(repoRoot, inv.source_ref, baseline))) {
      reasons.push(`${inv.id}: provenance ${inv.source}:${inv.source_ref ?? '?'} non risolvibile a ${baseline}`);
    }
  }
  if (!invs.some((i) => i.source !== 'code-baseline')) reasons.push('nessun INV con provenance non-baseline');
  return { full: reasons.length === 0, reasons };
}

/* ------------------------------------------------------------------ */
/* checkLivingContracts — il pezzo PLAN-054 del gate                    */
/* ------------------------------------------------------------------ */

export interface LivingContractsReport {
  contracts_loaded: number;
  components: number;
  integrations: number;
  inv_blocks: { total: number; extractable: number; added: string[]; changed: string[] };
  kernels_shared_without_ctr: string[];
  errors: string[];
  warnings: string[];
}

function listMd(dir: string, rel: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const n of readdirSync(dir)) {
    const abs = join(dir, n);
    const r = rel ? `${rel}/${n}` : n;
    if (statSync(abs).isDirectory()) listMd(abs, r, out);
    else if (n.endsWith('.md')) out.push(r);
  }
  return out;
}

/**
 * Il sotto-gate PLAN-054 T-002, eseguito a ogni `contracts:check`:
 *  1. tutti i contratti `.mw/contracts/**` parse+schema validi;
 *  2. partizione: ogni STRICT_FILE esattamente 1 owner (vs inventory.json
 *     committato — la rigaenerazione meccanica vive in componentInventory);
 *  3. ogni CTR lega ≥2 componenti e gli id risolvono in unità note;
 *  4. kernel consumato da ≥2 unità senza CTR comune → WARNING in T-002
 *     (i CTR-game-006..009 di T-003 e i contratti per-componente di T-004
 *     non esistono ancora — enforcement a T-005);
 *  5. ratchet strutturale + ratchet asserzioni `// INV:<id>` su BASE;
 *  6. unicità globale dei tag `// INV:<id>` (FAIL con entrambi i file).
 */
/**
 * Il sotto-gate PLAN-054 è attivo se esiste la dir `components/` o se a
 * BASE esistevano contratti (una cancellazione totale deve restare
 * segnalata dal ratchet, non rendere il gate dormiente).
 */
export function livingContractsActive(repoRoot: string, baseline = 'HEAD'): boolean {
  const contractsDir = join(repoRoot, CONTRACTS_DIR_REL);
  if (existsSync(join(contractsDir, 'components'))) return true;
  return (
    filesAtBaseline(repoRoot, CONTRACTS_DIR_REL, baseline).filter(
      (f) => f.endsWith('.md') && !f.endsWith('/INDEX.md') && f !== `${CONTRACTS_DIR_REL}/INDEX.md`,
    ).length > 0
  );
}

export function checkLivingContracts(
  repoRoot: string,
  opts: { baseline?: string } = {},
): LivingContractsReport {
  const baseline = opts.baseline ?? 'HEAD';
  const errors: string[] = [];
  const warnings: string[] = [];
  const report: LivingContractsReport = {
    contracts_loaded: 0,
    components: 0,
    integrations: 0,
    inv_blocks: { total: 0, extractable: 0, added: [], changed: [] },
    kernels_shared_without_ctr: [],
    errors,
    warnings,
  };

  /* Fail-closed: il sotto-gate è inattivo solo se il sistema PLAN-054 non
   * è mai esistito (nessuna dir components e nessun contratto a BASE).
   * Se la dir sparisce su un repo che aveva contratti, il ratchet
   * strutturale su BASE segnala ogni file rimosso. */
  const contractsDir = join(repoRoot, CONTRACTS_DIR_REL);
  if (!livingContractsActive(repoRoot, baseline)) {
    return report;
  }
  const mdFiles = listMd(contractsDir, '').filter((f) => f !== 'INDEX.md' && f !== 'components/inventory.json');
  const parsed = new Map<string, ParsedContractFile>();
  const integrations: IntegrationContract[] = [];
  const components = new Map<string, ComponentContract>();
  for (const rel of mdFiles) {
    const abs = join(contractsDir, rel);
    const p = parseContractFile(rel, readFileSync(abs, 'utf8'));
    parsed.set(rel, p);
    errors.push(...p.errors);
    warnings.push(...p.warnings);
    if (p.contract) {
      report.contracts_loaded++;
      if (p.contract.kind === 'component') {
        components.set(p.contract.data.id, p.contract.data);
        report.components++;
      } else {
        integrations.push(p.contract.data);
        report.integrations++;
      }
    }
  }

  /* 2. Partizione: inventory committato vs partizione live + scope dei
   * contratti componente (checkInventory fail-closed su drift). */
  try {
    const ci = checkInventory(repoRoot);
    errors.push(...ci.errors);
    warnings.push(...ci.warnings);
  } catch (e) {
    errors.push(`inventory check non eseguito: ${(e as Error).message}`);
  }
  const inv: ComponentInventory | null = loadInventory(repoRoot);
  const unitById = new Map<string, InventoryUnit>((inv?.units ?? []).map((u) => [u.id, u]));
  const fileOwner = new Map<string, string[]>();
  if (inv) {
    for (const u of inv.units) {
      if (u.role === 'shared-kernel' && u.tier !== 1) errors.push(`shared-kernel ${u.id} con tier ${u.tier} — non declassabile da tier 1`);
      for (const f of u.scope_files) fileOwner.set(f, [...(fileOwner.get(f) ?? []), u.id]);
    }
    for (const f of inv.strict_files) {
      const n = fileOwner.get(f)?.length ?? 0;
      if (n === 0) errors.push(`STRICT_FILES con 0 owner: ${f}`);
      else if (n > 1) errors.push(`STRICT_FILES con ${n} owner: ${f} — ${fileOwner.get(f)!.join(', ')}`);
    }
    /* Contratti componente: scope_files deve coincidere con l'unità. */
    for (const [id, c] of components) {
      const unit = unitById.get(id);
      if (!unit) {
        warnings.push(`contratto ${id}: unità non presente in inventory.json`);
        continue;
      }
      const a = [...c.scope_files].sort().join('|');
      const b = [...unit.scope_files].sort().join('|');
      if (a !== b) errors.push(`contratto ${id}: scope_files diverge dall'unità in inventory`);
    }
  } else {
    errors.push(`${INVENTORY_REL} assente — inventario T-002 richiesto`);
  }

  /* 3. CTR: ≥2 componenti + id risolvibili. */
  for (const c of integrations) {
    if (c.components.length < 2) errors.push(`${c.id}: lega ${c.components.length} componenti (<2)`);
    for (const comp of c.components) {
      if (!unitById.has(comp)) errors.push(`${c.id}: component id ignoto "${comp}"`);
    }
  }

  /* 4. Kernel consumati da ≥2 unità senza CTR comune (WARNING in T-002 —
   * enforcement a T-005 quando CTR-006..009 + contratti componente
   * esistono: oggi renderebbe il gate rosso a priori su ~47 kernel). */
  try {
    const graph = surfaceImportGraph(repoRoot);
    const consumers = kernelConsumers(inv?.units ?? [], graph.edges);
    const ctrIndex = inverseCtrIndex(integrations);
    for (const [k, cs] of Object.entries(consumers)) {
      if (cs.length < 2) continue;
      const covered = cs.filter((u) => (ctrIndex[u] ?? []).length > 0 || integrations.some((c) => c.components.includes(k)));
      const pairCovered = integrations.some(
        (c) => c.components.filter((x) => x === k || cs.includes(x)).length >= 2,
      );
      if (!pairCovered) report.kernels_shared_without_ctr.push(`${k} ← ${cs.length} consumatori (${covered.length} con CTR)`);
    }
    if (report.kernels_shared_without_ctr.length) {
      warnings.push(
        `kernel condivisi senza CTR comune (enforcement T-005): ${report.kernels_shared_without_ctr.length}`,
      );
    }
  } catch (e) {
    warnings.push(`kernel-consumer check non eseguito: ${(e as Error).message}`);
  }

  /* 5. Ratchet strutturale + asserzioni su BASE. */
  const scopeOwner = new Map<string, string>();
  for (const u of unitById.values()) for (const f of u.scope_files) scopeOwner.set(f, u.id);
  const resolveUnit = (f: string) => scopeOwner.get(f) ?? null;
  errors.push(...structuralRatchet(repoRoot, baseline, resolveUnit).errors);

  /* INV blocks WT: scansione di tutti i file di test con tag. */
  const testFiles: { path: string; text: string }[] = [];
  const scanDir = (d: string) => {
    if (!existsSync(d)) return;
    for (const n of readdirSync(d)) {
      const abs = join(d, n);
      if (abs.includes('__snapshots__')) continue;
      if (statSync(abs).isDirectory()) {
        scanDir(abs);
      } else if (/\.(ts|tsx)$/.test(n)) {
        const text = readFileSync(abs, 'utf8');
        if (invTagPositions(text).length) testFiles.push({ path: abs, text });
      }
    }
  };
  scanDir(join(repoRoot, 'tests'));
  const wtScan = scanInvBlocks(testFiles);
  report.inv_blocks.total = wtScan.blocks.length;
  report.inv_blocks.extractable = wtScan.blocks.filter((b) => b.extractable).length;
  errors.push(...wtScan.errors.map((e) => e));
  for (const [id, files] of Object.entries(wtScan.duplicates)) {
    errors.push(`INV:${id} duplicato in ${files.join(' e ')} — tag globalmente unici richiesti`);
  }
  for (const b of wtScan.blocks) {
    if (!b.extractable) errors.push(`INV:${b.id} (${b.file}): ${b.notExtractableReason}`);
    if (b.skipped) errors.push(`INV:${b.id} (${b.file}): test marcato skip/todo/fixme — un INV deve essere eseguibile`);
  }

  /* 5b. Join dichiarazione↔binding (T-004): ogni INV id dichiarato in un
   * contratto (component o integration) deve avere un blocco // INV:<id>
   * estratto, e ogni blocco estratto deve essere dichiarato — un tag
   * orfano è drift di contratto, una dichiarazione senza tag è coverage
   * non dimostrabile. */
  const scannedIds = new Set(wtScan.blocks.map((b) => b.id));
  const declaredIds = new Set<string>();
  for (const c of [...components.values(), ...integrations]) {
    for (const inv of c.invariants) {
      if (declaredIds.has(inv.id)) errors.push(`INV ${inv.id} dichiarato in due contratti`);
      declaredIds.add(inv.id);
      if (!scannedIds.has(inv.id)) {
        errors.push(`${c.id}: invariant ${inv.id} dichiarato senza blocco // INV:${inv.id} in tests/**`);
      }
    }
  }
  for (const b of wtScan.blocks) {
    if (!declaredIds.has(b.id)) errors.push(`// INV:${b.id} in ${b.file} non dichiarato in alcun contratto`);
  }

  /* 5c. Prerequisiti isFullCoverage per i tier-1 (T-004): ≥1 INV con
   * test_ref e ≥1 INV con source !== 'code-baseline' la cui source_ref
   * risolve a un documento presente (a BASE dopo il seal: RICHIESTE.md
   * / plans/). Il join con lo snapshot sigillato e la run corrente è
   * valutato dal sync gate (T-005). */
  for (const [id, c] of components) {
    const unit = unitById.get(id);
    if (!unit || unit.tier !== 1) continue;
    if (!c.invariants.length) {
      errors.push(`contratto tier-1 ${id}: zero invariants — coverage non dimostrabile`);
      continue;
    }
    if (c.invariants.some((inv) => !inv.test_refs.length)) {
      errors.push(`contratto tier-1 ${id}: invariant senza test_refs`);
    }
    const prov = c.invariants.filter((inv) => inv.source !== 'code-baseline');
    if (!prov.length) {
      errors.push(`contratto tier-1 ${id}: nessun INV con provenance (tutti code-baseline)`);
    } else if (!prov.some((inv) => inv.source_ref && sourceRefExists(repoRoot, inv.source_ref))) {
      errors.push(`contratto tier-1 ${id}: nessuna source_ref risolvibile (${prov.map((i) => i.source_ref ?? '?').join(', ')})`);
    }
  }

  /* INV blocks BASE: file con tag a BASE (un `git grep`, non N `git show`). */
  const baseTestFiles: { path: string; text: string }[] = [];
  try {
    const tagged = git(repoRoot, `grep -l "INV:" ${baseline} -- "tests/**"`).split('\n').filter(Boolean);
    for (const line of tagged) {
      /* `git grep -l <rev>` prefissa ogni path con `<rev>:` — va rimosso
       * altrimenti `git show <rev>:<rev>:<path>` fallisce e la scansione
       * BASE resta muta (ratchet inerte). */
      const rel = line.includes(':') ? line.slice(line.indexOf(':') + 1) : line;
      if (!/\.(ts|tsx)$/.test(rel) || rel.includes('__snapshots__')) continue;
      const text = textAtBaseline(repoRoot, rel, baseline);
      if (text) baseTestFiles.push({ path: rel, text });
    }
  } catch { /* nessun file taggato a BASE */ }
  const baseScan = scanInvBlocks(baseTestFiles);
  /* PLAN-054 T-005: i `redfirst:retire` con R-NNN risolvibile a BASE
   * autorizzano la rimozione/rinomina di un INV nel ratchet globale. */
  const records = loadRedFirst(repoRoot);
  const retired = new Set<string>();
  for (const b of baseScan.blocks) {
    if (retireAuthorizesInv(records, b.id, b.file, (ref) => sourceRefExists(repoRoot, ref, baseline)).ok) {
      retired.add(b.id);
    }
  }
  const ratchet = assertionRatchet(baseScan.blocks, wtScan.blocks, { retired });
  errors.push(...ratchet.errors);
  report.inv_blocks.added = ratchet.added;
  report.inv_blocks.changed = ratchet.changed;

  return report;
}
