# Bug — /game: l'isola va sotto l'HUD in basso

**Data:** 2026-10-10
**Segnalato da:** Director (verbatim)

> "sempr ein quella pagina: nn avevamo ingrandito il mare in modo tale che la
> paerte dell'HUD in basso nn coprisse l'isola? xè la vedo di nuovo coperta?"

## Sintomo

Su viewport larghi e relativamente bassi la costa sud dell'isola (vulcani)
scivola sotto il plinto di navigazione (VILLAGE/MAP/WORKSHOP/TAVERN); le
vette nord finiscono sotto la placca del giorno. Riprodotto via Puppeteer a
1600×760 (`r121-1600x760`): ~45px di terra sotto il nav, ~45px sotto la
placca. A 1400×900 il framing è corretto (`r121-before`).

## Causa

`PixiWorldMap.refit()`:

```ts
cam.zoom = Math.max(floorZoom(), Math.min(freeW/landW, freeH/landH));
cam.panY = landCy - (insets.top + freeH/2) / cam.zoom; // centrato
```

- `floorZoom() = max(W/(canvas.w+2·seaMarginPx), H/(canvas.h+2·seaMarginYPx))`
  garantisce che canvas+mare specchiato copra TUTTO lo schermo (anche sotto
  le HUD).
- Il fit vuole invece la terra dentro l'area libera (`insets.bottom` = nav
  plinth 77px + 23px di respiro — commento config: «islands sit just above
  the nav»).

Quando `floorZoom > fitZoom` (schermo largo/basso: la W-term del floor
domina — a 1600×760: floor 0.284 vs fitH 0.245) la terra è alta 664px su
573px liberi → centratura verticale = ~45px sotto ciascun chrome.

L'allargamento del mare (commit 8254e8e1: margin 260/300 → 700/400) ha
abbassato floorZoom spostando la soglia — non ha risolto il conflitto
strutturale: esiste sempre una finestra che rompe.

## Comportamento atteso

Quando non c'è spazio per centrare, l'isola **poggia sopra il nav** (land
bottom = H - insets.bottom), non ci scivola sotto. Il difetto in eccesso va
a monte (vette sotto la placca / fuori schermo), non a valle.

## Fix

In `refit()`: `landH > freeH` → `panY = land.y1 - (H - insets.bottom)/zoom`
(pin del bordo sud sul confine dell'area libera) altrimenti centratura
attuale — zero cambiamenti quando la terra ci sta.

Pan bound già sufficiente: pin ≤ bound ⟺ seaMarginYPx ≥ 100/zoom − 186,
vero per ogni zoom realistico (max 166 @ floor 0.28 ≪ 400).
