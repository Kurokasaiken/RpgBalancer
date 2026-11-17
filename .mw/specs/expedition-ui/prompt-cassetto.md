# Prompt cassetto — expedition console "estratto" (R-353)

**Design intent:** la console expedition nel mockup composito deve leggere come
un vero cassetto estratto da fuori schermo: cornice su top/bottom/sinistra,
bordo destro a filo col bordo pagina — nessuna cornice, nessuna fessura di
mappa. Variante che coesiste con l'arte firmata R-323 (ruling Director
2026-11-16). Roster e stash esclusi (restano flottanti, mockup = solo
riferimento estetico).

**Identity:** stessa materia Zanara della colonna firmata — lacca petrolio
scura, ottone antico opaco cesellato, smalto smeraldo/teal. Kill list invariata
(no viola UI, no marrone, no flat, no icone generiche).

**Allegati:** `refs/mockup-stash-grid.jpg` (composito da iterare — IMG1),
`refs/mockup-chatgpt.png` (baseline direzione approvata — IMG2).

**Generation:** ChatGPT web (CDP :9222, driver `scripts/_tmp-r353-gpt-turn.mjs`,
derivato da `_tmp-r348-gpt-turn.mjs`). Output → `.mw/runs/<ts>-r353-cassetto-mockup/`.

## Prompt (verbatim, da incollare)

```
Contesto — videogioco fantasy RPG premium, art direction "Zanara": lacca petrolio scura (#0f2a35 → #060f16) con ottone antico opaco cesellato NMM, smalto smeraldo/teal profondo, luce drammatica, zero oro giallo brillante, zero flat design, zero viola nella UI, zero marrone, niente icone generiche (stati = sagome di oggetti tagliati nella materia). Stile pittorico: cartografia dipinta, china+acquerello.

COSA ABBIAMO (vedi allegati):
- IMG 1 (primo allegato): il mockup composito attuale — mappa dipinta full-bleed, ROSTER a sinistra, VILLAGE STASH al centro, e a destra il pannello EXPEDITION CONSOLE (quest banner, PARTY SLOTS, JOURNEY, RISK & REWARDS, CTA LAUNCH EXPEDITION). Il problema: la console è disegnata come una placca galleggiante con cornice su TUTTI i lati e margine di mappa visibile sul suo bordo destro.
- IMG 2 (secondo allegato): riferimento di direzione approvato per la stessa UI.

COSA VOGLIAMO:
Ridisegnare il mockup così che l'EXPEDITION CONSOLE diventi un vero CASSETTO ESTRATTO da fuori schermo — come un vassoio/tiranta che scivola fuori dal bordo destro della pagina:

- Il lato DESTRO del pannello coincide col bordo fisico dell'immagine/schermo: NESSUNA cornice, NESSUN margine, NESSUNA fessura di mappa visibile a destra. Il materiale del pannello (lacca + smalto) arriva tagliato netto al bordo dell'immagine, come se il cassetto continuasse oltre lo schermo.
- I lati SUPERIORE, INFERIORE e SINISTRO del pannello mantengono la cornice ornamentale Zanara (ottone cesellato, filetti, angoli lavorati) — è il bordo sinistro quello "vivo", quello da cui il cassetto è stato tirato fuori.
- Il contenuto interno resta identico per struttura e ordine: quest banner con vignetta, PARTY SLOTS (Leader/Fighter/Rogue/Scout), JOURNEY (3D outbound → 2D at site → 3D return), RISK & REWARDS, CTA LAUNCH EXPEDITION.
- Opzionale ma gradito: un'affordance fisica sul bordo sinistro (impugnatura/maniglia incisa in ottone o un sottile bordo-estrattore) che comunichi "questo vassoio si può richiudere".

Tutto il resto del mockup resta INVARIATO: stessa mappa, stesso ROSTER a sinistra, stesso VILLAGE STASH centrale, stesso DAY banner con sole in alto, stessa nav bar in basso, stesso medaglione-ritratto bottom-left.

VINCOLI:
- Non inventare una cornice sul bordo destro: è l'unico lato che deve toccare il bordo dell'immagine senza nulla in mezzo — niente gap di mappa, niente ombra che lo stacchi come placca.
- Il pannello resta docked a tutta altezza (top e bottom coincidono coi suoi bordi corniciati).
- Stessa palette, stessa materia, stessa densità ornamentale del mockup attuale — cambia SOLO la geometria del bordo destro della console.

PROPOSTE RICHIESTE:
Genera 2-3 mockup IMMAGINE a grandezza reale (stessa composizione full-bleed del mockup allegato) con interpretazioni MATERIALMENTE diverse del solo trattamento "cassetto estratto" (es. taglio netto a filo / vassoio con impugnatura incisa sul bordo vivo / cornice che si dissolve nel bordo schermo). Per ogni variante una riga col nome del concetto. Non serve codice: solo le immagini + il nome di ciascuna.
```
