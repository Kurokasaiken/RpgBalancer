# Bug: pezzo di outer ring bronzeo mancante in alto a sinistra

## Descrizione
Nel componente DestinyAstrolabe V6.3 (`/minimal-destiny-astrolabe-v6-3`) il bordo bronzo esterno presenta un taglio/mancanza visibile nella zona 10-11 ore (in alto a sinistra).

## Stato attuale
- `.astro-bezel` SVG viewBox `-100 -100 1200 1200`
- Anello esterno: `<circle cx="500" cy="500" r="455" ... stroke-width="42.5" ...>`
- `.arena` CSS `inset:9.2%`

## Comportamento atteso
L'outer ring bronzeo è un cerchio chiuso e continuo in tutto il giro.

## Comportamento effettivo
Un tratto del ring in alto a sinistra appare assente o scurito (vedi screenshot).
