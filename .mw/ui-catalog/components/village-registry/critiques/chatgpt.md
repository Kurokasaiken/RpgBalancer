# chatgpt — village-registry (T-002 refill, image-grounded)

Run `20261025-critique-village-registry-r2`, turn T-002 (critique-refill dopo
reset quota serale). Prompt verbatim R-282, 3 shot allegati (default-ctx-a,
default-iso-0, default-iso-1), `image_attached: 3`, POSTED ~20:56 CET →
collect SUCCESS (~35.4k chars), conversazione
`https://chatgpt.com/c/6ade5eff-f6d4-83eb-94f2-9dd231a58bdd`.

La run originale `20261025-critique-village-registry` era poisoned (binding
`local-chatgpt:` mai persistito → CONVERSATION_MISMATCH a T-001, poi
ATTACH_FAILED a T-002 per quota immagini esaurita): il refill gira su run
`-r2` con binding fresco.

Nota grounding: il testo cita fatti osservabili solo dagli shot — filtri
All/Built/Buildable/Locked, categorie Production/Civic/Defense, edifici
Warehouse/Inn/Infirmary, flavor "Keeps the village's stock under lock and
key" — quindi image-grounded, utilizzabile per digest e visual fork.

La quota free-tier si è richiusa subito dopo questo turno (ATTACH_FAILED sui
componenti successivi): questa è l'unica raccolta chatgpt grounded del
secondo pass serale.

---

## Risposta T-002 (verbatim)

ChatGPT ha detto:
Critica AAA — Settlement Registry

Verdetto: direzione artistica promettente, gerarchia funzionale debole, leggibilità sacrificata per l'atmosfera.

Il componente ha una buona identità visiva: ottone brunito, placche metalliche, fondo blu-nero, icone fantasy e tipografia serif evocano un registro amministrativo di un villaggio medievale. È coerente con un gestionale fantasy e sembra appartenere a un mondo di gioco, anziché a un'applicazione web travestita da gioco.

Ma un lead UI non deve giudicare soltanto quanto sia bella una schermata statica. Deve chiedersi quanto rapidamente il giocatore capisca cosa possiede, cosa può costruire, cosa è bloccato e quale azione conviene compiere.

Il problema principale è questo: il registro presenta gli edifici come un catalogo illustrato, quando dovrebbe funzionare come uno strumento decisionale.

Nello screenshot si distinguono:

Le categorie Production, Civic e Defense, con i rispettivi contatori.
Edifici costruiti, costruibili e bloccati.
Nome e descrizione di ciascun edificio.
Indicatori di livello, stato e interazione.
Filtri All, Built, Buildable e Locked.

Queste informazioni sono pertinenti. Il problema è che competono visivamente senza una gerarchia abbastanza netta.

La buona notizia è che non serve rifare tutta l'interfaccia né abbandonare lo stile fantasy. Interverrei prima su semantica, gerarchia, densità informativa e comportamento degli stati. Solo dopo rifinirei materiali, bordi e ornamenti.

1. Ricerca: principi applicabili al componente

Ho consultato documentazione ufficiale e linee guida di design e accessibilità. Queste sono le fonti più pertinenti alla schermata.

Fonte	Principio rilevante	Implicazione per il registro
Xbox Accessibility Guidelines — Contrast	Il contrasto deve rendere leggibili testi e indicatori di gameplay.	Oro, grigio e ciano devono comunicare informazioni distinguibili anche a bassa luminosità.
Xbox Accessibility Guidelines — UI Context	I giocatori devono capire la funzione dei controlli e le conseguenze delle interazioni.	Un simbolo non può essere considerato autoesplicativo soltanto perché è coerente con il tema fantasy.
Apple — Designing for Games	Testo leggibile, controlli utilizzabili e layout adattabile.	La dimensione dei caratteri e la capacità di adattamento devono essere verificate su più risoluzioni.
Nielsen Norman Group — Icon Usability	Le icone ambigue necessitano di etichette visibili.	Gli indicatori secondari non dovrebbero costringere il giocatore a indovinare il loro significato.
Roblox Creator Hub — UI/UX Design	Dimensione, colore, spazio e prossimità determinano la gerarchia visiva.	La gerarchia deve derivare dalla funzione degli elementi, non dalla quantità di decorazioni.

Un chiarimento importante: queste linee guida non certificano che il componente sia accessibile o inaccessibile. Per stabilirlo servirebbero misurazioni del contrasto, dimensioni effettive dei caratteri, verifiche a diverse risoluzioni e prove d'interazione. Qui distinguo quindi i difetti visibili dalle ipotesi da verificare.

2. Critica spietata: cosa non funziona
P0 — Problemi che correggerei prima di qualsiasi rifinitura
2.1. Gli stati degli edifici non sono abbastanza leggibili

Gravità: critica per la comprensione, da verificare con test di usabilità.

Prendiamo le sei righe visibili:

Warehouse — livello II.
Inn — simbolo +.
Smithy — simbolo +.
Market — livello I.
Infirmary — lucchetto.
Palisade — livello II.

Il giocatore deve dedurre rapidamente quali edifici possiede, quali può costruire e quali non sono ancora disponibili.

Il componente dispone di indizi, ma distribuisce la semantica fra numeri romani, cerchi con simboli, lucchetti, icone ciano e legenda esterna.

Il risultato è un piccolo puzzle interpretativo ripetuto su ogni riga.

Un registro gestionale non dovrebbe chiedere al giocatore di decifrare continuamente il suo linguaggio visivo.

La soluzione: definire tre stati primari, ciascuno con un trattamento consistente.

Stato	Segnale primario	Segnale secondario
Costruito	Livello e indicatore visivo dedicato	Azione per aprire i dettagli
Costruibile	Azione esplicita «Costruisci»	Costo e prerequisiti
Bloccato	«Bloccato» o requisito mancante	Condizione necessaria per sbloccarlo

Il colore può rafforzare il significato, ma non dovrebbe essere l'unico mezzo per comunicarlo.

Il lucchetto, da solo, comunica un'indisponibilità generica. Non dice se mancano risorse, reputazione, progressione o prerequisiti.

E il simbolo + è troppo generico: può significare aggiungere, aumentare, espandere o costruire.

Verdetto: mantenere le icone attuali come elementi secondari, ma rendere lo stato immediatamente leggibile attraverso testo e azione.

2.2. Il pannello è troppo dipendente dai dettagli ornamentali

Gravità: alta.

La cornice esterna, i bordi dorati, gli angoli decorativi, le superfici metalliche, i gradienti e i contorni interni sono tutti coerenti con la direzione artistica.

Il problema è la loro somma.

Quasi ogni elemento ha un trattamento visivo: il contenitore, le schede dei filtri, le intestazioni delle categorie, le righe degli edifici, le icone e gli indicatori.

Di conseguenza, manca un contrasto netto fra:

Struttura del pannello.
Contenuto informativo.
Controlli interattivi.
Elementi puramente decorativi.

Il bordo dorato è prezioso dal punto di vista stilistico, ma perde parte del suo valore quando viene utilizzato ovunque.

Intervento consigliato:

Conservare la cornice esterna come firma visiva.
Mantenere l'ottone sugli elementi selezionati e sulle azioni importanti.
Ridurre i bordi completi delle righe a separatori sottili o superfici meno contrastate.
Riservare i trattamenti metallici più evidenti alle intestazioni e alle interazioni attive.

Non renderei l'interfaccia minimalista. La renderei più selettiva nell'uso dell'enfasi.

2.3. La tipografia è suggestiva, ma troppo piccola per la quantità di informazione

Gravità: alta.

La gerarchia tipografica esiste: i nomi degli edifici sono in maiuscolo e oro, mentre le descrizioni sono più piccole e desaturate.

Il problema è che il corpo descrittivo appare molto minuto, soprattutto nella schermata completa a 1440 × 900.

La descrizione di Warehouse, per esempio, è utile per capire la funzione dell'edificio, ma non ha una leggibilità proporzionata alla sua importanza.

Il contrasto fra testo e sfondo potrebbe inoltre risultare insufficiente per alcuni utenti. Lo screenshot, da solo, non permette di certificare il rapporto di contrasto: va misurato sui colori effettivi.

La documentazione Microsoft raccomanda un contrasto di almeno 4,5:1 per il testo standard che trasmette informazioni importanti. Le dimensioni minime dipendono dalla piattaforma e dalla risoluzione. 
Microsoft Learn
+1

Cosa farei:

Nome dell'edificio: 13–15 px CSS, con peso medio o semibold.
Descrizione: 12–13 px CSS come punto di partenza per un'interfaccia desktop.
Intestazione del pannello: 13–15 px CSS.
Testi dei filtri: almeno 12–13 px CSS.
Spaziatura verticale sufficiente a evitare che testo e icone si comprimano.

Questi valori sono proposte iniziali, non soglie universali. Devono essere verificati nel gioco alla scala effettivamente utilizzata, con le impostazioni di scaling e le risoluzioni supportate.

Non aumenterei indiscriminatamente tutto: prima migliorerei il contrasto e ridurrei il rumore decorativo, poi assegnerei più spazio ai testi che guidano una decisione.

2.4. I filtri non spiegano il vantaggio pratico della selezione

Gravità: medio-alta.

I quattro filtri sono:

ALL | BUILT | BUILDABLE | LOCKED

La distinzione è comprensibile, ma il pannello mostra anche categorie con contatori, quindi esistono già due sistemi per orientarsi nell'elenco.

Manca una risposta immediata a una domanda molto concreta:

Se voglio costruire qualcosa adesso, dove devo guardare?

Il filtro Buildable è la risposta, ma non riceve particolare enfasi. Tutti i filtri hanno un trattamento simile e quello selezionato è distinguibile soprattutto dal bordo dorato.

Proporrei due modifiche:

Rendere lo stato selezionato più evidente, usando una superficie piena e un indicatore di selezione coerente con il tema.
Quando il giocatore seleziona Buildable, mostrare subito costo e azione di costruzione per ciascun edificio disponibile.

Non aggiungerei necessariamente un altro pulsante. Renderei più efficace quello esistente.

2.5. I simboli ciano sulla destra sono un linguaggio visivo incompleto

Gravità: alta se rappresentano azioni; media se sono semplici indicatori.

Nelle righe compaiono icone ciano, fra cui una casa e un simbolo geometrico che sembra un rombo o un indicatore direzionale. Nelle righe bloccate il trattamento è diverso.

Non posso dedurre con certezza il significato funzionale di tutti questi simboli dalla schermata.

Ed è proprio questo il punto: il loro significato deve essere verificabile nel sistema, non indovinato da chi osserva la UI.

Se la casa indica la posizione sulla mappa, deve esserci un comportamento coerente e un feedback quando la si attiva. Se il rombo indica accesso ai dettagli, non dovrebbe sembrare un secondo pulsante privo di etichetta.

Regola proposta: ogni icona interattiva deve avere una funzione univoca, uno stato di focus e una spiegazione accessibile. Se l'azione è secondaria, può essere esposta al passaggio del mouse e al focus da tastiera, ma non deve essere l'unico modo per capire un'azione importante.

P1 — Problemi di struttura e comportamento
2.6. Le categorie sembrano intestazioni, ma si comportano da controlli

Le righe Production, Civic e Defense hanno un'icona, un titolo, un contatore e una freccia di espansione.

Sono elementi funzionali corretti. Tuttavia, il loro trattamento metallico è molto vicino a quello delle schede degli edifici.

Il giocatore deve distinguere due livelli di navigazione:

La categoria, che raggruppa o nasconde contenuti.
L'edificio, che rappresenta un oggetto gestibile.

Suggerisco di differenziarli attraverso la superficie, non necessariamente attraverso il colore.

Per esempio:

Categorie: superficie scura, altezza ridotta, testo più compatto.
Edifici: superficie distinta, nome prominente e stato leggibile.
Selezione: bordo o fascia dedicata, senza aggiungere un'altra cornice completa.

Il contatore 3/3 è utile, ma il significato va stabilito nel design system: rappresenta gli edifici costruiti su quelli disponibili, oppure un limite diverso? Se indica il numero costruito rispetto al totale, va mantenuto coerente per ogni categoria.

2.7. La riga dell'edificio è un contenitore di troppe cose

Prendiamo Warehouse.

La riga contiene:

Icona dell'edificio.
Indicatore di livello.
Nome.
Descrizione.
Icone sulla destra.
Possibili affordance di navigazione o apertura.

Sono almeno sei elementi visivi in uno spazio relativamente ristretto.

Il problema non è il numero assoluto di elementi. È che non esiste una separazione sufficientemente forte fra identità, stato e azioni.

La riorganizzazione che suggerisco è questa:

Colonna sinistra — Identità

Icona dell'edificio.
Nome.
Descrizione.

Centro o fascia secondaria — Stato

Livello oppure stato di costruzione.
Costo o requisito, quando rilevante.

Colonna destra — Azione primaria

«Dettagli» per gli edifici costruiti.
«Costruisci» per quelli costruibili.
«Requisiti» per quelli bloccati.

In questo modo la riga non è soltanto un elemento da selezionare: comunica quale azione è possibile.

2.8. La legenda inferiore è troppo lontana dalle decisioni

La legenda in basso alla mappa spiega Production, Civic, Defense, level built, can be built e locked.

È una soluzione utile per introdurre il linguaggio visivo, ma ha due limiti.

Primo: è separata dal pannello in cui si trovano gli edifici.

Secondo: la sua dimensione ridotta la rende facile da ignorare.

Non eliminerei necessariamente la legenda. La renderei però secondaria rispetto alle informazioni presenti direttamente nelle righe.

Se il giocatore deve consultare la legenda per capire se può costruire un edificio, il componente sta delegando al giocatore un lavoro che dovrebbe svolgere la UI.

2.9. Il registro deve funzionare anche quando il contenuto cresce

Nello screenshot sono visibili sei edifici, ma i contatori indicano una struttura più ampia.

Non è possibile stabilire dalla sola immagine come si comporti il pannello quando tutte le categorie sono espanse, quando aumentano gli edifici o quando le descrizioni diventano più lunghe.

Questi sono i casi che testerei:

Tutte le categorie aperte.
Elenco molto più lungo di quello mostrato.
Filtro Locked con requisiti testuali estesi.
Localizzazione italiana e inglese, includendo stringhe più lunghe.
Testo ingrandito.
Risoluzioni e rapporti d'aspetto differenti.

La soluzione non è comprimere progressivamente le righe per far entrare più contenuti. Il pannello deve avere un'area di scorrimento interna e mantenere leggibili gli elementi essenziali.

Le linee guida Apple per i giochi raccomandano di adattare il layout a schermi e rapporti d'aspetto differenti, invece di affidarsi a geometrie rigide. 
Apple Developer

3. La soluzione che proporrei: un registro che aiuta a decidere

Non ridisegnerei il pannello come un inventario generico da RPG. La sua identità dovrebbe rimanere quella di un registro di insediamento: ordinato, materico, amministrativo, ma immediatamente leggibile.

Il cambiamento fondamentale è passare da una lista di oggetti a una lista di oggetti con uno stato e un'azione esplicita.

3.1. Nuova gerarchia del pannello

La struttura sarebbe questa:

Testo normale
┌─────────────────────────────────────────────┐
│ REGISTRO DEL VILLAGGIO              [Chiudi]│
│                                             │
│ [Tutti] [Costruiti] [Costruibili] [Bloccati]│
│                                             │
│ Cerca un edificio...                        │
│                                             │
│ PRODUCTION                            3/3  ▾│
│ ┌─────────────────────────────────────────┐ │
│ │ [icona] WAREHOUSE          LIVELLO II   │ │
│ │         Protegge le scorte del villaggio│ │
│ │         [Dettagli]                  [›] │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ CIVIC                                 2/5  ▾│
│ ┌─────────────────────────────────────────┐ │
│ │ [icona] INN                 COSTRUIBILE │ │
│ │         Letti caldi per nuovi abitanti. │ │
│ │         Costo: 20 legno    [Costruisci] │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ DEFENSE                               1/3  ▾│
│ ...                                         │
└─────────────────────────────────────────────┘

È uno schema concettuale, non una proposta di pixel-perfect layout.

Cosa cambierei esattamente

A. Titolo

Manterrei il titolo serif e l'ottone. È una buona firma visiva.

Aggiungerei un po' più di spazio fra il titolo e i filtri, evitando di aumentare ulteriormente il numero di decorazioni.

B. Filtri

Li trasformerei in un gruppo di selezione chiaramente riconoscibile.

Il filtro attivo avrebbe:

Fondo più chiaro.
Bordo in ottone.
Testo con contrasto elevato.
Stato selezionato accessibile anche alle tecnologie assistive.

Non userei soltanto il bordo per distinguere il filtro attivo.

C. Edifici

Ogni riga avrebbe una struttura stabile, con nome, descrizione, stato e azione.

Lo stato non dovrebbe modificare radicalmente il layout della riga: passare da costruibile a costruito non deve spostare tutti gli elementi.

D. Azioni

Userei una sola azione primaria per stato.

Stato	Azione principale	Informazioni secondarie
Costruito	Dettagli	Livello, eventuali potenziamenti
Costruibile	Costruisci	Costo e requisiti
Bloccato	Requisiti	Condizione per lo sblocco

Se la costruzione non è disponibile perché mancano risorse, il sistema dovrebbe distinguere questa situazione da un edificio bloccato per progressione.

E. Categorie

Conserverei le tre categorie e i contatori. Renderei le intestazioni più sobrie, in modo che siano gli edifici a catturare l'attenzione.

F. Scorrimento

Il titolo e i filtri dovrebbero rimanere visibili mentre scorre la lista. Le categorie devono potersi espandere e comprimere senza compromettere la posizione del contenuto o creare salti visivi.

4. Codice React + TypeScript

Di seguito una possibile implementazione di riferimento. È codice d'esempio per illustrare la struttura e le regole visive: non è una patch verificata sul tuo repository, perché non ho il codice sorgente del componente.

L'esempio separa quattro responsabilità:

Stato dell'edificio.
Contenuto informativo.
Azione primaria.
Filtraggio.
4.1. Definire gli stati nel modello dati

Il primo miglioramento deve avvenire nel modello, non nel CSS.

TypeScript
type BuildingStatus = "built" | "buildable" | "locked";

type Building = {
  id: string;
  name: string;
  description: string;
  category: "production" | "civic" | "defense";

  status: BuildingStatus;

  level?: number;

  cost?: {
    wood?: number;
    gold?: number;
  };

  requirements?: string[];
};

const exampleBuildings: Building[] = [
  {
    id: "warehouse",
    name: "Warehouse",
    description: "Keeps the village's stock under lock and key.",
    category: "production",
    status: "built",
    level: 2,
  },
  {
    id: "inn",
    name: "Inn",
    description: "Warm beds and a hearth that draw in new folk.",
    category: "civic",
    status: "buildable",
    cost: {
      wood: 20,
      gold: 10,
    },
  },
  {
    id: "infirmary",
    name: "Infirmary",
    description: "Herbs and quiet beds for the wounded.",
    category: "civic",
    status: "locked",
    requirements: ["Reach Village Reputation 3"],
  },
];

Il punto importante è che status è un dato esplicito.

Non ricaverei lo stato dal colore di un'icona, dalla presenza di un livello o dalla disponibilità di un pulsante. La UI deve riflettere lo stato del dominio, non usarlo come sostituto del dominio.

Nel progetto reale, inoltre, costi, requisiti e disponibilità dovrebbero provenire dalle definizioni canoniche degli edifici, non essere duplicati nel componente.

4.2. Un componente BuildingRow con un'azione esplicita
TypeScript
import type { ReactNode } from "react";

type BuildingRowProps = {
  building: Building;
  action?: ReactNode;
  onOpenDetails: (id: string) => void;
  onBuild: (id: string) => void;
  onOpenRequirements: (id: string) => void;
};

const statusLabels: Record<BuildingStatus, string> = {
  built: "Costruito",
  buildable: "Costruibile",
  locked: "Bloccato",
};

function BuildingRow({
  building,
  action,
  onOpenDetails,
  onBuild,
  onOpenRequirements,
}: BuildingRowProps) {
  const { id, name, description, status, level, requirements } =
    building;

  const handlePrimaryAction = () => {
    switch (status) {
      case "built":
        onOpenDetails(id);
        break;

      case "buildable":
        onBuild(id);
        break;

      case "locked":
        onOpenRequirements(id);
        break;
    }
  };

  const actionLabels: Record<BuildingStatus, string> = {
    built: "Dettagli",
    buildable: "Costruisci",
    locked: "Requisiti",
  };

  return (
    <article
      className={`building-row building-row--${status}`}
      data-building-id={id}
    >
      <div className="building-row__identity">
        <div className="building-row__name-line">
          <h3 className="building-row__name">{name}</h3>

          <span
            className={`building-row__status building-row__status--${status}`}
          >
            {statusLabels[status]}
          </span>
        </div>

        <p className="building-row__description">
          {description}
        </p>

        {status === "built" && level !== undefined && (
          <p className="building-row__metadata">
            Livello {level}
          </p>
        )}

        {status === "locked" && requirements?.length ? (
          <p className="building-row__metadata">
            Richiede: {requirements.join(", ")}
          </p>
        ) : null}
      </div>

      <div className="building-row__actions">
        {action}

        <button
          type="button"
          className="building-row__primary"
          onClick={handlePrimaryAction}
          aria-label={`${actionLabels[status]}: ${name}`}
        >
          {actionLabels[status]}
        </button>
      </div>
    </article>
  );
}
Perché questa struttura è migliore

Lo stato è leggibile anche senza colore. Un edificio bloccato non è semplicemente grigio: è esplicitamente identificato come bloccato.

L'azione primaria è prevedibile. Il giocatore non deve interpretare un simbolo diverso per ogni stato.

I dati secondari sono contestuali. Il livello appare per un edificio costruito; i requisiti compaiono per uno bloccato.

Il layout può rimanere coerente. La descrizione e l'area delle azioni occupano posizioni stabili.

Una nota implementativa: l'eventuale proprietà action permette di inserire controlli secondari, ma la versione definitiva dovrebbe definire chiaramente quali azioni siano consentite per ogni stato. Non consentirei a chiamanti arbitrari di inserire pulsanti incompatibili con il dominio.

4.3. CSS: preservare l'identità fantasy senza sovraccaricare ogni riga

Questo è il trattamento che proverei come prima iterazione.

CSS
:root {
  --registry-bg: #08151b;
  --registry-surface: #0c2028;
  --registry-surface-hover: #122d36;

  --registry-brass: #c9a653;
  --registry-brass-muted: #806c3e;

  --registry-text: #e7dfc9;
  --registry-text-secondary: #c1c5c0;

  --registry-built: #e0c477;
  --registry-buildable: #77dce5;
  --registry-locked: #c1c5c0;

  --registry-radius: 9px;
  --registry-row-gap: 6px;
}

.building-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;

  min-width: 0;
  padding: 11px 12px;

  background: var(--registry-surface);
  border: 1px solid var(--registry-brass-muted);
  border-radius: var(--registry-radius);

  transition:
    background-color 140ms ease,
    border-color 140ms ease;
}

.building-row:hover {
  background: var(--registry-surface-hover);
}

.building-row:focus-within {
  outline: 2px solid var(--registry-buildable);
  outline-offset: 2px;
}

.building-row__identity {
  min-width: 0;
}

.building-row__name-line {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 6px 10px;
}

.building-row__name {
  margin: 0;
  color: var(--registry-text);
  font-size: 14px;
  font-weight: 650;
  line-height: 1.35;
  letter-spacing: 0.025em;
}

.building-row__description {
  margin: 4px 0 0;
  color: var(--registry-text-secondary);
  font-size: 12px;
  line-height: 1.5;
}

.building-row__metadata {
  margin: 5px 0 0;
  color: var(--registry-text);
  font-size: 12px;
  line-height: 1.4;
}

.building-row__status {
  font-size: 11px;
  font-weight: 650;
  line-height: 1.4;
}

.building-row__status--built {
  color: var(--registry-built);
}

.building-row__status--buildable {
  color: var(--registry-buildable);
}

.building-row__status--locked {
  color: var(--registry-locked);
}

.building-row__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.building-row__primary {
  min-height: 34px;
  padding: 7px 10px;

  color: var(--registry-text);
  background: transparent;

  border: 1px solid var(--registry-brass-muted);
  border-radius: 5px;

  font: inherit;
  font-size: 12px;
  font-weight: 600;

  cursor: pointer;
}

.building-row__primary:hover {
  background: var(--registry-surface-hover);
  border-color: var(--registry-brass);
}

.building-row__primary:focus-visible {
  outline: 2px solid var(--registry-buildable);
  outline-offset: 3px;
}

@media (prefers-reduced-motion: reduce) {
  .building-row {
    transition: none;
  }
}

I valori cromatici sono punti di partenza coerenti con la schermata, non una palette già validata. Prima di adottarli misurerei il contrasto di ogni combinazione effettiva, inclusi i testi secondari e gli stati inattivi.

Una decisione importante sul colore

Non trasformerei ogni edificio costruibile in un grande elemento ciano acceso.

Il ciano dovrebbe identificare una categoria semantica coerente, per esempio l'interattività o lo stato costruibile, senza competere con l'ottone che identifica il linguaggio materiale del mondo.

La regola sarebbe:

Ottone: struttura, identità fantasy, selezione e dettagli di pregio.
Ciano: azioni interattive o stato costruibile, secondo una convenzione unica.
Neutri chiari: testo e informazioni secondarie.
Grigio desaturato: stato bloccato, senza sacrificare la leggibilità.

Le stesse convenzioni dovrebbero valere in tutto il gioco, non soltanto nel registro.

5. Filtri migliori senza trasformare il pannello in un gestionale web

Il registro ha già i quattro filtri necessari. Non aggiungerei una seconda barra di navigazione, menu contestuali superflui o un sistema di ordinamento complesso prima di avere evidenza che servano.

Implementerei invece una selezione accessibile, con un'indicazione esplicita del filtro attivo.

TypeScript
type BuildingFilter =
  | "all"
  | "built"
  | "buildable"
  | "locked";

const filters: {
  id: BuildingFilter;
  label: string;
}[] = [
  { id: "all", label: "Tutti" },
  { id: "built", label: "Costruiti" },
  { id: "buildable", label: "Costruibili" },
  { id: "locked", label: "Bloccati" },
];

function BuildingFilters({
  value,
  onChange,
}: {
  value: BuildingFilter;
  onChange: (filter: BuildingFilter) => void;
}) {
  return (
    <div
      className="building-filters"
      role="group"
      aria-label="Filtra gli edifici"
    >
      {filters.map((filter) => (
        <button
          key={filter.id}
          type="button"
          className="building-filters__button"
          aria-pressed={value === filter.id}
          onClick={() => onChange(filter.id)}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
CSS
.building-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.building-filters__button {
  min-height: 34px;
  padding: 7px 11px;

  color: var(--registry-text-secondary);
  background: var(--registry-bg);

  border: 1px solid var(--registry-brass-muted);
  border-radius: 6px;

  font: inherit;
  font-size: 12px;
  font-weight: 600;

  cursor: pointer;
}

.building-filters__button[aria-pressed="true"] {
  color: var(--registry-text);
  background: var(--registry-surface-hover);
  border-color: var(--registry-brass);
  box-shadow: inset 0 -2px 0 var(--registry-brass);
}

.building-filters__button:focus-visible {
  outline: 2px solid var(--registry-buildable);
  outline-offset: 3px;
}

Il gruppo usa pulsanti nativi e aria-pressed per comunicare la selezione. Se la UI implementa invece un vero sistema di tab con pannelli associati, adotterei il pattern accessibile specifico per le tab: non mescolerei i due modelli.

La logica di filtraggio rimarrebbe separata dal rendering:

TypeScript
function filterBuildings(
  buildings: Building[],
  filter: BuildingFilter,
): Building[] {
  if (filter === "all") {
    return buildings;
  }

  return buildings.filter(
    (building) => building.status === filter,
  );
}

Attenzione: questo esempio filtra correttamente gli edifici per stato, ma non implementa ancora ricerca testuale, conteggi dinamici o la gestione delle categorie vuote. Questi aspetti andrebbero collegati alla struttura effettiva del registro.

6. Tre interventi che farei sulla grafica originale

Non mi fermerei al codice. Il problema principale è il rapporto tra contenuto e decorazione, quindi intervenirei direttamente sulla composizione.

Intervento A — Ridurre il rumore senza perdere il carattere

Mantieni:

La cornice esterna in ottone.
Il titolo serif.
Le superfici blu-nero.
Le icone fantasy degli edifici.
La sensazione di placca metallica.

Modifica:

Riduci la quantità di bordi completi dentro il pannello.
Rendi le categorie visivamente più compatte.
Riserva l'oro più luminoso agli elementi selezionati.
Riduci la competizione fra gradienti, bordi e testo.
Differenzia chiaramente l'hover dalla selezione persistente.

L'obiettivo non è rendere tutto piatto. È fare in modo che l'attenzione cada prima sull'informazione utile e poi sui dettagli estetici.

Intervento B — Trasformare ogni riga in una decisione

La riga ideale non deve necessariamente essere più grande.

Deve rispondere rapidamente a tre domande:

Che edificio è?
In che stato si trova?
Cosa posso fare adesso?

Per Warehouse, per esempio:

Testo normale
WAREHOUSE                  LIVELLO II
Keeps the village's stock under lock and key.

[ Dettagli ]

Per Inn:

Testo normale
INN                        COSTRUIBILE
Warm beds and a hearth that draw in new folk.

Costo: 20 legno · 10 oro
[ Costruisci ]

Per Infirmary:

Testo normale
INFIRMARY                  BLOCCATO
Herbs and quiet beds for the wounded.

Richiede: reputazione del villaggio 3
[ Requisiti ]

I testi sono illustrativi: i costi e i requisiti dovranno essere quelli effettivamente definiti dal gioco.

Non mostrerei contemporaneamente tutte le informazioni possibili. Ogni riga dovrebbe esporre ciò che serve per la decisione corrente, lasciando gli approfondimenti alla vista dettagliata.

Intervento C — Gestire lo spazio come una risorsa

La schermata originale lascia vedere una parte della mappa dietro il registro, il che è coerente con un gioco in cui il mondo deve rimanere presente.

Non allargherei automaticamente il pannello fino a occupare tutto lo schermo.

Proverei invece:

Una larghezza fluida con un limite massimo.
Un'altezza vincolata all'area disponibile.
Titolo e filtri fissi.
Lista con scorrimento indipendente.
Riduzione degli spazi ornamentali prima di ridurre il testo.
Adattamento alle finestre più strette.

Esempio:

CSS
.settlement-registry {
  --registry-padding: 10px;

  position: fixed;
  top: 21vh;
  right: 10px;

  width: min(400px, calc(100vw - 20px));
  max-height: min(560px, 72vh);

  display: flex;
  flex-direction: column;
  min-width: 0;

  padding: var(--registry-padding);

  background: var(--registry-bg);
  border: 2px solid var(--registry-brass-muted);
  border-radius: 15px;

  color: var(--registry-text);
}

.settlement-registry__header {
  flex: 0 0 auto;
}

.settlement-registry__filters {
  flex: 0 0 auto;
  margin-top: 10px;
}

.settlement-registry__list {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;

  display: flex;
  flex-direction: column;
  gap: var(--registry-row-gap);

  padding: 8px 2px 2px;
  overscroll-behavior: contain;
}

@media (max-width: 560px) {
  .settlement-registry {
    top: auto;
    right: 8px;
    bottom: 8px;
    left: 8px;

    width: auto;
    max-height: 75vh;
  }
}

Questo è soltanto uno scheletro di layout. La posizione definitiva dovrebbe rispettare il sistema di pannelli del gioco, le aree sicure e le altre finestre HUD. In particolare, eviterei di introdurre un secondo sistema di posizionamento se il progetto dispone già di un gestore condiviso dei pannelli.

7. Come verificherei che il redesign sia davvero migliore

Qui farei attenzione a non confondere una schermata più bella con una UI migliore.

Test di accettazione
ID	Verifica	Criterio di accettazione
REG-01	Riconoscimento dello stato	Il giocatore distingue costruito, costruibile e bloccato senza consultare la legenda.
REG-02	Azione primaria	Per ogni stato è presente un'azione coerente e comprensibile.
REG-03	Risorse insufficienti	Un edificio costruibile ma non acquistabile per mancanza di risorse non viene confuso con uno bloccato.
REG-04	Filtri	Il filtro attivo è distinguibile senza affidarsi esclusivamente al colore.
REG-05	Categorie	Contatori e contenuti corrispondono allo stato reale degli edifici.
REG-06	Scorrimento	Con tutte le categorie espanse, titolo e filtri restano accessibili e la lista scorre correttamente.
REG-07	Tastiera	Ogni azione è raggiungibile con la tastiera e presenta un focus visibile.
REG-08	Leggibilità	I testi informativi rispettano gli obiettivi di contrasto e dimensione scelti per le piattaforme supportate.
REG-09	Localizzazione	Testi più lunghi non provocano sovrapposizioni, troncamenti critici o perdita delle azioni.
REG-10	Stati vuoti	Un filtro senza risultati comunica chiaramente che non ci sono edifici corrispondenti.

Per REG-01, farei anche un piccolo test con giocatori che non conoscono il componente: mostrerei la schermata senza spiegazioni e chiederei loro di indicare un edificio già costruito, uno costruibile e uno bloccato.

Per REG-02, chiederei di costruire un edificio disponibile e di scoprire perché un altro non è ancora accessibile.

Non fisserei percentuali di successo arbitrarie senza una baseline. Registrerei errori, esitazioni e richieste di chiarimento nella versione attuale, quindi confronterei i risultati con la versione modificata.

Per REG-08, misurerei il contrasto reale dei testi, non soltanto quello dei colori nominali nel CSS. Le linee guida Xbox sono un riferimento utile per definire i requisiti di accessibilità e le relative verifiche. 
Microsoft Learn

8. Ordine di implementazione: cosa farei davvero

Non affiderei a un agente di coding una richiesta vaga come «migliora la UI del Settlement Registry». È troppo facile ottenere una modifica estetica che lascia intatti i problemi funzionali.

Procederei in questo ordine:

Fase 1 — Semantica e comportamento
Verificare la fonte canonica degli stati degli edifici.
Documentare il significato delle icone a destra.
Definire le azioni per ogni stato.
Distinguere indisponibilità per progressione e mancanza di risorse.
Verificare il funzionamento dei filtri e dei contatori.
Fase 2 — Gerarchia e leggibilità
Separare visivamente categorie e righe.
Rendere gli stati comprensibili senza dipendere dal colore.
Aumentare la leggibilità delle descrizioni.
Ridurre i bordi ornamentali secondari.
Uniformare il trattamento delle azioni.
Fase 3 — Layout e accessibilità
Verificare lo scorrimento interno.
Testare finestre e risoluzioni differenti.
Verificare tastiera e focus.
Misurare il contrasto.
Provare testi più lunghi e dimensioni del testo aumentate.
Fase 4 — Rifinitura artistica

Soltanto dopo aver superato le verifiche precedenti, rifinirei materiali, bordi, gradienti e transizioni.

In questo modo la direzione artistica non viene sacrificata: viene applicata a una struttura già solida.

Verdetto finale

Il Settlement Registry ha una buona base artistica, ma oggi investe troppe risorse visive nel far sembrare importante ogni elemento e troppo poche nel distinguere ciò che il giocatore deve capire immediatamente.

Non cambierei il tema, non eliminerei le icone fantasy e non trasformerei il pannello in una tabella amministrativa.

Cambierei tre cose:

Stati espliciti: costruito, costruibile e bloccato devono essere comprensibili a colpo d'occhio.
Gerarchia più disciplinata: cornice e ornamenti definiscono il mondo; testo e azioni definiscono la decisione.
Azioni contestuali: ogni edificio deve comunicare cosa è possibile fare e, quando non è possibile, perché.

La priorità assoluta è la prima. Aumentare la leggibilità dei testi è importante, ma se il giocatore continua a confondere gli stati, avrai una UI più leggibile che comunica comunque male.

Il mio criterio AAA sarebbe semplice: prima deve essere facile gestire il villaggio; poi deve essere bello farlo. Il risultato migliore è quando le due cose coincidono.