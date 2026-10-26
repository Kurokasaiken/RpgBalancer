# Key art v2 — variante con accenno di antagonista (R-288, ratificato 2026-10-25)

Scopo: una variante della key art eroe che conservi la composizione vincente
(critica esterna 9/10) ma aggiunga **un** accenno veritiero di minaccia —
il gioco vende permadeath e invasione goblin; la suite attuale è tutta
idilliaca. Vincolo claim-ledger: niente creature o eventi che il gioco non
contiene → minaccia *ambientale* (fumo, incendio, bioma corrotto, stormo
ostile), non un mostro in primo piano.

Formato prompt: library (ancore CAPS). Da incollare nel generatore del
Director; poi visual-fork con le candidate e ruling — **non** va in upload
senza il suo sì.

---

```
KEY ART for the dark-fantasy strategy RPG "Wanderlust Triumph" — store capsule illustration.

SUBJECT: the same lone wanderer seen from behind — weathered leather-and-bronze
explorer with a sheathed sword — standing on a rocky cliff in the left
foreground, gazing over a vast painted valley; BUT this time the valley is
divided: the near half is the same idyllic river valley with the tiny village,
while the far horizon carries the threat — a distant plume of dark smoke rising
where something has burned, a creeping blight of ash-grey and ember-red
spreading at the valley's edge, and a thin murder of crows circling in the
smoke light.

COMPOSITION: wide cinematic landscape, low horizon in the upper third; hero
occupies the lower-left third as the focal anchor (silhouette readable at
thumbnail); the smoke column on the opposite third balances the frame and
leads the eye to the title zone; keep the upper-center sky calm and clear for
the logo.

LIGHTING: the warm grazing sunset from the existing art stays golden on the
near valley; the smoke plume is rim-lit ember-orange from below and fades to
ash-grey; a subtle cold violet shadow creeps in from the threatened side —
light tells the story of a beautiful world already being lost.

PALETTE: keep the signature ultramarine-violet and amber-orange of the
original; add only desaturated ash grey and a restrained ember red for the
threat — never neon, never full black.

TECHNIQUE: hand-painted digital matte painting, painterly brushwork, film
key-art quality; no text, no watermark, no UI, no logo (logo is composited
separately).

MOOD: "wonder under threat" — the player reads beauty AND stakes in one
glance; the smoke is a question, not a war scene.

NEGATIVE: no armies, no visible monsters, no burning village close-up, no
skulls, no gore, no second characters, no photorealism, no text.
```

---

## Note operative

- Se il generatore produce comunque un mostro/esercito, ritoccare con
  img2img negativo o scartare: la versione accettabile deve restare
  *minaccia ambientale*, non mostro protagonista.
- Alternativa leggera se la rigenerazione totale non convince: paintover
  sulla `Header Capsule.png` esistente — colonnina di fumo + stormo
  all'orizzonte destro, senza rifare il resto.
- Dopo la scelta del Director: i crop escono da
  `tools/capsule-brand-fix.py` (parametri già pronti, basta puntare la
  sorgente nuova).
