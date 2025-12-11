# Idle Incremental RPG – FTUE & First 60 Minutes Plan

**Status:** Draft v0.1  
**Scope:** Struttura dei primi 30–60 minuti di gioco (prima sessione) per Idle Village / Idle Incremental RPG, valida sia per web/mobile sia per demo PC (itch.io, Steam Next Fest).

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

Questi elementi vanno modellati in `IdleVillageConfig` (globalRules, curve di difficoltà, building meta, quest early) e verificati via simulazioni.

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
