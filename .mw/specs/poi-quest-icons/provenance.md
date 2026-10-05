# Provenance — POI Quest Icon Set

## Visual Authorities

- `src/docs/docs/visual_design_philosophy.md` — Blizzard-style layered
  components, 8-12 layer rule, organic imperfections, Gilded Observatory palette.
- `src/docs/docs/coordinator/prompt_writing_guide.md` — master/child prompt
  pipeline, concise generation prompts.

## Quest Sources

- `src/balancing/config/idleVillage/defaultConfig.ts` — current C2 quest
  ActivityDefinitions.
- `src/balancing/config/idleVillage/questConfig.ts` — deprecated but still
  referenced C1 quest list.

## Generation Tool

- `scripts/rpg-gen-mockup.py` (local SDXL) or `scripts/rpg-gen-mockup-ipa.py`
  (with IP-Adapter).
- SDXL base model cached at
  `~/.cache/huggingface/hub/models--stabilityai--stable-diffusion-xl-base-1.0`.
- Note: the current environment does not have `torch`/`diffusers` installed, so
  the prompts were produced and locked but not rendered to PNG in this session.
