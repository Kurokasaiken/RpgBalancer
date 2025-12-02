# Config-Driven Balancer - Tasks

> **Plan:** [config_driven_balancer_plan.md](config_driven_balancer_plan.md)  
> **Stato:** 📋 In Progress  
> **Effort stimato:** 12-16 ore

---

## Phase 1: Schema e Store (2-3h)

### 1.1 TypeScript Interfaces
- [ ] Creare `src/balancing/config/types.ts`
- [ ] Definire `StatDefinition` interface
- [ ] Definire `CardDefinition` interface
- [ ] Definire `BalancerPreset` interface
- [ ] Definire `BalancerConfig` interface
- [ ] Definire `ConfigSnapshot` interface
- [ ] Export tutti i tipi

### 1.2 Zod Validation Schemas
- [ ] Creare `src/balancing/config/schemas.ts`
- [ ] Implementare `StatDefinitionSchema` con refinements
- [ ] Implementare `CardDefinitionSchema`
- [ ] Implementare `BalancerPresetSchema`
- [ ] Implementare `BalancerConfigSchema`
- [ ] Aggiungere validazione min <= max
- [ ] Aggiungere validazione defaultValue in range
- [ ] Aggiungere validazione formula required se isDerived

### 1.3 Default Config
- [ ] Creare `src/balancing/config/defaultConfig.ts`
- [ ] Definire `CORE_STATS` (hp, damage, htk)
- [ ] Definire `CORE_CARD`
- [ ] Definire `DEFAULT_PRESET`
- [ ] Definire `DEFAULT_CONFIG` completo
- [ ] Implementare `isCoreStat()` helper
- [ ] Implementare `isCoreCard()` helper

### 1.4 Formula Engine
- [ ] Creare `src/balancing/config/FormulaEngine.ts`
- [ ] Implementare `extractIdentifiers()` per parsing
- [ ] Implementare `validateFormula()` con error messages
- [ ] Implementare `executeFormula()` per runtime
- [ ] Implementare `suggestCompletions()` per autocomplete
- [ ] Definire `SUPPORTED_OPERATORS` (estensibile)
- [ ] Definire `SUPPORTED_FUNCTIONS` (estensibile)
- [ ] Aggiungere protezione XSS/injection

### 1.5 Config Store
- [ ] Creare `src/balancing/config/BalancerConfigStore.ts`
- [ ] Implementare `load()` con fallback a defaults
- [ ] Implementare `save()` con validazione
- [ ] Implementare `addToHistory()` con limit 10
- [ ] Implementare `getHistory()`
- [ ] Implementare `restore()` da timestamp
- [ ] Implementare `undo()`
- [ ] Implementare `mergeWithDefaults()` per garantire core
- [ ] Implementare `reset()`
- [ ] Implementare `export()` JSON
- [ ] Implementare `import()` JSON con validazione

---

## Phase 2: React Hook (1-2h)

### 2.1 useBalancerConfig Hook
- [ ] Creare `src/balancing/hooks/useBalancerConfig.ts`
- [ ] Implementare state management con useState
- [ ] Implementare `refreshState()` helper
- [ ] Implementare `saveConfig()` helper

### 2.2 Stat CRUD
- [ ] Implementare `addStat()` con validazione
- [ ] Implementare `updateStat()` con validazione
- [ ] Implementare `deleteStat()` con check core e formula usage
- [ ] Gestire errori e return ValidationResult

### 2.3 Card CRUD
- [ ] Implementare `addCard()` con auto-order
- [ ] Implementare `updateCard()`
- [ ] Implementare `deleteCard()` con cascade delete stats
- [ ] Implementare `reorderCards()` per drag & drop

### 2.4 Preset Management
- [ ] Implementare `switchPreset()`
- [ ] Implementare `createPreset()`
- [ ] Implementare `deletePreset()` con check built-in
- [ ] Implementare `duplicatePreset()`

### 2.5 Utilities
- [ ] Implementare `validateStatFormula()` wrapper
- [ ] Implementare `undo()` wrapper
- [ ] Implementare `canUndo` computed
- [ ] Implementare `exportConfig()` wrapper
- [ ] Implementare `importConfig()` wrapper
- [ ] Implementare `resetConfig()` wrapper

---

## Phase 3: UI Editor Components (3-4h)

### 3.1 Dependencies
- [ ] Installare `@dnd-kit/core`
- [ ] Installare `@dnd-kit/sortable`
- [ ] Installare `@dnd-kit/utilities`

### 3.2 ConfigToolbar
- [ ] Creare `src/ui/balancing/ConfigToolbar.tsx`
- [ ] Aggiungere PresetSelector dropdown
- [ ] Aggiungere "+ Add Card" button
- [ ] Aggiungere "Undo" button con disabled state
- [ ] Aggiungere "Export" button
- [ ] Aggiungere "Import" button con file input
- [ ] Aggiungere "Reset" button con conferma
- [ ] Stilizzare con tema Gilded Observatory

### 3.3 CardEditor Drawer
- [ ] Creare `src/ui/balancing/CardEditor.tsx`
- [ ] Implementare drawer laterale (slide da destra)
- [ ] Campo ID (auto-generato o readonly)
- [ ] Campo Title (text input)
- [ ] Campo Color (dropdown predefinito)
- [ ] Campo Icon (emoji/text input)
- [ ] Bottoni Save/Cancel
- [ ] Validazione real-time
- [ ] Feedback errori (bordo rosso)
- [ ] Stilizzare con tema Gilded Observatory

### 3.4 StatEditor Drawer
- [ ] Creare `src/ui/balancing/StatEditor.tsx`
- [ ] Implementare drawer laterale
- [ ] Campo ID (auto-generato o readonly)
- [ ] Campo Label (text input)
- [ ] Campo Description (textarea)
- [ ] Campo Type (dropdown number/percentage)
- [ ] Campi Min/Max/Step (number inputs)
- [ ] Campo Default Value (number input)
- [ ] Campo Weight (number input)
- [ ] Checkbox "Is Derived?"
- [ ] FormulaEditor (visibile se isDerived)
- [ ] Campo Background Color (dropdown)
- [ ] Bottoni Save/Cancel
- [ ] Validazione real-time
- [ ] Stilizzare con tema Gilded Observatory

### 3.5 FormulaEditor
- [ ] Creare `src/ui/balancing/FormulaEditor.tsx`
- [ ] Textarea per formula
- [ ] Validazione real-time mentre digita
- [ ] Bordo verde se valido
- [ ] Bordo rosso se errore
- [ ] Tooltip/messaggio errore specifico
- [ ] Lista stat disponibili come riferimento
- [ ] Stilizzare con tema Gilded Observatory

### 3.6 ConfigurableCard
- [ ] Creare `src/ui/balancing/ConfigurableCard.tsx`
- [ ] DragHandle (⋮⋮) per drag & drop
- [ ] Title editabile inline
- [ ] "+ Add Stat" button
- [ ] "Delete Card" button (solo se !isCore)
- [ ] Conferma eliminazione dialog
- [ ] Integrare con @dnd-kit/sortable
- [ ] Stilizzare con tema Gilded Observatory

### 3.7 ConfigurableStat
- [ ] Creare `src/ui/balancing/ConfigurableStat.tsx`
- [ ] Label con edit button
- [ ] SmartInput (slider + input)
- [ ] "Edit" button → apre StatEditor
- [ ] "Delete" button (solo se !isCore)
- [ ] Conferma eliminazione dialog
- [ ] Indicatore "derived" per stat con formula
- [ ] Stilizzare con tema Gilded Observatory

### 3.8 Drag & Drop Setup
- [ ] Configurare DndContext in FantasyBalancer
- [ ] Configurare SortableContext per cards
- [ ] Implementare handleDragEnd per reorder
- [ ] Assicurare che solo DragHandle attivi drag
- [ ] Testare che inputs/buttons non interferiscano

---

## Phase 4: Integrazione FantasyBalancer (2-3h)

### 4.1 FantasyBalancer Refactor
- [ ] Importare `useBalancerConfig` hook
- [ ] Sostituire state hardcoded con config
- [ ] Renderizzare cards da `config.cards`
- [ ] Renderizzare stats da `config.stats`
- [ ] Aggiungere ConfigToolbar
- [ ] Aggiungere CardEditor drawer
- [ ] Aggiungere StatEditor drawer
- [ ] Gestire apertura/chiusura drawers
- [ ] Passare handlers CRUD ai componenti

### 4.2 BalancingSolver Refactor
- [ ] Modificare `src/balancing/solver.ts`
- [ ] Leggere stat definitions da config
- [ ] Eseguire formule derivate via FormulaEngine
- [ ] Gestire stat dinamiche (non più hardcoded)
- [ ] Mantenere backward compatibility

### 4.3 Costs Refactor
- [ ] Modificare `src/balancing/costs.ts`
- [ ] Leggere pesi da config.stats[].weight
- [ ] Leggere pesi override da activePreset.weights
- [ ] Calcolare costo totale dinamicamente

### 4.4 Registry Migration
- [ ] Aggiornare `src/balancing/registry.ts`
- [ ] Deprecare PARAM_DEFINITIONS hardcoded
- [ ] Usare config come source of truth
- [ ] Mantenere API compatibile per transizione

---

## Phase 5: Testing e Polish (2h)

### 5.1 Unit Tests - FormulaEngine
- [ ] Creare `src/balancing/config/__tests__/FormulaEngine.test.ts`
- [ ] Test validateFormula con formula valida
- [ ] Test validateFormula con stat sconosciuta
- [ ] Test validateFormula con syntax error
- [ ] Test executeFormula con valori
- [ ] Test extractIdentifiers
- [ ] Test suggestCompletions

### 5.2 Unit Tests - BalancerConfigStore
- [ ] Creare `src/balancing/config/__tests__/BalancerConfigStore.test.ts`
- [ ] Test load con localStorage vuoto
- [ ] Test load con config salvata
- [ ] Test save con validazione
- [ ] Test history limit
- [ ] Test undo
- [ ] Test restore
- [ ] Test export/import
- [ ] Test reset

### 5.3 Integration Tests - Hook
- [ ] Creare `src/balancing/hooks/__tests__/useBalancerConfig.test.ts`
- [ ] Test addStat success
- [ ] Test addStat validation error
- [ ] Test deleteStat core protection
- [ ] Test deleteStat formula dependency
- [ ] Test addCard
- [ ] Test deleteCard cascade
- [ ] Test reorderCards
- [ ] Test preset switching

### 5.4 UI Polish
- [ ] Animazioni drawer (slide-in/out)
- [ ] Transizioni feedback validazione
- [ ] Loading states
- [ ] Empty states
- [ ] Responsive design mobile
- [ ] Touch targets 44px minimum
- [ ] Keyboard navigation

---

## Checklist Finale

- [ ] Tutti i test passano
- [ ] Nessun errore TypeScript
- [ ] UI coerente con Gilded Observatory
- [ ] Mobile-friendly
- [ ] Documentazione aggiornata
- [ ] MASTER_PLAN aggiornato
- [ ] IMPLEMENTED_PLAN aggiornato

---

## Progress Tracking

| Phase | Status | Completed | Total |
|-------|--------|-----------|-------|
| Phase 1: Schema e Store | ⬜ | 0 | 35 |
| Phase 2: React Hook | ⬜ | 0 | 20 |
| Phase 3: UI Components | ⬜ | 0 | 45 |
| Phase 4: Integration | ⬜ | 0 | 15 |
| Phase 5: Testing | ⬜ | 0 | 25 |
| **TOTAL** | ⬜ | **0** | **140** |

---

**Last Updated:** 2025-12-02
