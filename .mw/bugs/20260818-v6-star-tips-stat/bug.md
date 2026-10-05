# V6 — le punte della stella non arrivano alla stat del PG

## Sintomo riportato

Con `stat=85 / difficoltà=50` la stella è grande ma i suoi vertici si fermano
prima degli obelischi bianchi. Il Director ha fissato l'invariante:

> Se PG ha 40, sia gli obelischi bianchi che la punta della stella devono
> arrivare alla 4a stanghetta.

## Riproduzione

`/minimal-destiny-astrolabe-v6`, skill singola, stat 85, difficoltà 50.
Misura via `tests/measure.mjs` (replica fedele del modello di `engine.ts`).

## Comportamento effettivo (misurato)

| caso | rOf(stat) | punta stella | punta/stat |
|---|---|---|---|
| 65/50 | 236.2 | 204.1 | **86.4%** |
| 85/50 | 295.5 | 257.3 | **87.1%** |
| 50/50 | 191.7 | 177.6 | **92.6%** |
| 40/60 | 162.1 | 158.8 | **98.0%** |
| 30/80 | 132.4 | 45.4 | **34.3%** |

La punta non arriva MAI alla stat, e di quanto sbaglia varia in modo
imprevedibile (34%..98%).

## Causa radice

Il raggio della punta è un **output** dell'area solve, non un input.

L'area solve cerca per bisezione la scala `k` tale che
`area(stella ∩ arena) == tst% · area(arena)`, poi `geo.starTip = shape·k`.
Il cap aggiunto dopo — `Math.min(shape·k, obeliskTip)` — può solo tirare la
punta **verso dentro**, mai spingerla fuori. Quindi la punta finisce dove la
manda il solve.

Il sistema è **sovradeterminato**: due vincoli (punta = stat, area = tst) e un
solo parametro libero (la scala). Il solve consuma la scala, la punta non è più
pilotabile.

## Secondo difetto trovato durante la misura

Quando il cap *morde*, rompe silenziosamente l'invariante dell'area:

| caso | tst richiesto | area ottenuta |
|---|---|---|
| 5 assi asimmetrici | 90% | **51.7%** |

Quindi allo stato attuale, nel caso asimmetrico, **entrambi** gli invarianti
sono violati contemporaneamente.

## Terzo difetto: `tst` non può descrivere un board multi-skill

`geo.tst = clamp(50 + (sk0.stat - sk0.difficulty), 1, 99)` usa **una sola**
skill (quella del settore in cui atterra la pallina). Con 5 skill diverse la
geometria è una, mentre `tst` cambia a seconda di dove cade la pallina. Il
bersaglio dell'area solve è quindi mal posto per costruzione sui board
multi-skill.

## Comportamento atteso (modello del Director)

- `punta stella[i] = rOf(stat[i])` — sempre, nessun solve
- `bordo goo[i] = rOf(difficoltà[i])` — sempre
- `probabilità = area(sovrapposizione) / area(arena)` — **derivata**, non imposta

La probabilità non è un input del disegno: è ciò che il disegno produce.
