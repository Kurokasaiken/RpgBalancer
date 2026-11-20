---
trigger: always_on
description: Context-budget and subagent delegation policy — when work must leave the main session's context window and how results come back.
---

# Context Budget & Delegation (ALWAYS ON)

> **REVOCA — Director ruling D-228 (2026-11-20): MAI usare
> `run_subagent`/subagent.** La quota settimanale ACU si è esaurita: ogni run
> di subagent brucia quota anche su modello depinnato. Sostituti approvati:
> lavoro inline con output compresso (`| tail`, grep mirato, overflow file),
> shell in background (`shell_id`) per i run lunghi, script di verify che
> stampano un verdetto compatto. Le sezioni "Delegate, don't hoard" e
> "Subagent contract" qui sotto restano SOLO come storico — non applicarle
> fino a nuovo ruling del Director.
>
> **Un solo implementer — Director ruling (2026-11-20):** TUTTA
> l'implementazione è fatta dal singolo agente della sessione corrente —
> niente implementer/executor paralleli. Gli agenti esterni MW restano
> consultivi (testo in/out), mai autori di codice nel repo.
>
> **Sostituto multi-AI — Director ruling D-229 (2026-11-20):** per tutto il
> lavoro "multi" (seconde opinioni, dibattiti avversari, ricerca su modello
> esterno, task paralleli a provider) usare lo **stack mind-weaver**
> (`/Users/faustoboni/progetti_personali/mind-weaver`):
> `scripts/mw-ask.py --provider <p> --model <m>` (API key del Director —
> groq, gemini, openrouter, codex), `mw-web-debate` (login web),
> `mw-orchestrate.py`. **Zero ACU Devin** — verificato in sessione; restano
> solo i rate-limit/quota dei singoli provider. I provider esterni sono
> stateless: il contesto va iniettato nel prompt (l'agente raccoglie i file
> rilevanti e li incolla).

The main session's context window is a scarce resource. This rule defines how
work is kept out of it.

## Session lifecycle

- Devin **compacts context automatically** when it fills. Do NOT rotate
  sessions or open new windows to "save context" — compact and continue.
- The `mw-context-budget` UserPromptSubmit hook injects budget notices:
  - **WARN (>=70%)**: declare the remaining budget to the Director; no new
    multi-file tasks — only small fixes, questions, docs. Prefer delegation.
  - **CRIT (>=85%)**: finish the current step only, write the exact resume
    point into the task's handoff/ledger, and propose a new thread.
- After compaction, governance reads may be dropped — the global
  `PostCompaction` hook (`devin-context-hooks.py`) re-injects the canonical
  docs it finds in the project. Follow it before continuing.

## Delegate, don't hoard

Spawn a subagent (`run_subagent`) instead of working inline when the task is:

| Work type | Profile | Why |
|---|---|---|
| Research, "how does X work", audits, pre-plan exploration | `rpg-researcher` (or `subagent_explore`) — read-only, RPG-aware | Raw grep/read output never enters the main window |
| Safeguard sweeps: lint, tests, build:check, closure:lint, probes | `rpg-verifier` — knows RPG timeouts/commands | Long command output stays out of context |
| Small fully-specified edits, mechanical refactors | `rpg-implementer` (write-capable, invariants in prompt) | Cheap; spec must be exact |
| Parallel independent subtasks | any profile, `is_background: true` | Parent keeps working |
| Implementation needing design judgment | main session, or `subagent_general` explicitly | Custom profiles run on `swe-1-6-fast` |

- `rpg-researcher` / `rpg-verifier` / `rpg-implementer` are project profiles in
  `.devin/agents/`, pinned to `swe-1-6-fast` so they never bill the parent's
  model. Generic global twins (`researcher`/`verifier`/`implementer` in
  `~/.config/devin/agents/`) exist as fallback for non-RPG work.
- `subagent_general` inherits the parent's model — use it only when the work
  genuinely needs the primary model's strength.
- This delegation is a Director-approved standing request — it does not need
  per-task permission.

## Subagent contract

- Front-load everything: subagents do NOT see the conversation. Give them
  file paths, canonical doc names, the exact deliverable, and the report
  format you need back.
- Prefer foreground when the answer blocks the next step; background for
  parallel breadth (background subagents cannot ask for new permissions).
- The parent distills the result for the Director — never relay raw output.
- Do NOT delegate a trivial single-file lookup or a one-command check —
  delegation has its own cost.
- A subagent report is not a witness (trap T-04): claims about scenes,
  animations or UI still need runtime verification before they are "done".
