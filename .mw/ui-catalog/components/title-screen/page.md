# title-screen — Title screen (continue/new/load/settings)

> PLAN-086. The `/game` entry gate (`view`): full-screen title surface —
> game logo over the boot radial-glow background, hairline rule, and a
> vertical pill nav. Shown only via `?title=1`, Tauri launch, or the
> post-quit session flag — a plain `/game` visit auto-continues into the
> world map.

## What it is / does

- `data-testid="title-screen"` — `position:fixed inset-0`, boot z-layer,
  radial bgGlow→bgDeep gradient, `logoUrl` art with drop-shadow.
- Pill nav (`nav[data-hud-controls]`):
  - **Continue** — `SkinButton variant="cta"`, shown only when
    `continueDay !== null` (persisted progress found); label carries the
    day (`continue` vs `continuePlain`).
  - **New Game** — goes straight in when the profile is fresh; when
    `info.hasProgress` it routes through `new-game-confirm` instead.
  - **Load Game**, **Settings** — mount `LoadGamePanel` / `SettingsPanel`
    over the title.
  - **Exit** — Tauri runtime only.
- `busy` (loading save-info / transition) disables every pill.
- Mounts `GameEntry`'s child screens once `phase === 'game'`.

## Declared states

| id | driver | observable assertion | result |
|---|---|---|---|
| `default` | script `drivers/titleScreen.ts` (navigate `/game?title=1`, wait `title-screen` visible) | `[data-testid="title-screen"]` visible | **passed** |

## Capture (V1)

- `shots/V1/meta.json` — sourceSha `80aaec6c`, sourceHash `b82b31bacf80d74e`,
  metal backend, 1440×900, reduced-motion `reduce`, 0 console errors /
  0 network failures.
- `default-ctx-a/b.png` — in-context; `default-iso-0.png` — the
  `title-screen` element (**full-viewport crop by contract**, view-level
  entry). On this capture the profile is fresh → **no Continue pill**;
  three pills visible: New Game / Load Game / Settings.
- `deterministicSameBytes: true` — static screen; the double ctx capture
  is byte-identical.

## Links

- Contract: `.mw/contracts/components/title-screen.md`
- Scope: `src/ui/idleVillage/components/gameFrame/menu/TitleScreen.tsx`,
  `GameEntry.tsx` (pill wiring, panel mounting, hasProgress logic).
- Driver: `scripts/catalog/drivers/titleScreen.ts`.

## Art-direction slice (rubric rev 3)

`view` → full ART-DIRECTION rubric + composition notes: painted-logo
frontispiece on the boot gradient; Cinzel pills, materic CTA reserved for
Continue; quiet ceremonial tone — no SaaS chrome.
