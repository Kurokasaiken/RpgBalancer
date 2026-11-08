# TRAITS-CARDS — PLAN-112 F3.2 (2026-11-05)
> Scheda dei tratti dei due pezzi campione: **cosa ha il mockup** e **cosa NON ha**, osservati a occhio sugli ingrandimenti (zanara-v2, zanara-v3). Regola P4: una variante generata si sceglie per **presenza dei tratti**, poi per pulizia. Il prompt chiede di togliere solo il contenuto vivo e **non nomina** nessun ornamento che il mockup non ha.

## Medaglione del roster (zanara-v2, riga «Kael»)
| # | Tratto | Presente | Nota |
|---|---|---|---|
| R1 | Anello d'oro **sottile**, quasi circolare, con bordo di luce in alto a sinistra | sì | non massiccio; spessore ~7% del diametro |
| R2 | **Mezzaluna di smalto verde-acqua** che abbraccia l'anello sul lato sinistro, con **filigrana d'oro** e piccole pietre | sì | fusa all'anello, non staccata |
| R3 | **Due gemme in castone**: una **a sinistra** (sul bordo della mezzaluna), una **in basso** (rombo smeraldo) | sì | la gemma in basso è il punto di connessione con la riga seguente |
| R4 | **Riflesso puntiforme perlaceo** a destra | sì | piccola perla/riflesso, non una gemma |
| R5 | **Foro circolare** per il ritratto, con ombra interna | sì | il ritratto è contenuto, non sporge |
| R6 | Ritratto dipinto, volto e spalle | contenuto vivo | **da togliere** (in codice) |
| R7 | **Nessuna** foglia, edera, ali, stella, rosa dei venti | sì (assenza) | non chiederli nel prompt |
| R8 | Nessun testo nell'anello | sì (assenza) | |
| R9 | Fusione con la **banda verticale** (la mezzaluna sale sulla banda) | sì | nella pianta B il medaglione non ha la banda larga: va riletto (vedi sotto) |
**Cosa cambia per la pianta B (D1/D5).** Non c'è più la placca aperta a riposo: servono lo **stato sul medaglione** — **arco di salute** lungo l'anello (si disegna in codice) e **gemma di stato** accesa/spenta/ferro (le due gemme R3 servono già a questo). Un tratto nuovo, **non del mockup**: una **traccia scanalata dell'arco** sull'anello (incisione sottile) su cui disegnare l'arco; è l'unica aggiunta e va dichiarata come tale.
**Rischio dei dati:** nessun nome a riposo: se il Director vuole il nome, D5 va riaperta.

## Cornice del pannello (zanara-v3, «Le Cascate di Zanara»)
| # | Tratto | Presente | Nota |
|---|---|---|---|
| P1 | Campo **alabastro avorio** con **macchie** morbide, venatura lieve | sì | superficie interna con profondità (non piatta) |
| P2 | **Angoli smaltati verde** con **rami e filigrana d'oro**, non geometrici | sì | in alto a sinistra/destra e in basso |
| P3 | **Cimiero in cima**: rombo d'oro con **grande smeraldo** e due piccole gemme (sopra e sotto) | sì | **non** una rosa dei venti, non una stella |
| P4 | **Drappo bianco** (seta) sull'angolo in alto a sinistra, con orlo d'oro | sì | |
| P5 | **Statua d'alabastro** in piedi sul bordo sinistro, in basso | sì | piccola, di profilo, panneggiata |
| P6 | **Un piccolo gruppo di foglie verdi** dietro l'angolo in alto a destra (4–6) | sì | **solo lì**; niente edera lungo i bordi |
| P7 | **Finestra con cima ad arco** a destra, bordo d'oro sottile | sì | contiene l'illustrazione; il vetro scuro vuoto **non** va disegnato se non c'è illustrazione (F2) |
| P8 | **Un solo pendente smeraldo** in basso al centro | sì | non tre |
| P9 | **Pulsante smeraldo** in basso con **medaglione a sinistra** e punte d'oro | sì | nel mockup il medaglione ha una bussola; **la sostituiamo con una gemma** (D3: una sola rosa dei venti nella HUD) — **deviazione dichiarata** |
| P10 | Testo, icone, illustrazione, etichetta del bottone | contenuto vivo | **da togliere** |
| P11 | Nessuna rosa dei venti oltre al medaglione del bottone, nessun busto d'oro, nessuna edera sui lati | sì (assenza) | non chiederli nel prompt |
**Deviazioni dichiarate dal mockup:** (1) gemma al posto della bussola nel bottone; (2) la finestra ad arco è opzionale (esiste solo con un'illustrazione).

## Scorecard di scelta delle varianti (per G2)
Per ogni variante generata: 1 punto per ogni tratto elencato **presente e riconoscibile**, −2 per ogni elemento **assente nel mockup e comparso** (edera lungo i bordi, rosa dei venti, busto, tre pendenti, stella), poi giudizio di pulizia (bordi, simmetria, sbavature). Una variante con punteggio di tratti inferiore a quello di un'altra **non vince per pulizia**.
- Medaglione: tratti R1–R5 + R9 (6) → punteggio massimo 6.
- Cornice: tratti P1–P9 (9) → punteggio massimo 9.

## Fonti
Ingrandimenti letti il 2026-11-05: riga «Kael» di `zanara-v2.png` (×4) e `.mw/specs/hud-real/panel/crop.png` (zanara-v3). Il confronto è a occhio: nessuna misura automatica dei tratti.

## Esito F3.3 — medaglione (2026-11-05, parziale: 2 varianti su 3)
- **Generate:** med-1, med-2 (med-3 non è uscita: quota/rifiuto; la coda riprova dopo il reset). Quota usata: 2 su 3.
- **Scorecard dei tratti (R1–R5, R9):** med-1 **5/6** (anello, mezzaluna con filigrana, tre gemme a sinistra e una in basso, perla a destra, foro vuoto; l'anello non è sottile: largo come l'approvato g4); med-2 **4/6** (mezzaluna più stretta e liscia, una sola gemma a sinistra). Nessuna delle due porta elementi non del mockup. **Vince med-1 per presenza dei tratti.**
- **La scanalatura per l'arco (tratto aggiunto) NON ha funzionato come pensato:** in entrambe l'anello a destra è semplicemente più spesso e liscio, non un canale. Provato a scala reale (72 e 96 px): l'arco di salute disegnato in codice **si legge bene** anche a 72 px, ma lo si traccia **sul bordo interno del foro**, non nell'anello. **Conclusione: la scanalatura non serve**; l'arco si disegna in codice sul bordo del foro. Nessun asset da rigenerare per questo.
- **Limiti:** (1) l'anello di med-1 non è più sottile di g4 (R1 della scheda chiedeva «sottile»): non è un miglioramento sul pezzo già approvato; (2) il confronto è a occhio sulla tavola `med-f3.png`; (3) la prova dell'arco usa un ritratto finto (campitura marrone) e non l'arte vera.
- **Cosa dice sul campione:** med-1 non è migliore del medaglione già approvato (g4 + mezzaluna fusa) né dal punto di vista dei tratti né dello spessore; il suo valore è **confermare** che il linguaggio regge, non sostituirlo. Raccomandazione del planner: **tenere il medaglione approvato** e limitare lo spike del roster alla **gemma di stato e all'arco in codice**; la decisione è del Director a G2.

## Esito F3.3 — cornice del pannello (2026-11-05, 3 varianti valutate; pf-4 non uscita per quota e saltata)
**Scorecard sulle immagini isolate** (P1–P9, −2 per elementi non del mockup): pf-1 **8/9**, pf-3 **8/9**, pf-2 8/9 con **righe orizzontali sul campo (−2) = 6** (scartata). In tutte e tre manca lo stesso tratto: **la finestra non ha la cima ad arco** (ovale arrotondato), benché il prompt la chiedesse; la finestra è opzionale nel contenuto (F2), pesa poco.
**Prova sulla mappa con contenuto vero** (`/hud-panel-compare`, 1280×700, DPR 2, `f3/color-proof.png` non coinvolto): affiancate ATTUALE, pf-1, pf-3 con titolo, testo 16 px, illustrazione, ricompense e bottone.
- **Spazio per il contenuto: pf-1 e pf-3 sono molto più alte della cornice attuale** (533 e 513 px contro 433, a parità di larghezza 340): il testo di 16 px che nell'attuale riempie il campo (e arriva a toccare la finestra e ad andare sotto il sigillo) in pf-1 e pf-3 sta comodo. **Ma sforano il pannello della pianta** (340×470): pf-1 è 533, pf-3 513. Quindi o il pannello della pianta passa a **~520 di altezza** (a 100% su 1440×810 sta; a 125% e 150% scorre già) o la cornice si comprime. **Nessuna decisione presa: dato per G2.**
- **Bottone:** in pf-1 e pf-3 l'etichetta INIZIA **non è centrata nello smalto**: la «I» si sovrappone al medaglione di sinistra (misura della placca nel geometry module sottostimata a sinistra). È **un mio errore di allineamento nel mockup di prova**, non un difetto delle cornici; da correggere con la geometria vera in F4. Nell'attuale l'etichetta cade bene.
- **Finestra:** a parità di illustrazione, pf-3 ha un bordo scuro spesso intorno alla finestra (vetro nero che non è coperto dall'immagine); pf-1 la copre meglio ma lascia un riempimento chiaro agli angoli.
- **Sagoma:** la cornice attuale è chiaramente più compatta e più semplice; pf-1 e pf-3 hanno più «presenza» (drappo, foglie, statua leggibili) ma anche più peso visivo: è il compromesso materiale/ingombro che G2 deve giudicare a occhio.
- **Altezze e budget:** una cornice più alta non cambia i fissi (il pannello è contestuale).
**Quota:** immagini usate 62 → 65 (60 + med-1, med-2 + pf-1..3); pf-4 in corso.

## pf-3 montata in /hud-compose (2026-11-05, G2-1 deciso dal Director)
- **Asset:** `public/assets/ui/hud-real/panel/frame.webp` = pf-3 (cut + grade + unificazione smalto 182°/L22/C18); geometria `panelFrameGeometry.ts` (340×512,7) con in più il campo `action` misurato a mano sul ritaglio del bottone (x 125, y 418,8, 122,5×45: smalto libero tra medaglione e punta). **Rollback:** `f3/rollback/frame-before-pf3.webp` e `panelFrameGeometry-before-pf3.ts`.
- **Componente:** `HudRealPanel` riscritto sulla nuova geometria (il testo parte dal campo, la finestra compare solo con un'illustrazione, il blocco sotto parte sotto la finestra, l'etichetta del bottone centrata sul campo `action`): titolo 21, testo 16, ricompense e requisiti 16. Cattura DPR 2 normale e stress: nessun errore; nessun testo tagliato salvo il sovratitolo lungo (accorciato nella demo a «Poi · Nord»).
- **Sforamento dello slot:** il pannello è 512,7 px, lo slot firmato 470: **la pagina di prova lo disegna comunque** e il sigillo sotto di lui ci si sovrappone; fuori dalla pagina di prova va deciso G2-2 (amend G1 #3). **Il contratto di pianta firmato non è stato toccato.**
- **Non verificato:** 14 eroi, inglese, scorrimento del corpo con testo molto lungo nella cornice nuova, misura a pixel dell'ingombro con la cornice più alta.
