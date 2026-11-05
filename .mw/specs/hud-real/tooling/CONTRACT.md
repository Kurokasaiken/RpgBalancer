# R-311 — Tooling a zero generazioni (PLAN-110 §13, precondizioni E-02/E-03)

Zero Gemini generations spent. All local.

## Deliverables
1. `scripts/hud-real/compile-prompt.py` — compiles a single-line G-3 prompt from `zone.yaml` + `defects.json`; checks: "Generate an image:" prefix, material vocabulary verbatim, banned words (text/letters/leaves/purple/brown/watermark), image roles (1=design preserve, 2=geometry guide, 3=material ref).
2. `scripts/hud-real/hud-gen-gate.py` — G-5 auto gate. Tiers: **Tier-A auto-reject** (counts, purple, glyph clusters, non-flat navy bg); **Tier-B drift alarms** (edge-SSIM, mask IoU, MAD, symmetry, repeat-var, Laplacian). Thresholds loaded from `gate-calibration.json`.
3. Calibration (E-03): 1 known-positive (upscaled source crop via S1) + 2 known-negatives (pure-vector redraw `tools/hud-real/proto/row.svg` render, bad restoration from `.mw/specs/hud-real/C1/`). Gate must ACCEPT positive and REJECT both negatives → `gate-calibration.json` frozen.
4. `scripts/hud-real/quota-runner.mjs` — `quota.json` per-window counter (probe 8 + first-pass 12 + repair 12 + slack 8 ≤ 40); per-zone repair cap; all-or-nothing component boundary; `runs.jsonl` log (prompt hash + zone + variant + model fingerprint) → resume next window; on limit banner → PAUSE + report "inconclusive".
5. `/hud-defects` page — per-defect side-by-side (numbered mockup | result), verdict buttons (corretto/non corretto/peggiorato) → writes `defects.json` verdicts.
6. `zone.yaml` + `defects.json` schemas for the pilot (1 roster row, 3 zones: ring, plaque+tip, band joint) — incl. `preserve`/`repair` regions per E-01 and `stages_required` auto-proposal.

## Acceptance
- `hud-gen-gate.py` accepts positive, rejects 2 negatives (calibration log).
- `compile-prompt.py` emits valid single-line prompts; rejects banned vocab.
- `quota-runner` dry-run: refuses beyond 40/window; resume reconstructs state from runs.jsonl.
- `/hud-defects` renders a defects.json round-trip headless (screenshot).
- lint + build:check green on touched scope.
