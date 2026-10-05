# Glossario — RpgBalancer

**Versione:** 2
**Data:** 2026-10-05

Definizioni compilate solo da fonti canoniche (`QUEST_RULES.md`,
`CANON.md`, `CURRENT_STATE.md`, `context/DECISION_LOG.md`, desiderata FROZEN).
I termini marcati `proposta` non sono regole vigenti (vedi `context/OPEN.md`).

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
- **Skill Check** — prova di competenza; nel modello quest vigente è sforzo di gruppo con verdetto unico e rischi ferita/morte tirati per slot (`QUEST_RULES.md` §3). UI: `Destiny Astrolabe V1`.
- **Verdetti del check** — `bigwin` / `win` / `almost` / `fail` / `epicfail`; contano come superamento solo `bigwin`/`win` (`almost` è near-miss narrativo). `bigwin`/`epicfail` modificano le chance ferita/morte **prima** dei tiri per slot.
- **Banda di rischio** — range di ferita/morte dichiarato per un check al commit; `epicfail` può aggravare solo dentro la banda, mai oltre.
- **Leader (quest)** — slot fisso speciale della spedizione; leader morto al ritorno = reward di quest persa anche a obiettivo riuscito.
- **Party / Slot** — composizione della spedizione; slot **obbligatori** e **secondari** (preparazione facoltativa).
- **Bodyguard** — slot opzionale che intercetta gli esiti ferita/morte **da skill check** destinati agli slot protetti, finché vivo (anche da ferito). Non copre incidenti di viaggio o eventi diretti.
- **Death save** — su esito morte, tiro del 5% → sopravvive ferito. Valore `mock-S1`, da calibrare al Gate A (`context/OPEN.md` OPEN-006).
- **Wipe** — tutti i membri del party morti → si perde tutto (bottino e reward inclusi).
- **Checkpoint continua/ritirati** — punto decisionale **prima di ogni skill check rischioso** (non dopo ogni fase).
- **TAKEN ≠ SECURED** — l'obiettivo ottenuto non è ancora al sicuro: dopo il checkpoint si mette a rischio ciò che si ha già (push-your-luck).
- **Prova-obiettivo** — il check preciso che assegna la reward di quest; ha sostituito la soglia «≥50% dei check» (`context/REJECTED.md` REJ-002).
- **Fuga / ritirata** — fallimento della quest ma il bottino raccolto resta; «continua ad esplorare» dopo l'obiettivo rischia solo le vite.
- **Cover** — meccanica `coverRiskDelta`: slot/item/tag riducono il rischio degli altri membri.
- **Quest S1 lab** — pagina `/quest-s1-lab`; scenario di riferimento «La cassa delle sementi» + «Le Rovine sotto il Fiume» (`context/QUEST_S1_DESIGN.md`, `src/docs/docs/idle_village/quest_rovine_scenario_spec.md`).
- **Mission Planner** — draft PARTY/LOADOUT → preview deterministica (DP esatta) → resolver che campiona lo stesso modello (PLAN-018).
- **Destiny Astrolabe** — componente skill check visuale (d20) usato nel lab S1 e nel `MilestoneCheckModal`.
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

## Concetti strategici — `proposta` (non ratificati, OPEN-010)

- **human-days** `proposta` — costo reale di una quest = persone × giorni; un ferito è «uomo non disponibile per X giorni».
- **Leader-capacity** `proposta` — la capacità di spedizione è limitata dallo stato del leader e dal pool di umani, non da un cooldown «1 quest/X giorni» (direttiva Director 2026-10-04, R-083).
- **Quest come opportunità** `proposta` — 8–10 quest compaiono/mese, 4–5 realisticamente affrontabili; alcune scadono.
- Fonte dei concetti: `context/QUEST_ECONOMY_NOTES.md`.

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
