# World Surface Runtime — Implementation Plan

> Mappa-mondo multistrato animata e config-driven per Wanderlust / Idle Village.
> Stato: **approved contract, ready for Step 1-3 implementation**.
> Owner: Strategia / Coordinator

---

## 0. Obiettivo

Costruire il **World Surface Runtime** per la variante base di Wanderlust: una mappa
multistrato, pan/zoom, stati visivi, ancore e regioni, esposta in `/world-surface` nel
Test Hub. MVP con renderer DOM + CSS transform; Pixi/WebGL rimandato a Step 6.

---

## 1. Scope (Step 1-3 in questa iterazione)

1. **Asset pipeline**: struttura cartelle, `manifest.json`, `README.md`.
2. **Schemi e contratti**: Zod + TypeScript per `WorldSurfaceManifest`,
   `RuntimeObject`, `WorldEvent`, `WorldEventRegistry`, `WorldSurfaceRegion`,
   coordinate e camera.
3. **Loader e renderer base**: `useWorldSurface.ts`, `WorldSurfaceRenderer.tsx`,
   coordinate world/viewport, parallax, layer toggle, stato visivo.
4. **TestHub page**: `/world-surface` con pan/zoom, toggle layer/visual state,
   debug panel.

## 2. Out of scope (Step 4-6)

- Pixi/WebGL renderer
- Oggetti runtime in movimento su path
- Simulazione lifecycle eventi
- Integrazione POI/quest completa

---

## 2. Principi architetturali

- **Config-first**: ogni comportamento visivo descrive `manifest.json` e viene validato Zod.
- **Separazione**: asset in `public/assets/`, modelli engine in `src/engine/world/`,
  contratti UI in `src/ui/idleVillage/config/`.
- **World Surface come presentazione**: stesso runtime renderizzabile da TestHub, trailer,
  in-game map, vista mobile semplificata.
- **Niente GIF**: animazioni config-driven (transform, shader, sprite_loop, particle).
- **Renderer MVP DOM + CSS transform**; WebGL differito.

---

## 3. Data contract

### 3.1 WorldSurfaceManifest

```ts
{
  version: string;
  world: string;
  variant: string;
  coordinateSystem: {
    space: 'world_pixels' | 'viewport_pixels' | 'normalized';
    origin: 'top_left' | 'center' | 'bottom_left';
    unit: 'px' | '%';
    canvas: { width: number; height: number };
  };
  resolutionHint: {
    runtime: { width: number; height: number };
    source?: { width: number; height: number };
    scaleTarget?: number;
  };
  assetPolicy: {
    resolution: 'runtime_only' | 'prefer_hd' | 'adaptive';
  };
  camera: {
    minZoom: number;
    maxZoom: number;
    defaultZoom: number;
    panEnabled: boolean;
    zoomEnabled: boolean;
    bounds?: { minX; maxX; minY; maxY };
  };
  surfaceLayers: WorldSurfaceLayer[];
  atmosphereLayers: WorldSurfaceLayer[];
  visualStates: WorldSurfaceVisualState[];
  regions: WorldSurfaceRegion[];
  anchors: WorldSurfaceAnchor[];
}
```

### 3.2 WorldSurfaceLayer

- `id`, `file`, `type: texture | animated_texture | particle_system | ui_overlay`
- `zIndex`, `opacity`, `blendMode`
- `parallax: { x, y }`
- `animation: { mode, implementation, direction?, speed?, amplitude? }`
- `conditions: Record<string, WorldSurfaceLayerCondition>` (corrupted, winter, …)
- `tags`

### 3.3 WorldSurfaceVisualState

- `id`, `labelKey`, `base: boolean`
- `overrides: [
    apply_condition | set_visibility | set_opacity | tint_layer | set_animation
  ]`
- `activation: { condition, eventId?, state?, biome? }`

### 3.4 WorldSurfaceRegion

- `id`, `nameKey`, `bounds: { x, y, width, height }`, `tags`

### 3.5 WorldSurfaceAnchor

- `id`, `x`, `y`, `type`, `targetId?`, `labelKey?`

### 3.6 RuntimeObject

- `id`
- `location: anchor | dynamic | path`
- `type`, `state`
- `visual: { iconKey, renderLayer, renderMode, scale, tint?, glow? }`
- `animation`, `data`

### 3.7 WorldEvent

- `id`, `type`, `category`
- `lifecycle: { state, startAt?, endAt? }`
- `effects: [
    spawn_runtime_object | apply_visual_state | tint_region |
    set_runtime_object_state | unlock_quest
  ]`

---

## 4. Struttura file

```text
public/assets/world/wanderlust/base/
├── layers/
│   ├── 05_water.png
│   ├── 10_terrain.png
│   ├── 50_mountains_back.png
│   ├── 70_settlements.png
│   └── 90_vignette.png
├── source/
│   ├── base.psd
│   └── exports/
├── manifest.json
├── README.md
└── preview.png

src/
├── engine/
│   └── world/
│       ├── model/
│       │   ├── RuntimeObject.ts
│       │   ├── WorldEvent.ts
│       │   ├── WorldSurfaceRegion.ts
│       │   └── WorldCoordinate.ts
│       ├── config/
│       │   └── worldEventRegistry.ts
│       └── systems/
│           └── WorldState.ts
├── ui/
│   └── idleVillage/
│       ├── config/
│       │   ├── worldSurfaceConfig.ts
│       │   └── worldSurfaceDebugContract.ts
│       ├── hooks/
│       │   └── useWorldSurface.ts
│       ├── pages/
│       │   └── WorldSurfaceTestPage.tsx
│       ├── components/
│       │   ├── WorldSurfaceRenderer.tsx
│       │   └── WorldSurfaceDebugPanel.tsx
│       └── TestHub.tsx
└── docs/
    └── docs/
        └── plans/
            └── world_surface_runtime_implementation_plan.md
```

---

## 5. Step-by-step

### Step 1 — Asset pipeline

- Creare `public/assets/world/wanderlust/base/source/` e `source/exports/`.
- Creare `README.md` con convenzioni naming layer e pipeline artistica.
- Creare `manifest.json` secondo `WorldSurfaceManifestSchema`.
- Creare `preview.png` placeholder (o lasciare marker per generazione futura).

### Step 2 — Schemi e contratti

- `src/ui/idleVillage/config/worldSurfaceConfig.ts`: schemi Zod e tipi esportati.
- `src/engine/world/model/RuntimeObject.ts`: schema `RuntimeObject`.
- `src/engine/world/model/WorldEvent.ts`: schema `WorldEvent` e effects.
- `src/engine/world/model/WorldSurfaceRegion.ts`: schema regione.
- `src/engine/world/model/WorldCoordinate.ts`: helper conversione coordinate.
- `src/engine/world/config/worldEventRegistry.ts`: registry tipi evento built-in.
- `src/engine/world/systems/WorldState.ts`: store runtime per oggetti ed eventi (Zustand,
  scoped a world surface).
- `src/ui/idleVillage/config/worldSurfaceDebugContract.ts`: payload debug panel.

### Step 3 — Loader e coordinate

- `src/ui/idleVillage/hooks/useWorldSurface.ts`:
  - fetch + validazione Zod `manifest.json`
  - esporre `layers`, `visualStates`, `regions`, `anchors`
  - helper `worldToViewport` / `viewportToWorld`
  - track `activeVisualStateId`
- Supporto coordinate:
  - `world_pixels` con origin `top_left`
  - conversione con zoom + pan + parallax

### Step 4 — TestHub page

- `src/ui/idleVillage/pages/WorldSurfaceTestPage.tsx`:
  - Pan/zoom con bound `camera.bounds`
  - Toggle visibilità layer per `id`
  - Switcher stato visivo `default` / `corrupted`
  - Render ancore `village_01`
  - Overlay region `enchanted_forest` (opzionale, opacità bassa)
- `WorldSurfaceRenderer.tsx`: DOM renderer assoluto per ogni layer.
- `WorldSurfaceDebugPanel.tsx`: coordinate mouse in world, stato visivo attivo,
  layer attivi, anchors, regions, eventi.
- Aggiungere `/world-surface` a `EXTRA_PAGES` in `TestHub.tsx`.

### Step 5 — Oggetti runtime ed eventi (deferred)

- Implementare `WorldState` con `RuntimeObject` e `WorldEvent`.
- Collegare eventi a stati visivi e tint regione.

### Step 6 — Advanced renderer (deferred)

- Valutare Pixi/WebGL quando oggetti > 50 o particle pesanti.

---

## 6. Criteri di accettazione

- `manifest.json` valida contro `WorldSurfaceManifestSchema`.
- `/world-surface` carica tutti i layer in ordine z-index corretto.
- Pan e zoom rispettano `camera.bounds`.
- Parallax muove layer surface e atmosphere a velocità diverse.
- Stato visivo `corrupted` applica tint a terrain e cambia opacità vignette.
- Debug panel mostra coordinate `village_01`, stato attivo, coordinate mouse world.
- `npm run lint` passa per gli scope toccati.
- `npm run build:check` passa.
- `npm run test -- src/ui/idleVillage` e `tests/unit/idleVillage` relativi passano.
- `npm run kanban:lint` passa.

---

## 7. Safeguards

```bash
npm run lint -- src/ui/idleVillage src/engine/world
npm run build:check
npm run test -- src/ui/idleVillage
npm run kanban:lint
```

---

## 8. Domande aperte

- `preview.png` generato automaticamente dal compositor oppure fornito manualmente?
- `WorldSurfaceTestPage` resta entry `EXTRA_PAGES` in `TestHub.tsx` o diventa frozen kit?
- `src/engine/world/` rimane a questo livello o si sposta sotto `src/engine/game/idleVillage/world/`?

---

## 9. Changelog

| Data       | Autore                  | Modifica                                                                                                                                                |
|------------|-------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------|
| 2026-07-19 | Strategia / Coordinator | Contratto schema Zod, manifest, README, roadmap Step 1-3 approvati.                                                                                     |
| 2026-07-19 | Cascade                 | Step 1-3 implementati: asset pipeline, Zod schemas, useWorldSurface hook, WorldSurfaceRenderer DOM, DebugPanel, TestHub page. Safeguards pass. |
| 2026-07-19 | Cascade                 | Step 6 implementato: renderer config, scelta DOM/WebGL basata su soglia/oggetti/particle/shader, WorldSurfacePixiOverlay con Pixi.js, controlli debug spawn/clear. Safeguards pass. |
