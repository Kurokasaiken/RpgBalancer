---
title: PLAN-015 — Port del coastal ripple e retino cellulare (Voronoi) per il mare
type: plan
status: proposto
updated: 2026-09-09
richiesta: R-066
desiderata: v19 (FROZEN)
---

# PLAN-015 — Coastal ripple in produzione, e retino cellulare nel lab

Due tracce distinte, con una causa comune di fallimento.

- **Traccia A** — portare in `/world-surface` il `rippleSoft` che il Director ha approvato
  nel lab (`RICHIESTE.md:1464`, `:1473`).
- **Traccia B** — ottenere in `/sea-effect-lab` un effetto acqua a diagramma di Voronoi.

Il piano non parte dalle tracce. Parte dal motivo per cui nessuno dei due lavori era
**giudicabile**, perché è quello che ha prodotto i quattro tentativi a vuoto.

---

## 1. Premesse del progetto che l'indagine ha smentito

Queste tre affermazioni sono scritte nel repo, sono state usate come base di lavoro, e
sono **false**. Vanno corrette prima di ogni altra cosa, altrimenti il piano eredita gli
stessi errori.

| # | Affermazione scritta nel repo | Realtà misurata |
| - | ----------------------------- | --------------- |
| P1 | *«Nothing here uses RAF: every effect is a CSS keyframe or SMIL, both of which keep running in the preview pane where RAF is frozen»* — `SeaEffectLabPage.tsx:20-23`, ripetuto in `WorldSurfaceSeaMarks.tsx:16-17` | Con `document.visibilityState === 'hidden'` si congela **l'intera timeline del documento**: rAF, keyframe CSS **e SMIL**. Misurato due volte: `feTurbulence.baseFrequencyX.animVal` e `feDisplacementMap.scale.animVal` restano identici a 1.8 s di distanza. Concorda con la memoria di progetto `project_preview_pane_animations_frozen.md`. |
| P2 | *«ogni layer 4240×2828, offset 0/0»* — `worldSurfaceKit.md:52-55` | Tutti e 21 i `.webp` in `public/assets/world/wanderlust/base/layers/` sono **3072×2049**; `event_shroud_left/right.png` sono 2822×1546. Il canvas del manifest è 4240×2828 e i layer vi sono **stirati ×1.3802** da `renderer.imageFit: 'fill'`. |
| P3 | *«/world-surface shows the whole 4240px canvas in roughly 1400 screen px, so map scale is about 0.33»* — `SeaEffectLabPage.tsx`, commento su `zoom` | Zoom di default misurato live: **0.18** (`transform: matrix(0.18, 0, 0, 0.18, 0, 0)` su una box 4240×2828; rect reale 763×509 px). Il lab giudica a **1.8× lo zoom di produzione**: ogni effetto lì sembra più forte di quanto sarà. |

**Conseguenza operativa.** Ogni taratura fatta finora è stata fatta su un fermo immagine
del keyframe 0%, a uno zoom sbagliato di 1.8×. È la spiegazione dell'escalation
`waves.bobWorldPx` 3 → 12 → 20 → 60 su `ed84b56f`, `5fe66371`, `0c296ea3`: si è alzato il
volume di un sistema diverso perché quello giusto non si muoveva sullo schermo di chi
guardava.

---

## 2. Diagnosi — Traccia A

Cosa fa il lab, verificato sul DOM vivo (`SeaEffectLabPage.tsx:775`, `CropImage:198`):
il filtro `feTurbulence` + `feDisplacementMap` è applicato **all'unica `<img src=Mare.webp>`
visibile**. Nessuna copia sovrapposta, nessuna maschera (`mask-image: none`), nessun blend
(`mix-blend-mode: normal`, `opacity: 1`).

Poiché `Mare.webp` ha alpha ed è trasparente sopra la terra, ciò che si muove è il
**bordo alpha del mare** sopra il `Background.webp` fermo — cioè la linea di costa, più
l'inchiostro dipinto della battigia. **Questo** è ciò che il Director ha approvato.

Perché legge solo sulle coste — misurato con PIL sui rettangoli sorgente reali:

| crop | opaco % | lumSD | gradiente medio /3px | gradiente p99 |
| ---- | ------- | ----- | -------------------- | ------------- |
| Mare aperto | 100.0 | 3.15 | 0.376 | 2.57 |
| Fascia ovest | 100.0 | 4.36 | 0.189 | 1.93 |
| Stretto est | 68.2 | 4.88 | 0.560 | 7.63 |
| Isolotto sud | 70.5 | 7.53 | 0.945 | **14.00** |

Uno spostamento di ±2 px sorgente su una pendenza di 0.376/3px cambia la luminanza di
**~0.25 livelli su 255**: fisicamente invisibile. Sullo stesso spostamento in `Isolotto sud`
(bordo alpha netto, p99 = 14) il cambiamento è di ordini di grandezza superiore.

### Perché il port è fallito, in due mosse

**Mossa 1 — l'inversione della compensazione dello zoom.** Il port originale (`8c9cf669`)
aveva il filtro giusto, ma ha copiato dal lab anche la compensazione:

```ts
const baseFreq = (cfg.baseFrequency ?? 0.012) / safeZoom;   // giusto nel lab
const scale    = (cfg.scale ?? 4) * safeZoom;               // giusto nel lab
```

Nel lab quel codice è corretto perché il filtro vive su un `<img>` **già alla scala di
schermo**: lo spazio utente del filtro è in px schermo. In produzione lo stesso codice è
finito su un elemento **dentro la world box**, cioè in world px, dentro
`transform: scale(camera.zoom)` (`WorldSurfaceRenderer.tsx:613`). In world space la
compensazione va nella direzione opposta, o non va fatta affatto: moltiplicare invece di
dividere sbaglia di **1/zoom² ≈ 31×** allo zoom reale 0.18.

I numeri risultanti: `scale = 4 × 0.18 = 0.72` world px → spostamento massimo **±0.36 world
px = ±0.065 px schermo**; `baseFrequency = 0.012/0.18 = 0.0667` → lunghezza d'onda 15 world
px = **2.7 px schermo**, grana sotto il pixel. L'effetto era matematicamente invisibile.

**Mossa 2 — il fix ha buttato il meccanismo e tenuto la forma.** Su quella diagnosi
sbagliata, `c526f058` ha rimosso il displacement e conservato la copia mascherata. Quello
che c'è oggi in produzione (`WorldSurfaceSeaRipple.tsx:134-184`, ramo `smil`, che **non usa
più SMIL**) è una copia pixel-identica e pixel-allineata di `Mare.webp` al 50 % che trasla
rigidamente: a 0 % e 100 % del ciclo il delta col layer sottostante è **esattamente zero**,
nel mezzo è un fantasma.

Tre attenuazioni indipendenti si sommano, tutte verificate:

1. `mix-blend-mode: overlay` è **neutralizzato** dallo stacking context che crea il wrapper
   `z-index: 98` del componente stesso (`WorldSurfaceSeaRipple.tsx:84-92`).
2. `shallow_mask.webp` ha **alpha media 6.8 %**.
3. Il soggetto è sbagliato: nel lab si muove il bordo alpha del mare **di base**; in
   produzione il mare di base non si muove mai, perché l'effetto sta su una copia additiva.

### Difetti collaterali trovati, non ipotizzati

- **Due `TS2304` vivi su `main`**: `useMemo` usato a `WorldSurfaceSeaRipple.tsx:82` e mai
  importato; `WaterFieldConfig` usato a `WorldSurfaceWaterField.tsx:23` e mai importato.
  Nessun gate li cattura (`tsc` non gira in CI, la cartella è in quarantena di lint).
- Il ramo `sprite` è rotto **due** volte: `ReferenceError` da `useMemo`, e il suo
  `mix-blend-mode: overlay` (riga 113) è ucciso dallo stesso stacking context.
- **Un flag pilota due sistemi**: il toggle `Water` accende 7 wave marks + 1 ripple, ma le
  34 sea marks sono accese a prescindere (`showSeaMarks` default `true`,
  `WorldSurfaceRenderer.tsx:255`). Misurato togglando dal vivo: 34 img → 41. Parte di ciò
  che il Director vede muoversi si vede anche con `Water` spento.
- `prefers-reduced-motion` **non** spegne `rippleSoft` nel lab.
- Il guard `tests/unit/frozen/worldSurfaceKit.alignment.test.ts` è **rosso 25/49 da prima**
  di questo lavoro, per tre cause indipendenti (`pngSize()` legge l'header IHDR su file
  `.webp`; `imageFit: fill` su layer non uniformi; l'unico `atmosphereLayer` del manifest è
  cercato in una cartella che non esiste). **Non è utilizzabile come prova di
  non-regressione così com'è.**
- Nessun test nel repo copre atmosfera, acqua o `atmosphereAssets`.
- Non esiste `worldSurfaceKit.cert.json`: il kit è **Draft, non certificato** → nessuna
  re-certificazione è dovuta per modificare i componenti di atmosfera.

---

## 3. Diagnosi — Traccia B

**La traccia B non è mai fallita nel codice: non è mai esistita.** `grep -ril
"voronoi\|worley"` su `src/`, `scripts/`, `tests/`, `public/`, `plans/` → zero. Nessun
`d3-delaunay`, nessun `delaunator`, zero commit. *«Non siamo riusciti»* descrive il fatto
che **nessuna variante candidata è mai stata valutabile**, per la stessa causa della
traccia A (P1): nel pane niente si muove, e il lab è nato esattamente come strumento di
confronto.

La barriera vera è architetturale, e nessuno l'aveva misurata.

**B1 — il tetto texture di WebKit taglia la strada più ovvia.** Il repo ha il suo allarme
già scritto: `useFrameMetrics.ts` esporta `TEXTURE_EDGE_LIMIT_PX = 4096` col commento
*«WebKit refuses textures past this edge, and fails blank rather than throwing»*. La world
box misura **4240 × 2828 CSS px**. Un canvas WebGL o un filtro SVG montato `inset: 0`
dentro la world box è largo 4240 px — **sopra il limite** — e su DPR 2 il backing store
sarebbe 8480. Oggi `maxEdgePx` legge 3072 (verde) solo perché guarda le `<img>` sorgente,
non la box.

**B2 — lo strumento di misura è cieco proprio su queste tecniche.**
`useImageFootprint` conta **solo** `root.querySelectorAll('img')`: un `<div>` con
`background-image` (il ripple attuale, il `WaterField`) o un `<canvas>` WebGL non entrano
né in `rgbaMb` né in `maxEdgePx`. E `useFrameMetrics` è un loop rAF che salta i campioni
quando `document.hidden` → **nel pane legge zero**. L'evidence log frame-time + DPR che
`DECISION_LOG.md:446` impone per ogni nuovo shader **non è producibile** con gli strumenti
attuali dentro il pane.

**B3 — il budget è già sfondato, misurato a freddo su `/world-surface`.**

| metrica | misurato | soglia dichiarata dal repo |
| ------- | -------- | -------------------------- |
| RGBA decodificato | **613 MB** | rosso a 512 MB (`tone(footprint.rgbaMb, 256, 512)`) |
| `<img>` nel subtree | 98 | — |
| elementi con animazione CSS attiva | 99 (34 sea marks + 16 clouds + 16 cloud shadows + 20 birds + 7 waves + 1 foam + 1 ripple) | — |
| sistemi costosi vivi | ~8 (+ un loop rAF permanente per il glass, `WorldSurfaceRenderer.tsx:438-451`, senza guardia su `document.hidden`) | *«massimo 4-5 passi reali costosi a runtime»*, `DESIGN_PILLARS.md:20` e `:36` |

Un contesto WebGL sarebbe il **nono** sistema, non il quinto.

**B4 — precedente storico che nessuno aveva citato.** `WorldSurfaceWaves.tsx:12-16`
documenta che un ripple a displacement Pixi/WebGL sul mare **è già stato costruito e
rimosso**: *«it did not work: shifting the sampling coordinates of a low-contrast baked sea
moves nothing an eye can catch, so the effect cost a WebGL context and a ticker to render
as nothing»*. Un Voronoi generativo è tecnica **diversa** — dipinge celle proprie invece di
risamplare un dipinto piatto — quindi non è coperto da quel rigetto. Ma la strada «shader
sul mare» ha già bruciato un contesto WebGL una volta.

**B5 — Pixi non è la strada in questo repo.** Zero `PIXI.Filter` custom in `src/`.
`destinyAstrolabeV64/tarGooRenderer.ts:14-17` documenta la scelta deliberata di **WebGL2
raw** invece di Pixi, e `WorldSurfacePixiOverlay` non è nemmeno montato su `/world-surface`
(solo su `WorldSurfaceTestPage.tsx:520`).

**Autorizzazione.** `DECISION_LOG.md:446` (2026-08-31) ammette esplicitamente shader custom
nel water lab, **con fallback DOM ed evidence log frame-time + DPR**. Il rigetto di
`Decision 011` è circoscritto (*«unnecessary for the first path»*) e precedente.

---

## 4. Il piano

Ogni fase richiede uno stato che la fase precedente garantisce. La fase 0 è un cancello:
senza di essa nessuna fase successiva è verificabile, ed è esattamente l'errore che ha
prodotto i quattro tentativi a vuoto.

### Fase 0 — Rendere il lavoro giudicabile *(cancello; blocca tutto il resto)*

| T | Cosa | Stato garantito all'uscita |
| - | ---- | -------------------------- |
| T-000 | Correggere i due docblock falsi (`SeaEffectLabPage.tsx:20-23`, `WorldSurfaceSeaMarks.tsx:16-17`): la timeline del documento si congela con `visibilityState: hidden`, SMIL e keyframe CSS **inclusi`. | Il repo non insegna più una cosa falsa a chi lo legge dopo. |
| T-001 | Aggiungere i due import mancanti (`useMemo`, `WaterFieldConfig`). | `npx tsc --noEmit` non riporta più i due `TS2304`; il ramo `sprite` non lancia più `ReferenceError`. |
| T-002 | Stabilire il **protocollo di verifica**: ogni giudizio su un'animazione si dà in un browser vero, oppure pilotando `el.getAnimations()[0].currentTime` / `svg.setCurrentTime()` a mano. Scriverlo nel piano e nel docblock del lab. | Nessuna taratura successiva è fatta su un fermo immagine. |
| T-003 | Sganciare `WorldSurfaceWaves` da `showSeaRipple` (`WorldSurfaceRenderer.tsx:823`) e dare a `showSeaMarks` un toggle proprio nel debug panel. | Un flag = un sistema. Diventa possibile attribuire ciò che si vede. |
| T-004 | Allineare il lab allo zoom reale: sostituire il `0.33` hardcoded con il valore misurato **0.18** come preset «(mappa)», tenendo lo slider per l'ispezione ravvicinata. | Il lab smette di sovrastimare ogni effetto di 1.8×. Vedi **punto aperto 1**. |

**Criterio di uscita fase 0:** `npx tsc --noEmit` pulito sui file toccati; il toggle `Water`
accende **solo** il ripple, verificato contando gli elementi animati dal vivo; il preset
«(mappa)» del lab riporta 0.18.

### Traccia A — Il coastal ripple in produzione

| T | Cosa | Stato garantito all'uscita |
| - | ---- | -------------------------- |
| T-010 | **Spostare il soggetto.** Applicare `filter: url(#id)` all'`<img>` del layer `sea` (id `sea`, `Mare.webp`, z=10) — che è già in world px dentro la box e ha la sua alpha. Eliminare la copia sovrapposta, l'`opacity: 0.5`, il `mix-blend-mode` e la `shallow_mask` (alpha media 6.8 %): sono quattro attenuazioni che il lab non ha. Il carattere costiero viene dal dipinto, non da una maschera — è la tabella §2 che lo dimostra. | Il soggetto in produzione è **lo stesso** del lab: il bordo alpha del mare sopra il Background fermo. |
| T-011 | **Correggere la scala.** Sull'`<img>` del layer `sea` lo spazio utente del filtro è in px **sorgente** (3072×2049), poi stirato ×1.3802 da `imageFit: fill` e poi ×zoom dalla world box. Quindi **non** dividere per lo zoom: fissare `baseFrequency` e `scale` in unità sorgente costanti (target dal lab: lunghezza d'onda ~83×52 px sorgente, spostamento massimo ~2 px sorgente → `scale ≈ 4` in spazio sorgente) e **togliere `zoom` dalla firma del componente**. | L'ampiezza non dipende più dallo zoom in modo errato. Nota da dire al Director: a zoom 0.18, ±2 px sorgente valgono **±0.5 px schermo**. Se non lo vede, il parametro da alzare è `scale`, non `bobWorldPx`. |
| T-012 | Ripristinare l'animazione: `<animate>` SMIL su `baseFrequency` e `scale` come nel lab (18 s / 12.6 s), e far rispettare `prefers-reduced-motion` **sia** in produzione **sia** nel lab (oggi manca in entrambi per questa variante). | L'effetto si muove, e si spegne per chi lo chiede. |
| T-013 | Togliere lo `z-index` numerico dal wrapper, o dichiarare `isolation: isolate` esplicitamente se un blend serve davvero. | Nessun blend silenziosamente neutralizzato. |
| T-014 | **Misurare in un browser vero** con `WorldSurfacePerfHud`: `frame p50/p95/worst`, `long frames`, DPR, prima e dopo. Registrare in `test-results/`. | Evidence log reale, non un foglio di zeri. Vedi **punto aperto 3**. |

**Criterio di uscita traccia A — misurabile:** in un browser vero, a zoom di default,
un confronto A/B di due frame a mezzo ciclo di distanza mostra sulla linea di costa un
delta di luminanza ≥ 3 livelli su 255 (contro gli attuali ~0), e `frame p95` non peggiora
di più di 2 ms rispetto alla baseline registrata in T-014.

**Rischio da verificare in T-014, non da assumere risolto:** un filtro SVG su un `<img>`
dentro la world box promossa (`translateZ(0)`, `WorldSurfaceRenderer.tsx:608-612`) forza il
ri-rasterizzo di quel livello a 4240×2828 ≈ 12 Mpx per frame, e **4240 > 4096**, il tetto
oltre il quale WebKit *«fails blank rather than throwing»*. Se il layer sparisce in bianco
su WebKit o se `p95` peggiora, **la strada è chiusa** e va sostituita da un pass di asset
dipinti sulla battigia (idioma `SeaMarks`), non da un altro overlay.

### Traccia B — Il retino cellulare nel lab

| T | Cosa | Stato garantito all'uscita |
| - | ---- | -------------------------- |
| T-020 | Costruire lo spike **come pagina standalone**, non come tile del lab, sul modello esistente `public/land-breath-spike.html` (già il pattern prescritto da `PLAN-014:60`). Motivo: `/sea-effect-lab` vive nel pane, dove nulla si muove. | Il Voronoi è giudicabile — cosa che nessun tentativo precedente è mai stato. |
| T-021 | Worley **F2−F1** su canvas **WebGL2 raw** con un solo quad fullscreen, modellato su `destinyAstrolabeV64/tarGooRenderer.ts` (compile/link :217-243, quad :245-250, `drawArrays` :307). **Non** un `PIXI.Filter`: vedi B5. Fallback obbligatorio nella forma già idiomatica del repo: `const gl = canvas.getContext('webgl2'); if (!gl) return null;`. | Tecnica coerente col repo, con il fallback che `DECISION_LOG.md:446` impone. |
| T-022 | **Dimensionare il canvas alla superficie a schermo, mai al world box.** Superficie utile reale a zoom 0.18: **763×509 px**; un canvas 1024×768 con backing store cappato a DPR ≤ 2 basta. Corollario: un canvas così **non può stare `inset: 0`** dentro la world box → va montato **fuori** dalla box e riproiettato via uniform (pan/zoom passati allo shader come offset/scale UV), non via `transform` CSS. Vedi **punto aperto 4**. | Il tetto 4096 non viene mai sfiorato. |
| T-023 | Requisiti estetici, dal feedback già registrato in `RICHIESTE.md` punti 11-13: i siti delle celle devono **orbitare** (le celle cambiano forma mentre scorrono, non traslano rigide), i bordi vanno da F2−F1 morbido, e la taglia delle celle **non** uniforme. Un reticolo a celle di taglia uguale che trasla è per costruzione geometrico, cioè esattamente la critica «deve essere meno geometrico» (punto 11) e «sembra una proiezione geometrica» (punto 12). | Il candidato non ricade nel difetto già bocciato tre volte. |
| T-024 | Giudizio del Director sullo spike, **sull'artwork reale allo zoom reale 0.18**, non su un crop ingrandito. Solo la variante approvata rientra nel lab come tile. | Decisione estetica presa da chi la deve prendere. |
| T-025 | *(condizionale al sì di T-024)* Evidence log frame-time + DPR in browser vero, e proposta di **cosa esce** dalla mappa in cambio. Vedi **punto aperto 2**. | Promozione in produzione istruita, non improvvisata. |

**Criterio di uscita traccia B — misurabile:** la pagina spike gira a `frame p95 ≤ 16.7 ms`
su DPR 2 con il canvas a 1024×768, il fallback senza WebGL2 rende una pagina leggibile
invece di un rettangolo nero, ed esiste un log in `test-results/` con i numeri.

---

## 5. Punti aperti — decisioni del Director, non mie

1. **Il lab giudica a 0.33, la produzione gira a 0.18.** Allineare il lab alla realtà
   (T-004) significa che *tutto* sembrerà più debole di come è stato giudicato finora,
   incluso il `rippleSoft` approvato. Si allinea, o si tiene il lab come lente
   d'ingrandizzazione dichiarata?
2. **Il budget è già rosso** (613 MB contro 512, ~8 sistemi contro 4-5). Se il Voronoi
   entra in produzione, qualcosa deve uscire. I candidati naturali sono le 34 sea marks
   sempre accese e i 7 wave marks — cioè esattamente la tecnica che il Voronoi
   sostituirebbe. Nel lab nessun budget si applica (`RICHIESTE.md:1480`).
3. **Il guard `worldSurfaceKit.alignment.test.ts` è rosso 25/49 da prima** di questo
   lavoro, per tre cause indipendenti. Si ripara ora (fuori dallo scope di R-066), o si
   dichiara esplicitamente non-utilizzabile come prova di non-regressione per questo piano?
4. **`imageFit: 'fill'` stira i layer 3072×2049 → 4240×2828.** L'invariante scritta in
   `worldSurfaceKit.md:52-55` è falsa e gli `event_shroud` violano già letteralmente il
   terzo divieto del contratto. Si corregge il documento, o si ri-estraggono i layer a
   dimensione piena? *(E, collegato: montare il canvas del Voronoi fuori dalla world box
   con riproiezione via uniform sfiora l'invariante «una sola matrice per tutti».)*
5. **Se T-014 mostra che il filtro SVG full-canvas non regge** (bianco su WebKit, o `p95`
   fuori budget): si accetta il fallback ad asset dipinti sulla battigia in idioma
   `SeaMarks`, o si chiude la traccia A?

---

## 6. Cosa questo piano NON fa (YAGNI)

- Non tocca `renderer.imageFit`, gli offset o le dimensioni dei layer.
- Non introduce Pixi, né un `PIXI.Filter`.
- Non promuove il Voronoi in produzione: T-025 è condizionale a un sì esplicito.
- Non ripara il guard rosso preesistente (punto aperto 3).
- Non aggiunge nuovi sistemi costosi in traccia A: un filtro SVG su un `<img>` esistente
  non aggiunge layer né contesti.

---

## 7. Decisioni del Director (2026-09-09) e loro effetto sul piano

| # | Domanda | Risposta | Effetto |
| - | ------- | -------- | ------- |
| 1 | Allineare il lab allo zoom reale 0.18? | **No** | **T-004 cancellato.** Il lab resta una lente d'ingrandimento a 0.33; il fatto è ora documentato nel docblock invece di essere corretto nel codice. Conseguenza da tenere a mente: ogni variante approvata nel lab arriverà in produzione ~1.8x più debole. |
| 2 | Se il Voronoi entra in produzione, cosa esce? | **«dobbiamo ottimizzare quella pagina, c sn troppe cose inutili»** | Nuovo workstream, §8. Non è più «cosa esce in cambio»: l'ottimizzazione è un obiettivo suo. |
| 3 | Riparare il guard `worldSurfaceKit.alignment.test.ts` (rosso 25/49 da prima)? | **«nn importa»** | Fuori scope. Registrato: non è prova di non-regressione per questo piano. |
| 4 | Correggere il documento o ri-estrarre gli asset? | **«la mappa così è perfetta»** | Non si tocca l'aspetto. `worldSurfaceKit.md:52-55` va corretto come documento. **Vedi §8: esiste un'ottimizzazione che non cambia un pixel ma richiede di ritagliare gli asset — va chiesta a parte, perché la lettera di questa risposta la escluderebbe.** |
| 5 | Fallback se il filtro SVG full-canvas non regge (4240 > 4096)? | **«nn so d che parli»** | Non è una decisione di direzione: contingenza tecnica. La misuro in T-014 e la riporto solo se si verifica. |

### Fase 0 — eseguita (2026-09-09)

- **T-000 fatto.** Corretti i due docblock falsi (`SeaEffectLabPage.tsx`, `WorldSurfaceSeaMarks.tsx`) e documentata anche la trappola dello zoom 0.33 vs 0.18.
- **T-001 fatto.** Aggiunti `useMemo` e `WaterFieldConfig`. Typecheck isolato dei file toccati: pulito.
- **T-002 fatto.** Protocollo di verifica scritto nel docblock del lab.
- **T-003 fatto.** `showWaves` è ora una prop indipendente (default `false`); `/world-surface` ha tre toggle separati `Water` / `Marks` / `Waves`. Verificato dal vivo: `Marks` OFF → −33 immagini; `Waves` ON → +7; `Water` ON → +1 elemento animato e **zero** variazione sulle onde. Attribuzione risolta.
- **T-004 cancellato** dalla decisione 1.

**Scoperta durante T-001 — il repo non ha alcun controllo dei tipi.** Tre cause in serie:
1. `tsconfig.json` (root) fallisce con `TS5103` (`ignoreDeprecations: "6.0"` non valido su TS 5.9) e non controlla nulla; ha anche `files: []` e nessun `include`.
2. `tsconfig.app.json` incontra **errori di sintassi** (stringhe non terminate in `src/analytics/guardian/GuardianDryRunAnalyzer.ts:838`, `src/ui/idleVillage/utils/mapPerformanceProfilerEngine.ts:858`). TypeScript riporta i 263 errori sintattici e **salta l'intera fase semantica**: un identificatore inventato non produce `TS2304` da nessuna parte del repo.
3. Nessuno script npm invoca `tsc`. `build:check` → `npm run build` → `vite build` → esbuild, che **rimuove i tipi senza controllarli**.

Inoltre **eslint ignora** tutti i file di `src/ui/idleVillage/components/` e `pages/` toccati qui (`File ignored because of a matching ignore pattern`). Non è «un gate che non ha catturato l'errore»: non esiste il gate. Fuori scope di R-066, ma va deciso a parte.

---

## 8. Workstream O — Ottimizzazione di `/world-surface` *(dalla decisione 2)*

Misurato dal vivo a caricamento completo: **611 MB** di RGBA decodificato, 91 immagini, 91 elementi animati. La ripartizione smentisce l'ipotesi che il costo stia negli effetti.

| gruppo | immagini | RGBA | quota |
| ------ | -------- | ---- | ----- |
| layer dipinti della mappa | 25 | **570.8 MB** | **93 %** |
| nuvole | 16 | 16.2 MB | 3 % |
| ombre nuvole | 16 | 16.2 MB | 3 % |
| sea marks | 34 | 8.0 MB | 1 % |

Ogni layer è 3072×2049×4 = 24 MB **indipendentemente da quanto è dipinto**. Misurato il bounding box reale dei pixel opachi di ciascuno:

| layer | area del bbox | dipinto | MB oggi | MB ritagliato |
| ----- | ------------- | ------- | ------- | ------------- |
| `Zona montana nord.webp` | 11 % | 6 % | 24.0 | 2.7 |
| `Foresta 1 Alto Sin.webp` | 8 % | 4 % | 24.0 | 2.0 |
| `Villaggio.webp` | **1 %** | 1 % | 24.0 | **0.3** |
| `Isola basso sinistra.webp` | **1 %** | 1 % | 24.0 | **0.2** |
| *(altri 13 layer fra l'1 % e il 6 %)* | | | 24.0 ognuno | 0.2–1.4 |
| **totale 24 layer** | | | **562 MB** | **164 MB** |

**397 MB su 562 (71 %) sono pixel completamente trasparenti.**

### O-1 — Ritagliare i layer al bounding box reale, con offset nel manifest
Risparmio **−397 MB** (611 → ~214 MB, sotto la soglia gialla del PerfHud). **Non cambia un pixel** di come si vede la mappa: si ritaglia e si compensa con l'offset. Richiede però di rigenerare gli asset, quindi **collide con la lettera della decisione 4** e va autorizzata a parte. È anche il lavoro che rende falsa per costruzione l'invariante «offset 0/0» — che oggi è già falsa nei fatti.

### O-2 — Caricare gli `event_shroud` solo all'evento
Due layer (`event_shroud_left/right.png`, 16.6 MB ognuno) sono decodificati al caricamento e **invisibili**: **−33 MB** subito, rischio zero, nessun cambiamento visivo.

### O-3 — `foam_mask.webp` è una maschera, non un layer
Dipinta al 100 %, quindi 24 MB pieni. Va verificato se è decodificata come layer del manifest: se sì, è **−24 MB** convertendola in `mask-image` o in un canale alpha di un asset esistente.

### O-4 — Ridurre gli elementi animati
91 elementi animano in permanenza, contro i «massimo 4-5 passi reali costosi» di `DESIGN_PILLARS.md:20`. I 33 sea marks sono i primi candidati: nel lab il Director li ha giudicati *«invisibili o macchie a caso»* (`RICHIESTE.md`, R-066 punto 6), e ora hanno un toggle proprio con cui misurarne l'effetto reale.

**Ordine raccomandato:** O-2 (gratis) → O-3 (verifica) → O-4 (decisione estetica, già istruita) → O-1 (il grosso, ma richiede il via libera sugli asset).

---

## 9. Traccia A — eseguita (2026-09-09)

| T | Esito |
| - | ----- |
| T-010 | **Fatto.** Il filtro è ora applicato all'`<img>` del layer `sea` tramite una prop `filterId` su `LayerView`. La copia sovrapposta, l'`opacity: 0.5`, il `mix-blend-mode` e la `shallow_mask` sono eliminati. In modo `smil` il componente non rende più **nulla di visibile**: contribuisce solo il `<filter>`. Verificato dal vivo: `copieDiMare: 1`, zero `<div>` con `Mare.webp` come background. |
| T-011 | **Fatto.** `zoom` rimosso dalla firma del componente. `baseFrequency` e `scale` sono ora in **world px costanti**: `0.0087` e `10`. Derivazione scritta nel docblock e nella config. |
| T-012 | **Fatto.** `<animate>` SMIL su `baseFrequency` (18 s) e `scale` (12.6 s). `prefers-reduced-motion` gestito in un punto solo: `useReducedMotion` è ora un hook condiviso (`hooks/useReducedMotion.ts`), e il renderer usa **la stessa** condizione per montare il filtro e per referenziarlo. Necessario: `filter: url(#missing)` non degrada a «nessun filtro» — da specifica l'elemento **non viene reso**, e il mare sparirebbe. |
| T-013 | **Fatto.** Il ramo `smil` non ha più wrapper con `z-index`, quindi non crea stacking context. Nel ramo `sprite` `zIndex` e `mix-blend-mode` stanno ora sullo **stesso** elemento: era il wrapper a uccidere il blend. |
| T-014 | **Parziale.** Meccanismo verificato, costo no. |

### Verifica eseguita

Pilotando la timeline SMIL a mano (`svg.setCurrentTime()`), come impone il protocollo di T-002:

| t (s) | `baseFrequency` X | Y | `scale` |
| ----- | ----------------- | - | ------- |
| 0 | 0.00870 | 0.01392 | 5.50 |
| 4.5 | 0.01022 | 0.01196 | 8.71 |
| 6.3 | 0.01083 | 0.01118 | **10.00** |
| 9 | 0.01175 | 0.01001 | 8.07 |
| 12.6 | 0.01053 | 0.01157 | 5.50 |
| 18 | 0.00870 | 0.01392 | 9.36 |

X sale mentre Y scende: il campo di noise **si deforma** invece di scorrere — una texture che scorre legge come un velo sopra il dipinto, una che si deforma legge come il dipinto che si muove. I due periodi (18 s e 12.6 s) battono l'uno contro l'altro: a t=18 la frequenza è tornata al punto di partenza ma l'ampiezza no, quindi il ciclo apparente si richiude a 126 s.

Altre verifiche:
- `filter: url("#wsSeaRippleDisplace")` presente sull'`<img>` del mare con `Water` ON, assente con `Water` OFF, filtro nel DOM solo quando serve.
- Mare visibile e integro (4240×2828) con il filtro attivo: **nessuna regressione di rendering**.
- Regione del filtro ridotta da `-5%/110%` a `0/100%`: da 4664×3110 a 4240×2828 di area da rasterizzare (−13 %), dato che lo spostamento di picco è ±5 world px e il margine non serviva.
- Typecheck isolato dei file modificati: pulito. I 5 errori residui nella catena (`WorldSurfaceBirds` props, `visibleLayerIds.has`, `import.meta.env`) sono **preesistenti** — `WorldSurfaceBirds` è alla riga 804 già su `HEAD`.

### Cosa resta di T-014, e perché non l'ho chiuso

Il costo di frame **non è misurabile da qui**: `useFrameMetrics` è un loop rAF e nel pane di preview `document.hidden` lo azzera — il PerfHud legge `0.0 ms`. Serve una finestra di browser vera. Le due domande aperte:
1. `frame p95` peggiora? Un filtro SVG su un `<img>` dentro la world box promossa a `translateZ(0)` forza il ri-rasterizzo di ~12 Mpx per frame.
2. Il layer regge su Safari / WebView Tauri? Il box è 4240 px, sopra il tetto 4096. Su Chromium è verificato integro.

### Nota di taratura

A zoom 0.24 (quello misurato ora) `scale: 10` dà un picco di ±1.2 px sullo schermo. È **volutamente** più forte del fedele 5.52, per pareggiare l'ampiezza a schermo che il Director ha approvato nel lab a 0.33. Se serve più o meno, il parametro è uno: `atmosphereAssets.seaRipple.scale`.

### Osservazione fuori scope, registrata

Le masse d'acqua **interne** si rendono nere a viewport piccolo, sia con `Water` ON sia OFF, quindi indipendentemente da questo lavoro. A 1440×900 a caricamento completo si rendono correttamente pallide. Non diagnosticato.

---

## 10. Workstream O-1 — eseguita (2026-09-10)

Ritaglio dei layer al bounding box dipinto, autorizzato dal Director.

### Risultato misurato dal vivo su `/world-surface`

| metrica | prima | dopo |
| ------- | ----- | ---- |
| RGBA decodificato (PerfHud) | **613 MB** (soglia rossa: 512) | **215 MB** (soglia gialla: 256 → **verde**) |
| RGBA dei soli layer di base | 504 MB | 108 MB |
| layer ritagliati | — | 18 su 21 |

Non ritagliati, perché il loro bounding box copre il 100 % del canvas e non ci sarebbe
guadagno: `sea`, `border`, `frame`. Esclusi per nome: `event_shroud_left/right`, gli
unici layer che il renderer posiziona da sé (offset ±canvas, `objectFit: cover`) e che
sono dipinti al 100 % comunque.

Esempi del divario: `village` dipinge l'1 % del canvas e occupava 24 MB, ora 0.3 MB
(400×187 @ 1295,1037); `forest_light_right_center` l'1 %, da 24 a 0.3 MB;
`mountain_zone_north` l'11 %, da 24 a 2.7 MB.

### Come è garantito che non cambi un pixel

`renderer.imageFit: 'fill'` mappa l'intera sorgente sull'intero canvas in modo lineare,
quindi un pixel sorgente a `sx` finisce a `sx/sourceWidth` del canvas. Il renderer
mette il crop a `rect.x/sourceWidth` e lo dimensiona a `rect.width/sourceWidth`: ogni
pixel torna dove lo stiramento full-canvas lo metteva. Due scelte rendono
«identico» vero e non approssimato:

- **Re-encode lossless** (`webp({ lossless: true })`) dal decodificato originale. Un
  re-encode lossy di una sorgente già lossy sposterebbe i valori dei pixel senza alcun
  guadagno: il file è piccolo comunque, perché il contenuto è piccolo.
- **Soglia alpha > 0, non > 8.** Il bounding box include qualsiasi pixel con anche una
  sola unità di alpha, più 2 px di margine. Ritagliare ai pixel «visibilmente opachi»
  taglierebbe il bordo morbido di una pennellata, e quello *è* un pixel cambiato.

### Prove eseguite

**1. Identità degli asset** — `npm run world:crop-verify` (18/18):

> alpha byte-identica, RGB byte-identico su **ogni pixel visibile**, e **zero pixel
> dipinti scartati** fuori dal rect.

Il criterio non è byte-per-byte sui quattro canali, e la ragione è misurata: in un
pixel con alpha 0 l'RGB non è usato da nulla e un encoder lossy vi mette ciò che
vuole. Su `Villaggio.webp`, 13 890 dei 27 888 pixel completamente trasparenti portano
RGB diverso dall'originale, e nessuno di essi può raggiungere lo schermo. La prima
versione del verificatore confrontava una ricomposizione via `composite()` di sharp e
dichiarava **tutti e 18** i layer diversi con delta 255: era lo script a sbagliare —
compositare su un canvas trasparente azzera l'RGB sotto i pixel trasparenti. La
seconda metà del controllo (che fuori dal rect l'originale sia vuoto) mancava del tutto
nella prima versione: senza di essa un crop che tagliasse mezza montagna sarebbe
passato.

**2. Esattezza del posizionamento** — misurata nel DOM vivo confrontando il rect reale
di ogni `<img>` con quello atteso dalla mappatura full-canvas originale:

> errore massimo **0.01 world px** su 18 layer (arrotondamento della lettura del rect),
> e `naturalWidth/Height` coincidenti con i rect del manifest.

**3. Nessuna regressione** — 91/91 layer decodificati, `edge massimo` 3072,
`oltre 4096px` = 0, zero errori in console, ripple ancora attivo
(`filter: url("#wsSeaRippleDisplace")` sull'unica `<img>` del mare, `copieDiMare: 1`).

### Strumenti aggiunti

- `npm run world:crop-layers` — esegue il ritaglio e scrive `rect` nel manifest.
- `npm run world:crop-layers:dry` — anteprima senza scrivere.
- `npm run world:crop-verify` — la prova; esce non-zero al primo fallimento, quindi è
  usabile come gate. Rifiuta di sovrascrivere asset non tracciati da git.

### Effetti collaterali dichiarati

- Lo schema del manifest ha un campo nuovo, `rect`, **opzionale**: assente = layer
  full-canvas, comportamento identico a prima.
- I tre layer «hero» del Breath (`background`, `forest_1_top_left`,
  `mountain_zone_north`) hanno un percorso di rendering separato; anche quello applica
  la geometria del crop, altrimenti salterebbero all'accensione di `Breath`.
- Lo slider per-layer `scale` del debug panel ora ancora al vertice del **crop** invece
  che a quello del canvas. Nessun layer del manifest dichiara `scale != 1` o un offset,
  quindi a riposo non cambia nulla: cambia solo come si sente quello slider.
- Il `node` di default della shell è v16 e non regge gli import attributes di `sharp`.
  Gli script vanno con il v20.20.0 che `launch.json` già pinna.

### Non fatto, e perché

`worldSurfaceKit.md:52-55` continua a dichiarare l'invariante «ogni layer 4240×2828,
offset 0/0», che era già falsa prima (i layer erano 3072×2049) e ora è falsa due volte.
Va riscritta, ma è documentazione di un kit `Draft` non certificato e il Director ha
messo il guard fuori scope (decisione 3).

---

## 11. «Come portiamo il ripple sulle coste e attorno alle isole?» (2026-09-10)

Domanda del Director. La risposta, misurata: **c'è già su tutte e due**, e non serviva
portarlo da nessuna parte.

### Perché è già attorno alle isole

Il filtro sta sull'`<img>` del layer `sea`, e ciò che si muove è il **bordo alpha di
`Mare.webp`**. Misurato: `Mare.webp` è opaco al 44.8 % e ha i buchi esattamente dove
c'è la terra, isole comprese. Il suo bordo alpha è **63 055 px** — l'1 % del canvas —
e traccia l'intera linea di costa, incluse tutte e tre le isole del sud. Non serve
alcun layer aggiuntivo: l'ingrediente era già lì.

Mappa diagnostica: `mappa-bordo-acqua.png` (blu = mare, verde = terra, rosso = bordo).

### Quanta di quella costa funziona davvero

Il ripple si vede quando il mare si **ritira** e rivela il fondo dipinto sotto. Le
escursioni verso il mare aperto coprono mare con mare e non producono nulla: l'effetto
è asimmetrico per costruzione. Misurato sui 52 827 px di bordo, guardando entro 6 px
verso terra quale layer è il primo opaco:

| esito | quota |
| ----- | ----- |
| rivela il **fondo dipinto** → il ripple si vede | **81.9 %** |
| **occluso** da un layer disegnato sopra il mare (foreste, montagne, isole dipinte fin sopra la battigia) | 18.0 % |
| nulla sotto | 0.1 % |

Il 18 % occluso è una proprietà del dipinto, non del codice: là la terra è dipinta
oltre la linea d'acqua. Non è correggibile senza toccare gli asset.

### Quanto contrasto ha su cui lavorare

Delta di luminanza fra il mare e il fondo che si rivelerebbe, per ognuno dei 45 758 px
di battigia utile:

| misura | valore (livelli su 255) |
| ------ | ----------------------- |
| p10 | 5.2 |
| **p50** | **28.3** |
| p90 | 80.2 |
| battigia con delta > 20 | 63.1 % |
| battigia con delta > 40 | 35.0 % |
| *confronto: mare aperto (`Decision 011`)* | *0.25* |

La battigia ha ~113× il contrasto del mare aperto. E il contrasto più alto è
concentrato **a sud, attorno alle isole** — esattamente dove il Director l'ha chiesto.

Mappa di calore: `contrasto-battigia.png` (rosso = alto contrasto).

### Ampiezza: la produzione è già più forte del lab

| | ampiezza di picco a schermo |
| - | --------------------------- |
| lab, `rippleSoft` a zoom 0.33 gain 1 (quello approvato) | ±0.66 px |
| produzione, `scale: 10` a zoom 0.30 | **±1.50 px** |

2.3×. Il problema non era mai l'ampiezza in produzione: era che con `scale = 4 × zoom`
l'ampiezza era ±0.065 px, e che nessuno l'ha mai guardata in un browser vero.

### Lo strumento aggiunto: slider live

`/world-surface` ha ora uno slider **Ripple** che compare quando `Water` è accesa, da 0
a 60 world px, con l'ampiezza a schermo calcolata accanto (`± (scale/2) × zoom`). Il
renderer ha una prop `seaRippleConfig` per l'override, sul modello di `waterFieldConfig`.

Serve a chiudere il giro senza passare da un file di config e un reload — che è ciò che
ha reso lenti i quattro tentativi precedenti. Il Director trova il valore che gli piace
in un browser vero e lo comunica; quello diventa il default in `atmosphereAssets`.

Verificato dal vivo: slider a 30 → `feDisplacementMap scale="30"`, etichetta `±15.00 px`,
ritorno a 10 corretto.

### Se non basta, i leve che restano (in ordine)

1. **`scale`** — lo slider. È il primo tentativo e costa zero.
2. **`seconds`** — 18 s è lento di proposito. Un ciclo più corto rende il movimento più
   evidente a parità di ampiezza, al prezzo di sembrare meno «acqua» e più «vibrazione».
3. **`baseFrequency`** — 0.0087 dà onde da ~115 world px. Alzarla dà increspature più
   fitte, che a zoom 0.18-0.30 rischiano di scendere sotto il pixel.
4. **Il 18 % occluso** — richiede di ridipingere la battigia dei layer di terra.
5. **Se il displacement non convince comunque**: un pass di asset dipinti sulla battigia
   in idioma `SeaMarks`, cioè disegnare la schiuma invece di deformare il bordo. È
   l'alternativa che `Decision 011` già indicava, e il ripple non la esclude.

### Errore commesso e corretto, da registrare

Ho dichiarato «typecheck pulito» su un run che non aveva controllato nulla: la mia
config isolata aveva `types: ["vite/client"]`, non risolvibile fuori dal progetto, e
`TS2688` **aborta la fase semantica** esattamente come il `TS5103` del `tsconfig.json`
di root. Un identificatore inventato non produceva errori. Con `types: []` il controllo
gira (validato con un canary) e riporta i **soli 5 errori preesistenti** già noti
(`.has` su `Set|Array`, props di `WorldSurfaceBirds`, due su `fallTarget`,
`import.meta.env`), a righe spostate dalle mie aggiunte. Zero errori nuovi.

Lezione operativa: in questo repo **ogni** verifica di tipo va validata con un canary
prima di crederle, perché tre meccanismi diversi la rendono silenziosamente vacua.

---

## 12. Le due isole senza effetto — diagnosticato e risolto (2026-09-10)

Osservazione del Director, dal browser vero: *«le due isole nn hanno quell'effetto sulle
coste»*. Confermata alla lettera dalla misura, per-layer, dei px di bordo d'acqua entro
10 px dall'area dipinta di ciascun layer:

| layer | bordo d'acqua vicino | occluso |
| ----- | -------------------- | ------- |
| **`island_bottom_left`** | 1462 px | **100 %** |
| **`island_bottom_right`** | 1858 px | **99.2 %** |
| `mountain_zone_north` | 5152 px | 95 % |
| `mountain_island_bottom_left` | 1886 px | 61 % |
| `forest_2_dark_bottom_left` | 613 px | 22.3 % |
| coste del continente | — | 0–3.4 % |

**Causa.** Le due isole sono dipinte **più grandi del loro ritaglio nel mare**: sporgono
sopra il mare opaco per una fascia di ~10 px, pari al **19.9 %** e al **15.1 %** della
loro area dipinta. Il bordo alpha del mare finisce quindi *dentro* l'isola, sotto la sua
pittura, e il ripple lì è invisibile per costruzione. Nel lab l'effetto funzionava
perché la terra (`Background.webp`) sta **sotto** il mare; sul continente vale ancora
(`background` è a zIndex 5), su queste due isole no (zIndex 15 e 20).

**Soluzione scartata.** Spostare le due isole sotto il mare le farebbe clippare dal mare
per il 19.9 % e il 15.1 % della loro pittura: perderebbero un quinto di sé. Misurato,
non stimato.

**Soluzione adottata.** Su quelle isole la linea d'acqua **è** il loro bordo dipinto,
quindi il filtro va anche su di loro. Nuovo campo di config `seaRipple.extraLayerIds`,
default `['island_bottom_left', 'island_bottom_right']`; il renderer applica il filtro a
`sea` più quei layer.

Esclusi di proposito: `mountain_zone_north` (95 % occluso, ma è la catena settentrionale
lungo il bordo alto — una montagna che si deforma si noterebbe molto più di una battigia)
e `mountain_island_bottom_left` (61 %, ma il 39 % della sua costa legge già dal bordo del
mare).

**Compromesso dichiarato.** Questo deforma l'intero layer dell'isola, quindi il suo
interno si deforma quanto il suo bordo: ±5 world px ≈ ±1.5 px schermo a zoom 0.3. Se
legge come «l'isola ondeggia» invece che come «l'acqua lambisce», il passo successivo è
mascherare il displacement al solo bordo esterno (`feMorphology` erode sull'alpha, e
l'interno ricomposto dalla sorgente non deformata) — **non** abbassare `scale` per tutto.

**Verificato dal vivo:** `filter: url("#wsSeaRippleDisplace")` presente su `Mare.webp`,
`Isola basso sinistra.webp` e `Isola basso a destra.webp`; nessun altro layer lo porta;
`scale: 10`.

`scale` resta 10 in `atmosphereAssets` per decisione del Director, e lo slider resta.

### Stato della Traccia B (Voronoi)

**Non costruita.** È diagnosticata (§3: non esisteva una riga di Voronoi/Worley nel
repo) e pianificata (§4, T-020…T-025), ma il Director ha scelto la Traccia A come
priorità e nient'altro è stato fatto. Nel Sea Effect Lab non c'è nessuna variante
Voronoi.
