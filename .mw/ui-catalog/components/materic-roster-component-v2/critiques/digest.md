# Digest critiche — materic-roster-component-v2 (round 1, 2/3 image-grounded)

Provider: chatgpt, claude, deepseek — run
`20261025-critique-materic-roster-component-v2` (+ run `-r2` per il refill
claude: binding originale avvelenato su `claude.ai/new`), turn T-001
(+retry), prompt verbatim R-282.

**Provider failure dichiarati:**
- **chatgpt** — `ATTACH_FAILED` su T-001 e T-002. Pattern persistente.
- ~~**claude**~~ — RECUPERATO al refill (12:43 CET, run -r2, 5 shot,
  collect SUCCESS ~12.7k chars). Vedi `claude.md`.

**Nota transport deepseek (non provider failure):** T-001 attach
fallito sulla 2ª immagine (cookie banner); T-002/T-003 falliti per
browser condiviso saturo (~190 target) — risolto chiudendo i tab
provider di scarto via CDP. **T-004 SUCCESS con 3 immagini**
(default-ctx-a, default-iso-0, party-pick-iso-0; set ridotto dai 5
previsti per il limite di attach osservato).

Convergenza = **2/2 provider image-grounded** (claude + deepseek).
Fatti corretti: barre HP/MP verde/giallo, badge livello cerchio dorato
"LV 4", valori `195/195`, header "6/6" + 6 controlli, righe ~4 visibili
più sliver, contesto accanto alla Quest Window.

**Nota di fedeltà:** deepseek descrive il font come «sans-serif
generico» — probabile misread: il roster usa i font display dello skin
(Cinzel/serif, vedi `rosterV2/DragTestContainerV2.tsx`
`--wl-font-display`). Il claim tipografico va pesato con cautela; nel
codice proposto usa però Cinzel.

## Convergenza forte (2/2)

1. **Barre HP/MP solo-colore e troppo sottili.**
   - deepseek: «spessore 1-2px, solo verde/giallo → pericolo
     deuteranopia» → icone cuore/goccia + etichette HP/MP + pattern
     diagonale.
   - claude: «linee da 1-2px, senza icona né etichetta: quale è HP?…
     significato affidato solo al colore»; e soprattutto «tutti al 100%:
     8 barre piene e 8 "100/100" per dire "tutto ok" — informazione a
     costo massimo e valore zero» → numeri solo se non-pieni o in hover.
2. **Tipografia/contrasto sotto soglia.** deepseek: grigio valori
   troppo vicino allo sfondo, target 4.5:1; claude: numeri ~9px,
   riferimento ~16pt/3:1 dalle guide.
3. **Manca lo stato del membro.** deepseek: selezione solo sfondo,
   nessun flash danno/cura, nessuno stato KO; claude: «mancano
   classe/ruolo, stato (libero/in missione/ferito), idoneità alla quest
   — il roster accanto alla Marching Order non dice chi posso
   trascinare».
4. **Gerarchia piatta.** deepseek: «nomi e colonne dati competono»;
   claude: «header barra di sei bottoni uguali… "Chiudi" a 8px da
   "densità"».
5. **Rimedi concordi**: riga con nome come ingresso e vitali a destra,
   ridondanza non-cromatica sulle barre/stati, target/contrasto ≥4.5:1.

## Disaccordi / punti di un solo provider (verbatim)

- **Righe nascoste senza segnale** — solo claude: «header dice "6/6",
  righe visibili 4 + sliver tagliata: niente scrollbar, fade o "+2" —
  il giocatore pensa che il roster finisca lì» (il bug più grave).
- **Badge livello copre l'avatar** — solo claude: «"LV 4" si mangia
  mezzo avatar da ~24px… Bertoldo senza badge: voluto o bug?»
- **"6/6" ambiguo** — solo claude: capienza? disponibili? in gruppo?
- **Affordance drag** — solo claude: nessun grip, hover/selected/
  disabled, drop-target feedback.
- **Cornici dentro cornici** — solo claude: 3 livelli di contorno su
  340px.
- **Pesi dei 3 pannelli in contesto** — solo claude: roster/ordine/
  forecast stesso peso → gerarchia di lettura.
- **Flash danno/cura, stato KO, font mono cifre, stats a larghezza
  fissa** — solo deepseek.
- **Pannello "incollato" (profondità)** — deepseek lo legge come
  mancanza di depth/ombra; claude lo legge come peso uguale nel tri-panel.

## Quick-wins vs Structural

- Quick-wins: scrollbar+fade su overflow, icone+label sulle barre,
  chip livello fuori dal volto, header a 2 zone (titolo+conteggio |
  controlli finestra), label ordinamento per esteso.
- Structural: riga ≥48px con slot ruolo/stato/idoneità, numeri vitali
  on-demand (non-pieno o focus), affordance drag esplicita, gerarchia
  dei 3 pannelli nella quest view.

## Note di grounding

- claude (-r2 T-001): fatti corretti — "6/6" vs 4 righe + sliver, LV 4
  sul volto, Bertoldo senza badge, barre tutte piene.
- deepseek (T-004): fatti corretti; misread solo sul nome del font.
