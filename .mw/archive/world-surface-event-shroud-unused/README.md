# Archiviati 2026-09-16 — non usati da alcun percorso di codice vivo

`event_shroud_left/right.png` (senza suffisso) erano referenziati solo da
`WorldSurfaceEventShroud.tsx`, componente mai importato da nessuno (verificato
con grep). `event_shroud_left/right_teal.png` non hanno alcun riferimento:
`eventShroudGradeConfig.skyVariant` accetta solo `'pergamena' | 'ottanio'`.

Spostati qui (non cancellati) per toglierli dalla cartella servita
(`public/`) senza perdere l'arte. Le varianti vive sono `_ottanio` e
`_pergamena`, ora in `.webp` — vedi `.mw/runs/2026-09-15-world-surface-perf/`.
