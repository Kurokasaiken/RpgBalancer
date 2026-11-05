# Handoff — animazione schiuma marina sugli scogli (mappa2, R-299)

Scritto il 2026-11-02 per passare il task a un altro agente.

## Il problema (parole del Director)

La schiuma bianca dipinta attorno all'arco roccioso e ai faraglioni sulla costa
ovest della mappa deve **animarsi come risacca vera**: onde che arrivano, si
frangono, l'acqua bianca che **sale sugli scogli** e poi defluisce. Deve
sembrare il dipinto che prende vita — stesso colore, stesse pennellate — non un
effetto sovrapposto.

Frasi chiave del Director (l'evoluzione del requisito):

- «la schiuma davvero si deve muovere, non deve rimanere disegnata fissa e ci metti qualcosa davanti»
- «non c'è animazione, solo i colori cambiano. Ci serve una animazione vera»
- «la schiuma è bianca, dobbiamo fare quel bell'effetto bianco d'onde che si frangono sugli scogli»
- «non attorno, deve salire [sugli scogli]»
- «devi prendere l'immagine originale e ottenere quell'effetto — dove, come colore, ecc»
- «non deve essere più vicino, deve essere uguale [al dipinto]»
- «il coast foam dovrebbe incrementare dinamicamente in base a quanto è vicino alla terra, diventare più bianco e più spesso»
- «l'animazione non dovrebbe solo salire ma comportarsi come la schiuma»

## Repo / runtime / file

- Repo: `/Users/faustoboni/progetti_personali/RPG` (React+TS, PixiJS, Vite, Zod).
- Pagina di verifica: `http://127.0.0.1:5173/mappa2-lab` (dev server: `npm run dev -- --port 5173`).
  Lo screenshot di riferimento è **mappa2**, NON `/game` (quella è la mappa wanderlust).
- Mappa: `public/assets/world/mappa2/base/` — 2752×1536.
- Zona: baia dell'arco, world ≈ x:0..560, y:350..800.

File toccati:

- `src/ui/idleVillage/pixiSpike/PixiWorldMap.tsx` — la shader `COAST_FOAM_FRAG`
  (verso riga ~516) fa TUTTO ora: flow map + surf procedurale + run-up + creste.
  Montata come `Mesh` su quad full-canvas (verso riga ~2580-2660), uniform bindati lì.
- `public/assets/world/mappa2/base/masks/`:
  - `coast_distance.webp` — R: distanza mare→costa (px/160), G: sea flag, B: peso surf dipinto.
  - `foam_clean.webp` — clean plate (acqua senza schiuma dipinta), alpha = footprint della schiuma dipinta.
  - `land_distance.webp` — NUOVO, bakato a mano: R: dist terra→mare, G: land flag, B: adiacenza surf.
  - `foam_strokes.webp` — NUOVO, bakato a mano: RGB = colore pennellate estratto da `base_flat`
    (pixel con min-rgb≥170 entro 90px di costa), alpha = copertura tratti.
  - `sea_mask.webp`, `foam_mask.webp` (sea & dist≤20).
- `layers/base_flat.webp` — il dipinto (contiene la schiuma dipinta).
- `secondary-water.json` — `seaPatches`: bay_2, river_mouths, delta_sea. **`sea_arch` è stato RIMOSSO**
  (era il flipbook di repaint, approccio bocciato).
- `scripts/build-mappa2-assets.py` — genera coast_distance/foam_clean; le due nuove maschere
  NON sono ancora nel generator (bake ad-hoc, da integrare se servono regen).
- Test: `tests/unit/idleVillage/mappa2SeaArchPatch.test.ts` (3 test: clean plate presente,
  sea_arch assente, frames esistenti). Comandi: `source ~/.nvm/nvm.sh && nvm use`, poi
  `NODE_OPTIONS=--require=./polyfill-crypto.cjs npx vitest run <test>`.
- Verifica headless: seam `window.__worldCamCtl.set({panX,panY,zoom})` (pan in px mondo),
  `window.__meshOk`, bottone "Hide test UI" per nascondere il pannello. Playwright va
  lanciato DALLA repo (module resolution).

## Stato attuale della shader (bore model)

`COAST_FOAM_FRAG` — quattro meccanismi:

1. **Flow map**: `uBase` (il dipinto) advected lungo `-∇(coast_distance)` = verso riva,
   doppia fase incrociata (loop 6s, amp 12px) = moto continuo 60fps. Guard: mai campionare terra.
2. **Bore/sheet**: fronte `frontD` che sweepa 85→2px su ciclo ~11s (`uTime*0.09`), fase locale
   `vnoise(w*0.008)` per tratto di costa. `sheet` = schiuma che decade `exp(-age/22)` dietro il
   fronte; `bore` = faccia bianca del fronte; `shore` = churn fisso agli scogli (22px);
   `prox` = rampa vicinanza (più denso/bianco a riva).
3. **Tratti dipinti**: `uStrokes` (foam_strokes.webp) advected come il flow — la schiuma
   visibile È il dipinto, colore esatto.
4. **Run-up sugli scogli**: `uLand` gate; `climbE` legato all'arrivo del fronte (uprush rapido,
   rundown lento), altezza ~26px·adiacenza, breakup a pizzo.

Uniform: `uDist uClean uBase uLand uStrokes uWorld uTime uDMax uFoamColor uStrength
uDissolveStart uDissolveEnd uCrestSpeed uSwash` (alcuni legacy non più usati).

Parametri da ritoccare: `0.09` (ritmo ciclo), `85→2` (corsa fronte), `22` (coda scia),
`12px` (ampiezza flow), `26` (altezza risalita), `0.22` (riempimento procedurale),
`70` (rampa prossimità), `0.55` (whitening a riva).

## Approcci provati e BOCCIATI (non riprovare)

| # | Approccio | Perché bocciato |
|---|---|---|
| v1 | Pose `seaPatches` che muovono solo dettaglio HF | schiuma (basse freq) ferma |
| v2 | `flow_whole`: traslare l'intera immagine nella maschera | «disegno che slitta», forma mai cambia |
| v3 | + pulsazione alpha per-frame | «schiuma ferma con qualcosa davanti» |
| v4 | **Flipbook dipinto** (3 repaint Gemini + crossfade runtime) | repaint temporalmente incoerenti → morphing melty, «non sembra un'animazione». Scelta "B" del Director poi abbandonata |
| v5a | Surf procedurale = envelope surge→drain in place | «solo i colori cambiano» — niente traslava |
| — | Shader che nascondeva e ri-mostrava la schiuma dipinta (swash `hideA` preesistente) | la ri-mostrava identica |

Lezioni dure: (a) il flipbook dipinto non può dare moto vero senza coerenza temporale;
(b) qualsiasi cosa che non **trasla** non legge come animazione; (c) l'alpha pulsing è
invisibile come "vita"; (d) il look deve essere i pixel dipinti VERI (foam_strokes).

## Verifica

- Probe headless di riferimento: screenshots a t0/t+2s/t+4.5s su
  `panX:-40, panY:260, zoom:1.3` clip 100,150,700×500 → si vede il fronte correre,
  scie che defluiscono, bianco che sale sugli scogli.
- Fianco a fianco con `base_flat.webp` crop (0,340,640,780) — lo facemmo: il look dei
  tratti ora corrisponde (sono letteralmente i pixel dipinti).
- ATTENZIONE (fixed): il flow+surf si attiva ANCHE sulle rive dei laghi interni
  (sea_mask include ~14.6k px di internal_water) — ha «rovinato le montagne» con banda
  ciano; mitigato riducendo amp 18→12, portata 140→110, fill 0.35→0.22. Se persistono
  artefatti su laghi, gateare su `internal_water_mask` (esiste come maschera separata).

## Stato aperto

- Il Director ha visto progressi ("meglio") ma non ha ancora approvato il look finale.
- Le 2 nuove maschere (land_distance, foam_strokes) vanno integrate in
  `build-mappa2-assets.py` per parità di generazione.
- `RICHIESTE.md` R-299 ha lo storico v1→v5; bundle `.mw/runs/r299-sea-arch-foam/`.
- Crossfade sea-patches aggiunto al runtime (spNext per sea>0) — migliora bay_2/delta_sea.
- Deliberazione multi-AI morta senza output; non necessaria se il bore model convince.
- Vercel deploy non fatto: la patch esiste solo in dev locale.

## Aggiornamento 2026-11-02 — cancello `surf_zones` (passo 1)

- Sintomo visto (sonda headless, schiuma on/off a frame congelato): le punte innevate
  che emergono dal mare a nord erano lette come schiuma dipinta → la clean plate le
  sostituiva con chiazze color acqua; la risalita e il flusso lambivano anche i laghi interni.
- Fix: `masks/surf_zones.webp` (alpha) = tutto tranne bioma `alpine` (+24 px) e laghi
  ≥500 px (+20 px), sfumato 6 px verso l'esterno. Generata da
  `python3 scripts/build-mappa2-assets.py --only-surf-zones` (anche nel build completo).
  La shader moltiplica TUTTA l'uscita per `zone` (`uZones`).
- Soglia 500 px: un falso "lago" di 249 px (ombra) sta ai piedi della scogliera dell'arco.
- Test: `tests/unit/idleVillage/mappa2SurfZones.test.ts`. Sonda: `scripts/_tmp-probe-foam-zones.mjs <outDir> <tag>`.
- Prossimo: passo 2 (schiuma bianca: cuore bianco, tratti solo nella scia, alone scuro della clean plate).

## Aggiornamento 2026-11-02 — «macchie di sporco» sulle spiagge

- Sintomo: chiazze ciano con bordo scuro lungo le linee bianche dipinte di ogni spiaggia.
- Cause (tre): (1) la shader rimoltiplicava per alpha texture già premoltiplicate da Pixi
  (`cl.rgb * hideA`, `s.rgb * s.a`) e poi ancora l'uscita (`surfCol * aSurf`) → bordo scuro e
  schiuma grigiastra; (2) la clean plate riempiva con una media sfocata di sola acqua scura
  (ricaduta su blu profondo vicino a riva) → striscia blu; (3) la regola «schiuma dipinta»
  prendeva anche la sabbia chiara.
- Fix: shader in colore dritto (`clRgb`, `premult = surfCol + flowed*aFlow`); clean plate =
  `cv2.inpaint` TELEA r=6; schiuma = chiaro E non caldo (B−R ≥ −12). Ricetta allineata in
  `build-mappa2-assets.py` e `fix-mappa2-sea-mask.py` (che rigenera foam_clean: lanciarlo
  rimette tutte le maschere identiche tranne foam_clean, ma ricodifica in lossy `layers/Mare.webp`
  → ripristinarlo se l'alpha non cambia).
- Errore cromatico al bordo della plate: 36.5 → 6.8 (test in `mappa2SurfZones.test.ts`).

## Aggiornamento 2026-11-02 — passo 2: schiuma bianca

- `foam_strokes.webp` ora è generata (`build_foam_strokes` in `build-mappa2-assets.py`,
  `--only-surf-masks` rigenera lei + surf_zones): alpha = rampa di luminosità del dipinto
  (min-rgb 150→200) × bianco freddo × impronta plate × zone. Il vecchio file a mano aveva come
  alpha l'impronta dilatata → «salsicciotti» bianchi.
- Shader: la schiuma si disegna dove c'è la plate anche su pixel classificati terra (le linee
  di spiaggia stanno lì); cuore bianco solo su acqua e a pizzo; tratti mai sotto ~80%;
  colore verso bianco 0.5→1 con prossimità/fronte.
- Misura (5 istanti, frame congelati, pixel bianchi shader/dipinto): spiaggia isola 0.08→~1.0-1.5,
  costa NE ~1.0, baia arco 0.52→~0.92. Rampa 140/35 provata e scartata (isola 2.8×).
- Aperto: nella baia il pizzo è meno nitido del dipinto; la risalita su roccia legge come
  sbuffo grigio. Script misura: scratchpad `white.py` (on/off per istante, min-rgb ≥175 / ≥200).

## Aggiornamento 2026-11-02 — rifinitura baia e risalita

- Velatura del pizzo: le due fasi del flow (copie a ~6 px) erano mediate alla pari → sfocatura.
  Pesi al cubo (domina una fase salvo allo scambio). Tratti quasi opachi
  (`smoothstep(0.05,0.6,strkA)`). Dettaglio HF nel vortice: 0.80 → 0.83-0.93 del dipinto (varia per run).
- Risalita: il velo semitrasparente leggeva come sbuffo grigio. Ora: orlo al contatto spezzato e
  solo durante lo swash (un orlo fisso contornava ogni roccia) + schizzi fini opachi che salgono.
- Provato e annullato: plate solo su acqua (`hideA = cl.a*water`) → linea di spiaggia doppia
  (dipinta + copia mobile), bianco isola 3.7×. Le «rocce fantasma» grigie all'arco sono nel dipinto.
- Sonda: `NO_CLOUDS=1 SAMPLES=5 VIEWS='{...}' node scripts/_tmp-probe-foam-zones.mjs <dir> <tag>`
  (le nuvole, zIndex 10, sporcavano le misure on/off).

## Aggiornamento 2026-11-02 — modello a ONDATE (dopo «pessimo lavoro»)

Feedback Director: «c'è il bianco sempre disegnato e dei pezzi di bianco ogni tanto salgono, e poco,
prima salivano di più»; «arriva a ondate: arriva, si ritira».

Ricerca (fonti):
- Run-up su parete verticale ≈ 2× l'ampiezza incidente, gruppi d'onda estremi fino a ~5×
  (Carbone, Dutykh, Dudley, Dias, GRL 2013 — https://hal.archives-ouvertes.fr/hal-00799118/).
- Le onde arrivano a SET (2-15, tipicamente 3-7) separati da pause
  (https://www.surfertoday.com/surfing/why-do-waves-come-in-sets ; https://oceanfit.com.au/education/wave-sets-and-lulls-is-every-seventh-wave-the-biggest/).
- Su scogliera: impatto → getto/lamina che sale, poi ricade e drena; la schiuma è un prodotto
  dell'impatto che si disperde (thesis MUN https://research.library.mun.ca/13216/1/thesis.pdf ;
  clapotis https://en.wikipedia.org/wiki/Clapotis).

Modello in shader (`COAST_FOAM_FRAG`): orologio d'onda T≈9 s per tratto di costa; `waveAmp`: 5 onde
forti (0.6-1.0) + 2 di pausa (0.15); impatto al 45%; schiuma densa ~1 s poi decade (τ 1.8 s), quasi
zero prima dell'onda successiva; tutta la zona dei frangenti diventa bianca all'impatto; la risalita
trasporta in alto le PENNELLATE dipinte del piede (altezza ∝ ampiezza·√adiacenza, solo dove il
mare è sotto la roccia — gradiente di land_distance verso l'alto).

Cause trovate lungo la strada:
- `foamA *= min(1, uStrength*2)` (0.68 nel lab) → il bianco del dipinto non poteva mai tornare
  pieno, solo un velo grigio-azzurro. Rimosso (lo slider guida solo le creste).
- clean plate con inpaint TELEA: strisce/macchie color roccia (anche rosse) su impronte larghe →
  sostituito da cascata di convoluzioni normalizzate (σ 3→48) dai pixel non-schiuma.
- impronta della plate estesa ai PIEDI di roccia (mare sotto entro 25 px e roccia ai lati ±8 px),
  altrimenti il bianco dipinto lì restava sempre.
- `foam_strokes`: rampa min-rgb 130→185.
Misura (scansione deterministica `TIMES=` nella sonda, uTime pilotato): baia — 0 px bianchi fissi,
pausa ~0, picco ~2400 vs dipinto ~2070; isola — 0 fissi, picco ~330 vs dipinto ~157.
Aperto: la risalita è visibile ma moderata; valutare altezza maggiore dopo occhio del Director.

## Aggiornamento 2026-11-02 — specks sulla scogliera (R-307)

- Sintomo Director: «effetti della schiuma arrivano dove nn dovrebbero, su questa scogliera,
  tipo piccoli effetti di luce» (rim est, parete scura).
- Causa: `facing` (gradiente del campo distanza 8-bit) passa a frammenti sulle silhouette il cui
  mare è dietro/laterale; lo `spray` (vnoise) ci accendeva flecks bianchi — `foam_strokes` su
  terra = 0, quindi era SOLO spray/procedurale.
- Fix in `COAST_FOAM_FRAG`: dopo `reach *= facing`, probe `seaBelow` — 6 tap su `uDist.g` in cono
  verso il basso a `rr = ld*(0.7|1.3)+4`; `reach *= smoothstep(0.3,0.5,seaBelow)`. Sheet+spray
  muoiono dove il mare non sta sotto.
- Misura: `scripts/_tmp-probe-foam-land-leak.mjs` (whiteLeaks = land brightened, fuori plate,
  ld≥12, senza mare sotto): ~migliaia di specks → total 23 ≤ 96 su 5 viste × 6 tempi.
- Contratto: `pixi-world-map.INV-4` (director-bug, R-307), red-first registrato, test in
  `mappa2SurfZones.test.ts` (leak class + gate). Bug dir `.mw/bugs/2026-11-02-mappa2-foam-on-cliff/`.
- Aperto: occhio Director OB-4; `source_ref R-307` diventa citabile dopo commit (come R-306/R-308).
