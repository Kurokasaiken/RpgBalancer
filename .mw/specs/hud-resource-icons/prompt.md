# Prompt — hud-resource-icons

> **Aggiornato 2026-10-13 (PLAN-058 T2.6).** I prompt canonici delle tre risorse sono quelli
> generati dal kit d'icona, uno per risorsa, in tre varianti (GPT image, Gemini, Grok):
>
> - `.mw/specs/icons/res-gold/prompt.md`
> - `.mw/specs/icons/res-food/prompt.md`
> - `.mw/specs/icons/res-wood/prompt.md`
>
> Per cambiarli: riga `soggetto` in `src/docs/docs/art-direction/icons/registry.yaml`, poi
> `python scripts/gen-icon-prompts.py` e `python scripts/lint-icon-prompts.py`.

Il blocco sotto resta solo per la pipeline SDXL locale (`scripts/rpg-gen-mockup.py
--enforce-canon`, limite ~77 token), allineato al kit: oggetto solo, niente bordo.
Il soggetto della risorsa si passa con `--prompt`.

```text
2D painted fantasy game icon, single object centred front view, worn cast bronze with deep teal lacquer in the recesses, warm light from upper left, oil impasto, crisp silhouette, no frame, no rim, no text, plain magenta background
```
