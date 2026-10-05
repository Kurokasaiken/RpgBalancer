---
title: Land Breath — la terraferma di World Surface respira nella materia
status: active
created: 2026-09-08
desiderata: .mw/desiderata.md v21 FROZEN
---

# PLAN-014 — Land Breath (terraferma che pulsa via displacement Pixi)

## Spec

> Battezzato dopo 6 round di critica multi-AI web (chatgpt, claude, gemini, grok, deepseek).
> Evidenza: `.mw/runs/2026-09-08-land-breath/` (plan-draft v1→v7, critique-round2…6).
> Ratifiche G-0 del Director: a ✅ b ✅ c ✅ (2026-09-08).

### Desiderata FROZEN v21 (verbatim)

La terraferma di World Surface deve **pulsare lentamente e continuamente**: la materia dipinta (foreste, coste, terreno) ondeggia in place tramite **displacement field animato dentro Pixi** — si muove il campo, non i quad, quindi nessun bordo si scopre. Il displacement è **mascherato per bioma**: intensità differenziata per tipo di terreno. Il mare è escluso dallo scope. L'effetto è sempre attivo, a bassa frequenza, parametri in config (config-first), pausa fluida su drag/zoom, **profilazione Tauri obbligatoria** prima del rollout. I quad dei layer non subiscono mai trasformazioni geometriche (translate/tilt/scale vietati).

### G-0 — Ratifiche del Director (approvate 2026-09-08)

1. **"Mascherato per bioma" = compositing per bioma.** I layer sorgente sono già separati per contenuto; i gruppi riusano quei pixel. Il gruppo residuo si chiama **`terrain`**: copre la terraferma non coperta dai gruppi contenuto — è il "terreno" della desiderata. Report di copertura: ogni pixel land → un solo gruppo; somma coperture = land_mask; percentuale coste per gruppo dichiarata. Piano B (se mai revocata): maschera spaziale + shader custom, previa approvazione.
2. **Eccezioni a "sempre attivo"**: `prefers-reduced-motion` (feature gate pre-lifecycle: componente non montato) e pausa fluida su drag/zoom.
3. **"Non i quad"**: vieta trasformazioni del contenuto; la camera transform sul container mondo è condivisa identica DOM/Pixi e non è trasformazione di quad. La registrazione Pixi↔DOM è requisito verificato (test subpixel), non assunzione.

### Acceptance test percettivo (T-000b, pass/fail su schermo reale)

- A1 silhouette non trasla come oggetto rigido
- A2 coste deformate localmente
- A3 dettagli interni correlati ma non uniformi
- A4 percepibile a ~15–25s
- A5 nessun bordo/padding visibile a zoom min/med/max
- A6 POI marker fermi rispetto alla camera
- A7 mare immobile
- A8 a riposo (scale=0) indistinguibile dal DOM (pixel-diff entro tolleranza dichiarata)

A1–A5 sono giudizi estetici del Director documentati con video, non metriche automatiche.

### Contesto tecnico (verificato)

- `WorldSurfaceRenderer.tsx`: 21 layer `<img>` DOM, camera `position=-pan*zoom; scale=zoom`.
- Pixi v8: `WorldSurfacePixiOverlay.tsx` unica Application (`preference:'webgl'`, pixijs#10906) → estesa a stage condiviso; land sprites in container sotto l'object layer; filtri solo sugli sprite terra.
- Layer terra: Isole(2), Foreste(~8), Montagne(~4), Villaggio, Alberelli. Esclusi: Background, Mare, Frame, Bordo.
- Maschere land/sea/shallow da `scripts/build-terrain-masks.mjs`.
- Precedente negativo: displacement sul mare invisibile (`WorldSurfaceWaterField.tsx`, ~1% dettaglio post-blur 3px).
- Da rimuovere: `WorldBreathingLayer.tsx`, `useBreather.ts`, `BREATHING_CONFIG`, `BREATH_MAP`, wiring `breathEnabled` (analisi dipendenze in T-004).
- Safeguard: `npm run lint -- <scope>`, `npm run test -- <scope>`, `npm run build:check`, `npm run kanban:lint` + evidence in `test-results/`.

### Architettura

1. **`scripts/build-land-breath-assets.mjs`**: compositi per gruppo (`forests, mountains, settlement, islands, terrain`), estesi di `padPx = 2×maxAmplitudePx` **in px sorgente** (indipendente da renderScale) con edge-extend; `land_displacement.png` tileable PNG 8-bit, R=shiftX G=shiftY, 128=zero, `shift_px=(ch/255−0.5)×2×filter.scale`; **campo normalizzato**: `max|vettore| ≤ maxAmplitudePx`; `land_breath_manifest.json` (offset origine, layer→gruppo, padPx, report copertura); edge-reach check in uscita (nessun texel alpha=0 nel reach del filtro).
2. **Stage condiviso** (estensione di `WorldSurfacePixiOverlay`): uno sprite per gruppo, `DisplacementFilter` per sprite, stesso displacement tile con **transform diverso per sprite** (offset/rotazione decorrela i gruppi → A3). Lifecycle `idle→loading→warming→active→paused→failed→dom-fallback`; DOM nascosto solo dopo primo frame confermato; **fallback globale** su init/context fail; **fallback per-gruppo** solo se la scena ibrida passa acceptance check dedicato (layer DOM del gruppo fallito presente e z-order corretto), altrimenti globale. Pausa: ampiezza eased a 0 in `easingMs` (default 200) e offset congelato; resume dalla fase del tempo continuo.
3. **`landBreathConfig`** (Zod): `enabled` (riusa `breathEnabled`), `maxAmplitudePx` (default 4), `padPx` (vincolo `= 2×maxAmplitudePx`, coerente col manifest), `breathPeriodSeconds` (18), `scrollSpeedPxPerSec`, `biomeWeights` (forests 1.0, islands 0.5, terrain 0.3, mountains 0.2, settlement 0.15 — default da tarare), `noiseParams{seed,octaves,frequency,tilePx,perGroupTransform}`, `easingMs`, `renderScale` (1.0).

### Decisioni aperte

1. Variante animazione (i solo scroll / ii solo scale / iii combinato) — T-000b su A1–A8.
2. Parametri finali — tuning col Director post-spike.
3. `renderScale` — T-004 su soglie pre-dichiarate.
4. Verifica percettiva solo su browser reale/Tauri (`document.hidden` blocca rAF).

## Tasks

- [x] **G-0** — Ratifiche Director: ✅ approvate 2026-09-08.
- [x] **T-000a — Pre-check numerico** (zero Pixi): report `test-results/land-breath-pre-check-2026-09-08.log`. Tutti i biomi 70–100% residual range post-blur 3px (molto superiore al mare ~1%).
- [~] **T-000b — Spike semantico bloccante**: assets e pagina HTML di spike pronti (`scripts/build-land-breath-spike-assets.mjs`, `public/land-breath-spike.html`). Tre varianti indipendenti (scroll / scale / combine), padding 64px edge-extend, pesi per bioma, sea statico. Pagina servita su http://127.0.0.1:5173/land-breath-spike.html. **In attesa del verdetto visivo del Director.** I gate preliminari G-COVERAGE..G-CORRELATION sono dimostrabili dalla pagina; G-PERF strumenterà in T-004.
  - **G-COVERAGE**: partizione disgiunta + ricomposizione pixel-equivalente alla scena DOM;
  - **G-DISPLACEMENT**: misura empirica filter.scale → px su X/Y e ai limiti (texel 128/128 → zero);
  - **G-EDGE**: test dinamico bordi a maxAmp × zoom min/med/max, diagonale inclusa;
  - **G-CORRELATION**: offset per-gruppo → movimento non uniforme (A3), non copie traslate;
  - **G-PERF preliminare**: baseline PerfHud registrata.
  Verdetto = A1–A8 + gate. Evidence + variante scelta. **T-001+ congelati finché il Director approva l'evidence.**
- [ ] **T-001 — Pipeline asset definitiva**: `build-land-breath-assets.mjs` allineato alla variante scelta (risoluzione/formati decisi dallo spike).
- [ ] **T-002 — Stage condiviso + LandBreath**: refactor minimo PixiOverlay → stage; caricamento, warming, swap, lifecycle, fallback, camera sync; test pixel-diff a riposo vs DOM.
- [ ] **T-003 — Config + integrazione**: `landBreathConfig` Zod, `breathEnabled`/`isInteracting`, reduced-motion gate.
- [ ] **T-004 — Profilazione + cleanup pre-merge**: soglie di accettazione dichiarate PRIMA della baseline (fps/frame-time/texture-memory); Tauri, zoom intermedi, context-loss, WebGL-off; rimozione legacy con analisi dipendenze + update `WorldSurfaceRenderer`; safeguard; evidence; rollback = revert.
