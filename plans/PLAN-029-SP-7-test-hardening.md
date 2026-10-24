---
title: 'PLAN-029 SP-7 — Test hardening & Playwright smoke'
status: active
created: 2026-10-12
parent: PLAN-029
debate: mw-web-debate `20261012-quest-gen-lab-sp7-test-hardening` — artifact
  r003 converged 2/2 eligible (deepseek ACCEPT; gemini ACCEPT; chatgpt
  provider_dead — web outage, conversazioni droppate server-side, 4 tentativi
  di delivery falliti; grok provider_dead ×5 run consecutivi)
artifact_sha256: cc8cdc710f190bed860f6ed0d842a5b1bb6bae3303550ea6dafb412bd6682c89
depends_on: PLAN-029 SP-2 (provenance/seed nel candidate), SP-4 (mcGate +
  BAND_RUNS=2000 produzione), SP-5 (STALE da authoring edit), SP-6
  (autosave/flush/export/import)
---

# SP-7 — Test hardening & Playwright smoke — artifact r003

3 revisioni. r003 assorbe le 4 note non-bloccanti deepseek (flake-signal
semantics, fail-loud su provenance assente, guard NODE_ENV=test sui due env
override, regola bump last-verified). r002 aveva assorbito: 6 note deepseek
(reload-dopo-import, read site unico, fixture owner del flag FLAKY, filename
worker/retry, un solo meccanismo seed, colonna last-verified) + 2 obiezioni
gemini valide (autosaveDebounceMs come config Zod pinnata, scoping
pseudo-locale su data-testid). Un'obiezione gemini (contenuto
VillageStashPanel in r001) adjudicata come premessa falsa — cross-talk col
run concorrente PLAN-032 sul browser condiviso.

## 0. Scope

W9 di PLAN-029: provare che il lab funziona end-to-end in browser + policy
di hardening. NON possiede: internals dei singoli workstream (coperti dalle
matrici unit di SP-2…SP-6), nuova semantica di seed, audit i18n globale.

## 1. Spec E2E — `tests/questGenLab.spec.ts`

UNA spec sequenziale sul loop completo:

route render + sezioni registry → picker → generate → candidate card
(scenarioHash non-null + provenance) → run gates → riga mc completa →
GenRunPlayer a verdict terminale → authoring edit → badge STALE →
rigenera → candidato fresco → export JSON non-vuoto → import ripristina →
UNA assertion di reload (mutate → flush → reload → hydrate →
candidate+report intatti — prova il wiring playwrightStore end-to-end).

- La mutation di reload avviene DOPO l'import: la hydration prova
  candidato+report importati, non quelli pre-export.
- Assertion solo su SEAM (badge, status, presenza) — mai internals né
  numeri MC esatti.
- Pass pseudo-locale nello stesso file, scopato a `/quest-generation-lab`:
  assertion sui root di sezione con `data-testid="lab-section-*"`; i campi
  a valore dinamico (hash, seed, metriche MC) sono esclusi dai check
  letterali. Verifica: nessuna chiave grezza `questGenLab.*`, nessun
  letterale non-pseudolocalizzato nei container scopati, controlli critici
  usabili.

## 2. Monte Carlo in e2e

- Override test-only `VITE_QUESTGEN_MC_RUNS`, letto UNA volta al boundary
  config pinnato (modulo MC config del lab introdotto da SP-4 — nessun
  secondo read path), onorato SOLO sotto `NODE_ENV=test`: un `.env` randagio
  non può disabilitare MC in produzione.
- E2E usa N ridotto sul code path REALE — niente stub.
- Test unit asserisce `BAND_RUNS === 2000` invariato (ownership SP-4); il
  read site unico rende pin unit e override e2e non-divergenti.
- Parità bit-exact resta unit-level (SP-4 T-2). E2E asserisce: riga mc
  completa, status ∈ enum, metriche espandibili presenti.

## 3. Flake / definizione di green

- Green = 10/10 run locali consecutivi, retries=0 (allineato a
  playwright.config locale).
- CI retries=2 ammesso; è la fixture di evidence a marcare FLAKY osservando
  `testInfo.retry > 0` — owner unico, nessun post-processor CI.
- Solo wait espliciti su selector/stato del lab — niente networkidle, niente
  sleep fissi.

## 4. Fixture di evidence

- Fixture posseduta da SP-7 emette
  `test-results/quest-gen-lab-<ISO>-w<worker>-r<retry>.log` per run:
  nome spec, seed usati, N MC, retry consumati, PASS/FAIL per step, hash
  artefatto export, flag pseudo-locale, risultato persistence/import.
- Semantica flake per i lettori: un run FLAKY lascia sia un log `r0`
  (fail) che `rN` (pass) — "qualsiasi r>0 presente per spec+ISO" È il
  segnale di flake; un lettore naive non deve vedere solo il log passato.
- Evidenza locale gitignored — non CI-asserted.

## 5. Determinismo

- I seed del run sono letti DALLA provenance del candidato /
  generation-request (già parte del contratto SP-2) e scritti nel log.
  Esplicitamente RIGETTATI come sorgenti seed: nuovo URL param E hook
  test-only — nessuna nuova semantica di seed in produzione.
- Fail-loud: la spec FALLISCE se provenance/seed manca pre-generazione —
  mai loggare seed vuoto e continuare.

## 6. Debounce / timing

- L'intervallo di debounce autosave di SP-6 è un valore config al sito
  pinnato: `questGenLabConfig` (Zod) campo `autosaveDebounceMs` con
  override env `VITE_QUESTGEN_AUTOSAVE_DEBOUNCE_MS`, onorato solo sotto
  `NODE_ENV=test`. E2E imposta ~0 o usa `page.clock`; nessuna costante
  di timing hardcoded nelle spec.

## 7. Mapping di copertura

- Nessun contract test machine-readable sui doc di piano (tabelle in prosa
  → brittle). Questo documento porta la tabella di mapping:
  subplan → test mandati → file test → last-verified (sha/data commit).
  Regola: una PR che tocca un file mappato bump-a il suo last-verified —
  visibilità, non enforcement.

| Subplan | Test mandati | File test | Last-verified |
|---|---|---|---|
| SP-2 | reducer/hash, STALE-vs-SUPERSEDED, epoch race | `tests/unit/idleVillage/questGenLab/*` | da riempire a implementazione |
| SP-3 | orchestrator gates, coverage invariant, rollup guard | `tests/unit/idleVillage/questGenLab/*` | da riempire |
| SP-4 | parity bit-exact mcGate vs deriveOfferBand | `tests/unit/idleVillage/questGenLab/*` | da riempire |
| SP-5 | materializer unico, kitId-mismatch bloccante, set-or-inherit | `tests/unit/idleVillage/questGenLab/*` | da riempire |
| SP-6 | persistence round-trip, import pipeline, export envelope | `tests/unit/idleVillage/questGenLab/*` | da riempire |
| SP-7 | loop e2e + pseudo-locale | `tests/questGenLab.spec.ts` | da riempire |

## 8. Out of scope

Spec e2e per-fase; assertion su numeri MC esatti in browser; audit
pseudo-locale su tutta l'app; ri-test di internals già coperti dalle
matrici unit SP-2…SP-6.

## 9. Tasks

| T | Task | Test |
|---|------|------|
| T-1 | `questGenLabConfig` (Zod): `autosaveDebounceMs`, `mcRuns` test-override — lettura unica, gated `NODE_ENV=test` | default invariati in prod; override attivo in test |
| T-2 | fixture evidence `quest-gen-lab-<ISO>-w<w>-r<r>.log` + flag FLAKY via `testInfo.retry` | unit sul writer; naming collision-free |
| T-3 | `tests/questGenLab.spec.ts` loop sequenziale §1 | 10/10 run locali retries=0 |
| T-4 | pseudo-locale pass scopato `data-testid="lab-section-*"` | nessuna chiave grezza; controlli usabili |
| T-5 | assertion reload post-import + provenance fail-loud | candidate+report idrati |
| T-6 | tabella mapping §7 compilata con sha reali | drift visibile |

## 10. Rulings

- R-1: l'evidence fixture è l'unico owner del segnale FLAKY
  (`testInfo.retry > 0`).
- R-2: entrambi gli env override (`MC_RUNS`, `AUTOSAVE_DEBOUNCE_MS`) sono
  onorati SOLO sotto `NODE_ENV=test`.
- R-3: i seed derivano dalla provenance del candidato — mai da param o
  hook nuovi.
