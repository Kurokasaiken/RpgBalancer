# Research bundle — 2026-10-22 — "animatable" quest-scene prompting

R-267 pipeline: broadcast solicitation → 4 provider meta-prompts → synthesized
final prompt → Deep Research results pasted by the Director.

All files are **verbatim captures** — do not edit content; provenance lives here.

## Files

| File | What | Source |
|---|---|---|
| `solicitation-prompt.md` | The brief sent to all web providers ("write me a Deep Research prompt") | `/tmp/mw-dr-solicitation.txt`, sent via `mw-web-turn.py` run `20261022-deep-research-metaprompt` |
| `solicitation-responses-raw.txt` | Raw page-dump extraction (page chrome included) for claude + grok + deepseek | `devin-overflows` shell dump |
| `response-claude.md` | Claude's meta-prompt (verbatim response text) | chat.claude.ai via mw-web-turn |
| `response-gemini.md` | Gemini's meta-prompt (verbatim response text) | gemini.google.com via mw-web-turn |
| `response-grok.md` | Grok's meta-prompt (verbatim response text) | grok.com via mw-web-turn |
| `response-deepseek-solicitation.md` | DeepSeek's meta-prompt (verbatim response text) | chat.deepseek.com via mw-web-turn |
| `final-deep-research-prompt.md` | Synthesized final prompt delivered to the Director (best parts of the 4) | agent synthesis, also in `mind-weaver/.mw/runs/20261022-deep-research-metaprompt/` |
| `deepseek-deep-research-report.md` | **DeepSeek Deep Research report — full verbatim paste from the Director** (includes reasoning trace + source links at top, report body below) | pasted by Director 2026-10-22 |
| `grok-deep-research-report.md` | **Grok Deep Research report — full verbatim paste** («ricerca approfondita», 17s, 91 sources) | pasted by Director 2026-10-22 |
| `claude-deep-research-report.md` | **Claude research report — full verbatim paste** (in Italian, ~15 web searches, tagged [V]/[P]/[A]/[H], includes A/B validation protocol §8) | pasted by Director 2026-10-22 |
| `gemini-deep-research-report.md` | **Gemini Deep Research report — full verbatim paste** (technical, CFG/negation math, canvas % reservation spec, per-generator clause library, FX anchor coordinate/size budgets) | pasted by Director 2026-10-22 |
| `chatgpt-deep-research-report.md` | **ChatGPT Deep Research report — full verbatim paste** (5-tier evidence labels, aspect-ratio mismatch flagged: 3168×1320 = 2.4:1 ≠ 21:9; per-generator operating rules with per-source links; image-review scorecard 0–20 + ablation protocol §10) | pasted by Director 2026-10-22 |

## Providers

- Responded to solicitation: claude, gemini, grok, deepseek.
- ChatGPT: dead that day — web free-tier «Impossibile caricare questa
  risposta» + codex usage limit until 2026-11-17. No GPT output exists.

## Status

- Deep Research results received: **deepseek**, **grok**, **claude**, **gemini**,
  **chatgpt** (all five, this folder). Set complete.
- `synthesis.md`: convergent synthesis with per-claim evidence labels.
- PLAN-052 v2 drafted from the synthesis, then refined by the multi-AI web
  planner debate `mind-weaver/.mw/runs/20261022-plan052-v2-planner/` —
  7 rounds, **unanimous ACCEPT** on artifact-r007
  (`9b574c68e66794d9f4d0208ac8021d30b4f0506444e793e48f6f8f378e8301d5`),
  converged 2026-10-22. The adopted text lives in
  `plans/PLAN-052-quest-scene-depth-staging.md` (draft, not baptized:
  T-007 raster ratification + v33/v34 intent review).
- Debate headline fixes: calm zones bound per-overlay to the real
  `questAtmosphereFx` registry (fog covers the lower half — the original
  10–15% band was wrong); canonical raster resolved to 2.4:1/3168×1320;
  occluder = heuristic + behavioral bake verdicts; ablation = honest pilot
  (no promotion from N≤8).
