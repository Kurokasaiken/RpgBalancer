# poi-radial — kit materiali del menu radiale del Luogo (PLAN-117 F2)

- Chat Gemini: `https://gemini.google.com/app/c223f539ea039063` (2026-11-13).
  Base disc + edit ancorati job/quest/event/glass/hub — geometria identica
  fra le lastre (le clip-wedge combaciano su tutte le varianti).
- `refs/` — POI Zanara battezzati usati come ref materiale (oro inciso,
  smalti navy/smeraldo/blu, gemme).
- `refs/mockup-hub-fan-village.jpg` — **mockup di riferimento approvato**
  (Gemini, Director 2026-11-13): ventaglio di piastre-smalto sovrapposte e
  ruotate a mano (non disco unico), bordo oro inciso spesso con gemme,
  icona dipinta + etichetta testo, diorama villaggio su piedistallo oro
  al centro come elemento dominante, slot vuoti = piastra con triangolino.
  Questo è il target visivo: il disco `PlaceRadial` attuale non lo regge
  (Director: «non regge nulla») — valutare passaggio a composizione a
  ventaglio o rilettura profonda del disco.
- `gen/*-0.png` — output grezzo: il fondo a scacchiera è rasterizzato,
  **non** è vera trasparenza. Non usare i PNG direttamente.
- `process-kit.py` — normalizza il disco, maschera deterministicamente
  l'esterno, separa cornice e settori dipinti, genera vetro con alpha reale.
  Non usare flood-fill: le tessere della scacchiera sono disconnesse.
  Export candidato `public/assets/ui/poi-radial/*.webp`, non battezzato.
- Bande radiali misurate sull'arte (frazioni del raggio disco):
  pozzo hub 0–0.24, collare 0.24–0.39, settori 0.39–0.70,
  canale temporale 0.72–0.84, bordo 0.79–0.95. In `BANDS`
  (placeRadialGeometry.ts) con bordo arte = R.
- La base contiene già un medaglione centrale; `hub.webp` resta un
  candidato **non montato** per evitare di sovrapporre due collari.
- Arte ruotata +22.5° nel componente: costole sui bisettori degli slot.
  Slot i → settore immagine [45i-90, 45i-45] (clip `pr-pw-i`, inset 1.4°).
- Pista temporale: arco SVG sottile nel canale a r=0.78R, grammatica POI
  (job CW elapsed, quest/evento CCW residuo, virata percettiva al rosso
  sotto soglia — ruling 2026-11-12, niente pulse/badge).
- Viola evento (`disc-event`, #8a5fb0 arco) = PROVVISORIO, non battezzato.

## F2-T0 — diorama perno (2026-11-13)

- Chat Gemini dedicata: https://gemini.google.com/app/d9c147e0b3b074e6
- Brief + prompt: `.mw/specs/poi-radial/diorama/prompt-final.txt` (gate PASS)
- Ref inviati: `refs/mockup-hub-fan-village.jpg`, `hud-real/village-icon/ref-village.png`
- Candidati pose finale (3/4 = resting pose animazione):
  - `diorama/gen/diorama-final-c0.png` — watchtower singola + casette (village diorama)
  - `diorama/gen/diorama-final-c1.png` — ≈ c0 (camera raise non recepita, duplicato)
  - `diorama/gen/diorama-final-c2.png` — keep a due torri + gatehouse + piazza col pozzo (più vicino al castello del mockup)
- Fork card: `diorama/gen/fork-diorama.png` (mockup-centro | c0 | c2)
- Script: `scripts/_tmp-gemini-diorama.mjs`, `-c1.mjs`, `-c2.mjs`
- In attesa di ruling Director → poi frame intermedi (frontale→3/4) via edit ancorati.
- Ruling Director: **c0 battezzato** (villaggio, non keep-c2). Pose finale = c0.
- Sequenza flipbook (stesso soggetto, torre singola):
  - `diorama-frame-front2.png` (front) → `diorama-frame-a.png` (~20°) → `diorama-final-c0.png` (3/4 finale)
  - Versioni trasparenti `*-t.png` (navy keyato); strip prova `frames-strip.png`
  - Scartati: `diorama-frame-front.png` (contaminato da c2, due torri), `diorama-frame-mid.png` (= c0)
- Pending: battesimo Director sulla sequenza completa prima di manifest/runtime.
- 2026-11-13: Director "provedi" dopo la strip → sequenza 3 frame battezzata (front2 → a → c0).

## F2-T1 — geometria fan (fatta)

- `src/ui/idleVillage/components/gameFrame/placeFanGeometry.ts`: pivot comune, arco fisso 8 slot (-30°→-170°, step -20°, riempimento destra→sinistra / NE-first), rotazione carta = bearing+90, z-order verso il top, slot vuoto = null (piastra ▲), overflow → planner.
- Config-first: `placesConfig.fanCards` (zod, deep-frozen).
- Test `tests/unit/idleVillage/placeFanGeometry.test.ts`: 7/7 verdi.

## F2-T2 — kit carte (in corso)

- Chat Gemini dedicata: https://gemini.google.com/app/685d5d8b80949fcf
- Prompt: `.mw/specs/poi-radial/cards/prompt-plate.txt` (gate PASS, domain prismatic)
- Piastre (anchored edit su `plate-emerald-c0`, identica forma/bordo/filigree/gemme):
  - `cards/gen/plate-emerald-c0.png` (job), `plate-sapphire.png` (quest), `plate-amethyst.png` (event), `plate-empty.png` (socket scuro + triangolino oro)
  - Trasparenti `*-t.png` via flood-fill dai bordi (color-key mangiava gli smalti scuri — flood preserva l'interno)
- Strip prova: `cards/gen/plates-strip.png`
- Mancano: icone dipinte per attività (batch dedicato se il Director vuole icone pittoriche come il mockup — placeholder iniziale: `usePoiTypeIcon` esistenti)
- Pending: battesimo Director.

## Correzione di lettura mockup (2026-11-14)

- Il mockup NON è un ventaglio di carte con pivot vicino: è un **ANELLO inclinato di spicchi-carta** attorno al diorama-hub (ellisse, punte interne profonde sotto il piedistallo, overlap/shingling, scala prospettica sui settori bassi).
- `placeFanGeometry.ts` (F2-T1) va riscritto: da arco-pivot a anello-ellisse — matematica più vicina a `placeRadialGeometry` ma con carte separate + prospettiva.
- Preview: `gen/fan-assembled-v3.png`, confronto `gen/v3-vs-mockup.png`.

## Lettura definitiva del mockup (2026-11-14, misurata su mockup-grid)

- **Non un disco né un arco regolare**: cluster organico di ~12-13 lastre-smalto accavallate attorno a un **diorama centrale enorme** (villaggio ~360px su 1946, dominante).
- Le lastre sono spicchi trapezoidali **di dimensioni e rotazioni irregolari**: alcune larghe/orizzontali (MAPPA), altre piccole e appena visibili dietro (socket vuoti con triangolino), sovrapposte a scaglia; silhouette esterna ad arco basso e largo.
- Posizioni irregolari → layout = **lista di slot misurati** (quad per carta: centro, rotazione, w×h, z), non formula parametrica. Config-first: slot-map in placesConfig.
- Icone dipinte grandi dentro ogni lastra (ascia, piccone, falce, incudine, sacco, bilancia, spade, boccale, bussola) = identità attività. Testo escluso per ruling.
- Estrazione diretta dal mockup = fallita (occlusioni irrecuperabili) → servono asset rigenerati standalone (Gemini edit/de-text — in pausa per captcha google/sorry, richiesta risoluzione manuale in Canary).
- Preview assembly v5 (piastre nostre nei quad misurati): `gen/fan-assembled-v5.png` — approccio giusto (slot misurati + nostro materiale), dimensioni da rifinire.

## 2026-11-14 — Ricerca mockup-to-layers + slot-map misurata

- **Ricerca online**: il problema è "mockup-to-layers decomposition" (tool: 50kg/image-to-slice MIT, Luma Layers, SPRITE paper). Pipeline canonica: decomposizione → cutout → **inpaint AI delle zone occluse**. Estrarre carte complete dal mockup flat è impossibile per definizione (parti occluse irrecuperabili senza inpaint generativo).
- **Tooling provato**: image-to-slice installato in /tmp/image-slice — funziona ma tarato su UI flat: sul mockup dipinto trova solo 3 icone. OpenAI API: no crediti. Gemini API image: 429. OpenRouter: 402. ZAI: no saldo. Gemini web: abuse-flag → risponde testo, non genera. ChatGPT web: attach ok, nessuna immagine prodotta.
- **Struttura mockup (lettura definitiva)**: 14 posizioni = 10 carte "piene" + 4 socket ▲. Spicchi curvi non uniformi, lunghezze/rotazioni diverse, accavallati; punte verso pivot lontano sotto quadro; MAPPA/TAVERNA ai bordi ruotati ~90°. Diorama ~350px/1946 — dominante.
- **placeFanGeometry.ts RISCRITTO**: da arco parametrico (arcStartDeg/arcStepDeg) a **slot-map misurata** in `placesConfig.fanCards` (14 slot: x,y,rotateDeg,wFrac,hFrac in draw order; fillOrder=[MAPPA,TAGLIA,MINA,AGRIC,MERG,FORGIA,MER2,scroll,swords,TAVERNA]; diorama x.493 y.423 h.625). Test 7/7 verdi.
- **v7 composite** (`gen/fan-v7-vs-mockup.png`): la slot-map regge il confronto — posizioni/scale/z coerenti col mockup. Gap residui: posizioni da rifinire a ±30-80px, shape spicco-curvo vs trapezio dritto, icone assenti.
- **Errore corretto**: rotazione CSS = atan2(-dx,dy) del vettore punta (non atan2(dx,dy) — segno su dx flippato).
- **Ancora bloccante**: generazione immagini (de-text pulito + icone dipinte + spicchi standalone) — serve un provider con quota (o LaMa locale con numpy<2 — incompatibile Python 3.14 di sistema, usare venv dedicato Python ≤3.12).

## 2026-11-14 (b) — v8: slot-map rimisurata sui quad del mockup

- Sovrapposti i quad degli slot al mockup (pivot/centro/asse per carta) e corrette tutte le 14 posizioni:
  MERG rot -11.5→+37, MER2 36.9→50, scroll 58→37 + y .197→.267, TAVERNA 86→100 + y .717,
  MAPPA y .574→.460 + hFrac .470→.580, TAGLIA/MINA x→.38 (accostate al diorama), AGRIC x .424→.503, FORGIA .586→.620.
- v8 (`gen/fan-v8-vs-mockup.png`): composizione finalmente coerente — anello basso, shingling,
  diorama dominante, socket ▲ che sbucano, MAPPA/TAVERNA laterali quasi orizzontali.
- **Gap residuo strutturale**: le piastre sono trapezi a bordo superiore dritto; il mockup ha
  **spicchi curvi** (bordo esterno ad arco attorno al diorama) che si chiudono a fisarmonica
  senza vuoti navy tra vicini. Serve rigenerare le carte come settori anulari (o polar-warp
  delle texture esistenti) + icone dipinte + de-text → bloccato su generazione immagini.
- Test placeFanGeometry 7/7 verdi dopo la rimisura.

## 2026-11-14 (c) — ruling Director: modello a riempimento + terminologia

- **Modello**: NON anello pre-diviso. Cerchio che **si riempie di slice**: N attività → solo le
  N slice occupate + la loro parte di cerchio. Slot vuoto = niente piastra (niente socket sempre visibili).
- **Terminologia**: `diorama` = centro (ok). `slice` = TUTTO il settore (bordo oro + smalto +
  icona + spessore laterale), non solo la parte interna.
- **Diorama**: troppo largo/basso → keep più alto; serve **piedistallo laterale** che dia
  spessore al disco (ora nero).
- **Target**: superare il mockup, non copiarlo pixel-a-pixel.

## 2026-11-14 (d) — SVOLTA geometrica: pivot sotto il frame

- Zoom TAVERNA/MAPPA: le carte SONO settori anulari (archi concentrici, lati radiali);
  i lati NON convergono al centro ellisse ma a un **pivot ~1050px sotto il frame** →
  l'anello è un cono tronco, le facce inclinano verso l'alto («parte esterna più alta»).
- Ellisse bordo esterno misurata: c(995,345) rx 690 ry 330 roll +6.3° (destra più bassa).
- Slice = raggi dal pivot P(973,1050) tra ellisse esterna e profondità DEPTH=0.68 lungo
  il raggio (il mockup NON è concentrico — i centri misurati non stanno su un unico raggio).
- v15 = modello corretto: ventaglio che si apre, tessellazione, plinth laterale,
  diorama h.66 aspect ~1.0. File: gen/fan-v15-*.png
- **placeFanGeometry va riscritto in pivot-space**: slot = bearing dal pivot + bounds.

## 2026-11-14 (e) — "cerchio base" = piattino gold-rimmed sotto il diorama

- Il Director ha chiarito con crop: cerchio base = la **coppa/piattino ellittico oro**
  su cui siede il villaggio (nel mockup ~x660-1280, cy~310, rx~310 ry~130),
  NON l'anello esterno. Struttura: bordo oro + faccia bronzo noce + gemme incastonate
  sul rim + parete laterale sotto + ombra portata.
- v17 = saucer + diorama. Prossimo: prima fila di slice attorno alla coppa.

## 2026-11-14 (f) — v18: prima fila abbraccia la base diorama

- Cerchio base = piedistallo del diorama stesso (nessun saucer aggiunto — ruling Director).
- Prima fila = settori dal pivot (973,1050) il cui bordo interno è a ~0.82 del raggio:
  le carte sono CORTE (~18% della profondità) e si fermano contro il piedistallo.
- Ellisse bordo esterno (992,330) rx 680 ry 320, senza roll.
- v18 regge la struttura: ferro di cavallo attorno alla base, tessellazione, fill model.

## 2026-11-14 (d) — Reference preservation (ruling Director)

- Nuova regola `.windsurf/rules/46-approved-references.md`: gli artefatti battezzati dal
  Director e gli screenshot passati come reference vanno copiati in `refs/` e registrati.
- **`refs/approved-fan-v65.png`** = render battezzato ("procedi"): **modello target del
  componente Luogo** — anello ellittico continuo di spicchi-smalto attorno al piedistallo,
  NON le 14 carte sparse del modello v8. Il componente live va riportato su questo modello.
- Le 14 slot-map v8 restano in config ma il fitting a carte è da considerarsi bocciato:
  v65 (settori anulari) è la forma approvata.
