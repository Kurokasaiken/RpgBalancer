---
title: "Gameplay Quest Design That Produces Strong Feelings — risposta DeepSeek"
type: research-response
author: DeepSeek (senza accesso al repository — struttura della quest "inferita dal brief")
date: 2026-10-10
brief: "Research Plan: Quest Gameplay That Produces Strong Feelings (Round 4)"
note: >
  Primo contenuto DeepSeek disponibile della raccolta (nel Round 1 la sua
  risposta era un file upload mai incollato). NON risponde ai brief Round 1-3:
  risponde al brief feelings-first del Round 4.
---

Gameplay Quest Design That Produces Strong Feelings
Rapporto di ricerca per RpgBalancer
1. Evidence Report: Fonti, risultati e incertezze
1.1 Psicologia della suspense e dell'incertezza
Risultato principale. La suspense è composta da tre elementi: speranza, paura e incertezza. La ricerca di Moulard et al. (2019) propone un modello in cui ricompense e punizioni influenzano rispettivamente speranza e paura, e fluttuazioni dinamiche nella probabilità di vincere/perdere amplificano la suspense. Le emozioni di esito (soddisfazione, sollievo, delusione, angoscia) sono distinte dalla suspense provata prima dell'esito.
Distinzione critica. La suspense non è la sorpresa. La sorpresa è un evento inatteso che si manifesta; la suspense è l'anticipazione di un esito incerto e rilevante. Un gioco può produrre sorpresa senza suspense (un colpo di scena improvviso) e suspense senza sorpresa (un duello che si trascina con esito incerto).
Implicazione per il design. Un check ripetuto fino a soglia non produce suspense perché la probabilità di successo è percepita come statica (il giocatore sa che prima o poi passerà). La suspense richiede che la probabilità percepita fluttui in modo visibile: il giocatore deve poter pensare «ora sono in vantaggio», «ora sono in svantaggio», «ora è tutto in bilico». Questo è esattamente ciò che una serie di round con punteggio persistente fornisce.
Incertezza. Il modello di Moulard è concettuale, non testato empiricamente in tutte le sue componenti. La relazione causale tra fluttuazioni di probabilità e suspense è supportata da ricerca precedente ma non è stata isolata sperimentalmente in un contesto di gioco. È un'ipotesi di design plausibile, non un fatto stabilito.
1.2 Near miss: risultati controintuitivi
Risultato principale. Lo studio di Finserås et al. (2021) su 40 partecipanti mostra che i near miss non producono un'esperienza positiva. I partecipanti riportano maggiore frustrazione e rimpianto quando perdono, e si sentono più annoiati e meno eccitati dopo un near miss rispetto a una vittoria con margine ampio. Tuttavia, i near miss aumentano il desiderio di continuare a giocare in contesti di gioco d'azzardo.
Implicazione per il design. Il near miss non va usato come meccanica di coinvolgimento positivo. Può produrre frustrazione se il giocatore sente di essere stato vicino ma non abbastanza. Va usato con cautela, preferibilmente in combinazione con informazioni su cosa sarebbe servito e possibilità di rimonta. Un near miss che il giocatore può capire (es. «mi serviva un danno in più in quel round») è meno frustrante di un near miss opaco.
Limiti. Lo studio ha un campione ridotto (N=40), utilizza un gioco specifico (Candy Crush-like) e non distingue tra near miss abilità-dipendenti e fortuna-dipendenti. La generalizzabilità a RpgBalancer è incerta.
1.3 Prospect theory e risk-taking
Risultato principale. La prospect theory (Kahneman & Tversky) stabilisce che le persone sono risk-averse nel dominio dei guadagni e risk-seeking nel dominio delle perdite. Questo è uno dei risultati più robusti della psicologia decisionale.
Implicazione per il design. Il momento in cui il giocatore ha già ottenuto progressi (dominio dei guadagni) è il momento in cui è più propenso a proteggere ciò che ha. Il momento in cui ha subito perdite (HP bassi, risorse esaurite) è il momento in cui è più propenso a rischiare. Questo crea un ciclo naturale di push-your-luck: il giocatore accumula guadagni, poi deve decidere se rischiare per ottenere di più, sapendo che una perdita lo porterebbe nel dominio delle perdite dove diventerebbe risk-seeking.
Limiti. La prospect theory è stata testata principalmente in contesti economici, non in giochi. L'entità dell'effetto varia con il framing e il contesto. Non è una «legge universale».
1.4 Escalation of commitment e sunk cost
Risultato principale. La ricerca identifica tre determinanti critici dell'escalation: responsabilità personale, preferenze per decisioni precedenti e framing della decisione. Non è una «legge universale» ma un fenomeno robusto in contesti di investimento sequenziale.
Implicazione per il design. Se il giocatore ha investito risorse in un approccio, sarà più propenso a continuare anche quando i segnali suggeriscono di ritirarsi. Questo può essere sfruttato per creare tensione, ma anche per creare frustrazione se il gioco non fornisce segnali chiari. Un feedback esplicito («l'allarme è troppo alto, i goblin stanno arrivando») può aiutare il giocatore a prendere decisioni informate senza eliminare la tensione.
1.5 Giochi di segnalazione e bluff
Risultato principale. Nei giochi di segnalazione (signaling games), il mittente conosce il proprio tipo, il ricevente no. Il ricevente deve inferire il tipo dal segnale. La ricerca sul beer-quiche game mostra che bluff e segnali possono coesistere in equilibri di pooling e ibridi.
Implicazione per il design. Un avversario che bara in un gioco di RPS può essere progettato come un signaling game: il giocatore (ricevente) deve inferire se l'avversario (mittente) sta barando o no, basandosi su pattern di gioco. Un check di percezione può rivelare il tipo dell'avversario, ma non necessariamente in modo esplicito. Il modello di Chen et al. (2022) mostra che il bluff può migliorare l'utilità del difensore in giochi di sicurezza.
Limiti. La ricerca è teorica e basata su simulazioni. Non ci sono studi empirici su giocatori umani in contesti di gioco con bluff nascosto.
1.6 Monte Carlo e validazione
Risultato principale. Le simulazioni Monte Carlo sono utilizzate per bilanciare giochi, simulando partite con bot che prendono decisioni «intelligenti». Tuttavia, la ricerca sottolinea che l'esperienza utente non può essere ridotta alla simulazione: un gioco può essere bilanciato ma non emotivamente coinvolgente.
Implicazione per il design. Monte Carlo può validare proprietà strutturali (frequenza delle rimonte, distribuzione degli esiti, esistenza di strategie dominanti) ma non può validare suspense, agency o soddisfazione. Queste richiedono playtest umani.
1.7 Adaptive AI e pattern recognition
Risultato principale. La ricerca su AI adattiva nei giochi competitivi mostra che agenti che apprendono e si adattano al comportamento dell'opponente producono maggiore engagement e competitività rispetto ad AI con script fissi. Tuttavia, l'adattamento deve essere leggibile dal giocatore: se l'AI cambia strategia in modo incomprensibile, il giocatore non può imparare.
Implicazione per il design. Un avversario che cambia strategia in risposta alle azioni del giocatore è più interessante di un avversario con pattern fisso. Ma il cambio deve essere comprensibile: il giocatore deve poter capire perché l'avversario ha cambiato.
2. Feeling → Gameplay Pattern Map
Sentimento
Sequenza di decisioni
Posta in gioco
Esperienza attesa
Failure modes
Suspense
Serie di round con punteggio persistente; il giocatore sceglie una mossa, il punteggio fluttua, la conclusione si avvicina
HP, loot, tempo, allarme
Tensione crescente man mano che il punteggio si avvicina alla soglia
Avversario troppo prevedibile (no incertezza); avversario troppo casuale (no strategia)
Tensione
Timer che scende + allarme che sale + ricognizione che consuma tempo
Tempo, allarme, informazioni
Pressione costante, trade-off tra agire e informarsi
Timer isolato (barra da ottimizzare); allarme non leggibile
Rimonta
Punteggio in svantaggio + informazione acquisita (check) + possibilità di cambiare strategia
Punteggio, risorse
Soddisfazione per aver ribaltato la situazione
Rimonta impossibile; rimonta forzata (troppo facile)
Sorpresa equa
Scelta irrevocabile + conseguenza ritardata + collegamento causale
Stato persistente
«Ah, ecco perché è successo!»
Conseguenza non collegabile; scelta arbitraria
Rimpianto
Decisione rischiosa + esito negativo + alternativa plausibile
Risorse, HP
«Avrei dovuto fermarmi prima»
Rimpianto eccessivo (frustrazione); nessun rimpianto (scelta banale)
Greed
Accumulo di progressi + rischio crescente + decisione stop/continue
Progressi, loot
Tentazione di continuare nonostante il rischio
Rischio non leggibile; perdita troppo punitiva
Attaccamento
Assegnazione personaggi a slot + rischio differenziato + conseguenze persistenti
HP, ferite, morte
Preoccupazione per i personaggi, soddisfazione per averli protetti
Personaggi intercambiabili; nessun recupero
Soddisfazione per mastery
Pattern avversario leggibile + adattamento del giocatore + sfruttamento del pattern
Punteggio
«Ho letto l'avversario»
Pattern troppo semplice; pattern incomprensibile
Curiosità
Informazione nascosta + check di percezione + rivelazione parziale
Informazioni
Desiderio di scoprire cosa c'è dietro
Informazione irrilevante; rivelazione troppo esplicita
3. Comparative Shortlist: 3-5 pattern più promettenti
Pattern 1: Serie di round con punteggio persistente e avversario adattivo
Descrizione. Il giocatore affronta una serie di round. Ogni round produce un esito che modifica un punteggio. L'avversario cambia strategia in risposta al punteggio e alle azioni del giocatore.
Perché è promettente:
- Produce suspense (fluttuazione della probabilità percepita).
- Permette rimonta (punteggio persistente).
- Richiede decisioni attive (non attesa passiva).
- Riutilizza il sistema di slot, statistiche e consumabili esistente.
- L'avversario adattivo mantiene la sfida anche dopo che il giocatore ha imparato il pattern.
Rischi: L'avversario potrebbe essere troppo prevedibile o troppo imprevedibile. Richiede un sistema di IA con strategie multiple.
Pattern 2: Push-your-luck con rischio crescente e targeting
Descrizione. Il giocatore accumula progressi. Dopo ogni progresso, può fermarsi o continuare. Il rischio di perdita aumenta con ogni continuazione. Le conseguenze ricadono su personaggi specifici.
Perché è promettente:
- Produce tensione (decisione stop/continue).
- Sfrutta la prospect theory (risk-averse nei guadagni, risk-seeking nelle perdite).
- Il targeting aggiunge attaccamento emotivo.
- Implementazione relativamente semplice.
Rischi: Il rischio deve essere leggibile. La perdita non deve essere troppo punitiva. Il targeting può produrre frustrazione se i personaggi muoiono senza possibilità di recupero.
Pattern 3: Check nascosto che rivela comportamenti e cambia le opzioni
Descrizione. Un check nascosto (percezione, intelligenza) rivela un comportamento, un pattern o una possibilità alternativa. Se fallisce, il gioco non mostra un messaggio esplicito: l'avversario continua a comportarsi come prima.
Perché è promettente:
- L'informazione ha funzione strategica (cambia le opzioni, non solo i numeri).
- Produce sorpresa equa (il giocatore capisce cosa ha scoperto).
- Si combina bene con la serie di round e con il push-your-luck.
- Il fallimento non è punitivo (l'avversario continua).
Rischi: L'informazione deve essere rilevante. Il feedback deve essere indiretto ma comprensibile.
Pattern 4: Timer con pressione crescente e allarme che modifica il comportamento
Descrizione. Il giocatore ha un numero limitato di azioni. Ogni azione consuma tempo e aumenta l'allarme. L'allarme, superata una soglia, cambia il comportamento degli avversari (non infligge solo una penalità numerica).
Perché è promettente:
- Produce pressione e urgenza.
- L'allarme che cambia il comportamento mantiene la tensione anche quando il giocatore ha accumulato molto loot.
- Interagisce bene con il push-your-luck e con la ricognizione.
Rischi: Tre variabili interconnesse possono diventare ingestibili. Le soglie devono essere leggibili.
Pattern 5: Scelta irrevocabile con conseguenza ritardata
Descrizione. Il giocatore prende una decisione che non può essere annullata. La conseguenza non è immediatamente visibile: si manifesterà più avanti, in un momento in cui il giocatore potrebbe aver dimenticato la scelta o non collegarla ad essa.
Perché è promettente:
- Produce attesa e sorpresa (quando la conseguenza si manifesta).
- Crea un senso di continuità tra le quest.
- Si combina bene con il check nascosto.
Rischi: La conseguenza deve essere collegabile alla scelta. Il giocatore deve poter capire il nesso causale.
4. Goblin Quest Alternatives
4.1 Analisi della quest attuale
Struttura attuale (inferita dal brief): Sequenza di fasi lineari: percezione → approccio → combattimento con check ripetuti → loot → ritorno. La percezione fornisce un bonus numerico. Il combattimento è check fino a soglia. Il loot è una scelta astratta premio/penalità.
Sentimenti che la struttura attuale può produrre: Poca suspense (check ripetuti senza stato persistente), poca agency (decisioni che non modificano le opzioni), poco attaccamento (personaggi intercambiabili nelle fasi).
Sentimenti che non supporta: Suspense, rimonta, sorpresa equa, attaccamento, soddisfazione per mastery.
Decisioni attualmente interessanti: Poche. L'assegnazione dei personaggi agli slot è l'unica decisione con conseguenze differenziate. Le altre sono selezioni di probabilità.
4.2 Alternativa A: «La Caverna dei Goblin» — Serie di round con avversario adattivo
Struttura:
Round 1 (Esplorazione): Il giocatore assegna i personaggi agli slot. I goblin attaccano con una strategia base. Il giocatore sceglie la formazione.
Round 2 (Adattamento): I goblin cambiano strategia in base agli esiti del Round 1. Il giocatore può cambiare formazione o mantenere.
Round 3 (Escalation): I goblin cambiano ancora. Il giocatore decide se continuare o ritirarsi.
Round finale (Re Goblin): Se il giocatore continua, affronta il capo con una strategia imprevedibile.
Decisioni:
- Assegnazione dei personaggi agli slot (chi rischia di più).
- Scelta di continuare o ritirarsi dopo ogni round.
- Uso di consumabili in momenti specifici.
- Targeting: concentrare il danno su un goblin specifico o distribuire.
Cosa sa il giocatore: Punteggio, HP dei personaggi, strategia osservata dei goblin nei round precedenti.
Cosa resta nascosto: Strategia del prossimo round, presenza del capo, sue abilità.
Check e probabilità: Ogni round ha un check di combattimento per ogni slot. La probabilità dipende dalla statistica del personaggio, dal tipo di goblin e dalla strategia scelta.
Rimonta: Il giocatore è in svantaggio 2-3. Scopre un pattern nel comportamento dei goblin. Cambia formazione, usa un consumabile potente, vince i round 4 e 5.
Quasi-successo: Il giocatore perde un round per un margine di 1 goblin. Il near miss non produce frustrazione perché il giocatore ha informazioni su cosa sarebbe servito.
Fallimento interessante: Il giocatore si ritira dopo il round 3, ma ha accumulato abbastanza informazioni sui goblin da poter tornare con una strategia migliore.
Interruzione/ritiro: Dopo ogni round. Il ritiro conserva i progressi ma non il loot finale.
Conseguenze: HP persi, ferite, morte, loot proporzionale ai round completati.
Riutilizzo: Torneo di gladiatori, serie di duelli, spedizione in una fortezza nemica.
4.3 Alternativa B: «La Tana del Re Goblin» — Push-your-luck con allarme e ricognizione
Struttura:
Ingresso: Il giocatore decide se fare ricognizione (consuma tempo, rivela informazioni) o avanzare subito.
Esplorazione: Ogni stanza ha un costo in tempo e un aumento di allarme. Alcune stanze contengono loot, altre trappole, altre goblin.
Allarme: Quando l'allarme raggiunge una soglia, i goblin iniziano a pattugliare in modo più aggressivo. Il giocatore può usare un'azione per ridurre l'allarme a costo di tempo.
Decisione finale: Il giocatore può continuare verso la camera del tesoro (alto rischio, alto loot) o tornare indietro con quello che ha.
Decisioni:
- Ricognizione sì/no (consuma tempo, rivela rischi).
- Avanzare o tornare indietro dopo ogni stanza.
- Usare tempo per ridurre l'allarme o per avanzare.
- Assegnare personaggi a slot di avanscoperta (rischio alto, informazioni) o retroguardia (rischio basso).
Cosa sa il giocatore: Tempo rimanente, livello di allarme, progressi, loot ottenuto.
Cosa resta nascosto: Contenuto delle stanze future, posizione del tesoro, comportamento dei goblin oltre la soglia.
Check e probabilità: Ogni stanza ha un check per determinare se si trova loot o si attiva una trappola. La ricognizione rivela il contenuto di una stanza ma consuma tempo.
Rimonta: Il giocatore ha accumulato molto allarme e sta per essere circondato. Usa un consumabile per distrarre i goblin (riduce l'allarme a 0) e riesce a fuggire con il loot.
Quasi-successo: Il giocatore trova la camera del tesoro ma non ha abbastanza tempo per prenderlo tutto. Deve scegliere cosa portare via.
Fallimento interessante: Il giocatore viene catturato dai goblin. Invece di morire, viene imprigionato e deve escogitare un piano per fuggire (nuova mini-quest).
Interruzione/ritiro: In qualsiasi momento. Il ritiro conserva il loot accumulato ma non il bonus finale.
Conseguenze: HP persi, ferite, morte, loot proporzionale al rischio, stato di allarme che persiste nella quest successiva.
Riutilizzo: Spedizione in un dungeon, infiltrazione in una base nemica, esplorazione di rovine.
4.4 Alternativa C: «Il Re Goblin» — RPS + check nascosto + conseguenze ritardate
Struttura:
Preparazione: Il giocatore assegna i personaggi agli slot. Ogni personaggio fornisce un bonus a una mossa specifica (es. il guerriero dà +1 a "Sasso").
Round 1-3: Il giocatore sceglie una mossa. Il Re sceglie una mossa. L'esito determina il punteggio. Un check nascosto può rivelare un pattern nel comportamento del Re.
Scoperta: Se il check riesce, il giocatore sa che il Re bara. Il gioco non mostra un messaggio esplicito: il Re semplicemente cambia mossa in modo sospetto. Il giocatore può decidere di accusare il Re (cambia le regole), sfruttare il sistema (cambia la propria strategia), o continuare come se nulla fosse.
Round finale: Il punteggio decide l'esito. Se il giocatore vince, il Re fugge o viene catturato. Se perde, il Re lo maledice (conseguenza ritardata: un malus che si manifesterà in una quest futura).
Decisioni:
- Scelta della mossa per ogni round (Sasso, Carta, Forbici).
- Assegnazione dei personaggi agli slot (chi fornisce quale bonus).
- Accusare il Re o no (se il check ha rivelato il comportamento scorretto).
- Uso di consumabili per annullare una sconfitta o raddoppiare una vittoria.
Cosa sa il giocatore: Punteggio, mosse giocate, comportamento osservato del Re.
Cosa resta nascosto: Mossa del Re per il round corrente, probabilità che il Re bari, conseguenze della maledizione.
Check e probabilità: Ogni round ha un check di combattimento (mossa vs. mossa). Un check nascosto di percezione rivela se il Re bara. La probabilità che il Re bari è modulata dalla difficoltà.
Rimonta: Il giocatore è in svantaggio 0-2. Scopre che il Re bara. Decide di sfruttare il sistema: sceglie la mossa che batte la mossa che il Re sceglierà (perché sa che il Re cambierà dopo aver visto la sua). Vince 3 round consecutivi.
Quasi-successo: Il giocatore perde l'ultimo round per un margine di 1 punto. Il Re fugge, ma il giocatore ha scoperto la sua tana (informazione che sblocca una quest futura).
Fallimento interessante: Il giocatore accusa il Re ma non ha prove. Il Re lo bandisce dalla regione (conseguenza persistente: malus diplomatico).
Interruzione/ritiro: Dopo ogni round. Il ritiro conserva il punteggio ma non il loot.
Conseguenze: HP persi, ferite, morte, loot, maledizione (malus ritardato), informazioni sulla tana del Re.
Riutilizzo: Duello con un nobile corrotto, partita a carte con un demone, negoziazione con un mercante disonesto.
5. Recommended Next Experiment
Esperimento discriminante: Serie di round vs. check ripetuti
Obiettivo: Determinare se una serie di round con punteggio persistente e avversario adattivo produce suspense e agency significativamente maggiori rispetto a check ripetuti fino a soglia.
Metodo:
- Versione A (controllo): Quest «Sterminio dei Goblin» attuale. Check ripetuti fino a soglia. Percezione come bonus numerico.
- Versione B (sperimentale): Alternativa A. Serie di 3-5 round con punteggio persistente. Avversario che cambia strategia in base al punteggio. Percezione che rivela pattern comportamentali.
Partecipanti: 20-30 giocatori (campione minimo per rilevare differenze medie con potenza 0.8).
Misure:
Questionario post-scena (scala Likert 1-7): suspense, agency, soddisfazione, frustrazione, desiderio di ripetere.
Telemetria: Numero di decisioni che modificano l'esito; frequenza dei cambi di strategia; tempo di riflessione per decisione; distribuzione delle rimonte.
Intervista semi-strutturata: «Cosa stavi pensando durante il round 3?» «Perché hai deciso di continuare/ritirarti?»
Criterio di successo: Versione B riporta suspense e agency significativamente più alte (p < 0.05) senza aumentare frustrazione o percezione di casualità.
Criterio di abbandono: Nessuna differenza significativa, o frustrazione significativamente più alta nella Versione B.
Costo: Basso. La Versione A esiste già. La Versione B richiede l'implementazione di un sistema di punteggio e un avversario con 2-3 strategie.
Cosa discrimina: Se la Versione B produce i risultati attesi, la direzione è confermata: le quest devono essere strutturate come giochi decisionali, non come sequenze di check. Se non li produce, l'ipotesi fondamentale va rivista.
6. Questioni aperte per il Director
6.1 Quanto complesso può diventare il sistema di avversario?
Un avversario con molte strategie e condizioni di cambio richiede più sviluppo e può confondere il giocatore. Un avversario troppo semplice non produce suspense. Alternative: 2-3 strategie fisse (semplice, ma forse prevedibile) vs. 3-4 strategie con cambio in base a punteggio/tempo/azioni (più complesso, ma più ricco).
6.2 Il sistema deve supportare conseguenze ritardate tra quest diverse?
Le conseguenze ritardate richiedono un sistema di stato persistente che va oltre la singola quest. Alternative: solo all'interno della stessa quest (semplice, meno impatto a lungo termine) vs. tra quest diverse (richiede stato globale, ma crea continuità e attaccamento).
6.3 Quanto deve essere esplicito il feedback sulle meccaniche nascoste?
Il check nascosto funziona solo se il giocatore può capire cosa ha rivelato. Alternative: feedback indiretto (l'avversario si comporta diversamente) vs. feedback semi-esplicito (un'icona, un cambio di colore).
6.4 Il sistema deve permettere al giocatore di «rompere» le regole?
La possibilità di accusare il Re cambia radicalmente la struttura del gioco. Alternative: il giocatore può solo giocare secondo le regole (semplice) vs. può accusare con conseguenze (più strategico, più sviluppo).
6.5 Quanto peso deve avere il targeting dei personaggi?
Il targeting aggiunge attaccamento emotivo, ma può anche aggiungere frustrazione. Alternative: targeting limitato (solo danni, no morte permanente) vs. targeting completo (morte permanente, richiede un sistema di attaccamento ben sviluppato).

(deepseek)
