# R-342 / artifact-r002 — Phase-0 (Measure): context-budget inventory

Date: 2026-11-15. Tool: `scripts/dev/contextInventory.mjs`
(`node scripts/dev/contextInventory.mjs --condition a|b|c --json`, re-runnable
for Phase-4 re-measure; each condition run ≥2× — byte-identical modulo
timestamp/session-meter fields).

## Method & sources

| Source | Role |
|---|---|
| `devin rules list` / `skills list` / `mcp list` (app-bundled CLI, `Devin.app/.../devin/bin/devin`) | **Authoritative loader view** — what the engine catalogues/activates per cwd |
| Filesystem (`~/.claude`, `~/.devin`, `~/.codeium/windsurf`, `~/.agents`, `~/.config/devin`, `RPG/.windsurf`, `RPG/.devin`, `RPG/.agents`, `RPG/.claude`, `RPG/coordinator/skills`) | Byte sizes + declared frontmatter triggers |
| `~/.local/share/devin/cli/sessions.db` (`message_nodes.metadata.num_tokens_preceding`, `chat_message`) | The IDE's own cumulative token meter + real serialized context blocks |

Conditions: **(a)** `devin * list` run in an empty temp dir (global-only);
**(b)** run on RPG with items sourced from `.windsurf/rules`, `.devin/`,
`AGENTS.md`, `CLAUDE.md` (root + nested) excluded — project skill dirs
(`.agents/skills`, `.claude/skills`, `.windsurf/skills` → `coordinator/skills`)
are NOT in the exclusion list and remain, per the literal spec; **(c)** full
project.

## KEY QUESTION — does an attributable token counter exist? **YES (internal), NO (user-facing)**

- **YES:** `sessions.db → message_nodes.metadata.num_tokens_preceding` is a real
  cumulative per-message token meter written by the engine itself. The
  `mw-context-budget.py` UserPromptSubmit hook already reads it.
- **YES, injected too:** the engine writes recurring
  `<context_usage>NNNk of 262k tokens used…</context_usage>` system nodes into
  the session (observed in `golden-look`, ~40 occurrences, 258 B each — marked
  "never tell the user").
- **NO per-component attribution:** the meter is cumulative; component cost is
  only inferable by diffing serialized `chat_message` blocks (which ARE stored
  and measurable — see §4).
- **NO user-facing command:** `devin doctor` = config diagnostics only;
  `essential-commands.mdx` slash-command list has no `/context`, `/usage`,
  `/cost`. Metered values come from the DB or the injected notices.

**Metered evidence (sessions.db):** first `num_tokens_preceding` across the 12
most recent RPG sessions = **27,280 – 28,404 tokens** (consistent injected
baseline incl. base prompt + first turn). `golden-look` grew 27,722 → **261,975**
over ~4 days — the actual 262k-saturation event was reached by conversation
accumulation, not fresh injection.

## 1. Per-condition inventory (measured)

### (a) Unconfigured-workspace baseline — session-start injected ≈ 17,430 B ≈ ~4.4k est tok

| Class | Items | Bytes | Est. tok |
|---|---:|---:|---:|
| Always-on rules (global) | 3 | 2,996 | ~749 |
| — `~/.claude/CLAUDE.md` | | 228 | |
| — `~/.codeium/windsurf/memories/global_rules.md` | | 0 | empty file |
| — `~/.devin/rules/delegation-context-budget.md` | | 2,768 | see §3 discrepancy |
| Skill catalog (name+desc) | 49 | 13,739 serialized | ~3,435 |
| Agent profiles (global `researcher/verifier/implementer` descs) | 3 | 695 | ~174 |
| MCP configs (puppeteer on, git disabled) | 2 files | 640 | schemas lazy |
| Hooks config (4 hooks) | 1 | 677 | output conditional, ~0–600 B/fire |

49 skills = 45 user-global (realpath dedup: `~/.agents`, `~/.claude`,
`~/.cursor`, `~/.codeium/windsurf/skills` all symlink →
`mind-weaver/.agents/skills`; `work-ticket` → `work-solver`) + `devin-cli`
(app-shipped) + 2 built-ins. Post-PLAN-120 description corpus = 8,130 B.

### (b) Global-only (project minus config) — ≈ 22,232 B ≈ ~5.6k est tok

| Class | Items | Bytes | Note |
|---|---:|---:|---|
| Always-on rules | 3 | 2,996 | identical to (a) |
| Skill catalog | 62 | 18,541 | +13 project skills vs (a) — `.agents/skills` not excluded |
| Agent profiles | 3 | 695 | `.devin/agents` excluded → global only |
| Excluded (project config) | 23 files | 62,501 | all rules + AGENTS/CLAUDE family |

Consistency check: (b) − project-skill serialized bytes (4,802) = 17,430 B =
(a) exactly. If the exclusion list is widened to cover project skill dirs,
(b) ≡ (a).

### (c) Full project — ≈ 49,094 B ≈ ~12.3k est tok

| Class | Items | Bytes | Est. tok |
|---|---:|---:|---:|
| Always-on rules (loader-advertised) | 9 | 29,125 | ~7,282 |
| Lazy rules (agent-decidable/manual/glob + nested AGENTS) | 6 | 10,092 | names+descs only |
| **Dead rules (YAML parse error)** | **11** | **26,280** | absent from loader catalog entirely |
| Skill catalog | 62 | 18,541 | ~4,635 |
| Agent profiles (3 global + 3 `rpg-*`) | 6 | 1,428 | ~357 |
| MCP / hooks | | 640 / 677 | as (a) |

## 2. The (b) → (c) project-attributable delta

**+26,862 B ≈ ~6.7k est tokens** of session-start injection is attributable to
the project:

- `AGENTS.md` 9,265 + `CLAUDE.md` 468 = 9,733 B
- 4 `always_on` project rules (00, 40, 50-shutdown, 55-delegation) = 16,396 B
- 3 `rpg-*` agent profiles = 733 B

(Cross-check vs the earlier byte-level audit in
`.mw/runs/plan120-catalog-slim/phase0-context-inventory.md`: identical 26,129 B
for the file portion. That report remains valid for file-level detail; this one
supersedes its "all 20 rules have valid frontmatter" claim — see §3.)

## 3. Findings beyond the numbers

1. **Carried-over context is structural, not hypothetical.** New chains copy
   prior serialized nodes (`metadata.extensions.compact/prior_node_ids`,
   hundreds–thousands per session). The live chain's serialized
   `<available_skills>` block still lists `coordinator`, `coordinator-mandate`,
   `demo`, `strategist-mandate` (archived in Phase-1) with pre-slim
   descriptions, and the `<MCP Servers>` prefix still lists removed
   `github-mcp-server` — in sessions created AFTER those changes. Plus 58 KB
   compaction-summary nodes injected into continuing threads. **This is the
   262k driver**, not fixed injection.
2. **11 of 20 `.windsurf/rules/*.md` fail the loader's YAML parse**
   (`devin rules list` "Errors:") — unquoted `:` in `description:` lines and
   `globs:` as CSV string instead of sequence. Under the CLI loader they are
   absent from the catalog: not injected AND presumably not lazily loadable.
   Affected: 10-ui, 15-browser-preview, 16-no-foreground, 17-resource,
   20-config-persistence, 30-frozen-kits, 45-director-intent, 46-approved-refs,
   50-interaction-patterns, 85-doc-impact, mw-rpg-bridge (26,280 B — all 4 glob
   rules + 7 of 8 model_decision). Session-start cost unaffected; **enforcement
   reach likely broken** — fix = quote descriptions / YAML-sequence globs
   (governance touch → Director flag, not done here).
3. **`devin rules list` vs observed injection diverge.** Loader advertises 9
   always-on rules; every serialized rules block inspected (5+ sessions, incl.
   `golden-look` main session and post-change chains) contains only the same
   7 — `delegation-context-budget` (global Devin-provider) and
   `55-delegation-context-budget` (project) are never present. Consistent with
   subagent-filtering (all post-13:58 sessions are subagent chains) but
   unresolved for a fresh main Desktop session.
4. **MCP is not the elephant:** only `puppeteer` enabled (`git` disabled);
   tool schemas are lazy via `list_tools`. Serialized MCP prefix = 2,211 B
   (stale — still lists github-mcp-server).
5. **Hooks:** 4 global hooks (skill telemetry, context-budget, post-compact ×2).
   Silent when below thresholds; each firing injects ~300–600 B. The recurring
   258 B `<context_usage>` engine notices are separate and unconditional.
6. **Mandated reads dwarf fixed injection** (from the prior audit, still
   correct): AGENTS.md's session-start read list ≈ 1.54 MB ≈ ~386k est tok;
   `RICHIESTE.md` alone ≈ 272k est tok — larger than the budget.
7. Cosmetic: dangling skill symlinks `coordinator`, `strategist`, `demo` in
   `~/.codeium/windsurf/skills/` (targets archived elsewhere) — dead, harmless.

## 4. Residual gap vs the 262,144 budget (honest statement)

- Filesystem-inventoryable session-start (c) ≈ **49 KB ≈ ~12.3k est tokens**.
- Metered first reading on recent sessions ≈ **27.7k tokens**. The ~15k-token
  difference = base agent system prompt (~17.7 KB serialized) + tool schema
  serialization + envelope overhead — **not filesystem-attributable**.
- Fresh injection ≈ **10.6% of 262,144**. The remaining ~90% is conversation +
  carried-over serialized state (copied nodes, 58 KB compaction summaries).
- **Not verified:** whether Devin Desktop's GUI session differs from the
  bundled-CLI session model measured here; whether a fresh *main* (non-subagent)
  window injects the two delegation rules; whether the IDE's own frontmatter
  parse is as strict as `devin rules list`'s (if stricter/looser, §3.2's "dead"
  verdict shifts). All serialized-block evidence is from this machine's
  `sessions.db`, `swe-2-high`, 2026-11-15.

## 5. Reproduce

```bash
node scripts/dev/contextInventory.mjs --condition a --json   # empty-dir baseline
node scripts/dev/contextInventory.mjs --condition b --json   # project minus config
node scripts/dev/contextInventory.mjs --condition c --json   # full project
```

Phase-4: re-run the same three commands; diff the `components.*.items` lists
(diffable, sorted) and compare `sessionEvidence.firstNumTokensPreceding`.
