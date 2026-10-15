# DNA PRISMATIC WANDERLUST – BIBBIA DI DIREZIONE ARTISTICA (v0.12)

> Questa copia alimenta la pagina dev "Prompt & Bible Style". La bibbia canonica completa è `src/docs/docs/plans/art_direction_plan.md`.

Core Philosophy: Antitesi del dark fantasy. Energia cinetica, libertà, scoprire i misteri del mondo, trovare tesori. Il mondo non è "sporco", è materico. La povertà non è "miseria", è rude bellezza.

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

> **⚠️ OBSOLETA dal 2026-10-12 (v0.12).** Sostituita da **§7 — Prompt Engineering V2**. Conservata solo per memoria creativa. Non usare queste regole per nuovi prompt.

1. **Zone-Based Instruction:** Separare esplicitamente il trattamento del volto (Clean) dal resto (Impasto).
2. **Specificità Materica:** Mai usare termini generici. Usare “Golden Thatch” invece di “Roof”, “Baroque Sun-Bronze” invece di “Armor”.
3. **Terminologia Anti-Sci-Fi:** Vietato usare: pipes, exoskeleton, wires, tech. Usare: structural ribs, ceremonial plates, artisan carvings.
4. **Guardrail Cromatici:** Inserire sempre “Deep Teal shadows” e “No grey, no brown”.

> **IMPORTANTE – Prompt Authoring per l'AI (V1, storico):** la Bibbia v0.10 costruiva il prompt dividendo le istruzioni in ZONE (Focal Point vs Matter) e applicando la “Kill List” per bloccare Sci-Fi e Grim. Questo metodo resta il *modo di renderizzare*, ma da v0.12 non è più sufficiente da solo: manca il Motore di Unicità (§7.1).

---

## 5. MASTER PROMPT V1 (OBSOLETI — riferimento storico)

> **⚠️ OBSOLETI dal 2026-10-12 (v0.12).** I master prompt sotto producono risultati corretti ma troppo generici ("banali"): descrivono categorie, non soggetti. Per umani e creature usare i template §7.2/§7.3. Il master Wilderness resta valido per paesaggi fino a una V2 ambientale.

### 🌲 Master Prompt: Wilderness (Cuore del Progetto)

A majestic, wide-angle landscape of a frontier village in a lush mountain valley (21:9 aspect ratio). ARCHITECTURE: Simple but sturdy timber and stone houses with golden thatched roofs. GEOGRAPHY: A crystal-clear river reflecting a vibrant Azure sky. Background: monumental jagged mountain peaks (Dolomites style) and a sun-drenched, ancient forest. LIGHTING: “Solar Triumph”—brilliant, clean white sunlight, deep and cool Teal shadows. STYLE: Jaime Jones broad oil brushstrokes, thick impasto textures on wood and stone. Mood: Adventurous, inviting, Rude Beauty.

### 👤 Master Prompt: Eroe (Split-Rendering)

Elite character portrait of a noble male hero. THE FACE: Ruan Jia sculptural perfection, flawless skin, no brushstrokes. THE BODY: Baroque Sun-Bronze armor, scratched and weathered, rendered with thick Jaime Jones impasto brushwork. LIGHTING: Blinding white light, saturated teal shadows. STYLE: Contrast between digital polish and oil painting texture.

---

## 6. I NEMICI DEL DNA (Kill List)

1. **NO GRIM:** Niente sporcizia fine a se stessa, niente miseria, niente teschi o decadenza.
2. **NO MUD:** Niente colori fangosi, terra marrone o nebbia grigia.
3. **NO SYMMETRY:** L'architettura e le pose devono essere asimmetriche e dinamiche.
4. **NO FLAT DESIGN:** Niente superfici lisce digitali (tranne i volti). Tutto deve avere “peso” tattile.

---

## 7. PROMPT ENGINEERING V2 — UMANI E CREATURE MAGICHE

> **Stato:** canonico dal 2026-10-12 (v0.12, R-172). Sostituisce §4 e §5 per **umani** e **mostri/creature magiche**. Gli ambienti/paesaggi restano sui master V1 fino a una futura V2 ambientale.

### 7.0 Perché V2 — il problema della banalità

I prompt V1 producevano soggetti *corretti* ma **banali**: descrivevano categorie (silhouette, materiali, colori) senza imporre ciò che rende un soggetto *quel* soggetto e nessun altro. Il risultato: eroi indistinguibili, mostri da manuale D&D.

V2 aggiunge il **Motore di Unicità**: campi obbligatori che forzano identità, contraddizione e storia visibile *prima* del look. Lo stile non cambia: resta congelato il pittorico a **pennellate spesse** (impasto Jaime Jones / Jeff Easley), split-rendering Ruan Jia sui punti focali, luce Solar Triumph, ombre deep teal, Kill List integrale.

### 7.1 Il Motore di Unicità (obbligatorio in ogni prompt V2)

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

### 7.2 Template V2 — UMANI (PG, NPC, eroi)

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

### 7.3 Template V2 — CREATURE / ESSENZE MAGICHE

```text
SUBJECT TYPE: Creature / magical entity — Prompt Engineering V2.
IDENTITY SENTENCE: <animale/elemento familiare> fused with <impossibile/incongruente>. (NOT a <tropo più vicino da escludere>.)
FAMILY: <famiglia dal Creature IP System, se applicabile>.
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

### 7.4 Esempio compilato V2 — Umano (Eroe esiliato)

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

### 7.5 Esempio compilato V2 — Creatura magica (il Cervo-Faro)

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

### 7.6 Rapporto con V1 e con il Creature IP System

- **Lifecycle invariato:** per le creature vale sempre il Creature IP Development System della bibbia canonica (design-intent → family DNA → identity → coherence test → prompt → reference card → canonical). V2 cambia il *contenuto* del `prompt.md`, non il processo.
- **Campi V2 nell'identity card:** quando si authora una nuova creatura, i campi del Motore di Unicità (signature hook, contradiction, magic vector, world reaction) vanno compilati in `identity.md` *prima* del prompt — il prompt li eredita, non li inventa.
- **Prompt canonici esistenti:** i 4 prompt creatura `canonical` (Gnarled Nightmare, Bronze Relic Guardian, Emerald Scale Serpent, Momentum Bruiser) e i prompt umani della prompt library restano validi come output storici. Ogni *nuova* creatura/umano e ogni *rigenerazione* usano V2.
- **Rigenerazione consigliata:** un soggetto esistente può essere promosso a V2 compilando i campi del motore in una nuova versione (`MINOR` bump se cambia solo il prompt, `MAJOR` se cambia l'identità).

---

Versione controllata e approvata per il rollout artistico v0.12.
