
## 2026-11-23 (bis) — time-sole: pulizia finale medaglione + barra

- **Foglie-cristallo rimosse** dal `dial-frame.webp` (bordo sx, ore 7→11) — marcate dal Director via `scripts/hud-real/green-marker.html`; outer ring e pinne intatti («nn toccare l'outer ring»).
- **Vecchio medaglione cancellato da `bar-slim.webp`**: la sede smeraldo + ornamenti dipinti nella barra spuntavano a dx del nuovo frame (alla posizione scelta x=-3.5 il frame arriva a x≈78, il vecchio dipinto a x≈118). Riempito x<118 col campo scuro piastrellato; cap ornamentale oro (giunzione) intatto.
- **Micro-slop ritoccati**: fessura anello↔fermaglio chiusa, incavi foglie riempiti, buchi alpha tappati.
- **Niente backplate** dietro il medaglione — Director: «lasciamolo norma» (opzioni mostrate su sfondo reale in `board-dietro.png`/`sea-*.png`, scartate).
- Asset finali: `dial-frame.webp` sha `c212407e…`, `bar-slim.webp` sha `2e48e8df…`; originali in `.mw/runs/20261123-lingua-audit/bak/`.
- Witness: `.mw/runs/20261123-lingua-audit/lab-timesole.png` (`/hud-lab`, headless).
- **Fix lab card `time-sole`**: `TimeHost` montava `HudRealTimeConnected` senza `slim` → la card mostrava `bar.webp` (vecchia barra piena) invece del componente battezzato. Ora `slim` + `marginLeft:50` (sbalzo medaglione visibile nella card). Witness reale: `lab-timesole.png`.
- **Sole al 100% della sede** (Director 2026-11-24 «100%, ma nn è centrato»): `sun.webp` orbe ricentrato a sub-pixel (era a -4.5px); `dialSlim.disc 21.45→26.15`, corona tick `r 25.6→31` spostata sull'anello oro (a 100% la ghiera dipinta è coperta). Witness `lab-time-zoom.png`.
- **Margine sx time-sole corretto via dock** (Director 2026-11-24 «giusto spazio da sinistra» + «regressione» sul primo tentativo): `cx` resta -3.5 (posizione Director); `topChrome.bannerMarginPx 40→58` — l'intera coppia banner+medaglione docka più a destra, ~12px di respiro per la pinna a ore 9 senza toccare la composizione.
