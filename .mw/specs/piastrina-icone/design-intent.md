# Design intent — Icone su piastrina ottone (D-6, PLAN-125 §8i / R-367)

## Intent in one line
Every HUD icon becomes a small painted square — an ornate brass plate (piastrina) over
a deep lacquer well, with one painted/cut-out object on it — replacing the flat cream
engraved glyphs the Director rejected ("icone piatte, sembrano di canva").

## What it teaches the eye
"Hardware over UI": the icon reads as a tiny piece of the frame itself — cast brass,
engraved ornament, lacquered recess — with the object painted inside like a museum
inset. It is the same signature as the approved controls golden
(`refs/controls-sheet-g2.png`): champagne brass ring + petrol-lacquer well + emerald
hint only where the language already allows it.

## Pillar
"Wanderlust" — the world icon is a painted object; the plate is real hardware.
Distinct from kit v1 (`art-direction/icons/registry.yaml` = object-only painted
cut-outs, no plate): D-6 re-does every icon on the plate, transversal to all places.

## Places (D-6) — CONTESTO intoccabile
- stash wells (item icons), POI markers, nav medallions, resource ledger — the
  documented places; secondary: filter tabs, event ledger rows, speed controls.
- Untouched: quest/text surfaces — ContextStrip, lens, "Cerca" affordances stay
  live text; commands that are pure UI actions keep reading as controls.

## Constraints (verbatim)
"Quadrati dipinti su sfondo ornato, silhouette che si legge a 11-20px, stessa
firma ottone/nero." — painted squares on ornate ground; one bold silhouette still
legible at 11-20px; the brass/black signature of the frame.

## Gate
Per icona: mockup → occhio Director → asset (master 512 → 128/64/32) → DOM.
This run = format sheet: one subject (stash "Strength Bonus" dumbbell, approved
R-363) × 4 plate treatments. The Director baptizes the plate; the winning
treatment becomes the template for the rollout.

## Outcome — Director ruling 2026-11-20/21
- **A baptized** (champagne filet + engraved acanthus corners) as the plate signature.
- **Re-signified on landing**: the plate is the hover/SELECTED cornice, not resting
  chrome — at rest the well stays plain lacquer + painted icon on a coin seat
  (mockup-stash-grid grammar; ruling «quella cornice solo in mouse over»).
- Asset: `public/assets/ui/hud-real/piastrina/cornice-hover-a.webp` — plate with a
  full lacquer interior (the DOM icon rides on top; no hole by construction).
- Mounted: `VillageStashPanel` `PiastrinaCornice` overlay, sticky-preview cell,
  both interactive and read-only modes. Witness: live-stash.png (headless /game).
- Open: per-icon rollout to POI markers, nav medallions, resource ledger —
  each place still needs its own mock → Director eye → asset → DOM pass.
