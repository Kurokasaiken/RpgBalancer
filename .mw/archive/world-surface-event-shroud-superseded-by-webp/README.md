# PNG sorgenti, superseded 2026-09-16 dal re-encode .webp

Codice (`WorldSurfaceRenderer.tsx`) ora richiede `_ottanio.webp` / `_pergamena.webp`.
Questi PNG non sono referenziati da nessun percorso vivo, ma sono la sorgente da cui
i webp sono stati ri-codificati (cwebp -q 90) — tenuti qui, non cancellati, in caso
serva ri-codificare a una qualita' diversa. Non erano comunque tracciati da git
(vedi .gitignore: `event_shroud_*.png`).
