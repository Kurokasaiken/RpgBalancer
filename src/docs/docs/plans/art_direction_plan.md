# DNA PRISMATIC WANDERLUST – BIBBIA DI DIREZIONE ARTISTICA (v0.14)

Core Philosophy: Antitesi del dark fantasy. Energia cinetica, libertà, e trionfo solare. Il mondo non è "sporco", è materico. La povertà non è "miseria", è rude bellezza.

---

## 1. I DUE PILASTRI DEL MONDO

### A. IL WILDERNESS (Il Cuore del Progetto)

- **Mood:** Rude Bellezza, avventura, potenziale inespresso.
- **Geografia:** Valli montane (Dolomiti style), fiumi cristallini, praterie lussureggianti.
- **Materiali:** Legno grezzo (Timber), Pietra alpina, Paglia dorata (Golden Thatch).
- **Sky Color:** Azure Vibrante (Azzurro terso e intenso).

### B. L'IMPERO (Verticale del Sud)

- **Mood:** Solar Triumph, monumentalità barocca, nobiltà pesante.
- **Geografia:** Deserti basaltici, architetture colossali sospese.
- **Materiali:** Basalto Nero venato, Bronzo Barocco (Sun-Bronze), Sete iridescenti.
- **Sky Color:** Indaco profondo / Vuoto Prismatico.

---

## 2. PILASTRI TECNICI (I GENI DEL DNA)

### 🧱 Lo Split-Rendering

Ogni asset deve mostrare un contrasto violento tra due stili di rendering:

- **Punto Focale (Volti/Icone):** Iper-pulito, scultoreo, stile Ruan Jia. Pelle impeccabile, subsurface scattering, zero pennellate.
- **Corpo e Materia:** Materico, "croccante", stile Jaime Jones/Jeff Easley. Pennellate d'olio larghe, impasto spesso e visibile.

### 🎨 La Palette e le Ombre

- **Regola SSoT:** Le ombre non sono mai grigie o marroni.
- **Colore Ombre:** Deep & Cool Teal / Smeraldo / Turchese.
- **Luce:** Bianco accecante (Solar Triumph), lens flare prismatici, polvere dorata (dust motes).
- **Pigmenti Primari:** Blu Oltremare, Verde Veronese, Rosso Cinabro, Ambra.

---

## 3. LO STACK ARTISTICO (Ruoli Specifici)

| Artista | Ruolo nel DNA | Cosa "rubare" |
| --- | --- | --- |
| **Ruan Jia** | Volti | Bellezza scultorea, pulizia digitale, luce divina sulla pelle. |
| **Jaime Jones** | Materia | Pennellate larghe, impasto d'olio, texture di legno e pietra. |
| **Sparth** | Silhouette | Monumentalità, architetture asimmetriche, scala eroica. |
| **Araki** | Cromia/Posa | Saturazione Azure/Veronese, pose "Alta Moda" (Vogue aesthetic). |
| **Justin Gerard** | Creature | Whimsy (estro), mistero della foresta, forme grottesche ma vibranti. |
| **Jeff Easley** | Mostri/Armature | Peso del bronzo, mostri leggendari, eroicismo anni '80 modernizzato. |

---

## 4. REGOLE DI CREAZIONE PROMPT — V1 (OBSOLETA)

> **⚠️ OBSOLETA dal 2026-10-12 (v0.12).** Sostituita da **§10 — Prompt Engineering V2**. Conservata solo per memoria creativa (il workflow delle creature in §6 resta valido: cambia il *formato* del prompt, non il lifecycle). Non usare queste regole per nuovi prompt.

1. **Zone-Based Instruction:** Separare esplicitamente il trattamento del volto (Clean) dal resto (Impasto).
2. **Specificità Materica:** Mai usare termini generici. Usare “Golden Thatch” invece di “Roof”, “Baroque Sun-Bronze” invece di “Armor”.
3. **Terminologia Anti-Sci-Fi:** Vietato usare: pipes, exoskeleton, wires, tech. Usare: structural ribs, ceremonial plates, artisan carvings.
4. **Guardrail Cromatici:** Inserire sempre “Deep Teal shadows” e “No grey, no brown”.

> **IMPORTANTE – Prompt Authoring per l'AI (V1, storico):** la Bibbia v0.10 costruiva il prompt dividendo le istruzioni in ZONE (Focal Point vs Matter) e applicando la “Kill List” per bloccare Sci-Fi e Grim. Questo metodo resta il *modo di renderizzare*, ma da v0.12 non è più sufficiente da solo: manca il Motore di Unicità (§10.1).

---

## 5. MASTER PROMPT V1 (OBSOLETI — riferimento storico)

> **⚠️ OBSOLETI dal 2026-10-12 (v0.12).** I master prompt sotto producono risultati corretti ma troppo generici ("banali"): descrivono categorie, non soggetti. Per umani e creature usare i template §10.2/§10.3. Il master Wilderness resta valido per paesaggi fino a una V2 ambientale.

### 🌲 Master Prompt: Wilderness (Cuore del Progetto)

A majestic, wide-angle landscape of a frontier village in a lush mountain valley (21:9 aspect ratio). ARCHITECTURE: Simple but sturdy timber and stone houses with golden thatched roofs. GEOGRAPHY: A crystal-clear river reflecting a vibrant Azure sky. Background: monumental jagged mountain peaks (Dolomites style) and a sun-drenched, ancient forest. LIGHTING: “Solar Triumph”—brilliant, clean white sunlight, deep and cool Teal shadows. STYLE: Jaime Jones broad oil brushstrokes, thick impasto textures on wood and stone. Mood: Adventurous, inviting, Rude Beauty.

### 👤 Master Prompt: Eroe (Split-Rendering)

Elite character portrait of a noble male hero. THE FACE: Ruan Jia sculptural perfection, flawless skin, no brushstrokes. THE BODY: Baroque Sun-Bronze armor, scratched and weathered, rendered with thick Jaime Jones impasto brushwork. LIGHTING: Blinding white light, saturated teal shadows. STYLE: Contrast between digital polish and oil painting texture.

---

## 6. CREATURE IP DEVELOPMENT SYSTEM

This section defines how creature intellectual property is created, evaluated, versioned, and canonized for Wanderlust. It replaces the legacy "monster prompt list" with a structured approval workflow.

### 6.1 Core Philosophy

- **Identity before image.** A creature must have a documented reason to exist before any prompt is generated.
- **Canon is explicit.** Nothing generated by an AI is world truth until it is reviewed, approved, and versioned.
- **Creative memory matters.** Rejected directions and decisions are preserved, not deleted.
- **Family DNA first.** New creatures inherit mandatory traits from their family and contribute new decisions only after passing the family coherence test.

### 6.2 Lifecycle States

| State | Meaning | Can appear in game? |
| --- | --- | --- |
| **draft** | First idea, no validation | No |
| **exploration** | Visual and narrative variants tested | No |
| **candidate** | Identity card complete, awaiting approval | No |
| **validated** | Reference image passes Coherence Test | No |
| **canonical** | Approved world truth | Yes |
| **deprecated** | Replaced or rejected, kept for memory | No |

### 6.3 Authority Hierarchy

| Level | Scope | Approvers |
| --- | --- | --- |
| **world** | Tone, color rules, kill list, global canon | Creative director |
| **art** | Art stack, rendering rules, material grammar | Art director |
| **family** | Family DNA, rejected directions, evolution grammar | Art + narrative directors |
| **creature** | Identity card, prompt, reference card, decision log | Art + relevant discipline directors |
| **detail** | Single image variant, pose, color tweak | Art director or delegate |

Any change must be approved at its level or higher. Lower-level changes cannot silently alter higher-level canon.

### 6.4 File Structure

```
art-direction/creatures/
├── registry.md
├── families/
│   └── {family}/
│       ├── family-dna.md
│       └── rejected-directions.md
└── creatures/
    └── {creature}/
        ├── design-intent.md
        ├── identity.md
        ├── reference-card.md
        ├── prompt.md
        ├── decision-log.md
        └── versions/
            └── v{MAJOR}.{MINOR}.{PATCH}.md
```

### 6.5 Semantic Versioning

- **MAJOR** — identity or family DNA change; affects world truth
- **MINOR** — visual refinement, prompt tuning, new decision
- **PATCH** — typo, link fix, reference update

### 6.6 Document Types

| File | Purpose |
| --- | --- |
| `family-dna.md` | Defines shared creative DNA for all family members |
| `rejected-directions.md` | Family-wide rejected directions (not per-creature) |
| `design-intent.md` | Why the creature exists: gameplay purpose, lesson, emotion |
| `identity.md` | Canonical identity card: silhouette, materials, behavior, validation |
| `reference-card.md` | Visual reference, inspiration, Coherence Test checklist |
| `prompt.md` | Identity-driven image prompt injection |
| `decision-log.md` | Versioned decisions and rejected directions for this creature |
| `versions/vX.Y.Z.md` | Snapshot of the creature at that version |

### 6.7 Creation Workflow

1. Write `design-intent.md` first.
2. Define or inherit `family-dna.md`.
3. Write `identity.md` with authority frontmatter.
4. Run the Coherence Test against family DNA and kill list.
5. Generate `prompt.md` from identity only.
6. Produce `reference-card.md` with concept image and visual DNA.
7. Review and approve; move to `canonical`; write `versions/v1.0.0.md`.
8. Update `registry.md`.

### 6.8 Separation Rule

- **Identity Card** = canonical truth, stable, reviewed.
- **Image Prompt Injection** = visual instruction for AI, derived from identity.
- **Chat / exploration** = temporary, never committed to `identity.md` or `prompt.md` without approval.

### 6.9 Concrete Example: Gnarled Nightmare

See the full canonical record in:

- [Design Intent](../art-direction/creatures/creatures/gnarled-nightmare/design-intent.md)
- [Identity Card](../art-direction/creatures/creatures/gnarled-nightmare/identity.md)
- [Reference Card](../art-direction/creatures/creatures/gnarled-nightmare/reference-card.md)
- [Prompt](../art-direction/creatures/creatures/gnarled-nightmare/prompt.md)
- [Decision Log](../art-direction/creatures/creatures/gnarled-nightmare/decision-log.md)
- [Registry](../art-direction/creatures/registry.md)

---

## 7. COMPONENTI UI WANDERLUST (WL-STY-007)

### ActionCardBase – Il Dettaglio Narrativo

**Filosofia**: L'ActionCard è il "dettaglio" dell'azione, la finestra che rivela la sostanza di un'attività o interazione.

#### Wilderness Pillar – Rude Bellezza Organica
- **Materiali**: Legno grezzo con texture impasto, paglia dorata, pietra alpina
- **Colori**: Verde foresta (rgba(44, 116, 66)), marroni caldi, accenti ambra
- **Animazioni**: Movimenti leggeri, scale 1.02, pulse delicati (2.5s)
- **Game Feel**: "Chiara, naturale, accessibile" – come una porta di legno che si apre con facilità
- **Audio**: Chime armonici, whoosh leggeri, ronzio naturale

#### Empire Pillar – Trionfo Solare Monumentale
- **Materiali**: Basalto nero venato, bronzo barocco, sete iridescenti
- **Colori**: Sun-bronze (rgba(205, 127, 50)), indaco profondo, accenti dorati
- **Animazioni**: Movimenti ponderati, scale 1.03, pulse più forti (2s)
- **Game Feel**: "Potente, permanente, imperiale" – come un portale bronze che richiede attenzione
- **Audio**: Campane bronze, whoosh caldi, ronzio metallico

### ActionHalo – Il Richiamo sulla Mappa

**Filosofia**: L'ActionHalo è il "richiamo" sulla mappa, il segnale che attira l'attenzione verso un punto di interesse.

#### Wilderness Pillar – Energia Vitale Naturale
- **Visual**: Anelli verdi con pulse leggero, glow organico, dimensioni 48-60px
- **Animazioni**: Pulse 1.1x scale, opacity 0.6-0.9, ciclo 2.5s
- **Game Feel**: "Vitale, pulsante, naturale" – come il respiro della foresta
- **Interazione**: Click produce ripple verde, chime armonico, feedback leggero

#### Empire Pillar – Aura Monumentale
- **Visual**: Anelli bronze con pulse forte, glow imponente, dimensioni 56-72px
- **Animazioni**: Pulse 1.15x scale, opacity 0.7-1.0, ciclo 2s
- **Game Feel**: "Maestoso, costante, imperiale" – come il battito del cuore dell'impero
- **Interazione**: Click produce ripple bronze, campana, feedback più marcato

### Differenza Fondamentale: Mappa vs Dettaglio

| Caratteristica | ActionHalo (Mappa) | ActionCardBase (Dettaglio) |
|---------------|-------------------|---------------------------|
| **Scopo** | Attenzione, scoperta | Informazione, azione |
| **Scala** | POI, overview | Activity, dettaglio |
| **Interazione** | Hover + click | Hover + collect CTA |
| **Animazione** | Pulse continuo | Event-driven |
| **Informazioni** | Icona + stato | Props + progress + assignees |
| **Contesto** | Esplorazione | Decisione |

### Telemetry Integration

**Eventi Tracciati**:
- `wanderlust_pillar_switch`: Cambio pillar con context e timestamp
- `action_halo_render`: Rendering POI con pillar e count
- `action_card_base_render`: Rendering card con pillar e count
- `action_card_collect`: CTA collect con pillar e success/failure

**Payload Standard**:
```typescript
{
  context: 'test_roster' | 'village_sandbox' | 'minimal_gameplay',
  pillar: 'wilderness' | 'empire',
  componentCount: number,
  timestamp: number,
  sessionId: string
}
```

---

## 8. I NEMICI DEL DNA (Kill List)

1. **NO GRIM:** Niente sporcizia fine a se stessa, niente miseria, niente teschi o decadenza.
2. **NO MUD:** Niente colori fangosi, terra marrone o nebbia grigia.
3. **NO SYMMETRY:** L'architettura e le pose devono essere asimmetriche e dinamiche.
4. **NO FLAT DESIGN:** Niente superfici lisce digitali (tranne i volti). Tutto deve avere “peso” tattile.

---

Versione controllata e approvata per il rollout artistico v0.10.

---

## 9. RENDERING SYSTEM – ARCHITETTURA A STRATI BLIZZARD-STYLE

### Filosofia Core

Ogni componente visivo è costruito con **8-12 layer** che si sovrappongono per creare profondità e complessità materica. Nessun componente finale può essere composto da meno di 6 layer.

### Pattern Layer Tipico (dal basso all'alto)

1. **Base Layer** - Forma primaria con colore solido
2. **Texture Layer** - Rumore organico (feTurbulence)
3. **Gradient Layer** - Sfumature radiali/lineari
4. **Highlight Layer** - Riflessi e specchi
5. **Detail Layer** - Imperfezioni, scratches, patina
6. **Overlay Layer** - Effetti di vetro, cristallo
7. **Accent Layer** - Bordi, anelli decorativi
8. **Animation Layer** - Elementi animati (pulse, flicker)
9. **Shadow Layer** - Ombre per profondità
10. **Glow Layer** - Bloom e glow esterni

### Imperfezioni Organiche

Niente superfici perfette. Ogni componente ha imperfezioni organiche che lo rendono "materico":

- **feTurbulence filters** per creare texture naturali
- **Scratches e nicks** sui bordi metallici
- **Patina spots** per ossidazione
- **Oxidation streaks** per invecchiamento
- **Noise overlay** per rugosità

### Regola Gerarchica dei Layer

- **Layer 1-5:** Sempre (base, texture, gradient, AO, border)
- **Layer 6-8:** Solo pannelli importanti (medium)
- **Layer 9-12:** Solo Hero Showcase, modali principali, reward, boss (rich)
- **Layer 13-18:** Solo momenti leggendari (legendary)

### Visual Richness Rule

> "Visual richness follows narrative importance. Ogni layer aggiunto deve aumentare il valore percepito dell'elemento. I componenti più frequenti rimangono semplici; quelli che rappresentano ricompense, scelte importanti o momenti memorabili possono accumulare più layer, più profondità e più dettagli."

### Sistemi di Rendering

#### Material Library
Materiali fisici con base color, lighting, AO, texture, noise, specular, vignette:
- Obsidian, Stone, Bronze, Dark Wood, Crystal, Cloth, Parchment, Iron, Leather

#### Frame Library
Frame oggetti con outer bevel, metal body, highlight, AO, inner line, decorative corners, glow hooks:
- Bronze, Imperial, Stone, Simple, Parchment, Guild, Hero, Reward, Glass, None

#### Layer Recipes
Ricette di costruzione per tipi di componente:
- Panel, Button, Reward, Tooltip, Modal, Card, HUD, Capsule

#### Decoration Packs
Pack decorativi tematici:
- Explorer, Imperial, Village, Nature, Magic, Ancient, Boss, Quest, Legendary

#### Corner Library
Stili di angoli indipendenti dal frame:
- Square, Bevel, Rounded, Leaf, Bronze, Imperial, Rune, Stone, None

#### Divider Library
Stili di divisori per separazione sezioni:
- Simple, Double, Diamond, Leaves, Imperial, Runic, Compass, Gold Fade, Stone Crack

#### Overlay Library
Overlay di texture opzionali per imperfezioni organiche:
- Dust, Fog, Light Leak, Scratches, Patina, Noise, Paper Grain, Crystal Reflections

#### Light Sources
Preset di illuminazione:
- North (Cold Teal), South (Warm Gold), Sun (White), Torch (Orange), Moon (Blue), Ambient

#### Visual Recipes
Ricette pre-configurate per pattern UI comuni:
- Village Panel, Quest Panel, Inventory Panel, Reward Panel, Boss Panel, Dialogue Panel, Character Sheet, Tooltip, Window, Card, Popup

### Integrazione con Pillar

#### Wilderness Pillar
- Materiali: Timber, Alpine Stone, Golden Thatch
- Frame: Simple, Stone, Wood
- Decoration: Explorer, Village, Nature
- Light: Ambient, North

#### Empire Pillar
- Materiali: Basalt, Sun-Bronze, Iridescent Silk
- Frame: Imperial, Bronze, Hero
- Decoration: Imperial, Ancient, Legendary
- Light: Sun, South, Torch

### Integrazione con Artist Styles

#### Ruan Jia Style
- Clean, sculptural, divine light
- Layer 1-5: Always
- Layer 6-8: For focal points
- Zero imperfezioni su volti

#### Jaime Jones Style
- Impasto, textured, oil brushstrokes
- Layer 1-8: Always
- Layer 9-12: For matter
- Heavy texture on body

#### Sparth Style
- Monumental, asymmetric, heroic scale
- Layer 1-6: Always
- Layer 7-12: For architecture
- Grand silhouettes

#### Jeff Easley Style
- Bronze weight, legendary monsters, heroic '80s
- Layer 1-8: Always
- Layer 9-15: For monsters/armor
- Heavy metallic feel

---

## 10. PROMPT ENGINEERING V2 — UMANI E CREATURE MAGICHE

> **Stato:** canonico dal 2026-10-12 (v0.12, R-172). Sostituisce §4 e §5 per **umani** e **mostri/creature magiche**. Gli ambienti/paesaggi restano sui master V1 fino a una futura V2 ambientale.

### 10.0 Perché V2 — il problema della banalità

I prompt V1 producevano soggetti *corretti* ma **banali**: descrivevano categorie (silhouette, materiali, colori) senza imporre ciò che rende un soggetto *quel* soggetto e nessun altro. Il risultato: eroi indistinguibili, mostri da manuale D&D.

V2 aggiunge il **Motore di Unicità**: campi obbligatori che forzano identità, contraddizione e storia visibile *prima* del look. Lo stile non cambia: resta congelato il pittorico a **pennellate spesse** (impasto Jaime Jones / Jeff Easley), split-rendering Ruan Jia sui punti focali, luce Solar Triumph, ombre deep teal, Kill List integrale.

### 10.1 Il Motore di Unicità (obbligatorio in ogni prompt V2)

Ogni prompt V2 — umano o creatura — DEVE compilare tutti i campi del motore. Un prompt senza questi campi è un prompt V1 e va rigettato in review.

| Campo | Domanda a cui risponde | Regola |
| --- | --- | --- |
| **IDENTITY SENTENCE** | Chi/cosa è, in una frase? | Formula *familiare + impossibile*: una metà ancorata al mondo noto (mestiere, animale, ruolo), una metà incongruente. |
| **SIGNATURE HOOK** | Qual è IL dettaglio che solo questo soggetto possiede? | Esattamente uno. Test: "il dettaglio che un bambino ridisegnerebbe a memoria". |
| **CONTRADICTION** | Quale tensione interna ha? | Obbligatoria. Il forte delicato; la creatura feroce che trema; il santo con mani da macellaio. È l'antidoto principale alla banalità. |
| **STORY TRACE** | Quale segno racconta un evento passato? | Usura asimmetrica, riparazione visibile, trofeo, voto rituale. Ogni segno implica un evento; mai decorazione gratuita. |
| **GESTURE** | Cosa sta *facendo*, non come posa? | Azione specifica in medias res. Vietate: T-pose, standing portrait, "heroic pose" generica. |
| **CULTURAL ANCHOR** | Da quale cultura/mestiere/tradizione proviene? | Origine concreta e nominata (gilda, regione, ordine). Vietato "generic fantasy". |
| **RECOGNITION TEST** | Si riconosce? | Silhouette nera leggibile; riconoscibile a 64px; ridisegnabile da un bambino; identificabile in 0.5s di trailer. |

### 10.2 Template V2 — UMANI (PG, NPC, eroi)

```text
SUBJECT TYPE: Human character — Prompt Engineering V2.
IDENTITY SENTENCE: <mestiere/ruolo concreto> who/that <contraddizione o tratto impossibile>.
CULTURAL ANCHOR: <gilda, regione, ordine, tradizione specifica del mondo>.
SIGNATURE HOOK: <un solo dettaglio unico e ridisegnabile a memoria>.
CONTRADICTION: <tensione interna resa visibile>.
FACE: Ruan Jia sculptural rendering — clean, luminous subsurface scattering, zero brushstrokes — carrying <un segno narrativo disegnato: cicatrice, marchio rituale, pelle segnata dal sole>. Il segno è progettato, non rumore.
THE HANDS: <mani che raccontano il mestiere: dita macchiate d'inchiostro, calli da fune, cicatrici da scalpello>.
GEAR & PROVENANCE: <equipaggiamento con storia: chi l'ha forgiato/riparato/ereditato; materiali del mondo — Sun-Bronze, Golden Thatch, pietra alpina, seta iridescente, basalto venato>.
GESTURE: <azione specifica in corso, colta in medias res>.
PALETTE: <max 3 pigmenti della bibbia, ciascuno con un motivo> + deep teal shadows; NO grey, NO brown.
LIGHTING: Solar Triumph — blinding white light from above, deep cool teal shadows, prismatic dust motes.
STYLE: Split-rendering — face clean (Ruan Jia); body, gear and world in thick oil impasto (Jaime Jones), broad visible brushstrokes, "crunchy" tactile matter.
MOOD: <coppia di emozioni specifiche — mai "epic" da solo>.
STORY TRACE: <oggetto portato che implica un evento passato>.
NO LIST: generic armor set, catalog beauty, T-pose / standing portrait, symmetrical gear, adventurer starter kit (random belts, pouches, buckles), flawless skin as the only trait, modern clothing, sci-fi tech, grim, mud, brown.
```

**Regola del terzo elemento (umani):** mestiere + tratto fisico non bastano. Serve un terzo elemento inatteso (oggetto, abitudine, gesto rituale) che nessun altro PG del roster condivide.

### 10.3 Template V2 — CREATURE / ESSENZE MAGICHE

```text
SUBJECT TYPE: Creature / magical entity — Prompt Engineering V2.
IDENTITY SENTENCE: <animale/elemento familiare> fused with <impossibile/incongruente>. (NOT a <tropo più vicino da escludere>.)
FAMILY: <famiglia dal registry §6, se applicabile>.
SIGNATURE HOOK: <un solo dettaglio unico e ridisegnabile a memoria>.
CONTRADICTION: <es. massa enorme / movimento da infermiera; aspetto feroce / postura terrorizzata>.
FUNCTION & ECOLOGY: <cosa fa nel mondo, cosa vuole, di cosa si nutre — il design serve la funzione>.
MAGIC VECTOR: la magia NON è "generic glow". Si manifesta attraverso un vettore materico: <resina che cristallizza la luce, polline di polvere d'oro, venature iridescenti oil-slick, alito che incurva l'aria come calore, ecoscaglie che suonano>. La magia obbedisce alla materia.
THE WORLD REACTS: <come l'ambiente mostra la sua presenza: silenzio improvviso, erba che si raddrizza, offerte di sale, uccelli assenti>.
SILHOUETTE: <forma iconica, asimmetrica>.
SHAPE LANGUAGE: <2 primitive geometriche>.
MOVEMENT: <verbi specifici — mai "walks">.
MATERIALS: <materiali del mondo con storia>.
COLORS: <palette> + deep teal shadows; NO grey, NO brown, NO mud.
ANATOMY: <vincoli + cosa NON è (mani umane, volto, ecc.)>.
ENVIRONMENT: <habitat specifico, non "fondo generico">.
LIGHTING: Solar Triumph — blinding white light, deep cool teal shadows, prismatic dust motes.
STYLE: thick oil impasto (Jaime Jones), Jeff Easley heroic weight, Justin Gerard whimsy; split-rendering solo sul punto focale pulito (es. occhi).
MOOD: <coppia di emozioni specifiche>.
STORY TRACE: <segno che implica una storia: cattura fallita, migrazione, voto>.
NO LIST: <tropo specifico da escludere>, generic D&D monster, pokémon-cute, pointed ears, generic dragon silhouette, grim decay, sci-fi tech, flat digital surfaces, symmetry, mud, brown.
```

### 10.4 Esempio compilato V2 — Umano (Eroe esiliato)

```text
SUBJECT TYPE: Human character — Prompt Engineering V2.
IDENTITY SENTENCE: An exiled border captain who still salutes a flag that no longer exists.
CULTURAL ANCHOR: The Sun-Bronze officer corps of the southern Empire — frontier command tradition.
SIGNATURE HOOK: A broken bronze officer's compass re-forged into a belt buckle; its needle still points toward the capital that banished him.
CONTRADICTION: A commander built for armies, reduced to apologizing to the peasants he now leads.
FACE: Ruan Jia sculptural rendering — clean, luminous subsurface scattering — with the left eyebrow split by an old duel scar, deliberately kept visible as a vow.
THE HANDS: Sword-calloused palms, fingertips ink-stained from petitions nobody answers.
GEAR & PROVENANCE: Officer's cuirass in baroque Sun-Bronze with the imperial sigil chiseled off — the pale scar of the removed crest still readable; cloak mended in three different village weaves, each patch a place that sheltered him.
GESTURE: Kneeling to tie a peasant child's boot, shield planted in the golden stubble like a walking stick.
PALETTE: Antique bronze, cinnabar sash, weathered alabaster; deep teal shadows. NO grey, NO brown.
LIGHTING: Solar Triumph late afternoon — low blinding white sun catching the removed-crest scar on the cuirass; prismatic dust motes.
STYLE: Split-rendering — face clean (Ruan Jia); cuirass, cloak and field in thick Jaime Jones oil impasto, broad visible palette-knife strokes.
MOOD: Dignity in defeat + stubborn tenderness.
STORY TRACE: A rolled, sealed petition he carries but never sends.
NO LIST: generic armor set, catalog beauty, T-pose, symmetrical gear, adventurer starter kit, modern clothing, sci-fi, grim, mud, brown.
```

### 10.5 Esempio compilato V2 — Creatura magica (il Cervo-Faro)

```text
SUBJECT TYPE: Magical creature — Prompt Engineering V2.
IDENTITY SENTENCE: A mountain stag that carries the last light of sunset inside hollow glass antlers — a shepherd of dusk, not a beast of war. (NOT a spirit totem, NOT a glowing elk.)
FAMILY: Mythic Beasts (candidate).
SIGNATURE HOOK: Hollow blown-glass antlers filled with captured gold sunlight that drains slowly like sand in an hourglass.
CONTRADICTION: Monumental, weapon-looking antlers — but the animal moves with the caution of a nurse crossing a sickroom.
FUNCTION & ECOLOGY: Migrates along shepherd paths at dusk; the antler-light keeps night predators away; villages leave salt offerings on flat stones.
MAGIC VECTOR: Magic is physical — sunlight stored as slow-draining liquid gold inside the glass; when the antlers run empty, the stag sleeps until dawn.
THE WORLD REACTS: Moths orbiting the antlers like a private galaxy; grass unbending behind its steps; distant village dogs falling silent.
SILHOUETTE: Tall, thin-legged stag beneath an oversized branching crown of glowing glass — top-heavy, unmistakable.
SHAPE LANGUAGE: Vertical lines + branching circles.
MOVEMENT: Steps slowly, lowers the crown, listens, bleeds light.
MATERIALS: Blown glass, living deer hide, lichen on the legs, salt-crust on the muzzle.
COLORS: Burnished gold light, dusk azure sky, emerald grass; deep teal shadows. NO grey, NO brown, NO mud.
ANATOMY: Real deer anatomy; no human face, no extra limbs, no visible eyes glow — the light is in the antlers, not the body.
ENVIRONMENT: A high alpine pasture at dusk, Dolomites peaks, a distant village chimney smoke.
LIGHTING: Solar Triumph fading — the last blinding white ray on the peaks, the antlers as the second light source; deep teal shadows.
STYLE: Thick Jaime Jones oil impasto on hide, grass and stone; Justin Gerard whimsy; the glass antlers rendered clean and luminous (split-rendering focal point).
MOOD: Reverence + fragile countdown.
STORY TRACE: One antler branch cracked and sealed with black resin — it survived a hunter's arrow.
NO LIST: spirit totem cliché, generic glowing elk, antler Christmas lights, human face, symmetry, pokémon-cute, grim decay, sci-fi tech, mud, brown.
```

### 10.6 Rapporto con V1 e con il Creature IP System

- **Lifecycle invariato:** per le creature vale sempre il workflow §6 (design-intent → family DNA → identity → coherence test → prompt → reference card → canonical). V2 cambia il *contenuto* del `prompt.md`, non il processo.
- **Campi V2 nell'identity card:** quando si authora una nuova creatura, i campi del Motore di Unicità (signature hook, contradiction, magic vector, world reaction) vanno compilati in `identity.md` *prima* del prompt — il prompt li eredita, non li inventa.
- **Prompt canonici esistenti:** i 4 prompt creatura `canonical` (Gnarled Nightmare, Bronze Relic Guardian, Emerald Scale Serpent, Momentum Bruiser) e i prompt umani della prompt library restano validi come output storici. Ogni *nuova* creatura/umano e ogni *rigenerazione* usano V2.
- **Rigenerazione consigliata:** un soggetto esistente può essere promosso a V2 compilando i campi del motore in una nuova versione (`MINOR` bump se cambia solo il prompt, `MAJOR` se cambia l'identità).

### 10.7 Scene prompt (immagini ambientali di quest/eventi)

Per i quadri ambientali (scene di quest, beat narrativi, card) valgono regole
diverse dal V2 umani/creature — distillate nella guida dedicata:
[`src/docs/docs/art-direction/scene_prompt_authoring_guide.md`](../art-direction/scene_prompt_authoring_guide.md).
Punti chiave: immagine = beat pre-scelta/pre-check (mai esito), party del
giocatore mai disegnato (NPC/party esterni ammessi), creature solo da
registry, luce libera per scena (niente Solar Triumph forzato) ma **palette,
ombre-teal, cielo-azure e luminosità restano vincoli di bibbia** (§1A, §2),
struttura fissa Subject→Composition→Mood→Style→Lighting→Palette→Avoid→Aspect.

---

## 11. ICONE — DUE LIVELLI, UNA MATERIA

> **Stato:** canonico dal 2026-10-13 (v0.14, R-177, PLAN-058 T2.1). Vale per ogni icona del gioco: glifi dei POI, risorse, medaglione giorno/notte, comandi dell'HUD. Regola madre di PLAN-058: l'icona deve stare accanto al Roster V2 senza sembrare un corpo estraneo.

### 11.1 I due livelli

| Livello | Cosa rappresenta | Come nasce | Formato |
| --- | --- | --- | --- |
| **Dipinte** | Oggetti del mondo: glifi dei POI, risorse, medaglione giorno/notte | Immagine generata dal Director con i prompt del kit (§11.5), poi scontornata | Master 512×512 → 128 / 64 / 32 px, WebP con alfa |
| **Incise** | Comandi e stati dell'interfaccia: menu, pausa, filtri, eventi, ruoli, ferita | Disegnate in codice, mai generate | SVG pieno monocromo, `fill="currentColor"`, griglia 24, nessun tratto |

Il confine è semplice: **se esiste nel mondo, è dipinta; se è un'azione dell'interfaccia, è incisa.** Una risorsa (oro, cibo, legno) è dipinta; il pulsante "pausa" è inciso. Un'icona non cambia livello a seconda di dove compare.

### 11.2 Decisioni che valgono per tutte (D1–D3)

- **D1 — Icone di luogo, non di azione.** Il glifo di un POI dice *dove* (accampamento, rovine, miniera), non *cosa fare*. Il verbo si legge aprendo il POI.
- **D2 — Esenzione dalla regola di asimmetria (§8.3).** Un'icona ha sagoma **simmetrica e centrata**, vista frontale. L'asimmetria vive nella materia: usura, luce da sinistra-alto, una crepa, un bordo consumato. Il divieto §8.3 resta valido per architetture, pose e scene.
- **D3 — Niente teschi** (coerente con §8.1). Le minacce si dicono con: segni d'artiglio, zanne/mascella, lance incrociate o stendardo strappato, corona spezzata (Re goblin).

### 11.3 La materia delle dipinte

- **Bronzo consumato su lacca teal.** Ogni icona dipinta è un oggetto fuso in bronzo opaco, lucidato dall'uso solo sugli spigoli in rilievo, con **lacca teal profonda** depositata negli incavi. È la stessa materia delle lastre del Roster (lacca teal + bordo bronzo).
- **Una sola patina d'accento** per soggetto, dichiarata nella riga del soggetto (oro opaco per la moneta, ambra per la crosta del pane, miele per il legno tagliato). Tutto il resto è bronzo e lacca.
- **Materia dichiarata (`materia`)** — il bronzo è il default, non una gabbia: il registro può assegnare una materia per icona (`baked`, `harvest`, `fang` nel kit). I soggetti organici tengono i veri colori nei pigmenti di bibbia (cinabro, ambra, miele, avorio); luce, ombre teal e impasto non cambiano. Aggiunta 2026-10-14 (R-191): il bronzo integrale sui soggetti organici leggeva spento.
- **Niente oro lucido**, niente gemme, niente riflessi speculari, niente cromature.
- **Niente foglie, rametti, oggettini** sparsi intorno al soggetto (veto Lacquer Atlas).
- **Niente cornici dipinte.** Bordo, disco, anello, tessera: li mette il codice (il Sigillo POI, la lastra risorse). L'immagine contiene solo l'oggetto.
- Ombre teal, mai grigie né marroni fangose (§2): la regola della palette vale anche dentro un'icona.
- **Fantasy, mai generico** (Director, 2026-10-13): niente pallini, anelli, dischetti di stato, spunte/croci da UI kit, niente semaforo verde/rosso. Uno stato si dice con la sagoma di un oggetto del mondo (scintilla, occhio, clessidra, lucchetto di ferro, lame incrociate), nella stessa materia. Se è un cerchio con un simbolo dentro, si ridisegna. Applicata ai cursori in `hud_component_guide.md` §5c.

### 11.4 Luce, leggibilità, prova

- **Luce:** una sola sorgente calda dall'**alto a sinistra**; ombra teal fredda in basso a destra. Stessa direzione per tutte le icone, così una fila di icone sembra illuminata dallo stesso sole.
- **Leggibilità a 24 px:** una sagoma sola, grossa, che riempie ~80% del quadrato. Se a 24 px non si riconosce, l'icona è sbagliata — non si aggiunge dettaglio, si semplifica.
- **Prova in scala di grigi:** ogni icona va guardata in grigio accanto alle altre della stessa fila. Due icone che in grigio si confondono vanno ridisegnate (cambia la sagoma, non il colore). Per i POI la prova è meccanica: `scripts/poi-terrain-gate.py` (bordo ≥ 3:1 su 8 ritagli reali della mappa, famiglie distinte in grigio).
- **Prova del bambino** (§10.1): la sagoma si ridisegna a memoria in tre segni.

### 11.5 Il kit dei prompt

Le icone dipinte non si scrivono a mano: si generano da un sistema unico.

- **Kit** (`src/docs/docs/art-direction/icons/prompt_kit.yaml`): il **blocco di stile fisso**, la **kill list**, i contratti d'uscita per GPT image, Gemini e Grok, i termini vietati. Il blocco di stile vive solo lì ed è bloccato da un hash: cambiarlo è una decisione, non un ritocco.
- **Registro** (`src/docs/docs/art-direction/icons/registry.yaml`): una voce per icona — `id, livello, famiglia, soggetto (una riga), taglie, stato (needed | prompted | candidate | approved), prompt, file, provenance`.
- **Generatore** (`scripts/gen-icon-prompts.py`): dal registro scrive `.mw/specs/icons/<id>/prompt.md` con le tre varianti pronte da incollare.
- **Lint** (`scripts/lint-icon-prompts.py`): blocco di stile presente e invariato, soggetto in una frase, kill list completa, nessun termine vietato fuori dalla kill list, sfondo e uscita dichiarati.
- **Ancore:** le prime sei icone (rovine, accampamento goblin, segni d'artiglio; oro, cibo, legno) sono le **ancore**. Scelte dal Director, diventano immagini di riferimento allegate a tutti i prompt successivi.

Chi scrive un nuovo soggetto cambia **solo la riga del soggetto** nel registro. Tutto il resto — stile, luce, materia, kill list, uscita — arriva dal kit.

### 11.6 Le incise

- SVG pieni monocromi, `fill="currentColor"`, viewBox `0 0 24 24`, niente `stroke`: il colore lo dà il token del contenitore, come il testo.
- Stessa sagoma piena e stessa massa ottica per tutta la famiglia (riempimento ~70% della griglia).
- Sostituiscono `hudIcons.tsx` a tratto 1.6 e `lucide-react` nell'HUD di `/game` (PLAN-058 T3.2).

---

Rendering System aggiunto in v0.11. Prompt Engineering V2 (Motore di Unicità, template umani/creature) aggiunto in v0.12. Scene Prompt Authoring Guide aggiunta 2026-10-13 (v0.13). Capitolo Icone (due livelli, kit dei prompt) aggiunto 2026-10-13 (v0.14).
