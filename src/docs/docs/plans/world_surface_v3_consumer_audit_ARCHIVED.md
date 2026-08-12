# World Surface V3 — Consumer Audit

**Scope:** `src/ui/idleVillage/worldSurface/**`, `src/ui/idleVillage/pages/WorldSurfaceTestPage.tsx`, `src/App.tsx`, `src/ui/idleVillage/TestHub.tsx`.  
**Status:** discovery (no freeze).  
**Date:** 2026-08-13.  
**Method:** `grep` per import, lettura sorgente, `tsc` non invocato (l'audit non modifica codice).

## Executive summary

Il codice V3 attuale è uno **scaffold render-safe**: i layer esistono, gli hook hanno la forma giusta, ma i sistemi reali (event FSM, wonder spawner, underwater, AttentionZone, budget) sono stub. I consumer attuali sono pochi e tutti all'interno del perimetro `worldSurface`. Non esistono consumer esterni a `worldSurface` che importino i config V3 (salvo `App.tsx` per la route e `TestHub.tsx` per la voce di menu).

**Coordinate attuali:** nessun file V3 usa un vero coordinate space `world_pixels/top_left`.

- `ParallaxController.ts` usa `window.innerWidth/Height` e `clientX/Y` (viewport pixels) per calcolare un offset numerico.
- `BreathLayer.tsx` usa `breathPhase` (0..1) per `opacity`.
- `WorldLayer.tsx` non usa coordinate, solo `baseOpacity`.
- `UnderwaterLayer.tsx` è un placeholder vuoto.
- `EventLayer` e `WonderLayer` non hanno ancora coordinate associate (render basato su `phase` e `type`).

**Impatto sul domain model:** l'introduzione di `world_pixels/top_left` richiede una nuova conversione coordinate che **nessun consumer attuale possiede**. Tutti i layer avranno bisogno di adattamento.

## Consumer table

| Consumer | File | Import / Dipende da | Field / Shape usati | Coordinate / Spazio | Disposizione candidata | Note |
|---|---|---|---|---|---|---|
| `WorldSurfaceV3Page` | `pages/WorldSurfaceV3Page.tsx` | `../WorldSurface` | Mount del componente root | n/a | `adapt` | Semplicemente monta `<WorldSurface />`. Dovrà montare `compose` + `registry` in futuro. |
| `WorldSurface` (root) | `WorldSurface.tsx` | `layers/*` | Composizione layer tree | n/a | `adapt` | Dovrà ricevere config normalizzata o registry come prop o context. |
| `WorldLayer` | `layers/WorldLayer.tsx` | `WORLD_SURFACE_CONFIG` (`worldSurfaceConfig.ts`) | `calibration.baseOpacity` | n/a (solo opacity) | `adapt` | Nessuna posizione/rect; solo opacity globale. |
| `BreathLayer` | `layers/BreathLayer.tsx` | `useBreathAnimation` | `breathPhase` (0..1) | n/a (solo opacity) | `adapt` | Usa `breathPhase` per opacity. Deve passare a `BreathConfig` dal registry. |
| `EventLayer` | `layers/EventLayer.tsx` | `useEventSystem` | `activeEvents[].id`, `.phase` | n/a (no coords) | `adapt` | Render condizionale per fase. Dovrà usare `EventSeverity` + coordinate evento. |
| `WonderLayer` | `layers/WonderLayer.tsx` | `useWonderSystem` | `activeWonder.type` | n/a (no coords) | `adapt` | Dovrà usare `Wonder` con `position` (`world_pixels`). |
| `UnderwaterLayer` | `layers/UnderwaterLayer.tsx` | nessuno | placeholder | n/a | `adapt` | Dovrà ricevere `UnderwaterV3` config e applicare waterline/depth. |
| `useBreathAnimation` | `hooks/useBreathAnimation.ts` | `WORLD_SURFACE_CONFIG.breath` | `breath.timing`, `breath.amplitude` | n/a | `adapt` | Sostituire `setInterval` con TimeEngine (sub-plan B). |
| `useParallax` | `hooks/useParallax.ts` | `calculateParallaxOffset` (`ParallaxController`) | `parallaxOffset` | viewport pixels | `adapt` | Oggi ascolta `mousemove` globale. Dovrà ricevere camera/viewport dal registry. |
| `useEventSystem` | `hooks/useEventSystem.ts` | `useWorldSurfaceState`, `eventConfig` | `activeEvents`, `eventQueue`, `eventConfig` | n/a | `adapt` | Ritorna `eventConfig` come dato grezzo. Dovrà ricevere `WorldAttentionDirector` e `EventSeverity[]`. |
| `useWonderSystem` | `hooks/useWonderSystem.ts` | `useWorldSurfaceState`, `wonderSpawner` | `nextWonderTime`, `wonderHistory`, `activeWonder` | n/a | `adapt` | `wonderSpawner` è stub. Dovrà ricevere `WorldSurfaceV3Registry` e seeded RNG. |
| `useUnderwaterSystem` | `hooks/useUnderwaterSystem.ts` | `useWorldSurfaceState`, `UNDERWATER_CONFIG` | `underwaterState`, `underwaterConfig` | n/a | `adapt` | Config vuoto. Dovrà ricevere `UnderwaterV3` dal registry. |
| `useWorldSurfaceState` | `hooks/useWorldSurfaceState.ts` | `useState` (React) | `worldSurfaceState`, `underwaterState`, `nextWonderTime`, `wonderHistory`, `activeWonder` | n/a | `remove` / `replace` | Hook placeholder con stato isolato. Verrà sostituito da registry + Zustand/Context condiviso. |
| `ParallaxController` | `layers/ParallaxController.ts` | `WORLD_SURFACE_CONFIG.parallax` | `parallax.multipliers`, `parallax.bounds` | viewport pixels → offset scalare | `adapt` | Deve essere riprogettato per `world_pixels` e camera offset. |
| `eventPresageSystem` | `utils/eventPresageSystem.ts` | `WorldEventType`, `EventPhase` (type-only) | tipi `EventPhase`, `WorldEventType` | n/a | `adapt` | Verrà sostituito dal FSM `WorldEventSeverity` nel domain model. |
| `wonderSpawner` | `utils/wonderSpawner.ts` | `WONDER_TYPES` | `WONDER_TYPES` (valori enum) | n/a | `adapt` | Stub. Dovrà ricevere `Wonder[]`, biomi, RNG seed. |
| `causticEffects` | `utils/causticEffects.ts` | nessuno | nessuno | n/a | `adapt` / `remove` | Placeholder vuoto. V3 ridotto a ripple/silhouette. |
| `worldSurfaceConfig` | `config/worldSurfaceConfig.ts` | `z` | `parallax`, `breath`, `calibration`, `events`, `wonders`, `underwater` | n/a | `remove` | File config monolitico. Verrà sostituito da `WorldSurfaceV3Config` root e fragment. |
| `eventConfig` | `config/eventConfig.ts` | `z` | `WorldEventType`, `EventPhase`, `EVENT_PHASE_DURATIONS` | n/a | `remove` | Dati di dominio spostati in `WorldSurfaceV3Config` e `EventSeverity`. |
| `wonderConfig` | `config/wonderConfig.ts` | `z` | `WONDER_TYPES`, `wonderConfigSchema` | n/a | `remove` | Stessi dati spostati in `WorldSurfaceV3Fragment`. |
| `underwaterConfig` | `config/underwaterConfig.ts` | `z` | `UNDERWATER_CONFIG` (vuoto) | n/a | `remove` | Sostituito da `UnderwaterV3` nel root config. |
| `App.tsx` (route) | `src/App.tsx` | `WorldSurfaceV3Page` (lazy) | mount condizionale a `/world-surface-v3` | n/a | nessuna modifica V3 | Consumer indiretto: rotta. Non dipende da config. |
| `TestHub.tsx` (menu) | `src/ui/idleVillage/TestHub.tsx` | nessun import di `worldSurface` | entry `id: 'world-surface-v3'` | n/a | nessuna modifica V3 | Consumer indiretto: voce menu. Status `needs-refactor` già corretto. |
| `WorldSurfaceTestPage` | `src/ui/idleVillage/pages/WorldSurfaceTestPage.tsx` | proprio renderer/config | `/world-surface` (V2/dispatch) | asset native resolution | `n/a` (separato) | Pagina V2/Dispatch. Non consuma `worldSurface` V3. Non va migrata con V3. |

## Cataloghi / config locali da rimuovere

I file `worldSurfaceConfig.ts`, `eventConfig.ts`, `wonderConfig.ts`, `underwaterConfig.ts` contengono dati di dominio e schemi Zod. Devono diventare **preset/fragment** validati dal contratto centrale, non possedere schemi duplicati.

## Coordinate space gap

| Consumer | Usa coordinate? | Sistema attuale | Azione necessaria per `world_pixels/top_left` |
|---|---|---|---|
| `ParallaxController` | sì (mouse) | viewport pixels | Aggiungere `camera` e `worldToScreen`/`screenToWorld`. |
| `WonderLayer` | no (placeholder) | n/a | Aggiungere posizione wonder in `world_pixels` e transform. |
| `EventLayer` | no (placeholder) | n/a | Aggiungere region/position in `world_pixels` per presage FSM. |
| `UnderwaterLayer` | no (placeholder) | n/a | Aggiungere `waterlineY` in `world_pixels`. |
| `BreathLayer`, `WorldLayer` | no | n/a | Nessuna azione. |

## Findings / blocker per A.2

1. **Tutti i config V3 sono stub o dati non validati.** Nessun consumer attuale legge un contratto condiviso. La migrazione inizierà da zero.
2. **`useWorldSurfaceState` è il proprietario di stato isolato.** Con il registry derivato, questo hook deve scomparire o diventare un adapter sottile.
3. **`useEventSystem` re-espone `eventConfig` grezzo.** Non deve più esporre config locali.
4. **`ParallaxController` calcola da viewport pixels.** Non esiste alcun convertitore verso `world_pixels`. Verrà aggiunto con il camera layer (sub-plan G / A.3).
5. **Nessun AttentionZone consumer ancora esiste.** Il sub-plan D (`useAttentionZone.ts`) è un file non ancora creato? Attualmente non presente in `worldSurface/hooks/`. Da verificare: il sistema AttentionZone dovrà essere aggiunto ex-novo.

## Disposizioni non vincolanti (A.1 → A.2/A.3)

| Consumer | Disposizione | Motivo |
|---|---|---|
| `useWorldSurfaceState` | `remove` | Stato isolato sostituito da registry condiviso. |
| `worldSurfaceConfig.ts` | `remove` | Monolito sostituito da `WorldSurfaceV3Config` centrale. |
| `eventConfig.ts` | `remove` | Dati in `WorldSurfaceV3Fragment`. |
| `wonderConfig.ts` | `remove` | Dati in `WorldSurfaceV3Fragment`. |
| `underwaterConfig.ts` | `remove` | Dati in `WorldSurfaceV3Fragment`. |
| `useBreathAnimation` | `adapt` | Deve leggere `Breath` dal registry. |
| `useParallax` / `ParallaxController` | `adapt` | Deve integrare camera transform. |
| `useEventSystem` | `adapt` | Deve consumare `WorldAttentionDirector` + `EventSeverity[]`. |
| `useWonderSystem` | `adapt` | Deve consumare `WorldSurfaceV3Registry` e `wonderSpawner` purificato. |
| `useUnderwaterSystem` | `adapt` | Deve leggere `UnderwaterV3`. |
| `WorldSurface` / `WorldSurfaceV3Page` | `adapt` | Mount `compose` + `registry` e fornirli ai layer. |
| `WorldLayer`, `BreathLayer` | `adapt` | Leggere `LayerBudget` / `Breath` dal registry. |
| `EventLayer`, `WonderLayer`, `UnderwaterLayer` | `adapt` | Leggere entità coordinate dal registry. |
| `eventPresageSystem` | `adapt` | Deve essere sostituito da `WorldEventSeverity` FSM. |
| `wonderSpawner` | `adapt` | Deve diventare puro e deterministico. |
| `causticEffects` | `adapt` | V3 ridotto a surface ripple. |

## Domande aperte per il Director / A.2

1. `WorldSurfaceV3Page` deve montare il `registry` come singleton globale o passarlo come Context?
2. `Parallax` deve rispondere al movimento del mouse globale o al pan/zoom della camera?
3. `Breath` deve essere un effetto CSS `opacity` o un transform Pixi/CSS?
4. `useWorldSurfaceState` va rimosso completamente o convertito in `useWorldSurfaceRegistry`?
