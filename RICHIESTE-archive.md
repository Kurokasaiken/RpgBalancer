---
title: Richieste esplicite
type: intent-ledger
updated: 2026-11-19
---

# Richieste esplicite

Questo file è la bussola operativa. Contiene ciò che Fausto ha chiesto, con le sue parole.

## Stati

`da chiarire` · `proposta` · `aperta` · `in corso` · `fatta` · `ridotta` · `rinviata` · `ritirata`

`proposta` = candidato di design in attesa di ratifica Director (non lavoro impegnato).
`ridotta`, `rinviata` e `ritirata` solo con approvazione esplicita.
Triage 2026-10-12 (R-156): 28 voci chiuse su evidenza kanban/artefatto — `context/request-triage-2026-10-12.md`.

---

# RICHIESTE-archive — voci closed-family antecedenti 2026-11-16 (split PLAN-121 2026-11-15)

## R-334 — Il POI su /game apre il cassetto firmato coi dati reali

**Richiesta (verbatim, 2026-11-14):** *"quando clicco un POI sulla /game appare il cassetto con i dati corretti collegaati? se no deve farlo"*.
**Data:** 2026-11-14
**Stato:** `fatta` — verificato sul vivo (Playwright), evidenza sotto (2026-11-15).
**Implementazione:** `/game` montava `QuestExpeditionDetail` via `wrapQuestDetail`; ora `src/ui/idleVillage/hudReal/HudRealCassettoDetail.tsx` è un drop-in che accetta le stesse `QuestExpeditionDetailProps` — lette dal nodo wrappato dentro `wrapDetail` in `game-mappa2.tsx` — e renderizza `HudRealCassetto` dentro `StagePanelFrame` (stage ownership, suspension ed Escape arbitration invariati). Niente stato duplicato: slots, estimate, items, canSend, send, onSlotClear, suppressedResidentIds sono quelli della sessione `useQuestExpeditionSession` reale per-POI.
**Contratto completo (2026-11-15):** l'adapter copre il contratto R-337/R-339 — bag slot frames (`selectedItemIds[i]` → pouch i, pouch vuota apre il magazzino bound via `onOpenStash` della sessione, tile packata rilascia via `toggleItem`), `resourceItems` reali nella testata, `disabledReason` (stessa `questExpedition.forecast.incomplete` dello stock), `totalDays` e gamba "At site" da `expeditionTotalDays`, danger band localizzata via `DANGER_BANDS.i18nKey`, `onOpenRoster` su tap del sedile.
**Verificato dal vivo (Playwright, `?poiDemo=1`):** click `poi-goblin` → cassetto "Goblin Extermination", briefing, journey 2/2/2 + "Total: 6 days", 3 pouch, resources targhette (15 Gold / 8-20 Food / 0 Wood), reason line sotto CONFIRM; click pouch vuota → `VillageStashPanel` bound si apre con i quest item reali; ESC chiude; `poi-rovine` con dati propri; drag roster→slot committa l'assegnazione. `tsc` pulito, lint 0 errori, `build:check` ✅. Resta non coperto (nessuna zona sul frame): forecast/key-stats/intel/hero della colonna destra stock, `onReleaseAllItems`, bottone close (ESC copre).

---

## R-336 — /game: barra tempo e nav bar "scazzate" da skin-scope sul root

**Richiesta (verbatim, 2026-11-14):** *"sono state fatte modifiche a questi due compoennte in /game che li hanno scazzati, ripristinali corretti cm erano prima. Poi spiegami xè sn stati modificati"* — screenshot della time bar (DAY + speed ×1/×2/×4) e della nav bar (voci + medaglione centrale + lock).
**Data:** 2026-11-14
**Stato:** `fatta`
**Root cause:** il commit `5999d3b9` (R-335, fix icone filtro/sort roster) ha aggiunto `skin-scope` sul **root** di `game-mappa2.tsx`. La regola base `.skin-scope :where(button…)` (specificità 0,3,0) vince sulla scoped CSS dei componenti firmati `[data-hudreal-time] button` / `[data-hudreal-nav] button` (0,1,1): ogni `<button>` trasparente delle barre firmate è diventato una piastra bronze con bordo/raggio/ombra — i pallini speed sono diventati scatole oro, il medaglione recenter un quadrato oro vuoto, i lock dei disc circoli riempiti.
**Fix:** `skin-scope` spostato dal root al solo mount `data-panel="roster"` — copre le `<select>` di `DragTestContainerV2` (INV:drag-test-container-v2.INV-1 preservato) senza toccare le superfici firmate. Test `r335RosterChrome.test.ts` aggiornato: asserisce la classe sul pannello roster e la sua assenza sul root.
**Verificato (2026-11-14):** test `r335RosterChrome` 5/5, `lint` 0 errori, `build:check` OK, `closure:lint` OK. Witness headless `/game` 1440×900: bottoni speed/voci/recenter tornati `background: rgba(0,0,0,0)` + bordo 0; crop `/tmp/r336-{time,nav}.png` — pallini ×1/×2/×4 incisi su trasparente, medaglione-astrolabio centrale di nuovo visibile, lock badge sui socket bloccati. Probe `scripts/_tmp-r336-witness.mjs` (veil di boot nascosto via JS: `map-ready` non arriva in headless, blocco noto).

---

## R-337 — Cassetto: oggetti da viaggio come slot vuoti riempiti dal magazzino

**Richiesta (verbatim, 2026-11-14):** *"il componente cassetto ha un modo sbagliato d presentare gli oggetti da portare in viaggio, dovrebbero essere degli slot vuoti e dovrebbero essere cliccati dal compoennte magazzino"*
**Data:** 2026-11-14
**Stato:** `fatta`
**Intento rilevato:** nella spedizione (cassetto) la sezione "items/loadout" non deve mostrare gli oggetti come lista/toggle inline: deve mostrare **slot vuoti** che si riempiono cliccando gli oggetti nel componente **magazzino** (VillageStashPanel).
**Implementazione:** la macchina esisteva già (bag nel ledger condiviso `bags[poi.id]` + props `onOpenStash`/`onToggleItem` + stash planner-bound) — il cassetto la reimplementava come lista `loadoutRows` con toggle. Ora `HudRealCassetto` accetta `loadout: CassettoLoadoutSlot[]` (slot fixed-size, vuoto → pouch icon, pieno → `StashItemTile`/`VillageStashItemIcon` shared, click pieno → release via `onToggleItem`, click vuoto → `onOpenStash`). `HudRealCassettoDetail` (/game) e `HudRealCassettoHost` (/hud-compose lab) leggono la bag live dal ledger. Regressione permanente: `tests/unit/idleVillage/r337CassettoBagSlots.test.tsx` (4 test: slot vuoti, item faccia condivisa, click empty→stash, click pieno→release).
**Verificato (2026-11-14):** E2E Playwright headless su `/game?poiDemo=1` (`scripts/_tmp-r337-e2e.mjs`): click marker quest → cassetto `data-cassetto-bag` aperto → click `bag-slot-empty-0` → `VillageStashPanel` aperto (`data-stash-mode="interactive"`, 12 righe) → click item stash → `loadout-item-quest_consumable_forza` nel bag (2 empty restanti) → click item packed → released (0 packed / 3 empty). Screenshot `/tmp/r337-e2e-final.png`: cassetto con slot pouch vuoti + magazzino interattivo + roster icone (fix R-335/R-336 intatti). Test `r337CassettoBagSlots` 4/4 + `r335RosterChrome` 5/5, `lint` 0 errori, `build:check` OK, `closure:lint` OK.

## R-340 — /game: audit superfici non collegate + porting merchant/ledger/lost/level-up

**Richiesta (verbatim, 2026-11-15):** *"ci sn altri componenti su /game nn correttamente collegati ai dati veri? menù o componenti che c servono, nn riportati?"* — poi *"procedi"* (implementazione dei porting dopo l'audit).
**Data:** 2026-11-15
**Stato:** `fatta` — audit + 5 swap verificati sul vivo (2026-11-15); residui tracciati sotto (roster→R-340bis/R-346, BUY/reward/Chronicle → decisioni Director).
**Audit eseguito:** nessun'altra superficie su `/game` mostrava dati fabbricati — il cassetto era l'unico caso firmato-ma-staccato (fixato in R-334). Il problema residuo era **migrazione visiva**: 6 superfici con dati reali ma visual stock e controparte `hudReal` firmata esistente.
**Swap eseguiti in `game-mappa2.tsx` (4/6):**
- `HudEventLedger` → **`HudRealLedgerPanel`** — stesso feed `gameEvents`/`focusEvent`, montato al stage rect dentro `StagePanelFrame`, chiusura stage-owned (ESC).
- `MerchantPanel` → **`HudRealMerchantPanel`** — stesso `MERCHANT_CONFIG` reale; azione BUY resta disabilitata per contratto del componente firmato (non ridisegnata in questo giro).
- Lost report → **`HudRealExpeditionLost`** — stesso `QuestRunState` staged (`stageExpeditionLost` su copia), quest name reale, `onClose` vero. Il path reward (`QuestRewardPopup`) resta stock finché non esiste la superficie firmata.
- `HeroLevelCeremony` → **`HudRealLevelUp`** — stessa sorgente eventi `subscribeHeroLevelUp`, stesso prop `residentsById`, ESC già gestito.
- `MemorialPanel` → **`HudRealMemorial`** (dress `zanara`) — stesso feed `s.memorial` dello store reale. `GameMenuDialog` ha il nuovo flag `chromeless`: veil/portal/Escape/focus invariati, la placca chrome si toglie per lasciare la gallery a tutta superficie; dress `skin` (titolo) resta sul panel stock.
**Non portati (decisione motivata):**
- **Skill check:** `QuestSkillCheckColumn` monta già il motore vero `DestinyAstrolabeV62Standalone` (frozen kit, stat party reali, `QuestCheckBridge` + resolve callback); `HudRealAstrolabe` è una targa da lab, non un drop-in → nessun porting necessario.
- **Roster:** `HudRealRosterColumn` è click-only mentre il roster `/game` serve il drag-to-assign nei slot expedition (DndContext di pagina + `DragOutcomeFlight`) → porting rinviato, richiede design rail/pannello firmato compatibile DnD.
**Verificato dal vivo (Playwright, T-04):**
- Merchant via menu → pannello firmato "TRADER ROWEN" con offerte reali (Healing draughts 9g / Field rations 4g), BUY disabilitato, ESC chiude.
- Ledger via menu → pannello "CRONACA / EVENTS" empty-state reale; via director invasion + "PREPARE THE DEFENSES" → pannello si apre con row live "Goblin host reaches the village — tra 5 gg" + toast THREAT. `panels:1 rows:1`.
- Lost: director "Start goblin quest" (demoLaunch: assign+pack+send reali) + "Expedition lost" → `hudreal-lost-layer` montato, report con quest name reale + tomba FALLEN del residente assegnato.
- Level-up: director "Hero level-up" → 3 targhe firmate con residenti e stat-gain reali (SIR SPACCACULI Lv IV, SALVATRICE Lv VI, GIGGIOLILLO Lv V).
- Memorial: menu → MEMORIAL → gallery firmata Solemn montata nel dialog flow (`hudreal-memorial:1`, empty-state reale "No one has fallen yet."); voci live già verificate su hud-compose con `?seed=memorial` (stesso store selector).
- `errors: 0` su tutte le probe; `tsc` pulito; `build:check` ✅; `closure:lint` ✅ (exit 0, completato entro budget 30s dopo ripetuti timeout precedenti); lint `game-mappa2.tsx` 0 errori / 33 warning preesistenti (no-restricted-imports kit + exhaustive-deps).
**Non verificato:** screenshot cassetto aperto su `/game` in headless (blocco map-ready preesistente documentato in R-335).
**Nota parità:** il BUY del merchant era disabilitato anche nello stock (badge Preview) — la firma mantiene il comportamento di produzione, l'acquisto interattivo è una feature nuova, non un gap di porting.
**Resta sulla lista:** roster→superficie firmata compatibile drag (rail PLAN-119 vs pannello flottante — decisione di superficie canonica); merchant BUY interattivo (feature nuova); reward path (vittoria) quando esiste superficie firmata (richiede arte + visual fork); Voce/C10 (R-338, delivered — chiusura formale bloccata da worktree condiviso); mockup Chronicle drawer (R-339/PLAN-119).

## R-341 — ops: commit + push + deploy Vercel pulito

**Richiesta (verbatim, 2026-11-15):** *"il deploy su vercel e penso anche git è fallito, xè? voglio che fai un commit, push e deploy pulito"*
**Data:** 2026-11-15
**Stato:** `fatta` — evidenza sotto.
**Chiusura:** nessuna-verifica-tecnica: "ops fix — verifica = deploy Ready + webglBootProbe PASS su / e /game sull'alias prod; nessun bundle producibile (closure:lint pre-rosso su drift contratti noto/Director-gated)".
**Diagnosi accertata (2026-11-15, thread 2):** git pulito (auto-commit `5f11256d` pushato); il deploy Vercel di `5f11256d` è **fallito in build** su `assertDeployShape` — `deploy-manifest.json` in drift (~99 file nuovi in `public/` dall'auto-commit senza regen manifest). Alias prod rimasto su `35b9f7e`. **Fix:** manifest rigenerato (`deployManifest.mjs`, `--check` verde), commit `e5b8170d` pushato → deploy **● Ready** (`rpg-balancer-g6r856eo4`, poi `4gk1t9h02` per il commit `ad157925` di sessione parallela). **Verifica R-304:** `webglBootProbe.mjs` PASS su `https://rpg-balancer.vercel.app/` e `/game` sull'alias produzione (WebGL swiftshader, exit 0 entrambi).
**Residui (non di questa voce):** check GitHub `Validate i18n…` rosso su `closure:lint` (drift contratti: 2-owner game-menu-screens Director-gated + 0-owner nuovi da auto-commit + scope_files divergenti); check `Release` rosso ambientale (Playwright 1.58.2 vs runner ubuntu26.04). Serve task dedicato di resync contratti + ruling Director.

## R-340bis — Roster rail: righe drag-to-assign (punto di ripresa, budget)

**Scelta Director (2026-11-15):** opzione 1 — estendere `RosterStashRail` (superficie canonica PLAN-119) col drag di produzione.
**Data:** 2026-11-15 (verificato 2026-11-15)
**Stato:** `fatta` — drag verificato dal vivo su `/game?poiDemo=1` (2 run consecutive verdi). Tap instrada correttamente; residuo non-commit ambientale sotto, fuori scope rail.

**Implementato:**
- `RosterStashRail.tsx`: `RosterRow` ora `useDraggable` (id=`resident.id`, payload identico a `WanderlustRosterCardV2` + tag `source:'roster-rail'`); `useDndMonitor` gated su `source==='roster-rail'`; `useDragOutcome` + `CustomDragOverlay` + `DragOutcomeFlight` nel rail (DndContext pagina via `RosterKitShell`); `data-resident-id` sul row (richiesto dal tap-to-assign di produzione per il `from` del flight); `onDragEnd`/`onFlightComplete` stesse firme del roster flottante.
- `game-mappa2.tsx`: wiring identico al flottante (`expeditionGoblin/Rovine/session` chain per verdict, `ownsSlotId`→`handleFlightComplete` per il commit). **NO kill-switch**: il kill-switch `dragEnabled={!panels.visible.roster}` era sbagliato — il member picker di sessione (`drag-test-container` in `expedition*.overlays`) si apre SEMPRE col cassetto e copre fisicamente le prime righe della rail; disabilitare il drag proprio quando serve è un self-goal. Al suo posto: ownership per `data.source` — l'`onDragEnd` del roster flottante early-return `undefined` per i drag `roster-rail` (nessun doppio commit, entrambi i monitor coesistono).
- Bug trovati+fixati: (1) `onPointerDown` custom sovrascriveva `listeners.onPointerDown` di dnd-kit → concatenato; (2) mancava `data-resident-id` sul row → il tap-to-assign non trovava il `from`.

**Verificato dal vivo (Playwright, T-04):**
- Probe `scripts/hud-real/_tmp-probe-rail-final.mjs`: `cursorOffset` scritto, `aria-pressed=true` (drag dnd-kit attivo), ghost in volo sui sedili (screenshot `rail-final-mid.png`), commit di produzione `{"poi-goblin:goblin-slot-member-1":"villager-baldassarre"}` via `getAssignments`, `slot-medal` nel DOM, riga rail con badge `ASSIGNED` (screenshot `rail-final-end.png`) — **2 run consecutive, errors: 0**.
- Tap: `onSelect` → `handleResidentSelect('villager-lisetta')` ritorna `true` e lancia `startFlight` di produzione (`__dragFlightActive: true`) — la route è corretta.
- Eleggibilità reale verificata via hook `checkEligibility` su tutti gli slot (baldassarre non era eleggibile su leader — reject corretto di produzione, non bug).

**Residui chiariti (2026-11-15):**
- ~~`startTransition` non committa~~ → **RISOLTO come non-bug**: probe dedicata conferma che `assignToSlot` committa sempre, solo a t+3s sotto SwiftShader — le transition sono lente (per design, i ~200ms bloccano il thread), non sospese. I "non-commit" delle run precedenti erano timing + reload T-13.
- ~~member picker copre le prime righe della rail~~ → **fixato in R-346** (gate su `usePanelWhileOpen`: rail espansa = superficie picker, niente roster flottante auto-aperto).

**Safeguard:** `tsc` pulito · `build:check` ✅ · lint 0 errori (warning preesistenti) · `closure:lint` ✅ exit 0 · unit `r339RosterStashRail`+expedition 29/29 ✅.

## R-343 — ops: delega automatica a subagent + context budget (Devin)

**Richiesta (verbatim, 2026-11-15):** *"le finestre d contesto si riempiono facilmente. Come faccio a fare in modo da cambiare sessioni automaticamente? nn voglio farlo a mano, voglio che sia il mio agente a farlo. E ancora meglio: c sn operazioni che sn diverse da implementazione e cose del genere, durante la conversazione nn so qunato m piaccia cambiare contesto. al massimo i miei agenti dovrebbero chiedere d fare operazioni in altre sessioni e poi da quella d partenza recuperare le info trovate? come possiamo fare?"* — poi *"procedi"* al pacchetto proposto.
**Data:** 2026-11-15
**Stato:** `fatta` — evidenza sotto.
**Chiusura:** nessuna-verifica-tecnica: "ops tooling — verificato via devin doctor + dry-run hook; closure:lint non verificabile in sessione (timeout >90s, worktree condiviso T-13, pre-rosso documentato)".

**Direzione approvata:** non rotazione di sessioni ma **delega a subagent** (context window propria, risultato distillato al parent) + auto-compaction già built-in. Integrato col protocollo esistente `mw-context-budget.py` (WARN 70% / CRIT 85%).

**Implementato:**
- `.devin/agents/researcher.md` — read-only, autorità CANON>CURRENT_STATE>DECISION_LOG>RICHIESTE>context/auto, obbligo citazioni `file:line` + recurring-traps check.
- `.devin/agents/verifier.md` — esegue safeguard suite e riporta exit code/errori; timeout per regola 00, no fix, no foreground.
- `.devin/agents/implementer.md` — write-capable su spec esatta, pinned fast model; invarianti config-first/i18n/persistence/primitives nel system prompt.
- `.windsurf/rules/55-delegation-context-budget.md` (`trigger: always_on`) — matrice di delega, contratto subagent, lifecycle compaction/WARN/CRIT.
- `scripts/devin-context-hooks.py` + `.devin/hooks.v1.json` — `PostCompaction` emette `additionalContext` + flag per-sessione; `UserPromptSubmit` di progetto re-inietta il reminder una volta se il flag esiste (fallback se `additionalContext` su PostCompaction non fosse onorato — non documentato per quell'evento).
- `~/.config/devin/config.json`: `agent.subagent_model = "swe-1-6-fast"` (riguarda explore + custom senza pin; `subagent_general` segue sempre il parent).

**Verificato:** `devin doctor` → 3 profili caricati (implementer, researcher, verifier), 0 failure; dry-run hook → emissione + flag-clearing corretto; JSON validi; file non gitignored.
**Non verificato:** attivazione effettiva dei profili/hook dentro una sessione Devin live (visibile al prossimo uso — `/hooks` e pannello subagent); comportamento `additionalContext` su evento PostCompaction (fallback via flag implementato per coprirlo).

## R-344 — ops: globalizzare delega subagent + context hooks (MW e tutti i progetti)

**Richiesta (verbatim, 2026-11-15):** *"deve esser ein MW e tutti gli altri"*
**Data:** 2026-11-15
**Stato:** `fatta` — evidenza sotto.
**Chiusura:** nessuna-verifica-tecnica: "ops tooling cross-project — verificato via devin doctor su RPG/MW/tmp + dry-run hook; closure:lint non verificabile in sessione (timeout >90s, come R-343)".

**Implementato:**
- Profili generici globali `~/.config/devin/agents/`: `researcher` (read-only, legge docs canonici del progetto ospite), `verifier` (check suite + timeout), `implementer` (write su spec esatta, legge AGENTS.md/CLAUDE.md) — tutti pinned `swe-1-6-fast`.
- Profili RPG rinominati `rpg-researcher`/`rpg-verifier`/`rpg-implementer` in `.devin/agents/` per evitare collisione di nomi coi globali (doctor: 6 profili caricati, scelta deterministica); regola 55 aggiornata.
- Regola globale `~/.devin/rules/delegation-context-budget.md` (`always_on`, tutti i progetti).
- Hook context-restore spostato a livello globale: `mind-weaver/tools/devin-context-hooks.py` (generico — elenca i docs canonici presenti in `$DEVIN_PROJECT_DIR`) wired in `~/.config/devin/config.json` (`PostCompaction` + secondo `UserPromptSubmit` accanto a `mw-context-budget.py`). Rimossi `.devin/hooks.v1.json` e `scripts/devin-context-hooks.py` di progetto (doppio firing evitato).
- `agent.subagent_model = swe-1-6-fast` già in config utente (R-343).

**Verificato:** `devin doctor` in RPG (6 profili), mind-weaver (3), /tmp (3) — 0 failure; dry-run hook con `DEVIN_PROJECT_DIR` RPG e MW → elenca i docs canonici corretti di ciascun progetto; config.json valido.
**Non verificato:** attivazione live in sessione (vale da nuove sessioni/`/fork`); precedenza runtime tra profili omonimi evitata a monte via rename.

## R-346 — /game: member picker flottante copre le righe della rail quando il cassetto è aperto

**Origine:** residuo layout segnalato in R-340bis — autorizzato con "go".
**Data:** 2026-11-15
**Stato:** `fatta` — verificato dal vivo (Playwright, T-04).

**Root cause:** `usePanelWhileOpen(panels, 'roster', anyExpeditionDetailOpen)` (contratto R-184, pre-rail: «il planner è inutile senza le card PG da trascinare») auto-apriva il roster flottante (`MatericRosterComponentV2` → `drag-test-container`) ogni volta che un cassetto si apriva. Il panel stage-managed si posizionava a `x:72, w:400` sopra la rail docked (`left:0, w:320`) e ne copriva fisicamente le prime ~4 righe — quelle righe non ricevevano pointerdown, quindi niente drag né tap.

**Fix:** gate sull'auto-open — quando la rail è montata ed espansa **è lei** la superficie picker del planner (PLAN-119 AC4/T5: `onOpenRoster` del cassetto punta già a `useExpeditionRail.open('roster')`), quindi il flottante non auto-apre. La rail si auto-rimuove come candidato picker in tutti i casi in cui non può servire: collassata a chip (scelta utente), foldata dal mutex su viewport <1100px, HUD nascosto, view ≠ map. In quei casi il flottante apre come prima — il picker è sempre disponibile e la semantica give-back di `usePanelWhileOpen` è invariata (un flottante già aperto a mano non viene chiuso).

**Modifica:** `game-mappa2.tsx` — `usePanelWhileOpen(panels, 'roster', anyExpeditionDetailOpen && !(railExpanded && view === 'map' && !hudHidden))` spostata dopo le dichiarazioni di `railExpanded`/`hudHidden` (era sopra per TDZ).

**Verificato dal vivo (Playwright):**
- Rail espansa + `openDetail('poi-goblin')` → `drag-test-container` count: **0**, rail visibile, 6 righe, `elementFromPoint` sul centro della prima riga restituisce la riga stessa (`rail-roster-row-hero-sir-spaccaculi`) — errors: 0. Screenshot `test-results/hud-real/rail-overlap-fixed.png`.
- Rail collassata a chip + `openDetail` → `drag-test-container` count: **1** (fallback R-184 intatto) — errors: 0. Screenshot `rail-collapsed-picker-fallback.png`.
- Probe: `scripts/hud-real/_tmp-probe-rail-overlap.mjs`, `_tmp-probe-rail-fallback.mjs`.

**Safeguard:** `tsc` pulito · lint 0 errori (34 warning preesistenti) · `build:check` ✅ · `closure:lint` ✅ exit 0 · unit 29/29 (1 flaky timeout ri-eseguito: passa, è nella sessione non nella pagina).

## R-349 — Candidatura Tambù Digital «Prima Pubblicazione»: dossier completo per Wanderlust: Triumph

**Richiesta (verbatim, 2026-11-15):** *"https://www.tambudigital.com/it/prima-pubblicazione/candidatura — devo compilare questo, m crei tutti i documenti che mi servono?"* + spec dettagliata (posizionamento, 9 cartelle output, DOCX+PDF, verifica finale).
**Data:** 2026-11-15
**Stato:** `verificata` — candidatura inviata 2026-11-16, protocollo **`PP26-0006`** (evidenza: `action:"complete"` → `{"ok":true,"protocol":"PP26-0006"}`, id interno `7204c5b9-7f94-4d00-8be0-1878ee24731b`).
**Scope:** dossier candidatura call Prima Pubblicazione (scadenza 2026-12-21 h12:00): 01 Project Description ≤2000c, 02 GDD Summary ≤5pp, 03 Team&CV, 04 Financial Overview, 05 Production Plan ≤2000c, 06 Gameplay Showcase, 07 Screenshots ≤6, 08 Application Form Data, 09 Open Questions + doc finale di verifica. Posizionamento: Fantasy Strategy/Management Roguelite (LoW + gestione insediamento + spedizioni fino a 20 eroi + run-loss). Team = 1 dev; AI = strumento di produzione dichiarato. Dati mancanti → [DA CONFERMARE]. Niente firma/invio autonomo.
**Note:** call fetchata e verificata (form fields + dichiarazione PAdES/p7m obbligatoria). Output in `deliverables/tambu-prima-pubblicazione/`. Conversione: textutil→DOCX, Playwright headless→PDF.
**Progresso (2026-11-16, invio):** autorizzazione Director a spuntare le 5 dichiarazioni e inviare. Diagnosi del 400: il campo `Website` è un **honeypot anti-bot** — lasciato vuoto il POST passa. Normalizzati telefono (`+39 392 0044477`), città (`Carpi`), motore (ASCII). Checkbox React: click sul quadratino in alto-sx della label (il centro contiene un link che mangia il click). Esito registrato in `deliverables/tambu-prima-pubblicazione/README.md`. Facoltativi omessi: video, materiali extra, social, GDD completo, accordi team. Aperto: eventuale rifirma qualificata (CieSign/SPID) se Tambù la richiedesse; ricattura 3 screenshot solo se si ricandida/aggiorna.
**Progresso (2026-11-16, video):** prodotta e poi **eliminata su richiesta Director** una bozza walkthrough automatizzata — il video gameplay lo registra il Director quando soddisfatto; social/canale YouTube/email integrazione **in pausa** fino ad allora (ruling: «fino a quando non ho un video adeguato non mi interessa procedere»). Bozza email + checklist restano in `08_Application_Form_Data/email_integrazione_tambu.md`. Script di registrazione tenuto come riferimento: `scripts/_tmp-video-walkthrough.mjs`. Nota tecnica: dev-server Vite full-reload uccide le registrazioni lunghe → registrare su `vite preview`.
**Progresso (2026-11-16):** form Tambù compilato in browser headed (26 campi OK): dati personali + tutti i documenti caricati. Dichiarazione compilata+firmata PAdES self-signed (cert su macchina, `10_Dichiarazione/dichiarazione-FIRMATA.pdf` + .p7m, openssl verify OK). Contatti Director registrati in director-knowledge/PROFILO.md. Prospetto con dati reali (€280 investiti, >20h/sett, >€1000 capitale). Restano: 5 checkbox legali + invio (Director), opzionale ricattura 3 screenshot + firma qualificata SPID/CIE.
**Progresso (2026-11-15):** dossier completo prodotto — 9 cartelle + README + VERIFICA_FINALE.md; 8 doc in md+docx+pdf (pd 1.897/2000c, gdd 3/5pp, pp 1.478/2000c), 6 screenshot jpg 1920px. Claim «~20 eroi» verificato in GAME_VISION §73 (design, fasi avanzate). Pendente sul Director: compilare [DA CONFERMARE], ricatturare 3 screenshot con overlay dev, registrare video, firma digitale Dichiarazione, invio manuale. Subagent ricerca non disponibile (no fs access) — ricerca fatta inline.

**Handoff R-348 (2026-11-15):** subagent lanciato per il mockup (agent_id `548f33ac`, profile `subagent_general`, background) — fallito per **free-model rate limit** (reset ~18:01 UTC), nessun artefatto prodotto; retry immediato respinto uguale. Al riavvio: rilanciare lo stesso brief (resume agent_id `548f33ac` o nuovo `subagent_general`) dopo il reset quota, oppure fare il mockup HTML nel thread nuovo. Nota: nel frattempo una sessione parallela ha chiuso **T8** (ExpeditionBottomSheet + useExpeditionSheet + contratto, 19/19 test, witness lab verde) — depennare T8 dalla lista residui sopra.

## R-350 — /game: il componente delle risorse deve essere centrato

**Richiesta (verbatim, 2026-11-15):** *"il componente dellle risorse deve essere centrato in /game"*
**Data:** 2026-11-15
**Stato:** `verificata` — fix regressione incluso (banner riattaccato alla barra centrata); obbligazioni PASS (bundle `.mw/runs/r350-resources-centred/bundle.json`, verdetto BLOCKED dai gate globali come R-322: residuo solo su commit + re-seal + drift parallelo).
**Ruling (2026-11-15):** «centrato» = **centro orizzontale assoluto del frame**. Regressione segnalata dal Director (la parte a sinistra «sfalsata» — il banner restava staccato a margine): la coppia torna unita.
**Implementato:** `GameTopChrome` — root banda top a larghezza `frame.W`; resource bar a `resLeft = (frame.W − RES_W·fit)/2` e **day banner a filo alla sua sinistra** (`bannerLeft = resLeft − gapPx − TIME_W·fit`) — una coppia adiacente. `insets.left` diventa il bound: `fit ≤ overlapFit` è esattamente "bordo sinistro della coppia ≥ insets.left/scale + marginPx"; riserva Chronicle soft (cede sotto `minFitScale`), bordo finestra hard. Contratto `game-top-chrome` INV-2/INV-4 amendati (Mode B) + `sync-amend-override` Director.
**Verificato:** unit 11/11 (`r339TopChrome.test.tsx`); witness headless reale (T-04) 1440×900 e 1920×1080: centro barra = centro frame Δ0 px, coppia adiacente (pairGap=10=gapPx), banner dentro il bound sinistro, riserva rispettata, 3 chip (`test-results/r350-resources-centre-{1440,1920}.png`, probe `scripts/_tmp-r350-resources-centre-witness.mjs`). lint scope 0 errori · build:check ✅.
**Gate globali (non risolvibili su worktree condiviso in volo):** `contracts` 91 reason — drift parallelo (inventory/2-owner/menu/save/settings, member-removed) + `executedCount(BASE) unknown` gated su re-seal; `trusted_lock` non approvato; `closure:lint` exit 1 su scope altrui (R-334, deliverables Tambu R-349). Si sbloccano a commit + `trusted:seal` a lavori fermi (R-345 resume point).

**R-348 eseguito (2026-11-15, subagent `548f33ac`):** witness stock `QuestRewardPopup` reale catturato (VICTORY—REWARD EARNED, WOUNDED, +60g, +40xp, echoes, COLLECT REWARDS). AI path riuscito via **ChatGPT web session** (4 varianti in `public/mockups/victory-reward/ai/`: stele/pergamena/altare/stendardo). Fork HTML: v1 "Placca del ritorno" (1:1 layout stock) + v2 "Bollettino della vittoria" (ledger araldico landscape). Galleria `http://localhost:5173/mockups/victory-reward/`. **Pendente: ruling Director visual-fork (PLAN-047) — scegliere baseline tra le 6 varianti.**

## R-351 — /game: le tab vertical « SELECT A QUEST MARKER » ne doit pas exister

**Richiesta (verbatim, 2026-11-15):** *"questo componente nn deve esistere"* (capture : `ExpeditionEdgeTab`, tab vertical docked bord droit, état de repos de la surface expedition).
**Data:** 2026-11-15
**Stato:** `verificata`
**Implementato:** `ExpeditionEdgeTab` supprimé (composant + contrat `expedition-edge-tab` + ligne COMPONENT_MASTER_INDEX + clé i18n `cassetto.edgeTab.hint` en/it-IT/pseudo). La page ne monte aucune surface expedition au repos ; le cassetto signé apparaît directement à l'ouverture d'un detail. INV `expedition-drawer.INV-1` + `expedition-bottom-sheet` amendés (Mode B) + `sync-amend-override`; test `r339ExpeditionStates` remplacé par un pin d'absence (source page + fichier inexistant).
**Verificato:** unit 35/35 (`r339ExpeditionStates` 9, `r339ExpeditionDrawer` 7, `r339ExpeditionSheet` 19); build:check ✅; lint 0 erreur. Witness headless réel (T-04) `test-results/r351-no-edge-tab-map.png` : `expedition-edge-tab` absent du DOM, bord droit vide, 0 pageerror à froid — NB : le dev server a servi un transform stale post-edit (crash error-boundary) jusqu'à invalidation forcée via `touch`, à savoir pour T-13.

