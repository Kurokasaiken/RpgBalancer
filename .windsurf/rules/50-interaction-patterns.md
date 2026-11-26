---
trigger: glob
globs:
  - src/ui/designSystem/**
  - src/pages/design-system.tsx
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

## Grammatica dei gesti (globale)

Regola trasversale: ogni superficie che mostra oggetti o residenti assegnabili (Roster,
Stash, slot delle spedizioni, bag del planner, e future) usa gli stessi gesti con lo stesso
significato. Nessuna superficie introduce un gesto proprio per la stessa azione.

| Gesto | Significato | Note |
|---|---|---|
| Hover / focus | Tooltip ancorato all'elemento col dettaglio | Stesso componente ovunque; niente pannelli di dettaglio fissi che cambiano sotto il cursore |
| Click | Assegna al primo slot libero del contenitore aperto | Se nessun contenitore è aperto: nessuna azione, il dettaglio resta il tooltip |
| Drag | Assegna a uno slot preciso | Alternativa a puntatore singolo al drag richiesta da WCAG 2.5.7: il click assegna già |
| Pressione lunga (touch) | Mostra il tooltip | Tap = click |
| Tastiera | Focus mostra il tooltip; Invio assegna | Requisito WCAG 2.1.1 |
| Doppio click | Non usato | Non introdurlo come schema |

**Why:** il Director vuole che gesti simili si comportino allo stesso modo in tutto il gioco;
lo Stash aveva il dettaglio fisso e il Roster il tooltip, cioè due modi per la stessa cosa.
**How to apply:** prima di aggiungere un gesto a una superficie, verificare la tabella; se
una superficie deve deviare, chiedere al Director e registrare la deroga qui.

Stato: approvata dal Director. Decisione 2026-11-26: click senza contenitore aperto = nessuna
azione, solo tooltip (nessuna selezione persistente). Storico: R-246 (2026-10-21, click-only,
drag rimosso) è superato da questa regola per lo Stash.
Conseguenza da implementare: il Roster oggi usa il click per `onSelect`; va allineato a questa
regola (click assegna se un contenitore è aperto, altrimenti niente), con il tooltip al posto
del dettaglio fisso. Da fare in una slice separata, con test.
