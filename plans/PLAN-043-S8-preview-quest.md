---
title: "PLAN-043-S8 — Preview quest riscritta"
parent: PLAN-043
status: completed
created: 2026-10-17 (scorporato dal master PLAN-043; lavoro del 2026-10-16)
source_request: R-207
documentation_impact: REQUIRED
doc_targets:
  - src/docs/docs/idle_village/quest_ui_component_guide.md
---

# PLAN-043-S8 — Preview quest riscritta

Master: [PLAN-043](PLAN-043-game-quest-surface-pass.md) · stato operativo in [INDEX](INDEX.md).

## Richiesta (verbatim, 2026-10-16)

> *"Cosa importantissima: il componente della Preview Quest deve essere esaminato attentamente e riscritto al meglio, attualemnte nn sn molto convinto di cosa è dove, ecc."*

## Task

- **T4.1 Riesame dei contenuti (Opus alto):** per ogni elemento, a quale decisione serve (chi mando, cosa porto, che rischio corro, parto?), in che ordine si legge, cosa è ridondante. 2–3 layout come mockup con le zone v23 e lo slot di F2. **D1** (Director).
- **T4.2 Implementazione (Sonnet):** solo layout e presentazione; la sessione (`useQuestExpeditionSession`) non cambia logica. Prima verifica a schermo entro ~200 LOC (T-05).
- *Accettazione:* checklist §6.12; `gameQuestPlannerLayout`, `gameQuestExpedition`, `gameQuestFullFlow` verdi; catture a 3 dimensioni.
- **Gate F4:** sì del Director.

Nota: va fatto con la stessa grammatica di pulsanti e la regola «nessun componente sopra un altro» decise in [S9](PLAN-043-S9-famiglia-quest-redesign.md).

## Dibattito multi-AI (2026-10-17) — CONVERGED + BATTEZZATO

Run `.mw/runs/20261017-plan043-ws3-quest-planner/` (mind-weaver) · artifact
convergente `artifact-r004.md` (sha `71016cfc…5674f`) accettato 4/4 →
**battezzato dal Director 2026-10-17** (verbatim «Dispatch table / drag / N day /
dispatch fai tu») come **`artifact-r005.md`** (sha256
`f2d4639923c3bddd178d18270718e12779ca2728b5a50136b05a1474f67bf7df`, copia locale
`test-results/plan-043/ws3/artifact-r005.md`) — spec implementativa vincolante.

**Ruling applicati:** D-a Dispatch Table · D-b **unit-drag** sotto il solver
condiviso (anchor-only `userCenterX/Y`, shift derivati — coerente col ruling
WS-2 «tutti i pannelli trascinabili» e con la grammatica WS-4) · D-c durata in
giorni interi `formatExpeditionSpan` → `1 day`/`N days` (ICU plurals,
round-half-up, min 1) · D-d campo `dispatch?` opzionale adottato.

Layout **«Dispatch Table»** (dettaglio completo nell'artifact):
Planner in CENTER STAGE — hero letterbox ~150px (sigilli incisi read-only
Danger/Reward/durata, fallback `coverArt→sceneArt→cresta`, CLS=0) → rack ordine
di marcia TESTA→CODA con strip esposizione statica per QUEST_RULES §4 (leader =
`party[0]` = TESTA; n=1 → entrambi i tag) → loadout row → **Selection Tray** ~88px
on-demand (residenti|item, rimpiazza il popover esterno; hero swap discreto
150→56px in un frame, mai animazione di layout) → footer ancorato
`Send expedition` + `Back to map`. RIGHT WING Forecast pinnato (BY MEMBER adiacente
all'aggregato in ordine TESTA→CODA, WHY, Needs, Intel; una sola regione scroll
interna). LEFT WING pool compagni. Budget altezze con max-height per componente +
asserzione geometrica deterministica ≤540px @1280×720 (AC-02), fallback finale
documentato. Matrice bloccante **AC-01..AC-23**; task TS-0..TS-7.

## Contratto di chiusura

- D1 decisa dal Director.
- E2E `gameQuestPlannerLayout`, `gameQuestExpedition`, `gameQuestFullFlow` verdi; catture a 1280/1920/2560.
- Bundle di chiusura non ancora prodotto (`.mw/runs/plan043-{sid}/verification.json` → `verify:bundle`).

### Director amendment — R-223 (2026-10-18)

Replace the visible TESTA/CODA tags under marching-order slots with the
numerical damage-exposure percentage from `QUEST_RULES.md` §3. Preserve the
positional values (solo 100%; two members 20%/80%) and convey TESTA/CODA in the
accessible name/title rather than as the primary visual. Add a persistent
legend distinguishing exposure share from forecasted wound/death percentages;
keep the indicator neutral (no red/green valence). This supersedes AC-08's
tag presentation only; the risk formula and Forecast layout remain unchanged.

`visual-fork: skipped — R-223 specifies the numeric exposure representation inside the existing footer, not an alternative layout — pointer: R-223 verbatim + v23 FROZEN + PLAN-043 WS-3 artifact-r005`

`visual-fork: skipped — HarmonizationGallery only swaps a deleted roster consumer to MatericRosterComponentV2 to keep the lab compiling, preserving the gallery layout — pointer: R-223 roster unification compile fix`

Living-doc coverage for the same amendment: `src/ui/idleVillage/frozen/kits/pgcardKit.md`, `src/ui/idleVillage/frozen/kits/rosterKit.md`, `src/ui/idleVillage/frozen/kits/slotRackKit.md`, and `src/docs/docs/idle_village/quest_ui_component_guide.md`. Mechanical consumer coverage: `src/ui/visualFidelityLab/HarmonizationGallery.tsx`.
