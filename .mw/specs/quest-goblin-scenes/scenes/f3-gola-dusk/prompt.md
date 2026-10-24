# F3-gola — La gola al crepuscolo → `gola-raider.png` (showcase PLAN-052 v2)

**Status:** secondo candidato flagship T-004 — sostituisce
`f3-accampamento-dusk` come banco FX dopo il suo audit T-005a
(2026-10-23: watermark non filtrato dalla scorecard, simmetria quasi
speculare, midground a scaffale unico → scena piatta). Stesso beat
(l'approccio al campo), stesso stack FX, composizione con drama innata:
la geografia della gola impone recessione, diagonale e asimmetria.

## 1. Beat e soggetto focale

Beat: la vista giù nella gola — l'approccio stesso. In fondo, dove la
gola si restringe e curva, il bagliore caldo del focolare nemico (il
campo non si vede: lo tradisce solo il suo fuoco). Una torcia piantata
a mezza via segna il sentiero. Il player legge *prima* il bagliore
lontano (destinazione), poi la torcia (via), poi il torrente che
serpeggia fino a lui (lo spazio da attraversare). Nessun abitante.

## 2. Named depth staging

- **Near (occluder):** pareti rocciose massicce a **entrambi i bordi**,
  asimmetriche — parete sinistra ~30% della larghezza, quasi-silhouette,
  croppata da bordo e top (mensola sporgente); parete destra ~15%, una
  spalla scura. Più un **gradone/masso muschioso croppato dal bordo
  basso-sinistro** — la copertura dell'osservatore: massa convessa
  unica, plateau near netto (il bake sul candidato v1 ha mostrato pareti
  a gradiente morbido = parallasse fluido ma senza punch; il gradone
  dà il bordo silhouette che scivola sul midground). Il torrente entra
  nel varco tra gradone e spalla dx. Le pareti **entrano** nel frame in
  diagonale (overlap, non cornice esterna) — il fallimento di
  accampamento-dusk.
- **Midground scalare (≥3 step, mai scaffale):** a) masso + entrata del
  torrente in basso a destra (near-mid); b) spuntone roccioso con torcia
  a ~x0.60/y0.55 (mid); c) pareti che recedono in 2-3 gradini leggibili
  verso l'alto-sx; d) restringimento lontano dove siede il bagliore.
- **Far:** bagliore del focolare a ~x0.40/y0.32; spicchio di cielo
  crepuscolare tra le sommità delle pareti, y0.05–0.28, gradiente.
- **Diagonal lead:** il torrente entra dal bordo basso a destra e
  serpeggia su-sx fino al bagliore — il device di profondità primario.
- **Value ladder:** pareti near quasi-silhouette → midground in ombra
  calda filtrata → restringimento in haze teal → cielo luminoso.

## 3. Occluder edge-anchored

Pareti rocciose convette (mai cornici simmetriche, mai tronchi isolati):
larghezza grezza sx ~28–32%, dx ~15% → ≥7% sopravvive dentro la finestra
safe 2.05 su entrambi i lati. La mensola in alto a sx è un occluder top
opzionale — se presente, plateau unico, niente reticolato di rami contro
cielo. Le pareti recedono a gradini = rampa Z continua: la geometria
migliore possibile per il parallax, ben oltre l'occluder piatto.

## 4. FX anchor — sorgenti dipinte → effetti runtime

| Sorgente dipinta | Runtime FX | Posizione (fraz.) | Stato runtime |
|---|---|---|---|
| Focolare lontano: bed di braci nella curva | `glow` + `embers` piccoli + `smoke` faint | (0.40, 0.32) | ✓ esistente |
| Torcia piantata sullo spuntone | `glow` flicker + `moths` | (0.60, 0.55) | ✓ implementato (R-271) |
| Parete sx: base umida con muschio | `fireflies` erratiche | fascia y 0.45–0.62, x 0.15–0.35 | ✓ implementato (R-271) |
| Acqua del torrente (2-3 punti) | `glint` twinkle | (0.55, 0.70), (0.48, 0.55), (0.44, 0.44) | ✓ implementato (R-271) |
| Spicchio di cielo → varco | `shaft` diagonale + `dust` nel fascio | da (0.52, 0.06) verso (0.45, 0.50) | ✓ implementato (R-271) |
| Masso near dx (opz.) | `sway` ±1° su cutout | pivot bordo dx | ⏸ rinviato — pipeline `foregroundCutout` |

Regole anchor: torcia su spuntone solido (non appesa nel vuoto); il
bagliore dentro il restringimento della gola (le pareti lo incorniciano
= fondo solido naturale); i glint su acqua, non su roccia asciutta.

## 5. Overlay abilitati e vincoli per-overlay

- **`fog-low`** [banda y 0.50–0.95]: il fondo della gola resta a bassa
  frequenza — il torrente è acqua calma a pennellate larghe, massi ampi,
  niente rapidi dipinte, niente ciottoli fini nella metà bassa.
- **`cloud-shadow`** [banda y 0.25–0.90, blend multiply]: niente sottili
  hard-edged; niente aree near-black nella fascia focale — le pareti
  near possono essere scure perché sono «la gola in ombra»: substrato
  coerente, non zona proibita.
- `cloud-sky`, `birds-far`: **non abilitati** — lo spicchio di cielo
  resta comunque gradiente a bassa frequenza (riusabilità).

## 6. Life plan

| Painted source | Effetto | Posizione | Perché |
|---|---|---|---|
| Bed di braci nella curva | glow+embers+smoke | 0.40, 0.32 | fuoco *sentito* non visto — il campo come destinazione; braci piccole su plateau unico |
| Torcia su spuntone | glow flicker + moths | 0.60, 0.55 | segna la via; falene = vita senza muovere geometria |
| Base parete sx | fireflies | x0.15–0.35, y0.45–0.62 | punti luce su massa umida uniforme — zero rischio boundary |
| Acqua del torrente | glint ×3 | lungo la diagonale | l'acqua «respira» — twinkle su superficie riflettente |
| Varco tra pareti | shaft + dust | diag. 0.52,0.06→0.45,0.50 | luce morente che cade nella gola = il momento crepuscolare |
| Fondo gola | fog-low | y0.50–0.95 | nebbia respirante su forme larghe |
| Tutto | cloud-shadow | y0.25–0.90 | la scena respira col meteo |

## 6b. Shot grammar (contract item 11)

La composizione è authored **per** questa grammatica — id dal resolver
`CameraShotIdSchema`, coordinate authoritative in `sceneManifest` al
wiring:

| Ruolo | Shot id | Come la composizione lo serve |
|---|---|---|
| `entrance` | `enter-creep` | convergenza lenta verso il bagliore = discovery; il funnel tiene il focal vivo durante lo scarto off-axis |
| `camera` (beat) | `push-in` | il funnel + target centrale lontano sono costruiti per lo zoom: il bagliore è esattamente dove il push vuole arrivare |
| `pose` | `pose-watch` | hold stance — la vita la portano gli FX anchor, il dipinto tiene |
| baseline | `idleDrift` | le pareti near sono il motore della deriva camVec [0.7, 0.2] |
| fallback accettabile | `hold` | se `byNodeKind`/`byBeatKind` sovrascrive, il frame composto regge comunque |

**Narrative focal:** il bagliore del focolare nella curva — target
~x0.40/y0.32 (nel candidato generato misurato ~x0.46/y0.66 — misurare
sul raster finale al wiring).

**Non servita:** `pan-lateral` — le pareti lo tollerano ma il funnel
perde il suo scopo; se il beat dovesse richiederlo, rivalutare
composizione o shot prima di accettare.

## 7. Full prompt — Gemini / Nano Banana (generatore primario)

> Stile «quadro» come gli esemplari (R-263/PLAN-080, contract item 10):
> prosa pittorica densa, medium-first; l'ingegneria vive in §1–6.

```text
GOLA DUSK — painted in heavy oil impasto. A narrow gorge at deep dusk, seen from within its shadowed throat — a hidden approach view down a funnel of mossy rock. SUBJECT: a shallow stream winding down the gorge floor, entering from the lower right corner and snaking up-left toward a tiny warm campfire glow at the far end where the gorge narrows — the enemy camp unseen, only its coal-bright glow betraying it; a lone planted torch burning on a rocky spur midway marks the trail. COMPOSITION: massive near-black rock walls anchored at both frame edges and intruding into the view — the left wall a towering mass filling a third of the frame, cropped by edge and top, an overhanging shelf; the right wall slimmer, a dark shoulder — the walls step back in three clear ledges receding into depth, never a flat parallel shelf; in the extreme foreground a broad mossy rock ledge cropped by the lower left edge — the watcher's cover, one convex near-black mass with a clean silhouette edge — the stream enters through the gap between that ledge and the right shoulder; the stream is the diagonal lead, a wet ribbon guiding the eye deep into the gorge; above the wall tops a wedge of open dusk sky, a smooth low-frequency gradient. NO symmetry — the masses lean asymmetric, the water snakes off-axis. LIGHTING: the dying dusk spills softly from the sky wedge onto the upper ledges — a gentle ambient wash on the rock tops, NO visible beam; the far campfire the warmest point, the torch a small secondary warmth, all else in saturated teal-veronese shadow; luminous, high-chroma, the light wins over darkness — even the deepest rock is saturated color, never black murk. PALETTE: deep teal gorge, Veronese moss, amber-cinnabar firelight and torch, ultramarine dusk sky; NO grey, NO brown, NO mud. TECHNIQUE: thick oil impasto, broad palette-knife strokes in the Jaime Jones / Jeff Easley tradition, tactile matter on wet rock, moss and raw stone; rude beauty — weathered and tactile, never squalid. MOOD: the throat of the den — suspense before discovery. Low-frequency stream and floor — the water painted calm, broad reflective strokes, NO rapids detail. NO smoke columns, NO embers or sparks — paint only each light SOURCE: the coal-glow and the small torch flame, NO glow halos or bloom, NO light shafts or god rays or visible light beams — the runtime owns the ray, NO painted fog or mist, NO dust motes, NO distinct cloud silhouettes, NO birds, NO people, NO humanoid figures, NO readable goblins or creatures, NO faces, NO fences or ropes, NO bare twig lattices against sky, NO text/UI/watermarks/frames, NO symmetry, NO grim, NO gore, NO decay, NO flat digital, NO airbrushed smoothness, NO sci-fi. Ultra-wide cinematic 21:9.
```

**Recodifica:** 3168×1320 (2.4:1 esatto), focal nella fascia verticale
centrale; gate `npm run check:quest-art`.

## 8. Scorecard post-generazione (0–20, veto-first)

**Veto automatico (un solo strike = scarta o richiede rimozione):**
- *Artifact veto* [T-005a]: watermark/logo/testo/UI del generatore
  visibile da qualunque parte del frame — l'app lo applica in
  post-generation, non si può eliminare via prompt; dichiarare per ogni
  candidato: rigenera (es. via AI Studio senza watermark visibile) o
  rimozione in post (angolo → crop/inpaint).
- Occluder = 0, o anchor = 0.

| Criterio | 0–3 |
|---|---|
| Occluder entra nel frame (overlap, non cornice) | |
| Midground scalare: ≥3 step di profondità leggibili | |
| Diagonal lead: il torrente guida l'occhio al focale | |
| Anchors isolati su plateau solido | |
| Calm zones per-overlay rispettate | |
| Shot grammar servita (funnel → `push-in`/`enter-creep`) | |
| Stile/palette bibbia (impasto, teal/amber) | |
| Coerenza tag riuso (0–2) | |

Target **≥17/23**; poi catena T-005 completa. La simmetria non è un
criterio a parte: fallisce dentro «diagonal lead» e «occluder» — una
composizione speculare non può avere diagonale.

## 8b. Bake findings — T-005 stage 2 (2026-10-23)

**`gola2.jpeg` (v2, post-fix prompt):**
- **Gradone = plateau near distinto** ✓ — massa bianca isolata nella
  map, bordo netto contro midground: il punch di silhouette che v1
  non aveva. Fix empiricamente confermato.
- Funnel tenuto; niente fascio dipinto (la clausola wash + kill list
  ha funzionato); asimmetria e staggered midground tenuti; nessun
  watermark visibile a 792×336 (verificare full-res).
- Da verificare a full-res: segni piccoli presso il bagliore (figure
  scure?); raster 1584×672 → recode 3168×1320; stage 3 warp preview —
  il bordo del gradone è il punto da guardare per lo smear.
- Anchor `fireflies` da riposizionare: il gradone occupa la fascia
  bassa-sx → spostare sulla base parete dietro il gradone.

**`gola.jpeg` (v1):**

Bake `bake-depth.py` → `public/assets/depth/gola.webp` (792×336):

- **Funnel confermato**: bordi near chiari → centro far scuro; la
  geometria dichiarata è atterrata nella map.
- **Gradiente, non plateau**: le pareti sfumano → parallasse = deriva
  morbida, non scivolamento netto di silhouette. Effetto presente ma
  soft; per più punch serve un near element a bordo netto (gradone
  basso / masso croppato) in un prossimo candidato.
- **Acqua OK**: il torrente segue il fondo — nessuna inversione da
  riflesso a questa risoluzione.
- **Fascio dipinto**: eredita depth dello sfondo → smear-watch al warp
  preview dove taglia parete/cielo; resta violazione «paint the
  source, not the effect» da correggere in rigenerazione
  (`NO light shafts` mancava nella kill list — aggiunta al contratto).
- Raster 1584×672 (2.357) → recode 3168×1320; watermark non leggibile
  a questa risoluzione → verifica su file sorgente full-res.

## 9. Note di riuso

**Tags riuso:** `gorge, defile, stream, dusk, torch, campfire-glow-far,
pov-hidden-approach, no-people` — riusabile per qualunque quest con
approccio a covo/nemico attraverso un passaggio stretto: gola, forra,
canyon fluviale.

## Gap runtime

`moths`, `fireflies`, `glint`, `shaft` **implementati** in `AmbientLayer`
(R-271). `sway` resta rinviato: richiede la pipeline `foregroundCutout`.
Gli anchor numerici vanno confermati in `sceneManifest` al bake review —
il manifest resta authoritative per le coordinate (contract item 6).
