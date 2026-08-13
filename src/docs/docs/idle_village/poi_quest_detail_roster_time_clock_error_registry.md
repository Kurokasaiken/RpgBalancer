---
title: Registro Errori — Pagina POI Quest Detail/Roster/Time/Clock
status: draft
updated: 2026-08-13
type: error-registry
---

# Registro errori — `/poi-quest-detail-roster-time-clock`

> Registro dei difetti/behaviour mismatch trovati nella pagina. Ogni riga ha un ID, una descrizione, la fonte della scoperta (static review / runtime), e lo stato. I fix sono pianificati, non eseguiti in questo turno.

## Errori confermati / mismatch rispetto al workflow desiderato

| ID | Area | Descrizione | Workflow ref | Stato |
|---|---|---|---|---|
| ERR-001 | POI detail | Il POI detail di quest non mette automaticamente il gioco in pausa all'apertura | §4.3 | aperto |
| ERR-002 | Posizionamento pannelli | I pannelli fluttuanti non si aprono centrati rispetto al viewport della mappa; alcuni escono fuori area o sono posizionati rispetto allo schermo intero | §4.4 | aperto |
| ERR-003 | POI detail estetica | Sono state aggiunte cromature/elementi estetici al POI detail che non fanno parte del contratto di `/poi-quest-detail-roster-integration`; mancano invece funzionalità base | §4.3 | aperto |
| ERR-004 | Start CTA | Il pulsante Start/Embark non ha il restyling visivo richiesto | §4.5 | aperto |
| ERR-005 | Start gating | `Start` non verifica esplicitamente che il tempo scorra (non in pausa) prima di far partire la quest; il check dipende dal `useEffect` del countdown | §4.5 | aperto |
| ERR-006 | Magic Circle Halo | Il cerchio magico deve iniziare dalle 12 e andare in senso orario; verificare che `timerDirection` non sia invertito per il POI quest e che non ci siano tracce preesistenti prima dell'avvio | §5.2 | aperto |
| ERR-007 | Quest success threshold | Verificare che `resolveQuestOutcomeTier`/`QuestPowerEngine` usi la regola `successi >= fasi_totali / 2` (metà inclusa) e non maggioranza semplice | §5.4 | aperto |
| ERR-008 | MilestoneCheckModal / Astrolabe | Lo skill check deve usare la V2 di `DestinyAstrolabeComponent` e passare i valori veri della fase (skill, morte/ferita, modificatori) | §5.3 | aperto |
| ERR-009 | Quest inerte pre-start | Verificare che il `QuestPOI` non disegni l'halo e non risponda ai tick finché tutti gli slot obbligatori non sono assegnati e non è stato premuto Start | §4.2 | aperto |
| ERR-010 | Auto-assign / bloom POI | Verificare che il `QuestPOI` faccia bloom `valid`/`invalid` esattamente con la stessa logica del `ResidentSlotRack` e che il click-to-assign scelga il primo slot accettante | §4.1 | aperto |
| ERR-011 | QuestChronicle opening | Dopo lo start, il click sul POI deve aprire `QuestChronicle` invece del POI detail; verificare che lo stato `isQuestCardOpen`/`isQuestRunning` commutino correttamente | §5.1 | aperto |
| ERR-012 | FloatingPanel draggability | Il POI detail usa `FloatingPanel`, ma va verificato che l'intestazione sia draggabile e che non ci siano elementi extra che catturano i pointer events | §4.3 | aperto |

## Errori sospetti / da verificare in runtime

| ID | Area | Descrizione | Come verificare | Stato |
|---|---|---|---|---|
| ERR-013 | Resident release | Dopo la raccolta ricompense, i residenti devono tornare disponibili nel roster; verificare che `handleClear` venga chiamato per tutti gli slot e non solo per quelli visibili | Avviare e completare una quest | aperto |
| ERR-014 | Milestone auto-resolve | Se `QuestChronicle` è chiusa quando scatta una milestone, la fase deve risolversi fuori scena; verificare che `isMilestoneMinimized` o la chiusura della card non blocchino `useMilestoneEngine` | Chiudere la card e aspettare una milestone | aperto |
| ERR-015 | Pausa e slot swap | Durante la pausa, dopo Start, i pg possono essere tolti/scambiati; verificare che il countdown non avanzi e che non si rompa lo stato | Avviare, mettere in pausa, rimuovere pg | aperto |
| ERR-016 | Reward panel | `QuestRewardPanel` deve mostrare XP per i pg partecipanti; verificare che il payload contenga `xp` per ogni residente assegnato | Completare una quest con successo | aperto |

## Note

- Il registro è vivo: ogni fix dovrà aggiornare lo stato in questo file e produrre evidenza.
- Prossimo passo: smoke test / runtime review della pagina per confermare gli errori e aggiungerne di nuovi.
