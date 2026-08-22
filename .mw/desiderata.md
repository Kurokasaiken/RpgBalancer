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

---

## v11 — Skill Check Web V1: la rete lanciata, e il fallimento critico messo in scena

**Status:** `FROZEN`
**Date:** 2026-08-18
**Authorized by:** Fausto
**Reason:** decisioni date esplicitamente in sessione, una per una

**Intento del Director:**
Uno *skill check cinematografico*, non un astrolabio. L'avversario è una
ragnatela — scelta contro il rovereto dopo test di fattibilità comparato. Il
fallimento critico vale il 5%, **viene dato** dal sistema, e va **messo in
scena**, non modellato.

**Decisioni ferme (ognuna data dal Director, non dedotta):**

1. **Nome:** `skill-check-web-v1` (rotta, cartella `src/ui/skillCheckWebV1/`,
   componente `SkillCheckWebV1`). Scelto per non collidere con
   `/minimal-skillcheck` e `/minimal-skillcheck-v6` già esistenti.
2. **Metafora:** ragnatela. Il rovereto è stato prototipato e scartato: leggeva
   come ghirlanda decorativa invece che come minaccia — l'opposto del motivo per
   cui era stato proposto.
3. **Il ragno NON esiste.** Corollario dato dal Director: i fili non si posano
   uno per volta, la rete **viene lanciata** come evento unico. Il beat 1 non è
   tessitura, è **lancio**.
4. **I raggi sono addolciti verso il BASSO** in coordinate mondo, non
   perpendicolarmente al raggio. Argomento del Director: se piegano verso il
   basso non può nascere una spirale, perché metà delle linee curverebbe verso
   l'alto. Verificato: regge anche a curvatura estrema.
5. **Il bordo** è una curva liscia a fascio doppio con nodi di ancoraggio.
   Approvato dopo tre tentativi falliti (cerchio con tremolio, esagono,
   tridecagono): il difetto comune erano le faccette.
6. **Le punte della stella BUCANO il telaio.** Dentro il muro la stella è piena
   (regione di successo vera, dove la pallina può fermarsi); fuori resta solo il
   contorno, perché la pallina non esce dall'arena e una campitura piena
   promette un successo non ottenibile.
7. **Fallimento critico: 5%, viene dato, NON è una regione geometrica.**
   Non c'è vittoria automatica: il fallimento critico esiste sempre. Ma non si
   modella una probabilità nel board — l'esito è scelto a monte e il board lo
   mette in scena. Messa in scena approvata: la pallina si è **già fermata sulla
   stella** e un filo superstite la agguanta. Sapore X-COM: la drammaturgia sta
   nella sorpresa dopo il sollievo, non in una meccanica di dadi.

**Cosa questo NON autorizza:**
- Nessun tetto geometrico, anello o sacca dedicati al fallimento critico. Il
  tetto alle valli è stato implementato, misurato (area 0.13–0.53%, sacca larga
  3px) e **smontato**: un tetto sul raggio non può garantire un'area.
- Nessuna vittoria automatica, in nessuna forma.
- La parola "spirale" non descrive niente di questa geometria: le trasversali
  sono **trame**, corde fra raggi consecutivi. Il lessico è quello della
  tessitura (ordito / trame), non della biologia.

**Invarianti verificati che non possono rompersi:**
- punte della stella esattamente a `rOf(stat)` — errore misurato `0.0e+0`
- parità = 50.09% dell'area a **ogni** livello (`VALLEY_F = 0.3675`),
  scale-invariante da 20/20 a 95/95
- graduazione **equal-area** (`rim·√(k/N)`): lettura esatta, scarto `0.000`. La
  graduazione lineare — quella di V6/V7 oggi — sbaglia fino a **+12.5 pt** e fa
  leggere tre numeri diversi alle tre parità
- la graduazione vive sul **board** (scala 1..99), non sulla tela: la tela porta
  il carattere, il board porta la misura

**Still unresolved:**
- Il beat del fallimento critico è in progettazione verificata; la messa in
  scena precisa (tempi, meccanismo del filo, cosa non deve telegrafare) non è
  ancora chiusa.
- Il movimento del lancio non è mai stato giudicato: il pane del browser congela
  `requestAnimationFrame`, quindi solo il Director può approvarlo.
- La rete quasi scompare a stat molto alta. Con il crit-fail non geometrico non è
  più un problema di correttezza, ma resta una scelta di regia aperta.
- Se le tacche di `drawAxisRig` in V6/V7 vadano corrette a equal-area: per la
  stessa ragione dimostrata qui, **la scala attuale di V6/V7 è fuorviante**.

---

## v12 — Strato punti-stat, Trial by Fire, consumabili e authoring delle attivita'

**Status:** `FROZEN`
**Date:** 2026-08-20
**Authorized by:** Fausto
**Reason:** "approvo cn queste modifiche" — avallo esplicito sulla candidata rev. 2 presentata in sessione, con le correzioni del turno finale (config-first, "pool" invece di "DB")

**Relazione con v10:** v10 congela i *contratti dei componenti placeholder* (scheda, equip,
equippabili, consumabili, skill) realizzati in `src/pages/hero-components-lab.tsx`. v12 sta
**sopra** v10: definisce da dove vengono i numeri, come i consumabili entrano ed escono dalle
attivita', e come le attivita' si autorano. Non rimpiazza v10, la alimenta.

### Vincolo trasversale (ribadito dal Director, prevale su tutto il resto)

**Config-first, sempre. Tutti i numeri e i valori nominati qui sono il DEFAULT ATTUALE, non
valori hardcoded.** Vivono in config modules validati Zod e consumati read-only da UI/logica
(`.windsurf/rules/philosophy.md` §Config-first). Ogni numero in questo documento va letto come
"il default che stiamo usando adesso", mai come costante. Corollario: **single source of truth**
— ogni concern ha esattamente una casa canonica, la duplicazione e' un bug.

### User-stated

- Le stat vivono su una **scala a punti** con **modificatori di peso** per stat:
  HP x4 (-20 punti = -80 HP; base 200 -> 120), TxC ~x1 su base 50% +25% se armato
  (-20 punti -> 55% di colpire). Default attuali, non hardcoded.
- Ordini di grandezza a occhio: eroi fino a ~+25, PG normali fino a ~+5, negativi fino a ~-20.
  **Non stabiliti a tavolino: vanno decisi e implementati.** Requisito fermo: facilmente
  modificabili — cioe' config-first.
- Confine Balancer<->equip: il danno medio della scheda e' il danno di un'**arma media**;
  il +25% TxC e' l'essere armato.
- POI -> POI-detail -> **slot rack** -> slot. **Ogni slot ha modificatori specifici e ne
  conferisce.**
- Mandare **piu' PG degli obbligatori** deve poter dare: loot migliore, minor probabilita' di
  morte, o **spostare la probabilita' di morte da un PG a un altro** (PG deboli come carne da
  macello).
- **Trial by Fire**: un PG non-eroe che supera **3 quest** (default) con **deathChance >= 5%**
  (default) diventa un personaggio eroico; le sue stat aumentano vertiginosamente. Da
  implementare **e da documentare**.
- **Tutti possono equipaggiare tutto.** Il **numero di skill equipaggiabili dipende da un
  valore tipo Intelligenza** (o simile).
- Consumabili: modo per **mostrarli**, ottenerli da **quest o job di edifici speciali**,
  **mandarli** nelle quest e **usarli** nelle quest. Il consumo e' **scelta del giocatore**.
- Modo **carino, estetico** per creare e modificare le attivita' (quest/job), e per generarle
  **automaticamente**.
- Deve esistere comunque un **pool di quest prestabilite** (non un DB reale: nel progetto oggi
  non si usano DB — JSON o formato equivalente).
- Distinguere nome-del-valore da nome-della-stat (HP = valore, Costituzione = stat che lo
  calcola con un calcolo matematico): **riconosciuto ma rinviato**, non interessa ora.
- Dove serve un nome non ancora deciso, usare **nomi temporanei**.

### AI inference (marcata come tale)

- Il livello mancante e' uno **strato punti-stat sopra lo strato valori**, con tasso di cambio
  per stat. Il tasso di cambio e' il **peso HP_eq gia' esistente e gia' validato Monte Carlo**
  (`+10 Damage ~ +50 HP`, weight 5.0; TxC 2.0), non un secondo sistema parallelo.
- La formula del Director combacia con quella canonica: `hitChance = TxC + 50 - Evasion`
  (`src/docs/docs/BALANCING_SYSTEM.md`), con `BASELINE_STATS.txc = 25`. Il "+25% perche' armato"
  non e' un modificatore percentuale: e' il contributo `txc` dell'arma. `50 + 25 - 20 = 55`.
- Serve **un solo modello di contributo con provenance**
  (`base | equip | skill | consumable | slot | trial-by-fire`): le fonti nominate dal Director
  sono la stessa operazione sulla stessa valuta. E' cio' che rende vero il "facilmente
  modificabile" invece che dichiarato.
- `deathChance` va da **per-quest** (`questConfig.ts:58`, default 0.01-0.08) a **per-slot**:
  senza questo, "spostare la morte da un PG a un altro" non ha dove esistere. Prerequisito
  strutturale delle altre due parti.
- `survivalCount` esiste gia' su `ResidentState` (`testResidents.ts:26`) ed e' il contatore
  naturale di Trial by Fire, ma **non filtra per deathChance**: va filtrato o affiancato da un
  secondo contatore.
- Il confine PG<->equip e' **gia' dichiarato** nel Balancer dal flag `baseStat`:
  `hp, damage, txc, evasion, critChance, critMult` = pool umano; `ward, armor, resistance,
  armorPen, penPercent, lifesteal, regen` = solo equip/talenti/razze; `isDetrimental` per
  `failChance/failMult`. **Il caso non coperto e' l'equip che contribuisce a una `baseStat`**
  (l'arma su `txc`).
- `intelligence` esiste gia' in `defaultConfig.ts:292` ma **come requisito di archetipo, non
  come stat del residente**: per reggere gli slot skill va promossa a stat, oppure va scelto
  un altro valore.
- **Tre baseline HP in conflitto**: `BASELINE_STATS.hp = 100` (il bersaglio su cui sono stati
  tarati TUTTI i pesi Monte Carlo), 200 (l'umano base dichiarato dal Director), 280/210
  (`TEST_RESIDENTS`). Non e' estetica: se l'umano base ha 200 HP, ogni punto HP vale metta' in
  TTK e **tutti gli altri pesi sono fuori scala di 2x**. Una sola puo' essere l'unita' di
  misura; le altre due derivano da lei.
- Collisione lessicale: `heroic` oggi qualifica la **difficolta' quest**
  (`story|skirmish|dangerous|heroic`, soglie skill-check 30/45/60/75 in
  `questSkillCheckConfig.ts:24`), non lo stato del PG.
- Quest Chronicle: **il momento della scelta esiste gia'** come tipo di fase `timedChoice`
  (`types.ts:283`, colore skin in `QuestChronicle.tsx:66`). **Manca il consumabile**:
  `QuestPhaseRequirement` copre solo Trial / Combat / Work, e `PhaseOutcomeEffects` da'
  `resources / reputation / unlockActivityIds` — nessun oggetto d'inventario ne' in ingresso
  ne' in uscita. Va aggiunto un quarto tipo di requirement e un effetto di consumo.
- Il pool di quest prestabilite **esiste gia' come formato**: `QuestBlueprint` con `phases[]`,
  `requirements`, `successEffects/failureEffects`, `copy`, `riskProfile` (`types.ts:313`) e
  schema Zod in `quests/questBlueprints.schema.ts`. La domanda aperta non e' "dove sta il pool"
  ma **chi scrive dentro il pool**.
- Base UI: componenti v10 in `src/pages/hero-components-lab.tsx` (`EquipSlotRack`,
  `ConsumablePile`, `SkillDeck`, `PgDetailCard`, `EquippableItemCard`, `ItemDragToken`) piu'
  `ResidentSlotRack` sul lato POI.

### Nomi temporanei (autorizzati dal Director, sostituibili)

- `veteran` — il PG promosso da Trial by Fire (perche' `heroic` e' occupato dalla difficolta').
- `statPoints` — lo strato a punti (-20..+25 circa).
- `statScale` — il tasso di cambio punti -> valore di gioco (HP x4, TxC x1, ...).

### Emendamento rev.2 — 2026-08-21 (Director, stessa sessione)

Quattro decisioni che cambiano la direzione A come registrata sopra:

1. **Il confine non e' un oggetto separato: e' la TELA IN EVIDENZA.** Prima si disegna la
   ragnatela intera, poi si ripassa il giro di trame che passa dal muro. Le 24 barre viola
   tangenti sono smontate — un oggetto separato che segna un'area rischiava di diventare il
   secondo goo, che e' l'errore individuato dal Director sul goo stesso.
2. **Il confine deve avere la casualita' della tela**, e puo' cambiare forma a ogni tiro:
   «puo' cambiare, anzi e' meglio». Quindi nessun blocco del jitter degli angoli dei raggi.
3. **Le proporzioni non devono essere precise al 100%:** «noi sappiamo in anticipo dove si deve
   fermare la pallina». L'esito e' scelto a monte, quindi la geometria e' un'illustrazione
   accurata a qualche punto percentuale, non un calcolo vincolante.
4. **IL BORDO SPESSO E' IL FALLIMENTO CRITICO — «non e' solo estetica».** Questo **revoca** il
   divieto della v11 («nessun tetto geometrico, anello o sacca dedicati al fallimento
   critico»): il Director assegna esplicitamente al bordo il mestiere di portare il 5%.
   Nota di provenienza: il divieto della v11 nasceva da una misura sulle SACCHE nelle valli
   (0.13% d'area, larghe 3px) — un anello invece regge il numero, ed e' questo che rende
   praticabile la decisione nuova.
5. **«Non solo i nodi»:** la linea porta il confine, il nodo lo ancora. Entrambi.

**Meccanismo (AI inference, misurato):** una trama e' una corda fra due raggi consecutivi che
cede verso il mozzo, quindi fra la corda e il muro resta una LUNETTA. L'insieme delle lunette
e' la fascia di fallimento critico, con bordo interno = un filo vero della tela e bordo esterno
= il muro fisico (quindi la pallina rimbalza sul disegno, non contro il nulla).
L'area della fascia dipende **solo** da (raggi x cedimento) e **non** dalla difficolta' —
verificato identico a difficolta' 20, 50 e 80:

```
cedimento 0.17:  14 raggi -> 9.22%   18 -> 6.35%   22 -> 5.23%   26 -> 3.93%
spread fra 6 seed a 22 raggi: 4.73-5.26%
```

Quindi 22 raggi e il giro scalato per bisezione fino all'area esatta: **forma casuale, area
imposta**. Lo spessore e' irregolare per costruzione — spesso dove i raggi sono larghi, sottile
dove sono vicini — ed e' li' che si vede la casualita' della tela.

**Bug trovato e corretto di conseguenza:** `inEpic` usava una fascia di spessore FISSO
(`epicW = (R-3)*crit% = 17.9px`), che valeva il 31.9% dell'area a difficolta' 20, il 17.8% a 50,
il 12.4% a 80 e il 10.4% a 99 — invece del 5%, e variabile con la difficolta' mentre il
fallimento critico e' una costante di sistema. Ora la soglia e' proporzionale
(`muro * sqrt(1-crit/100)`), quindi l'area e' esattamente crit% a ogni difficolta'.

**Cosa resta disallineato, dichiarato:** la fascia DISEGNATA e' festonata, quella del VERDETTO
e' uniforme. Le due hanno la stessa area (5%) ma non la stessa forma. Unificarle vuol dire far
leggere al resolver il giro di trame del tiro corrente.

### Emendamento rev.3 — 2026-08-21 (Director, stessa sessione)

Decisioni sulla CATENA DI RISOLUZIONE, tutte User-stated:

1. **Si tirano ENTRAMBI i D100 prima di qualunque disegno**: esito *e*
   ferita/morte/niente. Non "prima l'esito, poi il rischio".
2. **Dalla coppia si ricava il punto d'atterraggio**, e lo si sa prima di animare.
3. **Prima dell'animazione si deve sapere che il board disegnato puo' soddisfare quel punto.**
4. **Se non lo puo', si cambia la GEOMETRIA** — non si riestrae il tiro. E basta cambiare
   «la posizione o l'inclinazione», non ridimensionare le bande.
5. **Il vincolo e' di INTERSEZIONE, non di evitamento.** Correzione esplicita di una mia
   inferenza sbagliata: avevo scritto che le crepe del terremoto non devono toccare il punto
   d'atterraggio. Falso — se l'esito e' `almost + ferita` **ci deve essere** un punto dove il
   terremoto della ferita tocca l'almost. La regione richiesta e'
   `regione(esito) ∩ zona raggiunta dal terremoto(rischio)`.
6. **Tiro unico**, e la pallina si ferma dove deve. Non nei paraggi.
7. **`almost` NON e' garantito**, puo' stare fuori dall'area. Garantiti sono solo il **5% di
   fallimento critico** e il **5% di successo critico**, ed entrambi sono **valori variabili**
   da config, non costanti.
8. **Il bordo ha priorita' SULLA stella:** «epicFail e' semplicemente il bordo come sempre».
   La tela sta sopra il fiore, quindi il bordo non viene mai coperto.
9. **Successo critico = 5% dell'area di successo** (stella ∩ arena), non dell'arena e non
   dell'unione.
10. **Messa in scena del secondo dado:** i due terremoti — fenditura che si chiude per la
    ferita, spacco che resta aperto per la morte.
11. **Impatto puntuale** al posto del flash bianco globale finale.

**AI inference (misurato) che sostiene il punto 4:** le trasformazioni ammesse per far esistere
l'intersezione devono **conservare la misura** — rotazione, fase, seed — perche' ridimensionare
una banda cambierebbe la probabilita', cioe' romperebbe il numero mostrato al giocatore per far
entrare un caso particolare. Rotazione e fase si': raggio e spessore no.

**AI inference (misurato) sul cap:** con `almost` non garantito l'unica banda incassata a
prescindere e' il 5% di fallimento critico, quindi il massimo successo mostrabile e' **95** —
cioe' quello che `shownProb` fa gia'. Il mio 90 di due turni prima assumeva `almost` garantito
ed era sbagliato.

### Still unresolved

- Di quanto salgono le stat alla promozione; se la promozione e' certa o probabilistica; se e'
  irreversibile e se un veteran puo' retrocedere.
- La formula esatta slot-skill <-> Intelligenza (o quale valore la governa).
- Percorso di authoring delle attivita': editor in-game, offline, o ibrido (JSON canonico +
  editor che esporta verso quel JSON + generatore che produce lo stesso formato). Rischio
  nominato: un editor che salva "per comodita'" in localStorage crea una quarta sorgente di
  verita'.
- Quale delle tre baseline HP e' l'unita' di misura canonica. **Vincolo fermo: una sola
  sorgente, le altre derivate.**
- Se il negativo (-20) e' raggiungibile per debuff, per nascita, o entrambi.
- Nomenclatura valore<->stat (HP / Costituzione): rinviata esplicitamente dal Director.

### Cosa v12 NON autorizza

- Nessun numero hardcoded in componenti o logica: tutti i default nominati qui vivono in config
  Zod-validata.
- Nessuna seconda sorgente di verita' per baseline, pesi, blueprint quest o inventario.
- Nessun secondo sistema di pesi parallelo a HP_eq.
- Nessuna implementazione prima che il planner abbia prodotto un piano: v12 e' una desiderata,
  non un mandato di esecuzione.

## v13 — Skill Check Web V1: contenimento e avversario sono due oggetti distinti

**Status:** `FROZEN`
**Date:** 2026-08-21
**Authorized by:** Fausto
**Reason:** "Aggiorna, scelgo A" — avallo esplicito sull'aggiornamento e scelta della
direzione A fra le tre presentate in sessione esplorativa.

**Relazione con v11:** v13 **sostituisce** i punti 3 e 6 di v11 e ne conserva tutto il resto.
v11 diceva che la tela *e'* il muro dell'arena e che la stella la strappa crescendo; v13 dice
che il muro e' un oggetto separato e che la tela resta intera. Gli invarianti numerici di v11
(punte a `rOf(stat)`, parita' = 50%, `VALLEY_F = 0.3675`) restano validi e non sono toccati —
e' proprio la separazione a garantirlo.

### User-stated (dato dal Director, non dedotto)

1. **Il contenimento e l'avversario sono due cose diverse.** La pallina deve rimbalzare
   *circa* dove stava il goo, ma quell'area si puo' rappresentare come si vuole.
2. **Quell'area deve mostrarsi DIVERSA** — magica, di un altro colore.
3. **Non un cerchio: LINEE** che stanno circa da quelle parti. La pallina puo' muoversi
   ovunque ma non superarle.
4. **La ragnatela va disegnata tutta, bella e intera.** Non si spacca.
5. **Ordine dei beat:** prima appare il fiore, poi le si butta addosso la tela.
6. **Il goo non esiste piu'.** Una cosa sola puo' essere l'avversario.
7. **La ghiera di bronzo resta un cerchio** al bordo del board.
8. **Direzione scelta: A — campo di contenimento a barre tangenti.** Scartate: B (confine che
   si rivela solo all'impatto) e C (confine come cambio di medium).

### AI inference (derivato, marcato come tale)

- **Le barre devono essere TANGENTI al muro, non corde.** Un poligono circoscritto tocca la
  curva in un punto per lato e sta fuori altrove: la pallina non puo' attraversare una barra,
  e la bacia dove la barra e' tangente. Con le corde succede l'opposto: la pallina passa oltre.
  Questa non e' una scelta estetica, e' la differenza fra funzionare e non funzionare.
- **La tangenza va calcolata sulla CURVA del muro, non su un cerchio.** Prima ipotesi mia,
  sbagliata: barre perpendicolari al bisettore del proprio arco. Misurata: errore massimo fino
  a 27-85px con difficolta' disomogenee, perche' `rCheckAt` varia in modo monotono attraverso
  ogni settore e una retta tangente a un cerchio non la segue. Tangente alla curva vera
  (includendo dr/dtheta) e poi spostata in fuori del minimo necessario:

  ```
  barre |  tutte 50 |  tutte 20 | misto 65/55/70/40/85 | estremo 10/90/15/85/20
     12 |   15.8px  |    8.5px  |        23.2px        |        33.9px
     16 |    9.0px  |    4.8px  |        13.9px        |        19.4px
     20 |    5.4px  |    2.9px  |         8.9px        |        12.4px
     26 |    3.6px  |    1.9px  |         5.5px        |         7.6px
  ```
  `errore` = quanto la pallina si ferma PRIMA di toccare la barra, nel punto peggiore.
  **20-26 barre tengono l'errore sotto la decina di pixel su tutto lo spazio delle
  difficolta'**, e con la pallina di raggio 9 e un alone di 8-10px sulla barra il residuo e'
  assorbito dall'alone.
- **Il muro fisico resta `rCheckAt` invariato**, quindi nessuna probabilita' si muove: la
  separazione fra contenimento e disegno costa **zero** sul bilanciamento. Per confronto,
  portare il muro sul festone della tela costerebbe la parita' da 50.00% a 54.32% e una
  ricalibrazione di `VALLEY_F` da 0.3675 a 0.2955 (misurato).
- **Gerarchia di valore:** fiore (premio) sopra tutto, tela (minaccia) al 70%, barre (regola)
  distinte per famiglia di materiale — la seta e' fredda e diffusa, la barra e' glifo compatto
  e saturo. Le barre vanno **sotto** la tela.
- **La barra reagisce solo quando viene invocata:** al bacio della pallina lampeggia. La regola
  si manifesta all'impatto, non prima.
- **La tela non racconta piu' le probabilita'.** Prima copriva la sola regione di fallimento,
  quindi la sua estensione *era* il rischio. Ora copre tutto e non si rompe: il numero lo
  dicono la stella e l'arena, e lo risolve la pallina.

### Cosa questo NON autorizza

- Nessuna ricalibrazione di `VALLEY_F` ne' spostamento del muro fisico: `rCheckAt` non si
  tocca.
- Nessuna regione geometrica per il fallimento critico — il divieto di v11 resta in vigore, e
  le barre non sono un'eccezione: non devono fare niente di speciale al crit-fail finche' il
  Director non lo chiede.
- Nessun ritorno del goo sotto altro nome: niente campiture d'area che leggano come sostanza.
- Nessuna barra come CORDA del muro (la pallina la attraverserebbe).

### Still unresolved

- ~~Estensione della tela~~ **RISOLTO 2026-08-21, Director:** «grande come il board e appesa
  alla ghiera coi tiranti». La tela copre tutto il board e i tiranti la legano alla ghiera, che
  diventa il ramo. Corollario: il muro dell'arena non e' piu' segnato dalla tela in nessun
  punto, quindi il campo a barre non e' un abbellimento — e' l'unica cosa che dice dove la
  pallina rimbalza. I due pezzi vanno insieme o il board mostra una pallina che sbatte
  contro il nulla.
- **Se le barre debbano portare la misura** (piu' fitte o piu' accese = difficolta' piu' alta)
  o se la misura resti al righello sul board.
- **Se la tela debba riavere un mestiere informativo** senza rompersi — l'ipotesi sul tavolo e'
  la densita' proporzionale alla difficolta'.
- **Il movimento non e' mai stato giudicato:** il pane del browser congela
  `requestAnimationFrame`, quindi lancio, arrivo della tela e rimbalzi li approva solo il
  Director.

---

## v14 — Skill Check: una materia sola, due stati. Il goo è la tela coagulata

**Status:** `FROZEN`
**Date:** 2026-08-22
**Authorized by:** Fausto
**Reason:** "approvo" esplicito sulla candidata presentata in sessione, dopo sei turni di
esplorazione e una ricerca sulla semiotica del segno visivo (Peirce: icona / indice / simbolo).

**Relazione con v13:** v14 **sostituisce** la direzione A della v13 (il confine come oggetto
separato, prima barre tangenti poi trame in evidenza). La catena di risoluzione di v13 rev.3
(PLAN-008: due D100 prima, intersezione, atterraggio garantito) **resta valida e non è toccata**.

### Il difetto che v14 corregge, e perché era strutturale

Sei tentativi hanno fallito sulla stessa domanda del Director — «si capisce a colpo d'occhio che
se cadi qui hai perso?» — e la causa non era il contrasto (misurato 9.1:1, tre volte la soglia)
né la palette. Era che **il fallimento non era una cosa**: era l'avanzo del fiore. Un avanzo non
ha nome, e ciò che non si può nominare non si può leggere.

In termini di Peirce si stavano costruendo **simboli** (forme che vanno spiegate) dove serviva un
**indice** (un segno che si legge per connessione fisica, senza convenzione). Le forme astratte
richiedono contesto e familiarità per significare: è l'opposto di «a colpo d'occhio».

### User-stated (parole del Director)

1. **La ragnatela è una materia sola, e un pezzo di essa si separa come GOO.** Il goo è il
   fallimento.
2. **La stella cambia forma** in funzione dello spazio che occuperebbe: tanto spazio → fiore
   (valli larghe); spazio medio → stella; tutto lo spazio → stella con **valli ancora più
   strette**.
3. Il fallimento è una **superficie forte**: se ti fermi lì, hai perso.
4. **La parte dove rimbalza la pallina deve essere materia negativa**, non chiara.
5. **Il cerchio attorno alla ragnatela va via.**
6. Una differenza di **30 punti** fra stat e difficoltà non può già rendere il fallimento
   illeggibile.
7. La stella a cinque punte ha senso **con cinque stat**; con altri numeri il Director è aperto
   a proposte.
8. La tela va **sotto** (disegnata prima), come nelle versioni precedenti.

### AI inference (derivata, marcata come tale)

- **La variabile è l'AMPIEZZA delle valli, non la profondità.** L'area costa larghezza ×
  profondità, la visibilità costa solo lunghezza: stringendo l'ampiezza il costo in area crolla e
  l'incisione resta lunga. Misurato su un'arena da 192 di raggio:

  ```
  successo 50% → valli 38.4°  (fiore)          fallimento come anello: 56px spalmati
  successo 70% → valli 23.0°  (stella)                                  31px
  successo 85% → valli 11.5°  (stella aguzza)                           15px
  successo 95% → valli  3.8°  (disco inciso)                             5px
  a 95%: cinque fessure larghe 13px alla bocca e LUNGHE 144px, contro un anello da 5px
  ```

  La progressione del punto 2 non è una scelta di stile: è la soluzione dell'equazione.
- Il tentativo precedente (variare la profondità a ampiezza fissa) porta necessariamente al
  cerchio — misurato: a 95/20 la matematica risponde «valli = 1.000», cioè un disco. È l'errore
  che v14 corregge.
- **Il goo deve circondare il muro per tutto il giro**, o il punto 4 non è garantito. La fascia
  costa il suo spessore in successo massimo mostrabile, e lo spessore minimo è il raggio della
  pallina (4.7% del raggio dell'arena → 9% dell'area → cap 91%).
- **Filamento → massa è un INDICE**, e per questo si legge senza legenda: è la ragione per cui
  questa direzione è più forte di spine (icona ambigua: già scartate come «ghirlanda
  decorativa») e di crepe (segno già occupato dal secondo dado).
- Le fessure devono **allargarsi verso la bocca**: a 95% sono larghe 13px e la pallina ha raggio
  9, quindi appoggiata dentro coprirebbe tutta la fessura e la lettura sarebbe ambigua.
- Il passaggio filamento→massa deve leggersi come **la stessa materia**: stessa famiglia di
  colore e filamenti annegati visibili nel goo, come insetti nella resina. Un goo a tinta piatta
  annulla il meccanismo.

### Cosa questo NON autorizza

- Nessun anello, cerchio o bordo continuo disegnato attorno alla tela (punto 5) — incluso il
  taglio della lastra di ghiaccio, che è il cerchio attualmente visibile.
- Nessuna variazione della sola profondità delle valli a ampiezza fissa: è la strada che porta al
  cerchio.
- Nessun secondo significato sulle crepe: restano la messa in scena del secondo dado.
- Nessun ritorno del fallimento come «avanzo» senza nome.

### Invarianti che restano

- punte della stella a `rOf(stat)`, errore misurato `0.0e+0`;
- `rCheckAt` è il muro fisico: non si tocca, o si muovono tutte le probabilità;
- catena di risoluzione di PLAN-008: due D100 prima del disegno, punto d'atterraggio
  nell'intersezione esito ∩ zona, traiettoria che termina sul punto, `spatialVerdict` asserzione;
- lo stream RNG della frattura resta salato e separato.

### Still unresolved

- se le fessure stanno **sugli assi** (una per skill, quindi «questa skill ti tradisce») o **fra
  gli assi** come le valli di oggi;
- **il colore della vittoria** — mai scelto. Candidata non confermata: smeraldo (praterie della
  bibbia, convenzione vivo/morto, non compete col bronzo);
- **quanto può scendere il successo massimo mostrabile** per pagare la fascia di goo al muro
  (il minimo derivato è 91%);
- la famiglia di forme per numeri di stat **diversi da cinque**;
- se `bg.png` desaturato c'entra ancora: il Director ha messo in dubbio la propria idea, quindi
  resta candidata aperta e non è un requisito.

---
