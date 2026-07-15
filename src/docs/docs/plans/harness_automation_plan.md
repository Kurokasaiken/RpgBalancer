# Executor Harness Automation Plan

**Goal**: stop copy-pasting prompts into agents. Run small, well-scoped RPG Balancer tasks automatically with a cheap external model (Groq) while smart planning stays in Windsurf Cascade.

## Status

- ✅ Fase 1: Core harness + Groq adapter + sandboxed tool layer.
- ✅ Fase 2: Lock + Kanban read/update + automatic safeguard gate.
- ✅ Fase 3: Git worktree per task + parallel dependency waves.
- ✅ Fase 4: Compact spec schema + parser.
- ✅ Fase 5: Strategist/Coordinator skill updates (short questions, research, token-lean specs, auto-dispatch).
- ✅ Fase 6: README + GROQ_API_KEY instructions + smoke test.
- ✅ First real dispatch: `TEST-001` executed in an isolated git worktree, created `scripts/tmp/harness-dispatch-test.ts`, ran `npm run build:check`, and the Kanban row was updated to `Completato`.

## Files

- `scripts/harness/config.ts`
- `scripts/harness/providers/types.ts`
- `scripts/harness/providers/groqAdapter.ts`
- `scripts/harness/tools.ts`
- `scripts/harness/agentLoop.ts`
- `scripts/harness/runPrompt.ts`
- `scripts/harness/kanbanManager.ts`
- `scripts/harness/safeguardGate.ts`
- `scripts/harness/dispatch.ts`
- `scripts/harness/specParser.ts`
- `scripts/harness/spec.example.json`
- `scripts/harness/README.md`
- `tests/unit/harness/tools.test.ts`
- `tests/unit/harness/kanbanManager.test.ts`
- `.windsurf/skills/strategist-mandate/SKILL.md`
- `.windsurf/skills/coordinator-mandate/SKILL.md`
- `eslint.config.js` (un-ignored `scripts/harness/**`)
- `package.json` (added `harness:run` and `harness:dispatch`)

## Commands

```bash
npm run harness:run -- --file prompts/my-task.md --id MY-TASK
npm run harness:run -- --prompt-id MY-TASK
npm run harness:run -- --spec prompts/my-task.spec.json
npm run harness:dispatch -- --dry-run
npm run harness:dispatch
```

## Evidence

- Smoke test: `test-results/smoke-hello-4-harness-2026-07-14T09-51-18-319Z.json`
- Safeguards: lint (`--no-ignore scripts/harness`), build:check, test:unit, kanban:lint all passed.
