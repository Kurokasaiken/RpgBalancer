
# Research Prompt Protocol (R-278, Director ruling 2026-10-24)

Ogni domanda a provider esterni (broadcast, debate, mw-ask) formulata per
ricerca/opinioni si scrive come EXPLORER, non come executor-spec.

## Checklist obbligatoria prima dell'invio

1. **Problema + vincoli — mai la forma della risposta.** Vietato prescrivere
   deliverable ("dammi N item in questa struttura"), tassonomie, liste di
   media prefissate, salvo richiesta esplicita del Director.
2. **Sezione aperta**: «cosa non stiamo vedendo? nomina opzioni non elencate»
   — una domanda irrispondibile dentro il nostro frame.
3. **Ask avversariale**: «quali premesse/vincoli andrebbero messi in
   discussione e cosa costa romperli?» — i provider attaccano, non riempiono.
4. **Surprising-over-safe**: ogni risposta include ≥1 idea a bassa
   probabilità / alto upside.
5. **Routing**: ricerca rapida → broadcast con prompt aperto; decisione
   contesa → `mw-web-debate` (proposta → critica → convergenza).
6. **Sintesi a tre fasce**: convergenze (segnale) / divergenze (opzioni per
   ruling Director) / voci solitarie (blind spot condiviso possibile).
7. **Self-check**: «ho codificato la risposta dentro la domanda?» → se sì,
   riscrivere.
8. **Expand first (Director, 2026-10-24)**: quando il Director pone una
   domanda aperta, prima di rispondere verificare se esiste una
   formulazione più ricca — offrire la versione espansa + lo spazio
   multi-AI, non rispondere dentro il frame minimale.

## Origine

Broadcast composition-archetypes (2026-10-24): prompt scopato a tassonomia →
4 provider hanno consegnato tassonomie e nessuna idea fuori frame. Il reveal
narrativa (sagome che si alzano al creep) è venuto dal Director guardando il
sistema, non dalla ricerca. Protocollo scritto per non ripeterlo.

## Stessa trappola, superficie interna (ricerca propria)

Il protocollo si applica anche quando la ricerca la faccio IO (codice, docs,
web, immagini) — lì la codifica avviene nella domanda, non nel prompt:

1. **Ricerca = domande da rispondere, non informazioni da raccogliere.**
   Scrivere prima le domande ("la fiction regge questa scena?") — non la
   lista di file da leggere.
2. **Cercare anche lo spazio negativo**: cosa NON c'è che dovrebbe esserci?
   Cosa c'è che nessuno si aspetta? (i campanelli erano *introdotti*, non
   *mancanti* — una grep per "cosa dice il testo" non li avrebbe trovati.)
3. **Ipotesi da falsare, non fatti da confermare**: prima di concludere,
   "cosa troverei se avessi torto?" e andarlo a cercare.
4. **Routing interno**: esplorazione aperta → `code_search`/explore
   subagent (domande, non keyword); lookup puntuale → grep/read.
5. **Self-check**: «ho già deciso cosa troverò?» — se sì, aggiungere una
   ricerca che cerchi la smentita.
6. **Bucket esterni > bucket propri**: quando esiste una classificazione
   authored (del Director, del manoscritto, del contratto), si parte da
   quella — mai ricostruire categorie da zero e darle per scontate.
