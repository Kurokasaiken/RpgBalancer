# Glossario — RpgBalancer

**Versione:** 1
**Data:** 2026-08-31

## Gameplay

- **Character** — entità persistente di gioco che rappresenta una persona (eroe o peasant).
- **Resident** — rappresentazione runtime di un `Character` all'interno di Idle Village.
- **Peasant** — lavoratore non-eroico, produce risorse, non può fare quest.
- **Hero** — avventuriere con stat, equip, livelli; consuma stamina per le quest.
- **POI** (Point of Interest) — nodo/location sulla mappa a cui è associata un'attività.
- **ActionCard** — rappresentazione interattiva di un'attività collegata a un POI.
- **ActionHalo** — anello visivo attorno a un POI che comunica tempo/stato (rosso urgenza, giallo/avanzamento, verde completamento).
- **JobCard** — ActionCard per attività di produzione ripetibili (taglialegna, oro).
- **QuestCard** — ActionCard per quest con requisiti ed esito.
- **QuestChronicle** — card cinematografica a fasi che mostra l'esito di una quest.
- **Skill Check** — risoluzione di una prova tramite `Destiny Astrolabe V1` (D20/D100).
- **Blueprint** — schema sbloccabile per edificio/upgrade del villaggio.
- **License** — oggetto-card requisito per certe quest (es. Licenza di Caccia).
- **Injury / Death** — stati di ferita/morte per residenti durante le quest.

## UI / Visual

- **World Surface** — presentazione canonica del mondo: continente dipinto, esplorazione visiva, layer DOM + Pixi.
- **Prismatic Wanderlust** — direzione artistica attuale: Wilderness/Rude Beauty vs Empire/Solar Triumph, teal shadows, no grim/mud/symmetry/flat.
- **Golden UI Foundation** — processo per determinare e congelare la qualità visiva canonica.
- **SlottedMedal** — componente medaglione circolare per personaggi.
- **FloatingPanel** — pannello flottante spostabile, riducibile a icona, non modale.
- **Window** — primitivo vetro/tela per overlay.

## Architecture / Governance

- **Config-first** — tutti i valori gameplay/UI vengono da config Zod, non hardcoded.
- **Frozen Kit** — componente con contratto, test e status `trusted`/`frozen`.
- **Desiderata** — intento del Director con status `FROZEN`, non modificabile unilateralmente.
- **Mind Weaver** — protocollo multi-AI: explorer → planner → executor, con `desiderata`, `RICHIESTE`, regression.
- **Trusted / Frozen** — componenti o contratti congelati; modificabili solo con update di `*_trusted.md` e `COMPONENT_MASTER_INDEX.md`.
- **Vertical Slice** — demo giocabile `/minimal-gameplay`.

## Note di rinomina / concetti storici

- **Dispatch** — riferimento storico per UI/mappa tattica; non è più il modello spaziale canonico.
- **Idle Village** — vecchia pagina legacy; il nuovo target è `Village Sandbox`.
