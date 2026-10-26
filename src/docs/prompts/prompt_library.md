title: Prompt Library
description: Prompt reference catalog aligned with the DNA Prismatic Wanderlust art direction.
---

## Prompt Library

> Reference: [DNA Prismatic Wanderlust – Art Style Bible](../plans/art_direction_plan.md)
>
> **Prompt Engineering V2 (v0.12, R-172):** i nuovi prompt per **umani** e **creature magiche** si generano con i template §7.2/§7.3 della bibbia (Motore di Unicità obbligatorio). I prompt V1 sotto restano riferimento storico.
>
> **Dev tooling:** in modalità sviluppo, tutti i prompt e la Style Bible sono navigabili dalla pagina “Prompt & Bible Style” (tab dedicato nel menu Observatory). La UI legge dinamicamente questo documento, quindi ogni modifica qui verrà esposta automaticamente.

## Volto eroico – Elite Portrait Prompt

- **Intent:** Ritratto d'élite per eroe maschile occidentale con forte contrasto tra volto scultoreo e armatura materica.
- **Art Stack:** Viso iper-realistico stile Ruan Jia, armatura a impasto Jaime Jones, cromie Araki, luce golden hour.

### Prompt (copia/incolla – Volto eroico)

```text
Elite character portrait of a noble Western male hero. STYLE FOCUS: Extreme contrast in rendering technique. THE FACE: Rendered in the hyper-realistic, sculptural style of Ruan Jia. Flawless skin texture, incredible bone structure definition, luminous subsurface scattering light, looking like a living classical sculpture. No visible brushstrokes on the face. Clear, intense eyes. THE ARMOR & BACKGROUND: Heavy Sun-Bronze plate armor, deeply scratched and weathered, rendered with thick, visible oil impasto brushwork (Jaime Jones style). Background is blurry basalt with oil-slick veins against a vibrant teal sky (Araki palette). LIGHTING: Warm, golden hour light creating a divine glow on the sculptural face and sharp highlights on the rough bronze. Serious, breathtaking beauty.
```

### Output Reference – Volto eroico

- **Image:** [Heroic Portrait Concept](../../src/assets/mood/_varie/volto%20eroico.png)
- **Note:** Folder: public/assets/characters

---

## Armatura Imperiale – High-Fidelity Splash Prompt

- **Intent:** Splash art iper-satura con contrasto assoluto tra eroe immacolato e mondo mostruoso.
- **Art Stack:** Volto Ruan Jia, armatura impastata Jeff Easley, mostri Justin Gerard, architetture Sparth, cromia Araki.

### Prompt (copia/incolla)

```text
Armatura Imperiale — A vibrant, high-key fantasy splash art set in a Prismatic Void. NO BROWN, NO SEPIA. Electric turquoise sky fading into deep magenta at the zenith, clean white sunlight making colors hyper-saturated. Shadows glow in vivid Cobalt Blue and Neon Emerald. Foreground hero strikes an Araki high-fashion pose wearing Baroque Sun-Bronze armor: asymmetric exoskeleton of interlocking bronze plates, sharp fins, asymmetric wings, encrusted with glowing translucent amber shards and etched runes, rendered with Jeff Easley heavy impasto. The face (Ruan Jia style) is luminous, warm golden skin with subsurface scattering, intelligent contemporary features, “living god” intensity. Mid-ground monsters are Justin Gerard “Gnarled Nightmares”: twisted knots of ancient wood fused with jagged obsidian shards and tattered ritual silks, hunched and folkloric with tiny glowing eyes. Background architecture: colossal floating slabs of black basalt (Sparth brutalism) overgrown with glowing violet/orange moss, no arches or columns. Overhead, the massive crisp shadow of a dragon cuts through the turquoise sky, projected as a dark purple silhouette across the upper third. Technique contrast: dirty impasto for armor and monsters, ultra-clean digital polish for the hero’s face. 
```

### Output Reference – Armatura Imperiale

- **Image:** [Armatura Imperiale Render](../../src/assets/mood/impero-solare/armatura%20imperiale.png)
- **Note:** Folder: src/assets/mood

---

## Villaggio – Frontier Theater Vista Prompt

- **Intent:** Panorama 21:9 del villaggio di frontiera per Theater View con mood “Rude Beauty”.
- **Art Stack:** Jaime Jones impasto ampio, palette Solar Triumph (sunlit oro + ombre teal), Dolomites geography.

### Prompt (copia/incolla – Villaggio)

```text
Villaggio — A majestic, wide-angle (21:9) landscape of a frontier village nestled in a lush mountain valley, composed for Theater View. Architecture: sturdy timber-and-stone houses with golden thatched roofs, organic and rustic, seamlessly integrated with the terrain—no people, but lived-in warmth. Geography: a crystal-clear river reflecting a vibrant azure sky, with monumental jagged mountain peaks (Dolomites-inspired) and a sun-drenched ancient forest in the distance. Lighting: Solar Triumph—clean white sunlight slamming into surfaces, casting deep, cool teal shadows (no grim darkness). Technique: Jaime Jones broad oil brushstrokes with thick impasto texture on wood and stone, high contrast between luminous sunlit faces and saturated teal crevices. Mood: adventurous, inviting, full of potential, pure “Rude Beauty.”
```

### Output Reference – Villaggio

- **Image:** [Villaggio Concept](../../src/assets/mood/rude-beauty/villaggio.png)
- **Note:** Folder: src/assets/mood

---

## Armatura Antagonista – Momentum Bruiser Prompt

- **Intent:** Ritratto cinematico dell’antagonista principale, silhouette iconica e aggressiva.
- **Art Stack:** Jeff Easley impasto violento, palette obsidian/violet/raw sienna, eroic realism moderno.

### Prompt (copia/incolla – Armatura Antagonista)

```text
AGENT
<Agent Name> – <Brief Task Description>

OBIETTIVO
<Detailed objective of the task, including why it's important and what problem it solves.>

FILE TARGET
<List all files or directories the agent is authorized to modify. Be specific.>

OPERAZIONI DA ESEGUIRE
<Step-by-step instructions. Include logging/diagnostics steps using createSandboxDiagnostics. Specificare anche quanta autonomia ha l’agente (es. “porta a termine tutta la checklist prima di tornare”).>

OPERAZIONI VIETATE
<List any actions the agent must NOT perform (e.g., modifying specific files, introducing hardcoded values).>

ASSUNZIONI
<Any assumptions made by the coordinator that the agent should be aware of.>

REGRESSION SAFEGUARDS
TESTS TO RUN:
  - <Specific unit/integration/E2E tests to execute.>
STOP CONDITIONS:
  - <Conditions under which the agent must stop and report back (e.g., test failures, lint errors, visual regressions, blocchi oltre N minuti).>

AUTONOMIA & CHECK-IN
- <Durata/autonomia consentita prima del prossimo aggiornamento (es. “non tornare prima di aver completato tutti i passi” oppure “fermati dopo 10 minuti di blocco reale”).>
- <Istruzione esplicita a non chiedere ulteriori conferme se non in presenza dei blocchi elencati.>

NOTE
<Any additional notes, context, or specific instructions.>

KANBAN STATUS LINE
- L’agente deve chiudere il messaggio di consegna con una riga finale nel formato:
  `KANBAN STATUS: <Prompt ID> – Completato (Evidence: <log principale>)`
- La riga finale va inviata solo dopo aver aggiornato la tabella Kanban allo stato “Completato”.
```

> **Linee guida per dimensionare/splittare i prompt**
>
> 1. **Durata target 30–60 min** – Se la checklist richiede <15 min consolidala con fix affini; se supera 60–75 min o coinvolge più subsystem (es. UI + hook + QA) suddividila in blocchi sequenziali (F1, F2…).
> 2. **Contesto autosufficiente** – Ogni incarico deve includere obiettivo, file target, guardrail, test e doc da aggiornare. Se serve contesto condiviso, linka un brief centralizzato anziché rimandare al coordinatore.
> 3. **Quando spezzare** – Dividi quando un task tocca >3 file eterogenei, richiede più tipi di test o mescola feature + doc strategica. Ogni sub-task deve chiudere con lint/build verdi.
> 4. **Quando accorpare** – Unisci micro-fix omogenei nello stesso file/feature per evitare prompt-trivialità, mantenendo focus chiaro e durata sotto i 60 min.
> 5. **Guardrail/TDD + doc finale** – Specifica sempre test minimi e stop conditions (lint/test failure, blocchi >X min). Preferisci pattern “scrivi test → implementa → rerun” come raccomandato dalle best practice Axur 2025 per ridurre manutenzione manuale e chiudi SEMPRE ogni prompt con uno step finale “Aggiorna tutta la documentazione correlata dopo che i test sono passati”.

### Output Reference – Armatura Antagonista

- **Image:** [Armatura Antagonista Concept](../../src/assets/mood/dark-wasteland/Armatura%20antagonista.png)
- **Note:** Folder: src/assets/mood

---

## Jungle Ruins – Solar Column Study Prompt

- **Intent:** Studio ambientazione tropicale con colonna marmorea iper-luminosa per key art.
- **Art Stack:** Jaime Jones impasto spesso, palette turchese/smeraldo, contrasti luce calda vs pietra fredda.

### Prompt (copia/incolla – Jungle Ruins)

```text
Jungle Ruins — A massive ancient white-marble column rising from a lush tropical clearing, painted in Jaime Jones’ thick, oily brushwork. Blinding solar light slams into the marble, creating searing high-contrast highlights, while the shadowed face glows in saturated turquoise and emerald greens instead of dull grays. Materiality clash: cold stone catching warm light, surrounded by vivid foliage and humidity haze. No darkness—only intense color, cinematic 8K painterly texture emphasizing confident strokes and atmospheric depth.
```

### Output Reference – Jungle Ruins

- **Image:** [Jungle Ruins Concept](../../src/assets/mood/rude-beauty/jungle%20ruins.png)
- **Note:** Folder: src/assets/mood

---

## Verso Mordor – Obsidian Expanse Prompt

- **Intent:** Panorama epico da worldbuilding per cutscene/overworld, esaltando la durezza basaltica e il mood trionfante.
- **Art Stack:** Jaime Jones impasto spesso, composizione aurea asimmetrica, palette cobalto/arancio ardente.

### Prompt (copia/incolla – Verso Mordor)

```text
Verso Mordor — An epic high-fantasy landscape of jagged obsidian cliffs and shattered dark basalt ruins. No trees, no grass. The sky glows in vibrant indigo with streaks of blazing orange light flares, while dust motes dance in intense sun shafts. Style: Jaime Jones thick impasto with visible brushstrokes and loose, painterly edges. Palette anchored in deep cobalt shadows and burning orange highlights. Composition follows an asymmetric Golden Ratio curve, leading the eye toward a triumphant focal spire. Mood: triumphant, forward momentum, chaotic good energy despite the harsh terrain. 
```

### Output Reference – Verso Mordor

- **Image:** [Verso Mordor Concept](../../src/assets/mood/dark-wasteland/verso%20mordor.png)
- **Note:** Folder: src/assets/mood

---

## Prismatic Monumental Gate – Environmental Icon Prompt

- **Intent:** Portale monumentale dinamico per splash ambientali e cutscene “adventurous”.
- **Art Stack:** Scala eroica di Huang Guangjian, texture painterly alla Arcane, cromatismi prismatici.

### Prompt (copia/incolla – Prismatic Monumental Gate)

```text
AGENT
<Agent Name> – <Brief Task Description>

OBIETTIVO
<Detailed objective of the task, including why it's important and what problem it solves.>

FILE TARGET
<List all files or directories the agent is authorized to modify. Be specific.>

OPERAZIONI DA ESEGUIRE
<Step-by-step instructions. Include logging/diagnostics steps using createSandboxDiagnostics. Specificare anche quanta autonomia ha l’agente (es. “porta a termine tutta la checklist prima di tornare”).>

OPERAZIONI VIETATE
<List any actions the agent must NOT perform (e.g., modifying specific files, introducing hardcoded values).>

ASSUNZIONI
<Any assumptions made by the coordinator that the agent should be aware of.>

REGRESSION SAFEGUARDS
TESTS TO RUN:
  - <Specific unit/integration/E2E tests to execute.>
STOP CONDITIONS:
  - <Conditions under which the agent must stop and report back (e.g., test failures, lint errors, visual regressions, blocchi oltre N minuti).>

AUTONOMIA & CHECK-IN
- <Durata/autonomia consentita prima del prossimo aggiornamento (es. “non tornare prima di aver completato tutti i passi” oppure “fermati dopo 10 minuti di blocco reale”).>
- <Istruzione esplicita a non chiedere ulteriori conferme se non in presenza dei blocchi elencati.>

NOTE
<Any additional notes, context, or specific instructions.>
```

### Output Reference – Prismatic Monumental Gate

- **Image:** [Prismatic Monumental Gate Concept](../../src/assets/mood/prismatic/prismatic%20monumental%20gate.png)
- **Note:** Folder: src/assets/mood

---

## Architettura Impero del Sole – Solar Triumph Balcony Prompt

- **Intent:** Balcony vista per cutscene/glory shot, enfatizzando monumentalità luminosa dell’Impero del Sole.
- **Art Stack:** Jaime Jones impasto materico, palette oro/teal, atmosfera “Solar Triumph”.

### Prompt (copia/incolla – Architettura Impero del Sole)

```text
Architettura Impero del Sole — A monumental white-stone fortress balcony overlooking a vast golden valley, rendered in Jaime Jones’ thick oil impasto. Architecture feels noble and heavy, with chunky bronze railings catching blinding, triumphant sunlight. Shadows are deep and cool, tinted with saturated teal and turquoise ambient light. Every surface shows broad, confident brushstrokes—no digital smoothing, highly textured. Atmosphere is “Solar Triumph”: glorious, vast, uplifting. 8K painterly masterpiece framing the balcony in the foreground, valley stretching into radiant haze beyond.
```

### Output Reference – Architettura Impero del Sole

- **Image:** [Architettura Impero del Sole Concept](../../src/assets/mood/impero-solare/architettura%20impero%20sole.png)
- **Note:** Folder: src/assets/mood

---

## Drago – Emerald Relic Guardian Prompt

- **Intent:** Creature hero shot per concept/moodboard, tono epico serio con scala monumentale.
- **Art Stack:** Jeff Easley realism, pennellate olio eroiche, palette tropicale viva.

### Prompt (copia/incolla – Drago)

```text
Drago — A majestic ancient dragon perched atop an overgrown marble ruin deep in a lush tropical jungle. The dragon’s scales shimmer with iridescent emerald and polished gold, rendered with Jeff Easley–style heroic realism and expressive oil brushstrokes. Bright tropical sunlight cuts through the canopy, casting deep, rich shadows and dappled highlights over the marble and foliage. Palette: vivid turquoise sky fragments, lime-green jungle leaves, bright orange flowers, and bronze architectural accents. Style: hand-painted digital art with thick, confident strokes, high detail, epic scale, serious adventurous tone.
```

### Output Reference – Drago

- **Image:** [Drago Concept](../../src/assets/mood/rude-beauty/drago.png)
- **Note:** Folder: src/assets/mood

---

## Marcia Crinale – Wide Plate Parallasse Prompt

- **Intent:** Piastra larga (~3.5:1) per parallasse orizzontale del Theater — marcia di caravan su strada di crinale, focale laterale, terreno continuabile ai bordi.
- **Art Stack:** Jaime Jones impasto, Rude Beauty (veronese+azure+ultramarine, accento rosso papaveri causale), luce Solar Triumph da destra.

### Prompt (copia/incolla – Marcia Crinale)

```text
Ultra-wide painted plate (~3.5:1) for horizontal parallax: an alpine ridge road running along the mountainside, entering one edge and exiting the other at compatible heights. Small merchant caravan mid-march (lateral focal ~40%), leaning waystone at a road bend, cold stream lower-left with TWO RED DEER drinking. Mid-slope wide band of RED ALPINE POPPIES (causal color field vs azure/veronese/ultramarine). Foreground grass woven with VIOLET asters + YELLOW buttercups, amber lichen on pale rocks — the fast layer, max detail. Terrain continues past BOTH edges, repeating-but-varied peaks/spruces. Solar Triumph sun SLAMS from right, lit gold / teal shadows, crisp alpine air. Thick violent palette-knife impasto (Jaime Jones), no flat colors. No signatures, no rounded corners, no black murk, no brown, no night.
```

### Output Reference – Marcia Crinale

- **Image:** [Marcia Crinale (i3 Director-approved)](../../src/assets/mood/rude-beauty/marcia-crinale.png)
- **Note:** Folder: src/assets/mood · prompt canonico `context/research/2026-10-25-mood-keys/prompts-v4/rude-beauty-marcia-crinale_FINAL.txt` · manifest `marcia-crinale[-loop]` · lab `/theater-lab?scene=marcia-crinale`

---

## Aqueduct Prismatic – Crystal Arches Final Prompt

- **Intent:** Mood-canonica Prismatic — arcate-vetrata con mondo alieno nei pannelli, etere che scorre, falena corallina, luna con alone.
- **Art Stack:** violent palette-knife impasto, bronze/indigo/iridescent su superfici consentite, niente giallo Solar.

### Prompt (copia/incolla – Aqueduct)

```text
The attached v1 image is the CANONICAL BASE — same composition, slender arched structure, windowed panels into another world; majestic by PROPORTION not thickness. Continuous connected arches, slender tracery + glass. Terrain: saturated green, moss, cobalt-blue cornflower flowers. ETHER: thin luminous semi-transparent flow under arches. CREATURE: small winged moth-dragon off-center, coral-branched horns. LENS: passive glint only, no beam. SKY: indigo twilight + moon with prismatic halo, layered aurora wisps left, low violet band = ether-glow bleeding from horizon (motivated). AIR: soft prismatic blooms + short chromatic streaks, interleaved per field. STYLE: violent impasto, no black murk, no brown, no grey-white dominant, no gold/yellow sun wash. Ultra-wide 21:9.
```

### Output Reference – Aqueduct Prismatic

- **Image:** [Aqueduct Prismatic](../../src/assets/mood/prismatic/aqueduct-prismatic.png)
- **Note:** prompt canonico `context/research/2026-10-25-mood-keys/prompts-v4/prismatic-frontier-crystal-aqueduct_FINAL.txt`

---

## Assalto Goblin – Quest Scene Cascade Prompt

- **Intent:** Scena quest battezzata — azione suggerita via silhouette+diagonale+luce, runtime owns fire.
- **Art Stack:** impasto Rude Beauty, chioma multi-verde con intreccio fiamme/scintille (metro di contrasto intrecciato).

### Prompt (copia/incolla – Assalto Goblin)

```text
Vedi spec canonico .mw/specs/quest-goblin-scenes/scenes/f*-*/prompt.md — chiave Rude Beauty descritta come subject primario: azione in diagonale, silhouette goblin vs fiamme, verdi multipli intrecciati con scintille nel canopy band.
```

### Output Reference – Assalto Goblin

- **Image:** [Assalto Goblin](../../src/assets/mood/rude-beauty/assalto-goblin.jpg)
- **Note:** spec `.mw/specs/quest-goblin-scenes/` · scene-library `assalto-goblin.jpg`

---

## Viaggio Andata – Journey Leg Prompt

- **Intent:** Leg di viaggio outbound — cancello dell'alba, strada che si apre nella wilderness; scena PROMOSSA.
- **Art Stack:** Rude Beauty pieno registro (sun-slams, azure, veronese, teal).

### Prompt (copia/incolla – Viaggio Andata)

```text
Vedi spec canonico .mw/specs/quest-journey-legs/scenes/andata/prompt.md — threshold gate all'alba, la strada si dipana nella wilderness, lanterna-ember sui pali, raggi mattutini, cloud drift sulle vette.
```

### Output Reference – Viaggio Andata

- **Image:** [Viaggio Andata](../../src/assets/mood/rude-beauty/viaggio-andata.jpg)
- **Note:** spec `.mw/specs/quest-journey-legs/` · manifest `viaggio-andata` (baked depth + ambient authored)
