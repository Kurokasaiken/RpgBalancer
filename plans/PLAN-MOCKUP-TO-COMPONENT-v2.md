# PLAN-MOCKUP-TO-COMPONENT v2 — Da richiesta (o mockup esterno) a componente React

**Status:** Draft — in attesa di cold read avversariale
**Date:** 2026-08-14
**Supersede:** `PLAN-MOCKUP-TO-COMPONENT-v1.md` (bocciato dalla delibera multi-AI: 6 blocking)
**Desiderata FROZEN:** `.mw/desiderata.md` v5
**Richiesta:** R-023
**Evidence della critica a v1:** `.mw/runs/explore-mockup-to-component/SYNTHESIS.md`

---

## 1. Il principio che riordina tutto

> **Decisione Director (2026-08-14):** *"vorrei tenere al minimo l'uso di asset, vorrei fosse il + css/react possibile"*

Questo non è un dettaglio di preferenza: è l'asse portante del piano e va letto prima di ogni altra sezione.

**Il mockup definisce il bersaglio visivo. L'implementazione è CSS/React/token per default. Un asset raster è un'eccezione che richiede giustificazione scritta.**

Conseguenza diretta: v1 aveva 6 critiche blocking, e tre si dissolvono per costruzione con questo principio.

| Critica blocking a v1 | Perché si dissolve |
|---|---|
| **Alpha non risolto** (SDXL non genera trasparenza) | Se l'asset raster è raro, il problema dell'alpha è raro. Quando serve, si applica la pipeline della §8 — ma non è più sul percorso critico di ogni componente. |
| **Un raster non è separabile in layer** | Non lo separiamo. Ricostruiamo la struttura in DOM/CSS. Il raster, quando c'è, è un singolo elemento con un ruolo dichiarato, non una scena da smontare. |
| **Gli stati non sono quattro immagini** | Gli stati sono CSS. `:hover`, `:active`, `[data-disabled]` su token. Nessuna generazione di stati, nessun problema di coerenza fra stati. |

Le altre tre (contract prima dell'immagine, gate di implementabilità, ricerca nei kit prima di generare) restano valide e sono risolte esplicitamente dalle fasi qui sotto.

---

## 2. Decisioni del Director ratificate

Raccolte in sessione il 2026-08-14, dopo la delibera con ChatGPT Web e Claude Web.

| # | Decisione | Valore |
|---|---|---|
| 1 | **Soglia di comparabilità** | **12/14** sulla rubrica §7 |
| 2 | **Licenze modelli** | Whitelist §3, vincolante |
| 3 | **Asset ownership** | Deciso **caso per caso**, ma dichiarato nella fase Contract — non lasciato implicito |
| 4 | **Art gate** | **Non bloccante.** L'asset può andare in produzione; il Director rivede e chiede modifiche se non gli piace. La bibbia resta il criterio verificabile |
| 5 | **ROI** | **Regola categoriale**, non percentuale (§9). Più CSS/React possibile, asset al minimo |
| 6 | **Paintover umano** | **Zero iterazioni del Director.** Nessun passaggio manuale in editor grafico |

### 2.1 Conseguenza di «zero paintover» — va detta chiaramente

Il Director non ripara gli asset a mano. Quindi un asset che esce dalla pipeline con bordi sporchi, alone residuo o un dettaglio sbagliato **non ha una fase di salvataggio umano**. Le sole uscite possibili sono:

1. rigenerare con parametri diversi (numero di tentativi limitato, §8.4);
2. **ricadere su CSS/React/SVG** e non usare il raster;
3. semplificare il design eliminando l'elemento problematico.

Questo alza la barra sui gate automatici e, insieme al principio §1, spinge naturalmente verso l'implementazione procedurale. È coerente: se nessuno ripara i raster, conviene averne pochi.

### 2.2 Conseguenza di «art gate non bloccante»

Il Director non è un cancello da attendere. Il flusso non si ferma per l'approvazione estetica: si procede, si mostra, e se non piace si itera. Le uniche gate **bloccanti** sono quelle **automatiche e misurabili** (§10). Il giudizio estetico è un *review loop*, non un *gate*.

Nota di attrito registrata: questo rende possibile arrivare a fine pipeline con un componente che non piace. Il costo è mitigato dal fatto che l'implementazione è CSS/React (iterare costa minuti, non rigenerazioni da 10 minuti).

---

## 3. Whitelist licenze modelli (vincolante)

Verificata il 2026-08-14 sulle fonti ufficiali.

### 3.1 Ammessi in produzione

| Modello | Licenza | Verificato |
|---|---|---|
| **SDXL 1.0 base** (`stabilityai/stable-diffusion-xl-base-1.0`) | CreativeML Open RAIL++-M — uso commerciale libero, con restrizioni d'uso etiche | ✅ [stability.ai](https://stability.ai/news-updates/stable-diffusion-sdxl-1-announcement), [HF model card](https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0) |
| **SDXL 1.0 refiner** | CreativeML Open RAIL++-M | ✅ stesso rilascio |
| **FLUX.1 [schnell]** | Apache-2.0 | ✅ [repo ufficiale BFL](https://github.com/black-forest-labs/flux) |

### 3.2 Vietati

| Modello | Motivo |
|---|---|
| **FLUX.1 [dev]** e **tutte** le varianti `[dev]`: Fill, Depth, Canny, Redux, Kontext, Krea, e i relativi LoRA | FLUX.1 [dev] Non-Commercial License v1.1.1 — testuale: *"freely available for your **non-commercial and non-production** use"*. Vietato anche per esperimenti, perché un asset "di prova" può finire in produzione per dimenticanza |

### 3.3 Da verificare prima dell'uso (non pre-approvati)

- **Stable Diffusion 3.x** — Stability AI Community License, con soglia di fatturato annuo. Probabilmente compatibile con questo progetto, ma da leggere prima di usarlo.
- **Qualsiasi checkpoint o LoRA da Civitai o terze parti** — ognuno ha licenza propria, spesso **più restrittiva** del modello base. Verifica obbligatoria per ciascuno, esito registrato nel provenance.
- **Modelli di segmentazione** (`rembg`/`u2net`/`BiRefNet`/SAM) — licenze da verificare per modello quando la pipeline alpha viene effettivamente usata.

### 3.4 Regola di enforcement

Nessun asset entra in `public/assets/` senza un record di provenance che dichiari il modello e la licenza. È verificabile automaticamente (§10, gate G7) — non è una buona intenzione.

---

## 4. I due ingressi

Il piano ha due punti d'ingresso che convergono sullo stesso percorso. Il downstream è identico; cambia solo l'intake.

```
   RICHIESTA DEL DIRECTOR                    MOCKUP ESTERNO
            │                                      │
   ┌────────▼────────┐                    ┌─────────▼─────────┐
   │ F0  KIT SEARCH  │                    │ F0-EXT  INTAKE    │
   │                 │                    │         TRIAGE    │
   │ coperto? ──► IMPLEMENTA IL KIT, fine │ provenienza A/B/C │
   └────────┬────────┘                    │ licenza, formato  │
            │ non coperto                 │ scelta rotta 1/2/3│
            │                             └─────────┬─────────┘
            └──────────────┬────────────────────────┘
                           │
                 ┌─────────▼─────────┐
                 │ F1  CONTRACT      │  ← prima di qualsiasi immagine
                 └─────────┬─────────┘
                 ┌─────────▼─────────┐
                 │ F2  STYLE LOCK    │  ← rotta 2: il mockup esterno entra qui
                 └─────────┬─────────┘
                 ┌─────────▼─────────┐
                 │ F3  MOCKUP        │  (generato o derivato)
                 └─────────┬─────────┘
                 ┌─────────▼─────────┐
                 │ F4  IMPLEMENTABILITY GATE │
                 └─────────┬─────────┘
                 ┌─────────▼─────────┐
                 │ F5  CLASSIFICAZIONE ELEMENTI │  ← qui si decide cosa è CSS e cosa è asset
                 └─────────┬─────────┘
                 ┌─────────▼─────────┐
                 │ F6  IMPLEMENTAZIONE CSS/REACT │  ← il grosso del lavoro
                 └─────────┬─────────┘
                 ┌─────────▼─────────┐
                 │ F7  ASSET PIPELINE │  ← solo per gli elementi che l'hanno richiesta
                 └─────────┬─────────┘
                 ┌─────────▼─────────┐
                 │ F8  VISUAL MATCH (12/14) │
                 └─────────┬─────────┘
                 ┌─────────▼─────────┐
                 │ F9  RUNTIME/PERF GATE │
                 └─────────┬─────────┘
                 ┌─────────▼─────────┐
                 │ F10 SAFEGUARD + GOVERNANCE │
                 └─────────┬─────────┘
                 ┌─────────▼─────────┐
                 │ F11 DIRECTOR REVIEW (non bloccante, iterativo) │
                 └───────────────────┘
```

---

## 5. Fasi — ingresso da richiesta

### F0 — Kit & primitive search
**Durata massima:** 15 min. **Esecutore:** agente.

Cerca **per funzione, non per nome**:
1. `src/docs/docs/idle_village/COMPONENT_MASTER_INDEX.md`
2. i 24 frozen kit in `src/ui/idleVillage/frozen/kits/`
3. i primitivi in `src/ui/atoms/`, `src/ui/fantasy/atoms/`, `src/ui/idleVillage/skins/primitives/`

**Artefatto:** `<component>.admission.md` — cosa è stato cercato, cosa è stato trovato, cosa resta scoperto e perché.

**Gate G0 (bloccante):** se un kit o una composizione di primitivi copre **≥ 90%** della funzione → **STOP.** Si implementa il kit. Si scrive in `RICHIESTE.md` cosa si è evitato di costruire.

Questa è la protezione principale contro il costo. Sostituisce la critica blocking #5 e #6 della delibera.

### F1 — Component Contract
**Prima di generare qualsiasi immagine.**

**Artefatto:** `<component>.contract.json`

```
componentId          identificativo kebab-case
purpose              a cosa serve, in una frase
skinPreset           base | minimal_frontier | wanderlust
pillar               wilderness | empire
semanticRegions[]    HEADER, ICON, TITLE, VALUE, BADGE, ACTION, ORNAMENT...
states[]             idle, hover, pressed, disabled, ...
layout               constraint di dimensione e proporzione
interaction          click, drag, drop, hover-intent...
frozenKits[]         kit che verranno usati
primitives[]         primitivi che verranno usati
tokenSlots[]         quali token della skin servono
assetSlots[]         quali asset raster/SVG servono — CON GIUSTIFICAZIONE per ciascuno
i18nKeys[]           chiavi di traduzione
configRefs[]         riferimenti a config Zod
```

Nessun colore letterale nel contract. Nessuna stringa user-facing.

**Gate G1 (bloccante):** ogni voce in `assetSlots[]` deve avere il campo `justification` che spiega **perché CSS/SVG/token non bastano**. Un `assetSlot` senza giustificazione è un errore di contract, non una scelta.

### F2 — Style Lock
Risolve il problema dei 77 token CLIP e la coerenza cross-sessione.

**Artefatto:** `style-lock-<preset>-v<NNN>.json`, versionato e riusato fra componenti.

```
model                dalla whitelist §3
modelLicense
checkpointHash
shortPrompt          ≤ 60 token — compatto, non la bibbia
negativePrompt       ≤ 60 token
referenceImages[]    ancore di stile (img2img / IP-Adapter)
loras[]              con licenza verificata
palette              esadecimali derivati dalla skin config
seedPolicy
steps, sampler, cfg, resolution
longPromptStrategy   compel | lpw | none
```

**La bibbia (`art_direction_plan.md`) resta documentazione umana, non prompt di runtime.** Il modello riceve un pacchetto compatto di condizionamento.

**Gate G2 (bloccante):** generare 3 immagini di benchmark con lo style lock e verificare in modo **misurabile**: palette entro tolleranza, assenza di grigio/marrone nelle ombre, kill list rispettata. Se il benchmark non passa, si corregge lo style lock — **non si generano componenti.**

### F3 — Mockup
**Artefatti:** `<component>.mockup.png` + `<component>.mockup.meta.json` con provenance completa (modello, licenza, hash, seed, prompt, negative, style-lock version, contract version).

**Numero di candidate: risk-based, non fisso.** Default **2**. Si sale a 4 solo se il componente è visivamente centrale e il costo di sbagliare è alto. Motivo: 10 min/immagine a 1024×1536 misurati.

### F4 — Implementability gate
**Bloccante, automatica dove possibile, prima di investire nell'implementazione.**

Verifica sul mockup scelto:
- i colori dominanti sono mappabili sui token della skin? (misurabile: distanza colore)
- non contiene testo baked? (misurabile: OCR o ispezione)
- le regioni semantiche del contract sono tutte identificabili nel mockup?
- non richiede effetti vietati (mesh deformation, rifrazione, volumetric fog, shader custom)?
- non richiede un `.css` ad-hoc o la duplicazione di un primitivo?

**FAIL** → si corregge il contract o si rigenera il mockup. Non si passa all'implementazione.

### F5 — Classificazione degli elementi
Per ogni elemento visivo del mockup, **esattamente una** categoria, in **ordine di preferenza obbligatorio**:

| Priorità | Categoria | Quando |
|---|---|---|
| 1 | `TOKEN` | colore, ombra, raggio, spaziatura, tipografia → skin token |
| 2 | `PRIMITIVE` | struttura coperta da un primitivo o frozen kit esistente |
| 3 | `CSS_PROCEDURAL` | gradient, bevel, sheen, inner shadow, border-image, pattern CSS |
| 4 | `SVG_INLINE` | geometria vettoriale, iconografia, cornici a pochi path |
| 5 | `RGBA_TEXTURE` | **solo** materia pittorica non riproducibile proceduralmente |
| 6 | `MASK` | maschera alpha derivata, tipo `build-terrain-masks.mjs` |
| — | `REGENERATE` | l'elemento non è utilizzabile così → nuovo tentativo (max §8.4) |
| — | `REJECT` | non recuperabile → si semplifica il design e si elimina l'elemento |

**Regola derivata dal principio §1:** scendere di priorità richiede una riga di giustificazione nel manifest. `RGBA_TEXTURE` è l'ultima risorsa, non la prima.

**Artefatto:** `<component>.classification.md`

### F6 — Implementazione CSS/React
Ordine obbligatorio: frozen kit → primitivo esistente → skin token → config → i18n → asset custom.

Il componente **implementa il contract**, non imita il PNG.

Gli **stati sono CSS su token**: `:hover`, `:active`, `[data-disabled]`, `prefers-reduced-motion`. Nessun asset per stato.

**Gate G6 (bloccante, statico):** nessun nuovo `.css` standalone, nessun colore esadecimale letterale, nessuna stringa user-facing, nessuna duplicazione di primitivi, nessun valore gameplay hardcoded. Verificabile con lint e `scripts/check-legacy-patterns.sh`.

### F7 — Asset pipeline (solo per `RGBA_TEXTURE`, `SVG_INLINE`, `MASK`)

**Artefatto:** `<component>.asset-manifest.json` — per ogni asset: `assetId`, `role`, `sourceMockup`, `bbox`, `anchor`, `pixelSize`, `format`, `hasAlpha`, `intendedScale`, `license`, `provenance`, `classificationJustification`.

**Alpha, quando serve:**
1. **Preferito** — generare la stessa immagine su **sfondo bianco puro e nero puro con lo stesso seed** e ricavare l'alpha per via matematica. Preserva la trasparenza parziale di glow e polvere dorata. *Disponibile solo per asset generati in locale (serve il seed).*
2. **Fallback** — `rembg` con alpha matting (`birefnet-general` per qualità). Distrugge i soft-edge: accettabile solo per silhouette nette.
3. **Alternativa** — `LayerDiffuse` per alpha nativa su SDXL (da valutare, non ancora provato).

**SVG:** `Potrace` per iconografia monocromatica (SVG più pulito, meno path), `VTracer` per decorazioni multicolore (O(n), gestisce il colore). **Non vettorializzare per principio:** un'illustrazione pittorica tracciata è peggiore del raster.

**Produzione:** WebP via `sharp`, coerente con `scripts/build-*.mjs`.

### F8 — Visual match (12/14)
Screenshot runtime del componente vs mockup approvato, stessa viewport, rubrica §7.

**PASS:** ≥ 12/14 **e** `silhouette` = 2 **e** `semanticRegions` = 2.
**FAIL:** si classifica il delta — `STRUCTURAL` / `TOKEN` / `ASSET` / `TYPOGRAPHY` / `STATE` / `SPACING` / `ART` — e si corregge **solo** la categoria responsabile.

### F9 — Runtime & performance gate
Misurato, non stimato. Non filesize.

FPS in interazione · memoria · costo di decode immagini · numero di nodi DOM · conteggio texture · repaint/compositing · costo dei filtri CSS · byte totali degli asset · comportamento a DPR ≥ 2.

**FAIL** → nell'ordine: eliminare asset inutili, ridurre risoluzione, unire texture statiche, **sostituire raster con token/SVG**, rimuovere effetti. Non ottimizzare React prima di aver ridotto il costo visivo.

### F10 — Safeguard e governance
**Tutti e quattro** i comandi degli invarianti — v1 ne aveva solo due:

```bash
npm run lint -- <scope>
npm run test -- <scope>
npm run build:check
npm run kanban:lint
```

**Governance:** se il componente entra nel catalogo `trusted`/`frozen` → `*_trusted.md`, riga in `COMPONENT_MASTER_INDEX.md`, contract test, runtime evidence. Se resta sperimentale, si dichiara esplicitamente e non si indicizza.

**Artefatto finale:**
```
<Component>/
  admission.md
  contract.json
  mockup.png
  mockup.meta.json
  classification.md
  asset-manifest.json
  style-lock.json          (riferimento alla versione usata)
  runtime-evidence.md
```

### F11 — Director review (non bloccante)
Si mostra il risultato. Se non piace, si itera. L'iterazione è economica perché l'implementazione è CSS/React.

---

## 6. Fasi — ingresso da mockup esterno

### F0-EXT — Intake triage
**Artefatto:** `<component>.intake.json`

```
source            descrizione dell'origine
category          A | B | C
tool              se A: quale AI
license            testo o riferimento
hasBakedText      bool
hasWatermark      bool
resolution
route             1 | 2 | 3
routeJustification
```

**Categorie:**

| | Origine | Diritti | Rotte ammesse |
|---|---|---|---|
| **A** | AI su account del Director (Gemini, ChatGPT, Midjourney, Leonardo) | secondo i ToS del servizio | 1, 2, 3 |
| **B** | Opera di terzi (Pinterest, ArtStation, screenshot di altri giochi) | **nessuno** | **solo 1** |
| **C** | Acquistata o commissionata | secondo licenza, da archiviare | 1, 2, 3 se la licenza lo consente |

**Gate G0-EXT (bloccante):** categoria **B** → **rotta 1 obbligatoria**. Nessuna eccezione, nessuna estrazione, nessuna derivazione a basso denoise. Lo stile non è protetto, l'asset sì. `DESIGN_PILLARS.md` §1 autorizza a prendere *il linguaggio* di Hearthstone/Marvel Snap, non i loro asset.

### Le tre rotte

**Rotta 1 — Reference only.** Il mockup non diventa mai un asset: alimenta il contract (forma, layout, gerarchia, palette, linguaggio materico) e l'implementazione è CSS/React/SVG. **Legalmente sicura per qualsiasi categoria.** Dato il principio §1, è anche la rotta *preferita* in generale, non un ripiego.

**Rotta 2 — Rigenerazione condizionata.** Il mockup esterno entra in F2 come `referenceImage` (img2img a denoise basso o IP-Adapter). SDXL produce un derivato *nostro*: provenance completa, licenza pulita, seed noto — quindi varianti, stati e il trucco alpha white/black tornano disponibili.

> **Decisione Director:** *"va bene, ma solo quando riesce. se nn riusciamo a ricrearla abbastanza simile dobbiamo trovare altre soluzioni"*

**Rotta 3 — Estrazione diretta.** Il mockup esterno è la sorgente degli asset. Ammessa **solo** per A (con ToS compatibili) e C (con licenza compatibile). Non dà stati né varianti.

---

## 7. Rubrica di comparabilità — soglia 12/14

| Categoria | 0 | 1 | 2 |
|---|---|---|---|
| silhouette | diversa | simile | stessa |
| layout | diverso | parziale | stesso |
| hierarchy | diversa | simile | stessa |
| palette | diversa | vicina | coerente |
| material language | diversa | parziale | coerente |
| semanticRegions | mancanti | parziali | tutte |
| visual identity | diversa | riconoscibile | equivalente |

**PASS: ≥ 12/14, con `silhouette` = 2 e `semanticRegions` = 2 obbligatori.**

Motivo dei due obbligatori: se manca lo spazio per il testo il componente non funziona; se la forma è diversa non è lo stesso oggetto. Il materiale meno ricco è solo meno bello.

**Typography esclusa dal pixel-match:** si confrontano area riservata, gerarchia e posizione — mai i pixel del testo, che è i18n e cambia lingua.

La stessa rubrica si usa in F8 (runtime vs mockup) e in §8.4 (derivato vs mockup esterno).

---

## 8. Scala di fallback della rotta 2

Cosa fare quando la rigenerazione condizionata non riproduce il mockup esterno «abbastanza simile». Serve una scala esplicita, altrimenti «trovare altre soluzioni» diventa tempo illimitato.

**Criterio di riuscita:** derivato vs mockup esterno ≥ **12/14** sulla rubrica §7.

| Tentativo | Azione | Costo |
|---|---|---|
| 1 | `img2img`, denoise 0.35-0.5, style lock attivo | ~10 min |
| 2 | `IP-Adapter` con peso medio; se la struttura devia, aggiungere ControlNet — **attenzione: IP-Adapter a peso alto sovrascrive il controllo strutturale di ControlNet** | ~10 min |
| 3 | Riformulare lo `shortPrompt` descrivendo l'oggetto invece di inseguire l'immagine | ~10 min |

**Massimo 3 tentativi, ~30 minuti.** Poi si scende, in quest'ordine:

1. **Degradare a rotta 1.** Il mockup resta riferimento; si implementa in CSS/React/SVG. Dato il principio §1 questo non è una sconfitta: è l'esito preferito.
2. **Isolare l'elemento irriducibile.** Se il valore del mockup sta in *un* dettaglio (una texture, una cornice), si prova a rigenerare **solo quello** invece dell'intera immagine. Superficie più piccola, probabilità di riuscita più alta.
3. **Semplificare il design.** Si elimina l'elemento e si adatta il contract. Registrato come decisione, non come fallimento silenzioso.

Ciò che **non** si fa: continuare a rigenerare oltre i 3 tentativi, o passare la palla al Director per un paintover — che ha dichiarato zero iterazioni (§2.1).

---

## 9. Quando NON usare questo workflow

Derivato dalla regola categoriale del Director (decisione 5).

**Usare il workflow** per: texture, cornici, ornamenti, key art, illustrazioni, marker, materia pittorica — cose che i primitivi non possono disegnare.

**Non usarlo** per: card, pannelli, bottoni, HUD, liste, strip, tooltip — struttura + token, dove i 24 frozen kit e i primitivi già vincono.

Inoltre non usarlo quando:
- un frozen kit copre ≥ 90% della funzione (gate G0);
- il componente è principalmente testo/dati;
- il valore sta nell'interaction design più che nel visual;
- l'immagine contiene typography importante;
- il componente sarà riusato molte volte → conviene un primitivo parametrico;
- l'estrazione costerebbe più della ricostruzione procedurale.

Nota autocritica: la quest card generata il 2026-08-14 ricade nella colonna «non usarlo». È stato il caso sbagliato per il primo test.

---

## 10. Gate: cosa blocca e cosa no

Separazione richiesta dalla delibera — v1 le confondeva in un unico «filtro tecnico», che ChatGPT ha classificato come teatro.

### Machine gates — bloccanti, misurabili

| ID | Fase | Verifica |
|---|---|---|
| G0 | F0 | nessun kit copre ≥ 90% |
| G1 | F1 | ogni `assetSlot` ha giustificazione |
| G2 | F2 | benchmark style lock: palette in tolleranza, no grigio/marrone, kill list |
| G4 | F4 | colori mappabili su token, no testo baked, regioni identificabili, no effetti vietati |
| G6 | F6 | no nuovo `.css`, no colori letterali, no stringhe hardcoded, no duplicazione primitivi |
| G7 | F7 | PNG realmente RGBA (`0 < alpha < 255` presente), bbox non full-canvas salvo dichiarato, nessun alone sopra soglia, provenance e licenza presenti |
| G8 | F8 | ≥ 12/14 con silhouette e semanticRegions = 2 |
| G9 | F9 | performance entro budget misurato |
| G10 | F10 | lint + test + build:check + kanban:lint |

### Human review — non bloccante

Il Director valuta bellezza, identità, coerenza con l'intenzione. Può chiedere modifiche in qualsiasi momento, incluso dopo la messa in produzione. La bibbia alimenta i machine gate; il giudizio finale è suo.

---

## 11. Learning gate

Non «se emerge un pattern» — v1 non aveva criterio di attivazione e sarebbe stato saltato.

**Trigger:** dopo **5 componenti** passati dal workflow, oppure quando un gate fallisce **3 volte per lo stesso motivo**.

**Metriche da raccogliere per ogni componente:**

```
tempo di generazione (min)
tentativi di rigenerazione
tempo di implementazione (min)
numero di asset RGBA prodotti
numero di elementi risolti in TOKEN/CSS_PROCEDURAL
punteggio visual match
gate falliti e motivo
```

**Regola di sospensione:** se il rapporto `asset RGBA / elementi totali` cresce nel tempo, il workflow sta derivando verso il raster contro il principio §1 → si rivede il piano, non si continua.

---

## 12. Cosa resta aperto

1. **Verifica tecnica IP-Adapter su MPS** con `diffusers` — la rotta 2 la assume funzionante ma non è stata provata su questa macchina.
2. **Tolleranze numeriche** dei gate G2, G4, G7: distanza colore massima, soglia di alone, soglia OCR. Da tarare sul primo caso reale, non da inventare a priori.
3. **Budget di performance concreto** per G9: quali numeri per FPS, memoria, nodi DOM su Tauri. Il piano tattico di World Surface ha già un HUD di profilazione: da riusare invece di creare un secondo sistema.
4. **Primo componente di prova.** Deve essere un caso in cui il workflow è *giustificato* secondo §9 — quindi non una card. Candidati: una cornice ornamentale, una texture di superficie, un marker POI, un ornamento di pannello.
5. **`LayerDiffuse`** come alternativa all'alpha derivata: da valutare solo se il metodo white/black si rivela insufficiente.
