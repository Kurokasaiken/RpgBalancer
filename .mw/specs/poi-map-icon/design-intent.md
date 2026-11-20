# Design Intent — Icona mappa «Punto d'interesse» (ottone su ottone)

## Why

PLAN-125 (rev. 3, battezzato 2026-11-17) riporta i mockup POI nel plan:
**solo mockup**, implementazione fuori finché non c'è il golden. Il Director
non ama i POI attuali (R-357). Questo mockup esplora il marker generico di
«Punto d'interesse» sulla mappa — non un'icona-quest, non il Luogo dipinto —
la piccola insegna che dice «qui c'è qualcosa».

## Brief del Director (2026-11-20)

- **Ottone su ottone** — tutto metallo, tono su tono; niente smalti colorati
  come unico segno (le direzioni zanara smeraldo/navy restano archiviate).
- **Silhouette che si legge a 16–20 px** — la forma porta il segno, il dettaglio
  è inciso e rado.
- **Dialogo con gli ornamenti** — la grammatica battezzata delle cornici
  (R-357, g4): oro champagne inciso, angoli ad acanto, gemma a griffe,
  fermaglio al centro del bordo. Il marker deve sembrare della stessa bottega
  orafo, non un altro oggetto.
- **Prova a zoom alto su mappa scura + chiara** — leggibilità a taglia piccola
  su crop reali mappa2, non solo sul master.

## Insegna al plan futuro (fuori da questo mockup)

La decisione rimandata a un thread futuro: mappe POI in `map-config` e
**icone SVG oro+nero vs sprite dipinto**. Questo mockup è il bersaglio visivo
di quella decisione — dice *come deve apparire*, non *come sarà costruito*.

## Vincoli ereditati

- Blu ammesso su ghiera e POI (ruling 2026-10-28) — ma il brief è ottone su
  ottone: eventuale accento solo in una micro-gemma a griffe.
- Niente viola, niente marrone/grigio/mud, niente grim.
- Consegna a grandezza reale, un file per opzione + card di confronto.
- Solo headless (ruling 16): generazione via API Gemini, niente browser.
