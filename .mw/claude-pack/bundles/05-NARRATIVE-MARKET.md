# 05-NARRATIVE-MARKET — bundle tematico (snapshot 2026-11-21)

File uniti per provider con cap documenti. Fonti:
- repo-snapshot/NARRATIVE.md
- repo-snapshot/COMPETITIVE_LANDSCAPE.md
- repo-snapshot/STEAM_PAGE_PLAN.md
- repo-snapshot/BUSINESS_PLAN.md

---

<!-- ===== repo-snapshot/NARRATIVE.md ===== -->

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
- *Prima compilazione (R-152, 2026-10-12):* IMPR-002 × kit palude gira
  come quest reale (`gen-impr002-palude`, profilo `gen`) — contratto di
  compilazione beat→nodi in `context/QUEST_IMPRINTS.md`. I flag B6 sono
  hook chain pronti per M-02/M-12, non ancora eseguiti.
- *Stadio:* S5. *Stato:* `proposta` Director (primo artefatto meccanico
  esistente).

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

<!-- ===== repo-snapshot/COMPETITIVE_LANDSCAPE.md ===== -->

---
title: Competitive Landscape — nicchia settlement & hero management
type: research
updated: 2026-10-11
---

# Competitive Landscape — mappa concettuale dei competitor

**Richiesta:** R-158 (lista iniziale del Director da ricerca ChatGPT: Super Fantasy Kingdom, A Hero's Rest, Fort Triumph, Crown of Greed, Majesty, dotAGE)
**Fonti:** Steam store pages, SteamRaw/SteamPulse/Steambase/SteamData.AI/Raijin/GamesBerry (stime VGI — non verificate salvo press release citate). Rilevazione 2026-10-11.
**Riferimento prezzo nostro:** Wanderlust: Triumph — $14.99 premium previsto (`context/STEAM_PAGE_PLAN.md` §0, priorità reputazione > ricavi).

---

## 1. La nicchia

I competitor non sono un genere Steam, ma un **intersezione di quattro assi**:

| Asse | Polo A | Polo B |
|---|---|---|
| **Cosa gestisci** | insediamento/edifici (village builder) | persone/eroi (hero/roster manager) |
| **Come comandi** | controllo diretto (ordini espliciti) | controllo indiretto (incentivi, slot, assegnazioni) |
| **Ritmo** | run/session-based (round, giorni, onde) | tempo continuo / idle |
| **Stakes** | cozy (niente perdite definitive) | consequenziale (morte, fallimento, upkeep) |

RPG Balancer / Wanderlust: Triumph si colloca all'incrocio: **insediamento + eroi, controllo indiretto via slot/carte, tempo continuo, stakes medi** (morte = scambio risorsa↔risorsa, decisione 2026-10-01). Nessun titolo osservato occupa esattamente questo quadrante — vedi §6.

---

## 2. Tabella master (dati di mercato)

| Titolo | Cluster | Listino $ | Prezzo tipico in saldo | Recensioni | Unità/ricavi stimati | Stato |
|---|---|---|---|---|---|---|
| **Super Fantasy Kingdom** | A | 19.99 *(lanciato a 14.99, alzato)* | 9.99 (-50%) | ~5.7k, 86% | ~350k unità, ~$3M gross | EA (ott 2025) |
| **Against the Storm** | A | 29.99 | 8.99 (-70%), tipico -50/67% | ~37.7k, 94-95% | **1M+ copie annunciate** (mar 2024), ~$30M+ | 1.0 (dic 2023) |
| **Thronefall** | A | 12.99 | 7.79 (-40%) | ~24k, 95-96% | ~0.8-1.5M, ~$9-10M | 1.0 (ott 2024) |
| **dotAGE** | A | 17.59 | 12.31 (-30%), sconti -15/25% | ~2.7k, 94-95% | ~centinaia di migliaia (solo dev) | 1.0 (ott 2023) |
| **Kingdom: Two Crowns** | A | 19.99 | 1.99 (-90%) | ~41k, 90% | ~0.8-1.7M | 2018 + DLC |
| **Majesty Gold HD** | B | 9.99 | 2.49 (-75%) | ~1k, 91-98% | classico 2000, evergreen | catalogo Paradox |
| **Crown of Greed** | B | 19.99 | 11.99 (-40%) | ~690, **59-60% Mixed** | n/d | 1.0 (mar 2026) |
| **Epic Tavern** | B/C | ~19.99 EA | — | ~345, **58%** | n/d | **EA abbandonato** (dal 2017) |
| **Loop Hero** | B | 14.99 | 2.99 (-80%) | ~34k, 93% | ~1-1.4M, $6-12M | 1.0 (mar 2021) |
| **A Hero's Rest** | C | 24.99 | rari sconti | ~175, **66-70% Mixed** | ~13k unità, ~$220k | 1.0 (ott 2024) |
| **Travellers Rest** | C | 17.99 | 13.49 (-25%) | ~17k, 88% | ~270k, ~$2.5M | EA (dal 2020!) |
| **Potion Craft** | C | 19.99 | 7.99 (-60%) | ~40-45k, 93% | ~1.9M, ~$18M | 1.0 (dic 2022) |
| **Darkest Dungeon** | D | 24.99 | 3.74 (-85%), min $1.99 | ~160k, 90-92% | ~3.4-4.8M, **$50-70M** | 2016 + DLC |
| **Battle Brothers** | D | 29.99 | 8.99 (-70%) | ~29k, 88% | ~0.5-1.3M, $11-28M | 2017 + DLC |
| **Fort Triumph** | D | 19.99 | 4.99 (-75%) | ~1k, 78-79% | ~30-47k | 1.0 (2020) |
| **M&B: Warband** | D | 19.99 | 4.99 (-75%) | ~170k, **97-98%** | 6.6-13.5M, **$80M+** | 2010, evergreen |
| **Hero's Hour** | B/D | 17.99 | 7.19 (-60%) | ~5.6k, 80% | n/d | 1.0 (2022) |
| **Norland** | B/A | 29.99 | 14.99 (-50%) | ~10k, 81-82% | ~430-600k, ~$8-11M | EA (lug 2024) |
| **Bellwright** | D/A | 29.99 | 19.79 (-34%) | ~21k, 79-80% | **1M+ annunciate** (mar 2025), ~$15-26M | EA (apr 2024) |
| **Melvor Idle** | E | 9.99 | 3.99 (-60%) | ~16k | ~0.5-0.9M + 3 DLC a $4.99 | 1.0 (2021) |
| **Rusty's Retirement** | E | 6.99 | 4.19 (-40%) | ~15k, **97%** | ~0.5M, ~$2.8M | 1.0 (apr 2024) |
| **Stacklands** | A | 7.99 | 3.99 (-50%) | ~30k, 96% | ~0.7-1.5M, $4-6M | 2022 + DLC |

**Cluster:** A = settlement builder a cicli · B = controllo indiretto eroi (linea Majesty) · C = economia al servizio degli avventurieri · D = company mgmt + contract/quest dispatch · E = idle/incrementale.

---

## 3. Cluster per cluster

### A — Settlement builder a cicli (il filone più venduto)

*Against the Storm, Super Fantasy Kingdom, Thronefall, dotAGE, Kingdom Two Crowns, Stacklands.*

È la fascia commerciale più forte della nicchia: run/settlement cycle + difesa o scadenza. AtS ha industrializzato il modello (update bisettimanali, 1M+ copie, Game Pass). SFK è il benchmark più vicino per **ciclo insediamento → difesa → meta-progressione**, ed è lo stesso publisher (Hooded Horse) — il che segnala che HH considera questo spazio un filone.

- **Fatto bene:** loop chiaro e spiegabile in una frase ("by day build, by night defend"); meta-progressione che rende la sconfitta produttiva; prezzi aggressivi in saldo che alimentano la long tail.
- **Errori:** late-game ripetitivo (pattern comune in Stacklands, Kingdom TC); SFK alza il listino in EA (14.99→19.99) — segnale che il valore percepito regge prezzi più alti di quanto si pensi.
- **Lezione per noi:** il nostro tempo continuo (R3.5) ci distingue dalla struttura a run — vendiamo *un mondo che continua*, non *una run che ricomincia*. La roguelite-ness del Director (D3: morte→bonus come meta-progressione) ci dà comunque il gancio "fallimento produttivo" senza copiare il ciclo day/night.

### B — Controllo indiretto degli eroi (la linea Majesty)

*Majesty (2000), Crown of Greed, Epic Tavern, Loop Hero (indiretto-via-placement), Hero's Hour.*

Il filone concettualmente più affine alla nostra idea ("gli agenti hanno volontà propria, tu incentivi") — ed è **un cimitero di esecuzioni mediocri**: Majesty resta insuperato da 25 anni. CoG ha copiato la formula senza aggiungere personalità né polish → 59%.

- **Fatto bene:** Loop Hero ha dimostrato che l'indiretto vende **se la gimmick è una sola e cristallina** (piazzi tasselli, l'eroe agisce da solo: 1M+ copie). Majesty: umorismo + personality degli eroi = ciò che i cloni non replicano.
- **Errori:** Epic Tavern — EA dal 2017 mai completato, 58%: il caso studio di abbandono. CoG — bug di pathing degli eroi (in un gioco a controllo indiretto un agente "stuck" rompe la fiducia), zero QoL (drag singolo per ogni bounty), zero flavor text → "Majesty senza l'anima".
- **Lezione per noi:** il controllo indiretto funziona solo se l'agente è **leggibile e affidabile** (il nostro slot/card system lo rende esplicito: il PG va dove lo metti, il rischio è nell'esito non nel pathing). E serve personalità — la nostra risposta è la cronaca/esiti narrativi (R2.5), non le voice-line.

### C — Economia al servizio degli avventurieri

*A Hero's Rest, Travellers Rest, Potion Craft, Shop Titans (F2P), Recettear, Crossroads Inn.*

Costruisci l'officina che equipaggia gli eroi di passaggio. Nicchia piccola: AHR è il confronto diretto e ha fatto flop commerciale (~13k unità).

- **Fatto bene:** Potion Craft — un *gesto* tattile unico (pestare, mescolare) porta una sim alchemica a 1.9M copie: la fisicità dell'interazione paga (coerente col nostro drag-to-slot).
- **Errori:** AHR — UI datata/confusa, tutorial che lascia appesi, bilanciamento risorse: 66% su 175 recensioni. Travellers Rest — in EA da 5 anni, drift d'identità: i giocatori lamentano la deriva da tavern-manager a farming sim generico.
- **Lezione per noi:** nel gestionale **la UI è il gioco** — il nostro investimento in kit/HUD/primitive è una scelta di posizionamento, non solo tecnica.

### D — Company mgmt + contract dispatch

*Darkest Dungeon, Battle Brothers, Fort Triumph, M&B Warband, Bellwright.*

Gestisci una compagnia (roster, upkeep, equip) e spedisci missioni. I due giganti (DD ~4M copie, Warband ~10M) dimostrano il ceiling; BB è il riferimento per "ogni decisione pesa" (Pillar 4).

- **Fatto bene:** DD — hamlet meta-layer + push-your-luck = la tensione gestionale perfetta; 10 anni di long tail a -85%. BB — contratti con rischio/prezzo leggibili prima dell'impegno. Warband — mondo con attori vivi = 15 anni di vita.
- **Errori:** BB — economia percepita "overly stingy", grind per restare a galla (88% ma recriminazione ricorrente). Fort Triumph — il combat XCOM mangia il management: 78%, nicchia piccola. Bellwright — crash/AI/balance in EA (79% nonostante 1M copie: il marketing ha battuto il polish).
- **Lezione per noi:** esiti a carte (Pillar 2) evitano il doppio strato combat-layer/gestione che appesantisce Fort Triumph e BB. Attenzione al feedback economico: rate visibili (R3.2) rispondono esattamente alla lamentela BB.

### E — Idle/incrementale puro

*Melvor Idle, Rusty's Retirement.*

Prova di mercato: l'idle premium vende a prezzo pieno ($9.99 → ~0.9M unità per Melvor, più 3 DLC a $4.99).

- **Fatto bene:** Rusty's — una gimmick di forma (occupa il bordo dello schermo) = 97% e ~0.5M copie su un solo dev. Melvor — profondità RuneScape-like in forma idle.
- **Errori:** entrambi pagano il late-game ripetitivo e la percezione "non è un vero gioco".
- **Lezione per noi:** il nostro tempo continuo prende il ritmo rilassato dell'idle ma abbiamo *decisioni rade e pesanti* (1-2/giorno). NB (correzione Director 2026-10-11): il gioco **non è un idle game** — niente progressione offline, posizionamento "second monitor" (`marketing/steam/claim-ledger.md`): siamo un "gestionale a tempo continuo con posta in gioco", non "idle con numeri che salgono".

---

## 4. Errori ricorrenti della nicchia (pattern trasversali)

| # | Errore | Casi | Antidoto già nostro |
|---|---|---|---|
| E1 | **EA abbandonato / silenzio** | Epic Tavern (morto), CoG ("no update since release"), Hero's Hour (update che *rimuovono* contenuto) | — |
| E2 | **Agente indiretto non affidabile** | CoG: eroi bloccati nel pathing | assegnazione esplicita via drag→slot |
| E3 | **UI/UX sotto-investita** | A Hero's Rest, CoG (no multi-drag, no hotkey, no flavor text) | kit HUD, primitives, guide UI |
| E4 | **Scope drift / identità diluita** | Travellers Rest (tavern→farm), Hero's Hour | pillar + anti-pillar documentati |
| E5 | **Combat layer che cannibalizza la gestione** | Fort Triumph, (parzialmente BB) | anti-pillar "combattimento animato" |
| E6 | **Economia opaca/tirchia** | BB (grind), AHR (bilanciamento) | rate visibili R3.2, preview R2.2 |
| E7 | **Late-game ripetitivo** | Stacklands, Rusty's, Potion Craft, Melvor | quest authored + cronaca + meta-progr. |
| E8 | **Bugs/performance in lancio** | Norland, Bellwright, CoG | budget effetti misurato (Tauri) |

**La singola lezione più forte:** nella nicchia il gap tra 95%+ e <70% di recensioni non è l'idea — è *polish + comunicazione + affidabilità degli agenti*. L'idea "Majesty-like" ha avuto almeno due tentativi falliti (Epic Tavern, CoG): non basta riempire lo spazio vuoto, serve eseguirlo meglio di come lo si promette.

## 5. Cosa hanno fatto bene i vincitori

- **Loop spiegabile in una frase** (AtS, SFK, Thronefall, Loop Hero) → il nostro equivalente dev'essere nel pitch Steam: "governi un villaggio dipinto che vive; gli eroi li mandi tu, gli esiti li decide la carta".
- **Una gimmick singola e visibile** (placement in Loop Hero, stack in Stacklands, bordo-schermo in Rusty's, pestello in Potion Craft) → la nostra: **il mondo dipinto che è l'interfaccia** + drag del medaglione sul POI.
- **Sconti aggressivi programmati** → tutti i long-tail seller hanno cadenza -50/80% entro 1-2 anni: pianificare la cadence sconti come parte del modello ricavi.
- **Publisher effect** — Hooded Horse compare su AtS, SFK, Norland, BB (re-release): in questa nicchia un publisher strategico moltiplica la reach (SFK ~350k in EA). Alternativa: capsule/trailer fortissimi + wishlist pre-lancio (STEAM_PAGE_PLAN).
- **Update cadenced in EA** — AtS bisettimanale: l'EA come servizio batte l'EA come cantiere.

---

## 6. Mappa di posizionamento

Assi: X = controllo diretto ↔ indiretto degli agenti · Y = run/session-based ↔ tempo continuo/idle.

```
                    TEMPO CONTINUO / IDLE
                            │
      Melvor ●   Rusty's ●  │   ● Norland        ● Travellers Rest
                            │       ● Potion Craft    ● dotAGE ~
                            │                    ◆ WANDERLUST: TRIUMPH
   DIRETTO  ◄───────────────┼────────────────►  INDIRETTO
                            │
      Bellwright ●  AtS ●   │   ● Super Fantasy K.    ● Crown of Greed
      DD ●   BB ●  Thronef. │      ● Stacklands       ● Majesty
      Fort Tr. ●  M&B ●     │      ● Loop Hero        ● Hero's Hour
                            │      ● Kingdom TC
                    RUN / ROUND-BASED
```

- Il quadrante **alto-destra** (indiretto + continuo) è quasi vuoto: lo abitano gestionali *senza* struttura a run. WT ci entra con più struttura di un idle (Melvor) e più respiro di un run-builder (SFK).
- **CoG** è il nostro specchio d'allarme: stesso quadrante concettuale, esecuzione debole → 59%. La differenza non è il *cosa* ma il *come*.
- Competitor più vicino per meccanica di superficie: **Super Fantasy Kingdom** (villaggio + difensori + roguelite). Differenza chiave: loro = run-based wave defense, noi = villaggio persistente + quest dispatch + mondo esplorabile.

## 7. White space dichiarato (la nostra differenziazione)

Nessun titolo osservato combina queste quattro cose — è la nostra claim unica:

1. **Il mondo dipinto vivo è l'interfaccia** (Pillar 1): lo stato si legge *sul* mondo, non in pannelli — nessun competitor usa la mappa come verbo primario (M&B/Warband ci va vicino ma è azione diretta, non gestionale).
2. **Eroi lenti a tempo continuo, assegnati via drag** su verbi-slot (Pillar 2 + 3): gestionale a tempo continuo "second monitor" — ritmo rilassato, decisioni pesanti (non idle: niente progressione offline).
3. **Quest = carte con esiti graduati e push-your-luck** (Pillar 2 + GOOD_QUEST_DEFINITION): i competitor risolvono le spedizioni con auto-resolve binario o combat layer separato.
4. **Upkeep + contratti leggibili** (Pillar 4, da BB/M&B): il layer gestionale ha "fondo" da sostenere, non solo assegnazioni one-shot.

**Cosa NON ci differenzia (onestà):** il fantasy medievale generico (tutti), il worker placement (dotAGE/LoW-digitale), la meta-progressione roguelite (SFK/AtS l'hanno già resa standard della nicchia — la nostra versione morte→bonus è allineata, non originale).

## 8. Implicazioni prezzo

| Fascia | Titoli | Lettura |
|---|---|---|
| $29.99 | AtS, Norland, BB, Bellwright | tier "deep strategy" — richiede produzione/publisher maggiori |
| $19.99–24.99 | SFK(ora), AHR, CoG, DD, Kingdom TC, Fort Tr., M&B WB, Potion Craft | tier standard; AHR dimostra che $24.99 con polish debole = Mixed |
| **$14.99–17.99** | **WT (target)**, Loop Hero, Travellers Rest, dotAGE, Hero's Hour | **sweet spot indie della nicchia** — giusto per un'EA/demo ricca |
| ≤$12.99 | Thronefall, Melvor, Stacklands, Rusty's | impulse tier — reach massima, margine basso |

- **$14.99 è coerente** con il posizionamento: sotto il tier "big strategy", sopra l'impulse — esattamente dove sono nati Loop Hero e SFK (lanciato a $14.99 e poi *alzato* a $19.99 in EA: segnale che la nicchia tollera l'aumento).
- **Cadence sconti realistica:** -20/30% nei primi mesi → -50% entro ~1 anno (pattern SFK/dotAGE/Thronefall). Evitare >-60% nel primo anno: la nicchia premia sconti frequenti ma non svalutanti.
- Le conversioni a prezzo pieno dipendono dal "polish percepito": AHR a $24.99 è il controesempio (66% Mixed anche per UI datata).

## 8.1 Prezzo al lancio vs listino attuale (aggiornamento 2026-10-11)

Il prezzo di lancio è quasi sempre **più basso** del listino attuale: nella nicchia il rialzo EA→1.0 (o dopo grossi update) è la norma, e lo sconto di lancio -10/15% nella prima settimana è pratica standard.

| Titolo | Prezzo lancio (e data) | Traiettoria |
|---|---|---|
| Super Fantasy Kingdom | **$14.99** EA (ott 2025) | → $19.99 *durante l'EA* |
| Against the Storm | **$19.99** EA (nov 2022), -15% prima settimana → $16.99 | → $29.99 alla 1.0 |
| Thronefall | **$6.99** EA (ago 2023), -10% → $6.29 | → **$12.99** alla 1.0 (quasi raddoppiato) |
| dotAGE | **$17.59** (ott 2023), -15% lancio → $14.95 | flat |
| Darkest Dungeon | **$19.99** EA (feb 2015) | → $24.99 alla 1.0 (-20% lancio → $19.99) |
| Battle Brothers | **$19.99** EA (apr 2015) | → $29.99 alla 1.0 (mar 2017) |
| Bellwright | **$29.99** EA (apr 2024), -10% lancio → $26.99 | flat finora (rialzi annunciati sui milestone) |
| Norland | **$29.99** EA (lug 2024) | flat |
| Potion Craft | **$14.99** EA (set 2021), -10% → $13.49 | → $19.99 alla 1.0 |
| Stacklands | **$4.99** (apr 2022) | → $7.99 (giu 2023, dopo 3 update di contenuto) |
| Loop Hero | **$14.99** (mar 2021), -15% lancio → $12.74 | flat |
| Travellers Rest | ~$14.99-17.99 EA (lug 2020, *da verificare*) | rialzo a 1.0 dichiarato sulla pagina |
| A Hero's Rest | **$24.99** EA (ott 2022), -10% → $22.49 | flat — **controesempio**: sovraprezzato al lancio vs polish percepito |
| Kingdom: Two Crowns | **$19.99** (dic 2018) | flat |
| Crown of Greed | **$19.99** (mar 2026) | flat |
| Melvor Idle | **$9.99** (nov 2020) | flat (+ DLC a $4.99) |
| Rusty's Retirement | **$6.99** (apr 2024) | flat |
| Fort Triumph | ~$19.99 EA (giu 2018, *da verificare*) | → $24.99 (2021) → sceso a $19.99 |
| Hero's Hour | **$17.99** (mar 2022) | flat |
| M&B: Warband | ~$30 retail (2010, *da verificare*) | → $19.99 stabile su Steam da anni |
| Epic Tavern | ~$19.99 EA (set 2017, *da verificare*) | — |

**Pattern osservati:**

- **P1 — Lancio basso + rialzo = strategia dominante dei successi.** AtS (+$10), DD (+$5), BB (+$10), Potion Craft (+$5), SFK (+$5 in EA), Stacklands (+$3), Thronefall (+$6, quasi ×2). Razionale dichiarato (BB, Travellers Rest): il prezzo EA basso *premia* gli early adopter, il rialzo alla 1.0 monetizza la prova di qualità accumulata — e genera un secondo spike di vendite "compra ora prima dell'aumento".
- **P2 — Sconto di lancio -10/15% prima settimana è lo standard** (AtS, DD 1.0, Bellwright, Potion Craft, Loop Hero, dotAGE, Thronefall). Converte i wishlist-accumulati e segnala "fiera" senza svalutare.
- **P3 — Flat solo da forti o da piccoli.** Tengono il prezzo invariato i $29.99 "premium" con produzione/publisher forti (Norland, Bellwright) e i prezzi impulso ≤$10 (Melvor, Rusty's).
- **P4 — Il controesempio:** A Hero's Rest ha lanciato **direttamente a $24.99** — il prezzo più alto della sua fascia a fronte di polish debole → 66% Mixed, ~13k copie. Lanciare alti senza prova di qualità è l'unico pattern chiaramente perdente.
- **P5 — Thronefall = il caso più estremo e più riuscito:** ingresso EA a $6.99 (impulse), 200k wishlist pre-lancio, rialzo a $12.99 alla 1.0 → ~1M+ copie. Il prezzo come *volano di adozione*, non come estrazione.

**Implicazione per Wanderlust: Triumph ($14.99):** il pattern P1 suggerirebbe lanciare la demo/EA **a $14.99 con -10% lancio ($13.49)** e tenere il rialzo a $19.99 come *evento* della 1.0 — esattamente il playbook Loop Hero/SFK. Alternativa Thronefall (ingresso ultra-basso) non si applica: punta a reach massima e presuppone update frequenti e wishlist già alte; WT ha dichiarato priorità reputazione > ricavi, che favorisce il prezzo onesto subito invece del volano.

**Decisione del Director (2026-10-11, R-160):** *"faremo come prezzi come hanno fatto tutti gli altri"* — ossia il **pattern di nicchia: ingresso basso + sconto di lancio + rialzo come evento** (EA→1.0 o milestone di contenuto). Con riserva dichiarata: *"non mi sento all'altezza di DD"* e *"magari facciamo la stessa strategia ma con meno spesa — vedremo"*. Decisione **provvisoria**, da confermare al lancio.
**Chiarimento Director (2026-10-12):** "meno spesa" = **stessa traiettoria a prezzi assoluti più bassi — orientativamente ~$9.99 al lancio → ~$14.99 alla 1.0**. Nota di contesto: il delta +50% è lo stesso di Against the Storm ($19.99→$29.99); la base $9.99 è il tier di Melvor Idle, sotto il lancio di SFK ($14.99) — posizionamento più aggressivo di quanto emerso in §8, coerente con priorità reputazione > ricavi e con il rischio controllato di un rialzo dichiarato fin da subito.

## 9. Secondo cerchio (da monitorare, non analizzati)

Shop Titans (F2P, modello ricavo diverso), Recettear (capostipite shop-for-heroes), Crossroads Inn, Dungeon Village 2 (Kairosoft, cozy town-for-heroes), Fabledom, The Wandering Village, Spellcaster University, Manor Lords (ceiling del fantasy-builder: contesto, non competitor), Frostpunk (tono sobrio già citato in R2.1), The King is Watching (stesso dev di Thronefall, nuovo).

## 10. Domande aperte per il Director

1. Il pitch "gestionale a tempo continuo con posta in gioco" / "second monitor" vs "roguelite village manager" — quale dei due va davanti nella comunicazione Steam? (D3 dice roguelite SÌ come tag, ma il posizionamento di nicchia suggerisce di vendere *prima* il mondo gestionale, la roguelite come bonus. NB: il gioco NON è idle — "idle con posta in gioco" era la formulazione pre-correzione Director 2026-10-11.)
2. Strategia publisher: contattare Hooded Horse (publisher di 4 titoli in questa mappa) è un'opzione da esplorare o si resta self-published?
3. Prezzo $14.99 confermato anche alla luce di SFK a $19.99? → **RISPOSTA Director (2026-10-11/12):** strategia = pattern di nicchia (ingresso basso + rialzo alla 1.0) ma a base più bassa: **orientativamente ~$9.99 lancio → ~$14.99 alla 1.0** — vedi §8.1 decisione R-160. Sostituisce il "$14.99 premium" ipotizzato in `STEAM_PAGE_PLAN.md` §0 (da rivedere in sede di prezzo).

---

## 11. La voce della community — concorrenti diretti (deep dive 2026-10-11)

Fonti: recensioni Steam negative/top-rated, Steam Community discussion, SWOT review-mining (SteamStat/SteamData/NiklasNotes), press. Le percentuali sono lo score Steam.

### Concorrenti diretti

**Super Fantasy Kingdom — 86-87%**
- *Lamentele:* "doesn't respect your time" — meta-progressione lenta e grind di meta-risorse (wall al ~day 20); "feels like an incremental, not a roguelite" — **mislabeling**: chi entra per run-variance trova run simili e RNG basso; automazione villaggio insufficiente (micromanagement tombe/storage); unità sbilanciate.
- *Apprezzato:* "pixel crack" — pixel art e loop day/night chiarissimi; dev attivo e reattivo; tanto contenuto già in EA; rapporto ore/prezzo ottimo ("$0.12 an hour").

**A Hero's Rest — 66-70%**
- *Lamentele:* UI datata/confusa (tema dominante); tutorial che "lascia appesi"; bilanciamento risorse; grafica sotto le aspettative per il prezzo; pochissime recensioni = problema di discovery oltre che di qualità.
- *Apprezzato:* il concetto stesso ("costruisci il mondo, non l'eroe"); profondità del crafting e della customizzazione.

**Crown of Greed — 59%**
- *Lamentele:* bug + zero update dal lancio ("4 months no updates"); **pathing/AI degli eroi inaffidabile — mortale in un gioco a controllo indiretto**; QoL mancanti (no multi-drag bounty, no hotkey, UI opaca); "Majesty senza l'anima" — no humor, no flavor text; diffidenza sul dev (storia di abbandoni).
- *Apprezzato:* il nucleo Majesty-like funziona ("tickles that part of my brain"); art direction.

**dotAGE — 94-95%**
- *Lamentele:* run troppo lunghe (5-10h+), mid-late game filler ("smash pass turn"); **esplosione di micromanagement**: riassegnare i pips dopo eventi = centinaia di click ("click 600 times to clear snow"); eventi RNG *unavoidable* senza recovery percepiti ingiusti; **snowball senza endgame** (vinto a turn ~150, giochi fino a 400+ — dev consapevole, lavora su trigger "Apocalypse" + soft constraints 100+ pop); freeze bug cronico; controlli Steam Deck.
- *Apprezzato:* profondità strategica da poche risorse e vincoli interdipendenti; "one more turn" itch; **dev solo iper-reattivo** (risponde ai bug report quasi subito — le recensioni negative si convertono); varietà elder/leader.

**Loop Hero — 93%**
- *Lamentele:* "doesn't respect my time" — grind wall a ~3-4h (edifici richiedono centinaia di frammenti, 1-2 per nemico → pacing crolla di colpo); loot RNG senza build-defining drops (solo stat); ottusità informativa (sistemi non spiegati — coerente col design criptico ma i giocatori lo pagano); ripetitività a novità esaurita.
- *Apprezzato:* la gimmick (placement + eroe autonomo), musica, atmosfera, scrittura cinica, meta-campo edificabile.

### Vicini rilevanti

**Against the Storm — 94-95%**
- *Lamentele (minoranza istruttiva):* "bait and switch" per chi cercava un city builder rilassante — è un survival a tempo; "difficulty adds tedium not fun" alle Prestige alte; percezione *luck > skill* (blueprint/perk/glade RNG) — ribattuta dalla community ("c'è contingency se giochi bene"); complessità alta.
- *Apprezzato:* la roguelite-ness stessa come anti-noia; adaptive play; update bisettimanali; "you lose nothing by losing" → learning loop.

**Travellers Rest — 88%**
- *Lamentele:* **scope drift** (tavern mgmt → farming sim; rimosso il sistema di cucina unico); EA da 5+ anni; bug/perf; ripetitività.
- *Apprezzato:* charm, rilassatezza, supporto continuativo.

**Norland — 82%**
- *Lamentele:* performance late-game (20fps, freeze con pop >70-100); steep learning curve, sistemi poco spiegati; mappa fissa (no random gen, lamentato).
- *Apprezzato:* politica/dinastie CK-like + colony sim; update frequenti.

**Battle Brothers — 88%**
- *Lamentele:* economia "overly stingy" → grind obbligato per restare a galla; ripetitività; crash.
- *Apprezzato:* "the mercenary game to beat"; contratti leggibili; brutality+permadeath equilibrata.

**Epic Tavern — 58%**
- *Lamentele:* **EA abbandonato** ("14 months" promessi → 8+ anni di silenzio, "consider it abandonware"); onboarding scarso, scelte skill-check indifferenziate, equip raffazzonato.
- *Apprezzato:* il concetto — i thread lamentano "this gem had so much potential": la domanda di mercato esiste ancora.

**Fort Triumph — 78-79%**
- *Lamentele:* il combat XCOM cannibalizza la gestione; poca rigiocabilità; nicchia stretta.
- *Apprezzato:* tattica physics-based, charm.

**Hero's Hour — 80%**
- *Lamentele:* AI che cheat plate (armate dal nulla); bug/hardlock; update che **rimuovono** contenuto (map editor); DLC prima di finire il base game.
- *Apprezzato:* love letter a HoMM; varietà fazioni; "easy version of HOMM".

**Thronefall — 96%**
- *Lamentele:* fps/lock su Deck, unit control, spike difficoltà late, boss finale.
- *Apprezzato:* minimalismo ("done by lunch"), polish, Steam Deck perfetto.

**Stacklands — 96%**
- *Lamentele:* fame di CPU/RAM, bug (coin loss), micromanagement card placement eccessivo, late-game ripetitivo.
- *Apprezzato:* la gimmick stack, semplicità, prezzo.

### Tassonomia delle lamentele del genere (i "veri" nemici)

| # | Lamentela | Dove ricorre | Cosa significa per noi |
|---|---|---|---|
| C1 | **"Doesn't respect my time"** — grind wall, run troppo lunghe, meta lenta | SFK, Loop Hero, dotAGE | Il genere perdona la difficoltà, non il tempo sprecato. Nostro scudo: tempo continuo + decisioni rade + day-clock che mostra il futuro (R1.2). Rischio da non scambiare: "rilassato" ≠ "lento senza payoff". |
| C2 | **Micromanagement esplosivo nel late-game** | dotAGE (600 click), SFK, Stacklands | Cap peasants/slot (R3.1) limita i click *by design*; batch/re-assegnazioni vanno previste come feature, non ripensate dopo. |
| C3 | **"Luck not skill"** — RNG senza mitigazione visibile | dotAGE (eventi unavoidable), AtS (blueprint), Loop Hero (loot) | Preview probabilità (R2.2) + esiti graduati + push-your-luck = agency sulla fortuna. AtS si salva perché "perdi ma impari": il fallimento deve insegnare, non solo punire. |
| C4 | **Snowball senza endgame** | dotAGE, Loop Hero | Il giocatore bravo condannato alla noia. Servono trigger di chiusura/escalation (il nostro milestone/Astrolabio è l'equivalente del "call the Apocalypse" di dotAGE). |
| C5 | **Rogu(e)lite fatigue / mislabeling** | SFK ("it's an incremental mislabelled") | Se prometti run-variance la devi consegnare. Rafforza il punto §10-Q1: vendere prima il gestionale, roguelite come meta-bonus dichiarato onestamente. |
| C6 | **EA senza cadence/comms** | Epic Tavern, CoG, Travellers Rest | L'EA come servizio (AtS bisettimanale) batte l'EA come cantiere. Se non manteniamo cadence, meglio restare "Coming Soon". |
| C7 | **QoL gestionale sottovalutata** | CoG (no multi-drag/hotkey), AHR (UI), CoG pathing | Nei gestionali la fiducia UI/agente *è* il prodotto. Il nostro drag esplicito aggira il problema pathing; kit/primitive coprono il resto. |
| C8 | **Bug/tecnica al lancio** | Norland, Bellwright, CoG, dotAGE freeze | Budget effetti misurato su Tauri = anche una scelta reputazionale, non solo tecnica. |
| C9 | **Scope drift / identità diluita** | Travellers Rest, Hero's Hour (contenuto *rimosso*) | Anti-pillar documentati + claim ledger: proteggere il verbo centrale. |
| C10 | **Economia opaca o tirchia** | BB (grind), Loop Hero (trickle), AHR (balance) | Rate visibili (R3.2) e preview payoff = risposta diretta alla lamentela n°1 di BB. |

### Cosa la community premia *decisamente*

| # | Pregio | Chi lo incarna | Presa per noi |
|---|---|---|---|
| W1 | **Dev visibile e reattivo** | dotAGE (Catman risponde in ore), SFK, AtS | Le review negative si convertono quando il dev risponde: cadence di presenza = feature. |
| W2 | **Gimmick singola e visibile in 10 secondi** | Loop Hero (placement), Stacklands (stack), Rusty's (bordo schermo) | La nostra: il mondo dipinto che *è* l'interfaccia + drag del medaglione sul POI. |
| W3 | **Personalità/flavor** | Majesty (humor) vs CoG (senz'anima → 59%), DD (writing), Potion Craft (tattilità) | Cronaca esiti + flavor delle carte = la nostra "anima"; non basta la meccanica. |
| W4 | **Rapporto ore/$ dichiarato** | SFK ("$0.12/hr"), Thronefall | Prezzo onesto + densità percepita > prezzo alto giustificato. |
| W5 | **Fallire imparando** | AtS ("lose nothing"), DD (push-your-luck) | Morte = scambio risorsa↔risorsa + cronaca che rende la lezione leggibile. |
| W6 | **Steam Deck perfetto** | Thronefall, Potion Craft, AtS (verified) | Tauri/WebView + controlli leggeri ci posizionano bene; testare Deck presto. |
| W7 | **Update cadenced come contenuto** | AtS bisettimanale, Bellwright | Il roadmap pubblico è parte del prodotto, non del marketing. |

**Sintesi:** nella nostra nicchia la community non si lamenta dell'idea, si lamenta di **tempo non rispettato, click non necessari, RNG senza leve, agenti non affidabili e silenzi degli sviluppatori**. Quattro dei cinque antidoti sono già nei nostri pillar (tempo continuo + decisioni rade, cap+slot, preview probabilità, drag esplicito); il quinto — presenza/cadence — è una scelta operativa, non di design.

<!-- ===== repo-snapshot/STEAM_PAGE_PLAN.md ===== -->

# Steam Page Plan — pagina "Coming Soon" (r005)

**Stato:** Proposed (non ratificato) — r005, riveduto via dibattito multi-AI web (chatgpt, claude, grok) 2026-10-09
**Richiesta:** R-117 in `RICHIESTE.md`
**Obiettivo:** aprire la pagina Steam il prima possibile per raccogliere wishlist — ma **abbastanza convincente da convertire le visite in wishlist senza creare aspettative che lo sviluppo non può mantenere**. Priorità del Director: reputazione > ricavi; prezzo previsto 14.99 premium.
**Regola delle fonti:** ogni regola Steam citata è marcata `CONFIRMED` (doc Steamworks ufficiale, con URL in appendice), `UNVERIFIED` (da controllare prima dell'upload) o `RECOMMENDATION`. Un `CONFIRMED` senza URL+data in appendice decade automaticamente a `UNVERIFIED`. La checklist Steamworks resta l'ultima parola.

---

## 0. Decisioni del Director (con reversibilità)

| # | Decisione | Reversibilità | Nota |
|---|---|---|---|
| D1 | **Nome del gioco** | **Cara** — blocca la pubblicazione | **Deciso (Director, 2026-10-09): "Wanderlust: Triumph"** — check Steam 2026-10-09: nessun omonimo esatto; però esiste il franchise `Wanderlust` (Different Tales, 3 titoli "Wanderlust: X" 2019-2020) + `Wanderlust: The Bermuda Secret` (2021) — stesso pattern "Wanderlust: Sottotitolo", search diluita, possibile marchio registrato. **Prima del logo: verifica marchio videogiochi su EUIPO/USPTO** (check <200€). "RpgBalancer" = codename |
| D5 | **Disclosure AI** | Blocca la pubblicazione | Questionario contenuti obbligatorio, pubblico sulla pagina, coerente col copy (§6) |
| D2 | **Pitch** | Economica | Regola sul copy: le bozze devono passare il claim ledger |
| D3 | **Genere dichiarato** | Economica | **Deciso (Director, 2026-10-10): "roguelite" SÌ** — morte→bonus = meta-progressione core, nella demo. Va nel build prima del lancio → tag/claim solo dopo verifica in-build |
| D4 | **Lingue del gioco** | Economica | **Deciso (Director, 2026-10-10):** pagina store **EN/IT** subito; gioco al lancio demo **EN/IT/DE/FR** (FR incerta — "forse no francese"); **ES/DE/ZH-CN** solo dopo trazione → "localization roadmap" nella sezione planned, NON dichiarate come supportate. Authored content oggi solo IT → serve EN content per la pagina EN |
| D6 | **Data** | Economica | **Deciso (Director, 2026-10-10): "Coming Soon"**. Prezzo NON bloccante: le pagine Coming Soon non mostrano il prezzo; decidibile fino al lancio. **Strategia prezzo (Director 2026-10-11/12, R-160, provvisoria):** pattern di nicchia — ingresso basso + sconto lancio -10/15% + rialzo come evento alla 1.0; base chiarita: **~$9.99 lancio → ~$14.99 alla 1.0** (ref `context/COMPETITIVE_LANDSCAPE.md` §8.1). Rivedere il "$14.99 premium" ipotizzato in §0 quando si fissa il prezzo |

Solo D1 e D5 sono **decisioni del Director** che bloccano la pubblicazione; D2–D4, D6 sono regole sul contenuto: gli asset reversibili (screenshot, clip, bozze) si producono prima del titolo. Distinto dalle decisioni, il GATE di §7 elenca **requisiti operativi oggettivi** (≥5 screenshot reali, test di comprensione superato, canale scelto, hub verificato): sono precondizioni di qualità, non decisioni — non derogabili singolarmente, con unica eccezione il trailer (waiver scritto del Director), perché una pagina sotto soglia non converte e danneggia la reputazione.

### 0.1 Claim ledger — fonte unica per tutto il copy
File `marketing/steam/claim-ledger.md`, obbligatorio prima dell'invio. Tre stati:

| Stato | Dove può apparire |
|---|---|
| **true-now** (esiste e dimostrabile nel build oggi) | ovunque: short desc, tag, capsule, about |
| **true-at-launch** (committato ma non ancora implementato) | **solo** nella sezione "What we're building", con data di revisione |
| **vietato** | mai |

- Con nessuna data di lancio, un claim "true-at-launch" non ha falsificatore: **ogni update re-audita il ledger; un claim ancora non costruito dopo due audit viene rimosso, non ammorbidito**.
- Ogni verbo del copy ("prepare", "assign", "defend") va classificato come azione dimostrabile o promessa — es. "prepare your heroes" è lecito solo se roster/assegnazione sono verificati sulla superficie di lancio.

---

## 1. Mappa della pagina

| Zona | Contenuto | Priorità |
|---|---|---|
| **Capsule** | Arte + logo + eventuale sottotitolo ufficiale. Niente testo promozionale sulle capsule base (`CONFIRMED` — Graphical Asset Rules: solo artwork, nome gioco, sottotitolo ufficiale; testo extra solo via Artwork Override localizzata ~1 mese) | **P0** |
| **Video slot 1** | Trailer gameplay minimo 15-30 s da sequenze reali | **P0-alto** (`CONFIRMED`: i primi due trailer precedono gli screenshot; Steam raccomanda gameplay-first, leggibile senza audio) |
| **Screenshot** | ≥5 reali in-engine ≥1920×1080, ordinati per comprensione | **P0** (`CONFIRMED`: min 5, solo gameplay reale, no concept art/mock/testo marketing) |
| **Short description** | 1 frase ≤300 char, solo claim true-now | **P0** |
| **Tag** | fino a 20, ordinate per verità del gioco | **P0** |
| **About** | Hook + sezioni con GIF/video come prova progressiva | **P0** |
| **Info laterali** | Lingue (gate §5), requisiti (da misurare: Tauri/WebView2), dev/publisher, link | P1 |
| **Content Survey + AI** | Tabella asset + wording (§6) | **P0** |

**Attenzione trailer:** le tre scene (mappa → scelta quest → Astrolabio) sono autentiche ma il loop non è assemblato — il montaggio non deve suggerire continuità inesistente. Gate: uno spettatore estraneo non deve dedurre che il core loop sia già giocabile. Se non riesce in 15-30 s, meglio un video più breve e inequivocabile. Il trailer è un **gate qualitativo**, non un prerequisito assoluto: il Director può approvare un waiver esplicito se ritarda sensibilmente la pagina (altrimenti si ritarda).

---

## 2. Asset

### 2.1 Screenshot — shot list
Regole `CONFIRMED`: ≥5 screenshot, ≥1920×1080 16:9, solo gameplay in-engine reale.

| # | Scena | Reale nel build? | Cosa mostra |
|---|---|---|---|
| 1 | **Gameplay leggibile** (quest con scelta + Astrolabio, o mappa con evento leggibile in corso) | Y | Cosa fa il giocatore |
| 2 | Mappa intera viva | Y | Il mondo |
| 3 | Astrolabio durante un tiro | Y | La meccanica-firma |
| 4 | Invasione goblin / minaccia | Y | Posta in gioco |
| 5 | Roster/assegnazione | da verificare | Il gestionale |
| 6 | Vista villaggio | da verificare | Cosa gestisci |
| ~~7~~ | SETTLEMENT LOST | **mock → ESCLUSO** | rientra quando implementato |
| ~~8~~ | Scheda eroe | **placeholder → ESCLUSO** | rientra quando è bello |

- **Procedura di selezione:** la shot list è ordinata per preferenza; si prendono i primi 5 che risultano "reali nel build". Se meno di 5 verificano → ritardo, mai riempire con mock. Il test di comprensione gira **sul set finale effettivo** (i 5 che andranno in upload), non sulla lista teorica.
- **Criterio go/no-go screenshot (r002):** "da reputazione" = uno spettatore estraneo capisce il gioco dal primo screenshot + ogni shot regge il confronto affiancato ai comparabili (Against the Storm ecc.).
- **Test di comprensione (regola decisionale univoca):** l'intera sequenza che il visitatore vedrà — capsule + short desc + **tutti** gli screenshot nell'ordine finale + il trailer se presente — a 5 estranei → "che gioco è? cosa fai? cosa è già giocabile?". **Misread critico** = descrive un genere diverso da "gestione villaggio + quest" OPPURE crede giocabile qualcosa di non implementato (run-end, preparazione eroi se non verificata, ecc.). **Regola: si pubblica solo quando gli ultimi 5 tester consecutivi producono zero misread critici**; un solo misread → si corregge l'asset incriminato e si riparte il conteggio. Campione piccolo per scelta: il test cerca errori grossolani, non significatività statistica.

### 2.2 Video
- **Trailer gameplay minimo** (slot 1): 15-30 s, tre capacità distinte senza finta continuità, no voice-over, musica solo licenziata.
- Teaser R-072 → primo posto quando esiste.

### 2.3 GIF/media nella descrizione lunga
- La colonna descrizione è passata a **780 px** nel redesign store 2025 (pagina a 1200 px): GIF target ~780 px, non 616 (616 = misura storica).
- La descrizione accetta anche **.mp4/.webm** (riportato ~100 MB / ~12 s — `UNVERIFIED`, verificare in Steamworks): se confermato, preferire video corti a GIF pesanti.

### 2.4 Capsule e logo
Dimensioni dalla tabella ufficiale "Graphical Assets" **da scaricare al momento della produzione** (i valori in circolazione — header 920×430, small 462×174, main 1232×706, vertical 748×896 — provengono da fonti secondarie: `UNVERIFIED` fino al template ufficiale). Regole `CONFIRMED`: artwork + nome + sottotitolo ufficiale; Library Hero = solo artwork.
- Una sola idea per capsula, niente collage. Arte derivata da render in-engine reali: non può mostrare cose che il gioco non ha.
- Test: small capsule a dimensione reale accanto a 10 capsule del genere; logo leggibile.

### 2.5 Moodboard — fuori dalla pagina (press kit/devlog/Reddit).

---

## 3. Testi

### Principi
1. Promessa prima delle feature. 2. **Claim ledger** su ogni frase. 3. Verbi del giocatore, ognuno classificato dimostrabile/promessa. 4. Corto. 5. Funnel: primo blocco = "che gioco è / cosa faccio / perché seguirlo ora"; about = prova progressiva.
6. **Parole vietate fino a prova contraria:** `hand-painted`, `hand-drawn`, `handcrafted`, `procedural`; `roguelite`, `invasion`, `storm is coming` e ogni allusione alla fine della run finché D3 non committa. Alternative: `painterly`, `illustrated`, `a living map`.

### Short description — varianti (EN master; tutte solo true-now)
- A: *"Lead a frontier village on a living, painterly continent. Send heroes on perilous quests, read the stars of the Destiny Astrolabe, and decide what you're willing to pay for every choice."*
- B: *"A village-management RPG where every quest has a price. Assign your people, roll fate on the Astrolabe, and live with what it costs."* (verbo "assign" da classificare nel ledger: dimostrabile se roster/assegnazione verificati)
- C: *"Your village is small, the world is wide. Plan, gamble, and pay the price of every choice in a painterly fantasy management RPG."*

### Descrizione lunga — struttura
1. Hook + media mappa. 2. **A living world**. 3. **Every quest has a price** (R-094). 4. **Read your destiny** (Astrolabio). 5. **What exists / what we're building** — due elenchi espliciti e non ambigui: *"Systems shown are real and in-engine today"* (solo claim true-now) + *"Planned:"* dove ogni claim true-at-launch è marcato singolarmente come pianificato e porta la sua data di revisione (re-audit a ogni update; rimosso dopo due audit senza implementazione). 6. Wishlist + cosa mostreremo (teaser, demo) + Discord se esiste.

### Tono — fantasy classico leggibile, caldo e un po' solenne. La disclosure AI e la pagina dicono la stessa cosa.

---

## 4. Tag
Fino a 20 tag (`CONFIRMED` cap esiste; "l'ordine conta / prime 5 pesano" è `UNVERIFIED` — confermare nella doc Tags attuale). Le tag sono poi votate dagli utenti — una sbagliata viene corretta pubblicamente.
- **True-now:** Management, RPG, Fantasy, Strategy, Choices Matter, Atmospheric, Singleplayer, Indie.
- **Gate D3:** Roguelite, Permadeath.
- **Da validare su comparabili:** Colony Sim/Village Builder, Base Building, Real-Time with Pause (TimeEngine ha tick+pausa).
- Metodo: comparabili + Tag Wizard; lista finale esportata e ri-verificata prima dell'invio.

---

## 5. Lingue
- **Gate semantico** (non solo conteggio chiavi): script che verifica per locale — chiavi mancanti, valori vuoti, fallback usati, interpolazioni/plurali — poi test sui percorsi UI effettivamente nel build. Una lingua di gioco si dichiara solo se le stringhe visibili sono complete.
- Pagina tradotta ≠ gioco tradotto: nota onesta dove serve ("page translated, game in EN/IT").
- `ar`: solo se RTL testato in gioco.
- Apertura: pagina **EN+IT**; gioco: solo lingue che passano il gate. Pre-teaser: +DE/FR/ES/PT-BR/ZH-Hans (+RU/JA se revisione sostenibile), glossario fisso → AI → **revisione madrelingua**.

---

## 6. AI Disclosure (deliverable obbligatorio)
File `marketing/steam/ai-disclosure.md` prima dell'invio. **Due tavole separate** (r002): contenuti nel build vs materiali marketing/localizzazioni.

**Prima di scriverla — provenance audit:** per ogni asset AI nel build documentare modello base e licenza, LoRA/checkpoint, immagini sorgente img2img e loro ownership, e grep dei prompt per nomi di artisti viventi. Valve richiede che il contenuto pre-generato non contenga materiale illecito/infringing (`CONFIRMED` riportato da fonti secondarie — verificare wording nel survey). "Coinvolgimento umano" si scrive solo da dichiarazione del Director, non pre-compilato.
- Survey `CONFIRMED`: sezioni **Pre-Generated** vs **Live-Generated**; la disclosure è pubblica sulla pagina.
- `Live-Generated: none` **solo dopo code-search reale** su runtime.
- Tono: prima persona, parole semplici, coerente col copy.

---

## 7. Fasi operative (r002)

| Fase | Contenuto | Dipende da |
|---|---|---|
| F0 — Regole contenuto | Claim ledger v1; D2/D3/D4/D6 come regole | Director |
| F1 — Account | Steamworks, $100 fee, fiscale/bancario; attesa primo titolo `UNVERIFIED` (21-30 gg, confermare) | Director |
| F2 — Asset | logo + capsule + ≥5 screenshot verificati + trailer minimo | modalità cattura; D1 solo per logo/capsule |
| F3 — Testi | short + about + tag che passano il ledger | F0 |
| **GATE pubblicazione** | D1 fatto; D5 scritta+provenance audit; ≥5 shot reali (criterio §2.1); test comprensione: zero misread critici negli ultimi 5 tester (§2.1); trailer pronto **o waiver scritto del Director**; canale primario di distribuzione scelto; Community Hub: l'unico requisito è **verificare** se l'account lo attiva — se sì: post pinnato + owner + check settimanale; se la piattaforma non lo rende disponibile, il punto si chiude con nota nel ledger e si ricontrolla al primo update (non è bloccante) | Director |
| F4 — Review Valve | `CONFIRMED`: pagina pubblica ≥2 settimane prima del release; inviare a review ≥7 giorni lavorativi prima della pubblicazione desiderata | GATE |
| F5 — Vita della pagina | **Una regola sola: mai update vuoti a scadenza.** Update quando esiste qualcosa di dimostrabile; se a ~30 gg non c'è nulla di nuovo, una status-note onesta ("in early development, ecco cosa è reale") è ammessa ma non obbligatoria. Check settimanale Community Hub se attivo; baseline traffico/wishlist | post-F4 |
| F6 — Lingue pagina | traduzioni + revisione madrelingua | F3 |
| F7 — Teaser R-072 | primo posto nel carosello | R-072 |
| F8 — Demo/Next Fest | app separata | core loop |

### Lavoro tecnico
**Modalità cattura su `/game`** (pannelli nascosti, 1920×1080+, seed deterministico, no cursore) · **script ffmpeg** GIF/clip · **script gate i18n** (semantico) · **grep provenance AI** (§6).

---

## 8. Checklist finale
- [ ] Nome verificato (omonimi Steam, marchi)
- [ ] Claim ledger compilato; ogni frase = true-now sopra la piega, true-at-launch solo in "What we're building"
- [ ] Parole vietate assenti (§3.6) — inclusi "storm/invasion" pre-D3
- [ ] Capsule: arte+logo, dim da template ufficiale scaricato, small leggibile
- [ ] ≥5 screenshot reali, criterio estraneo superato
- [ ] Trailer leggibile senza audio, nessuna falsa continuità — o waiver Director scritto
- [ ] Tag ≤20, D3-gated fuori finché non committate
- [ ] AI disclosure: provenance audit fatto, Live-Generated verificato, coerente col copy
- [ ] Lingue gioco = gate semantico passato
- [ ] Review inviata ≥7 gg lav.; pagina pubblica ≥2 sett. prima di release (`CONFIRMED`)
- [ ] Community Hub: attivabilità verificata sull'account; se attivo, post pinnato + owner + check settimanale
- [ ] Canale primario di distribuzione scelto; piano per il primo update reale (nessuna data forzata)
- [ ] Link esterni funzionanti o assenti

---

## Appendice A — Fonti da consolidare (ogni CONFIRMED va qui con URL+data prima dell'invio)
- Steamworks "Graphical Assets" (capsule rules, override) · "Screenshots" (≥5, 1920×1080, gameplay-only) · "Trailers" (gameplay-first, precedono screenshot) · "Coming Soon" (≥2 sett. pubblica; review ≥7 gg lav.) · "Content Survey — Generative AI" (pre- vs live-generated, pubblica) · "Steam Tags" (cap 20, ordine) · Store redesign 2025 (pagina 1200 px, colonna 780 px).
- Da verificare in Steamworks al momento dell'esecuzione: dimensioni capsule esatte, limiti GIF/video in descrizione, attesa primo titolo, regole tag utenti.

## Appendice B — Punti contestati (decisioni Director)
- **Prezzo 14.99 vs 4.99** (grok): non adottato — prezzo = decisione Director già espressa; la pagina Coming Soon non ha acquisto quindi il rischio refund non nasce qui (claude). Rischio residuo annotato: premium + contenuto sottile al lancio.
- **Cadenza**: convergenza su "update solo quando c'è contenuto dimostrabile + hub curato", mai un calendario artificiale né update vuoti a scadenza.

<!-- ===== repo-snapshot/BUSINESS_PLAN.md ===== -->

# Business Plan — Wanderlust: Triumph
*Documento vivo, aggiornato 2026-11-16. Fonte di verità per strategia commerciale/funding.*
*Materiali collegati: `deliverables/tambu-prima-pubblicazione/`, `deliverables/steam-store/`, `deliverables/map-shop/`, `deliverables/uni-collab/`, `tools/opportunity-monitor.py`.*

## 1. Stato attuale
- **Prodotto:** Wanderlust: Triumph — fantasy strategy/management roguelite, browser (PixiJS/TS), solo dev (Fausto Boni, Carpi MO, 43 anni, persona fisica).
- **Sviluppo:** prossimo a gameplay video/demo; dossier publisher completo già prodotto.
- **Candidature:** Tambù "Prima Pubblicazione" (PP26-0006, inviata 16/11) + programma regionale ER.
- **Contatti aperti:** UniMoRe (Silva/MO.RE.PL.A.Y), UniBo (Pacetti/GAME.SCI), colloquio infodesk Startup ER fissato.

## 2. Funding — mappa delle opportunità

### Attive/in corso
| Opportunità | Stato | Prossimo passo |
|---|---|---|
| Tambù Prima Pubblicazione | Inviata | Attesa risposta |
| Programma regionale ER | Inviata | Attesa |
| Infodesk Startup ER | Colloquio fissato | Agenda: FESR 2027, Start Cup, BGF, impresa femminile |
| Collaborazione università | Mail inviate | Attesa risposta → Start Cup/PNI + partner progetti UE |

### Future (calendario, monitorate automaticamente — 16 fonti, digest mensile)
- **FESR ER videogiochi ~estate 2027**: fino €50k al 60-65% — richiede impresa. *Decisione costituzione va presa prima della call.*
- **Bologna Game Farm**: ed. 2026 chiusa (29/04) e **biennale** — fase 1 mag-ott 2026 per 8 team; fase 2 (2027) = **€15k cad. a 2 team** (non 30k: correzione). Aperta anche a persone fisiche. Prossima call completa incerta (2027 o 2028) — monitorata.
- **Nuove Idee Nuove Imprese** (BPC Rimini/Forlì-Cesena/Ravenna/San Marino): premi >€25k (1° €10k), formazione+mentoring gratis. ⚠️ **Team ≥2 persone** — aspiranti: basta residenza IT/SM (Carpi ok); neoimprese: sede nei territori. Ed. 2026 chiusa 31/05 → candidatura ~aprile 2027. *Nota: il requisito "2 persone" si lega allo scenario co-founder.*
- **Erasmus for Young Entrepreneurs (EYE)**: **nessun limite di età**, sempre aperto, gratis. Lui come New Entrepreneur (<3 anni attività o aspirante): 1-6 mesi presso un host entrepreneur estero con **~€1000/mese a fondo perduto** (importo dipende dal paese; max ~€7.2k). Serve business plan — c'è già. Local contact point: Unioncamere. Opzione "Canarie" = host in Spagna possibile via catalogo.
- **Start Cup ER / PNI**: premi sponsor + mentorship + finale nazionale — serve legame università (in corso).
- **First Playable Firenze ~giugno 2027**: meeting 1:1 con 50+ publisher (MeetToMatch, ticket Developer).
- **ICE Gamescom ~2027**: postazione collettiva italiana — call PEC, ordine di arrivo.
- **Tax credit MiC 25%**: serve impresa + ATECO + capitale — valutare post-costituzione.
- **Creative Europe MEDIA**: fino €200k ma solo dopo un gioco pubblicato — fase 2.

### Escluse: SIAE Per Chi Crea (under-35), cultura/regioni Sud, Epic MegaGrants (Unreal), VC (pre-trazione).

## 3. Struttura societaria — opzioni sul tavolo
| Scenario | Sblocca | Vincolo |
|---|---|---|
| **Persona fisica** (status quo) | BGF, publisher, itch/Steam (come privato) | Niente FESR/Smart&Start/tax credit |
| **SRL startup innovativa (solo Fausto)** | Smart&Start 80% tasso zero, FESR, tax credit, premialità ER | Costi costituzione+gestione; NO quota 90% |
| **Co-founder compagna (under-35) 51/49** | **ON – Oltre Nuove Imprese a Tasso Zero** (maggioranza femminile, fino €250k tasso zero + quota fondo perduto corrente) | Lei deve detenere 51% + ruolo reale in amministrazione |
| **Compagna socia unica** | Smart&Start **90%** (compagine interamente donne/under-36 — qualsiasi socio fuori requisiti annulla, v. MISE 439196 §9.2) | Società legalmente sua; Fausto come dipendente/consulente/amministratore |

*Domande per infodesk: quale forma conviene prima di FESR 2027? Impresa femminile 51/49 — quali bandi ER attivi? Tempi/costi startup innovativa.*

## 4. Go-to-market — funnel concordato
```
video gameplay decente (Director lo registra)
  → Steam Coming Soon (account+ $100 = Director; capsule/testi/trailer = pronti in deliverables/steam-store/)
  → pitch publisher batch (pack per-publisher pronto, form compilabili da agente)
  → itch.io + map pack + social/devlog (contenuto minimo sostenibile)
  → Next Fest quando demo pronta
```
- **Regola Director:** niente promozione pubblica prima del video. Eccezioni già fatte: mail università (vendono il *processo*), pitch pack (preparazione, non invio).
- **Regola Steam:** Coming Soon online ≥14gg prima del lancio. AI disclosure obbligatoria → "AI-assisted, developer-directed" (dichiarata).

## 5. Monetizzazione (per ordine di attivazione)
1. **Steam** — revenue principale atteso ($100 fee, build wrapper Electron/Tauri).
2. **Portali HTML5** (Poki/CrazyGames/GameDistribution) — a gioco finito: esclusiva web o rev share ads; il browser-native è vantaggio competitivo.
3. **Map pack + arte** — `deliverables/map-shop/` pronto; pubblicare *dopo* Steam page (funnel, non income; licenza personal-use — IP resta al gioco).
4. **itch.io** — early audience + vendite minori.
5. **Crowdfunding** (Kickstarter/Gamefound) — solo con community; map pack come reward tier.
6. **Mind Weaver** — non vendita diretta: è il *pitch narrativo* (solo dev + AI squad) + eventuale consulting/workshop a reputazione acquisita.
7. **Committenza** (serious/educational games, formazione B2B) — opzione cash-flow se servono soldi a medio termine.

## 6. Rischi e note oneste
- Entrate da arte/map pack: ~€0 finché non c'è audience — sono asset di funnel, non income.
- Publisher senza video = primo impatto bruciato; batch-submit solo post-video.
- "Prestanome" non è strategia: i bandi verificano ruoli reali; la co-founder deve lavorare davvero.
- Il collo di bottiglia unico resta il **gioco/video** — tutto il resto è pronto e aspetta.
