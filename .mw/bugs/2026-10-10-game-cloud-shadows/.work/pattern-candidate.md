# Pattern candidate — derivati visuali accoppiati al proprietario

## Segnale

Un elemento visuale "derivato" (ombra, glow, trail, highlight) viene
animato da un sistema separato rispetto al suo proprietario — loop
deterministici diversi, pool diversi, lifecycle diversi. Risultato: i due
si disallineano; il derivato orfano è percepito come bug anche quando è
"corretto" (nel nostro caso le ombre c'erano sulla terraferma, ma senza la
nuvola non si leggevano come ombre).

## Fix riusabile

Il derivato nasce dentro la factory del proprietario (`birthCloud` crea
nuvola+ombra), condivide `t0`/posizione/phase/envelope, e muore nello
stesso splice/destroy. Il blocco del derivato diventa solo
infrastruttura (layer + cache texture). Regole:

- stesso owner object nel loop (`{ sp, sh, ... }`), un solo progress `p`;
- offset/alpha del derivato applicati come delta sulle proprietà
  dell'owner, mai simulazione propria;
- decidere esplicitamente quali envelope si propagano (`formed` sì,
  `shown`/POI-clear no nel nostro caso — documentare il perché);
- toggle del derivato = layer vuoto, mai simulazione autonoma.

## Test consigliato

Frame-pairing: a due tempi distanti, per ogni derivato visibile esiste
l'owner a posizione-attesa-meno-offset; destroy dell'owner ⇒ derivato
assente. In Pixi: ispezionare i figli del container condiviso.

## Caso d'uso

`.mw/bugs/2026-10-10-game-cloud-shadows/` — PixiWorldMap cloud↔shadow.
