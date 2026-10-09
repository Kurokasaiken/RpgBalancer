---
title: "RpgBalancer — Quest Generation System (specchietto riassuntivo)"
type: summary-spec
status: PROPOSAL — consolidamento della conversazione di generazione;
  NON ratificato. **Living doc: da aggiornare a ogni decisione futura**
  (richiesta Director 2026-10-10).
source: consolidamento AI della conversazione R-111/R-112/R-113;
  dettagli e classificazione FACT/PROPOSAL/OPEN in
  context/QUEST_GENERATION_ARCHITECTURE.md + ingestions 2026-10-10
related: R-091, R-092, R-105, R-108, R-109, R-111, R-112, R-113,
         OPEN-014, OPEN-015, PLAN-019 (S5),
         QUEST_RULES.md (vincoli canonici), .mw/desiderata.md,
         ingestions/2026-10-09-emotional-mechanics-quest/FINAL-RESOCONTO.md,
         QUEST_GENERATION_ARCHITECTURE.md, QUEST_IMPRINTS.md,
         QUEST_GAMEPLAY_SCIENCE.md, NARRATIVE.md
---

# RpgBalancer — Quest Generation System

Architettura concettuale, interfacce e piano di prototipazione
Stato: proposta progettuale da verificare rispetto al repository e ai
documenti canonici.

## 0. Vincoli canonici (già decisi — non rinegoziabili)

Una quest generata che viola questi vincoli è bocciata a prescindere dalla
sua qualità strutturale. Fonti: `.mw/desiderata.md`, `QUEST_RULES.md`,
`FINAL-RESOCONTO.md` §7, R-105/R-108/R-109.

- **Mortalità DD/XCOM** (R-105): morte e ferimento sono esiti reali e
  frequenti; il party può perdere pezzi.
- **3–4 decisioni cruciali per run** (R-108): non una scena su tre — il
  budget delle scelte che contano davvero. Le scene minori esistono ma non
  pretendono lo stesso peso.
- **Skill = gestione del rischio probabilistico** (R-108): niente quest
  che premiano la memorizzazione di pattern o risposte "giuste" non
  deducibili. Le sorprese possono essere forti ma devono essere **eque
  retrospettivamente**.
- **Numeri esatti in preview** (R-108): le probabilità e i costi delle
  opzioni sono visibili; l'incertezza vive nello stato nascosto, non nei
  numeri delle scelte.
- **Allarme = stati nominati** (quieto/sveglio…), non meter numerico
  (parcheggiato, QUEST_RULES §9).
- **TAKEN ≠ SECURED** (v24): il bottino raccolto è a rischio fino
  all'estrazione; la vittoria non è acquisita al completamento
  dell'obiettivo.
- **Coerenza della minaccia** (QUEST_RULES §7b, vigente): il tipo di
  minaccia vincola la vittima credibile e il luogo; la generazione deve
  soddisfarla, non solo il flavour.
- **Conseguenze universali** (R-092, QUEST_RULES §8): ogni quest ha
  conseguenze se risolta, in base a come, e se non risolta.
- **Obiettivo emotivo**: le quest esistono per produrre emozioni
  specifiche — attaccamento/sacrificio e avidità/rimpianto in testa, poi
  suspense, sorpresa equa, sollievo, pressione. La libreria consolidata:
  `FINAL-RESOCONTO.md` §5. Una quest valida meccanicamente ma emotivamente
  piatta non raggiunge l'obiettivo.

## 1. Obiettivo

Creare un sistema capace di generare quest strategicamente interessanti,
narrativamente coerenti, emotivamente efficaci e sufficientemente varie,
senza dover scrivere e revisionare manualmente ogni combinazione
possibile.

Il sistema deve:

- Generare quest con meccaniche, scene, decisioni, diramazioni e climax.
- Produrre titoli e flavour text coerenti con il mondo, la scena e
  l'esperienza narrativa desiderata.
- Utilizzare i tratti dei personaggi per generare eventi e deviazioni
  significative.
- Riutilizzare le strutture attraverso domain kit diversi, rispettando i
  vincoli di ciascun mondo.
- Verificare automaticamente la correttezza strutturale e le proprietà
  matematiche.
- Misurare la qualità narrativa con valutazioni automatiche calibrate e
  playtest umani.
- Supportare main quest persistenti, suddivise in opportunità giocabili
  che modificano lo stato del mondo.

## 1b. Infrastruttura già esistente (non si parte da zero)

Il motore quest attuale fornisce già gran parte della macchina di
validazione e runtime. La generazione deve produrre artefatti compatibili:

- `QuestScenarioSchema` (Zod) — grafi authored con nodi/edge/opzioni
  condizionate da flag.
- `exploreScenario` — esplorazione engine-driven, witness replay, coverage
  dichiarata ⊆ dinamica (S2.1).
- Monte Carlo simulation su scenari + `analyzeCheck` per-check pins.
- `deriveOfferBand` / `DANGER_BANDS` — banda di difficoltà misurata su
  `referenceParty` (S2.3).
- `ScenarioInstance` content-addressed, congelata nell'offerta e nel save —
  è il posto naturale per il twist deck risolto.
- Adapter residente→quest member (S2.2), ritirata con costo, esiti sfumati
  (critico/quasi/grave), stati d'allarme nominati, F6 push-your-luck.
- `PersistenceService` — invariante per run state e (futuro) arc state.

## 2. Architettura complessiva

Il sistema comprende quattro livelli collegati.

- **A. Generazione della quest** — definisce il problema strategico,
  seleziona gli archetipi delle scene, combina i relativi hook e costruisce
  un grafo narrativo con percorsi alternativi.
- **B. Realizzazione narrativa** — produce titolo, descrizione e flavour
  text a partire da fatti, obiettivi, conseguenze e vincoli già definiti.
- **C. Validazione e bilanciamento** — verifica struttura, coerenza,
  raggiungibilità, influenza delle decisioni e comportamento
  probabilistico.
- **D. Persistenza narrativa** — mantiene lo stato delle main quest, dei
  personaggi, delle fazioni e delle conseguenze che possono riemergere
  nelle quest successive.

Il risultato della generazione è un `QuestScenario` authored e validato.
Durante la partita si aggiornano lo stato della run e i flag, senza
inventare nuovi nodi arbitrari a runtime.

## 3. Concetti e responsabilità

### 3.1 Core gimmick

La meccanica centrale che definisce il problema strategico della quest.
Ogni core gimmick specifica:

- Variabili di stato e limiti.
- Condizioni di avanzamento, vittoria, sconfitta e stallo.
- Decisioni e costi caratteristici.
- Hook ammessi per le scene.
- Condizioni del climax e relativi esiti.

### 3.2 Scene gimmick e archetipi decisionali

Un archetipo descrive una situazione decisionale riutilizzabile,
indipendentemente dal suo rivestimento narrativo. Una scena concreta
specifica:

- Prerequisiti e condizioni di attivazione.
- Opzioni e relative conseguenze.
- Variabili lette e modificate.
- Esiti, costi e informazioni comunicate.
- Hook compatibili con il core gimmick.

Ogni scelta offerta dalla scena deve superare quattro proprietà
(trade-off, conseguenza concreta, dipendenza dal contesto/party,
attribuibilità del risultato alla decisione). Scelte cosmetiche, dominanti
o a esito puramente casuale sono difetti da rilevare in validazione.

Target iniziale: almeno il 75% delle scene deve influenzare variabili
centrali o condizioni strategicamente rilevanti. La metrica deve essere
definita in modo verificabile e non limitarsi alla presenza nominale di
una variabile. **Metrica posticipata** (Director 2026-10-10: «ci pensiamo
dopo, adesso vediamo come viene») — il contratto scena dichiara gli hook,
il conteggio si osserva sul prototipo prima di fissare soglia e
denominatore. Resta aperta la tensione col budget «3–4 decisioni
cruciali» — il generatore deve marcare quali scene sono cruciali e quali
minori, e la sequenza deve avere una curva (pressione → dilemma →
conseguenza → risoluzione).

### 3.3 Twist

Un twist introduce una variazione sostanziale nel percorso, nelle opzioni
disponibili, nell'obiettivo o nel climax. Un twist deve dichiarare:

- Trigger e condizioni di eleggibilità.
- Eventuale selezione probabilistica.
- Effetto sul grafo già authored.
- Modifiche alle variabili e ai flag.
- Indizi disponibili al giocatore, quando appropriato.
- Conseguenze e possibilità di reazione.

Il twist non deve limitarsi a incrementare il danno o cambiare il testo.
Il criterio di qualità: **dopo il twist il giocatore ha un problema
sostanzialmente diverso** da quello che pensava di risolvere.

Quattro famiglie note: interferenza della personalità (un tratto crea una
scena/problema nuovo), deviazione obbligata (un tratto chiude l'opzione
sicura), rivelazione dell'obiettivo (il significato del target cambia),
conseguenza ritardata (una scelta precedente presenta il conto al climax).

Ciclo di vita (modello concordato): **compile-time** il generatore emette
tutti i rami possibili e li verifica raggiungibili → **inizio run** si
seleziona quali twist sono armati tra gli eleggibili, con casualità
controllata e seed-riproducibile → **in-run** trigger, scelte e flag
guidano l'attraversamento. Il grafo non muta mai a runtime: si percorrono
rami già authored. Corrisponde al pattern `ScenarioInstance` di S2.3.

Vincoli di equità: trigger leggibili o indiziati, nessun accumulo
incontrollato di twist negativi nella stessa run, il giocatore deve poter
reagire dopo la deviazione. Aperto: impatto minimo misurabile per
qualificarsi come twist, e selezione una-tantum vs trigger successivi
indipendenti.

### 3.4 Tratti dei personaggi

I tratti come Avido e Scavezzacollo possono **abilitare** un'opzione,
**precluderla** o **innescare** un evento — tre casi distinti, per evitare
che ogni tratto degeneri nello stesso inconveniente. Devono essere
distinti dai `statTags`, che descrivono caratteristiche meccaniche delle
statistiche. **Verificato: `ResidentState` non ha un campo tratti**
(`statTags` sono etichette delle stat dominanti) — il contratto dei tratti
e la loro collocazione (`ResidentState` vs profilo separato) sono da
progettare. Se i tratti sono visibili nella scheda/planning, «porto
l'Avido?» diventa una decisione strategica pre-quest che alimenta il
pilastro attaccamento.

## 4. Modello dei tag e della narrativa

I tag non devono essere un'unica lista piatta. Rappresentano dimensioni
differenti.

### 4.1 Domain kit

Definiscono il mondo concreto e i vincoli di ammissibilità:

- Creature e minacce.
- Luoghi e oggetti.
- Ruoli sociali e relazioni.
- Fenomeni fisici plausibili.
- Regole di coerenza bloccanti.

**Verificato:** esistono 3 kit draft compilati negli imprint
(`palude`, `mare`, `miniera` in `QUEST_IMPRINTS.md`) con regole di
coerenza bloccanti già definite — nessuno è integrato nel motore quest.
I tag possono essere **compositi** (ambiente + minaccia + posta), non solo
nomi singoli. Il kit deve inoltre soddisfare la regola di coerenza della
minaccia (§0): chi è minacciato e dove la quest accade derivano dal tipo
di antagonista.

### 4.2 Story mode

Descrive la modalità narrativa desiderata, per esempio horror,
esplorazione o intrigo. Influenza la selezione dei dettagli, gli indizi,
la tensione e il tipo di esperienza evocata. Non sostituisce il domain kit
e non modifica automaticamente le regole meccaniche. Il genere generale
del mondo, come fantasy, può essere una proprietà di ambientazione
condivisa anziché un tag ripetuto su ogni quest.

### 4.3 Core gimmick

Definisce la causalità e il problema della quest. Deve essere separato
dai tag ambientali e narrativi.

### 4.4 Tag adiacenti e distanza

Un grafo di adiacenza permette di cercare un domain kit alternativo quando
quello selezionato non supporta una scena. La metrica di distanza tra kit
deve valutare sia la composizione del mondo sia la struttura sociale e
fisica. La diversità strutturale del gameplay deve essere misurata
separatamente dalla diversità del flavour.

## 5. Generazione del flavour text

La generazione narrativa non deve essere responsabile di inventare le
regole della scena.

**Input:**

- Fatti canonici della scena.
- Stato e funzione della scena nella quest.
- Domain kit e vincoli.
- Story mode.
- Core gimmick e conseguenze meccaniche.
- Profilo stilistico condiviso.
- Eventuali informazioni note, ignote o deliberatamente ambigue.

**Output:**

- Titolo.
- Descrizione.
- Eventuali testi brevi degli esiti.

**Brief automatico per scena** — oltre ai tag, il modello riceve un brief
derivato dai dati della scena: cosa sta accadendo realmente, quali fatti
sono noti e quali ignoti, cosa il giocatore deve percepire o domandarsi,
quali dettagli sono inventabili e quali no, quale informazione meccanica
deve risultare comprensibile dal testo. Generato automaticamente dalla
scena, non scritto a mano per ogni combinazione.

**Pipeline:**

1. Generare una proposta narrativa.
2. Validare schema, riferimenti e contraddizioni verificabili.
3. Valutare la qualità narrativa tramite criteri espliciti.
4. Rigenerare o correggere solo gli elementi difettosi.
5. Sottoporre i casi dubbi a revisione umana.
6. Salvare il risultato validato nel `QuestScenario`.

La valutazione LLM è uno strumento di selezione e critica, non una prova
definitiva di qualità. Non è necessario scrivere preventivamente tutte le
combinazioni di scene e tag: è necessario calibrare il processo su un
campione rappresentativo di risultati reali.

**Traduzione (decisione Director 2026-10-10: «dovremo tradurre tutto»):**
il testo generato deve essere progettato traducibile fin da ora — chiavi
strutturate per nodo, niente interpolazioni che dipendano dalla grammatica
italiana. Le `PRESENTATION_KEYS` dello schema sono già escluse dall'hash
contenuto: traduzioni e ritocchi di testo non invalidano i run salvati.

## 6. Generazione del grafo

La generazione avviene prima della giocata.

Il grafo può includere rami condizionali relativi a:

- Scelte.
- Esiti delle prove.
- Tratti dei personaggi.
- Twist eleggibili.
- Flag e conseguenze precedenti.

Tutti i percorsi previsti devono essere verificabili. Il grafo deve
evitare nodi irraggiungibili, finali mancanti e rami che promettono
effetti non implementati.

La casualità deve essere esplicita e riproducibile quando possibile
(seed deterministici, come già nel motore). Modello concordato (§3.3):
a compile-time si genera il **deck** dei rami-twist eleggibili; a inizio
run si **arma** la selezione; in-run i flag guidano l'attraversamento —
il grafo non muta mai.

## 7. Validazione e simulazione

La validazione automatica deve comprendere:

- Schema e riferimenti validi.
- Raggiungibilità e risoluzione dei rami.
- Compatibilità con il domain kit.
- Copertura degli hook.
- Individuazione di scelte prive di conseguenze.
- Influenza marginale dei nodi sull'esito.
- Frequenze di vittoria, sconfitta, morte, costi e ricompense.
- Confronto tra politiche di gioco (es. sempre-prudente / sempre-rapido /
  interferenza / adattiva sullo stato di corsa): nessuna politica deve
  dominare in ogni situazione e nessuna deve essere chiaramente inferiore.
- Impatto misurato dei twist (frequenza × variazione di successo, morte,
  costi, ricompense) e influenza marginale di ogni nodo.
- Stima della difficoltà effettiva rispetto alla banda dichiarata
  (`deriveOfferBand` sul `referenceParty`).
- **Failure-mode check** contro il catalogo noto (`FINAL-RESOCONTO` §6):
  scelta che cambia solo una %, meter senza effetto sulle opzioni, near-miss
  inerte, ritirata tutto-o-niente, sacrificio auto-assegnato (→ rabbia, non
  dolore), conseguenza non attribuibile (→ sorpresa ingiusta).

Le soglie quantitative iniziali sono parametri sperimentali da calibrare.
La simulazione misura le proprietà meccaniche; non dimostra che una quest
sia divertente o emotivamente efficace.

## 8. Main quest e chain quest

Una main quest è un arco persistente, non una lunga quest lineare spezzata
in segmenti.

**Generazione dell'arco** — definisce:

- Premessa e problema centrale.
- Attori, fazioni e obiettivi.
- Stati e transizioni.
- Svolte possibili e condizioni di conclusione.
- Conseguenze persistenti e reazioni del mondo.

**Generazione delle opportunità** — quando le condizioni sono soddisfatte,
l'arco rende disponibile una nuova opportunità giocabile. Questa diventa
una quest normale, generata e validata attraverso lo stesso sistema.

**Persistenza** — gli esiti aggiornano lo stato dell'arco e del mondo.
Le opportunità future possono quindi cambiare in funzione delle scelte
precedenti.

**Tempo e omissioni** — l'avanzamento del mondo, la disponibilità di una
quest e la sua scadenza sono concetti distinti. Ignorare una quest può
modificare il mondo o le opportunità successive, senza implicare sempre
una penalità diretta — estende la regola canonica R-092 (conseguenze
anche per mancata risoluzione, OPEN-015). Nessun contratto di arco esiste
oggi: il più vicino è `village_event_system_spec.md` / R-093 (registro
narrativo).

**Interfaccia giocatore** — la UI dovrebbe distinguere:

- Archi narrativi attivi.
- Opportunità attualmente disponibili.
- Archi sospesi.
- Archi conclusi e conseguenze.

Le informazioni segrete devono rimanere nascoste quando la fiction lo
richiede.

## 9. Protocollo di valutazione

La qualità viene misurata su tre livelli.

- **Correttezza**: test automatici e controlli di coerenza.
- **Qualità narrativa**: valutazione di concretezza, chiarezza, atmosfera,
  coerenza e assenza di dettagli gratuiti.
- **Qualità ludica**: simulazioni, influenza delle decisioni e playtest.

I playtest devono verificare se:

- I twist sono sorprendenti ma equi.
- Le decisioni cruciali sono percepite come tali (e sono davvero 3–4).
- Le conseguenze sono comprensibili.
- Le scelte producono rimpianto, sollievo, rischio o soddisfazione.
- Le quest non sembrano varianti cosmetiche dello stesso template.

Protocollo controfattuale (già previsto per F6): *«cosa hai perso e per
quale scelta?»* — l'unico test che discrimina "tassa RNG" da "l'ho
rischiata io".

## 10. Piano incrementale

1. Verificare il sistema quest attuale e i contratti esistenti.
2. Definire il modello minimo di core gimmick, scena e grafo.
3. Generare e validare una singola quest con pochi archetipi.
4. Aggiungere la generazione del flavour text e calibrare i controlli.
5. Aggiungere twist e tratti dei personaggi.
6. Integrare i domain kit e testare le combinazioni.
7. Aggiungere simulazioni e criteri quantitativi.
8. Estendere il sistema a più meccaniche e archetipi.
9. Introdurre gli archi persistenti delle main quest.
10. Integrare UI, avanzamento temporale e conseguenze persistenti.

Ogni fase deve avere test di accettazione e un risultato funzionante
prima di passare alla successiva.

## 11. Decisioni ancora aperte

**Decise dal Director (2026-10-10) — dettagli in CONTRACTS §11:**

- ✅ Routing verdetti → `verdictTable` dichiarativa sui nodi nuovi,
  switch legacy per i goblin (estensione additiva a I-3).
- ✅ Variabili core → layer numerico `vars` nel run state.
- ✅ Tratti → `traits: string[]` su `ResidentState`.
- ✅ Twist arm → misto (runstart per tratti, in-run per eventi).
- ✅ Traduzione → tutto il testo generato progettato traducibile.
- ✅ Regola 75% → posticipata, si osserva sul prototipo.

**Ancora aperte:**

- Impatto minimo misurabile perché un evento si qualifichi come twist;
  numero massimo di twist negativi per run.
- Tassonomia canonica dei tag e grafo di adiacenza.
- Metrica di distanza tra domain kit e tra strutture di gameplay.
- Come nascono i tratti (authored/generati/ereditati) — dove vivono è
  deciso, come si creano no.
- Formato esatto delle chiavi testo traducibili.
- Regola 75% **posticipata** (Director 2026-10-10): si osserva sul
  prototipo prima di fissare soglia e denominatore; resta aperta la
  conciliazione col budget «3–4 decisioni cruciali».
- Criteri di qualità narrativa e calibrazione del valutatore.
- Soglie di accettazione delle simulazioni.
- Regole di avanzamento, sospensione e conclusione delle main quest;
  generazione incrementale vs pre-generata dei segmenti; quanto del
  futuro dell'arco è visibile al giocatore.

---

**Principio guida:** generare molto, validare automaticamente ciò che è
verificabile, misurare il comportamento e usare il giudizio umano dove
serve una vera valutazione creativa.
