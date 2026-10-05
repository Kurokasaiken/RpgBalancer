# Pattern candidate — Invariante sovradeterminato

## Contesto
V6 doveva soddisfare due invarianti sulla stessa forma:
1. la punta della stella cade sulla stat del PG
2. l'area della stella / area arena == probabilita

Con un solo parametro libero (la scala della silhouette) il sistema e
sovradeterminato. Il solve ha consumato la scala, quindi (1) e diventato
impossibile da rispettare: la punta finiva al 34..98% del bersaglio.

## Sintomo diagnostico
Un `Math.min(valore_risolto, vincolo)` messo DOPO un solve non impone il
vincolo: puo solo tirare verso dentro. Se il vincolo va rispettato con
uguaglianza, va messo come INPUT del solve, non come clamp dell'output.
Peggio: quando il clamp morde, rompe silenziosamente l'invariante che il solve
stava garantendo — si passa da un invariante rotto a due.

## Regola
Prima di aggiungere un solve, contare vincoli e gradi di liberta. Se
vincoli > gradi di liberta, il solve non e la soluzione: uno dei vincoli deve
diventare una conseguenza derivata, non un bersaglio imposto.

Nel caso specifico la scelta giusta era eliminare il solve e derivare la
probabilita dalla geometria — che era anche il modello che il Director aveva
gia descritto.

## Ricorrenze
1a occorrenza. Se si ripresenta, candidarlo a PROPOSALS.md.
