---
title: 'World Surface Sea Marks — quiet painted sea motion'
status: active
created: 2026-09-08
reviewed: 2026-09-08
---

## AI Consensus

The plan was submitted to the five requested web providers with the FROZEN desiderata v19 at the top of the prompt.

| Provider | Verdict | Note |
|---|---|---|
| ChatGPT | APPROVED | Clip sea marks strictly to `sea_mask` bounds; track perceptual threshold for "leggermente vivo" in lab evidence. |
| Claude | APPROVED | Track compositor layer count in T6 evidence; 20–40 `translate3d()` marks may pressure low-VRAM WebView. |
| DeepSeek | APPROVED | Lab must render at least two side-by-side `WorldSurfaceRenderer` panels to stay comparative. |
| Gemini | No verdict | Web adapter did not deliver the prompt text into the chat; Gemini kept asking for the prompt. |
| Grok | No verdict | Rate limit exhausted (10 h 36 m remaining). |

The three available providers approved the plan. Gemini and Grok could not be reached due to tooling/rate issues; the consensus among the responsive AIs is to proceed.

## Spec

### Goal

Rendere il mare della mappa World Surface leggermente vivo a zoom mappa (~0.33) senza muovere, filtrare o deformare il layer baked `Mare.webp`.

### In Scope

- `WorldSurfaceSeaMarks.tsx` — componente DOM overlay sopra `Mare.webp` e sotto nuvole/ombre.
- Kit di 20–40 pennellate dipinte trasparenti in 2–4 famiglie (onda, schiuma, piccolo arco, tratto lungo), con 2–3 varianti ciascuna.
- Deterministic placement usando `points.json` campionati e `sea_mask.webp`.
- Animazione CSS `@keyframes` o SMIL: cross-fade opacità tra 2–3 varianti + drift microscopico 1–4 world px.
- Anima solo `opacity` e `transform: translate3d()` per composizione GPU; nessun layout-triggering property.
- Config-first Zod in `atmosphereAssets.seaMarks` (o equivalente) e preset in `skinConfigRegistry`.
- `prefers-reduced-motion` disabilita tutto.
- `SeaEffectLab` aggiornato con tile statico / coste / coste+aperto.
- Profilazione Tauri su hardware modesto con evidence log.
- Fallback: se le mark aperte non sono visibili, rimuoverle e tenere solo coste/foam/nuvole.

### NOT In Scope

- Movimento/parallasse/trasformazione di `Mare.webp` o altri layer full-canvas 4240×2828.
- WebGL/Pixi/DisplacementFilter per il mare (separato dal cantiere terraferma v21).
- `requestAnimationFrame` per l'animazione principale.
- FFT/Gerstner/3D/simulazione.
- Full-canvas colour-breathing, soft-light, o radial-gradient overlay sull'intero mare.
- Tiling/scrolling texture generica sul mare aperto.
- Nuovo sistema di particelle/luce.
- Modifiche a `WorldSurfaceWaves` esistente oltre a possibile riuso asset.

### Tasks

1. **T1 — Contratto di misura** — scrivere `sea_motion_measurement_contract.md` con metodo 100 ms + `sea_mask` e target minimo accettabile.
2. **T2 — Art kit** — produrre `sea-marks.webp` (atlas o sprite separati) e `sea-marks.json` di placement; riusare `onda1/onda2/ondine1/schiuma1` come baseline.
3. **T3 — Componente `WorldSurfaceSeaMarks`** — DOM overlay, CSS keyframes/SMIL, `prefers-reduced-motion`, i18n, Zod config.
4. **T4 — Lab A/B** — aggiungere tile statico/coste/coste+aperto in `SeaEffectLabPage`.
5. **T5 — Tuning percettivo** — regolare count, opacità, durata, drift, distribuzione in skin config.
6. **T6 — Profilazione Tauri** — generare `test-results/r066-sea-motion-<data>.log`.
7. **T7 — Director gate** — decisione registrata in `context/DECISION_LOG.md`.
8. **T8 — Safeguards** — lint, test, build:check, kanban:lint.

### Acceptance

- `Mare.webp` non riceve transform/scale/rotate/parallax.
- Il mare si percepisce "leggermente vivo" a zoom 0.33 in review cieca.
- `prefers-reduced-motion` ferma tutte le animazioni.
- Build, lint, build:check, kanban:lint passano.
- Evidence log Tauri dimostra nessuna regressione frame-time su hardware modesto.
