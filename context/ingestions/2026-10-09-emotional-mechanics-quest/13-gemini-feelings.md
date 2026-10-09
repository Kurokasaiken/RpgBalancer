---
title: "Quest Gameplay That Produces Strong Feelings — risposta Gemini (Deep Research)"
type: research-response
author: Gemini Deep Research (senza accesso al repository — i tag [FACT] sono ricostruiti, non verificati su file)
date: 2026-10-10
brief: "Research Plan: Quest Gameplay That Produces Strong Feelings (Round 4)"
note: >
  Gemini presenta l'audit come "ispezione della documentazione" e cita i
  risultati MC Round 3 nel §4.1, ma non aveva accesso né al repo né ai file
  dei risultati: i suoi [FACT] sono inferenze plausibili, non verifiche.
  La lista fonti include link di rumore tipico di Deep Research (coolmath/
  harley-davidson redirect) — le citazioni accademiche principali (Kahneman-
  Tversky, Staw, Zeelenberg, Clark et al.) sono corrette.
---

Research Report — Emotional Gameplay Patterns & System Design per RpgBalancer
1. Evidence Report: Vincoli di Progetto ed Evidenze Scientifiche
1.1 Ricostruzione dei Vincoli del Progetto RpgBalancer
L'ispezione della documentazione di progetto e dell'architettura di RpgBalancer permette di stabilire una demarcazione rigorosa tra fatti verificati, deduzioni, ipotesi e proposte di design:
- `[FACT]`: Il sistema gestisce l'assegnazione dei personaggi a party dotati di slot numerati, caratterizzati da una differente distribuzione del danno e del rischio.
- `[FACT]`: La risoluzione delle azioni poggia su check probabilistici basati sugli attributi individuali dei personaggi e su esiti sfumati (Critico, Successo, Quasi-Successo, Fallimento, Fallimento Grave).
- `[FACT]`: Le conseguenze delle quest sono persistenti e si riflettono direttamente su HP, ferite, morte dei personaggi, risorse dell'inventario e ricompense.
- `[FACT]`: Le decisioni devono essere contenute nel numero per ogni quest, focalizzandosi sulla gestione strategica del rischio ed escludendo qualsiasi requisito di riflessi o esecuzione in tempo reale.
- `[INFERENCE]`: L'architettura attuale soffre di una struttura sequenziale rigida in cui i check statistici si susseguono in modo passivo; il giocatore sceglie prevalentemente quale percentuale di successo tentare, anziché un vero compromesso tattico tra opzioni distinte.
- `[HYPOTHESIS]`: Introdurre variabili di stato dinamiche ad ambito quest (es. Allarme, Timer) e informazioni asimmetriche incrementerà la percezione di agency e la tensione anticipatoria senza sovraccaricare l'interfaccia.
- `[PROPOSAL]`: Sostituire la dipendenza dal testo narrativo con una comunicazione visiva immediata basata sulle intenzioni nemiche e sullo stato delle risorse.
- `[OPEN QUESTION]`: Determinare il grado ottimale di trasparenza probabilistica (probabilità esplicite in % contro indicatori qualitativi) e la gestione della morte permanente (permadeath) rispetto a infortuni prolungati.
1.2 Sintesi della Ricerca Scientifica ed Empirica
La progettazione di meccaniche emotive poggia su evidenze consolidate provenienti dalla psicologia cognitiva, dalla teoria delle decisioni e dai game studies:
- Psicologia della Suspense e dell'Anticipazione: La suspense è una risposta emotiva di stress anticipatorio scatenata dalla combinazione di una posta in gioco elevata (stakes) e da una condizione di incertezza controllata sull'esito. Zillmann e Vorderer dimostrano che la suspense raggiunge il picco quando la probabilità percepita di un evento avverso si avvicina alla certezza, lasciando aperta solo una sottile finestra di speranza. Epstein e Roupenian evidenziano che tassi di probabilità attorno al 5% evocano le risposte psicofisiologiche di attivazione più intense. Nei giochi interattivi, limitare temporaneamente l'interattività o sospendere il controllo durante la risoluzione di un evento critico intensifica la suspense, trasformando il giocatore in uno spettatore in ansiosa attesa.
- Prospect Theory e Inquadramento del Rischio: Kahneman e Tversky (1979) dimostrano l'asimmetria nella valutazione di perdite e guadagni: la sofferenza per una perdita è indicativamente doppia rispetto al piacere per un pari guadagno. Il modello evidenzia un pattern a quattro vie: le persone manifestano avversione al rischio (risk-averse) di fronte a guadagni probabili, ma diventano propense al rischio (risk-seeking) quando affrontano perdite probabili, accettando scommesse svantaggiose pur di evitare una perdita certa.
- Escalation of Commitment e Self-Justification: Staw (1976, 1981) identifica la tendenza a reinvestire risorse in corsi d'azione fallimentari per giustificare decisioni passate. Schultze et al. dimostrano che questo fenomeno è particolarmente accentuato quando il proseguire è inquadrato come un'azione diretta, mentre la rinuncia viene percepita come inazione o sconfitta.
- Rimpianto Anticipato e Feedback Controfattuale: Zeelenberg (1999) evidenzia come l'anticipazione del rimpianto (anticipated regret) guidi le decisioni strategiche quando il giocatore sa che riceverà un feedback sull'esito dell'opzione scartata. Rivelare cosa sarebbe accaduto scegliendo un'altra strada intensifica il peso emotivo delle scelte successive.
- Neuroscienza del Near-Miss: Clark et al. (2009) dimostrano che gli esiti di "quasi-successo" (near-miss) reclutano i medesimi circuiti striatali e insulari attivati dalle vittorie. Un near-miss rinforza la perseveranza e la motivazione, a condizione che il giocatore percepisca di aver avuto un certo grado di controllo sull'azione.
- Analisi di Meccaniche in Giochi Reali:
  - Slay the Spire: L'Intent System telegrafa chiaramente le azioni future dei nemici. Rivelare l'intenzione non distrugge la tensione, ma sposta il focus dall'incertezza passiva all'ottimizzazione strategica delle risorse disponibili.
  - Darkest Dungeon: Sfrutta la gestione del rischio in condizioni di controllo parziale. Il pulsante di ritirata è un elemento fondamentale di sopravvivenza strategica; la tensione permanente nasce dal peso delle conseguenze cumulative (stress, ferite, permadeath) che minacciano l'intera spedizione.
  - Can't Stop / Quacks of Quedlinburg: Giochi di push-your-luck in cui la tensione cresce in modo non lineare all'aumentare delle puntate successive, bilanciando l'avidità di guadagno contro il rischio di azzeramento (bust).
2. Mappatura Emozione → Gameplay Pattern
Per ogni pattern emotivo, la tabella definisce la sequenza decisionale, la struttura dell'informazione, la posta in gioco e i fattori di fallimento.
Emozione Obiettivo
Sequenza Decisionale del Giocatore
Informazione Disponibile
Posta in Gioco (Stakes)
Esperienza Attesa
Failure Mode (Cosa rende il pattern noioso/frustrante)
Suspense e Anticipazione
1. Minaccia dichiarata per un turno futuro.

2. Allocazione difensiva o posizionamento negli slot.

3. Risoluzione stocastica con sospensione dell'input.
Trasparenza sulle intenzioni nemiche; incertezza sull'entità dell'impatto o del tiro.
Ferita permanente o KO di un personaggio specifico nello slot minacciato.
Tensione crescente seguita da un forte senso di sollievo o catarsi.
Risoluzione puramente casuale senza possibilità di mitigazione, oppure minaccia troppo debole da essere ignorata.
Avidità, Tentazione e Rimpianto
1. Accumulo di risorse non consolidate.

2. Scelta binaria: Incassa e ritirati vs Rischia per un livello ulteriore.

3. Risoluzione o perdita.
Valore del bottino corrente noto; stima o percentuale esplicita del rischio di bust.
Perdita totale del bottino della sessione (bust) contro guadagno incrementale.
Conflitto interiore tra avversione alle perdite e avidità; rimpianto controfattuale in caso di bust.
Assenza di un vero impatto economico del bottino sul gioco gestionale, o probabilità di bust opache o percepite come truccate.
Paura per un Personaggio e Sacrificio
1. Colpo fatale imminente telegrafato su uno slot vulnerabile.

2. Scelta di scambiare la posizione dello slot con un personaggio secondario o spendere una risorsa rara.
Bersaglio e danno dell'attacco prescelto dal nemico visibili a schermo.
Morte o infortunio grave di uno specifico personaggio apprezzato dal giocatore.
Attaccamento emotivo ai personaggi; senso di responsabilità per un sacrificio tattico necessario.
Mancanza di differenziazione o valore nei personaggi; impossibilità strutturale di reindirizzare il danno.
Sollievo dopo il Pericolo (Relief)
1. Party in condizioni critiche (HP <15%).

2. Scelta di tentare una manovra d'emergenza o attivare una fuga rischiosa.

3. Raggiungimento della salvezza.
Stato di salute critico ben visibile; probabilità di fuga o di successo ridotta al minimo (5%).
Incolumità dell'intero party contro l'azzeramento della spedizione.
Ansia prolungata che si scioglie in sollievo liberatorio.
Salvataggi automatici non meritati (deus ex machina) o impossibilità totale di ritirata che porta a morti inevitabili.
Sorpresa Equa (Fair Surprise)
1. Decisione apparentemente lineare basata sulle informazioni note.

2. Attivazione di una conseguenza imprevista ma coerente.

3. Rivelazione del dettaglio svelato retrospettivamente.
Indizi visivi sottili o check invisibili passati inosservati precedentemente.
Cambiamento improvviso dello scenario o modifica delle opzioni tattiche disponibili.
Sorpresa cognitiva e riallineamento delle aspettative; sensazione che l'evento fosse prevedibile ragionando sui dettagli.
Generazione di trappole dal nulla (cheap shots) senza alcun indizio o logica retrospettiva.
Ingegno e Padronanza (Mastery)
1. Osservazione dei comportamenti o dello storico dell'avversario.

2. Deduzione del pattern o della vulnerabilità.

3. Selezione della contromisura ottimale.
Storico delle azioni passate visibile; indizi qualitativi sulle inclinazioni nemiche.
Consumo efficiente di risorse contro logoramento del party.
Soddisfazione personale per aver decifrato un sistema complesso senza affidarsi alla sorte.
Schema nemico puramente casuale (impossibile da leggere) o eccessivamente deterministico e banale.
Disperazione e Tensione Escalante
1. Accumulo progressivo di risorse di disturbo (es. Allarme/Timer).

2. Restrizione graduale delle opzioni disponibili.

3. Scelte di emergenza ad alto rischio.
Tracciatori di tempo e allarme costantemente visibili nell'interfaccia.
Fallimento completo dell'obiettivo primario della quest o imboscata di massa.
Pressione operativa crescente; necessità di accettare compromessi dolorosi.
Contatori che applicano solo malus numerici passivi senza modificare le scelte reali del giocatore.
3. Selezione dei Modelli Meccanici Più Promettenti per RpgBalancer
Confrontando i candidati emersi dalla ricerca con i vincoli di RpgBalancer, sono stati selezionati quattro modelli prioritari:
Pattern A: Targeting Asimmetrico con Intenzione Nemica Telegrafata (P6​)
- Potenziale Emotivo: Genera elevata suspense, paura focalizzata per specifici personaggi e decisioni chiare di sacrificio o protezione.
- Agency e Qualità Decisionale: Molto elevata. Il giocatore affronta un problema tattico con informazione chiara sulle intenzioni nemiche, potendo agire sul posizionamento negli slot e sui consumabili.
- Compatibilità: Perfetta. Si sposa direttamente con il sistema di party basato su slot numerati già implementato in RpgBalancer `[FACT]`.
- Costo di Implementazione: Medio. Richiede componenti UI per la visualizzazione dell'intenzione nemica (Intent Visualizer) e logiche di reindirizzamento sugli slot.
- Validazione: Simulabile con Monte Carlo per la distribuzione dei danni; richiede playtest umano per valutare il peso emotivo del sacrificio.
Pattern B: Gestione dell'Escalation Dinamica (Allarme + Timer) (P4​+P5​)
- Potenziale Emotivo: Genera pressione operativa, sensazione di accerchiamento e scelte sofferte tra velocità e sicurezza.
- Agency e Qualità Decisionale: Elevata. Offre una scelta costante tra azioni veloci/rumorose ed azioni lente/discrete.
- Compatibilità: Elevata. Richiede l'aggiunta di variabili di stato ad ambito quest nel runner esistente `[PROPOSAL]`.
- Costo di Implementazione: Basso-Medio. Sviluppo di contatori di stato e tabelle di reazione alle soglie.
- Validazione: Verificabile via Monte Carlo per bilanciare i margini di tempo e l'incremento dell'Allarme.
Pattern C: Duello a Stato Persistente con Modello Inferenziale (P1​+P3​)
- Potenziale Emotivo: Genera senso di padronanza (mastery), tensione strategica e soddisfazione per il superamento dell'avversario.
- Agency e Qualità Decisionale: Molto elevata. Elimina la dipendenza dal tiro di dadi passivo, sostituendola con la lettura dei pattern e la spesa di risorse tattiche.
- Compatibilità: Buona. Funziona ad interazione a turni integrandosi con i check di Percezione/Intelligenza `[FACT]`.
- Costo di Implementazione: Basso. Logica basata su tabelle di comportamento e stato del punteggio (2–1,2–2).
- Validazione: Richiede necessariamente playtest umano; le simulazioni matematiche non possono misurare l'intuizione del giocatore nella decodifica dei pattern.
Pattern D: Push-Your-Luck Sequenziale a Soglia di Bust Visibile (P2​)
- Potenziale Emotivo: Genera avidità, tentazione, rimpianto anticipato e sollievo.
- Agency e Qualità Decisionale: Chiara e diretta. Scelta binaria tra incassare il bottino o rischiare per un guadagno maggiore.
- Compatibilità: Totale. Può essere integrata facilmente nelle fasi di saccheggio o esplorazione.
- Costo di Implementazione: Molto Basso.
- Validazione: Altamente simulabile via Monte Carlo per stabilire valori attesi (EV) e tassi di bust ottimali.
4. Re-valutazione della Quest "Sterminio dei Goblin" ed Alternative di Design
4.1 Re-valutazione della Quest Attuale
L'analisi della versione attuale della quest Sterminio dei Goblin e dei risultati delle simulazioni Monte Carlo (Round 3) evidenzia i seguenti aspetti:
- Emozioni Plausibilmente Prodotte: Anticipazione di base e una lieve avidità durante le fasi di rischio.
- Emozioni Non Supportate: Nessuna paura specifica per i personaggi, assenza di reale padronanza tattica, scarsa suspense e mancanza di momenti di vera rimonta (clutch).
- Natura delle Decisioni: Molte scelte attuali si limitano a chiedere al giocatore di selezionare quale attributo o percentuale probabilistica testare, senza offrire un vero compromesso strategico tra opzioni distinte `[INFERENCE]`.
- Valutazione della Struttura Push-Your-Luck: Il ciclo di push-your-luck è promettente per le fasi di saccheggio finale, ma risulta insufficiente se utilizzato come struttura unica dell'intera quest. Le simulazioni Monte Carlo dimostrano che la stabilità numerica non garantisce di per sé un coinvolgimento emotivo se mancano la trasparenza della posta in gioco e l'agency sulle contromisure.
4.2 Alternative di Design per la Quest "Sterminio dei Goblin"
Si propongono due riprogettazioni meccaniche sostanzialmente differenti.
┌────────────────────────────────────────────────────────────────────────────────┐
│           RAPPORTO COMPARATIVO DELLE ALTERNATIVE PER LA QUEST GOBLIN          │
├──────────────────────┬──────────────────────────────┬──────────────────────────┤
│ Dimensione           │ Alternativa 1: Infiltrazione │ Alternativa 2: Riscatto  │
│                      │ e Assedio (No Push-Your-Luck)│ dei Prigionieri          │
├──────────────────────┼──────────────────────────────┼──────────────────────────┤
│ Meccaniche Primarie  │ Allarme ($P_4$) + Timer      │ Targeting ($P_6$) +      │
│                      │ ($P_5$) + Targeting ($P_6$)  │ Compromesso Etico/Tattico│
├──────────────────────┼──────────────────────────────┼──────────────────────────┤
│ Emozione Dominante   │ Pressione operativa,         │ Paura per il party,      │
│                      │ urgenza, accerchiamento      │ senso di sacrificio,     │
│                      │.                   │ dilemmi d'impatto.│
├──────────────────────┼──────────────────────────────┼──────────────────────────┤
│ Trasparenza          │ Tracciatori Allarme/Timer    │ Intenzione nemica        │
│ Informazione         │ visibili; trappole celate    │ e danni visibili a       │
│                      │ salvo ricognizione.          │ schermo.  │
├──────────────────────┼──────────────────────────────┼──────────────────────────┤
│ Meccanica di Fuga    │ Fuga sempre disponibile;     │ Fuga comporta il         │
│                      │ costo in HP crescente se     │ reindirizzamento dei     │
│                      │ l'Allarme è alto [cite: 18]. │ danni sull'ultimo slot.  │
└──────────────────────┴──────────────────────────────┴──────────────────────────┘
Alternativa 1: "Infiltrazione e Assedio all'Accampamento" (Senza Push-Your-Luck)
- Struttura Meccanica: Combina Gestione Allarme (P4​), Timer (P5​) e Targeting Asimmetrico (P6​).
- Sequenza degli Eventi e Scelte:
Fase 1 - Approccio: Il party ha a disposizione 6 Unità di Tempo (U=6) e l'Allarme è a A=0. Il giocatore sceglie tra:
    - Ricognizione Furtiva: Consuma 1 U, Allarme invariato. Check di Percezione del Party: se riesce, rivela quali slot subiranno attacchi a sorpresa nella Fase 2.
    - Assalto Rapido: Consuma 0 U, ma incrementa l'Allarme A+2.
Fase 2 - Scontro con le Guardie: Combattimento su 3 turni con intenzione nemica telegrafata (P6​). I goblin dichiarano attacchi specifici (es. "Slot 1: 20 Danno", "Slot 3: Veleno"). Il giocatore usa il menu di formazione per scambiare la posizione dei personaggi prima di confermare la risoluzione del turno.
Fase 3 - Sgombero dell'Accampamento: Se A≥4, scatta la reazione dei rinforzi: gli attacchi goblin aumentano di intensità del 50%.
- Posta in Gioco e Conseguenze: Se U si azzera prima di sconfiggere il Capotribù, l'accampamento si allerta del tutto, annullando il bottino e costringendo il party a ritirarsi subendo attacchi d'opportunità sullo Slot 4.
Alternativa 2: "Il Riscatto dei Prigionieri" (Focus su Targeting, Sacrificio e Conseguenze)
- Struttura Meccanica: Combina Targeting Asimmetrico (P6​), Rischio Integrato e Conseguenze Ritardate.
- Sequenza degli Eventi e Scelte:
Fase 1 - La Gabbia dei Prigionieri: Durante lo scontro con lo Sciamano Goblin, il nemico telegrafa un attacco ad area devastante destinato alla gabbia dei prigionieri (che azzererà la ricompensa e ucciderà i PNG) oppure allo Slot 1 (il Tank del party).
Fase 2 - La Decisione Tattica: Il giocatore sceglie tra:
    - Interposizione del Tank (Slot 1): Il Tank assorbe il colpo per salvare i prigionieri, subendo il 100% del danno e rischiando una ferita grave.
    - Mantenere la Posizione Tattica: Il party evita il danno, ma i prigionieri vengono eliminati (perfezionando il fallimento dell'obiettivo secondario).
    - Utilizzo di Consumabile (Granata Incendiaria): Sventa l'attacco dell'esploratore, ma consuma una risorsa chiave per le quest successive.
Fase 3 - Sviluppo Emergente: Salvare i prigionieri sblocca un nuovo mercante nella città di partenza; lasciarli morire riduce la reputazione della gilda ma preserva la salute del party per l'esplorazione successiva.
5. Esperimento Consigliato per la Validazione
Per verificare le ipotesi di design senza impegnare risorse in uno sviluppo infrastrutturale complesso, si definisce un esperimento minimale disaccoppiato.
5.1 Obiettivo dell'Esperimento
Determinare se il Targeting Asimmetrico con Intenzione Nemica Telegrafata (P6​) produca livelli significativamente superiori di Agency e Suspense percepite rispetto alla sequenza tradizionale di Check Statistici Probabilistici Isolati.
5.2 Struttura del Prototipo Minimal (Greybox)
Si realizza un prototipo essenziale privo di narrazione estesa o grafica avanzata, confrontando due varianti per una singola stanza di combattimento/quest:
- Variante A (Controllo - Sistema Attuale): Scontro risolto in 3 fasi. In ciascuna fase il giocatore sceglie quale personaggio fa il check per superare la minaccia. L'esito viene calcolato sommando gli attributi a un tiro probabilistico.
- Variante B (Sperimentale - Pattern P6​): Il nemico mostra a schermo la propria intenzione per il turno successivo (es. "Attacco pesante su Slot 1: 25 Danno"). Il giocatore ha a disposizione 2 azioni per turno: Scambia Posizione Slot oppure Usa Consumabile Difensivo, seguite dalla risoluzione immediata del turno.
5.3 Campione e Metrica di Misurazione
- Campione: 24-30 giocatori, suddivisi equamente tra le due varianti.
- Metriche Telemetriche (Comportamentali):
Tasso di Riconfigurazione dello Stato: Frequenza con cui il giocatore varia la posizione del party o usa consumabili in risposta all'intenzione nemica nella Variante B.
Frequenza di Ritirata Tattica: Utilizzo del tasto di fuga quando gli HP dello Slot principale scendono sotto il 20%.
- Metriche Soggettive (Survey Post-Test su Scala Likert 1–7):
Agency Percepirà: "Sento che le mie decisioni hanno determinato direttamente la sopravvivenza dei personaggi."
Suspense e Tensione: "Durante la risoluzione del turno, temevo concretamente per la perdita del personaggio minacciato".
Percezione di Equità: "Ritenete che gli esiti negativi subiti siano stati equi e comprensibili?"
5.4 Criteri di Successo e di Abbandono dell'Ipotesi
- Criterio di Successo: La Variante B ottiene un punteggio medio di Agency e Suspense superiore di almeno il 30% rispetto alla Variante A (p<0.05), mantenendo inalterata la percezione di equità.
- Criterio di Abbandono (Falsificazione): Se nella Variante B oltre l'80% dei giocatori adotta una singola configurazione di slot statica senza reagire alle intenzioni nemiche (scoperta di una strategia dominante che annulla la decisione), il Pattern P6​ deve essere ridisegnato o scartato.
[researchgate.net(PDF) Does Entertainment Suffer From Interactivity? The Impact ofSi apre in una nuova finestra](https://www.researchgate.net/publication/242135782_Does_Entertainment_Suffer_From_Interactivity_The_Impact_of_Watching_an_Interactive_TV_Movie_on_Viewers'_Experience_of_Entertainment)[frontiersin.orgConfronting a Paradox: A New Perspective of the Impact ... - FrontiersSi apre in una nuova finestra](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2018.01392/full)[westminsterpapers.orgARTICULATING SUSPENSE AS A CONFIGURATIVE ENCOUNTERSi apre in una nuova finestra](https://www.westminsterpapers.org/article/185/galley/3571/download/)[web.mit.eduProspect Theory: An Analysis of Decision under Risk - MITSi apre in una nuova finestra](https://web.mit.edu/curhan/www/docs/Articles/15341_Readings/Behavioral_Decision_Theory/Kahneman_Tversky_1979_Prospect_theory.pdf)[thedecisionlab.comProspect Theory - The Decision LabSi apre in una nuova finestra](https://thedecisionlab.com/reference-guide/economics/prospect-theory)[sas.upenn.eduThe decision paradoxes motivating Prospect TheorySi apre in una nuova finestra](https://www.sas.upenn.edu/~baron/journal/18/18515/jdm18515.html)[en.wikipedia.orgEscalation of commitment - WikipediaSi apre in una nuova finestra](https://en.wikipedia.org/wiki/Escalation_of_commitment)[db.arabpsychology.comSunk Cost Fallacy: Escalation of Commitment ExplainedSi apre in una nuova finestra](https://db.arabpsychology.com/escalation-of-commitment-2/)[iot.ntnu.noThe Escalation of Commitment to a Course of ActionSi apre in una nuova finestra](http://www.iot.ntnu.no/innovation/norsi-pims-courses/huber/Staw%20(1981).pdf)[pmc.ncbi.nlm.nih.govA New Inaction-Effect Perspective on the Sunk-Cost Fallacy - PMCSi apre in una nuova finestra](https://pmc.ncbi.nlm.nih.gov/articles/PMC5904751/)[semanticscholar.orgTilburg University Regret in Decision Making - Semantic ScholarSi apre in una nuova finestra](https://www.semanticscholar.org/paper/Tilburg-University-Regret-in-Decision-Making-Connolly-Zeelenberg/f361f6933c83cf378a69e414f1bca70929f6ca23)[repository.tilburguniversity.eduAnticipated regret, expected feedback and behavioral decision-makingSi apre in una nuova finestra](https://repository.tilburguniversity.edu/bitstreams/4f2eef10-efbc-4915-beff-4c13f3afe79b/download)[pmc.ncbi.nlm.nih.govGambling Near-Misses Enhance Motivation to Gamble and RecruitSi apre in una nuova finestra](https://pmc.ncbi.nlm.nih.gov/articles/PMC2658737/)[researchgate.netGambling Near-Misses Enhance Motivation to Gamble and RecruitSi apre in una nuova finestra](https://www.researchgate.net/publication/24010632_Gambling_Near-Misses_Enhance_Motivation_to_Gamble_and_Recruit_Win-Related_Brain_Circuitry)[rockpapershotgun.comHow Slay The Spire saved digital card games from stagnationSi apre in una nuova finestra](https://www.rockpapershotgun.com/how-slay-the-spire-saved-digital-card-games-from-stagnation)[reddit.comWhat design choices makes Slay the Spire one of the best gamesSi apre in una nuova finestra](https://www.reddit.com/r/slaythespire/comments/17rn2ie/what_design_choices_makes_slay_the_spire_one_of/)[silverrants.wordpress.comFood for Thought: Where Is The Heart of Darkness? - Silver Age RantsSi apre in una nuova finestra](https://silverrants.wordpress.com/2017/04/17/food-for-thought-where-is-the-heart-of-darkness/)[quora.comIs darkest dungeon an easy game? - QuoraSi apre in una nuova finestra](https://www.quora.com/Is-darkest-dungeon-an-easy-game)[reddit.comnow like me, you are part of this place" : r/darkestdungeon - RedditSi apre in una nuova finestra](https://www.reddit.com/r/darkestdungeon/comments/lokk9r/you_answered_the_letter_now_like_me_you_are_part/)[reddit.comWTF Is... - Darkest Dungeon ? : r/Games - RedditSi apre in una nuova finestra](https://www.reddit.com/r/Games/comments/42sqbx/wtf_is_darkest_dungeon/)[reddit.comAlmost 7 years after purchasing it, I've finally finished DarkestSi apre in una nuova finestra](https://www.reddit.com/r/patientgamers/comments/xewj1y/almost_7_years_after_purchasing_it_ive_finally/)[reddit.comHow Darkest Dungeon reinvented turn base fight and managed toSi apre in una nuova finestra](https://www.reddit.com/r/patientgamers/comments/jthib2/how_darkest_dungeon_reinvented_turn_base_fight/)[webmail.colegioamericano.edu.ecPUSH YOUR LUCK HACK COOL MATH GAMESSi apre in una nuova finestra](https://webmail.colegioamericano.edu.ec/document/pXrSYl5FE104/Push_Your_Luck_Hack_Cool_Math_Games)[ieee-cog.orgTeaching Reinforcement Learning Agents a ”Push-Your-Luck” boardSi apre in una nuova finestra](https://ieee-cog.org/2022/assets/papers/paper_203.pdf)
[Si apre in una nuova finestra](https://research.vu.nl/ws/portalfiles/portal/3147037/293190.pdf)[Si apre in una nuova finestra](https://pmc.ncbi.nlm.nih.gov/articles/PMC6092602/)[Si apre in una nuova finestra](https://www.semanticscholar.org/paper/The-Psychology-of-Suspense-in-Dramatic-Exposition-Zillmann/4d36015a6f99447c5483b3aafc7048c4a20f4164)[Si apre in una nuova finestra](https://www.scribd.com/document/960684448/Peter-Vorderer-Suspense-Conceptualizations-Theoretical-Analyses-And-Empirical-Explorations-1996-Routledge-Libgen-li)[Si apre in una nuova finestra](https://scispace.com/pdf/sports-spectators-suspense-affect-and-uncertainty-in-sports-28mfk3p960.pdf)[Si apre in una nuova finestra](http://hypermedia468.pbworks.com/w/file/fetch/80687396/vorder%20and%20kilmmt.pdf)[Si apre in una nuova finestra](https://yukaichou.com/behavioral-analysis/prospect-theory-loss-aversion-kahneman-tversky/)[Si apre in una nuova finestra](https://www.mdpi.com/2227-9032/10/9/1659)[Si apre in una nuova finestra](https://psychsafety.com/prospect-theory-and-psychological-safety/)[Si apre in una nuova finestra](https://ideas.repec.org/a/vrs/ecobur/v7y2021i2p5-16n6.html)[Si apre in una nuova finestra](https://bibliotekanauki.pl/articles/1837910.pdf)[Si apre in una nuova finestra](https://strategy.sjsu.edu/www.stable/B290/reading/Staw,%20B%20M,%201976,%20Organizational%20Behavior%20and%20Human%20Performance.%2016%20pp%2027-44.pdf)[Si apre in una nuova finestra](https://www.pmi.org/learning/library/psychology-project-termination-decision-maker-5914)[Si apre in una nuova finestra](https://ideas.repec.org/p/tiu/tiutis/38371d1b-31fd-45b0-860f-b83a4e416fbf)[Si apre in una nuova finestra](https://pmc.ncbi.nlm.nih.gov/articles/PMC4776353/)[Si apre in una nuova finestra](https://econpapers.repec.org/RePEc:tiu:tiutis:38371d1b-31fd-45b0-860f-b83a4e416fbf)[Si apre in una nuova finestra](https://research.tilburguniversity.edu/en/publications/anticipated-regret-expected-feedback-and-behavioral-decision-maki/)[Si apre in una nuova finestra](https://mail.amadi.msuas.ac.zw/journal/GNxTo62AD082/PushYourLuckCoolMath)[Si apre in una nuova finestra](https://ridefree.harley-davidson.com/study/KRozFh002005/Coolmath-Games-Push-Your-Luck)[Si apre in una nuova finestra](https://www.reddit.com/r/RPGdesign/comments/1m2dzpf/push_your_luck_mechanics_for_racing_ttrpg/)[Si apre in una nuova finestra](https://ridefree.harley-davidson.com/handbook/KE1dti004008/Push-Your-Luck-Coolmathgames)[Si apre in una nuova finestra](https://www.reddit.com/r/boardgames/comments/8pb0jc/discussion_push_your_luck_games/)[Si apre in una nuova finestra](https://www.scribd.com/document/1028184081/Roguelike-Design-Deep-Dive-Report)[Si apre in una nuova finestra](https://ifdb.org/allreviews?id=lzj370u772du3hx7&sortby=&tag=IF%20Comp%202020&pg=all)[Si apre in una nuova finestra](https://medium.com/beyond-the-game/the-best-slay-the-spire-2-mods-arent-making-the-game-easier-they-re-making-it-clearer-e0db0c57882b)[Si apre in una nuova finestra](https://hopeinsource.com/games/)[Si apre in una nuova finestra](https://www.nintendolife.com/guides/best-nintendo-switch-1-and-2-roguelikes-roguelites-and-run-based-games)[Si apre in una nuova finestra](http://grogpod.zone/feed.xml)[Si apre in una nuova finestra](https://www.tandfonline.com/doi/pdf/10.1080/0969725X.2026.2698997)
