# Claim Ledger — Wanderlust: Triumph (R-117, rev R-145)

Stato unico di verità per ogni frase che può apparire sulla pagina Steam.
Tre stati: `true-now` (dimostrabile nel build oggi) · `committed-vision`
(intent Director registrato in DECISION_LOG 2026-10-10, non ancora
implementato — **ammesso nel copy principale**: la pagina è Coming Soon,
non esiste build pubblico, quindi tutta la pagina è prospettica per
definizione e il gioco *inteso* si descrive al presente; dibattito
`.mw/runs/20261010-coming-soon-vision-vs-impl` + director directive) ·
`vietato` (inventato o non supportato da nessuna fonte — la linea onesta
è intent-vs-fabrication, non implementato-vs-non).

Checkpoint di riallineamento: quando la demo pubblica esce, ogni claim
diventa verificabile → il copy va re-audited contro il build demo prima
del push Next Fest.

Riscritto 2026-10-10 dopo audit documentale completo: il draft precedente
conteneva eventi inventati (carovane, lupi come sistema, memoria-mondo).
Le fonti di autorità usate: `CANON.md`, `CURRENT_STATE.md`,
`GAMEPLAY_DESIGN.md`, `DESIGN_PILLARS.md`, `QUEST_RULES.md`,
`.mw/desiderata.md` FROZEN, `context/DECISION_LOG.md`,
`context/REJECTED.md`, `context/OPEN.md`, codice in
`src/balancing/config/idleVillage/quests/` e
`src/ui/idleVillage/components/gameFrame/`.

**Re-audit 2026-10-12 (R-145):** il Director ha riscritto l'About copy
aggiungendo lore e sistemi nuovi. Le righe sotto marcano lo stato di ogni
claim nuovo. Tre ex-`vietato` sono stati **riammessi dal Director stesso**
tramite il nuovo copy: «the world remembers» (h2 dedicato), «Astrolabe»
come meccanica (h2 + feature + rewrite Director di `engine.ts` a D100
pre-calcolato), «hundreds of hours» (numero non misurato — claim Director,
ri-check alla demo).

**Direttiva Director 2026-10-12 (R-145):** *«dobbiamo mettere quello che
il progetto sarà, non cosa è»* — la pagina descrive la visione intesa al
presente. Lo stato implementativo riguarda solo il re-audit alla demo,
non il copy.

## 1. Copy claims — `true-now`

| Claim | Evidenza |
|---|---|
| Village-management RPG / gioco gestionale su mappa | `GAMEPLAY_DESIGN.md` §1 "Village/incremental management RPG"; `CURRENT_STATE.md` — TimeEngine, risorse, roster, POI su `/game` |
| Mappa dipinta che "respira" (visual, NON simulazione) | `WorldSurfaceRenderer`: onde, uccelli, nuvole, parallasse — `CURRENT_STATE.md`; desiderata v2/v21/v28 (vita ambientale = atmosfera, non eventi meccanici) |
| Le quest arrivano come **offerte** sulla mappa, con finestra temporale | `questPois.ts` — 2 POI offerta su `/game` (goblin, rovine), `availableFromDay/UntilDay`; `resolveQuestOffer` |
| L'offerta dichiara: **banda di pericolo** (bassa/media/alta/letale), **tier di reward**, **durata stimata** | `DANGER_BANDS` in `questPois.ts` (soglie su P(≥1 morte)); `rewardTiers.ts`; `estimatedDurationTicks` (normativo, coherence-tested) |
| Assegni il party su **slot** (obbligatori + opzionali: leader, membri, bodyguard, esploratore) via drag&drop dal roster | `questExpedition.ts::buildExpeditionParty`, `ResidentSlotRack` su `QuestExpeditionDetail`; E2E `gameQuestExpedition.spec.ts` (9/9) |
| **Forecast prima del lancio**: simulazione Monte Carlo per-party — % reward, % morti/ferite, rischio per singolo membro (BY MEMBER), WHY per sorgente, delta | `questPlanning.ts`, `questSimulation.ts`; PLAN-019-S3 completed (gate a/b/d passati 2026-10-10) |
| **Dentro la quest**: grafo di scene con bivi reali — il percorso dipende dalle tue scelte | `questRun.ts` motore a grafo (canonico, DECISION_LOG 2026-10-09); scenari authored `questScenarioGoblin`, `questScenarioRovine` |
| **Push-your-luck**: bottino extra a rischio crescente (razzia infinita = wipe certo — authored voluto) | gate T-5/Director 2026-10-10; fun audit `test-results/quest-goblin-fun-audit-report-2026-10-07.md` |
| **Bodyguard** opzionale: intercetta ferita/morte da skill check al posto degli altri | `QUEST_RULES.md` §4; slot `goblin-slot-bodyguard` in `questPois.ts` |
| **Ritirata** = missione fallita ma la gente torna (l'obiettivo resta sul campo); **wipe** = si perde tutto | `QUEST_RULES.md` §5 |
| **Morte permanente del PG** — la morte è una risorsa che spendi | `QUEST_RULES.md` §5; DECISION_LOG 2026-10-01 («morte = spesa di risorsa PG») |
| Le conseguenze persistono: morti/ferite applicate al roster, reward/bottino/XP liquidati una volta | `questSettlement.ts`; `QUEST_RULES.md` §8 (lato "quest terminate") |
| Il rischio è **dichiarato prima del tiro**: la scelta fissa la banda, il dado decide dentro | `QUEST_RULES.md` §3 (epicfail opera solo dentro la banda visibile al commit) |
| Il tempo scorre: offerte a finestra, fasi che maturano sul clock, halo = tempo trascorso | `questPois.ts`; DECISION_LOG D-J/D-K 2026-10-09 |
| Feriti ammessi in spedizione (con penalità nei dati, non warning) | DECISION_LOG 2026-10-09 punto 4 |
| Screenshot = build reale `/game` | `test-results/steam-capture/` (7 PNG 1920×1080 + clip 29s, `?capture=1`) |

## 2. `committed-vision` — intent Director (DECISION_LOG 2026-10-10)

Usabili nel copy principale al presente (design intent — la pagina è
prospettica). Una breve nota di stato ("in development"/roadmap) resta
consigliata per leggibilità ma non è obbligatoria per claim committed.
Revisione al prossimo audit; dopo due audit senza implementazione il
claim si rimuove, non si ammorbidisce. **Obbligo**: re-check contro il
build demo prima del push Next Fest.

| Claim | Evidenza dell'intento |
|---|---|
| Struttura a run + **meta-progressione** (morte → ricomincio con bonus) = core, sarà nella demo | DECISION_LOG 2026-10-10; visione `GAME_VISION` «Lose to Progress»; label pubblica: **roguelite**. R-145: copy dichiara blueprint/reward/bonus-edifici che si portano tra run |
| **Selezione tra offerte** come meccanica — scegli la quest che puoi permetterti, reward/costi noti | DECISION_LOG 2026-10-10 (oggi: 2 offerte coesistono, la scelta-come-sistema è intento) |
| Eroi **non-template**: skill/caratteristiche trovate, build dalle combinazioni | DECISION_LOG 2026-10-10 (oggi: eroi authored). R-145: «blank-slate heroes built from skills/spells/gear» |
| Conseguenze anche per offerte **ignorate/scadute** | `QUEST_RULES.md` §8 regola vigente, trigger non implementato (scope piano successivo) |
| Demo pubblica (Steam Next Fest) | pianificata in MASTER_PLAN/GTM, data non fissata. R-145: copy dice «playtest + demo Next Fest, date TBA» |
| Più contratti/quest authored | direzione ovvia del piano quest (PLAN-019 S5 generazione). R-145: «vast number of quests with different twists» |
| **Lingue gioco**: EN/IT/DE/FR alla demo (FR incerta) | DECISION_LOG 2026-10-10 D4. R-145 copy: «EN/IT launch, ES/DE/ZH to follow» — allineato |
| Localization roadmap: ES/DE/ZH-CN **dopo trazione** | DECISION_LOG 2026-10-10 — da comunicare come roadmap, mai come supporto dichiarato |
| **Lore: esilio dall'impero, isola remota infestata di mostri** | R-145 copy Director; correzione Director 2026-10-12: «Solar Triumph» è il nome/mood dell'impero, non un luogo — copy dice «exiled from the empire» |
| **Scala di quest** — job minori sbloccano tier superiori via skill/gear/blueprint | R-145 copy Director — intento; oggi 2 offerte |
| **Astrolabe come meccanica di risoluzione** — 5 esiti, consumabili spostano le odds | R-145: Director ha riscritto `destinyAstrolabe/engine.ts` a D100 pre-calcolato + wedge dead/wound; video `media/astrolabe.mp4` nel carousel. Integrazione nella run canonica `/game` ancora da verificare → resta vision finché non integrato |
| **Trial of Fire** — popolano che sopravvive ascende a eroe | R-145 copy Director — sistema nominato, non implementato |
| **Multi-party → elite company** | R-145 copy Director — intento; oggi un party alla volta |
| **Ondate di attaccanti a cicli + boss + fasi mondo** | R-145 copy Director — intento (esiste hook `invasion` nel Director panel, non un sistema pubblico) |
| **«A world that remembers»** — storie authored, conseguenze persistenti, mondo/gente che cambiano | R-145: Director lo ha dichiarato nel copy (era vietato come «world-memory»); resta vision fino a implementazione |
| **Early Access dopo demo** | R-145 roadmap Director — «feedback shaping the road to 1.0» |
| **Solo developer** | Fatto vero — il progetto è sviluppato da Fausto |
| **Modding tools in esplorazione** | R-145 — comunicato come «being explored», onesto |
| **«Hundreds of hours of replayability»** | R-145 claim Director — numero non misurabile ora; re-check alla demo |
| **Pausa quando vuoi / easy to learn hard to master** | Pausa reale (`isPaused` nel clock); il claim di difficoltà è generico |

## 3. `vietato` — rimosso o mai promettibile

| Claim | Perché vietato |
|---|---|
| "Trade caravans vanish" / carovane / commercio | **Inventato** — zero fonti; commercio è solo PROPOSAL non ratificata (ingestion registro narrativo, OPEN-016) |
| "Wolves close on the old woods" come evento/meccanica | Esiste solo **fixture visuale** (`src/pages/game-frame.tsx:68`, threat marker daysLeft 2) — non un sistema |
| "the map remembers what you spent" / memoria del mondo | ~~Vietato~~ → **R-145 riammesso**: il Director lo dichiara nel nuovo About («A world that remembers») — spostato in §2 committed-vision |
| Eventi rari tipo Kraken/drago/balena come feature | Desiderata v2 li cita come *idea* di vita ambientale (5%), non implementati |
| "Destiny Astrolabe" come meccanica della pagina | ~~Vietato~~ → **R-145 riammesso**: il Director lo dichiara nel copy e ha riscritto `engine.ts` a motore D100; integrazione `/game` canonica da confermare → committed-vision |
| "idle game" / progresso offline | **Mai** — ricerca mercato PHASE 12.0 (MASTER_PLAN): deal-breaker; decisione: niente offline, posizionamento "second monitor" |
| `hand-painted` `hand-drawn` `handcrafted` `procedural` | Delibera r005: arte da pipeline AI+paintover → rischio fiducia |
| `roguelite` `permadeath` | **Emendato 2026-10-10** (director directive): copy e tag **ammessi** — design intent committed, la pagina è prospettica; re-check obbligatorio alla demo |
| Combat animato / battaglie tattiche | Out of scope per design (`GAMEPLAY_DESIGN.md` §8.2); il check è pannello/scena, non animazione di scontro |
| "3 quests / N offerte" numerici | Il pool a scelta è intento; oggi 2 offerte. Mai numeri non misurati |
| "your choices shape the world" / mondo reattivo | OPEN-016 non implementato; `worldScaling` modula solo offerte su segnali interni |
| "mercante" come NPC/sistema | La quest goblin lo usa come *fiction di apertura* (DECISION_LOG 2026-10-10 p.5) — non una scena |
| Tagline inventate | Usare solo la canonica del teaser: **"PREPARE · ENDURE · TRIUMPH"** (`wanderlust_triumph_steam_concept_slice_plan.md`) |

## 4. Parole/frasi vietate (consolidato)

`hand-painted` · `hand-drawn` · `handcrafted` · `procedural` · `idle` ·
`incremental` · `offline progress` ·
`caravans/trade` · `wolves` (come meccanica) ·
`epic battles` · `army` · `procedural quests` · numeri non misurati
(eccetto «hundreds of hours», claim Director R-145).

Riammessi da R-145 (spostati in §2 committed-vision): `the world
remembers` · `Astrolabe` come meccanica.

## 5. Regole d'uso

- Re-audit del ledger a OGNI update della pagina.
- Claim `true-at-launch` non costruito dopo due audit → rimosso.
- Trailer/screenshot valgono come claim: niente montaggi che simulino un
  loop non integrato.
- Ogni frase del copy qui sotto mappa a una riga di §1 o §2. Se una frase
  non ha riga, non esce.

## 6. Copy v2 (proposta 2026-10-12, `REVIEW-2026-10-12.md`)

File: `copy/{en,it}/short-description.v2.txt`, `copy/{en,it}/about.v2.bbcode`.
Nessun claim nuovo rispetto a R-145: stesse righe di §1/§2, riorganizzate.

| Sezione v2 | Claim | Stato |
|---|---|---|
| Hook / Pick the quests / Read the odds | offerte con pericolo-reward-scadenza, forecast per party, bodyguard | §1 true-now |
| Pick the quests | scala di quest, offerta che sparisce | §2 committed-vision |
| Read the odds | Astrolabio, 5 esiti, consumabili | §2 committed-vision |
| Villagers die | Trial of Fire, eroi blank-slate, perdita eroe | §2 (permadeath §1) |
| Keep the village standing | lavoratori campi/laboratorio/guardia | da verificare nel build (era già nel copy R-145) |
| Fall. Learn. | ondate a cicli, meta-progressione | §2 committed-vision |
| **Where it's heading** | multi-party → compagnia d'élite, boss/fasi, campagna che ricorda, demo, EA, lingue | §2 — **dichiarati come roadmap**, non come feature |

Rimossi dal copy (non dal ledger): «hundreds of hours», «easy to learn, hard to master»,
«Steam Achievements» come feature, «modding tools being explored».
