#!/usr/bin/env tsx
import { readdir, stat, readFile, mkdir, writeFile } from 'node:fs/promises';
import { join, relative, dirname, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');

// Directories and root files to inventory
const INVENTORY_DIRS = [
  'src/docs/docs',
  'context',
  'plans',
  '.mw',
  '.windsurf/rules',
  'coordinator',
  'prompts',
];

const ROOT_FILES = [
  'RICHIESTE.md',
  'AGENTS.md',
  'DESIGN_PILLARS.md',
  'ROADMAP.md',
  'SESSION_HANDOFF.md',
  'DESIGN_PILLARS.md',
];

const EXCLUDED_DIRS = [
  'node_modules',
  '.git',
  'dist',
  'public',
  'wanderlust triumph',
  '__pycache__',
  '.cache',
  'coverage',
  'build',
];

const EXCLUDED_EXTS = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.mp3', '.mp4', '.webp', '.ico', '.psd', '.ai', '.pdf', '.zip', '.tar', '.gz', '.tgz', '.woff', '.woff2', '.ttf', '.otf', '.eot', '.DS_Store'];

const EXCLUDED_FILES = ['.DS_Store'];

const ALLOWED_EXTS = ['.md', '.mdx', '.json', '.yaml', '.yml', '.ts', '.tsx', '.js', '.cjs', '.mjs', '.txt'];

interface FileEntry {
  path: string;
  rel: string;
  size: number;
  mtime: string;
  extension: string;
}

interface FileMetadata {
  path: string;
  rel: string;
  title: string;
  markers: string[];
  firstLines: string;
  size: number;
  mtime: string;
  classification?: string;
  reason?: string;
}

type Action = 'list' | 'meta' | 'classify' | 'inventory' | 'conflicts' | 'priority' | 'template' | 'all';

const CLASSIFICATIONS = ['canonical', 'candidate', 'historical', 'transient', 'superseded', 'conflicting', 'uncategorized'] as const;

function parseArgs(): { action: Action; dryRun: boolean } {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const actionIdx = args.indexOf('--action');
  const action = (actionIdx !== -1 ? args[actionIdx + 1] : args[0] || 'all') as Action;
  return { action: action || 'all', dryRun };
}

async function exists(p: string): Promise<boolean> {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

async function walk(dir: string, root: string, entries: FileEntry[] = []): Promise<FileEntry[]> {
  const fullDir = join(root, dir);
  if (!(await exists(fullDir))) return entries;
  const items = await readdir(fullDir, { withFileTypes: true });
  for (const item of items) {
    const rel = dir ? `${dir}/${item.name}` : item.name;
    const full = join(root, rel);
    if (item.isDirectory()) {
      if (EXCLUDED_DIRS.some((d) => item.name === d || item.name.startsWith('.')) && !item.name.startsWith('.mw')) continue;
      if (item.name === '.mw') {
        await walk(rel, root, entries);
      } else if (item.name === 'providers' && rel.includes('.mw/')) {
        // skip .mw/providers sessions (credentials)
        continue;
      } else {
        await walk(rel, root, entries);
      }
    } else if (item.isFile()) {
      const ext = extname(item.name).toLowerCase();
      if (EXCLUDED_FILES.includes(item.name) || EXCLUDED_EXTS.includes(ext)) continue;
      if (!ALLOWED_EXTS.includes(ext) && !item.name.endsWith('.md') && !item.name.endsWith('.json')) continue;
      const s = await stat(full);
      entries.push({
        path: full,
        rel,
        size: s.size,
        mtime: s.mtime.toISOString(),
        extension: ext,
      });
    }
  }
  return entries;
}

async function gatherFiles(root: string): Promise<FileEntry[]> {
  const all: FileEntry[] = [];
  for (const dir of INVENTORY_DIRS) {
    await walk(dir, root, all);
  }
  for (const file of ROOT_FILES) {
    const full = join(root, file);
    if (!(await exists(full))) continue;
    const s = await stat(full);
    all.push({
      path: full,
      rel: file,
      size: s.size,
      mtime: s.mtime.toISOString(),
      extension: extname(file).toLowerCase(),
    });
  }
  // de-duplicate by path
  const seen = new Set<string>();
  return all.filter((f) => {
    if (seen.has(f.rel)) return false;
    seen.add(f.rel);
    return true;
  });
}

async function readFirstLines(path: string, maxBytes = 8192, maxLines = 80): Promise<{ text: string; lines: string[] }> {
  const data = await readFile(path, 'utf-8');
  const slice = data.slice(0, maxBytes);
  const lines = slice.split(/\r?\n/).slice(0, maxLines);
  return { text: lines.join('\n'), lines };
}

function extractTitle(rel: string, lines: string[]): string {
  const h1 = lines.find((l) => l.trim().startsWith('# '));
  if (h1) return h1.replace(/^#\s+/, '').trim();
  const frontTitle = lines.find((l) => l.trim().startsWith('title:'));
  if (frontTitle) return frontTitle.replace(/^(title|title:)\s*["']?/, '').replace(/["']?\s*$/, '').trim();
  return basename(rel, extname(rel));
}

function detectMarkers(lines: string[]): string[] {
  const markers = new Set<string>();
  const text = lines.join('\n').toLowerCase();
  const checks: [string, RegExp][] = [
    ['canonical', /\bstatus:\s*canonical\b|^#{1,3}\s+.*\bcanonical\b/i],
    ['trusted', /\bstatus:\s*trusted\b|^#{1,3}\s+.*\btrusted\b/i],
    ['frozen', /\bstatus:\s*frozen\b|^#{1,3}\s+.*\bfrozen\b/i],
    ['candidate', /\bstatus:\s*candidate\b|^#{1,3}\s+.*\bcandidate\b/i],
    ['draft', /\bstatus:\s*draft\b/i],
    ['proposed', /\bstatus:\s*proposed\b|\bproposed\b/i],
    ['superseded', /\bsuperseded-by:\s*['"]?[^'"\s]|\bstatus:\s*superseded\b|^#{1,3}\s+.*\bsuperseded\b/i],
    ['conflict', /^#{1,3}\s+conflict\s*$|\bstatus:\s*conflict\b|^conflict:/i],
    ['adr', /# adr-|adr-\d{3,4}/i],
    ['decision', /##?\s*decision\b/i],
    ['todo', /\bTODO\b/i],
    ['historical', /# historical|\bhistorical\b/],
  ];
  for (const [name, re] of checks) {
    if (re.test(text)) markers.add(name);
  }
  return Array.from(markers);
}

function classify(entry: FileEntry, meta: FileMetadata): { classification: string; reason: string } {
  const rel = entry.rel.toLowerCase();
  const marks = meta.markers;
  const name = basename(rel).toLowerCase();

  // explicit conflict marker
  if (marks.includes('conflict')) {
    return { classification: 'conflicting', reason: 'explicit conflict marker' };
  }

  // superseded
  if (marks.includes('superseded')) {
    return { classification: 'superseded', reason: 'superseded-by or superseded status' };
  }

  // transient paths
  if (
    rel.startsWith('.mw/runs/') ||
    rel.startsWith('context/session_handoffs/') ||
    rel.startsWith('coordinator/manual-dispatch/') ||
    rel.includes('/pending/') ||
    rel.includes('/completed/') ||
    rel.startsWith('.mw/baselines/') ||
    rel === 'richieste.md' ||
    rel === 'session_handoff.md'
  ) {
    return { classification: 'transient', reason: 'run/session/pending context or transient register' };
  }

  // historical
  if (
    rel.startsWith('archive/') ||
    rel.includes('forgotten-') ||
    rel.includes('legacy') ||
    rel.startsWith('context/') && rel.includes('handoff') ||
    rel.includes('minimal_slice')
  ) {
    return { classification: 'historical', reason: 'archive/legacy/session-handoff' };
  }

  // canonical
  if (
    rel.includes('/trusted/') ||
    rel.includes('/frozen/') ||
    marks.includes('frozen') ||
    marks.includes('trusted') ||
    (rel.startsWith('src/docs/docs/') && marks.includes('canonical')) ||
    (rel.startsWith('decisions/') && name.startsWith('adr-'))
  ) {
    return { classification: 'canonical', reason: 'trusted/frozen/canonical marker or ADR' };
  }

  // candidate / draft
  if (
    marks.includes('candidate') ||
    marks.includes('draft') ||
    marks.includes('proposed') ||
    rel.startsWith('plans/') ||
    rel.startsWith('prompts/') ||
    rel.startsWith('.mw/specs/')
  ) {
    return { classification: 'candidate', reason: 'draft/candidate/proposed marker, plan or prompt' };
  }

  // default for src/docs/docs/
  if (rel.startsWith('src/docs/docs/')) {
    return { classification: 'candidate', reason: 'documentation, pending canonical review' };
  }

  // default for .mw/ specs
  if (rel.startsWith('.mw/') && (rel.endsWith('.md') || rel.endsWith('.yaml'))) {
    return { classification: 'transient', reason: 'Mind Weaver workspace, not game canon' };
  }

  // default for context/
  if (rel.startsWith('context/')) {
    return { classification: 'historical', reason: 'context register, may be superseded' };
  }

  return { classification: 'uncategorized', reason: 'no strong signal' };
}

async function runList(entries: FileEntry[], outDir: string, dryRun: boolean): Promise<void> {
  const payload = entries.map((e) => ({ path: e.rel, size: e.size, mtime: e.mtime, extension: e.extension }));
  const out = join(outDir, 'FULL_FILE_LIST.json');
  const text = JSON.stringify(payload, null, 2);
  if (!dryRun) await writeFile(out, text, 'utf-8');
  console.log(`[list] wrote ${out} (${payload.length} files)`);
}

async function runMeta(entries: FileEntry[], outDir: string, dryRun: boolean): Promise<FileMetadata[]> {
  const metas: FileMetadata[] = [];
  for (const e of entries) {
    const { lines } = await readFirstLines(e.path);
    const title = extractTitle(e.rel, lines);
    const markers = detectMarkers(lines);
    const cls = classify(e, { path: e.path, rel: e.rel, title, markers, firstLines: lines.join('\n'), size: e.size, mtime: e.mtime } as FileMetadata);
    metas.push({
      path: e.path,
      rel: e.rel,
      title,
      markers,
      firstLines: lines.slice(0, 25).join('\n'),
      size: e.size,
      mtime: e.mtime,
      classification: cls.classification,
      reason: cls.reason,
    });
  }
  const out = join(outDir, 'FILENAMES_METADATA.json');
  if (!dryRun) {
    await writeFile(out, JSON.stringify(metas, null, 2), 'utf-8');
  }
  console.log(`[meta] wrote ${out} (${metas.length} entries)`);
  return metas;
}

function mdTable(headers: string[], rows: string[][]): string {
  const pad = (s: string, w: number) => s.padEnd(w, ' ');
  const widths = headers.map((h, i) => Math.max(h.length, ...rows.map((r) => r[i]?.length || 0)));
  const head = '| ' + headers.map((h, i) => pad(h, widths[i])).join(' | ') + ' |';
  const sep = '| ' + headers.map((_, i) => '-'.repeat(widths[i])).join(' | ') + ' |';
  const body = rows.map((r) => '| ' + r.map((c, i) => pad(c || '', widths[i])).join(' | ') + ' |').join('\n');
  return [head, sep, body].join('\n');
}

async function runClassify(metas: FileMetadata[], outDir: string, dryRun: boolean): Promise<void> {
  const rows = metas.map((m) => [m.rel, m.classification || 'uncategorized', m.reason || '']);
  const md = '# File Classification\n\n' + mdTable(['File', 'Classification', 'Reason'], rows);
  const out = join(outDir, 'CLASSIFICATION.md');
  if (!dryRun) await writeFile(out, md, 'utf-8');
  console.log(`[classify] wrote ${out} (${rows.length} rows)`);
}

async function runInventory(metas: FileMetadata[], outDir: string, dryRun: boolean): Promise<void> {
  const byClass: Record<string, FileMetadata[]> = {};
  for (const m of metas) {
    const c = m.classification || 'uncategorized';
    byClass[c] = byClass[c] || [];
    byClass[c].push(m);
  }
  const lines = ['# Knowledge Inventory', ''];
  for (const c of CLASSIFICATIONS) {
    const items = byClass[c] || [];
    lines.push(`## ${c} (${items.length})`);
    if (items.length === 0) {
      lines.push('_Nessun file in questa classificazione._\n');
      continue;
    }
    for (const m of items) {
      lines.push(`- \`${m.rel}\` — ${m.title}  `);
      if (m.markers.length) lines.push(`  - markers: ${m.markers.join(', ')}  `);
      if (m.reason) lines.push(`  - reason: ${m.reason}  `);
    }
    lines.push('');
  }
  const out = join(REPO_ROOT, 'KNOWLEDGE_INVENTORY.md');
  if (!dryRun) await writeFile(out, lines.join('\n'), 'utf-8');
  console.log(`[inventory] wrote ${out}`);
}

const CONFLICT_IGNORED_DIRS = ['.mw/runs/', '.mw/bugs/', '.mw/baselines/', 'context/session_handoffs/'];
const CONFLICT_INTERESTING_DIRS = ['src/docs/docs/', 'context/', '.mw/specs/', 'plans/', 'coordinator/', 'prompts/', 'archive/'];

// Stems that are expected to recur in many subdirectories (per-entity docs)
const GENERIC_ENTITY_STEMS = new Set([
  'readme', 'index', 'design-intent', 'identity', 'prompt', 'reference-card', 'decision-log',
  'versions', 'v1.0.0', 'family-dna', 'rejected-directions', 'provenance', 'authority', 'mockup',
  'implementation-map', 'landmarks', 'reconstruction-spec', 'tokens', 'visual-inventory', 'context',
  'notes', 'changelog', 'todo', 'log', 'report', 'synthesis', 'broadcast', 'critiques', 'convergence',
  'plan', 'caller_final', 'a', 'b', 'final', 'metadata', 'skill',
]);

function isConflictRelevant(rel: string): boolean {
  return !CONFLICT_IGNORED_DIRS.some((d) => rel.startsWith(d));
}

function conflictGroup(rel: string): string | null {
  for (const d of CONFLICT_INTERESTING_DIRS) {
    if (rel.startsWith(d)) return d;
  }
  return null;
}

async function runConflicts(metas: FileMetadata[], outDir: string, dryRun: boolean): Promise<void> {
  const conflicts: { path: string; reason: string }[] = [];
  const byStem: Record<string, FileMetadata[]> = {};
  for (const m of metas) {
    if (!isConflictRelevant(m.rel)) continue;
    const group = conflictGroup(m.rel);
    if (!group) continue;
    const stem = basename(m.rel, extname(m.rel)).toLowerCase();
    if (stem.length <= 2) continue;
    byStem[stem] = byStem[stem] || [];
    byStem[stem].push(m);
  }
  for (const [stem, items] of Object.entries(byStem)) {
    if (items.length < 2) continue;
    const isGeneric = GENERIC_ENTITY_STEMS.has(stem);

    // Generic stems (README, design-intent, prompt, etc.) recur legitimately per entity; not conflicts
    if (isGeneric) continue;

    const groups = new Set(items.map((m) => conflictGroup(m.rel)));
    const parents = new Set(items.map((m) => dirname(m.rel)));
    const dirs = items.map((m) => dirname(m.rel));
    const onlyPromptsAndDispatch = dirs.every((d) => d === 'prompts' || d.startsWith('prompts/') || d.includes('/manual-dispatch/'));

    // Prompts and manual dispatch share the same task IDs by design
    if (onlyPromptsAndDispatch) continue;

    // If one file is marked superseded and another is not, the conflict is considered resolved
    const supersededItems = items.filter((m) => m.markers.includes('superseded'));
    const nonSupersededItems = items.filter((m) => !m.markers.includes('superseded'));
    if (supersededItems.length >= 1 && nonSupersededItems.length >= 1) continue;

    if (groups.size > 1) {
      const canonicalItems = items.filter((m) => m.classification === 'canonical');
      const nonCanonicalItems = items.filter((m) => m.classification !== 'canonical');
      const canonicalOnly = canonicalItems.length === items.length;
      const reason = canonicalOnly
        ? `stem "${stem}" appare in ${items.length} file canonici in gruppi diversi: ${items.map((i) => i.rel).join(', ')}`
        : `stem "${stem}" appare in ${items.length} file tra canonici e non: canonici=${canonicalItems.map((i) => i.rel).join('; ')}, altri=${nonCanonicalItems.map((i) => i.rel).join('; ')}`;
      conflicts.push({ path: stem, reason });
    } else if (parents.size > 1) {
      // Non-generic same name in different directories within the same group: suspicious
      conflicts.push({
        path: stem,
        reason: `stem "${stem}" (non generico) appare in ${items.length} directory diverse nello stesso gruppo: ${items.map((i) => i.rel).join(', ')}`,
      });
    }
  }
  for (const m of metas) {
    if (m.markers.includes('conflict')) {
      conflicts.push({ path: m.rel, reason: 'explicit conflict marker' });
    }
    if (m.markers.includes('superseded') && m.markers.includes('canonical')) {
      conflicts.push({ path: m.rel, reason: 'file is both canonical and superseded' });
    }
  }
  const md = `# Knowledge Conflicts\n\n${
    conflicts.length === 0
      ? '_Nessun conflitto rilevato._'
      : conflicts.map((c) => `- \`${c.path}\`: ${c.reason}`).join('\n')
  }`;
  const out = join(REPO_ROOT, 'KNOWLEDGE_CONFLICTS.md');
  if (!dryRun) await writeFile(out, md, 'utf-8');
  console.log(`[conflicts] wrote ${out} (${conflicts.length} conflicts)`);
}

async function runPriority(outDir: string, dryRun: boolean): Promise<void> {
  const md = `# Source Priority (candidate)\n\nQuando informazioni confliggono, usa questa gerarchia:\n\n` +
    `| Precedenza | Fonte | Ruolo |\n|---|---|---|\n` +
    `| 1 | Explicit Director approval | Autorità decisionale massima |\n` +
    `| 2 | Accepted ADR | Decisioni approvate e tracciate |\n` +
    `| 3 | Canonical /docs | Contratti design e comportamento atteso |\n` +
    `| 4 | Validated /game-data | Parametri e dati validati |\n` +
    `| 5 | Code + tests | Evidenza del comportamento implementato |\n` +
    `| 6 | AGENTS.md / .windsurf/rules | Enforcement operativo |\n` +
    `| 7 | RICHIESTE.md | Richieste/intenti aperti |\n` +
    `| 8 | context/ | Contesto storico/transitorio |\n` +
    `| 9 | .mw/ deliberations | Proposte ed evidenza |\n` +
    `| 10 | AI conversations | Materiale sorgente, non canonico |\n\n` +
    `## Regole\n\n` +
    `- Se un'ADR e il codice sono in conflitto, **registra il conflitto** e chiedi una decisione esplicita: non aggiornare silenziosamente.\n` +
    `- Una proposta non merged non è verità canonica.\n` +
    `- Non trattare una conversazione con un LLM come fonte di verità.\n`;
  const out = join(outDir, 'SOURCE_PRIORITY.md');
  if (!dryRun) await writeFile(out, md, 'utf-8');
  console.log(`[priority] wrote ${out}`);
}

async function runTemplate(outDir: string, dryRun: boolean): Promise<void> {
  const md = `---
status: TEMPLATE
date: YYYY-MM-DD
decision_owner: Director
supersedes: ''
superseded_by: ''
related: []
---

# ADR-XXXX — Title

## Context

Descrizione del problema e del contesto che ha portato alla decisione.

## Decision

Cosa è stato deciso, in forma dichiarativa.

## Rationale

Perché questa decisione è stata presa.

## Consequences

Cosa implica questa decisione per il design, l'implementazione e i test.

## Rejected Alternatives

Quali alternative sono state scartate e perché.

## Implementation Impact

File, componenti o sistemi toccati da questa decisione.
`;
  const out = join(outDir, 'ADR-TEMPLATE.md');
  if (!dryRun) await writeFile(out, md, 'utf-8');
  console.log(`[template] wrote ${out}`);
}

async function main() {
  const { action, dryRun } = parseArgs();
  const root = REPO_ROOT;

  const docsDir = join(root, 'docs');
  const decisionsDir = join(root, 'decisions');
  if (!dryRun) {
    await mkdir(docsDir, { recursive: true });
    await mkdir(decisionsDir, { recursive: true });
  }

  const entries = await gatherFiles(root);

  if (action === 'list' || action === 'all') {
    await runList(entries, docsDir, dryRun);
  }

  if (['meta', 'classify', 'inventory', 'conflicts', 'all'].includes(action)) {
    const metas = await runMeta(entries, docsDir, dryRun);
    if (action === 'meta' || action === 'all') {
      // already written in runMeta
    }
    if (action === 'classify' || action === 'all') {
      await runClassify(metas, docsDir, dryRun);
    }
    if (action === 'inventory' || action === 'all') {
      await runInventory(metas, docsDir, dryRun);
    }
    if (action === 'conflicts' || action === 'all') {
      await runConflicts(metas, docsDir, dryRun);
    }
  }

  if (action === 'priority' || action === 'all') {
    await runPriority(docsDir, dryRun);
  }

  if (action === 'template' || action === 'all') {
    await runTemplate(decisionsDir, dryRun);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
