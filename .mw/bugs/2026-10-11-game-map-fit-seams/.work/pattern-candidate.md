# Pattern candidate — coverage floor vs content fit: rendere il floor irrilevante, non più forte

## Segnale

Una camera con DUE vincoli: "lo sfondo copra tutto lo schermo" (coverage
floor) e "il contenuto protetto entri nell'area libera" (content fit). Se il
floor è usato come `max(floor, fit)` sullo zoom di apertura, il floor vince
quando il viewport non può contenere entrambi i requisiti — e il contenuto
protetto finisce sotto il chrome. Sintomo: `zoom === floorZoom` mentre il
rettangolo del contenuto interseca la HUD.

Seconda segnale collegata: quando il pan si appoggia esattamente ai suoi
bound (clamp `±margin`), il bordo del quad renderizzato coincide con il bordo
schermo → sliver dello `stageColor` (colore diverso dal mare) = "cucitura"
visibile che non è nella texture ma nel compositing.

## Fix riusabile

Non si può vincere il conflitto bound-less alzando i margini di poco (sposta
solo la soglia). Due mosse strutturali:

1. **Rendi il floor più debole del fit su tutta la matrice di viewport.**
   Se lo sfondo generato è "economico" oltre una certa distanza (qui: nebbia
   piatta oltre ~1700px), estendi i margini logici finché
   `floorZoom(viewport) < fitZoom(viewport)` per ogni viewport target.
2. **Disaccoppia l'estensione renderizzata dai bound di pan.**
   I quad sfondo devono coprire `bound + pad` oltre il clamp: il bordo quad
   non deve mai poter apparire su schermo. Regola: *render extent > pan
   extent*, sempre.

Clausole accessorie trovate in questo caso:

- `minZoom` da config/manifest vincola solo lo **zoom utente** (wheel/pinch),
  mai il fit automatico — il fit deve poter scendere sotto il min a finestre
  piccole, altrimenti ritorna la stessa trappola con un altro nome.
- Oggetti decorativi sparsi nei margini (seabed) vanno cappati con un raggio
  proprio — estendere i margini di copertura non deve stirarli.
- Un "recenter/reset" deve riportare anche i flag di stato utente
  (`userMoved`), altrimenti il resize successivo usa la regola sbagliata.

## Cosa NON fare

- NON alzare i margini come unica risposta: sposta la soglia, non risolve.
- NON riusare i bound logici come bound di render (uguale a zero pad).
- NON applicare `minZoom` al fit: è un vincolo di comfort utente, non di
  contenuto.

## Test consigliato

Probe meccanico su matrice di viewport (qui `scripts/probe-game-map-fit.cjs`):
legge `window.__worldCam`, proietta il land bounds in screen-space e misura
le intersezioni con i rettangoli HUD fissi. Assert: `floorBound === false` e
intersezioni chrome = 0 su ogni viewport; profilo RGB per colonna continuo
alla riga dipinto↔generato.

## Caso d'uso

`.mw/bugs/2026-10-11-game-map-fit-seams/` — R-148. Estende il pattern
`constraint-conflict-edge-pinning` (2026-10-10, island-under-hud): là il fix
era pin del bordo nel fit; qui il floor stesso andava reso non-critico.
