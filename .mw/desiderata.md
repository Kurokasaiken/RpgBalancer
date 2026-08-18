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

---

## v4 — POI Quest System: pannelli flottanti e ritmo delle fasi

**Status:** FROZEN
**Date:** 2026-08-12
**Authorized by:** Fausto
**Reason:** avallo esplicito — "considerali come la desiderata e risolvili tutti uno ad uno".

**Intento del Director (verbatim):**
- "quando si apre il Detail nn posso + uscire e nn posso interagire con nient'altro."
- "quando sn nella quest nn posso interagire"
- "quei pannelli devono essere poter spostati (ded)"
- "Le fasi della risoluzione devono essere risolti 1 ad uno, ma deve passare il tempo tra le varie fasi. Se c sn 4 fasi, e la quest dura un minuto, 60/4 secondi è qunato dura ogni fase. nn possono risolversi tutte insieme."
- "quando sono nelle milestone nn posso ridurre a icona, o interagire con il resto della pagina"
- "la pagina di reward/vittoria deve essere fatta da 0 partendo da: /design-system"

**Formulazione approvata (FROZEN):**
I pannelli del POI quest — POI detail, quest card e skill check di milestone — non
sono modali che bloccano lo schermo: sono **pannelli flottanti**. Ognuno si può
**spostare** trascinandone l'intestazione, **ridurre a icona** e **chiudere**, e
mentre è aperto il resto della pagina resta pienamente interagibile: nessun
backdrop, nessuna cattura del puntatore. Più pannelli possono coesistere e quello
toccato per ultimo passa davanti.

Le fasi di una quest si risolvono **una alla volta, con tempo reale che scorre tra
l'una e l'altra**: ogni fase occupa una fetta uguale della durata della quest
(quattro fasi su un minuto = quindici secondi ciascuna) e non è mai possibile che
più fasi si risolvano nello stesso istante. Finché uno skill check è aperto e in
attesa del giocatore il tempo della quest non avanza; se il giocatore lo riduce a
icona la fase si risolve da sé e la quest riprende a scorrere.

La schermata di **ricompensa/vittoria** è riscritta da zero sui primitivi del
design system (`/design-system`): non è più uno splash sovrapposto alla cronaca,
ma una superficie propria che presenta esito, fasi affrontate, ricompense e sorte
del party, e da cui si raccoglie.

---

## v5 — Mockup AI → componente React + asset ad hoc: protocollo generale

**Status:** `FROZEN`
**Date:** 2026-08-14
**Authorized by:** Fausto
**Reason:** avallo via "procedi" in sessione

**Intento del Director:**
Stabilire un protocollo generale, riutilizzabile, per passare da mockup generati con AI a componente React funzionante con asset grafici ad hoc, integrato nel progetto RPG.

**Formulazione proposta da Claude:**
Definire un protocollo end-to-end — valido per qualsiasi componente UI o World Surface — che copra: generazione e valutazione del mockup; decisione sull’idoneità dell’immagine; produzione degli asset (formati, dimensioni, ottimizzazione Tauri/WebView); stesura di prompt veri e reali; e integrazione nel repo rispettando skin system, frozen kits, i18n, config-first e component reuse.

**Formulazione approvata (FROZEN):**
Definire un protocollo end-to-end — valido per qualsiasi componente UI o World Surface — che copra: generazione e valutazione del mockup; decisione sull’idoneità dell’immagine; produzione degli asset (formati, dimensioni, ottimizzazione Tauri/WebView); stesura di prompt veri e reali; e integrazione nel repo rispettando skin system, frozen kits, i18n, config-first e component reuse.

**Still unresolved:**
- Quale generatore AI/tool viene usato per i mockup.
- Se il protocollo debba produrre anche il componente React o solo gli asset.
- Workflow one-shot vs iterativo e chi/come valuta la qualità.

---

## v6 — Mockup → CSS/React + asset ad hoc: paintover consentito

**Status:** `FROZEN`  
**Date:** 2026-08-14  
**Authorized by:** Fausto  
**Reason:** avallo via "ok, cambia la regola: puoi fare paintover a tuo piacimento" in sessione; rettifica della decisione v5 handoff "zero paintover"

**Intento del Director:**
Per qualsiasi componente UI o World Surface, il workflow operativo è: il Director prima prova CSS/React. Se non è soddisfatto, richiede un mockup generato con AI o fornisce un mockup esterno. L'agente converte il mockup in CSS/React al meglio delle sue possibilità, crea solo gli asset che non sono riproducibili in CSS, e può usare paintover come strumento di correzione quando serve. Zero divieti assoluti: il risultato conta più del mezzo.

**Formulazione proposta da Claude:**
Stabilire un protocollo operativo minimalista per passare da mockup (AI o esterno) a componente React: (1) massimizzare CSS/React, (2) generare o rigenerare solo gli asset strettamente necessari, (3) consentire paintover come correzione legittima, (4) mantenere i vincoli di i18n, config-first, skin system e component reuse, (5) fissare un budget stretto di tempo/iterazioni per evitare loop aperti.

**Formulazione approvata (FROZEN):**
Per qualsiasi componente UI o World Surface, il workflow operativo è: (1) tentativo CSS/React-first; (2) se il Director non è soddisfatto, generazione o uso di un mockup AI (SDXL 1.0 base, img2img, IP-Adapter) o mockup esterno; (3) conversione in CSS/React al meglio delle capacità; (4) creazione degli asset ad hoc solo per le parti non riproducibili in CSS; (5) paintover consentito come strumento di correzione. Il protocollo resta ancorato a i18n, config-first, skin system, component reuse e a un budget stretto di tempo/iterazioni.

---

## v7 — Documentazione AI-friendly + suite di test per l’integrazione di componenti in pagine

**Status:** `FROZEN`
**Date:** 2026-08-15
**Authorized by:** Fausto
**Reason:** avallo via "va bene così, procediamo" in sessione

**Intento del Director:**
Quando un agente deve mettere componenti in una pagina, deve sapere come comportarsi senza dover fare domande. Il progetto deve avere documentazione comprensibile per un LLM e una suite di test ad hoc, linkata ai documenti, per catturare regressioni.

**Formulazione proposta da Claude:**
Ogni superficie di integrazione (pagina, kit, flusso) deve avere un documento AI-readable: sezioni esplicite, contratti in stile `Given/When/Then`, esempi di input/output, riferimenti incrociati a `COMPONENT_MASTER_INDEX.md` e comandi di test eseguibili. Ogni documento ha una suite di test Playwright/RTL linkata, dati di test JSON/config-driven e hook `window.__*TestHooks` esposti. Il primo caso d’uso è la **POI family** (desiderata v3/v4); v7 ne formalizza il metodo e lo rende riutilizzabile.

**Formulazione approvata (FROZEN):**
Ogni superficie di integrazione (pagina, kit, flusso) deve avere un documento **AI-readable** con: Goal, Data flow, Scenarios, Visual/Runtime contracts, Invariants, Test commands, Evidence. I contratti sono espressi in stile `Given/When/Then`; ogni documento linka ai test Playwright/RTL con dati JSON/config-driven e hook esposti. Il metodo viene applicato per la prima volta alla **POI family**: creare `poi_family_spec.md` come root e le spec figlie per job/training/maintenance/cooldown/quest, con `poiQuestRegressions.spec.ts` esteso o una nuova suite POI. Il pattern "Director input → spec → test → evidence" viene catturato in `.mw/runs/` e, se ricorrente, proposto per `PROPOSALS.md`.

**Still unresolved:**
- Nome e posizione del template AI-friendly (`.mw/templates/ai-friendly-spec.md` o `src/docs/docs/idle_village/_template.md`).
- E2E-only, unit-only o entrambi per ogni integrazione.
- Quando un test è sufficiente oltre Playwright (es. unit per `QuestPowerEngine`).

---

## v8 — Golden UI Foundation

**Status:** `FROZEN`
**Date:** 2026-08-17
**Authorized by:** Fausto
**Reason:** avallo via "3" in sessione

**Intento del Director:**
Il piano Golden UI Foundation v2 è approvato come direzione. Non costruiamo un design system astratto: stabiliamo un processo per trovare e congelare la qualità visiva canonica di Idle Village, partendo da un audit forense, estrarre il DNA dai componenti migliori (Golden 0), e usarlo per produrre 5 Golden Screens con baseline deterministiche.

**Formulazione proposta da Claude:**
Convalidare il DNA visivo di Idle Village attraverso: (1) una fase di Target Freeze condizionale su artefatti visivi reali; (2) un Forensic UI/Art Audit con la metrica Identity; (3) una fase Golden 0 — Trusted Component Forensics che non presuppone `PgCard` + `SlottedMedal` ma li usa come candidati iniziali; (4) un Visual DNA Contract con token, materiali, tipografia e invariants; (5) una Golden Foundation minimale derivata dalle 5 Golden Screens; (6) `/design-system` come UI Lab; (7) screenshot baseline Playwright con metadati semantici e distinzione hard/soft regression; (8) un agent skill che dice agli agenti cosa è Golden, cosa è legacy e cosa non può cambiare. Out of scope: Storybook, AestheticPolicyEngine, freeze di N componenti prima dell'audit, Figma come source of truth.

**Formulazione approvata (FROZEN):**
Il progetto RPG adotta il **Golden UI Foundation** come processo per determinare e congelare la qualità visiva canonica del gioco. Il percorso parte da: (1) **Target Freeze** condizionale su artefatti visivi reali in `Prismatic Wanderlust`, con approvazione del Director sui due pilastri (Wilderness/Empire) e del **Kill List**; (2) **Forensic UI/Art Audit** con criteri Visual Quality, DNA Fidelity, Identity, **Bible Compliance**, **Fidelity**, Reuse, Technical Health; (3) **Golden 0 — Trusted Component Forensics** sui 2–3 componenti top dell'audit, senza presupporre `PgCard` + `SlottedMedal`, mappati contro la **bibbia artistica** `src/docs/docs/plans/art_direction_plan.md` v0.10, la **costituzione del Visual Fidelity Lab** `src/ui/visualFidelityLab/fidelity-notes.md` e la **foundation recipe** `src/ui/visualFidelityLab/foundationRecipe.ts`; (4) **Visual DNA Contract** con token semantici, **Shared Material Recipe** (10 layer), **Silhouette-Adaptation Laws**, Material/Frame libraries, tipografia e `visualInvariants`; (5) **Golden Foundation** minimale, costruita solo ciò che serve alle 5 Golden Screens (World Map, Character, Settlement, Quest/Expedition, Event/Outcome); (6) **`/design-system`, `/visual-fidelity-lab` e `/design-vs-fidelity` come UI Labs**; (7) **baseline deterministiche Playwright** con metadati semantici e distinzione hard/soft regression; (8) **agent skill** per bloccare la deriva visiva. Esplicitamente out of scope: Storybook, `AestheticPolicyEngine`, freeze di un numero fisso di componenti prima dell'audit, Figma come source of truth, ricostruire `/visual-fidelity-lab` o `/design-vs-fidelity`. Il piano di riferimento è `.mw/runs/2026-08-17-golden-ui-foundation/golden_ui_foundation_plan_v2.md` e l'audit iniziale è `.mw/runs/2026-08-17-golden-ui-foundation/UI_AUDIT.md`.

**Still unresolved:**
- Quale skin diverrà ufficialmente canonical: `Prismatic Wanderlust` è candidata, ma deve essere approvata su artefatti visivi reali (Phase 0).
- Quali componenti entreranno nel Golden 0 dipende dai risultati dell'audit e dalla review visiva.
- Quale tool e soglia di diff per le baseline deterministiche.

---

## v9 — La geometria avversariale non deve essere amorfa

**Status:** `FROZEN`
**Date:** 2026-08-18
**Authorized by:** Fausto
**Reason:** avallo diretto in sessione — "Desiderata V9 = la geometria avversariale non deve essere per forza un goo o qualcosa di amorfo"

**Intento del Director:**
Il goo — blob scuro dai contorni organici e irregolari — non è l'unica forma
ammessa per rappresentare la difficoltà dello skill check, e non sta
funzionando. La geometria avversariale è libera di non essere amorfa.

**Formulazione approvata (FROZEN):**
La geometria avversariale dello skill check **non deve essere per forza un goo
o qualcosa di amorfo**.

**Cosa questo sblocca (e cosa no):**
Questo desiderata è un *permesso*, non un mandato. Congela la libertà di
abbandonare il blob organico; **non** congela quale metafora la sostituisca.
La ragnatela è la direzione che il Director ha scelto di prototipare per prima,
non la forma approvata in via definitiva.

**Contesto tecnico:**
- Il carattere amorfo del bordo nasce da una singola funzione, non dalla forma
  d'insieme: `gooBlob(θ) = 1 + 0.035·sin(3θ) + 0.022·sin(5θ) + 0.014·sin(7θ)`
  in `src/ui/idleVillage/components/destinyAstrolabeV7/engine.ts`
  (antenato: `blob(theta)` in `destinyAstrolabeV3/geometry.ts:97`). È quella
  somma di seni che fa sembrare arbitraria una soglia che è un numero preciso.
- La spec canonica dell'astrolabio **nomina il goo** in tre punti di
  `.mw/specs/destiny-astrolabe/prompt.md` (base, Empire, Wilderness) e nel
  `design-intent.md` ("failure is *in the goo*"). Sostituirlo richiede una
  revisione di quegli artefatti, che hanno provenance firmata.
- Perimetro di rischio: **V1 resta canonica** per il gameplay (desiderata v3,
  RICHIESTE Q5). V6/V7 sono laboratori: la sperimentazione non tocca le quest.

**Still unresolved:**
- Quale metafora vince: ragnatela, ombre portate, morsa, corrente. Solo la
  prima viene prototipata.
- Se la *contabilità* (unità discrete e numerabili) diventi un requisito
  vincolante o resti una proprietà desiderabile di una sola soluzione.
- Se il numero mostrato resti la formula `50+(stat−diff)` o diventi la
  probabilità geometrica reale (`geo.probPct`): divergono fino a −43.8 pt nel
  caso multi-skill, dove è la formula a sbagliare.
- Se e quando revisionare `prompt.md` / `design-intent.md` della spec
  canonica.

---

## v10 — Placeholder funzionali e skin-ready per scheda, equip, consumabili e skill equip

**Status:** `FROZEN`
**Date:** 2026-08-18
**Authorized by:** Fausto
**Reason:** avallo via "ok" in sessione

**Intento del Director:**
Costruire componenti placeholder per scheda del personaggio, meccanismo di equip, oggetti equippabili, oggetti consumabili e skill da equippare. I componenti devono essere già funzionali e collegati al sistema di skin, in modo che il lavoro Golden UI possa concentrarsi sull’estetica senza rifare i contratti.

**Formulazione proposta da Claude:**
Costruire un piano ombrello con sub-piani per: (1) scheda del personaggio, (2) meccanismo di equip, (3) oggetti equippabili, (4) oggetti consumabili, (5) skill da equippare. Ogni componente sarà un placeholder che implementa il contratto funzionale e l’integrazione con il sistema di skin (skinConfig, i18n, config-first, component reuse), in modo che il successivo lavoro Golden UI possa affinare la qualità visiva senza rifare i contratti.

**Formulazione approvata (FROZEN):**
Il progetto RPG costruisce un piano ombrello con sub-piani per scheda del personaggio, meccanismo di equip, oggetti equippabili, oggetti consumabili e skill da equippare. Ogni componente sarà un placeholder funzionalmente corretto e skin-wired, integrato con skinConfig, i18n, config-first e component reuse, in modo che il lavoro Golden UI possa affinare l’estetica senza rifare i contratti.
