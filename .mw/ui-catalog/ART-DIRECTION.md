# ART-DIRECTION — rubrica condivisa (PLAN-086, rev 3)

> Ogni revisione di questo file passa in review page al Director prima
> dell'uso (gate per-revisione, non solo v1). Le slice iniettate nei
> prompt citano `revision:N`.

## Livello 1 — Vincoli immutabili (mai violabili, neanche su proposta)

- **Stile**: pittorico fantasy — cartografia dipinta, china+acquerello,
  cornice intagliata (gargoyle/drago), colori caldi, luce drammatica,
  frame come oggetto fisico. Linguaggio Hearthstone/Marvel Snap.
- **Superfici HUD**: "Lacquer Atlas" — placche/materia su token
  `--skin-hud-*`; niente CSS ad-hoc fuori `skinConfigRegistry`.
- **Tipografia**: Cinzel (titoli) + EB Garamond (corpo); mai font di
  sistema generici sulle superfici di gioco.
- **Iconografia**: glifi incisi; **maiuscole/emoji vietate** come icone
  (INV-1: famiglia icone incise, ruling B).
- **Colore**: **mai viola/viola-derivati** (COL-D, ruling B). Morte =
  ferro freddo `#93a4ad`.
- **Stringhe**: niente testo hardcoded nei mockup (i18n: placeholder
  `{i18n:key}` ammessi e marcati).
- **a11y**: focus visibile, target ≥44px, reduced-motion rispettato.
- **Tono**: sobrio, conseguenziale, gestionale di frontiera — etichette
  nominali, stato comunicato da halo/badge, mai da grassetto urlato.

## Livello 2 — Preferenze forti + anti-pattern (violabili solo con
argomento esplicito che va al Director)

Anti-pattern da respingere attivamente:
- Flat minimal / material design / glassmorphism
- Neon, gradienti cyber, ombre colorate generiche
- Dashboard chrome SaaS (card bianche arrotondate, shadow-stack)
- Micro-interazioni app-like (bounce, confetti, skeleton loaders)
- Emoji/glyph unicode come pittogrammi
- Tipografia sans-serif moderna sui contenuti di gioco
- Viola/magenta ovunque

Preferenze (arricchite dalle critiche libere, R-282 learnings):
- **La decorazione non pesa mai più dell'informazione che contiene** —
  tre livelli funzionali: (1) stato/rischio (2) orientamento/azioni
  (3) decorazione/secondario. Contrasti e accenti riservati al livello 1.
- **Stato critico = multicanale** — icona + testo + colore insieme, mai
  solo tinta; e dimensione/movimento maggiori (non un bordino).
- **Microcopy semantica, non conti alla rovescia** — a 0 risorse il
  testo dice la conseguenza ("Carestia"), non "0 d left". Transizione a
  critico = evento di gioco (pausa + CTA verso la soluzione).
- **Chip risorse = larghezza minima fissa** — anatomia unica per risorsa
  (icona, valore tabular, tasso, badge stato); il layout non salta quando
  i valori cambiano.
- **Icona + label ridondanti = rumore** — preferire il dato che conta
  (tasso/previsione) al doppio canale.
- Ornamento al servizio della gerarchia, mai decorazione libera
- Bronzo/ottone per controlli; lacca teal per lastre; ferro freddo per
  stati terminali
- Stati comunicati da materia (halo, incisione, sigillo) non da colore
  piatto
- Densità alta ma leggibile (reading-rect ≥48ch, ΔL≤3% pergamena)

## Ruling Director registrati (precedono e vincono su tutto)

- **R-282/hud-tabs-1 (2026-10-24)**: vietato l'alone/luce colorata dentro
  la cella cibo (trattamento "brace ambra interna" = già scartato in un
  ruling precedente del progetto). Le proposte con glow interno alla
  cella FOOD sono fuori-direzione.
- **R-282/hud-tabs-2 (2026-10-24)**: vietata la sospensione fisica
  (perni, catene, ferramenta "appeso") sulle placche HUD — "brutto e
  stupido". Niente hardware di sospensione come ornamento.
- **R-282/hud-tabs-3 (2026-10-24)**: il selettore velocità a tacche con
  perla È APPROVATO come direzione, ma SENZA la guida/binario d'ottone;
  il componente del giorno (placca DAY + emblema) resta quello attuale.

- **R-282/prompt (2026-10-24 — REGOLA PROMPT)**: il prompt di critica
  per le AI web è SOLO il testo verbatim del Director:
  «Sei un lead UI senior designer di una compagnia di videogame AAA, fa
  una ricerca online, dammi una critica spietata e costruttiva di questo
  componente. Poi proponi delle soluzioni a tua volta, cn esempi di
  codice, ecc.» — NIENTE rubrica iniettata nel prompt, niente output
  schema forzato, niente osservazioni guidate. La rubrica ART-DIRECTION
  resta a valle (ranking/digest), non a monte. Motivo: il prompt libero
  produce ricerca online e critiche più ricche; la mia versione
  customizzata ha prodotto output peggiori (verificato a confronto).
- **R-282/hud-tabs-4**: le placche sinistra/destra devono avere la STESSA
  dimensione e più distanza dai bordi. Lo spazio centrale vuoto non piace:
  **serve un terzo tab centrale** (sovrascrive il contratto
  renders-null del NextEventTab → amendment: placca sempre presente,
  stato vuoto quando nessun evento).
- **R-282/hud-tabs-3 (aggiornato)**: regolo velocità APPROVATO senza
  guida d'ottone; componente giorno invariato.

## Livello 3 — Giudizi contestuali (richiedono Director)

- Introduzione di un nuovo linguaggio di ornamento non presente nei
  frozen kit
- Cambio di gerarchia informativa dentro una regione contrattata
- Eccezioni agli anti-pattern di livello 2
- Mockup `structural` (cambiano interazione/layout, non solo reskin)

## Slice per surface-tag (selezione deterministica)

- `hud_cluster|panel|control` → L1+L2 completi + sezione token skin
- `overlay` → L1+L2 + regole z-index/portaling note
- `marker|map-overlay` → L1+L2 + pillar "stato sul mondo, non pannelli"
- `view` → tutto + note composizione full-screen

## Formato risposta richiesto ai critici

Ogni critica DEVE: citare l'asse rubrica violato/rispettato, separare
`quick_wins` da `structural`, chiudere con verdict-block JSON
(`severity[]`, `proposals[]`, `observed_facts[]` ≥2 fatti visivi).
