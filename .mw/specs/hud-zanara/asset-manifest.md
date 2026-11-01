# HUD Zanara — asset-manifest (PLAN-107, T-002)

Per-slot: cosa è CSS/token vs raster candidato (verdetto dopo spike T-102a/b), modalità ornamento, animazioni.

| Slot | CSS/token | Raster candidato | Ornamento | Animazione |
|---|---|---|---|---|
| brand | placca placca+token | emblem (riuso boot), astrolabio se non vettorizzabile | persistente | — |
| resources | placca smalto, barra, testo | gem-inlay icone risorsa, gold-engraved-border | persistente | shimmer gemme (CSS) |
| roster | placca nome, barra HP, selezione | hero-medallion, ritratti (già raster), gem-inlay stati | persistente | pulse gemma stato (CSS) |
| panel | gerarchia editoriale, testo | alabaster-frame (9-slice), alabaster-inner, illustrazione (art quest esistente) | persistente | — |
| nav | plinth smalto, tab incise | nav-ornament centrale, gem-inlay icone | persistente | rotazione lenta astrolabio (CSS/shader) |
| cornerBL | testo coords | compass-rose (rosa + ago separati) | persistente wired | ago bussola (transform) |
| cornerBR | — | corner-roundels incisi | persistente | hover/press (CSS) |
| seal | testo % | victory-seal + gemma | persistente wired | shimmer gemma |

## Regole di applicazione

1. **CSS-first**: ogni riga "raster candidato" si conferma solo se lo spike fallisce la riproduzione CSS fedele.
2. **Qualità materica** (Director): cornice/superficie/inserti valutati separatamente; nitidezza e material separation sono criteri bloccanti.
3. **Scaling**: cornici 9-slice; medaglioni/sigilli a dimensione di produzione; parti animate come layer separati.
4. **Condivisione**: gem-inlay, gold-engraved-border, enamel-microtexture sono asset CONDIVISI tra slot — un solo set nel pack.

## Texture-memory budget — PROPOSTA PROVVISORIA (si congela post-spike)

- Totale raster UI nuova: **≤ 2 MB** (decoded), ≤ 512 KB per famiglia componente.
- Texture singole: cornici ≤ 1024px lato lungo, medaglioni ≤ 256px, gemme ≤ 64px.
- Riferimento: il pack mappa pesa ~98MB ma è world-surface — la HUD è un ordine di grandezza sotto.
- Metrica di verifica: `performance.memory`/atlas stats nel runtime + peso file su disco.

## Animazioni — mode candidate per spike

| Candidato | Costo | Note |
|---|---|---|
| CSS transform/opacity | ~0 | ago bussola, shimmer gemme, pulse stati |
| CSS mask/gradient animato | basso | shimmer smalto/oro |
| Shader Pixi leggero | medio | astrolabio nav, shimmer sigillo |
| Sprite-sheet raster | alto | SOLO se indispensabile (dedicated budget) |

## Emblem legibility check (T-002, esito)

Logo boot `src/assets/ui/idleVillage/wanderlust-logo.png` (1100×274, alpha) = placca "WANDERLUST TRIUMPH" con medaglione-sole + pendente gemme. Emblema separabile pulito (crop x480 y50 150×224): a **64px legge perfettamente** (sole, raggi, gemme distinguibili); a 40px ancora leggibile. Esito: **PASS** — niente nuovo asset emblema, riuso del logo boot con crop dedicato. Varianti produzione proposte: 128/64/40px.
Proof: `public/mockups/hud-lab/attach/emblem-crop.png`, `emblem-64.png`, `emblem-40.png`.
