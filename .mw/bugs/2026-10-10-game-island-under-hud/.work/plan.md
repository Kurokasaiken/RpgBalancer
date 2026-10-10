# Plan — pin del bordo sud quando floorZoom vince

Un solo file: `src/ui/idleVillage/pixiSpike/PixiWorldMap.tsx`, funzione `refit()`.

```ts
const landH = (land.y1 - land.y0) * cam.zoom;
cam.panY = landH > freeH
  ? land.y1 - (H - fit.insets.bottom) / cam.zoom      // island sits just above the nav
  : (land.y0 + land.y1) / 2 - (fit.insets.top + freeH / 2) / cam.zoom;
```

Verifica: Puppeteer 1600×760 (costa sud sopra il nav) + 1400×900
(nessuna regressione). Safeguard come da mandate.
