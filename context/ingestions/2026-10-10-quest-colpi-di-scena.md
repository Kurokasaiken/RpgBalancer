---
title: "Ingestion — colpi di scena generativi + valutazione «abbastanza idee?»"
type: ingestion
date: 2026-10-10
source: "trascript incollato dal Director — continuazione del thread «generazione quest» (stessa conversazione esterna di 2026-10-10-quest-generation-flavour-experiment.md)"
related: R-111, R-091, OPEN-014, QUEST_GENERATION_ARCHITECTURE.md, QUEST_GAMEPLAY_SCIENCE.md
status: archived — integrato in context/QUEST_GENERATION_ARCHITECTURE.md §9–10
---

# Trascript archiviato — «Colpi di scena + siamo pronti a prototipare?»

## Blocco 1 — Direttiva del Director (verbatim)

> «Due cose: ci voglio i "colpi di scena", devono cambiare in maniera
> significativa la quest. Ad esempio: una quest risolta con successo: hai un
> pg con un tag sul carattere specifico (mettiamo Avido), anche se hai
> risolto gli skill check correttamente, e cose del genere. Il pg crea una
> scena in + dove mette a rischio il party e la vittoria. Oppure, la scena di
> scalare: uno dei pg ha come carattere "scavezzacollo" e ti blocca l'opzione
> di usare solo percezione e ti obbliga a fare la route + pericolosa
> FORZA + PERCEZIONE e se fallisci prendi danni. O comunque diramazioni "a
> prescindere", non dobbiamo fare quest che siano solo lineari, ma devono
> avere anche una certa % di avere un colpo di scena da qualche parte. Che ne
> dici?»

Punti Director estratti:

- i colpi di scena **cambiano significativamente** la quest (non flavor);
- trigger possibile: **tratti caratteriali dei PG** (Avido, Scavezzacollo);
- il twist può **aggiungere una scena** post-vittoria apparente, oppure
  **chiudere un'opzione** forzando la route rischiosa;
- volute **diramazioni "a prescindere"** — una % di probabilità che un
  colpo di scena esista in ogni quest; le quest non devono essere lineari.

## Blocco 2 — Risposta dell'AI

Direzione giudicata promettente: una quest matematicamente interessante può
restare prevedibile; i colpi di scena trasformano una vittoria acquisita in
un problema nuovo. **Non eventi casuali**: devono cambiare le condizioni e
mettere in discussione le decisioni precedenti.

**Quattro tipi di colpo di scena:**

| # | Tipo | Meccanica | Origine/trigger |
|---|---|---|---|
| 1 | Personalità che interferisce | dopo una vittoria apparente, il PG Avido apre una scena extra (fermarlo / assecondarlo / gestire) — la vittoria torna in gioco | tratti caratteriali + ricompense + contesto |
| 2 | Deviazione obbligata | lo Scavezzacollo chiude la via prudente → prova più rischiosa con conseguenze concrete | tratti, composizione party, situazione |
| 3 | Rivelazione che cambia l'obiettivo | il bersaglio da eliminare tiene chiusa una minaccia peggiore → nuova decisione sul bersaglio | stato quest, info scoperte, risultati |
| 4 | Conseguenza ritardata | una scelta vantaggiosa presenta il conto al climax (risorsa sottratta, alleato compromesso, nemico preparato) | scelte, flag, risorse accumulate |

**Decomposizione generativa** (non una lista di eventi random):

- **Trigger** — quando il twist può verificarsi (tratto presente, risorsa
  raccolta, fallimento precedente, combinazioni).
- **Evento** — la nuova situazione/deviazione/vincolo/rivelazione.
- **Impatto** — come modifica il grafo, gli obiettivi, le probabilità, le
  risorse, i personaggi.

Chiave: il twist non è necessariamente un nodo aggiunto — può sostituire una
scena, chiudere un'opzione, aprire un percorso, trasformare il climax.

**Regole di casualità controllata:**

- sequenze di scene non identiche tra quest;
- twist compatibili con contesto e PG presenti;
- non sempre negativi (opportunità, vantaggi, dilemmi);
- significativi senza rendere irrilevanti le scelte precedenti;
- MC misura impatto su successo/fallimento/morte/ricompensa; la qualità
  emotiva richiede playtest;
- lo stesso tratto (Avido) NON genera sempre lo stesso evento — seleziona
  fra eventi compatibili.

**Tre livelli della quest** (allineati al framework a 3 livelli di R-111):

1. struttura centrale — il problema strategico;
2. scene interattive — decisioni che muovono le variabili del problema;
3. diramazioni emergenti — eventi che cambiano le regole del problema.

**Criterio di qualità del twist**: dopo il colpo di scena il giocatore deve
avere *un problema sostanzialmente diverso* da quello atteso. Se cambia solo
il testo o aumenta il danno, non è un twist.

## Blocco 3 — Director: «abbiamo abbastanza idee o dobbiamo raffinare?»

Risposta dell'AI: **idee sufficienti per un prototipo, NON per
implementarlo** senza lasciare troppe decisioni all'agente. Stop alla
ricerca generale → formalizzazione.

Quattro componenti identificate: meccaniche centrali / gimmick delle scene /
colpi di scena / flavor e tag (il flavor determina quali eventi sono
compatibili).

**Cosa manca prima di implementare:**

| Aspetto | Da definire |
|---|---|
| Generazione | come combinare meccanica+scene+diramazioni senza incoerenze |
| Colpi di scena | regole di attivazione, probabilità, compatibilità, impatto minimo |
| Struttura | rappresentazione di percorsi alternativi, condizioni, nodi obbligatori, climax |
| Bilanciamento | metriche da simulare e soglie per quest sbilanciate/banali |
| Valutazione | come distinguere «meccanicamente valida» da «interessante da giocare» |

**Percorso consigliato:** modello minimo formalizzato → generatore limitato
(poche meccaniche, catalogo iniziale, compatibilità esplicita) → piccolo
lotto di quest generate → simulazione (vittorie, morti, costi, frequenza e
impatto twist, influenza reale dei nodi) → valutazione e raffinamento del
catalogo solo dove serve.

**Da raffinare prima di partire (una sola cosa):** il *contratto del colpo
di scena* — condizioni verificabili, modifica dello stato, conseguenze
osservabili. Altrimenti il generatore produce diramazioni apparentemente
significative.

**Prossimo passo concreto proposto:** spec del generatore + sistema di test,
separando il già deciso da ciò che il prototipo deve verificare.

---

## Classificazione Devin

- **[DIRECTIVE — intento Director]** I colpi di scena sono un requisito del
  Director: significativi, con % di presenza, anche "a prescindere",
  triggerabili da tratti PG. Va in RICHIESTE (R-112).
- **[PROPOSAL]** Tassonomia a 4 tipi, decomposizione trigger/evento/impatto,
  regole di casualità controllata, criterio «problema diverso dopo il
  twist», percorso in 5 passi. Coerente ma non ratificato.
- **[FACT repo — rilevanza diretta]** Lo schema canonico S2.1 già supporta
  gran parte dei twist come *rami condizionali authored*: le opzioni hanno
  gating su flag/stato (es. `agguato-scelta`, requisiti stat su slot), il
  motore ha flag persistenti per run. «Deviazione obbligata» = opzione
  chiusa da flag; «conseguenza ritardata» = flag letto al climax; «scena
  extra» = nodo raggiungibile solo con flag. **Da verificare**: se il roster
  reale ha tratti caratteriali sui residenti (i preset lab no) e se esiste
  un roll probabilistico a monte delle opzioni per la % «a prescindere»
  (oggi la probabilità vive solo nei check — un trigger twist servirebbe o
  come check dedicato o come selezione a generazione/config-time).
- **[OPEN]** Generazione compile-time (emette scenari authored nel grafo,
  twist = rami presenti ma condizionati) vs runtime (mutazione del grafo a
  run attiva — il motore attuale non la prevede). Fortemente collegata alla
  questione già aperta §8.2 di QUEST_GENERATION_ARCHITECTURE.
- **[TENSIONE da nominare]** «% di twist a prescindere» vs R-108 «sorprese
  forti ma eque, retrospettivamente logiche»: un twist puramente
  stocastico senza trigger leggibile rischia la sorpresa ingiusta. I trigger
  leggibili (tratto PG visibile, flag accumulato) lo rendono attribuibile —
  il criterio «attribuzione» delle 4 proprietà va applicato anche qui.
