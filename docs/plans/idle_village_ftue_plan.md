# Idle Incremental RPG – FTUE & First 60 Minutes Plan

**Status:** Draft v0.1  
**Scope:** Struttura dei primi 30–60 minuti di gioco (prima sessione) per l'*Idle Incremental RPG*, valida sia per web/mobile sia per demo PC (itch.io, Steam Next Fest).

---

## 1. Obiettivi della Prima Sessione

Entro ~60 minuti di gioco il giocatore deve:

- **Capire la fantasy:** mentore di un villaggio destinato a collassare; run cicliche.
- **Capire il core loop:** assegnare → far passare il tempo → raccogliere → migliorare → preparare la prossima run.
- **Sperimentare rischio e conseguenze:** almeno una injury significativa, un quasi-collasso o piccolo fallimento.
- **Vedere meta-progression:** fine di una mini-run + spesa di 1–2 punti meta in edifici/upgrade permanenti.
- **Non essere spinto a pagare:** nessuna richiesta di acquisto esplicita nei primi 60 minuti; solo eventuali teaser soft.

Questa struttura deve funzionare sia per la build web/mobile, sia come **vertical slice** per una demo PC.

---

## 2. Timeline dei Primi 60 Minuti (High-Level)

### 0–5 minuti: Hook & Chiarezza

- Mostrare subito:
  - Founder + 2–3 worker scarsi.
  - Villaggio minimale (1–2 building base, pochi slot jobs).
- Spiegare in UI (testo breve, non modale invasiva):
  - "Il tuo villaggio è destinato a collassare; la forza sta nelle run successive".
  - "Il tempo avanza solo quando il gioco è aperto".
- Obiettivo giocatore: fare **almeno 1 azione significativa** (es. assegnare qualcuno a un job).

### 5–15 minuti: Primo Giorno Completo

- Permettere di:
  - Assegnare worker a jobs base (cibo/oro).
  - Mandare il Founder a un job sicuro o a una micro-quest facile.
  - Far avanzare il tempo e vedere reward + consumo di risorse.
  - Vedere in azione il **verb di sistema Hunger/Time**:
    - anello che rappresenta il ciclo del giorno,
    - a fine giornata icona cibo che “vola” dalla barra risorse verso il verb con `-X` e reset del ring.
- Fine segmento:
  - Sbloccare **un primo upgrade evidente** (es. building livello 1, +1 cap housing, +1 worker).
  - Rendere chiaro che upgrade e configurazioni sono persistenti via meta (config-first).

### 15–30 minuti: Primo Rischio Reale

- Introdurre quest con **danger rating** visibile (colori + testo chiaro:
  - chance sensibile di injury.
  - death possibile ma bassa e chiaramente indicata solo per quest più dure.
- Mostrare una injury significativa:
  - personaggio marcato `injured`, ancora utilizzabile come worker.
- Introdurre un indicatore di **ondata futura** o evento critico:
  - es. "Tra N unità di tempo arriverà una minaccia maggiore".

### 30–60 minuti: Mini-Run Completa & Meta

- Portare il giocatore verso un **mini-collasso controllato**:
  - Founder che muore in una quest rischiosa **oppure** fallimento di una difesa.
- Dopo il collasso:
  - Schermata di **run summary**: giorni sopravvissuti, quest completate, injury/death, risorse prodotte.
  - Assegnare 1–2 **punti meta** (o valuta meta) da spendere in edifici permanenti (es. più risorse iniziali, equip di partenza, cap villaggio leggermente più alto).
- Avviare una **seconda run** con:
  - un inizio visibilmente migliore (più risorse, building sbloccato, ecc.).

Questa è la struttura minima richiesta per una demo significativa: il giocatore deve sperimentare almeno **un ciclo completo run → meta → nuova run**.

---

## 3. Implicazioni per IdleVillageConfig & Engine

Senza entrare nei dettagli implementativi (coperti in `idle_village_plan.md`), il FTUE implica:

- **Config dedicata per early game:**
  - jobs iniziali semplici e sicuri,
  - 1–2 quest early a basso livello, ma con rischio injury > 0,
  - curva di costi/upkeep molto morbida per la prima run.
- **Meta-upgrade a sblocco rapido:**
  - 1–2 edifici meta molto economici che possono essere acquistati dopo la prima run.
- **Tempi delle ondate/eventi:**
  - prima ondata/evento critico programmata per avvenire entro i primi 30–45 minuti di gioco medio.

Questi elementi vanno modellati in `IdleVillageConfig` (regole globali, curve di difficoltà, building/meta-upgrade, quest early) e verificati via simulazioni.

### 3.1 Mappatura FTUE → Config (0–60 minuti)

Per evitare di hardcodare la prima ora dentro l'engine o la UI, la timeline FTUE va vista come **preset di config**. A livello concettuale:

#### 0–5 minuti – Hook & Setup

- **Popolazione iniziale:**
  - numero e ruolo dei personaggi di partenza (Founder + 2–3 worker scarsi) definiti in config, non nel codice.
- **Villaggio di base:**
  - elenco dei building disponibili all'avvio (1–2 strutture minime) e numero di slot job attivi.
- **Velocità del tempo:**
  - parametri che definiscono quanto dura un "giorno" di gioco in questa fase, così che il primo ciclo si chiuda in pochi minuti reali.

#### 5–15 minuti – Primo giorno completo

- **Jobs early-game:**
  - set di jobs sicuri (cibo/oro/legna) marcati come early, con rese e costi tarati per non punire la prima run.
- **Prima micro-quest facile:**
  - almeno una quest a rischio quasi nullo che fa vedere il sistema senza ancora mettere in gioco injury/death seri.
- **Upgrades visibili ma economici:**
  - 1 piccolo upgrade sbloccabile alla fine di questo segmento (es. housing +1, nuovo slot job), con costo configurato per essere raggiungibile.

#### 15–30 minuti – Primo rischio reale

- **Quest con danger rating:**
  - pool di quest early con rischio injury > 0, death molto bassa ma non nulla;
  - i loro parametri di rischio e reward vivono in config (niente percentuali hardcodate nello skill check).
- **Injury come stato persistente:**
  - regole per come un personaggio injured continua a lavorare (penalty, job consentiti) definite a livello di regole globali.
- **Teasing di una ondata/evento:**
  - programmazione di un evento critico (wave/malattia/carestia) da far cadere, in media, entro questo intervallo di tempo.

#### 30–45 minuti – Mini-collasso controllato

- **Curva di difficoltà early:**
  - parametri che rendono probabile un collasso o quasi-collasso verso questo punto, senza impossibilitare i giocatori più bravi.
- **Run summary & conversion meta:**
  - regole che convertono la performance della run (giorni, quest, risorse) in 1–2 punti/meta resources.
- **Catalogo meta-upgrade iniziali:**
  - lista corta di edifici/meta-upgrade sempre disponibili dopo la prima run, con costi bassi per garantire almeno 1–2 acquisti.

#### 45–60 minuti – Seconda run migliorata

- **Setup seconda run:**
  - stato iniziale della nuova run (risorse, building sbloccati, limiti di popolazione) derivato dagli upgrade meta comprati.
- **Nuovi elementi accessibili:**
  - 1–2 jobs/quest/building che esistono in config ma sono gated da meta-upgrade e diventano accessibili solo dalla seconda run in poi.
- **Teaser di sistemi futuri:**
  - elementi presenti nella config (es. district avanzati, eventi di stagione) marcati come locked/late-game, solo mostrati come icona/tooltip.

---

## 4. Demo Strategy (Itch.io & Steam Next Fest)

- **Itch.io / Web Demo:**
  - Deve contenere l'intero ciclo FTUE descritto sopra (run → meta → nuova run).
  - Idealmente durata 30–60 minuti per un giocatore medio.

- **Steam Next Fest:**
  - La demo Steam per SNF può riusare la stessa slice, con:
    - UI leggermente più ricca (log più dettagliato, qualche grafico in più).
  - Obiettivo: portare il giocatore a fine prima mini-run e mostrargli il potenziale di run successive.

La progettazione FTUE andrà raffinata dopo i primi test interni/Itch, ma questo documento definisce il livello minimo di esperienza che la vertical slice deve raggiungere prima di parlare di SNF e di demo ufficiali.

---

## 5. FTUE & Demo – Linee Guida di Dettaglio

Questa sezione traduce linee guida generali su FTUE/demos (mobile + Steam/Next Fest) in vincoli concreti per l'*Idle Incremental RPG*.

### 5.1 Ritmo e Struttura della Prima Sessione

- **Tempo al primo click significativo:**
  - entro **30 secondi** il giocatore deve aver:
    - assegnato almeno 1 worker/founder a un job/quest,
    - visto il tempo avanzare e una prima ricompensa.
- **Nessun blocco testuale troppo lungo:**
  - evitare muri di testo o cutscene iniziali > 15–20 secondi senza input;
  - integrare spiegazioni in tooltip, highlight e piccoli prompt vicino alle azioni.
- **Un sistema alla volta:**
  - nei primi 10–15 minuti introdurre solo:
    - jobs base;
    - una micro-quest facile;
    - indicatore di tempo/consumo risorse;
  - rimandare sistemi avanzati (es. quest complesse, injury severe a catena) a dopo la prima mini-run.

### 5.2 Obiettivi Chiari per D0/D1

- **Obiettivo D0 (prima sessione):**
  - completare almeno una micro-quest;
  - sbloccare 1 piccolo upgrade;
  - vedere almeno un quasi-collasso o injury significativa.
- **Obiettivo D1 (ritorno):**
  - far percepire che:
    - la seconda run parte **meglio**;
    - ci sono scelte meta ancora interessanti (edifici, distribuzione risorse, routing delle quest).
- **Segnalare sempre il prossimo passo:**
  - avere sempre 1–3 "Next goals" visibili (es. prossima quest consigliata, upgrade vicino, evento in arrivo) per ridurre la frizione decisionale.

### 5.3 Demo Length & Telemetria (Itch / Steam)

- **Durata target demo:**
  - mirare a una **median playtime 30–60 minuti** per la demo (in linea con consigli generali Next Fest per giochi di media complessità);
  - il ciclo run → meta → nuova run deve rientrare in questo range per un giocatore medio.
- **Telemetria minima FTUE:**
  - eventi da tracciare (anche solo a livello di log/local analytics iniziale):
    - completato primo job;
    - completata prima quest;
    - prima injury;
    - primo collasso/run summary;
    - spesa primi punti meta;
    - inizio seconda run;
  - da usare per capire dove avvengono i drop-off nelle prime sessioni.
- **Iterazione demo:**
  - usare i dati di median playtime e completamento ciclo per:
    - accorciare segmenti noiosi o confusi;
    - anticipare (o posticipare leggermente) il momento della prima injury/collasso.

### 5.4 Coerenza tra Marketing e FTUE

- **Promessa vs realtà:**
  - ciò che mostri in GIF/clip (villaggio vivo, rischio, collasso, meta) deve essere sperimentabile **entro la prima ora**, non solo nel late game.
- **Niente bait & switch:**
  - evitare trailer che enfatizzano contenuti/sistemi non accessibili nella demo o troppo lontani (>2–3 ore) dalla prima esperienza.
- **Focus sul loop "Manage, Suffer, Rebuild":**
  - in tutte le superfici (pagina itch, pagina Steam, demo) mettere al centro:
    - gestione villaggio;
    - rischi reali (injury/morte);
    - ricostruzione con meta-upgrade.

## 6. Skill Check Stile Dispatch per Quest Pericolose

Obiettivo: separare chiaramente la **fase tempo** (VerbCard) dalla **fase tiro** (skill check stile Dispatch), in modo che il rischio injury/morte sia leggibile, viscerale e collegabile alle stat del Balancer.

### 6.1 Flow di Alto Livello

1. **Schedule**
   - Il giocatore assegna 1+ personaggi a una quest/job pericoloso.
   - L'attività ha: `travelTime` (se fuori città), `taskTime` (durata effettiva missione/combattimento).

2. **VerbCard (fase tempo)**
   - Mostra solo **tempo**:
     - se la quest è fuori villaggio: tempo di viaggio + ritorno;
     - tempo di esecuzione (combattimento/azione).
   - Elementi visibili:
     - ring esterno che avanza (come già in VerbCard);
     - assignees;
     - anteprima rischio injury/morte (percentuali di display);
     - nessun RNG: è solo un conto alla rovescia verso lo skill check.

3. **Fine timer è trigger skill check**
   - Quando il tempo del VerbCard finisce:
     - non si risolve subito la quest;
     - l'engine emette un evento tipo `skill_check_required` con `{ scheduledId, activityId, characterIds }`;
     - lo stato dell'attività diventa `awaiting_skill_check`.

4. **Schermata Skill Check (stile Dispatch)**
   - Si apre una view dedicata (modal/overlay) con un **cerchio centrale**:
     - zona centrale **safe** (scura);
     - corona **gialla** = injury;
     - corona **rossa** = death.
   - Le proporzioni delle zone derivano da un `SkillCheckEngine` (vedi sotto).
   - Vengono mostrati simboli e percentuali:
     - `🩹 35%` per injury;
     - `☠ 5%` per death (solo se > 0);
     - pallino giallo/rosso e/o teschio vicino all'icona per segnalare il rischio.

5. **Risoluzione e rientro nel loop**
   - Lo skill check produce un esito: `safe`, `injury`, `death`.
   - Il personaggio viene "sputato fuori" dalla quest:
     - `safe` → torna `available`, si applicano le rewards;
     - `injury` → entra nella VerbCard Injury (già esistente) con recovery time;
     - `death` → stato `dead`, rimosso dal pool, log evento.
   - La VerbCard della quest viene chiusa / marcata completata.

### 6.2 SkillCheckEngine (Dominio)

Interfaccia concettuale (senza dettagli di formula):

```ts
type SkillCheckChances = {
  safe: number;    // 0–1
  injury: number;  // 0–1
  death: number;   // 0–1, safe+injury+death = 1
};

type SkillCheckOutcome = 'safe' | 'injury' | 'death';
```

- **Input:**
  - `activity` (con `dangerRating`, `skillCheckId`, metadata);
  - `residents[]` con **stat base "umane"** dal Balancer (profilo/archetipo);
  - contesto di villaggio (`currentTime`, fatigue, building bonus come hospital/armatura, ecc.).

- **computeSkillCheckChances(...) → SkillCheckChances**
  - Usa solo stat "umane" del Balancer come base (es. combat, vigor, mobility).
  - Aggrega i contributi di 1+ personaggi (prima persona conta di più, le altre meno).
  - Converte il punteggio in percentuali di esito safe/injury/death.

- **rollSkillCheck(rng, chances) → SkillCheckOutcome**
  - Esegue il tiro vero (una sola volta per skill check);
  - determina se la "pallina" cade in safe, injury o death nel cerchio.

### 6.3 Collegamento alle Stat del Balancer

- Ogni residente di Idle Village deve puntare a un **profilo di stat di Balancer** (archetipo umano base).
- Le stat considerate per lo skill check sono le stesse usate per la **creazione del personaggio umano** nel Balancer (no regole speciali duplicate).
- In futuro:
  - armatura/equip riducono la porzione injury/death del cerchio;
  - requisiti specifici (es. `N` danni per fase) si traducono in modifiche a `SkillCheckChances`.

### 6.4 FTUE & Skill Check

Per il FTUE (prima run):

- Almeno una **quest cittadina sui ratti** deve usare lo skill check Dispatch-style:
  - rischio injury > 0, rischio death piccolo ma visibile;
  - stats iniziali scarse del Founder fanno percepire che mandarlo da solo è rischioso.
- V1 può usare percentuali di rischio "display" da config (`injuryChanceDisplay`, `deathChanceDisplay`) come stub, in attesa della formula definitiva basata sulle stat.
