---
title: PLAN-016 — Superficie marina cellulare (Voronoi) non geometrica
type: plan
status: proposto
updated: 2026-09-10
richiesta: R-066
desiderata: v19 (FROZEN)
dipende_da: PLAN-015
---

# PLAN-016 — La superficie marina cellulare

Traccia B di `PLAN-015`, promossa a piano proprio perché il vincolo che il Director ha
aggiunto la cambia in modo sostanziale.

**Brief del Director (2026-09-10):** *«nn voglio vedere cose spigolose, devono muoversi
come superficie marina e nn come una rete»*.

---

## 1. Perché un diagramma di Voronoi, preso alla lettera, fallisce questo brief

Va detto prima di ogni altra cosa, perché è la ragione per cui questo piano non è
«implementa un Voronoi».

Un diagramma di Voronoi è **poligonale per costruzione**: le celle sono intersezioni di
semipiani, quindi ogni bordo è un segmento retto e ogni punto in cui tre celle si
incontrano è un vertice a spigolo. La causa matematica è l'operatore `min()` sulle
distanze, che è non continuo nella derivata: è esattamente lì che nasce lo spigolo.

E far scorrere rigidamente quel pattern produce «una rete che scivola sopra il dipinto»,
che è l'altra metà di ciò che il Director ha escluso.

Il brief non è quindi «meno Voronoi». È: **struttura cellulare sì, geometria no**.

### Il brief completo, ricostruito dai feedback già registrati

Non parto da zero: `RICHIESTE.md` R-066 contiene quattro rigetti che vincolano questo
piano quanto la frase di oggi.

| # | feedback registrato | vincolo che impone |
| - | ------------------- | ------------------ |
| 10 | *«la forma è sempre la stessa? e non sembrano increspature di mare, ma di lago»* | il pattern non deve leggersi come una texture ripetuta → **niente tiling visibile** |
| 11 | *«deve essere meno geometrico»* | niente bande parallele, niente regolarità direzionale |
| 12 | screenshot: *«shimmer sembra una proiezione geometrica»* | niente struttura che tradisca un reticolo |
| 13 | *«nel fermo immagine è lui»* ma *«le caustics cambiano forma senza scorrere, quindi non danno l'impressione di onde che avanzano»* | **serve sia il morphing sia un avanzamento direzionale** |

Il punto 13 è il più utile del lotto: dice che la forma statica era già giusta e che
mancava il moto d'avanzamento. Insieme alla frase di oggi definisce quattro requisiti
simultanei, e ognuno ha una tecnica sua.

---

## 2. Le quattro tecniche, una per requisito

Dalla ricerca online, con le fonti.

### 2.1 Gli spigoli → `voronoise` (Inigo Quilez)

La soluzione esiste ed è esattamente una manopola sul problema. `voronoise` sostituisce
il `min()` con una **media pesata** di tutte le feature del vicinato:

```glsl
float k = 1.0 + 63.0*pow(1.0-v, 4.0);
...
float w = pow( 1.0-smoothstep(0.0, 1.414, sqrt(d)), k );
va += w*o.z;  wt += w;
return va/wt;
```

`v = 0` → l'esponente sale a 64, il peso della feature più vicina schiaccia tutte le
altre e si riottiene il `min()`, cioè il Voronoi duro con i suoi spigoli. `v → 1` →
l'esponente scende a 1, tutte le feature pesano, e il risultato è morbido come un
value noise. **Un `v` intermedio conserva la struttura cellulare e arrotonda ogni
bordo, eliminando i vertici.** È letteralmente il dial «meno spigoloso».

Il secondo parametro `u` controlla il jitter del reticolo: `u = 1` celle irregolari,
`u = 0` reticolo regolare. Va tenuto alto, e con **taglia di cella non uniforme**, per
il punto 12.

### 2.2 La geometria residua → domain warping (Inigo Quilez)

Invece di valutare `f(p)`, si valuta `f(p + h(p))` con `h` un fBm:

```glsl
vec2 q = vec2( fbm(p), fbm(p + vec2(5.2,1.3)) );
return pattern( p + 4.0*q );
```

Distorce lo spazio di input: pizzica, stira, torce. Il reticolo sottostante **smette di
leggersi come reticolo**, che è il punto 11 e il punto 12. Un secondo livello di warp
(`r` calcolato su `p + 4q`) aumenta l'organicità al costo di più campioni.

### 2.3 «Come superficie marina, non come una rete» → semi orbitanti

La differenza fra una rete che scivola e una superficie che vive è **se le celle
cambiano forma mentre si muovono**. La tecnica: animare la posizione del seme *dentro*
la sua cella, non traslare il campo.

```glsl
vec2 seed = 0.5 + 0.5*sin( time*speed + 6.2831*hash2(cellId) );
```

Ogni seme orbita con fase propria, quindi le celle pulsano e si rimodellano in place.
Questo è il requisito di oggi.

### 2.4 «Onde che avanzano» → drift lento del dominio, sopra il morphing

Il punto 13 chiede anche un avanzamento. Si ottiene sommando una traslazione lenta al
dominio **oltre** al morphing dei semi: `p + flow*time`. Le due cose insieme danno
morphing organico *e* direzione. Da sole: il morphing dà «vive ma è fermo» (il rigetto
del punto 13), il drift dà «una rete che scivola» (il rigetto di oggi).

### 2.5 Due dettagli che la ricerca segnala e che vale la pena avere subito

- **Stirare la coordinata di campionamento lungo la direzione di flusso** allunga le
  celle in tratti, riducendo l'aspetto cellulare — utile se anche il `voronoise`
  addolcito legge ancora troppo «a celle».
- **`F2 − F1` invece di `F1`** per i bordi: dà una linea con caduta morbida su entrambi
  i lati invece di un gradiente a cono. È il modo standard per ottenere le caustiche.

---

## 3. Dove gira, e perché non nel lab

**Pagina spike standalone**, non un riquadro di `/sea-effect-lab`. Motivo misurato in
`PLAN-015` §1: nel pane di preview `document.visibilityState` è `hidden` e la timeline
del documento è congelata, rAF **e** CSS **e** SMIL. È la ragione per cui nessuna
variante del lab è mai stata giudicabile. Modello già presente nel repo:
`public/land-breath-spike.html`.

**WebGL2 raw**, sul modello di `destinyAstrolabeV64/tarGooRenderer.ts`, non un
`PIXI.Filter`: nel repo non esiste un Filter custom e quel file documenta la scelta
deliberata. Fallback obbligatorio nella forma idiomatica del repo:
`const gl = canvas.getContext('webgl2'); if (!gl) return null;`.

**Canvas dimensionato alla superficie a schermo, mai al world box.** Il repo dichiara
`TEXTURE_EDGE_LIMIT_PX = 4096` con il commento *«WebKit refuses textures past this
edge, and fails blank rather than throwing»*, e la world box è 4240 px.

**Autorizzazione:** `context/DECISION_LOG.md:446` (2026-08-31) ammette shader custom nel
water lab, con due obblighi: fallback DOM ed evidence log frame-time + DPR.

### L'errore da non ripetere

Il rigetto del punto 13 — *«è un rettangolo bianco che passa super velocemente»* — è
successo perché la variante è stata giudicata come pattern isolato. **Lo spike deve
mostrare il pattern sopra `Mare.webp` vero, mascherato su `sea_mask.webp`, allo zoom
reale 0.18–0.30, dal primo frame.** Non su fondo nero, non ingrandito.

---

## 4. Revisione R3 — dopo critica multi-AI (2026-09-10)

Il Director ha chiesto una seconda opinione sul piano iniziale (di seguito «R1»).
È arrivato un contro-piano («R2») via delibera esterna. Questa sezione riporta la
sintesi: cosa di R2 resta, cosa di R1 resta, cosa viene tagliato da entrambi, e perché.
**§4.1–§4.5 sostituiscono le vecchie §4–§6**; §1–§3 restano valide. Il resto del
documento (YAGNI, fonti) è rinumerato a §5–§6.

### 4.1 Cosa ha ragione R2, con una prova più forte di quella che R2 stesso aveva

R2 sospetta che «Voronoi smussato» possa restare percettibilmente Voronoi, solo con i
bordi più morbidi. Verificato sulla fonte primaria: l'articolo di Quilez sullo
smooth-min dichiara esplicitamente che l'obiettivo della tecnica è *«preserve the well
known voronoi look»* — lo smooth-min è **progettato** per restare riconoscibile come
Voronoi, solo senza discontinuità dure. `voronoise` da solo non è garanzia di
disinnescare il rigetto «rete»; va verificato, non assunto. Da qui il gate statico di
R2 (§4.2, G1) entra nel piano.

R2 ha anche ragione sul sequenziamento: R1 introduceva sei parametri accoppiati
(`voronoise`+warp+orbita+drift+stretch+`F2-F1`) nello stesso shader. Se il risultato
fallisce, non si sa quale operazione incolpare. Si isola.

### 4.2 Dove R2 corregge troppo, e perché non lo seguo fin lì

**Bandire `F2-F1` e i semi orbitanti per sospetto.** R2 li tratta come «probabilmente
sbagliati» prima di averli provati. Ma R-066 punto 13 dice letteralmente che il
**fermo immagine delle caustiche organiche era già quello giusto** — il rigetto era sul
movimento (*«cambiano forma senza scorrere»*), non sulla forma statica. Non c'è ancora
nessuna osservazione che leghi l'orbita dei semi a `BREATHING_BLOBS`: è un'analogia,
non un dato. Restano nel piano come varianti da mettere alla prova con la tassonomia di
R2 — non pre-vietate, e non baseline obbligata. La tassonomia di fallimento è lo
strumento giusto per deciderlo; usarla per bandire una tecnica prima di generarla è
sprecarla.

**Zero segnale automatico.** R2 elimina l'istogramma del gradiente come criterio di
accettazione perché «un campo può superarlo ed essere comunque chiaramente Voronoi» —
vero, ma la conclusione corretta è *«non basta da solo»*, non *«non serve»*. Resta come
**filtro automatico economico**, eseguito su ogni preset prima che qualcuno lo guardi:
scarta i casi ovviamente falliti (bande nette, picchi di orientamento) senza consumare
tempo di revisione umana. Il giudizio finale resta della tassonomia nominata + del
Director, non della metrica.

**Il processo a ~22 stati gated per uno spike.** È dimensionato per una certificazione
di produzione, non per «prova gli slider e guarda cosa succede», che è la richiesta
originale. Compresso in §4.3 a quattro checkpoint, ognuno dei quali *contiene* le
verifiche di R2 senza intitolare ogni singola sotto-decisione come uno stato a sé.

**Il conteggio «~8 sistemi, il Voronoi sarebbe il nono».** Era mio, in R1, e R2 lo
eredita senza correggerlo — costruendoci sopra un target («Δp95 ≤ 1ms») che è comunque
la cornice giusta, ma su una premessa sbagliata. Il conteggio mescolava le 33 sea marks
(animazioni CSS `opacity`/`transform`, quasi gratuite per il compositor) con un
contesto WebGL nuovo, come se fossero unità comparabili. `DESIGN_PILLARS.md:20`
parla di «passi *reali* costosi», non di un numero di elementi animati. La misura
giusta non è un conteggio: è la spesa di frame reale, che è esattamente ciò che T-050
di R2 propone di misurare. Tenuta quella parte, corretta la premessa.

### 4.3 Fasi (sostituisce la vecchia §4)

Quattro checkpoint. Ognuno è un cancello reale — niente passa al successivo senza
soddisfarlo — ma internamente contiene più di un passo di lavoro, non uno stato per
ogni variabile.

| Checkpoint | Contenuto | Cancello d'uscita |
| ---------- | --------- | ------------------ |
| **C0 — Scena e contratto** | Pagina spike `public/voronoi-sea-spike.html`: `Mare.webp` reale, `sea_mask.webp`, zoom selezionabile 0.18/0.24/0.30, dal primo frame. Fissare per iscritto le cinque categorie di fallimento di R2 (`CELLULAR`, `NETWORK`, `SLIDING_TEXTURE`, `BREATHING_BLOBS`, `CAUSTIC`) come rubrica di giudizio. | Esiste un artefatto giudicabile su cui *sia* R1 *sia* R2 concordano sia il test giusto — mai su fondo nero, mai ingrandito. |
| **C1 — Campo statico, non cellulare** | `voronoise` (§2.1) + un livello di domain warp (§2.2), **fermo**. Filtro automatico: istogramma dell'orientamento del gradiente (nessun bin > 1.5× la media) e lunghezza massima di bordo collineare. Poi giudizio umano contro la rubrica delle cinque categorie, a 0.18/0.24/0.30. | Il fermo immagine non legge come `CELLULAR` né `NETWORK`, né a occhio né alla metrica. Se fallisce qui, non si anima nulla: R2 ha ragione che animare un campo geometrico produce solo una rete che scivola più velocemente. |
| **C2 — Movimento** | Tre varianti animate sul campo che ha passato C1, **non accoppiate in un unico shader**: (a) semi orbitanti nella cella (§2.3), (b) warp del dominio dipendente dal tempo, (c) le due combinate con un drift direzionale debole in più. Ogni variante giudicata contro la stessa rubrica, con enfasi su `SLIDING_TEXTURE` e `BREATHING_BLOBS`. Clip ≥ 15 s, nessun loop percepibile entro 20 s. | Almeno una variante non legge né come rete che scivola né come blob che respirano né come un loop. Le altre due sono scartate con un motivo scritto, non per sospetto a priori. |
| **C3 — Slider e battesimo** | Tutti i parametri toccati in C1–C2 esposti come slider live, sopra il dipinto vero, allo zoom reale — non solo i quattro che R2 vorrebbe pre-selezionare: non si sa ancora quale conta finché il Director non ha giocato con tutti. Maschera su `sea_mask.webp` con feather di costa. Tre finestre di intensità (`subtle`/`target`/`rejection-high`, da R2 — l'ultima serve apposta a far emergere in anticipo gli artefatti). Preset serializzabile. | Il Director trova il valore invece di descriverlo; il preset approvato è la spec. |

*(condizionale al sì del Director su C3)*

| Checkpoint | Contenuto | Cancello d'uscita |
| ---------- | --------- | ------------------ |
| **C4 — Evidence e strada di produzione** | Frame-time in browser vero: baseline della scena **vs** scena + effetto, non solo assoluto (R2 T-050/T-051). DPR, viewport, risoluzione interna del canvas; provare downscale del rendering interno (1.0/0.75/0.5 — R2 T-052, leva di costo mancante in R1). Scelta esplicita fra shader live e loop pre-cotto — punto aperto 1. Decisione esplicita «cosa esce» dal budget — punto aperto 2, mai automatica. `prefers-reduced-motion` → mare statico, nessuna animazione sostitutiva (R2 ha ragione: uno shimmer CSS come fallback è un secondo effetto da approvare da capo). | Promozione istruita con numeri, non con un «sembra scorrevole». |

### 4.4 Criteri di uscita (sostituisce la vecchia §5)

Due livelli, non uno solo — è il punto centrale della correzione a R2 (§4.2):

**Filtro automatico (economico, gira su ogni preset prima che qualcuno lo guardi):**
1. Istogramma dell'orientamento del gradiente quasi isotropo — nessun bin > 1.5× la
   media.
2. Nessun bordo retto lungo — soglia da fissare a C1 in funzione della scala di cella.

Un preset può superare entrambi ed essere comunque «chiaramente Voronoi» — R2 ha
ragione su questo. Il filtro serve a scartare i fallimenti ovvi *prima* della revisione
umana, non a sostituirla.

**Giudizio nominato (la rubrica di R2, obbligatoria, non sostituibile da nessuna
metrica):** il frame/clip non deve leggere come nessuna delle cinque categorie —
`CELLULAR`, `NETWORK`, `SLIDING_TEXTURE`, `BREATHING_BLOBS`, `CAUSTIC` — a 0.18, 0.24 e
0.30, sia da fermo (C1) sia in movimento su una clip ≥ 15 s (C2), con la maschera
integrata (C3) e senza bordo di `sea_mask` percepibile.

**Costo:** `Δframe-time p95` fra scena base e scena con l'effetto, non `p95` assoluto —
correzione di R2 alla mia stima originaria, che contava sistemi invece di misurare
spesa di frame. Target iniziale `≤ 1 ms`, verificato in browser vero, mai nel pane.

**Resta irriducibilmente soggettivo, e va nominato come tale:** che il Director,
guardandolo sul dipinto vero allo zoom vero, dica che si muove come mare.

### 4.5 Punti aperti — non li decido io (sostituisce la vecchia §6)

1. **La strada di produzione, dopo l'approvazione (C4).** Due opzioni con costi opposti:

   | | shader live | loop pre-cotto (sprite sheet) |
   | - | ----------- | ----------------------------- |
   | tiling | **mai** | in spazio *e* in tempo |
   | contesto GPU nuovo | 1 | nessuno |
   | pane congelato | non gira | gira (CSS steps) |
   | memoria | ~1 texture | 30 frame a 256² = 7.9 MB decodificati |
   | rischio | costo di frame | il rigetto 10 (*«la forma è sempre la stessa?»*) |

   Il loop pre-cotto è quello che fanno gli studi veri e costa quasi nulla a runtime, ma
   un tile da 256 world px si ripete ~16 volte sulla mappa a zoom 0.3, ed è esattamente
   la ripetizione che il Director ha già bocciato una volta.

2. **Il budget, misurato correttamente.** Dopo il ritaglio dei layer siamo a **215 MB**
   (da 613): la memoria non è il vincolo. Il vincolo reale è `DESIGN_PILLARS.md:20`:
   *«i sistemi costosi restano 4-5»* — **passi di rendering reali**, non un conteggio di
   elementi animati. Le sea marks e i wave marks sono keyframe CSS su `opacity`/
   `transform`: economici per il compositor, non comparabili a un contesto WebGL nuovo.
   La domanda giusta non è «quale numero abbiamo raggiunto», è il `Δp95` misurato in
   C4. Se un contesto WebGL nuovo *misura* costoso, la decisione «cosa esce» è comunque
   del Director — candidati naturali restano le sea marks e i wave marks, perché sono
   la tecnica che il Voronoi sostituirebbe.

3. **Mare aperto, coste, o tutto.** `Decision 011` ha respinto gli effetti sul mare
   aperto perché il dipinto lì è quasi piatto — ma quel rigetto riguardava tecniche che
   *risamplano* il dipinto (displacement). Un Voronoi generativo **dipinge celle
   proprie** e quindi non è coperto da quel rigetto: non ha bisogno di dettaglio da
   spostare, lo porta. È il motivo per cui questa traccia è viva mentre il ripple sul
   mare aperto è morto. Va comunque deciso se il pattern copre tutto il mare o si ferma
   prima delle coste, dove ora vive il ripple di `PLAN-015`.

---

## 5. Cosa questo piano NON fa (YAGNI)

- Non introduce Pixi né un `PIXI.Filter`.
- Non tocca il ripple costiero di `PLAN-015`, che è indipendente.
- Non promuove nulla in produzione: C4 è condizionale a un sì esplicito su C3.
- Non affronta le due isole senza effetto: il Director le ha messe in pausa
  (*«ci pensiamo dopo»*). Diagnosi e stato in `PLAN-015` §12.
- Non ripara il typecheck né il lint del repo, entrambi inesistenti
  (`PLAN-015` §7): resta fuori scope, e ogni verifica di tipo va validata con un canary.
- Non bandisce a priori nessuna tecnica di §2 prima che C1/C2 la mettano alla prova
  (correzione a R2, §4.2).

---

## 6. Fonti

- [Inigo Quilez — voronoise](https://iquilezles.org/articles/voronoise/) — la fusione
  fra noise e Voronoi, e l'esponente `k = 1 + 63(1−v)⁴` che la governa.
- [Inigo Quilez — domain warping](https://iquilezles.org/articles/warp/) — `f(p + h(p))`
  e la formulazione fBm a uno e due livelli.
- [Animated Worley Noise — Landon Townsend](https://www.landontownsend.com/single-post/2019/05/30/animated-worley-noise-trypophobia-warning)
  — semi animati, celle che pulsano invece di traslare.
- [Creating a Stylized 3D Water Shader — gameidea](https://gameidea.org/2026/02/01/creating-a-stylized-3d-water-shader/)
  — due Voronoi sovrapposti, warp animato, semi come `0.5 + 0.5·sin(t·speed + 6.2831·o)`.
- [unity-voronoi-water — cbunt](https://github.com/cbunt/unity-voronoi-water) — Voronoi
  4D più flowmap, riferimento pratico per il moto direzionale.
- [Water Shader Breakdown — Cyanilux](https://www.cyanilux.com/tutorials/water-shader-breakdown/)
  — stiramento della coordinata lungo il flusso per allungare le celle in tratti.
- [procedural-tileable-shaders — tuxalin](https://github.com/tuxalin/procedural-tileable-shaders/blob/master/voronoi.glsl)
  — Voronoi tileable, se si scegliesse la strada del loop pre-cotto.
- [GPU Gems 2 — Rendering Water Caustics](https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-2-rendering-water-caustics)
  — il fondamento delle caustiche.

---

## 7. C0 — eseguito (2026-09-10)

Pagina spike creata: `public/voronoi-sea-spike.html`. Standalone, WebGL2 raw (fallback
DOM se assente), sopra `Mare.webp` vero, ritagliato con gli stessi crop di
`SeaEffectLabPage.tsx` (open/strait/coast) e mascherato su `sea_mask.webp`.

### Tre bug reali trovati e corretti durante la verifica, non solo uno screenshot preso e accettato

1. **`window.innerWidth` letto una sola volta al parse del modulo, prima che il
   pane avesse finito il proprio layout.** Misurato: `innerWidth` valeva **0** in
   quel momento, `STAGE_MAX_W` diventava negativo, e lo stage veniva forzato al
   floor minimo di 200px indipendentemente dal crop o dallo zoom scelti. Corretto
   calcolando la larghezza disponibile dentro `layoutStage()` a ogni chiamata,
   con una guardia contro `innerWidth` non valido.
2. **`preserveDrawingBuffer` assente.** Corretto: renderizzare un frame fermo e
   poi ispezionarlo con uno screenshot in una chiamata separata è esattamente il
   protocollo che `PLAN-015` impone per verificare animazioni SMIL nel pane
   nascosto — e senza questo flag il browser può invalidare il buffer fra le due
   chiamate. Misurato: `readPixels` restituiva tutto (0,0,0,0) nonostante il
   rendering fosse avvenuto. Attivato, con nota che va tolto prima di qualunque
   riuso in un loop rAF reale, dove costa una copia extra per frame.
3. **Il più serio: un moltiplicatore `*4` per ingrandire lo stage a schermo
   entrava anche nel calcolo world-px-per-schermo passato allo shader.** Una
   cella impostata a 110 world px si disegnava come se fosse 440 — un bug della
   stessa famiglia di quello diagnosticato in `PLAN-015` per il ripple (lì
   1/zoom² su un filtro SVG; qui un fattore fisso che contaminava la frequenza
   del pattern). Corretto separando due concetti che erano indebitamente
   fusi: **zoom mappa** (0.18/0.24/0.30, reale, deriva `worldPerScreenPx = 1/zoom`
   e determina la frequenza del pattern) e **ingrandimento d'ispezione** (1×-5×,
   un `transform: scale()` CSS puro applicato al box già dimensionato
   correttamente, che non tocca mai lo shader — una lente, non una bugia sulla
   scala). Verificato: a crop `strait` zoom 0.24, il canvas ora misura
   **137.4px** reali (contro i 398px del bug), coerente col calcolo teorico
   `c.w × SEA_W × (4240/3072) × zoom`.

### Verificato funzionante

- Rendering: shader compila, linka, disegna (confermato via `readPixels` diretto,
  non solo aspetto visivo).
- Compositing: a `opacity` e blend di default il pattern è correttamente troppo
  debole per uno screenshot casuale — non è un bug, è la ragione per cui C3 ha
  slider dedicati; forzando opacità/blend a valori estremi il pattern si vede e
  la scala delle celle è quella attesa (~5 celle attraverso 137px reali a
  `cellScale=110`, coerente con `110 × 0.24 ≈ 26 px/cella`).
- Filtro automatico (istogramma orientamento + bordo collineare): eseguito su un
  frame forzato deliberatamente estremo, ha dato `1.92 ✗` sull'orientamento
  (sopra soglia 1.5, atteso) — la pipeline di misura gira end-to-end.
- Fallback, `prefers-reduced-motion` non ancora cablato nello spike (non
  richiesto per C0/C1; va aggiunto prima di C4).

### Osservazione per C1, non un verdetto

Ai parametri di default (`voronoise` con `v=0.55`, warp 60 world px su scala 380),
il campo fermo legge più come nuvola morbida/fBm che come struttura cellulare
riconoscibile. Può essere il punto giusto di partenza per "non spigoloso, non
rete" — o può aver perso troppa struttura cellulare rispetto al riferimento
originale del Director (i "retino cellulare" stile mobile cel-shaded).
**Non è una mia valutazione da tenere per buona**: è esattamente ciò che C1
esiste per stabilire, con la rubrica delle cinque categorie, in un browser vero.

### Come aprirla

`npm run dev`, poi `http://localhost:5173/voronoi-sea-spike.html` — **in una
finestra di browser vera**, non nel pane di questo strumento: verificato che
anche "frontata" la tab riporta `document.visibilityState: hidden` in questo
harness, quindi rAF non parte mai qui. Sliders, bottoni e rubrica sono pensati
per essere usati dal vivo.

---

## 8. «Io non vedo nulla» — due bug in più, trovati guardando davvero (2026-09-10)

Il Director ha segnalato di non vedere l'effetto, e ha correttamente rifiutato una mia
prima risposta basata su letture di pixel invece che sull'aver guardato lo schermo.
Ha ragione: fino a questo punto avevo verificato "il canvas contiene dati non nulli",
non "un umano percepisce qualcosa qui". Sono due affermazioni diverse, e la seconda è
quella che conta. Guardando davvero, ho trovato **due bug in più**, oltre ai tre di §7.

### Bug #4 — `mask-position`/`mask-size` non sono `left`/`width`

`boxed()` posiziona le `<img>` con `left: -X%; width: Y%` — corretto per un elemento
assolutamente posizionato. Ho applicato la stessa formula a `mask-position`/`mask-size`
sul wrapper mascherato. **Sono aritmetiche diverse**: per `background-position` (e
`mask-position`, che la eredita), una percentuale è
`offset = P × (dimensione_contenitore − dimensione_immagine_renderizzata)`, non un
offset diretto. Per il crop `strait` (`x=0.86, w=0.135`) la formula sbagliata dava un
`mask-position-x` di circa **−637%** — la finestra visibile cadeva completamente fuori
dal contenuto reale della maschera, quindi alpha zero ovunque. Misurato prima di
correggere: rimuovendo la maschera il pattern si vedeva bene; con la maschera (sbagliata)
spariva del tutto, su un mare che in quella zona ha il 78% di copertura opaca reale
(misurato con sharp) — la maschera in sé era innocente, il bug era nella conversione
frazione→CSS. **Corretto** passando a valori in pixel espliciti (`mask-position: Xpx Ypx`,
`mask-size: Wpx Hpx`), calcolati moltiplicando invece di invertire una formula.

### Bug #5 — `blend: luminosity` è genuinamente troppo debole su questo dipinto

Anche a maschera corretta, il pattern restava impercettibile fino a `opacity 0.85`. Causa:
`luminosity` sostituisce la luminanza mantenendo tinta/saturazione dello sfondo; se il
campo (dopo il contrasto) resta centrato vicino alla luminanza media del mare — già
scuro e desaturato — il cambiamento percepito è minimo anche ad alpha alta. **Non è un
bug di codice**, è una scelta di compositing che non funziona su questo materiale.
Cambiato il default a `normal`, che mostra il campo per quello che è. Resta una delle
opzioni nello slider **Blend**: `luminosity` potrebbe tornare utile con parametri
diversi, ma non deve essere il default cieco.

### Metodo di verifica che ha isolato i bug, in ordine

1. Sostituito temporaneamente il contenuto del wrapper mascherato con un **rettangolo
   magenta pieno**, per vedere la forma della maschera senza l'ambiguità del pattern
   sottostante. Risultato: la maschera seguiva la costa **esattamente**, bordo morbido
   incluso — la prova che il bug #4, una volta corretto, funzionava, e che il problema
   residuo di percezione non era la maschera.
2. Con la maschera confermata corretta, provato `Bordi F2-F1` a `opacity 0.85,
   contrast 3.5, blend normal`: forme bianche nette, inequivocabili, confinate
   all'acqua — prova che l'intera pipeline (shader → maschera → compositing) può
   produrre un risultato innegabilmente visibile.
3. Tornato a `Campo` (il modo cellulare, non i bordi) con lo stesso blend `normal`:
   visibile anche lì, seppure più morbido.
4. Reimpostato **solo** `blend: normal` come default (senza toccare `opacity`/
   `contrast`, già alzati in un giro precedente a `0.55`/`2.2`), ricaricato a freddo
   — nessun override live residuo — e guardato lo screenshot con i miei occhi: **il
   pattern si vede**, forme grigio-azzurre morbide distinguibili dal teal scuro del
   mare, confinate vicino alla costa.

### Lezione, di nuovo

Non è la prima volta in questo lavoro che "i numeri dicono che funziona" e "si vede"
sono risultati diversi (vedi `PLAN-015`, il ripple con `scale` matematicamente corretto
ma sub-pixel). La regola resta: **prima di dire che qualcosa è finito, va guardato**,
non dedotto da `readPixels` o da un `getComputedStyle`. Il Director l'ha imposto qui
correttamente; va applicato da subito nei prossimi checkpoint (C1 in poi), non solo
quando qualcuno se ne accorge.

---

## 9. Critica AAA — «non mi fa impazzire come effetto acqua» (2026-09-10)

Guardato lo screenshot reale (default `Campo`, `motionMode: combinato+drift`, dopo le
correzioni di §8). Verdetto: **non legge come acqua, legge come fog/depth-of-field** —
una sfumatura morbida senza struttura interna è una convenzione visiva consolidata per
"fuori fuoco" o "foschia atmosferica", non per "superficie marina". Non è un problema
di taratura fine: è un registro visivo sbagliato.

### Cause, verificate contro letteratura di settore

1. **Gradiente continuo contro uno stile piatto/posterizzato.** Il cel-shading
   comprime la luce in bande piatte, non gradienti continui — la mappa dipinta è in
   quel registro. `voronoise` (media pesata continua) produce per costruzione l'opposto:
   un gradiente fotografico. Innesto grammaticalmente incompatibile con lo stile base.
2. **Zero bordi, zero highlight.** L'acqua cel-shaded legge sempre dai bordi: linee di
   schiuma nette (spesso da una SDF sulla costa) e highlight speculari — non un
   riempimento morbido. Il modo `Campo` non ha né l'uno né l'altro.
3. **Tre ammorbidimenti sovrapposti**, non uno. `v=0.55` (già una media pesata morbida)
   + ricerca 5×5 (allarga di suo l'influenza a ~2 celle) + `warpAmp=60` su
   `cellScale=110` (55% di una cella) si sommano. Avevo segnalato il rischio in §7
   ("legge più come nuvola morbida che struttura cellulare — osservazione per C1, non
   verdetto") e si è materializzato esattamente come temuto.
4. **Colore.** Grigio-blu desaturato è la tinta convenzionale della distanza
   atmosferica in illustrazione paesaggistica — legge "foschia" prima ancora di
   guardare la forma.

### Sesta categoria di fallimento, aggiunta alla rubrica di R2

`CELLULAR` / `NETWORK` / `SLIDING_TEXTURE` / `BREATHING_BLOBS` / `CAUSTIC` non
coprivano questo esito. Aggiunta:

- **`FOG_BLUR`** — gradiente morbido senza struttura leggibile, letto come
  foschia/fuori fuoco invece che come superficie. Va aggiunta alla rubrica UI dello
  spike (§C0) prima del prossimo giro di giudizio.

### Direzione di correzione, non ancora eseguita — in attesa di via libera

1. Bordo di cella sottile e chiaro (da `F2−F1`, stretto) **sopra** un riempimento
   quasi piatto — non il riempimento smussato da solo.
2. Posterizzare il campo a 2-3 bande discrete invece del gradiente continuo.
3. Ridurre la sovrapposizione: o `v` più basso, o `warpAmp` più basso relativo a
   `cellScale`, non entrambi al massimo insieme.
4. Tinta più vicina al colore proprio del mare, non grigio neutro.

Fonti: [toon shading — banding vs gradienti continui](https://medium.com/@chitranshnishad27/toon-shaders-in-unity-from-shader-graph-to-custom-hlsl-08252b2d64a2),
[posterizzazione](https://en.wikipedia.org/wiki/Posterization),
[foam/edge/highlight in stylized water](https://ameye.dev/notes/stylized-water-shader/),
[silhouette/leggibilità in art direction stilizzata](https://sunstrikestudios.com/en/blog/game_art_visual_direction/).

---

## 10. Riferimento visivo fornito dal Director (2026-09-10)

Il Director ha condiviso uno screenshot di riferimento (stile mobile top-down
cel-shaded, verosimilmente Clash-of-Clans-like): acqua teal satura e piatta, rete
cellulare a **celle grandi e poche**, bordi **ciano sottili e luminosi** (quasi un
bagliore), angoli **arrotondati** non spigolosi, costa dipinta con contorno chiaro
coerente cromaticamente coi bordi delle celle. Richiesta esplicita: *"che si muove
lentamente"*.

### Differenze dal mio output, verificate guardando lo schermo (non dedotte)

| aspetto | riferimento | mio output attuale |
| ------- | ----------- | ------------------- |
| taglia cella | grande, poche celle visibili | ora allineato (`cellScale` alzato a 140, dal precedente 110) |
| colore bordo | ciano acceso, quasi bagliore | grigio-biancastro, troppo neutro |
| saturazione riempimento | teal ricco, saturo | slavato — probabile causa: il canvas è un **overlay semi-trasparente** (`opacity 0.55`) sul mare dipinto esistente sottostante, mentre nel riferimento è l'intera acqua a essere in quello stile, non un velo sopra un altro dipinto |
| angoli | arrotondati | ancora relativamente spigolosi in alcuni punti |
| movimento | lento | ridotto (`driftSpeed` 6→2.5, `orbitSpeed` 0.12→0.05), non ancora validato dal Director |

### Cambi applicati in questo giro

`cellScale` 110→140 (poi provato 300, troppo per i crop stretti — tornato a 140),
`jitter` 0.92→0.55 (celle meno acute), `smoothV` 0.35→0.18 (bordi più definiti, meno
smussatura globale), `warpAmp` 26→18, `bands`→1 (riempimento quasi piatto, il peso
visivo sta nel bordo), `edgeWidth`→0.07, `edgeBoost`→1.6, tinte cambiate a
`shadowTint #1c4a52` / `highlightTint #eafffa`, `driftSpeed`/`orbitSpeed` dimezzati.

### Bug trovato nel giro di verifica: la lente d'ispezione non si applicava da JS

Cambiare `state.magnification` via `__debugState` non bastava: `layoutStage()` non
veniva richiamato (era agganciato solo al listener `resize`), quindi canvas e stage
restavano alla dimensione precedente finché non si scatenava manualmente un evento
`resize`. Non è un bug per l'uso normale (i bottoni UI chiamano `layoutStage()`
direttamente), ma va tenuto a mente per debug futuro via `__debugState`.

### Ancora aperto, non risolto in questo giro

Il disallineamento cromatico principale — riempimento slavato — ha una causa
architetturale, non solo di parametri: il canvas è **sopra** `Mare.webp`, in
trasparenza. Per ottenere la saturazione del riferimento, l'opzione più diretta è
alzare `opacity` verso 0.8-1.0 quando il riempimento resta quasi piatto (bande=1),
dato che a differenza del vecchio riempimento "a nuvola" un riempimento piatto a piena
opacità non produce più l'effetto fog — ma non è stato ancora verificato guardando lo
schermo.

---

## 11. «Celle piene» e «linee troppo ortogonali» — diagnosticato e corretto (2026-09-10)

Feedback del Director su uno screenshot reale. Causa comune per entrambi i sintomi,
non due bug separati:

**Linee ortogonali.** Avevo abbassato `jitter` (0.92→0.55) nel giro precedente,
pensando che meno jitter desse celle più "regolari/arrotondate" — sbagliato: un
Voronoi a basso jitter tende verso un **reticolo quadrato** (i semi si avvicinano ai
nodi di una griglia regolare, e il Voronoi di una griglia regolare è fatto di
quadrati). È la causa diretta dell'ortogonalità lamentata. Avevo confuso due cose
diverse: "irregolarità della tassellazione" (jitter) e "arrotondamento dei bordi"
(smoothV) — bisognava agire sul secondo, non ridurre il primo.

**Celle piene.** Con celle di taglia diseguale (conseguenza anche del basso jitter,
che produce alcune celle degeneri molto piccole) e un `edgeWidth` largo in unità di
griglia, il bordo luminoso può coprire l'intera area di una cella piccola — non si
vede più un bordo sottile, si vede una cella "accesa" per intero.

**Corretto:** `jitter` riportato a **0.88** (irregolarità vera, niente più griglia),
`edgeWidth` ridotto a **0.045** (bordo sottile anche sulle celle piccole). Verificato
guardando lo schermo sul crop `coast`: celle di forma e orientamento chiaramente
irregolari, nessuna cella piena visibile in quel campione.

Non ancora verificato dal Director sul suo schermo, e non ancora testato sistematicamente
su tutti e tre i crop / gamma di `cellScale` — potrebbe ripresentarsi per valori di
`cellScale` molto diversi dal default 140.

---

## 12. Riferimento vettoriale reale — analisi e correzioni (2026-09-10)

Il Director ha scaricato e condiviso un asset stock:
`vector-seamless-rippled-swimming-pool-abstract-illustration-...zip` (Adobe Stock,
formato EPS+JPG). Analizzato tecnicamente prima di usarlo come riferimento.

### Cosa contiene davvero il file

L'EPS (12.5 MB) è "vettoriale" solo di involucro: il contenuto è uno **stream
ASCII85 di dati binari** (confermato: il file termina con `~>`, terminatore ASCII85
standard, e i blocchi di testo leggibile nel file sono solo l'header DSC di Adobe
Illustrator). Non ci sono path/bezier decomponibili in celle — è un raster
incorporato, tipico delle texture "seamless pattern" da stock. Niente da estrarre
meccanicamente; trattato come immagine di riferimento ad alta risoluzione
(6800×4809 px), non come sorgente vettoriale.

### Misure reali sull'immagine (non impressioni)

| misura | valore |
| ------ | ------ |
| spaziatura media fra bordi (campionata su una riga orizzontale) | 425 px |
| larghezza mediana del bordo chiaro | 11 px |
| **rapporto bordo/spaziatura-cella** | **≈ 2.6%** |
| colore riempimento (p5–p50 luminanza) | RGB(19–65, 161–177, 207–215) — turchese saturo |
| colore bordo/nodo (p95–p99) | RGB(110–137, 197–209, 225–233) — ciano chiaro, **mai bianco puro** |
| vignetta globale (luminanza centro/angolo) | 0.97 — nessuna, tile davvero seamless |

### Correzioni applicate, con causa misurata

- **`edgeWidth` 0.045 → 0.02** — il precedente era ~2× più largo del rapporto
  2.6% misurato sul riferimento.
- **`shadowTint` → `#1caad2`, `highlightTint` → `#78cde6`** — sostituiscono un
  grigio-teal desaturato e un quasi-bianco: entrambi sbagliati, il riferimento resta
  sempre dentro la famiglia del ciano, mai verso il bianco o il grigio neutro.
- **`opacity` 0.55 → 0.8.**

### Bug reale trovato verificando l'alpha col pixel readback, non un problema di taratura

`gl.enable(gl.BLEND)` con `blendFunc(SRC_ALPHA, ONE_MINUS_SRC_ALPHA)` su un buffer
pulito a trasparente, con un solo `drawArrays` per frame, produce
**alpha finale = srcAlpha², non srcAlpha** (l'equazione di blend moltiplica l'alpha
in sé stessa quando il destination alpha parte da 0). Misurato: `uOpacity=0.8` dava
un alpha reale di **163/255 = 0.64**, non 204/255 = 0.8 — il riempimento appariva
sistematicamente più slavato di quanto qualunque combinazione di tinte potesse
correggere, indipendentemente dai colori scelti. Non essendoci un secondo pass da
fondere all'interno del canvas (la fusione con l'arte sottostante avviene via CSS
`mix-blend-mode`/`opacity` sull'elemento, non dentro WebGL), il blending GL era
inutile: `gl.disable(gl.BLEND)`. Verificato dopo il fix: alpha reale 204/255,
esattamente `0.8 × 255`.

### Verificato guardando lo schermo

Crop `coast` (Isolotto sud), `cellScale=140`: celle multiple, chiaramente irregolari
e non ortogonali, riempimento ciano saturo visibilmente più vicino al riferimento
rispetto al giro precedente, bordi sottili e luminosi. Non ancora confrontato
fianco a fianco col riferimento in modo sistematico su tutti i crop, e non ancora
verificato dal Director sul proprio schermo.

### Non fatto in questo giro

- Nessuna variazione di luminosità interna alla cella (il riferimento ha una leggera
  disomogeneità anche dentro le celle, non perfettamente piatte) — al momento
  `bands=1` dà un riempimento completamente uniforme.
- Nodi (dove 3+ celle si incontrano) non enfatizzati: nel riferimento sono
  visibilmente più larghi/luminosi del bordo medio; nel mio shader `edgeLine` non
  distingue i punti di convergenza multipla dai bordi semplici.
