# Synthesis — ambient FX catalog (broadcast 2026-10-24, 3/5 contenuto: deepseek, gemini, grok; chatgpt vuota, claude timeout)

## Banda 1 — CONVERGENZE (≥3/3, segnale)

1. **Canvas deterministico = TENERLO** — tutte e tre le voci: il pure-function
   model è l'anima del sistema (testabilità, replay, QA scrub). NON adottare
   particle engine stateful. Grok concede un "chaos layer" per battaglie —
   divergenza minore. Deepseek: "non siamo un particle system, siamo un
   living-still compositor".
2. **Generated sprite stamps nello stile del dipinto = mossa di valore
   massimo** — tutte e tre indipendentemente: prompt al modello per stamp
   particellari (foglie, ember, smoke curls) in oil impasto. Chiude il gap
   stilistico particella↔piatto. Pipeline authoring, costo runtime zero.
3. **Depth-aware FX** — la depth map non è solo parallasse: è DOVE gli
   effetti possono vivere (fog tinta per depth, pioggia dietro occluder,
   glint solo su zone speculari).
4. **Texture motion = area debole** (smoke curls, stoffe, fiamme): la
   risposta corretta è strip animation generate (8-16 cels dal modello,
   fase randomizzata, compositati) o flow-field displacement — il tell è
   la giuntura del loop.
5. **Disciplina di pairing**: vista = macro-motion solo; campo = updraft
   caldo; bosco = particelle a profondità stratificate; battaglia = jitter
   ad alta frequenza. "Rain+leaves+embers insieme = inventario, non meteo".
6. **Audio coupling** — envelope audio modula parametri sullo stesso
   clock (vento → leaves+smoke insieme). Cheap, alto payoff.

## Banda 2 — DIVERGENZE (ruling da sciogliere)

- **Chaos layer per battaglie** (grok, sì) vs pure-function basta (deepseek/gemini).
- **Acqua**: deepseek propone strip-scroll+UV sine su speculari — la
  bocciatura Director di v1 vale solo per lo strip sull'intera texture;
  la via corretta resta flow map + shader (ricetta Valve).
- **pixi-particles**: grok la cita come "pure function" — tecnicamente
  errato (timestepped); deepseek/gemini hanno ragione.

## Banda 3 — VOCI SOLITARIE

- **deepseek**: regola "one hero motion per scene" (direttiva authoring:
  un effetto dominante, giustificare il secondo, vietare il terzo se non
  condivide l'asse di moto); vento condiviso come vettore comune (leaves
  + smoke sullo stesso noise field).
- **gemini**: SDF collision masks (particelle deviano sulle forme dipinte);
  Lissajous attractors per moths; avviso "Flash-game particle spam".
- **grok**: referenze AAA (Elden Ring volumetric sky, Witcher 3 wind
  foliage, Alan Wake ground mist, Live2D layers); video-model plates per
  piccole regioni.

## Il catalogo per famiglia materiale (la tassonomia di deepseek)

| Famiglia | Tipi | Ricetta consolidata | Tell del cheap |
|---|---|---|---|
| Particelle con peso | leaves, snow, ash, embers, petals | stamp bakeato + tumble `scale(cos)` + slip accoppiato + depth-scale | caduta lineare uniforme |
| Superfici che si muovono | acqua, shimmer, fog, cloud | flow map + UV warp a due fasi ping-pong | scroll uniforme in box |
| Luce che respira | glow, shaft, glint, moon | prism ancorati all'architettura + pulse sinusoidale | opacità statica |
| Texture senza identità | smoke, stoffe, fiamma, hair | strip animation generate 8-16 cels + fase rand | loop seam visibile |
| Insetti | moths, fireflies, birds | curve Lissajous/attractors seeded | jitter erratico |

## Regole anti-spam (tutte e tre)

1. Un hero motion per scena — gli altri effetti subordinati.
2. Mai due effetti sullo stesso asse di moto.
3. Scena pittorica già piena = MENO effetti, non di più.
4. Camera in moto → particelle quasi ferme (e viceversa).
5. Vento condiviso: un campo, non N direzioni casuali.
