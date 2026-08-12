---
title: World Surface V3 — Sub-plan H — Demo verticale e integrazione
status: Draft
parent_plan: world_surface_v3_tactical_plan.md
node: H
classification: sub-plan
execution_hint: architectural
created: 2026-08-13
---

# Sub-plan H — Demo verticale /world-surface-v3

## Classificazione e giustificazione

`sub-plan`. Integra tutti i sistemi precedenti, UI, smoke test, demo, TestHub. Richiede giudizio architetturale sul wiring di stato e sull'ordine di montaggio.

## Intent

Completare `/world-surface-v3` dimostrando: una `AttentionZone` reattiva (`village_market_01`, pointer-dwell 1200ms → `merchant_idle_whisper`), un evento `Storm` Tier 1, una `Goblin Invasion` Tier 3 mockata (no real gameplay consequence), parallax, breath, wonder, e fallback `reducedMotion`.

## Acceptance

- Smoke test: `curl -s -o /dev/null -w '%{http_code}' http://localhost:5173/world-surface-v3` restituisce `200`.
- Nessun errore console React alla apertura e durante le demo.
- Demo scenario riproducibile via parametri URL o TestHub (es. `?forceEvent=storm&forceZone=village_market_01`).
- `Playwright`/`RTL` copre: hover zone → reazione, Tier 1 badge, Tier 3 vignette/focus ring.
- `npm run build:check` verde.

## Invariants (RPG)

- i18n: nessuna stringa hardcoded; namespace `idleVillage` caricato prima del mount.
- No standalone `.css`; skin come preset in `skinConfigRegistry`.
- Frozen kit reuse: `ClockWidgetStandalone` importato con una riga se il tempo serve anche UI.
- Component reuse: verificare `src/ui/atoms/`, `src/ui/fantasy/atoms/`, `src/ui/idleVillage/skins/primitives/`.
- Smoke test obbligatorio per ogni pagina creata/modificata.
- Telemetry eventi una sola volta, schema tipizzato.

## Constraints

- Tier 3 mockata: nessuna conseguenza run-ending reale (Pillar 2 tension non risolta qui).
- Demo zones/events limitati a quelli configati.
- `i18n.hasLoadedNamespace('idleVillage')` richiesto prima di montare AttentionZone.
- Non creare nuovi renderer: single-stage Pixi esistente.

## Approach notes

- `WorldSurfaceV3Page` monta `SkinSystemProvider` + `SandboxTimingProvider` (se non forniti dal layout padre) e `ClockWidgetStandalone` se visibile.
- Stato condiviso in Zustand: `useWorldSurfaceState` diventa owner unico locale (sub-plan A/B/E).
- TestHub: verificare che la voce World Surface V3 sia presente.

## File targets

- `src/pages/world-surface-v3.tsx` (esistente)
- `src/ui/idleVillage/worldSurface/pages/WorldSurfaceV3Page.tsx` (consolidare)
- `src/ui/idleVillage/worldSurface/layers/WorldLayer.tsx` (montare hitbox)
- `src/ui/idleVillage/worldSurface/layers/EventLayer.tsx` (consumare FSM)
- `src/ui/idleVillage/worldSurface/layers/WonderLayer.tsx` (consumare pool)
- `src/ui/idleVillage/worldSurface/layers/BreathLayer.tsx` (consumare config)
- `src/ui/idleVillage/worldSurface/layers/UnderwaterLayer.tsx` (consumare V3)
- `src/ui/idleVillage/TestHub.tsx` (se aggiornare metadata)
- `tests/e2e/worldSurfaceV3.spec.ts` (nuovo, se esiste la suite E2E)

## Dependencies

- Sub-plan A (config radice).
- Sub-plan B (`WorldClock`).
- Sub-plan C (`EffectAdmissionController`).
- Sub-plan D (`AttentionZone`).
- Sub-plan E (`EventSeverity` + FSM).
- Sub-plan F (`Wonder Spawner`).
- Sub-plan G (`Breath/Parallax/Underwater`).

## Safeguards

```bash
npm run lint -- src/pages/world-surface-v3.tsx src/ui/idleVillage/worldSurface src/ui/idleVillage/TestHub.tsx
npm run test -- world-surface-v3
npm run build:check
npm run kanban:lint
```

## Open questions

- Il `WorldSurfaceV3Page` attuale usa provider locali o si aspetta che siano montati in `App.tsx`? Verificare prima di H.
- Mock Tier 3: si fa con query string, pulsante dev-only, o trigger forzato in config?
