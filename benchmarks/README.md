# Replay benchmark — R-204 / PLAN-039

Measures whether dispatching tasks to cheap external executors beats doing the
work in the planning conversation. Same task, same base commit, three dispatch
approaches, repeated runs, isolated git worktrees.

## Matrix

Per case × approach × repeat (default 2 repeats → 18 runs):

| approach | prompt gets |
|---|---|
| `raw` | goal in prose only — the "dumb dispatch" baseline |
| `contract` | goal + explicit contract of done (seeded failing test must pass; test is untouchable) |
| `context` | contract + pre-gathered context pack: exact file paths, schema notes, conventions (work-solver style — no rediscovery) |

The contract test is seeded into the worktree for **all** approaches — it is
the scoring oracle — but `raw` prompts never mention it, simulating a dispatch
with no verification contract.

## Cases (v1)

| id | archetype | source | base |
|---|---|---|---|
| B1-i18n-icu | mechanical bugfix | real replay of R-193 (commit `1c8ed9e1`) | `8b28392e` |
| B2-metalayer-offers | additive config (schema-shaped) | authored spec, PLAN-030 style | `91880b0b` |
| B3-stash-item | additive config + i18n multi-file | authored spec, R-102 style | `91880b0b` |

## Metrics

Per run (`<resultsDir>/<runId>.json` + `results.jsonl`):

- `agentMs` — wall time inside the executor (excludes dep install/verify)
- `contractPass` — **the driver re-runs the contract test itself**; the agent's
  own claim is never trusted
- `touchedFiles`, `forbiddenViolations`, `goldenCoverage` (share of expected
  files actually touched)
- `patchFile` — full diff artifact for quality review

`report.md` aggregates by approach: pass rate, mean agent/total time, scope
adherence. Human review quality is judged on the saved patches afterward.

## Run

```bash
# smoke one run
npm run bench:replay -- --case B2-metalayer-offers --approach contract --repeats 1

# full overnight matrix under the shutdown guardian:
npm run bench:night            # registers a session, heartbeats, releases on exit
```

`bench:night` registers `bench-<ts>` in `~/.rpg-shutdown/session-registry.json`
(projectId `RpgBalancer`, ttl 1200s, heartbeat every 60s) and releases as
COMPLETED/FAILED — so the quiet-window shutdown can fire once the queue drains.

## Known constraints

- Sequential by design for v0 (one worktree at a time). Parallelism is inferred
  from timings, not exercised — a v1.1 can add `--max-parallel`.
- Model: `openai/gpt-oss-120b` on Groq (fallback cerebras/openrouter in the
  harness). Executor gets native tool definitions — see agentLoop.
- Each worktree pays a node_modules clone (~2 min on APFS) unless package
  files differ from HEAD, in which case `npm ci`.
- No UI/perceptual cases in v1 — T-04 requires a witness; visual replays need a
  headed/headless verification step that v0 doesn't implement.
