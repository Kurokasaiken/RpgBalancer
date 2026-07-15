# Executor Harness

Autonomous "cheap executor" for the RPG Balancer workflow.

Smart planners (Strategist / Coordinator) run inside Windsurf Cascade.
This harness lets a **cheap model (Groq, free tier)** execute small,
well-scoped prompts automatically, so you stop copy-pasting into agents.

## Model split

| Role | Model | Where |
|---|---|---|
| Strategist / Coordinator | smart (Cascade) | Windsurf |
| Executor | Groq (free) | this harness |
| Delicate/quality tasks | SWE-1.7 | Windsurf (manual) |

## Setup

1. Get a free API key at <https://console.groq.com>.
2. Add it to a `.env` file at the repo root (already gitignored):

   ```env
   GROQ_API_KEY=gsk_...
   ```

3. (Optional) Override defaults via env:

   ```env
   HARNESS_MODEL=llama-3.3-70b-versatile
   HARNESS_MAX_ITERATIONS=24
   HARNESS_TEMPERATURE=0.1
   ```

## Usage

Run a single prompt end-to-end:

```bash
npm run harness:run -- --file path/to/prompt.md --id IV-142
# or inline
npm run harness:run -- --text "Create scripts/tmp/hello.ts that exports greet()."
```

Flags:

- `--file <path>` prompt file (relative to repo root).
- `--text "..."` inline prompt.
- `--workspace <dir>` sandbox root for file ops (default: repo root).
- `--id <TASK_ID>` used for the evidence log filename.
- `--json` also print the full result object.

Evidence logs are written to `test-results/<id>-harness-<timestamp>.json`.

### Kanban-driven execution

```bash
npm run harness:run -- --prompt-id IV-142 --workspace scripts/tmp
```

This locks `FILE TARGET` files, updates the Kanban row to "In corso", runs the
executor, then runs the safeguard gate and updates the row to "Completato" or
"Assegnato" (on failure).

### Compact spec

```bash
npm run harness:run -- --spec prompts/IV-142.spec.json --workspace scripts/tmp
```

The spec is expanded to the full prompt template by `scripts/harness/specParser.ts`.
See `scripts/harness/spec.example.json` for the schema.

### Parallel dispatch

```bash
npm run harness:dispatch -- --dry-run
npm run harness:dispatch
npm run harness:dispatch -- --id-filter TEST-001 --max-parallel 1
npm run harness:dispatch -- --limit 2 --max-parallel 2
```

`dispatch.ts` reads the Kanban, groups ready tasks into dependency waves, and
dispatches each wave in parallel inside git worktrees. Use `--id-filter` to
run a single task or `--limit` to cap the batch size.

## Safety

- All file operations are sandboxed to the workspace root (no traversal).
- `run_command` only allows whitelisted commands (lint/test/build:check/kanban:lint/tsc).
- The executor is told to use placeholders + TODO instead of inventing systems.
- Kanban-driven runs lock file targets, update the Kanban row atomically, and run
  the safeguard gate before marking complete.

## Architecture

```text
config.ts            resolved config + .env loader + command whitelist
providers/types.ts   provider-agnostic chat/tool types
providers/groqAdapter.ts   OpenAI-compatible Groq client (native fetch + retry)
tools.ts             sandboxed read/write/edit/list/run + task_complete
agentLoop.ts         the agentic loop (system prompt = .windsurf/rules baseline)
runPrompt.ts         CLI entry (single prompt + Kanban + safeguard gate)
kanbanManager.ts     Kanban read/update with multi-table support
safeguardGate.ts     mandatory safeguard gate (build:check/lint/test/kanban:lint)
dispatch.ts          parallel wave dispatcher with git worktree isolation
specParser.ts        compact spec JSON -> full prompt expansion
```

## Roadmap

- ✅ Fase 1: core harness + Groq tool calling.
- ✅ Fase 2: lock + Kanban read/update + safeguard gate.
- ✅ Fase 3: git worktree per task + parallel waves.
- ✅ Fase 4: compact spec schema + parser.
- ✅ Fase 5: Strategist/Coordinator skill updates (short questions, research, auto-dispatch).
