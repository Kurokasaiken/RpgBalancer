---
title: "PLAN-043-S5 — Slot: scala d'oro, misura, bloom"
parent: PLAN-043
status: completed
created: 2026-10-17 (scorporato dal master PLAN-043; lavoro del 2026-10-16)
source_request: R-207
documentation_impact: REQUIRED
doc_targets:
  - src/docs/docs/idle_village/interaction_core_spec.md (slot del planner, palette hud-gold, bloom brass)
---

# PLAN-043-S5 — Slot: scala d'oro, misura, bloom

Master: [PLAN-043](PLAN-043-game-quest-surface-pass.md) · stato operativo in [INDEX](INDEX.md).

## Richiesta (verbatim)

> *"gli slot esteticamente nn m convincono tantissimo come colori cn questa nuovo setup d colori, e quando c'è una pg assegnato nn vedo + il coso sopra che lo blocca"* (2026-10-16)
>
> *"2) il colore dello slot nn c sta bene, idem la ghiera. Hai capito 'lo spirito' del componente? fanne una critica e una proposta per migliorarlo."* (2026-10-16)
>
> *"B, taglia 64"* → *"1) l'animazione è fatta malissimo, nn dovevi cambiare la logica della rotazione, ecc, anche la forma de denti è peggiore, bocciata"* (2026-10-16)
>
> *"prendi lo slot, fallo in scala di gold che stia bene cn il resto dell'HUD, nn creare problemi.*
> *va. La grandezza dello slot è sbagliata: il cerchio deve esseregrande quanto il portrait che ci starà dentro, la ghiera deve essere visibile fuori che "abbraccia" il portrait"* (2026-10-16)
>
> *"3) il bloom che indica dove può andar eun pg è pacchiano e brutto e rozzo"* · *"4) il colore oro è troppo perfetto e pulito"* (2026-10-16)

## Lo spirito, la critica, la proposta (rev.2, prima della bocciatura)

### 1 Lo spirito (dalla spec, `interaction_core_spec.md` §1)

Lo slot è un **castone meccanico di bronzo**: assegnare un PG è *incastonarlo*. La sequenza è il cuore del gesto di worker placement:
1. con un medaglione in mano, ogni slot che lo accetterebbe **fiorisce** (corona dorata), gli altri si spengono;
2. al rilascio il medaglione **vola magneticamente** nello slot (280 ms, parte lento e accelera);
3. la **ghiera aperta** (ruotata di −30°, ingrandita ×1,18) **si chiude** ruotando in posizione (560 ms);
4. poi **tre denti escono e serrano** il medaglione (240 ms): il PG è impegnato, preso;
5. per liberarlo si **tiene premuto**: i denti si ritirano, la ghiera si riapre controrotando, una molla, e il medaglione torna al roster in volo.

È la versione fisica del «la decisione costa»: un posto si occupa, si blocca, si libera con fatica. È una delle cose migliori del progetto.

### 2 Critica

1. **Il momento migliore è invisibile.** Su `/game` il ritratto è un div sopra la ghiera: la chiusura e il morso dei denti avvengono *sotto*. Il giocatore vede comparire un cerchio, non sente il castone che si chiude.
2. **È disegnato a 210 px e mostrato a 56.** I denti (14 px nel disegno) diventano ~3,7 px, la banda della ghiera ~3 px, gli anelli arcani frazioni di pixel, la texture di basalto rumore. Il meccanismo c'è ma non si legge.
3. **Materia di un'altra direzione.** È la skin «Wilderness · Bronzo Selvatico» (basalto ossidiana, venature, sigillo rosso): il vocabolario che R-203 ha dichiarato superato. Accanto al Roster (lacca scura della skin `base` + ottone NMM) il centro rosso-bruno sembra fango e il bronzo non è lo stesso ottone. 68 colori scritti a mano nel renderer, nessun token.
4. **Niente calamita.** Il volo magnetico parte solo dopo un rilascio preciso: se il puntatore cade sull'etichetta o tra due slot il rilascio si perde. È anche una causa probabile dello scambio che a volte fallisce.
5. **Lo slot vuoto non dice cosa vuole.** Il ruolo (capo, combattente, esploratore, guardia del corpo) è solo un'etichetta sotto, a 12 px. Dentro c'è un sigillo decorativo.
6. **Il rifiuto sembra un disabilitato.** Lo stato *invalid* è opacità 0,3 e desaturazione: comunica «spento», non «non qui, perché…».
7. **Il PG assegnato non è incastonato in niente.** Ritratto (o sagoma, per gli abitanti) in un cerchio nudo, senza bordo né castone.

### 3 Proposta (da validare con mockup — workflow `painter`)

Tenere **tutta la coreografia** (fioritura, volo, chiusura, morso, estrazione), cambiare scala, ordine e materia:

| # | Cosa | Come |
|---|---|---|
| S1 | **Ordine dei layer** | cavità → ritratto (ritagliato dentro il raggio interno) → **ghiera e denti sopra il ritratto**, che ne mordono il bordo di 2–3 px. Il PG si vede incastonato. |
| S2 | **Geometria per la taglia d'uso** | un disegno per 56–72 px, non il 210 ridotto: tre denti grandi (≥ 4 px a 64 px), banda della ghiera 5–6 px, nessuna texture sotto i 96 px, un solo anello inciso al posto degli anelli arcani sottili. |
| S3 | **Materia della skin scura `base`** | ghiera = la stessa banda d'ottone NMM delle lastre (`--skin-hud-brass-*`); cavità = la lacca scura della skin `base` (`--skin-hud-lacquer-*`); nessun rosso. Tutti i colori da token, così lo slot segue la skin attiva. |
| S4 | **Il vuoto dice il ruolo** | al centro dello slot vuoto, l'icona incisa del ruolo (dal set approvato in PLAN-058 T3.2: capo, membro, guardia, esploratore) in ottone spento; l'etichetta resta sotto. |
| S5 | **Stati per forma, non solo colore** | vuoto = ghiera aperta + icona del ruolo; medaglione in mano e slot valido = la ghiera si *pre-chiude* (−30° → −12°) e si illumina, la calamita tira; non valido = la ghiera resta aperta e ferma, cursore «rilascio no», motivo in una riga (non più opacità 0,3); occupato = ghiera chiusa, denti serrati, icona del ruolo in una piccola linguetta sotto. |
| S6 | **Calamita su `/game`** | rilevamento a due livelli: lo slot sotto il puntatore; altrimenti lo slot valido più vicino entro il raggio di `dragConfig.magnetism` (oggi 120 px), con il fantasma che scivola verso di lui. Vale anche per lo scambio slot→slot. |
| S7 | **Abitanti senza ritratto** | la sagoma scura resta (corretta); con la ghiera chiusa sopra si legge come «assegnato». |

**Confini.** Il componente certificato su `/slot` (lab L0) e le altre pagine restano identici: la nuova resa passa per una variante (geometria piccola + materia della skin `base` via token), come la prop `sigillo` di `PoiMatericV3_5`. La coreografia resta in `useExtractionSequence` / `DragOutcomeFlight` / `bloomEffect`: non si riscrive.

## Task ed esiti

- **T2.1 Mockup (painter, Opus alto):** 3 varianti della proposta §3.3 a 56, 64 e 72 px, su lacca, in tutti gli stati (vuoto, in mano valido, in mano non valido, occupato eroe, occupato abitante, estrazione a metà), con la sequenza di chiusura in 4 fotogrammi. **D5** (Director): variante e taglia.
- **T2.2 Spec + componente (Sonnet):** variante del renderer con la geometria piccola e i token; ordine dei layer S1; icona del ruolo S4; stati S5. La coreografia condivisa non cambia.
- *Accettazione:* catture headless di ogni stato a 1280 e 1920 confrontate con il mockup scelto; `/slot` e le altre pagine identiche prima/dopo; `ResidentSlotRack.*`, `gameQuestFullFlow`, `gameQuestExpedition` verdi.
- **Esito T2.1 (2026-10-16, `test-results/plan-043/f2/mockup-slot/`):** tre varianti disegnate con i token reali della skin `base` e i glifi `role-*` già esistenti in `engravedIcons.tsx`, in 6 stati × 3 taglie (56/64/72), più i 4 ruoli e la chiusura in 4 fotogrammi (`sheet-states|sizes|roles|closing.png`; generatore `gen.py`, riproducibile). **A · Anello pieno** (banda 9,5u, denti a trapezio, un anello inciso): è la più vicina all'attuale, ma a 64 px i denti sono segni quasi invisibili. **B · Griffe** (banda 6,5u, tre griffe ad arco che abbracciano il ritratto): i denti si leggono già a 56 px; è la più chiara per «preso». **C · Castone profondo** (rim 4,5u + labbro scuro smussato, tre morsetti piatti): la più affine alle lastre scure del Roster, ma i morsetti sono piccoli. **Raccomandazione: B**, eventualmente con il labbro scuro di C. *Non verificato:* i ritratti e le sagome sono segnaposto, il movimento (volo, chiusura animata) non è reso — la chiusura è in fotogrammi fissi — e la resa non è ancora il componente (`SlotV12Renderer`), solo un riferimento visivo. Con la ghiera aperta lo slot occupa ×1,18 della sua cella: il layout deve lasciare quel margine. **D5 (Director):** variante e taglia.
- **Esito T2.2, primo tentativo — BOCCIATO (Director, 2026-10-16):** scelta D5 = variante B, 64 px. Implementata come renderer separato (`SlotInsetRenderer`) con la coreografia ricopiata a mano. Motivi della bocciatura: *«l'animazione è fatta malissimo, nn dovevi cambiare la logica della rotazione, ecc, anche la forma dei denti è peggiore»*. Errore mio: ho riscritto rotazione, chiusura e denti invece di riusare quelli di `SlotV12Renderer`; in più ho aggiunto una pre-chiusura a −12° (S5) che nessuno aveva approvato come logica. Tutto rimosso dal gioco (nessun file lasciato); restano solo i mockup in `test-results/plan-043/f2/mockup-slot/`. **Regola per il prossimo tentativo:** la logica di rotazione, scala, tempi e forma dei denti restano quelle del renderer originale, byte per byte; si cambia solo materia (token) e ordine dei layer (ritratto sotto la ghiera). Da concordare con il Director prima di scrivere codice.
- **Esito T2.2, secondo tentativo (2026-10-16), con le regole del Director:** *«prendi lo slot, fallo in scala di gold che stia bene cn il resto dell'HUD, nn creare problemi … il cerchio deve essere grande quanto il portrait, la ghiera visibile fuori che abbraccia il portrait»*. Logica di rotazione, tempi e forma dei denti **invariati**. (1) **Dimensione:** il renderer disegna l'anello esterno a 73 su 240 unità, quindi a 56 px di casella misurava ~34 px e il ritratto da 40 px lo copriva; ora la casella è 83 px: cerchio interno 40 px = ritratto, ghiera fuori (`QuestExpeditionDetail`). (2) **Colore:** nuova prop `palette="hud-gold"` su `SlotV12Renderer` che legge token d'ottone (`SLOT_HUD_GOLD_TOKENS`: argento→oro consumato, artigli, bevel, fondazione, arcano) al posto di argento e azzurro; i letterali del renderer per cui esisteva già un token (fondazione, bevel, artigli, punta) ora passano da `tok()` con lo **stesso valore di default**. Resta attivo solo dal planner (`slotMaterial="hud-gold"`). (3) **Bloom:** `getBloomStyle(..., 'brass')`, solo per gli slot del planner: bordo luminoso + alone morbido, respiro 2,8 s, colori dai token ottone, **niente** nucleo bianco, oklch saturo né onde (il bloom condiviso dei POI è invariato). *Non verificato:* identità pixel di `/slot` col palette di default (stessi valori, non misurata); il bloom l'ho visto applicando a mano l'animazione allo slot, non con un trascinamento vero (il drag sintetico non parte in questa pagina). La ghiera resta sottile e un po' scura: è lo spessore di disegno del renderer (4 unità).

- **Gate F2:** sì del Director.

## Contratto di chiusura

- Unit: `bloomBrass.test.ts`; `ResidentSlotRack.*` (3 rotture preesistenti in `.medal`).
- Cattura headless del planner (`f2/slot-inset.spec.ts`).
- Identità pixel di `/slot` con la palette di default (non ancora misurata).
- Sì del Director guardando lo slot nel gioco.
- Bundle di chiusura non ancora prodotto (`.mw/runs/plan043-{sid}/verification.json` → `verify:bundle`).
