# Phase 12: Idle Incremental RPG – Implementation Plan

**Status:** Planning  
**Type:** Idle Meta-Game / Village + Quest + Worker Placement  
**Depends On:** Phase 9 (Combat Expansion), Phase 10 (Config-Driven Balancer), Phase 10.5 (Stat Stress Testing), Phase 11 (Tactical Missions – per filosofia e riuso engine)

**Product Context:**  
Phase 12 realizza la **Phase One** del prodotto *Idle Incremental RPG*. Per high concept, player fantasy, meta-progression tra run e obiettivi di prodotto vedi:  
- [../GAME_VISION_IDLE_INCREMENTAL.md](../GAME_VISION_IDLE_INCREMENTAL.md)  
Questo file si concentra invece su architettura e sotto-sistemi tecnici (Time & Activity Engine, Jobs, Quest, Injury, Economy, UI prototipale) necessari a rendere giocabile il loop descritto nel documento di visione.

---

## 1. Overview

Obiettivo della Phase 12 è costruire la **prima versione completa e giocabile** del meta-gioco:

- Villaggio iniziale con pochi **edifici/lavori umili** e una **casa** con cap limitato.
- Sistema di **quest stile Dispatch**: scegli quali personaggi mandare, con outcome multipli (perfect/success/partial/fail/deadly) e conseguenze.
- Risoluzione combat delle quest ad alto rischio tramite **idle combat engine** esistente (Capybara Go-style autobattler).
- Sistema di **lavori & piazzamento lavoratori** ispirato ai german boardgame: slot limitati, tempo come risorsa, reward prevedibili ma lenti.
- Loop di gioco concentrato su **high risk / high reward**:
  - **Injury** e **death** disponibili **fin dall'inizio**.
  - I personaggi forti sono davvero eroici e preziosi.
  - Devi spendere risorse per **proteggerli** e ridurre il rischio di morte.
  - I personaggi feriti possono ancora lavorare nei building (spingendo a costruire edifici migliori che valorizzano i pg di alto livello anche se non possono più andare in quest in sicurezza).

- Nessuna progressione **offline idle** per questa fase (né garantita per il prodotto finale): il gioco avanza solo mentre è aperto.

Per la definizione dettagliata dei **primi 30–60 minuti** di esperienza (FTUE) e della vertical slice pensata per demo web/Steam vedi anche:  
[`idle_village_ftue_plan.md`](idle_village_ftue_plan.md).

Per stile visivo, palette e coerenza con il tema **Gilded Observatory**, vedere anche:  
[`idle_village_art_style_plan.md`](idle_village_art_style_plan.md).

---

## 2. Design Pillars

1. **Config-First Idle Game**  
   - Quest, lavori, edifici, costi/ricompense, injury/death rates e tempi vivono in `src/balancing/config/*` (nessuna logica magica nella UI).

2. **Unified Combat & Stats**  
   - Tutte le risoluzioni combat usano l'**idle combat engine** e le **stat** esistenti (weight-based creator pattern).

3. **High Risk, High Reward**  
   - Le quest pagano molto di più dei lavori, ma con rischi strutturali: injury e morte sono espliciti e sempre possibili.
   - Gli upgrade del villaggio, il cibo e i consumable servono in gran parte a **mitigare il rischio**.

4. **Worker Placement & Time as Resource**  
   - Il villaggio ha **slot limitati** per lavori e allenamento.
   - Ogni attività consuma **tempo globale** e produce reward/costi a fine attività.

5. **Sfruttare i Feriti**  
   - I personaggi **feriti** non sono semplicemente useless: possono ancora produrre valore lavorando in building adeguati (magari meno rischiosi delle quest).

6. **Founder Archetype & Difficulty**  
   - All'inizio scegli un **archetipo** per il "founder" (personaggio iniziale).
   - Le difficoltà più alte danno founder più scarso (meno punti o distribuzione peggiore), aumentando l'importanza di trovare/gestire veri "eroi".

---

## 3. Core Systems & Sub-Phases (12.x)

### 12.1 – Time & Activity Engine

**Implementation status (2025-12-27): _Parziale_**

- ✅ `tickIdleVillage`, `advanceTime`, `resolveJob/Quest`, `applyFatigueInjuryForActivity` funzionano e vengono usati da `IdleVillageMapPage`.
- ⚠️ `advanceTime` applica ancora un `fatigueGain = 10` hardcoded al termine di ogni attività: serve spostare il valore nei metadata attività/config.
- ⚠️ Il loop di ticking è ancora gestito dalla UI (`IdleVillageMapPage`, `VillageSandbox`) invece che da un servizio condiviso (`SandboxEngine`).
- ⚠️ La Trial of Fire è implementata in `resolveActivityOutcome`, ma il Village Sandbox non invoca ancora quell’API (usa uno scheduler locale).

**Obiettivo:** modellare un sistema di **tempo globale** e una coda di **attività programmate**.

- **Snapshot implementazione (2025-12-26):**
  - `tickIdleVillage` (`src/engine/game/idleVillage/IdleVillageEngine.ts`) coordina `advanceTime`, `resolveJob`, `resolveQuest` e `applyFatigueInjuryForActivity`, restituendo gli array di job/quest completate per la UI configurabile @src/engine/game/idleVillage/IdleVillageEngine.ts#1-94.
  - `advanceTime` (`TimeEngine.ts`) legge tutti i parametri da `config.globalRules` (es. `fatigueRecoveryPerDay`, `dayLengthInTimeUnits`, `foodConsumptionPerResidentPerDay`) per gestire progressi attività, ritorno dei residenti, recupero fatica, consumo cibo e spawn quest. Non esistono numeri magici fuori da config @src/engine/game/idleVillage/TimeEngine.ts#430-590.
  - La UI (`IdleVillageMapPage`) usa `tickIdleVillage` ogni secondo reale per simulare il villaggio live, auto-ripianificando i job configurati come `continuousJob`/`supportsAutoRepeat` e sbloccando i residenti completati @src/ui/idleVillage/IdleVillageMapPage.tsx#213-300.
  - Il Village Sandbox “pulito” deve riutilizzare gli stessi moduli: oggi `VillageSandbox.tsx` replica parte di questa logica e va rifattorizzato per consumare un engine condiviso (vedi Phase 12.E – Atomic Sandbox).
- **Gap principali emersi dall’audit:**
  1. `TimeEngine` usa ancora un `fatigueGain` temporaneo = 10 quando un’attività termina; serve portare il valore in config/metadata attività per rispettare il weight-based creator pattern @src/engine/game/idleVillage/TimeEngine.ts#470-490.
  2. Non esiste ancora un servizio “tick runner” riusabile fra Idle Village Map e VillageSandbox: la logica di schedulazione/loop vive nella UI e dev’essere spostata in `SandboxEngine` (richiamato in Phase 12.E).
  3. Trial of Fire / hero bonus sono implementati solo parzialmente (`resolveActivityOutcome` ha test e logica, ma non è ancora integrato nel loop principale del Sandbox pulito). Va completato secondo il task 12.11/12.12.

- **Domain Types (engine layer):**
  - `IdleTimeUnit` (tick astratto configurabile).
  - `ActivityKind`: `job | quest_non_combat | quest_combat | training | shop`.
  - `ActivityDefinition`: id, label, kind, durata base, costi (fatica, cibo, gold), reward base.
  - `ScheduledActivity`: activityDef + personaggi assegnati + startTime + endTime.
  - `VillageState`: tempo corrente, risorse, edifici, popolazione, lista attività attive e completate.
- **Regole chiave:**
  - Un'attività ha sempre un **tempo di andata**, un **tempo di esecuzione**, un **tempo di ritorno** (quest) o una singola `duration` (jobs/allenamento).
  - I personaggi occupati non possono essere assegnati ad altre attività.
  - Il tempo avanza via funzione pura `advanceTime(state, delta)` che risolve tutte le attività che finiscono entro `time + delta`.
- **Fatica & ciclo giornaliero semplice:**
  - Non esiste un ciclo giorno/notte formale, ma una regola semplice: se un personaggio supera una certa soglia di **fatica** entro un intervallo (config), viene marcato come **stanco** e non può più lavorare/andare in quest **fino al giorno successivo** (o fino a un reset di tempo definito dalla config).

### 12.2 – Characters & Roster Integration

**Implementation status: _Parziale_**

- ✅ Import residenti da Character Manager tramite `loadResidentsFromCharacterManager`; fallback founder in VillageSandbox.
- ⚠️ Mancano recruitment flow, housing cap e costi cibo in UI.
- ⚠️ Nessuna visualizzazione assegnamenti casa/status oltre agli stati base.

**Obiettivo:** integrare il meta-gioco dell'Idle Incremental RPG (villaggio) con il sistema di personaggi esistente.

- **Domain:**
  - `Resident`: wrapper su `SavedCharacter`/`Entity` con status: `available | away | injured | exhausted | dead`.
  - `HomeAssignment`: associazione resident → building casa.
- **Distribuzione stat iniziali:**
  - Usa il weight-based creator per generare villagers con **distribuzione normale** delle stat.
  - Il founder è generato da preset **più forti**, ma la difficoltà scelta può abbassarne il potenziale.
- **Recruitment:**
  - Aggiungere nuovi personaggi costa **gold** + **cap di housing**.
  - Ogni personaggio aumenta il **costo di mantenimento in cibo**.

### 12.3 – Jobs & Worker Placement

**Implementation status: _Parziale_**

- ✅ Jobs configurati in `defaultConfig.ts` (slot, duration, reward, stat requirement).
- ⚠️ `resolveJob` applica solo reward deterministici; non usa slot modifiers, stat scaling, fatigue config-driven.
- ⚠️ Worker placement UI (IdleVillageMapPage, VillageSandbox) non condivide ancora controller unico né applica crew limit/fatica dinamica ovunque.

**Obiettivo:** definire un sistema jobs config-driven e un modellino di worker placement.

- **Config Jobs** (`jobsConfig.ts`):
  - Esempi V1: `woodcutting`, `quarry`, `farm`, `odd_jobs`, `basic_training`.
  - Ogni job definisce:
    - `buildingId` richiesto;
    - `slotMax` per building;
    - `duration`;
    - `relevantStats` con pesi (es. forza, stamina) per calcolo reward;
    - `baseReward` (materials/gold/XP) con scaling su stat;
    - `fatigueGain` base e modificatori.
- **Buildings** (`villageBuildingsConfig.ts`):
  - `BuildingDefinition`: id, label, tipo (`house | job_site | training | shop`), slot lavoratori, bonus passivi (es. meno fatica, più reward, protezione injury).
  - Casa di partenza: pochi slot, nessun bonus.
- **Engine:**
  - Funzione pura `resolveJobActivity(activity, chars, villageState, rng)`:
    - calcola reward medi + variabilità;
    - applica fatica e piccoli rischi (molto sotto rispetto alle quest).

### 12.4 – Quest System (Dispatch-Style)

**Implementation status: _Parziale_**

- ✅ Config quest + spawn loop (`spawnQuestOffersIfNeeded`) presenti.
- ⚠️ Mancano calcolo `EffectivePower`, distribuzione outcome multipla, categorie variance dinamiche (oggi si usa la prima categoria hardcoded).
- ⚠️ Nessun bridge con idle combat engine; la UI mostra risk basati su metadata statici.

**Obiettivo:** sistema di quest che valuta il match tra **party** e **requisiti** con esiti multipli.

- **Config Quest** (`questConfig.ts`):
  - `QuestDefinition`: id, label, descrizione breve, `level`, tags (es. `combat`, `social`, `stealth`, `medical`...), `dangerRating`, durata (andata, missione, ritorno), `minPartySize`, `maxPartySize`.
  - `QuestOutcomeProfile`: pesi per outcomes `perfect | success | partial | fail | deadly` in funzione di un punteggio di efficacia del party.
- **Quest Level & XP:**
  - Il campo `level` rappresenta il livello "medio" di un personaggio (dell'archetipo appropriato, con stat di quel livello) che dovrebbe riuscire a completare la quest, **probabilmente rischiando un'injury**.
  - L'XP ottenuta da una quest dipende **solo** da `level` tramite una formula configurabile (esposta in config/UI), indipendente dai moltiplicatori istanza-dipendenti.
- **Match party ↔ quest:**
  - Calcolo di un `EffectivePower` del party sui tag richiesti basato su stat/traits (weight-based, da config).
  - Normalizzazione del `power` rispetto a difficoltà quest.
  - Mappa di `power` → distribuzione outcome; ogni outcome ha effetti diversi su reward/injury/death.
- **Difficulty & Reward Variance:**
  - Per ogni **istanza** di quest vengono estratte due categorie indipendenti: una di **difficoltà** e una di **ricompensa**, definite in `IdleVillageConfig`.
  - Ogni categoria ha un range di moltiplicatori (es. 0.7–1.3) e un colore associato (verde/giallo/rosso); sia i range numerici sia le bande colore (es. 0.9–1.1 = giallo "normale") sono **configurabili da UI**.
  - Il risultato è che puoi avere, ad esempio, una quest "Facile lv 2" ma "Ben pagata", con indicatori visivi coerenti.
- **Procedural Quest Generation:**
  - Nome, tipo di missione, mix di reward (gold, spell, equip, risorse, consumables, ecc.) e categorie di difficoltà/pagamento sono generati randomicamente usando **tabelle/weights in config**, non logica hardcoded.
  - La pagina di configurazione dell'Idle Incremental RPG (tab *Idle Village Config*) permette di aggiungere/rimuovere tipi di missione, loot table e categorie di variance senza toccare il codice.
- **Spawn system:**
  - Generatore di quest attive attorno al villaggio, con seed RNG e limiti su numero massimo contemporaneo.
  - All'inizio compaiono solo quest **vicine al villaggio** e di `level` relativamente basso; quest di livello/più lontane richiedono edifici di **esplorazione** o altri prerequisiti definiti in config.

### 12.5 – Combat Integration (Idle Autobattler)

**Implementation status: _Da implementare_**

- ⛔ Nessun adapter che costruisce party/nemici e lancia l’idle combat loop.
- ⛔ `resolveQuest` non legge outcome del combat engine.

**Obiettivo:** risolvere le quest combat usando il combat engine idle.

- Per quest con tag `combat`:
  - genera nemici da config (archetypes, tiers, ecc.);
  - costruisce `Combatant[]` per party e nemici usando `Entity` + spells;
  - lancia il loop completo (upkeep → intent → action) offline/UI-minimal;
  - produce un `CombatOutcome` (win/lose, danno preso, turni) e un log sintetico.
- **Bridge quest ↔ combat:**
  - Risultato combat sovrascrive/setta un outcome minimo della quest: una sconfitta non può mai diventare `success`, una vittoria non può essere `deadly`.

### 12.6 – Injury & Death System

**Implementation status: _Parziale_**

- ✅ Trial of Fire + heroization, HP recovery, auto-resched esistono in `TimeEngine`.
- ⚠️ Livelli di injury (light/moderate/severe) e malus non sono ancora definiti in config/UI.
- ⚠️ I residenti feriti possono ancora lavorare ma senza bonus/malus di building dedicati.
- ⚠️ Risk stripes della UI usano metadata statici.

**Obiettivo:** definire injury & death coerenti con il tema high risk/high reward.

- **Injury Levels:**
  - Almeno 3 livelli (es. `light`, `moderate`, `severe`) con:
    - malus su stat;
    - tempi di recupero;
    - compatibilità con lavori/quest.
- **Death:**
  - Possibile fin da subito per quest ad alto rischio (deve essere **chiaramente indicato** nella UI della quest).
  - Le probabilità dipendono da `dangerRating`, outcome quest, difese del party.
- **Feriti al lavoro:**
  - I personaggi feriti possono comunque lavorare, con:
    - magari reward leggermente ridotti;
    - più fatica;
    - ma senza (o con pochi) rischi di morte.
  - Building avanzati riducono penalità e migliorano reward dei feriti, rendendo conveniente tenerli vivi e occupati.

### 12.7 – Village Map & Expansion

**Implementation status: _Parziale_**

- ✅ IdleVillageMapPage v0.1 proietta `mapSlots` e permette editing nel tab Activities.
- ⚠️ VillageSandbox non mostra ancora map medaglioni/density né mini ActivityCard su mappa.
- ⚠️ Non esistono upgrade/espansioni giocabili: config definisce slot ma non c’è loop per sbloccarli.

**Obiettivo:** rappresentare il villaggio su una mappa compatta e supportare una prima forma di espansione.

- **Mappa iniziale:**
  - 1 casa (cap limitato),
  - 2 job site base,
  - 1 training ground,
  - 1 shop base,
  - 3–4 nodi quest attorno al villaggio.
- **Espansioni minime V1:**
  - Upgrade casa (più cap persone).
  - Sblocco di almeno 1 nuovo job site + relativo job.
- Tutto definito in config (`IdleVillageConfig.mapSlots` sotto `src/balancing/config/idleVillage/*`), inclusa la posizione su mappa (coordinate logiche su griglia 0–10). La UI prototipale offre un semplice editor nel tab **Idle Incremental RPG / Activities** che permette di cliccare sulla mappa per riposizionare gli slot e scegliere un'icona per ciascun `mapSlot`.

### 12.8 – Economy, Food & Maintenance

**Implementation status: _Parziale_**

- ✅ Food resource e consumo giornaliero in `advanceTime`.
- ⚠️ Nessuna penalità/malus per fame oltre a riduzione risorse.
- ⚠️ Mancano sistemi materiali/upgrade/costi maintenance nella UI e loop.

**Obiettivo:** introdurre un'economia semplice ma significativa.

- **Risorse primarie V1:**
  - `gold`: usato per cibo, equip/spell base, assunzioni, alcuni upgrade.
  - `food`: mantenimento giornaliero della popolazione.
  - `materials`: astratti (legna/pietra) per building/upgrade.
- **Food upkeep:**
  - Ogni personaggio consuma cibo per intervallo di tempo configurabile.
  - Se il cibo manca:
    - si applicano malus (più fatica, più injury);
    - ma non necessariamente morte immediata (configurabile).

### 12.9 – UI/UX – Village Meta Screen

**Implementation status: _Parziale_**

- ✅ IdleVillagePage legacy e nuova `VillageSandbox` mostrano roster, ActivityCard, Theater overlay stub.
- ⚠️ Tick/resolve loop duplicato nella UI; manca `SandboxEngine`.
- ⚠️ Risk stripes, drag/drop MIME unificato, density/bloom, card minimap non completati (richiesti dalle sotto-sezioni 12.9.b e plan resident slots).
- ⚠️ The Active HUD non legge ancora i veri output engine (solo stub).

**Obiettivo:** creare una schermata principale per il meta-gioco in stile Gilded Observatory.

- **Layout proposto:**
  - **Sinistra:** lista personaggi (card compatte) con status (available/away/injured/exhausted/dead) e drag handle.
  - **Centro:** mappa villaggio + nodi quest, con slot evidenziati per drop.
  - **Destra:** coda attività, log eventi (quest concluse, reward, injury, morti).
- **Interazioni:**
  - Drag & drop di personaggi su lavori/quest/allenamento.
  - Tooltip e pannelli per mostrare **costi, durata, reward atteso e rischio**, con testi molto esplicativi (stile Balancer) che spiegano chiaramente: `level` raccomandato, categorie di difficoltà/pagamento estratte, e significato dei colori.
  - Badge visivi per injury, death chance, danger rating e per le categorie di difficoltà/pagamento (verde/giallo/rosso), con colori e soglie letti dalla config.
  - Svolgimento di quest e lavori in stile **Cultist Simulator**: le attività appaiono come carte/token su slot temporali/lane, con barre di progresso e indicatori di stato, ma senza logica di bilanciamento duplicata nella UI.
- **Estetica:**
  - Tema Gilded Observatory (palette, tipografia, densità compatta).
  - Nessuna logica di bilanciamento o formule dentro i componenti React.

#### 12.9.a – Implementazione legacy v0.1 (IdleVillagePage)

Per la vertical slice v0.1 è già presente una **UI prototipale legacy** in `src/ui/idleVillage/IdleVillagePage.tsx`. Rimane nel repo come riferimento storico, ma tutte le nuove superfici devono puntare al `VillageSandbox` e ai relativi ActivitySlot/ActivityCard. Caratteristiche attuali (legacy):

- **Mappa + mapSlots:**
  - I `mapSlots` definiti in `IdleVillageConfig` vengono proiettati sopra un background mappa tramite coordinate logiche (griglia 0–10, convertite in percentuali con margini 8/12/80/55).
  - Ogni slot è rappresentato da un piccolo token edificio (sagoma scura con bordo chiaro) con icona configurabile (`icon` + `colorClass`).
  - Nel tab **Activities** è presente un editor di layout che consente di:
    - selezionare uno `mapSlot`;
    - cliccare sulla mappa per aggiornarne `x/y`;
    - scegliere l'icona tramite un icon picker stile Balancer.

- **Pannello "Jobs & Quests in progress":**
  - Reso collassabile tramite un'icona Occhio (riuso di `DefaultSection.actions`).
  - Ogni attività attiva (`ScheduledActivity`) è mostrata come **ActivityCard** (`ActivityCardDetail` / `ActivitySlot` pipeline) con:
    - label attività;
    - tipo (Job / Quest / Activity);
    - residenti assegnati;
    - hint sulle risorse reward;
    - eventuale deadline (per quest con `questDeadlineInDays`);
    - **anello di progresso** attorno alla card basato su `startTime/endTime/currentTime`.

- **Market & risorse iniziali:**
  - Un job di tipo Market (config-first) apre un semplice modal per scambiare gold ↔ food usando una funzione pura `MarketEngine.buyFoodWithGold`.
  - Le risorse iniziali vengono lette da `globalRules.startingResources` e le risorse con valore 0 non vengono mostrate in UI.

**TODO UI per fasi successive (Village Sandbox):**

- Estendere il sistema ActivityCard/ActivitySlot per supportare:
  - stati `idle/completed`;
  - azione esplicita di "Collect" output;
  - attività speciali dedicate (Time, Injury, Market avanzato) modellate come ActivityCard configurabili.
- Reintrodurre la mappa usando **ActivityCard** compatte al posto dei token statici: ogni slot della mappa deve mostrare jobs, quest e attività di manutenzione (food upkeep, injury ward, ecc.) come card config-driven, con le stesse visual del nuovo componente (timer, risk stripes, assignee badge). La sezione di riepilogo globale in alto a destra deve ridursi a una singola riga in stile "stat row" del Balancer, mostrando solo i count chiave (jobs, quest, upkeep, eventi critici).
- Introdurre training job visibile come ActivityCard dedicata.
- Introdurre una prima visualizzazione/spawn loop di quest attorno al villaggio coerente con i `mapSlots`.

#### 12.9.b – Resident Slot Expansion & Theater Parity

- Riferimento dettagliato: [`docs/plans/idle_village_resident_slot_plan.md`](idle_village_resident_slot_plan.md).
- Obiettivo: riutilizzare un unico controller/component per gli slot residenti (map tile, TheaterView, VerbDetailCard) con bloom, drag/drop e crescita infinita.
- Deliverable chiave: `ResidentSlotController`, `ResidentSlotRack`, aggiornamento di TheaterView/VerbDetailCard/ActivityCardDetail per usare questi componenti, supporto scrollabile quando gli slot superano la larghezza disponibile.

### 12.10 – Testing & Simulation Strategy

**Implementation status: _Da implementare_**

- ⛔ Nessuna suite dedicata (`tests/idleVillage/*` assente).
- ⛔ Mancano test unit per `advanceTime`, `resolveJob/Quest`, Trial of Fire e simulazioni multi-run.

**Obiettivo:** garantire che il nuovo loop sia verificabile e non rompa i sistemi esistenti.

- **Unit Tests:**
  - Time & activity engine (scheduler, advanceTime).
  - Job resolution (reward/fatica, worker placement rules).
  - Quest resolver (mapping power → outcome distribution).
  - Combat adapter (quest ↔ idle combat).
- **Simulation Tests:**
  - Suite dedicata (es. `tests/idle_village/`) che lancia **N simulazioni** su:
    - jobs tipici (reward medio, varianza);
    - alcune quest chiave (winrate, injury/death rate).
  - Output su JSON per non-regression (in linea con filosofia config-driven).
- **E2E / UI:**
  - Flusso base: crea founder → assegna job → avanza tempo → ricevi reward.
  - Flusso quest semplice: assegna 1–2 pg ad una quest easy, verifica outcome e log.

---

## 4. Dependencies & Non-Goals

### 4.1 Dependencies

- **Combat engine idle** e stat weight-based stabili.
- **Config-Driven Balancer (Phase 10)**: fonte unica di definizione stat/weights.
- **Stat Stress Testing (Phase 10.5)**: utile per tarare i valori ma non hard dependency tecnica.
- **Tactical Missions (Phase 11)**: ispirazione per dominio missioni, ma il tactical layer grid-based non è richiesto per V1 Idle Village.

### 4.2 Non-Goals (for Phase 12)

- Nessuna progressione offline (catch-up basato su timestamp) in questa fase.
- Nessuna campagna narrativa completa; focus sulla struttura sistemica.
- Nessun editor UI avanzato oltre il **tab di configurazione Idle Incremental RPG** (che già permette CRUD completo di quest/lavori/edifici tramite config). Niente map editor grafico o tool di scripting complessi in questa fase.
- Nessun sistema complesso di giorni/settimane: solo regola di fatica semplice (stanco fino al “giorno successivo” modellato via soglia di tempo).

---

## 5. Success Criteria

- ✅ Tutte le quest, lavori, edifici, costi e reward sono definiti in moduli di config centralizzati (nessun numero magico in UI/engine).
- ✅ È possibile giocare un **loop completo**: creare founder → lavorare → allenarsi → completare almeno un paio di quest → espandere il villaggio minimale.
- ✅ Injury & death funzionano secondo il modello high risk/high reward, con informazione chiara nella UI.
- ✅ I personaggi feriti sono ancora utili come lavoratori, specialmente in building avanzati.
- ✅ Il sistema di test (unit + simulation + E2E base) copre i casi chiave senza regressioni su combat/archetypes/balancer.

**Success criteria demo/publishing (V1 Idle Village):**

- La vertical slice dei primi 60 minuti segue il piano FTUE e permette almeno un ciclo run → meta → nuova run.
- Dopo il raggiungimento di questa slice:
  - è ragionevole pubblicare una **demo web/itch.io** per primi tester;
  - si può iniziare a preparare asset (testi, screenshot, clip) per pagina Steam e candidarsi a un futuro Steam Next Fest.
