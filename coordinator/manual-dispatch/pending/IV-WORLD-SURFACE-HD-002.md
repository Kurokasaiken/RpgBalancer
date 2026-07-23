# Manual Task: IV-WORLD-SURFACE-HD-002

## Title
IV-WORLD-SURFACE-HD-002 — World Surface HD Asset Migration & Runtime Hardening

## Description
IV-WORLD-SURFACE-HD-002 — World Surface HD Asset Migration & Runtime Hardening

## Prompt
```text
AGENT
IV-WORLD-SURFACE-HD-002 — World Surface HD Asset Migration & Runtime Hardening

ISTRUZIONI
Sei un agente Windsurf: consulta le skill `agent-execution-mandate` e `idle-village-task` prima di iniziare.
Il prompt completo e' in `prompts/IV-WORLD-SURFACE-HD-002.md`.

OBIETTIVO
Sostituire i layer PNG in `public/assets/world/wanderlust/base/layers/` con quelli HD in `hd-photo-Map finale/`, rimuovendo `Livello 1.png` e `mare.png` (non piu' presenti nel set scontornato), normalizzare i nomi file (nessuno spazio finale, casing coerente), aggiornare `manifest.json`, aggiungere fallback per immagini mancanti in `WorldSurfaceRenderer.tsx` e validazione semantica dei file referenziati.

FILE CHIAVE
- `public/assets/world/wanderlust/base/manifest.json`
- `public/assets/world/wanderlust/base/layers/`
- `hd-photo-Map finale/` (sorgente HD, non cancellare)
- `src/ui/idleVillage/components/WorldSurfaceRenderer.tsx`
- `src/ui/idleVillage/utils/validateWorldSurfaceAssets.ts` (nuovo)
- `public/assets/world/wanderlust/base/README.md` (nuovo/aggiornato)

INVARIANTI
- PersistenceService per l'ordine dei layer gia' esistente.
- i18n namespace `idleVillage`, zero stringhe hardcoded.
- No CSS standalone, tema Gilded Observatory.
- JSDoc su nuove funzioni/proprieta'.
- Il renderer non deve conoscere i nomi dei file: unico SSOT e' `manifest.json`.

SAFEGUARDS
- `npm run lint -- src/ui/idleVillage/components/WorldSurfaceRenderer.tsx src/ui/idleVillage/utils/validateWorldSurfaceAssets.ts public/assets/world/wanderlust/base/manifest.json`
- `npm run test -- tests/unit/idleVillage/WorldSurfaceRenderer.test.tsx`
- `npm run build:check`
- `npm run kanban:lint`
- Evidence log: `test-results/iv-world-surface-hd-002-<YYYY-MM-DD>.log`

NOTE
- Se `Foresta 1 chiara alto sin .png` ha spazio finale, rinominare a `Foresta 1 chiara alto sin.png` e aggiornare `manifest.json`.
- Allineare `Frame.png`/`frame.png` con il casing scelto dall'artista.
- `map finale no frame no nuvole.png` e' opzionale: se non serve a runtime, non inserirlo nel manifest.
- Al completamento: `KANBAN STATUS: IV-WORLD-SURFACE-HD-002 – Completato (Evidence: test-results/iv-world-surface-hd-002-<YYYY-MM-DD>.log)`
```

## Files to Modify
N/A

## Expected Output
N/A

## Dependencies


## Timestamp
2026-07-23T13:36:24.277184+00:00

## Executor
manual
