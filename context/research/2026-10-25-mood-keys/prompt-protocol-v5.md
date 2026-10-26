# Wanderlust Prompt Protocol v5 — artifact r004
(r003 + chatgpt bisect epistemics fix; r002 + dispositions of chatgpt/deepseek objections:
 anchor-by-operation, operational severity test, attribution honesty,
 hypothesis labeling)

## 0. Design stance
Gemini web = stochastic collaborator: no seeds, no API. Discipline replaces
determinism. Acceptance is by SEEN image only (witness), never by prompt
validity or file existence. Untested hypotheses are labeled as such and
never canonized without 2+ confirmations.

## 1. Two artifacts per image
- GENERATION_PROMPT — ordered artistic instructions sent to Gemini.
- PRODUCTION_RECORD — never submitted: ASSET_ID, REF_CLEAN verdict,
  ACCEPTANCE_TESTS, REVISION_STATE (invariants/targets/budget), attribution
  log. Diagnostic notes are not art instructions.

## 2. GENERATION_PROMPT — fixed field order
1. REF (image + role: properties to keep / defects to exclude)
2. MOOD_KEY + LIGHT_EVENT (one key; canonical light behavior)
3. DOMINANT_COLOR_FIELDS — 1–2 fields declared as PRIMARY SUBJECTS with
   COLOR_FIELD_ROLE + named pigment + RELATIVE_VISUAL_DOMINANCE (qualitative:
   "the sky dominates the upper frame", not "occupies 60%"). Rationale:
   zones-as-percentages in field 3 = layout instruction colliding with
   COMPOSITION (both providers objected); token-collision fix is an
   UNTESTED HYPOTHESIS → A/B test before canonizing.
4. SUBJECT_CLASS + class-typed SUBJECT block (§7) incl. ROLE_READ
5. COMPOSITION — archetype, camera, planes fg/mid/bg, negative space,
   focal hierarchy, MOOD_PROOF; optional FIELD_EXTENT sub-field
   (zone geometry) ONLY when the archetype requires it — gated in GATE
   vs focal hierarchy + camera.
6. SCALE_ANCHOR
7. BAPTIZED_STYLE_REGISTER — verbatim, zero paraphrase
8. HYGIENE — ≤5 structural, never contradicting dominant fields
9. FORMAT — 21:9 full-bleed

## 3. GATE — pre-send (binary; one authoring retry then stop)
G1 REF-CLEAN verdict; G2 KEY-LOCK (key NOTs: Prismatic no sky beams;
Wasteland no meteors); G3 DOMINANCE (fields as subjects + dominance,
not palette list, not % zones); G4 REGISTER ≥4 baptized phrases verbatim;
G5 HYGIENE ≤5, no contradiction; G6 FORMAT 21:9; G7 ONE-VARIABLE —
applies to generation prompts AND edit instructions ("change only X" =
one field); semantic vs literal delta: a register re-injection is a
SECOND intervention, logged separately, never claimed as single-field
attribution; G8 FIELD_EXTENT (if present) consistent with focal
hierarchy + camera.

## 4. FORK — route AFTER a compound-failure assessment
First assess ALL defects (composition, key, ref-contamination, subject
read, color/light, texture) — first-match without assessment is unsafe
(ref defect + wrong composition can coexist; regenerating with the same
bad ref reproduces both). Then route:
1. Composition/focal wrong → REGENERATE.
2. KEY/mood wrong → REGENERATE (REF/KEY/DOMINANT failure).
3. REF-defect copied → fix/swap REF + REF-CLEAN, REGENERATE.
4. ROLE_READ wrong (creature reads as prop; witness as protagonist;
   action beat illegible at thumbnail) → REGENERATE.
5. Only color/light/dominant-field wrong on right composition+key →
   EDIT same chat: "keep composition, change only X" (one field).
6. Anatomy/subject-structure wrong → REGENERATE. Operational severity
   test: a defect is edit-eligible iff it is confined to a nameable
   spatial zone AND the fix requires no change to subject silhouette or
   its relation to the focal hierarchy; otherwise REGENERATE.
7. Texture degradation → RE-ANCHOR event (not an edit): same chat,
   full BAPTIZED_STYLE_REGISTER verbatim re-paste + "preserve current
   composition and lighting". Permitted only if composition/subject
   intact + defect localized. Broadly smooth/glossy or re-anchor fails
   → thread DEAD, hard reset to B0. Does not count toward edit budget;
   logged as re-anchor. Do not spend it automatically.
8. Post-edit REGRESSION GATE: target improved AND invariants preserved
   AND no material regression → accept/continue; target improved but
   protected property regressed → failed edit, assess recoverability;
   target unchanged/worsened → do not repeat blindly.

## 5. Isolation diagnostics
- B0 = first composition-accepted image; verbatim prompt in ledger.
- One-field delta per iteration; two changes = two generations.
- ANCHOR BY OPERATION (replaces absolute B0 rule):
   * fresh corrective branches / regenerations anchor to B0;
   * localized edits and re-anchors that must preserve accepted changes
     anchor to the LATEST ACCEPTED image;
   * chaining (edit→edit on predecessor) is permitted ONLY for ops that
     change LIGHT_EVENT or MOOD_PROOF alone — never ops touching
     DOMINANT_COLOR_FIELDS or STYLE (self-contamination compounds);
   * a chained edit showing texture decay triggers §4.7 re-anchor, and
     the next corrective op re-anchors to B0.
- Attribution grammar: color+comp-right → DOMINANT_FIELDS/STYLE;
   mood → KEY; muted/storybook drift → STYLE/HYGIENE; artifact → REF;
   layout → COMPOSITION; role illegible → SUBJECT/ROLE_READ.
- Conviction: same defect + same single-field intervention + same
   acceptance criterion, reproduced twice; record contradictory
   outcomes, never count only successes. "Suspect" otherwise — no-seeds
   causality is imperfect.
- ATTRIBUTION HONESTY: because every edit re-injects register (second
   intervention), field conviction is ONLY available from
   generation-prompt ablation — edits are for correction, not
   attribution. Never claim an edit convicted a field.
- Bisect: two suspects → change one; a fix narrows the active defect —
   neither suspect is acquitted without independent ablation evidence
   (a successful correction may mask or interact with the other field).

## 6. Conversation lifecycle + state
- SAME CHAT (default; tabs stay open — Director rule): near-miss within
   budget, key+REF unchanged, no degradation signal.
- FRESH CHAT when: composition/key/REF/class change; budget exhausted;
   degradation confirmed; chat holds ≥2 unrelated images; cross-key
   jump (never edit across keys).
- DEGRADATION SIGNALS: clipped flat-white highlights; impasto reads
   smooth/glossy; composition drift despite "keep composition". Cause:
   attention decay prunes register vocabulary — every edit re-injects
   register (logged as second intervention).
- BUDGET: per thread = gen0 + ≤2 field-edits (3rd earned ONLY if edits
   1–2 addressed different fields AND degradation checklist clean);
   +1 re-anchor event (separate). Per asset ≤6 image ops; 2 consecutive
   cap-hits in a session → audit the TEMPLATE; escalate to Director.
- CARRYOVER on chat close: B0 verbatim + last best image path + open
   symptom → fresh chat rehydrates by re-paste + attach.
- PROMPT LEDGER per image (durable, repo): image_id | class | KEY | REF |
   B0 | op# | delta (or re-anchor) | verdict | symptom | attribution |
   chat ref. Convictions → template amendments only after 2 confirmations.

## 7. Subject-class blocks
- CREATURE: ANATOMY_ANCHOR (skeleton/silhouette; anti-anthropomorphic-drift rule = [HYPOTHESIS] pending evidence),
   MUSCLE_LOAD, TEXTURE_MAPPING (iridescence→membranes only), EMBODIES,
   ROLE_READ (actor vs prop), SCALE_ANCHOR, MOTION/POSE. Anatomy → regen.
- HUMAN: EXPRESSION_VECTOR (one emotion), GAZE_LOCK (direction+target,
   mirrored in COMPOSITION), SCALE_RATIO (monumental compression —
   numeric threshold e.g. <10% is a TESTABLE PRESET, not canon unless
   Director ratifies), COSTUME/PROPS, ROLE_READ (witness/protagonist/
   obstacle). Severity-classified failures.
- LANDSCAPE: DOMINANT fields as subjects (strongest case), HORIZON_ANCHOR,
   PLANE_LAYERING, ATMOSPHERIC_DENSITY, place-witnesses. [HYPOTHESIS] most edit-
   friendly class → full budget.
- CINEMATIC_QUEST_SCENE: ACTION_BEAT (one verb, legible at thumbnail =
   ROLE_READ), PARALLAX_FOREGROUND_ZONE (never occludes focal),
   AMBIENT_EFFECT_ZONE (bound to a spatial zone, never global wash),
   FOCAL_HIERARCHY (1 primary ≤2 secondary), NARRATIVE_TENSION, WITNESS;
   embeds compact creature/human sub-block; scene KEY governs. Edits
   only for ambient/light; parallax/focal → regenerate.

## 8. Acceptance
Visual rubric (composition, key-mood, dominant fields, light-event,
register/impasto, hygiene): each passes on SEEING the image.
Structural pass ≠ mood pass. Director eye-check = promotion gate.

## A8 — SCENE LIGHT & VARIETY (ruling Director 2026-10-25, provato su gola/camp)

### LIGHT_IDENTITY — campo vincolato
Ogni scena ha una firma di luce: `orario × temperatura × diffusione × valore
estetico` (es. gola = "luminosità tenue di fine giorno"). Si dichiara nel
prompt e si **rispetta negli edit**: un edit può aumentare la VARIETÀ
dentro l'identità, MAI normalizzarla a un template (tramonto ambra+teal è
il template-generico che ha distrutto la gola). Ogni scena ha la SUA ora.

### VARIETY rule
Bellezza = **color-shift locali**, non contrasto globale. Prove ref:
villaggio sky = 3-4 hue + nuvole; vette = 5+ hue; jungle column = oro su
un lato, teal sull'altro della STESSA superficie. Scena quieta può essere
cromaticamente ricca; scena drammatica può essere povera. Il deficit
"quasi-promossa" non è "poco dramma" ma "poca varietà locale".

### TYPE-VERIFICATION gate (obbligatorio prima di presentare)
Precondizione: il file PRIMA è pinnato nel confronto — no pin = no check.
Side-by-side, check sestuple:
(a) è cambiato DAVVERO? (camp: identico, dichiarato PASS = errore)
(b) nella direzione chiesta?
(c) LOCAL hue-variety aumentata E global contrast non appiattito?
    (varietà = n. hue distinti per superficie, non "più contrasto")
(d) LIGHT_IDENTITY preservata? — espressa come anchor tecnici
    (orario × temp × diffusione), NON come etichetta astratta:
    il modello normalizza "luminosità tenue" → golden-hour generico.
    Scrivi: "soft late-afternoon overcast, cool-dominant, gentle rim
    light, NO direct amber sun, NO high-contrast teal/orange grade"
(e) focal anchor / parallasse invariati?
(f) UN solo light-event dominante preservato? (niente doppie sorgenti)
Un solo NO = iterate. DUE fail sullo stesso asse → STOP, rigenera.

### IN-CONVERSATION ITERATION
Non si presenta l'edit singolo: si itera nella stessa chat finché il
type-check non passa, poi si presenta solo il risultato verificato.

### REF-as-METRIC
Il metro del PASS è "stesso livello di ricchezza locale dei ref del
dominio" (jungle = quieto+ricco; villaggio = luminoso+vario), MAI
"più drammatico".

## A9 — EVOCAZIONE OBBLIGATORIA + vocabolario per dominio (Director 2026-10-25)

Ogni campo del form deve contenere **almeno un'ancora materiale**:
pigmento nominato, verbo fisico, o texture tattile. Etichette astratte
bandite ("green" → "Veronese green"; "rock" → "cracked basalt planes").
Il modello capisce la narrativa densa, non i tag — struttura SÌ ma ogni
campo carico di materia. (Google/DeepMind: "describe the scene, don't
list keywords" — confermato.)

### Vocabolario per dominio (ancore evocative canoniche)

**Rude Beauty** — vibrant azure sky; vivid Veronese green meadows;
golden thatch catching light; amber-gold sunlit faces; saturated
teal-emerald shadows; sunlight SLAMS; weathered timber lashed; crystal
river reflecting sky; warm raking light; sun-drenched ridge;
thick impasto vibrating; weathered and tactile, never squalid.

**Impero Solare** — blinding white-gold axial light; monumental scale
compressing the figure; ivory marble + burnished gold; cadmium-cinabro
banners; deep indigo vault; radiant halo; bronze ceremonial mass;
processional gravity; hierarchy as composition.

**Prismatic** — deep indigo twilight; oil-slick iridescence ONLY on
glass/membranes/ether; ether particles seeping like a gas leak —
cool spectrum (cyan, violet, teal, magenta); anamorphic prismatic
flare streaks + soft blooms floating confused; moon halo ring;
wrong-angled ancient relic; majestic BY PROPORTION, not thickness;
slender delicate tracery; alien world glimpsed inside panes.

**Dark Wasteland** — indigo-cobalt mass devouring sky; ember-orange
burning INSIDE the dark; torn-paper torn edge; ashen ruins; charcoal
umber ground; last ember of resistance; ground-hugging camera;
bone-pale accents; smoke-hung horizon.

## A10 — ADEQUACY METRIC (Director 2026-10-25): hue-fields + impasto

Il gate "è adeguata" NON è "contrasto/dramma" ma:

1. **HUE-FIELD COUNT**: conta i campi cromatici distinti e leggibili
   (villaggio=5+, jungle=6). Target = ≥ quello del ref del dominio.
2. **DOMINANCE STRUCTURE**: *chi* domina e *chi accentua* deve
   rispecchiare il ref (jungle: verdi dominano + oro accentua;
   villaggio: azure+veronese dominano + oro accentua). "Gold on
   everything" = sbagliato anche se il colore singolo è giusto.
3. **NO BROWN-DRIFT**: giallo+verde possono fondersi in ocra-marrone.
   Il giallo deve restare *luminoso* su spot esposti, mai cast globale.
4. **IMPASTO THICKNESS**: spatolate spesse fisiche (knife ridges)
   vs tratti illustrativi — verifica il registro materico, non solo
   "impasto presente".

Regola d'oro: *aggiungi varietà dentro l'identità, non drama fuori.*

## A11 — LOCAL CONTRAST WEAVE (ruling Director 2026-10-25, esempio assalto)

Contrasto NON è zone di colore (sopra=violetto, sotto=verde) — è
**micro-opposizioni intrecciate dentro ogni campo**. Metro = fascia alta
di assalto-goblin: verde chiaro + scuro + teal + fiamme + scintille
nella STESSA fascia. Ogni regione deve contenere hue opposte intrecciate:
flecks caldi nei campi freddi, glints freddi nei campi caldi.
"Aggiungere altri fuochi" ≠ varietà — varietà = tessere contrasto OVUNQUE.

VIETATO (bibbia, violato in gola-E3): nero/murk; marrone (=intristisce,
non dà contrasto); bianco/grigio come campi dominanti (=mai vibranti,
noioso). Anche in luce fioca: colori VIBRANTI saturati (assalto è buio
MA ogni hue è satura). Oggetti marroni spontanei (barchetta, tenda
vecchia) = difetto da rigenerare.

Prompt-phrase: "chromatic movement INSIDE every field — interleaved
contrasting hues in the same zone: warm flecks within cool fields,
cool glints within warm fields, like the canopy band where light-green,
dark-green, teal, flame and sparks live interleaved".

## A12 — NARRATIVE VARIATION & CAUSAL COLOR (ruling Director 2026-10-25)

Lezioni dell'iterazione A11→A12→fiori — sopra il metro "tipo" e
"intreccio", serve la *storia*:

1. **VARIATION = STORY, not decoration.** "Differenzia i props" non
   basta: ogni ripetizione (tende, alberi, scogliere, rocce) deve
   raccontare CHI ci vive — trofei di corna, marchio di guerra,
   spiedo-carne, pelli ad essiccare, licheni, pino contorto. Regola:
   "ogni elemento ripetuto ha una motivazione narrativa specifica",
   mai "dettagli vari". Metro = credibile, vissuto, da abitanti
   specifici (non abitanti generici).

2. **CAUSAL COLOR FIELD.** Ogni campo colore vuole un *motivo*
   per cui esiste: la fascia violetta del cielo funziona solo quando
   è "l'etere che sanguina dall'orizzonte". Campo colore senza causa
   = decorazione piatta; campo colore causato = grammatica del mondo.
   Nel prompt: nomina il campo + il suo motivo ("the violet band is
   the ether's glow bleeding from the horizon", non "violet sky").

3. **ACCENT = DELIBERATE COMPLEMENT.** Un accento non è un colore
   qualsiasi: va scelto per *scontrarsi* con entrambi i dominanti
   (cobalto dei fiori vs verde+viola). Regola: "choose the accent
   that contrasts BOTH dominant fields", non "add color".

4. **PROMOTION = POST-EYE-APPROVAL.** Un'immagine entra nel
   moodboard/canone solo dopo approvazione Director esplicita.
   Nessun PASS del gate interno promuove a ref da solo — il gate
   produce CANDIDATI, il ruling produce CANON.

5. **META — il prompt è la traduzione dei feedback, non il template.**
   La fonte del gusto è il Director; il protocollo serve a non perdere
   i feedback tra iterazioni. Ogni correzione va tradotta in regola
   esplicita e registrata nel ledger — se una regola non deriva da
   una correzione osservata, è template, non canone.

### Sintesi della catena (evidence)
- camp: monotonia alberi → betulle+snag+tronchi variati; tende
  generiche → patchwork, trofei, marchi, rack, ruota, effigie
- gola: puntini bianchi → rimossi; scogliere ripetute → moss-shelf,
  licheni, striature viola, pino contorto
- aqueduct: cielo piatto → aurora sx; violetta decorativa → ether-glow;
  fiori generici → cobalto complementare

## A13 — PARALLAX PLATE: structure AND content (ruling Director 2026-10-26)

Lezioni dell'iterazione ridge P1 → user i3 (piastra larga, strada di
crinale). Il gate strutturale da solo produce "piastre tecnicamente
corrette ma morte".

1. **STRUCTURE PASS ≠ CONTENT PASS.** Layering, focale laterale e
   continuabilità sono necessari ma non sufficienti: sulla stessa
   immagine vanno applicate ANCHE A11 (intreccio) e A12 (storia,
   causa, accento). Due checklist, un giudizio.

2. **AMBIENT = CAUSED BY LIGHT IDENTITY.** Un effetto dell'arsenale
   non si piazza mai "perché c'è": deve appartenere all'ora di luce
   dichiarata. Fireflies azzurre in pieno giorno = rumore; fiori,
   farfalle, polline e dust motes = gli accenti giusti per il giorno.
   Fireflies/moths/embers sono notturni o crepuscolari. Nel prompt:
   nomina l'ancora ambient + perché esiste a quell'ora.

3. **NEAR LAYER = HIGHEST INTEREST DENSITY.** Nel parallasse
   orizzontale il foreground scorre più veloce e occupa più
   tempo-schermo: è lo strato che DEVE portare la ricchezza massima
   — fiori multihue intrecciati, rocce particolareggiate, animali.
   Un foreground-tappeto è la fascia più visibile E più noiosa.
   Metro: "lo strato near regge 30 secondi di scroll?"

4. **ACCENT AT LANDSCAPE SCALE.** L'accento complementare può essere
   un CAMPO, non solo uno spot: la fioritura rossa del pendio (rosso
   vs azure+veronese+ultramarine) è la stessa regola dei fiori cobalto
   dell'aqueduct a scala paesaggio. Ma il dosaggio va verificato:
   accento dominante = overshoot (il Director ha ritirato i2 → i3).
   Regola: "causal accent FIELD mid-distance + multihue weave in
   foreground", mai accento ovunque.

5. **FAUNA = SCALE + STORY + RUNTIME ANCHOR.** Una scena di viaggio
   senza abitanti è una cartolina. Animali che fanno qualcosa (cervi
   che bevono al torrente condiviso coi viandanti) danno scala al
   paesaggio, raccontano il mondo, e sono ancore naturali per motion
   runtime. Nel prompt: "who lives here, where, doing what".

### Sintesi della catena (evidence)
- ridge P1: prato pulito + fireflies diurne + fg vuoto → i3: papaveri
  sul pendio (campo causale), cervi al torrente (fauna+scala), fiori
  viola+gialli nel fg (near-density + weave), rosso ridotto a fascia
  (dosaggio).
- Pattern file: .mw/runs/20261026-learn-parallax-plate/pattern-candidate.md

## A14 — NUMERIC ART CHECK obbligatorio (post-gen, pre-presentazione)

Dopo ogni generazione e PRIMA di sottoporre al Director, eseguire il check
colori quantitativo (script PIL/np: HSV + hue histogram + cell-grid weave).
Soglie di bocciatura (v1, calibrate su batch 2026-10):

- **black** (val<0.13) > 10% → murk vietato
- **brown** (hue 15-45, sat .25-.75, val .18-.62) > 8% → drift marrone
- **grey-flat** (sat<0.15, val>0.4) > 10% → campi morti
- **vibrant** (sat>0.6, val>0.45) < 4% → mancano accenti vibranti
- **hue families** (sat>0.4, val>0.3): almeno 3 famiglie > 3% ciascuna,
  e NON una sola famiglia > 60% (mono-campo)
- **weave**: >= 50% delle celle 40px con >= 2 famiglie hue (intreccio locale)
- **mean val**: fuori banda 0.35-0.7 → troppo scuro/schiarito per il registro

Ogni FAIL si riporta col numero, mai "sembra ok". Il check non sostituisce
l'eye-check Director: lo prepara.

### f2-bottino v1 — primo check A14 (FAIL)
black 22.8% / brown 11.9% / grey 3.1% / vibrant 1.1% /
famiglie: orange 47.7 + yellow 27.3 (warm-dominant, i verdi non passano il
filtro) / weave 66% / mean val 0.28.
→ Bocciata: murk nero al 23%, marrone 12%, vibrante 1.1% — la vigna
veronese/teal della scheda non è uscita; il quadro legge warm-buia.
Iterazione: alzare la fascia veronese/teal, mantenere gli accenti.

## A15 — REF BATTEZZATA OBBLIGATORIA (2026-10-26, ruling Director)

Ogni nuova generazione DEVE allegare una o più immagini già battezzate
come riferimento stilistico — mai solo testo. Ref: `villaggio.png`
(diurno/famiglia), `assalto-goblin.jpg` (azione/bosco), `drago.png`,
`aqueduct` (Prismatic). Il testo porta soggetto+scena+effetti; la ref
porta il registro pittorico. Senza ref = rischio derive "storybook"
(osservato f2_v1, f5_v1).

## Iterazioni quest — pagina evidenzia

Link diretto alla pagina con tutte le iterazioni delle scene Sterminio
goblin (v1→finale, gate per ogni step):

[iterazioni-quest-goblin.html](iterazioni-quest-goblin.html)
(servita da `http://127.0.0.1:8734/iterazioni-quest-goblin.html` quando il
server della gallery è attivo)

## A16 — CHECK ESTESO (2026-10-26, integrazioni Director)

Il check qualitativo non si ferma a famiglie+contatori. Per OGNI immagine:

- **Contrasto per zona**: OGNI zona (sky/mid/low/fg) deve avere vera
  opposizione cromatica — coppie complementari presenti nella STESSA zona,
  non solo varietà globale. Una zona mono-campo è un FAIL anche se le
  altre sono ricche.
- **Cielo mai piatto**: la fascia cielo richiede >=3 famiglie hue + variazione
  interna (gradiente, nuvole diverse, frange). Due colori nel cielo = FAIL
  automatico.
- **Colori = pietre preziose**: nel PROMPT e nel check la vibranza va
  descritta in linguaggio gemma — sapphire/azure, emerald/veronese,
  ruby/cinnabar, amber/topaz, amethyst/violet. "Vibrante" da solo non basta:
  ogni accento deve leggersi come gemma incastonata nel campo.
- **Armonia, non solo diversità**: controllare che le hue presenti stiano
  BENE insieme — contrasto complementare deliberato + sfumature analoghe
  coerenti dentro ogni campo (es. verdi che degradano lime→veronese→teal
  NELLO STESSO prato). Diversi colori messi insieme a caso = FAIL anche se
  i conteggi passano. La domanda del check è "queste sfumature convivono?",
  non "quanti colori ci sono?"
- **Impasto**: cell-std proxy >= ~20 per registro materico; sotto ~15 la
  superficie legge liscia/digitale.

## A17 — PALETTE PROFILO vs REF + VITA (2026-10-26, lezione batch goblin)

Le scene fallite non erano "palette sbagliate" nei conteggi — erano
monoculture senza vita. Regole nuove, tutte misurabili o verificabili:

- **Profilo 3-band vs ref**: misurare warm(0-60°) / green(60-190°) /
  cool(190-360°) sui pixel sat>0.3 — confrontare col ref battezzato dello
  stesso ambiente. Scene bosco: cool <8% = FAIL (manca cielo/acqua/apertura);
  green >55% con warm+cool deboli = monocultura FAIL.
- **Vibrante = gemma, non metrica**: il check "vibrant" non basta — ogni
  scena DEVE avere elementi-vita nel prompt E nell'immagine: fauna piccola
  (lucertole, uccelli, insetti, api, mammiferi), funghi colorati, fiori,
  specchio d'acqua, piante non-verdi. Verde-ovunque = morta.
- **Elementi con perché**: oggetto senza motivo narrativo = errore
  (coperta sollevata da sola, nebbia arancione inspiegata). Ogni cosa
  nella scena deve avere causa nella fiction.
- **Movimento soggetto**: "fuga disordinata" = direzioni DIVERSE, non un
  gruppo che corre in parallelo. Le azioni di massa vanno scomposte.
- **Identità figure**: sagome anonime = FAIL. I goblin sono raider — hanno
  colori/attributi che li mimetizzano nel verde MA con identità (marchi,
  trofei, equipaggiamento).
- **Cielo**: >=3 famiglie + variazione interna; lampo/evento atmosferico
  ammesso quando motivato (agguato → lampo in lontananza).
- **Edit vs regen**: migliorare l'originale battezzato quando esiste
  (ritorno v1 era già golden-hour giusta — rigenerare ha perso qualità).
- **Una conversazione per scena** — mai condividere chat tra soggetti.

Soglie check esteso (v2): green-scale vs ref ±10pt, cool >=8% outdoor,
vibr >=4% E almeno 3 elementi-vita verificabili a vista, almeno 1 coppia
complementare per zona, impasto-std >=20.

## Enforcement meccanico (2026-10-26)

Il check NON è opzionale: `python scripts/check-scene-art.py <img> [refs]`
è uno step obbligatorio del flusso di generazione — i numeri vanno nel
report al Director. Markdown solo = si dimentica (dimostrato in batch).

## A18 — CHIOME DIVERSE (2026-10-26, ruling Director)

Gli alberi non hanno mai tutti la stessa foglia: ogni scena bosco deve
avere chiome SPARSE ma presenti di colore diverso — betulle pallide,
chiome turchese, aceri cremisi/gialli. Pochi esemplari, sparsi, ma devono
esistere. Una selva uniformemente verde = FAIL.
