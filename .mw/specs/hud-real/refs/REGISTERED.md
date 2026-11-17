# Registered reference artifacts (rule 46-approved-references)

## Cassetto (PLAN-116, ruling R-323 2026-11-10)

- `approved-cassetto-rich.png` — mockup Gemini scelto dal Director per il cassetto
  (fonte: `dev-public/mockups/plan113-comp/kit/cassetto-rich-0.png`). Il componente
  risorse vive NELLA fascia superiore interna della cornice.
- `approved-cassetto-column-fork-1440.png` / `fork-1280.png` / `closeup-1440.png` —
  baseline del visual fork `visual-fork-cassetto-colonna.md`, ruling verbatim:
  **«1 · Dentro la cornice»** — colonna 420px @1440×900, 400px @1280×800, targhette
  risorse nella fascia testata pulita, CONFIRM a proporzioni native.
- `gen-cassetto-column-frame_v2.py` — generatore della cornice estesa (tecnica
  provata nel fork): stretch solo nei campi neutri, ornamenti/gemma/placca intatti.
  Copia da `.mw/runs/20261110-cassetto-explore/column/frame_v2.py`.

## Victory/Reward popup (PLAN-047 fork, ruling R-348 2026-11-16)

- `approved-victory-pergamena-frame.png` — frame pergamena vuoto rigenerato da
  Gemini web (1024×745, zero scritte dipinte, anello→mount medaglione battezzato).
  Baseline battezzata, ruling verbatim: **«approvato, battezza»** (famiglia scelta:
  «B pergamena»). Fork card: `.mw/runs/20261116-r348-victory-ruling/visual-fork-victory-reward.md`.
- `approved-victory-reward-v5-witness.png` — witness headless del mockup
  approvato (`public/mockups/victory-reward/v5.html`, 1440×900, carico 5 crew +
  6 reward + echoes, zero overflow).
- `gen-victory-frame-gemini.mjs` + `gen-victory-frame-prompt.txt` — generatore:
  Gemini web via CDP :9222, image-editing della B ChatGPT senza scritte +30% alto.
  Lezione: rigenerazione AI del frame > patching raster (iterazioni V4 bocciate).
