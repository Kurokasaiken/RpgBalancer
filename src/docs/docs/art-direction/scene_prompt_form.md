# Scene Prompt Form — template obbligatorio di compilazione

Ogni prompt di scena si costruisce compilando **questo form**, campo per
campo, in ordine. Un campo vuoto o compilato "a memoria" è un FAIL prima
della generazione (R4bis preflight). Il blocco `text` finale del
`prompt.md` nasce fondendo i campi compilati — mai prose ad-hoc in chat.

Riferimenti canonici: regole in
[`scene_prompt_authoring_guide.md`](./scene_prompt_authoring_guide.md);
Motore di Unicità in `art_direction_plan.md` §10; esempi approvati in
`public/docs/prompts/prompt_library.md`.

---

## F1 — TITOLO

**Cosa:** nome della scena in CAPS + trattino lungo, prima riga del blocco.
**Come:** `NOME — A masterful cinematic oil painting in heavy textured
impasto:` — il medium apre SEMPRE, prima del soggetto (R9 medium-first).
**Esempio (approvato):** `HIDDEN CACHE — A masterful cinematic oil
painting in heavy textured impasto: thick, violent palette-knife
strokes, visible layers of paint adding physical depth.`
**Fallimento se manca:** il generatore legge il prompt come descrizione
fotografica, non come quadro — flat digital.

## F2 — SUBJECT + BEAT

**Cosa:** cosa si vede, dal testo authored (R0); SOLO il beat
pre-scelta/pre-check (R1). Enumerazione materiale fitta: ogni elemento
porta **materia + comportamento della luce**, non solo il nome.
**Come si descrive:** non «a stash in a pit» — «a hollow dug between
root flares, its rim of wrenched roots and black loam still fresh».
Ogni oggetto prende un aggettivo di materia (wrenched roots, split
canvas, dull copper) e, se serve, un comportamento alla luce (a metal
edge catching the dapple).
**Esempio (approvato, f2-bottino):** «at lower-center an unmistakable
hollow dug between root flares — its rim of wrenched roots and black
loam — and inside the shadow a humble stash: a carved wooden idol with
amber eyes, a green-glass vial, a bone whistle, a lumpy leather purse
with copper coins spilling across a fold of torn hide».
**Fallimento se manca:** il modello inventa il soggetto — fiction-sbagliata
(o scena bella ma del nodo sbagliato).

## F3 — SIGNATURE HOOK

**Cosa:** UN dettaglio visivo memorabile, il test è «cosa ridisegnerebbe
un bambino a memoria». Obbligatorio (R4bis-9) — un quadro senza hook è
bocciato anche se corretto.
**Esempio (approvato, f3-accampamento):** «THE SIGNATURE: a crude lookout
tower, a watch-post of lashed saplings and planks built up the side of
the tallest pine».
**Fallimento se manca:** scena corretta ma morta (fagotto grigio, 2026-10-24).

## F4 — COMPOSITION

**Cosa:** POV + focal point + asimmetria (mai centrato statico) +
occludente/massa dove l'archetype lo chiede. In termini pittorici, MAI
percentuali/coordinate (R9 REG-NUM) — «lower-center», «left third»,
«framed by», «edge of frame».
**Esempio (approvato):** «hidden watcher's-eye view — the whole frame
seen through a dark foliage vignette, the camp below and off-center».
**Fallimento se manca:** soggetto centrato, orizzonte inventato, cornice
vuota.

## F5 — MOTION NATURE (solo se c'è azione)

**Cosa:** la natura del moto — caos vs fila, dispersione vs assalto
compatto (R4bis-11).
**Esempio (approvato, f5-incalzare):** «the goblins break in chaos —
each running a different way into the trunks, no two aligned».
**Fallimento se manca:** fila meccanica = morto ("tutti nella stessa
direzione").

## F6 — MOOD

**Cosa:** DUE emozioni specifiche («X + Y»), mai "epic/dark/mysterious".
**Esempio (approvato):** «relief + residual dread» · «reverence +
fragile countdown».
**Fallimento se manca:** scena tecnicamente giusta ma emotivamente piatta.

## F7 — TECHNIQUE / STYLE

**Cosa:** il blocco impasto/split-rendering, aggressivo e mai hedged
(R5-4, R9): «thick, violent brushstrokes, visible layers of paint» —
MAI «in the … tradition». Chiusura obbligatoria: «the world rendered
as rude beauty — weathered and tactile, never squalid».
**Anchors artisti:** Jaime Jones (materia/impasto), Jeff Easley (peso),
Sparth (scala monumentale su wide vista), Justin Gerard (creature —
obbligatorio se la scena ne ha: «grotesque but vibrant, never horror»),
Ruan Jia (solo punti focali puliti — volti).
**Fallimento se manca:** flat digital, tecnica diluita.

## F8 — LIGHTING

**Cosa:** l'evento luce proprio della scena (libera — non Solar Triumph
forzato), ma dove la narrativa lo permette: una sorgente forte dipinta.
**Come si descrive:** non «nice light» — «a single raking fire from
frame-left catching trunk edges amber» / «blinding white midday sun
breaking through the canopy in prismatic shafts». La sorgente dipinta
alimenta poi l'FX runtime (glow/embers/shaft) — «paint only the light
SOURCE», le particelle non si dipingono (R9).
**Fallimento se manca:** luce piatta uniforme = look digitale.

## F9 — PALETTE (blocco dedicato, obbligatorio)

**Cosa:** pigmenti di bibbia declinati sulla scena, con dominanza
dichiarata (R4bis-10: la massa dominante è SEMPRE un pigmento bibbia,
mai un neutro/ocra/bruno).

### I pigmenti Wanderlust (SSoT — non si inventano colori nuovi)

| Pigmento | Come lo scrivi nel prompt | Dove sta |
|---|---|---|
| **Ultramarine** (blu oltremare) | `ultramarine depth`, `ultramarine fall-water`, `deep ultramarine pit shadow` | profondità, acqua, distanze |
| **Verde Veronese** | `veronese-green foliage`, `Veronese ferns`, `emerald moss` | vegetazione dominante |
| **Rosso Cinabro** | `cinnabar silk`, `one cinnabar accent`, `cinnabar banner` | L'UNICO accento caldo saturo |
| **Ambra** | `amber firelight`, `captured gold sunlight`, `amber eye-gleam`, `amber and copper` | sorgenti luce, metalli, occhi |
| **Ombre** | `deep teal-emerald shadows`, `turquoise in the deepest fold`, `smeraldo` | SEMPRE — mai grey/brown/black |
| **Luce** | `blinding white light from above, prismatic dust motes` | Solar Triumph dove narrativa regge |
| **Cielo** | `vibrant azure sky` | solo se il cielo è visibile (§1A) |

### Materiali del mondo (vocabolario materico, bibbia §1)

`golden thatch` (mai "thatch") · `timber` · `alpine stone` ·
`Baroque Sun-Bronze` (mai "armor") · `Dolomites peaks` ·
`crystal-clear river` · `prismatic dust motes` · `pietra alpina` ·
`basalto venato` · `seta iridescente` · `alabaster weathered` ·
`antique bronze` · `black loam` · `bone` · `copper`

**Esempio compilato (approvato):** «PALETTE: emerald moss and
veronese-green ferns dominant, ultramarine depth in the pit shadow,
copper and bone-amber as accents — deep teal-emerald shadows, never
grey, never brown, NO mud. The frame stays luminous and high-chroma —
light wins over darkness, even the deepest shadow is saturated color,
never black murk.»
**Clausola obbligatoria (verbatim):** «The frame stays luminous and
high-chroma — light wins over darkness, even the deepest shadow is
saturated color, never black murk.»
**Fallimento se manca:** murk, ocra dominante, palette inventata.

## F10 — NEGAZIONI INLINE (CAPS)

**Cosa:** ≥1 divieto cardine in CAPS *dentro* il flusso dove conta
(Q9) — `NO TRAVELERS`, `NO BLADE HAS MET YET`, `NO HEROES` —
non solo in coda.
**Fallimento se manca:** il generatore disegna il party/figure non volute.

## F11 — KILL LIST FINALE (verbatim, integrale)

Copiata TAL QUALE da R5.7, mai riscritta a memoria:
`NO grim, NO gore, NO decay, NO mud, NO symmetry, NO flat digital,
NO airbrushed smoothness, NO sci-fi, NO text/UI/watermarks/frames/
signatures/logos` + ban specifici della scena.
`NO signature` sempre: i generatori appicciano firme fake quando il
prompt nomina artisti.
**Fallimento se manca:** firme «JONES», cornici card arrotondate, testo.

## F12 — ASPECT

**Cosa:** dettato dal componente di destinazione, mai a sentimento.
Scene theatre (`StageBand`/`TransitView`) e cover card → **21:9
cinematic scope**. Per wide-plate parallax (PLAN-087): «extra-wide
panoramic format, twice normal width».

## F13 — Tags riuso (nel file, sotto il blocco)

`**Tags riuso:**` con setting/soggetto/figure/ora/creature (R7) —
mai tag narrativi quest-unici.

---

## Compilazione → blocco prompt

Ordine fisso nel fenced `text` (R5): `F1` → `F7` medium+tecnica in
apertura → `F2` SUBJECT (con F10 inline) → `F3` hook → `F4` composition
→ `F5` motion se c'è → `F8` lighting → `F9` palette+clausola → `F6`
mood → `F11` kill list → `F12` aspect. ~200–260 parole, prosa unica
con ancore CAPS.

## Preflight (blocca prima di generare)

`python scripts/lint-scene-prompts.py` verde + R4bis checklist manuale:
luminosità, pigmenti, cielo, direzione azione, 4 assi, kill list
integrale, ref-hygiene, formato, canale=blocco lintato, hook,
dominanza, moto.

---

## Quanti prompt servono (risposta a «x fare questo lavoro quanti
prompt ti servono»)

Il form si riempie da esempi approvati — copertura per categoria:

| Categoria | Esemplare approvato esistente | Stato |
|---|---|---|
| Ground-level detail | f1-tracce (orme nel muschio) | ✅ |
| Hidden-cache close-up | f2-bottino (idolo+fiala+rame) | ✅ |
| Watched-from-cover vista | f3-accampamento (torre su pino) | ✅ |
| Notte con clausola luminosità | f5-incalzare (torcia caduta) | ✅ |
| Search-and-find rovine | saccheggio (ritrovamenti sparsi) | ✅ |
| Wide-plate sanctuary/day | santuario-valle (Rivendell test) | ✅ pilota |
| Wide vista impero | library «Verso Mordor»/«Impero del Sole» | ✅ |
| Creatura | Cervo-Faro (§10.5) | ✅ |
| **Mancanti** | | |
| Interior/architettura interna | — | da creare quando serve |
| Artifact/still-life singolo | — | da creare quando serve |
| Crowd/NPC-allowed | — | da creare quando serve |
| Underwater/special env | — | da creare quando serve |

→ **Copertura attuale: 8 categorie su ~12.** Il form sta in piedi con
gli esistenti; le 4 categorie mancanti si aggiungono quando la quest
le richiede (nuovo esemplare → entra nella libreria approvati).
