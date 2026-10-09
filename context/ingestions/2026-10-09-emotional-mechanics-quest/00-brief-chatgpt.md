---
title: Research & Design Brief — Emotional Mechanics for RpgBalancer Quests
type: ai-response-archive
source: ChatGPT (share 6ac8a485-838c-83eb-84c4-861c9ce3e4fa) — messaggio assistant iniziale
date: 2026-10-09
status: archived-verbatim
note: Testo estratto via render Puppeteer da share page (JS-rendered).
  innerText appiattisce la formattazione: titoli di sezione ripristinati come
  heading markdown, elenchi ricostruiti dove evidenti. Contenuto verbatim.
---

# Premessa di ChatGPT

Ti preparo un prompt che non chieda semplicemente di raccogliere idee di game
design: deve fare una ricerca interdisciplinare, ricostruire il sistema reale
di RpgBalancer e arrivare a meccaniche implementabili che producano emozioni.

Prima, però, distinguerei due risultati: capire perché una meccanica produce
tensione e progettare quali regole, scelte e transizioni di stato possano
produrla nel nostro gioco. La ricerca deve arrivare al secondo, non fermarsi
al primo.

Ti lascio una versione già utilizzabile. Ho incluso alcune domande aperte nel
prompt stesso, così l'agente potrà cercare le risposte nella documentazione
prima di chiederti informazioni.

---

# Research & Design Brief — Emotional Mechanics for RpgBalancer Quests

## 1. Missione

Conduci una ricerca approfondita, interdisciplinare e orientata
all'implementazione per rispondere a questa domanda:

**Come possiamo progettare quest per un RPG gestionale in cui le meccaniche
producano autentiche emozioni nel giocatore, attraverso decisioni, incertezza,
suspense, tensione, rimonta, sorpresa, rischio e conseguenze, senza affidarsi
principalmente alla scrittura narrativa?**

Non vogliamo semplicemente quest ben scritte, ramificate o ricche di flavour.
Vogliamo situazioni che costituiscano piccoli giochi interessanti in sé.

La ricerca deve combinare:

- Ricostruzione rigorosa del sistema esistente di RpgBalancer.
- Psicologia cognitiva, decisionale ed emotiva.
- Game studies e ricerca empirica sull'esperienza videoludica.
- Analisi delle meccaniche utilizzate da giochi concreti.
- Progettazione di nuove primitive meccaniche, specifiche e implementabili.
- Proposte di esperimenti per verificare se producono davvero l'esperienza
  desiderata.

Non assumere che le ipotesi iniziali del Director siano corrette: verificarle
criticamente. Non sostituire però le sue intenzioni con una visione di design
generica.

## 2. Contesto: il problema di design

Le quest attuali tendono a seguire sequenze lineari di fasi. Il giocatore
riceve informazioni sulla situazione, assegna personaggi, affronta check o
scelte, riceve conseguenze e procede.

Il sistema dispone già di elementi utili:

- Personaggi con statistiche, HP e condizioni.
- Check basati sulle statistiche.
- Scelte che possono modificare statistiche, modificatori o check successivi.
- Tiri ripetuti fino al completamento di una scena.
- Party con più personaggi e slot.
- Distribuzione del rischio e del danno dipendente dallo slot.
- Consumabili utilizzabili in determinati momenti.
- Esiti differenziati: successo, successo eccezionale, quasi-successo,
  fallimento e fallimento grave.
- Conseguenze quali danni, ferite, morte, ricompense e cambiamenti nella
  situazione.
- Possibilità di proseguire, ritirarsi o assumere ulteriori rischi in alcuni
  punti.
- Possibilità di informazioni nascoste, check di percezione/intelligenza e
  conseguente sblocco di nuove possibilità.
- Idee già considerate per timer, livello di allarme, escalation e altre
  variabili di stato.

Questa lista è preliminare. Verifica ogni elemento nella documentazione e nel
codice: distingui ciò che esiste, ciò che è implementato solo in parte, ciò
che è progettato ma non implementato e ciò che è soltanto un'ipotesi.

Non inventare funzionalità mancanti.

## 3. Il benchmark fondamentale: Sasso-Carta-Forbici al meglio delle cinque

Considera questo esempio come riferimento concreto per valutare le proposte.

Il giocatore deve vincere un confronto al meglio delle cinque e sceglie ogni
volta tra tre pulsanti:

- Sasso
- Carta
- Forbici

Questa semplice meccanica può produrre:

- Scelta attiva, anziché attesa passiva del risultato di un tiro.
- Strategia e lettura dell'avversario.
- Incertezza sull'esito del prossimo round.
- Uno stato persistente e leggibile, come 2–1 o 2–2.
- Possibilità di rimonta.
- Crescita della tensione quando ci si avvicina alla conclusione.
- Un momento decisivo in cui il giocatore può vincere o perdere tutto.

Non attribuire automaticamente tutti questi effetti a qualsiasi
implementazione di RPS: dipendono dal comportamento dell'avversario, dalle
informazioni disponibili, dalla struttura del punteggio e dalla distribuzione
dei risultati.

Per esempio, un avversario puramente casuale può offrire meno spazio alla
lettura strategica rispetto a un avversario con pattern osservabili. Un
avversario deterministico e facilmente prevedibile può eliminare la suspense.
Un avversario che bara può introdurre un problema di deduzione e scoperta.

Usa RPS come benchmark di interattività, non come soluzione universale. Cerca
altre meccaniche che generino un'esperienza comparabile attraverso strutture
decisionali differenti.

## 4. Un esempio di combinazione che vogliamo esplorare

Immagina una partita contro un avversario sospetto.

Il giocatore vede la partita e può scegliere le mosse. Esiste inoltre un check
nascosto di percezione o intelligenza.

Se il check riesce, il giocatore scopre che l'avversario bara.

Questa informazione può cambiare le opzioni disponibili, il comportamento
previsto dell'avversario o le regole del confronto.

Se il check fallisce, il gioco non deve necessariamente mostrare un messaggio
esplicito di fallimento: l'avversario può semplicemente continuare a giocare.

Il giocatore deve decidere se continuare, accusarlo, tentare di sfruttare a
propria volta il sistema o abbandonare.

Qui interagiscono almeno tre sistemi distinti:

- Un gioco decisionale ripetuto.
- Un sistema di acquisizione di informazioni.
- Un sistema di conseguenze e cambiamenti di stato.

La ricerca deve studiare combinazioni di questo tipo, senza limitarsi a
inventare altri temi narrativi.

## 5. Il caso concreto: Sterminio dei Goblin

Usa la quest Sterminio dei Goblin come caso di studio principale, verificandone
la versione attuale nella documentazione e nel codice.

Il design discusso comprende elementi come:

- Percezione e scoperta di informazioni.
- Scelte di approccio.
- Combattimento con esiti differenziati.
- Targeting per slot.
- Possibilità di inseguire o interrompere.
- Continuazione dell'esplorazione con rischio e bottino aggiuntivi.
- Conseguenze che possono rendere pericoloso il ritorno.

Il problema da indagare è come trasformare una sequenza di fasi in una
situazione che il giocatore non possa prevedere completamente, ma sulla quale
possa ragionare e influire.

Esempio di obiettivo: la percezione non dovrebbe limitarsi a fornire un bonus
numerico. Potrebbe rivelare un comportamento, una minaccia, una possibilità
alternativa o un'informazione che cambia la strategia.

Il combattimento non dovrebbe limitarsi a ripetere check fino al raggiungimento
di una soglia. Potrebbe contenere decisioni, stati persistenti, cambiamenti
nelle opzioni, rischi controllabili e occasioni di rimonta.

Il bottino non dovrebbe limitarsi a una scelta astratta tra premio e penalità.
Il giocatore dovrebbe poter comprendere qualcosa del rischio, decidere quanto
esporsi e affrontare conseguenze che dipendano dalle decisioni precedenti.

Questi sono esempi di obiettivi, non requisiti rigidi. Proponi soluzioni
migliori se le evidenze le supportano.

## 6. Definizione operativa di una buona meccanica emotiva

Per questa ricerca, una meccanica emotivamente interessante non è una
meccanica alla quale associamo semplicemente un'etichetta come «suspense» o
«paura».

È un sistema di regole nel quale:

- Il giocatore prende decisioni significative.
- Le decisioni possono influenzare gli esiti.
- Esiste incertezza su aspetti rilevanti della situazione.
- Il giocatore può formare aspettative, aggiornarle e talvolta scoprire di
  essersi sbagliato.
- Lo stato evolve in modo leggibile.
- Le conseguenze possono accumularsi, cambiare forma o interagire.
- Esistono occasioni di recupero, rimonta, escalation o perdita del controllo.
- Il risultato ha un significato per il giocatore perché qualcosa a cui tiene
  è in gioco.

Questa definizione è un'ipotesi di lavoro da verificare, non una teoria
scientifica già dimostrata.

Distingui esplicitamente:

- Emozione dichiarata: il testo dice che il personaggio è terrorizzato.
- Emozione indotta: il giocatore teme di perdere un personaggio che potrebbe
  salvare.
- Coinvolgimento meccanico: il giocatore deve scegliere tra opzioni con costi
  e benefici differenti.
- Coinvolgimento narrativo: il giocatore interpreta ciò che accade come parte
  di una storia.
- Sorpresa: accade qualcosa di inatteso.
- Suspense: il giocatore anticipa un esito incerto e rilevante.
- Strategia: il giocatore può ragionare su alternative e conseguenze.
- Rimonta: lo stato può evolvere da una situazione sfavorevole verso una
  vittoria ancora possibile.

Non presumere che siano la stessa cosa o che si producano automaticamente
insieme.

## 7. Ricerca scientifica: aree da indagare

Cerca fonti accademiche primarie, revisioni sistematiche, libri di riferimento
e studi empirici pertinenti. Usa fonti più deboli solo quando necessario e
dichiarandone i limiti.

### 7.1 Psicologia della suspense e dell'incertezza

Indaga:

- Come si forma la suspense.
- Ruolo dell'incertezza, della posta in gioco e del coinvolgimento personale.
- Differenza tra rischio oggettivo e rischio percepito.
- Effetto delle informazioni parziali e delle aspettative.
- Come cambia la tensione quando la probabilità percepita di successo oscilla.
- Differenza tra suspense, sorpresa, curiosità, ansia e paura.

### 7.2 Psicologia delle decisioni

Indaga:

- Prospect theory e sensibilità alle perdite.
- Risk seeking e risk aversion in funzione del contesto.
- Effetto della proprietà percepita delle risorse e dell'investimento già
  effettuato.
- Escalation of commitment e sunk-cost effect, evitando di trattarli come
  leggi universali.
- Regret anticipato e successivo.
- Scelta sotto pressione temporale.
- Decisioni con informazione incompleta.
- Agency, percezione di controllo e attribuzione causale degli esiti.

Spiega quali risultati siano robusti, quali dipendano dal contesto e quali
siano controversi.

### 7.3 Apprendimento, feedback e abilità

Indaga:

- Apprendimento di pattern.
- Predizione dell'avversario.
- Feedback immediato e ritardato.
- Near miss e quasi-successo, senza assumere che producano sempre
  un'esperienza positiva.
- Skill, mastery, flow e difficoltà adattiva.
- Differenza tra una decisione abilmente risolta e un risultato deciso quasi
  esclusivamente dalla fortuna.

### 7.4 Emozioni nei videogiochi e game studies

Indaga:

- Suspense nei giochi interattivi.
- Tensione derivante da risorse limitate.
- Sistemi di rischio e ricompensa.
- Agency e meaningful choice.
- Emozioni emergenti da sistemi e simulazioni.
- Effetti delle conseguenze persistenti e dell'attaccamento a personaggi.
- Come i giochi producono tensione attraverso regole, non soltanto attraverso
  la narrazione.

### 7.5 Teoria dei giochi e progettazione degli avversari

Indaga:

- Giochi simultanei e sequenziali.
- Bluff, segnali, deduzione e informazione asimmetrica.
- Pattern leggibili e adattamento dell'avversario.
- Equilibri strategici e rischio di soluzioni dominanti.
- Come evitare che un gioco come RPS si riduca a una sequenza casuale senza
  strategia.
- Come progettare avversari che siano leggibili ma non completamente
  prevedibili.

### 7.6 Altre discipline pertinenti

Aggiungi discipline o filoni scientifici solo quando contribuiscono
concretamente alla progettazione di regole implementabili. Non ampliare la
ricerca per il solo gusto di essere interdisciplinari.

## 8. Analisi di giochi reali

Esamina giochi con sistemi interessanti di:

- Push-your-luck.
- Gestione del rischio e delle risorse.
- Giochi a informazione incompleta.
- Bluff e lettura dell'avversario.
- Timer e allarme.
- Pressione crescente.
- Rimonta e clutch.
- Sacrificio e targeting.
- Conseguenze ritardate.
- Scelte irreversibili.
- Svolte sistemiche.
- Stati che cambiano le opzioni disponibili.

Considera sia videogiochi sia giochi da tavolo, perché entrambi possono
offrire meccaniche riutilizzabili.

Per ogni esempio descrivi:

- Le regole effettive, non soltanto il tema.
- Le decisioni del giocatore.
- Le informazioni disponibili e quelle nascoste.
- Le variabili di stato.
- Le conseguenze delle decisioni.
- Quale esperienza potrebbe produrre e perché.
- Quali evidenze supportano tale interpretazione.
- Come tradurre il principio in RpgBalancer senza copiare il gioco originale.

Evita elenchi di titoli privi di analisi.

## 9. Inventario e tassonomia delle primitive meccaniche

Costruisci una tassonomia di meccaniche effettivamente giocabili.

Non classificare come primitive emotive semplici temi o ambientazioni quali:

- Esplorazione.
- Arrampicata.
- Combattimento.
- Inseguimento.
- Veleno.
- Negoziazione.

Questi sono contesti nei quali possono essere applicate diverse meccaniche.

Una primitiva deve descrivere una struttura di interazione. Per esempio:

- Scelta tra mosse con relazioni di vittoria e sconfitta.
- Serie di round con punteggio persistente.
- Accumulo di progressi contro una soglia di pericolo.
- Decisione di fermarsi o continuare.
- Acquisizione di informazioni attraverso check nascosti.
- Gestione di un livello di allarme.
- Timer che limita le decisioni.
- Selezione del bersaglio e distribuzione del rischio.
- Scelta irrevocabile seguita da una conseguenza non ancora nota.
- Stato che modifica le opzioni disponibili.
- Avversario che cambia strategia in risposta al giocatore.

Questa lista è un punto di partenza, non una tassonomia già convalidata.

Per ogni primitiva proponi una scheda con:

- Nome
- Regole minime.
- Stato mantenuto tra le azioni.
- Input e decisioni disponibili.
- Informazioni note, ignote e acquisibili.
- Ruolo dei check e della casualità.
- Condizioni di successo, fallimento e conclusione.
- Possibilità di rimonta.
- Conseguenze persistenti.
- Feeling che potrebbe produrre.
- Condizioni necessarie affinché quel feeling emerga.
- Modi in cui la meccanica può fallire o diventare noiosa.
- Possibili combinazioni con altre primitive.
- Costo e difficoltà d'implementazione.

Distingui le meccaniche realmente differenti dalle semplici varianti di
parametrizzazione.

Non inventare una libreria di cinquanta elementi artificialmente distinti:
preferisci un nucleo piccolo di primitive solide, con motivazioni chiare per
includere ciascuna.

## 10. Timer, allarme e stati dinamici

Studia esplicitamente l'interazione tra:

- Timer a scalare.
- Livello di allarme che sale e scende.
- Progresso verso un obiettivo.
- Risorse e HP.
- Informazioni ottenute.
- Azioni che modificano i rischi futuri.
- Possibilità di fuga o interruzione.

Non limitarti a proporre un timer che scende o un contatore che sale. Spiega
come le variabili interagiscono per produrre decisioni interessanti.

Per esempio:

- Un'azione può aumentare il progresso ma anche l'allarme.
- Un'azione di ricognizione può rivelare la minaccia ma consumare tempo.
- Una scelta può ridurre l'allarme a costo di perdere un'occasione.
- Una soglia di allarme può cambiare il comportamento degli avversari, anziché
  infliggere semplicemente una penalità numerica.
- Un fallimento può restringere le opzioni disponibili.
- Un successo può creare una nuova opportunità ma aumentare la posta in gioco.

Valuta quando questi sistemi producono tensione e quando diventano soltanto
barre da ottimizzare.

## 11. Combinazioni di meccaniche

Studia le combinazioni, perché una singola primitiva può essere semplice
mentre l'interazione tra due o tre primitive può produrre un'esperienza molto
più ricca.

Per esempio:

**RPS + check nascosto**

- Il giocatore affronta un avversario.
- Un check di percezione può rivelare un comportamento scorretto.
- La scoperta cambia le opzioni o il modo in cui si può leggere l'avversario.

**Timer + allarme + ricognizione**

- Il giocatore deve ottenere informazioni.
- La ricognizione consuma tempo.
- Alcune azioni aumentano l'allarme.
- Il livello di allarme modifica ciò che può succedere in seguito.

**Progressione + push-your-luck + targeting**

- Il giocatore ottiene progressi e bottino.
- Può continuare o interrompere.
- Il rischio cresce.
- Le conseguenze possono ricadere su personaggi differenti.

Per ogni combinazione spiega:

- Che cosa aggiunge ciascuna componente.
- Quale nuova decisione emerge dall'interazione.
- Se l'interazione produce una vera scelta o soltanto più numeri.
- Quali informazioni servono al giocatore per poter ragionare.
- Quali stati possono generare una rimonta.
- Come evitare complessità inutile.

## 12. Applicazione alla quest Sterminio dei Goblin

Progetta almeno tre alternative meccaniche per trasformare la quest esistente.

Le alternative devono differire sostanzialmente nelle regole, non soltanto nel
testo o nei valori numerici.

Per ciascuna:

- Descrivi la sequenza di stati.
- Mostra le decisioni disponibili in ogni fase.
- Specifica cosa sa il giocatore e cosa resta nascosto.
- Definisci check, probabilità o regole di risoluzione.
- Descrivi come un risultato modifica le possibilità successive.
- Mostra almeno un caso di rimonta, un quasi-successo e un fallimento
  interessante.
- Spiega quando e come il giocatore può interrompere o ritirarsi.
- Specifica le conseguenze per party, HP, ferite, loot e ritorno.
- Mostra come la stessa struttura potrebbe essere riutilizzata con un altro
  flavour.

Le alternative devono conservare la componente strategica gestionale di
RpgBalancer: assegnazione del party, scelta dei personaggi, statistiche, slot,
consumabili e costi persistenti devono continuare ad avere significato.

Non trasformare il progetto automaticamente in un gioco d'azione o in una
simulazione di riflessi. Le interazioni possono essere interamente decisionali
e a turni.

## 13. Valutazione e validazione

Non dichiarare che una meccanica produce suspense soltanto perché sembra
plausibile.

Proponi un metodo per testare le ipotesi.

Considera:

- Prototipi minimali.
- Confronti A/B tra check ripetuti e decisioni interattive.
- Telemetria delle scelte e dei risultati.
- Frequenza delle decisioni.
- Distribuzione di vittorie, sconfitte e rimonte.
- Quanto spesso il giocatore cambia strategia dopo un'informazione.
- Quanto spesso le decisioni modificano realmente l'esito.
- Feedback soggettivo dopo la scena.
- Rischio di frustrazione, casualità percepita o sensazione di essere stati
  ingannati.

Definisci indicatori osservabili per fenomeni quali:

- Suspense.
- Agency.
- Percezione di controllo.
- Rimpianto.
- Soddisfazione.
- Sorpresa.
- Desiderio di continuare.
- Percezione di equità.

Non confondere una frequenza di click elevata con un'esperienza emotiva
riuscita.

Proponi esperimenti piccoli ed economici che possano falsificare le ipotesi
prima di investire nello sviluppo di un framework generale.

## 14. Vincoli di design

- Le quest devono restare leggibili e relativamente compatte.
- Il flavour può cambiare senza richiedere una meccanica completamente nuova
  per ogni contesto.
- La narrativa può emergere dalle regole e dalle conseguenze; non deve essere
  tutto scritto in anticipo.
- La casualità è ammessa, ma non deve sostituire sistematicamente le
  decisioni.
- L'informazione nascosta deve poter avere una funzione strategica.
- Le scelte devono avere conseguenze distinguibili.
- Le meccaniche devono poter essere combinate senza esplodere in un sistema
  ingestibile.
- Il giocatore non deve necessariamente conoscere ogni probabilità, ma deve
  avere abbastanza informazioni per fare scelte ragionate.
- La rimonta deve essere possibile quando è coerente con la meccanica, non
  forzata ovunque.
- Le sconfitte possono essere interessanti se producono conseguenze e
  sviluppi significativi.
- Il sistema deve sostenere un grande numero di quest percepite come
  differenti, non soltanto una grande quantità di combinazioni nominali.
- Evitare sistemi narrativi o infrastrutture complesse che non migliorino
  concretamente il gameplay.

## 15. Ricostruzione del progetto e disciplina delle fonti

Prima di progettare:

- Ispeziona i documenti di progetto e il repository RpgBalancer.
- Cerca regole, specifiche, prototipi, simulazioni e test relativi alle quest.
- Ricostruisci le decisioni già prese, quelle ancora aperte e quelle
  esplicitamente rifiutate.
- Verifica lo stato implementativo di ciascun elemento importante.
- Evita di riproporre come novità soluzioni già considerate.
- Non sostituire silenziosamente le decisioni del Director.

Distingui sempre:

- FACT: informazione verificata nella documentazione o nel codice.
- INFERENCE: conclusione ragionevole ricavata dalle evidenze.
- HYPOTHESIS: ipotesi da verificare.
- PROPOSAL: proposta nuova.
- OPEN QUESTION: decisione che richiede il Director.

Quando trovi conflitti tra documenti o tra documentazione e codice, segnalali
invece di risolverli arbitrariamente.

## 16. Fonti e rigore scientifico

Per ogni affermazione scientifica importante:

- Cita la fonte originale o una revisione autorevole.
- Fornisci titolo, autori, anno e DOI o URL quando disponibili.
- Spiega il risultato rilevante in termini comprensibili.
- Distingui evidenza empirica, teoria, interpretazione e applicazione
  progettuale.
- Segnala limiti metodologici, campioni ridotti e risultati controversi.
- Cerca controevidenze, non soltanto studi che confermano le intuizioni
  iniziali.
- Non inventare riferimenti bibliografici.
- Non usare blog di game design come prova scientifica quando esiste una
  ricerca primaria pertinente.

La ricerca non deve necessariamente dimostrare che una meccanica funzionerà in
RpgBalancer. Deve spiegare perché potrebbe funzionare, quali condizioni
richiede e come verificarlo.

## 17. Deliverable finali

Produci i seguenti risultati, nell'ordine:

### A. Executive summary

- Il problema di design in termini precisi.
- Le conclusioni più importanti.
- Le ipotesi iniziali confermate, corrette o respinte.

### B. Audit del sistema esistente

- Meccaniche disponibili.
- Meccaniche parziali o soltanto progettate.
- Lacune reali.
- Decisioni precedenti che vincolano le nuove proposte.

### C. Evidenze scientifiche

- Una sintesi ragionata dei risultati pertinenti.
- Implicazioni concrete per il design.
- Controevidenze e limiti.

### D. Catalogo delle primitive

- Un nucleo prioritizzato di meccaniche implementabili.
- Specifiche operative, non semplici etichette emotive.
- Differenze rispetto ai check tradizionali.

### E. Catalogo delle combinazioni

- Combinazioni di due o tre primitive.
- Nuove possibilità decisionali prodotte da ciascuna.
- Rischi di complessità o ridondanza.

### F. Tre prototipi di quest

- Almeno tre proposte meccanicamente differenti per Sterminio dei Goblin.
- Esempi di sequenze, decisioni e risultati.
- Analisi delle emozioni che potrebbero produrre.

### G. Piano di validazione

- Esperimenti minimali.
- Metriche.
- Criteri di successo e di abbandono.

### H. Piano operativo per RpgBalancer

- Quale prototipo realizzare per primo.
- Quali elementi riutilizzare dal sistema attuale.
- Quali cambiamenti richiederebbero nuove infrastrutture.
- Dipendenze e rischi.
- Passi incrementali che consentano di imparare prima di generalizzare.

### I. Questioni aperte per il Director

- Soltanto domande che cambiano materialmente l'architettura o il design.
- Per ciascuna, spiega perché la risposta conta e quali alternative comporta.

## 18. Criterio finale di successo

La ricerca fallisce se produce soltanto:

- Un elenco di emozioni.
- Un elenco di giochi da cui prendere ispirazione.
- Una lista di temi narrativi.
- Una tassonomia teorica senza regole concrete.
- Un framework elegante ma privo di prototipi verificabili.
- Un generatore di quest che combina meccaniche poco interessanti.

La ricerca ha successo se permette al Director di guardare una proposta e
capire esattamente:

Che cosa fa il giocatore? Che cosa sa? Che cosa rischia? Quale decisione deve
prendere? Come cambia lo stato? Perché dovrebbe provare suspense, rimontare o
essere sorpreso? E come possiamo verificare che accada davvero?

L'obiettivo non è scrivere più belle quest.

È costruire un sistema capace di generare situazioni ludiche interessanti, in
cui le emozioni emergano dall'interazione tra decisioni, informazione, rischio,
stato e conseguenze.

---

# Prima di lanciare la ricerca: 5 domande che potrebbero cambiarne il risultato

Ho inserito nel prompt ciò che sappiamo già. Queste sono le lacune che vale la
pena chiarire, perché possono cambiare radicalmente il tipo di meccaniche da
cercare.

## 1. Quanto controllo vuoi dare al giocatore durante una quest?

RPS introduce una scelta a ogni round. Ma il gioco potrebbe anche essere
prevalentemente gestionale, con poche decisioni cruciali.

- Poche decisioni cruciali, ma molto significative.
- Decisioni frequenti durante la risoluzione della quest.
- Entrambe: poche decisioni ordinarie e alcune fasi molto interattive.

## 2. Il giocatore deve poter imparare e diventare bravo nelle meccaniche?

- Sì: riconoscere pattern, leggere avversari e migliorare con l'esperienza.
- Soprattutto pianificazione, probabilità, gestione del rischio e composizione
  del party.
- Un mix delle due, senza richiedere riflessi o abilità manuale.

## 3. Quanto deve essere prevedibile il rischio?

- Probabilità o rischi quasi sempre espliciti.
- Informazione incompleta, ma indizi sufficienti per ragionare.
- Anche sorprese forti, purché non sembrino arbitrarie o ingiuste.

## 4. Quanto deve contare la possibilità di perdere personaggi?

- Ferite e conseguenze persistenti; morte rara.
- La morte deve essere possibile e rendere alcune decisioni dolorose.
- Dipende dalla quest e dal rischio scelto.

## 5. Quali emozioni vuoi prioritizzare?

Scegline idealmente 2–3: la ricerca sarà più utile se non tenterà di
massimizzare tutto contemporaneamente.

- Suspense, tensione e rimonta.
- Strategia, padronanza e soddisfazione per una buona decisione.
- Sorpresa, scoperta e cambi di prospettiva.
- Attaccamento ai personaggi, sacrificio e conseguenze dolorose.
- Avidità, tentazione, rischio e rimpianto.

*Integra le risposte nel prompt.*

Un'ultima raccomandazione: farei eseguire l'audit del repository e la ricerca
scientifica come due filoni distinti, per poi incrociarli. Altrimenti c'è il
rischio che la ricerca produca un sistema teoricamente interessante, ma
incompatibile con le regole e i vincoli che hai già definito.
