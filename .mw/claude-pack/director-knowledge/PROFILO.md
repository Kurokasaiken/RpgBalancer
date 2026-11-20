# PROFILO

> Scopo: profilo operativo riutilizzabile come contesto iniziale in nuove sessioni.
> Ultimo consolidamento: 2026-10-28 (verifica repo inclusa).
> **Limite delle fonti:** questo documento deriva dal contesto attualmente consultabile (memorie sintetiche, riepiloghi di conversazioni e messaggi recenti), non da una lettura integrale di tutte le chat.

## Legenda epistemica

- **FACT**: informazione esplicitamente riferita dall'utente o direttamente presente nel contesto consultabile.
- **DECISION**: scelta esplicita dell'utente.
- **PROPOSAL**: idea o opzione proposta, non necessariamente adottata.
- **REJECTED**: opzione o approccio esplicitamente rifiutato.
- **OPEN**: questione aperta o informazione mancante.
- **INFERENCE**: interpretazione ragionevole, non dichiarazione letterale dell'utente.

## Contatti e dati anagrafici (moduli, candidature, CV)

- **FACT** — Nome e cognome: **Fausto Boni**.
- **FACT** — Email: `licaone12@gmail.com`.
- **FACT** — Telefono: `3920044477` (+39).
- **FACT** — Codice fiscale: `BNOFST83L04A052C`.
- **FACT** — Città/provincia per moduli: Carpi (MO).
- (Aggiunto 2026-11-16 su richiesta esplicita del Director: «segnale da qualche parte come riferimenti su di me accessibile ad ogni progetto».)

## Identità professionale e competenze

- **FACT** — L'utente lavora come programmatore Java/backend. Nel profilo indica il ruolo «Programmatore java».
- **FACT** — Usa Java e Quarkus quotidianamente da circa tre anni e ha lavorato su moduli completi. Usa PostgreSQL e REST nel lavoro quotidiano; usa Docker Compose, ma non ha una grande esperienza di ottimizzazione query o cloud. (Contesto professionale aggiornato intorno al 2026-10-18.)
- **FACT** — Vive a Carpi e lavora a Reggio Emilia; il contesto recente cita la zona AV/via Umbria. Queste località sono logistiche e potrebbero cambiare.
- **FACT** — Ha un impiego a tempo indeterminato; retribuzione riferita: circa €26.000 lordi annui, circa €1.600 netti/mese per 13 mensilità. Obiettivo professionale riferito: circa €30.000 e crescita. (Informazioni riportate nel contesto intorno al 2026-10-18; da riconfermare se usate per decisioni attuali.)
- **FACT** — Ha usato Devin Desktop e Windsurf. Budget aggiuntivo preferito per strumenti AI: circa €20/mese. (2026-10-18 circa.)

## Stile di lavoro e collaborazione

- **FACT** — Vuole che le decisioni progettuali siano basate su ciò che è stato effettivamente verificato nel repository o nei materiali, non su piani presentati come se fossero già implementati.
- **FACT** — Per i progetti software distingue esplicitamente fatti, decisioni, proposte, elementi superati e questioni irrisolte. Nel progetto Mind Weaver usa anche le etichette FACT / INFERENCE / ASSUMPTION / UNRESOLVED / FROZEN.
- **INFERENCE** — È utile separare sempre stato verificato, intenzione, ipotesi e prossima azione; evitare di confondere «proposto» con «fatto».
- **FACT** — Apprezza analisi approfondite quando la richiesta è complessa e si irrita se la ricerca è superficiale o se la risposta non affronta la domanda effettiva. Ha espresso frustrazione per output poco approfonditi il 2026-10-22.
- **FACT** — Vuole conservare il contesto di progetti e decisioni tra account/sessioni, evitando di dover ricostruire tutto a memoria. (Richiesta esplicita il 2026-10-28.)
- **OPEN** — Il formato finale desiderato per il futuro archivio (solo Markdown, repository Git, archivio compresso, sincronizzazione) non era stato definito prima della richiesta corrente.

## Preferenze per le risposte

- **DECISION** — Rispondere in italiano naturale e adattato al contesto italiano.
- **FACT** — Preferisce risposte dirette, compatte e con meno prolissità/spaziatura verticale rispetto a risposte molto lunghe, soprattutto per domande semplici.
- **FACT** — Non gradisce che la risposta ripeta la sua domanda o riassuma ciò che ha già detto senza aggiungere valore.
- **FACT** — Non gradisce un tono aggressivo o volgarità; ha chiesto di evitare lo stile aggressivo statunitense.
- **FACT** — Apprezza umorismo pronto e intelligente quando appropriato, incoraggiamento e un orientamento al futuro.
- **FACT** — Quando una domanda è precisa, preferisce una risposta altrettanto precisa, senza deviazioni lunghe su argomenti che non servono.
- **FACT** — Se chiede un approfondimento, si aspetta rigore, sfumature, motivazioni e limiti espliciti, non una risposta superficialmente sicura.
- **REJECTED** — In ambito anime, rifiuta suggerimenti già noti o deliberatamente poco adatti presentati «per metterlo alla prova».
- **REJECTED** — In ambito software/progetti, non inventare caratteristiche o comportamenti non confermati.

## Vincoli ricorrenti

- **FACT** — Nei progetti creativi e software, non introdurre caratteristiche che l'utente non ha deciso o che non sono supportate dalle fonti.
- **FACT** — Preferisce che le alternative scartate e le motivazioni siano mantenute, non cancellate dal riepilogo.
- **FACT** — Per l'alimentazione pratica, ha vincoli di budget e cucina minima: frigorifero/freezer, microonde e padella; preferisce preparazioni rapide, congelabili o da dispensa, con massimo circa cinque minuti di preparazione attiva.
- **FACT** — Per il lavoro di sviluppo, vuole mantenere il controllo delle decisioni di direzione mentre gli agenti AI possono svolgere implementazione e ricerca entro regole definite.
- **INFERENCE** — In un nuovo thread conviene iniziare con questo file e allegare soltanto il dossier specifico del tema, invece di fornire tutto l'archivio a ogni richiesta.
- **FACT (aggiunta 2026-10-28)** — Esiste anche un profilo Director machine-readable nel repo RPG: `context/auto/director-profile.jsonl` (200+ voci D-xxx con class preference/veto/constraint, confidence, review_by) + `veto-block.md`. È advisory e RPG-scoped, ma contiene preferenze trasversali su verifica visiva, trappole ricorrenti e metodo di lavoro.

## Come riutilizzare l'archivio

- **DECISION** — Le informazioni devono essere etichettate come FACT, DECISION, PROPOSAL, REJECTED, OPEN o INFERENCE.
- **PROPOSAL** — All'inizio di una nuova sessione, fornire `PROFILO.md` e il dossier pertinente; aggiungere `PROGETTI.md` se serve orientamento tra più progetti.
- **OPEN** — Questo archivio non è ancora un registro completo delle conversazioni né una trascrizione integrale. Va aggiornato con decisioni nuove e con riferimenti alle fonti verificabili.
