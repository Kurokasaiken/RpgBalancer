# assets-source — arte sorgente, fuori dal bundle

Questa cartella **non è servita** al client. Sta fuori da `public/` di proposito: quello che c'è qui non deve finire nel bundle utente.

Spostata qui il 2026-08-11, quando si è scoperto che `public/assets/world/wanderlust/base/` pesava 79 MB, di cui 51 MB mai letti a runtime ma tutti spedibili.

## Cosa c'è

| Cartella | Peso | Cos'è |
|---|---|---|
| `world/wanderlust/base/source/exports/hd-photo-map-finale/` | 23 MB | **Export HD originali** dei layer della mappa. Arte sorgente: tracciata in git, da non perdere. |
| `world/wanderlust/base/layers.backup-predilation/` | 28 MB | Snapshot dei layer *prima* della dilatazione alpha (il fix delle cuciture). Rete di sicurezza, non tracciata in git. |
| `world/wanderlust/base/manifest.json.bak` | 4 KB | Manifest precedente. |

## Cosa resta in public/

Solo `layers/` (28 MB, i 21 PNG effettivamente caricati) e `manifest.json`.

## Nota per gli script asset

`scripts/psd-extract-fullcanvas.mjs` e `scripts/dilate-silhouettes.mjs` leggono da `public/assets/world/wanderlust/base/layers/` e **non** toccano questa cartella. Lo spostamento non ha rotto la pipeline.
