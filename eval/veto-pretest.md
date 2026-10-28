# P0-1 Veto-block pre-test — PLAN-090 Phase 0
Date: 2026-10-28 · Method: extraction + retrievability analysis (replay pending Director scheduling)

## Case
HUD /game work (R-290): Director vetoes were re-stated/re-litigated during the week despite being written down.

## Veto inventory (authoritative locations)
- `RICHIESTE.md` R-290: veto «nn foglie, nn oggettini / nn oro lucido» (2026-10-07); divieto viola (2026-10-20, poi derogato: «puoi testare anche il viola»); ruling secondo giro: «oggettini ammessi se d'impatto», «blu bocciato, meglio colore già in uso o del mockup», base = Mockup 1 GPT.
- `DESIGN_PILLARS.md` + skin base (2026-10-16); palette Rude Beauty / mood keys (2026-10-25, `context/research/2026-10-25-mood-keys/`).
- `src/docs/docs/design/hud_component_guide.md` (regole HUD: HudPlaque, token `--skin-hud-*`, min 12px, i18n).
- `context/recurring-traps.md` T-04 (claim visivi solo con testimone).

## Branch ruling: (a) — vetoes were retrievable
The vetoes existed in `RICHIESTE.md` (tagged entries) and design docs. They were NOT inside a ≤40-line surfaced block in the session read path; retrieval required opening R-290's 5000-line file. **Failure mode = surfacing gap, not distillation gap** (claude's hypothesis confirmed by retrievability check).
Consequence: fix = deterministic `mw-brief` surfacing (Task 4), NOT LLM distillation. Narrowed mw-dream loses its primary justification for this failure mode; its residual scope = durable preferences NOT yet captured anywhere (P0-3 case).

## Replay note
Full with/without replay not executed in this session (requires a live HUD task); the retrievability branch is determined by document analysis, replay scheduled for next HUD iteration (R-290 open decisions pending Director).

## VETO_BLOCK extraction (first instance of the Task-4 brief block)
See `context/auto/veto-block.md` — capped tagged block generated from the inventory above.
