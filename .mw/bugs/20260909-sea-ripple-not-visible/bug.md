# Bug: Sea ripple/waves non visibile in `/world-surface`

## Descrizione
Il Director non vede alcun effetto sulle coste/isole quando attiva il pulsante **Water** in `/world-surface`.

## Passi per riprodurre
1. Aprire `http://localhost:5173/world-surface`
2. Cliccare il pulsante **Water** in alto a destra
3. Osservare il mare/coste: nessun movimento visibile

## Comportamento atteso
Quando Water è ON, deve comparire un effetto costiero evidente (onde, ripple, drift).

## Comportamento attuale
Nessun effetto visibile. Tutto immobile.

## File coinvolti
- `src/ui/idleVillage/pages/WorldSurfaceTestPage.tsx` (pulsante Water → `showSeaRipple`)
- `src/ui/idleVillage/components/WorldSurfaceRenderer.tsx` (monta `WorldSurfaceWaves` e `WorldSurfaceSeaRipple`)
- `src/ui/idleVillage/components/WorldSurfaceWaves.tsx` (CSS wave marks)
- `src/ui/idleVillage/components/WorldSurfaceSeaRipple.tsx` (sea copy overlay)
- `src/ui/idleVillage/config/atmosphereAssets.ts` (`waves`, `seaRipple`)

## Note
- `WorldSurfaceSeaRipple` è stato modificato più volte: prima `filter: url()` su `<img>`, poi `<div>` con `background-image`, poi `transform: translate` grande.
- `WorldSurfaceWaves` ha `enabled={showSeaRipple}` e `bobWorldPx` aumentato a 20.
- Puppeteer ha mostrato che `.ws-wave` esiste (7 elementi) quando Water è attivo, ma `opacity` era 0.
- `.ws-sea-ripple-smil` esiste nel DOM ma non produce movimento visibile.
