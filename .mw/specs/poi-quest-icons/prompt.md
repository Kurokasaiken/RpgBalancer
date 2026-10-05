# POI Quest Icon Prompts

## Master Style Prompt

Use this as the common visual base for every quest icon:

```text
Heavy chiseled sun-bronze and basalt POI icon, weathered patina, teal and gold accents, obsidian background, centered, painterly game asset, no text, no watermark
```

## Negative Prompt

```text
text, watermark, signature, blurry, low quality, cartoon, 3d render, busy background, modern ui, flat design, grey, brown, mud, skull, gore, decay, sci-fi, pipes, wires, blood, horror, grim, clip art, vector, symmetry
```

## Child Prompts — One Per Quest

Each child prompt is a full, self-contained SDXL prompt (master style + quest
subject). They are kept short to stay under the 77-CLIP-token limit used by
`scripts/rpg-gen-mockup.py`.

### quest_gold_repeatable

```text
Heavy chiseled sun-bronze and basalt POI icon with gold coins and wax seal, weathered patina, teal and gold accents, obsidian background, centered, painterly game asset, no text
```

### quest_dangerous_hunt

```text
Heavy chiseled sun-bronze and basalt POI icon with beast tracks and hunter bow, weathered patina, teal and gold accents, obsidian background, centered, painterly game asset, no text
```

### quest_city_rats

```text
Heavy chiseled sun-bronze and basalt POI icon with sewer grate and lantern, weathered patina, teal and gold accents, obsidian background, centered, painterly game asset, no text
```

### bandit-camp-demo

```text
Heavy chiseled sun-bronze and basalt POI icon with crossed blades and bandit mask, weathered patina, teal and gold accents, obsidian background, centered, painterly game asset, no text
```

### ancient-ruins

```text
Heavy chiseled sun-bronze and basalt POI icon with broken pillar and glowing seal, weathered patina, teal and gold accents, obsidian background, centered, painterly game asset, no text
```

### herb-gathering

```text
Heavy chiseled sun-bronze and basalt POI icon with mortar pestle and herbs, weathered patina, teal and gold accents, obsidian background, centered, painterly game asset, no text
```

## Usage Example

Run one quest icon with the local SDXL pipeline after installing the required
Python dependencies (`torch`, `diffusers`, `transformers`):

```bash
python3 scripts/rpg-gen-mockup.py \
  --component poi-quest-gold-repeatable \
  --prompt "Heavy chiseled sun-bronze and basalt POI icon with gold coins and wax seal, weathered patina, teal and gold accents, obsidian background, centered, painterly game asset, no text" \
  --negative "text, watermark, signature, blurry, low quality, cartoon, 3d render, busy background, modern ui, flat design, grey, brown, mud, skull, gore, decay, sci-fi, pipes, wires, blood, horror, grim, clip art, vector, symmetry" \
  --count 4 \
  --width 1024 \
  --height 1024 \
  --out-dir public/mockups
```
