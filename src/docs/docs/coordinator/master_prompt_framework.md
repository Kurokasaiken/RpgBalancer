# Master Prompt + Child Pipeline Framework

## Overview

Framework per permettere agli agenti di lavorare su batch di prompt sequenziali senza creare singoli prompt monolitici. Il sistema si basa su un "Master Prompt" che orchestra i "Child Prompt" per task specifici, mantenendo compatibilità con il workflow esistente Strategist→Coordinator.

## Architettura

### Master Prompt
- **Scopo**: Planning e orchestrazione di batch complessi
- **Responsabilità**: Definire scope, prerequisiti, e sequenza di child prompt
- **Struttura**: Template con sezioni `Dipendenze`, `Prerequisiti`, `Scope`, `Safeguards`

### Child Prompt
- **Scopo**: Esecuzione di task specifici e ben definiti
- **Responsabilità**: Implementare singole attività del batch
- **Struttura**: Template con sezioni `Dipendenze`, `Output Atteso`, `Safeguards`

## Template Master Prompt

```markdown
# MASTER PROMPT: [Nome Batch]

## CONTESTO
- **Progetto**: RPG Balancer
- **Fase**: [Fase corrente]
- **Obiettivo**: [Descrizione obiettivo batch]

## SCOPE
Questo prompt orchestra l'esecuzione di [numero] child prompt per completare [descrizione lavoro].

## PREREQUISITI
- [Elenco prerequisiti tecnici]
- [Elenco prerequisiti di configurazione]
- [Elenco prerequisiti di dati]

## SEQUENZA CHILD PROMPT
1. [Nome Child 1] - [Breve descrizione]
2. [Nome Child 2] - [Breve descrizione]
3. [Nome Child 3] - [Breve descrizione]

## DIPENDENZE
- Child 1: [dipendenze specifiche]
- Child 2: [dipendenze specifiche]
- Child 3: [dipendenze specifiche]

## OUTPUT ATTESO
- [Descrizione output finale del batch]
- [Formato output richiesto]
- [Location output]

## SAFEGUARDS
- Verifica completamento child prompt prima di procedere
- Validazione output finale rispetto a requisiti
- Gestione errori e rollback procedure

## KANBAN STATUS
- **Padre**: [ID prompt padre]
- **Stato**: In corso
- **Child 1**: [ID child 1] - [stato]
- **Child 2**: [ID child 2] - [stato]
- **Child 3**: [ID child 3] - [stato]
```

## Template Child Prompt

```markdown
# CHILD PROMPT: [Nome Task]

## CONTESTO
- **Progetto**: RPG Balancer
- **Fase**: [Fase corrente]
- **Padre**: [ID Master Prompt]
- **Obiettivo**: [Descrizione obiettivo specifico]

## SCOPE
Questo prompt implementa [descrizione task specifico] come parte del batch [ID Master Prompt].

## PREREQUISITI
- [Elenco prerequisiti tecnici]
- [Elenco prerequisiti di configurazione]
- [Elenco prerequisiti di dati]

## DIPENDENZE
- [Elenco dipendenze da altri prompt]
- [Elenco dipendenze da componenti esterni]
- [Elenco dipendenze da dati]

## INPUT RICEVUTO
- [Descrizione input dal prompt padre]
- [Formato input ricevuto]
- [Location input]

## OUTPUT RICHIESTO
- [Descrizione output richiesto]
- [Formato output specifico]
- [Location output]

## IMPLEMENTAZIONE
[Sezione dettagliata implementazione]

## VERIFICA
- [Checklist verifica implementazione]
- [Test da eseguire]
- [Criteri di successo]

## SAFEGUARDS
- [Procedure di sicurezza]
- [Validazione output]
- [Gestione errori]

## KANBAN STATUS
- **Padre**: [ID Master Prompt]
- **Stato**: [stato corrente]
- **Output**: [location output prodotto]
```

## Regole di Utilizzo

### Quando Usare Master + Child
- **Batch sequenziali**: Lavori che richiedono più step consecutivi
- **Complessità elevata**: Task che richiedono specializzazione diversa
- **Parallelismo**: Task che possono essere eseguiti in parallelo dopo prerequisiti
- **Manutenibilità**: Codice che deve essere facilmente modificabile

### Quando NON Usare
- **Task singoli**: Lavori semplici che non richiedono orchestrazione
- **Urgenza**: Task che richiedono esecuzione immediata
- **Dipendenze semplici**: Lavori con poche dipendenze

## Numerazione Child Prompt

### Schema di Numerazione
```
[ID_MASTER]-child-[numero_sequenziale]
es: COORD-2025-01-12-batch-framework-child-001
```

### Ordinamento
- **Numerazione sequenziale**: 001, 002, 003, etc.
- **Prefisso coerente**: Sempre `[ID_MASTER]-child-`
- **Tracciabilità**: Facile tracciamento in Kanban

## Gestione Stato Kanban

### Stati Validi
- **Non assegnato**: Prompt non ancora iniziato
- **In corso**: Prompt in esecuzione
- **Completato**: Prompt completato con successo
- **Fallito**: Prompt fallito con errori
- **Bloccato**: Prompt bloccato da prerequisiti

### Dipendenze tra Prompt
```typescript
interface PromptDependency {
  childId: string;
  parentId: string;
  status: 'pending' | 'completed' | 'failed';
  blocking: boolean; // se blocca esecuzione del figlio
}
```

## Esempio Pratico

### Master Prompt: Implementazione Dashboard Analytics

```markdown
# MASTER PROMPT: dashboard-analytics-implementation

## CONTESTO
- **Progetto**: RPG Balancer
- **Fase**: Phase 12
- **Obiettivo**: Implementare dashboard analytics completo

## SCOPE
Questo prompt orchestra l'esecuzione di 3 child prompt per completare l'implementazione del dashboard analytics.

## PREREQUISITI
- Node.js 20.19.6 installato
- React 18+ configurato
- Tailwind CSS configurato
- Database PostgreSQL configurato

## SEQUENZA CHILD PROMPT
1. dashboard-analytics-backend - Implementazione API backend
2. dashboard-analytics-frontend - Implementazione UI React
3. dashboard-analytics-integration - Integrazione backend-frontend

## DIPENDENZE
- Child 1: Nessuna (primo task)
- Child 2: dashboard-analytics-backend (API completata)
- Child 3: dashboard-analytics-backend, dashboard-analytics-frontend (entrambi completati)

## OUTPUT ATTESO
- Dashboard analytics completo con backend e frontend
- Documentazione API in Swagger/OpenAPI
- Test di integrazione eseguiti con successo

## SAFEGUARDS
- Verifica completamento backend prima di iniziare frontend
- Test integrazione tra componenti
- Validazione requisiti funzionali

## KANBAN STATUS
- **Padre**: dashboard-analytics-implementation
- **Stato**: In corso
- **Child 1**: dashboard-analytics-backend - In corso
- **Child 2**: dashboard-analytics-frontend - Non assegnato
- **Child 3**: dashboard-analytics-integration - Non assegnato
```

### Child Prompt: Backend Implementation

```markdown
# CHILD PROMPT: dashboard-analytics-backend

## CONTESTO
- **Progetto**: RPG Balancer
- **Fase**: Phase 12
- **Padre**: dashboard-analytics-implementation
- **Obiettivo**: Implementare API backend per dashboard analytics

## SCOPE
Questo prompt implementa l'API backend per il dashboard analytics come parte del batch dashboard-analytics-implementation.

## PREREQUISITI
- Node.js 20.19.6 installato
- Express.js configurato
- PostgreSQL configurato
- TypeScript configurato

## DIPENDENZE
- Nessuna (primo task del batch)

## INPUT RICEVUTO
- Requisiti API dal prompt padre
- Schema database dal prompt padre
- Configurazione ambiente dal prompt padre

## OUTPUT RICHIESTO
- API RESTful completa
- Documentazione OpenAPI
- Test unitari eseguiti
- Database migrations eseguite

## IMPLEMENTAZIONE
[Sezione dettagliata implementazione API...]

## VERIFICA
- Test unitari passanti (>90% coverage)
- API documentation generata
- Database schema valido
- Performance test superati

## SAFEGUARDS
- Validazione input API
- Gestione errori centralizzata
- Logging completo
- Security headers configurati

## KANBAN STATUS
- **Padre**: dashboard-analytics-implementation
- **Stato**: Completato
- **Output**: /api/analytics
```

## Integrazione con Prompt-Check

### Schema Aggiornato
```json
{
  "promptId": "string",
  "parentId": "string",
  "type": "master|child",
  "status": "unassigned|in_progress|completed|failed|blocked",
  "dependencies": ["string"],
  "prerequisites": ["string"],
  "scope": "string",
  "safeguards": ["string"]
}
```

### Validazioni Aggiunte
- **parentId**: Obbligatorio per child prompt, null per master
- **dependencies**: Obbligatorio per child prompt, vuoto per master
- **type**: "master" o "child" per distinguere i due tipi
- **Sequenza**: Child prompts devono elencare dipendenze in ordine corretto

### CLI Commands
```bash
# Verifica prompt con dipendenze
npm run prompt:check -- ID_PROMPT

# Verifica batch completo
npm run prompt:check -- MASTER_PROMPT --check-dependencies

# Lista prompt figli di un master
npm run prompt:check -- MASTER_PROMPT --list-children
```

## Best Practices

### Struttura Master Prompt
- **Scope chiaro**: Definire esattamente cosa orchestra il batch
- **Prerequisiti espliciti**: Elencare tutte le dipendenze necessarie
- **Sequenza logica**: Ordinare child prompt in sequenza logica
- **Output definito**: Specificare esattamente cosa aspettarsi

### Struttura Child Prompt
- **Scope focalizzato**: Un solo task ben definito
- **Dipendenze chiare**: Elencare solo dipendenze necessarie
- **Output specifico**: Definire esattamente cosa produrre
- **Verifica completa**: Includere checklist di verifica

### Gestione Errori
- **Rollback procedure**: Definire come gestire fallimenti
- **Retry logic**: Specificare quando e come riprovare
- **Escalation**: Definire quando escalare problemi
- **Documentation**: Documentare procedure di risoluzione

## Troubleshooting

### Errori Comuni
- **Dipendenze mancanti**: Verificare che tutti i prerequisiti siano soddisfatti
- **Sequenza errata**: Controllare l'ordine dei child prompt
- **Output non conforme**: Validare output rispetto a requisiti
- **Timeout**: Gestire timeout per operazioni lunghe

### Debug Tips
- **Log dettagliato**: Aggiungere logging a ogni fase
- **Stato intermedio**: Salvare stato progresso tra child prompt
- **Snapshot output**: Salvare output intermedio per debug
- **Error context**: Catturare contesto completo degli errori

## Documentazione

### File da Creare
- `docs/coordinator/master_prompt_framework.md` (framework reference)
- `docs/coordinator/examples/` (esempi pratici)
- `docs/coordinator/troubleshooting/` (guida risoluzione problemi)

### File da Aggiornare
- `src/docs/docs/prompts/prompt_library.md` (esempi template)
- `src/docs/docs/coordinator/agent_assignments.md` (istruzioni utilizzo)
- `scripts/prompt/prompt-check/schema.json` (schema validazione)

### Test da Creare
- `tests/cli/promptCheck/masterPrompt.test.ts` (test framework)
- `tests/cli/promptCheck/childPrompt.test.ts` (test child prompt)
- `tests/cli/promptCheck/batchWorkflow.test.ts` (test batch completo)

## Roadmap

### Fase 1: Framework Base
- [x] Definizione architettura master/child
- [x] Template master e child prompt
- [x] Schema validazione prompt-check
- [ ] Implementazione CLI enhancements

### Fase 2: Integrazione
- [ ] Integrazione con Kanban esistente
- [ ] Test suite completo
- [ ] Documentazione completa
- [ ] Esempi pratici di utilizzo

### Fase 3: Advanced Features
- [ ] Parallel execution support
- [ ] Dynamic dependency resolution
- [ ] Rollback automation
- [ ] Performance monitoring

## Conclusion

Il Master Prompt + Child Pipeline Framework fornisce agli agenti di gestire batch complessi in modo strutturato e manutenibile, mantenendo compatibilità con il workflow esistente. Il sistema promuove specializzazione, tracciabilità e qualità del codice attraverso la scomposizione di problemi complessi in task gestibili.

---

**Framework Status**: Pronto per implementazione  
**Compatibilità**: Completamente compatibile con KS-005  
**Mantenimento**: Facilitato da struttura modulare  
**Scalabilità**: Supporta batch di qualsiasi complessità
