# Pattern candidate — finestre in giorni su clock compresso

**Pattern:** config espressi in "giorni" (`availableUntilDay`, finestre,
durate) sono ingannevoli quando `dayLengthInTimeUnits` è compresso
(5 tick = 1 giorno = 5 s reali). Una finestra di "60 giorni" dura ~5 minuti
reali — qualunque save più vecchio mostra il contenuto scaduto, e i marker
`expired` renderizzano invisibili, quindi il difetto si manifesta come
"il contenuto non esiste", non come "è scaduto".

**Regola proposta:** quando si authored una finestra/durata in giorni su
/game, tradurla sempre in tick e in tempo reale (`days × dayLength ×
secondsPerTimeUnit`) prima di chiamarla "generosa". Per contenuto slice che
non deve scadere, usare una costante named (es. `SLICE_OFFER_WINDOW_DAYS`)
con commento — non un numero magico.

**Corollario di diagnosi:** un gate del tipo `state === 'expired'` combinato
con un render `opacity: 0` produce bug invisibili: verificare sempre prima lo
stato offerta/clock (`__idleVillageTestHooks.getClock()`) quando "un marker
non appare".
