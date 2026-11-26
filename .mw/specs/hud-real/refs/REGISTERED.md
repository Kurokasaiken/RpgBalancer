# Registered reference artifacts (rule 46-approved-references)

## HUD Night 11 (R-392, 2026-11-26)

- `ref-hud-night-11.png`: copia integrale dell'originale esterno `Mappa fantasy strategica di Night 11.png`, 1672×941, SHA-256 `27a4ec7b8e1ed7dcc679d2bb6e830fc0af9f13039624b4ebc3ba8a434ed3e271`. Director: «è il nuovo mockup d riferimento x la HUD». Ambito ed eccezioni in `plans/PLAN-137-hud-night-11.md`: nuovo riferimento per il socket, smalto navbar dal gioco, stash da deliberare pezzo per pezzo. Nessun precedente golden eliminato.

## Cassetto (PLAN-116, ruling R-323 2026-11-10)

- `approved-cassetto-rich.png` — mockup Gemini scelto dal Director per il cassetto
  (fonte: `dev-public/mockups/plan113-comp/kit/cassetto-rich-0.png`). Il componente
  risorse vive NELLA fascia superiore interna della cornice.
- `approved-cassetto-column-fork-1440.png` / `fork-1280.png` / `closeup-1440.png` —
  baseline del visual fork `visual-fork-cassetto-colonna.md`, ruling verbatim:
  **«1 · Dentro la cornice»** — colonna 420px @1440×900, 400px @1280×800, targhette
  risorse nella fascia testata pulita, CONFIRM a proporzioni native.
- `gen-cassetto-column-frame_v2.py` — generatore della cornice estesa (tecnica
  provata nel fork): stretch solo nei campi neutri, ornamenti/gemma/placca intatti.
  Copia da `.mw/runs/20261110-cassetto-explore/column/frame_v2.py`.

## Victory/Reward popup (PLAN-047 fork, ruling R-348 2026-11-16)

- `approved-victory-pergamena-frame.png` — frame pergamena vuoto rigenerato da
  Gemini web (1024×745, zero scritte dipinte, anello→mount medaglione battezzato).
  Baseline battezzata, ruling verbatim: **«approvato, battezza»** (famiglia scelta:
  «B pergamena»). Fork card: `.mw/runs/20261116-r348-victory-ruling/visual-fork-victory-reward.md`.
- `approved-victory-reward-v5-witness.png` — witness headless del mockup
  approvato (`public/mockups/victory-reward/v5.html`, 1440×900, carico 5 crew +
  6 reward + echoes, zero overflow).
- `gen-victory-frame-gemini.mjs` + `gen-victory-frame-prompt.txt` — generatore:
  Gemini web via CDP :9222, image-editing della B ChatGPT senza scritte +30% alto.
  Lezione: rigenerazione AI del frame > patching raster (iterazioni V4 bocciate).

## Victory/Reward report live (PLAN-125 7d, ruling 2026-11-22)

- `approved-victory-pergamena-live.png` — witness live headless su `/game`
  (run reale, outcome wipe) della pergamena battezzata DOPO il fix-pass
  R-357: drop-shadow rimosso, margine dipinto nero di `frame.webp`
  flood-cut ad alpha (silhouette strappata vera), titolo oro leggibile,
  CTA centrata, aria fra i blocchi centrali, ritratto anchor a disco
  nell'anello dipinto, niente rettangolo skin sullo scroller crew.
  Ruling verbatim: **«battezzo»** (2026-11-22). Sostituisce la baseline
  live; `approved-victory-pergamena-frame.png` resta il golden dell'art.

## Roster medaglioni + vite/foglie a S (reference recuperata, 2026-11-25)

- `ref-roster-vine-medallions-band-mockups.png` — mockup originale recuperato
  dalla history git (`a4cc3a023^:dev-public/mockups/band-mockups.png`) dopo la
  richiesta verbatim del Director: **«voblio il mockup originale, quello che m
  hai mostrato nn è quello d cui parlo, molto + vecchio»**. La tavola mostra tre
  varianti verticali etichettate nel viewer originale come **A — Spina C1**,
  **B — Vite oro**, **C — Vite verde**: cerchi/medaglioni concatenati e vite
  fogliata che scende con andamento a S. Sha256:
  `6b82e9001fb0d51b3d82dd598e60b658f4343dcf535787c012ada5c4d3283e81`.
- `ref-roster-vine-medallions-bands.html` — viewer/provenienza originale
  recuperato da `a4cc3a023^:dev-public/mockups/bands.html`; conserva le etichette
  delle tre varianti. Non è il generatore dell'immagine, solo il contesto di
  presentazione ritrovato.

## Round filter sockets — controllo default filtri/chiusura (R-391, 2026-11-26)

- `ref-round-filter-sockets-2026-11-26.png` — crop incollato dal Director dei 4 socket circolari del pannello Eventi, sha256 `f64631afc7cb928e79970544d78572b5420573ec607cadf03eddb92a7163970f` (372×96). Ruling verbatim: **«la seconda immagine (dal compoentne eventi) è la reference corretta x i filtri... E' anche lo stesso elemento x fare il pulsante x perchiudere (la x grande)»**. Significato: questo socket circolare diventa il controllo visuale default per filtri e chiusura su stash/magazzino, roster e tempo; va documentato come elemento standard e non re-interpretato con altri ring/pill.
- `stash-current-state-2026-11-26.png` — screenshot dello stash corrente incollato dal Director come punto di partenza («siamo arrivati qua»), sha256 `9723b328d74e211834ca0cf883da6f5db815dc1829217e7222fc20bdd8fa49ed`. Non è golden: è baseline di stato per il prima/dopo.

## PLAN-136 round/square socket candidates + stash/time derivatives (R-391, 2026-11-26)

- `public/assets/ui/hud-real/controls/round-socket-normal.webp` — socket rotondo canonico estratto deterministicamente da `events/panel-bodytop.webp` da `scripts/hud-real/build-round-socket-control.py`, sha256 `ee978b6b6e1583d9bcdf9944b43beac3666c96f69464b2c2f21fe77e5d7e0908` (116×116). Reference concettuale battezzata: `ref-round-filter-sockets-2026-11-26.png`. Pezzo `round-socket-events-v1` registrato **candidate** finché il Director non battezza il derivato montato.
- `public/assets/ui/hud-real/controls/square-socket-normal.webp` — alcova quadrata nella stessa materia/cromia del socket rotondo, costruita deterministicamente da `scripts/hud-real/build-square-socket.py`, sha256 `6209cf8a243fa176515664946f29075972c04563e3bd2614e9a8bedbf2234b36` (128×128). Pezzo `square-socket-events-v1` **candidate**; hover/focus restano effetti DOM/CSS.
- `public/assets/ui/hud-real/stash-frame-no-grid.webp` — backing stash derivato da `stash-frame-clean.webp` da `scripts/hud-real/clean-stash-backing.py`, sha256 `45572296a2846132751d7cd9ac1527739e34f2529f60b9efbd17a69a66405032` (1146×831), senza pozzetti/track cotti nella fascia shelf.
- `public/assets/ui/hud-real/time/bar-controlless.webp` e `bar-slim-controlless.webp` — varianti Time control-neutral da `scripts/hud-real/build-time-controlless-bars.py`; rimuovono i vecchi socket rettangolari dipinti così pausa/velocità montano il round socket canonico. Provenance/sha in `.mw/specs/hud-real/refs/plan136-time-controlless-provenance.json`.
- Witness finale: `test-results/plan136-stash-round-sockets/final-board.png` (2×2: reference, stash, tempo, hover alcova).
