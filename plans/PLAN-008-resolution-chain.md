---
title: Catena di risoluzione esito-prima per lo skill check (V7 → skillCheckWebV1)
status: active
created: 2026-08-21
authorized_by: Fausto
reason: avallo esplicito "battezza" in sessione, dopo protocollo multi-AI (chatgpt web + claude web) e nove critiche recepite
desiderata: v13 FROZEN + rev.2 + rev.3
---

# Goal

Lo skill check decide l'esito con **due D100 tirati prima di disegnare**, scegli un punto
d'atterraggio che soddisfa la **coppia** (esito ∩ zona del rischio), garantisce che quel punto
esista, e la pallina **ci si ferma**. `spatialVerdict` scende al rango di asserzione.

Oggi è l'opposto: `cfg.mode='random'` per default, quindi nessun bersaglio e nessun magnetismo —
la pallina rimbalza e `spatialVerdict` **legge** dove è finita. E quando un esito è forzato,
`resolve()` sovrascrive il verdetto a prescindere da dove la pallina si è fermata.

## Spec

*Immutabile dopo il battesimo.*

### Reuse-first — cosa NON si scrive da zero

La catena esiste già nella V3/V5 come moduli puri e deterministici:
`simulation.ts::simulateThrow` (rollOutcome → pickLandingPoint → synthesizeTrajectory),
`zones.ts::classify` (partizione), `zones.ts::zoneAreas`, `fracture.ts` (i due terremoti, con
l'antitesi «la ferita si chiude, la morte resta aperta» e la regola d'esclusione).
**La V7 non è avanti: è una regressione.** Il lavoro è portare la geometria V7 sul contratto
V3/V5.

**Decisione del Director:** le V* verranno eliminate, quindi il codice si **riscrive nel
superstite** — `src/ui/skillCheckWebV1/` (esiste già, la V7 la importa già, porta il nome dato
dal Director a tutta la cosa). Nuovi file: `zones.ts`, `resolution.ts`, `fracture.ts`.
**V3 e V5 restano con le loro copie** fino alla cancellazione: non si fanno importare dal modulo
nuovo, perché parametrizzarlo per servirle è lavoro destinato al cestino (unità normalizzate,
`blob` 0.09 vs 0.035, `tst` da formula invece che misurato).

### Invariante di direzione

> La **geometria** è primaria. Le **aree** si misurano dalla geometria. Le **bande del D100** si
> leggono dalle aree. Nessuna freccia va all'indietro: nessun task può modificare raggi o
> spessori per far tornare una banda.

### Quale misura va conservata (correzione dal protocollo multi-AI)

La conservazione della misura si richiede alla **partizione degli esiti**, le cui aree *sono* le
bande. **Non** alle zone del terremoto: `P(ferita)` e `P(morte)` vengono dal secondo dado
(`dead = riskRoll <= deathPct`), non dall'area della crepa, quindi la forma della frattura non
porta probabilità e può cambiare liberamente. L'enunciato precedente («il cambio seed conserva la
misura») era falso come formulato: la rotazione è rigida, il cambio seed no.

### Contratto della catena

```
rollOutcome(rng)            -> { roll, riskRoll, outcome, risk }   [i due D100, insieme]
requiredSet(outcome, risk)  -> { region, zone }                    [INTERSEZIONE, non evitamento]
pickLanding(required, rng)  -> { point, repairs, relaxed }
synthesizeTrajectory(point) -> { path, endpoint }                  [endpoint === point, eps 0.5px]
regionAt(endpoint) === outcome.region                              [ASSERZIONE, non fonte]
```

Il vincolo è di **intersezione**, non di evitamento: se l'esito è `almost + ferita` deve
**esistere** un punto dove il terremoto della ferita tocca l'almost.

### Contratto d'uscita di `pickLanding`

- «intersezione» = **area positiva** sulla griglia polare; contatto di bordo o punto singolo non
  contano;
- campionamento a rifiuto con tetto di **12.000 tentativi**, poi stadio successivo;
- **stadio 1** — riparazione rigida: rotazione della fase del terremoto a passi di 10° (36
  tentativi). Le aree della **partizione degli esiti** devono risultare identiche;
- **stadio 2** — rilassamento alla V3: si rilasciano i vincoli secondari mantenendo vera **solo**
  la verità primaria successo/fallimento («mai mentire sull'esito del check»), e si **logga** con
  la coppia che l'ha causato;
- il ciclo **esce sempre**; il campo `relaxed` risale fino al risolutore. Un rilassamento
  silenzioso sarebbe una bugia mascherata da fallback.

### Griglia polare (parametro dichiarato, era nascosto)

720 angoli × 240 raggi. Test di convergenza: raddoppiando la risoluzione le aree restano entro
**0,02 punti**.

### Due tolleranze distinte

- **taratura** di una banda verso il valore di config: 0,05 punti percentuali;
- **conservazione** della stessa quantità prima/dopo una trasformazione: uguaglianza esatta
  (stesso codice, stessa griglia).

### Vincoli riagganciati — non ridiscutibili in questo piano

- punte della stella esattamente a `rOf(stat)` — errore misurato `0.0e+0`;
- parità ⇒ 50,00% dell'area (`VALLEY_F = 0.3675`), scale-invariante;
- `rCheckAt` è il muro fisico: **non si tocca**;
- `geo.rCore` sta dentro `rOf()`: è l'offset della scala, non la regione di trionfo;
- fallimento critico = `cfg.crit`% dell'arena, con **priorità sulla stella**;
  successo critico = `cfg.critWin`% di (stella ∩ arena). Entrambi variabili da config;
- `almost` **non** è garantito: può collassare a zero, ed è ammissibile;
- tiro unico;
- lo stream RNG della frattura resta **salato e separato** da quello di roll/riskRoll/landing:
  una sola `rng()` in più prima di `riskRoll` cambierebbe tutti gli esiti a parità di seed.

## Tasks

- [ ] **T-001** — `skillCheckWebV1/zones.ts`: partizione disgiunta con priorità risolta **in
      geometria** (soglie radiali ordinate per angolo), **ridefinizione del contenimento** fra
      fascia ferita e fascia critica, e `ALMOST_W` da pixel fissi a **frazione d'area** (può
      collassare a zero).
      *Criterio:* ogni punto in una sola regione; `critFail == cfg.crit` e
      `critWin == cfg.critWin` entro 0,05 pt; **`epicfail` raggiungibile** su tutta la griglia di
      configurazioni; test di convergenza della griglia entro 0,02 pt.
      *Perché prima:* oggi la fascia ferita (23,3px) **contiene** quella critica ed è testata
      prima, quindi `epicfail` è inarrivabile — difetto topologico, non di classificazione.
- [ ] **T-002** — bande del D100 lette dalle aree misurate, direzione unica.
      *Criterio:* somma 100,00; nessuna scrittura verso la geometria (test statico sugli import);
      una banda `almost` a zero è un risultato legittimo. `depends: T-001`
- [ ] **T-007a** — geometria delle zone del terremoto (fenditura/spacco) portata dalla V5.
      *Criterio:* `zone(rischio)` interrogabile fuori dal browser.
      *Perché qui:* T-003 ha bisogno di questa geometria per calcolare l'intersezione — nell'ordine
      precedente era una circolarità. `depends: T-001`
- [ ] **T-003** — `requiredSet` + `pickLanding` col contratto d'uscita completo.
      *Criterio:* matrice 5 esiti × 3 rischi su ≥6 configurazioni, col conteggio di `repairs` e
      `relaxed`. `depends: T-002, T-007a`
- [ ] **T-004** — riparazione per rotazione di fase.
      *Criterio:* aree della partizione degli esiti identiche pre/post (uguaglianza esatta);
      atterraggio trovato o `relaxed=true` esplicito. `depends: T-003`
- [ ] **T-005** — traiettoria sintetizzata che **termina** sul punto.
      *Criterio:* `|endpoint − point| < 0.5px`, velocità finale 0, ultimo segmento dentro il
      board, nessun drift post-collisione, **e** `regionAt(endpoint) === outcome.region`.
      *Nota:* T-005 non può correggere il punto — lo farebbe diventare una seconda risoluzione
      dell'esito. `depends: T-003`
- [ ] **T-006** — via la sovrascrittura forzata del verdetto in `resolve()`, poi `spatialVerdict`
      come asserzione dura (in dev lancia, in produzione logga forte).
      *Criterio:* N istanze per **ciascuna** delle 15 coppie esito×rischio su M configurazioni,
      con distribuzione forzata, zero violazioni. L'oracolo usa `regionAt` (geometria) mentre
      `pickLanding` usa la griglia: due percorsi distinti. `depends: T-005`
- [ ] **T-007b** — i due terremoti in scena: fenditura che si chiude (ferita), spacco che resta
      aperto (morte), con la regola d'esclusione della V5 — esclusione 0 quando l'epicentro **è**
      il punto d'atterraggio, perché lì il terreno ha ceduto davvero.
      *Criterio:* l'epicentro sta nell'intersezione quando l'esito lo richiede; con `relaxed=true`
      la frattura **non** rivendica il punto come epicentro. `depends: T-006`

## Notes

Protocollo multi-AI eseguito via web (chatgpt + claude) su rev.1 e rev.2:
`.mw/runs/20260821-153321-web/` e `.mw/runs/20260821-154348-web2/`. Nove critiche sostanziali
recepite nella Spec sopra; la più grave era l'affermazione non dimostrata sul cambio seed.
