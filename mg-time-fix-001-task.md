| MG-TIME-FIX-001 - Fix Minimal Gameplay time loop and cycle progress runtime model | Non assegnato | - | - | Time accelerates progressively, cycleProgress semantics wrong, duplicate scheduling + incorrect tick semantics |
```text
AGENT
Idle Village Engine Specialist - Time Systems

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Ripristinare un modello temporale corretto e stabile per MinimalGameplayPage in modo che il tempo non acceleri durante il runtime e cycleProgress rifletta la progressione realistica del tempo di gioco.

PROMPT READINESS
FILE TARGET
- [esistente] src/ui/idleVillage/MinimalGameplayPage.tsx
- [esistente] src/store/useMinimalGameplay.ts
- [esistente] src/ui/idleVillage/components/minimal/TemporaryTimeStatus.tsx

STYLE LAB PRESET
- N/A (task backend di timing)

TEST ROUTE QA
- Obbligatorio: /minimal-gameplay per verifica runtime manuale

DATO DI ORIGINE
- Runtime debugging da Minimal Gameplay: il tempo accelera progressivamente, la semantica di cycleProgress è errata, e il codice attuale mostra scheduling duplicato + semantica tick errata.

DIPENDENZE
- -

OPERAZIONI DA ESEGUIRE
1. **Fix Runtime Loop**: Correggere il runtime loop di MinimalGameplayPage in modo che esista solo un timeout/tick chain attivo alla volta.
2. **Cleanup Proper**: Aggiungere cleanup corretto per il timeout chain attivo su effect rerun/unmount/pause transitions.
3. **Safe State Reading**: Assicurarsi che il runtime loop legga lo stato corrente del store in modo sicuro e non si basi su stale closure state per decisioni pause/tick timing.
4. **Fix tick() Speed**: In useMinimalGameplay.ts, aggiornare tick() in modo che deltaTimeUnits usi correttamente speedMultiplier.
5. **Recalculate cycleProgress**: Ricalcolare isDayPhase e cycleProgress ad ogni tick, non solo durante la transizione giorno.
6. **Separate Concerns**: Mantenere gli effetti collaterali/telemetry della transizione giorno separati dal calcolo per-tick di cycleProgress.
7. **Preserve Config-First**: Mantenere dayTimeUnits/nightTimeUnits come valori di design a meno che non ci sia una ragione provata altrimenti.
8. **Update TemporaryTimeStatus**: Mantenere TemporaryTimeStatus minimale, ma assicurarsi che rifletta lo stato runtime corretto.

OPERAZIONI VIETATE
- Vietato "fixare" il problema solo gonfiando dayTimeUnits/nightTimeUnits.
- Vietato ridisegnare l'intero sistema temporale.
- Vietato introdurre una seconda fonte di timing.
- Vietato rivendicare il completamento solo dal successo di build/test.
- Vietato lavorare su POI assignment o altre funzionalità gameplay in questo task.

ASSUNZIONI
- useMinimalGameplay store è la fonte autorevole dello stato temporale per MinimalGameplayPage.
- Il modello previsto è 1 tick al secondo con speedMultiplier che influenza l'avanzamento del tempo di gioco per tick.
- TemporaryTimeStatus è display-only e non dovrebbe possedere logica di timing.

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage/MinimalGameplayPage.tsx src/store/useMinimalGameplay.ts src/ui/idleVillage/components/minimal/TemporaryTimeStatus.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia media.
- Apri un blocker solo se esiste un'altra fonte di timing nascosta che impedisce di stabilire un singolo loop autorevole.

KANBAN COMPLETION
1. Stato Kanban -> "Completato" con data.
2. Evidence `test-results/mg-time-fix-001-<YYYY-MM-DD>.log`.
3. Il report finale deve includere verifica runtime, non solo claim di codice/build.

NOTE
- La verifica manuale del percorso utente è la fonte di verità se i controlli automatizzati sono in disaccordo.
- Per questo task, il completamento richiede di provare:
  - il tempo non accelera più durante il runtime
  - la pausa ferma la progressione
  - il riavvio riparte senza loop duplicati
  - i cambiamenti di velocità non impilano timer
  - cycleProgress avanza in modo fluido e corretto ad ogni tick
- System reuse first: non creare nuove astrazioni di timing se il fix può essere fatto all'interno del wiring pagina/store esistente.

ANTI-STALL DIRECTIVE
Procedi autonomamente: non attendere conferme aggiuntive salvo istruzioni contrarie esplicite.

RUNTIME VERIFICATION REQUIRED
Report queste verità runtime esatte:
1. Qual era la causa esatta dell'accelerazione?
2. Quale timeout/timer chain attivo è stato rimosso o stabilizzato?
3. Qual è la formula esatta di deltaTimeUnits dopo il fix?
4. speedMultiplier è ora effettivamente usato in tick()? Sì/No
5. cycleProgress è ricalcolato ad ogni tick? Sì/No
6. Passi di verifica manuale:
   - apri /minimal-gameplay
   - osserva velocità 1x per almeno 30 secondi
   - verifica nessuna accelerazione nel tempo
   - metti in pausa e conferma il freeze
   - riprendi e conferma il riavvio pulito
   - cambia velocità e conferma nessun loop stacking
7. Fornisci il risultato runtime osservato effettivo per ogni passo.

EVIDENCE LOG
- test-results/mg-time-fix-001-<YYYY-MM-DD>.log
```
