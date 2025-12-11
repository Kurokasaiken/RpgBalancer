# Idle Incremental RPG – Idle Village

**Status:** Vision Document (Phase One – Product Direction)  
**Related Docs:**
- [MASTER_PLAN.md](MASTER_PLAN.md)
- [plans/idle_village_plan.md](plans/idle_village_plan.md)
- [plans/idle_village_tasks.md](plans/idle_village_tasks.md)

---

## 1. High Concept

**Elevator pitch:**  
Un *Idle Incremental RPG* in cui gestisci un piccolo villaggio di combattenti e lavoratori intorno a un **fondatore rarissimo**. Il tempo scorre solo quando il gioco è aperto. Alleni il protagonista, mandi la "manovalanza" a lavorare o a rischiare la pelle in quest, difendi il villaggio da ondate periodiche e, quando inevitabilmente tutto crolla, **riparti più forte** grazie a meta-upgrade persistenti.

**Fonti di ispirazione dichiarate:**
- **Punch Club** – struttura giornaliera train/fight/work/sleep, gestione di energia/fatica e pressione economica.
- **Cultist Simulator** – worker placement a carte+timer, attività rappresentate come slot/"verbs" con token che girano.
- **They Are Billions** – ondate periodiche che testano la tua preparazione, progressiva escalation di difficoltà.

**Scope per Phase One (Phase 12 – Idle Village):**
- Combat **solo 1v1** (riuso engine esistente).
- Nessun input durante il combattimento: decisioni **pre-fight**.
- Spell usate solo in combat (per ora).  
- Meta-game centrato su **villaggio, jobs, quest, ondate**, e **meta-progression tra run**.

---

## 2. Product Goals & Target Platforms

### 2.1 Obiettivi di Prodotto

- **Longevità:** gioco pensato per essere giocato per **mesi**, con loop che restano interessanti grazie a meta-progression e escalation di richieste (quest, raid, waves).
- **Depth first:** non è un semplice clicker: riutilizza il combat/balancing engine complesso del progetto, ma lo incapsula in un meta-gioco accessibile.
- **Config-First:** tutte le definizioni di jobs, quest, ondate, edifici, risorse, difficoltà vivono sotto `src/balancing/config/idleVillage/*`.
- **Phase One chiara:** Idle Village è la **prima incarnazione di prodotto** dell'ecosistema RPG Balancer.

### 2.2 Piattaforme Target

- **Mobile (PWA / app ibrida):**
  - Sessioni brevi ma frequenti.
  - UI compatta Gilded Observatory, ottimizzata per touch.
- **Desktop (Steam / standalone):**
  - Obiettivo: prodotto abbastanza interessante da **stare in vetrina su desktop**.
  - Stessa base di gameplay, ma:
    - UI arricchita (dashboard, grafici, log dettagliato, configurazione avanzata).
    - Possibile integrazione con account Steam per **continuare a giocare mentre fai altro**.

---

## 3. Player Fantasy & Experience

### 3.1 Fantasy

Il giocatore è il **mentore/stratega** di un villaggio di combattenti in un mondo ostile:
- Ha un **fondatore eroico** (stat da top 1%) che rappresenta l'investimento principale.
- Attorno a lui gravita una popolazione di **lavoratori mediocri**, utili principalmente per jobs, produzione di risorse e missioni ad alto rischio.
- Il mondo è ciclico: ondate di nemici e difficoltà crescenti renderanno **inevitabile il collasso**. Il giocatore deve **abbracciare la sconfitta** come parte del loop, pianificando meta-upgrade per la prossima run.

### 3.2 Esperienza Attesa

- **Early game:**
  - Pochi personaggi, poche risorse, pressione forte su cibo/oro.
  - Il fondatore non è ancora pronto per le quest "serie": fa jobs light (es. combattere i ratti in città) o piccoli combattimenti di allenamento.
  - I lavoratori scarsi fanno jobs base (cibo/gold) e occasionalmente vengono mandati in quest rischiose.

- **Mid game:**
  - 10–20 **lavoratori specializzati** in jobs specifici, che non tocchi quasi più.
  - ~5 **eroi** attivi che possono affrontare quest serie.
  - Iniziano le **ondate** che richiedono che **tutti** i personaggi abbiano un equip decente.

- **Late game:**
  - Quest e raid che richiedono party ampi (es. 5 personaggi, poi fino a ~20 in future fasi).
  - Meta-progression amplificata: molteplici edifici di start buff, combinazioni di eredi, varianti di run.

---

## 4. Core Pillars

1. **Founder raro, villaggio mediocre**  
   Il protagonista è statisticamente raro (≈1% rispetto alla popolazione generica). La maggior parte dei personaggi è "bassa manovalanza" utile per jobs, cannon-fodder e worker placement.

2. **Lose to Progress**  
   Morte del protagonista e collasso del villaggio **non sono fallimento definitivo** ma parte del design: sbloccano edifici/upgrade persistenti che migliorano la run successiva.

3. **Jobs & Quest come driver di storia personale**  
   Jobs formano l'ossatura economica quotidiana; quest e raid sono i momenti di picco, dove rischi personaggi e costruisci storie emergenti.

4. **Ondate periodiche come check di preparazione**  
   Come in They Are Billions, ondate di nemici verificano periodicamente se la tua build/villaggio regge la pressione. Non puoi ignorare la difesa.

5. **Idle ma non passivo**  
   Il gioco procede mentre è aperto. L'ottimizzazione è nel **decidere cosa far fare a chi, e quando**, non nello spam di input micro.

6. **Config-First & Weight-Based**  
   Tutti i numeri di dominio (tempo, reward, injury chance, death chance, spawn quest, ondate) sono **dichiarati in config**; gli engine li leggono e nulla è hardcodato nell'UI.

---

## 5. Struttura di Gioco: Run, Giorni, Collasso

### 5.1 Modello di Run

- Una **run** = la vita di un villaggio dal **primo giorno** fino al collasso:
  - Morte del fondatore,
  - Distruzione del villaggio da parte di un'ondata,
  - O fallimento economico (impossibilità di mantenere popolazione).

- Alla fine della run:
  - Alcuni progressi vengono persi (personaggi, equip, risorse correnti).
  - Alcuni progressi restano in meta (edifici permanenti, sblocchi, piccoli bonus start).

### 5.2 Giorno come Loop Principale

- Un "giorno" in-game è composto da **N unità di tempo** (configurabili, es. `dayLengthInTimeUnits`).
- Loop di giornata:
  1. Assegni persone a **jobs** (in città, dentro o fuori le mura) e **quest**.
  2. Fai avanzare il tempo (tick/advanceTime) e risolvi le attività.
  3. Gestisci injury/fatica, cibo, economia.
  4. Verifichi avvicinarsi di un'ondata (se previsto) e pianifichi di conseguenza.

### 5.3 Collasso & Restart

- Il collasso può avvenire quando:
  - il fondatore muore **senza possibilità di resurrection** (per quella run),
  - il villaggio non riesce a respingere un'ondata chiave,
  - oppure la situazione economica rende impossibile proseguire (TBD: regole precise).

- In tutti i casi, il gioco:
  - Valuta i progressi (giorni sopravvissuti, quest completate, ondate respinte, ecc.).
  - Sblocca o potenzia **edifici meta** che migliorano la partenza delle run future.

---

## 6. Sistemi di Gioco Principali

### 6.1 Personaggi: Founder, Worker, Eroi

- **Founder (Protagonista):**
  - Generato come **rarità 1%** rispetto alla distribuzione di stat della popolazione.
  - Ha accesso potenziale a equip e spell migliori, ma **all'inizio è comunque debole** rispetto alle quest serie.
  - Può morire, ma:
    - esistono job/quest/spell che riducono drasticamente il rischio,
    - possono esistere consumables specifici per ridurre le chance di morte o per resuscitare.

- **Worker (Manovalanza):**
  - Stat mediocri, perfetti per jobs e attività di supporto.
  - Alcuni possono diventare **specializzati** (es. raccoglitore d'oro, taglialegna, farmer) tramite XP di job separata dal combat XP.
  - Possono essere mandati in quest ad alto rischio come "vittime" calcolate.

- **Eroi (Altri PG forti):**
  - Rari da reclutare; servono molte ore di gioco per trovare altri PG della stessa levatura del founder.
  - Mid/late game: obiettivo avere ~5 eroi attivi per quest/raid a 5.

### 6.2 Stats & Combat Scope

- Combat **solo 1v1** in Phase One, basato su:
  - stat e sistemi già definiti nel progetto (HP, damage, evasione, ecc.),
  - engine esistente (`1v1` + moduli simulation).
- Nessun input in-fight:
  - Il giocatore prepara il combattimento (chi mandare, equip, spell loadout, stance se introdotte in futuro),
  - poi guarda/lascia che il sistema simuli.

### 6.3 Attività & Time Engine

- Attività principali modellate in `IdleVillageConfig.activities`:
  - `job_city` (es. combattere ratti, fare lavori manuali),
  - `job_outside` (es. esplorazione fuori mura),
  - `quest` (missioni vere e proprie),
  - in futuro: `training`, `shop`, ecc.

- Il **TimeEngine** (`advanceTime`, `scheduleActivity`) gestisce:
  - pianificazione delle attività per uno o più personaggi,
  - risoluzione quando `currentTime` supera `endTime`,
  - marcatura dei personaggi come `available/away/injured/exhausted`.

### 6.4 Jobs & Worker Placement

- **Jobs in città (low risk):**
  - Es. "Combatti i ratti in città":
    - dà un po' di XP combat al founder o a chi viene assegnato,
    - genera pochi gold/food,
    - introduzione soft al rischio di injury.
  - Altri jobs puramente economici: legna, pietra, lavoro al porto, ecc.

- **Jobs fuori dalle mura (medium risk):**
  - Es. `esplora periferia`:
    - dà XP,
    - può presentare scelte (combattere / usare consumables / scappare – da modellare come outcome di quest speciali o mini-eventi),
    - **aumenta la probabilità di spawn di quest "serie"** in quell'area.

- **Specializzazione Worker:**
  - Ogni job può avere una **job XP** separata che aumenta l'efficienza del personaggio in quel ruolo.
  - La job XP NON aumenta la potenza in combat diretta, ma la capacità di produrre risorse.

### 6.5 Quest (Dispatch-Style)

- Le quest sono definite in config (`questConfig`/`activities` con tag `quest`), con:
  - `level`, `dangerRating`, `rewardProfile`, `minPartySize`, `maxPartySize` (anche se Phase One parte in 1v1, i campi supportano il futuro 5+).
- Le quest:
  - **spawnano** in base a tabelle/weights in config,
  - hanno una **durata** (andata, missione, ritorno),
  - hanno una **deadline**: se non accettate in tempo, **spariscono**.

- Loop quest:
  1. Il gioco genera alcune quest disponibili attorno al villaggio.
  2. Il giocatore sceglie **chi mandare**, con quali equip/spell.
  3. L'engine valuta match party ↔ requisiti e lancia il combat (se `combat quest`).
  4. In base a outcome e parametri di pericolo, assegna reward, injury, death.

### 6.6 Ondate & Difesa del Villaggio

- Periodicamente (ogni `N` giorni / segmenti, definito in config) arriva un'**ondata**:
  - tutti i personaggi disponibili vengono coinvolti nella difesa,
  - l'esito dipende dalla somma di equip, stat, difese del villaggio.

- Obiettivo design:
  - **rendere importante equipaggiare anche i worker**, non solo gli eroi,
  - creare momenti di forte tensione: se l'ondata passa, il villaggio collassa → nuova run.

- Dettagli quantitativi (frequenza ondate, scaling) sono demandati a:
  - `IdleVillageConfig` (curve di difficoltà),
  - moduli di simulazione dedicati.

### 6.7 Risorse & Economia

- Risorse base (configurabili, ma esempi V1):
  - `gold`: valuta principale (recruit, equip, alcuni upgrade).
  - `food`: mantenimento popolazione.
  - `materials`: costruzione/upgrades edifici.

- **Upkeep e pressione economica:**
  - Ogni personaggio costa cibo/oro a intervalli regolari.
  - Mancanza di cibo → malus (più fatica, più injury), non necessariamente morte immediata.

### 6.8 Injury, Death, Resurrection

- **Injury:**
  - diveri livelli (light/moderate/severe) con malus su stat e su cosa il personaggio può fare (quest vs jobs).
  - feriti restano utili nei jobs, soprattutto in building avanzati che riducono le penalità.

- **Death:**
  - è sempre possibile in quest/raid ad alto rischio.
  - deve essere **telegrafata molto chiaramente** nella UI.

- **Mitigazione:**
  - consumables (pozioni, talismani) che riducono la probabilità di morte in una singola quest.
  - jobs/quest speciali o edifici che offrono **resurrezioni limitate** (costo elevato).

### 6.9 Meta-Progression: Edifici & Eredi

- Dopo una run conclusa (collasso):
  - il giocatore guadagna una valuta/meta-punti (esplicita o implicita) da spendere in **edifici permanenti**.

- Esempi di edifici meta:
  - **Santuario degli Eredi:** permette che un personaggio sopravvissuto o segnato venga usato come "figlio"/erede nella run successiva (riparte da livello 1 ma con piccoli bonus).
  - **Magazzino Antico:** start run con **più risorse** (gold, food, materials).
  - **Armeria Sacra:** possibilità di iniziare con 1 equip di qualità.
  - **Biblioteca degli Incanti:** possibilità di iniziare con 1 spell pre-sbloccata.

- Meta-upgrade devono essere:
  - **sempre più costosi** man mano che ne accumuli (curva sub-esponenziale o modulata via config),
  - pensati per **non azzerare la tensione** delle run future.

---

## 7. Progressione: Early / Mid / Late Game

### 7.1 Early Game (Prime Ore)

- Pochi personaggi (founder + 1–3 workers scarsi).
- Jobs principali:
  - ratti in città (combatti per pochi gold/XP),
  - lavoretti base per cibo/oro.
- Goal:
  - mantenere il villaggio in vita,
  - accumulare abbastanza XP/equip su founder per tentare la **prima quest vera**.

### 7.2 Mid Game

- 10–20 lavoratori, ognuno assegnato a jobs ben definiti.
- ~5 eroi che possono affrontare:
  - quest con party (in futuro),
  - ondate sempre più pesanti.
- Iniziano a comparire:
  - meta-upgrade significativi,
  - ondate che richiedono equip distribuito su molti personaggi.

### 7.3 Late Game (peruna singola run)

- Villaggio quasi "industrializzato":
  - catene di jobs ottimizzate,
  - molti edifici di supporto.
- Raid/quest di alto livello che mettono alla prova 5+ eroi.
- Ondate che possono comunque spazzare via tutto se sottovalutate.
- Forte tentazione di "spingere oltre" invece di collassare volontariamente → design di risk/reward.

---

## 8. Allineamento con Architettura Esistente

### 8.1 Moduli Chiave

- `src/balancing/config/idleVillage/*`  
  Tipi, schema Zod, default config, store per l'intero meta-game Idle.

- `src/engine/game/idleVillage/*`  
  TimeEngine, JobResolver, QuestResolver, InjuryEngine, IdleVillageEngine.

- `src/ui/idleVillage/IdleVillagePage.tsx`  
  UI prototipale stile Cultist Simulator (token/attività su mappa, jobs/quest list, DnD residents → activities).

### 8.2 Filosofia Config-First Applicata

- Tutte le scelte di bilanciamento per Idle Incremental RPG devono:
  - vivere in `IdleVillageConfig` (jobs, quest, mapSlots, globalRules, variance, resources, founders, buildings),
  - essere manipolabili idealmente da un **tab di configurazione Idle Village** (non ancora definito in dettaglio in questo doc, ma previsto in `idle_village_plan.md`).

- L'UI:
  - legge `config` e `VillageState`,
  - chiama solo funzioni pure (`scheduleActivity`, `tickIdleVillage`, resolver vari),
  - **non reimplementa logiche di rischio, reward, injury, spawn**.

### 8.3 Relazione con Altre Fasi

- **Phase 10 (Config-Driven Balancer):**
  - definisce il modo "giusto" di fare config-driven per stats, weights, formule.
  - Idle Incremental RPG deve considerare Balancer come **fonte di verità** per le stat di combat.

- **Phase 10.5 (Stat Stress Testing):**
  - aiuta a tarare i valori delle stat prima che vengano usate intensivamente nell'Idle game.

- **Phase 11 (Tactical Missions):**
  - fornisce concetti per missioni/quest più complesse; Idle Village può riusare concetti di missioni ma con risoluzione 1v1 e layer grid-based rimandato.

---

## 9. Open Questions / To Refine

Queste aree restano da definire meglio in piani successivi o doc specifici:

1. **Frequenza esatta delle ondate**  
   - Ogni quante unità di tempo/giorni? Fisso o random dentro un range?  
   - Differenziate per regioni/biomi?

2. **Dettaglio meta-currency**  
   - Singola valuta meta o più categorie (Fede, Ricordi, Relitti...) che sbloccano diversi rami di edifici?  
   - Conversione tra performance in run e punti meta.

3. **Run opzionale vs forzata**  
   - Puoi "ritirarti" volontariamente e chiudere la run prima del collasso? Con quali bonus/penalità?

4. **Party-based combat**  
   - Quando e come introdurre 2v2, 3v3, 5v5 in Idle Village (Phase successiva).  
   - Quanto riuso diretto dal sistema Phase 9 (Combat System Expansion).

5. **Narrazione**  
   - Manteniamo sandbox puro o introduciamo una loose main quest (stile Punch Club) in Phase successive?

Queste domande **non bloccano** Phase One, ma vanno considerate nel momento in cui si passa da piano di implementazione (Phase 12) a pitch di prodotto e vertical slice.

---

## 10. Collegamenti

- **Master Plan:**  
  [MASTER_PLAN.md](MASTER_PLAN.md) – questa visione è referenziata nella sezione *Future Direction* come "Idle Incremental RPG – Idle Village (Phase 12, Product Phase One)".

- **Implementation Plan:**  
  [plans/idle_village_plan.md](plans/idle_village_plan.md) – dettaglia sub-fasi tecniche (TimeEngine, JobResolver, QuestResolver, InjuryEngine, UI, testing).

- **Task Checklist:**  
  [plans/idle_village_tasks.md](plans/idle_village_tasks.md) – elenco eseguibile delle attività per realizzare questa visione a livello di codice.
