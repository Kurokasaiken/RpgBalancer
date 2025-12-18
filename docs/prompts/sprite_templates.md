# Sprite Prompt Templates (AI Workflow)

## Obiettivo

Template riutilizzabili per generare concept e frame base coerenti con il tema Gilded Observatory e con il weight-based creator pattern.

## Linee guida generali

- Mantieni **seed fisso** per ogni personaggio (solo variazioni di pose/azioni cambiano il prompt secondario).
- Usa sempre token di palette: `obsidian`, `teal`, `gold`, `ivory glow`.
- Negative prompt di default: `muddy colors, flat lighting, photorealistic skin, busy background, watermark, text`.
- Risoluzione consigliata: 2048×2048, steps 35–45, guidance 6–7 (FLUX/Flux-similar models).

## Template Hero Archetype

```text
Heroic [archetipo] [ruolo] in posa [pose], armatura laminata oro/teal, silhouette leggibile, painterly gradients stile League of Legends splash art, rim light teal, particelle arcane, background soft vignette obsidian, ultra-detailed, vector-friendly edges
```

### Parametri consigliati

- Modello: Scenario Flux (o SDXL finetune equivalente)
- Camera: `isometric hero shot`, leggera prospettiva 3/4
- Varianti: sostituisci `[pose]` con `idle stance`, `wind-up attack`, `dash start` per generare sequenze coerenti.

## Template Spellcaster Idle

```text
Elegant mage idle loop pose, staff anchored to ground, cape flutter, teal-gold sigils floating, soft breathing motion, rim light cyan, obsidian stage lighting, painterly vector edges, LoL splash style, dramatic contrast
```

- Usa questo prompt per il **frame iniziale Idle** prima della conversione in video Seedance.
- Aggiungi attributi specifici (es. `ancient runes`, `crystal mask`) per differenziare archetipi mantenendo la base coerente.

## Template Warrior Attack

```text
Valiant blade duelist in forward lunge, trailing gold sparks, energy arc teal, motion blur streaks, dynamic foreshortening, shoulder armor highlighted, obsidian arena backdrop, League of Legends action splash aesthetic
```

- Genera due versioni: `anticipation` (pre-colpo) e `impact` per alimentare il workflow doppio video neutral→attack→neutral.

### Prompt rapido (test immediato)

```text
Heroic full-plate guardian in poised idle stance, articulated cobalt-and-gold armor with glowing teal etchings, greatsword grounded front-right, cloak of obsidian velvet flowing, rim light cyan, painterly League of Legends splash style, 2048x2048, ultra-detailed vector edges, obsidian mist backdrop
```

- Usa seed fisso (es. `133742`) per tutte le revisioni del guerriero.
- Per la conversione video Seedance, estendi il prompt con “subtle breathing loop, cloak flutter”.
- Salva l’output in `assets/concepts/characters/guardian/base.png` per il tab di prova.

### Base Body (skin editabile)

```text
Neutral base body, athletic male hero, standing T-pose variant, minimal clothing (simple dark shorts), matte skin with soft subsurface scattering, clean vector edges, neutral studio lighting, obsidian gradient backdrop, 2048x2048, no armor, no tattoos, no accessories
```

- Genera questo “manichino” una sola volta per ogni archetipo (male/female/creature).
- Mantieni livelli separati (pelle, occhi, capelli) durante la vettorializzazione per recolor rapidi.
- Per richieste AI più severe indica anche “no armor, no weapons, no jewelry”.

### Armor Overlay

```text
Modular plate armor overlay, viewed on neutral mannequin, split shoulder/torso/leg segments, gold + teal trims, emissive rune seams, rendered as separate layer mask, minimal shading on body
```

- Richiedi all’AI di produrre PNG trasparente (se supportato) o usa auto-mask.
- Ripeti per armi, mantelli, elmi. Ogni overlay deve seguire la stessa posa base.

### Full-body sprite con contesto (LoL style + pose DD)

```text
Full-body tactical RPG hero sprite for an idle-turn prototype, 3/4 side pose facing right with weapon hand thrust toward the camera, silhouette extremely readable, hands/weapon exaggerated in the foreground like Darkest Dungeon, body rendered head-to-toe for modular recolor, League of Legends splash-art shading (painterly gradients, teal/gold rim lights) on obsidian lab backdrop. Character: guardian trainee without armor, only dark compression gear so designers can layer modular equipment later. Output 2048x2048 with transparent or neutral background, balanced lighting for easy cutout.
```

- Inserisci questo prompt quando devi ottenere il “tizio nudo” a figura intera.
- Specifica sempre lo scopo: “per idle-turn prototype, modular gear overlay” così l’AI mantiene pose coerenti ma evita dettagli inutili.

## Template Rogue Movement

```text
Agile rogue mid-dash, dual daggers extended, teal smoke trail, cloak split revealing gold lining, low camera angle, obsidian cobblestone blur, high-contrast rim lights, stylized vector outlines
```

- Utile per animazioni di movimento 8-dir. Cambia descriptor (`mid-dash`, `pivot turn`, `jump landing`) per ottenere fotogrammi distinti.

## Template Creature/Partner

```text
Mystic companion creature (gryphon whelp) hovering idle, teal bioluminescent veins, soft gold feathers, obsidian skydome gradient, painterly stylization, loop-ready silhouette, cinematic rim light
```

- Destinato a evocazioni/pets con stile coerente alla UI.

Last updated: 2025-12-17
