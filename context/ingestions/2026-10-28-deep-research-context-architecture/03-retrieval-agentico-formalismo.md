---
title: Deep Research — retrieval agentico e ingegneria del contesto (formalismo)
type: ai-response-archive
source: AI esterna non dichiarata — blocco 3 di 4 incollato dal Director in sessione
date: 2026-10-28
status: archived-verbatim
note: Provenienza del modello non dichiarata (stile report accademico, lista
  fonti in coda). Attenzione: il formalismo matematico (DAG, tuple, soglie
  "30-60 query SERP", "double compression", "notes accumulator") è una
  ricostruzione plausibile presentata come fatto — OpenAI non pubblica questi
  dettagli. Da trattare come modello concettuale, non come architettura reale.
  Formattazione appiattita dal paste; contenuto verbatim.
related: R-292
---

# Architettura dei Sistemi di Deep Research: Meccanismi di Retrieval Agentico e Ingegneria della Memoria di Contesto

L'evidente superiorità qualitativa manifestata dai sistemi di ricerca autonoma profonda, quale la funzione Deep Research integrata nell'ecosistema web di OpenAI, scaturisce da una transizione architetturale radicale rispetto ai tradizionali modelli linguistici aumentati tramite recupero informativo. La differenza percepita non è riconducibile a un semplice incremento volumetrico dei parametri neurali o all'estensione passiva della finestra di contesto, bensì alla transizione da una pipeline sequenziale a un'architettura agentica a lungo orizzonte (long-horizon agentic system). In tale impianto, modelli specializzati di ragionamento avanzato, derivati dalla famiglia OpenAI o3 e ottimizzati tramite apprendimento per rinforzo (Reinforcement Learning, RL) applicato a compiti empirici di navigazione, orchestrano un'esplorazione euristica strutturata, governando attivamente cosa deve essere acquisito, distillato e conservato nella memoria di lavoro e cosa deve essere scartato per evitare il degrado dell'attenzione.

## Il Salto Paradigmico: Dalla Generazione Aumentata Lineare al Retrieval Agentico

La totalità dei sistemi convenzionali di risposta aumentata si basa sul paradigma classico della Retrieval-Augmented Generation (RAG) statica o a singolo passaggio. In tale schema convenzionale, l'interrogazione formulata dall'utente viene tradotta in un vettore denso, confrontata con un indice documentale o con i risultati superficiali di un motore di ricerca, e i primi frammenti testuali estratti (chunks) vengono inseriti passivamente nel prompt del trasformatore. Questo approccio "one-shot" si rivela inefficace ogniqualvolta la risoluzione della richiesta implichi dipendenze logiche complesse, fonti contraddittorie o la necessità di verificare premesse fattuali non esplicitate.

Al contrario, i sistemi di Deep Research concepiscono il processo di acquisizione come una traiettoria decisionale formalizzabile attraverso una sequenza di triplette composte da riflessione esplicita, azione operativa e osservazione ambientale:

```
H_T = ((q, s_0), (r_1, a_1, o_1), (r_2, a_2, o_2), …, (r_T, a_T, o_T))
```

In questo formalismo matematico, `q` individua il quesito iniziale e `s_0` lo stato originario del contesto. A ogni iterazione temporale `t≤T`, la politica neurale dell'agente `π` sintetizza una sequenza di ragionamento interno `r_t` e determina l'azione esecutiva `a_t` sulla base della cronologia pregressa `H_{t−1}`. L'azione si interfaccia con l'ambiente esterno attraverso strumenti dedicati, e l'osservazione risultante `o_t` modifica dinamicamente lo stato informativo dell'agente, inducendo una revisione incrementale delle ipotesi di indagine fino al soddisfacimento dei criteri di convergenza e alla generazione della relazione finale `a_T`.

| Parametro Architetturale | RAG Convenzionale (Naive / Pipeline) | Ricerca Agentica Avanzata (Deep Research) |
|---|---|---|
| Flusso Computazionale | Deterministico e sequenziale a passaggio singolo (retrieve-then-read). | Ciclo ricorsivo chiuso di pianificazione, azione, osservazione e riflessione guidato da RL. |
| Dinamica di Interrogazione | Query singola statica, talvolta soggetta a riscrittura euristica preliminare. | Esplorazione adattiva con biforcazione e convergenza progressiva delle sotto-interrogazioni. |
| Isolamento del Contesto | Assente; i passaggi estratti condividono un unico spazio contestuale globale. | Modulare e gerarchico, con separazione rigida tra sub-agenti e supervisore. |
| Gestione delle Anomalie | Accettazione passiva dei risultati nulli o non pertinenti estratti dal retriever. | Backtracking sistematico di fronte a vicoli ciechi informativi o contenuti sotto paywall. |
| Strumentazione Operativa | Limitata a database vettoriali o interfacce di ricerca standard. | Ricerca SERP, navigazione DOM, scraping PDF, ricerca testuale esatta e sandbox Python. |
| Tracciabilità Probatoria | Correlazione approssimativa tra testo generato e documento complessivo. | Ancoraggio stringente tramite offset di caratteri, numeri di riga e annotazioni semantiche verificate. |

## Meccanica di Recupero delle Informazioni: Esplorazione Multi-Scala e Navigazione Euristica

Il meccanismo attraverso il quale l'architettura individua le informazioni in rete supera la mera aggregazione di collegamenti ipertestuali, articolandosi in un processo investigativo a più fasi che replica la condotta metodologica di un analista umano.

### Chiarimento del Dominio e Scoping Funzionale

Il processo viene inaugurato da un modulo di triage che interpella strumenti specializzati, denominati nell'infrastruttura di OpenAI come `research_kickoff_tool` ed esposti tramite primitive quali `clarify_with_text`. Qualora l'interrogazione dell'utente presenti gradi elevati di ambiguità o parametri non specificati, il sistema sospende temporaneamente l'esecuzione e genera quesiti interattivi di chiarimento rivolti all'utente. Questa riduzione preliminare dell'entropia operativa impedisce la dispersione computazionale in traiettorie irrilevanti e circoscrive i vincoli di ricerca prima dell'allocazione massiccia delle risorse di navigazione.

### Pianificazione Decompositiva e Dipendenze Topologiche

A valle del chiarimento, il sistema trasforma la richiesta in un piano operativo dettagliato. Tale pianificazione non assume una conformazione lineare, ma si struttura come un grafo aciclico diretto (Directed Acyclic Graph, DAG) delle conoscenze:

```
G = (V, E)
```

Nel grafo, ogni vertice `v_i ∈ V` denota un sotto-compito atomico definito dalla tupla:

```
v_i = (t_i, d_i, s_i, c_i)
```

dove `t_i` designa la tipologia funzionale del processo (come ricerca esplorativa, verifica di attendibilità o estrazione numerica), `d_i` rappresenta la direttiva specifica, `s_i` lo stato di avanzamento operativo e `c_i` il contesto semantico parziale consolidato. Gli archi orientati `e_ij = (v_i, v_j) ∈ E` formalizzano le dipendenze logiche tra compiti, garantendo che le indagini sussidiarie vengano eseguite secondo un ordine gerarchico coerente, abilitando al contempo l'esplorazione parallela dei rami indipendenti.

### Primitive di Navigazione Multi-Scala

L'esplorazione empirica del web viene eseguita combinando tre distinte primitive di interazione, che permettono una scansione progressiva che va dal livello macroscopico a quello puntuale:

- La primitiva di ricerca (**search**) inoltra interrogazioni a motori di indicizzazione globale per estrarre metadati aggregati, inclusi titoli, URL univoci e frammenti testuali riassuntivi (snippets), fungendo da filtro di primo livello per individuare le fonti candidate.
- La primitiva di apertura del documento (**open_page**) recupera l'intero corpo testuale o il Document Object Model (DOM) della risorsa web, decodificando formati complessi quali pagine HTML dinamiche o file accademici in formato PDF.
- La primitiva di individuazione mirata (**find_in_page**) agisce sul documento aperto simulando una scansione lessicale esatta su termini tecnici, entità denominate o indicatori statistici, consentendo al sistema di verificare un'informazione critica senza dover processare sequenzialmente l'intera estensione testuale.

Qualora l'evidenza documentale richieda elaborazioni quantitative, aggregazioni di tabelle o analisi di serie storiche, il modello delega l'elaborazione a un interprete di codice Python sandboxed (code_interpreter), capace di scaricare file strutturati, verificare la coerenza matematica dei dati grezzi e produrre distribuzioni sintetiche prima del loro riassorbimento nel flusso cognitivo.

### Euristica di Raffinamento e Condizioni di Risoluzione

L'esplorazione non procede lungo una lista immutabile di query. A ogni ricezione di dati, l'agente valuta la congruità delle fonti con il sotto-obiettivo e monitora costantemente la presenza di ostacoli quali paywall o siti a contenuto promozionale. All'insorgere di una barriera d'accesso, il sistema non interrompe l'indagine ma esegue un'operazione di arretramento strategico (backtracking), riformulando la traiettoria di ricerca per indirizzarla verso archivi secondari aperti, banche dati governative o relazioni istituzionali.

La terminazione della ricerca è governata da una doppia soglia decisionale. Da un lato opera un criterio qualitativo legato alla saturazione della copertura, che arresta l'esplorazione quando ciascun quesito ausiliario trova riscontro in almeno due fonti indipendenti conformi e le nuove ricerche producono un guadagno informativo marginale nullo. Dall'altro interviene un limite quantitativo sistemico basato sul consumo delle risorse (budget constraints), che pone un tetto rigido al tempo di esecuzione complessivo (variabile normalmente tra 5 e 30 minuti), al numero totale di chiamate verso strumenti esterni (tipicamente tra 30 e 60 interrogazioni SERP) e al massimo di documenti integrali ispezionati, prevenendo derive computazionali incontrollate.

## Ingegneria del Contesto: Selezione, Potatura e Compressione

La percezione diffusa che OpenAI Deep Research disponga di una modalità intrinsecamente superiore di memorizzare il contesto riflette l'eccellenza dell'ingegneria dei prompt e della memoria di lavoro implementata nel suo backend. Se l'agente iniettasse il testo grezzo di decine di pagine web all'interno del contesto esecutivo, saturerebbe tempestivamente anche una finestra dimensionata su 200.000 token, incorrendo nei fenomeni fisiologici di **context thrashing** (continua sovrascrittura distruttiva del contesto), **context clash** (interferenza di attenzione causata da istruzioni mutuamente incompatibili provenienti da diverse sezioni web) e nel noto degrado da dispersione semantica per cui i dettagli situati al centro della memoria di contesto vengono ignorati dal modello (**lost-in-the-middle degradation**). Per superare queste criticità, l'infrastruttura applica una complessa stratificazione gerarchica.

| Livello della Pipeline | Entità Esecutrice | Flusso di Input Elaborato | Meccanismo di Potatura e Compressione | Stato Conservato nel Contesto Superiore |
|---|---|---|---|---|
| Estrazione In-Flight | Moduli di fetching e parsing documentale. | Codice sorgente HTML, metadati, testo non strutturato, script. | Rimozione dei componenti grafici/strutturali irrilevanti e troncamento a monte dei caratteri eccedenti. | Testo pulito del documento (raw body text). |
| Isolamento Contestuale | Sotto-agenti operativi (Sub-Agents). | Pagine web candidate, estratti e storico delle chiamate al motore. | Valutazione limitata al sotto-compito; eliminazione del rumore esplorativo e dei tentativi falliti. | Sintesi concisa delle risultanze (findings) provvista di ancoraggi. |
| Memoria di Lavoro | Supervisore orchestratore del flusso. | Sintesi prodotte da ciascun sotto-agente al termine del suo ciclo. | Accorpamento in blocchi di memoria dedicati (notes accumulator) e depurazione dei duplicati concettuali. | Quadro probatorio globale strutturato (global learnings state). |
| Generazione Finale | Modulo scrittore di sintesi (Writer Engine). | Brief originario e note sintetiche consolidate dal supervisore. | Generazione ad alta densità in passaggio singolo (one-shot generation); esclusione di ogni log operativo. | Relazione analitica definitiva completa di collegamenti ipertestuali. |

### Isolamento Contestuale e Segmentazione Funzionale

Il nucleo operativo si fonda sulla segregazione radicale delle finestre di contesto tra supervisore e sotto-agenti di ricerca. L'agente supervisore conserva esclusivamente il quadro d'insieme del problema e le direttive del report. Quando un filone d'indagine deve essere sviluppato, il supervisore istanzia un sotto-agente dedicato, incapsulando il suo operato in una finestra di contesto temporanea, autonoma ed effimera.

All'interno di questo spazio isolato, il sotto-agente persegue il proprio micro-obiettivo, sperimenta query, gestisce fallimenti di navigazione ed elabora i dati grezzi. Poiché la cronologia grezza delle chiamate ai tool e i documenti integrali non superano mai la soglia del sotto-agente, la finestra di contesto del supervisore non viene contaminata dall'entropia tipica del web browsing.

### Compressione a Due Stadi (Double Compression)

La selezione di cosa debba permanere nella memoria si concretizza attraverso due distinti filtri a cascata. Nel primo stadio, applicato durante il recupero dei contenuti, interviene una compressione mirata basata su modelli ausiliari leggeri che analizzano il testo recuperato della pagina rispetto alla specifica interrogazione assegnata, scartando preliminarmente paragrafi fuori tema, divagazioni o elementi pubblicitari prima che occupino memoria attiva.

Nel secondo stadio, al compimento dell'indagine specialistica, il sotto-agente esegue una chiamata finale di consolidamento denominata pulizia delle evidenze (findings cleaning). Questa fase prescinde da qualsiasi pre-stesura stilistica del report; il sotto-agente sintetizza rigorosamente le prove fattuali emerse, estrae i valori numerici pertinenti e registra le risultanze accompagnate dalle relative attribuzioni. È unicamente questo distillato informativo ad alta densità semantica a essere restituito al supervisore.

### Memoria Condivisa, Scratchpad e Blocco Note

Le sintesi convalidate convergono all'interno di uno spazio di memoria condiviso, assimilabile a uno scratchpad o a un accumulatore persistente di note strutturate (State schema). Il supervisore aggiorna incrementale questo stato di evidenze globali, verificando quali tasselli della tassonomia originaria siano stati coperti e quali richiedano un approfondimento ulteriore. Quando due sotto-agenti estraggono valutazioni apparentemente contrastanti su una determinata grandezza economica o scientifica, il supervisore registra la divergenza nel blocco note e genera un compito mirato di conciliazione, evitando la rilettura dell'intera documentazione di partenza.

## Integrità Epistemica e Protocolli di Citazione

Il livello di attendibilità e l'assoluta aderenza al contesto documentale mostrati da Deep Research non costituiscono una caratteristica emergente spontanea, ma riflettono vincoli deterministici di decodifica e formattazione imposti a livello di sistema.

I modelli operativi di OpenAI impiegano vincoli sistemici volti a garantire una rigorosa conformità tra fatto esposto e fonte primaria. Nelle specifiche dei prompt interni trapelate per i moduli di ricerca profonda, l'architettura vincola la conservazione dei riferimenti a uno standard formale rigoroso:

```
【{cursor}†L{line_start}(−L{line_end})?】
```

Questo token di coordinata lega qualsiasi affermazione generata dal sistema ai vettori di riga esatti memorizzati nei buffer di lettura originali. L'inclusione di immagini e tabelle nel testo sintetizzato sottostà alla medesima disciplina attraverso primitive dedicate come `embed_image`, le quali possono essere attivate esclusivamente qualora l'agente abbia effettivamente visitato l'immagine e verificato la risorsa visuale primaria, con vincoli precisi circa la collocazione all'inizio dei paragrafi descrittivi e l'interdizione da un utilizzo ripetuto della medesima fonte visiva.

Un'ulteriore garanzia di rigore discende dal disaccoppiamento temporale e computazionale tra la fase analitica e la fase di redazione documentale. Nei motori convenzionali a ricerca integrata, la formulazione stilistica dell'output procede di pari passo con la scoperta delle fonti, frammentando le capacità di attenzione del modello tra eleganza espositiva, corretta sintassi e controllo fattuale. Nel paradigma di Deep Research, invece, la fase di indagine si dedica in via esclusiva all'esplorazione, alla verifica e alla potatura contestuale.

La stesura definitiva del testo interviene unicamente quando la fase di ricerca ha esaurito i propri obiettivi. A questo punto, il motore redazionale riceve esclusivamente il prompt originario arricchito dai chiarimenti dell'utente e lo scratchpad delle evidenze compresso e ripulito. Disponendo di un contesto ad altissima concentrazione semantica, completamente depurato da imperfezioni di rete, errori di scraping o istruzioni operative spurie, il trasformatore massimizza l'aderenza delle citazioni e struttura un resoconto analitico denso, privo di allucinazioni contestuali e pienamente tracciabile fino ai singoli registri primari di provenienza.

## Conclusioni

L'efficacia superiore registrata nell'utilizzo quotidiano di OpenAI Deep Research è il risultato convergente di scelte architetturali volte a risolvere i colli di bottiglia propri dei trasformatori convenzionali e dei sistemi RAG tradizionali.

Il sistema ottiene prestazioni ragguardevoli poiché non sottopone l'intero corpus documentale all'attenzione del modello generativo finale, ma struttura l'indagine attraverso una gerarchia agentica modulare in cui sotto-agenti a ciclo chiuso esplorano il web mediante primitive multi-scala (search, open_page, find_in_page), attuano il backtracking metodologico e comprimono a più stadi le sole evidenze fattuali pertinenti.

Attraverso la memorizzazione di uno scratchpad intermedio ad alta fedeltà, provvisto di vincoli stringenti di ancoraggio alle coordinate di riga e completamente separato dai registri grezzi di navigazione, il sistema consente alla fase finale di sintesi di operare su una base conoscitiva distillata e priva di rumore di fondo, unificando profondità analitica, coerenza globale e tracciabilità rigorosa delle fonti.

## Fonti citate dal report originale

blog.promptlayer.com — Understanding OpenAI's Deep Research Methodology · youreverydayai.com — Ep 454: OpenAI's Deep Research - How it works and what to use it for · arxiv.org — A Fully Open Pipeline for Long-Horizon Deep Research Trajectory · deploymentsafety.openai.com — Deep Research System Card · skywork.ai — OpenAI: o3 Deep Research Free Chat Online · redis.io — Agentic RAG: How enterprises are surmounting the limits · agent.scafffold.com — Agentic RAG vs RAG: How Retrieval Evolved Through Five Stages · huggingface.co — In-Depth Analysis of the Latest Deep Research Technology · langchain.com — Open Deep Research · docs.haystack.deepset.ai — Deep Research Agent · boundaryml.com — ai that works: Agentic RAG + Context Engineering · developers.openai.com — Deep research | OpenAI API · github.com — system_prompts_leaks/OpenAI/tool-deep-research.md · github.com — Deep Research Agents Cookbook · docs.temporal.io — Deep research | AI Cookbook · aclanthology.org — Advancing Deep Research with Dynamic Structured Knowledge Flow · alphaxiv.org — FlowSearch · developers.openai.com — Context Engineering for Personalization · fast.io — ChatGPT Deep Research Limits · letta.com — Memory Blocks: The Key to Agentic Context Management · developers.openai.com — Practical Guide for Model Selection
