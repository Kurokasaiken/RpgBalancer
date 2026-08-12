---
title: World Surface V3 — Sub-plan C — EffectAdmissionController
status: Draft
parent_plan: world_surface_v3_tactical_plan.md
node: C
classification: task
execution_hint: verified
created: 2026-08-13
---

# Sub-plan C — EffectAdmissionController

## Classificazione e giustificazione

`task`. Modulo puro, logica contenuta, nessuna decisione architetturale aperta (i placeholder di budget restano profilabili in config). Un solo Task Package con intent e acceptance chiari.

## Intent

Implementare `EffectAdmissionController.ts` (puro, no React/Pixi) con: cost class (LIGHT=1, MEDIUM=3, HEAVY=6, CINEMATIC=10), budget `maxEffectCost`, coda heavy con TTL, preemption matrix (Tier 3 priority 10 preempte Wonder priority 1 con fade 300ms), quality profiles (high/balanced/low/reducedMotion), rolling window 120 frame, e background throttling detection.

## Acceptance

- Test unitari: effect cost > budget viene rifiutato/accodato; promozione dalla coda a rilascio; scarto per TTL scaduto; Tier 3 preempte Wonder in corso; coda oltre 2 elementi scarta il terzo con `log_and_emit`.
- Quality profile: degradazione dopo 3 finestre consecutive oltre p95; risalita solo sotto 70% budget per 10s e mai durante Tier 2/3; mai degradare segnali gameplay Tier 1+.
- Background detection: crollo >30fps → <5fps classificato come background, non violazione.
- `npm run build:check` verde.

## Invariants (RPG)

- Config-first: tutti i numeri da `LayerBudgetSchema` (sub-plan A).
- No `Date.now()`: tutti i timestamp da `WorldClock.now()` (sub-plan B).
- Test deterministici, nessun timer reale nei test unitari.

## Constraints

- Modulo puro TypeScript: input = conteggi (`activePixiObjects`, `effectCost`, frame times), non misurazioni WebGL dirette.
- Memoria: solo profiling offline, nessuna soglia runtime hard (WKWebView/WebView2 differiscono).

## Approach notes

- Interfaccia `BudgetGuard` / `BudgetSnapshot` / `BudgetViolation` come nel piano tattico §4.
- Il campo `requestedAt` di `HeavyEffect` usa `WorldClock.now()`.

## File targets

- `src/ui/idleVillage/worldSurface/utils/EffectAdmissionController.ts` (nuovo)
- `tests/unit/idleVillage/WorldSurfaceV3Budget.test.tsx` (nuovo)

## Dependencies

- Sub-plan A (schemi `LayerBudget` / `HeavyEffect`).
- Sub-plan B (`WorldClock`).

## Safeguards

```bash
npm run lint -- src/ui/idleVillage/worldSurface/utils tests/unit/idleVillage/WorldSurfaceV3Budget.test.tsx
npm run test -- WorldSurfaceV3Budget
npm run build:check
npm run kanban:lint
```

## Open questions

- Nessuna bloccante. I target numerici (p95, soglie) restano placeholder fino a profiling Tauri reale.
