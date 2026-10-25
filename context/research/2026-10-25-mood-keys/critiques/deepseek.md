QUILL-EMBER-9

A) What's missing/wrong for semantic mood match

The structure is palette-and-register heavy and narrative-causality blind. It tells the generator what the world looks like, not what kind of event is being witnessed, what scale-relationship the viewer has to it, or what the light is doing. Concretely missing:

No light-event field. "Mood-specific sky/light" is a color spec, not a lighting mechanism. The approved register works because it names an action ("sunlight SLAMS"). The template buries that in STYLE as adjectives. Each key needs a lighting verb + source geometry (e.g. Wilderness: hard raking sun from high-left, short shadows, blinding rim; Empire: vertical noon axial light, ceremonial and flattening; Prismatic: light refracted through membrane, non-solar; Wasteland: light breaking through churn, cobalt-vs-orange oppositional).

No scale anchor. Pillar semantics (heart / weight / intrusion / scar) are existential, not spatial. Without an explicit scale cue (human figure, known object, terrain feature) the generator defaults to generic fantasy vista scale and all four keys collapse into "epic landscape."

No atmosphere medium. Wilderness = dry alpine clarity; Empire = dust-hazed basalt air; Prismatic = wrong-medium (veils, suspended particulates that don't belong); Wasteland = ash-and-ember air. Medium is what makes mood feel different at the same palette.

No "wrongness" instruction for Prismatic. The key's whole point is out-of-place-by-design; the current structure gives it a palette (iridescence) which the generator then sprays everywhere (known failure). Prismatic needs a containment rule — iridescence confined to named membranes/lenses — stated as a positive compositional constraint, not a kill.

WORLD is motivational prose, not a generation constraint. "Why this exists" is for the art director, not the model. It needs to be translated into a visible signature (what in the frame proves the pillar).

Technique doctrine is under-specified at field level. "Thick impasto, no smoothing" is in the bible but not in the template as a per-image instruction; it only lives in STYLE abstractly. Impasto needs a material target (which surfaces get knife-work: stone faces, sky bands, cloth folds) or it averages out.

B) Creature + place + relic triad — is WORLD's "why" enough?

No. One "why" at the WORLD level justifies the scene's existence but not each element's presence in the frame. Each of the three needs its own one-line semantic justification tied to the key, or the generator produces three unrelated props sharing a palette. Fix: give each triad element a role clause — CREATURE (what it embodies in this key — e.g. Wilderness: unexpressed potential made animal; Empire: hierarchy made animal; Prismatic: a body altered by intrusion, not a rainbow animal; Wasteland: survivor, not victim), PLACE (what it witnesses — heart/weight/intrusion/scar), RELIC (what it does — a fragment of the other pillar that has leaked into this one, which is how the four keys stay in one world). Without the relic's cross-key leak, the pillars drift into four separate IPs. Also: family grammar is a good start but it's a taxonomy, not a semantic — taxonomy without role clause produces correct-category, wrong-meaning creatures.

C) Composition-level differentiation per key

Yes — each key should have preferred archetypes and shot grammar, because archetype is ideology:

Wilderness / Rude Beauty: VISTA and CASCADE preferred; high horizon or low horizon (never centered); diagonal composition following river/ridge; one dominant foreground mass with the eye pulled deep; negative space = sky as azure field; human-scale anchor small but present (potential, not power).

Empire / Impero Solare: MONOLITH and ARCH preferred, plus GRID for ceremonial repetition; symmetry and frontality are the point — axial, centered, viewer below the architecture; deep vertical stacking; negative space = air between colossal masses; scale anchor = tiny supplicant figures to prove monumentality.

Prismatic: ISLAND and TABLEAUX (a specimen under examination) preferred; asymmetric, off-axis, tilted horizon so the intrusion reads as wrong; wreckage breaks the frame edge (incompleteness = multiverse); negative space = the absence where landscape should be; scale anchor = the foreign object's impossible proportion.

Dark Wasteland: VOID and MONOLITH-as-ruin; low, wide, oppressive crop; cobalt storm mass occupying upper two-thirds with orange breaks inside the mass (not meteors); negative space = the storm itself; scale anchor = ember-lit survivor silhouette against the churn.

Also: shot grammar should include a camera-height rule per key (Wilderness: eye-level adventurous; Empire: low-angle awe; Prismatic: disoriented tilt; Wasteland: ground-hugging dread). This alone will separate keys more than palette ever will.

D) Kill list dilution

Yes, it's already diluting. Every added negative (signature, card corners, muted colors, meteors, soft skies, rainbow beams) spends attention budget and, worse, names the failure — "meteors" and "rainbow beams" in a negative list still put the token in the prompt, and generators are notoriously bad at negation. Structure fix: split the kill list into three tiers:

Structural negatives only — short, universal, few (signature/watermark, card vignette, text, border). These are format hygiene, not aesthetics.

Positive substitutions — convert every aesthetic kill into a positive instruction in the relevant field ("NO meteors" becomes "sky = churning indigo storm with burning orange breaks inside the cloud mass"; "no rainbow beams" becomes "iridescence confined to named membranes/lenses only"). Never list an aesthetic failure as a negative if you can state its positive opposite.

Per-key one-liner — a single "this key is NOT" line, only where ambiguity is real (e.g. Wasteland: "not grim-mud; luminous darkness").

Cap the structural list at ~5 items. If it grows past that, the prompt is doing the kill list's job badly somewhere upstream.

E) One concrete rewrite

text
Copy
Download
1. REF — [style-reference attached; style only, no composition/content transfer]
2. KEY — [WILDERNESS / EMPIRE / PRISMATIC / WASTELAND]
   pillar signature: [one visible proof of heart/weight/intrusion/scar]
   light-event: [verb + source geometry, e.g. "hard raking sun SLAMS from high-left"]
   medium: [dry alpine clarity / basalt dust-haze / wrong-medium veil / ash-and-ember air]
   scale anchor: [human figure / known object / impossible proportion]
3. SUBJECT — closed triad, each with role clause:
   CREATURE [family: mythic/imperial/intrusion-touched/survivor]
     — embodies: [what this key makes animal]
   PLACE
     — witnesses: [heart/weight/intrusion/scar]
   RELIC
     — leaks: [which other key this fragment came from, and how it shows]
4. COMPOSITION — archetype [per-key preferred set] + camera height [per-key rule]
   planes / focal hierarchy / negative-space field [key-specific] / horizon [key-specific]
5. STYLE — baptized register: "sunlight SLAMS", "blinding", "searing highlights",
   "shadowed faces GLOW in saturated teal", "every plane vibrates", "no flat colors"
   palette: [key] sky [azure / indigo-prismatic / churning indigo+orange breaks]
   shadows: deep teal-emerald (never grey/brown)
   impasto target: [which surfaces get violent palette-knife work]
   iridescence: [PRISMATIC ONLY — confined to named membranes/lenses; omit field otherwise]
6. HYGIENE (structural only, max 5): no signature/watermark, no card corners, no text/border,
   no digital smoothing.
   per-key NOT-line: [only if real ambiguity — e.g. WASTELAND: "not grim-mud"]
7. FORMAT — 21:9

Key structural moves: WORLD becomes KEY with four hard visible fields; triad gets role clauses and a cross-key relic leak; composition gets per-key archetype + camera height + negative-space field; kill list collapses to hygiene + one per-key NOT; aesthetic negatives are rewritten as positives in their home fields. The prompt now constrains event, scale, medium, and ideology — not just pigment.

