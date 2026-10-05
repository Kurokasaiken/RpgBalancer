# PLAN-MOCKUP-TO-COMPONENT v3 — Da richiesta (o mockup esterno) a componente React

**Status:** Draft — in attesa di verifica piloto
**Date:** 2026-08-14
**Supersede:** `PLAN-MOCKUP-TO-COMPONENT-v2.md`
**Desiderata FROZEN:** `.mw/desiderata.md` v5
**Richiesta:** R-023
**Cold reads precedenti:**
- v1 bocciato in `.mw/runs/explore-mockup-to-component/SYNTHESIS.md` (6 blocking)
- v2 bocciato in `.mw/runs/coldread-mockup-v2/SYNTHESIS.md` (ChatGPT, DeepSeek: NO)

---

## 1. Il principio, correttamente formulato

> **Decisione Director (2026-08-14):** *"vorrei tenere al minimo l'uso di asset, vorrei fosse il + css/react possibile"*

Il mockup definisce il bersaglio visivo. L'implementazione è **CSS/React/token per default**. Un asset raster è un'eccezione che richiede giustificazione scritta.

**Non dice:** il principio "risolve" i problemi degli asset.  
**Dice:** il principio **riduce il numero di casi** in cui si attivano. Quando un asset è inevitabile, il problema dell'alpha, della separabilità e degli stati torna — e va affrontato con la pipeline, non ignorato.

---

## 2. Decisioni del Director ratificate

| # | Decisione | Valore |
|---|---|---|
| 1 | **Soglia di comparabilità** | **Metrica ibrida** — automatica per silhouette/layout/palette, umana del Director per materiale/identità visiva |
| 2 | **Licenze modelli** | Whitelist vincolante + provenance dinamica §3 |
| 3 | **Asset ownership** | Caso per caso, dichiarato in fase Contract |
| 4 | **Art gate** | Non bloccante; il Director rivede e chiede modifiche **fino a soddisfazione** |
| 5 | **Paintover umano** | **Zero.** Nessun passaggio in editor grafico |
| 6 | **Fast path** | Sì, per componenti con < 3 regioni semantiche e zero `assetSlot` |
| 7 | **Componente pilota** | `GoblinEventLabPage` → `http://localhost:5173/goblin-event-lab` |
| 8 | **Budget di rework** | Nessun limite numerico predefinito — si itera finché il Director non è soddisfatto. **Nota di rischio:** con zero paintover, iterazioni eccessive spingono verso la semplificazione/abbandono |

---

## 3. Whitelist licenze e provenance dinamica

### 3.1 Whitelist statica — modelli ammessi

| Modello | Licenza | Uso |
|---|---|---|
| **SDXL 1.0** base + refiner | CreativeML Open RAIL++-M | ✅ generazione e derivazione |
| **FLUX.1 [schnell]** | Apache-2.0 | ✅ generazione e derivazione |

### 3.2 Vietati — modelli non ammessi

| Modello | Motivo |
|---|---|
| **FLUX.1 [dev]**, **FLUX.1 Fill [dev]**, **FLUX.1 Depth [dev]**, **FLUX.1 Canny [dev]**, **FLUX.1 Redux [dev]**, **FLUX.1 Kontext [dev]**, **FLUX.1 Krea [dev]**, e i relativi LoRA | Licenza FLUX.1-dev Non-Commercial (v2.0 del 25/11/2025) — uso non commerciale/non produzione. **Vietati anche per esperimenti** per evitare contaminazione produttiva. |
| **SD 1.5/3.x**, **checkpoints/LoRA da Civitai** | Verifica caso per caso prima dell'uso. |

### 3.3 Provenance dinamica

Prima di scaricare o usare un modello/checkpoint/LoRA, l'agente deve:
1. Verificare che il nome sia nella whitelist o che la licenza sia compatibile.
2. Scaricare il `LICENSE.md` / model card e registrarne un hash nel `provenance`.
3. Se la licenza non è chiara o non è compatibile, **bloccare** e scalare al Director.

Il provenance record di un asset deve coprire:  
`source → reference → model → adapter → LoRA → checkpoint → preprocessing → output`

---

## 4. Fast path

Se il contract soddisfa **entrambe** le condizioni:
- meno di 3 regioni semantiche
- zero `assetSlot`

Allora il workflow si riduce a:

```
RICHIESTA → KIT SEARCH → CONTRACT → IMPLEMENTAZIONE CSS/React → SAFEGUARD
```

Nessun mockup, nessuno style lock, nessun visual match. Il componente è puramente strutturale/testuale e si implementa con i primitivi/token esistenti.

---

## 5. I due ingressi (percorso completo)

```
RICHIESTA DEL DIRECTOR
   │
   ▼
F0  KIT SEARCH
   │ coperto? ──► IMPLEMENTA IL KIT, fine
   │
   ▼ non coperto
F1  CONTRACT
   │
   ▼ < 3 regioni e zero assetSlot?
   ├─ SÌ ──► FAST PATH: implementa CSS/React ──► SAFEGUARD, fine
   │
   ▼ NO
F2  STYLE LOCK
   │
   ▼
F3  MOCKUP (generato o derivato)
   │
   ▼
F4  IMPLEMENTABILITY GATE
   │
   ▼
F5  CLASSIFICAZIONE CON GATE CSS
   │
   ▼
F6  IMPLEMENTAZIONE CSS/REACT
   │
   ▼
F7  ASSET PIPELINE (solo se classificato)
   │
   ▼
F8  VISUAL MATCH (ibrido)
   │
   ▼
F9  RUNTIME / PERF GATE
   │
   ▼
F10 SAFEGUARD
   │
   ▼
F11 DIRECTOR REVIEW (iterativo fino a soddisfazione)
```

### Ingresso mockup esterno

```
MOCKUP ESTERNO
   │
   ▼
F0-EXT INTAKE TRIAGE
   │
   ▼ categoria B? ──► ROTTA 1 obbligatoria (reference only)
   │
   ▼ scegli rotta 1/2/3
   └────────────────────────────┐
                                ▼
                        F1  CONTRACT (con mockup come reference)
```

---

## 6. Fasi

### F0 — Kit & primitive search
**Esecutore:** agente. **Durata max:** 15 min.

Cerca per funzione (non per nome) in:
- `src/docs/docs/idle_village/COMPONENT_MASTER_INDEX.md`
- `src/ui/idleVillage/frozen/kits/`
- `src/ui/atoms/`, `src/ui/fantasy/atoms/`, `src/ui/idleVillage/skins/primitives/`

**Gate G0 (bloccante):** se un kit o una composizione di primitivi copre la funzione → implementa il kit.

**Artefatto:** `<component>.admission.md` (breve: cosa cercato, cosa trovato, cosa resta).

### F1 — Component Contract
**Artefatto:** `<component>.contract.json`

```
componentId          kebab-case
purpose              una frase
skinPreset           base | minimal_frontier | wanderlust
pillar               wilderness | empire
semanticRegions[]    es. HEADER, ICON, TITLE, VALUE, BADGE, ACTION
states[]             idle, hover, pressed, disabled
layout               dimensioni, proporzioni, responsive
interaction          click, drag, hover-intent, ecc.
frozenKits[]         kit da usare
primitives[]         primitivi da usare
tokenSlots[]         token della skin
assetSlots[]         asset raster — con `justification` obbligatoria
i18nKeys[]           chiavi di traduzione
configRefs[]         riferimenti a config Zod
route                1 | 2 | 3 (se mockup esterno)
```

**Gate G1 (bloccante):** ogni `assetSlot` deve avere `justification` che spieghi perché CSS/SVG/token non bastano.

### F2 — Style Lock
**Artefatto:** `style-lock-<preset>-v<N>.json` — versionato e riusato.

```
model                dalla whitelist
modelLicense         hash del LICENSE.md scaricato
shortPrompt          ≤ 60 token
negativePrompt       ≤ 60 token
referenceImages[]    ancore di stile (per rotta 2)
palette              esadecimali dalla skin config
seedPolicy
steps, sampler, cfg, resolution
```

**Gate G2 (bloccante):** 3 immagini di benchmark. Verifica misurabile: palette entro tolleranza, niente grigio/marrone nelle ombre, kill list rispettata.

### F3 — Mockup
**Artefatti:** `<component>.mockup.png` + `<component>.mockup.meta.json` con provenance completa.

**Numero di candidate:** default **2**, max **4** solo se visivamente centrale (decisione documentata in `contract.json` o `admission.md`).

**Criterio di scelta tra candidate:** tracciato in `mockup.meta.json`:
- rotta 1: massimizzare coerenza con lo style lock
- rotta 2: minimizzare distanza percettiva dal mockup esterno

### F4 — Implementability gate
Verifica sul mockup scelto:
- colori mappabili sui token della skin (distanza colore entro soglia)
- nessun testo baked (OCR o ispezione visiva)
- regioni semantiche del contract identificabili
- nessun effetto vietato
- nessun `.css` ad-hoc o duplicazione di primitivo richiesto

**FAIL** → correggi contract o mockup.

### F5 — Classificazione con gate CSS
Ogni elemento ha **una** categoria. Priorità obbligatoria:

1. `TOKEN`
2. `PRIMITIVE`
3. `CSS_PROCEDURAL`
4. `SVG_INLINE`
5. `RGBA_TEXTURE`
6. `MASK`
7. `REGENERATE`
8. `REJECT`

**Gate G5 (bloccante):** prima di classificare `RGBA_TEXTURE`, l'agente deve **tentare una ricostruzione CSS/SVG** dell'elemento e misurare la distanza percettiva. Se la distanza è sotto soglia, l'elemento diventa `CSS_PROCEDURAL` o `SVG_INLINE`. La soglia è tarata sul primo caso reale.

### F6 — Implementazione CSS/React
Ordine: frozen kit → primitivo → skin token → config → i18n → asset custom.

Gli stati sono CSS su token (`:hover`, `:active`, `[data-disabled]`).

**Gate G6 (bloccante, statico):** nessun `.css` standalone, nessun colore letterale, nessuna stringa hardcoded, nessuna duplicazione di primitivo.

### F7 — Asset pipeline (solo se classificato)
**Artefatto:** `<component>.asset-manifest.json` — per ogni asset: `assetId`, `role`, `bbox`, `format`, `hasAlpha`, `provenance`, `license`.

**Alpha, quando serve, in ordine di preferenza:**
1. **white/black reconstruction** — solo per asset generati in locale con stesso seed. **Testare su suite reale** (hard edge, glow, fumo, particelle, oggetti scuri) prima di chiamarlo "preferito".
2. `rembg` con modello **BiRefNet** o altro modello a licenza compatibile. **NON** `u2net` o `bria-rmbg` se non commerciale.
3. `LayerDiffuse` per SDXL, se white/BiRefNet falliscono.

### F8 — Visual match (metrica ibrida)
Screenshot runtime del componente vs mockup approvato, stessa viewport.

**Automatica (misurabile):**
- silhouette: SSIM o pixelmatch con soglia
- layout: posizione relativa delle regioni semantiche
- palette: distanza colore in LAB o HSL

**Umana (Director):**
- material language
- visual identity
- coerenza con l'intenzione

**PASS:** automatiche tutte OK + Director non boccia le categorie umane. **Se fallisce una categoria automatica, si corregge. Se il Director boccia l'identità visiva, si itera.**

### F9 — Runtime / perf gate
Misurare: FPS, memoria, decode, nodi DOM, texture, repaint, bytes, DPR ≥ 2.

**Gate G9:** per il piloto, i numeri sono aperti e saranno registrati come baseline. Il gate diventa bloccante solo dopo che la prima baseline è stabilita.

### F10 — Safeguard
```bash
npm run lint -- <scope>
npm run test -- <scope>
npm run build:check
npm run kanban:lint
```

Governance: se il componente diventa trusted/frozen → `*_trusted.md` + `COMPONENT_MASTER_INDEX.md` + contract test + evidence.

### F11 — Director review (iterativo fino a soddisfazione)
Si mostra il componente. Se non piace, si itera su F6-F8. **Nessun limite numerico predefinito** (decisione Director). Se il cambiamento richiesto è strutturale, si aggiorna il `contract` e, se serve, il mockup. Il mockup è un riferimento, non un vincolo eterno: quando il componente evolve, il mockup viene contrassegnato come `deprecated` e si usa il componente stesso come nuova baseline.

---

## 7. Mockup esterno — triage e rotte

### Categorie

| Categoria | Origine | Diritti | Rotte |
|---|---|---|---|
| **A** | AI su account Director | secondo ToS del servizio | 1, 2, 3 |
| **B** | Opera di terzi (Pinterest, ArtStation, screenshot) | **nessuno** | **solo 1** |
| **C** | Acquistata/commissionata | secondo licenza | 1, 2, 3 se licenza lo consente |

### Rotte

**Rotta 1 — Reference only (preferita).** Il mockup alimenta il contract e l'implementazione è CSS/React/SVG. Non diventa mai asset. **Ammessa per tutte le categorie**, obbligatoria per B.

**Rotta 2 — Rigenerazione condizionata.** Il mockup esterno entra come `referenceImage` in F2 (`img2img` a denoise basso o IP-Adapter). Produce un derivato con provenance e licenza pulite. **Soglia di successo:** ≥ 12/14 ibrido sul derivato vs mockup esterno, max 3 tentativi. **Prerequisito:** MPS integration test passato (§15).

**Rotta 3 — Estrazione diretta.** Il mockup esterno è la sorgente. Ammessa solo per A e C con licenza compatibile. Non dà stati né varianti.

---

## 8. Quando NON usare il workflow

- Kit copre la funzione.
- Componente principalmente testo/dati.
- Valore è interaction design, non visual art.
- Servono molti stati dinamici o responsive complesso.
- Asset AI è inseparabile.
- Estrazione costa più della ricostruzione procedurale.
- Componente riusato molte volte → meglio un primitivo parametrico.
- Immagine contiene typography importante.
- Costo generativo supera il costo manuale.

---

## 9. Governance ridotta

Artefatti **obbligatori** per ogni componente:
- `<component>.admission.md`
- `<component>.contract.json`
- `<component>.provenance.json`

Artefatti **opzionali** — generati solo quando applicabili:
- `<component>.mockup.png` / `.mockup.meta.json` (se non fast path)
- `<component>.asset-manifest.json` (se ci sono asset)
- `runtime-evidence.md` (se entra in trusted/frozen)

Lo `style-lock` è un artefatto **condiviso** per preset, non per componente.

---

## 10. Pilot — `GoblinEventLabPage`

**Target:** `http://localhost:5173/goblin-event-lab`
**Mockup di riferimento:** `public/mockups/external/goblin-event-lab/goblin-invasion-mockup.png`
**Obiettivo:** falsificare o confermare la tesi "CSS/React first riduce il costo e la fragilità del workflow".

### Prima del pilot
1. Testare MPS IP-Adapter con `diffusers` su un'immagine di prova.
2. Testare white/black alpha reconstruction su: hard edge, glow, fumo, particelle, oggetti scuri, regioni traslucide.
3. Scrivere lo `style-lock` per `wanderlust` con il pilastro corretto.

### Durante il pilot
1. F0: cercare `GoblinEventLabPage` esistente e i 14 `GoblinEventModalV*.tsx`.
2. F1: scrivere contract per il nuovo `GoblinEventLabPage`.
3. F2/F3: generare mockup interno o derivare da quello esterno (rotta 2, se MPS test passa).
4. F4-F10: eseguire i gate.
5. F11: iterare con il Director.
6. Registrare tempo, numero di asset, punteggio metrica ibrida, gate falliti.

---

## 11. Cosa resta aperto

1. **Taratura soglia F5 (distanza CSS vs raster).** Da definire sul primo caso reale.
2. **Baseline numeriche G9.** Da registrare durante il piloto.
3. **Script MPS per IP-Adapter/img2img.** Da scrivere e testare prima di dichiarare rotta 2 operativa.
4. **Suite alpha white/black.** Da eseguire prima del piloto.
5. **Selezione del modello di segmentazione alpha** con licenza compatibile (BiRefNet? LayerDiffuse?).
