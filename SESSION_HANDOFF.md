# Session handoff

**Current state** — `PLAN-008-resolution-chain` battezzato (desiderata v13 FROZEN + rev.2 + rev.3).
La geometria dello skill check è a posto e verificata; la **risoluzione** no: oggi l'esito si legge
dalla posizione finale della pallina invece di deciderla prima.

**Next step** — `T-001`: `src/ui/skillCheckWebV1/zones.ts`, la partizione disgiunta. Non dipende
da nulla. Il difetto che risolve è topologico: la fascia ferita (23,3px) contiene quella critica
ed è testata prima, quindi `epicfail` è oggi **inarrivabile per posizione**.

**Decisions made**
- La catena esiste già in V3/V5 (`simulateThrow`, `classify`, `fracture.ts`): si **riscrive** in
  `src/ui/skillCheckWebV1/`, e V3/V5 restano con le loro copie fino alla cancellazione.
- Conservazione della misura richiesta alla **partizione degli esiti**, non alle zone del
  terremoto (P(ferita/morte) viene dal secondo dado, non dall'area della crepa).
- Vincolo di **intersezione** fra esito e zona del rischio, non di evitamento.
- `tst` = area misurata; `ALMOST_W` = frazione d'area; fallback = rilassamento alla V3.

**Do not touch**
- `rCheckAt` (muro fisico: tutte le probabilità), `rOf()`/`geo.rCore` (offset della scala),
  `VALLEY_F = 0.3675` (calibrazione della parità al 50%).
- Lo stream RNG della frattura è salato e separato: una `rng()` in più prima di `riskRoll` cambia
  tutti gli esiti a parità di seed.

**Open questions**
- Nessuna bloccante. Da misurare in T-003: quante coppie esito×rischio richiedono riparazione e
  quante arrivano al rilassamento.
