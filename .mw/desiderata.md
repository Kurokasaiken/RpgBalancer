# Desiderata

<!-- ISTRUZIONI (rimuovi questa sezione dopo il freeze)

§F1 — Genesi collaborativa:
1. Il Director esprime l'intento in forma grezza qui sotto.
2. Si discute. Claude può chiedere, chiarire, evidenziare ambiguità.
3. Claude propone una formulazione.
4. Il Director avalla. Senza avallo non esiste desiderata e il ciclo non parte.

§F2 — Mutabilità versionata:
Ogni modifica aggiunge una versione (v2, v3...), non sovrascrive.
La versione corrente è quella con numero più alto e status: FROZEN.

§F3 — Ambiguità:
Se la desiderata è ambigua, Claude chiede — non interpreta e procede.

§F4 — Ancoraggio:
Viene ripetuta verbatim in testa a ogni prompt di ogni round, a tutti i modelli.
-->

---

## v1

**Status:** FROZEN
**Date:** 2026-08-07
**Authorized by:** Fausto
**Reason:** approval via "procedi" in sessione

**Intento del Director:**
Adottare il protocollo Mind Weaver nel progetto RPG: portare il workflow (explorer, planner, executor), il sistema di richieste/desiderata e la catalogazione della documentazione, preservando le informazioni e i workflow specifici di RPG (mandate, Kanban, trusted components, Style Lab, config-first).

**Formulazione proposta da Claude:**
Adottare il protocollo Mind Weaver nel progetto RPG: portare il workflow (explorer, planner, executor), il sistema di richieste/desiderata e la catalogazione della documentazione, preservando le informazioni e i workflow specifici di RPG (mandate, Kanban, trusted components, Style Lab, config-first).

**Formulazione approvata (FROZEN):**
Adottare il protocollo Mind Weaver nel progetto RPG: portare il workflow (explorer, planner, executor), il sistema di richieste/desiderata e la catalogazione della documentazione, preservando le informazioni e i workflow specifici di RPG (mandate, Kanban, trusted components, Style Lab, config-first).

---

## v2 — World Surface: mappa viva da esplorare con gli occhi

**Status:** `FROZEN`
**Date:** 2026-08-12
**Authorized by:** Fausto
**Reason:** avallo via chat "x il resto è frozen", con due rettifiche: nessun numero fisso di layer, V3 scaffold come base strategica.

**Intento del Director:**
- La mappa di World Surface **non è più una dashboard tattica (Dispatch)**; è un **mondo da esplorare con gli occhi**.
- Il linguaggio visivo è **pittorico/fantasy**, ispirato a Hearthstone/Marvel Snap: cornice intagliata, montagne/foreste/mare, creature, vita atmosferica, rare scoperte.
- **Layer concettuali multipli** e **sistemi di rendering reali limitati/profilati**; il budget di rendering è quello di una app Tauri desktop su WebView, non illimitato.
- Le **reazioni nascoste** non devono dipendere da sequenze di click rapide; il dwell di 10s è solo un'idea da valutare, **non una meccanica approvata**.
- Il **trattamento cinematografico spettacolare** è riservato a eventi ad alta posta, es. Invasione Goblin che può chiudere il run.
- Gli eventi **ordinari devono rimanere localizzati** e non bloccare l'interazione.

**Formulazione proposta da Claude:**
- Il nuovo **Pillar 1 in `DESIGN_PILLARS.md`** sostituisce il vecchio Dispatch e ancorala direzione del gioco.
- A runtime i sistemi di rendering reali devono essere un **numero limitato**, misurato e profilato per Tauri, con DOM/CSS per contenuto statico e PixiJS per dinamica.
- **Vietati senza profilazione**: mesh deformation continua, rifrazione fisica, volumetric fog.
- I **trigger nascosti candidati** sono: hover intenzionale breve su landmark, attraversamento di zone, condizioni di mondo (notte/pioggia), catene di osservazione. Il dwell di 10s può restare solo per un easter egg rarissimo, non come meccanica primaria.
- I **tier di presentazione eventi** sono: ambient (nessun rischio), threat (avviso localizzato), major (più marcato ma non bloccante), run-threatening (cinematica piena, rara).
- **V3 scaffold** (`src/ui/idleVillage/worldSurface/`) è la base strategica del lavoro; la component-based plan non è attiva e sarà rivalutata dopo stabilizzazione di V3.
- Il prossimo piano dovrà produrre: budget layer/effetti concreti, scelta del trigger system, tabella tier eventi con condizioni oggettive.

**Still unresolved:**
- Quale **trigger principale** per le reazioni nascoste? (hover-breve, zone, world-state, catene, o combinazione?)
- **Responsabilità esatte** di ogni layer concettuale e dei passi di rendering reali.
- **Budget Tauri concreto** (target hardware, fps, memoria, dimensione bundle).
- Se il percorso `/world-surface` dovrà puntare a V3 e cosa succede al legacy `/world-surface` test harness.

**Formulazione approvata (FROZEN):**
La mappa di World Surface diventa un **continente dipinto vivente da esplorare con gli occhi**: più layer concettuali, sistemi di rendering reali limitati e profilati per Tauri, reazioni nascoste data-driven senza click-sequence, tier di presentazione eventi, e trattamento cinematografico riservato agli eventi che minacciano il run. Il V3 scaffold esistente è la base strategica; la component-based plan resta in sospeso. Il prossimo passo è produrre un piano tecnico per il budget layer, il sistema di trigger e i tier eventi.

---

## v3 — POI Quest System

**Status:** FROZEN
**Date:** 2026-08-11
**Authorized by:** Fausto
**Reason:** avallo via "procedi" in sessione dopo esplorazione R-005 con 12 domande chiarite.

**Intento del Director:**
I POI di tipo *quest* si distinguono dagli altri POI per tre caratteristiche: (1) timer visivo come cerchio magico che si scrive attorno al POI, (2) skill check automatici per milestone, (3) quest card con esito da raccogliere manualmente.

**Formulazione proposta da Claude:**
I POI di tipo *quest* si distinguono dagli altri POI della famiglia per tre caratteristiche. (1) **Timer visivo**: durante la spedizione, attorno al POI si scrive progressivamente un cerchio magico — iscrizione arcana che si materializza carattere per carattere partendo dalle ore 12, senza binari né cerchio preesistente, nel linguaggio visivo "si riempie di luce". (2) **Skill check per milestone**: a ogni 25% della durata totale (calcolata dalla somma delle fasi del blueprint) si esegue uno skill check con Destiny Astrolabe V1, alimentato dalla somma delle stat dei residenti assegnati; ogni fase può produrre ferite/morte/loot modifier senza interrompere la quest; il giocatore può interrompere manualmente. (3) **Quest card con esito manuale**: completato il cerchio, il POI è cliccabile — si apre la `QuestChronicle` (card cinematografica a fasi) con rope luminosa, un riquadro per fase, animazione Astrolabe visibile, consumabili spendibili prima del lancio, e un pulsante "Raccogli ricompense" che chiude la card, restituisce i residenti al roster e applica le ricompense. Tutto il sistema — timer, card, slot behavior, coupling al time engine — deve essere portabile con una riga (frozen kit) e valido per tutta la famiglia POI, non solo per il POI quest.

**Formulazione approvata (FROZEN):**
I POI di tipo *quest* si distinguono dagli altri POI della famiglia per tre caratteristiche. (1) **Timer visivo**: durante la spedizione, attorno al POI si scrive progressivamente un cerchio magico — iscrizione arcana che si materializza carattere per carattere partendo dalle ore 12, senza binari né cerchio preesistente, nel linguaggio visivo "si riempie di luce". (2) **Skill check per milestone**: a ogni 25% della durata totale (calcolata dalla somma delle fasi del blueprint) si esegue uno skill check con Destiny Astrolabe V1, alimentato dalla somma delle stat dei residenti assegnati; ogni fase può produrre ferite/morte/loot modifier senza interrompere la quest; il giocatore può interrompere manualmente. (3) **Quest card con esito manuale**: completato il cerchio, il POI è cliccabile — si apre la `QuestChronicle` (card cinematografica a fasi) con rope luminosa, un riquadro per fase, animazione Astrolabe visibile, consumabili spendibili prima del lancio, e un pulsante "Raccogli ricompense" che chiude la card, restituisce i residenti al roster e applica le ricompense. Tutto il sistema — timer, card, slot behavior, coupling al time engine — deve essere portabile con una riga (frozen kit) e valido per tutta la famiglia POI, non solo per il POI quest.
