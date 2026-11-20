# 05-NARRATIVE-MARKET — bundle tematico (snapshot 2026-11-19)

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
- **Prodotto:** Wanderlust: Triumph — manageriale/dispatch fantasy (v. correzione §7), browser (PixiJS/TS), solo dev (Fausto Boni, Carpi MO, 43 anni, persona fisica).
- **Naming (deciso nov 2026):** titolo tenuto nonostante collisione di formato con le saghe "Wanderlust: X" (Yeti Trunk/Chucklefish dormiente; Different Tales attivo). Nessuna collisione diretta di titolo; "wanderlust" = parola comune, rischio legale ~zero. Trade-off accettato come positivo: traffico SEO prestato > rischio diluizione; l'identità la fanno capsule pittorica + storia. Rivalutabile solo se uno dei due studi riemerge attivo e reclama.
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

### Escluse: SIAE Per Chi Crea (under-35), cultura/regioni Sud, Epic MegaGrants (Unreal), VC generalisti (pre-trazione), vendita sorgente/CodeCanyon (IP), Autoimpiego Centro-Nord (richiede disoccupato — solo se lascia il lavoro).

### Round 2 (multi-AI 2026-11-18, ChatGPT+Gemini — da verificare quelli segnati ⚠️)
- **CCIAA Modena bandi camerali** (annuali, serve impresa in prov. Modena): neo-imprese (~€100k fondo), voucher transizione digitale (50% max €7k), internazionalizzazione — monitorati.
- **Kowloon Nights** — *non-VC*: project financing 100% budget dev in cambio di revenue share fino a recoup, **IP resta tua**, pitch via form (serve vertical slice). Fit forte post-video.
- **Angels giochi europei** (solo se equity diventa accettabile): Behold Ventures (SE, €50-250k pre-seed), Sisu Game Ventures (FI), Game Seer (licenze indie PC/console), LevelUp Games syndicate.
- **Quickload** ✅ verificato — acceleratore gaming OGR Torino + 34BigThings + Microsoft ID@Xbox, nel progetto Horizon GAME-ER (partner ed. 2026: poncle/Vampire Survivors). ~6 studi/anno, 4 mesi alle OGR Tech Torino (giu–ott) + Demo Day con publisher/investitori; **non serve società** (gruppi informali ok). Ed. 2026: 30 candidature→6. **Candidatura via F6S** (f6s.com/quickload-accelerator-Nth-edition/apply) — call chiusa 30/04/2026, prossima ed. ~primavera 2027, monitorato. Prerequisito: demo/pitch presentabili → pacchetto post-video.
- **Kowloon Nights (Kepler)** ✅ — project financing non-equity, IP resta tua. Form sempre aperto (monday.com via kowloonnights.com). Gerarchia loro: **demo > video > art > parole** — lui ha la build giocabile = vantaggio reale. **Trigger: quando build presentabile.** Deck riusa dossier Tambù ~80%.
- **Licenze white-label HTML5** (MarketJS/Famobi/Softgames/Coolmath): licenza flat-fee non-esclusiva del gioco finito su canali terzi (telco/smart TV/portali) — **post-lancio**.
- **Telegram Mini Apps**: PixiJS nativo, bot push per gestionale asincrono, Stars/ads — **post-lancio**, nessun monitor (piattaforma, non bando).
- **Licenze white-label HTML5**: MarketJS/Famobi/Softgames/Coolmath — licenze non-esclusive flat-fee (indicativamente €500-5k/gioco) per reti telco/smart-TV/portali. Alternativa/complemento al rev-share ads. Post-lancio.
- **Telegram Mini Apps** — superficie nativa per il suo stack (PixiJS): notifiche push via bot perfette per gestionale asincrono; monetizzazione Telegram Stars/Adsgram. Canale emergente reale.
- **Reddit Devvit** — giochi embeddabili nei subreddit (r/incremental_games!), nicchia ma in-target.
- **Showcase gratis/bassi**: Svilupparty Bologna (selezione gratuita, playtest) — Indie Dev Day Barcelona (autunno, economico, publisher) — A MAZE Berlin (curato) — IVGA post-lancio.
- ~~Cultura Crea / Fondo Impresa Cultura~~ → **ESCLUSO**: rifinanziato come "Cultura Cresce" ma solo per imprese con sede operativa al Sud (Basilicata, Calabria, Campania, Molise, Puglia, Sardegna, Sicilia).
- **Fondazione di Modena / Fondazione CR Carpi**: finanziano solo non-profit/enti — accessibile solo via associazione culturale o progetto con valenza territoriale. Priorità bassa.
- **Side revenue creativa distinta dall'IP gioco**: mappe/asset TTRPG su DMsGuild/DriveThruRPG/Foundry, commissioni mappe fantasy per DM/autori (Fiverr) — mercato collaudato, usa la pipeline su *nuovi* lavori.
- **EIT Culture & Creativity**: open calls UE per industrie creative — monitorate.

### Round 3 (multi-AI 2026-11-18, broadcast+dibattito 5 provider, run `20261118-funding-visibility` — verifiche orchestratore fatte)
- **Big Indie Pitch PC+Console @ PG Connects London** ✅ — evento 19 gen 2027, **deadline 5 gen 2027**, giochi non finiti ammessi, team ≤12 (solo dev ok), pitch anche via video. Costo: biglietto PGC + viaggio Londra (obbligatorio presenza). **Verdetto dibattito: stretch goal** — candidarsi solo se a inizio gennaio un video 2min mostra il loop in modo convincente.
- **First Playable Coaching (IIDEA)** ✅ — sessioni 1:1 **gratuite** online con professionisti (producer, publishing director) nel pre-evento First Playable. Prenotabile su firstplayable.it. Canale business-contact italiano a costo zero.
- **Portali pitch publisher (rolling, solo post-vertical-slice)**: Hooded Horse ✅ (focus strategia/tattica, open submissions), Assemble Entertainment (management/colony DE), Astra Logical (systemic/"thinky" — submissions al momento chiuse, monitorare), 11 bit studios, Raw Fury + Indie Fund (**richiedono build giocabile**), tinyBuild, Team17, Fireshine, Fellow Traveller. Outersloth ($50k–2M recoup, no IP) solo con budget/production plan difendibile.
- ~~**Unity Fellowship $50k** (scad. 18 dic 2026)~~ → **ESCLUSA verificata**: residenti Italia non ammessi questo ciclo + richiede Unity engine.
- ~~**Smart&Start Italia**~~ → **DEPENNATO come opportunità corrente** (convergenza 4/4): category error — finanziamento rimborsabile min €100k per startup reale (SRL in 30gg, piano 10 anni). Rilevante SOLO nello scenario §3 SRL/costituzione vera.
- ~~**Digital Dragons Kraków**~~ → deprioritizzato: regole competition 2026 restringono a entità registrate in Polonia; booth Indie Zone €749 forse aperto a internazionali ma ROI scarso vs canali gratuiti.
- **Next Fest timing (post-dibattito)**: NO feb 2027; giu 2027 (reg. ~25 apr) solo se demo stabile, altrimenti ott 2027. "7–15k wishlist" = benchmark marketing (Zukowski), non regola Valve.
- **Visibilità/community genre-matched**: r/BaseBuildingGames (~140k, primo target), r/ColonySim, r/DestroyMyGame (feedback duro), GGJ Bologna 29–31 gen 2027 (networking gratuito), creator da contattare SOLO con build (SplatterCatGaming, Nookrium, Wanderbots, Orbital Potato). Formato devlog consigliato: "una meccanica → una conseguenza → una clip 15s" (playbook Against the Storm/Norland).
- **Meccanica Steam demo**: al primo rilascio della demo si può inviare UNA notifica a tutti i wishlister (finestra 2 settimane) — pianificarla come evento marketing.
- **TactiCon (Hooded Horse + Firesquid, evento Steam)** ✅ — GRATUITO per i selezionati, tutto online, nessun viaggio/società. Ed. 2026: lug 9-23; submissions ~fino a metà marzo (call attesa ~dic). Requisiti: **pagina Steam live**; demo plus non obbligatoria. Genere "tactical" = minacce + ragionamento tattico (ibridi ok → le spedizioni di Wanderlust ci rientrano se il village non è "puramente peaceful"). **Miglior fit genere/canale trovato nel round** — gated solo sulla Steam page.
- **Firesquid** ✅ — publisher indie focalizzato strategia (co-organizza TactiCon), pitch deck via form. Aggiungere al set portali post-slice.
- **Game Romancer** (gameromancer.substack.com) — newsletter italiana indie che accetta submission di build → primo contatto stampa a costo zero.
- **Milan Games Week Indie Dungeon** — 10 postazioni GRATUITE su selezione (Fiera+Fandango+IIDEA); call 2027 ~metà anno, monitorata.
- **Convergence Games Showcase** (18 feb 2027, deadline ~11 gen) — digitale, solo dev ok, effort basso/reach piccola. Opzionale.
- **AI-art policy risk** ⚠️ NUOVO — Steam richiede disclosure AI-generated content; itch.io ha un filtro che nasconde giochi AI-disclosed; policy dei singoli festival sconosciute. Se l'art pipeline usa Gemini/scene-author, **verificare le regole AI di ogni candidatura prima di applicare** e preparare la disclosure Steam.
- **Benchmark wishlist realistici** — Laysara: clip 30s su r/gaming → 11k wl/24h (outlier); post normale buono ~100-150 wl. **Generation Exile (cautionary)**: 35k wl + Early Access → conversione ~zero. Wishlist ≠ vendite: conta qualità demo/prezzo.
- ~~**MiC tax credit**~~ → confermato ESCLUSO per persona fisica (ATECO + equity €10k min).
- **Tambù dettaglio fasi** — Fase 1 (gen-mag 2027) prototipo giocabile; Fase 2 (giu-dic) fino a 4 progetti scelti a Svilupparty mag 2027, €5k attività produttive.
- **Publisher "65% dev rev share no recoup" di Hooded Horse** — claim Claude UNVERIFIED, verificare sul form ufficiale prima di citarlo.

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

## 6. Modello di ricavo — r002 convergente (dibattito multi-AI 5 provider, nov 2026)

Fonte: dibattito avversariale chatgpt+claude+gemini+grok+deepseek (run `20261119-businessplan-model`), 4/5 ACCEPT, grok dissent su P50 (vuole 3,5k — dentro il range dichiarato). Artifact: `mind-weaver/.mw/runs/20261119-businessplan-model/artifact-r002.md`.

### Numeri convergenti
- **Conversione wishlist→vendite (no-audience premium): wk1 5% · m1 14% · y1 50%.** I benchmark editoriali 10/22/70 hanno survivorship bias e includono acquirenti non-wishlist — NON usarli come base.
- **Net/copy blended anno-1 ≈ €7,5** a €14,99 (Steam 30% + IVA + refund ~6% + sconti). **Net/wishlist ≈ €3,75** → ogni 1.000 wl ≈ €3,7k.
- **Wishlist al lancio: P10 ~600 · P50 ~2.500 · P90 ~8.500** (10k = P93+, non baseline). Range onesto P50: 2-3,5k.
- Next Fest NON moltiplica da solo: +11 follower mediani se parti <500. La variabile vera è **wishlist/settimana × settimane di pagina online**.
- Tasse IT (due casi): forfettario se ammissibile (soglia reddito dipendente ~€35k, da verificare con commercialista) → netto ×0,75-0,80; ordinario (INPS ~26% + IRPEF marginale) → ×0,45-0,55.

### STAGE 1 — Survival (P50, ~2.500 wl)
~1.250 copie anno-1 → **~€9,4k net pre-tax** (post-tax ~€4-7k a seconda del regime). Leve sopravvissute al break-even:

| Leva | € uplift | Costo |
|---|---|---|
| Deluxe (OST+mappa+artbook, +€6, attach reale 3-5%) | +€0,3k | ~10h, €0 |
| Store-page localizzata DE+ZH+ES/FR (solo pagina) | +€0,4-0,6k | ~€100-300 |
| itch.io (stessa build) | +€0,2-0,3k | ~6h |
| Sconti stagionali | net-zero per costruzione (già nel blended) | — |

**Totale realistico: ~€10-11k pre-tax anno-1.** Non €52k: quello era il modello r001 che sovrastimava wl×conversione di 2-3×.

### STAGE 2 — Upside (P90, ~8.500 wl) — solo condizionale
~4.250 copie → **~€32k pre-tax** + leve condizionate (ZH in-game, Deck Playable ~10h solo se content-lock, GOG +4%, micro-creator €500-750) → **~€35-40k**.

### Gate decisionale (T-30gg da lancio, wishlist reali osservate)
| wl osservate | Azioni |
|---|---|
| <1k | solo Deluxe + itch.io |
| 1-3k | + pagine store DE/ZH |
| 3-8k | + ZH in-game, GOG, Deck Playable |
| >8k | + lingue extra, update major, outreach paid |

### KILL unanimi (5/5 provider)
Deck Verified (40-100h su UI gestionale) · Telegram Mini Apps (EV~0) · HTML5 lite (cannibalizza premium, mediana ~€0) · Kickstarter (gate ≥500-1k wl pre-campagna, P<15%) · €19,99 · White-label attivo (solo inbound passivo).

### Comps reali (raccolta Steam, nov 2026) — la stima ancorata

Solo dev / piccoli team, fantasy strategy/management, $10-25, no audience pre-esistente:

| Comp | Team | Reviews | Vendite st. | Launch wl | Publisher? |
|---|---|---|---|---|---|
| Monarchy | 1-3 | ~110 | ~5k | ~5-10k | no |
| TFC | 2-3 | ~400 | ~18k | ~20k | MicroProse |
| Dawnfolk | solo | ~750 | ~32k | **~30k doc.** | piccolo |
| Kainga | solo | ~770 | ~35k | ~40k | piccolo |
| Odd Realm | solo | ~1.020 | ~46k | EA-era | no |
| **dotAGE** | **solo** | ~2.700 | ~121k | ~150k? | no |
| Hero's Hour | solo+1 | ~5.800 | ~260k | **~170k doc.** | piccolo |
| Songs of Syx | solo | ~9.500 | ~428k | slow-burn anni | no |

Mediana dei comp "riusciti ma non hit": ~800 reviews ≈ ~36k unità ≈ 30-60k wl. **MA** questi sono sopravvissuti visibili — la mediana di TUTTI i lanci $10+ è ~$17k lordi ≈ ~3-5k wl (SteamDB 2025: 48,7% dei giochi <10 review). Ogni comp riuscito ha fatto demo+Next Fest (verificato). Effetto publisher sui dati: mediana self-pub $3,3k vs publisher $16,2k (Gamalytic 2024).

### Regola dominante (consensus)
Il tempo (~5h/wk reali) è il vincolo primo — ogni leva ha un gate di ore, non solo ROI cash. E **le wishlist sono la variabile endogena**: la strategia non è "quali leve attivo" ma "quanto prima pubblico la pagina e con che ritmo la alimento" (demo, devlog, community). Ogni leva si misura in wishlist-equivalenti: 40h di outreach che portano +100 wl valgono €375 — stesso ordine di quasi tutte le leve in tabella.

### B. Denaro non-concorrenziale (accesso a sportello, niente selezione)
| Fonte | Quanto | Requisito |
|---|---|---|
| Smart&Start | 80% (90% se tutta donne/u36) del piano €100k-1.5M a tasso zero | impresa startup innovativa — **prestito**, non fondo perduto |
| ON Impresa Femminile | fino €250k tasso zero + grant spese correnti | impresa a maggioranza femminile (lei 51%) |
| Tax credit MiC | **25% dei costi di produzione** (max €1M/anno) | impresa + ATECO + requisiti capitali |
| Erasmus EYE | ~€1.000/mese × 1-6 mesi | parcheggiato (serve tempo pieno) |
| Licenze white-label | €500-5k/licenza | gioco finito |
| Map pack / TTRPG marketplace | ricavo piccolo, continuo | zero — pubblicazione libera |
| Commissioni mappe custom (Fiverr) | €50-200/mappa | side gig |

### C. Concorrenziali (fuori da questa tabella ma attive)
Tambù PP26-0006, programma ER inviato, BGF (€15k×2), NINI (1° €10k), Start Cup/PNI, Quickload (6 posti), FESR (€50k), Kowloon (financing), publisher advances.

### D. Distribuzione finale a 5 fasce — Monte Carlo validato (nov 2026)

Metodo: 50.000 scenari; wl ~ lognormale, conversione anno-1 ~ N(50%,7%), netto/copia ~ N(€7,5;0,5), coda 5-anni ~ N(×2;0,35). Regola rapida: **netto-5-anni ≈ wishlist × €7,5**.

**Centro condizionale validato da 4 AI** (run `20261119-condp50-validation`): ChatGPT 5k, Claude ~5k, DeepSeek 4k, Grok 6k → **mediana pannello = 5.000 wl**. Cross-check indipendente: gamemarketdata.com → Management @$10-20 mediana $41k anno-1 ≈ stessa cifra. Gemini n/a.

| Fascia (5 anni, netto pre-tasse) | Probabilità | Mediana |
|---|---|---|
| A < €10k | 9% | €7k |
| B €10-30k | 32% | €19k |
| C €30-80k | 37% | €47k |
| D €80-200k | 17% | €112k |
| E > €200k | 4% | €268k |

**P50 = €37k · EV = €59k netti in 5 anni** (pre-tasse personali). Post-tasse indicativo: ×0,45-0,55 ordinario / ×0,75-0,80 forfettario → EV ~€26-47k reali.

Condizioni di validità: vale solo **se la checklist mitigazioni §7 è eseguita** (gioco 1.0 completo, demo, 1 Next Fest, pagina ≥6 mesi prima, community seeding). La P(esecuzione completa) a ~5h/wk è un fattore a parte, non nascosto nella mediana (nota Claude). Incondizionata: P50 €18k, EV €32k.

Cosa aggiorna il modello (Bayes): wl/settimana prime 8 settimane di pagina (baseline mediana ~23/wk → se >50/wk sale verso C-D; Next Fest mediana +200-500 wl senza audience); ctr capsule; demo→wl; coverage creator (+400-1.500 wl/video mid-tier; +11k post r/gaming virale).

### E. Leve micro (quasi gratis, si sommano all'×1,2 medio)

| Voce | Costo | Resa | Note |
|---|---|---|---|
| OST standalone su Steam (DLC ~€4,99, oltre al Deluxe) | ~2h | attach 2-4% × €3 netto | musica del nipote, già esiste |
| OST su Spotify/YT Music (DistroKid ~€20/anno) | €20 | royalty passive + scoperta organica del nome | paga il nipote, pubblicizza il gioco |
| Regional pricing manuale (non default Steam) | 1h | +3-8% | una schermata, nessun costo |
| Trading cards + emoticon/sfondi profilo | ~3h, arte esistente | micro-engagement + fetta fee Community Market | cosmetici di piattaforma, NON in-game; €100-500 fascia C |
| Bundle "complete the set" con gioco 2 | gratis | +5-10% su entrambi | si attiva quando esiste il gioco 2 — la pipeline paga qui |

### F. Narrativa "solo dev + AI" e productizzazione MW (decisione strategica, nov 2026)

Premessa: la disclosure AI su Steam è obbligatoria comunque → **l'etichetta esiste a prescindere; tanto vale possederla**. Posizionamento scelto: "single developer che usa l'AI per fare il gioco dei suoi sogni" raccontato come storia toccante/aspirazionale, non come dettaglio tecnico — è già l'angolo del pitch Tambù e del one-pager università.

Condizione di attivazione concordata dal Director: **SE il gioco ha successo E la storia "Pure" attecchisce** (press coverage, sentiment community positivo) → allora productizzare Mind Weaver come prodotto per:
1. altri solo dev (mercato dev-tool, Gumroad/itch/pricing tier);
2. in prospettiva, persone normali che vogliono portare avanti un progetto proprio senza dipendere da competenze che non hanno (mercato più grande, prodotto più difficile).

Dipendenze oneste: MW-as-product non è una side-gig — richiede packaging, docs, supporto; è un **secondo progetto commerciale**, non una leva di Wanderlust. Il moat è gusto+processo, non il codice → vendere il sistema non diluisce il vantaggio. Gate: solo a successo+storia dimostrati, mai prima del lancio (brucia ore dev e anticipa la narrativa senza prova sociale).

Anti-obiettivo: NON vendere il boilerplate del gioco come "gioco fatto di AI" — rafforza la narrativa "AI slop" verso i giocatori. Il messaggio giusto è "un uomo ha costruito il sistema che produce", verso dev/maker.

Funding MW (ricerca nov 2026, verificata): **nessuna cascade call aperta è un fit pulito** — NLnet/OIS Restack (individui, €5-50k) esclude esplicitamente progetti GenAI (<1M utenti) e vieta deliverable AI-generated; CodeSupply solo riscopando; StandICT = standardizzazione non prodotti; EIC/EIT/Smart&Start richiedono impresa. Finestra reale: nuovi programmi OIS attesi 2027 (monitorati) o incorporazione. Conferma che il gate §6.F è strutturale: il gioco riuscito è la porta quasi unica di MW.

Presenza web MW — sequenza concordata (nov 2026): (1) **ora**: nessun sito dedicato, la storia MW vive nei devlog del gioco (Steam page, Reddit, link live) come contenuto promo gratuito; (2) **se la storia attecchisce**: singola landing con raccolta email (Substack/beehiiv gratis) come smoke test della domanda per il prodotto-MW; (3) **gate §6.F**: sito MW vero solo a gioco riuscito + storia dimostrata — diventa la pagina vendita, e la mailing list accumulata è il suo launch-day-uno. Un sito ora brucia ore dev per un prodotto senza prova sociale.

### G. Creator/press outreach map (ricerca nov 2026 — contatti verificati)

**Vincolo AI nell'outreach**: Retromation (~291k, top genre-fit) ha policy pubblica anti-AI + blacklist per chi la nasconde → escluso. Regola: disclosure AI su pagina (obbligatoria) + pitch **gameplay-first** ai creator (arte+loop+"gioco di una persona"), la storia AI come angolo solo per stampa/human-interest. Check policy AI per canale prima di scrivere.

**Creator (in ordine di fit)**: SplatterCatGaming ~993k (splattercatgaming@gmail.com — postmortem gli attribuisce 15-20% delle vendite di un indie) · **Nookrium ~191k (BEST FIT: niche mgmt/colony daily, nookrium@gmail.com)** · Wanderbots ~522k (wanderbots@gmail.com, + guide outreach gratuite sul suo blog) · Orbital Potato ~197k (city-builder, via Discord/Keymailer) · Aavak ~235k · JumboPixel ~114k · quill18 ~676k · AmbiguousAmphibian ~1.7M (alto rischio/alto rendimento) · Rimmy ~585k.

**Press che coprono demo in-dev**: Alpha Beta Gamer (admin@alphabetagamer.com) · Indie Games Plus (editors@indiegamesplus.com) · iGame Mag ("Indie Spotlight:", admin@igamemag.com). **Roundup Next Fest**: GamesRadar+, PC Gamer, PCGamesN (lauren.bergin@pcgamesn.com), RPS. **Post-uscita**: Buried Treasure (hello@buried-treasure.org — solo giochi finiti).

**Playbook timing (da postmortem pubblici)**: demo online ≥6-8 sett PRIMA del fest → subito email ad ABG/IGP/iGameMag → 3-4 sett pre-fest: Keymailer (tier a pagamento, ROI documentato ~€1.4k) + 30-60 cold email mirate (key+pitch 2 righe+trailer, MAI "fammi sapere se vuoi una key") → post-fest: roundup press → lancio: stampa italiana con angolo solo-dev (Multiplayer.it, The Games Machine, Everyeye — la storia umana vende più del gameplay in IT). Woovit è MORTO (chiuso dic 2024): alternative PlayScout/Gamosy. Conversione realistica: 30 cold email → 0-1 video; Keymailer 10 req → ~2 video; paid tier funziona meglio.

## 7. Modalità di fallimento (P10) e mitigazioni

Correzione posizionamento (Director, nov 2026): il gioco è **manageriale/dispatch** (assegni eroi → quest → risorse, base Lords of Waterdeep) con elementi roguelite blandi — NON incrementale, NON roguelite puro. Struttura sistemica vicina a Cultist Simulator + fantasy. Community giuste: management-sim, boardgame digitali, nicchia Cultist Sim — non r/roguelites.

| # | Come si cade nel P10 | Perché uccide | Mitigazione | Stato |
|---|---|---|---|---|
| 1 | Pagina pubblicata tardi | il tempo-pagina-online è la variabile dominante (wl/settimana × settimane) | pubblicare appena il video è decente; target ≥4-6 mesi prima del lancio | ⏳ attende video |
| 2 | Hook illeggibile in capsule | nel mare di pixel-art gestionali, il percepito decide in 2 secondi | smoke test: capsule+pitch su community management/boardgame/CultistSim prima del lancio; la mappa pittorica È il differenziale | asset pronti |
| 3 | Next Fest senza audience | mediana +11 follower se parti <500 → non moltiplica | costruire follower PRIMA: pagina live, devlog, post community → entrare al fest da ≥500 | giugno? |
| 4 | Demo che non vende | i primi 10 min decidono wishlist+review | demo = polish priority #1 dopo il video | in corso |
| 5 | Posizionamento/tag sbagliati | audience sbagliata → conversione bassa | tag onesti (Management, Strategy, Fantasy; Roguelite solo se marcato); mirare pubblico boardgame/CultistSim | deciso |
| 6 | AI-art percepita male | disclosure mal gestita → sentiment negativo | disclosure onesta "AI-assisted, solo-dev directed"; controllo qualità anti-"AI slop"; la storia produttiva è FORZA, non vergogna | da scrivere |
| 7 | Poche review al lancio | <50 review = invisibile all'algoritmo | €14,99 + sconto lancio 10% per massimizzare volume wk1 → review velocity | piano |
| 8 | Nessun creator copre | coverage = il differenziale P50→P90 | seeding list creator management/strategy mid-tier + Keymailer pre-lancio | da fare |
| 9 | Over-scope / ritardo | il tempo perso costa la finestra Next Fest | scope=piccolo rifinito; deadline interna al video | regola |
| 10 | Percepito "web game = cheap" | resistenza al premium | presentation premium (capsule/trailer/pagina) + demo che dimostra profondità | asset pronti |
| 11 | Burnout solo-dev | percorso Stonedeep (abbandono a 104 review) | scope disciplinato, pipeline MW, ~5h/wk sostenibile | regola |
| 12 | Promesse pagina ≠ gioco | review negative → spirale | copy onesto, niente feature promesse non shipped | da scrivere |

**Il fallimento statistico #1 è il n.1** (pagina tardi + zero audience = 48,7% dei lanci <10 review). Tutti gli altri sono prevenibili con la checklist qui sopra eseguita in ordine.

## 8. Rischi e note oneste
- Entrate da arte/map pack: ~€0 finché non c'è audience — sono asset di funnel, non income.
- Publisher senza video = primo impatto bruciato; batch-submit solo post-video.
- "Prestanome" non è strategia: i bandi verificano ruoli reali; la co-founder deve lavorare davvero.
- Il collo di bottiglia unico resta il **gioco/video** — tutto il resto è pronto e aspetta.
