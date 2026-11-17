# Wanderlust: Triumph — Descrizione del team e CV

## Il team

Il progetto è sviluppato da **un solo autore**, che copre tutti i ruoli: programmazione, game design, direzione artistica, produzione e gestione del progetto.

Gli strumenti di **AI generativa e agentica** sono utilizzati nel processo produttivo — per concept art e asset visivi sotto direzione artistica umana, e come supporto al pair-programming e alla ricerca sotto direzione progettuale umana — ma **non costituiscono componenti del team**: design, architettura, bilanciamento e ogni decisione creativa e di direzione restano dell'autore. L'uso dell'AI è dichiarato nel form («Sì, la usiamo») e documentato nella pipeline di produzione.

Wanderlust: Triumph è il **primo videogioco commerciale** dell'autore.

## CV — Fausto Boni

**Ruolo nel progetto:** autore unico — sviluppo tecnico, game design, direzione artistica e di progetto.

### Profilo professionale

Sviluppatore software con esperienza professionale in ambito **backend enterprise**:

- **Java / Quarkus** — circa tre anni di uso quotidiano su moduli applicativi completi.
- **PostgreSQL, REST API** — progettazione e integrazione nel lavoro quotidiano.
- **Docker Compose** — ambienti di sviluppo e orchestrazione locale.
- Solide basi di ingegneria del software: architetture a servizi, persistenza dati, testing, versionamento e rilascio.

### Esperienza su Wanderlust: Triumph

Lo sviluppo del gioco ha richiesto e prodotto competenze tecniche e architetturali documentabili sul progetto reale:

- **Architettura front-end di gioco**: applicazione TypeScript/React complessa con renderer **PixiJS su WebGL2** — pipeline di texture a livelli multipli, tiling ad alta risoluzione, budget di memoria GPU e profili di qualità per desktop, Steam Deck e mobile.
- **Motori di gioco custom**: motori deterministici per tempo, economia, quest, produzione, ferite e sopravvivenza; risoluzione di missioni con esiti graduati; simulazione probabilistica (analitica e Monte Carlo seeded) per il bilanciamento.
- **Sistemi di persistenza e salvataggio**: servizio di persistenza asincrono con pacchetti di salvataggio atomici e slot multipli.
- **Pipeline di contenuto**: authoring di quest come scenari dichiarativi validati (schemi Zod), localizzazione multi-lingua (EN/IT), config-first per ogni valore di gameplay e UI.
- **Game design documentato**: governance del progetto con documenti canonici, decision log, contratti verificabili per componente e test end-to-end automatizzati (Playwright).
- **Direzione artistica**: definizione del linguaggio visivo (mappa dipinta, UI «gioiello»), pipeline di produzione asset con strumenti di AI generativa, paintover e integrazione runtime, verifica visiva sistematica.

### Portfolio verificabile

- **Superficie interattiva `/game`** sulla build pubblica: `https://rpg-balancer.vercel.app/game`
- Screenshot e materiali nella cartella `07_Screenshots`.
- Il repository sorgente non è parte dei materiali condivisi, per scelta.

### Nota di trasparenza

Il candidato è consapevole dei limiti di un team di una sola persona: li compensa con una pipeline di produzione fortemente strumentata (documentazione viva, test automatizzati, contratti di qualità misurabili) e con l'uso disciplinato di strumenti AI per la produttività — mantenendo umani direzione, gusto e responsabilità del risultato.
