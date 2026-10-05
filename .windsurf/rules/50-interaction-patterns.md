---
trigger: glob
globs: src/ui/designSystem/**,src/pages/design-system.tsx
description: Interaction Patterns system — cross-cutting registry of approved UI compositions (layout + flow + emotional goal) that new screens must reference.
---

# Interaction Patterns System

Registered per obbligo di `00-project-invariants.md` ("any new a-priori/cross-cutting
system MUST be registered here"). Introdotto dal piano UI Review Room (/design-system).

## Cosa è

Un **Interaction Pattern** è una composizione UI approvata che norma non solo il
layout ma il **comportamento**: la sequenza vissuta dal giocatore e l'emozione che
deve produrre. I componenti sono mattoni; i pattern definiscono lo stile del gioco.

## Dove vive

- **Schema e dati**: `src/ui/designSystem/componentCatalog.ts` (Zod:
  `CatalogEntrySchema`, campi pattern-only).
- **Rendering**: sezioni Game Patterns / Interaction Patterns di `/design-system`
  (`PatternAnatomy.tsx`, `InteractionPatterns.tsx`).

## Schema (campi pattern-only del catalog)

| Campo | Significato | Esempio |
|---|---|---|
| `flow` | sequenza vissuta dal giocatore | `["receive","reveal","understand rarity","confirm"]` |
| `emotionalGoal` | emozione che il pattern deve produrre | "make reward feel valuable" |
| `playerExpectation` | aspettativa che la UI deve gestire | "something meaningful happened" |
| `referenceIntent` | obiettivo che distingue pattern strutturalmente simili | POI Discovery: "create curiosity before information" vs Inventory: "enable fast decision making" |
| `composedOf` + `responsibilities` | anatomy: mattoni e loro visual responsibility | Panel = "contenitore/profondità" |

## Regole

1. Ogni nuova schermata di gioco DEVE riferirsi a un Interaction Pattern esistente
   in `/design-system`, o proporne uno nuovo (entry nel catalog PRIMA del merge).
2. Lo status dei pattern legati a frozen kit DERIVA da `KIT_REGISTRY`/cert.json —
   mai ridichiarato nel catalog.
3. `compositionRules` sono semantiche (`primaryContexts`/`forbiddenContexts`),
   mai matrici allowedWith.
4. Due pattern con la stessa struttura ma `referenceIntent` diverso sono pattern
   DIVERSI: non unificarli.
