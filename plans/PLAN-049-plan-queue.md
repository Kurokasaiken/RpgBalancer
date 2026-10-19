---
title: 'PLAN-049 — Plan Queue: metaplan playlist («quest board») per far avanzare i piani aperti uno alla volta'
status: draft
created: 2026-10-18
request: R-218 (Director: «un piano di dispatcher che fa proseguire tutti i plan uno ad uno»)
related: PLAN-043 (WS-5), PLAN-044, PLAN-045, PLAN-046, PLAN-047, PLAN-048, PLAN-026/027/028/029, PLAN-013, PLAN-019-S1, PLAN-033, PLAN-039
---

# PLAN-049 — Plan Queue («quest board»)

## 0. Scopo

Una coda dichiarativa di lavoro: ogni voce punta a un piano/task esistente, in
ordine. L'agente di turno apre questo file, prende **la prima voce `ready`**,
la esegue con il ciclo standard R-208 (implementazione → `verify:bundle` →
`fatta` in RICHIESTE con `bundle:`), spunta la voce, passa alla successiva.

Niente nuova pipeline, niente dispatch esterno (R-208 resta in pausa): è un
metaplan, non un orchestratore. La "bacheca" è questo file.

## 1. Regole della coda

1. **Una voce alla volta per sessione-attore.** Prima di prendere una voce,
   scrivere `taken-by: <sessione>` accanto alla voce e rilasciare se la
   sessione muore senza finire.
2. **Voce `blocked` → mai presa.** Si sposta (o resta) nella Director Agenda,
   si prende la successiva `ready`.
3. **Conflitto di superficie** — se la voce tocca file già in lavorazione da
   un'altra sessione (T-13), saltare e segnare `conflict: <sessione/file>`.
   La mappa file→superficie di PLAN-044 T-002 è il riferimento.
4. **Stop-condition per voce** — ogni voce dichiara quando fermarsi (bundle
   PASS, gate raggiunto, errore non risolvibile). Su fallimento: segnare,
   lasciare la voce `failed`, passare oltre — mai forzare.
5. **Chiusure** — ogni voce chiusa segue il contratto normale:
   `verify:bundle` + `closure:lint` + riga `fatta` in RICHIESTE se copre una R.
6. **T-04** — nessuna voce visiva si chiude senza testimone che vede; i gate
   occhio-Director restano gate umani e vanno in Agenda, non si eludono.
7. **Questo file è il tracker** — l'INDEX resta la fonte sugli stati; la coda
   è solo l'ordine di esecuzione. Su divergenza vince l'INDEX.

## 2. La coda

Ordine = importanza × fattibilità (audit 2026-10-18). `→` = dipendenza.

| # | Voce | Piano di origine | Stato | Note / stop-condition |
|---|------|------------------|-------|------------------------|
| Q1 | T-005..T-007 (BV nelle skill, dogfood+metrica `found-by`) | PLAN-044 | **fatta** (2026-10-18, devin) — bundle PASS: `.mw/runs/plan044-t005-verifier-receipt/`, `-t006-bv-skills/`, `-t007-dogfood-metrics/` | stop: bundle PASS per task ✓ |
| Q2 | T-001..T-008 (intent gate) | PLAN-045 | **fatta** (2026-10-18, devin-2026-10-18-b) — bundle PASS: `.mw/runs/plan045-t005a-registry/` (5/5), `-t006-prebaptism/` (4/4), `-t003-ledger/` (4/4), `-t004b-intent-json/` (4/4), `-t005b-closure-gate/` (5/5), `-t007-skills/` (4/4), `-t008-dogfood/` (3/3) | stop: bundle PASS per task ✓ |
| Q3 | T-001..T-009 slice 1 spike depth-parallax | PLAN-046 | **scope aggregato in PLAN-050** — non risulta una presa in carico separata PLAN-046; acceptance residue (layout/runtime budget, profiling WKWebView, AtmosphereLayer asset-backed, eye-check) in PLAN-050 T-011..T-013 e OB-8 | nessuna duplicazione; Q3 non chiusa finché le acceptance aggregate e i gate umani non passano |
| Q4 | E2E modificati + consumabile dal bag | PLAN-043-S4 | **fatta** (2026-10-19, devin) — E2E 27/27 + spec bag-arming PASS; bundle `.mw/runs/plan043-s4-e2e/` 3/5 obbligazioni PASS, BLOCKED solo su governance condivisa (gate-file contractsCheck ri-approvazione + trusted-lock seal — Director, T-13) | stop: suite E2E verde ✓ |
| Q5 | Schede batch + D9 application | PLAN-043-S11 | **blocked** → Agenda A1 | dopo decisioni D9 |
| Q6 | Riesame + chiusura formale | PLAN-043-S12 | ready (post-Q5) | stop: audit diffs chiusi |
| Q7 | BV-3..BV-6 check eseguibili | PLAN-033 | **fatta** (2026-10-19, devin) — BV-3 sampler rAF per-frame (0 doppi) + BV-6 seam `__worldLayers` (ring z<cloud z, hover→tooltip su 2 territori); spec nuova `gameInvasionHandover.spec.ts` 2/2 + regressione invasion 11/11; fix flake march (overshoot live-clock → assert su progress misurato); bundle `.mw/runs/plan033-bv36/` 3/5 PASS, BLOCKED solo su `mapping:approve` proposal-2026-10-19T09-50-42-049Z (Director) | stop: BV registrate ✓ |
| Q8 | Pipeline copy residua post-r001 | PLAN-027 | ready | stop: critic+gate esteso landati |
| Q9 | T6 integrazione / T7 archi (se sbloccati) | PLAN-026 | ready parziale | gated su ratifica interna al piano |
| Q10 | Sea marks T1..T8 | PLAN-013 | ready | stop: verificare verdetto PLAN-017 prima di iniziare |
| Q11 | Implementazione lab pick→generate→…→export | PLAN-029 | **blocked** → Agenda A2 | dopo go Director |
| Q12 | Gimmick channels v0 prototipo | PLAN-028 | **blocked** → Agenda A3 | dopo decisioni §7 |
| Q13 | Battezzo + T-001..T-005 | PLAN-047 | **blocked** → Agenda A4 | dopo battezzo |
| Q14 | Battezzo + T-001..T-006 | PLAN-048 | **blocked** → Agenda A5 | dopo battezzo |
| Q15 | Plan A R-231: input & frontier verify (#1+#2) | PLAN-060 | **fatta** — bundle `.mw/runs/plan060-input-frontier/` PASS 6/6, 2026-10-19 | stop: bundle PASS; se verify trova stuck-frontier reale → A2 |
| Q16 | Plan D1 R-231: formato immagine 2.4 via pipeline (#8) | PLAN-061 | **fatta** — bundle `.mw/runs/plan061-image-format/` PASS 6/6, 2026-10-19 (scope rivisto: contratto+gate, regen pendenti step Director) | stop: bundle PASS + replay point Director |
| Q17 | Plan C R-231: semantica progresso (#4, ruling: elapsed vs dichiarata) | PLAN-062 | **sospesa** — Director 2026-10-19 «vado oltre»: core già nel diff della sessione PLAN-053 T-001 (`questSchedule.ts`: elapsed/duration + `questPhaseCheckpoints`); da verificare a ondata terminata | stop: bundle PASS su clock simulato |
| Q18 | Plan B R-231: chrome & layout (#3/#5/#6/#7 + indicatore lock; 4 ruling + 1 fixture) | PLAN-063 | **sospesa** — Director 2026-10-19 «vado oltre»: #7 (space-between minimizzato) già nel diff parallelo; file hot | stop: 4 ruling + bundle PASS su geometry finale |
| Q19 | Plan D2 R-231: animazione idle post-entry (#9) | PLAN-064 | **sospesa** — Director 2026-10-19 «vado oltre»: camera latch post-entrata (`sceneCameraLatchRef`) già nel diff parallelo; file hot | stop: ruling linguaggio + bundle PASS + testimone |
| Q20 | T-001..T-007 quest journey fasi + rotta mappa | PLAN-053 | **in corso** — taken-by: devin 2026-10-19 (T-001 **fatta**: bundle `plan053-t001-quest-journey-model` PASS, evidence `test-results/PLAN-053-T-001-evidence.md`); battezzato 2026-10-19 («procedi») | stop: `verify:bundle` PASS + OB-7 eye-check; visual-fork card obbligatoria prima di T-005 |

## 3. Director Agenda (gate che servono a te)

Voci raccolte man mano che la coda le incontra. Le svuoti in una seduta sola;
a svuotamento, le voci tornano `ready`.

| # | Da decidere | Piano | Tipo |
|---|-------------|-------|------|
| A1 | D9 per batch WS-5: keep / redo / merge / remove (inventario D=420 pronto in `test-results/plan-043/ws5/`) | PLAN-043-S11 | decisione |
| A2 | go/no-go implementazione lab | PLAN-029 | go |
| A3 | decisioni §7 canali gimmick | PLAN-028 | decisione |
| A4 | battezzo PLAN-047 (visual fork gate) | PLAN-047 | battezzo |
| A5 | battezzo PLAN-048 (workflow forensics) | PLAN-048 | battezzo |
| A6 | T1.9: quale animazione sparisce nello swap + prova manuale F1 | PLAN-043-S1 | input + playtest |
| A7 | D4 `BagStrip` + prova manuale F1 | PLAN-043-S2 | decisione + playtest |
| A8 | T-001 correzioni contenuti + gate A playtest («cosa hai perso e per quale scelta») | PLAN-019-S1 | playtest |
| A9 | colore anelli Sigillo POI (dentro schede WS-5) | PLAN-058→S11 | decisione visiva |
| A10 | ripresa benchmark (2 fix pipeline noti) — informa riattivazione dispatch | PLAN-039 | go |

## 4. Evoluzione (non implementata ora — scatta per soglia)

- **B** — quando le voci `ready` sono stabilmente >5: `scripts/next-plan.py`
  risolve meccanicamente il prossimo item (INDEX + questa queue + mappa
  file→superficie per i conflitti) e un `DIRECTOR_AGENDA.md` separato.
- **C** — night-shift conveyor con guardian session-registry: solo se i dati
  di PLAN-048 (R-217) mostrano throughput sensato e su battezzo esplicito.
- **D** — dispatch multi-agente: fuori scope; richiede la decisione PLAN-039.

## 5. Contratto di chiusura di QUESTO piano

La queue è "viva": PLAN-049 si chiude quando la coda è vuota **o** quando viene
sostituita dal resolver B. Bundle: `git log` + INDEX diff + righe `fatta` in
RICHIESTE citate per ogni voce chiusa.

## 6. Fuori scope

- Nessuna modifica al codice di gioco da parte di questo file.
- Nessuna riapertura di piani `completed`/`superseded` senza nuova R.
- Le voci non creano nuovi gate: ereditano i contratti dei piani di origine.
