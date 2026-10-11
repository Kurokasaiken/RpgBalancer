---
title: Triage richieste R-XXX — recovery 2026-10-12 (R-156)
status: draft
created: 2026-10-12
author: Devin (recovery richieste, R-156)
related: RICHIESTE.md, context/INDEX.md, src/docs/docs/coordinator/agent_assignments.md, CURRENT_STATE.md
---

# Triage richieste — recovery R-156

> **Ratifica Director 2026-10-12 («procedi»):** le 9 CHIUDERE? sono state
> portate a `fatta`; le 7 SUPERATE a `ritirata` (con motivazione nella voce).
> Ledger finale: 122 `fatta` · 14 `in corso` · 8 `aperta` · 4 `proposta` ·
> 3 `da chiarire` · 7 `ritirata`.


Triage delle **75 voci non-`fatta`** di `RICHIESTE.md` (stato al 2026-10-12).
Fonti di verità incrociate: kanban `agent_assignments.md` (riga `Completato` =
esecuzione verificata con safeguards), `plans/INDEX.md` (stato piani),
`CURRENT_STATE.md`, artefatti su disco (doc, skill, ingestion).

Legenda classi:

- **CHIUDERE** — evidenza certa di completamento; la voce R- va portata a `fatta`.
- **CHIUDERE?** — artefatto/sostanza consegnata ma non verificabile al 100%
  senza playtest/giudizio Director; proposta di chiusura da ratificare.
- **SUPERATA** — il lavoro è stato reso obsoleto da una direzione successiva
  (non è "persa": è archiviabile come `archiviata — superata da …`).
- **PROPOSTA/ATTESA** — backlog intenzionale: proposta di design o voce
  `da chiarire` in attesa di decisione Director. Non è smarrimento.
- **APERTA** — lavoro reale non fatto / in corso confermato.

## A. CHIUDERE — evidenza certa

| Voce | Titolo | Evidenza |
|---|---|---|
| R-019 | `learn` skill core MW→RPG | skill `learn` presente in `.devin/skills/` e `.agents/skills/` |
| R-023 | protocollo mockup→componente | skill `painter` + `mockup-generator` + `handoff-mockup-to-component-20260814.md` |
| R-064 | Balance Model v1 | `src/docs/docs/balancer/balance_model_v1.md` esiste |
| R-066 | Sea Effect Lab | 2 sub-row kanban `Completato` |
| R-070 | V6.3 goo gocce Venom | kanban sub `Completato`, stato `completata` |
| R-084 | Extraction Ledger + QUEST_RULES + retrieval | CURRENT_STATE §31: pipeline consegnata (QUEST_RULES canonico, REJECTED/OPEN, ingestions/, INDEX L0–L4) |
| R-085 | refactor sistema documentale | lo stesso sistema consegnato da R-084 — CANON.md, context/INDEX.md, governance docs |
| R-087 | skill `strategist` + rename `decomposer` | entrambe le skill esistono |
| R-089 | quest «Sterminio dei goblin» lab S1 | kanban `Completato` |
| R-093 | registro narrativo del mondo | ingestion `context/ingestions/2026-10-07-registro-narrativo-del-mondo.md` |
| R-096 | Quest Fun Audit goblin | `completato` + audit in `.mw/runs/` |
| R-099 | flavour layer quest goblin | `completato` + kanban `Completato` |
| R-101 | redesign UI lab S1 | `completata` + kanban `Completato` |
| R-102 | loadout picker stash | `completata` + kanban `Completato` |
| R-103 | rework narrativo/emotivo goblin | `implementata (P0)` + ingestions emotional-mechanics |
| R-104 | critica AAA + restyle HUD | `completata` + kanban `Completato` |
| R-106 | finestra «quest in corso» /game | `implementata (v1)` + 8 sub `Completato`; QuestRunWindow battezzata (PLAN-025) |
| R-107 | POI reali su /game (S2) | 7 sub `Completato`; PLAN-019-S2.1→S2.5 + S3 + S4 tutti `completed` |
| R-108 | conversazione multi-AI Emotional Mechanics | `context/ingestions/2026-10-09-emotional-mechanics-quest/` (9 round documentati, FINAL-RESOCONTO) |
| R-109 | round 3 F6 BE@6% + gate sweep | `07-round3-f6-validation.md` nell'ingestion R-108 |
| R-115 | Implementation Plan Quest Generation | PLAN-026 esiste ed è **ratificato** 2026-10-10 (deroga v24) |
| R-116 | decisioni micro generazione | contratti v0 scritti (`QUEST_GENERATION_CONTRACTS.md`), traduzione posticipata registrata |
| R-118 | PLAN-019-S3 parte precedente | plan `completed` in plans/INDEX (chiuso 2026-10-10, gate a–d) |
| R-119 | validazione E2E ciclo vita quest | kanban `Completato` + fix race |
| R-123 | PLAN-019-S4 integrazione | kanban `Completato` + 7 sub; plan `completed` (chiuso 2026-10-10) |
| R-127 | approcci alternativi core gimmick | ricerca consegnata (R-128) e **binding adottato** `vigente` (R-134, PLAN-028) |
| R-128 | ricerca strutturata canali | `completata` — report `.mw/runs/20261010-gimmick-channels-research` |
| R-134 | delega Director binding model | `completata` — binding lock+gating+eccezioni `vigente` |

## B. CHIUDERE? — da ratificare col Director

| Voce | Titolo | Perché incerto |
|---|---|---|
| R-005 | POI quest: cerchio magico timer + card a fasi + skill check | la **sostanza** è implementata (halo temporale, QuestRunWindow a fasi, check) ma la **forma** «cerchio magico» non è stata usata → superata-formalmente? |
| R-013 | test Playwright `/poi-quest-detail-roster-time-clock` | la pagina lab è evoluta/sostituita; i test E2E ora coprono `/game` — obiettivo assorbito |
| R-020 | generalizzare `contract-ladder` per bugfix | skill `bugfix` esiste; non verificato se il workflow contract-ladder è generalizzato come richiesto |
| R-021 | `learn` per manutenzione attiva contesto | `learn` esiste e INDEX/ingestions funzionano; non chiaro se la parte «attiva» è fatta |
| R-024 | bloccare generazione mockup senza workflow | la skill `painter` rende il protocollo canonico; il *blocco* attivo non è verificabile |
| R-056 | mappa non respira (moto/parallasse/luce/polvere/vetro) | parte del lavoro fatto (nuvole/ombre R-120, map fit R-148); il piano completo «breath» forse no — vedi `.mw/runs/r056-breathing` |
| R-075 | HUD sopra la mappa | GameFrame HUD esiste (v2, CURRENT_STATE §4) + R-132/136 — forse chiuso come «v2»? |
| R-095 | mappa meccaniche narrative | gran parte coperta da QUEST_GENERATION_* docs + SPEC — verificare completezza vs la richiesta |
| R-117 | plan pagina Steam | copy Steam consegnato (R-145) + capsule; «plan completo cosa mettere dove» probabilmente fatto |

## C. SUPERATA / archiviabile

| Voce | Titolo | Superata da |
|---|---|---|
| R-001 | MW per produrre autonomamente il gioco | meta-direzione evergreen, sostanziata dall'uso corrente di MW (skills, deliberazioni) |
| R-067 | plan miglioramento Astrolabe V6.3 | il lavoro astrolabio è andato oltre (goo R-070, inglese R-141, Steam) |
| R-077 | primo loop «Punch Club light» | il loop quest reale (PLAN-019 S1–S4) ha superato la forma proposta |
| R-081 | piano cambiamento S1 v4 | PLAN-019/S2: la superficie canonica è `/game`, non più lab S1 |
| R-088 | QuestTheatre direzione B | PLAN-025: teardown teatro parallelo, convergenza in `QuestRunWindow` |
| R-097 | micro-iterazione S1 goblin (F5 + consumabili) | lab S1 fermo/deprecato a favore di `/game` |
| R-073 | hero detail card dinamica | `PgCard` canonico + popover quest (R-125); resta aperta solo se si vuole la scheda completa «tutte le stat dal balancer» — altrimenti superata |

## D. PROPOSTA / ATTESA decisione (backlog intenzionale)

| Voce | Titolo | Stato |
|---|---|---|
| R-006 | POI reskin halo/medaglione/famiglia | `da chiarire` — decisione visual |
| R-010 | workflow pagina: documentazione componenti | `da chiarire` |
| R-025 | POI Family contratto comune | `proposta` |
| R-026 | docs AI-friendly + suite integrazione | `proposta` (parzialmente servita da INDEX/ingestions) |
| R-092 | conseguenze quest anche non risolta | `da chiarire` — OPEN-015; esteso da finestra-opportunità R-153 |
| R-094 | dottrina rischio «riesci sempre, varia quanto paghi» | `proposta` — tensione nota con R-105 letalità |
| R-098 | impronte storie famose come archetipi | `proposta` — gli IMPRINTS esistono (`QUEST_IMPRINTS.md`) |
| R-100 | trasformazioni PG (vampirismo…) | `aperta` — feature rara, backlog |
| R-105 | feeling DD/XCOM: letalità calibrata | `aperta` — parzialmente assorbita (settlement/permadeath/forecast) |
| R-110 | luce dinamica 2D mappa | `aperta` — nuvole raymarched fatte in parte (R-120); god rays/sprite additivi no |
| R-112 | colpi di scena con trigger da tratti | `aperta` — ingestion + ARCHITECTURE § twists; runtime non implementato |
| R-155 | foresta a occidente troppo scura | `aperta` — recuperata 2026-10-12, mai eseguita |

## E. APERTA — lavoro reale

| Voce | Titolo | Note |
|---|---|---|
| R-003 | critica piano «mappa viva» | CURRENT_STATE §59: sub-plan A.1–A.3 in draft |
| R-027 | debug artefatto quadrato Day/Night | bug aperto |
| R-028 | Golden UI Foundation audit | CURRENT_STATE §60: backlog confermato |
| R-057 | parallasse/teca vetro World Surface | CURRENT_STATE §58/81: backlog confermato |
| R-065 | Equipment Creator | bloccata da R-064 (chiusa) → sbloccata? |
| R-071 | reminder persistente mappa ripensato | design marker aperto |
| R-072 | teaser trailer Steam 55s | scene/capsule fatte in parte; video astrolabio registrato R-141 |
| R-076 | quest = cuore divertente (Waterdeep++) | pillar-level, direzione continua |
| R-111 | architettura generazione quest | ARCHITECTURE.md esiste; PLAN-026 `active` |
| R-113 | deepening generazione | ingestions consegnate; lavoro continuo sotto PLAN-026 |
| R-114 | specchietto living doc | da verificare se il living doc esiste |
| R-122 | PLAN-027 narration quality | plan `active`, artifact r001 converged |
| R-142 | Quest Generation Lab operativa | PLAN-029 `candidate`, r003 converged — lavoro attivo |
| R-152 | imprint→grafo IMPR-002 | iniziata 2026-10-12 |
| R-154 | ricerca multi-AI layer opportunità | lanciata 2026-10-11 |
| R-156 | questa recovery | in corso |

## Note

- Stati non canonici da normalizzare: `completata`/`completato`/`fatto`/
  `implementata (P0)`/`implementata (v1)`/`proposta`/`da chiarire` →
  tassonomia target `aperta` | `in corso` | `fatta` | `archiviata`
  (+ `proposta` mantenuto come stato legittimo di attesa ratifica).
- Voci `fatta` non elencate qui sono già chiuse correttamente.
- La conversazione «persa» (`chambray-archeology`) è solo **archiviata**
  nella UI — i messaggi restano visibili riaprendola. Unica richiesta
  realmente sparita: la foresta scura (sessione morta in partenza,
  recuperata dal ricordo del Director → R-155).
