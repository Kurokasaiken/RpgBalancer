---
title: Quest Rules — regole vigenti
type: canonical
updated: 2026-10-05
plan: PLAN-020
---

# QUEST_RULES — regole correnti di risoluzione delle quest

Fonte unica per «quali sono le regole quest attuali?». Compila i riferimenti —
non riscrive le desiderata FROZEN. `GAMEPLAY_DESIGN.md` resta la **visione**;
questo documento registra le **regole vigenti**.

Ogni regola ha: RULE · STATUS · SOURCE · (DECISION/RATIONALE dove serve).

Legenda STATUS:
- `vigente` — regola ratificata (desiderata FROZEN / decisione registrata)
- `mock-S1` — parametro di laboratorio S1, da calibrare al Gate A
- `divergenza-nota` — design e implementazione divergono, dichiarato e non
  risolto (vedi `context/OPEN.md`)
- `proposta` — idea candidata non ancora ratificata (NON è una regola)

Manutenzione (PLAN-020): quando il Director esprime una regola nuova o diversa,
questo doc va aggiornato nella stessa sessione; divergenza da FROZEN → domanda
al Director, non assorbimento silenzioso.

---

## 1. Struttura della quest

- **RULE:** la quest è una catena `PARTY → QUEST → PHASE → SITUATION →
  APPROACH → CHECK/CHOICE → CONSEQUENCE → NEXT PHASE`.
  **STATUS:** `vigente`. **SOURCE:** `plans/PLAN-019-quest-macro-plan.md`;
  `context/QUEST_S1_DESIGN.md` (copia tracciata di `.mw/runs/20261002-s1-quest-design/quest-design.md`).
- **RULE:** struttura di riferimento S1: viaggio → scelta approccio → evento →
  scoperta/lore → ulteriore evento/ricompensa → obiettivo → ritorno. La scelta
  d'approccio determina quale competenza è rilevante nella fase successiva.
  **STATUS:** `vigente`. **SOURCE:** `.mw/desiderata.md` v24 rev.1 p.1
  (sostituisce la lettura «spedizione goblin» — `context/REJECTED.md` REJ-003).
- **RULE:** la quest di riferimento S1 è «La cassa delle sementi», in un lab
  isolato. «Le Rovine sotto il Fiume» è una seconda quest authored del lab,
  non un rimpiazzo dello scenario S1.
  **STATUS:** `vigente`. **SOURCE:** `plans/PLAN-019-S1-quest-interessante.md`;
  `RICHIESTE.md` R-083.
- **RULE:** criterio S1 — *«nn ci interessa che funzioni, deve essere
  divertente»*. Le meccaniche sono strumenti di tensione valutati al Gate sul
  momento drammatico prodotto, non sulla correttezza.
  **STATUS:** `vigente` (criterio di valutazione, non meccanica).
  **SOURCE:** `context/DECISION_LOG.md` 2026-10-02; desiderata v24.

## 2. Party, slot e informazione

- **RULE:** il **leader** è uno slot speciale di spedizione, scelto dal
  giocatore; nella matrice S1 è slot fisso della quest.
  **STATUS:** `vigente`. **SOURCE:** v24 rev.2; `context/QUEST_S1_DESIGN.md`.
- **RULE:** esistono ingredienti/slot **obbligatori** e **secondari**; la
  preparazione secondaria è facoltativa.
  **STATUS:** `vigente`. **SOURCE:** DECISION_LOG 2026-10-01; DESIGN_PILLARS
  Pillar 3.
- **RULE:** la stat primaria della quest è sempre rivelata; esplorazione/
  esploratore rivela informazioni secondarie (stat secondarie delle fasi,
  pericoli, sorveglianza, presenze). Un esploratore più capace rivela più
  dettagli.
  **STATUS:** `vigente`. **SOURCE:** DECISION_LOG 2026-10-01; v24 rev.2.
- **RULE:** la cavalcatura occupa uno slot equip — velocità = trade-off
  meccanico, non free lunch.
  **STATUS:** `vigente`. **SOURCE:** DECISION_LOG 2026-09-29; v23 rev.3.

## 3. Skill check e rischio

- **RULE:** il modello di rischio è **per-fase, esteso per residente**: ogni
  fase produce chance di ferita/morte per ciascun membro (rischio base fase +
  `residentRiskModifiers` dello slot + contributi loadout).
  **STATUS:** `vigente`. **SOURCE:** DECISION_LOG 2026-09-29 (opzione A
  Director); PLAN-018.
  **DECISION:** `resolvePartyConsequences` non è più la fonte delle
  conseguenze — il planner mostra il rischio che accadrà davvero.
- **RULE:** lo skill check può essere sforzo di gruppo presentato come un solo
  tiro: il verdetto è del gruppo, ferita/morte sono tirate **per slot**
  separatamente. Il verdetto modifica le chance **prima** dei tiri personali:
  `win` −5pp a morte e ferita; `fail`/`almost` neutri; `bigwin` downgrade
  morte→ferita; `epicfail` upgrade ferita→morte.
  **STATUS:** `vigente` (struttura) / `mock-S1` (quantità — OPEN-007).
  **SOURCE:** v24 rev.2; `context/QUEST_S1_DESIGN.md`.
- **RULE:** `epicfail` opera **dentro la banda di rischio dichiarata** per quel
  check (può portare ferita→morte solo dove M%>0 era visibile al commit) — mai
  oltre la banda. La scelta definisce il range, il dado modula dentro.
  **STATUS:** `vigente`. **SOURCE:** DECISION_LOG 2026-10-03. Da formalizzare
  come check-contract spec in S2.
- **RULE:** `almost` NON conta come fase superata: `isPassingVerdict` =
  `bigwin | win`; il near-miss resta narrativo.
  **STATUS:** `vigente`. **SOURCE:** DECISION_LOG 2026-09-29; v23 rev.3.
- **RULE:** solo il **morto** smette di contribuire alle fasi successive; il
  **ferito** resta nella spedizione, contribuisce normalmente e continua a
  tirare rischi con rischio aumentato.
  **STATUS:** `vigente`. **SOURCE:** DECISION_LOG 2026-09-29 («solo morto»);
  `context/QUEST_S1_DESIGN.md` (ferita = +rischio nei check successivi).
- **RULE:** il motore analitico del planner è **DP esatta sull'insieme dei
  vivi** (2^m insiemi × n fasi) — non Poisson-binomiale su probabilità fisse
  (`context/REJECTED.md` REJ-006). Monte Carlo = verifica secondaria con
  tolleranza.
  **STATUS:** `vigente` come contratto planner; la preview compound è aperta
  (OPEN-008). **SOURCE:** DECISION_LOG 2026-09-29.
- **RULE:** meccanica **cover**: slot/item/tag possono dichiarare
  `coverRiskDelta` (pp negativi) che riduce il rischio degli altri membri.
  **STATUS:** `vigente`. **SOURCE:** v23 rev.4 D1.
- **RULE:** `checkStatTags` separati dal gate + `partyStatMult` in
  `questSkillCheckConfig`.
  **STATUS:** `vigente`. **SOURCE:** v23 rev.4 D4.
- **RULE:** i **consumabili** formano un pool di party, applicati a ogni
  check, consumati al lancio. Nel total della simulation preview i
  consumabili sono ignorati (OPEN-008).
  **STATUS:** `vigente`. **SOURCE:** v23 rev.4 D3; DECISION_LOG 2026-09-30.

## 4. Bodyguard e death save

- **RULE:** lo slot opzionale `bodyguard` intercetta **solo** esiti
  ferita/morte generati dagli skill check — non eventi, spell, combattimenti o
  incidenti diretti di viaggio. Finché vivo intercetta tutto il danno da check
  (matrice S1: anche da ferito, anche su danni multipli).
  **STATUS:** `vigente`. **SOURCE:** v24 rev.2; `context/QUEST_S1_DESIGN.md`.
- **RULE:** su esito morte, un **death save** del 5% trasforma l'esito in
  «sopravvive ferito».
  **STATUS:** `mock-S1` — da calibrare al Gate A (OPEN-006).
  **SOURCE:** `context/QUEST_S1_DESIGN.md`; DECISION_LOG 2026-10-02.

## 5. Checkpoint, fuga e wipe

- **RULE:** il punto decisionale continua/ritirati sta **prima di ogni skill
  check rischioso** — non dopo ogni fase; conta «fase che può avere
  conseguenze di ferita, morte o perdita di HP».
  **STATUS:** `vigente`. **SOURCE:** v24 rev.1 p.6/p.9 (conferma Director);
  v23 rev.4 D2.
- **RULE:** fuga/ritirata = fallimento della quest, **ma il bottino raccolto
  resta**. Dopo l'obiettivo, «continua ad esplorare» espone le vite a rischio
  ma non perde l'acquisito; la regola leader-morto resta attiva.
  **STATUS:** `vigente`. **SOURCE:** v24 rev.1 p.11; rev.2; `context/QUEST_S1_DESIGN.md`.
  Danni extra in fuga: `open` (OPEN-009).
- **RULE:** wipe = tutti i membri morti → chiusura forzata `deadly`, **si
  perde tutto** (bottino incluso).
  **STATUS:** `vigente`. **SOURCE:** `context/QUEST_S1_DESIGN.md`; v23 rev.4 D2.
- **RULE:** la morte di un PG è **spesa di una risorsa PG** — scambiare
  risorse con risorse è parte del genere strategico.
  **STATUS:** `vigente`. **SOURCE:** DECISION_LOG 2026-10-01 (supera la riga
  «nessuna perdita definitiva» di Pillar 2, aggiornato).

## 6. Vittoria e reward

- **RULE:** la reward di quest è assegnata da una **prova-obiettivo precisa**
  e richiede il **leader vivo al ritorno** — anche se la prova-obiettivo era
  già riuscita. Bottino di fase e reward di quest sono categorie distinte:
  l'acquisito si tiene, le fasi vinte possono dare extra.
  **STATUS:** `vigente`. **SOURCE:** v24 rev.2; DECISION_LOG 2026-10-02.
  **DECISION:** sostituisce la soglia ≥50% come condizione di vittoria
  (REJ-002); sconfitta (fuga/obiettivo fallito) = nessuna reward di quest.
- **RULE:** la «% di riuscita» **dalla partenza** è compound: include rischi e
  percorsi prima dell'obiettivo, non solo la probabilità della prova finale.
  Nessun numero esatto inventato dove manca il modello.
  **STATUS:** `vigente`. **SOURCE:** v24 rev.2.
- **RULE / DIVERGENZA:** PLAN-018 implementa il calcolo a **soglia** e non è
  stato modificato automaticamente da rev.2 — la rimappatura è prevista dopo
  S1.
  **STATUS:** `divergenza-nota` — non risolta qui (OPEN-001).
  **SOURCE:** `plans/PLAN-018-mission-planner.md`; v24 rev.2 «relazione»;
  KNOWLEDGE_AUDIT C7.

## 7. Stat e competenze

- **RULE:** le stat `strength`/`agility`/`endurance`/`intelligence`/
  `perception` in `idleVillage/defaultConfig.ts` sono **mock**: la fonte di
  verità sono le stat del balancer (`balancer-default-config.json`,
  `STAT_DESCRIPTORS`). Il balancer non si tocca.
  **STATUS:** `vigente`. **SOURCE:** v24 rev.1 p.12–13; DECISION_LOG
  2026-10-01.
- **RULE:** le competenze di quest sono **derivate** dalle stat del balancer
  (Percezione ← `txc`, Forza ← `damage`, Costituzione ← `hp`, …).
  **STATUS:** `vigente` come direzione; mappatura completa `open` (OPEN-003).
  **SOURCE:** v24 rev.1 p.13.

## 8. Parcheggiato / non-regole

- **Noise meter:** parcheggiato — stealth-specific, non regola generica
  (REJ-001). Rimosso dal lab il 2026-10-03 (stati nominati
  `campoAllertato`/`campoSveglio`, commit `f7a55a73`).
- **Proposte villaggio** (leader-capacity, human-days, quest come
  opportunità): `proposta` — non ratificate, tracciate in OPEN-010 e R-083.
- **Criterio di diagnosi:** *«una quest infallibile è inutile; le scelte non
  sono scelte se non posso mai fallire»* — losabilità e attribuibilità del
  fallimento sono il requisito, non una percentuale target.
  **STATUS:** `vigente` (principio). **SOURCE:** DECISION_LOG 2026-10-03.

---

*Manutenzione: divergenza PLAN-018 ↔ v24 rev.2 (OPEN-001) da risolvere con
decisione Director in sessione gameplay, non in questo doc.*
