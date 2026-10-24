# PLAN-087 — Two-Plate Generation Convention

**Status:** draft
**Source:** Director 2026-10-24 + The Bazaar research (Spine/puppetry insight)
**Scope:** scene authoring pipeline — prompt lint + manifest contract

## Problema

Ogni volta che una scena deve rivelare/muovere qualcosa (goblin, pietra,
loot) siamo costretti a estrarre il pezzo dall'immagine cotta — crop +
feather = qualità da sticker. L'errore strutturale è stato provare a
"togliere" dal piatto; la soluzione è generare il pezzo *separato*.

## La convenzione (una riga)

Se una scena ha `reveal`, `panelSrc`, o un pezzo mobile nel suo contract,
il prompt produce **due lastre**:

| Lastra | Contenuto | Uso |
|---|---|---|
| **base** | la scena completa, come sempre | il dipinto normale |
| **mobile** | il pezzo che deve muoversi — dipinto da solo, sfondo piatto o alpha, stessa palette/stroke | sprite runtime |

Il pezzo mobile non è ritagliato — è dipinto **da zero** con lo stesso
stile e la stessa luce, ma libero di muoversi in runtime.

## Effetti sbloccati (il perche')

| Effetto | Prima | Con 2-plate |
|---|---|---|
| Goblin rivelati | crop+feather (bordo duro) | sprite dipinti a parte — entry pulita |
| Pietra/pannello | clip-path della lastra | pannello con alpha che slitta nativo |
| Ombre/movimento | impossibile | secondo layer che si muove |
| Multi-layer parallax | solo depth-map | depth + 1-2 cutout su piani diversi |

## Regola lint

Nuova voce nel prompt-lint: se il brief dichiara `reveal`, `panelSrc`,
`foregroundCutout`, o un "pezzo mobile" → il prompt.md deve elencare la
seconda lastra (es: `PLATE B — il goblin che si alza, sfondo piatto`).

## Manifest

`reveal.mobilePlate` opzionale → src del pezzo separato. Per ora i casi
d'uso concreti sono: agguato (goblin), bottino (il tell del segreto se
vogliamo muoverlo), gola (se la coulisse diventa revealabile).

## Fuori scope

- Il revealFX sprites/strips già implementato resta — questa convenzione
  gli dà sorgenti migliori, non sostituisce il meccanismo.
- Non introduce nuovi renderer — i pezzi sono sprites DOM, stesso layer.

## Test plan

- F2: bottino — il "tell" (barlume) come lastra separata che si muove
- F7: agguato — il pezzo mobile vs i sprite estratti (confronto eye-check)

## Addendum — Wide-Plate Convention (Director 2026-10-24)

Regola di generazione: le scene con cover/reveal si generano **molto più
larghe** dello stage (~2.3x, es. 6300×1344) — il terzo sinistro è il
foreground-cover (roccia/massa), il terzo destro la scena vera. **Noi
croppiamo**: `panel = wide[0:panelW]` + `scene = wide[panelW-overlap:]`.
Coincidenza al pixel per costruzione, niente outpainting (Gemini non lo fa),
parallasse gratis sull'extra. Si applica a tutte le generazioni con reveal
da ora in poi.
