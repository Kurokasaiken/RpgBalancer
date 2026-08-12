---
title: World Surface V3 — Sub-plan B — WorldClock / TimeEngine adapter (v2)
status: Draft
version: 2
parent_plan: world_surface_v3_tactical_plan.md
node: B
classification: sub-plan
execution_hint: architectural
created: 2026-08-13
revised: 2026-08-13
---

# Sub-plan B — WorldClock / TimeEngine adapter (v2)

## Classificazione e giustificazione

`sub-plan`. Chiude la questione del tempo in World Surface V3: una sola fonte di tempo deterministic, sottoscrivibile, mockabile in test, che non genera re-render React per-frame. Tocca il frozen kit `clockKit` solo in lettura.

## Intent

Produrre un adapter `WorldClock` per `src/ui/idleVillage/worldSurface/` che:

1. Esponga un `now: number` unico e deterministico.
2. Permetta sottoscrizioni selettive (tick, pause, resume) senza causare re-render inutili.
3. Sostituisca ogni `Date.now()` nel perimetro `worldSurface`.
4. Supporti test con avanzamento manuale del tempo.
5. Gestisca la pausa/ripresa Tauri in background.

## Public API (congelata)

```ts
// src/ui/idleVillage/worldSurface/hooks/useWorldSurfaceClock.ts
export interface WorldSurfaceClock {
  readonly now: number;          // millisecondi dal time origin del clock
  readonly isPaused: boolean;
  readonly speed: number;        // 1.0 default
}

export const useWorldSurfaceClock = (): WorldSurfaceClock;

export const useWorldSurfaceTick = (callback: (clock: WorldSurfaceClock) => void): void;
// sottoscrizione esterna; il consumer usa `useWorldSurfaceClock()` con selector stabile

// src/ui/idleVillage/worldSurface/utils/worldSurfaceClock.ts (pure)
export const createWorldSurfaceClock = (
  engine: TimeEngineLike,
  options?: { initialNow?: number; speed?: number }
): WorldSurfaceClockController;

export interface WorldSurfaceClockController {
  get now(): number;
  get isPaused(): boolean;
  get speed(): number;
  pause(): void;
  resume(): void;
  advance(ms: number): void;      // solo per test / orchestrazione deterministica
  setSpeed(speed: number): void;  // per slow-motion / fast-forward
  subscribe(listener: () => void): () => void;
}
```

## TimeEngine adapter

- `TimeEngineLike` è un'interfaccia minima (vedi snippet sotto).
- L'implementazione P0 wrappa il frozen kit `clockKit`:
  - Import `useSandboxClock`/`usePresentationClock` (o equivalente esposto dal kit) come `engine`.
  - Se il kit non espone un `onTick` selettivo, `useWorldSurfaceClock` sottoscrive un atom Zustand/selector `clockKit` e notifica i listener in un `Set`.
- Il controller mantiene un valore `now` locale aggiornato dal kit; `advance(ms)` lo sposta manualmente in test.

```ts
interface TimeEngineLike {
  now(): number;
  isPaused(): boolean;
  onTick?(cb: (deltaMs: number) => void): () => void;
}
```

## Ownership e lifecycle

- **Owner:** `WorldSurfaceClockController` è istanziato in `WorldSurfaceV3Page.tsx` e passato via `WorldSurfaceV3Provider` (stesso provider del registry A.3).
- **Scope:** il clock vive per pagina; non è singleton globale.
- **No React state per tick:** `useWorldSurfaceClock()` usa `useSyncExternalStore` o un selettore Zustand stabile. Il componente si aggiorna solo quando `now` (o `isPaused`/`speed`) cambia rispetto al selettore.
- **Background:** il controller ascolta `document.visibilitychange`; su `hidden` richiama `pause()`; su `visible` richiama `resume()` con un `catchUpMs` limitato (max 1 tick o max durata fase). Il catch-up è disabilitato per V3 (hard pause) a meno di evidenza contraria.

## Acceptance

- `grep -r "Date.now()" src/ui/idleVillage/worldSurface/` non trova occorrenze (salvo test con motivazione).
- `useWorldSurfaceClock()` non causa re-render a 60 FPS: test con `console.count` su `BreathLayer`/`WonderLayer` mostra al massimo 1 render al secondo o su cambio `now`.
- Test deterministici in `WorldSurfaceV3Clock.test.tsx`:
  - `advance(1000)` aumenta `now` di 1000.
  - `setSpeed(2)` fa avanzare `now` al doppio.
  - `pause()` blocca `now`; `resume()` lo fa ripartire.
  - Sequenza identica a parità di seed/stato.
- Background: simulare `document.hidden = true` per 5s e verificare che `now` non avanzi di più di un tick.
- `ClockWidgetStandalone` è importabile in `WorldSurfaceV3Page` con una riga (`import { ClockWidgetStandalone } from '@/ui/idleVillage/frozen/kits'`) e non richiede provider aggiuntivi.
- `npm run build:check` verde.

## Invariants (RPG)

- Frozen kit reuse: non modificare `clockKit`. L'adapter è sottile e leggibile.
- Determinismo: nessun `Date.now()` implicito; il tempo è iniettato.
- State management: il tempo è dominio condiviso, ma non forzare un nuovo Zustand se `clockKit` ne fornisce già uno. Se serve, il controller può essere Zustand/Context; la scelta dipende dal contratto del kit.
- No rendering at 60 FPS: i consumer usano selettori stabili.

## Constraints

- Non creare provider duplicati: `ClockWidgetStandalone` è già wrappato.
- Non modificare `clockKit` senza frozen kit governance.
- `advance()` e `setSpeed()` sono disabilitati in build di produzione (strippate o no-op) oppure marcate `__TEST_ONLY__`.
- `useWorldSurfaceTick` non espone delta per-frame; espone un `now` discreto al momento del tick del motore.

## Approach notes

1. Ispezionare `clockKit` (`clockKit.tsx`, `clockKit.contract.ts`, `useSandboxClock.ts`, `usePresentationClock.ts`) per determinare l'API esposta.
2. Scrivere `worldSurfaceClock.ts` (pure, no React) con `createWorldSurfaceClock`.
3. Scrivere `useWorldSurfaceClock.ts` come hook sottile che wrappa il controller.
4. Sostituire `Date.now()` in `useBreathAnimation`, `useEventSystem`, `useWonderSystem`, `useAttentionZone`, `EffectAdmissionController` (in sub-plan C) con `useWorldSurfaceClock().now` o sottoscrizione.
5. `WorldSurfaceV3Page` monta il controller e lo passa al provider.

## Consumer migration del tempo (da `CONSUMER_AUDIT.md`)

| Consumer | Uso attuale | Nuovo uso | Nota |
|---|---|---|---|
| `useBreathAnimation` | `setInterval(..., 16)` fissi | `useWorldSurfaceClock().now` + `requestAnimationFrame` opzionale | Il cycle usa `now` per calcolare fase. |
| `useEventSystem` | nessuno | `useWorldSurfaceClock().now` per FSM phase transitions | Sub-plan E. |
| `useWonderSystem` | nessuno | `useWorldSurfaceClock().now` per spawn/cadence | Sub-plan F. |
| `useAttentionZone` | nessuno | `useWorldSurfaceClock().now` per dwell | Sub-plan D. |
| `EffectAdmissionController` | nessuno | `useWorldSurfaceClock().now` per TTL/queue | Sub-plan C. |

## File targets

- `src/ui/idleVillage/worldSurface/utils/worldSurfaceClock.ts` (nuovo)
- `src/ui/idleVillage/worldSurface/hooks/useWorldSurfaceClock.ts` (nuovo)
- `src/ui/idleVillage/worldSurface/hooks/useBreathAnimation.ts` (sostituire `setInterval` con clock)
- `src/ui/idleVillage/worldSurface/pages/WorldSurfaceV3Page.tsx` (montare controller)
- `tests/unit/idleVillage/WorldSurfaceV3Clock.test.tsx` (nuovo)
- `test-results/world-surface-v3-B-clock.md` (evidence log)

## Dependencies

- A.1 (`CONSUMER_AUDIT.md`) per sapere quali consumer usano tempo.
- A.2 (`WorldSurfaceV3Config`) se il clock deve leggere `LayerBudget` o `WorldAttentionDirector` (opzionale in B).
- Frozen kit `clockKit` (lettura, no modifica).

## Safeguards

```bash
npm run lint -- src/ui/idleVillage/worldSurface/hooks src/ui/idleVillage/worldSurface/utils tests/unit/idleVillage/WorldSurfaceV3Clock.test.tsx
npm run test -- WorldSurfaceV3Clock
npm run build:check
npm run kanban:lint
```

## Open questions

- Se `clockKit` non espone un `onTick` selettivo, vale la pena creare un atom Zustand `worldSurfaceClockStore.ts` o usare Context? (default: Context/Zustand minimale solo se necessario)
- Il clock UI (`ClockWidgetStandalone`) deve essere visibile nella demo `/world-surface-v3`? (default: sì, opzionale, non bloccante per B)
