# game-boot-screen — Boot veil / loading screen

> PLAN-086. The `/game` title veil (PLAN-031 T-A1): authored logo plaque on
> sea-teal lacquer, thin gold rule, determinate progress bar driven by the
> map's real boot progress, phase caption. Also the Suspense fallback in
> `App.tsx` (`manifest` phase, indeterminate) — the first pixel is already
> branded, never a grey "Loading…".

## What it is / does

- `data-testid="game-boot-screen"`, `position:fixed; inset:0`, z =
  `zLayers.boot` — covers the viewport while the world preloads.
- Phases `manifest → assets → ready` drive caption + `fraction` (or the
  pulsing indeterminate bar); `done` fills the bar, holds
  `bootVeil.minDisplayMs`, fades (`bootVeil.fadeMs`), then `onExited`
  unmounts it. `error` swaps the bar for a boot-failure report.
- Reduced motion skips the fade and goes straight to unmount; tokens live
  in `DEFAULT_GAME_FRAME_CONFIG.bootVeil`.

## Declared states

| id | driver | observable assertion | result |
|---|---|---|---|
| `default` | surface `S0_BootVeil` (no-op reach; ready signal = boot screen OR title screen) | `[data-testid="game-boot-screen"]` visible | **passed*** |

\* Transient-state race (recorded honestly): the veil is gone by the time
the map is interactable. `openGame` returns as soon as the expedition hook
mounts; the assertion still caught the veil visible, and the two
in-context shots were taken immediately after — but by the time the
`captureSelector` loop ran the veil had detached, so `isolated` is empty
(`meta.json` `shots.isolated: []`). The ctx shots catch the veil mid-boot
or mid-exit; the exact phase (caption/bar value) inside the frame is not
asserted. `deterministicSameBytes: false` is expected for an animated
progress veil.

## Capture (V1)

- `shots/V1/meta.json` — sourceSha `80aaec6c`, sourceHash `893a8a4016bd6c1e`,
  metal backend, 1440×900, reduced-motion `reduce`, captured
  2026-10-24T23:08:23Z.
- `default-ctx-a.png` / `default-ctx-b.png` — in-context frames of the
  transient veil; no `iso-*` (element detached before isolated capture).
- `howStateReached`: `[]` — S0 reach is a no-op; the state is the natural
  post-goto boot.

## Links

- Contract: `.mw/contracts/components/game-boot-screen.md`
- Scope: `src/ui/idleVillage/components/gameFrame/GameBootScreen.tsx`.

## Art-direction slice (rubric rev 3)

`overlay` → branded plaque on `--skin-hud` lacquer + gold rule; a physical
loading object, not a skeleton spinner; reduced-motion honored.
