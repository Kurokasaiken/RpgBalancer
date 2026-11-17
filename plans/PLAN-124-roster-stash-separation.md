# PLAN-124 — Ruling: roster e stash su /game sempre superfici separate

**Stato:** eseguito (revert applicato e verificato dal vivo, 2026-11-15) —
registro di un ruling Director, non una proposta.

**Parent:** R-347 (`RICHIESTE.md`, verbatim Director 2026-11-15: *"qualche AI
ha mischiato roster e stash su /game, riportalo cm era prima. e senga nei plan
e documentazione che devono essere sempre divisi e separati"*).

**Documentation Impact:** REQUIRED — `PLAN-119` (banner REVERTED sul ledger T5,
wording T3/AC4 e misura AC2), `COMPONENT_MASTER_INDEX.md` (riga
`roster-stash-rail` → REMOVED), `.mw/contracts/components/hud-real-cassetto.md`
(INV-3 ripristinata), `RICHIESTE.md` R-347, commenti
`useGameLayoutInsets`/`useExpeditionDrawer`/`GameTopChrome`/
`HudRealCassettoDetail`. Tutti aggiornati nella stessa passata.

## Ruling (invariante registrata)

Su `/game` roster e stash restano **sempre divisi e separati**: il roster è il
pannello flottante `panels.roster` (`MatericRosterComponentV2`), lo stash è il
magazzino `panels.villageStash` (`VillageStashPanel`). Nessuna colonna, tab o
superficie unificata — la `RosterStashRail` di PLAN-119 T5 (tab segmentati
Roster|Stash in una colonna docked unica) è il pattern vietato. Una fusione
futura richiede un ruling Director esplicito che revoca questa invariante.

## Scope del revert (eseguito)

- `src/pages/game-mappa2.tsx` — mount `RosterStashRail` + wiring rimossi
  (import, `useExpeditionRail`, mutex ≤1100px, `railStashOpen`/
  `stashSurfaceOpen`, `residents`, guard `source==='roster-rail'`);
  `onOpenRoster` → `panels.set('roster', true)`;
  `usePanelWhileOpen(panels,'roster', anyExpeditionDetailOpen)` incondizionato
  (contratto R-184 — i workaround R-340bis/R-346 diventano obsoleti).
- Cancellati: `RosterStashRail.tsx`, `useExpeditionRail.ts`,
  `r339RosterStashRail.test.tsx`, `.mw/contracts/components/roster-stash-rail.md`,
  `scripts/_tmp-r339-rail-witness.mjs`.
- `cassettoLayoutConfig`: blocco `rail.*` (schema + RAW) rimosso; i18n
  `gameFrame.rail.*` rimosso EN/IT + `i18n.types.ts` rigenerato;
  coverage-exception `useExpeditionRail` ritirata; sync-amend-override +
  8 `redfirst:retire` apposti per gli INV toccati dagli helper di
  import-closure.
- `useGameLayoutInsets` tenuto (ledger condiviso drawer→right, chrome→top;
  `left` non posseduto).

## Evidenza (T-04, probe headless `/game?poiDemo=1`)

- 0 elementi `roster-stash-rail`/`rail-*-chip` nel DOM, 0 errori pagina;
- `v` → `VillageStashPanel` flottante si apre (6 item);
- `openDetail('poi-goblin')` → il roster flottante auto-apre accanto al
  cassetto (R-184 ripristinato), rail ancora assente;
- screenshot `test-results/hud-real/r347-{no-rail,stash-panel,roster-panel-cassetto}.png`;
- probe `scripts/hud-real/_tmp-probe-r347-separation.mjs`.

## Visual fork

`visual-fork: skipped — revert a baseline approvata su ruling Director (nessuna nuova superficie né alternative da confrontare: lo stato ripristinato è quello certificato pre-PLAN-119 T5) — puntatore: RICHIESTE.md R-347 (verbatim ruling)`

Copertura file store/logica toccati dal diff:
`src/ui/idleVillage/store/useExpeditionRail.ts` (eliminato),
`src/ui/idleVillage/store/useExpeditionDrawer.ts` (solo commenti),
`src/ui/idleVillage/store/useGameLayoutInsets.ts` (solo commenti ledger).
