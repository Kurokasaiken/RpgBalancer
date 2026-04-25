# React + Electron Performance Guidelines (2026)

## Goals
- Prevent UI freezes with Monte Carlo workloads.
- Keep parallaxe/animation at 60fps.
- Fit RPG Balancer philosophy (config-first, telemetry-ready).

## Sources
- Electron Performance Checklist (2026) – avoid blocking main/renderer, prefer async I/O, bundle code.
- Palette.dev "Slack/VSCode" guide – bundlers, deferred imports, WASM/native modules, V8 snapshots, live perf telemetry.
- Zigpoll React animation tips – GPU-only properties, `will-change`, Web Workers, OffscreenCanvas, profiling.

## Guardrails
1. **Bundling & Imports**
   - Vite/GOP bundler per renderer, no runtime `require()`.
   - Route-based code splitting; lazy load heavy tools.
2. **Main Process**
   - No blocking I/O; use Node worker_threads or separate processes for simulations/log crunch.
   - Only async IPC (no `@electron/remote`).
3. **Renderer Thread**
   - GPU-only animations (`transform`, `opacity`); promote layers sparingly (`will-change`).
   - Schedule low-priority work via `requestIdleCallback`; cancel `requestAnimationFrame` on unmount.
   - Offload math (Monte Carlo, telemetry aggregation) to Web Workers or WASM.
   - Use OffscreenCanvas for canvas charts.
4. **Resource Profiles**
   - Target <300 MB idle RAM, <10% CPU baseline; log actuals via Palette-like telemetry.
   - Add budget checks in Playwright (capture performance traces per release).
5. **Tooling**
   - Chrome DevTools Performance + React Profiler per feature.
   - Lighthouse/Playwright scripts for regressions.
   - Monitor end-user metrics: FPS, memory, long tasks.

## Next Steps
- Integrate worker-based Monte Carlo prototype.
- Add perf budgets to Minimal Gameplay CI.
- Document animation/storybook patterns using these rules.
