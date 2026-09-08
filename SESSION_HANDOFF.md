# Session handoff

**Current state:** `PLAN-014-land-breath` in esecuzione. Desiderata di riferimento: **v21 FROZEN**.

**T-000a completed:** `scripts/land-breath-pre-check.mjs` eseguito. Report `test-results/land-breath-pre-check-2026-09-08.log`: tutti i biomi 70–100% residual range post-blur 3px (molto più dettaglio del mare ~1%).

**T-000b ready for review:** `scripts/build-land-breath-spike-assets.mjs` + `public/land-breath-spike.html` generano e mostrano i compositi per bioma con DisplacementFilter Pixi. Tre varianti (scroll/scale/combine), padding 64px edge-extend, sea statico. Pagina live su http://127.0.0.1:5173/land-breath-spike.html.

**Evidence:** `test-results/land-breath-t000b-2026-09-08.log`, `test-results/land-breath-pre-check-2026-09-08.log`.

**Verdict pending:** il Director deve guardare il browser preview e confermare quale variante/ampiezza/speed funziona. Finché il verdetto non arriva, **T-001+ restano congelati**.

**Build/health:** `npm run build:check` ✅, `npm run kanban:lint` ✅.
