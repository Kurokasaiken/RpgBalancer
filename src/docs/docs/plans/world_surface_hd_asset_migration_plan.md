# World Surface HD Asset Migration & Runtime Hardening Plan

**Task ID:** `IV-WORLD-SURFACE-HD-002`  
**Status:** `approved`  
**Date:** 2026-07-23  
**Owner:** Strategia / Coordinator  
**Execution hint:** `verified`  
**Estimated duration:** 90 min  
**Plan reference:** `world_surface_runtime_implementation_plan.md` §Step 1-3 hardening  

---

## 0. Executive Summary

La critica di ChatGPT conferma che l'architettura manifest-driven di `/world-surface` è corretta: `WorldSurfaceRenderer` non deve conoscere i nomi dei file, deve conoscere solo `manifest.json`. Il manifest è il contratto tra asset e runtime. Questo plan definisce l'asset migration pass per portare i nuovi layer HD scontornati in produzione su `/world-surface`, eliminando i vecchi layer monolitici (`Livello 1.png`, `mare.png`) e normalizzando i nomi file.

---

## 1. Critique Evaluation

| Punto della critica | Stato nel codebase | Valutazione |
|---|---|---|
| Manifest = SSOT tra asset e runtime | ✅ `manifest.json` → `useWorldSurface` → `WorldSurfaceRenderer` | Corretto, confermare come regola a-priori |
| Renderer asset-agnostic | ✅ URL costruito da `worldName`, `base`, `layers`, `layer.file` | Corretto |
| Nomi file coerenti | ⚠️ `Foresta 1 chiara alto sin .png` ha spazio finale; `Frame.png`/`frame.png` casing diverso | Da normalizzare |
| zIndex e parallasse coerenti | ⚠️ Nuovi asset non includono `Livello 1.png` e `mare.png`; serve ricalibrazione | Da aggiornare |
| Validazione Zod | ✅ `WorldSurfaceManifestSchema` esiste | Va estesa con semantic validation (file existence) |
| Fallback/error handling | ⚠️ Nessun handling per immagini mancanti | Da aggiungere |

---

## 2. Current State

### Asset source di verità

```text
hd-photo-Map finale/
├── Alberelli centro mappa.png
├── Alberi destra centrali.png
├── Alberi e colline marroni al centro.png
├── Background.png
├── Bordo.png                    (nuovo)
├── Foresta 1 Alto Sin.png
├── Foresta 1 chiara alto sin .png   (spazio finale prima di .png)
├── Foresta 2 scura basso sin.png
├── Foresta 3 scura basso.png
├── Foresta chiara destra centro.png
├── Foresta scura nord.png
├── Frame.png                    (nuovo, casing diverso)
├── Isola basso a destra.png
├── Isola basso sinistra.png
├── Montagna isola basso sinistra.png
├── Montagne chiare basso destra.png
├── Montagne scure basso.png
├── Montagne scure destra.png
├── Villaggio.png
├── Zona montana nord.png
└── map finale no frame no nuvole.png   (nuovo, full composition)
```

### Asset runtime attuali

```text
public/assets/world/wanderlust/base/layers/
├── ... (stessi layer della sorgente HD, più vecchi)
├── Livello 1.png                (da rimuovere, non più nella sorgente)
├── frame.png                    (casing diverso)
└── mare.png                     (da rimuovere, non più nella sorgente)
```

### Differenze rilevanti

- `Livello 1.png` e `mare.png` non esistono più nella sorgente HD: la mappa scontornata non li richiede.
- Nuovi layer: `Bordo.png`, `Frame.png`, `map finale no frame no nuvole.png`.
- `Foresta 1 chiara alto sin .png` ha uno spazio finale nel nome file.
- `Frame.png` vs `frame.png`: casing diverso tra HD e runtime.

---

## 3. Architectural Decision

### Decisione 1: Asset pipeline "artist drop-in"

L'artista copia/sostituisce file in `public/assets/world/wanderlust/base/layers/`. Il runtime non cambia. Se il nome file cambia, si aggiorna solo `manifest.json`.

### Decisione 2: Normalizzazione nomi file

Per evitare problemi di URL encoding, cache busting e cross-OS, normalizzare tutti i nomi:

- rimuovere spazi finali prima di `.png`;
- mantenere il casing esistente del runtime per coerenza (`frame.png` → da decidere con artista; se HD ha `Frame.png`, allineare a `Frame.png` e aggiornare manifest);
- niente caratteri speciali o doppi spazi.

### Decisione 3: Manifest semantic validation

Aggiungere un controllo a build/dev che verifichi che ogni `layer.file` nel manifest esista effettivamente in `layers/`.

### Decisione 4: Runtime image error handling

`WorldSurfaceRenderer` deve mostrare uno stato fallback (placeholder trasparente o warning visivo) se un'immagine non si carica, senza rompere il resto della mappa.

---

## 4. Implementation Scope

### Fase A — Asset inventory & normalization (15 min)

1. Confrontare `hd-photo-Map finale/` con `public/assets/world/wanderlust/base/layers/`.
2. Rimuovere `Livello 1.png` e `mare.png` dalla cartella runtime.
3. Copiare `Bordo.png`, `Frame.png` e `map finale no frame no nuvole.png` dalla sorgente HD.
4. Rinominare `Foresta 1 chiara alto sin .png` in `Foresta 1 chiara alto sin.png`.
5. Allineare casing `Frame.png`/`frame.png` (decidere uno e usarlo ovunque).

### Fase B — Manifest update (20 min)

1. Aggiornare `public/assets/world/wanderlust/base/manifest.json`:
   - rimuovere i layer `level_1` e `sea`;
   - aggiungere nuovi layer per `Bordo.png`, `Frame.png` (ui_overlay), `map finale no frame no nuvole.png` (opzionale, come compositore/debug);
   - aggiornare `version` a `1.1.0`;
   - verificare `zIndex` e `parallax` per la nuova composizione.
2. Verificare che `coordinateSystem.canvas` e `camera.bounds` siano 4240×2828.

### Fase C — Runtime hardening (30 min)

1. In `WorldSurfaceRenderer.tsx`:
   - aggiungere `onError` all'`<img>` dei layer;
   - se un'immagine fallisce, loggare `image_load_failed` via telemetry e applicare una classe CSS/placeholder opzionale.
2. Creare `src/ui/idleVillage/utils/validateWorldSurfaceAssets.ts`:
   - funzione `validateManifestAssetPaths(manifest, baseUrl)` che controlla esistenza file in dev/build;
   - usabile come script CLI o hook di build.
3. Aggiornare `worldSurfaceConfig.ts` se necessario (probabilmente nessun cambiamento schema).

### Fase D — Testing & verification (20 min)

1. Test manuale: aprire `/world-surface`, verificare che i nuovi layer si vedano nell'ordine corretto.
2. Unit test: `WorldSurfaceRenderer` gestisce `surfaceLayerOrder` e layer mancanti.
3. Verifica manifest: validazione Zod passa, eventuale semantic validation passa.

### Fase E — Documentation (5 min)

1. Aggiornare `world_surface_runtime_implementation_plan.md` changelog con la migrazione HD.
2. Creare/README aggiornare `public/assets/world/wanderlust/base/README.md` con convenzioni di naming e workflow artista.

---

## 5. Files to Create/Modify

| File | Azione | Motivo |
|---|---|---|
| `public/assets/world/wanderlust/base/layers/*` | Sostituire/rimuovere/aggiungere PNG | Asset migration HD |
| `public/assets/world/wanderlust/base/manifest.json` | Modificare | Riflettere nuovi layer e rimuovere obsoleti |
| `src/ui/idleVillage/components/WorldSurfaceRenderer.tsx` | Modificare | Image error handling |
| `src/ui/idleVillage/utils/validateWorldSurfaceAssets.ts` | Creare | Semantic validation file esistenza |
| `public/assets/world/wanderlust/base/README.md` | Creare/aggiornare | Documentare workflow artista |
| `src/docs/docs/plans/world_surface_runtime_implementation_plan.md` | Aggiornare changelog | Storico plan |
| `src/docs/docs/plans/world_surface_hd_asset_migration_plan.md` | Aggiornare stato a `approved` | Questo plan |

---

## 6. Guardrails

- `.windsurf/rules/00-project-invariants.md`: persistence via `PersistenceService` per l'ordine layer; config-first; i18n; JSDoc.
- `.windsurf/rules/10-ui-invariants.md`: `@dnd-kit` già usato per reorder; Gilded Observatory theme; no standalone `.css`.
- Non modificare `engine/world` models o `WorldState`.
- `WorldSurfaceRenderer` è `candidate`; estenderne i props è permesso.

---

## 7. Success Criteria

- `/world-surface` carica la mappa HD scontornata senza `Livello 1.png` e `mare.png`.
- I nuovi layer `Bordo.png`, `Frame.png` appaiono nell'ordine corretto.
- Nessun file ha spazi finali o casing incoerente.
- `manifest.json` valida Zod e passa semantic validation.
- Se un file referenziato manca, il renderer non crasha.
- Safeguards passano.

---

## 8. Safeguards

```bash
npm run lint -- src/ui/idleVillage/components/WorldSurfaceRenderer.tsx src/ui/idleVillage/utils/validateWorldSurfaceAssets.ts public/assets/world/wanderlust/base/manifest.json
npm run build:check
npm run test -- tests/unit/idleVillage/WorldSurfaceRenderer.test.tsx
npm run kanban:lint
```

Evidence log: `test-results/iv-world-surface-hd-002-<YYYY-MM-DD>.log`

---

## 9. Open Questions

1. `Frame.png`/`frame.png`: quale casing preferisce l'artista? Propongo `Frame.png` per coerenza con gli altri nomi file maiuscoli.
2. `Bordo.png` e `map finale no frame no nuvole.png`: devono essere layer runtime o solo asset di riferimento/source? Propongo `Bordo.png` come `ui_overlay` e `map finale no frame no nuvole.png` come asset di composizione/debug non caricato di default.
3. Il vecchio drag-and-drop reorder di `IV-WORLD-SURFACE-HD-001` è già stato implementato? Se sì, questo plan ne mantiene il codice; se no, includerlo come follow-up.

---

## 10. Changelog

| Data | Autore | Modifica |
|---|---|---|
| 2026-07-23 | Strategia | Draft del plan basato su critica ChatGPT e asset inventory HD |
| 2026-07-23 | Cascade | IV-WORLD-SURFACE-HD-002 implemented: asset migration, manifest v1.1.1, semantic validation, image error handling, README. |
