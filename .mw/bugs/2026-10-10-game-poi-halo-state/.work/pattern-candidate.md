# Pattern candidate — «stato semantico vs progress numerico»

Quando un primitivo visivo ha stati con override impliciti (qui:
`available`/`new` → sigillo pieno), passare `progress={0}` non basta —
il chiamante deve mappare il contratto di dominio sullo **stato
semantico giusto** (`assigned`+0 = vuoto che si scrive; `expiring` =
countdown warn che si cancella). Il view-model (`mapQuestPoiView`) è il
punto unico dove quella mappa vive — così direzione, colore e progress
non possono divergere fra i chiamanti (mappa reale, demo, lab).

Corollario già visto in R-120: le rappresentazioni derivate (ombra ←
nuvola; countdown ← finestra offerta) devono condividere il lifecycle
dell'owner, non avere una simulazione parallela.
