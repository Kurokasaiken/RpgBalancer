---
id: pixi-world-map
kind: component
role: ui-component
tier: 1
root_file: src/ui/idleVillage/pixiSpike/PixiWorldMap.tsx
scope_files:
  - src/ui/idleVillage/config/atmosphereAssets.ts
  - src/ui/idleVillage/config/generatedClouds.ts
  - src/ui/idleVillage/config/mappa2AmbientDirectorConfig.ts
  - src/ui/idleVillage/config/mappa2FaunaConfig.ts
  - src/ui/idleVillage/config/seaMarksConfig.ts
  - src/ui/idleVillage/config/seaWonders.ts
  - src/ui/idleVillage/hooks/useWorldSurface.ts
  - src/ui/idleVillage/pixiSpike/PixiWorldMap.tsx
  - src/ui/idleVillage/pixiSpike/ambient/ambientDirector.ts
  - src/ui/idleVillage/pixiSpike/ambient/ambientStormo.ts
  - src/ui/idleVillage/pixiSpike/ambient/ambientShoal.ts
  - src/ui/idleVillage/pixiSpike/mapFitRuntime.ts
  - src/ui/idleVillage/pixiSpike/regionOutline.ts
  - src/ui/idleVillage/pixiSpike/seabedTexture.ts
fast_checks:
  - tests/unit/idleVillage/mappa2Stormo.test.ts
  - tests/unit/idleVillage/baseTiles.test.ts
  - tests/unit/idleVillage/mappa2ApprovedLook.test.ts
  - tests/unit/idleVillage/mappa2Tiers.test.ts
  - tests/unit/idleVillage/WorldSurfaceLayerOrder.test.tsx
  - tests/unit/idleVillage/WorldSurfaceRenderer.test.tsx
  - tests/unit/idleVillage/regionOutline.test.ts
  - tests/unit/idleVillage/useWorldSurface.test.ts
  - tests/unit/idleVillage/validateWorldSurfaceAssets.test.ts
  - tests/unit/idleVillage/worldSurfaceRendererStrategy.test.ts
e2e_checks:
  - tests/e2e/idleVillage/questJourneyRoute.spec.ts
e2e_trigger_globs:
  - src/ui/idleVillage/pixiSpike/PixiWorldMap.tsx
invariants:
  - id: pixi-world-map.INV-1
    source: plan
    source_ref: PLAN-054
    statement: >-
      La world-surface della mappa carica e valida il manifest via useWorldSurface: manifest invalido o fetch fallito →
      errore esplicito; cameraConfig esposta dal manifest.
    test_refs:
      - tests/unit/idleVillage/useWorldSurface.test.ts
  - id: pixi-world-map.INV-2
    source: plan
    source_ref: PLAN-053
    statement: World-space route overlays use the same camera transform as the map and render below the event shroud.
    test_refs:
      - tests/e2e/idleVillage/questJourneyRoute.spec.ts
  - id: pixi-world-map.INV-3
    source: plan
    source_ref: PLAN-108
    statement: >-
      Su mappa2 la fauna stormo nasce come famiglia AmbientDirector con zone takeoff da fauna.json (biome-anchored),
      admission deterministic per seed e spawnlog shoal byte-identico; la strip legacy birds non renderizza mai su
      mappa2 e stormo.enabled:false lascia il cielo vuoto.
    test_refs:
      - tests/unit/idleVillage/mappa2Stormo.test.ts
  - id: pixi-world-map.INV-4
    source: director-bug
    source_ref: R-307
    statement: >-
      Run-up spray/flecks lit specks on cliff faces whose nearest sea is behind/beside the silhouette (east rim): facing
      gradient gate passes in fragments. Gate run-up on sea-below probe.
    test_refs:
      - tests/unit/idleVillage/mappa2SurfZones.test.ts
  - id: pixi-world-map.INV-5
    source: plan
    source_ref: PLAN-108
    statement: >-
      L'atlante stormo su disco corrisponde al pin dichiarato in fauna.json: sha256(file) ==
      atlas.sha256 e geometria width == cellPx * frames, height == cellPx (ciclo rimontato
      a 6 pose il 2026-11-04, fallback documentato in PLAN-108 rischi).
    test_refs:
      - tests/unit/idleVillage/mappa2Stormo.test.ts
  - id: pixi-world-map.INV-6
    source: plan
    source_ref: PLAN-115
    statement: >-
      Un pack che spedisce masks/sea_zones.webp (R = alfa della maschera mare, G = alfa delle zone surf, opaca) fa
      leggere mare e zone da quella sola texture tramite un selettore di canale in ogni shader e nel fondale; un pack
      senza torna all'alfa delle due maschere. Ogni campione vale quanto l'alfa che sostituisce (prova A/B 0 px).
    test_refs:
      - tests/unit/idleVillage/mappa2ApprovedLook.test.ts
  - id: pixi-world-map.INV-7
    source: plan
    source_ref: PLAN-115
    statement: >-
      I tasselli hi-res della base (baseTiles) si montano subito sopra la base residente, solo sul percorso chiome e
      dopo che `ticks` esiste; un fallimento lascia la mappa sulla base residente senza bloccare il boot. Le celle
      compaiono solo oltre minScale px fisici per px mondo e restano entro il budget (LRU, mai una cella voluta).
    test_refs:
      - tests/unit/idleVillage/baseTiles.test.ts
  - id: pixi-world-map.INV-8
    source: plan
    source_ref: PLAN-115
    statement: >-
      `hiLand` sostituisce solo la base e i ritagli chioma lasciando sopra gli strati approvati; il mare solo-fondale
      non viene né scaricato né caricato quando il fondale è spento; i ritagli 2x ondeggiano come quelli 1x (griglia in
      px mondo) e ricadono sui 2752 se mancano.
    test_refs:
      - tests/unit/idleVillage/mappa2ApprovedLook.test.ts
      - tests/unit/idleVillage/mappa2Tiers.test.ts
  - id: pixi-world-map.INV-9
    source: plan
    source_ref: PLAN-115
    statement: >-
      `seaGrade.addScale` (predefinito 2) rende la coppia di grade del lab invariata e permette la coppia combinata di
      /game salvata x1; le opzioni `gpuLight` (distanze, tassello mare, base della schiuma, lastre schiuma e campo mare a
      metà) valgono solo se passate: senza, il renderer carica le sorgenti piene.
    test_refs:
      - tests/unit/idleVillage/mappa2ApprovedLook.test.ts
---
# pixi-world-map

Unità `ui-component` (tier 1, ctr-reference) — contratto vivo PLAN-054. Root: `src/ui/idleVillage/pixiSpike/PixiWorldMap.tsx`.

<!-- plan054:notes -->

<!-- /plan054:notes -->

<!-- plan054:generated -->

## Scopo

Unità `ui-component` (tier 1, ctr-reference) — contratto vivo PLAN-054.
Root: `src/ui/idleVillage/pixiSpike/PixiWorldMap.tsx`.

## Scope

- `src/ui/idleVillage/config/atmosphereAssets.ts`
- `src/ui/idleVillage/config/generatedClouds.ts`
- `src/ui/idleVillage/config/seaMarksConfig.ts`
- `src/ui/idleVillage/config/seaWonders.ts`
- `src/ui/idleVillage/config/worldSurfaceConfig.ts`
- `src/ui/idleVillage/hooks/useWorldSurface.ts`
- `src/ui/idleVillage/pixiSpike/PixiWorldMap.tsx`
- `src/ui/idleVillage/pixiSpike/mapFitRuntime.ts`
- `src/ui/idleVillage/pixiSpike/regionOutline.ts`
- `src/ui/idleVillage/pixiSpike/seabedTexture.ts`

## Decision history

- PLAN-054 T-002: partizione generata meccanicamente da `componentInventory.ts`.

<!-- /plan054:generated -->
