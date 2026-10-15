# Identity — hud-resource-icons

> **Aggiornato 2026-10-13 (PLAN-058 T2.6).** Niente più medaglione: l'icona è l'oggetto solo.
> Fonte unica delle regole: bibbia §11 + `src/docs/docs/art-direction/icons/prompt_kit.yaml`.

## Silhouette

One bold symmetrical object per resource, front view, filling ~80% of the
square (D2: symmetric shape, asymmetry only in wear and light). The three must
differ in shape, not colour:

- gold — one thick coin face-on (single disc, bright)
- food — domed loaf with a scored cross (wide, low dome)
- wood — three split logs in a pyramid, end grain out (three discs)

## Materials

- Hand-cast worn bronze, bright on raised edges, deep teal lacquer in the recesses.
- One patina accent per subject: warm matte gold / baked amber crust / honey timber.

## Colors

- Shadows deep teal, never grey or muddy brown; one warm key light from the upper left.
- Must read on the plaque lacquer (`--skin-hud-lacquer-base`) next to the number.

## Kill list

The kit's kill list, verbatim in every prompt: no text/letters/numbers/runes; no
skulls or bones; no frame, border, ring, disc, plaque or badge; no leaves, vines,
flowers or sprigs; no small extra objects; no gems, glossy reflections or shiny
polished gold; no ground or background; no dramatic perspective; no flat vector,
3D-render plastic or cartoon outline; no grim decay, no grey, no mud.

## Purpose

`HudGlyph` / `ResourceReadout` render these next to the value (PLAN-058 T1.1);
the same files serve settlement panels and tooltips.
