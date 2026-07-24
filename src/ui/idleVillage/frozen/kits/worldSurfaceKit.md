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

## Post-processing dei PNG (alpha-bleed + erode + dilation) — 2026-07-24

Dopo la rigenerazione full-canvas, tre problemi visivi erano ancora visibili
a zoom intermedi (0.3–0.5×):

### 1. Color fringing ai bordi dei layer (linea chiara/bianca)

**Causa:** Il browser CSS usa bilinear interpolation per scalare le immagini.
Un pixel trasparente `(0,0,0,0)` interpolato con un pixel opaco produce un
colore medio dominato dalla componente nera → linea scura o bianca sui bordi.

**Fix — `scripts/alpha-bleed-sharp.cjs`:**
Per ogni pixel con `alpha=0` entro radius 3px da un pixel con `alpha>0`,
copia il colore RGB del vicino più prossimo (senza cambiare l'alpha).
Il pixel resta invisibile ma il suo RGB corrisponde al colore del bordo →
bilinear interpola tra colori omogenei → nessun fringe.

Usare **sharp in raw mode** (straight alpha), NON Canvas 2D (usa premultiplied
alpha che azzera l'RGB dei pixel trasparenti vanificando il fix).

```bash
node scripts/alpha-bleed-sharp.cjs               # tutti i layer
node scripts/alpha-bleed-sharp.cjs path/file.png  # singolo file
```

### 2. Outline visibile attorno ai blob di terreno baked-in

**Causa:** Ogni layer elemento (alberi, montagne, foreste) include una copia
del terreno sottostante baked-in dal PSD. In Photoshop era composto senza
problemi; in CSS Normal blend mode il bordo del blob è visibile come linea.

**Fix — `scripts/erode-alpha-edge.cjs`:**
Per ogni pixel con `0 < alpha < 255`, se ha un vicino `alpha=0` entro radius
3px, imposta alpha=0. Rimuove la zona semi-trasparente al bordo del blob
senza toccare i pixel completamente opachi.
Applicato a tutti i layer tranne: `background`, `sea`, `border`, `frame`.

```bash
node scripts/erode-alpha-edge.cjs
```

### 3. Anello chiaro + macchia grigia attorno alle isole nel mare

**Causa strutturale:** `Mare.png` ha dei buchi trasparenti in corrispondenza
delle isole (la maschera Photoshop include le isole nel buco).
I pixel semi-trasparenti al bordo del buco blendano il parchment background
→ anello chiaro visibile. Un fill naïve (campionando il pixel opaco più vicino)
campionava pixel di montagna (grigio) invece del mare (turchese) → macchia grigia.

**Fix in due parti:**

1. **Erode-alpha su Mare.png** (radius 4px): azzera i semi-trasparenti al
   bordo del buco. Il buco cresce leggermente ma viene coperto dall'isola.

2. **Dilation delle isole** (+12px, in-place nel PNG): per ogni pixel `alpha=0`
   dell'isola entro 12px da un pixel opaco, copia il colore del vicino opaco
   e imposta `alpha=255`. L'isola diventa leggermente più grande e copre
   completamente il bordo del buco nel mare.

   Questo è implementato inline nello script di sessione; se serve ripetere:
   ```bash
   # Vedi commit 0a10ef6e per l'implementazione esatta
   # layer: Isola basso a destra.png, Isola basso sinistra.png
   # DILATION_R = 12
   ```

### Ordine corretto delle operazioni su un layer

```
1. Rigenera full-canvas (npm run world:extract)
2. alpha-bleed (scripts/alpha-bleed-sharp.cjs)
3. erode-alpha-edge (scripts/erode-alpha-edge.cjs)  ← dopo il bleed
4. Per le isole: dilation +12px
5. Per Mare.png: erode-alpha con radius 4 (non erode-alpha-edge standard)
```

**Invariante:** alpha-bleed PRIMA di erode. Se inverti, erode rimuove
semi-trasparenti e poi bleed non trova più vicini utili per il fringe.

---

## Rinforzo renderer (già applicato)

`WorldSurfaceRenderer` promuove la world-box a un singolo layer di compositing
GPU (`transform: … translateZ(0)`, `willChange:'transform'`,
`backfaceVisibility:'hidden'`) così tutti i figli rasterizzano nello stesso
spazio e arrotondano i subpixel in modo identico durante lo zoom frazionario.
