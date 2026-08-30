# Session handoff

**Current state:** `PLAN-010-astrolabe-v63` battezzato (2026-08-30). Task list pronta, nessun
task iniziato. Desiderata di riferimento: **v16 FROZEN**.

**Next step:** `CP-A` — fork della rotta `destinyAstrolabeV63/` + harness minimo di misura.
Nessuna dipendenza, è il primo task.

## Decisions made

- **Il contratto di copertura vince sulla forma** (Director, 2026-08-30: «fiore pieno va bene,
  vince il contratto»). Sopra la parità la forma è quella che serve a produrre `50+delta`.
- **Il morph di V16 si riusa, non si riscrive.** `buildHeroShape` / `rHeroNarrowAt` /
  `starMix` / `valleyDepthFor` restano; si sostituisce solo il pilota da `punta/muro` a errore
  d'area.
- **La valle del fiore va sbloccata** da 0.3675 fino a ~0.55, o sette casi su sedici sfondano
  in alto. La punta resta tonda, quindi nessuna «stella cicciona».
- Un solo parametro di morph per petalo; la forma della punta lo segue in proporzione.
- Ghiera declassata da task a criterio dentro `CP-H`.

## Do not touch

- `rCheckAt` — è il muro fisico: si muovono tutte le probabilità.
- Punte a `rOf(stat)`.
- Il bottone THROW resta al centro; gli obelischi non restano in scena.
- V6.2 resta intatta e confrontabile fino a `CP-I`.

## Working tree non committato

Modifiche a `destinyAstrolabeV62/engine.ts` fatte in sessione e verificate a misura: marea che
clippa la stella al muro, tentacoli a 7 bracci, `MAX_BLOBS` 36, raggi negativi corretti,
ghiere interne clippate al path. **Da valutare se committare su V6.2 o portare solo su V6.3.**

File di lavoro da rimuovere: `public/__morph.html` (visualizzazione del morph),
`public/__diff.js` (preesistente, non mio).

## Open questions

- Il caso **50/35** (scarto +7.7) è rimandato per decisione del Director.
- Il colore/fondo definitivo: pergamena è la candidata principale, non confermata.
- Se la regola di precedenza («il contratto vince») vada promossa a desiderata **v17**:
  oggi vive solo nella Spec di PLAN-010.
