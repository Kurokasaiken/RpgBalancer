---
title: PLAN-017 — Stylized Sea Pattern Evaluation
type: plan
status: active
created: 2026-09-10
richiesta: R-068
desiderata: v19 (FROZEN)
dipende_da: none
---

# PLAN-017 — Stylized Sea Pattern Evaluation

> Piano approvato dal Director.
> Scopo: trovare la rappresentazione visiva più convincente del mare, non perfezionare il Voronoi.

## Ambito

Solo `public/voronoi-sea-spike.html` e i suoi artefatti di test. Nessuna modifica a `WorldSurfaceRenderer`, `WorldSurfaceWaves`, TestHub o layer baked finché il Director non approva un vincitore.

## Premessa estetica

Il mare è:
- **tinta piatta** (`Mare.webp` o colore base);
- **sovrapposizione di un pattern lineare trasparente** (linee organiche rare);
- **micro-movimento** quasi subliminale;
- **nessuna simulazione fisica**, nessuna caustica fotorealistica, nessuna luce dinamica.

## Gerarchia dei candidati

| Candidato | Ruolo | Vantaggio atteso |
|---|---|---|
| **A — Authored texture** | **Gold standard** | A0: statico. A1: + micro scroll. Il più economico, controllato, vicino alla pittura. |
| **B — Dual-phase authored texture** | Tentativo di miglioramento | Micro-variazione con crossfade, a costo quasi zero. |
| **C — Procedural Voronoi** | Challenger tecnico | Vantaggio solo se è visivamente indistinguibile o superiore ad **A1** e offre un vantaggio artistico concreto. |

**Regola di vittoria:** `C` viene promosso solo se è visivamente indistinguibile o superiore ad `A1` a parità di movimento. Un vantaggio tecnico da solo **non basta**. Se `C` non supera `A1`, vince `A1` e lo spike si chiude.

## Rubrica di fallimento estesa

Oltre a `CELLULAR`, `NETWORK`, `SLIDING_TEXTURE`, `BREATHING_BLOBS`, `CAUSTIC`, `FOG_BLUR`:

| Categoria | Cosa significa |
|---|---|
| `TOO_ALGORITHMIC` | Sembra generato proceduralmente, non disegnato. |
| `GRID_ARTIFACT` | Si vede il reticolo sottostante o la tiling. |
| `RING_ARTIFACT` | Le celle leggono come bolle/cerchi. |
| `MICRO_MOTION` | Il movimento è tecnicamente piccolo ma percettivamente invasivo. |
| `PATTERN_LOCK` | L’occhio identifica immediatamente la ripetizione. |
| `SCREEN_GLUE` | Il pattern sembra incollato allo schermo, non appartenere al mondo. |

## Task ordinati

### SEA-01 — Reference board e A/B/C percettivo
**Dipende da:** nessuno

1. Selezionare 3-5 crop del mare a zoom `0.18 / 0.24 / 0.30`.
2. Fissare parametri artistici target:
   - `patternScale`: 30–120 px a viewport
   - `lineOpacity`: 0.05–0.18
   - `lineWidth`: 0.5–2.0 px
   - `lineColor`: string
   - `motionAmount`: 0.5–4 px
   - `motionPeriod`: 10–30 s
3. Produrre per ogni crop **tre screenshot/video identici** (A, B, C) con stesso framing, zoom, maschera e movimento.
4. Sottoporre i tre candidati a una **scorecard percettiva ripetibile**:
   - 1–5 per: organicità, leggibilità come acqua, invisibilità del pattern, integrazione con `Mare.webp`, sottilezza del movimento, assenza di tiling.
   - Almeno due giudici indipendenti (Director + cold reviewer) compilano la scorecard separatamente.
5. Gate formale: A1 deve essere accettabile su tutti i crop. Se A1 non piace, nessuna delle altre tracce procede.

---

### SEA-02 — Three-way visual spike
**Dipende da:** SEA-01

Tre varianti affiancate nello spike, con gli stessi controlli artistici:

| Traccia | Tecnica | Scopo |
|---|---|---|
| **A0** | PNG trasparente statico world-space | Gold standard senza movimento. |
| **A1** | PNG trasparente + micro scroll world-space | Gold standard con movimento; candidato di produzione. |
| **B** | Due texture A₁/A₂ + crossfade + micro drift | Tentativo di migliorare la variazione temporale senza aumentare costo. |
| **C** | Voronoi procedurale minimale (3×3, no curl, no orbit) | Challenger. Deve battere A1 per essere promosso. |

---

### SEA-03 — Contratto config artistico
**Dipende da:** SEA-01

Schema Zod con proprietà **artistiche**, non implementative:

```ts
interface SeaVisualConfig {
  patternMode: 'authoredTexture' | 'dualTexture' | 'proceduralVoronoi';

  patternScale: number;   // dimensione percepita del pattern
  lineOpacity: number;    // 0.0 – 1.0
  lineWidth: number;      // px
  lineColor: string;      // tinta linee
  baseColor: string;      // tinta mare (overlay opzionale)

  motionEnabled: boolean;
  motionAmount: number;   // px spostamento max
  motionPeriod: number;   // secondi
}

interface SeaAlgorithmConfig {
  // Dettagli implementativi validati, non esposti nel pannello principale
  neighborRadius: 3 | 5;
  cellScale: number;      // valido solo per patternMode = 'proceduralVoronoi'
  gaussianSharpness: number;
  curlEpsilon: number;    // se usato
}
```

**Cosa NON appare nel contratto principale**
- `worldSpace`: è un’invariante, non una configurazione (vedi SEA-04).
- `lineSoftness` / `lineEdgeSoftness`: antialiasing è responsabilità implementativa; se artisticamente serve, lo dimostra A0/A1.
- `flow`, `warp`, `curl`, `orbit`: sono dettagli implementativi, non proprietà artistiche. Il designer decide "2 px / 15 s", non "warp".

**Accettazione**
- Zod valida range e colori.
- Nessun default duplicato nell’HTML/shader.
- Fetch fallito del JSON → fallback DOM statico (`Mare.webp`).

---

### SEA-04 — Pattern world-space (invariante)
**Dipende da:** SEA-03

**Invariante:** il pattern è sempre ancorato alle **coordinate mondo**. Non esiste una modalità viewport-space.

1. Implementare `worldToUV` coerente con il resto di `WorldSurface`.
2. Verificare a zoom e pan:
   - lo zoom cambia la scala del pattern in modo coerente;
   - il pan non fa scivolare il pattern;
   - non si vedono bordi di tiling.
3. No transform/parallasse del layer mare full-canvas.

**Accettazione**
- A pari crop, due screenshot a zoom diversi mostrano pattern di dimensione coerente.
- Pan di 500 px non produce scivolamento visibile del pattern rispetto al mare.

---

### SEA-05 — Motion decomposition
**Dipende da:** SEA-03

Testare in isolamento:
1. **A0** — texture statica (gold standard senza movimento);
2. **A1** — texture + micro drift (gold standard con movimento; questo è il target per B/C);
3. **B** — dual texture + micro drift;
4. **C** — Voronoi procedurale + micro drift;
5. **COMBINED** — solo per il vincitore.

Criterio: se il movimento viene notato a colpo d’occhio, è troppo. Deve essere quasi subliminale.

---

### SEA-06 — Resolution scaling
**Dipende da:** SEA-03

Testare downscale del render pattern a `1.0 / 0.75 / 0.5`:
- degrado visivo;
- `Δp95`;
- memoria.

L’obiettivo non è “1 ms a tutti i costi”, ma trovare il punto “99% qualità percepita al minimo costo”.

---

### SEA-07 — Fallback e accessibilità
**Dipende da:** SEA-03

1. `prefers-reduced-motion` → pattern statico deterministico (A0).
2. WebGL/Canvas assente → `Mare.webp` senza pattern.
3. Context lost WebGL → ripristino pulito, mai canvas nero.
4. Fallback visivamente legittimo, non “modalità errore”.

---

### SEA-08 — Tauri / WebView acceptance
**Dipende da:** SEA-04, SEA-07

1. Test su Chrome e Tauri WebView2.
2. Profilazione: baseline vs `Δp95` a DPR nativo e downscale `1.0 / 0.75 / 0.5`.
3. Budget: verde ≤1 ms, giallo 1–2 ms, rosso >2 ms.
4. La soglia definitiva la decide il Director, ma il vincitore deve stare in giallo o verde.

---

### SEA-09 — Decisione finale
**Dipende da:** SEA-02, SEA-05, SEA-06, SEA-08

Tabella comparativa:

| Variante | Art direction | Motion | Costo | Tauri | Vantaggio concreto su A1 | Verdetto |
|---|---|---|---|---|---|---|
| A0 — Authored static | | | | | — | |
| A1 — Authored + micro scroll | | | | | — | |
| B — Dual texture | | | | | | |
| C — Procedural Voronoi | | | | | | |

**C viene promosso solo se:**
- scorecard percettiva ≥ A1;
- nessuna categoria di fallimento attiva;
- offre un **vantaggio artistico o di controllo concreto** su A1 (es. variabilità runtime, nessun asset, controllo maggiore);
- un vantaggio tecnico da solo **non è sufficiente**;
- `Δp95` in giallo o verde.

**Altrimenti vince A1** e lo spike si chiude con il contratto `SeaVisualConfig` aggiornato e l’asset A1 come riferimento.

## Non-obiettivi

- Non sostituire `WorldSurfaceRenderer`, `WorldSurfaceWaves` o il mare in produzione.
- Non aggiungere shader complessi in produzione se vince A1.
- Non fissare Voronoi come tecnologia obbligata.
- Non aggiungere nuove pagine, asset aggiuntivi, persistenza o CSS skin standalone.
