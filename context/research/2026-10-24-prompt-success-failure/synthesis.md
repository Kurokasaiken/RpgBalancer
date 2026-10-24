# Sintesi — perché i prompt degradano (broadcast 2026-10-24, 4/4 provider)

Protocollo R-278: aperto, avversariale, coppie reali successo/fallimento.

## CONVERGENZE (≥3 voci — segnale forte)

1. **Enumerazione = soggetto.** Ogni sostantivo diventa saliente:
   "kettle+rope+sack" → natura morta di oggetti da campeggio; "hidden
   cache" + oggetti → il modello sostituisce con lo schema noto
   (forziere centrato). I successi nominano MASSE e LUCE, non oggetti.
2. **Light event, non mood.** Successi = UNA sorgente dominante con
   direzione e conseguenze ("fire raking the ground", "hard midday sun").
   Fallimenti = colori d'atmosfera senza evento luminoso → murk.
   "Teal shadow è un colore, non un evento di luce" (deepseek).
3. **Linguaggio interpretativo non si dipinge.** "Put back with too much
   care", "swallowed by the dark" = conclusioni narrative. Va tradotto in
   evidenza visiva: "the tarp overlaps the bundle on three sides" si
   dipinge; "too much care" no.
4. **POV inusuale senza ragione di luce.** "From above, no horizon" rompe
   il prior cinematico → il modello ripiega su icone di training (il
   forziere eye-level). Vale solo se il POV ha un motivo luminoso suo.
5. **Negative space è un'istruzione.** "the air above the fire is kept
   clear" — ogni prompt deve riservare una regione al nulla.

## DIVERGENZE (opzioni per il Director)

- **Graybox/ControlNet** (gemini): sketch compositivo → img2img a denoise
  0.35-0.45. Elimina errori di camera/posizionamento. Costo: step extra.
- **Style reference lock** (gemini+deepseek): una "style plate" master
  impasto passata come riferimento a ogni scena — fissa palette+tecnica.
- **Seed farming** (deepseek): 8-12 varianti low-res, selezionare per
  composizione, poi upscale. Stesso prompt, seed diversi → la selezione
  conta più della riscrittura.
- **Due passate** (deepseek): prima luce+masse (niente oggetti), poi
  img2img leggero per i dettagli — gli oggetti si conformano alla luce.
- **Scene contract** (chatgpt): tabella interna prima del prompt
  (evento / massa primaria / camera / visibilità richiesta / luce /
  failure conditions) — il prompt si giudica contro il contratto.

## VOCI SOLITARIE (blind spot)

- **gemini — negative-space sculpting**: prompt come campi astratti di
  colore impasto, zero oggetti nominati → forza il foundation pittorico.
- **deepseek — camera dentro il nascondiglio**: "the view from inside
  the cache: a narrow gap between canvas and ground..." — l'occlusione
  diventa struttura compositiva, impossibile generare un forziere
  centrato. Template riusabile per ogni scena "nascosta".
- **deepseek — separazione dei compiti**: il plate dipinge bellezza e
  staging; l'interattività è del runtime. Chiedere entrambi al plate
  produce il forziere morto-centro.
- **chatgpt — reject parziale**: il linguaggio relazionale non è
  impossibile — "partially occluded by a root", "overlaps on three sides"
  funzionano. Vietato solo il giudizio senza evidenza visibile.

## Verdetto

Il degrado non è nel wording — è **categoriale**: siamo passati da
"blueprint compositivi" (masse, luce, occlusioni) a "prosa narrativa +
liste di oggetti". Il fix non è riscuotere prompt ma cambiare il flusso:
scene contract → varianti compositive → finitura con style-lock.
