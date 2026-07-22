# Manual Task: IV-WORLD-SURFACE-HD-001

## Title
IV-WORLD-SURFACE-HD-001 — World Surface HD Layer Migration + Drag-and-Drop Reorder

## Description
IV-WORLD-SURFACE-HD-001 — World Surface HD Layer Migration + Drag-and-Drop Reorder

## Prompt
```text
AGENT
IV-WORLD-SURFACE-HD-001 — World Surface HD Layer Migration + Drag-and-Drop Reorder

ISTRUZIONI
Sei un agente Windsurf: consulta le skill `agent-execution-mandate` e `idle-village-task` prima di iniziare.
Il prompt completo e' in `prompts/IV-WORLD-SURFACE-HD-001.md`.

OBIETTIVO
Sostituire i 21 layer PNG esistenti in `public/assets/world/wanderlust/base/layers/` con quelli HD in `source/exports/hd-photo-map-finale/`, aggiornare `manifest.json` alla dimensione naturale 4240x2828, aggiungere drag-and-drop per riordinare i `surfaceLayers` dal pannello debug, mantenere offset X/Y e scala, persistere l'ordine con PersistenceService.

FILE CHIAVE
- `public/assets/world/wanderlust/base/manifest.json`
- `public/assets/world/wanderlust/base/layers/`
- `src/ui/idleVillage/components/WorldSurfaceRenderer.tsx`
- `src/ui/idleVillage/components/WorldSurfaceDebugPanel.tsx`
- `src/ui/idleVillage/pages/WorldSurfaceTestPage.tsx`
- `public/locales/en/idleVillage.json`
- `tests/unit/idleVillage/WorldSurfaceLayerOrder.test.tsx`

INVARIANTI
- PersistenceService per l'ordine dei layer.
- @dnd-kit/sortable per il drag-and-drop.
- i18n namespace `idleVillage`, zero stringhe hardcoded.
- No CSS standalone, tema Gilded Observatory.
- JSDoc su nuove funzioni/proprieta'.

SAFEGUARDS
- `npm run lint -- src/ui/idleVillage/pages/WorldSurfaceTestPage.tsx src/ui/idleVillage/components/WorldSurfaceRenderer.tsx src/ui/idleVillage/components/WorldSurfaceDebugPanel.tsx public/locales/en/idleVillage.json tests/unit/idleVillage/WorldSurfaceLayerOrder.test.tsx`
- `npm run test -- tests/unit/idleVillage/WorldSurfaceLayerOrder.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`
- Evidence log: `test-results/iv-world-surface-hd-001-<YYYY-MM-DD>.log`

NOTE
- Se `Foresta 1 chiara alto sin .png` crea problemi di caricamento, rimuovi lo spazio finale e aggiorna il manifest.
- Al completamento: `KANBAN STATUS: IV-WORLD-SURFACE-HD-001 – Completato (Evidence: test-results/iv-world-surface-hd-001-<YYYY-MM-DD>.log)`
```

## Files to Modify
N/A

## Expected Output
N/A

## Dependencies


## Timestamp
2026-07-22T19:27:56.538499+00:00

## Executor
manual
