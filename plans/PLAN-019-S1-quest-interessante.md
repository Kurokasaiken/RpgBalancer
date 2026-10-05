---
title: 'PLAN-019-S1 — La quest interessante'
status: active
created: 2026-10-02
baptized: 2026-10-02 (Director: "procedi", draft v4 consolidato dopo 3 round di critica web + critica esterna)
parent: plans/PLAN-019-quest-macro-plan.md
desiderata: '.mw/desiderata.md v24 FROZEN, rev.1 + rev.2'
request: R-076
---

# PLAN-019-S1 — La quest interessante

## Spec

### Scopo

S1 risponde a **una sola domanda**:

> La spedizione di RpgBalancer è divertente da giocare quando il giocatore prende decisioni sotto informazione incompleta e le sue decisioni modificano ciò che succede dopo?

La verifica avviene attraverso **una singola quest completa, scritta a mano**, giocabile in un laboratorio isolato. S1 non deve dimostrare: architettura corretta, engine generalizzabile, riuso di PLAN-018, generabilità, interesse del Planner, persistenza, necessità del combat, scalabilità narrativa.

**Il criterio di ogni meccanica è il divertimento, non il funzionamento** (Director, 2026-10-02: *«nn ci interessa che funzioni, deve essere divertente»*). Una meccanica sta nel lab nella forma **più economica che produce tensione**; si valuta sul momento drammatico che crea, non sulla correttezza della regola. Se toglierla non cambia il divertimento, esce. Se richiede infrastruttura per essere interessante, va a S2+.

### La tesi di design

```
NON SO TUTTO → raccolgo informazioni → capisco meglio → scelgo come affrontarla
→ la scelta determina quale problema affronto → rischio/prova/conseguenza
→ il nuovo stato modifica le mie possibilità → NUOVA DECISIONE
```

La quest deve produrre almeno una situazione in cui il giocatore pensa: *«adesso che so questo, non voglio più fare quello che avrei fatto prima»*.

### La quest di riferimento

**«La cassa delle sementi»** — non si cambia scenario per cercare una storia più interessante. Sequenza FROZEN: Partenza → Viaggio → Evento/Mercante → Esplorazione → Informazione/Conseguenza → Scelta di approccio → Prova/Risoluzione → Nuova esplorazione → Scoperta/Lore → Evento/Ricompensa → Prova-obiettivo → Scelta rientro/continuazione → Ritorno. Struttura fissata; contenuti da correggere dal Director (bozza AI: `.mw/runs/20261001-s1-reference-quest-draft/draft.md`; matrice di lavoro: `.mw/runs/20261002-s1-quest-design/quest-design.md`).

### Tre decision point minimi

- **A — interpretare la situazione:** investigare / osservare / approccio fisico / procedere con poche informazioni. L'esito modifica ciò che si sa o il problema successivo.
- **B — scegliere l'approccio:** infiltrarsi → Destrezza; entrare/parlare → Carisma; forzare → Forza+Costituzione. La composizione del party rende alcune soluzioni più naturali di altre.
- **C — rischio/continuazione:** dopo l'obiettivo, rientrare o continuare a esplorare: profitto assicurabile vs rischio di perdere tutto. Tensione senza combat.

### Confine del lab (anti-QuestEngine-v0.5)

`questScenario.ts` è **hardcoded**: `LaCassaDelleSementiScenario`, non un engine che supporta casualmente una quest. Stato minimo: nodo corrente, informazioni scoperte, scelte, ferite/morti/HP per slot, bottino, stato dell'obiettivo, leader vivo. Vietati: schema generico, registry, DSL, generatore, branching engine, pipeline di authoring.

### Rischio, ferite, morte — nella forma più drammatica possibile

Le meccaniche rev.2 non si validano come sistema: **stanno nel lab perché sono strumenti di tensione**. Forma più economica che produce il momento drammatico; al Gate si annota *se il momento è arrivato*:

- **Rischi ferita/morte per slot** — «mandare quella persona era rischioso» deve pesare (il morto esce, il ferito gioca con handicap definito in matrice).
- **Leader** — uno slot designato; se muore, la reward di quest è persa anche a obiettivo ottenuto. È la posta narrativa della spedizione.
- **Verdetto → rischi** — un tiro visibile produce il verdetto del gruppo (si riusano i 5 verdetti dell'Astrolabe perché esistono già); il verdetto sposta le chance personali (`win` −5pp, critici downgrade/upgrade). *Tensione cercata:* «bigwin = scampata per miracolo». **Componente battezzato (Director 2026-10-02): `DestinyAstrolabeV62`** (`/minimal-destiny-astrolabe-v6-2`, tar-goo WebGL2) — il lab lo usa via `destinyAstrolabeV62Kit` con `config.mode` forzato al verdetto già risolto dall'engine e `onResolve` che sblocca il «continua».
- **Bodyguard** — slot opzionale che intercetta il primo danno da skill check (non eventi, spell, combattimenti diretti, effetti diretti). *Tensione cercata:* «sacrifico lui per salvare il leader».
- **Death save** — confermato dal Director: su un esito di morte, tiro personale del **5%** per sopravvivere come ferito. Valore mock iniziale, si calibra al Gate.
- **Board wipe** — tutti i PG morti; nessun trigger speciale. Wipe = **si perde tutto** (bottino, reward, PG).

**Leggibilità del danno:** il giocatore deve capire *perché* qualcuno si è ferito (scelta → verdetto → esito personale). Se lo scenario contiene una fonte di danno non-check, il confine del bodyguard diventa osservabile in gioco.

### Esito e reward

Prova-obiettivo superata + leader vivo al ritorno = reward di quest. Fuga/ritirata = fallimento ma il bottino raccolto si tiene; fasi vinte possono dare extra. «Continua ad esplorare» dopo l'obiettivo trasforma il rientro in una scommessa sulla reward già conquistata.

### Preview compound: fuori da S1

Feature del Planner (S3), non deliverable di S1. Nel lab al massimo indicazione qualitativa dei rischi noti se gratuita.

### Mercante, lore, inventario

Mercante minimo: `hai X gold → oggetto costa Y → effetto osservabile → lo compri?`. Se nel playtest è «ah sì, c'era anche il mercante», si elimina. Lore che modifica una scelta successiva = prova del loop; lore decorativa = contenuto annotato.

### Mock strumentali vs critici

Ammessi: gold, inventario, persistenza fuori dalla run. **Critici:** le competenze — il criterio «l'approccio preferito varia col party» dipende dai loro valori; i mock devono preservare relazioni plausibili verso le stat del balancer (PG con `damage` alto = forte in Forza) e la riga resta marcata come prima da riverificare in S2. Se il Director non sente la perdita (mock) come costo, si annota il limite.

### Il laboratorio

Route dev-only `/quest-s1-lab`. Solo: 3 preset plausibili (fisico / percettivo-intellettivo / ibrido, non costruiti per dimostrare la tesi); stato visibile (party, ferite, morti, info, inventario, obiettivo); decisioni leggibili (cosa so / non so / posso fare / rischio); **RNG seedabile + forced rolls**; **log eventi minimale** (`INFO_DISCOVERED`, `APPROACH_SELECTED`, `CHECK_RESOLVED`, `WOUND`, `DEATH`, `OBJECTIVE_PROGRESS`, `LOOT`, `RETREAT`, `QUEST_END`); reset.

### Testabilità

Test = correttezza del prototipo, non validità del design: nodo corretto raggiunto, scelte che cambiano il percorso, morte che rimuove il PG, ritiro che chiude, reward solo da prova-obiettivo + leader vivo, bottino conservato in fuga. Nessuna suite estesa su meccaniche che potremmo buttare via.

### Gate A

**Round 1 — Director:** ≥3 run, ≥2 preset, ≥2 percorsi. Per run annota: cosa pensavo di sapere / cosa ho scelto / perché / cosa è successo / cosa ha cambiato la decisione successiva / dove ho perso interesse / **quale meccanica ha creato un momento di tensione e quale era solo rumore**.

**PASS** = «questo loop decisionale merita di essere rigiocato» + almeno un esempio concreto. Non serve bilanciamento giusto né tutte le fasi interessanti.

**FAIL** = classificato: `core` / `content` / `pacing` / `information` / `choice` / `consequence` / `risk` / `ui`. Si itera su contenuto/design — non si aggiunge un sistema.

**Round 2 — osservazione esterna:** non richiesta (rev.1); consigliata se il Director trova la quest interessante: osservare 1–3 persone decidere, non raccogliere voti.

### Cosa NON promuove S1

Test verdi, architettura elegante, assenza di mock, correttezza del resolver, qualità del log, presenza di bodyguard/mercante, numero di branch/testo, preview compound, compatibilità con PLAN-018. Il Gate è di design.

### PLAN-018 durante S1

Nulla. Resta precedente congelato. Dopo S1: `S1-design-findings → PLAN-018 → riusa / adatta / supera / manca`. Lavoro di S2.

### Invarianti e limiti

Deroga S1 = dati temporanei, lab isolato, nessuna persistenza reale. Invarianti di implementazione intatti (Zod, i18n, skin registry, primitive, no localStorage, no CSS standalone, no balancer) — vincoli di implementazione, **mai criteri di Gate A**. Safeguards scoped: lint/test/build:check/kanban:lint, smoke. Node `.nvmrc`.

### Decisioni chiuse dal Director (2026-10-02, matrice in `quest-design.md`)

- Contenuti «Cassa delle sementi» confermati integralmente (goblin, torre, mercante, prigioniero, corvo).
- Leader = slot fisso della quest; ferita = +rischio nei check successivi; wipe = tutti i PG morti; fonte non-check = incidente in viaggio.
- Bodyguard: intercetta tutti i danni da check, finché vivo (anche da ferito). `bigwin` = −5pp cumulati + downgrade. Nessuna keyword in S1 («modificatore di verdetto»).
- «Continua ad esplorare»: fuga successiva non perde niente; rischiano solo le vite.
- Preset: 4 (fisico / percettivo / ibrido / con bodyguard). Mercante e prigioniero confermati.

### Restano aperti

- Parametri numerici — **mock iniziali fissati** nella matrice (`quest-design.md`); si ritoccano nel playtest.
- Death save — **regola dentro**: 5% su esito morte → ferito. Si osserva al Gate se produce il momento «forse ce la fa».
- Coverage Gate A (3 run + 2 preset + 2 percorsi): strumento di giudizio, non soglia.
- **Bande verdetto 5/5/5 vs canone** — il lab usa soglie fisse (5 numeri più bassi → bigwin, s+1…s+5 → almost, 5 più alti → epicfail) mentre `mission_planner_math_spec.md` §2.4 definisce bigwin = 20% della fascia di successo e almost = banda di 10. Deviazione deliberata (ogni zona speciale = 5 numeri, speculare alla geometria) da ratificare in S2: aggiornare la spec o riallineare l'engine.
- **Crash intermittente `RangeError` in `DestinyAstrolabeV62`** — osservato solo in tab dev con moduli HMR stale; non riproducibile su run pulite. Indurito il teardown dei listener (destroy rimuove il keydown, guardia `engineAlive`). Se riappare in build produzione va strumentato.

### Playtest live 2026-10-03 (seed 1983, Preset D → VICTORY) — finding strutturali

Artefatto completo: `.mw/runs/20261003-quest-v6-science/playtest-seed1983.md`. La run ha confermato in vivo l'audit: la quest è giocabile end-to-end ma **il loop non cambia stato**.

1. **Estrazione inesistente nel codice** — dopo il forziere la run si auto-conclude; TAKEN == SECURED oggi, nessuna fase di fuga.
2. **Morte su WIN resa come log** — Kran morto per intercetto su WIN 75-vs-74: `[INTERCEPT]`+`[DEATH]` in log, nessun beat, scheda HP 10/10 su un morto, card finale che non lo cita.
3. **"WIN" quasi finto** — la banda harm colpisce anche a successo (Ivo ferito 3×, 2 su WIN): WIN = successo E comunque danno.
4. **Auto-chain sul check obiettivo** — "Portare via la cassa" si risolve senza input ("ROLL 1 OF 2"): agency rimossa nel climax.
5. **Noise meter attivo ma inerte** — stampa `RUMORE ◉○○`, nessuna conseguenza sul path breve. Decisione parcheggiata ≠ codice parcheggiato.
6. **Failure path irraggiungibile col gioco prudente** — 6 WIN/6; nessun FAIL osservabile in una run normale.
7. **Epilogo senza costo** — VICTORY card non contabilizza morte/prigioniero/noise; peak-end violato.

**Redesign proposto (non approvato):** `.mw/runs/20261003-quest-v6-science/quest-v6.md` — TAKEN≠SECURED + estrazione a 3 forme + epilogo col costo. Raccomandazione critica (`critique-consolidated.md`): implementare **solo** quei 3 pezzi come test dell'ipotesi centrale, non la v6 integrale. Bibliografia: `context/QUEST_GAMEPLAY_SCIENCE.md` (P1–P47).

### Slice v6 minimo — IMPLEMENTATO 2026-10-03 (commit `b35295c6`)

Approvato dal Director in forma minima. Stato dei finding sopra:

1. ✅ **TAKEN≠SECURED implementato** — nuovo nodo `estrazione` (choice) tra `rientra-o-rischi` e `ritorno`; cassa = "in mano" finché non arrivi a `ritorno`. `cassaPersa` flag su drop; `flee()` la molla.
2. ✅ **Estrazione a 3 forme** — `exit-breach` (solo se `prigionieroLibero`), `exit-quiet` (nascosta se `campoSveglio`: ingresso forzato o allarme), `exit-alarm` (sempre, F25/M8). Fail = perdi cassa/bottino, dichiarato in preview via `failHint`.
3. ✅ **Epilogo col costo** — `composeEndingText` in `endRun`: morti per nome, cassa persa, prigioniero, bottino. Badge "in mano/non al sicuro" → "recuperata"/"persa".
4. ✅ **Attribution** — `[DEATH] X — su «check»`; hp=0 sui morti.
5. ✅ **Epicfail in banda** — upgrade ferita→morte solo se la banda M dichiarata dello slot è >0 (regola Director).
6. ✅ **Bug noise≥3 fixato** — gli effetti del check (incl. presa cassa) atterrano PRIMA del dirottamento su `risveglio` (prima venivano scartati in silenzio).
7. ⏳ **Nodo `estrazione` non ancora visto live** — entrambe le run browser hanno preso `risveglio` (noise 3) prima di raggiungerlo. Coperto da unit test; serve run quiet-path per il verdetto "felt".
8. ⏳ **Cosmetico pre-esistente** — l'astrolabe continua a drenare la coda di check accodati anche dopo wipe/end.

Gate ora: playtest umano — *"sai dire cosa hai perso e per quale tua scelta?"*

### Artefatto di uscita: `S1-design-findings.md`

Design facts, non regole validate: per ogni proprietà osservata — evidenza (run #), stato (confermata / da riverificare / no), e per le meccaniche di tensione: *ha prodotto il momento cercato?* S2 riverifica tutto su infrastruttura reale.

## Tasks

- [ ] **T-001 — Authoring e matrice.** Il Director corregge e congela: contenuti della Cassa, nodi, informazioni, scelte, approcci, skill, conseguenze, effetto meccanico di ferita/morte/HP, prova-obiettivo, rientro/continuazione, **effetto di ogni fallimento sulla prosecuzione**, trigger del wipe, chi è il leader. Output: `quest-design.md`. Guida: «cosa può scegliere il giocatore e cosa cambia dopo?». Blocca T-002.
  files: .mw/runs/20261001-s1-reference-quest-draft/draft.md, .mw/runs/20261002-s1-quest-design/quest-design.md
  depends: —
- [ ] **T-002 — Core loop nel lab.** Esplora → scopri → scegli → prova → conseguenza → nuova situazione; preset, seed, log, reset, stato locale. Nessuna infrastruttura generale.
  files: src/App.tsx, src/ui/idleVillage/pages/QuestS1LabPage.tsx, src/ui/idleVillage/questS1Lab/*
  depends: T-001
- [ ] **T-003 — Quest completa.** Minimo per chiudere la spedizione: viaggio/mercante, evento, scoperta, prova-obiettivo, rientro/continuazione, reward, leader, fuga con bottino, meccaniche di tensione rev.2 nella forma più economica. Test di correttezza mirati.
  files: same as T-002 + tests/unit/idleVillage/questS1Lab.test.ts
  depends: T-002
- [ ] **T-004 — Gate A.** Playtest Director con log, PASS/FAIL classificato, `S1-design-findings.md`.
  files: test-results/plan-019-s1-playtest-<data>.md, test-results/S1-design-findings.md
  depends: T-003

## Storia

v1–v2: bozze in `.mw/runs/20261002-plan-019-s1-deliberation/` con 2 round di critica web r1–r2 e retry Claude. v3: riscrittura su critica esterna ChatGPT incollata dal Director. v3.5/r3 web: gerarchia CORE/SUPPORT, design facts, test di eliminazione. **v4 = consolidato** (bozza battezzata): v3 + reintegro meccaniche rev.2 come strumenti di tensione (criterio «divertente, non funzionante») + elementi v2 salvati. Deliberazioni interne r1–r2 respinte (invenzioni fuori desiderata). Fonte completa: `.mw/runs/20261002-plan-019-s1-deliberation/draft-v4.md`, `.mw/runs/20261002-plan-019-s1-web-critique-r3/`.
