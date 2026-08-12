---
title: World Surface V3 — Sub-plan E — EventSeverity + FSM
status: Draft
parent_plan: world_surface_v3_tactical_plan.md
node: E
classification: sub-plan
execution_hint: verified
created: 2026-08-13
---

# Sub-plan E — EventSeverity + Event FSM

## Classificazione e giustificazione

`sub-plan`. FSM esplicita con transizioni condizionate, tabella tier completa, de-escalation, contatore globale Tier 3 e separazione EventSeverity/PresentationPolicy/AdmissionPolicy: più decisioni architetturali su file multipli.

## Intent

Implementare `WorldEventSeverity.ts` (mapping evento → tier dalla tabella §11 del piano tattico), `eventPresageSystem.ts` come FSM esplicita `IDLE → PRESAGE → THREAT → ACTIVE → CONSEQUENCE → IDLE` (con path speciale Tier 3), contatore globale Tier 3 (`maxPerRun: 1`, `minMsSinceLastTier3: 30min`, degradazione visiva a Tier 2 con telemetry `event_tier_degraded`), e aggiornare `useEventSystem.ts` per consumare il tier.

## Acceptance

- Unit test: mapping corretto per tutti gli eventi della tabella (Flock of Birds … Meteor); transizioni FSM complete inclusa la correzione `ACTIVE → CONSEQUENCE` (mai `ACTIVE → PRESAGE`); Tier 3: `player_resolved` vs `player_NOT_resolved` producono conseguenze diverse.
- Cap Tier 3: secondo Tier 3 entro finestra → degradato visivamente a Tier 2, tier logico invariato, telemetry emessa.
- `autoResolveAfterMs: undefined` (esplicito) non auto-risolve; con valore numerico auto-risolve dopo il timeout.
- La degradazione visiva non indebolisce mai la chiarezza semantica di un Tier 3 (l'azione richiesta resta leggibile).
- `npm run build:check` verde.

## Invariants (RPG)

- Config-first: durate fasi come tuple `[min,max]` in `EventSeveritySchema` (sub-plan A).
- i18n: `labelKey` per ogni evento, namespace `idleVillage`.
- No `Date.now()`: FSM tick su `WorldClock` (sub-plan B).
- Tier 0–2 non bloccano mai l'interazione; solo Tier 3 ha trattamento cinematico.
- Telemetry con schema tipizzato definito prima dell'implementazione.
- `reducedMotion`: Tier 3 → contrasto + badge + messaggio i18n, niente shake/vignette animate.

## Constraints

- Separazione esplicita: `EventSeverity` (posta in gioco), `PresentationPolicy` (come comunicarla), `EventAdmissionPolicy` (quando schedulare).
- Tier 3 cap: `requiresNoActiveTier2Or3: true`, `requiresEligibleGameplayState: true`.
- Pillar 2 tension: "chiudere il run" richiede decisione gameplay esplicita (recovery, persistenza, messaggio) — non deciderla qui.

## Approach notes

- FSM come reducer puro con stati/transizioni dichiarati; side effect (telemetry, effetti) fuori dal reducer.
- Stato eventi globale in Zustand (dominio condiviso), non Context.
- `wonder.meteor_shower` (visuale, Tier 0) e `worldEvent.meteor_impact` (gameplay, Tier 3) restano entità separate.

## File targets

- `src/ui/idleVillage/worldSurface/utils/WorldEventSeverity.ts` (nuovo)
- `src/ui/idleVillage/worldSurface/utils/eventPresageSystem.ts` (riscrittura FSM)
- `src/ui/idleVillage/worldSurface/hooks/useEventSystem.ts` (consumare tier + FSM)
- `tests/unit/idleVillage/WorldSurfaceV3Severity.test.tsx` (nuovo)
- `tests/unit/idleVillage/WorldSurfaceV3Events.test.tsx` (estendere)

## Dependencies

- Sub-plan A (schema `EventSeverity`).
- Sub-plan B (`WorldClock`).

## Safeguards

```bash
npm run lint -- src/ui/idleVillage/worldSurface tests/unit/idleVillage/WorldSurfaceV3Severity.test.tsx tests/unit/idleVillage/WorldSurfaceV3Events.test.tsx
npm run test -- WorldSurfaceV3Severity
npm run test -- WorldSurfaceV3Events
npm run build:check
npm run kanban:lint
```

## Open questions

- I tier influenzano anche la UI fuori dalla mappa (es. HUD globale)?
- Decisione esplicita del Director su "run-ending" per Goblin Invasion (tensione con Pillar 2).
