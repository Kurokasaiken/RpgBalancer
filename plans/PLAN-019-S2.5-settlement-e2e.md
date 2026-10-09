---
title: 'PLAN-019-S2.5 — Settlement idempotente, secondo POI, E2E completo e chiusura slice'
status: completed
created: 2026-10-09
revised: 2026-10-09 (r1 figli: claude+chatgpt 2× MAJOR → assorbito. r2: MINOR+MAJOR → assorbito; run `…/s2.5/r2/`. Esecuzione 2026-10-09: T-0→T-7 tutti verdi)
desiderata: v24 (PLAN-019, stadio S2, gate S2-a/b/c), v24 rev.2 (reward = obiettivo && leader vivo)
request: R-107
parent: PLAN-019-S2 (figlio 5/5 — chiude lo slice)
depends: PLAN-019-S2.4 (run lanciabile da POI)

## Stato implementazione (2026-10-09, sessione esecutiva)

- **T-0 fatto — verifica `PersistenceService` (output scritto)**:
  1. *Scrittura singola durevole al return?* **SÌ** — `saveData` risolve solo
     dopo la scrittura reale: `sessionStorage`/`localStorage` sincroni nel
     fallback web/playwright, `writeTextFile` awaited nel path Tauri.
     Caveat: fallimento FS Tauri → fallback silenzioso a localStorage
     (durevole, ma su backend diverso — vedi 3).
  2. *Ordine delle scritture preservato tra chiavi?* **SÌ per scritture
     awaited in sequenza** (chiavi indipendenti = file/item separati;
     `await` serializza). **NO atomicità multi-chiave**: due chiavi scritte
     «insieme» possono essere separate da un crash. Scritture concorrenti
     sulla STESSA chiave: last-write-wins non ordinato.
  3. *Lettura-dopo-scrittura coerente al boot?* **SÌ entro lo stesso
     backend** (nessuna cache: `loadData` legge la chiave dal backend
     risolto). Caveat: asimmetria di fallback Tauri↔localStorage — un save
     caduto in localStorage e un boot successivo con FS sano leggono backend
     diversi → valore stale. Edge reale ma stretto: il journal lo tollera
     perché il replay ri-deriva dal record del run.
  **Verdetto**: l'atomicità multi-chiave non esiste → vale il «caso atteso»
  del piano: **journal per-effetto** — ogni aggregato mutato porta il proprio
  ledger di chiavi `(runId, effectId)` nello stesso record della mutazione;
  il run record congela il piano degli effetti e il marker `settled` è
  l'ultima scrittura. Replay al boot deduplica per chiave e converge.
- **T-1 fatto** — `tests/unit/idleVillage/questS1Lab/questTerminalMatrix.test.ts`
  (8 test): enumerazione esiti reali goblin/rovine; cella «sì|vivo|fuga»
  dichiarata irraggiungibile (`flee` ⇒ `dropObjective` prima di `endRun`).
- **T-2 fatto** — `src/ui/idleVillage/quests/questSettlement.ts`:
  `deriveSettlementPlan` (congela il piano), `applyPlanToState` (ledger
  `appliedQuestEffectIds` co-locato nell'aggregato store, mai
  set-to-expected sui fungibili), `settleRun` (journal:
  `settling`→effetti→`settled`, seam `fault.crashAfter`). Config
  `questSettlement.ts` (`woundRecoveryTicks`). Store: `isDead`/
  `injuredUntilTick` persistiti in `MinimalResident`, recovery sweep nel
  `tick()`, azione `applyQuestSettlement`. `questRun.ts`: `settlement?:`
  marker; `useQuestRun.applySettlement` persiste il marker sul record;
  `clear` rilascia la riserva loadout (`runIdOf`). `questEligibility`:
  `inExpedition` rilascia su `settlement.status==='settled'`. Sessione:
  `settleRun` su run terminato, `anyRunActive` fino a `settled`, hook E2E
  `getSettlement`/`getVillage`. Roster: `mergeStoreConsequences` in
  `useCanonicalRosterData` — le conseguenze dello store si proiettano sul
  residente canonico (morto/ferito come DATO per eleggibilità e carte,
  non solo visual). Riserva: `reserveLoadout` cablato al `send`
  (chiave = `scenarioInstanceId`, quella di `runIdOf`).
- **T-3 fatto** — `tests/unit/idleVillage/quests/questSettlement.test.ts`
  (11 test): tabella esiti (reward/fled/survived/wipe), idempotenza
  in-aggregato, crash dopo intent / dopo effetti / crash→replay→crash →
  convergenza, no-op su run già settled.
- **T-4/T-5 fatti** — `tests/e2e/idleVillage/gameQuestExpedition.spec.ts`
  estesa a **11 test**: `driveRunToEnd` guida la run al terminale; il test
  settlement asserisce gate sequenziale (POI2 locked mentre POI1 unsettled,
  `reason==='in-expedition'`), conseguenze come dati (isDead/isInjured/
  injuredUntilTick), delta esatti gold/xp, rilascio party, lancio rovine
  post-settle, reload mid-run con frontiera intatta; secondo test rovine
  standalone (gate esploratore, forecast, lancio, halo).
- **T-7 safeguard** — vitest quest scope 148/148 · playwright
  `gameQuestExpedition` **11/11** · `build:check` ✓ · `kanban:lint` ✓ ·
  eslint scope: file in quarantena preesistente (0 errori). Evidence:
  `test-results/s25-settlement-e2e-2026-10-09.log`.
related: PersistenceService (unico canale), InjuryEngine, QUEST_RULES.md §8 (conseguenze sempre — R-092), OPEN-015 (forma minima), PLAN-018 (mappatura), quest_theatre_spec.md
---

# PLAN-019-S2.5 — Settlement + E2E + chiusura

## Perimetro

Il run non è «finito» quando finisce: il settlement è una transizione
persistente **idempotente** — il bug peggiore possibile in un gioco dove la
morte conta è una conseguenza applicata due volte o zero (critica r1). Poi:
secondo POI end-to-end, E2E completo dello slice, documentazione di chiusura.

## Settlement (T-7 del piano padre — protocollo per-effetto, critica r1)

- **T-0 bloccante — tre domande binarie con risposta scritta** (critica
  r2): (1) la scrittura singola è durevole al return? (2) l'ordine delle
  scritture è preservato tra chiavi? (3) lettura-dopo-scrittura coerente
  al boot? **Fallback dichiarato ora**: se una è «no» → T-2 usa un unico
  aggregate `settlements/{runId}` contenente effetti + stato, scritto in
  una sola `set`, con gli effetti derivati al boot. L'output decide la
  forma del protocollo prima di qualunque implementazione.
- **Journal durevole per-effetto** (protocollo se l'atomica non esiste —
  caso atteso): (1) **intent record** `settling` nel run con il **piano
  degli effetti calcolato e congelato**; (2) effetti applicati **uno a
  uno, ciascuno idempotente per chiave `(runId, effectId)`** — «residente
  X morto per run R» è un *set*, non un incremento; **la chiave di
  idempotenza è persistita atomicamente nello stesso aggregate della
  mutazione** (critica r2 — altrimenti il replay può ripetere o saltare;
  se non supportato, alternativa equivalente dimostrata con crash test
  esattamente fra mutazione e registrazione; nessun effetto «completato»
  solo perché sta nel journal del run); per le **risorse fungibili**
  (gold/loot) la forma è **ledger di chiavi applicate** — la chiave
  `(runId, effectId)` è scritta nello stesso record del saldo, oppure il
  delta è applicato con guardia «chiave già presente → no-op» —
  **mai `set-to-expected`** sulle risorse (sovrascriverebbe acquisizioni
  estranee al run tra intent e applicazione); `set-to-expected` solo per
  stati discreti (morto, ferito); (3) marker `settled` **dopo** tutti gli
  effetti. Il replay al boot deduplica per chiave.
- **`inExpedition` e il rilascio** (critica r2): derivato da
  `run.status ∉ {settled}` — nessun flag separato (coerente col contratto
  S2.4); se non derivabile, il rilascio è **un effetto del journal** con
  chiave, incluso nei fault point. Test dichiarato: «crash dopo l'ultimo
  effetto, prima di `settled` → al reboot il residente è ancora
  `inExpedition`, sbloccato dopo replay».
- **Fault injection + fault point deterministici**: seam test-only
  («fallisci dopo l'N-esimo effetto») per esercitare ogni confine di
  persistenza del protocollo. Per ogni fault point: crash → riavvio →
  replay → secondo riavvio. Invariante: **ogni effetto applicato una sola
  volta; il recupero converge allo stesso stato finale indipendentemente
  dal punto del crash.**
- **Definizione di wipe — CONFERMATA Director 2026-10-09**: `wipe ⇔
  ∀ slot assegnato: stato = morto` valutato al momento del terminale;
  **leader morto con ≥1 sopravvissuto NON è wipe**; **obiettivo sì +
  fuga + leader vivo → reward sì** confermato. Verificata contro la
  matrice quest-design e citata in T-1.
- **Tabella delle transizioni terminali** = prodotto completo delle
  variabili (obiettivo {sì,no} × leader {vivo,morto} × uscita {fine grafo,
  fuga, wipe} = **12 celle**, ognuna con esito o «IRRAGGIUNGIBILE perché
  <motivo verificabile nel motore>» — nessun default implicito):

| Obiettivo | Leader | Uscita | Reward quest | Bottino | POI |
|---|---|---|---|---|---|
| sì | vivo | fine grafo | sì | sì | chiude |
| sì | morto | fine grafo | **no** | sì | chiude |
| sì | vivo | fuga/ritiro | **IRRAGGIUNGIBILE nel motore** — `flee()` chiama `dropObjective` prima di `endRun`: al terminale `objectiveDone=false` sempre (enumerazione T-1). **RATIFICATO Director 2026-10-10**: «fuga = missione fallita» — il motore ha ragione, la conferma informale «fuga+obiettivo → reward» decade; prevale QUEST_RULES §5. | se vivesse: conservato | chiude |
| sì | morto | fuga/ritiro | no (stessa ragione: `flee` ⇒ `objectiveDone=false`) | conservato | chiude |
| sì | * | wipe | no | **tutto perso** | chiude — **RAGGIUNGIBILE** (verificato T-1: goblin wipe con trofeo in mano all'agguato F7) |
| no | vivo | fine grafo | no | conservato | chiude |
| no | morto | fine grafo | no | conservato | chiude |
| no | vivo | fuga/ritiro | no | conservato | chiude |
| no | morto | fuga/ritiro | no | conservato | chiude |
| no | * | wipe | no | **tutto perso** | chiude |
| Abbandono offerta (non lanciata) | — | — | — | — | offerta chiusa |
| Scadenza `availableDays` | — | — | — | — | **solo offerte non lanciate** |

Esiti del motore verificati (enumerazione `questTerminalMatrix.test.ts`, 8 test):
`reward` ⇔ `objectiveDone && leader vivo` al nodo end · `fled` ⇒ `objectiveDone=false`
· `wipe` ⇔ `∀ membri morti` + loot/info svuotati · `survived` = il resto
(raggiungibilità residua dichiarata: «no|morto|fine grafo» e «sì|morto|fuga»
coperte da witness forzati nel motore reale — il leader morto è raro nel
sweep stocastico perché i preset lo proteggono, non perché la cella manchi).

  Test dichiarato: enumerazione programmatica degli esiti terminali dei
  grafi goblin/rovine — le celle coperte sono solo quelle raggiungibili,
  e ogni cella irraggiungibile ha il motivo scritto. «Tutto perso» sul
  wipe = matrice frozen, nessuna regola config (emendare la desiderata
  se si vuole cambiare).

- **Effetti per residente** (sezione spec): per ogni stato finale (vivo /
  ferito con durata e fonte dichiarata / morto) la mutazione esatta su
  stato residente, `inExpedition` (rilascio), `InjuryEngine` — con chiave
  di idempotenza; e cosa «morto» significa per roster/altri POI (non
  eleggibile, visibile come tale — acceptance misura il dato, non «il
  roster mostra»).
- **Precedenza scadenza**: una volta lanciato, il run congela l'offerta —
  `availableDays` non si applica più (coerente con D-H); vale solo per
  offerte non lanciate. Test sul tick di scadenza concorrente al lancio e
  su scadenza passata durante l'offline al boot.
- **Esito nel record di settlement**: l'aftermath del POI legge l'esito
  **dal record di settlement** — nessuno schema ledger separato
  (critica r2: un ledger con chiave/lettura dedicati è una funzione non
  richiesta dal contratto S2, già rimandata a OPEN-016/S4). Se un giorno
  serve, sarà un effetto idempotente del settlement, non una fonte
  indipendente.
- **Gate (a) enumerativo, non trasparenza** (critica r2 — elencare i
  mock usati prova l'onestà, non l'assenza): controllo statico in T-7 —
  tutti i canali dell'engine consultati nei due scenari ⊆
  {str,con,perc,agi} ∪ {int,cha dichiarati `mockChannel`}, e i
  consumabili usati provengono dal catalogo `questItems`, non da flag;
  altrimenti gate (a) = **NON soddisfatto** con elenco delle deroghe.

## Task

- **T-0 — Verifica `PersistenceService`** (bloccante, output scritto).
- **T-1 — Spec transizioni terminali** (tabella a 12 celle completa con
  motivi di irraggiungibilità, **definizione di wipe**, effetti
  per-residente, precedenza scadenza, esito nel record — verificata
  contro QUEST_RULES + v24 rev.2 + matrice quest-design).
- **T-2 — Settlement service** (journal per-effetto, seam fault injection
  test-only).
- **T-3 — Test settlement**: fault point deterministici con crash→replay→
  crash; «obiettivo fallito + leader vivo + fuga» → no reward, sì bottino;
  «obiettivo sì + fuga + leader vivo» → reward sì; wipe → tutto perso.
- **T-4 — Secondo POI end-to-end** (rovine): stesso tubo, contenuto diverso.
- **T-5 — E2E completo su `/game`** (entrambi i POI, **sequenziale** per
  D-D): POI1 → detail → drag → send → halo → click → `QuestRunWindow` →
  bivio → epilogo → settlement → dati residente aggiornati (morto/ferito
  come dato, non solo visual) → **`inExpedition` rilasciato** → POI2 parte
  dopo il settlement di POI1 → reload a metà run → stessa frontiera.
- **T-6 — Artefatto PLAN-018** (riusa/adatta/superato/manca — contratto S2)
  + QUEST_RULES §modello aggiornato al grafo + CURRENT_STATE, INDEX,
  kanban, PLAN-019 (S2 avanzato).
- **T-7 — Safeguard + acceptance + evidence** finale dello slice.

## Fuori scope

Registro narrativo (OPEN-016 → S4) · memoria personaggi · quest `cassa` ·
calibrazione letalità numerica.

## Acceptance (= chiusura dello slice S2, verso gate PLAN-019)

1. Settlement verificato idempotente sui casi di reload forzato; transizioni
   terminali conformi alla tabella.
2. I due POI funzionano end-to-end su `/game` con party composto dal
   giocatore dal roster reale.
3. Conseguenze visibili (morti/feriti/loot) persistite una sola volta e
   sopravvivono al reload.
4. Tutti i gate del padre valutabili: (a) **nessun mock fuori dai canali
   dichiarati `mockChannel`** (il record di settlement elenca i canali mock
   che hanno contribuito — il gate si legge, non si assume), (b) proprietà
   preservate, (c) giudizio Director.
5. Safeguard verdi + evidence log completo.
