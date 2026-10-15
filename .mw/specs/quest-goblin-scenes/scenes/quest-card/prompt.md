# Quest card — Il totem → `quest-card.png`

Card del quest picker. Soggetto: totem da guerra goblin — l'iconicità è
nell'oggetto artigianale, non nella creatura (archetipi temporanei, R-172).
Coerente con la scheda `creatures/goblin` v0.1.0: war-paint ocra/cremisi,
legno grezzo, corda. Alternativa a costo zero: riusare l'asset già generato
`ART.goblinTotem` (`/mockups/goblin-invasion-painted/goblin-invasion-hero.png`).

## Full prompt — generatori esterni (Gemini / Grok / GPT)

```text
QUEST CARD — A crude goblin warband totem painted as a game card illustration, standing against a deep forest edge. SUBJECT — the totem, inanimate object, tribal craft, handmade superstition: a carved wooden mask lashed to a tall pole, fierce slanted eyes, sharp cheekbones, pointed wooden ears, painted Veronese green with ochre-and-crimson war-stripes; cinnabar tattered banners, braided cord, feathers, wooden spears bound together at its base. COMPOSITION centered but deliberately asymmetric, banners torn on one side, the forest a deep mass behind. LIGHTING: hard top light, luminous chromatic shadow, golden dust motes in the air. PALETTE: cinnabar banners, ochre war-paint, Veronese green mask and forest mass, deep teal shadow; NO grey, NO brown, NO mud. TECHNIQUE: thick oil impasto, broad palette-knife strokes in the Jaime Jones / Jeff Easley tradition, tactile matter on carved wood, cord and torn cloth; the carved mask rendered clean-edged where light strikes — split-rendering focal, Ruan Jia polish; rude beauty — weathered and tactile, never squalid. MOOD: primitive menace + folk-craft devotion. Luminous, high-chroma — even the deepest shadow is saturated color, never black murk. NO grim, NO gore, NO skulls, NO bones, NO decay, NO mud, NO perfect symmetry, NO flat digital, NO airbrushed smoothness, NO sci-fi, NO text/UI/watermarks/frames, NO living goblin, NO humanoid figure, NO creature, NO person, NO portrait, NO full body — the totem is an object only. Ultra-wide cinematic 21:9 — the totem fills the vertical band, sky and forest flanking it.
```

**Tags riuso:** `totem, object, goblin-craft, card-cover, wide, no-people`

## Generation notes

- Aspect **21:9 wide** — la card del picker è una banda `h-44` `object-cover`
  (`QuestSelectScreen`), non verticale: una 3:4 verrebbe croppata a striscia.
- Se la generazione non supera il totem hero già in repo, riusare quello.
