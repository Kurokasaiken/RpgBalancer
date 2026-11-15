#!/usr/bin/env node
/**
 * contextInventory.mjs — R-342 / artifact-r002 Phase-0 measurement tool.
 *
 * Produces a DIFFABLE JSON inventory of the injected-context components for
 * Devin (Desktop/CLI) under three conditions:
 *
 *   --condition a   unconfigured-workspace baseline: an empty project folder,
 *                   only global/user-level components load.
 *   --condition b   "global-only": the RPG project MINUS project config
 *                   (`.windsurf/rules`, `.devin/`, `AGENTS.md`, `CLAUDE.md`
 *                   excluded — see CONDITION_B_EXCLUDED below). Computed by
 *                   running the authoritative loaders on the project and
 *                   filtering out items sourced from the excluded roots.
 *   --condition c   full project state (current).
 *
 * Data sources:
 *   - The app-bundled `devin` CLI is treated as the AUTHORITATIVE loader:
 *     `devin rules list`, `devin skills list`, `devin mcp list` are run with
 *     cwd = the condition's scan directory.
 *   - Filesystem for byte sizes + a lenient line-parse of rule frontmatter
 *     (the CLI's YAML parser is strict; both views are reported).
 *   - `~/.local/share/devin/cli/sessions.db` (read-only) for the IDE's own
 *     cumulative token meter (`metadata.num_tokens_preceding`) and for
 *     serialized system-context blocks as session evidence.
 *
 * Re-runnable: `node contextInventory.mjs --condition c --json`
 * No repo files are mutated; condition (a) creates a temp dir under os.tmpdir().
 */

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const HOME = os.homedir();
const PROJECT = process.env.CTX_INV_PROJECT
  ? path.resolve(process.env.CTX_INV_PROJECT)
  : path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');

const DEVIN_BIN_CANDIDATES = [
  process.env.DEVIN_BIN,
  '/Applications/Devin.app/Contents/Resources/app/extensions/windsurf/devin/bin/devin',
  'devin',
].filter(Boolean);

const SESSIONS_DB = path.join(HOME, '.local/share/devin/cli/sessions.db');
const TOKEN_DIVISOR = 4; // est tokens = ceil(bytes / 4)

/** Project-config roots excluded under condition (b), relative to PROJECT. */
const CONDITION_B_EXCLUDED = [
  '.windsurf/rules',
  '.devin',
  'AGENTS.md',
  'AGENT.md',
  'AGENTS.local.md',
  'CLAUDE.md',
  '.windsurfrules',
];

const args = process.argv.slice(2);
const argVal = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
};
const CONDITION = (argVal('--condition') || 'c').toLowerCase();
const EMIT_JSON = args.includes('--json') || !args.includes('--summary');

if (!['a', 'b', 'c'].includes(CONDITION)) {
  console.error(`Invalid --condition "${CONDITION}" (expected a|b|c)`);
  process.exit(2);
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function resolveDevinBin() {
  for (const bin of DEVIN_BIN_CANDIDATES) {
    try {
      execFileSync(bin, ['version'], { stdio: ['ignore', 'pipe', 'ignore'], timeout: 10000 });
      return bin;
    } catch {
      /* try next */
    }
  }
  return null;
}

function runDevin(bin, sub, cwd) {
  try {
    return execFileSync(bin, sub.split(' '), {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 30000,
      encoding: 'utf8',
    });
  } catch (err) {
    return `__DEVIN_ERROR__ ${err.message}`;
  }
}

function fileBytes(p) {
  try {
    return fs.statSync(p).size;
  } catch {
    return null;
  }
}

function readText(p) {
  try {
    return fs.readFileSync(p, 'utf8');
  } catch {
    return null;
  }
}

function realpathSafe(p) {
  try {
    return fs.realpathSync(p);
  } catch {
    return p;
  }
}

function estTokens(bytes) {
  return Math.ceil((bytes || 0) / TOKEN_DIVISOR);
}

function sha1(s) {
  return createHash('sha1').update(s).digest('hex').slice(0, 12);
}

function listDir(dir) {
  try {
    return fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
}

/** Lenient line-parse of frontmatter (tolerates non-strict YAML). */
function looseFrontmatter(text) {
  const fm = { __hasFrontmatter: false };
  if (!text || !text.startsWith('---')) return fm;
  const end = text.indexOf('\n---', 3);
  if (end < 0) return fm;
  fm.__hasFrontmatter = true;
  const body = text.slice(3, end);
  const lines = body.split('\n');
  let curKey = null;
  for (const line of lines) {
    const m = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (m) {
      curKey = m[1];
      fm[curKey] = m[2].trim();
    } else if (curKey && /^\s+/.test(line)) {
      fm[curKey] += ' ' + line.trim();
    }
  }
  return fm;
}

/** Extract `description:` value from a SKILL.md (lenient). */
function skillDescription(skillMdPath) {
  const text = readText(skillMdPath);
  if (!text) return '';
  const fm = looseFrontmatter(text);
  return typeof fm.description === 'string' ? fm.description : '';
}

function relToProject(p) {
  const rp = path.resolve(p);
  return rp.startsWith(PROJECT + path.sep) ? rp.slice(PROJECT.length + 1) : rp;
}

/** Is `p` under a condition-(b)-excluded project-config root? */
function excludedInB(p) {
  const rel = relToProject(p).split(path.sep).join('/');
  if (rel === p) return false; // outside project → global, never excluded
  for (const root of CONDITION_B_EXCLUDED) {
    if (rel === root || rel.startsWith(root + '/')) return true;
  }
  // Any AGENTS-family file anywhere in the project is "project config".
  const base = path.basename(rel);
  if (['AGENTS.md', 'AGENT.md', 'AGENTS.local.md', 'CLAUDE.md', '.windsurfrules'].includes(base)) return true;
  return false;
}

// ---------------------------------------------------------------------------
// loaders: `devin rules list` / `devin skills list` / `devin mcp list`
// ---------------------------------------------------------------------------

function parseRulesList(out) {
  // Entry: "  NAME [Provider] activation"   Activation examples:
  //   always-on | manual | agent-decidable | globs: <pattern> | conditional
  const items = [];
  const errors = [];
  let inErrors = false;
  for (const raw of out.split('\n')) {
    if (/^Errors:/.test(raw)) { inErrors = true; continue; }
    if (inErrors) {
      const em = raw.match(/^\s+(\S.*?\.md):\s*(.*)$/);
      if (em) errors.push({ path: em[1], error: em[2] });
      continue;
    }
    const m = raw.match(/^\s{2,}(\S+)\s+\[([^\]]+)\]\s+(.+)$/);
    if (m) items.push({ name: m[1], provider: m[2], activation: m[3].trim() });
  }
  return { items, errors };
}

function parseSkillsList(out) {
  // Entry: "  /name [flags] (sourcedir) - description"  or  "  name [flags] (sourcedir) - desc"
  const items = [];
  for (const raw of out.split('\n')) {
    const m = raw.match(/^\s{2,}\/?([\w.-]+)\s+\[([^\]]*)\]\s+\(([^)]+)\)\s*-\s*(.*)$/);
    if (!m) continue;
    items.push({
      name: m[1],
      flags: m[2].split(',').map((s) => s.trim()).filter(Boolean),
      source: m[3].trim(),
      descriptionPrinted: m[4].trim(),
    });
  }
  return items;
}

function parseMcpList(out) {
  const items = [];
  let cur = null;
  for (const raw of out.split('\n')) {
    const hm = raw.match(/^\s+[•✗]\s+(\S+)(.*)$/);
    if (hm) {
      if (cur) items.push(cur);
      cur = { name: hm[1], disabled: /disabled/.test(hm[2]), command: null, source: null };
      continue;
    }
    const cm = raw.match(/^\s+Command:\s*(.+)$/);
    if (cm && cur) cur.command = cm[1].trim();
    const sm = raw.match(/^\s+Source:\s*(.+)$/);
    if (sm && cur) cur.source = sm[1].trim();
  }
  if (cur) items.push(cur);
  return items;
}

// ---------------------------------------------------------------------------
// component builders
// ---------------------------------------------------------------------------

function scanRuleFiles(scanCwd) {
  // All candidate rule-bearing files, global + project, with declared trigger.
  const files = [];
  const push = (p, origin, kind) => {
    if (fileBytes(p) === null) return;
    const text = readText(p) || '';
    const fm = looseFrontmatter(text);
    files.push({
      path: p,
      name: path.basename(p, '.md'),
      origin, // 'project' | 'global'
      kind,   // 'windsurf-rules' | 'devin-rules' | 'agents-family' | 'global-mem' | 'cursor-rules'
      bytes: fileBytes(p),
      declaredTrigger: fm.trigger || (fm.__hasFrontmatter ? 'frontmatter-no-trigger' : 'no-frontmatter'),
      globs: fm.globs || null,
      description: fm.description || null,
    });
  };

  if (scanCwd !== null) {
    // project-level scan dirs
    for (const f of listDir(path.join(scanCwd, '.windsurf/rules')))
      if (f.name.endsWith('.md')) push(path.join(scanCwd, '.windsurf/rules', f.name), 'project', 'windsurf-rules');
    for (const f of listDir(path.join(scanCwd, '.devin/rules')))
      if (f.name.endsWith('.md')) push(path.join(scanCwd, '.devin/rules', f.name), 'project', 'devin-rules');
    for (const f of listDir(path.join(scanCwd, '.cursor/rules')))
      if (f.name.endsWith('.md') || f.name.endsWith('.mdc')) push(path.join(scanCwd, '.cursor/rules', f.name), 'project', 'cursor-rules');
    push(path.join(scanCwd, '.devin/global_rules.md'), 'project', 'devin-rules');
    push(path.join(scanCwd, '.windsurf/global_rules.md'), 'project', 'windsurf-rules');
    for (const name of ['AGENTS.md', 'AGENT.md', 'AGENTS.local.md', 'CLAUDE.md', '.windsurfrules'])
      push(path.join(scanCwd, name), 'project', 'agents-family');
    // nested AGENTS-family (lazy per docs) — bounded walk, skip heavy dirs
    const SKIP = new Set(['node_modules', '.git', 'dist', 'build', '.next', '.claude', 'coverage']);
    const walk = (dir, depth) => {
      if (depth > 6) return;
      for (const e of listDir(dir)) {
        if (!e.isDirectory() || SKIP.has(e.name) || e.name.startsWith('.')) continue;
        const sub = path.join(dir, e.name);
        for (const name of ['AGENTS.md', 'AGENT.md', 'AGENTS.local.md', 'CLAUDE.md']) {
          const p = path.join(sub, name);
          if (fileBytes(p) !== null) push(p, 'project', 'agents-family-nested');
        }
        walk(sub, depth + 1);
      }
    };
    walk(scanCwd, 0);
  }

  // global files (always loaded regardless of cwd)
  push(path.join(HOME, '.claude/CLAUDE.md'), 'global', 'agents-family');
  push(path.join(HOME, '.config/devin/AGENTS.md'), 'global', 'agents-family');
  push(path.join(HOME, '.codeium/windsurf/memories/global_rules.md'), 'global', 'global-mem');
  push(path.join(HOME, '.devin/global_rules.md'), 'global', 'devin-rules');
  for (const f of listDir(path.join(HOME, '.devin/rules')))
    if (f.name.endsWith('.md')) push(path.join(HOME, '.devin/rules', f.name), 'global', 'devin-rules');

  return files;
}

function buildRulesComponent(devinOut, ruleFiles) {
  const { items: listed, errors } = parseRulesList(devinOut || '');
  const errorPaths = new Set(errors.map((e) => realpathSafe(e.path)));

  // Map loader-listed rule names to files (windsurf/devin rules map by basename).
  const activationByPath = new Map();
  for (const it of listed) {
    for (const f of ruleFiles) {
      if (f.name === it.name || (f.kind === 'agents-family' && f.name === it.name)) {
        activationByPath.set(f.path, it.activation);
      }
    }
  }
  // AGENTS-family listed names (CLAUDE/AGENTS/global_rules) — assign by kind+name
  for (const it of listed) {
    if (['CLAUDE', 'AGENTS', 'AGENT', 'global_rules'].includes(it.name)) {
      for (const f of ruleFiles) {
        if (f.name === it.name && (f.kind === 'agents-family' || f.kind === 'global-mem' || f.kind === 'windsurf-rules' || f.kind === 'devin-rules')) {
          activationByPath.set(f.path, it.activation);
        }
      }
    }
  }

  const items = ruleFiles.map((f) => {
    const rp = realpathSafe(f.path);
    const parseError = errorPaths.has(rp) || errorPaths.has(f.path);
    const errEntry = errors.find((e) => realpathSafe(e.path) === rp || e.path === f.path);
    const loaderActivation = activationByPath.get(f.path) || null;
    let classification;
    if (parseError) classification = 'dead_parse_error';
    else if (f.kind === 'agents-family' || f.kind === 'agents-family-nested' || f.kind === 'global-mem')
      classification = f.kind === 'agents-family-nested' ? 'lazy_subdir' : 'injected_at_start';
    else if (loaderActivation === 'always-on') classification = 'injected_at_start';
    else if (loaderActivation) classification = 'lazy_' + loaderActivation.replace(/[\s:]+/g, '_');
    else if (f.declaredTrigger === 'always_on') classification = 'injected_at_start_declared_only';
    else classification = 'unlisted';
    return {
      name: f.name,
      path: f.path,
      origin: f.origin,
      kind: f.kind,
      bytes: f.bytes,
      estTokens: estTokens(f.bytes),
      declaredTrigger: f.declaredTrigger,
      loaderActivation,
      parseError: errEntry ? errEntry.error : null,
      classification,
      excludedInB: excludedInB(f.path),
    };
  }).sort((x, y) => x.path.localeCompare(y.path));

  return { items, loaderErrors: errors };
}

function buildSkillsComponent(devinOut, scanCwd) {
  const listed = parseSkillsList(devinOut || '');
  const seen = new Map();
  const items = [];
  for (const it of listed) {
    let dir = it.source;
    if (dir === 'built-in') {
      items.push({
        name: it.name, flags: it.flags, source: 'built-in', realpath: 'built-in',
        description: it.descriptionPrinted, descBytes: Buffer.byteLength(it.descriptionPrinted),
        serializedBytes: 0, builtin: true,
      });
      continue;
    }
    dir = dir.replace(/^~/, HOME);
    if (!path.isAbsolute(dir)) dir = path.resolve(scanCwd || process.cwd(), dir);
    const skillMd = path.join(dir, 'SKILL.md');
    const rp = realpathSafe(skillMd);
    const desc = skillDescription(skillMd) || it.descriptionPrinted;
    const serialized = Buffer.byteLength(`- **${it.name}**: ${desc} (source: ${skillMd})\n`);
    items.push({
      name: it.name,
      flags: it.flags,
      source: it.source,
      skillMd,
      realpath: rp,
      dup: seen.has(rp),
      description: desc,
      descBytes: Buffer.byteLength(desc),
      nameBytes: Buffer.byteLength(it.name),
      serializedBytes: serialized,
      origin: dir.startsWith(PROJECT) || rp.startsWith(PROJECT) ? 'project' : 'global',
      excludedInB: excludedInB(skillMd),
    });
    seen.set(rp, true);
  }
  items.sort((a, b) => a.name.localeCompare(b.name));
  return items;
}

function buildMcpComponent(devinOut) {
  const servers = parseMcpList(devinOut || '');
  const configFiles = [
    path.join(HOME, '.config/devin/mcp_config.json'),
    path.join(HOME, '.codeium/windsurf/mcp_config.json'),
    path.join(PROJECT, '.devin/mcp_config.json'),
  ];
  const configs = configFiles
    .filter((p) => fileBytes(p) !== null)
    .map((p) => {
      let names = [];
      try {
        names = Object.keys(JSON.parse(readText(p)).mcpServers || {});
      } catch { /* keep empty */ }
      return { path: p, bytes: fileBytes(p), servers: names, excludedInB: excludedInB(p) };
    });
  return { servers, configs, note: 'tool schemas are lazy via mcp list_tools — config bytes only' };
}

function buildHooksComponent() {
  const cfgPath = path.join(HOME, '.config/devin/config.json');
  const out = { files: [], hooksConfigured: [] };
  const text = readText(cfgPath);
  if (text) {
    try {
      const cfg = JSON.parse(text);
      const hooks = cfg.hooks || {};
      const hooksBytes = Buffer.byteLength(JSON.stringify(hooks));
      out.files.push({ path: cfgPath, hooksSectionBytes: hooksBytes, excludedInB: false });
      for (const [event, groups] of Object.entries(hooks)) {
        for (const g of groups) {
          for (const h of g.hooks || []) {
            out.hooksConfigured.push({ event, matcher: g.matcher || null, command: h.command, source: 'global-config' });
          }
        }
      }
    } catch { /* ignore */ }
  }
  const projHooks = path.join(PROJECT, '.devin/hooks.v1.json');
  if (fileBytes(projHooks) !== null) {
    out.files.push({ path: projHooks, bytes: fileBytes(projHooks), excludedInB: excludedInB(projHooks) });
  }
  out.note = 'hooks inject additionalContext only when they fire; prompt-submit hooks are normally silent (0 bytes)';
  return out;
}

function buildAgentProfilesComponent(scanCwd) {
  const dirs = [
    { dir: path.join(HOME, '.config/devin/agents'), origin: 'global' },
    scanCwd ? { dir: path.join(scanCwd, '.devin/agents'), origin: 'project' } : null,
  ].filter(Boolean);
  const items = [];
  for (const { dir, origin } of dirs) {
    for (const f of listDir(dir)) {
      if (!f.name.endsWith('.md')) continue;
      const p = path.join(dir, f.name);
      const fm = looseFrontmatter(readText(p) || '');
      items.push({
        name: f.name.replace(/\.md$/, ''),
        path: p,
        origin,
        bytes: fileBytes(p),
        description: fm.description || null,
        descBytes: Buffer.byteLength(fm.description || ''),
        excludedInB: excludedInB(p),
      });
    }
  }
  return { items, note: 'profile names+descriptions are injected into the system prompt (observed serialized block in sessions.db)' };
}

// ---------------------------------------------------------------------------
// sessions.db evidence
// ---------------------------------------------------------------------------

function sqlite(dbPath, sql) {
  try {
    return execFileSync('sqlite3', [`file:${dbPath}?mode=ro`, sql], {
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 15000,
      encoding: 'utf8',
    }).trim();
  } catch {
    return null;
  }
}

function sessionEvidence(scanCwd) {
  if (!scanCwd || fileBytes(SESSIONS_DB) === null) return { available: false, reason: 'no sessions.db or no project cwd' };
  const sid = sqlite(SESSIONS_DB,
    `SELECT id FROM sessions WHERE working_directory='${scanCwd.replace(/'/g, "''")}' ORDER BY last_activity_at DESC LIMIT 1;`);
  if (!sid) return { available: false, reason: 'no session recorded for this cwd' };

  const firstTok = sqlite(SESSIONS_DB,
    `SELECT json_extract(metadata,'$.num_tokens_preceding') FROM message_nodes WHERE session_id='${sid}' AND json_extract(metadata,'$.num_tokens_preceding') IS NOT NULL ORDER BY node_id LIMIT 1;`);
  const maxTok = sqlite(SESSIONS_DB,
    `SELECT MAX(CAST(json_extract(metadata,'$.num_tokens_preceding') AS INTEGER)) FROM message_nodes WHERE session_id='${sid}';`);

  // Serialized system-context blocks, deduped by content hash (copied nodes recur).
  const rows = sqlite(SESSIONS_DB,
    `SELECT node_id, json_extract(chat_message,'$.role'), length(json_extract(chat_message,'$.content')), substr(json_extract(chat_message,'$.content'),1,60) FROM message_nodes WHERE session_id='${sid}' AND json_extract(chat_message,'$.role')='system' ORDER BY node_id LIMIT 400;`);
  const blocks = [];
  const seenBlocks = new Set();
  if (rows) {
    for (const line of rows.split('\n')) {
      const parts = line.split('|');
      const nodeId = parts[0];
      const len = parts[2];
      const head = parts.slice(3).join('|') || '';
      const key = sha1(head + '|' + len);
      if (seenBlocks.has(key)) continue;
      seenBlocks.add(key);
      let kind = 'other';
      if (head.startsWith('<system_info>')) kind = 'system_info';
      else if (head.startsWith('<rules')) kind = 'rules_block';
      else if (head.startsWith('<available_skills>')) kind = 'skills_catalog';
      else if (head.includes('Available MCP Servers')) kind = 'mcp_servers';
      else if (head.includes('subagent profiles')) kind = 'subagent_profiles';
      else if (head.startsWith('You are Devin')) kind = 'base_system_prompt';
      blocks.push({ nodeId: Number(nodeId), kind, bytes: Number(len), head: head.slice(0, 60) });
    }
  }
  return {
    available: true,
    sessionId: sid,
    firstNumTokensPreceding: firstTok ? Number(firstTok) : null,
    maxNumTokensPreceding: maxTok ? Number(maxTok) : null,
    serializedSystemBlocks: blocks,
    note: 'cumulative per-message meter; includes any carried-over serialized context copied from prior session chains',
  };
}

// ---------------------------------------------------------------------------
// condition assembly
// ---------------------------------------------------------------------------

function summarize(items, byteField = 'bytes') {
  const active = items.filter((i) => !i.__excluded);
  return {
    count: active.length,
    bytes: active.reduce((s, i) => s + (i[byteField] || 0), 0),
    estTokens: estTokens(active.reduce((s, i) => s + (i[byteField] || 0), 0)),
  };
}

function buildInventory() {
  const devinBin = resolveDevinBin();

  // scan cwd per condition
  let scanCwd;
  let tmpDir = null;
  if (CONDITION === 'a') {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ctx-inv-empty-'));
    scanCwd = tmpDir;
  } else {
    scanCwd = PROJECT;
  }

  const devinRules = devinBin ? runDevin(devinBin, 'rules list', scanCwd) : null;
  const devinSkills = devinBin ? runDevin(devinBin, 'skills list', scanCwd) : null;
  const devinMcp = devinBin ? runDevin(devinBin, 'mcp list', scanCwd) : null;

  const rules = buildRulesComponent(devinRules, scanRuleFiles(scanCwd));
  const skills = buildSkillsComponent(devinSkills, scanCwd);
  const mcp = buildMcpComponent(devinMcp);
  const hooks = buildHooksComponent();
  const agentProfiles = buildAgentProfilesComponent(scanCwd);
  const session = sessionEvidence(CONDITION === 'a' ? null : PROJECT);

  // Apply condition-(b) exclusions
  if (CONDITION === 'b') {
    for (const coll of [rules.items, skills, agentProfiles.items, mcp.configs]) {
      for (const it of coll) if (it.excludedInB) it.__excluded = true;
    }
  }

  // totals
  const injectedRuleBytes = rules.items
    .filter((i) => !i.__excluded && i.classification === 'injected_at_start')
    .reduce((s, i) => s + i.bytes, 0);
  const lazyRuleItems = rules.items.filter((i) => !i.__excluded && i.classification !== 'injected_at_start' && i.classification !== 'dead_parse_error');
  const deadRuleItems = rules.items.filter((i) => !i.__excluded && i.classification === 'dead_parse_error');
  const excludedRuleItems = rules.items.filter((i) => i.__excluded);
  const skillCatBytes = skills.filter((s) => !s.__excluded).reduce((s, i) => s + i.serializedBytes, 0);
  const profileBytes = agentProfiles.items.filter((i) => !i.__excluded).reduce((s, i) => s + i.descBytes, 0);

  const inventory = {
    tool: 'contextInventory.mjs',
    generatedAt: new Date().toISOString(),
    condition: CONDITION,
    conditionMeaning: {
      a: 'unconfigured-workspace baseline (empty project dir, global-only load)',
      b: 'project minus project config (.windsurf/rules, .devin/, AGENTS/CLAUDE-family excluded)',
      c: 'full project state',
    }[CONDITION],
    scanCwd,
    project: PROJECT,
    devinBin,
    components: {
      rules: {
        items: rules.items,
        loaderErrors: rules.loaderErrors,
        totals: {
          injectedAtStart: {
            count: rules.items.filter((i) => !i.__excluded && i.classification === 'injected_at_start').length,
            bytes: injectedRuleBytes,
            estTokens: estTokens(injectedRuleBytes),
          },
          lazy: {
            count: lazyRuleItems.length,
            bytes: lazyRuleItems.reduce((s, i) => s + i.bytes, 0),
          },
          deadParseError: {
            count: deadRuleItems.length,
            bytes: deadRuleItems.reduce((s, i) => s + i.bytes, 0),
          },
          excludedByCondition: {
            count: excludedRuleItems.length,
            bytes: excludedRuleItems.reduce((s, i) => s + i.bytes, 0),
          },
        },
      },
      skillsCatalog: {
        items: skills,
        totals: {
          count: skills.filter((s) => !s.__excluded).length,
          descBytes: skills.filter((s) => !s.__excluded).reduce((s, i) => s + i.descBytes, 0),
          serializedBytes: skillCatBytes,
          serializedEstTokens: estTokens(skillCatBytes),
        },
      },
      mcp,
      hooks,
      agentProfiles: { ...agentProfiles, totals: { count: agentProfiles.items.filter((i) => !i.__excluded).length, descBytes: profileBytes, estTokens: estTokens(profileBytes) } },
    },
    sessionEvidence: session,
    totals: {
      sessionStartInjectedBytes: injectedRuleBytes + skillCatBytes + profileBytes,
      sessionStartInjectedEstTokens: estTokens(injectedRuleBytes + skillCatBytes + profileBytes),
      note: 'excludes base system prompt + tool schemas (not filesystem-measurable); see sessionEvidence for the IDE meter',
    },
  };
  if (tmpDir) { try { fs.rmdirSync(tmpDir); } catch { /* non-empty ok */ } }
  return inventory;
}

const inv = buildInventory();

if (EMIT_JSON) {
  console.log(JSON.stringify(inv, null, 2));
} else {
  const r = inv.components.rules.totals;
  const s = inv.components.skillsCatalog.totals;
  console.log(`condition ${inv.condition} (scanCwd=${inv.scanCwd})`);
  console.log(`rules: injected=${r.injectedAtStart.count}/${r.injectedAtStart.bytes}B lazy=${r.lazy.count}/${r.lazy.bytes}B dead=${r.deadParseError.count}/${r.deadParseError.bytes}B`);
  console.log(`skills: ${s.count} entries, serialized≈${s.serializedBytes}B (~${s.serializedEstTokens} tok)`);
  console.log(`mcp servers: ${inv.components.mcp.servers.map((x) => x.name + (x.disabled ? '(off)' : '')).join(', ') || 'none'}`);
  const ev = inv.sessionEvidence;
  if (ev.available) console.log(`ide meter: first=${ev.firstNumTokensPreceding} max=${ev.maxNumTokensPreceding} (session ${ev.sessionId})`);
  console.log(`session-start injected ≈ ${inv.totals.sessionStartInjectedBytes}B ≈ ${inv.totals.sessionStartInjectedEstTokens} est tokens`);
}
