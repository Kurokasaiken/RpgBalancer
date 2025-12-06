# Spell Creator New - Implementation Plan

## Obiettivo
Creare una nuova versione dello Spell Creator con:
1. **Config-Driven Architecture** (come BalancerNew)
2. **Tema Arcane Tech Glass** (nuovo tema visivo)
3. **Copia in Mockups** per reference
4. **Parità comportamentale** con lo Spell Creator attuale (stessa logica, stessi nomi, stessi risultati a parità di input)

Questo documento funge da **implementation/migration plan**: definisce architettura, fasi e strategia di migrazione dallo Spell Creator legacy alla nuova UI, mantenendo lo stesso comportamento osservabile.

---

## Migrazione & Parità Comportamentale

### Principi

- **Single Source of Truth di dominio inalterata**
  - Rimangono autoritativi i moduli esistenti:
    - `spellTypes.ts`, `defaultSpells.ts`
    - `spellBalancingConfig.ts` (pesi, baseline, BUFFABLE_STATS)
    - `spellStatDefinitions.ts`
    - `spellStorage.ts`
  - Lo Spell Creator New *riusa* questi moduli invece di ridefinire logiche o costi.

- **Parità logica 1:1 con SpellCreation/FantasySpellCreation**
  - Stesso calcolo di:
    - `spellLevel` via `calculateSpellBudget(...)`,
    - `balance = Σ(weights) - targetBudget`,
    - preview damage `effect% × BASELINE_STATS.damage × eco`,
    - gestione buff/debuff (`Modification %`, `Duration (Turns)`, `targetStat`).
  - Stessa semantica per:
    - drag & drop dell'ordine delle stat,
    - collapsed stats (`collapsedStats` + persistenza),
    - multi-tick slider {`value`, `weight`} per ogni stat.

- **Migrazione sicura e graduale**
  - Fase 1: SpellCreatorNew vive in tab separata (es. "Spell Creator New"), legacy ancora accessibile.
  - Fase 2: Parità verificata con test automatici + QA manuale.
  - Fase 3: Promozione a creator principale e progressivo deprecamento del legacy (senza rimuoverlo finché non ci sono più casi d'uso).

### Strategia di migrazione

1. **Allineare il modello dati**
   - Definire `SpellDefinition`/`SpellConfig` in modo che mappino direttamente o tramite semplice adattatore agli attuali `Spell` e configurazioni di balancing.

2. **Creare SpellCreatorNew usando le stesse funzioni di dominio**
   - Nessuna nuova formula di costo o simulazione dentro la UI;
   - Tutto passa ancora da `calculateSpellBudget`, `getBaselineSpell`, `SPELL_CONFIG`, ecc.

3. **Golden Master / equivalence testing**
   - Definire un set di input (configurazioni di spell) e confrontare:
     - output legacy vs SpellCreatorNew (livello di costo, balance, output salvato).
   - I test vivono in `src/balancing/__tests__/SpellCreationTests.test.ts` o file dedicato.

4. **UI swap controllato**
   - Quando la parità è dimostrata, aggiornare `App.tsx` per rendere SpellCreatorNew la vista di default, mantenendo una via di accesso allo Spell Creator legacy per debug/regressioni finché non stabilizzato.

---

## 🎨 Tema: Arcane Tech Glass

### Palette Colori
```css
/* Background */
--bg-primary: #0a0a12;        /* Deep space black */
--bg-secondary: #12121f;      /* Dark purple-black */
--bg-card: rgba(20, 20, 35, 0.7);  /* Glass effect */
--bg-glass: rgba(100, 120, 255, 0.05); /* Subtle blue glow */

/* Accents */
--accent-primary: #6366f1;    /* Indigo */
--accent-secondary: #8b5cf6;  /* Purple */
--accent-tertiary: #06b6d4;   /* Cyan */
--accent-glow: rgba(99, 102, 241, 0.3);

/* Text */
--text-primary: #e2e8f0;      /* Light gray */
--text-secondary: #94a3b8;    /* Muted gray */
--text-accent: #a5b4fc;       /* Light indigo */

/* Borders */
--border-glass: rgba(99, 102, 241, 0.2);
--border-glow: rgba(139, 92, 246, 0.4);

/* Effects */
--shadow-glow: 0 0 20px rgba(99, 102, 241, 0.15);
--backdrop-blur: blur(12px);
```

### Componenti Stilistici
- **Glass Cards**: `backdrop-blur-md bg-white/5 border border-white/10`
- **Glow Effects**: `shadow-[0_0_15px_rgba(99,102,241,0.2)]`
- **Gradient Borders**: `bg-gradient-to-r from-indigo-500/20 to-purple-500/20`
- **Neon Text**: `text-indigo-300 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]`
- **Tech Grid**: Pattern di linee sottili come sfondo

---

## 📁 Struttura File

```
src/
├── spells/
│   └── config/
│       ├── types.ts              # SpellConfig, SpellDefinition, etc.
│       ├── schemas.ts            # Zod validation
│       ├── defaultSpellConfig.ts # Default spells
│       ├── SpellConfigStore.ts   # Persistence localStorage
│       └── SpellFormulaEngine.ts # Formula parser per spell effects
│
├── spells/
│   └── hooks/
│       └── useSpellConfig.ts     # React hook CRUD
│
└── ui/
    └── spells/
        ├── SpellCreatorNew.tsx       # Main component
        ├── SpellCard.tsx             # Card per singola spell
        ├── SpellStat.tsx             # Stat editor per spell
        ├── SpellToolbar.tsx          # Import/Export/Undo
        ├── SpellFormulaEditor.tsx    # Editor formule
        └── theme/
            └── arcane-tech-glass.css # Tema CSS
```

---

## 🔧 Fasi di Implementazione

### Fase 1: Setup e Tipi (2-3h)
**File da creare:**
- `src/spells/config/types.ts`
- `src/spells/config/schemas.ts`

**Tipi principali:**
```typescript
interface SpellDefinition {
  id: string;
  name: string;
  description: string;
  school: 'evocation' | 'abjuration' | 'conjuration' | 'divination' | 'enchantment' | 'illusion' | 'necromancy' | 'transmutation';
  level: number; // 0-9
  castTime: string;
  range: string;
  components: { v: boolean; s: boolean; m: string | null };
  duration: string;
  
  // Stats configurabili
  baseDamage: number;
  scaling: number;
  areaOfEffect: number;
  saveDC: number;
  
  // Formule derivate
  isDerived: boolean;
  formula?: string;
  
  // UI state
  isLocked: boolean;
  isHidden: boolean;
  bgColor?: string;
  icon?: string;
}

interface SpellCard {
  id: string;
  title: string;
  color: string;
  icon: string;
  spellIds: string[];
  isCore: boolean;
  order: number;
  isHidden: boolean;
}

interface SpellConfig {
  version: number;
  spells: Record<string, SpellDefinition>;
  cards: Record<string, SpellCard>;
  activeSpellId: string | null;
}
```

---

### Fase 2: Store e Persistenza (2h)
**File da creare:**
- `src/spells/config/SpellConfigStore.ts`
- `src/spells/config/defaultSpellConfig.ts`

**Funzionalità:**
- `load()` - Carica da localStorage o default
- `save()` - Salva con history
- `import()` / `export()` - JSON import/export
- `reset()` - Reset ai default
- `undo()` - Undo con history (10 snapshots)

**Default Spells:**
- Fireball (evocation, level 3)
- Magic Missile (evocation, level 1)
- Shield (abjuration, level 1)
- Cure Wounds (evocation, level 1)
- Lightning Bolt (evocation, level 3)

---

### Fase 3: React Hook (2h)
**File da creare:**
- `src/spells/hooks/useSpellConfig.ts`

**API:**
```typescript
interface UseSpellConfigReturn {
  config: SpellConfig;
  
  // Spell CRUD
  addSpell: (cardId: string, spell: Omit<SpellDefinition, 'isCore'>) => ValidationResult;
  updateSpell: (spellId: string, updates: Partial<SpellDefinition>) => ValidationResult;
  deleteSpell: (spellId: string) => ValidationResult;
  
  // Card CRUD
  addCard: (card: Omit<SpellCard, 'isCore' | 'order' | 'spellIds'>) => ValidationResult;
  updateCard: (cardId: string, updates: Partial<SpellCard>) => ValidationResult;
  deleteCard: (cardId: string) => ValidationResult;
  reorderCards: (cardIds: string[]) => void;
  
  // History
  undo: () => void;
  canUndo: boolean;
  
  // Import/Export
  exportConfig: () => string;
  importConfig: (json: string) => ValidationResult;
  
  // Reset
  resetSpellToInitial: (spellId: string) => ValidationResult;
  resetCardToInitial: (cardId: string) => ValidationResult;
  resetToInitialConfig: () => void;
}
```

---

### Fase 4: UI Components (4-5h)

#### 4.1 SpellCreatorNew.tsx
- Layout principale con tema Arcane Tech Glass
- DndContext per drag & drop cards
- Header con titolo e bottoni
- Grid di SpellCards

#### 4.2 SpellCard.tsx
- Glass card effect
- Header con icona, titolo, colore
- Lista di SpellStats
- Bottoni: Reset, Edit, Hide, Delete
- Drag handle

#### 4.3 SpellStat.tsx (per ogni spell)
- Display mode: nome, valore, slider
- Edit mode: tutti i campi editabili
- Formule derivate calcolate automaticamente
- Lock/Unlock, Reset, Hide

#### 4.4 SpellToolbar.tsx
- Undo button
- Reset Defaults (double-click confirmation)
- Export JSON
- Import JSON
- Toast notifications

#### 4.5 SpellFormulaEditor.tsx
- Input con autocomplete
- Validazione real-time
- Suggerimenti per variabili disponibili

---

### Fase 5: Tema Arcane Tech Glass (2h)

#### 5.1 CSS/Tailwind Classes
```tsx
// Glass Card
className="backdrop-blur-md bg-slate-900/40 border border-indigo-500/20 rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.1)]"

// Glow Button
className="px-4 py-2 rounded-lg bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-600/30 hover:shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all"

// Neon Text
className="text-indigo-300 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]"

// Tech Grid Background
className="bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:20px_20px]"
```

#### 5.2 Animazioni
- Pulse glow su hover
- Fade in/out per cards
- Slide per drawer/modal
- Shimmer effect per loading

---

### Fase 6: Integrazione e Testing (2h)

#### 6.1 Integrazione con App.tsx
- Aggiungere tab "Spell Creator New" (accanto allo Spell Creator attuale).
- Mantenere accessibile il creator legacy finché non è dimostrata la parità.

#### 6.2 Testing & Regression (alto livello)

- **Unit/Domain Tests**
  - Estendere `src/balancing/__tests__/SpellCreationTests.test.ts` per coprire:
    - equivalenza di costo (`calculateSpellBudget`) per vari scenari,
    - coerenza di pesi/disabilitazioni (`SPELL_CONFIG.weights`).

- **Component/Hook Tests (React)**
  - Nuovi test per `useSpellConfig` e `SpellCreatorNew` che verifichino:
    - inizializzazione stato (spell vuoto, statOrder di default, balance = 0),
    - aggiornamenti da slider/tick → update di `Spell` e ricalcolo di cost/balance,
    - comportamento di `Save`, `Save Default`, `Reset` identico al legacy.

- **Golden Master / Equivalence Tests**
  - Definire un set di spells di test (esempi da `SPELL_CREATOR.md`).
  - Per ogni spell:
    - calcolare costo/balance con la pipeline legacy,
    - calcolare costo/balance con la pipeline SpellCreatorNew,
    - asserire uguaglianza (entro la stessa precisione). 

- **UI/E2E Tests (Playwright)**
  - Scenari end-to-end su mobile + desktop per:
    - creazione di spell d'esempio (Basic Attack, High-Crit, Shield Wall),
    - drag & drop, collapse, salvataggio, reset,
    - coerenza delle etichette e del preview buff/debuff.

#### 6.3 Mockup Copy
- Copiare SpellCreatorNew in `src/ui/mockups/SpellCreatorMockup.tsx`.
- Versione statica per reference visivo (tema Arcane Tech Glass) non collegata alla logica di dominio.

---

## 📋 Checklist

### Fase 1: Setup e Tipi
- [ ] Creare `src/spells/config/types.ts`
- [ ] Creare `src/spells/config/schemas.ts` con Zod
- [ ] Definire SpellDefinition, SpellCard, SpellConfig

### Fase 2: Store e Persistenza
- [ ] Creare `src/spells/config/SpellConfigStore.ts`
- [ ] Creare `src/spells/config/defaultSpellConfig.ts`
- [ ] Implementare load/save/import/export/reset/undo

### Fase 3: React Hook
- [ ] Creare `src/spells/hooks/useSpellConfig.ts`
- [ ] Implementare CRUD per spells e cards
- [ ] Implementare history/undo

### Fase 4: UI Components
- [ ] Creare `SpellCreatorNew.tsx`
- [ ] Creare `SpellCard.tsx`
- [ ] Creare `SpellStat.tsx`
- [ ] Creare `SpellToolbar.tsx`
- [ ] Creare `SpellFormulaEditor.tsx`

### Fase 5: Tema
- [ ] Definire palette colori
- [ ] Creare glass card styles
- [ ] Creare glow effects
- [ ] Creare animazioni

### Fase 6: Integrazione
- [ ] Aggiungere a App.tsx
- [ ] Testing manuale
- [ ] Creare mockup copy

---

## ⏱️ Stima Tempo Totale

| Fase | Tempo Stimato |
|------|---------------|
| 1. Setup e Tipi | 2-3h |
| 2. Store e Persistenza | 2h |
| 3. React Hook | 2h |
| 4. UI Components | 4-5h |
| 5. Tema Arcane Tech Glass | 2h |
| 6. Integrazione e Testing | 2h |
| **TOTALE** | **14-16h** |

---

## 🎯 Priorità

1. **CRITICO**: Tipi e Store (base per tutto)
2. **ALTO**: React Hook e SpellCreatorNew
3. **MEDIO**: SpellCard e SpellStat
4. **BASSO**: Tema polish e animazioni

---

## 📝 Note

- Riutilizzare pattern da BalancerNew dove possibile
- FormulaEngine può essere condiviso o esteso
- Toast system già esistente in `src/ui/balancing/Toast.tsx`
- DndKit già configurato nel progetto
