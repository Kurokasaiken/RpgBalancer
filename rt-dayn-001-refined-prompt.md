# RT-DAYN-001 (Refined) - Day/Night Runtime Alignment (Audit & Fix Approach)

```text
AGENT
Idle Village Runtime Alignment Specialist - Day/Night (Audit & Fix)

ISTRUZIONI AGENTE
Sei un agente Windsurf: consulta la skill `agent-execution-mandate` prima di iniziare, segui il mandato, completa la safeguard suite ed esegui le consegne Kanban.

OBIETTIVO
Audire l'implementazione day/night esistente, confrontarla con il trusted contract, e correggere solo le discrepanze preservando l'implementazione di riferimento candidate.

PROMPT READINESS
FILE TARGET
- [esistente] src/ui/idleVillage/components/minimal/DayNightPOI.tsx (AUDIT)
- [esistente] src/ui/idleVillage/components/minimal/DayNightPoiSkin.tsx (AUDIT)
- [esistente] src/ui/idleVillage/skins/dayNightPoiSkinConfig.ts (AUDIT)
- [esistente] src/ui/idleVillage/map/actionCards/DayNightActionCard.tsx (AUDIT)

STYLE LAB PRESET
- N/A (task runtime alignment)

TEST ROUTE QA
- Obbligatorio: /minimal-gameplay per verifica day/night integration
- Opzionale: /idle-village per verifica day/night secondary integration

DATO DI ORIGINE
- Trusted Doc: src/docs/docs/idle_village/trusted/daynight_trusted.md
- Piano: Runtime Component Alignment Plan - Task RT-DAYN-001 (Refined)

DIPENDENZE
- RT-TIME-001 deve essere completato (TimeEngine allineato)

OPERAZIONI DA ESEGUIRE
1. **Audit Current Implementation**: Identificare i file che implementano effettivamente il day/night runtime:
   - Mappare il percorso completo da useMinimalGameplay fino al rendering visivo
   - Identificare tutti i componenti coinvolti nella catena di rendering
   - Documentare l'implementazione corrente come candidate reference

2. **Compare Against Trusted Contract**: Confrontare l'implementazione esistente con daynight_trusted.md:
   - Verificare che tutti i requisiti "Deve" siano soddisfatti
   - Identificare le discrepanze rispetto al trusted contract
   - Verificare che le configurazioni siano corrette

3. **Preserve Correct Parts**: Mantenere intatta l'implementazione che è già conforme:
   - Non modificare componenti che seguono correttamente il contratto
   - Preservare il comportamento visivo esistente se è corretto
   - Mantenere l'integrazione con useMinimalGameplay se funzionante

4. **Fix Only Mismatches**: Correggere solo le discrepanze identificate:
   - Allineare solo i file che non rispettano il trusted contract
   - Correggere solo le configurazioni errate
   - Aggiungere solo le funzionalità mancanti dal contract

5. **Verify Integration**: Assicurarsi che le correzioni mantengano l'integrazione:
   - Testare che /minimal-gameplay funzioni correttamente dopo le modifiche
   - Verificare che useMinimalGameplay state sia letto correttamente
   - Assicurarsi che il ciclo giorno/notte funzioni come previsto

6. **Document Changes**: Documentare le modifiche apportate:
   - Elencare le discrepanze trovate e corrette
   - Spiegare perché l'implementazione originale è stata mantenuta
   - Fornire evidence del contract compliance

OPERAZIONI VIETATE
- Vietato reinventare day/night da zero
- Vietato sostituire un'implementazione quasi-corretta con una nuova approssimazione
- Vietato modificare componenti che già seguono il trusted contract
- Vietato rompere il riferimento visivo corrente se è già vicino al comportamento atteso
- Vietato aggiungere nuove funzionalità non nel trusted doc
- Vietato modificare TimeEngine state direttamente

ASSUNZIONI
- L'implementazione day/night esistente è considerata approssimativamente corretta
- DayNightPOI.tsx e componenti correlati esistono e funzionano
- Il trusted contract definisce i requisiti corretti
- useMinimalGameplay fornisce lo stato temporale corretto

REGRESSION SAFEGUARDS
- `npm run lint -- src/ui/idleVillage/components/minimal/DayNightPOI.tsx`
- `npm run lint -- src/ui/idleVillage/components/minimal/DayNightPoiSkin.tsx`
- `npm run lint -- src/ui/idleVillage/skins/dayNightPoiSkinConfig.ts`
- `npm run lint -- src/ui/idleVillage/map/actionCards/DayNightActionCard.tsx`
- `npm run build:check`
- `npm run kanban:lint`

AUTONOMIA & CHECK-IN
- Autonomia alta; apri blocker solo se l'implementazione corrente non è analizzabile

KANBAN COMPLETION
1. Stato Kanban -> "Completato" con data odierna
2. Evidence: `test-results/rt-dayn-001-alignment-<YYYY-MM-DD>.log`
3. Report finale con: audit completato, discrepanze corrette, candidate reference preservata

NOTE
- Seguire filosofia governance: trusted docs sono single source of truth
- Audit & Fix approach: preservare l'implementazione esistente che funziona
- Candidate reference: trattare l'implementazione corrente come riferimento da correggere, non da sostituire
- Minimal changes: correggere solo ciò che è necessario per il contract compliance

ANTI-STALL DIRECTIVE
Procedi autonomamente: non attendere conferme aggiuntive salvo istruzioni contrarie esplicite.

EVIDENCE LOG
- test-results/rt-dayn-001-alignment-<YYYY-MM-DD>.log
```

## Key Changes from Original

### 1. **Audit & Fix Approach**
- **Original**: Generic alignment approach
- **Refined**: Explicit audit of current implementation as candidate reference

### 2. **Preserve Correct Implementation**
- **Original**: "Align day/night runtime with trusted contract"
- **Refined**: "Preserve correct parts, fix only mismatches"

### 3. **Explicit Forbidden Outcomes**
- **Original**: Generic "don't modify core logic"
- **Refined**: Specific prohibitions against reinvention and replacement

### 4. **Implementation Discovery**
- **Original**: Assume file targets
- **Refined**: Audit to discover actual runtime path

### 5. **Evidence Requirements**
- **Original**: Generic contract compliance
- **Refined**: Document what was preserved vs what was fixed

This refined prompt treats the existing day/night implementation as a **candidate reference** that should be audited and minimally corrected rather than redesigned.
