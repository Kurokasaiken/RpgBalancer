# error-boundary — ErrorBoundary fallback (crash screen)

> PLAN-086. The class `ErrorBoundary` wrapping the app: on an uncaught
> render error it swaps the whole subtree for a `GlassCard variant="danger"`
> crash plate with `data-testid="error-message"` (+ collapsible
> `error-stack` in dev) and a "Try Again" reset. Documented **partial** —
> absence is the healthy state; the documenter cannot assert absence. See
> `fixes.md`.

## What it is / does

- `getDerivedStateFromError` → `hasError`; `componentDidCatch` logs. With
  no custom `fallback` it renders a centered card: "Something went wrong",
  the failing `componentName`, `error.message`
  (`data-testid="error-message"`), the stack in `<details
  data-testid="error-stack">` (open by default only in dev), and a
  `GlassButton` that resets the boundary.
- On a healthy `/game` nothing of this is in the DOM — verified:
  `[data-testid="error-message"]` **not in DOM** at S1 (probe 2026-10-24).
- Manifest note: the fallback was witnessed covering the whole route after
  the quest-run TDZ crash — that crash is the known unreachable-bug and is
  not a harness seam.

## Declared states

| id | driver | observable assertion | result |
|---|---|---|---|
| `default` | surface `S1_WorldMapIdle` | `[data-testid="error-message"]` `visible:false` | **documented_partial — assertion semantics unsupported**: assert-absent always fails in `checkAssertion`. DOM truth: element absent = healthy |

## Capture (V1)

- `shots/V1/meta.json` — sourceSha `80aaec6c`, sourceHash `d28b36ddb6a663a9`,
  metal backend, 1440×900, reduced-motion, captured 2026-10-24T23:08:13Z;
  `reached: true, asserted: false`, no documenter shots on failure.
- `shots/V1/default-absence-evidence.png` — manual evidence capture:
  healthy `/game` at S1, no crash plate, `error-message` not in DOM.

## Fixes

See `fixes.md` — assert-absent support; no clean positive-state seam
exists today.

## Links

- Contract: none linked in the manifest.
- Scope: `src/ui/organisms/ErrorBoundary.tsx`, `src/App.tsx`.

## Art-direction slice (rubric rev 3)

`overlay` → legacy `GlassCard`/`GlassButton` atoms (pre-Lacquer-Atlas
surface — a legacy pattern, not a skin preset); red-on-dark danger card.
Correct as an emergency surface, but not representative of the current
materic grammar.
