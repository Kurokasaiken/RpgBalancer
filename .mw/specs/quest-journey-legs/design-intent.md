# Quest Journey Legs — Andata / Ritorno (R-250 punto 3, R-256 sessione)

Vignette generiche per le due gambe del viaggio di quest (andata e ritorno),
da integrare nel componente quest (`QuestRunWindow` / strip di viaggio).
**Generiche, non legate a una quest specifica** — riuso R7 (`generic`,
`no-people`).

## Vincoli del Director

- Il party del giocatore NON si disegna mai (R2 guida scene) — niente figure,
  mani, stivali, sagome alleate. La strada resta vuota: il viaggio lo legge
  il giocatore.
- Devono avere uno o più elementi usabili per **effetti parallasse**.

## Come il parallasse entra nel prompt

Il renderer usa (a) depth map bakata dall'immagine, (b) `foregroundCutout`
authored opzionale, (c) ambient FX ancorati a coordinate img-fraction
(glow/smoke/embers/dust/drift — `sceneManifest.ts`). I prompt dichiarano
quindi nella composizione:

- **3 piani di profondità puliti** (occlusori foreground ai bordi → strada
  mid-ground → sfondo monumentale) → depth map leggibile;
- **occlusori foreground ancorati ai bordi del frame contro cielo/luce
  aperta** → scontornabili come `foregroundCutout` (layer parallasse veloce);
- **una piccola sorgente luminosa ancorabile** (lanterna/brace sul
  cancello/sacello) → punto `glow`/`embers` per gli ambient FX.

## Grammatica visiva andata vs ritorno (revisione Director 2026-10-22)

Regola emersa: **un villaggio disegnato nel frame si legge sempre come
destinazione** — la prima versione di `andata` («i tetti rimpiccioliscono
dietro») generava immagini che leggevano come arrivo.

- **Andata = attraversamento di soglia.** Camera già oltre il confine, lo
  sguardo verso la wilderness; il villaggio è dietro lo spettatore, MAI in
  frame (kill list esplicita: no village/buildings/roofs/settlement).
  Oggetto-soglia = cancello aperto del palisade (occlusore L1 sinistro);
  la strada si degrada al confine (solchi → sentiero); sole basso alle
  spalle → ombre proiettate in avanti verso l'ignoto.
- **Ritorno = destinazione visibile.** Strada in discesa verso la valle con
  il villaggio davanti — l'arrivo si mostra, non si nasconde. Specchiato:
  occlusori a destra, sole caldo basso sul fronte.

## Formato

- Aspect 21:9 — contratto theatre stage 2.4:1 (`theaterAspect` in
  `gameFrameConfig`, gate `npm run check:quest-art`, tolleranza ±5%);
  cover-fit, soggetto focale nella fascia verticale centrale.
- Lint: `python scripts/lint-scene-prompts.py .mw/specs/quest-journey-legs/scenes/`

## Stato integrazione (2026-10-23)

Generazioni approvate dal Director e integrate nel runtime:

- Asset: `public/assets/scene-library/viaggio-{andata,ritorno}.jpg`
  (3168×1320, 2.4:1) + depth map `public/assets/depth/viaggio-{andata,ritorno}.webp`.
- Manifest: `SCENE_CINEMATICS['viaggio-andata'|'viaggio-ritorno']` —
  `enter-sweep`/`pose-rest`, focusAnchor, ambient FX (glow lanterna, embers,
  fumi comignoli, dust, drift).
- Wiring: `JOURNEY_LEG_ART` in `questArt.ts`; override in `QuestRunWindow` —
  con coda beat drenata durante una fase di viaggio il teatro mostra l'art
  di gamba (`quest-run-window.INV-6`, test `questRunWindow.journeyLegArt`).
- La kill list ora include `NO signature/watermark/logo` (firma AI osservata
  in basso nella prima generazione).
