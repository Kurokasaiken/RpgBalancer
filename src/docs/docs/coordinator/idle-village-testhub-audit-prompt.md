# Idle Village TestHub Audit Prompt

**Objective:** Audit completo del TestHub Idle Village per verificare integrazioni, test coverage, e identificare gap.

## Task Instructions

### 1. Audit delle Pagine TestHub

Per ogni pagina elencata in `src/ui/idleVillage/TestHub.tsx`:

1. **Leggi il file della pagina wrapper** (es. `src/pages/minimal-*.tsx`)
2. **Leggi il componente principale** montato nella pagina (es. `src/ui/idleVillage/pages/*Page.tsx`)
3. **Verifica se esistono test E2E** in `tests/e2e/idleVillage/`
4. **Analizza l'integrazione**:
   - Cosa dovrebbe fare la pagina?
   - Quali componenti usa?
   - Quali dati/consuma?
   - Quali azioni permette?
5. **Verifica se l'integrazione funziona davvero**:
   - I componenti sono collegati correttamente?
   - I dati fluiscono come previsto?
   - Le azioni producono l'output atteso?
   - Ci sono errori TypeScript o runtime?

### 2. Verifica dei Test E2E

Per ogni test E2E esistente:

1. **Leggi il file di test** (es. `tests/e2e/idleVillage/*.spec.ts`)
2. **Verifica la copertura**:
   - Testa tutte le funzionalità principali?
   - Testa gli edge cases?
   - Testa le interazioni drag & drop?
   - Testa i controlli time engine?
3. **Verifica se i test hanno senso**:
   - I test sono chiari e leggibili?
   - I test verificano ciò che dovrebbero?
   - I test sono troppo specifici o troppo generici?
4. **Identifica test mancanti**:
   - Quali funzionalità non sono testate?
   - Quali edge cases non sono coperti?

### 3. Identificazione Elementi Mancanti

Analizza il piano `src/docs/docs/plans/idle_village_plan.md` e identifica:

1. **Componenti UI mancanti** che dovrebbero essere nel TestHub:
   - ResourceHUD
   - QuestCard
   - SkillCheck
   - OutcomeModal
   - MarketActionCard
   - Altri componenti menzionati nel piano

2. **Integrazioni mancanti**:
   - Quali combinazioni di componenti non sono ancora testate?
   - Quali flussi di lavoro non sono ancora coperti?

3. **Pagine di integrazione mancanti**:
   - Quali integrazioni dovrebbero avere una pagina dedicata?
   - Quali integrazioni sono incomplete?

### 4. Proposte di Miglioramento

Per ogni componente/pagina analizzata:

1. **Estetica**:
   - Lo stile è coerente con il tema Gilded Observatory?
   - Usa i token Style Laboratory?
   - Il layout è responsive?
   - Ci sono problemi di accessibilità?

2. **Funzionalità**:
   - Il componente fa ciò che dovrebbe fare?
   - Ci sono bug o comportamenti inattesi?
   - L'UX è intuitiva?
   - Ci sono miglioramenti possibili?

3. **Codice**:
   - Il codice è pulito e manutenibile?
   - Segue le best practices?
   - È config-first?
   - Usa PersistenceService e trackTelemetryEvent?

## Deliverables

### Report Strutturato

Produci un report con le seguenti sezioni:

#### 1. Audit Pagine TestHub
Per ogni pagina:
- **Nome**: Titolo della pagina
- **Path**: Route della pagina
- **Componente Principale**: Nome del componente montato
- **Funzionalità**: Cosa dovrebbe fare
- **Integrazione**: Componenti usati, dati consumati
- **Test E2E**: Esistenti (Sì/No) - Se Sì, lista dei test
- **Stato Integrazione**: ✅ Funziona / ⚠️ Parziale / ❌ Non funziona
- **Problemi Identificati**: Lista di problemi
- **Proposte di Miglioramento**: Lista di suggerimenti

#### 2. Verifica Test E2E
Per ogni test:
- **Nome**: Nome del file di test
- **Copertura**: % di funzionalità coperte (stima)
- **Qualità**: ✅ Buona / ⚠️ Accettabile / ❌ Scarsa
- **Test Mancanti**: Lista di test da aggiungere
- **Problemi Identificati**: Lista di problemi

#### 3. Elementi Mancanti
- **Componenti UI da Aggiungere**: Lista con priorità
- **Integrazioni da Creare**: Lista con priorità
- **Pagine di Integrazione da Aggiungere**: Lista con priorità

#### 4. Proposte di Miglioramento
Per ogni componente/pagina:
- **Estetica**: Suggerimenti specifici
- **Funzionalità**: Suggerimenti specifici
- **Codice**: Suggerimenti specifici

#### 5. Priorità e Roadmap
- **Alta Priorità**: Elementi critici da implementare subito
- **Media Priorità**: Elementi importanti ma non urgenti
- **Bassa Priorità**: Elementi nice-to-have

## Contesto Importante

### File di Riferimento
- `src/ui/idleVillage/TestHub.tsx` - Lista delle pagine test
- `src/docs/docs/plans/idle_village_plan.md` - Piano completo Idle Village
- `src/balancing/config/idleVillage/defaultConfig.ts` - Configurazione jobs/quest
- `src/docs/docs/idle_village/roster_trusted_components.md` - Componenti roster approvati

### Filosofia del Progetto
- **Config-first**: Tutti i valori devono provenire da config
- **Style Laboratory**: Usare token per coerenza estetica
- **PersistenceService**: Usare solo PersistenceService per persistenza
- **Telemetry**: Usare trackTelemetryEvent per telemetria
- **Drag & Drop**: Usare dnd-kit con helper esistenti

### Componenti Approvati
- Consulta `src/docs/docs/idle_village/roster_trusted_components.md` prima di proporre nuovi componenti roster
- Riutilizza componenti esistenti in `src/ui/idleVillage/components/`

## Esempio di Output

```markdown
## 1. Audit Pagine TestHub

### PgCard Template
- **Nome**: PgCard Template
- **Path**: /template-pgcard
- **Componente Principale**: PgCardTemplate
- **Funzionalità**: Template PgCard con drag & drop pre-configurato
- **Integrazione**: Usa PgToken, dnd-kit, Style Lab tokens
- **Test E2E**: ❌ Nessuno
- **Stato Integrazione**: ✅ Funziona
- **Problemi Identificati**: 
  - Mancano test E2E
  - Il drag & drop non è testato
- **Proposte di Miglioramento**:
  - Aggiungere test E2E per drag & drop
  - Migliorare responsività su mobile
```

## Note Aggiuntive

- Sii specifico nelle tue osservazioni
- Fornisci esempi concreti quando possibile
- Priorizza i problemi critici
- Suggerisci soluzioni pratiche
- Considera l'impatto sull'UX e sulla manutenibilità
