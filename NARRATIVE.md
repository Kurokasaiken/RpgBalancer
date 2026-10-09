---
title: Narrative — ambientazione, struttura narrativa delle quest, storia emergente
type: canonical-draft
status: DRAFT — bozza di piano da migliorare (R-085); compila solo conoscenza
  esistente, le lacune sono marcate OPEN
updated: 2026-10-07
---

# NARRATIVE — ambientazione e struttura narrativa

Dominio: setting del mondo, struttura narrativa delle quest, semi narrativi,
storia emergente. Le **regole meccaniche** di risoluzione restano in
`QUEST_RULES.md`; qui vive il lato narrativo.

## 1. Ambientazione

- Avamposto di frontiera dove la civiltà incontra la wilderness; tono D&D
  classico (quest tipo «recupera l'artefatto / sconfiggi i banditi»).
  **STATUS:** `vigente` (visione). **SOURCE:** `GAMEPLAY_DESIGN.md` §1.
- Direzione visiva: **Prismatic Wanderlust** — Wilderness/Rude Beauty vs
  Empire/Solar Triumph; no grim/mud. **STATUS:** `vigente`.
  **SOURCE:** `DESIGN_PILLARS.md`, `GLOSSARY.md`.

## 2. Struttura narrativa della quest

- Catena canonica: `PARTY → QUEST → PHASE → SITUATION → APPROACH →
  CHECK/CHOICE → CONSEQUENCE → NEXT PHASE`; struttura S1: viaggio → scelta
  approccio → evento → scoperta/lore → evento/ricompensa → obiettivo →
  ritorno.
  **STATUS:** `vigente`. **SOURCE:** `QUEST_RULES.md` §1; `context/QUEST_S1_DESIGN.md`.
- La scelta d'approccio determina la competenza rilevante della fase
  successiva — la narrativa guida la meccanica, non è solo skin.
- Scenario di riferimento S1: «La cassa delle sementi» (goblins, torre,
  Passo del Corvo, mercante, prigioniero in gabbia, simbolo del corvo,
  lettera come seme narrativo) — `context/QUEST_S1_DESIGN.md`.
- Seconda quest authored: «Le Rovine sotto il Fiume» —
  `src/docs/docs/idle_village/quest_rovine_scenario_spec.md`.

## 3. Storia emergente

- Principio (research P15/P45, juice #5): il gioco ricorda gli esiti —
  «Tomas ferito nella spedizione alle rovine» → «Tomas ancora in
  infermeria» tre quest dopo. Una percentuale diventa una piccola storia
  del villaggio.
  **STATUS:** `vigente` come principio di design (RESEARCH → design).
  **SOURCE:** `context/QUEST_ECONOMY_NOTES.md` §juice;
  `context/QUEST_GAMEPLAY_SCIENCE.md`.
- Meccanismo target (ricerca R-090, 2026-10-06): emergenza =
  **ricombinazione di pezzi authored × memoria persistente ×
  scheduling** — non generazione di testo. Il "quest generator"
  genera *condizioni narrative*, non storie: `eventi + stato mondo +
  stato party + storia personaggi + pacing → prossimo evento rilevante
  → nuova memoria → eligibilità futura`.
  Ancore di memoria sui **personaggi** (aspects/history stile
  Wildermyth), callback con payoff = spacing × rarity × relevance;
  branch convergenti; check a 3 bande di esito; max ~1 fase extra per
  quest riservata a scoperte da esito eccezionale.
  **STATUS:** `research` — principi derivati da fonti esterne, non
  ratificati come regole.
  **SOURCE:** `context/QUEST_GAMEPLAY_SCIENCE.md` P48–P63 (bibliografia
  completa); `.mw/runs/20261006-emergent-narrative-research/`
  (materiale grezzo, broadcast chatgpt/grok/deepseek + ricerca propria).

## 4. Domande aperte

- **OPEN** — parameterizzazione narrativa delle quest oltre gli scenari
  authored (generazione/template): non formalizzata.
- **OPEN** — il seme narrativo della lettera/simbolo del corvo: destinazione
  non decisa (matrice S1 lo registra, nessuna quest successiva definita).
- **PROPOSTA (OPEN-014)** — architettura narrativa `Situation → Context →
  Approach → Narrative → Presentation`: asset per *situazione* (non per
  combinazione di stat), vocabolario situazioni/contesti, layer Quest
  Gameplay / Quest Narrative / World Narrative. Fonte: conversazione
  «Progettare quest strategiche», ingestion E-28/E-29/E-30.
- **PROPOSTA (orbita OPEN-014)** — *primitive dei beat* + *generatore a
  vincoli in 3 passi*, da «Sistema di quest cross direct» (share 6ac53990):
  - beat grammar (lista esemplare, non esaustiva): Obiettivo protetto, Tiro
    contrapposto, Meter di pressione, Tiro contrapposto ripetuto, Sequenza
    di condizioni, Scelta e Conseguenza — unità narrativo-meccaniche a
    livello *beat*, complementari ai `phase.type`;
  - separazione **struttura/flavor**: lo scheletro meccanico si riveste di
    un flavor (Horror Soprannaturale → spedizione in montagna, stessa
    macchina) — concretizza la separazione Situation/Context;
  - specchietto riassuntivo consolidato della conversazione di generazione:
    `context/QUEST_GENERATION_SPEC.md` (living doc);
  - pipeline: (1) *intenzione narrativa* (chi vuole cosa, chi si oppone,
    posta in gioco, info da scoprire) → (2) *catena causale* per primitiva
    (azioni che nascono dalle precedenti) → (3) *render* del grafo in testo
    riempiendo i ruoli con flavor. Non genera prosa: genera struttura
    causale — il segmento a monte che E-28 poi riveste.
  **STATUS:** `proposta` — candidata S5, non ratificata.
  **SOURCE:** `context/ingestions/2026-10-06-quest-cross-direct.md`.
- **REQUISITO Director (verbatim, da ratificare)** — il volume di quest
  risolte per giocatore sarà *decisamente alto*; attese centinaia di ore /
  molta rigiocabilità → le opzioni devono essere molto diverse **o almeno
  dare l'impressione di esserlo**. La varietà *percepita* è il KPI — coerente
  con P53 (il nemico è la riconoscibilità del template). Baseline citata:
  LoW «carta: paghi X → risolvi» come punto di partenza da elevare.
  **STATUS:** `proposta` (intent Director, non ancora in desiderata).
- **PROPOSTA Director — flavor via tag** — tag sulla quest
  creata/selezionata; ogni fase istanziata nel flavor del tag o di **tag
  adiacenti** (grafo di adiacenza). Es. tag «città» → fase
  preliminare = indagine sociale (voci, informatori; approccio discreto vs
  intimidatorio), non «tracce nella foresta». Realizza la separazione
  struttura/flavor: il tag *seleziona varianti di fase*, non è skin post-hoc.
  Usi delle adiacenze: fallback tecnico; contrasto motivato (il beat di
  complicazione «esce» dal dominante — città→docks); geografia del viaggio
  (il travel beat prende il tag del terreno attraversato); eco di memoria
  (l'adiacente preferito può dipendere da memoria, es. `rovine` se un eroe
  vi fu ferito). Vincolo: adiacenze *licenziate dalla premise* (`dominante +
  set ammesso`), non libere — altrimenti patchwork incoerente.
  Aperta: la tassonomia dei tag («mi devi aiutare tu»).
  **STATUS:** `proposta`. **SOURCE:** `context/ingestions/2026-10-06-quest-cross-direct.md` E-08.
- **PROPOSTA Director — registro mondo/sociale** — un registro di entità
  persistenti: zone, fazioni, personaggi importanti; relazioni tipate
  (debiti, alleanze, inimicizie, informatore-di); e **storia per personaggio**
  (a quali quest ha partecipato, chi ha aiutato, chi gli deve qualcosa).
  Ruolo nel sistema: è il substrato del layer *World Narrative* (E-30) e il
  *casting pool* del passo 1 di E-03 — le premise non inventano antagonisti,
  li *castano* dal registro. «Chi gli deve qualcosa» = qualità/debito
  interrogabile da contenuto futuro (failbetter-style). Ancora memoria sui
  personaggi, non flag mondiali (P50). Vincolo P49: costruirlo *guidato dai
  lettori* — entra solo ciò che un contenuto dichiara di leggere/scrivere;
  un registro esaustivo non interrogato è dead data.
  **STATUS:** `proposta` (sessione 2026-10-07, orbita OPEN-014; non
  ratificata). **SOURCE:** discussione Director post-ingestion share 6ac53990.
- **PROPOSTA Director — mondo persistente come fonte di quest:** le azioni
  della spedizione devono poter cambiare persone, fazioni e regioni in modo
  percepibile; le loro pressioni e i loro obiettivi possono a loro volta
  creare opportunità e crisi. Il mondo può muoversi anche fuori scena, ma
  «magari una volta al mese» non è una cadenza ratificata. Il commercio è
  un possibile feedback (prezzi/rotte), non un gestionale parallelo già
  approvato. Ambizione dichiarata: più run nello stesso mondo (5–10 run,
  potenzialmente ~200 anni), non durata o calendario implementativo fissato.
  **STATUS:** `proposta` / intento Director da esplorare (OPEN-016); la
  mancata risoluzione delle quest rimane separatamente aperta (OPEN-015).
  **SOURCE:** `context/ingestions/2026-10-07-registro-narrativo-del-mondo.md`
  E-05..E-08; `RICHIESTE.md` R-092/R-093.
- **PROPOSTA Director — memoria di personaggi e mondo leggibile:** esperienze
  e tratti possono evolvere probabilisticamente in titoli e reazioni; i
  tratti generano *scene*, gli hook possono generare *quest*, senza un
  secondo sistema di modificatori numerici per ogni etichetta. I tratti
  proposti sono famiglie funzionali con nomi placeholder; nemici/NPC
  ricorrenti possono acquisire ruoli ed equipaggiamento. Quando un'entità
  ritorna, il giocatore deve vedere in breve chi sia, da dove la conosca e
  perché sia cambiata, con dettaglio accessibile su richiesta; differenze
  fra fatti mondiali e ciò che il giocatore sa restano da progettare.
  Magie significative potrebbero essere trattate come item persistenti.
  **STATUS:** intenti/proposte Director, non modello dati ratificato.
  **SOURCE:** ingestion `2026-10-07-registro-narrativo-del-mondo.md`
  E-02..E-04/E-09/E-15 (OPEN-016).
- **PROPOSTA AI — causalità selettiva:** evento → causa/conseguenza
  persistente → cambiamento di stato/relazione → eventuale pattern e seme
  narrativo → presentazione nel momento rilevante. Un seme può restare
  dormiente o morire senza essere cancellato come fatto; tradimenti e
  redenzioni possono diventare transizioni eleggibili per contesto, non
  swap arbitrari. Configurazioni iniziali diverse e continuità cross-run
  sono possibilità da validare, non sistemi già disegnati. La bozza di
  macro-piano ChatGPT (E-16) **non è un piano approvato**: la sequenza
  v24/PLAN-019 S1–S5 continua a prevalere. La lista AI delle cose
  «scartate» non era il piano originale (correzione Director E-14).
  **STATUS:** `proposta`, OPEN-016; **SOURCE:** ingestion
  `2026-10-07-registro-narrativo-del-mondo.md` E-10..E-18.
- **VINCOLO operativo (proposta):** i semi narrativi si appoggiano a
  `LoreDropService`/`loreDropStore` esistente — non creare un sistema lore
  parallelo (ingestion E-31).

## 5. Mappa delle meccaniche narrative

Mappa d'intenti approvata dal Director (2026-10-07, discussione post-ingestion
share 6ac63cac): **non** è una spec esecutiva. Ogni meccanica entra nel piano
operativo solo quando il suo stadio PLAN-019 viene battezzato; fino ad allora
questa sezione serve a non perdere il quadro d'insieme e le dipendenze.
Le frecce `→` indicano *abilita / alimenta / presuppone*.

### 5.1 Catena principale

```
R-092 conseguenze universali
  → M-02 registro mondo minimo (dove le conseguenze atterrano)
    → M-03 riconoscimento/provenance (il giocatore legge il cambiamento)
      → M-04 memoria personaggi (tratti, titoli, scene, hook)
        → M-05 evoluzione offscreen (pressioni che generano occasioni)
          → M-07 composizione quest (casting pool + vincoli dal mondo)
            → M-11 legacy cross-run
```

`M-08` (separazione struttura/flavor) e `M-09` (varietà percepita) sono
trasversali: modulano *come* M-07 produce contenuto, non *quando* entra.
`M-10` (semi su `LoreDropService`) è substrato tecnico già esistente.

### 5.2 Schede

**M-01 — Conseguenze universali delle quest (R-092)**
- *Cosa è:* ogni quest produce conseguenze se risolta, per come è risolta, e
  se non risolta. Con R-094 («riesci sempre, varia quanto paghi» — una delle
  strutture di rischio possibili, non universale) le conseguenze sono anche la
  superficie su cui si modula il costo pagato.
- *Perché:* intento Director verbatim; senza conseguenze la memoria del mondo
  non ha nulla da ricordare.
- *Influenza:* tutta la catena. Bloccata da OPEN-015 (trigger «non risolta»).
- *Stadio:* S2. *Stato:* `vigente` come principio.

**M-02 — Registro mondo minimo**
- *Cosa è:* entità persistenti (personaggi, fazioni, regioni) + relazioni
  tipate (debiti, alleanze, inimicizie) + log eventi con provenance.
- *Perché:* le conseguenze S2 devono atterrare in uno stato reale, non in
  flag sparsi; il gate S4 chiede che agiscano sul villaggio. Narrowing
  Director 2026-10-07: in S2 basta coprire la *singola* quest di riferimento.
- *Influenza:* abilita M-03, M-04, M-07 (casting pool), M-11.
- *Dipende da:* M-01; dal motore canonico scelto nello spike S2 (D-2).
- *Vincolo P49:* entra solo ciò che un contenuto dichiara di leggere/scrivere.
- *Fonti:* E-01 (casting pool/memoria interrogabile), §4 «registro
  mondo/sociale».
- *Stadio:* S2. *Stato:* `proposta`.

**M-03 — Riconoscimento e provenance**
- *Cosa è:* quando un'entità ritorna, il giocatore vede in breve chi è, da
  dove la conosce e perché è cambiata; dettaglio su richiesta. Include la
  spiegazione dei **bonus/malus meccanici** dovuti alle relazioni (es. sconto
  da un alleato, prezzo maggiorato da un nemico — E-09).
- *Perché:* una conseguenza che il giocatore non riconosce non esiste — è il
  gate S4 («visibile e agisce», non solo persistita).
- *Influenza:* rende leggibile M-02; è il primo payoff visibile della catena.
- *Dipende da:* M-02 (log con provenance); aperta la distinzione fatti
  mondiali / conoscenza del giocatore / voci.
- *Criterio di validazione (E-18):* il giocatore riconosce **spontaneamente**
  un'entità ricorrente e sa spiegare perché è cambiata — senza tooltip
  forzati. Candidato a metrica di gate S4.
- *Fonti:* E-06 (quest percepite come modifiche al mondo), E-09.
- *Stadio:* S4. *Stato:* `proposta`.

**M-04 — Memoria di personaggi (tratti → scene/hook)**
- *Cosa è:* esperienze e tratti che evolvono in titoli, reazioni, tendenze;
  i tratti generano scene, gli hook possono generare quest. Nemici ricorrenti
  acquisiscono ruoli ed equipaggiamento.
- *Perché:* ancora memoria sui personaggi (P50), non flag mondiali; evita la
  matrice di modificatori numerici per ogni etichetta (rifiutata dal
  Director). «Tomas ferito» → «Tomas ancora in infermeria» tre quest dopo.
  La carriera dei ricorrenti è analoga al **Trial by Fire** dei residenti —
  già considerato come intento (`.mw/desiderata.md` v12, OPEN-005), non lo
  reinventa: la stessa meccanica di crescita-applicata-agli-NPC-ostili.
- *Influenza:* alimenta la varietà percepita (M-09) e il casting di M-07.
- *Dipende da:* M-02; i nomi dei tratti sono placeholder funzionali.
- *Stadio:* S4/S5. *Stato:* `proposta`.

**M-05 — Evoluzione offscreen del mondo**
- *Cosa è:* fazioni/regioni che si muovono fuori scena; pressioni (famine,
  banditismo, rotte interrotte) che creano opportunità e crisi giocabili.
- *Perché:* intento Director — il mondo come *fonte* di quest, non solo
  sfondo. Cadenza «magari una volta al mese» citata ma non ratificata.
  Proposta di granularità: check offscreen con **bande di esito**
  `BigWin / Win / Almost / Fail / EpicFail` (E-07) — ogni pressione del mondo
  tira un esito a bande, come i check quest, non una simulazione per-persona.
- *Influenza:* genera input per M-07; rischio principale di scope.
  Con E-13 forma il meccanismo «pressioni/obiettivi → pattern → story seed».
- *Dipende da:* M-02, M-04; NON da confondere con il tempo continuo delle
  quest né con un gestionale parallelo (commercio = feedback, M-06).
- *Stadio:* S5+. *Stato:* `proposta`.

**M-06 — Commercio come feedback**
- *Cosa è:* prezzi/rotte che reagiscono alle quest e alle pressioni del mondo.
- *Perché:* canale per *percepire* le conseguenze; esplicitamente **non** un
  gestionale parallelo.
- *Stadio:* S5+. *Stato:* `proposta`, subordinata a M-05.

**M-07 — Composizione/generazione quest**
- *Cosa è:* primitive dei beat + generatore a vincoli in 3 passi (intenzione
  narrativa → catena causale → render) + flavor via tag con adiacenze
  licenziate dalla premise.
- *Perché:* requisito volume — centinaia di ore, varietà *percepita* come KPI
  (P53: il nemico è la riconoscibilità del template).
- *Influenza:* è il consumatore finale di M-02/M-04/M-05 — le premise
  *castano* dal registro invece di inventare antagonisti.
- *Dipende da:* «definizione di buona quest» (artefatto finale S4) — v24:
  «le regole di generazione si subordinano ai pattern di interesse scoperti».
- *Stadio:* S5. *Stato:* `proposta` (OPEN-014).

**M-08 — Separazione struttura/flavor (`Situation → Context → Approach →
Narrative → Presentation`)**
- *Cosa è:* asset e scrittura per *situazione*, non per combinazione di stat;
  layer Quest Gameplay / Quest Narrative / World Narrative.
- *Raffinato dal probe imprints (2026-10-07):* il tag non è un aggettivo ma
  un **domain kit** — creature ammissibili, ruoli sociali esistenti nel
  dominio, luoghi, oggetti, regole di coerenza (insight Director). Le
  function spec dei beat validano la funzione narrativa; il kit valida la
  coerenza diegetica. La distanza tra tag va misurata su fisica e struttura
  sociale del dominio, non sui nomi.
- *Perché:* permette a una macchina sola di produrre quest percepite diverse
  (Horror Soprannaturale → spedizione in montagna, stesso scheletro).
- *Influenza:* modula M-07; orienta la art pipeline (asset per situazione).
- *Stadio:* S5, con ricadute sulla pipeline asset. *Stato:* `proposta`
  (OPEN-014).

**M-09 — Varietà percepita (KPI trasversale)**
- *Cosa è:* non una meccanica ma il criterio di accettazione di M-07/M-08 —
  «opzioni molto diverse o almeno con l'impressione di esserlo».
- *Perché:* verbatim Director; il volume di quest rende il template
  riconoscibile il nemico principale.
- *Stadio:* criterio di gate S5. *Stato:* `proposta` (intent Director).

**M-10 — Semi narrativi su `LoreDropService`**
- *Cosa è:* gli hook/semi si appoggiano al servizio lore esistente.
- *Perché:* vincolo operativo — non creare un secondo sistema lore parallelo.
- *Stadio:* da S4. *Stato:* `proposta` (vincolo).

**M-11 — Legacy cross-run**
- *Cosa è:* lo stesso mondo persiste tra più run (5–10 run, ~200 anni
  citati); configurazioni iniziali possono differire — parametri di partenza
  proposti: popolazioni, risorse, ruoli, caratteri, religioni (E-12,
  «teoricamente potremmo»). La memoria cross-run copre **eroi, oggetti,
  magie ed eventi straordinari**: una magia significativa può diventare
  entità persistente trattata orientativamente come *item* (E-15 — non
  tutte le spell, tassonomia aperta).
- *Perché:* ambizione Director — mondi che ricordano, non run che si
  resettano. La cosa più costosa e la più dipendente da tutto il resto.
- *Dipende da:* M-02→M-05; nessun design prima di S5.
- *Stadio:* post-S5. *Stato:* `intento` (ambizione, non design).

**M-13 — Impronte narrative (archetipi da storie famose)**
- *Cosa è:* libreria curata di **scheletri narrativi astratti** derivati da
  storie famose (libri fantasy, videogiochi): non le storie come template
  riconoscibili, ma i loro *pattern causali/emotivi decontestualizzati* —
  grafo di beat + vettore emotivo + nodo di conseguenza sistemica, senza
  nomi propri (proposta Director 2026-10-08; raffinata in delibera
  `.mw/runs/20261008-story-archetype-imprints/` come «De-contextualized
  Dramatic Patterns»).
- *Perché:* il Director vuole componente autoriale oltre al caso puro; gli
  archetipi sono pezzi authored **pre-validati** da selezione culturale, il
  modo più economico di riempire la libreria che P48 richiede. Esempio
  astratto: «test di lealtà» (NPC A chiede di danneggiare B, B rivela che A
  mente, scelta potere-vs-verità, conseguenza sul mondo).
- *Influenza:* alimenta il passo 1 di M-07 (l'intenzione narrativa viene
  *seedata* dall'archetipo); distinzione chiave emersa in delibera — il
  riconoscimento **strutturale** è accettabile, anzi desiderabile (risonanza
  mitica: il giocatore ama riconoscere «i sette samurai»), quello di
  **superficie** va combattuto (P53): ruoli rinominati diegeticamente dal
  registro («il Custode della Ruggine», non «il fabbro»), filtro anti-cliché
  su titoli e nomi.
- *Dipende da:* M-02 (entità reali istanziano i ruoli astratti — casting),
  M-08 (tag/flavor vestono lo scheletro), M-09 (metrica: la varietà si
  misura su conseguenze e superficie, non sulla struttura).
- *Cautele dalla delibera (da filtrare):* i numeri (15-20 archetipi,
  rotazione, %) sono proposte non decise; «LLM renderizza il testo» è
  compatibile solo con l'uso-presentazione, non con verità di mondo.
- *Stadio:* S5. *Stato:* `proposta` Director.

**M-12 — Causalità selettiva (semi dormienti/morti/consumati)**
- *Cosa è:* evento → conseguenza persistente → cambio di stato → eventuale
  seme narrativo → presentazione rilevante; un seme può morire come
  opportunità senza essere cancellato come fatto. Criterio di scheduling:
  la domanda **«perché ora?»** — un seme si presenta quando il contesto lo
  rende rilevante, non a caso (E-10); context card breve al momento del
  ritorno (ponte con M-03).
- *Perché:* proposta AI — evita che ogni evento diventi rumore; i tradimenti
  diventano transizioni *eleggibili per contesto*, non swap arbitrari
  (E-11: rami narrativi irrilevanti diventano dormienti, non cancellati).
- *Stadio:* S5+. *Stato:* `proposta AI`, da validare.

### 5.3 Regole di lettura

- Nessuna voce in questa mappa modifica `.mw/desiderata.md`, `CANON.md` o
  PLAN-019: le dipendenze indicano *quando* progettare, non autorizzano a
  farlo.
- Se uno stadio fallisce il gate (es. S2 rientra su regole), le meccaniche
  downstream restano in mappa ma non si progettano.
- Nuove meccaniche narrative entrano qui prima di entrare in qualsiasi piano.

## Provenance

Compilato 2026-10-05 (R-085) da `GAMEPLAY_DESIGN.md`, `DESIGN_PILLARS.md`,
`QUEST_RULES.md` §1, `context/QUEST_S1_DESIGN.md`,
`context/QUEST_ECONOMY_NOTES.md`, `context/QUEST_GAMEPLAY_SCIENCE.md`.
