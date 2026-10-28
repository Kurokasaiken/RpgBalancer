---
title: Deep Research — architettura, loop agentico e context engineering
type: ai-response-archive
source: AI esterna non dichiarata — blocco 2 di 4 incollato dal Director in sessione
date: 2026-10-28
status: archived-verbatim
note: Provenienza del modello non dichiarata. Diverse affermazioni sono
  inferenze plausibili presentate come fatto (es. schema delle note intermedie,
  policy di eviction non sono pubbliche — lo ammette in chiusura).
  Formattazione appiattita dal paste; contenuto verbatim.
related: R-292
---

ChatGPT Deep Research (lanciato da OpenAI a febbraio 2025) è un agente di ricerca multi-step basato su una versione specializzata del modello di ragionamento o3 (successivamente anche varianti leggere come o4-mini), addestrato specificamente per browsing web, analisi dati e sintesi di report. Non è un semplice search + generazione, ma un sistema agentico che opera in loop iterativi lunghi (tipicamente 5-30 minuti), consultando dozzine o centinaia di fonti, e produce report strutturati con citazioni inline.

OpenAI non pubblica l'architettura completa (è proprietaria), ma le informazioni ufficiali, il system card, le guide API e le analisi tecniche (incluso il training con reinforcement learning end-to-end) permettono di ricostruire il funzionamento con buona precisione, soprattutto sui due aspetti che ti interessano: scelta di cosa salvare/mantenere in contesto e recupero delle informazioni.

## 1. Architettura e flusso di alto livello

Il processo tipico (in ChatGPT) è:

- **Clarification / Intent understanding:** Un modello intermedio (spesso tipo GPT-4.1 o simile) può fare domande di chiarimento e riscrivere/espandere il prompt dell'utente in una versione più dettagliata e strutturata.
- **Planning:** Il modello decompone la query in sotto-domande, sub-task e un piano di ricerca (a volte mostrato all'utente e modificabile).
- **Esecuzione iterativa (ReAct-style loop: Plan → Act → Observe):**
  - Cerca sul web (o fonti connesse/file caricati).
  - Apre e legge pagine intere, PDF, immagini.
  - Analizza con code interpreter (Python) se serve.
  - Ragiona su cosa ha trovato, aggiorna il piano, backtracka o pivota.
- **Sintesi finale:** Produce un report strutturato con citazioni precise (spesso a livello di frase/passaggio).

È addestrato con end-to-end reinforcement learning su task di browsing e reasoning reali. Impara a pianificare traiettorie multi-step, reagire alle informazioni in tempo reale, tornare indietro quando un percorso è sterile e sintetizzare.

Strumenti disponibili: web search, browser (fetch + scroll + search within page), code interpreter, parser di file (PDF/immagini), e (in contesti enterprise/API) file search su vector store o MCP server.

## 2. Come sceglie cosa salvare / mantenere in contesto (memory & context management)

Questo è il punto più critico e dove Deep Research si distingue nettamente dalle AI "normali".

I modelli di ragionamento o-series hanno un'"attenzione" estesa e sono addestrati a mantenere il focus su catene di pensiero lunghissime (centinaia di step). Tuttavia, il context window è finito e le pagine web intere + risultati di ricerca + chain-of-thought generano rapidamente volumi enormi di token. La soluzione non è "tenere tutto", ma una gestione intelligente e selettiva:

- **Estrazione e distillazione selettiva:** Quando legge una pagina/PDF, non tiene l'intero contenuto grezzo nel contesto principale. Estrae snippet rilevanti, fatti chiave, numeri, citazioni precise e metadati (URL + passaggio). Questi vengono "annotati" o riassunti in forma compressa. Le analisi tecniche e i pattern di sistemi simili (e le best practice OpenAI per agent) descrivono esplicitamente la creazione di intermediate notes o working memory strutturata.
- **Working memory / stato di ricerca persistente:** Mantiene una rappresentazione strutturata dello stato della ricerca:
  - Piano/sub-task attuali e completati
  - Conclusioni candidate + evidenze a supporto
  - Conflitti tra fonti
  - Gap ancora da colmare
  - Prossimi passi
  Questo stato viene aggiornato continuamente e sopravvive ai "reset" di history.
- **Compaction / summarization progressiva:** A intervalli o quando il contesto cresce troppo, il sistema (o il modello stesso tramite training) compressa le osservazioni vecchie in riassunti di alto livello, mantenendo i "handle" di citazione (URL + estratti chiave) per non perdere la tracciabilità. Non si tratta di un semplice sliding window, ma di un processo di consolidamento guidato dal ragionamento.
- **Separazione conclusioni vs evidenze:** Le conclusioni e il ragionamento restano nel contesto attivo; le evidenze grezze possono essere "masked" o esternalizzate, ma i riferimenti precisi vengono preservati per la fase di scrittura del report e di citazione.
- **Training-driven selectivity:** Grazie al RL end-to-end, il modello impara quali informazioni sono rilevanti per il goal finale e quali scartare. Non accumula indiscriminatamente: valuta autorità, novità, coerenza e utilità rispetto ai sub-goal.

In pratica, il sistema tratta il context window come una working memory limitata e usa tecniche di "context engineering" (compaction, note strutturate, stato persistente) per non saturarlo, mantenendo alta la densità di informazione utile. Questo è uno dei motivi principali per cui i report risultano più coesi e meno "rumorosi" rispetto ad altri sistemi che buttano intere pagine nel prompt.

## 3. Come recupera le informazioni

Il recovery non è un semplice retrieval statico (tipo RAG classico), ma un processo attivo, iterativo e guidato dal ragionamento:

- **Query refinement progressivo:** Parte da ricerche ampie, legge i risultati, poi genera query successive più precise o pivot (es. se incontra un paywall cerca versioni pubbliche o summary ufficiali). Un singolo task può generare dozzine di search e fetch.
- **Lettura approfondita + analisi:** Non si limita agli snippet di search. Apre le pagine, scrolla, estrae da PDF e immagini, e può usare Python per calcoli/statistiche/grafici.
- **Cross-checking e risoluzione conflitti:** Confronta fonti multiple, segnala discrepanze, privilegia fonti autorevoli (gov, edu, paper peer-reviewed, report ufficiali) e aggiorna la confidenza.
- **Criteri di stop:**
  - Copertura sufficiente (es. ≥2 fonti indipendenti per sub-question, o 1 se molto autorevole)
  - Novità esaurita (le ultime ricerche non aggiungono nulla di rilevante)
  - Conflitti risolti o documentati
  - Limiti hard di budget (tempo ~20-30 min, numero di search/page fetch, iterazioni di reasoning)
- **Citazioni precise:** Durante l'intero processo tiene traccia di URL + passaggi specifici. Nella sintesi finale ogni claim importante è collegato alla fonte esatta.

Il modello di ragionamento permette di "ricordare" e collegare pezzi di informazione raccolti a distanza di molti step, grazie al training e alla gestione dello stato descritta sopra.

## Perché spesso dà risultati superiori

- **Tempo e profondità:** Può dedicarsi minuti/decine di minuti invece di secondi.
- **Gestione selettiva del contesto:** Evita il "context rot" (diluizione dell'informazione rilevante) tipico di sistemi che accumulano tutto.
- **Training specifico:** RL end-to-end su task di ricerca reali + ottimizzazione per browsing + sintesi.
- **Citazioni e verificabilità:** Forza il modello a basarsi su evidenze tracciabili.
- **Pianificazione + backtracking:** Non è una pipeline fissa; adatta la strategia in corso d'opera.

## Limiti e note di trasparenza

OpenAI non rivela i dettagli esatti di compaction, schema delle note intermedie o policy di eviction (sono IP). Quello che sappiamo deriva da:

- Comunicati ufficiali e system card
- Guide API (o3-deep-research / o4-mini-deep-research)
- Analisi di osservatori e reverse-engineering comportamentale
- Pattern comuni nei sistemi agentici di ricerca (inclusi open-source ispirati)

In sintesi: Deep Research non "ricorda" magicamente di più. Usa un modello di ragionamento potente + un loop agentico + tecniche di context engineering selettivo (estrazione, note strutturate, compaction guidata dal goal, stato di ricerca persistente) per mantenere alta la densità di informazione rilevante e recuperare/sintetizzare in modo mirato. Questo approccio è più sofisticato della maggior parte delle altre implementazioni di "deep research" o di search agentici standard, e spiega in buona parte la qualità percepita superiore.

Se vuoi approfondire un aspetto specifico (es. confronto con Gemini Deep Research, Claude, o pattern open-source), dimmi pure.
