# worldSurfaceKit

**Status:** Draft (frozen contract on assets) · **Version:** 1.0.0

- Canonical component: `WorldSurfaceRenderer` (`src/ui/idleVillage/components/WorldSurfaceRenderer.tsx`)
- Loader hook: `useWorldSurface` (`src/ui/idleVillage/hooks/useWorldSurface.ts`)
- Reference route: `/world-surface` (`src/ui/idleVillage/pages/WorldSurfaceTestPage.tsx`)
- Canonical asset set: `public/assets/world/wanderlust/base/` (`manifest.json` + `layers/`)
- Source of truth for geometry: `hd-photo-Map finale3.psd` (repo root)
- Regeneration pipeline: `scripts/psd-extract-fullcanvas.mjs`
- Guard test: `tests/unit/frozen/worldSurfaceKit.alignment.test.ts`

---

## Uso: una riga in qualunque pagina

```tsx
import { WorldSurfaceStandalone } from '@/ui/idleVillage/frozen/kits/worldSurfaceKit';

// Il container deve avere dimensioni proprie (h/w).
<div style={{ width: '100%', height: '70vh' }}>
  <WorldSurfaceStandalone />                     {/* mappa base Wanderlust */}
</div>
```

Props (tutte opzionali):

| Prop | Default | Note |
|---|---|---|
| `manifestPath` | `WANDERLUST_BASE_MANIFEST` | path a un manifest full-canvas |
| `initialZoom` | `manifest.camera.defaultZoom` | zoom iniziale |
| `showAnchors` | `false` | mostra anchor insediamenti/landmark |
| `showRegions` | `false` | mostra overlay regioni |
| `className` | — | classe sul container (deve essere dimensionato) |

Serve solo se ti serve il controllo camera manuale:

```tsx
import { WorldSurfaceRenderer, useWorldSurface, WANDERLUST_BASE_MANIFEST }
  from '@/ui/idleVillage/frozen/kits/worldSurfaceKit';
```

Nessun provider chain locale: il renderer usa solo i18n globale e lo store
`useWorldState` (zustand) globale, presenti in tutta l'app.

---

## ⚠️ FROZEN CONTRACT — perché è allineato e cosa NON toccare

L'allineamento pixel-perfect **NON dipende da numeri a runtime**. Dipende
interamente da come sono fatti gli asset. Regola unica e inviolabile:

> **Ogni layer PNG è a CANVAS PIENO (identico a `coordinateSystem.canvas`,
> qui 4240×2828) e ogni layer nel manifest ha `offsetX:0`, `offsetY:0` e
> NESSUNA `scale`.** La posizione di ogni elemento è "cotta" dentro il PNG
> trasparente.

Così l'unica trasformazione che scala i layer è `scale(camera.zoom)` sulla
world-box: **la stessa identica matrice per tutti** → drift relativo
matematicamente impossibile, a qualsiasi zoom.

### Cosa rompe l'allineamento (VIETATO)

- ❌ Ri-esportare i layer da Photoshop con "Export As / Layers to Files":
  ritaglia ogni layer al bounding box → PNG di dimensioni diverse.
- ❌ Reintrodurre `offsetX/offsetY/scale` per-layer nel manifest per
  "aggiustare a occhio" la posizione. È esattamente il bug che avevamo.
- ❌ Cambiare `renderer.imageFit` da `none` a `contain`/`cover`/`fill` con layer
  di dimensioni non uniformi.
- ❌ Sostituire un singolo PNG con una versione ritagliata.

### La causa storica del disallineamento (per memoria)

I PNG originali erano ritagliati al bounding box e il manifest li riposizionava
con offset/scala misurati a mano — imprecisi. Esempio reale:
`mountain_island_bottom_left` era `@(324,1858) scale 0.789` invece del vero
`@(309,1851) scale 1` letto dal PSD → la montagna "galleggiava" staccata
dall'isola. Con i layer full-canvas il problema sparisce per costruzione.

---

## Come RICREARE gli asset (o aggiornarli dopo una modifica al PSD)

Prerequisito dev-dependency (già in `package.json`):

```bash
npm install --save-dev ag-psd @napi-rs/canvas   # solo se mancano
```

1. **Rigenera** i layer full-canvas + il manifest azzerato in staging
   (`layers-fullcanvas/` + `manifest.fullcanvas.json`), non distruttivo:

   ```bash
   npm run world:extract
   # equivale a: node --max-old-space-size=8192 scripts/psd-extract-fullcanvas.mjs
   ```

   Lo script legge la **struttura** del PSD (bounds esatti di ogni layer),
   ancora ogni PNG esistente alla sua coordinata reale su tela 4240×2828 e
   scrive un manifest con tutti i layer a `offset 0/0`, `scale` rimossa.

2. **Verifica** a occhio (facoltativo): `node scripts/psd-preview.mjs` produce
   un flatten della mappa; `node scripts/psd-compare.mjs` un prima/dopo.

3. **Promuovi** in produzione (con backup reversibile):

   ```bash
   cd public/assets/world/wanderlust/base
   cp -R layers layers.trimmed.bak && cp manifest.json manifest.trimmed.bak.json
   cp -f layers-fullcanvas/*.png layers/
   cp -f manifest.fullcanvas.json manifest.json
   ```

4. **Convalida** il contract: `npm test -- worldSurfaceKit.alignment` deve
   passare (ogni PNG full-canvas, ogni layer offset 0/0, nessuna scale).

### Nota sul PSD

`ag-psd` legge bene la **struttura** del PSD ma NON decodifica i pixel dei layer
di questo file (troppo grande / feature non supportate). Non è un problema: i
PNG in `layers/` sono già crop esatti al bounding box del PSD, quindi la
pipeline li ri-ancora senza bisogno dei pixel del PSD. Se un domani i PNG non
esistessero, servirebbe un export pixel dal PSD (es. via Photoshop script) prima
di lanciare la pipeline.

---

## Portare la mappa in un ALTRO mondo/variante

1. Crea `public/assets/world/<world>/<variant>/layers/` con i PNG full-canvas.
2. Crea il `manifest.json` con `coordinateSystem.canvas` = dimensione reale,
   ogni layer `offsetX:0/offsetY:0`, `renderer.imageFit:"none"`.
3. `<WorldSurfaceStandalone manifestPath="/assets/world/<world>/<variant>/manifest.json" />`.

Il percorso dei PNG è derivato dal manifest come
`/assets/world/${world}/base/layers/${file}` (vedi `WorldSurfaceRenderer`).

---

## Rinforzo renderer (già applicato)

`WorldSurfaceRenderer` promuove la world-box a un singolo layer di compositing
GPU (`transform: … translateZ(0)`, `willChange:'transform'`,
`backfaceVisibility:'hidden'`) così tutti i figli rasterizzano nello stesso
spazio e arrotondano i subpixel in modo identico durante lo zoom frazionario.
