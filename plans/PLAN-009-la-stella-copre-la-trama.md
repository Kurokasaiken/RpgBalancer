# PLAN-009 — La stella copre la trama

Desiderata: **v15 FROZEN** (`.mw/desiderata.md`)
Sostituisce `PLAN-009-una-materia-sola.md`, che era scritto sulla v14 e assumeva due cose
che la v15 cancella: il fitting della forma sull'area, e la fascia di goo col suo tetto.

Regola architetturale:

> **Due forme, entrambe date dai dati. La probabilità è la loro differenza.**
> La stella viene dalle cinque stat, la trama dalle cinque difficoltà, e
> `P(successo) = area(trama ∩ stella) / area(trama)` si **misura**. Non si adatta niente.

Il vincolo di materia è estetico e viene dal Director: **niente che richieda deformazione
continua di superficie**. Il catrame è fuori portata, la seta è l'idioma che sappiamo fare.

## T-000 — Baseline congelata

Registra i numeri del sistema attuale prima di toccarlo: `rOf(stat)`, `rCheckAt`, aree delle
regioni, probabilità derivate, punto d'atterraggio per ogni coppia (esito, zona), errore
radiale delle punte. Rieseguito a codice invariato deve produrre un file **bit-identico**:
è quella la verifica del gate.

Serve a una cosa: quando un numero cambierà, sapere **quale** modifica lo ha spostato.

## T-001 — Rendere visibile la difficoltà

`axisCheck` / `rCheckAt` esistono già e oggi sono un **muro invisibile**. Questa fase non
inventa geometria: la disegna. La materia è tessuta — ordito, trame, cedimento per gravità,
riflesso speculare, nodi — e sono idiomi già scritti e verificati.

Verifica: la sagoma disegnata coincide con `rCheckAt` angolo per angolo, entro il mezzo pixel.
Se per farla stare bene bisogna scalarla, si sono spostate tutte le probabilità.

## T-002 — La copertura, misurata

`P(successo) = area(trama ∩ stella) / area(trama)`, per integrazione radiale in forma chiusa
sulla griglia classificata. Nessuna bisezione, nessuna manopola: la percentuale è un
**output**.

Verifiche: la somma delle probabilità delle regioni fa 100 esatto; la parte di stella oltre
la trama non contribuisce (verifica diretta: crescere le punte oltre `rCheckAt` non muove la
percentuale); coerenza fra la copertura misurata e le bande del D100.

## T-003 — Lo scoperto è per asse

Lo scoperto deve comparire **dove la stat è corta**, sull'asse della skill che tradisce. È
il «più ricco» rispetto a una barra di copertura: non «manca qualcosa», ma *quale*.

Verifica: per ogni asse, `stat_i < difficoltà_i` ⟺ esiste scoperto nel settore di quell'asse.
Un'implicazione che salta in una delle due direzioni è un fallimento del gate.

## T-004 — Ferita e morte dentro entrambe

Punto 6 della v15: ferito+successo e morte+fallimento devono poter accadere. I due assi
ortogonali di `zones.ts` lo garantiscono già per costruzione; questa fase lo **verifica come
requisito**, non lo assume.

Verifica: tutte e 15 le coppie (regione × zona) hanno intersezione non vuota, oppure il caso
è dichiarato impossibile con la sua ragione geometrica. Le coppie vuote misurate in PLAN-008
(27 su 108) vanno riesaminate sotto il modello nuovo.

## T-005 — Catena di risoluzione invariata

A seed fisso, cambiando **solo** il disegno: i due D100, l'esito, la zona, il punto
d'atterraggio e l'endpoint della traiettoria devono restare identici. Se uno cambia, la
grafica ha contaminato la risoluzione.

## T-006 — La soglia del check che non si tira

Punto 8: se il successo è automatico non si tira. Questa fase implementa il **gate**, non un
tetto sulla forma: nessuna geometria viene compressa per fare spazio a un margine.

Aperto per decisione del Director: 100% o 95% («la cosa di XCOM»), o un disegno specifico
per il 95%. Fino alla decisione, il gate è a copertura totale.

## T-007 — Sweep e failure automatici

Sweep su stat, difficoltà, copertura, aree, distanza delle punte. Oltre all'errore, la
**monotonia**: più stat ⇒ non meno copertura.

Fallimento automatico se: una punta non è a `rOf(stat)`; `rCheckAt` cambia; la copertura
misurata diverge dalle bande; un atterraggio cambia; compare un anello o una fascia continua
non prevista; la parte di stella fuori dalla trama contribuisce alla probabilità.

## T-008 — Cinematica, per ultima

Solo dopo la matematica. Se il risultato è brutto si interviene sul rendering — luce,
densità, tremore, cedimento — **mai** su `rOf`, `rCheckAt` o le aree.

## Proprietà falsificabile centrale

> Data la stella costruita dalle stat e la trama costruita dalle difficoltà, la percentuale
> di successo deve essere **necessariamente** l'area coperta diviso l'area della trama —
> senza che nessuna delle due forme sia stata toccata per farla tornare.

## Differite dal Director («vedremo»)

trama dipinta (`bg.png` desaturato) o solo di filo — si guarda dopo i test, entrambe le
versioni · la soglia del punto 8.
