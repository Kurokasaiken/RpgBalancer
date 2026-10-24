# Scene Prompt Form v2 — template obbligatorio di compilazione

Ogni prompt di scena si costruisce compilando **questo form**, campo per
campo, in ordine. Un campo vuoto o compilato "a memoria" è un FAIL prima
della generazione (R4bis preflight). Il blocco `text` finale del
`prompt.md` nasce fondendo i campi compilati — mai prose ad-hoc in chat.

**Principio guida (ChatGPT, canary-verified):** il form specifica
l'*esito visivo richiesto* dell'immagine — non solo la lingua usata per
descriverlo. Da template di scrittura a strumento di art direction.

Riferimenti canonici: regole in
[`scene_prompt_authoring_guide.md`](./scene_prompt_authoring_guide.md);
Motore di Unicità in `art_direction_plan.md` §10; esempi approvati in
`public/docs/prompts/prompt_library.md`.

---

## I 4 JOB del form

Il form è diviso in quattro aree di controllo — un prompt che mescola
i job senza ordine produce failure che si nascondono l'uno sotto l'altro:

```
JOB 1 — CONTENT AUTHORITY     cosa esiste, cosa non, cosa non inventare
JOB 2 — VISUAL HIERARCHY     cosa si legge prima, cosa sopravvive al crop
JOB 3 — RENDERING & COLOR    impasto, murk, palette, ombre
JOB 4 — INTEGRATION GEOMETRY crop, parallax, occluder, reveal
```

---

# JOB 1 — CONTENT AUTHORITY

## A1 — SCENE IDENTITY (era F1)

**Cosa:** nome della scena in CAPS + trattino lungo, prima riga del blocco.
**Come:** `NOME —` e basta. Il medium non va qui (era dentro F1 v1 —
era una doppia autorità con F7, causa della diluzione rilevata da
Gemini+DeepSeek). Il medium-first lo dichiara **C1**, non A1.
**Esempio:** `HIDDEN CACHE —`
**Fail se manca:** nessuna.

## A2 — SUBJECT + BEAT (era F2)

**Cosa:** cosa si vede, dal testo authored (R0); SOLO il beat
pre-scelta/pre-check (R1). Enumerazione materiale fitta: ogni elemento
porta **materia + comportamento della luce**, non solo il nome.
**Come:** non «a stash in a pit» — «a hollow dug between root flares,
its rim of wrenched roots and black loam still fresh». Ogni oggetto:
aggettivo di materia + luce.
**Esempio (approvato, f2-bottino):** «at lower-center an unmistakable
hollow dug between root flares — its rim of wrenched roots and black
loam — and inside the shadow a humble stash: a carved wooden idol with
amber eyes, a green-glass vial, a bone whistle, a lumpy leather purse
with copper coins spilling across torn hide».
**Fail se manca:** il generatore inventa il soggetto.

## A3 — CLOSED INVENTORY (nuovo — Claude/ChatGPT)

**Cosa:** clausola positiva che chiude l'inventario: «the ONLY inhabitants
and props are those listed» + conteggio esatto se rilevante.
**Come:** «exactly three tents, no more; the only figures are the two
described goblins».
**Esempio (da aggiungere come nuova voce):** «exactly the items listed
above, nothing else enters the frame».
**Fail se manca:** il modello aggiunge soggetti inventati.

## A4 — INLINE CAPS BANS (era F10)

**Cosa:** ≥1 divieto cardine in CAPS *dentro* il flusso dove conta
— `NO TRAVELERS`, `NO HEROES`, `NO OTHER HANDS` — non solo in coda.
**Fail se manca:** il generatore disegna il party/figure non volute.

## A5 — LOOT SPECIFICITY (nuovo — Claude)

**Cosa:** ogni oggetto porta un attributo non-generico (chipped,
rune-scored, wax-sealed, lashed, scorched) + banned-generic-nouns.
**Banned nouns:** plain "potion", "gold coins", "sack", "chest",
"treasure", "goods" — mai da soli.
**Esempio corretto:** «a rune-scored bronze whistle», non «a whistle».
**Fail se manca:** generic merchant goods invece di loot interessante.

## A6 — MOTION NATURE (era F5)

**Cosa:** se c'è azione, la sua natura — caos vs fila, dispersione vs
assalto compatto (R4bis-11). Se non c'è azione, si omite.
**Esempio (approvato, f5-incalzare):** «the goblins break in chaos —
each running a different way into the trunks, no two aligned».

---

# JOB 2 — VISUAL HIERARCHY

## B1 — SIGNATURE HOOK (era F3, rafforzato)

**Cosa:** UN dettaglio visivo memorabile, il test «cosa ridisegnerebbe
un bambino a memoria». Deve essere un **subset di A2** (DeepSeek: hook
e soggetto non devono divergere) e sopravvivere a **thumbnail** (Claude:
deve leggere anche in miniatura).
**Esempio (approvato, f3-accampamento):** «THE SIGNATURE: a crude
lookout tower of lashed saplings built up the side of the tallest pine».
**Fail se manca:** scena corretta ma morta.

## B2 — COMPOSITION (era F4)

**Cosa:** POV + focal point + asimmetria, in termini pittorici —
«lower-center», «left third», «framed by», «edge of frame». MAI
percentuali/coordinate (R9 REG-NUM).
**Regola negativa (DeepSeek):** `NO CENTERED FOCAL POINT` nella
kill list — il generatore va al centro se non lo vieti.
**Fail se manca:** soggetto centrato, orizzonte inventato.

## B3 — VALUE PLAN (nuovo — Claude)

**Cosa:** 3 valori dichiarati — massa dominante, massa secondaria,
accento — che garantiscono la gerarchia a scala di grigi.
**Come:** «dominant: deep teal shadow half-tones; secondary: emerald
foliage mid-value; accent: cinnabar/amber hot points».
**Fail se manca:** murk di valori, non solo di hue — il quadro resta
leggibile anche desaturato.

---

# JOB 3 — RENDERING & COLOR

## C1 — MEDIUM + TECHNIQUE (era F1+F7, unificati)

**Cosa:** il medium apre la frase — «A masterful cinematic oil painting
in heavy textured impasto: thick, violent palette-knife strokes, visible
layers of paint adding physical depth» — poi la tecnica: impasto Jaime
Jones / Jeff Easley, split-rendering Ruan Jia solo sui punti focali,
Sparth per wide vista, Justin Gerard obbligatorio se creature presenti.
**Chiusura obbligatoria:** «the world rendered as rude beauty —
weathered and tactile, never squalid».
**Fail se manca:** flat digital, tecnica diluita.

## C2 — PALETTE + BROWN-GUARD (era F9, rafforzato)

**Cosa:** pigmenti di bibbia declinati sulla scena + **tabella
materiale→resa satura** per ogni materiale terroso (Claude:
nessun materiale ammesso senza traduzione).

### Pigmenti Wanderlust (SSoT)

| Pigmento | Come lo scrivi | Dove sta |
|---|---|---|
| **Ultramarine** | `ultramarine depth`, `ultramarine fall-water`, `deep ultramarine` | profondità, acqua, distanze |
| **Verde Veronese** | `veronese-green foliage`, `emerald moss` | vegetazione dominante |
| **Cinabro** | `one cinnabar accent`, `cinnabar silk` | L'UNICO accento caldo |
| **Ambra** | `amber firelight`, `captured gold sunlight`, `amber eye-gleam` | sorgenti luce, metalli, occhi |
| **Ombre** | `deep teal-emerald shadows`, `turquoise in the deepest fold` | SEMPRE — mai grey/brown |
| **Luce** | `blinding white light from above, prismatic dust motes` | Solar Triumph dove serve |
| **Cielo** | `vibrant azure sky` | solo se visibile |

### Materiali del mondo (bibbia §1)

`golden thatch` · `timber` · `alpine stone` · `Baroque Sun-Bronze` ·
`Dolomites peaks` · `crystal-clear river` · `prismatic dust motes` ·
`basalto venato` · `seta iridescente` · `alabaster weathered` ·
`antique bronze` · `black loam` · `bone` · `copper`

### Brown-guard (materiale terroso → resa satura obbligatoria)

| Materiale terroso | Resa satura obbligatoria |
|---|---|
| loam/soil | `loam rendered in deep violet-umber`, `black loam` |
| timber/wood | `amber-lit timber over teal-emerald` |
| leather | `amber and cinnabar highlights on worn leather` |
| dirt/earth | `teal-emerald loam flecked with veronese` |
| brown bark | `mossy umber where the umber reads warm-amber, not grey` |

**Clausola obbligatoria (verbatim):** «The frame stays luminous and
high-chroma — light wins over darkness, even the deepest shadow is
saturated color, never black murk.»
**Fail se manca:** murk, ocra dominante, palette inventata.

## C3 — LIGHTING (era F8)

**Cosa:** l'evento luce proprio della scena — sorgente forte dipinta
dove la narrativa lo permette.
**Come:** «a single raking fire from frame-left catching trunk edges
amber» / «blinding white midday sun breaking through the canopy in
prismatic shafts». `Paint only the light SOURCE` — le particelle non si
dipingono (R9), sono overlay runtime.

## C4 — MOOD → VISUAL MODIFIERS (era F6)

**Cosa:** non solo due emozioni — le emozioni **tradotte in modificatori
visivi concreti** (Gemini: le emozioni astratte fanno poco al modello).
**Come:** non «relief + residual dread» — «quiet posture and warm
slanted light across the moss floor, sharp back-shadows where the
hidden eye would be».
**Fail se manca:** scena emotivamente piatta.

---

# JOB 4 — INTEGRATION GEOMETRY (parallax-ready)

## D1 — CANVAS GEOMETRY (nuovo — ChatGPT)

**Cosa:** dimensioni e ratio dichiarati, e dove la finestra si croppa.
**Come:** «one continuous extra-wide canvas, [2x / 3x] normal width;
the left [one-third / half] is the occluder mass; the remaining
[two-thirds / half] is the scene».
**Fail se manca:** il generatore non sa che è una tela per il crop —
produce il frame normale.

## D2 — OCCLUDER ZONE (nuovo — ChatGPT)

**Cosa:** il mass occluder — posizione, dimensione della finestra
coperta, silhouette, trattamento bordo.
**Come:** «a broad, irregular foreground mass of `<pigment>` and
`<matter>` covering the left third, its edge a ragged painted fringe».
**Fail se manca:** l'occluder esce rettangolare o manca.

## D3 — REVEAL ZONE (nuovo — ChatGPT)

**Cosa:** cosa c'è nell'area che si rivela — gerarchia focale dentro
il crop.
**Fail se manca:** il reveal mostra contenuto a caso.

## D4 — HIDDEN SUBJECTS (nuovo — ChatGPT)

**Cosa:** entità camuffate nella scena — quante, dove, grado di
occlusione (distinguibili vs scopribili-solo-nel-reveal).
**Esempio (approvato, agguato):** «goblin silhouettes barely
discernible inside the painted fern mass — discoverable on second
look, never spotlighted».
**Fail se manca:** i nascosti si mostrano troppo o troppo poco.

## D5 — CROP CONTRACT (nuovo — ChatGPT)

**Cosa:** cosa ogni crop DEVE contenere e cosa DEVE escludere.
**Fail se manca:** il crop taglia il soggetto o include ciò che non
doveva entrare.

## D6 — CONTINUITY CONTRACT (nuovo — ChatGPT)

**Cosa:** prospettiva, luce, materia e trattamento **identici** tra
occluder e scena — niente discontinuità.
**Clausola:** «NO hard vertical seam, NO abrupt compositional reset,
NO subject unintentionally clipped by a crop boundary».
**Fail se manca:** il panel legge come pannello, non come parte della
tela.

## D7 — PARALLAX DEPTH (nuovo — ChatGPT/Gemini)

**Cosa:** assegnazioni FG/MG/BG e quali forme si muovono / a che
velocità relativa.
**Come:** «foreground occluder: root-ball at frame-left; mid-ground:
fern band; background: treeline and sky».
**Fail se manca:** il parallasse non ha layer chiari.

## D8 — ASPECT + REUSE TAGS (era F12+F13)

**Cosa:** `21:9` per scene theatre / cover band; `extra-wide panoramic`
per parallax plates. Sotto il blocco: `**Tags riuso:**` con
setting/soggetto/figure/ora/creature (R7).

---

## Kill list finale (verbatim — mai riscritta)

`NO grim, NO gore, NO decay, NO mud, NO symmetry, NO flat digital,
NO airbrushed smoothness, NO sci-fi, NO text/UI/watermarks/frames/
signatures/logos, NO CENTERED FOCAL POINT` + ban specifici della scena
+ `NO signature` sempre (il generatore appiccia firme fake).

---

## Compilazione → blocco prompt

Ordine di assemblaggio nel fenced `text`:
`A1` (title) → `C1` (medium+tecnica) → `A2` SUBJECT (con A4 inline,
A5 loot specificity) → `B1` hook → `B2` composition (+B3 value plan)
→ `A6` motion se c'è → `C3` lighting → `C2` palette+clausola → `C4`
mood-modifiers → `D1..D7` se la scena è parallax → kill list → aspect.
~200–280 parole, prosa unica con ancore CAPS.

## Preflight

`python scripts/lint-scene-prompts.py` verde + R4bis checklist +
(aggiunta v2): `CLOSED INVENTORY` presente, `BROWN-GUARD` tabella
compilata se ci sono materiali terrosi, `VALUE PLAN` dichiarato,
`D1..D7` compilati solo se la scena è parallax.

---

## La libreria esemplari (10, non 8 — ChatGPT)

| # | Categoria | Esemplare |
|---|---|---|
| 1 | Ground-level detail | f1-tracce |
| 2 | Hidden-cache close-up | f2-bottino |
| 3 | Watched-from-cover vista | f3-accampamento |
| 4 | Notte/luminosità | f5-incalzare |
| 5 | Search-and-find | saccheggio |
| 6 | Wide-plate sanctuary | santuario-valle |
| 7 | Wide vista impero | library «Verso Mordor» |
| 8 | Creatura | Cervo-Faro (§10.5) |
| 9 | **Parallax occluder/reveal** | da creare (il prossimo pilota) |
| 10 | **Rendering stress test** | da creare |

Mancanti (da creare al bisogno): interior, artifact/loot-distinctive,
crowd/NPC, underwater.
