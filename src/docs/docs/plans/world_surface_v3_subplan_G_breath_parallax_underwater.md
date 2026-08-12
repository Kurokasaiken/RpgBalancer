---
title: World Surface V3 — Sub-plan G — Breath, Parallax, Underwater V3
status: Draft
parent_plan: world_surface_v3_tactical_plan.md
node: G
classification: sub-plan
execution_hint: verified
created: 2026-08-13
---

# Sub-plan G — Breath, Parallax e Underwater V3

## Classificazione e giustificazione

`sub-plan`. Tre sistemi visivi condividono config, season modifiers, coordinate space, reduced-motion fallback e un unico ticker Pixi. I file sono multipli e l'accettazione include demo visiva.

## Intent

Consolidare `useBreathAnimation.ts`, `useParallax.ts` e `useUnderwaterSystem.ts` con: valori di config validati, season modifiers, frame ancorato 1.00x (il frame DOM non si muove), parallax solo ai layer interni con dead zone 5% e easing 0.3–0.5s, underwater V3 ridotto a surface ripple + silhouette di creature, e fallback `reducedMotion` / low power.

## Acceptance

- `/world-surface-v3` mostra nuvole, nebbia, acqua, alberi, polvere (per bioma) in modo da percepire "la foresta respira" ma non "la foresta oscilla".
- Parallax: mouse offset → pan dei layer interni con moltiplicatori; frame fermo; movimento clampato.
- Underwater: solo ripple e silhouette; `causticEffects.ts` resta stub con commento "V4".
- `prefers-reduced-motion`: disabilita animazioni breath, parallax, underwater.
- Low power fallback: `disableParticles`, `reduceCycleFrequency: 0.5`, `maxActiveBreathElements: 2`.
- `WorldSurfaceV3Underwater.test.tsx` esteso per V3.
- `npm run build:check` verde.

## Invariants (RPG)

- React non re-renderizza a 60 FPS: ticker unico per Pixi, CSS custom properties in `requestAnimationFrame` se necessario.
- No shader custom in V3; niente caustiche fisiche, volumetric fog, refrazione.
- Config-first: tutti i numeri da `BreathConfigSchema` e `ParallaxConfigSchema`.
- i18n: eventuali label per modalità low-power via `labelKey`.
- `reducedMotion` fallback accessibile.

## Constraints

- Underwater V3: surface ripple + silhouettes; caustiche V4.
- Frame DOM `transform` impercettibile o nullo: max 2–3px.
- Solo 4 `Container_*` interni al single-stage Pixi: `Breath`, `Events`, `Wonders`, `Underwater`.
- DPR: inizializzare Pixi `resolution: window.devicePixelRatio || 1` e sincronizzare pan/zoom DOM ↔ Pixi.

## Approach notes

- Breath: sprite sheet drift + CSS overlay gradient per nebbia; particelle context-driven.
- Parallax: offset in `useParallax` derivato da mouse position + pan, applicato via transform ai layer Pixi.
- Underwater: silhouette sotto la superficie come texture semitrasparente; ripple via sprite in movimento ciclica.

## File targets

- `src/ui/idleVillage/worldSurface/hooks/useBreathAnimation.ts` (consolidare)
- `src/ui/idleVillage/worldSurface/hooks/useParallax.ts` (consolidare)
- `src/ui/idleVillage/worldSurface/hooks/useUnderwaterSystem.ts` (consolidare)
- `src/ui/idleVillage/worldSurface/layers/BreathLayer.tsx` (consolidare)
- `src/ui/idleVillage/worldSurface/layers/UnderwaterLayer.tsx` (consolidare)
- `src/ui/idleVillage/worldSurface/utils/causticEffects.ts` (stub V4)
- `tests/unit/idleVillage/WorldSurfaceV3Underwater.test.tsx` (estendere)

## Dependencies

- Sub-plan A (schemi `Breath`, `Parallax`, `SeasonModifier`).
- Sub-plan B (`WorldClock` per cicli).
- Sub-plan C (`EffectAdmissionController` per limitare densità).

## Safeguards

```bash
npm run lint -- src/ui/idleVillage/worldSurface tests/unit/idleVillage/WorldSurfaceV3Underwater.test.tsx
npm run test -- WorldSurfaceV3Underwater
npm run build:check
npm run kanban:lint
```

## Open questions

- Il `BreathLayer` attuale è già un componente React separato: va spostato nel single-stage Pixi o resta DOM?
- Assets ripple/water/seasonal (foglie, neve) disponibili o stub texture colorate?
