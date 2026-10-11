# Bug — /game: mappa troppo grande, HUD su terra, linee tra mare vecchio e nuovo

**Data:** 2026-10-11
**Segnalato da:** Director (verbatim)
**Ricorrenza di:** trappola T-01 (`context/recurring-traps.md`), terzo episodio
dopo `8254e8e1` (margini allargati) e `.mw/bugs/2026-10-10-game-island-under-hud/`.

> "+ volte nella pagina /game la mappa continua a diventare troppo grande e
> l'HUD copre una parte di terrra, e nn dovrebbe. Poi aumenta il mare e
> appaiono delle linee tra il mare 'vecchio' e quello nuovo."

## Sintomi

1. **Mappa troppo grande / terra sotto l'HUD** — su alcune finestre la terra
   sfugge all'area libera e finisce sotto il chrome fisso (placca in alto /
   nav plinto in basso). Ricorrente: il fix R-121 pinna il bordo sud ma
   l'eccesso va comunque a nord, sotto la placca — la terra resta coperta.
2. **Linee al confine del mare** — dove il canvas dipinto finisce e inizia il
   mare generato proceduralmente (deep sea + sea pattern shader) appaiono
   cuciture: step di intensità delle linee del pattern e/o del velo del deep
   sea, perché dentro il canvas l'intensità è modulata da `sea_mask` mentre
   fuori è forzata a 1.0 (discontinuità netta sul bordo).

## Causa probabile (da verificare al browser)

`PixiWorldMap.refit()`:
- `floorZoom() = max(W/(canvas.w+2·seaMarginPx), H/(canvas.h+2·seaMarginYPx))`
  è un vincolo duro: quando supera il fit dell'area libera la terra non può
  rimpicciolire abbastanza → HUD su terra, sempre, qualunque sia la
  configurazione dei margini (T-01: allargare il mare sposta la soglia, non
  risolve).
- L'overflow orizzontale (pannelli laterali aperti su finestra stretta) non ha
  il pin analogo al sud: la terra sborda sotto roster E ledger.
- `onResize = userMoved ? apply() : refit()`: `apply()` clampa lo zoom verso
  l'alto ma non lo riabbassa → lo zoom può solo crescere dopo ogni
  restringimento della finestra ("continua a diventare troppo grande").
  `userMoved` resta true per sempre dopo la prima interazione (anche il glide
  programmatico su click territorio lo setta) → il refit non gira più.

## Comportamento atteso

- Il chrome **fisso** (placca top, nav bottom) non copre MAI terra: a qualsiasi
  viewport la terra sta dentro l'area libera (fit) o l'eccesso finisce fuori
  schermo, non sotto la HUD — se serve, lo zoom può scendere sotto il vecchio
  floor perché il mare è disegnato in modo continuo oltre il canvas.
- Nessuna linea/discontinuità visibile dove il mare dipinto incontra il mare
  generato: stesso colore e stessa intensità di pattern al confine.

## Verifica

Puppeteer su `/game?capture=1`: misura di `__worldCam` + posizione schermo dei
bordi terra vs rect delle placche HUD; screenshot a viewport larghi/bassi
(es. 1920×760, 2560×900) e stretti con pannelli aperti; zoom-out via wheel per
ispezionare il confine mare.
