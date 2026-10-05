# Bug: binario dell'halo visibile nel clock

## Descrizione
Nel compact `TimeEngineStrip` (clock day/night) si vede una specie di "binario" dell'halo: un anello/track sottile che non dovrebbe essere visibile.

## Contesto
- Componente: `DayNightTimeEngineStrip` → `TimeEngineStrip` (compact) → `DayNightPoiSkin` (phase icon).
- La pagina `/poi-quest-detail-roster-time-clock` usa `DayNightTimeEngineStrip`.
- Il "binario" è probabilmente il track circolare sottile sotto al progresso.

## Possibili cause
1. `DayNightPoiSkin` disegna `Layer 2: outer guide` (opacità 0.16) e `Layer 3: progress halo track` (opacità 0.14) anche a progress 0.
2. `TimeEngineStrip` compact `conic-gradient` background mostra il `bg-black/40` sottostante come binario.
3. `GenericPoiSkin` corona disegna un track che spunta fuori.

## Comportamento atteso
Nessun anello/track visibile quando il clock è vuoto o all'inizio; solo il corpo centrale e l'eventuale icona.

## Comportamento effettivo
Si vede un binario/fascia circolare attorno al clock.
