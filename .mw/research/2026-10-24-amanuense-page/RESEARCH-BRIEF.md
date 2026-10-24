# R-279 — "Pagina dell'Amanuense": research brief (pre-debate)

**Director ruling (2026-10-24):** pagina a SINISTRA · skill check resta a destra · TRANSIENTE.
**Estetica richiesta:** «molto bella, molto carica, come nei cartoon rappresentano un libro delle fiabe — lettere complesse con illustrazioni, bordi illustrati, ghirighori sotto, molto barocco».

## Il referente storico giusto non è il manoscritto medievale: è la pagina-fiaba cinematografica

- **Eyvind Earle / Sleeping Beauty (1959)**: il prop storybook del film — pagine dipinte a mano ispirate a manoscritti pre-rinascimentali, copertina in ottone sbalzato e "gemme". È IL benchmark: non accuratezza storica ma *fiaba idealizzata*. Fonte: thewaltdisneycompany.com/news/disney-sleeping-beauty-anniversary.
- **Pentiment (Obsidian, 2022)**: Lettermatic ha disegnato ~2700 glifi in 5 famiglie — una "voce" tipografica per classe sociale (Peasant, Cursive, Humanist, Printed, Textura). Lezioni:
  1. *il font è il casting* — la mano dello scriba racconta chi scrive;
  2. *"beautiful inconsistency"* — una mano vera non ripete mai la stessa lettera: legature, alternate, variazione d'inchiostro;
  3. *autenticità, non accuratezza* — lettere storiche ammorbidite per un lettore moderno.
  Fonte: lettermatic.com/custom/pentiment.
- Il dialogo di Pentiment si *scrive lettera per lettera* davanti al giocatore — il reveal "la penna che scrive" è la firma dell'amanuense.

## Ingredienti tecnici (web/React)

| Ingrediente | Tecnica candidata | Note |
|---|---|---|
| Capolettera istoriato (lettera illustrata) | `<img>/<svg>` float + `shape-outside` (wrap organico) o `shape-margin`; alternativa `::first-letter` + `initial-letter` | `initial-letter`: supporto scarso (Chrome) → fallback float. L'immagine istoriata batte il font drop-cap: è il "carico" chiesto. |
| Font corpo | umanistica/corsiva leggibile (Almendra, IM Fell English, EB Garamond, Alegreya) | NO textura/blackletter nel corpo: illeggibile per testi lunghi in italiano. Blackletter solo per titolo/colofone (UnifrakturMaguntia). |
| Font display | versali decorati (Cinzel Decorative, MedievalSharp, Pirata One, Germania One) | per il titolo della pagina. |
| Bordo illustrato | 9-slice: 4 angoli istoriati + 4 fasce laterali (vigneti/acanto) ripetute — `border-image` o composizione SVG | il barocco vive negli angoli; le fasce possono essere più sobrie. Filtro `feTurbulence`+`feDisplacementMap` per bordi "inchiostrati" (tecnica astro-candlelight). |
| Ghirigori sotto | fleuron/svolazzi calligrafici SVG dopo l'ultimo capoverso + catchword in basso a destra | nei manoscritti: explicit, colofone, catchword, correzioni a margine. |
| Pergamena | texture raster o `feTurbulence` procedurale (già usato in QuestChronicle NOISE_SVG) + vignettatura bordi + macchie d'età | grana di vello, bordi bruniti. |
| Rubricatura | parole chiave in rosso cinabro/blu cobalto | nei manoscritti: rosso = titoli/rubriche, alternanza rosso/blu sui pilcrow ¶. |
| Reveal | comparsa "inchiostro che si scrive" (mask reveal riga per riga) o slide-in della pagina | il reveal calligrafico è IL momento magico; budget: reduced-motion fallback. |
| Marginalia | doodle/miniature a margine legate alla scena | massimo "carico": annotazioni dello scriba, schizzi di goblin. |

## Asset già disponibili / strade di produzione

- **`adrian729/medieval-ornaments` (npm)**: cutout di manoscritti British Library (public domain) + ornamenti acanto/edera, regole oro, fleuron — asset pronti, licenza PD.
- **British Library Catalogue of Illuminated Manuscripts / medieval-cutouts**: >1M immagini PD — capilettera istoriati ritagliabili.
- **Pipeline AI esistente nel progetto** (mockup-generator, import-clouds.mjs): generare capilettera istoriati e bordi nello stile della mappa (china+acquerello) — coerenza stilistica col world surface, ma più lavoro.
- **gutenberg-css** (repo): riferimento per geometria di pagina — due colonne, rubriche, catchword, colofone.

## Vincoli di progetto (invariants)

- Skin/visual → preset in `skinConfigRegistry` + token `--skin-*`, MAI `.css` standalone.
- Stringhe → i18n (`LoreDrop.titleKey`/`bodyKey` già config-first) o authored-content come `node.body`.
- Reuse: `HudPlaque`, `MatericSurface`, `SkinScope`, `FloatingPanel` grammar; la pagina è un NUOVO componente → verifica primitives prima.
- Layout: ala sinistra — CompanionLeft zone o banda dedicata; coesistenza col right wing `QuestSkillCheckColumn` (cluster solver PLAN-043).
- Foreground: preview solo in Devin Preview tab / headless.
- T-04: claim visivi chiusi solo con un testimone che vede (Director eye-check o review page con immagini).

## Domande per il dibattito multi-AI

1. Composizione della pagina: quanta "carica" prima che la leggibilità crolli? (bilanciamento bordo/corpo)
2. Capolettera istoriato: un set di 26 lettere PD, lettere generate AI per-scena, o capolettera generico riusato?
3. Reveal: scrittura progressiva dell'inchiostro — wow o attrito sulla seconda apertura?
4. Forma: pagina singola che scrolla, foglio che si gira, o colonna che cresce coi nodi?
5. Ancoraggio a sinistra: banda separata vs tab dentro CompanionLeft — impatto sul cluster solver.
