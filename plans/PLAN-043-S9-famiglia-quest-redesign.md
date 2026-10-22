---
title: "PLAN-043-S9 — Famiglia della quest: finestra, skill check, esito, compagni, abbandono"
parent: PLAN-043
status: completed
created: 2026-10-17 (scorporato dal master PLAN-043; lavoro del 2026-10-16)
source_request: R-207
documentation_impact: REQUIRED
doc_targets:
  - src/docs/docs/idle_village/quest_ui_component_guide.md
  - src/docs/docs/design/hud_component_guide.md (regola «mai sopra»)
---

# PLAN-043-S9 — Famiglia della quest: finestra, skill check, esito, compagni, abbandono

Master: [PLAN-043](PLAN-043-game-quest-surface-pass.md) · stato operativo in [INDEX](INDEX.md).

## Richiesta (verbatim)

> *"Stesso discorso x il componente che mostra la quest vera (cominciamo da sterminio goblin). Attualmente i componenti interni sn strani, brutti, ecc (il 'Mini roster', la bag, ecc), c'è da lavorarci. I pulsanti sn tipo poco visibili, occupano una quantità di spazio nn corretta, e nn lo vedo abbastanza 'cinematografica', gli esiti nn m piace come sono comunicati, e vorrei un po' + tipo 'esperienza cinematografica'. Anche la presentazione dello skill check nn m fa impazzire, le proporzioni, ecc."* (2026-10-16)
>
> *"D2 C con B opzionale, D3 abbiamo già l'opzione x saltare le animazioni e il roll: ma nn è vicino a quando viene lanciato lo skill check. Lo skill check attuale sembra dentro un componente e nn deve, lascialo fuori.*
> *Il risultato dello skill check nn m fa impazzire, anzi, e sembra anche avere problemi dottimizzazione*
> *Il popup dell'esito è in una posizione strana, nn voglio che un compoente sia sopra l'altro, mai, deve apparire accanto.*
> *i pulsanti d quel compoennte sn troppo grandi, organizza il testo x essere su una sola riga o 2, rendi i pulsanti + carini, stondati, ecc. Rifai il design d tutto il compoennte"* (2026-10-17)
>
> *"tutti i componenti collegati al compoentne della quest, compreso il componente della quest. E dove ha i pulsanti, quando appaiono, ecc.*
> *a livello di design c sn dei fallimenti gravi"* · verdetto: *"Lascio l'astrolabio, verdetto fuori"* (2026-10-17)

## Direzione, grammatica e task (dal master rev.2)

- **Direzione del Director (2026-10-16, verbatim):** *"nn m fa impazzire la modalità libro illustrato, nn è il mood del progetto. ho detto cinematografico xè voglio sia + un 'film interattivo', cm feeling. [...] le scene hanno piccole animazioni (qualche shake, una entrata cinematica per le parti + importanti => nessuna scritta, solo un rettangolo nero (cn dentro l'immagine vera) che dal centro si apre lentamente, quando l'immagine è tutta visibile facciamo apparire anche il resto del testo"*. Il «libro illustrato» è scartato; la direzione è **film interattivo**, con una grammatica di inquadrature (proposta in chat 2026-10-16, da trasformare in mockup/prototipo).
- **Grammatica delle inquadrature — approvata dal Director (2026-10-16, «ottimo, benissimo»):** il peso di ogni battuta (scala dei tier del Pillar 1) sceglie il taglio:
  | Peso | Taglio | Resa |
  |---|---|---|
  | normale | stacco | dissolvenza breve dell'immagine, il testo segue |
  | importante | **apertura a rettangolo** | nero, l'immagine si apre dal centro in 1,2–1,6 s senza scritte; poi entra il testo |
  | impatto | pugno | scossone 0,15–0,25 s + lampo scuro |
  | prima del verdetto | fiato sospeso | fermo immagine ~100 ms, leggera desaturazione |
  | tensione | carrellata lenta | avvicinamento 3–5 % in 6–10 s; dopo una vittoria si allontana |
  | decisione pesante | bande nere | entrano mentre si sceglie, si ritirano dopo |
  Idee incluse: J-cut (una riga su nero prima dell'immagine, per gli agguati); dal POI alla scena (il medaglione si allarga nella prima inquadratura); sagoma del nemico per un istante (rara); fuoco sul testo (l'arte sfuma dietro testo e scelte, niente box sopra l'immagine); skill check come scena madre con **immagine d'esito** al posto del toast; titoli di coda col cast del gruppo (da valutare). Vincoli: ogni taglio si salta (R-199), «riduci movimento» = dissolvenza, niente blocco del mondo (v4), `clip-path`/`transform` leggeri per WebView. **Aperte:** il peso per battuta va scritto nei dati della quest (aggiunta di contenuto, decisione del Director); immagini d'esito e sagome da generare (D6).
- **Principio (Director, 2026-10-16, verbatim):** *"dobbiamo farlo x le quest in generale, quel tipo di lavoro, magari ci saranno i tag sulle fasi che ci aiuteranno a scegliere l'effetto (ovviamente nn tutte le fasi devono avere un effetto)"* → la grammatica **non è codice della quest goblin**: è un sistema generico di regia per qualunque quest. Una fase può portare un **tag di regia** opzionale (`cut: reveal | impact | breath | push | bars | …`); **senza tag, nessun effetto** (stacco normale). Il motore delle quest e i grafi non cambiano logica: il tag è un campo di contenuto/presentazione (`stageDirection`), letto da un controller di regia nella finestra della quest. Decisioni aperte (Director): nome e posizione del campo nello schema degli scenari; se il tag può essere dedotto dal tipo di fase (check, combattimento, viaggio) come valore predefinito; limite di effetti per scena.
- **T5.0 Prototipo (Sonnet, medio):** su `/quest-window-lab` con la quest goblin: apertura a rettangolo, pugno, fiato sospeso, skill check come scena madre. Verifica headless con catture per fotogramma; il giudizio sul movimento lo dà il Director a schermo (step manuale).
- **T5.1 Direzione cinematografica (Opus alto):** ricerca online e 2–3 direzioni compatibili con v4 e v27: rapporto immagine/testo, letterbox, tipografia del racconto, transizioni tra beat, ritmo dei reveal, come entrano skill check (F3) ed esiti. **D2**.
- **T5.2 Scheda per ogni interno:** header (sette icone), `PartyPips`, mini roster (`QuestPartyRosterPanel`), bag (`QuestBeltPlaque`), `CombatStrip`, `Theater`/`BeatStage`, scelte, `TimeBar`, `PhaseTile`/`NextTile`, `QuestLogPanel`, abbandono: tenere / rifare / unire / togliere, con mockup.
- **T5.3 Pulsanti:** una sola grammatica (primario / secondario / terziario, dimensioni, contrasto, spazio) per header, scelte, CTA, abbandona, ricompensa.
- **T5.4 Esiti:** da `QuestOutcomeToast` e `QuestRewardPopup` (PLAN-040) a un linguaggio coerente con D2 e con DESIGN_PILLARS R2.4 (l'esito come carta che si rivela). **D3**.
- **T5.5 Implementazione (Sonnet)**, un componente per sessione nell'ordine di D2.
- *Accettazione:* `questRunWindow.test`, `gameQuestLifecycle`, `gameQuestFullFlow`, `questOutcomeToast.test`, `questRewardPopup.test` verdi; catture per fase a 1280/1920/2560 con zero elementi fuori dalla placca.
- **Gate F5:** sì del Director.

## Stato (2026-10-17)

- **Ricerca D2/D3:** `test-results/plan-043/f5/D2-D3-ricerca-e-proposte.md`. **D2 = C con B opzionale; D3** = verdetto fuori dall'astrolabio, esito accanto, opzioni di salto vicino al check.
- **Proposta di redesign + mockup:** `test-results/plan-043/f5/redesign-quest-spec.md`, mockup `public/mockups/plan-043-quest/index.html`, catture `test-results/plan-043/f5/mockup/`. **In attesa dell'ok del Director prima del codice.**
- **Dibattito multi-AI web CONVERGENTE + BATTEZZATO (2026-10-17):** run `.mw/runs/20261017-plan043-f5-quest-cinematic/` (in mind-weaver), `artifact-r002.md` accettato 4/4 (`chatgpt`, `claude`, `gemini`, `grok`) su hash `064ed0ec…`; il Director ha poi emendato e battezzato (verbatim: *«niente Continua da nessuna parte, battezzo»*) → **`artifact-r003.md`** sha256 `df5d49d36a8910f8ae2bf0aab98bc5086e9a57ede5add15b5ed92ae5dc677b9b`, copia locale `test-results/plan-043/f5/artifact-r003.md`; `redesign-quest-spec.md` marcato SUPERSEDED (resta fonte della diagnosi F0/F3). Emendamenti r003: nessun pulsante `Continua`/`Continue` sulla superficie quest (Carta dell'Esito solo informativa, avanzamento click/tasto; conferma abbandono solo `[Abbandona]` + cancel implicito Escape/click-outside), `dismissArmDelayMs` 180→350ms, `BV-11..BV-14` aggiunti (expanded→check @1280, guardia dismiss, audio muto/sospeso + screen-reader, budget breath-filter WebKit), curva `clamp(760px,50vw,1040px)` ratificata. L'artifact definisce `QuestStageCluster` (solver puro `solveQuestClusterGeometry` + `userCenterX`/derived `shiftX`), FSM cinematico con `beatKey` monotonico, scala di salto R-199, WebAudio sample-accurate (T-10), Astrolabio `settledIdle` + `ResizeObserver`, header a 3 pillole, Micro-Belt inline, footer collassabile, Carta dell'Esito sotto l'Astrolabio, matrice bloccante `BV-01..BV-14`.
- **Prestazioni (misurate, headless):** durante il verdetto ~32 fps; il motore del kit ridisegna un canvas 800×800 a ogni frame (3006 ms di lavoro su 3 s). Né il velo né la dimensione della board ne sono la causa. Proposta: fermo immagine dell'astrolabio dopo il verdetto (non provato). Evidence `f3/check-perf.spec.ts`, `f3/check-profile.spec.ts`.
- **Implementazione WS-4 (2026-10-18, agente locale Devin — T5.1..T5.5 artifact-r003):** tutti i task eseguiti. `solveQuestClusterGeometry` (solver puro viewport-space + reserved slot per ali/tab, `questClusterGeometry.ts`); `QuestStageCluster` owner della geometria con drag-intent `userCenterX`/`userTopY` → `shiftX` derivato e reset a run-start; `QuestRunWindow` ridisegnato (header 3 pillole, theatre cinematografico aspect 2.4→2.1 expanded, Micro-Belt inline, footer C1 collassabile, abbandono inline, zero `Continua`); `QuestSkillCheckColumn` (right wing) con Astrolabio nudo + Verdict Card esterna + arm-guard `data-check-armed`; engine astrolabio `hideInternalCard`/`settledIdle`/`redrawOnce` + `data-astro-idle="parked"` (rAF parcheggiato, ambient CSS frozen); cinematica `questTheatreFx` config + `questTheatreSequencer` (beatKey monotonico, reveal/impact/breath/push/bars/j-cut/expanded) + `questTheatreAudio` (WebAudio lazy, cancel sicuro con wall-clock fallback su ctx sospeso); primitive `cinemaFx` v2 (JCutStage, StageImpactShake, PreVerdictBreath, KenBurnsDolly). **Bug reali trovati dai gate:** placca ignorava lo slot in cluster mode (width/height hard-coded) e `useHudPanelDrag` reclamp-observer scriveva transform in cluster mode (ora `disabled` + cleanup); suspended-AudioContext lasciava voci orfane nel live-set (fallback wall-clock); `handleChoose` istanziava AudioContext sotto reduced-motion; footer compresso sotto le scelte a 720p (choices ora shrink-proof, il theatre cede altezza). **Bug spec-side:** probe BV-01 misurava a metà della slide `wingTransitionMs` (ora `waitStableRects` attende zero animazioni running + floor 400ms); FPS headless SwiftShader giudicati baseline-relativi + floor, non 55 assoluti; arm-guard misurato via flag DOM in un solo tick in-page (no wall-clock race). **Spec:** `tests/e2e/idleVillage/gameQuestCluster.spec.ts` — BV-01..BV-14 seriali, contesto fresco per viewport (quest spesa non rilanciabile), metriche temporali + env attestation in `metrics-bvNN.json` per i gate dom-temporal. **Unit:** 16/16 questRunWindow, 12/12 sequencer/audio, 149/149 solver, surface 217/219 (2 residui = `QuestExpeditionDetail.tsx` di un'altra sessione, T-13). **Bundle:** `.mw/runs/plan043-ws4-quest-theatre/bundle.json` — **PASS** 14/14 obbligazioni bloccanti + verifier `verifier.json` 14/14 CONFIRMED; `I18N-DEBT` (i18n:validate repo-wide) non-bloccante, debito pre-esistente. **Aperto (T-04):** review visiva Director del risultato cinematico a schermo.

## Contratto di chiusura

- Ok del Director sul mockup → **ottenuto 2026-10-17** (battezzo `artifact-r003`).
- **Matrice bloccante `BV-01..BV-14`** dell'artifact r003 (zero-overlap probe 1280/1440/1920/2560, drag-reversibilità, mutua esclusione 1280p, `settledIdle` 0.0ms/frame, esito unico senza `Continua`, Micro-Belt live-delta, footer C1 + v27, skip ladder R-199, reduced-motion/T-10, safeguards, expanded→check @1280, guardia dismiss 350ms, audio muto + screen-reader, breath-filter WebKit).
- Unit e E2E della finestra (`questRunWindow`, `questOutcomeToast`, `questRewardPopup`, `gameQuestLifecycle`, `gameQuestFullFlow`) verdi.
- Catture a 1280/1920/2560: zero componenti sovrapposti.
- fps del verdetto misurati prima/dopo il fermo immagine (`settledIdle`, non `toDataURL`).
- Bundle di chiusura non ancora prodotto (`.mw/runs/plan043-{sid}/verification.json` → `verify:bundle`).
