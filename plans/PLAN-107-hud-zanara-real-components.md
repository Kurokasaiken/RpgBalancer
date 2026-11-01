# PLAN-107 — HUD Zanara: dai mockup ai componenti reali su /game — HUD Zanara → componenti reali /game

**Status:** converged — dibattito mw-web-debate `20261101-hud-zanara-real-components` (run dir in mind-weaver/.mw/runs/), artifact-r004 ACCEPT 3/3 (chatgpt, claude, deepseek; grok+gemini provider_dead), sha256 `e68872f8afd9acc210b98799700bb78f75318329be72977c231edd0ecdb2c699`.
**Parent:** R-290, R-303. **Fork surface:** `/hud-lab`.
Cronologia: v1 draft → T-003 critiche convergenti → T-004..T-006 tre round di OBJECT chirurgici → r004.

## Director rulings (fixed, seq 21)
- D-1: emblem ONLY in game HUD (reuse authored boot logo asset); word plaque stays title/boot.
- D-2 + D-3: cornerBL compass+coords AND victory seal BOTH stay. T-002 declares the INTENDED presentation mode per ornament, independent of whether its consumer exists today (e.g. "cornerBL = persistent real-coords readout", "seal = persistent victory-legacy readout"). Persistent inclusion at T-203/T-301 is gated on VERIFIED wiring; if wiring is not verified, the element renders floating/on-demand and is excluded from the fixed budget. Every persistently-rendered element counts toward the 18% budget regardless of binding. No dead chrome.
- D-4: zanara = SELECTABLE preset next to `base` (base stays default).
- D-5: per-slot baseline mix allowed, sha256-registered.
- D-6: react-vN iterations registered in /hud-lab manifest.
- Metrics: HUD≤18% = perceived surface of fixed chrome; T-102 pass = Director eye-check + numeric proxy (edge/contrast diff) as support.

## Hierarchy
L0 tokens/assets → L1 HudPlaque/medallion → L2 components → L3 composition. Slots: brand(emblem)+time, resources, roster, panel family (10), nav, cornerBL, cornerBR, seal.

## Fase 0 — freeze referenze (nessun codice)
- T-001: ruling per-slot su /hud-lab; sha256 per crop scelto. (fork gate)
- T-002: per slot con ruling → asset manifest (cosa è CSS/token vs raster) + PROVISIONAL texture-memory budget proposal (frozen later, after spikes) + ornament presentation modes (wired/persistent vs floating) + emblem legibility check at HUD scale + one-paragraph "why this mix reads coherent" in design-intent.
- T-002 MATERIAL QUALITY CRITERIA (Director amendment): per ogni superficie si distinguono tre layer — cornice (metallo: microtexture, micro-incisioni, bevel, riflessi controllati), superficie interna (gradienti naturali, profondità cromatica, finitura), inserti (gemme, vetro, smalto, dettagli indipendenti). Criteri di accettazione: nitidezza (no sfocatura/pixel visibili), frequenza del dettaglio (microtexture raffinata, non rumore), profondità cromatica (gradienti e variazioni naturali), material separation (oro/smalto/alabastro distinguibili anche senza decorazioni). Risoluzioni definitive NON fissate a priori: derivate dagli spike e dalle dimensioni reali a schermo.
- ANIMATED ORNAMENTS (Director amendment 2026-11-01): gli ornamenti funzionali (rosa dei venti/bussola, sigillo, gemme) ricevono piccole animazioni — non asset animati pesanti: mode decisa dagli spike (preferenza: transform/mask CSS o shader Pixi leggero; sprite-sheet/raster-frame solo se necessario e dentro il texture budget). Ogni animazione rispetta prefers-reduced-motion e il perf budget.
- ASSET QUALITY RULE (Director amendment): ogni asset principale richiede riferimento visivo approvato + dimensioni di produzione + modalità di scaling (9-slice dove appropriato, niente stretching delle decorazioni, varianti per dimensioni reali) + verifica qualità a runtime (alpha reale, nessuna compressione che rovini gradienti/microtexture, texture comuni condivise).

## Fase 1 — spike prima, contratti dopo (ORDINE FISSO)
- T-102a: medallion spike (roster) — CSS vs raster decision, measured memory cost.
- T-102b: alabaster panel-frame spike — same decision on the second non-CSS-able surface. Tests BOTH the frame AND its inner surface (gradienti/finitura): a beautiful frame with a flat interior is a FAILED spike.
- SPIKE FAILURE PATH (bounded): on a failed verdict, work stops; return to T-001/T-002 for a revised reference (new mockup generation ONLY under the design-intent/asset-identity/prompt/provenance canon gate); re-run ONLY the failed spike; max TWO revision rounds total; after that the Director decides rescope (e.g. CSS-only look for that surface) or park PLAN-107.
- T-101 (freeze, AFTER spike verdicts): preset `zanara` in skinConfigRegistry + --skin-hud-* audit + token migration note (dead tokens) + new families allowed under Zod + dual-preset parity spec (every migrated component renders under BOTH base and zanara; no hardcoded color leaks) + explicit base rollback test + FROZEN texture-memory budget (per-component + total, built on measured spike costs — the T-002 proposal is only provisional input).
- T-101b: 18% measurement METHOD defined with TWO figures, both computed (Director amendment): (1) DOM bounding box of fixed chrome — conservative measure; (2) perceived-surface overlay — union of actually-occupied pixels including ornaments, astrolabes, gems, shadows, external decoration; overlapping elements counted once (surface union, no double counting). Denominator = the actually-available game viewport at canon sizes 1280/1440/1920/3440 + 390x844 mobile-fit. Every persistently-visible element counts. Run once in Fase 1, re-run gates each Fase-2 closure and T-301.
- T-103: ONLY the HudPlaque variants the spikes prove needed (no speculative variants).

## Fase 2 — componenti in ordine di rischio/valore
- T-202 resources (least risky, near-final baseline, validates plaque bevel) →
- T-204 roster: two-state component — CLOSED = vertical medallion column per zanara-v3 mockup (mini state) with an expand control to open the full production roster panel reskinned Zanara; OPEN = production roster structure (LV shields, name, portrait, HP/mana bars, dimmed states) in the Zanara material language. + explicit state→gem CONFIG MAP against real resident states (village/quest/injured/dead/resting — not the mockup's 3; regression test on the map) →
- T-201 nav + T-203 corners (cornerBR roundels; cornerBL = real-coords readout per T-002 mode; seal consumer wiring per T-002 mode) →
- T-205 quest-expedition-detail (panel recipe capofila: frame + tokens + editorial hierarchy; per-panel layouts stay) →
- T-206a registry+merchant+stash ("table" family) →
- T-206b hero-sheet+event-ledger+memorial+reliquary+settings+load-game ("editorial" family) — separate eye-checks.

## Fase 3 — composizione/chiusura
- T-301: composition /game + continuous 18%-budget check (folds old T-207 as checklist: tooltip/toast/popup coherence only, no new modals) + verify ornament bindings landed per T-002 modes.
- T-302: deterministic baselines per migrated component for BOTH base and zanara at EVERY canon viewport (incl. 390x844 mobile-fit) (Director amendment): animations and dynamic values controlled so diffs catch real regressions, not noise.
- T-303: perf (gamePerfBudgets non degradato) + a11y (Director amendment: contrast testo/sfondi, focus visibile, navigazione da tastiera, aree cliccabili adeguate, etichette accessibili per le icone, supporto prefers-reduced-motion; 12px = limite minimo assoluto solo per elementi secondari, non la dimensione consigliata) + i18n complete.

## Contratto di chiusura
- OB-1 `npm run lint -- src/pages src/ui src/skins src/balancing` verde.
- OB-2 `npm run build:check` verde.
- OB-3 regression tests per componente toccato + dual-preset parity spec.
- OB-4 human-eye Director side-by-side baseline /hud-lab vs implementazione su /game a OGNI viewport canonico: 1280/1440/1920/3440 + 390x844 mobile-fit.
- OB-5 `npm run closure:lint` verde.
- Eccezione: Fase 1 spikes — verdict = Director eye-check + numeric proxy; obbligazione human-eye compensativa.

## Guidance Director (GO 2026-11-01)
- No more full-screen mockups: references frozen in Fase 0, art direction not reopened.
- Replicable quality over per-component perfection: establish the quality level once, then progressive refinement across later phases.
- The goal is a material-quality component SYSTEM — not a green-gold reskin of today's HUD.

## Residual watch-items
- Emblem legibility at HUD scale (checked T-002).
- Ornament functional bindings (hard sub-requirement T-203/T-301).

## Ruling registrati (T-001 — Director 2026-11-01)

| Slot | Iterazione scelta | sha256 crop (16) | Note |
|---|---|---|---|
| brand | board-palette | 275bd04bde4caa1c | → emblem only per D-1 |
| resources | zanara-v3 | 7181c2ba22a49f06 | |
| roster | zanara-v3 | acb1b625e1463578 | **closed = colonna medaglioni del mockup + pulsante espansione**; open = roster di produzione reskinned |
| panel | zanara-v3 (alt ref: board-palette a96be5fd) | 8e641e83d79c1475 | |
| nav | — nessun ruling ancora | — | default provvisorio: zanara-v1 24b8bd98 |
| cornerBL | zanara-v1 | 8ab9ba9b9fbd50be | OPEN: doppia rosa dei venti con brand/nav? → serve nuova idea |
| cornerBR | board-breakdown | b8b6e98f78d69f0b | |
| seal | mockup1-classic | 7f57428788e6bd4e | unica fonte con sigillo → wired legacy (D-3) |
