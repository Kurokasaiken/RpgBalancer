# Invariant → Enforcement Matrix (PLAN-122, T-1)

**Stato:** `draft — PENDING Director sign-off` (§0b gate: nessuna demozione
prima dell'approvazione di questa matrice, gap inclusi).

**Sorgente:** `context/governance/invariant-ledger.json` (167 invarianti
atomiche, doppia estrazione anti-T-06). Ogni riga cita l'ID del ledger; il
verbatim vincolante sta nel ledger, non duplicato qui.

**Legenda disposizioni (P2 — tre sole opzioni + GAP dichiarato):**

- `check:` — enforcement meccanico nominato. Formato: `check` + nome check nella
  colonna "proposed check / kernel line". I check taggati **(existing)** esistono
  già in `package.json`/`scripts/`. I check taggati **(proposed — T-3 v1)** sono
  nello scope D-3 approvato-by-default. I check taggati **(proposed — post-v1)**
  sono meccanizzabili ma fuori scope v1: la riga kernel resta vincolante finché
  il check non è fixture-validated (P3 — nessuna demozione senza fixture).
- `kernel:` — la riga vincolante deve restare `always_on` (giudizio contestuale,
  decisione Director-only, comportamento d'agente non osservabile da un gate).
- `human-review:` — serve un testimone umano/runtime in un punto definito.
- `GAP` — né check, né kernel, né human review coprono onestamente. Richiede
  `gap_approval` esplicita del Director (campo nelle note della riga).

---

## Matrix

### `.windsurf/rules/00-project-invariants.md` (31)

| invariant ID | invariant (short) | disposition | proposed check name or kernel line | notes |
|---|---|---|---|---|
| INV-00-CONFLICT-FLAG | flag invariant conflicts, never silently break | GAP | — | **gap_approval: pending** — a silent non-flag leaves no trace in any artifact; kernel line retained but cannot verify an omission. |
| INV-00-PERSIST-SVC | all save/load via PersistenceService | check: | persistence:no-forbidden-apis (proposed — T-3 v1) | Ban side is mechanical; "all traffic through service" only partially provable — kernel line retained. |
| INV-00-PERSIST-BAN | no localStorage/sessionStorage/sync persistence | check: | persistence:no-forbidden-apis (proposed — T-3 v1) | Verified: eslint.config.js has NO localStorage/sessionStorage ban today (plan §0 fact confirmed). AST rule per D-6. |
| INV-00-CONFIG-NO-HARDCODE | no hardcoded gameplay/UI values in components | kernel: | "No hardcoded gameplay/UI values in components." | What counts as a gameplay/UI value is semantic judgment — kernel. |
| INV-00-CONFIG-ZOD | new config modules use Zod schemas | check: | config:zod-schema (proposed — post-v1) | AST: zod schema export in new `**/config/**` modules. Kernel retains until fixture-validated. |
| INV-00-SKIN-PRESET | new skins via skinConfigRegistry preset, never .css | check: | skin:no-adhoc-css (proposed — T-3 v1) | `.css` ban is mechanical; the "preset in registry" side stays kernel (semantic). |
| INV-00-SKIN-CSS-VIOLATION | .css-for-skin request = violation, flag it | check: | skin:no-adhoc-css (proposed — T-3 v1) | Glob guard on staged/created `.css` vs versioned legacy whitelist (D-3b). |
| INV-00-I18N-NO-HARDCODE | no hardcoded user-facing strings | check: | i18n:no-jsx-literals (proposed — post-v1) | `i18n:validate` exists but covers key/namespace integrity, not JSX literals. Kernel retains. |
| INV-00-I18N-NAMESPACES | keys in common/idleVillage locale resources | check: | i18n:validate (existing) | Existing — validates locale resources/key integrity; namespace confinement partially covered. |
| INV-00-I18N-TELEMETRY | never suppress `translation_missing` telemetry | kernel: | "Missing keys are telemetered via `translation_missing`; do not suppress them." | Suppression is an omission — not lintable; kernel. |
| INV-00-REUSE-VERIFY | check primitive dirs before writing new UI component | kernel: | "Before writing a new UI component, verify if an equivalent primitive exists…" | Equivalence is judgment — kernel. |
| INV-00-REUSE-NODUP | never duplicate primitive markup/styling | human-review: | code review on new UI components; visual-fork gate if ≥2 representations | "Duplication" needs semantic judgment; no honest lint. |
| INV-00-REUSE-DIR | new primitives go in correct primitive directory | kernel: | "…must be added to the correct primitive directory (not left as an isolated component in a page)." | Mechanizable in principle (component-location lint) but noisy; kernel for now — candidate post-v1. |
| INV-00-STATE-SPLIT | Zustand=shared domain state, Context=local UI state | kernel: | "if the state is needed outside the subtree of components that consume it, use Zustand… use Context." | Decision criterion needs conversation/consumer context — core kernel line. |
| INV-00-STATE-VIOLATION | Context-for-shared-data (or vice versa) = violation | human-review: | design review when adding a Context or store slice | Same judgment as INV-00-STATE-SPLIT. |
| INV-00-DOC-JSDOC | every new function/interface gets JSDoc | check: | jsdoc:require (proposed — post-v1; eslint-plugin-jsdoc) | Mechanizable; kernel retains until licensed. |
| INV-00-DOC-PLAN-UPDATE | update relevant plan/changelog before done | human-review: | closure review; `docs:impact` covers declared-impact plans partially | Which plan is "relevant" is judgment. |
| INV-00-DOC-LIVING-PLANS | plans referenced/updated on divergence | human-review: | plan review cycle | Sync judgment — twin of INV-40-PLAN-SYNC. |
| INV-00-NODE-PIN | pinned Node from .nvmrc; never mutate global | kernel: | "Use the pinned Node version from `.nvmrc`… Never mutate the global Node version." | Environment state, not repo state — kernel. |
| INV-00-NO-FOREGROUND | never open foreground windows; headless automation | check: | foreground:lint (existing) | Full contract in rule 16; lint covers repo literals, not runtime behavior — see INV-16-MANUAL-ONLY. |
| INV-00-SAFEGUARDS | lint/test/build:check/closure:lint before "done" | kernel: | "Run and pass (fix on failure): `npm run lint`, `test`, `build:check`, `closure:lint`. If any safeguard fails, the task is BLOCKED." | The mandate to run them is agent behavior; `governance:check` (T-2) will orchestrate the commands, not replace this line. |
| INV-00-DEPLOY-VERIFY | deploy not done until prod-alias verification green | check: | guardian:deploy-guard (existing) | Post-deploy verification gate already wired. |
| INV-00-DEPLOY-WEBGL | WebGL-enabled probe on Pixi surfaces | check: | guardian:deploy-guard → scripts/deploy/webglBootProbe.mjs (existing) | `webglProbeRoutes: ['/', '/game']` — boot error/page exception/missing canvas fails deploy. |
| INV-00-DEPLOY-HONESTY | never report "deploy OK" on failed/unverified check | human-review: | Director reads deploy reports (T-04) | Report honesty cannot self-verify. |
| INV-00-WORKFLOW-PAUSA | kanban/dispatch in pausa, no new board rows | check: | closure:lint → checkKanbanGate; agents:lint for nested agent files (existing) | Existing mechanical coverage. |
| INV-00-WORKFLOW-CICLO | plan→implement→verify:bundle→fatta+bundle: | kernel: | "plan con contratto → implementazione con l'agente locale → `verify:bundle` → chiusura `fatta` in `RICHIESTE.md` con citazione `bundle:`." | Cycle shape is kernel; the closing step is gated by INV-00-WORKFLOW-CLOSURE-GATE. |
| INV-00-WORKFLOW-CLOSURE-GATE | closure:lint blocks `fatta` without bundle | check: | closure:lint → checkRichiesteGate (existing) | The gate IS the enforcement (R-189). |
| INV-00-WORKFLOW-DISPATCH-DIRECTOR | dispatch reactivation = Director-only decision | kernel: | "Riattivazione del dispatch solo su decisione esplicita del Director." | Director-only decision — kernel. |
| INV-00-TIMEOUTS | every command has max runtime; hang = failure | kernel: | "Every command must have a maximum runtime… A command that hangs is treated as a failure, not as 'still running'." | Agent behavior + numeric contract — kernel. |
| INV-00-SEPARATION | no work-project logic; scoped legacy edits only | human-review: | Director/Strategist flags cross-project contamination | Boundary judgment. |
| INV-00-BASELINE-REGISTER | new cross-cutting systems MUST register here | kernel: | "it MUST be registered here — not left implicit in a single prompt." | Meta-rule — kernel. |

### `.windsurf/rules/40-documentation-governance.md` (8)

| invariant ID | invariant (short) | disposition | proposed check name or kernel line | notes |
|---|---|---|---|---|
| INV-40-SSOT | exactly one trusted doc + one index row per trusted/frozen component | check: | contracts:index-sync + trusted:check (existing — partial) | "Exactly one doc" clause: verify actual coverage in T-3 before citing as demotion license. |
| INV-40-NODUP | general docs index/link, never duplicate contract | human-review: | doc-governance review | Semantic duplication detection not honestly mechanizable. |
| INV-40-CHANGE-POLICY | trusted/frozen change requires doc + index row + evidence log | human-review: | closure review on diffs touching trusted surfaces | `trusted:check` seals doc integrity; whether a change "modifies the contract" is judgment. |
| INV-40-RUNTIME-VERIFY | no doc closure without build:check + lint + contract/RTL tests | kernel: | "No documentation closure without runtime verification." | Overlaps INV-00-SAFEGUARDS — kernel. |
| INV-40-PLAN-SYNC | plans referenced before drafting, updated on divergence | human-review: | plan review cycle | Doc-governance sync judgment. |
| INV-40-PLAN-BUG | out-of-sync plan = bug blocking closure | human-review: | closure review | Same judgment. |
| INV-40-STATUSES | canonical statuses only (draft/candidate/trusted/frozen/deprecated) | check: | statuses:canonical (proposed — post-v1) | Lint status fields in index rows/frontmatter. |
| INV-40-EXCEPTIONS | kit exceptions tracked in EXCEPTIONS.md | kernel: | "Kit exceptions are tracked in `src/docs/docs/idle_village/EXCEPTIONS.md`." | Pointer line — kernel. |

### `.windsurf/rules/50-shutdown-governance.md` (13) — trigger stays `always_on` (WITNESS-01)

| invariant ID | invariant (short) | disposition | proposed check name or kernel line | notes |
|---|---|---|---|---|
| INV-50-ONLY-MANAGER | only shutdownManager may request macOS shutdown | check: | shutdown:lint-capability (existing) | Scans repo for shutdown-capable commands outside `scripts/shutdownManager/`. |
| INV-50-NO-DIRECT-SHUTDOWN | no script/hook/cron/app may call shutdown-family commands | check: | shutdown:lint-capability (existing) | Same check — the forbidden-command list is its scan surface. |
| INV-50-SESSION-REGISTER | blocking sessions must register + heartbeat | kernel: | "…must register in `~/.rpg-shutdown/session-registry.json` and send periodic heartbeats." | Runtime registry state — not repo-checkable. |
| INV-50-NO-FS-SIGNALS | FS writes/git/CPU/log not valid shutdown signals | kernel: | "Filesystem writes, Git dirty state, CPU usage, or coordinator log writes are not valid shutdown signals by themselves." | Manager policy semantics. |
| INV-50-FAILCLOSED | shutdown disabled by default; dry-run first; bad registry blocks | kernel: | "Real shutdown is disabled by default (`policy.shutdownEnabled === false`)… Unknown, expired, corrupted, or unreadable registry state blocks shutdown." | Compressible to checklist in T-6, binding lines intact. |
| INV-50-QUIETWINDOW | shutdown only in quiet window; restrictedDaysOfWeek semantics | kernel: | "When `policy.quietWindow.enabled` is true, shutdown is allowed only while the quiet window is active…" | Policy data incl. R-211 day semantics — kernel. |
| INV-50-BACKSTOP | backstop classifies: real work blocks, server fixtures never veto | kernel: | "server fixtures (`vite preview`, dev servers) are reported but **never** veto… New blocking patterns may be added only for actual work." | Backstop policy (R-212). |
| INV-50-AUTOCOMMIT-SEP | git never a shutdown criterion; no auto-commit+push+shutdown combo | kernel: | "Git state must never be used as a global shutdown criterion. No script may combine auto-commit, auto-push, and shutdown without explicit review and policy configuration." | Policy. |
| INV-50-CAPOWN | only shutdownExecutor.ts executes machine shutdown | check: | shutdown:lint-capability (existing) | Capability boundary is exactly the lint's scan. |
| INV-50-LINTCAP-MANDATE | shutdown:lint-capability must scan repo and fail on violations | check: | shutdown:lint-capability (existing — self-mandating) | The check IS the line's enforcement. |
| INV-50-LINTCAP-WIRE | new shutdown behavior must wire/update this guard | kernel: | "Any prompt that adds shutdown behavior must wire this guard or update it." | Meta-obligation — kernel. |
| INV-50-VIOLATION-FLAG | flag violations before task complete | kernel: | "Violations must be flagged to the Strategist/Coordinator before the task is considered complete." | Agent behavior. |
| INV-50-ADDBEHAVIOR | new shutdown behavior → update rule + register + status + evidence | kernel: | "Any prompt that adds shutdown/auto-shutdown/idle-shutdown behavior must first update this invariant and register the component in `session-registry.json`." | Procedural kernel. |

### `.windsurf/rules/55-delegation-context-budget.md` (11) — trigger stays `always_on`

| invariant ID | invariant (short) | disposition | proposed check name or kernel line | notes |
|---|---|---|---|---|
| INV-55-NO-ROTATE | never rotate sessions/windows to "save context" | kernel: | "Do NOT rotate sessions or open new windows to 'save context' — compact and continue." | Session-lifecycle behavior — kernel. |
| INV-55-WARN | ≥70% budget: declare it; no new multi-file tasks | kernel: | "WARN (>=70%): declare the remaining budget to the Director; no new multi-file tasks — only small fixes, questions, docs. Prefer delegation." | Hook injects the notice; the behavior is kernel. |
| INV-55-CRIT | ≥85%: finish step, write resume point, propose thread | kernel: | "CRIT (>=85%): finish the current step only, write the exact resume point into the task's handoff/ledger, and propose a new thread." | Kernel. |
| INV-55-POSTCOMPACT | follow PostCompaction re-injection before continuing | kernel: | "…the global `PostCompaction` hook re-injects the canonical docs… Follow it before continuing." | Kernel. |
| INV-55-DELEGATE | delegate by work-type table (research/verify/implement) | kernel: | delegation table: `rpg-researcher`/`rpg-verifier`/`rpg-implementer`/`is_background`/`subagent_general` | Routing judgment per task — kernel (the table IS the contract). |
| INV-55-PROFILES | rpg-* profiles pinned swe-1-6-fast; subagent_general sparingly | kernel: | "`subagent_general` inherits the parent's model — use it only when the work genuinely needs the primary model's strength." | Kernel. |
| INV-55-CONTRACT | front-load subagent prompts: paths, docs, deliverable, format | kernel: | "Front-load everything: subagents do NOT see the conversation." | Prompt-craft obligation — kernel. |
| INV-55-FG-BG | foreground when blocking; background for breadth | kernel: | "Prefer foreground when the answer blocks the next step; background for parallel breadth." | Kernel. |
| INV-55-DISTILL | distill subagent output; never relay raw | kernel: | "The parent distills the result for the Director — never relay raw output." | Kernel. |
| INV-55-NO-TRIVIAL | don't delegate trivial single-file/one-command checks | kernel: | "Do NOT delegate a trivial single-file lookup or a one-command check." | Kernel. |
| INV-55-T04 | subagent report is not a T-04 witness | human-review: | runtime witness (probe/screenshot/Director eye) before "done" on scene/animation/UI claims | Per T-04 — needs a witness that can see. |

### `AGENTS.md` (20)

| invariant ID | invariant (short) | disposition | proposed check name or kernel line | notes |
|---|---|---|---|---|
| INV-AGENTS-SESSION-READS | session start reads canonical docs + advisory lane | kernel: | "All'inizio di ogni sessione: leggi `CANON.md`, `CURRENT_STATE.md`, `DESIGN_PILLARS.md`, `context/DECISION_LOG.md`, `RICHIESTE.md`, `.mw/desiderata.md`, `context/INDEX.md` (se esiste) e `context/auto/`…" | Session bootstrap — kernel; PostCompaction hook re-injects (INV-55-POSTCOMPACT). |
| INV-AGENTS-DOCROLES | canonical doc roles; direction/history ≠ vincolo | kernel: | "Direzione e storia non sono la stessa cosa di un vincolo, e non vanno trattate come tale." | Canonical-doc authority — kernel. |
| INV-AGENTS-WORKFLOW-PAUSA | board/dispatch in pausa; closure:lint gate; no board rows | check: | closure:lint → checkKanbanGate + checkRichiesteGate; agents:lint (nested files) (existing) | Existing. |
| INV-AGENTS-MW-PHASES | explorer/planner/executor(+mandate)/regression skill routing | kernel: | "Fase esplorativa → mw-explorer; pianificazione → mw-planner; esecutiva → mw-executor + agent-execution-mandate; prima di toccare codice esistente → mw-regression." | Phase routing is judgment — kernel. |
| INV-AGENTS-VISUALFORK | visual fork gate ≥2 material representations | check: | closure:lint → checkVisualForkGate (existing) | v35 FROZEN / PLAN-047; skip requires verifiable pointer. |
| INV-AGENTS-PREFLIGHT | read recurring-traps surface index before touching code; re-apply before done | kernel: | "prima di toccare codice leggi l'indice per superficie di `context/recurring-traps.md`… prima di dichiarare il lavoro fatto, riapplicale." | Kernel — duplicated by INV-CLAUDE-PREFLIGHT (deliberate redundancy across agent surfaces). |
| INV-AGENTS-T04 | scene/animation/UI claims need a seeing witness | human-review: | runtime witness (headless probe w/ artifacts, or Director eye) before "done" | T-04 — cannot self-verify. |
| INV-AGENTS-T13 | suspect shared-worktree collision first; no scoped commits of others' work | kernel: | "un failure di safeguard/probe va prima sospettato come collisione di stato condiviso… riprova… mai commit scoped che catturerebbe lavoro altrui." | Kernel. |
| INV-AGENTS-NO-FG | never open foreground windows; open only with -g | check: | foreground:lint (existing) | Same contract as INV-16-HARD. |
| INV-AGENTS-INTENT-CAPTURE | capture Director intent in RICHIESTE.md before responding | check: | closure:lint → checkIntentGate (existing — partial) | Gate exists; the "prima di rispondere" timing is not verifiable — residual kernel. |
| INV-AGENTS-MW-INVOKE | invoke MW scripts as `python scripts/<nome>.py`, never `./scripts/…` | kernel: | "Invoca sempre come `python scripts/<nome>.py`, mai `./scripts/<nome>.py`." | Agent command discipline — kernel. |
| INV-AGENTS-DELTA-INGEST | ingestions → durable items → director-profile.jsonl | kernel: | "estrarre item durevoli … e appenderli in `context/auto/director-profile.jsonl` via `mw-delta.py append`." | Kernel. |
| INV-AGENTS-DELTA-MID | mid-session durable Director statements → append SUBITO | GAP | — | **gap_approval: pending** — "SUBITO" is a timing obligation: no artifact can prove when the append happened vs. end-of-task; a skipped append leaves no trace. Kernel line retained. |
| INV-AGENTS-DELTA-CLOSE | close-time delta: only non-derivable items | kernel: | "alla chiusura di un task, appendere SOLO item non derivabili da codice/git/file canonici." | Kernel. |
| INV-AGENTS-ADVISORY-NONCANON | advisory notes never override canonical docs | kernel: | "Le note sono ADVISORY: mai riscrivere/contraddire CANON/desiderata/RICHIESTE; su conflitto il canonico vince." | The "lint advisory-vs-canonical fail-closed" mentioned in the line has NO script in `scripts/`/`package.json` (verified) — flagged as ambiguity for Director. |
| INV-AGENTS-DK-SCOPE | director-knowledge vault: consult for preferences, not project state; read-only | kernel: | "Non consultare per stato o decisioni di progetto… Read-only: questo progetto non scrive nel vault." | Kernel. |
| INV-AGENTS-DK-TRIGGER | mw-director bootstrap + recall on non-trivial tasks | kernel: | "su task non banali … lanciare `mw-director.py bootstrap` all'avvio e `recall --topic` prima di proporre." | "Non banale" is judgment — kernel. |
| INV-AGENTS-TENSION-FLAG | name pillar/desiderata tensions before proceeding; Fausto decides | GAP | — | **gap_approval: pending** — same silence problem as INV-00-CONFLICT-FLAG: an unflagged tension is invisible. Kernel line retained. |
| INV-AGENTS-ADMIT-UNKNOWN | "if you don't know, say it" — don't deduce direction | GAP | — | **gap_approval: pending** — an undetected silent deduction produces a confident artifact indistinguishable from a true one. Kernel line retained. |
| INV-AGENTS-SCENEAUTH | scene art MUST go through scene-author skill gates | check: | scripts/check-scene-prompt.py + scripts/check-scene-art.py (existing — skill-internal) | Gates exist INSIDE the skill; nothing in closure:lint forces invocation — invocation obligation stays kernel; candidate post-v1 wiring. |

### `CLAUDE.md` (1)

| invariant ID | invariant (short) | disposition | proposed check name or kernel line | notes |
|---|---|---|---|---|
| INV-CLAUDE-PREFLIGHT | pre-flight recurring-traps even without mw-* skills | kernel: | "before touching code read the surface index in `context/recurring-traps.md`, and before calling work done re-apply the traps your surface hits." | Deliberate duplicate of INV-AGENTS-PREFLIGHT for the Claude surface — kernel. |

### `.windsurf/rules/10-ui-invariants.md` (glob — 12)

| invariant ID | invariant (short) | disposition | proposed check name or kernel line | notes |
|---|---|---|---|---|
| INV-10UI-SKIN-DEFAULT | default skin system, useSkinPreferences | kernel: | "UI must use the default skin system, not bespoke styling." | Kernel. |
| INV-10UI-SKIN-PRESETID | DEFAULT_SKIN_PRESET_ID + resolveSlotRackPresetId | check: | ui:skin-preset-resolution (proposed — post-v1) | Import/usage lint feasible. |
| INV-10UI-NO-HARDCOLOR | skin visuals from tokens, never hardcoded colors | check: | lint:painter (existing — PARTIAL: covers only 2 files in TARGET_FILES) | Extend TARGET_FILES/glob scope post-v1 before citing as license. |
| INV-10UI-TOKEN-REGISTER | new skin tokens registered in registry + token css; no ad-hoc CSS vars | check: | ui:skin-token-register (proposed — post-v1) | Cross-file consistency lint feasible. |
| INV-10UI-I18N | useTranslation, no inline JSX literals | check: | i18n:no-jsx-literals (proposed — post-v1) | Same proposed check as INV-00-I18N-NO-HARDCODE. |
| INV-10UI-THEME | Gilded Observatory theme adherence | human-review: | visual review (/design-system review room or Director) | Aesthetic judgment. |
| INV-10UI-PERF | <16ms/frame; animate transform/opacity only | check: | ui:animatable-props (proposed — post-v1) | CSS animation-property lint feasible; the 16ms budget itself needs perf probes → human-review residual. |
| INV-10UI-FEEDBACK | layered feedback where warranted | human-review: | interaction review | "Where warranted" is judgment. |
| INV-10UI-DND | @dnd-kit only, no native HTML5 drag handlers | check: | ui:dnd-only (proposed — post-v1) | Ban `draggable`/`onDragStart` attrs outside dnd-kit helpers — AST-feasible. |
| INV-10UI-LAYERS | ≥6 layers per visual component | human-review: | visual review | Count is checkable but "layer" definition is semantic. |
| INV-10UI-BLIZZARD | Blizzard-style principles (imperfections, gradients, subtle anims, config-first) | human-review: | visual review | Aesthetic contract. |
| INV-10UI-PROTOTYPE | HTML prototype first, then React + config extraction | kernel: | "HTML prototype first, then React integration with config extraction." | Process ordering — kernel. |

### `.windsurf/rules/20-config-persistence.md` (glob — 7)

| invariant ID | invariant (short) | disposition | proposed check name or kernel line | notes |
|---|---|---|---|---|
| INV-20-CONFIG-SSOT | config modules are SSOT for stats/tokens/timings/copy keys | kernel: | "Config modules are the single source of truth for stats, tokens, timings, and copy keys." | Kernel (semantic). |
| INV-20-CONFIG-ZOD | Zod schemas + typed accessors, not raw objects | check: | config:zod-schema (proposed — post-v1) | Same proposed check as INV-00-CONFIG-ZOD. |
| INV-20-CONFIG-NOLEAK | no hardcoded constants leaking into components | kernel: | "No hardcoded gameplay/UI constants leaking into components — expose them here." | Kernel (twin of INV-00-CONFIG-NO-HARDCODE). |
| INV-20-PERSIST-SVC | persist only through PersistenceService | check: | persistence:no-forbidden-apis (proposed — T-3 v1) | Same check as INV-00-PERSIST-SVC. |
| INV-20-PERSIST-BAN | no localStorage/sessionStorage/sync/bespoke storage | check: | persistence:no-forbidden-apis (proposed — T-3 v1) | Same check as INV-00-PERSIST-BAN. |
| INV-20-TIMERS | autosave ≥30s; recurring timers ≥500ms | check: | persistence:timer-bounds (proposed — post-v1) | Numeric-literal bounds on setInterval/setTimeout delays — AST-feasible; eslint already bans these globals only in `src/ui/idleVillage`. |
| INV-20-JSDOC | JSDoc on every exported function/interface/schema | check: | jsdoc:require (proposed — post-v1) | Same proposed check as INV-00-DOC-JSDOC. |

### `.windsurf/rules/30-frozen-kits.md` (glob — 8)

| invariant ID | invariant (short) | disposition | proposed check name or kernel line | notes |
|---|---|---|---|---|
| INV-30-KIT-REGISTER | every Idle Village component → kit/extension/EXCEPTIONS entry | check: | kit:registration-coverage (proposed — post-v1) | Component↔KIT_REGISTRY/EXCEPTIONS coverage scan. |
| INV-30-BARREL | public imports via kits/index.ts barrel only | check: | kit:barrel-imports (proposed — post-v1) | `no-restricted-imports` on internal kit paths — trivially lintable. |
| INV-30-PROVIDER | KitShell/withKitShell provider chain required | check: | kit:provider-chain (proposed — post-v1) | AST presence check. |
| INV-30-REGISTRY-CERT | certified kits: contract+certManifestPath+docPath+hub | check: | kit:registry-metadata (proposed — post-v1) | KIT_REGISTRY shape validation; verify overlap with contracts:check first. |
| INV-30-REGISTRY-DRAFT | draft kits in KIT_REGISTRY with status draft + docPath | check: | kit:registry-metadata (proposed — post-v1) | Same check. |
| INV-30-HUB | new minimal pages add hub metadata (TestHub generated) | check: | kit:registry-metadata (proposed — post-v1) | Cross-reference minimal pages ↔ hub entries. |
| INV-30-CONTRACT-TEST | minimal-vs-test.spec.ts passes per certified kit | check: | tests/contract/minimal-vs-test.spec.ts (existing — playwright contract suite) | Existing. |
| INV-30-FREEZE-CMD | scaffold via npm run freeze:kit | kernel: | "Use `npm run freeze:kit <KitName>` to scaffold a new kit…" | Tool-usage guidance — kernel. |

### `.windsurf/rules/50-interaction-patterns.md` (glob — 4)

| invariant ID | invariant (short) | disposition | proposed check name or kernel line | notes |
|---|---|---|---|---|
| INV-50IP-PATTERN-REF | new game screens reference/propose an Interaction Pattern | human-review: | design review on new screens | Which pattern fits is judgment. |
| INV-50IP-STATUS-DERIVE | pattern status derives from KIT_REGISTRY/cert.json, never redeclared | check: | pattern:catalog-integrity (proposed — post-v1) | Catalog field lint/Zod refinement. |
| INV-50IP-SEMANTIC-RULES | compositionRules semantic, never allowedWith matrices | check: | pattern:catalog-integrity (proposed — post-v1) | Schema-level ban on allowedWith fields. |
| INV-50IP-DIVERSE-INTENT | same structure + different referenceIntent = different patterns | human-review: | catalog review | Semantic judgment. |

### `.windsurf/rules/10-canonical-dev-port.md` (model_decision — 6)

| invariant ID | invariant (short) | disposition | proposed check name or kernel line | notes |
|---|---|---|---|---|
| INV-10PORT-URL | canonical testing URL localhost:5173 | kernel: | "The canonical agent testing URL is `http://localhost:5173/`." | Kernel. |
| INV-10PORT-CMD | only `npm run dev` starts the dev server | kernel: | "The only command authorized to start the dev server is `npm run dev`." | Kernel. |
| INV-10PORT-NVM | pinned Node active before starting server | kernel: | "The pinned Node version from `.nvmrc` must be active before starting the server." | Kernel. |
| INV-10PORT-VERIFY | verify 5173 responds before testing; restart procedure | kernel: | "Before testing any page or feature, verify that a dev server is responding on `http://localhost:5173/`… all checks must target 5173 unless a harness overrides." | Agent procedure — kernel. |
| INV-10PORT-OVERRIDE | override non-5173 preview URLs to canonical | kernel: | "If `browser_preview` is called with a URL other than `http://localhost:5173/`, **override it to the canonical URL**…" | Kernel. |
| INV-10PORT-PREFLIGHT | curl content-type check on /src/main.tsx before preview | kernel: | "The response must be `text/javascript` or `application/javascript`. If it is `text/html`, the server is not Vite." | Kernel. |

### `.windsurf/rules/15-browser-preview-guard.md` (model_decision — 4)

| invariant ID | invariant (short) | disposition | proposed check name or kernel line | notes |
|---|---|---|---|---|
| INV-15-URL | only default preview URL is 5173; injected URLs forbidden | kernel: | "The only default preview URL is `http://localhost:5173/`… Do not use them unless the user explicitly requests that exact URL." | Kernel. |
| INV-15-PREFLIGHT | verify JS module serving before any preview | kernel: | "The response must have `status: 200` and `content-type:` containing `javascript`." | Kernel. |
| INV-15-AUTOSTART | auto-start sequence on failed pre-flight | kernel: | "…terminate stale processes, activate pinned Node, `npm run dev`, re-run check, only then open preview." | Kernel. |
| INV-15-OVERRIDE | harness/user port override; invalid override → fallback 5173 | kernel: | "If the override URL fails the same `/src/main.tsx` content-type check, treat the server as invalid and fall back to `http://localhost:5173/`." | Kernel. |

### `.windsurf/rules/16-no-foreground-windows.md` (model_decision — 8)

| invariant ID | invariant (short) | disposition | proposed check name or kernel line | notes |
|---|---|---|---|---|
| INV-16-HARD | NEVER foreground windows; automation headless/background | check: | foreground:lint (existing) | Hard rule CTR-foreground-001. |
| INV-16-FORBIDDEN-APIS | forbidden: headless:false, --headed/--ui, plain open, activate/bringToFront, CDP-attach, auto-open previews | check: | foreground:lint (existing — PARTIAL) | Lint does NOT flag `newPage`/`createTarget` (deliberate — legitimate in self-launched headless); CDP-attach ban is contractual only. |
| INV-16-OPTIN | scripts default headless via HEADLESS!=='false'; open uses -g | check: | foreground:lint (existing) | Convention is lint-enforced. |
| INV-16-MANUAL-ONLY | headed entry points = manual/Director-requested only | human-review: | session context — explicit Director request must exist | Only a human can verify an opt-in was real. |
| INV-16-PLAN-STATE | plans/prompts with runtime verification MUST state headless/background | check: | plan:headless-declaration (proposed — post-v1) | Plan/prompt text lint feasible. |
| INV-16-MANUAL-STEP | visible-window needs → manual/Director step; agent asks | kernel: | "An agent never launches a foreground window on its own initiative — it asks." | Kernel. |
| INV-16-FAILURE | foreground window = task failed; log .mw/bugs/ + flag | kernel: | "A task that opens a foreground window is **failed**, not complete: log it in `.mw/bugs/` and flag the Coordinator." | Kernel. |
| INV-16-DOUBT | in doubt choose headless + report unverified (T-04) | human-review: | report honesty review | T-04-adjacent. |

### `.windsurf/rules/17-resource-lifecycle.md` (model_decision — 10)

| invariant ID | invariant (short) | disposition | proposed check name or kernel line | notes |
|---|---|---|---|---|
| INV-17-DECLARED-END | every spawned resource has declared end (scoped/leased/kept) | check: | closure:lint → resourceLifecycleGate → `mw-reap --gate` (existing — residue detection) | Gate detects unowned resources at closure; the "declared at creation" discipline is tool use (kernel residual). |
| INV-17-MWRUN | mw-run for commands that can hang/fork | kernel: | "Use for every command that can hang or fork children (probes, screenshots, builds)." | Tool discipline — kernel. |
| INV-17-LEASE | mw-run --lease for detached servers; never stack a second | kernel: | "run `mw-ps --port 5173` first, never stack a second." | Kernel. |
| INV-17-KEEP-PURPOSE | mw-keep fail-closed without --purpose | check: | mw-keep tool enforcement (existing — fail-closed in ~/.mw/bin) | Tool-enforced, not repo lint. |
| INV-17-MWPW | mw-pw for Playwright probes; never raw node -e chromium.launch | check: | lifecycle:no-raw-playwright (proposed — post-v1) | Lint on raw `chromium.launch` outside mw-pw wrappers; incident 2026-11-13 motivates. |
| INV-17-TMP | mw-tmp for temp dirs | kernel: | "`mw-tmp` for temp dirs (`mw-<project>-*` prefix, sweepable)." | Kernel. |
| INV-17-ADOPT | mw-adopt orphans as kept with purpose | kernel: | "`mw-adopt <pid|--port N> --purpose \"…\"` — adopt an orphan as kept." | Kernel. |
| INV-17-PS-DONE | mw-ps --mine before done; paste output | kernel: | "`mw-ps --mine` before declaring done: stop or adopt everything listed; paste output in the final message." | Gate covers residue; the paste-discipline is kernel. |
| INV-17-REAP-GATE | mw-reap --gate fails on unowned resources | check: | closure:lint → resourceLifecycleGate (existing) | Wired in closure:lint (verified in scripts/closureLint.ts). |
| INV-17-REAP-L3 | L3 orphan servers: report only, never killed — Director decides | kernel: | "L3 orphan servers in project cwd: **report only** — never killed. Only the Director decides which servers die." | Director-only decision — kernel. |

### `.windsurf/rules/45-director-intent-to-spec.md` (model_decision — 6)

| invariant ID | invariant (short) | disposition | proposed check name or kernel line | notes |
|---|---|---|---|---|
| INV-45-SSOT | contract lives in exactly one spec/workflow/trusted doc | human-review: | spec/doc review | Copy-detection not honestly mechanizable. |
| INV-45-CAPTURE | Director statements → Expected behavior blocks, Director's words | kernel: | "translate that into a `Comportamento atteso` / `Expected behavior` / `Visual contract` block in the relevant spec, using the Director's own words." | Kernel. |
| INV-45-ONE-PLACE | cross-component behavior: note each doc, canonical in most specific | human-review: | doc review | Placement judgment. |
| INV-45-TESTS | every Expected behavior → covered or new test, named by scenario | human-review: | test/spec review | Coverage mapping is judgment. |
| INV-45-ERRIDX | error registry = index w/ links, never contract store | human-review: | registry review | Content judgment. |
| INV-45-SAFEGUARD | build:check + closure:lint before turn complete | kernel: | "Run `npm run build:check` and `npm run closure:lint` before considering the turn complete." | Kernel (safeguards twin). |

### `.windsurf/rules/46-approved-references.md` (model_decision — 7)

| invariant ID | invariant (short) | disposition | proposed check name or kernel line | notes |
|---|---|---|---|---|
| INV-46-PRESERVE | Director-baptized artifacts = reference artifacts, preserved durably | kernel: | "…becomes a **reference artifact** and MUST be preserved durably." | The baptism-detection is conversational — kernel. |
| INV-46-DURABLE-LOC | refs/ dir, never only gen//test-results//tmp; copy don't move | kernel: | "Persist the artifact in a durable location — the spec's `refs/` directory, never only in `gen/`, `test-results/`, `/tmp`." | Kernel. |
| INV-46-NAMING | name ref-*/approved-* | check: | refs:artifact-naming (proposed — post-v1) | Filename lint in refs/ dirs. |
| INV-46-REGISTER | register in NOTES.md/plan w/ verbatim quote + path | kernel: | "Register it in the spec's notes … what was approved, when, verbatim quote of the Director's approval, and the artifact path." | Kernel. |
| INV-46-NO-OVERWRITE | never overwrite/delete a reference artifact | kernel: | "Never overwrite or delete a reference artifact. New iterations go in new files." | Git-history check feasible in theory; kernel for now. |
| INV-46-GENERATOR | save generator/recipe next to artifact | kernel: | "save the generator (or the recipe/parameters) next to the artifact." | Kernel. |
| INV-46-CHAT-SHOT | pasted reference screenshots → refs/ immediately | kernel: | "save it from the pasted-image temp path into `refs/` immediately — temp paths are not durable." | Kernel. |

### `.windsurf/rules/85-documentation-impact.md` (model_decision — 8)

| invariant ID | invariant (short) | disposition | proposed check name or kernel line | notes |
|---|---|---|---|---|
| INV-85-FIELD | every plan/exec task declares Documentation Impact | check: | docs:impact (existing — `--strict` for new plans) | Existing. |
| INV-85-NONE-MOTIV | NONE requires motivation line | check: | docs:impact (existing) | Existing. |
| INV-85-REQUIRED-TARGETS | REQUIRED lists doc targets before baptism | check: | docs:impact (existing) | Existing. |
| INV-85-ROUTING | change-type → doc-target routing table | kernel: | routing table: quest→QUEST_RULES.md, decision→DECISION_LOG.md, arch→architecture_state.md, plan→plans/INDEX.md, ecc. | Reference mapping — kernel. |
| INV-85-NODUP | never duplicate same rule in multiple canonical docs | human-review: | doc review | Semantic duplication. |
| INV-85-NONE-INCOMPLETE | NONE without motivation = incomplete plan | check: | docs:impact (existing) | Existing. |
| INV-85-MECH-EXEMPT | mechanical updates (links/banners) exempt | human-review: | judgment call on whether an update is "mechanical" | Exemption judgment. |
| INV-85-HARNESS | spec-harness documentation_impact field + diff gate | kernel: | "…`harness:dispatch` applica il gate post-esecuzione sul diff del worktree — un task REQUIRED senza i doc nel diff resta FAILED." | Harness paused (R-208) — kernel until reactivated. |

### `.windsurf/rules/mw-rpg-bridge.md` (model_decision — 3)

| invariant ID | invariant (short) | disposition | proposed check name or kernel line | notes |
|---|---|---|---|---|
| INV-MWBRIDGE-PATTERNS | explorer/planner/executor trigger patterns | kernel: | "…conditional verbs are **NOT** present (if 'dovrei', 'vorrei', 'dovrebbe', 'potremmo' are present, use explorer)." | Request-classification judgment — kernel. |
| INV-MWBRIDGE-ORDER | evaluation order executor→planner→explorer→default explorer | kernel: | "If no match, default to explorer (safer for personal project)." | Kernel. |
| INV-MWBRIDGE-SCOPE | MW skills only; RPG-skill requests defer to RPG system | kernel: | "This rule is for **Mind Weaver skills only**… defer to the RPG skill system instead of MW." | Kernel. |

---

## Declared GAPs (require explicit Director approval)

- **INV-00-CONFLICT-FLAG** — verbatim: *"If a request seems to conflict with
  them, follow the invariant and flag the conflict instead of silently breaking
  it."* A silent non-flag produces no artifact: no check can detect an omission
  in the agent's reasoning; a human reviewer sees only the compliant-looking
  output. Kernel line retained as exhortation. `gap_approval: pending`
- **INV-AGENTS-TENSION-FLAG** — verbatim: *"Se una proposta è in tensione con
  un pilastro, con una decisione registrata o con la desiderata FROZEN, **dillo
  prima di procedere, citando la riga.** Non aggirarla in silenzio, non
  risolverla da solo."* Same class: the violation is the *absence* of a flag.
  Partially mitigable by Director-side review, not agent-side verification.
  `gap_approval: pending`
- **INV-AGENTS-ADMIT-UNKNOWN** — verbatim: *"Se non sai, dillo. Non dedurre una
  direzione che non è scritta."* A confident but deduced direction is
  indistinguishable from a correct one in the artifact. `gap_approval: pending`
- **INV-AGENTS-DELTA-MID** — verbatim: *"…appenderlo SUBITO con
  `mw-delta.py append` — non aspettare la chiusura."* Timing obligation: the
  jsonl proves *that* an append happened, never *when*. A skipped mid-session
  append leaves no trace. `gap_approval: pending`

## Ambiguities needing Director ruling

1. **"lint advisory-vs-canonical" referenced but not found** (INV-AGENTS-ADVISORY-NONCANON, AGENTS.md:92): the line asserts a fail-closed lint exists; no such script is in `scripts/` or `package.json`. Options: (a) treat as aspirational → stays kernel; (b) Director mandates building it (post-v1 check `advisory:canonical-conflict`).
2. **`contracts:index-sync` / `trusted:check` real coverage** (INV-40-SSOT, INV-30-REGISTRY-*): matrix marks them "partial" — whether they verify "exactly one trusted doc" and registry metadata completeness must be confirmed in T-3 before any demotion license is derived.
3. **`prompt:check` (checkPromptLock) scope**: not mapped — it guards prompt-spec locking, and the spec pipeline is in pausa (R-208). Left unmapped rather than overclaimed.
4. **Kernel-candidate mechanizable-but-noisy rows** (INV-00-REUSE-DIR, INV-20-TIMERS→proposed, INV-16-PLAN-STATE→proposed): marked proposed-check where lint is feasible; Director may veto any proposed check — the row then falls back to kernel, no GAP.

## Sign-off

- [ ] Director approves matrix dispositions (OB-8)
- [ ] Director approves each `gap_approval: pending` → `approved:<ruling>` per GAP row
- [ ] Director rules on ambiguities 1–4

> **Gate reminder (§0b):** nessuna demozione (T-7) prima di questo sign-off.
> Sviluppo check (T-2/T-3) non subordinato alla firma.
