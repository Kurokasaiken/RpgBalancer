---
title: "Ingestion — deepening generazione quest: contratti, assi semantici del testo, chain quest"
type: ingestion
date: 2026-10-10
source: "trascript incollato dal Director — stessa conversazione esterna dei file 2026-10-10-quest-generation-flavour-experiment.md e 2026-10-10-quest-colpi-di-scena.md"
related: R-111, R-112, QUEST_GENERATION_ARCHITECTURE.md, QUEST_IMPRINTS.md,
         NARRATIVE.md, village_event_system_spec.md
status: archived — integrato in context/QUEST_GENERATION_ARCHITECTURE.md §13–15
---

# Trascript archiviato — «Completamento contratti, assi del testo, chain quest»

## Blocco A — Gap analysis: «non ancora spec implementabile»

Verdetto AI: quadro molto completo ma **non abbastanza formale** per una
spec senza ambiguità. Non ricominciare la ricerca: completare contratti e
risolvere contraddizioni.

**Già presente e da preservare:** meccaniche+gimmick (serve catalogo
formalizzato), decisioni su variabili centrali (target 75%), twist
sostanziali, tratti PG come trigger (manca supporto in `ResidentState` —
concorda col nostro FACT verificato), domain kit (draft negli imprint, da
integrare), tag adiacenti/distanza (concetti senza grafo né metrica),
generazione preventiva del grafo con rami authored, MC+playtest (mancano
protocolli e soglie), persistenza conseguenze (manca un contratto generale).

**A. Ciclo di vita del twist — la contraddizione più urgente.** Compatibile
grafo-authored e selezione probabilistica, separando:
- *compile-time*: genera tutti i rami possibili, verifica raggiungibilità
  sotto condizioni ammissibili;
- *inizio run*: seleziona il twist tra gli eleggibili (casualità
  controllata e riproducibile);
- *durante*: trigger/scelte/flag determinano come il twist modifica il
  percorso — **il grafo non si modifica a runtime**, si percorrono rami.
Aperto: selezione una-tantum per quest o trigger successivi indipendenti.

**B. Contratto delle meccaniche**: per ogni gimmick core — variabili+limiti,
condizioni di avanzamento/vittoria/sconfitta/stallo, decisioni+costi, hook
accettati, condizioni di climax e conseguenze. Per ogni scena — prerequisiti,
variabili lette/scritte, opzioni, costi, esiti, interazioni col climax.

**C. Modello dei tratti — tre casi distinti**: tratto che *abilita*
un'opzione; che *preclude* un'opzione; che *innesca* un evento. Evita che
ogni tratto degeneri nello stesso inconveniente.

**D. Sorpresa vs controllo**: criteri per — leggibilità indizi prima
dell'evento; compatibilità trigger/contesto/party; impatto effettivo;
possibilità di reagire dopo la deviazione; rischio di twist negativi
accumulati nella stessa run.

**E. Curva emotiva e climax** (meno formalizzato): distinguere scene
cruciali da minori; verificare progressione pressione→dilemma→conseguenza→
risoluzione; esiti speciali (critico/quasi/fallimento-grave) devono poter
produrre conseguenze distintive. MC verifica probabilità; l'emozione va al
playtest umano.

**F. Contratto di test e accettazione** — per ogni generazione, automatico:
nessun nodo irraggiungibile / percorso senza risoluzione; nessuna scelta
cosmetica (criterio d'influenza dichiarato); compatibilità domain kit;
frequenze vittoria/sconfitta/morte/costi; politiche dominanti; influenza
marginale per nodo e per twist; banda misurata coerente con l'offerta.
Soglie esplicite; alcune = parametri sperimentali da calibrare.

**Varietà strutturale** (da non dimenticare): due quest con tag/nomi/icone
diversi possono avere stessa sequenza decisionale e stesso climax →
percepite come template. Confrontare le **strutture decisionali**, non solo
flavour. È una misura diversa dalla distanza tra domain kit (mondo vs
gameplay).

**4 deliverable prima della spec del generatore minimo:**
1. contratti meccaniche+scene (variabili, hook, costi, esiti, compatibilità);
2. contratto twist + ciclo di vita (selezione, compile/runtime);
3. contratto domain kit + tratti (fallback, vincoli bloccanti, conseguenze
   persistenti);
4. piano di validazione (metriche, soglie iniziali, test auto, sim,
   protocollo umano).

**Cautela finale dell'AI**: affermazioni tipo «verificato: non esiste» e
riferimenti al repo vanno ri-verificati sull'agente prima
dell'implementazione — metodologia corretta (e infatti le nostre verifiche
erano live).

## Blocco B — Assi semantici del testo (origine: i testi incoerenti del probe)

Premessa: **domain kit + gimmick non bastano** — descrivono il mondo e cosa
accade, non *come raccontarlo*. Tre assi + stile:

| Asse | Definisce | Esempi |
|---|---|---|
| Domain kit | dove siamo, cosa è possibile (vincoli sul mondo) | passo-montano → creste, valanghe, predoni, guide |
| Story mode | quale esperienza narrativa | esplorazione, horror, intrigo, avventura-epica |
| Core gimmick | la struttura causale della scena | gara → testo che rende percepibile avanzamento/costo del tempo |
| Narrative voice | come è scritto (config globale o profilo, non necessariamente un tag) | concretezza sensoriale, lunghezza, lessico, PoV, divieto di inventare fatti |

«Fantasy» ≠ stesso livello di `horror`: fantasy = genere/ambientazione
(proprietà globale del mondo); horror = modalità applicabile a qualsiasi
dominio; esplorazione = modalità ma anche funzione ludica. → **niente lista
piatta** che mescoli livelli concettuali diversi.

**I tag da soli non bastano**: restringono lo spazio ma non specificano cosa
contiene una buona descrizione (esempio: stessa scena di cresta in mode
esplorazione vs horror — cambia selezione dei dettagli e cosa resta in
sospeso, non la meccanica). Serve un **brief narrativo automatico per scena**
derivato dai dati: cosa sta accadendo; fatti noti vs ignoti; cosa il
giocatore deve percepire; cosa può essere inventato e cosa no; quale
informazione meccanica deve risultare leggibile.

**Anti-esplosione combinatoria**: niente testo per combinazione — regole
per asse + criteri per le interazioni; il modello produce titolo+descrizione,
un validatore controlla riferimenti/contraddizioni, un secondo passaggio
critica la qualità; i dubbi si rigenerano o vanno a revisione.

**Test controllato proposto** (prima di ratificare la tassonomia): una
scena meccanicamente definita, si varia UN asse alla volta, si valuta su 4
criteri — coerenza fattuale/fisica; chiarezza di situazione e posta;
atmosfera evocata; assenza di dettagli gratuiti/incongruenti. Se horror→
esplorazione non produce differenze riconoscibili → il tag non lavora; se
produce solo aggettivi cupi → il modello non ha capito la modalità.

## Blocco C — Chain quest / main quest

Domanda Director (verbatim): «e x fare le chain quest invece? xè avrebbe
senso magari generare una "main quest" dove ogni X tempo hai la possibilità
di risolvere una parte della chain quest. Ha senso "generarla prima" la main
quest? ha senso mostrare al giocatore tipo "main quest attive"?»

Risposta: sì, con distinzioni. La main quest **non è una quest lunga
spezzata**: è un **arco persistente che genera occasioni di gioco e reagisce
alle risoluzioni**.

**Tre livelli di generazione (quando/quanto è definito):**

| Livello | Quando | Contenuto |
|---|---|---|
| Arco narrativo | quando nasce la main quest | premessa, antagonista/problema, obiettivi intermedi, svolte possibili, conclusioni |
| Segmento | quando diventa disponibile | situazione concreta, obiettivo, conseguenze |
| Quest | prima dell'offerta | titolo, descrizione, scene, diramazioni validate |

Mai generare in anticipo ogni scena: se il giocatore uccide un personaggio
chiave o lascia peggiorare la minaccia, le quest successive devono cambiare.
Struttura definita abbastanza per coerenza/anticipazioni, flessibile per lo
stato del mondo. L'antagonista ha un piano coerente senza che ogni dettaglio
futuro sia predeterminato.

**UI main quest attive**: fili narrativi persistenti, non lista con
contatori — situazione corrente, prossima opportunità, posta in gioco.
Categorie: archi attivi / opportunità disponibili / archi in sospeso /
archi conclusi (con conseguenze visibili). Il giocatore sa che il problema
esiste e capisce le conseguenze delle omissioni — **non** le svolte future.

**Il problema di design principale: il TEMPO.** Con N archi × opportunità
ogni X giorni → saturazione o calendario-di-appuntamenti. Separare:
- *avanzamento del mondo* (l'antagonista agisce, le minacce maturano);
- *disponibilità della quest* (il giocatore decide quando);
- *scadenza* (solo se giustificata dalla fiction e produce conseguenze).

**Ignorare ≠ perdere reward**: il mondo cambia, un alleato decide da solo,
il nemico si rafforza, l'opportunità futura diventa più difficile. → scelta
strategica autentica: non puoi fare tutto, ma capisci cosa rischi.

**Integrazione**: non un secondo sistema — stesso generatore + layer
superiore che definisce stati/transizioni dell'arco, condizioni di sblocco,
entità persistenti (personaggi/fazioni/fatti), conseguenze degli esiti,
deviazioni e conclusioni possibili.

---

## Classificazione Devin

- **[PROPOSAL]** I 4 deliverable pre-spec, il ciclo di vita twist a 3 fasi,
  il modello tratti a 3 casi, gli assi testo (kit/mode/gimmick/voice) +
  scene brief, il test controllato un-asse-alla-volta, l'architettura archi
  persistenti a 3 livelli di generazione. Tutto coerente col framework
  documentato — da ratificare.
- **[RISOLUZIONE PROPOSTA]** Il ciclo di vita twist risolve la mia tensione
  §8.2/§9 (compile-time vs runtime): rami authored + selezione a inizio
  run + attraversamento guidato da stato. È esattamente il modello
  `scenarioInstance` già implementato in S2.3 (istanza congelata nel run).
- **[FACT repo]** il pattern «istanza congelata» esiste: `ScenarioInstance`
  content-addressed + `nodesFor`/`createRun` sull'istanza + save che porta
  l'istanza (S2.3 completato). Un twist deck = insieme di rami sull'istanza
  + roll a `createRun` che setta flag. Fattibile senza nuovi kind.
- **[FACT repo]** gli esiti sfumati (critico/successo/quasi/fallimento/
  grave) esistono già nel motore — la richiesta «esiti speciali con
  conseguenze distintive» è un problema di authoring, non di engine.
- **[OPEN]** le chain quest aprono un asse nuovo non coperto: stato
  persistente dell'arco tra quest, unlock conditions, «il mondo avanza se
  ignori». Esiste materiale vicino (`village_event_system_spec`, memoria
  emergente P48–63, registro narrativo R-093) ma nessun contratto di arco.
- **[ATTENZIONE]** la UI main-quest è esplicitamente «mockup concettuale»
  — non una proposta di componente.
