---
title: 'PLAN-023 — Quest S1 Lab UI redesign: cockpit, combat HUD, damage channel, skip'
status: active
created: 2026-10-08
desiderata: v24/v27 (FROZEN) — stadio S1, quest authored nel lab
request: R-101
parent: PLAN-019 (stadio S1) — sibling: PLAN-022 (quest goblin)
related: artifact-r005 (mw-web-debate run 20261007-quest-s1-lab-ui-redesign, converged 3/3)
---

# PLAN-023 — Redesign UI del lab quest S1

## Perimetro

Redesign della superficie `/quest-s1-lab` secondo **artifact-r005**
(dibattito multi-AI web convergente — ChatGPT/Claude/Gemini, 2 WITNESS
disposizionati, decisioni Director D1–D3 ratificate).

**In scope:** shell cockpit a 3 regioni (zero scroll @1366×768), HUD di
combattimento (formazione + orda), pipeline presented-vs-committed con
`HarmEvent` strutturati, canale danno (floater + ghost + chip duraturo),
estensione astrolabio (dock/skip/speed), verdict card, skip progressivo +
pace control pre-check, tooltip stakes sulle opzioni + cintura consumabili,
guida componenti, test.

**Fuori scope:** meccaniche engine esistenti (pesi posizionali, bande
verdetto, semantica F5/F7 R-097 v2, scope consumabili); contenuto authored
della quest; altre quest del lab (cassa/rovine — stessa shell, nessuna
feature nuova obbligatoria); QuestTheatre/PLAN-021.

## Decisioni ratificate

- **D1:** skip manuale; pace (`full|fast`) scelto **prima** del check via
  controllo persistente nella Action Zone; stakes su **tooltip** delle
  opzioni; consumabili via **cintura** (arm → prossimo check, tooltip mostra
  bound senza/con).
- **D2:** orda = token anonimi + `×N/total` + intent `⚔×k`.
- **D3:** rank-shift alla morte: i vivi chiudono i ranghi verso l'orda,
  esposizione ricalcola sui vivi.
- WITNESS-01: affordance post-verdict etichettata con l'azione concreta.
- WITNESS-02: chip delta = stato duraturo del canale danno, sempre pinnato.
- R-099 flavor layer preservato: `transit` sotto l'astrolabio, `flavor` sul
  verdict card.

## Task

| # | Task | Dipende da |
|---|------|-----------|
| T-001 | Engine additivo: `HarmEvent[]`, `resolution.id`, `exposure` snapshot per-membro, split `authoredText`/`harmLines` in outcomeText | — |
| T-002 | Config `questLabPresentation` (Zod): layout vh, timing/speed/overlap, floaters/ghost, exposure tiers, skip/pace, motion, `inputGuardMs`, `maxHordeTokens`, disclosure | — |
| T-003 | `usePresentationTimeline` reducer: keyed by resolution.id, drain invariant `presented==committed` (property test + dev assert), flush su visibilitychange/unmount, end-panel gated su `settled` | T-001, T-002 |
| T-004 | Cockpit shell: context strip / stage band / Action Zone stateful (idle→presenting→verdict) / log drawer read-only | T-003 |
| T-005 | Formazione + orda: slot HP+exposure (banda/pips/icona+%, spent marker, hit ring), tombstone + rank-shift, token orda + intent glyph | T-003, T-004 |
| T-006 | Canale danno: `FloatingText` primitive, ghost layer su StatBar, chip delta duraturo | T-005 |
| T-007 | Astrolabio: `variant` docked, `speed`, `skipToResult()`, `onVerdict`; stage-gap in combat, centrato narrativa — doc trusted + MASTER_INDEX | T-003 |
| T-008 | Verdict card: badge + roll track + flavor + authored + chip non-HP + explicit-next-action | T-003, T-007 |
| T-009 | Skip progressivo + flush-all + aria-disabled + inputGuardMs + pace control pre-check | T-007, T-008 |
| T-010 | Tooltip opzioni (stakes analyzeCheck) + cintura consumabili (arm/disarm, delta bound) | T-004 |
| T-011 | `quest_ui_component_guide.md` + chiavi i18n (en/it-IT/pseudo) + reduced motion | T-004 |
| T-012 | Test: HarmEvent, invariant drain, tooltip↔resolver parity, consumable scope, rank-shift exposure, skip states; safeguard + evidence log; re-verify `pageCrash.repro` | tutti |

## Avanzamento (2026-10-08)

- T-001 ✅ `questRun.ts`: `HarmEvent` pubblico (record, `HarmRoll` per gli intent
  interni), `QuestRunState.lastCheck/checkQueue/checkSeq/harmSeq/pendingHarms/
  recentHarms`, `recordHarm`, `currentExposure`, drain in resolveCheck/combat/
  applyChoice/enterNode. Test: `questGoblin.test.ts` +blocco presentation
  contract (27/27).
- T-002 ✅ `questLabPresentation.ts`: tutte le sezioni. Nota: su Zod 4.3.6 i
  nested default richiedono `.prefault({})` (non `.default({})`), verificato.
- T-003 ✅ `presentationTimeline.ts`: reducer puro `cinematic→verdict→kills→harm→
  settle→settled`, keyed by resolution.id/ambient seq, `advance`/`flush`,
  `gatePhases` per i beat che attendono il giocatore (cinematic/verdict), hook
  con flush su visibilitychange/unmount. Test 5/5 incl. invariant drain.
- T-004/5/6/8/9/10 ✅ `QuestS1LabPage.tsx` riscritto a cockpit: context strip,
  stage band (formazione con exposure/pips/spent/tombstone+rank-shift, orda
  anonima + intent ⚔×k, astrolabio dockato in combattimento), Action Zone
  stateful (opzioni → cinematica → verdict card con flavor/authored/chip non-HP
  → etichetta azione concreta), danno a due stati (floater + chip duraturo +
  ghost bar), skip progressivo + flush + input guard + pace FULL/FAST pre-check,
  stakes in tooltip opzione, cintura consumabili con delta live (`45→60 ✦`),
  chronicle drawer.
- T-007 ✅ `DestinyAstrolabeV62`: `config.speed` (scala timing), `skipToResult()`
  sull'handle. Docked = wrapper a dimensioni esplicite nella stage band.
  MASTER_INDEX aggiornato.
- T-011 ✅ `quest_ui_component_guide.md` + chiavi i18n en/it-IT + reduced motion
  via `PRES.motion`.
- T-012 ✅ vitest scope 95/95 (incl. `pageCrash.repro` tornato verde),
  build:check pass, kanban:lint pass, lint scope pulito (quarantena nota sul
  kit astrolabe). Evidence: `test-results/r101-quest-cockpit-2026-10-08.log`.
  Verifica live via dev server + browser preview: cinematica docked, skip
  progressivo, chip duraturo `−12`, rank esposizione, orda 5/6, intent ⚔×2.

## Vincoli

- Config-first, i18n, primitive esistenti prima di crearne di nuove
  (`FloatingText`/ghost in dir primitive corrette); niente CSS standalone.
- UI mai ricalcola `positionalWeights` — snapshot engine.
- Astrolabio: estensione (props/handle), V6 contract riconoscibile;
  doc trusted + index aggiornati.
- Must-not-change: quest cassa/rovine comportamento invariato; meccaniche
  R-097 v2 e R-099 preservate.

## Safeguard

`npm run lint -- <scope>` · `npm run test -- <scope>` · `npm run
build:check` · `npm run kanban:lint` · evidence `test-results/r101-*`.
