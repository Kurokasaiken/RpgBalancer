---
title: "PLAN-043 — /game, tutta la superficie: architettura 3-Zone Zero-Overlap, materia base unificata, slot castone 64px, dittico spedizione (Planner + Quest) e pass sistematico HUD"
status: in corso
revision: 4 (2026-10-17 — ristrutturazione AAA in 6 Workstream WS-0..WS-5 sopra i sotto-plan S0..S12, processo un piano alla volta in multi-AI web; rev.3 master + S0..S12; rev.2 scope /game)
baptized: 2026-10-16 (Director «il piano è finito, procedi»; rev.4 approvata 2026-10-17 «1, poi dobbiamo fare questo processo un piano alla volta in modalità multi ai web»)
owner: Mind Weaver
created: 2026-10-16
source_request: R-207
documentation_impact: REQUIRED
doc_targets:
  - plans/INDEX.md
  - RICHIESTE.md (esito R-207)
  - CURRENT_STATE.md
  - src/docs/docs/design/hud_component_guide.md
  - src/docs/docs/idle_village/interaction_core_spec.md (slot: geometria 64px, ordine dei layer, re-bite sullo swap, calamita su /game)
  - src/docs/docs/idle_village/quest_ui_component_guide.md (3-Zone Stage Contract, dittico Planner/Quest)
  - src/docs/docs/idle_village/COMPONENT_MASTER_INDEX.md
  - src/docs/docs/plans/PLAN-058_hud_roster_unification.md (gate F1/F4/F5 chiusi qui, vedi §1)
desiderata: nessuna nuova — lavora dentro v4, v11–v20, v23, v27 (+ deroghe R-199), v30, v31 FROZEN
related: PLAN-036, PLAN-040, PLAN-042 (completati), PLAN-058 (HUD come il Roster — resto assorbito qui)
---

# PLAN-043 — `/game`, tutta la superficie (rev.4 — Architettura a 6 Workstream)

## 0. Richieste del Director (2026-10-16 / 2026-10-17, verbatim)

> *"Cosa importantissima: il componente della Preview Quest deve essere esaminato attentamente e riscritto al meglio, attualmente nn sn molto convinto di cosa è dove, ecc. Inoltre gli slot esteticamente nn m convincono tantissimo come colori cn questa nuovo setup d colori, e quando c'è una pg assegnato nn vedo + il coso sopra che lo blocca. E la funzione per swappare un pg assegnato da uno slot ad un altro slot (senza prima estarlo e farlo tornare al roster) o swappare due pg già assegnati a slot nn funziona."*
>
> *"Stesso discorso x il componente che mostra la quest vera (cominciamo da sterminio goblin). Attualmente i componenti interni sn strani, brutti, ecc (il 'Mini roster', la bag, ecc), c'è da lavorarci. I pulsanti sn tipo poco visibili, occupano una quantità di spazio nn corretta, e nn lo vedo abbastanza 'cinematografica', gli esiti nn m piace come sono comunicati, e vorrei un po' + tipo 'esperienza cinematografica'. Anche la presentazione dello skill check nn m fa impazzire, le proporzioni, ecc."*
>
> *"E vorrei anche vedere i componenti quando premi i pulsanti che aprono componenti (ad esempio la quest)"*
>
> *"pensavo questo plan fosse su molte + cose. solo gli eroi hanno un portrait, gli altri ancora no, è corretto che sia scuro. Dobbiamo valorizzare meglio i componenti belli cm lo skill check, risolvere i fix, fare un componente quest che sia + cinematografico, ecc"* · *"Gli slot nn hanno la componente 'magnetica' che se lasci un medaglione da quelle parti viene assegnato li? sn brutti gli slot adesso? e gli slot assegnati nn hanno perso il componente ghiera che si chiude?"*
>
> *"1) tutti 2) il colore dello slot nn c sta bene, idem la ghiera. Hai capito 'lo spirito' del componente? fanne una critica e una proposta per migliorarlo. sto facendo il commit e push, continua con la pianificazione"*
>
> *"1, poi dobbiamo fare questo processo un piano alla volta in modalità multi ai web"* (2026-10-17 — approvazione della ristrutturazione AAA in 6 Workstream `WS-0`→`WS-5` e deliberazione/critica multi-AI web un piano alla volta).

## 1. Goal, architettura spaziale e non-goals

**Goal.** Ogni componente di `/game` funziona, appartiene alla stessa famiglia visiva (la skin scura predefinita «Layout Primitives» / `base`, con il Roster come metro — **Lacquer Atlas è bocciata**, Director 2026-10-16), rispetta meccanicamente il vincolo **Zero-Overlap («nessun componente sopra un altro, mai»)** anche a `1280×720` / `1280×800`, e trasforma preparazione (`Planner`) ed esecuzione (`QuestRunWindow`) in un **Dittico Spedizione** coerente e cinematografico a 60 fps.

### 1.1 Il «3-Zone Stage Contract» (Zero-Overlap garantito per costruzione)

Per impedire che l'apertura di compagni, skill check, picker o scheda eroe superi i `1280px` o copra altri componenti, lo spazio tra `Top HUD Band` (`92px`) e `Bottom HUD Band` (`88px`) è governato da 3 zone orizzontali con **mutua esclusione per ala**:

```
┌───────────────────────────────────────────────────────────────────────────────┐
│ TOP HUD BAND (92px max): [Obiettivo]        [Giorno/Ora]        [Risorse/Menu]│
├──────────────────┬─────────────────────────────────────────┬──────────────────┤
│   LEFT WING      │              CENTER STAGE               │    RIGHT WING    │
│  (260–320px)     │      (640–720px @1280 | 920px @1920)    │   (300–420px)    │
│                  │                                         │                  │
│ • In Mappa/Plan: │ • Mappa Continente / Vista Villaggio    │ • In Planning:   │
│   Roster V2      │ • OPPURE: Quest Planner (Atto I)        │   Forecast/Why   │
│ • In Quest Run:  │ • OPPURE: Quest Theatre (Atto II)       │   ↔ BagPicker    │
│   Drawer unico   │   (Immagine 21:9 + Scelte 1-2 righe)    │   ↔ HeroSheet    │
│   Party|Bag|Log  │                                         │ • In Quest Run:  │
│   (1 attivo)     │                                         │   Astrolabio +   │
│                  │                                         │   Toggle salto + │
│                  │                                         │   Carta Esito    │
├──────────────────┴─────────────────────────────────────────┴──────────────────┤
│ BOTTOM HUD BAND (88px max):              [Nav Plinth: Map | Village | ...]    │
└───────────────────────────────────────────────────────────────────────────────┘
```

- **Budget orizzontale a 1280px:** `Left Wing (260px) + Center Stage (640px) + Right Wing (340px) = 1240px ≤ 1280px` (`0 px²` di sovrapposizione).
- **Mutua esclusione per ala:** nel `Right Wing` durante il Planning vivono `Forecast`, `BagExternalPicker` o `HeroSheetPanel` (quando se ne apre uno transiente, sostituisce/sospende quello sotto nello stesso slot senza mai coprire `Center Stage` o `Left Wing`); durante la Quest Run nel `Right Wing` vive il **Palco del Destino** (Astrolabio nudo + 2 toggle salto sotto + Carta dell'Esito integrata sotto l'astrolabio, abolendo `QuestOutcomeToast` sopra la nav).

### 1.2 Non-goals
- Meccaniche di gioco e motore (`questRun.ts`, grafo, scenari, risoluzione, economia): read-only.
- Logica interna del board `DestinyAstrolabeV62` (kit frozen): non si cambia la geometria/copertura v11–v20; si interviene solo su dimensione/backing-store del canvas di mount e sullo stop del loop `rAF` post-settle per eliminare il drop a 32 fps.
- Nuovi contenuti (quest, edifici, mostri), audio, ritratti degli abitanti (la sagoma scura per i non-eroi è corretta).

## 2. Stato di partenza (Fatti verificati in F0)

Evidence in `test-results/plan-043/F0-gate.md`, `F0-baseline.md`, `F0-audit.md`, `capture/shots/`:
- **Audit statico:** 64 componenti, 29 senza guardiani, 11 con colori letterali (292 occorrenze), 7 con testo < 12 px, 2 con `lucide-react`, `BagStrip` orfano.
- **Debito test & verifiche:** 10 test unitari preesistenti rotti in `ResidentSlotRack.medal.test.tsx` e `useExtractionStateMachine.test.ts`; E2E modificati in S4 (`gameQuestExpedition`, `gameQuestLifecycle`) ancora da eseguire; 0 verification bundle R-189 ancora emessi per S1–S7.
- **Slot (`SlotV12Renderer`):** disegna il castone a raggio `73` su `viewBox 240×240` (63% di area vuota); per avere un ritratto di `40px` il secondo tentativo di S5 ha gonfiato il box DOM a `83px`. Inoltre nello swap (`T1.9`) lo slot target è già occupato (`bezelRotateDeg === 0`) e quindi non riesegue l'animazione `open → close → bite`.
- **Prestazioni Astrolabio:** durante i 3 s del verdetto gira a ~32 fps (`3006 ms` di CPU Canvas2D in 3 s su un canvas `800×800`).

## 3. Architettura Esecutiva: I 6 Workstream (`WS-0` → `WS-5`) e Mappa dei Sotto-Plan (`S0`–`S12`)

Ogni sotto-plan `PLAN-043-S0…S12` conserva la richiesta verbatim e il dettaglio del singolo tema, ma **l'ordine di progettazione multi-AI web ed esecuzione segue rigorosamente i 6 Workstream architetturali qui sotto**, un piano alla volta:

> **Regole di dispatch (Director, 2026-10-17):** ogni workstream ha un brief in
> `test-results/plan-043/<ws>/IMPLEMENTATION-BRIEF.md` + artifact vincolante
> (`artifact-rNNN.md`). L'agente che prende in carico un workstream **deve
> segnare «in corso»** nella riga del master qui sotto e in `plans/INDEX.md`
> al momento della presa in carico, e **«terminato» solo dopo i test** +
> `verify:bundle` PASS citato. Più workstream possono correre in parallelo
> sul worktree condiviso (T-13: niente commit scoped; un agente non committa
> mai file fuori dal proprio scope).

| Workstream | Obiettivo Architetturale | Sotto-plan inclusi (`S0`–`S12`) | Stato | Gate / Contratto |
|---|---|---|---|---|
| **WS-0 + WS-1 · Fondazione/Test Gate + Castone Meccanico 64px & Fisica Swap** — *dibattito multi-AI web **converged** 2026-10-17: **`artifact-r009.md`** (hash `63f3735f…`) accettato 4/4 (chatgpt/claude/gemini/grok), run `.mw/runs/20261017-plan043-ws0ws1-foundation-slots/` (mind-weaver); 15 obiezioni WITNESS-01..15 tutte disposte* | 1) WS-0: `verification.json` prima del codice, riparare i 10 unit test rotti a contratto (`T-14`), eseguire gli E2E S4, cattura baseline `/slot`, token `base` oro brunito/bloom ottone su `/game`; 2) WS-1: variante `hud64` (non tocca il lab `/slot`), `viewBox -79 -79 158 158` → morso **2.56px**, ritratto 44px, due piani SVG/DOM/SVG (fix bug occupante nascosto); 3) `T1.9`: `<SeatCycle key={seatNonce}>` — `commitSwap` atomico, slam via attivazione CSS post-flip (restart unico, spec-guaranteed), denti via WAAPI `animate()` from/to espliciti `fill:'backwards'` timing congelato 70/200ms, flip exactly-once rAF+timeout(48ms); 4) magnet `radiusPx 120→129.5` scope slot-only. | [S0](PLAN-043-S0-baseline-audit.md) (fatto), [S3](PLAN-043-S3-quest-mappa-stato-iniziale.md) (fatto), [S4](PLAN-043-S4-goblin-senza-scena-iniziale.md), [S10](PLAN-043-S10-oro-e-bloom-hud.md), [S12](PLAN-043-S12-riesame-chiusura.md) (T7.3b anticipato), [S1](PLAN-043-S1-slot-scambio-calamita.md), [S5](PLAN-043-S5-slot-incastonatura.md) | implementato 2026-10-17 (agente locale Devin) — tutte le obbligazioni automatizzate PASS in `verify:bundle` (BV-01..05, 07a/b, 08, SAFE; verifier 9/10); **in attesa signoff Director BV-06** su `capture-sheet/` | BV-01..BV-08: byte animazioni congelati + `/slot` diff 0px; 64/44/2.56px geometria; lock visibile; slam fresco `currentTime<100ms` entrambi gli slot + race swap rapido; no-regress calamita; materiale NMM + testimone Director; test gate; StrictMode/race |
| **WS-2 · Window Manager «3-Zone Stage» & Non-Occlusione** — *dibattito multi-AI web **converged** 2026-10-17: **`artifact-r005.md`** (hash `af2b5193…`) — r003 accettato 4/4; r005 post-ruling Director accettato da chatgpt+gemini, claude autore dei delta ma rate-limited, grok in dissenso (WITNESS-04 respinto); run `.mw/runs/20261017-plan043-ws2-three-zone-stage/` + `…-ws2-rulings-reconcile/`; 3 obiezioni disposte; **ruling Director applicati:** margini E=24 invariati → floor `floorA 236/640/340` (o `floorB 260/616/340` se roster min-content >236), planner trascinabile, TUTTI i pannelli trascinabili+strip, roster+stash co-visibili stack verticale leftWing, heroSheet overlay in entrambi i regimi (G.7 da confermare)* | 1) Config `gameFrameConfig.stageZones` (Zod): `E=12`/`G=8` overhead ≤40px derivato con test aritmetico `2E+2G+260+640+340≤1280`; 2) Regimi `generic`/`run`: il cluster quest è **un solo occupante whole-stage**, interni F5 congelati; 3) Solver puro `solveStageLayout` — stessa risposta per render/drag-clamp/verifica, `leftW=clamp(260, vw−40−640−340, 400)` elastico, isteresi 24px sul collasso; 4) Occupancy per ala `empty→occupied→suspended→occupied`: suspended = montato + `visibility:hidden`+`inert`+`aria-hidden`+focus-redirect, **mai smontato**, deregistrato dallo stack overlay; 5) Commit protocol: `{state,revision}` snapshot, effetti revision-guarded `useLayoutEffect` pre-paint, callback stantii no-op; 6) Drag: pointer-x sceglie la zona target, target occupato → clamp-back alla sorgente, drop mai sospende, `activeDrag` singolo, `openSeq` monotono nel reducer; 7) Run-start: transitori di sessione (BagExternalPicker) RETIRE, persistenti suspend+restore; open durante run = reject+toast, niente coda; 8) Provider possiede `stageIntent={userCenterX}`, dep unidirezionale → solver F5, `shiftX` mai persistito; 9) Planner (`questDetail`) entra nel registry (migrazione additiva) così Escape/probe lo vedono. | [S6](PLAN-043-S6-scheda-personaggio-posizione.md), [S2](PLAN-043-S2-pulizie-menu-bag-regioni.md) (T1.3, T1.6) | **implemented** 2026-10-17 — bundle PASS `.mw/runs/20261017-plan043-ws2-three-zone-stage/bundle.json` (OB-01..05; conferma visiva Director G.6/G.7 aperta) | BV-01..BV-11: `0px²` overlap su 4 viewport × stati; drag-clamp bit-identico (1000 intent); suspend/restore 0 drift; isteresi sweep 1250→1330; handoff regime mid-drag senza frame di overlap (frame sampler); retire policy; race reducer; panel sospeso non consuma input/focus/Escape; invariante aritmetico; `verify:bundle`+`closure:lint`; StrictMode |
| **WS-3 · Atto I del Dittico: Quest Planner / Preview** — *dibattito multi-AI web converged 2026-10-17 (`artifact-r004.md` 4/4) e **battezzato dal Director** («Dispatch table / drag / N day / dispatch fai tu») come **`artifact-r005.md`** (hash `f2d46399…`, copia in `test-results/plan-043/ws3/`): Dispatch Table adottato; Planner = **unità trascinabile** sotto il solver condiviso (anchor-only, coerente col ruling WS-2 «pannelli trascinabili»); durata in giorni interi `1 day`/`N days` (round-half-up, min 1); campo `dispatch?` opzionale adottato. Layout: hero letterbox ~150px con sigilli incisi Danger/Reward/durata + fallback `coverArt→sceneArt→cresta`, rack ordine di marcia TESTA→CODA con strip esposizione statica, loadout, Selection Tray ~88px on-demand residenti|item, footer `Send expedition`+`Back to map`; RIGHT WING Forecast pinnato (mai nascosto durante edit — delta live v23); LEFT WING pool compagni. Gate bloccanti `AC-01..AC-23`, task `TS-0..TS-7`.* | Ridisegnare `QuestExpeditionDetail` dentro il `3-Zone Stage`: 4 domande decisionali in lingua umana (via `"ticks"`), Banner 21:9, 4 Slot Castone 64px con Esposizione Posizionale `0/0/20/80` sotto, 3 Slot Bag + pillola scelta, e Sidecar `Right Wing` con Stat Chiave, `BY MEMBER` e `WHY` causa→effetto; CTA ancorata zero-scroll `≥720px`. | [S8](PLAN-043-S8-preview-quest.md), [S2](PLAN-043-S2-pulizie-menu-bag-regioni.md) (T1.4) | **implemented** 2026-10-17 (agente locale Devin) — bundle PASS `.mw/runs/plan043-ws3-quest-planner/bundle.json` (AC-LAYOUT/FLOW/UNIT/SWAP-REBITE/SAFE; verifier 5/5); T-04: review visiva Director aperta | Deliberazione multi-AI web + Mockup D1 approvato dal Director → E2E `gameQuestPlannerLayout`, `gameQuestExpedition` verdi; bundle `ws3` |
| **WS-4 · Atto II del Dittico: Quest Theatre, Astrolabio 60fps & Carta Esito** — *dibattito multi-AI web **converged** + **battezzato** 2026-10-17: **`artifact-r003.md`** (hash `df5d49d3…`, copia in `test-results/plan-043/f5/`) accettato 4/4 su r002 + emendamenti Director («niente Continua da nessuna parte»), run `.mw/runs/20261017-plan043-f5-quest-cinematic/` (mind-weaver)* | 1) Portare l'Astrolabio da 32 a **60 fps durante il lancio** (cap backing-store canvas a misura reale `≤480px` + stop rAF post-settle); 2) `Center Stage`: header a 3 pillole con etichetta, scena 21:9 fusa col testo + regia data-driven (`stageDirection`), scelte compatte su 1–2 righe con `%`, piede umano + abbandono inline rosso ferita; 3) `Left Wing`: Party Status Strip dedicata (senza bug `"NESSUNO SLOT COMPATIBILE"`); 4) `Right Wing`: Astrolabio senza placca + 2 toggle salto sotto + Carta dell'Esito integrata (via `QuestOutcomeToast`); `QuestRewardPopup` come Carta del Bottino R2.4. | [S7](PLAN-043-S7-componenti-belli.md), [S9](PLAN-043-S9-famiglia-quest-redesign.md), [S2](PLAN-043-S2-pulizie-menu-bag-regioni.md) (T1.5) | **implementato** 2026-10-18 (agente locale Devin) — suite E2E BV seriale 11/11 verde (`gameQuestCluster.spec.ts`), unit 217/219 (2 residui fuori scope T-13); bundle `.mw/runs/plan043-ws4-quest-theatre/bundle.json` **PASS** 14/14 bloccanti + verifier 14/14 CONFIRMED (I18N-DEBT non-bloccante, debito pre-esistente) | Deliberazione multi-AI web + Mockup/Prototipo approvati → FPS check `≥55 fps` su `vite preview`; `0 px²` overlap; E2E `gameQuestLifecycle`, `gameQuestFullFlow` verdi; bundle `ws4` |
| **WS-5 · Pass Sistematico Resto HUD `/game` & Chiusura** — *dibattito multi-AI web **converged + battezzato dal Director** 2026-10-17 («battezzo, procedi»): **`artifact-r002.md`** (hash `bb461507…`, copia in `test-results/plan-043/ws5/` + `IMPLEMENTATION-BRIEF.md`) — accettato 3/4 (chatgpt, gemini, grok); claude rimosso `provider_dead` (rate-limit per tutta la run, 0 turni); run `.mw/runs/20261017-plan043-ws5-hud-pass-closure/` converged seq 43. Deciso: SCHEDA schema (facts vs F0-evidenza vs proposta, `configMigrationNote` obbligatorio se hardcoded, stato ortogonale non lineare), 6 batch S11 + transversale, gate nonblocking-audit, `STRICT_FILES` = unione registry+glob+import-graph (TS Compiler API) con test anti-drift, F0 re-audit baseline 1280×720/1920×1080/2560×1440 **+ supplementare 1366×768** (G.3), bundle manifest+evidenze con `closure:lint`, lucide→engraved icons sulle superfici shipped (dev-tool possono trattenere lucide — G.1), **scope audit = TUTTI i componenti /game scoperti meccanicamente** (G.2), sequencing audit-only finché WS-2 non landa* run `.mw/runs/20261017-plan043-ws5-hud-pass-closure/`. Deciso: SCHEDA schema (facts vs F0-evidenza vs proposta, `configMigrationNote` obbligatorio se hardcoded, stato ortogonale non lineare), 6 batch S11 + transversale, gate nonblocking-audit, `STRICT_FILES` = unione registry+glob+import-graph (TS Compiler API) con test anti-drift, F0 re-audit baseline 1280×720/1920×1080/2560×1440 **+ supplementare 1366×768** (G.3), bundle manifest+evidenze con `closure:lint`, lucide→engraved icons sulle superfici shipped (dev-tool possono trattenere lucide — G.1), **scope audit = TUTTI i componenti /game scoperti meccanicamente** (G.2), sequencing audit-only finché WS-2 non landa* | 1) Schede e allineamento per HUD fisso (Gate F1 PLAN-058), Sigillo POI e cursori (Gate F4/F5 PLAN-058), Vista Villaggio/Registro (fix font `<12px`), rimozione `BagStrip` orfano (D4) e `lucide-react`; 2) Estensione `STRICT_FILES` in `hudGuards.test.ts` a tutti i componenti di `/game`; 3) Riesecuzione audit F0 + verifica finale e chiusura R-207. | [S11](PLAN-043-S11-altri-componenti.md), [S12](PLAN-043-S12-riesame-chiusura.md), [S2](PLAN-043-S2-pulizie-menu-bag-regioni.md) (T1.7, D4) | **in corso** — fase audit-only presa in carico 2026-10-18 (agente locale Devin); WS-2 landato (bundle PASS) → componenti solver-managed auditabili; D9 Director pending, implementazione non avviata | D9 Director per batch (keep/redo/merge/remove); audit F0 a zero violazioni; audit F0 a zero violazioni; bundle finale `plan-043` + `closure:lint` PASS |

### Indice completo dei Sotto-Plan atomici (`S0`–`S12`, tracciabilità per richiesta)

| Sotto-plan | Richiesta | Workstream | Stato | Cosa resta |
|---|---|---|---|---|
| [PLAN-043-S0](PLAN-043-S0-baseline-audit.md) | Baseline e audit: catture, audit statico | WS-0 | completed | T0.4 runtime in WS-5 / S12 |
| [PLAN-043-S1](PLAN-043-S1-slot-scambio-calamita.md) | Scambio tra slot, calamita, estrazione col tasto premuto | WS-1 | active | chiudere T1.9 (re-bite animazione nello swap) + test rotti + gate Director |
| [PLAN-043-S2](PLAN-043-S2-pulizie-menu-bag-regioni.md) | Pulizie: P/Q, bag, clic sulle regioni, colori, testo piccolo | WS-2 / WS-3 / WS-5 | active | T1.5 in WS-4; T1.7 e D4 `BagStrip` in WS-5 |
| [PLAN-043-S3](PLAN-043-S3-quest-mappa-stato-iniziale.md) | Quest sulla mappa, «Stato iniziale» = partita nuova, nessuna scadenza | WS-0 | completed | includere nel bundle WS-0 |
| [PLAN-043-S4](PLAN-043-S4-goblin-senza-scena-iniziale.md) | Quest goblin senza scena d'apertura, consumabili armati dal planner | WS-0 | active | eseguire gli E2E modificati; provare un consumabile nel bag |
| [PLAN-043-S5](PLAN-043-S5-slot-incastonatura.md) | Slot: scala d'oro, misura 64px (`viewBox` calibrato), bloom | WS-1 | active | calibrare `viewBox` a 64px (invece di box 83px), identità pixel `/slot`, sì Director |
| [PLAN-043-S6](PLAN-043-S6-scheda-personaggio-posizione.md) | Scheda personaggio che non copre i pannelli | WS-2 | active | integrare nel `3-Zone Stage` (`Right Wing`) per 0 overlap anche sul Roster a 1280 |
| [PLAN-043-S7](PLAN-043-S7-componenti-belli.md) | Componenti belli: skill check, inventario, arte, asset | WS-4 | completed | al Director: generare le scene delle rovine e il «ritorno» |
| [PLAN-043-S8](PLAN-043-S8-preview-quest.md) | Preview quest riscritta (Atto I del Dittico) | WS-3 | implemented | `artifact-r005` battezzato 2026-10-17; bundle PASS `.mw/runs/plan043-ws3-quest-planner/bundle.json` |
| [PLAN-043-S9](PLAN-043-S9-famiglia-quest-redesign.md) | Famiglia della quest: finestra, skill check 60fps, esito, compagni, abbandono (Atto II) | WS-4 | implemented | `artifact-r003` battezzato 2026-10-17; implementato 2026-10-18 (Devin): bundle `plan043-ws4-quest-theatre` PASS 14/14; T-04 review visiva Director aperta |
| [PLAN-043-S10](PLAN-043-S10-oro-e-bloom-hud.md) | Oro e bloom nel resto del HUD | WS-0 | candidate | anticipato in WS-0 come fondazione token `base` |
| [PLAN-043-S11](PLAN-043-S11-altri-componenti.md) | Tutti gli altri componenti di /game | WS-5 | active | audit-only completato (2026-10-18): inventario §C D=420, bozze SCHEDA + D9 in `test-results/plan-043/ws5/`; attende decisioni Director |
| [PLAN-043-S12](PLAN-043-S12-riesame-chiusura.md) | Riesame completo e chiusura | WS-5 | active | audit baseline 4 viewport + defect records fatti; chiusura dopo implementazione + D9 |

### Plan collegati già chiusi o in corso

| Plan | Cosa | Stato | Rapporto con PLAN-043 |
|---|---|---|---|
| [PLAN-036](PLAN-036-quest-planner-redesign.md) | Planner della quest (banner, bag) | completed | base di partenza per WS-3 ([S8](PLAN-043-S8-preview-quest.md)) |
| [PLAN-040](PLAN-040-quest-window-skillcheck-outcomes.md) | Finestra della quest: skill check esterno, toast d'esito, ricompensa | completed | superato e rifatto da WS-4 ([S9](PLAN-043-S9-famiglia-quest-redesign.md)) |
| [PLAN-042](PLAN-042-village-registry.md) | Registro del villaggio | completed | verifica d'integrazione e font ≥12px in WS-5 ([S11](PLAN-043-S11-altri-componenti.md)) |
| [PLAN-058](../src/docs/docs/plans/PLAN-058_hud_roster_unification.md) | HUD come il Roster: lastre, icone, Sigillo, cursori, scala dell'interfaccia | in corso | i gate F1/F4/F5 rimasti aperti si chiudono in WS-5 ([S11](PLAN-043-S11-altri-componenti.md)) |

## 4. Vincoli, desiderata e trappole

| Vincolo | Cosa impone |
|---|---|
| v4 FROZEN | Pannelli flottanti, spostabili, riducibili, chiudibili; niente backdrop né modale bloccante: il «cinematografico» non blocca il mondo. |
| v23 FROZEN | Preview: zone PARTY / LOADOUT / OUTCOME, `BY MEMBER`, delta live, `WHY`, reversibilità esatta. Il nuovo layout di WS-3 sta dentro queste zone (D1). |
| v27 FROZEN + deroghe R-199 | Il theatre ospita, non rifà; niente auto-risoluzione; reward fuori dal theatre; companion chiusi di default; direzione **film interattivo** con regia data-driven (`stageDirection`). |
| v11–v20 FROZEN | Materia e regole visive dell'astrolabio: non si cambia la logica del board; si ottimizza il canvas backing-store e lo stop del ticker post-settle. |
| v30 FROZEN | Vista Villaggio e Menu Edifici. |
| v31 FROZEN (R-208) | Workflow single-agent con chiusura a contratto (`verification.json` → `verify:bundle` → `bundle.json` → `closure:lint`). |
| Skin (Director 2026-10-16) | **Lacquer Atlas è bocciata**: si usa la skin scura predefinita `base` («Layout Primitives»), con oro brunito non piatto e bloom ottone morbido unificati in WS-0. |
| `interaction_core_spec.md` | Coreografia dello slot, bloom, volo, estrazione: moduli condivisi, una sola implementazione, re-bite attivo anche sullo swap. |
| PLAN-058 / `hud_component_guide.md` | «Sembra il Roster»; §6 (area ≥ 32×32, scala 12/13/14/16/20/24, stati, tooltip, checklist §6.12); §5b.7 la mappa non si muove per i pannelli. |
| Workflow `painter` | Ogni nuovo design visivo (slot, preview, finestra della quest) passa da mockup → spec → componente, con artefatto verificabile a ogni fase. |
| Regola 16 | Ogni verifica a runtime headless/background; Tauri e qualsiasi finestra visibile sono step manuali del Director. |
| T-04 · T-05 · T-09 · T-13 · T-14 | Claim visivi con testimone; misure perf su `vite preview`; sessioni parallele; suite di test aggiornate ed eseguite subito quando cambiano nodi/hook. |

## 5. Protocollo Esecutivo (rev.4)

1. **Un piano / workstream alla volta in modalità Multi-AI Web** (richiesta Director 2026-10-17): prima di scrivere codice per un sotto-piano/workstream, se ne sottopone il design/spec alle AI web, si risolvono le critiche e si ottiene l'ok del Director.
2. **Esecuzione locale + Gate meccanico:** implementazione locale, test unitari + E2E + catture headless a `1280/1920/2560` (regola 16), produzione del verification bundle (`.mw/runs/plan043-wsN/bundle.json`) e approvazione visiva del Director prima di passare al successivo.

## 6. Decisioni aperte (le prende il Director)

| | Decisione | Quando |
|---|---|---|
| D1 | Layout finale della Preview Quest (Atto I del Dittico, dentro il `3-Zone Stage` e v23) | WS-3 ([S8](PLAN-043-S8-preview-quest.md)) |
| D2 | ✅ **Deciso (2026-10-16):** C «la finestra che respira» con B «scena a tutto schermo» come tag opzionale | WS-4 ([S9](PLAN-043-S9-famiglia-quest-redesign.md)) |
| D3 | ✅ **Deciso (2026-10-16):** l'astrolabio non si tocca, il verdetto si mostra fuori; l'esito compare **accanto** (mai sopra), le opzioni di salto vicino al check; regola generale «nessun componente sopra un altro, mai» | WS-2 / WS-4 |
| D4 | Rimuovere `BagStrip` (orfano) | WS-5 ([S2](PLAN-043-S2-pulizie-menu-bag-regioni.md)) |
| D5 | ✅ **Indirizzato:** slot in scala d'oro, cerchio interno = ritratto, ghiera visibile fuori che abbraccia il ritratto (in WS-1 con `viewBox` calibrato a 64px + re-bite sullo swap) | WS-1 ([S5](PLAN-043-S5-slot-incastonatura.md)) |
| D6 | ✅ **Deciso (2026-10-16):** sì a skill check, arte quest, vista Villaggio, glifi dipinti + generazione nuovi asset dal kit dei prompt | WS-4 ([S7](PLAN-043-S7-componenti-belli.md)) |
| D7 | ✅ **Deciso:** no, il clic su una regione non sposta la mappa | WS-2 ([S2](PLAN-043-S2-pulizie-menu-bag-regioni.md)) |
| D8 | ✅ **Deciso:** via le voci Scheda eroe e Quest in corso da menu Pannelli, menu di gioco e scorciatoie (P, Q) | WS-2 ([S2](PLAN-043-S2-pulizie-menu-bag-regioni.md)) |
| D9 | Esito delle schede di WS-5 ([S11](PLAN-043-S11-altri-componenti.md)), componente per componente | WS-5 |
| D10 | Esecutore: agente locale unico con revisione multi-AI web piano per piano | sempre |

## 7. Verifica finale (misurabile, headless)

- E2E verdi: `gameQuestFullFlow`, `gameQuestExpedition`, `gameQuestLifecycle`, `gameQuestPlannerLayout`, `gameQuestReveal`, `gameVillageView`.
- Unit verdi: `questRunWindow`, `questExpeditionBag`, `ResidentSlotRack.*` (inclusi `.medal` e `useExtractionStateMachine`), `residentXpAndSwap`, `questOutcomeToast`/`questOutcomeCard`, `questRewardPopup`, `questCheckOptions`, `villageBuildings`, `hudGuards`.
- Test di scambio (con re-bite animato), calamita e hold-extract con drag «umano»: 20/20 su entrambe le quest.
- Test geometrico `3-Zone Stage`: **0 px² di intersezione** tra i pannelli attivi a `1280×720`, `1280×800`, `1920×1080`, `2560×1440`.
- Prestazioni skill check su `vite preview`: **≥ 55 fps** durante il lancio e il verdetto, 0 rAF attivi a verdetto fermo.
- Audit F0 ripetuto: zero violazioni non motivate su tutti i componenti di `/game`.
- Evidence in `test-results/plan-043/` e bundle di chiusura validato da `npm run verify:bundle` e `npm run closure:lint`.
