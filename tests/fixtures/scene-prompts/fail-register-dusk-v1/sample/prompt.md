# ANDATA — Viaggio di andata → `viaggio-andata.png`

Beat: la partenza come **attraversamento di soglia** — la camera sta già
fuori, qualche passo oltre il confine del villaggio, e guarda verso la
wilderness. Il villaggio è dietro lo spettatore e NON esiste nel frame:
qualsiasi tetto disegnato si legge come «destinazione», non come partenza.
Party del giocatore mai disegnato; strada vuota perché il party è già passato.
Composizione dichiarata per parallasse: la soglia stessa (cancello del
palisade aperto) è l'occlusore di foreground al bordo sinistro su cielo
aperto (candidato `foregroundCutout`), 3 piani di profondità leggibili per
la depth map, lanterna del cancello come ancoraggio `glow`/`embers`.

## Full prompt — generatori esterni (Gemini / Grok / GPT)

```text
ANDATA — A wide 24mm cinematic establishing shot, deep depth of field: A masterful cinematic oil painting in heavy textured in the Jaime Jones / Jeff Easley tradition of painted scenes: the moment of departure, seen from just outside the known world at first light. The camera stands a few steps past the village boundary — the village itself is behind the viewer, NEVER IN FRAME, not a single roof. SUBJECT: in sharp dark silhouette against a luminous sky, the open timber gate of the palisade spilling in from the left frame edge, one heavy leaf swung wide, a small ember-lantern still burning on the nearest post; below the gate line, deep cart ruts in pale dust thin into a wild trail that falls away toward a sun-drenched ancient forest wall and jagged Dolomites peaks under a vibrant azure sky. NO TRAVELERS — the party has already stepped through; the departure lives in the open gate and the empty road beyond. COMPOSITION: three clean depth planes — dark foreground occluders at the left edge, the road as a single leading line running away from the viewer, monumental peaks behind — asymmetric, wide open sky. LIGHTING: brilliant morning sun low behind the viewer, long saturated shadows thrown forward toward the wilderness, golden dust motes in the air. PALETTE: ultramarine distance, Veronese green forest, amber light, vibrant azure sky, one cinnabar prayer-ribbon tied to the gatepost; shadows deep teal-emerald — NO grey, NO brown, NO mud, NO black. STYLE & TECHNIQUE: thick, violent palette-knife brushstrokes, visible layers of paint adding physical depth (Jaime Jones, Jeff Easley), loose painterly edges, Sparth-like monumental scale in the peaks; the world rendered as rude beauty — weathered and tactile, never squalid. MOOD: the threshold crossed, the world opening with risk — luminous and high-chroma, light wins over darkness, even the deepest shadow is saturated color, never black murk. NO grim, NO gore, NO flat digital surfaces, NO airbrushed smoothness, NO text, NO signature, NO watermark, NO logo, NO people, NO humanoid figures, NO village, NO houses, NO roofs. Ultra-wide cinematic 21:9.
 The occluder sits at ~x0.18/y0.60 covering 18% of the left edge.```

**Tags riuso:** `road, threshold, palisade-gate, morning, azure-sky, mountains, departure, wilderness, gate-lantern, cinnabar-ribbon, parallax-planes, no-people, no-village, no-goblins, generic`

## Generation notes

- Piani parallasse intesi: L1 occlusori foreground (cancello aperto + lanterna
  + nastro cinnabar, bordo sinistro, sagoma su cielo aperto → cutout),
  L2 strada che si assottiglia/murata foresta, L3 vette/cielo. La lanterna
  sul palo è l'ancora `glow`/`embers` authored.
- Dispositivi di partenza (ricerca): soglia fisica come oggetto, camera oltre
  la soglia, strada che degrada al confine, sole basso alle spalle → ombre
  proiettate in avanti verso l'ignoto.
- Aspect ≥ 21:9 — contratto theatre stage 2.4:1 (`theaterAspect`, gate
  `npm run check:quest-art`); ricodifica target ~3168×1320.
