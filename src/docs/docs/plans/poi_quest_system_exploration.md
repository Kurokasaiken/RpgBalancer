---
title: POI Quest System — esplorazione
type: exploration
status: DRAFT — risposte ricevute, pronto per planner
updated: 2026-08-11
richiesta: R-005
desiderata: nessuna FROZEN corrispondente
---

# POI Quest System — esplorazione

Cosa è questo file: raccogliere l'intento del Director su POI di tipo *quest* —
formazione visiva del cerchio magico, durata da config, quest card cinematografica
a fasi, skill check per fase con Destiny Astrolabe, esito raccolto a mano.

Non è un piano. Non è congelato.

---

## 1. Loop confermato dal Director

1. La spedizione parte (residenti assegnati agli slot, "Avvia").
2. Il tempo scorre. Attorno al POI si **scrive** un cerchio magico (§2).
3. Al raggiungimento di ogni **milestone temporale** si esegue **uno skill check
   per milestone** con il Destiny Astrolabe.
4. Ogni milestone produce un esito (success / failure).
5. Al 100% il cerchio è completo, **si ferma e pulsa**. Il POI è cliccabile.
6. Cliccando si apre la **quest card** al posto del POI detail, con l'**esito
   combinato finale** della quest.
7. La card si chiude con un pulsante **"Raccogli ricompense"** — non si chiude da
   sola, il giocatore deve poter leggere cosa è successo.

**Visibilità (confermato):** lo skill check **non interrompe** il gioco. Il cerchio
si forma in background sulla mappa. Il giocatore vede cosa succede nella quest
**solo se ha aperto** il detail / la quest card.

**Sostituzione del detail (confermato):** da quando la spedizione è partita, cliccare
sul POI apre la **quest card**, non il POI detail.

---

## 2. Magic circle formation — comportamento visivo (verbatim del Director)

Riferimento artistico: Frieren — formazione del cerchio magico, scritte arcane
che si materializzano carattere per carattere.

> The magic circle must NOT exist at the beginning.
> There are no pre-existing runes, no visible ring, no faded circle and no symbols
> waiting around the POI. (12 o'clock)
> The area around the POI starts completely empty.
> Then, seemingly out of thin air, individual pieces of magical writing begin to
> materialize.
> These are letters / arcane characters, not decorative runes or independent symbols
> with different shapes. They should look like fragments of an ancient magical
> language: elegant, thin, luminous glyph-like characters forming a continuous
> written inscription.

### Sequenza di formazione

1. **EMPTY STATE** — nulla circonda il POI. Nessun cerchio, nessun anello, nessun glifo visibile.
2. **FIRST CHARACTERS APPEAR** — un singolo carattere si materializza dal nulla.
   Poi un altro a breve distanza. Poi un altro. I caratteri appaiono in sequenza
   lungo una traiettoria circolare attorno al POI, come se una forza invisibile
   stesse scrivendo l'iscrizione direttamente nell'esistenza.
3. **THE INSCRIPTION GROWS** — sempre più caratteri si materializzano. Non fanno
   semplicemente fade-in. Ogni carattere ha una materializzazione molto breve:
   flash/scintilla minima → tratto rapido di energia → il carattere si risolve da
   particelle/luce → glow breve → si stabilizza. Il timing deve dare l'impressione
   di qualcuno che scrive una frase magica attorno al cerchio.
4. **THE CIRCLE IS CREATED BY THE WRITING** — man mano che i caratteri appaiono
   lungo la circonferenza, definiscono gradualmente la forma circolare.
   L'illusione visiva essenziale è: **la scrittura stessa È il cerchio**.
   Non deve esistere un bordo circolare separato sotto il testo. I caratteri
   formano il perimetro esterno attraverso il loro posizionamento.
5. **COMPLETION** — la sequenza raggiunge il punto di partenza. Gli ultimi
   caratteri appaiono e si connettono visivamente con l'inizio dell'iscrizione.
   In quell'esatto momento la formazione diventa un cerchio magico completo, con
   un **impulso di energia più forte**, come se il sistema magico si fosse
   finalmente "agganciato" in posizione.

### Distinzione critica

**NON** implementare come:

```
existing circle → fade in → reveal runes
```

**SÌ** implementare come:

```
NOTHING
   ↓
character appears
   ↓
another character appears
   ↓
more characters appear
   ↓
inscription progressively wraps around POI
   ↓
circular inscription closes
   ↓
COMPLETE MAGIC CIRCLE
```

Lo spettatore deve sentire *"the spell is being written into existence"*, non
*"a circle that was already there is being illuminated"*.

### Stile visivo

Calligrafia magica, non rune fantasy convenzionali. I caratteri sono: sottili,
eleganti, luminosi, leggermente eterei, di forma variata ma appartenenti
chiaramente alla stessa lingua scritta, disposti lungo la circonferenza,
leggermente irregolari durante la formazione, perfettamente risolti a cerchio
completo.

L'animazione deve sembrare mistica, deliberata e potente — **non** una animazione
di loading UI.

### Invarianti derivate

- Partenza a **ore 12**.
- **Dove si è accesa, la luce rimane accesa**; il resto non è visibile.
- **Niente binari**: nessuna traccia, guida o anello di sfondo che preannunci il percorso.
- Il cerchio **non ruota**: si scrive.
- A completamento: **stop + pulsazione**, stato cliccabile.
- Linguaggio visivo del progetto: **"si riempie di luce"** (non si consuma).

---

## 3. Quest card cinematografica — interfaccia richiesta

Forma: **rettangolo stretto e lungo, stile cinematografico**.

Contenuto:
- immagine di background
- bordo
- titolo
- descrizione breve
- in basso una **"rope" stile Hearthstone** — nel linguaggio del nostro progetto:
  **si riempie di luce** nel tempo che la quest impiega a completarsi
- in basso, **un riquadro per ogni fase della quest** (numero variabile, dipende
  dalla quest), con: un'icona, se la fase è stata affrontata o no, e con quale esito
- pulsante **"Raccogli ricompense"** per chiudere

### Comportamento "Raccogli ricompense" (per quest)

Questo è un POI di tipo **quest** — ha comportamento specifico di raccolta:
- Al click: residenti escono dal POI, tornano nel roster.
- Le ricompense si applicano **solo** al collect (non vengono assegnate prima).
- Il cerchio magico si dissolve.
- Il POI torna allo stato pre-assegnazione (non scompare).

**Nota:** altri tipi di POI hanno comportamenti diversi:
- Alcuni POI scompaiono dopo la raccolta.
- I POI job/allenamento hanno cicli automatici e **auto-raccolgono** le ricompense
  ogni N tick definiti da config — senza passare per "Raccogli ricompense".
- La famiglia POI deve supportare tutti questi comportamenti tramite config.

---

## 4. Cosa esiste già nel repo

### 4.1 Componente card — `QuestChronicle` (≈90% di quanto richiesto)

`src/ui/idleVillage/components/QuestChronicle.tsx`

Già presente:
- cornice dorata intagliata con noise, bevel, ornamenti angolari
- pannello cinematografico **21/9** con immagine di background e vignette
- eyebrow "Quest Chronicle" + titolo
- **progress bar segmentata per fase** (una tacca per fase, riempimento per fase)
- **una card per fase** con icona, medaglione, stato
  `locked | active | success | failure`, checkmark su successo, pulsazione su
  fase attiva, rischi `% injury` / `% death`
- sidebar "Journal" con narrativa di fase e lore drop
- **overlay di esito finale** (`victory` / `defeat`) con label, sublabel, icona
- badge di stato board (success / failure / pending)

Manca:
- la **rope** (oggi progress bar piatta) → restyling come "si riempie di luce"
- il pulsante **"Raccogli ricompense"**
- il cablaggio con il time engine e con il Destiny Astrolabe
- la **animazione Astrolabe** visibile dentro la card quando una milestone scatta
  (con possibilità di spendere consumabili prima che parta)

Non è ancora un frozen kit (non esiste `questChronicleKit`).

### 4.2 Modello di dominio — già completo

`src/balancing/config/idleVillage/types.ts`

- `QuestBlueprint` — `id`, `name`, `activityId`, `difficulty`
  (`story | skirmish | dangerous | heroic`), `rewards`, `telemetry`, `phases[]`
- `QuestPhase` — `id`, `title`, `type`, **`durationValue`**, **`durationUnits`**
  (`ticks | hours | days`), `requirements`, `successEffects`, `failureEffects`,
  `copy`, `icon`, `riskProfile`
- `QuestPhaseType` — `check | fight | stealth | trap | explore | dialogue | branch | timedChoice`
- `TrialPhaseRequirement` — **`skillCheckId`**, **`difficultyLabel`**,
  **`requiredStatTags`** ← punto di innesto per "la difficoltà della quest legata
  allo skill check e data come input"
- `QuestPhaseRiskProfile` — `injuryChance`, `deathChance`, `fatigueCost`, `threatLabel`
- `QuestState` — `blueprintId`, `currentPhaseIndex`, `status`, `phaseResults[]`
- `QuestPhaseResult` — `phaseId`, `result: success | failure`, `timestamp`, `notes`

Config: `src/balancing/config/idleVillage/quests/questBlueprints.ts` (+ schema).

**Nota divergenza Q2 (confermata a codice):** `quest_city_rats.durationFormula = '3'`
(secondi, valore da test sandbox), mentre la somma delle fasi del blueprint è
`2h + 3h + 1h = 6h`. Non sono equivalenti — le due sorgenti usano unità diverse.
**Le fasi (`QuestPhase.durationValue/durationUnits`) sono l'autorità di design**;
`durationFormula` è un valore di convenienza per il sandbox. Il timer del cerchio
usa la somma delle fasi come sorgente canonica. `durationFormula` va aggiornato
a parità o ignorato per i POI quest.

### 4.3 Skill check — già parametrizzabile

`src/ui/idleVillage/components/DestinyAstrolabeComponent.tsx`

```ts
interface DestinyAstrolabeProps {
  skills: DestinyAstrolabeSkill[];   // skill da testare con difficoltà individuali
  criticalFailChance?: number;
  woundedChance?: number;
  deathChance?: number;
  onComplete?: (result: DestinyAstrolabeResult) => void;
  autoStart?: boolean;
  forcedVerdict?: DestinyAstrolabeResult['verdict'];
}
```

Versione canonica per le quest: **V1** (`/minimal-destiny-astrolabe`), quella
citata dal Director.

Input stat: **somma delle stat dei residenti** presenti negli slot della quest,
filtrate per `requiredStatTags` della fase.

Prima del lancio automatico dell'astrolabe il giocatore deve poter **spendere
consumabili**. L'astrolabe si avvia poi automaticamente.

L'animazione è **visibile** dentro la quest card quando il giocatore ha la card
aperta.

### 4.4 Day/night — componente visivo esistente

- `src/ui/idleVillage/components/minimal/DayNightPOI.tsx`
- `src/ui/idleVillage/components/minimal/DayNightPoiSkin.tsx`
- `src/ui/idleVillage/skins/dayNightPoiSkinConfig.ts`
- pagina di riferimento: `/minimal-time-daynight-integration`
  (`TimeDaynightIntegrationPage.tsx`)

Sul time engine, `clockKit` espone `ClockWidget` (visuale) e `TimeEngineStrip`
(controlli). La pagina `/poi-quest-detail-roster-time-clock` monta oggi solo la
striscia di controlli: **manca il componente visivo day/night** = `DayNightPOI`.

---

## 5. Risposte alle domande (ricevute dal Director)

### Q1 — Spaziatura delle milestone ✅
**Equispaziate**: 25% / 50% / 75% / 100% della durata totale.

### Q2 — Sorgente della durata totale ✅
Il Director ritiene le due sorgenti equivalenti, **ma a codice non lo sono**:
- `quest_city_rats.durationFormula = '3'` (secondi, test sandbox)
- `sum(phases) = 2h + 3h + 1h = 6h`

**Decisione:** il timer usa `sum(QuestPhase.durationValue)` convertita in ms tramite
le `durationUnits`. `durationFormula` va aggiornato a parità per le quest, oppure
ignorato — non può essere la sorgente perché è in secondi mentre le fasi sono in ore.

### Q3 — Accoppiamento al time engine ✅
**Sì**: tutti gli elementi della pagina si collegano al time engine (velocità, pause).
Le milestone si misurano in tempo reale scalato dalla velocità corrente del clock.

### Q4 — Input dello skill check ✅
**Somma delle stat dei residenti** presenti negli slot, filtrate per
`requiredStatTags` della fase corrente.

### Q5 — Versione dell'Astrolabe ✅
**V1** (`/minimal-destiny-astrolabe`), quella attualmente canonica.

### Q6 — Astrolabe visibile o solo esito ✅
**L'animazione è visibile** dentro la quest card se la card è aperta.
**Prima** del lancio: il giocatore deve avere modo di **spendere consumabili**.
L'astrolabe parte automaticamente dopo quel momento.

### Q7 — Fallimento intermedio ✅
- Ogni fase può produrre: ferite, morte, modificatori di loot.
- Il fallimento di una fase **non interrompe automaticamente la quest**.
- **Il giocatore può interrompere manualmente** la quest (serve un controllo esplicito).
- Se un eroe muore in una fase, le fasi restanti continuano con i superstiti (o
  con penalità da slot vuoti).

### Q8 — Direzione della rope ✅
**Si riempie di luce** — il linguaggio visivo del progetto è "spento → pieno",
non "pieno → si consuma". La rope parte vuota/spenta e si illumina progressivamente.

### Q9 — Raccogli ricompense ✅
Vedi §3 sopra. La quest è un POI speciale: raccolta manuale, residenti tornano
nel roster, cerchio si dissolve. Altri tipi di POI hanno comportamenti diversi
(scomparsa, cicli automatici).

### Q10 — Perimetro del lavoro ✅
**Modifica la pagina esistente** `/poi-quest-detail-roster-time-clock`
(quella attualmente non funzionante).

### Q11 — Glifi e rendering ✅ (rinviato a task separato)
Il Director ha **separato i due compiti**:
- **Task corrente** (POI quest system): magic circle come timer, quest card, astrolabe.
- **Task separato** (POI reskin): ActionHalo → nuovo halo skin, nuovo body medaglione,
  sistema condiviso per tutta la famiglia POI.

I due task condividono il vincolo architetturale: tutto deve essere **portabile
con una riga** (frozen kit) e valido per tutti i POI della famiglia.

### Q12 — Day/night ✅
**`DayNightPOI`** — quello mancante dalla pagina.

---

## 6. Vincolo architetturale — famiglia POI

Il Director ha enunciato un vincolo trasversale che vale per questo task e per
il task POI reskin:

> Tutte le cose che stiamo implementando (time engine, connessione al POI detail,
> slot interni che governano il comportamento del POI, assegnazione residenti da
> slot/POI, bloom, ecc.) devono essere valide per tutti i POI della famiglia,
> non solo per questo POI quest.
> Tutto deve essere portabile con una linea di codice e freezabile.

**Implicazioni per il piano:**
- Il cerchio magico e il timer non sono componenti ad-hoc: diventano comportamento
  della famiglia POI, attivabile da config (`cardKind: 'quest'`).
- I frozen kit prodotti qui devono essere importabili da qualsiasi POI con una riga.
- Il task POI reskin dovrà agganciare gli stessi hook.

---

## 7. Coerenza con i pillar

| Elemento richiesto | Pillar | Nota |
| --- | --- | --- |
| Cerchio magico come timer | 2 — Cultist Sim (halo come timer leggibile) | Estende l'halo: da anello che si riempie a iscrizione che si scrive |
| Quest = carta con requisiti e fasi | 3 — Lords of Waterdeep | Già previsto in tabella §2 di `DESIGN_PILLARS.md` |
| Skill check come carta dell'esito | 2 — Cultist Sim | `DESIGN_PILLARS.md` §2 segna "Skill check resolution pannello" come **MANCA** |
| Esito da raccogliere a mano | 2 — Cronaca degli esiti | La cronaca esiste (`QuestChronicle`), manca il gesto di raccolta |
| Budget di rendering del cerchio | 1 — World Surface | Niente effetti non profilati; DOM/CSS per statico, Pixi per dinamico |
| Famiglia POI condivisa | trasversale | Tutti i POI devono ereditare i comportamenti; frozen kit obbligatorio |
