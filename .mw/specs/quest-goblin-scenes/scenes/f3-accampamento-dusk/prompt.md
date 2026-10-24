# F3-dusk — L'accampamento al crepuscolo → `accampamento-dusk.png` (showcase PLAN-052 v2)

**Status:** primo brief a contratto v2 — **audit T-005a FALLITO al
candidato generato** (2026-10-23): watermark Gemini nel frame non
filtrato da nessun criterio scorecard; composizione quasi speculare
malgrado `NO symmetry`; midground a scaffale unico (tende stessa
profondità/dimensione) → lettura piatta, scaffali paralleli. Superato
come flagship da `f3-gola-dusk`; il file resta come **record di
calibrazione** — i suoi fallimenti hanno prodotto gli emendamenti
compositivi + artifact veto ora nel contratto (PLAN-052 clause 2/8).

## 1. Beat e soggetto focale

Beat: la scelta d'approccio — il campo visto dalle fronde, ma al crepuscolo
pieno: i fuochi accesi leggono lontano, gli abitanti no. Il player deve
leggere *prima* il focolare centrale (fonte di luce più calda del frame),
poi la lanterna, poi il treeline. Nessun abitante leggibile.

## 2. Named depth staging

- **Near (occluder):** masse scure di pini + sottobosco ancorate a
  **entrambi i bordi** del frame — sinistra ~18% della larghezza, destra
  ~15% — fisicamente continuanti oltre il bordo, silhouette convessa
  larga, un solo plateau di profondità. Devono incorniciare il campo
  senza toccarlo (focal opening centrale libera).
- **Focal (midground):** il campo in una radura — focolare in anello di
  pietre con carboni accesi a ~x0.42/y0.60, 3-4 tende di pelle con masse
  ampie, lanterna su palo di tenda a ~x0.72/y0.52, scudo+bottino
  appoggiati a ~x0.55/y0.70.
- **Far:** treeline scuro e continuo (muro di fogliame, non tronchi
  singoli) a ~y0.30–0.45; fascia cielo crepuscolare y0.00–0.28.
- Scale/overlap/contrast: il near è il masso più scuro del frame
  (contrasto di valore vs midground); il focolare è l'unica fonte calda
  grande; tende si sovrappongono al treeline con salto di valore netto.

## 3. Occluder edge-anchored

Masse di **pino + roccia** ai due bordi (mai tronchi isolati sottili,
mai reticolato di rami contro cielo): larghezza grezza ~15–20% per lato,
così ≥7% di larghezza sopravvive dentro la finestra safe 2.05.
Comportamento atteso al bake: plateau near unico, rampa ≤ yardstick
calibrato. Alternativa accettabile (dichiarata): un solo bordo con
massa ≥20% + motivo documentato.

## 4. FX anchor — sorgenti dipinte → effetti runtime

| Sorgente dipinta | Runtime FX | Posizione (fraz.) | Stato runtime |
|---|---|---|---|
| Focolare: carboni rossi nell'anello di pietre | `glow` flicker + `embers` + `smoke` lean→dx | (0.42, 0.60) | ✓ esistente |
| Lanterna su palo di tenda | `glow` steady + `moths` | (0.72, 0.52) | ✓ implementato (R-271) |
| Treeline scuro | `fireflies` (erratiche, alpha pulsante) | fascia y 0.32–0.42 | ✓ implementato (R-271) |
| Scudo/bottino metallico | `glint` (twinkle alpha, nessun moto) | (0.55, 0.70) | ✓ implementato (R-271) |
| Fascio residuo tra le fronde | `shaft` breathing + `dust` nel fascio | da (0.60, 0.05) verso (0.55, 0.55) | ✓ implementato (R-271) |
| Massa near (opz.) | `sway` ±1° su cutout manuale | pivot bordo dx | ⏸ rinviato — richiede pipeline `foregroundCutout` |

Regole anchor (Gemini): ogni sorgente è **piccola, isolata e su fondo
solido** — la lanterna contro la tenda scura, non appesa nel vuoto contro
il cielo; il focolare dentro l'anello di pietre, non su erba aperta.

## 5. Overlay abilitati e vincoli per-overlay

- **`fog-low`** [banda y 0.50–0.95]: il terreno del campo resta a bassa
  frequenza — erba piatta/terreno, niente detriti fini, niente figure
  sottili (le tende restano masse ampie, leggibili sotto la nebbia).
  Calm ≠ vuoto: il campo c'è, ma a forme larghe.
- **`cloud-shadow`** [banda y 0.25–0.90, blend multiply]: niente oggetti
  sottili hard-edged nelle zone che attraversa; niente aree near-black
  sopra la fascia focale (multiply su nero = morto). Le masse near ai
  bordi possono essere scure perché sono già «in ombra di fronde» — è
  il substrato coerente, non una zona proibita.
- `cloud-sky`, `birds-far`: **non abilitati** in questa scena — la fascia
  cielo resta comunque a bassa frequenza (gradiente + texture, niente
  nuvole silhouette distinte) per lasciarla riusabile.

## 6. Life plan

| Painted source | Effetto | Posizione | Perché |
|---|---|---|---|
| Anello di pietre con carboni | glow+embers+smoke | 0.42, 0.60 | focolare dipinto *spento ma acceso* (brace, non fiamme); fumo/faville a runtime evitano lo smear del warp |
| Lanterna a olio | glow steady + moths | 0.72, 0.52 | secondo punto caldo; falene danno «vita» senza muovere geometria |
| Treeline scuro | fireflies | y 0.32–0.42 | punti luce su massa uniforme lontana — nessun rischio boundary |
| Scudo metallico | glint | 0.55, 0.70 | bottino che «respira luce» — twinkle su punto, zero displacement |
| Fronde/fascio | shaft + dust | diag. 0.60,0.05→0.55,0.55 | god ray crepuscolare nel fascio tra i pini — opzionale, primo taglio se il frame è già pieno |
| Terreno campo | fog-low | y 0.50–0.95 | nebbia respirante su forme larghe — niente fine detail da ingoiare |
| Tutto | cloud-shadow | y 0.25–0.90 | ombra di nuvola che attraversa = la scena «respira» col meteo |

## 7. Full prompt — Gemini / Nano Banana (generatore primario)

> Stile «quadro» come gli esemplari (R-263): prosa pittorica densa,
> medium-first; l'ingegneria FX/depth vive in §1–6 e si traduce qui in
> pittura (masse ancorate ai bordi, luci-source, bande basse di frequenza),
> non in linguaggio tecnico (R-270 analisi lint: 11 criteri falliti nella
> prima stesura → riscritto).

```text
ACCAMPAMENTO DUSK — painted in heavy oil impasto. A raider camp seen through dark pines at deep dusk, the whole frame a hidden watcher's-eye view between branches. SUBJECT: a small clearing holding a ragged hide-tent camp — a stone-ringed fire pit with glowing red coals (embers and smoke NOT painted — only the coal bed breathing warm light), three or four broad hide tents, a small oil lantern on a tent pole against a dark tent wall, a metal shield and loot bundle leaning against the right tent; NOTHING FLIES, NOTHING MOVES — only light sources waiting for the runtime. COMPOSITION: massive dark pine-and-rock masses anchored at BOTH the extreme left edge and the extreme right edge — each a fifth of the frame in width, physically continuing beyond the frame border, each a single broad convex silhouette — the camp sits open in the central view, small and readable; behind it a continuous dark wall of treeline, and above an open dusk sky, a smooth low-frequency gradient, NO INHABITANT VISIBLE. LIGHTING: deep dusk — the fire pit the warmest brightest element, the lantern a small secondary warm point, all else falling into saturated teal-veronese shadow; luminous, high-chroma, the firelight wins over darkness — even the deepest pine is saturated color, never black murk. PALETTE: deep teal dusk, Veronese pine masses, amber-cinnabar firelight, ultramarine sky band; NO grey, NO brown, NO mud. TECHNIQUE: thick oil impasto, broad palette-knife strokes in the Jaime Jones / Jeff Easley tradition, tactile matter on hide, raw timber and stone; rude beauty — weathered and tactile, never squalid. MOOD: assessment + the last quiet before violence. Low-frequency flat terrain under the camp — no debris, no fine texture in the lower half. NO smoke columns, NO embers or sparks or flame tongues, NO glow halos or bloom — paint only each light SOURCE, NO painted fog or mist, NO dust motes, NO distinct cloud silhouettes, NO birds, NO people, NO humanoid figures, NO readable goblins or creatures, NO faces, NO palisade pickets, NO fences or ropes or tent guy-lines, NO bare twig lattices against sky, NO text/UI/watermarks/frames, NO symmetry, NO grim, NO gore, NO decay, NO flat digital, NO airbrushed smoothness, NO sci-fi. Ultra-wide cinematic 21:9.
```

**Recodifica:** 3168×1320 (2.4:1 esatto), focal nella fascia verticale
centrale; gate `npm run check:quest-art`.

## 8. Scorecard post-generazione (0–20, veto-first)

Occluder 0–3 · piani near/focal/far 0–3 · anchor isolati su fondo solido
0–3 · calm-zone per-overlay 0–3 · focal opening libera 0–3 · stile/palette
bibbia 0–3 · coerenza tag 0–2 → **target ≥15/20**, veto automatico se
occluder=0 o anchor=0. Poi catena T-005: raster/safe-area → bake misure →
parallax max-amp → preview overlay-enabled → occhio Director.

## 9. Note di riuso

**Tags riuso:** `camp, tents, cookfire, dusk, pov-hidden-watcher,
no-people, generic-enemy-camp, dusk-lit` — riusabile per qualunque quest
con bivacco/campo nemico al crepuscolo. La specificità della quest vive
in overlay/config/narration, non nel dipinto.

## Gap runtime

`moths`, `fireflies`, `glint`, `shaft` **implementati** in `AmbientLayer`
(R-271, 2026-10-23) — schema + renderer + test INV:ambient-layer.INV-1/2.
`sway` resta rinviato: richiede la pipeline `foregroundCutout` (asset
ritagliato + pivot + accoppiamento parallasse), non un branch del canvas.
