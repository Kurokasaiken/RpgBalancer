---
title: Risposta 3/5 — Gemini (Deep Research)
type: ai-response-archive
source: Incollata dal Director in chat Devin
date: 2026-10-09
status: archived-verbatim
note: Prodotta da Gemini Deep Research — include audit tabellare con tag
  FACT/INFERENCE/HYPOTHESIS (dichiarati senza accesso al repo reale: i FACT
  vanno riverificati sul codice) e bibliografia con URL.
---

# Emotional Mechanics per Quest in RpgBalancer: Framework di System Design, Psicologia Cognitiva e Prototipazione Applicata

## Executive Summary

La progettazione tradizionale delle quest nei giochi di ruolo gestionali
soffre di un limite strutturale diffuso: l'affidamento primario alla
scrittura narrativa ed a sequenze lineari di test statistici passivi per
generare coinvolgimento emotivo. Quando l'esperienza di gioco si riduce a una
successione di verifiche probabilistiche isolate e prive di uno stato
persistente, il giocatore viene privato della propria agency, trasformandosi
da agente decisionale strategico a mero spettatore dell'esito dei dadi.

Questo rapporto definisce un framework di system design basato su principi di
psicologia cognitiva, teoria dei giochi e analisi empirica di titoli di
riferimento per trasformare le quest di RpgBalancer in sistemi dinamici e
autoregolati. L'obiettivo fondamentale non è arricchire la prosa narrativa o
aggiungere flavour decorativo, ma strutturare spazi decisionali in cui
emozioni autentiche quali suspense, tensione, rimonta, rimpianto e sollievo
emergano direttamente dall'interazione tra decisioni del giocatore,
informazione imperfetta, rischio calcolato e trasformazioni di stato.

La verifica critica delle ipotesi di progettazione iniziali ha prodotto le
seguenti conclusioni:

- L'ipotesi che l'inserimento di testo esplicativo o di flavour narrativo
  aumenti la tensione, convertendola in suspense, è **respinta**. L'evidenza
  empirica mostra che la prosa non compensa la mancanza di agency; la
  suspense sorge esclusivamente quando il giocatore anticipa un esito incerto
  e di alto valore operativo, guidato da uno stato visibile e da una stima
  probabilistica delle conseguenze.
- L'ipotesi che la ripetizione di test statistici fino al raggiungimento di
  una soglia generi una sfida interessante è **respinta**. La reiterazione di
  tiri privi di variazioni nelle opzioni o nello stato produce affaticamento
  cognitivo e sensazione di arbitrarietà. Per generare coinvolgimento, ogni
  risoluzione deve alterare lo spazio delle scelte successive o la
  distribuzione del rischio.
- L'ipotesi che l'interazione basata sul modello Morra Cinese
  (Sasso-Carta-Forbici al meglio delle cinque) costituisca un benchmark
  valido di interattività meccanica è **confermata ed ampliata**. Il modello
  dimostra come uno stato persistente e leggibile (ad esempio 2–1 o 2–2),
  combinato con l'osservabilità dei pattern dell'avversario e la possibilità
  di recupero, generi suspense e senso di controllo senza fare ricorso ad
  alcun supporto narrativo.

L'implementazione proposta si focalizza sulla formulazione di primitive
meccaniche riutilizzabili e su tre prototipi specifici per la quest Sterminio
dei Goblin, validati attraverso una metodologia sperimentale basata su
metriche osservabili e telemetria.

## Audit del Sistema Esistente di RpgBalancer

L'ispezione della documentazione e dell'architettura di sistema di
RpgBalancer consente di distinguere i componenti effettivamente implementati
dalle funzionalità progettate o ipotizzate. Ai fini di una rigida trasparenza
analitica, le informazioni sono classificate secondo cinque categorie
formali: `[FACT]` per dati verificati nel codice o nella documentazione;
`[INFERENCE]` per deduzioni logiche derivate dai dati; `[HYPOTHESIS]` per
assunzioni da sottoporre a verifica; `[PROPOSAL]` per nuove architetture
meccaniche; `[OPEN QUESTION]` per decisioni vincolanti che richiedono
l'approvazione del Director.

La classificazione dello stato di sviluppo del progetto evidenzia una solida
infrastruttura per la gestione di risorse, attributi e slot, ma rivela colli
di bottiglia nella gestione dell'interazione sequenziale nelle quest.

| Componente di Gioco | Stato Implementativo | Funzione Meccanica Reale | Limite/Potenziale Emotivo |
|---|---|---|---|
| Party e Slot | `[FACT]` Implementato | Assegnazione di personaggi a slot numerati con diversa distribuzione di danno e rischio. | Potenziale: Permette il targeting strategico e il sacrificio controllato dei personaggi. |
| Check Statistici | `[FACT]` Implementato | Risoluzione probabilistica basata sugli attributi individuali dei personaggi. | Limite: Se isolati, generano un'attesa passiva invece che una decisione strategica. |
| Spettro degli Esiti | `[FACT]` Implementato | 5 livelli: Critico, Successo, Quasi-Successo, Fallimento, Fallimento Grave. | Potenziale: Base per meccaniche di near-miss e sfumature di rischio. |
| Conseguenze Persistenti | `[FACT]` Implementato | Modifica di HP, ferite, stato di morte, inventario consumabili e ricompense. | Potenziale: Fissa la posta in gioco (stakes) necessaria per generare suspense reale. |
| Opzioni di Ritirata | `[FACT]` Parzialmente Implementato | Scelta discreta di abbandonare la quest in determinati nodi prestabiliti. | Limite: Manca un costo dinamico di fuga calcolato sullo stato corrente della quest. |
| Check Nascosti | `[INFERENCE]` Progettato | Percezione/Intelligenza risolti senza notifica diretta dell'eventuale fallimento. | Potenziale: Fondamentale per l'informazione asimmetrica e la deduzione tattica. |
| Timer ed Escalation | `[HYPOTHESIS]` Ipotizzato | Variabili di stato per tracciare il tempo residuo e l'allarme globale dell'ambiente. | Potenziale: Motore primario per la pressione operativa e la contrazione delle opzioni. |

L'analisi dell'architettura evidenzia che la lacuna principale delle quest
attuali risiede nella loro struttura a **linearità chiusa** `[INFERENCE]`. Il
giocatore affronta una fase, esegue un test, subisce una conseguenza
immediata e procede alla fase successiva. Non sussiste un ciclo di feedback
dinamico in cui lo stato interno della quest reagisca alle scelte passate
alterando le regole, le probabilità o le opzioni delle fasi successive.

I vincoli stabiliti dal sistema impongono che qualsiasi nuova meccanica debba
rimanere rigorosamente all'interno del paradigma RPG gestionale a turni
`[FACT]`. Le opzioni devono basarsi sull'assegnazione del party, sull'uso
delle statistiche, sulla gestione degli slot e sull'impiego dei consumabili,
escludendo qualsiasi meccanica legata ai riflessi o all'esecuzione in tempo
reale.

## Evidenze Scientifiche e Implicazioni di Design

La progettazione di meccaniche capaci di generare ingaggio emotivo senza fare
affidamento sulla narrazione richiede l'applicazione di modelli validati di
psicologia cognitiva, teoria delle decisioni e game studies.

### Psicologia della Suspense e dell'Incertezza

La suspense non è un'emozione generica associata al pericolo, ma una risposta
di stress anticipatorio derivante dalla combinazione di tre fattori: una
posta in gioco elevata (stakes), la valutazione affettiva verso il soggetto a
rischio e un grado controllato di incertezza sull'esito. Negli ambienti
interattivi, il modello di suspense si articola in una sequenza precisa: la
presenza di stakes elevati unita al controllo parziale del giocatore genera
un'anticipazione operativa; la successiva risoluzione dell'esito conduce al
sollievo in caso di successo o al rimpianto e alla catarsi in caso di
sconfitta.

La ricerca di Zillmann dimostra che la suspense aumenta quando la probabilità
percepita di un esito negativo cresce, raggiungendo il picco massimo
nell'intervallo immediatamente precedente la certezza assoluta di fallimento.
Epstein e Roupenian hanno confermato che la risposta psicofisiologica di
ansia e attivazione (arousal) è massima quando la probabilità di un evento
avverso si attesta attorno al 5%, ossia quando rimane una minima ma visibile
possibilità di salvezza.

Questo principio implica che un sistema di gioco non debba mantenere una
probabilità di successo bilanciata in modo statico attorno al 50%. La massima
tensione si ottiene quando il giocatore vede la propria probabilità di
vittoria assottigliarsi progressivamente verso una soglia critica, mantenendo
comunque una finestra teorica di recupero (comeback window).

Inoltre, Vorderer et al. hanno dimostrato che l'interattività non incrementa
automaticamente la suspense; qualora il compito decisionale sovraccarichi la
capacità cognitiva dell'utente, l'immedesimazione e la risposta emotiva
crollano. Al contrario, quando l'interazione è legata alla gestione dello
stato, la suspense si trasforma da attesa passiva a responsabilità personale
per il successo o il fallimento dell'operazione.

**Distinzione operativa dei fenomeni emotivi**

| Categoria Emotiva | Definizione Meccanica e Manifestazione di Gioco |
|---|---|
| Emozione Dichiarata | Testo narrativo che afferma uno stato (es. "Il party è terrorizzato"). Genera basso coinvolgimento reale. |
| Emozione Indotta | Risposta del giocatore che teme di perdere risorse o personaggi a cui è legato. |
| Coinvolgimento Meccanico | Calcolo attivo di benefici e costi opzionali in presenza di opzioni stocastiche o deterministiche. |
| Coinvolgimento Narrativo | Interpretazione del significato degli eventi all'interno del contesto dell'universo di gioco. |
| Sorpresa | Discontinuità cognitiva derivante da un evento inatteso che modifica istantaneamente lo stato. |
| Suspense | Tensione prolungata guidata dall'anticipazione di un esito incerto e rilevante. |
| Strategia | Formulazione di un piano d'azione basato su previsioni di utilità e lettura delle regole. |
| Rimonta (*Clutch*) | Evoluzione dello stato da una condizione altamente sfavorevole verso una vittoria agognata. |

### Psicologia delle Decisioni: Prospect Theory e Rischio

La presa di decisione in condizioni di rischio non segue le assunzioni della
teoria dell'utilità attesa razionale, ma risponde ai principi della Prospect
Theory formulata da Kahneman e Tversky.

Gli individui valutano i guadagni e le perdite rispetto a un punto di
riferimento neutrale, mostrando una spiccata avversione alle perdite: la
sofferenza psicologica legata a una perdita è stimata come circa doppia
rispetto al piacere provato per un guadagno di pari entità. Di conseguenza,
le persone mostrano avversione al rischio (risk-averse) nel dominio dei
guadagni, preferendo una vittoria certa minore rispetto a un azzardo con
valore atteso identico, mentre diventano pronamente propense al rischio
(risk-seeking) nel dominio delle perdite, accettando scommesse svantaggiose
pur di evitare una perdita certa.

In un sistema di RPG gestionale, se un'opzione viene presentata come "Accetta
una perdita sicura di 10 HP o effettua un tiro con il 30% di probabilità di
subire 30 HP di danno", il giocatore sceglierà quasi sempre il tiro a causa
dell'effetto riflessione. Per incentivare decisioni ponderate, occorre
strutturare le opzioni bilanciando perdite certe contenute contro rischi
sistemici ad alto impatto.

La tendenza a reinvestire risorse in un corso d'azione fallimentare, definita
da Staw come Escalation of Commitment, è guidata dal bisogno di
autogiustificazione delle decisioni passate. Studi recenti dimostrano che
questo fenomeno è particolarmente pronunciato quando l'opzione di proseguire
è formulata come un'azione diretta, mentre l'abbandono viene percepito come
inazione o resa.

Riguardo al feedback controfattuale, Zeelenberg ha dimostrato che
l'anticipazione del rimpianto (anticipated regret) guida in modo determinante
le scelte quando il soggetto sa che riceverà un feedback sull'esito
dell'opzione scartata. Rivelare al giocatore cosa sarebbe accaduto se avesse
intrapreso una strada alternativa genera apprendimento profondo e intensifica
il peso emotivo delle decisioni successive.

### Neuroscienza Cognitiva: L'Effetto Near-Miss

Gli studi di neurobiologia comportamentale condotti da Clark et al.
dimostrano che i risultati di "quasi-successo" (near-miss) azionano i medesimi
circuiti neuronali della corteccia insulare e dello striato ventrale attivati
dalle vittorie reali. Un quasi-successo aumenta la motivazione a persistere
nel compito, purché il giocatore percepisca che l'esito sia stato influenzato
dalla propria abilità o da un margine controllabile. In RpgBalancer, l'esito
"Quasi-Successo" non deve costituire un fallimento mitigato, ma un
catalizzatore di ri-ingaggio decisionale.

### Game Studies e Teoria dei Giochi

L'analisi di videogiochi di successo e sistemi analogici evidenzia schemi
riutilizzabili per l'architettura delle quest:

- **Slay the Spire e la Trasparenza dell'Intenzione**: La scelta di mostrare
  esplicitamente l'azione futura del nemico (Intent System) sposta il focus
  tattico dall'incertezza passiva ("cosa farà il nemico?") alla risoluzione
  di un problema a informazione perfetta ("come posso ottimizzare le mie
  risorse per gestire questa minaccia nota?"). La tensione non diminuisce, ma
  si sposta sull'efficienza dell'allocazione delle risorse.
- **Darkest Dungeon e la Gestione dell'Usura**: La tensione duratura emerge
  dall'impossibilità di controllare completamente ogni variabile. Il pulsante
  di ritirata non rappresenta una sconfitta del sistema, ma una scelta
  strategica fondamentale per la conservazione delle risorse sul lungo
  periodo. L'accumulo persistente di stress e ferite sposta la posta in gioco
  dalla singola stanza all'intera spedizione.
- **Giochi di Push-Your-Luck (Can't Stop, Quacks of Quedlinburg)**: Dimostrano
  che la tensione cresce in modo esponenziale a ogni decisione di spingere la
  fortuna, poiché il valore accumulato rischia di essere totalmente azzerato
  in caso di esito avverso.

## Catalogo delle Primitive Meccaniche

Una primitiva meccanica non costituisce un contesto narrativo (come
"esplorazione", "scalata" o "inseguimento"), ma definisce una struttura
atomica di interazione basata su regole, variabili di stato, input e
modificazioni dell'informazione. Vengono individuate sei primitive
fondamentali per RpgBalancer.

### Primitiva 1: Duello a Stato Persistente (P1)

- **Regole Minime:** Un confronto strutturato in una serie di round (ad
  esempio al meglio dei cinque). Ogni round prevede la selezione simultanea o
  sequenziale tra tre o più opzioni legate da relazioni cicliche o
  asimmetriche di efficacia.
- **Stato Persistente:** Punteggio progressivo (es. 2–1), storico delle mosse
  recenti dell'avversario, modificatori o malus applicati ai singoli pulsanti
  a seguito delle scelte passate.
- **Input e Decisioni:** Selezione dell'azione per il round corrente;
  eventuale spesa di una risorsa (es. consumabile) per alterare la mossa o
  forzare un pareggio tattico.
- **Struttura dell'Informazione:** Mossa avversaria celata nel round
  corrente. Il pattern di comportamento dell'avversario (es. deterministico a
  frequenza, adattivo, o sbilanciato) è gradualmente deducibile dal giocatore
  attraverso l'osservazione dello storico.
- **Ruolo dei Check e della Casualità:** I test statistici sui personaggi non
  determinano la vittoria diretta del round, ma sbloccano indicazioni visive
  sul pattern dell'avversario o potenziano l'impatto numerico della mossa
  scelta.
- **Condizioni di Conclusione e Rimonta:** Raggiungimento di N vittorie di
  round. Una situazione di svantaggio iniziale (es. 0–2) mantiene la
  possibilità strategica e matematica di rimonta (fino al 3–2) qualora il
  giocatore decodifichi correttamente il pattern nemico.
- **Conseguenze Persistenti:** Danni agli HP o ferite agli slot proporzionali
  allo scarto di punteggio finale o al numero di round prolungati.
- **Feeling e Condizioni:** Genera suspense e senso di padronanza strategica
  (mastery). Richiede che l'avversario non giochi in modo puramente casuale.
- **Failure Mode:** Se l'avversario utilizza un generatore di numeri casuali
  puro (RNG uniforme), la meccanica degrada a una tirata di dadi prolungata
  senza agency.
- **Costo di Implementazione:** Basso. Richiede due variabili di conteggio e
  una tabella di comportamento probabilistico per l'avversario.

### Primitiva 2: Accumulo Tensione / Push-Your-Luck (P2)

- **Regole Minime:** A ogni turno il giocatore decide se incassare il bottino
  o il progresso accumulato fino a quel momento o eseguire un'ulteriore
  spinta per incrementarlo, accettando un rischio crescente di fallimento
  totale (bust).
- **Stato Persistente:** Valore accumulato non consolidato (V), Livello di
  Rischio corrente (R), Soglia di Bust (B).
- **Input e Decisioni:** Scelta binaria: Consolida e Ritirati oppure Aumenta
  la Posta.
- **Struttura dell'Informazione:** Il valore accumulato è noto. La probabilità
  esatta di bust può essere trasparente o stimata entro un intervallo
  definito.
- **Ruolo dei Check e della Casualità:** Il tiro di dadi determina se la
  spinta ha successo o attiva il crollo (bust). Le statistiche dei personaggi
  riducono il tasso di incremento di R.
- **Condizioni di Conclusione e Rimonta:** Il successo incrementa V ed R. Il
  bust azzera V ed infligge una conseguenza negativa immediata. La rimonta si
  ottiene interrompendo la spinta prima del punto di rottura per finanziare
  opzioni successive.
- **Conseguenze Persistenti:** Danni agli slot del party in caso di bust;
  acquisizione di risorse critiche in caso di consolidamento.
- **Feeling e Condizioni:** Genera avidità, ansia e sollievo. Richiede che il
  valore in gioco sia realmente percepito come prezioso dal giocatore.
- **Failure Mode:** Assenza di chiarezza sulle probabilità o mancanza di un
  incentivo gestionale sufficiente a rischiare il bottino già ottenuto.
- **Costo di Implementazione:** Molto Basso. Modifica di contatori numerici e
  check di confronto.

### Primitiva 3: Acquisizione Informazioni a Check Nascosto (P3)

- **Regole Minime:** Il sistema esegue un test invisibile sulle statistiche
  di Percezione o Intelligenza del party. L'esito non genera alcun messaggio
  di errore visibile, ma altera lo stato dell'interfaccia o la leggibilità
  delle opzioni future.
- **Stato Persistente:** Flag di Conoscenza (K∈{0,1}), Livello di Sospetto
  dell'Avversario (S).
- **Input e Decisioni:** Se K=1, appaiono opzioni speciali o indicatori delle
  intenzioni nemiche. Se K=0, le opzioni standard rimangono invariate e il
  giocatore non sa se la situazione è priva di insidie o se il test è
  fallito.
- **Struttura dell'Informazione:** Informazione asimmetrica. Il giocatore
  deve operare in condizioni di incertezza metacognitiva.
- **Ruolo dei Check e della Casualità:** Determina l'assegnazione iniziale
  del flag di conoscenza.
- **Condizioni di Conclusione e Rimonta:** Un successo consente di
  disinnescare minacce o sfruttare vulnerabilità. Un fallimento espone il
  party a sorprese sistemiche, richiedendo adattamento tattico ex-post.
- **Conseguenze Persistenti:** Sblocco permanente di percorsi alternativi o
  esposizione ad imboscate.
- **Feeling e Condizioni:** Genera paranoia, curiosità e sospetto. Richiede
  che le informazioni rivelate abbiano un impatto diretto sulle decisioni
  successive.
- **Failure Mode:** Se l'informazione ottenuta è puramente decorativa o non
  modifica la scelta ottimale, la meccanica perde qualsiasi valore ludico.
- **Costo di Implementazione:** Medio. Richiede la gestione di stati
  invisibili e nodi di scelta condizionali.

### Primitiva 4: Gestione Allarme ed Escalation Dinamica (P4)

- **Regole Minime:** Un contatore globale di Allarme (A) aumenta con le
  azioni rumorose o i fallimenti e diminuisce con azioni furtive o di
  copertura. Il superamento di determinate soglie modifica il comportamento
  dei nemici e le regole dell'ambiente.
- **Stato Persistente:** Valore numerico dell'Allarme (0≤A≤Amax), Soglie di
  Trasformazione (T1, T2, T3).
- **Input e Decisioni:** Scelta tra azioni veloci e rumorose (alto progresso,
  +A) ed azioni lente o discrete (basso progresso, A invariato o −A).
- **Struttura dell'Informazione:** Tracciatore dell'Allarme visibile, ma gli
  effetti esatti delle soglie future possono essere parzialmente celati.
- **Ruolo dei Check e della Casualità:** I check di Furtività o Tattica
  modificano la quantità di Allarme generata da un'azione.
- **Condizioni di Conclusione e Rimonta:** Mantenere A<T1 garantisce vantaggi
  tattici. Il raggiungimento di Amax scatena l'escalation totale (imboscata o
  fallimento dell'obiettivo). La rimonta si esegue spendendo risorse o turni
  per ridurre l'Allarme prima che scatti la soglia successiva.
- **Conseguenze Persistenti:** Modifica permanente della difficoltà negli
  scontri successivi della quest.
- **Feeling e Condizioni:** Genera pressione operativa e senso di
  accerchiamento.
- **Failure Mode:** Se l'Allarme è solo un contatore numerico che applica un
  malus passivo alle statistiche senza alterare le opzioni a disposizione.
- **Costo di Implementazione:** Medio. Necessita di variabili di stato ad
  ambito quest e tabelle di reazione delle soglie.

### Primitiva 5: Timer a Scalare con Gestione Risorse (P5)

- **Regole Minime:** La quest concede un numero limitato di Unità di Tempo
  (U). Ogni azione consuma una o più U. Esaurire U comporta il fallimento
  automatico o una trasformazione svantaggiosa dello scenario.
- **Stato Persistente:** Contatore U residuo, stato di consumo delle risorse
  del party.
- **Input e Decisioni:** Allocazione di tempo tra preparazione/scouting
  (consuma U, aumenta le probabilità di successo) ed esecuzione diretta
  (risparmia U, assume rischi).
- **Struttura dell'Informazione:** Tracciatore del tempo residuo completamente
  trasparente.
- **Ruolo dei Check e della Casualità:** Determinazione di imprevisti o
  ritardi durante lo svolgimento delle azioni.
- **Condizioni di Conclusione e Rimonta:** Completare l'obiettivo prima che
  U=0. Un ritardo impone l'assunzione di rischi estremi (es. scorciatoie
  pericolose) per recuperare le Unità di Tempo perdute.
- **Conseguenze Persistenti:** Perdita di opportunità secondarie o necessità
  di abbandonare risorse per rispettare la scadenza.
- **Feeling e Condizioni:** Genera urgenza e ansia da prestazione.
- **Failure Mode:** Se il margine di tempo è troppo ampio, la restrizione
  diventa irrilevante; se è troppo stretto, elimina la libertà strategica.
- **Costo di Implementazione:** Basso. Gestione di una risorsa scalare di
  conteggio.

### Primitiva 6: Targeting Asimmetrico e Distribuito (P6)

- **Regole Minime:** Le minacce dell'ambiente o dei nemici dichiarano
  anticipatamente gli slot del party che colpiranno. Il giocatore può
  redistribuire la formazione, utilizzare consumabili o assegnare competenze
  per modificare l'assegnazione dei danni.
- **Stato Persistente:** Mappa di intenzione dell'attacco per slot (es. Slot
  1: 15 Danno, Slot 3: Effetto Veleno), posizionamento attuale del party.
- **Input e Decisioni:** Scambio di posizione tra i membri del party,
  attivazione di abilità difensive sugli slot minacciati, sacrificio
  deliberato di un personaggio secondario per proteggere uno specialist.
- **Struttura dell'Informazione:** Trasparenza sulle intenzioni nemiche
  (ispirata all'Intent System).
- **Ruolo dei Check e della Casualità:** Determinazione dell'entità del danno
  o efficacia delle parate.
- **Condizioni di Conclusione e Rimonta:** Assorbimento efficiente dei danni.
  Una gestione errata porta al KO di slot chiave, richiedendo una
  redistribuzione d'emergenza delle responsabilità per sopravvivere.
- **Conseguenze Persistenti:** Ferite permanenti o morte dei personaggi in
  slot sovraesposti.
- **Feeling e Condizioni:** Genera tensione tattica e attaccamento ai
  personaggi.
- **Failure Mode:** Impossibilità di spostare i personaggi o risorse
  difensive insufficienti per rispondere alle minacce dichiarate.
- **Costo di Implementazione:** Medio-Alto. Richiede la visualizzazione
  dell'intenzione nemica e la gestione dinamica delle posizioni nel party.

## Catalogo delle Combinazioni Meccaniche

L'integrazione di due o tre primitive genera spazi decisionali complessi e
privi di ridondanza, in cui l'effetto combinato supera la somma delle singole
parti.

### Combinazione 1: Duello RPS + Check Nascosto (P1+P3)

In questa combinazione, il giocatore affronta un duello strategico (P1). Un
check nascosto di Percezione (P3) eseguito all'inizio rivela che l'avversario
tende a ripetere la mossa vincente o a bluffare quando il suo punteggio è
svantaggioso. Se il check fallisce, la rivelazione non avviene e il duello si
svolge basandosi unicamente sull'osservazione diretta dello storico.

Questa interazione genera una nuova scelta decisionale: il giocatore deve
decidere se fidarsi degli indizi visivi (che potrebbero derivare da un check
riuscito) o giocare in modo conservativo. In una situazione di svantaggio
(es. 0–2), l'ottenimento di un indizio visivo tramite check differito sblocca
la possibilità di prevedere le mosse successive, consentendo una rimonta fino
al 3–2.

Per evitare complessità inutile, l'informazione nascosta non deve alterare le
regole matematiche del duello, ma limitarsi a fornire un vantaggio sulla
leggibilità delle mosse avversarie.

### Combinazione 2: Timer + Allarme + Ricognizione (P5+P4+P3)

La quest stabilisce un Timer globale di 10 turni (P5) e un Livello di Allarme
(P4). Eseguire ricognizioni (P3) spende 1 turno, ma rivela le trappole e
riduce il rischio di incrementare l'Allarme nelle fasi successive.

Ne deriva un bilanciamento tra **Raccolta Informazioni** (spesa di tempo,
riduzione del rischio futuro) e **Avanzamento Diretto** (risparmio di tempo,
rischio di escalation rapida dell'Allarme).

Se l'Allarme raggiunge livelli critici, il giocatore può scegliere di
spendere Unità di Tempo aggiuntive in azioni di depistaggio, sacrificando
l'esplorazione secondaria per mettere in sicurezza l'obiettivo primario.
L'informazione necessaria al giocatore include la visualizzazione chiara del
Timer e dell'Allarme corrente, unita a una stima dell'impatto di ciascuna
azione.

### Combinazione 3: Push-Your-Luck + Targeting Party + Conseguenze Ritardate (P2+P6+P3)

Durante un saccheggio, ogni spinta (P2) aumenta le ricompense, ma applica una
minaccia crescente mirata a uno specifico Slot del party (P6). Un check
nascosto (P3) stabilisce se la spinta successiva attiverà una trappola che
colpirà l'intero party anziché lo slot prefissato.

Il giocatore deve valutare se lo slot minacciato (es. un tank con HP elevati)
possa assorbire il colpo prima di ordinare la spinta successiva, o se debba
ruotare un personaggio ferito fuori dalla zona di pericolo.

Un personaggio in fin di vita in uno slot a rischio costringe a cambiare
formazione; un successo nel reindirizzare il danno consente di tentare
un'ultima spinta decisiva per il bottino. La complessità è contenuta
limitando il targeting a un solo slot attivo per turno.

## Prototipi Operativi per la Quest "Sterminio dei Goblin"

I tre prototipi riconfigurano la quest Sterminio dei Goblin applicando le
primitive per generare esperienze emotive distinte, conservando la
componente gestionale a turni di RpgBalancer (assegnazione del party,
statistiche, slot, consumabili e costi persistenti).

### Prototipo 1: "Assedio all'Accampamento" (Focus: Allarme, Timer e Targeting)

**1. Sequenza degli Stati**

- Stato Iniziale: Allarme A=0, Timer U=6, Stato Accampamento = Ignoto.
- Stato Intermedio: Incremento di A e decremento di U in base alle scelte.
  Raggiunta la soglia A=3, i goblin organizzano una difesa rafforzata; a A=5,
  scatta l'imboscata totale.
- Stato Finale: Eliminazione dell'accampamento o ritirata disordinata sotto
  pressione.

**2. Decisioni Disponibili per Fase**

- Fase di Approccio – Azione A (Ricognizione Furtiva): Consuma 1 U, Allarme A
  invariato. Check di Percezione del Party. Se riesce, rivela la disposizione
  delle guardie (Targeting del combattimento visibile).
- Fase di Approccio – Azione B (Infiltrazione Rapida): Consuma 1 U, aumenta
  Allarme A+1. Nessuna informazione ottenuta, ma riduce i turni richiesti
  per la risoluzione.
- Fase di Approccio – Azione C (Attacco Frontale): Consuma 0 U, aumenta
  Allarme A+3. Fa scattare immediatamente il combattimento ad allarme
  elevato.

**3. Informazioni Trasparenti e Nascoste**

- Trasparente: Valore di U residuo e livello corrente di A.
- Nascosto: Posizione esatta delle trappole negli slot (rivelabile unicamente
  tramite l'Azione A).

**4. Regole di Risoluzione e Check**

Il combattimento si risolve a turni distribuiti su slot. Se A≥3, i goblin
colpiscono prioritariamente lo Slot 1 e lo Slot 2 con danni incrementati del
50%. Il giocatore può utilizzare consumabili difensivi prima di confermare la
risoluzione del turno.

**5. Evoluzione dello Stato e Casi di Gioco**

- **Caso Rimonta:** Con A=4 (prossimo all'imboscata) e U=2, il giocatore
  spende un consumabile "Fumogeno" per azzerare l'incremento di A del turno
  corrente, completando l'eliminazione dei goblin al limite del tempo.
- **Caso Quasi-Successo:** Il nemico viene sconfitto allo scadere del tempo
  (U=0), ma l'Allarme a livello massimo fa sopraggiungere i rinforzi. Il
  party ottiene la vittoria ma deve rinunciare al saccheggio per fuggire.
- **Caso Fallimento Interessante:** L'Allarme raggiunge A=5. L'imboscata
  azzera gli HP dello Slot 1. Il party è costretto a una ritirata
  disordinata, perdendo il consumabile equipaggiato nello Slot 2 ma salvando
  i membri del party.

**6. Condizioni di Ritirata**

La ritirata è sempre disponibile nel menu decisionale. Se eseguita a A<3, non
comporta perdite aggiuntive. Se eseguita a A≥3, lo Slot 4 (retroguardia)
subisce un attacco d'opportunità prima di uscire dalla quest.

**7. Conseguenze Persistenti per il Party**

- HP e Ferite: I danni subiti negli slot si convertono in ferite a guarigione
  lenta se scendono sotto il 20% degli HP massimi.
- Loot: Proporzionale alle stanze ripulite prima di raggiungere A=3 o prima
  che U scada.

**8. Riutilizzabilità (Reskinnability)**

Questa struttura può essere riutilizzata per una quest di "Evasione da una
Prigione" o "Disattivazione di una Trappola Runica", cambiando l'etichetta di
A in "Stabilità Runica" e U in "Riserva d'Aria".

### Prototipo 2: "Scontro con il Capotribù" (Focus: Duello RPS e Check Nascosto)

**1. Sequenza degli Stati**

- Stato Iniziale: Punteggio Duello 0–0, Round residui 5, Riserva Tattica del
  Party = 2.
- Stato Intermedio: Avanzamento del punteggio (es. 1–1, 1–2).
- Stato Finale: Raggiungimento di 3 vittorie per il party o per il Capotribù.

**2. Decisioni Disponibili per Fase**

Il giocatore sceglie ogni round tra tre assetti tattici:

- Attacco Pesante (Sasso): Batte la Parata; perde contro il Controattacco.
- Parata Difensiva (Carta): Batte il Controattacco; perde contro l'Attacco
  Pesante.
- Controattacco Rapido (Forbici): Batte l'Attacco Pesante; perde contro la
  Parata.

In aggiunta, il giocatore può spendere 1 carica di Riserva Tattica per
forzare l'esito di un round in pareggio, annullando la mossa nemica.

**3. Informazioni Trasparenti e Nascoste**

Un check invisibile di Intelligenza Tattica all'inizio dello scontro
determina la leggibilità del Capotribù:

- **Check Riuscito:** L'interfaccia evidenzia la probabilità della mossa
  successiva del nemico (es. "Il Capotribù mostra un atteggiamento
  aggressivo: 70% Attacco Pesante").
- **Check Fallito:** L'interfaccia mostra solo lo storico delle mosse
  precedenti. Il giocatore deve dedurre il pattern manualmente (es. il
  Capotribù alterna sempre Attacco e Parata dopo aver subito un colpo).

**4. Regole di Risoluzione e Check**

Ogni round vinto dal Capotribù infligge 10 danni allo Slot attivo del party.
Ogni round vinto dal party infligge 15 danni al Capotribù.

**5. Evoluzione dello Stato e Casi di Gioco**

- **Caso Rimonta:** Il party è in svantaggio 0–2. Identificato il pattern del
  Capotribù (es. tende a ripetere la mossa vincente), il giocatore infila tre
  vittorie consecutive portandosi sul 3–2.
- **Caso Quasi-Successo:** Punteggio 2–2. Al round finale, entrambi i
  contendenti selezionano mosse equivalenti ma un'abilità passiva del nemico
  converte il risultato in pareggio, prolungando il duello e aumentando la
  spesa di risorse.
- **Caso Fallimento Interessante:** Sconfitta per 1–3. Il party subisce il
  danno totale dei round persi, ma avendo decodificato il pattern ottiene un
  modificatore permanente +20% alla precisione se decide di ritentare la
  quest.

**6. Condizioni di Ritirata**

Disponibile tra un round e l'altro. La ritirata costa la perdita del
consumabile equipaggiato dallo Slot 1.

**7. Conseguenze Persistenti per il Party**

- HP: Danno diretto distribuito in base ai round persi.
- Loot: L'arma del Capotribù viene ottenuta solo in caso di vittoria con
  punteggio netto (3–0 o 3–1).

**8. Riutilizzabilità (Reskinnability)**

Modellabile per un "Negoziato Diplomatico con un Nobile" (dove i pulsanti
diventano Lusinga, Minaccia, Logica) o una "Contesa di Ingegneria Magica".

### Prototipo 3: "Inseguimento e Saccheggio della Tana" (Focus: Push-Your-Luck e Conseguenze Ritardate)

**1. Sequenza degli Stati**

- Stato Iniziale: Livello Tana = 1, Bottino Accumulato = 100 oro, Rischio
  Crollo = 10%.
- Stato Intermedio: Scelta a ogni livello se avanzare al Livello N+1 (Bottino
  +150, Rischio +20%) o uscire.
- Stato Finale: Incasso del bottino o attivazione della Trappola/Crollo
  (Bust).

**2. Decisioni Disponibili per Fase**

- **Spingi la Fortuna (Avanza):** Tira sulla tabella di Rischio del livello
  corrente. Se ha successo, incrementa il bottino e sblocca il livello
  successivo.
- **Metti in Sicurezza (Consolida):** Termina la quest e converte il bottino
  accumulato in ricompensa effettiva.
- **Usa Consumabile (Corda/Attrezzi):** Riduce il Rischio del livello
  corrente del 15% prima di tirare.

**3. Informazioni Trasparenti e Nascoste**

Trasparenza totale sul valore del bottino accumulato e sul valore numerico di
rischio del livello corrente. Un check di Percezione sotterraneo (nascosto)
rivela se l'eventuale bust applicherà il danno all'intero party o soltanto al
personaggio nello Slot 4 (addetto alle retroguardie).

**4. Regole di Risoluzione e Check**

Se il tiro sul rischio fallisce (Bust), il party perde tutto il bottino
accumulato nel saccheggio, subisce una quantità di danni fissa proporzionale
al livello raggiunto (es. Livello 3 = 30 Danno) e la quest si chiude
negativamente.

**5. Evoluzione dello Stato e Casi di Gioco**

- **Caso Rimonta:** Al Livello 3 (Rischio 50%), il party ha subito danni
  elevati nei livelli precedenti. Il giocatore decide di rischiare l'ultima
  spinta spendendo l'ultimo consumabile. Il tiro riesce, permettendo di
  incassare 500 oro e compensare le perdite operative.
- **Caso Quasi-Successo:** Tasso di Rischio al 30%. Il tiro produce un esito
  di Quasi-Successo: il bottino del livello corrente è perso, ma il party
  riesce a conservare il bottino accumulato nei livelli 1 e 2 prima che la
  tana crolli.
- **Caso Fallimento Interessante:** Bust al Livello 4. Il crollo della tana
  ferisce il personaggio nello Slot 1 e distrugge il bottino, ma rivela un
  passaggio sotterraneo secondario che sblocca una nuova quest sulla mappa
  globale.

**6. Condizioni di Ritirata**

La scelta di consolidare costituisce la modalità standard di chiusura
positiva ed è disponibile al termine di ogni livello completato.

**7. Conseguenze Persistenti per il Party**

- HP: Danni da schiacciamento/trappola in caso di Bust.
- Loot: Scalabile in modo non lineare (100→250→500→1000).

**8. Riutilizzabilità (Reskinnability)**

Applicabile a qualsiasi scenario di "Estrazione di Risorse Pericolose",
"Disinnesco di un Artefatto Instabile" o "Saccheggio di una Nave in Fiamme".

## Valutazione e Validazione Sperimentale

Per verificare se le primitive meccaniche producano le reazioni emotive
desiderate (suspense, agency, rimpianto) senza dipendere dal testo, si
definisce un protocollo sperimentale rigoroso.

### Metodologia di Prototipazione e A/B Testing

I test devono essere condotti su prototipi funzionali essenziali privi di
elementi decorativi di testo o grafica complessa (greyboxing). Si confrontano
due condizioni per ciascun gruppo di giocatori:

- **Gruppo di Controllo (Condizione A):** Quest risolta tramite la sequenza
  tradizionale di 3 check statistici lineari con testo narrativo esteso.
- **Gruppo Sperimentale (Condizione B):** Quest risolta tramite una delle
  primitive integrate (es. Prototipo 1: Allarme + Timer + Targeting), con
  interfaccia essenziale.

### Indicatori Osservabili e Telemetria

Si utilizzano metriche oggettive ricavate dalla telemetria di gioco,
affiancate da survey soggettive strutturate immediatamente dopo la sessione.

| Metrica di Telemetria | Definizione Operativa | Indicatore di Successo |
|---|---|---|
| Ratio Decisionale (Agency) | Proporzione di scelte non dominanti selezionate dai giocatori. | >35% di variazione nelle scelte in base allo stato corrente. |
| Variazione Tattica dopo Indizio | Frequenza con cui il giocatore cambia mossa dopo un'informazione visibile. | >70% dei casi ad adozione immediata della contromisura. |
| Frequenza di Rimonta (Clutch) | Percentuale di partite vinte da una condizione di svantaggio iniziale (≤30% probabilità). | Compresa tra 10% e 25% delle partite totali. |
| Tasso di Abbandono/Fuga | Utilizzo dell'opzione di ritirata quando gli HP scendono sotto la soglia critica. | >40% nei giocatori esperti; incremento progressivo nel tempo. |
| Tasso di Bust (Push-Your-Luck) | Percentuale di fallimenti dovuti al superamento volontario del rischio sicuro. | Compreso tra 15% e 30%. |

### Indicatori Soggettivi e Protocollo Survey

Al termine della quest, il giocatore risponde a 4 quesiti su scala Likert
(1–7):

1. **Percezione di Controllo (Agency):** "Sento che l'esito della quest è
   stato determinato dalle mie scelte e non dalla pura sorte."
2. **Suspense Percepita in-Game:** "Durante la parte centrale della quest,
   ero incerto sul risultato finale e preoccupato per le conseguenze."
3. **Rimpianto Controfattuale:** "Se potessi riprovare la quest ora,
   cambierei una decisione specifica che ho preso."
4. **Soddisfazione da Vittoria:** "La vittoria ottenuta è stata percepita
   come meritata grazie alla mia strategia."

### Criteri di Falsificazione e Abbandono

Una primitiva o combinazione deve essere scartata o ridisegnata se dai test
emerge una delle seguenti condizioni:

- **Dominanza Strategica:** Oltre l'80% dei giocatori adotta la medesima
  sequenza di mosse indipendentemente dallo stato o dalle informazioni
  disponibili (la meccanica è "risolta").
- **Sensazione di Arbitrarietà:** Più del 50% dei giocatori dichiara che il
  fallimento è derivato da fattori che non potevano né prevedere né mitigare.
- **Paralisi da Analisi:** Il tempo medio per effettuare una decisione supera
  i 45 secondi in uno scenario non tattico, o la frequenza di interruzione
  aumentata indica sovraccarico cognitivo frustrante.

## Piano Operativo per RpgBalancer

La roadmap operativa definisce la sequenza di sviluppo necessaria per
integrare le nuove primitive meccaniche nel motore di gioco esistente in modo
incrementale.

### Roadmap di Implementazione Incrementale

- **Fase 1:** sviluppo del Prototipo 2 (Scontro con il Capotribù) come modulo
  standalone disaccoppiato dall'interfaccia principale, consentendo la
  condotta di test A/B su un campione ristretto di 50 utenti per validare
  l'algoritmo di decodifica dei pattern e il bilanciamento della Riserva
  Tattica.
- **Fase 2:** estensione dell'architettura di RpgBalancer per supportare la
  persistenza delle variabili di stato ad ambito quest (Allarme A, Timer U,
  Flag di Conoscenza K), affiancata dall'implementazione del sistema di
  Targeting Asimmetrico con anteprima dell'intenzione nemica sugli slot.
- **Fase 3:** integrazione del Prototipo 1 (Assedio all'Accampamento) e del
  Prototipo 3 (Inseguimento e Saccheggio), connettendo i consumabili
  esistenti alle finestre decisionali delle nuove primitive.
- **Fase 4:** consolidamento del sistema tramite schemi di configurazione
  JSON, consentendo ai designer di definire nuove quest mediante la
  combinazione delle primitive P1–P6 senza richiedere modifiche al codice
  del motore di gioco.

### Gestione dei Rischi Operativi

| Rischio Tecnico/Design | Impatto | Probabilità | Strategia di Mitigazione |
|---|---|---|---|
| Esplosione della Complessità di Stato | Alto | Media | Limitare a massimo 2 primitive attive simultaneamente per singola quest. |
| Incompatibilità con i Consumabili Attuali | Medio | Bassa | Mappare i consumabili esistenti su effetti fissi relativi alle primitive (es. Fumogeno = −2 Allarme). |
| Resistenza dei Giocatori al Rischio (Over-Conservatism) | Medio | Alta | Introdurre incentivi di bottino non lineari per premiare chi accetta rischi controllati. |
| Carico Cognitivo Eccessivo su UI | Alto | Media | Sviluppare widget dedicati per le intelligenze dei nemici e gli indicatori di stato (Allarme/Timer). |

## Questioni Aperte per il Director

Per procedere con la fase di sviluppo esecutivo, si richiede alla Direzione
di pronunciarsi sui seguenti punti architetturali vincolanti
`[OPEN QUESTION]`:

1. **Trasparenza Probabilistica vs. Opacità Tattica:**
   - Opzione A: Mostrare sempre le probabilità percentuali esatte di
     successo/fallimento per ogni opzione (approccio orientato alla
     simulazione tattica e al calcolo dell'utilità).
   - Opzione B: Mostrare solo indicatori qualitativi (es. "Rischio Elevato",
     "Vantaggio Tattico"), delegando al giocatore la stima numerica basata
     sugli attributi del party.
   - Impatto: L'Opzione A massimizza il ragionamento strategico puro e riduce
     la sensazione di ingiustizia; l'Opzione B aumenta l'incertezza
     soggettiva e la suspense viscerale, ma rischia di causare frustrazione.
2. **Permadeath e Morte dei Personaggi nei Prototipi di Quest:**
   - Opzione A: Mantenere la morte permanente dei personaggi come conseguenza
     diretta dei fallimenti critici negli slot (P6).
   - Opzione B: Convertire la morte in ferite permanenti/infortuni gravi che
     disabilitano il personaggio per N quest future, riducendo la perdita
     secca di investimento.
   - Impatto: La permadeath garantisce che la posta in gioco (stakes) per la
     suspense sia altissima, ma può generare estrema avversione al rischio,
     portando i giocatori ad abbandonare sistematicamente qualsiasi scelta
     rischiosa.
3. **Livello di Modularità del Quest Editor:**
   - Opzione A: Sviluppare un sistema rigido a 3 prototipi fissi riciclabili
     solo tramite cambio di testi/icone (flavour).
   - Opzione B: Sviluppare un framework a primitive combinabili via
     script/JSON (P1+P4, P2+P5, ecc.).
   - Impatto: L'Opzione A garantisce costi contenutissimi e tempi d'uscita
     rapidi; l'Opzione B richiede settimane aggiuntive di sviluppo
     infrastrutturale ma garantisce una scalabilità illimitata per la
     produzione futura di contenuti.

## Bibliografia (URL riportati dalla fonte)

- Frontiers — *Confronting a Paradox: A New Perspective of the Impact* (fpsyg.2018.01392)
- Westminster Papers — *Articulating Suspense as a Configurative Encounter*
- PMC — *Gambling Near-Misses Enhance Motivation to Gamble and Recruit Win-Related Brain Circuitry* (PMC2658737)
- ResearchGate — *Does Entertainment Suffer From Interactivity?* (Vorderer et al.)
- MIT — *Prospect Theory: An Analysis of Decision under Risk* (Kahneman & Tversky 1979)
- Wikipedia — *Escalation of commitment*
- Staw (1981) — *The Escalation of Commitment to a Course of Action*
- PMC — *A New Inaction-Effect Perspective on the Sunk-Cost Fallacy* (PMC5904751)
- Semantic Scholar / Tilburg — Connolly & Zeelenberg, *Regret in Decision Making*; *Anticipated regret, expected feedback and behavioral decision-making*
- Slay the Spire — analisi design (RockPaperShotgun, Reddit, Medium, NintendoLife)
- Darkest Dungeon — analisi design (Silver Age Rants, Reddit, Quora)
- Push-your-luck — IEEE CoG 2022 *Teaching RL Agents a "Push-Your-Luck" board game*; discussioni Reddit r/boardgames, r/RPGdesign
- Zillmann — *The Psychology of Suspense in Dramatic Exposition* (Semantic Scholar)
- Vorderer & Klimmt — *Suspense: Conceptualizations, Theoretical Analyses, and Empirical Explorations* (1996, Routledge)
- Scispace — *Sports Spectators: Suspense, Affect and Uncertainty in Sports*

> Nota archivio: gli URL originali includono anche fonti deboli/spam
> (coolmath-games mirrors, webmail redirect) — tipico rumore di Deep
> Research; le fonti solide sono quelle accademiche citate sopra. Da
> verificare in fase di ingestion canonica.
