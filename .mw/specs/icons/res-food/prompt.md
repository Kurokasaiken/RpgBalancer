# Prompt icona — res-food (kit v1)

> Generato da `scripts/gen-icon-prompts.py` da `src/docs/docs/art-direction/icons/registry.yaml` e `src/docs/docs/art-direction/icons/prompt_kit.yaml`.
> Non modificare a mano: cambia la riga `soggetto` nel registro (o il kit) e rigenera.

- **livello:** dipinta · **famiglia:** risorsa · **ancora**
- **taglie:** 512 / 128 / 64 / 32 px · **file finale:** `public/assets/ui/resources/res-food.webp`
- **fonte:** risorsa canonica `food` (ResourceReadout)

Incolla la variante dello strumento che usi. Le varianti differiscono solo
per intestazione, nome della kill list e contratto d'uscita (sfondo).

## GPT image (ChatGPT)

```text
Create one image — a single painted game icon.

SUBJECT: A rustic loaf of bread seen head-on: one plump dome of warm golden crust tapering to a narrower base, with a single deep split across the crown revealing soft pale crumb; patina accent: pale flour dust on the crown.

STYLE — Wanderlust painted icon, kit v1. A single emblem object for a fantasy strategy game HUD, centred and seen from the front, with a bold symmetrical silhouette that fills about 80% of the square; it must read as one solid shape at 24 pixels and stay distinct in greyscale. MATERIAL: baked bread, a warm golden crust with a soft pale crumb inside the split; a dry matte finish, warm light on the crown, deep teal only in the outer shadow side and never on the crumb; the only other colour is the single patina accent named in the subject. Soft and matte, no sheen, never metal. LIGHT: one warm white key light from the upper left, cool deep teal shadow on the lower right; a strong value split between the lit face and the shadow side. The shape is symmetrical; the asymmetry lives only in the wear and the light. RENDERING: painted game icon, rich oil impasto in the manner of Jaime Jones on the worn surfaces, a crisp clean silhouette edge, tactile weight, rude beauty; luminous, never black murk; shadows are deep teal, NO grey, NO muddy brown.

KILL LIST: no text, letters, numbers or runes; no skulls or bones; no frame, border, ring, disc, plaque or badge behind the object; no leaves, vines, flowers or sprigs; no small extra objects, debris or scattered props; no gems, glossy reflections or shiny polished gold; no ground, floor shadow, scene or background texture; no dramatic perspective or three-quarter tilt; no flat vector look, no 3D-render plastic, no cartoon outline; no grim decay, no grey, no mud.

OUTPUT: one square 1024×1024 PNG with a fully transparent background (alpha channel), the object alone, no drop shadow; it will be reduced to a 512 master and then to 128, 64 and 32 px.
```

## Gemini

```text
Paint a single game icon, square 1:1.

SUBJECT: A rustic loaf of bread seen head-on: one plump dome of warm golden crust tapering to a narrower base, with a single deep split across the crown revealing soft pale crumb; patina accent: pale flour dust on the crown.

STYLE — Wanderlust painted icon, kit v1. A single emblem object for a fantasy strategy game HUD, centred and seen from the front, with a bold symmetrical silhouette that fills about 80% of the square; it must read as one solid shape at 24 pixels and stay distinct in greyscale. MATERIAL: baked bread, a warm golden crust with a soft pale crumb inside the split; a dry matte finish, warm light on the crown, deep teal only in the outer shadow side and never on the crumb; the only other colour is the single patina accent named in the subject. Soft and matte, no sheen, never metal. LIGHT: one warm white key light from the upper left, cool deep teal shadow on the lower right; a strong value split between the lit face and the shadow side. The shape is symmetrical; the asymmetry lives only in the wear and the light. RENDERING: painted game icon, rich oil impasto in the manner of Jaime Jones on the worn surfaces, a crisp clean silhouette edge, tactile weight, rude beauty; luminous, never black murk; shadows are deep teal, NO grey, NO muddy brown.

STRICT RULES: no text, letters, numbers or runes; no skulls or bones; no frame, border, ring, disc, plaque or badge behind the object; no leaves, vines, flowers or sprigs; no small extra objects, debris or scattered props; no gems, glossy reflections or shiny polished gold; no ground, floor shadow, scene or background texture; no dramatic perspective or three-quarter tilt; no flat vector look, no 3D-render plastic, no cartoon outline; no grim decay, no grey, no mud.

OUTPUT: square 1:1 image, the object alone on a perfectly flat solid magenta background (#FF00FF) with no gradient and no shadow on it; the background will be keyed out and the icon reduced to 512, 128, 64 and 32 px.
```

## Grok

```text
Square 1:1 painted game icon.

SUBJECT: A rustic loaf of bread seen head-on: one plump dome of warm golden crust tapering to a narrower base, with a single deep split across the crown revealing soft pale crumb; patina accent: pale flour dust on the crown.

STYLE — Wanderlust painted icon, kit v1. A single emblem object for a fantasy strategy game HUD, centred and seen from the front, with a bold symmetrical silhouette that fills about 80% of the square; it must read as one solid shape at 24 pixels and stay distinct in greyscale. MATERIAL: baked bread, a warm golden crust with a soft pale crumb inside the split; a dry matte finish, warm light on the crown, deep teal only in the outer shadow side and never on the crumb; the only other colour is the single patina accent named in the subject. Soft and matte, no sheen, never metal. LIGHT: one warm white key light from the upper left, cool deep teal shadow on the lower right; a strong value split between the lit face and the shadow side. The shape is symmetrical; the asymmetry lives only in the wear and the light. RENDERING: painted game icon, rich oil impasto in the manner of Jaime Jones on the worn surfaces, a crisp clean silhouette edge, tactile weight, rude beauty; luminous, never black murk; shadows are deep teal, NO grey, NO muddy brown.

AVOID: no text, letters, numbers or runes; no skulls or bones; no frame, border, ring, disc, plaque or badge behind the object; no leaves, vines, flowers or sprigs; no small extra objects, debris or scattered props; no gems, glossy reflections or shiny polished gold; no ground, floor shadow, scene or background texture; no dramatic perspective or three-quarter tilt; no flat vector look, no 3D-render plastic, no cartoon outline; no grim decay, no grey, no mud.

OUTPUT: square 1:1 image, the object alone on a flat solid magenta background (#FF00FF), no gradient, no shadow on the background; it will be keyed out and reduced to 512, 128, 64 and 32 px.
```
