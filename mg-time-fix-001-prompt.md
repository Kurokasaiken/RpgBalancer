| MG-TIME-FIX-001 - Fix accelerating time loop in MinimalGameplayPage runtime | Non assegnato | - | - | Time progression becomes faster and faster as page runs - need to identify and eliminate duplicate scheduling |
```text
AGENT
Idle Village Engine Specialist - Time Systems

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Ripristinare un'unica fonte stabile di progressione del tempo in MinimalGameplayPage in modo che i giorni di gioco e il progresso del ciclo avanzino alla velocità prevista senza accelerazione composta.

PROMPT READINESS
FILE TARGET
- [esistente] src/ui/idleVillage/MinimalGameplayPage.tsx
- [esistente] src/ui/idleVillage/hooks/useMinimalGameplay.ts
- [esistente] src/engine/game/idleVillage/TimeEngine.ts
- [esistente] src/store/useMinimalGameplay.ts
- [esistente] src/balancing/config/idleVillage/minimalConfig.ts

STYLE LAB PRESET
- N/A (task backend di timing)

TEST ROUTE QA
- N/A (task su /minimal-gameplay, non /test)

DATO DI ORIGINE
- Documento: User request "Fix accelerating time loop in MinimalGameplayPage runtime" - runtime testing shows time becomes faster and faster indicating duplicated/compounding tick scheduling

DIPENDENZE
- MG-01 (Minimal Gameplay Hook & HUD) - deve essere completato per avere il contesto di gioco

OPERAZIONI DA ESEGUIRE
1. **Identificazione Fonti Timing**: Mappare ogni sorgente attiva di tempo/tick che affecting MinimalGameplayPage:
   - TimeEngine hooks e timer
   - useMinimalGameplay store scheduling
   - React useEffect timing loops
   - Qualsiasi director/engine timing esterno

2. **Determinazione Fonte Autorevole**: Confermare quale sorgente è intesa come autorevole per la progressione del tempo

3. **Rimozione Duplicati**: Disabilitare/rimuovere scheduling duplicato o parallelo che causa accelerazione composta

4. **Stabilizzazione Singola Fonte**: Assicurare che solo una sorgente reale di progressione runtime rimanga attiva

5. **Validazione Comportamento**: Verificare che:
   - Tempo non accelera durante il runtime
   - Progressione giorni rimane stabile
   - cycleProgress avanza a velocità costante
   - Pause congela la progressione
   - Resume riprende senza duplicazione
   - Cambi velocità non creano timer extra

6. **Test Runtime**: Eseguire verifica manuale per 30-60 secondi per confermare stabilità

OPERAZIONI VIETATE
- Vietato ridisegnare l'intero sistema temporale
- Vietato lavorare su POI assignment in questo task
- Vietato aggiungere UI timing fake
- Vietato introdurre nuovi timer o loop paralleli

ASSUNZIONI
- Il sistema ha una singola fonte autorevole di timing che deve essere preservata
- I valori config-first in minimalConfig.ts devono essere mantenuti
- Il problema è duplicazione/compounding, non progettazione del sistema

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage/MinimalGameplayPage.tsx src/ui/idleVillage/hooks/useMinimalGameplay.ts src/engine/game/idleVillage/TimeEngine.ts src/store/useMinimalGameplay.ts`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia alta; apri blocker solo se non è possibile identificare la fonte autorevole del timing

KANBAN COMPLETION
1. Stato Kanban -> "Completato" con data odierna
2. Evidence: `test-results/mg-time-fix-001-<YYYY-MM-DD>.log`
3. Report con: root cause, files touched, fonte timing mantenuta, duplicati rimossi, risultato verifica runtime

NOTE
- Focus su fix minimale per rimuovere scheduling duplicato
- Preservare valori config-first esistenti
- Documentare quale fonte timing è stata mantenuta come autorevole

ANTI-STALL DIRECTIVE
Procedi autonomamente: non attendere conferme aggiuntive salvo istruzioni contrarie esplicite.

EVIDENCE LOG
- test-results/mg-time-fix-001-<YYYY-MM-DD>.log
```
