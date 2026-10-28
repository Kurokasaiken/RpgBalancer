---
title: Deep Research — memoria stratificata, "Dreaming" e context injection
type: ai-response-archive
source: AI esterna non dichiarata — blocco 1 di 4 incollato dal Director in sessione
date: 2026-10-28
status: archived-verbatim
note: Provenienza del modello non dichiarata. Attribuisce ad OpenAI il termine
  "Dreaming" — da verificare (nel blocco 4 lo stesso termine è attribuito ad
  Anthropic). Formattazione appiattita dal paste; contenuto verbatim.
related: R-292
---

La tua percezione è acuta: la superiorità di ChatGPT Deep Research rispetto ad altre AI non risiede in un singolo “trucco”, ma in un'architettura a più livelli che separa nettamente la memoria a lungo termine (ciò che viene conservato tra sessioni) dalla gestione del contesto operativo (ciò che viene iniettato nel prompt durante l'esecuzione di un compito). Questa separazione, unita a un workflow agentico di pianificazione e recupero iterativo, è ciò che probabilmente produce la sensazione di risultati “molto migliori”.

Ecco un'analisi approfondita di entrambi i meccanismi, basata su documentazione tecnica, analisi di reverse-engineering e paper accademici.

## 🧠 Come ChatGPT sceglie cosa “salvare”: la memoria stratificata e il processo Dreaming

A differenza di un semplice chatbot che ricomincia da zero a ogni conversazione, ChatGPT mantiene una memoria persistente, ma non salva tutto indiscriminatamente. La documentazione OpenAI chiarisce che il sistema determina attivamente quali informazioni siano rilevanti e che le memorie salvate sono distinte dalla cronologia chat.

L'evoluzione è passata da un sistema manuale (in cui l'utente doveva dire “ricorda che…”), introdotto nel 2024, a un sistema automatizzato. Il salto di qualità è avvenuto con l'introduzione del processo “Dreaming” (Sogno): un processo in background che, senza che l'utente se ne accorga, analizza lo storico delle conversazioni, filtra, estrae e sintetizza le informazioni utili, creando o aggiornando i cosiddetti “memory entries”. Questo permette al modello di apprendere preferenze, progetti e vincoli anche quando non gli viene esplicitamente ordinato di farlo.

La selezione segue quindi un doppio binario:

- **Memorie salvate esplicite:** informazioni che l'utente ha chiesto direttamente di conservare.
- **Memorie sintetizzate da Dreaming:** fatti, preferenze e contesti dedotti automaticamente dall'analisi delle conversazioni passate. OpenAI ha recentemente potenziato questa architettura, portando la capacità di richiamo fattuale dal 67,9% all'82,8% e l'aderenza alle preferenze dal 55,3% al 71,3%.

Questo processo di selezione è fondamentale perché evita di “intasare” la memoria con dettagli irrilevanti, mantenendo un profilo sintetico ma utile nel tempo.

## 🔍 Come Deep Research recupera le informazioni: contesto precalcolato e ricerca iterativa

Qui sta la differenza più netta rispetto ad altre architetture. Il recupero non avviene tramite una semplice ricerca vettoriale al momento della domanda, ma attraverso una combinazione di iniezione di contesto precalcolata e recupero agentico on-demand.

### 1. L'iniezione di contesto “a strati” (precomputed context injection)

Un'analisi di reverse-engineering del sistema di memoria di ChatGPT (contrapposto a quello di Claude) ha rivelato che ChatGPT non interroga dinamicamente un database vettoriale per ogni messaggio. Invece, il sistema assembla un set fisso di componenti di contesto e li inietta direttamente in ogni prompt, in posizioni note. Questo rende latenza, uso di token e comportamento del sistema molto più prevedibili.

Il prompt che il modello riceve è strutturato in strati ordinati dal più globale al più immediato:

1. Istruzioni di sistema
2. Istruzioni dello sviluppatore
3. Metadati di sessione (effimeri: dispositivo, tipo di account, ecc.)
4. Memoria utente (fatti a lungo termine)
5. Riepilogo delle conversazioni recenti (titoli e snippet di chat passate)
6. Messaggi della sessione corrente
7. Ultimo messaggio dell'utente

Questo approccio “a pacchetto” garantisce che il modello abbia sempre un quadro coerente del contesto, senza dover “cercare” ogni volta. È una scelta architetturale opposta a quella di Claude, che predilige un recupero RAG-style on-demand con aggiornamenti dinamici della memoria.

### 2. Il recupero durante un task di Deep Research: il ciclo agentico

Quando attivi la modalità Deep Research, il recupero diventa un processo attivo e iterativo. Il sistema non si limita a leggere la memoria, ma pianifica ed esegue una traiettoria di ricerca multi-step. I modelli utilizzati (versioni di o3/o4-mini ottimizzate per il browsing) sono stati addestrati tramite apprendimento per rinforzo end-to-end per pianificare, eseguire, tornare indietro (backtracking) e reagire in tempo reale alle informazioni che incontrano.

Il workflow dominante in tutti i sistemi di Deep Research maturi è un ciclo Plan → Search → Read → Reflect → Iterate → Synthesize. Nel caso di OpenAI, il sistema adotta una strategia di “Intent-to-Planning”: prima di lanciarsi nella ricerca, pone domande di chiarimento all'utente su scope e formato, riducendo il rischio di esplorare direzioni sbagliate.

Durante l'esecuzione, il recupero è guidato da due esigenze contrapposte:

- **Ampiezza:** deve consultare decine o centinaia di fonti.
- **Budget di contesto:** non può “stipare” 200.000+ token di contenuti crawler in un'unica finestra.

Per risolvere questo problema, Deep Research utilizza tecniche di compressione e gestione del budget di contesto. OpenAI ha introdotto a livello API una funzione di “Context Compaction”: durante task lunghi, i passaggi di ragionamento passati e le informazioni a bassa rilevanza vengono automaticamente compressi, mantenendo solo il contesto essenziale. In pratica, il sistema “dimentica” selettivamente il superfluo per far spazio a nuova evidenza, senza perdere il filo del discorso.

## ⚖️ Perché questo si traduce in risultati percepiti come superiori

La combinazione di questi due livelli spiega la differenza qualitativa:

- **Continuità senza sforzo:** grazie a Dreaming e all'iniezione di memoria, Deep Research parte già con un profilo dell'utente e del progetto. Non spreca i primi turni a farsi spiegare il contesto, e può dedicare l'intera finestra di contesto alla ricerca vera e propria.
- **Profondità di ricerca senza “perdersi”:** il ciclo agentico con backtracking permette di esplorare percorsi alternativi se una fonte si rivela debole, cosa che un semplice RAG a singolo passaggio non può fare. Il modello non si limita a recuperare i primi chunk più simili, ma costruisce attivamente la conoscenza.
- **Gestione intelligente dell'evidenza:** la capacità di comprimere il contesto e di iniettare solo i pezzi rilevanti al momento giusto evita il degrado tipico dei modelli con finestre di contesto molto lunghe, in cui il rumore accumulato diluisce i segnali importanti. La ricerca accademica conferma che architetture che separano un “contesto di lavoro fluido” da una “memoria cristallizzata” a lungo termine (come il Cognitive Scaffold) riducono drasticamente le allucinazioni da compressione e migliorano la qualità dei report.

In sintesi, mentre altre AI spesso trattano la memoria come un archivio piatto da interrogare e il contesto come una finestra da riempire, ChatGPT Deep Research tratta la memoria come un processo di sintesi continuo e il contesto come una risorsa dinamica da gestire attivamente durante un percorso di ricerca pianificato. È questa orchestrazione, più che un singolo componente, a creare il vantaggio che noti.
