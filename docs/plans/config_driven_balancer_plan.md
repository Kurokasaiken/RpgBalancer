# Config-Driven Balancer - Implementation Plan

> **Obiettivo:** Trasformare il Balancer in un sistema completamente configurabile da UI, dove card, stat, formule e preset sono definiti in JSON e modificabili dall'utente.

**Creato:** 2025-12-02  
**Stato:** 🔄 In Progress (Phase 0: Priority Fix)  
**Priorità:** Alta  
**Effort stimato:** 12-16 ore + 4-6 ore fix

---

## ⚠️ PRIORITY FIX REQUIRED

Prima di continuare con le fasi successive, è necessario risolvere i bug critici identificati:

| Document | Purpose |
|----------|---------|
| **📋 Fix Plan** | [balancer_ui_fix_plan.md](balancer_ui_fix_plan.md) |

**Problemi bloccanti:**
- Reset (card/stat/pagina) non funziona
- Pulsanti Lock, Hide non implementati
- Import/Export da verificare
- UX pulsanti da sistemare

---

## 1. Obiettivi e Requisiti

### 1.1 Requisiti Funzionali

| ID | Requisito | Priorità |
|----|-----------|----------|
| RF-01 | Creare nuove **Card** (moduli di combattimento) da UI | Alta |
| RF-02 | Creare nuove **Stat** dentro le card da UI | Alta |
| RF-03 | Creare/modificare **Formule derivate** con validazione real-time | Alta |
| RF-04 | Modificare nome, peso, min/max/step di qualsiasi stat | Alta |
| RF-05 | Drag & drop per riordinare card (solo da handle dedicato) | Media |
| RF-06 | Eliminare card/stat non-core con conferma | Media |
| RF-07 | Gestione **Preset** (switch, crea, duplica, elimina) | Alta |
| RF-08 | **Core** (hp, damage, htk) sempre presente, non eliminabile | Alta |
| RF-09 | Ultimo salvataggio diventa default al reload | Alta |
| RF-10 | History/Undo (ultimi 10 stati) | Media |
| RF-11 | Validazione real-time con feedback visivo (bordo rosso) | Alta |
| RF-12 | Export/Import configurazione JSON | Bassa |

### 1.2 Requisiti Non Funzionali

| ID | Requisito |
|----|-----------|
| RNF-01 | Persistenza in localStorage (no backend) |
| RNF-02 | Schema validato con Zod |
| RNF-03 | Migrazioni automatiche per versioni future |
| RNF-04 | UI coerente con tema Gilded Observatory |
| RNF-05 | Mobile-friendly (drawer laterale, touch targets 44px) |

---

## 2. Architettura

### 2.1 Layer Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                           UI Layer                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────────┐ │
│  │FantasyBalancer│  │ CardEditor   │  │ StatEditor / FormulaEditor │ │
│  │   (main page) │  │  (drawer)    │  │        (drawer)            │ │
│  └───────┬───────┘  └───────┬──────┘  └─────────────┬──────────────┘ │
│          │                  │                       │                │
│          ▼                  ▼                       ▼                │
│  ┌──────────────────────────────────────────────────────────────────┐│
│  │                  useBalancerConfig() Hook                        ││
│  │   - Accesso a cards, stats, formulas, presets                    ││
│  │   - CRUD operations con validazione                              ││
│  │   - Undo/Redo                                                    ││
│  └───────────────────────────┬──────────────────────────────────────┘│
└──────────────────────────────┼───────────────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────────────┐
│                        Config Layer                                   │
│  ┌──────────────────────────────────────────────────────────────────┐│
│  │                 BalancerConfigSchema.ts                          ││
│  │   - TypeScript interfaces (StatDefinition, CardDefinition, etc.) ││
│  │   - Zod validation schemas                                       ││
│  │   - Default CORE config (hardcoded, non-deletable)               ││
│  └──────────────────────────────────────────────────────────────────┘│
│  ┌──────────────────────────────────────────────────────────────────┐│
│  │                 BalancerConfigStore.ts                           ││
│  │   - localStorage persistence                                     ││
│  │   - History stack (max 10 snapshots)                             ││
│  │   - Preset CRUD                                                  ││
│  │   - Export/Import JSON                                           ││
│  └──────────────────────────────────────────────────────────────────┘│
│  ┌──────────────────────────────────────────────────────────────────┐│
│  │                 FormulaEngine.ts                                 ││
│  │   - Parser per formule (operazioni base + estensibile)           ││
│  │   - Validazione: solo stat esistenti                             ││
│  │   - Esecuzione runtime                                           ││
│  └──────────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────────────┐
│                        Runtime Layer                                  │
│  ┌──────────────────────────────────────────────────────────────────┐│
│  │                 BalancingSolver.ts (esistente, modificato)       ││
│  │   - Legge stat/formule da config invece che hardcoded            ││
│  │   - Esegue formule dinamicamente via FormulaEngine               ││
│  │   - Calcola costi usando pesi da config                          ││
│  └──────────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

```
User Action (UI)
       │
       ▼
useBalancerConfig() ──validate()──► Zod Schema
       │                                │
       │ (if valid)                     │ (if invalid)
       ▼                                ▼
BalancerConfigStore.save()         Show error (red border)
       │
       ▼
localStorage.setItem()
       │
       ▼
History stack updated
       │
       ▼
React state updated ──► UI re-renders
```

---

## 3. Schema Dati (TypeScript + Zod)

### 3.1 Core Interfaces

```typescript
// src/balancing/config/types.ts

/**
 * Definizione di una singola statistica
 */
export interface StatDefinition {
  id: string;                      // Identificatore unico (es. "hp", "critChance")
  label: string;                   // Nome visualizzato (es. "Hit Points")
  description?: string;            // Tooltip/help text
  type: 'number' | 'percentage';   // Per formattazione UI
  min: number;                     // Valore minimo
  max: number;                     // Valore massimo
  step: number;                    // Incremento slider
  defaultValue: number;            // Valore iniziale
  weight: number;                  // Costo per punto (per calcolo budget)
  isCore: boolean;                 // true = non eliminabile (hp, damage, htk)
  isDerived: boolean;              // true = calcolato da formula
  formula?: string;                // Es. "hp / damage" (solo se isDerived)
  bgColor?: string;                // Classe Tailwind per sfondo (es. "bg-orange-500/10")
}

/**
 * Definizione di una card (raggruppamento di stat)
 */
export interface CardDefinition {
  id: string;                      // Identificatore unico (es. "core", "mitigation")
  title: string;                   // Titolo visualizzato
  color: string;                   // Classe Tailwind per colore titolo
  icon?: string;                   // Emoji o icona
  statIds: string[];               // ID delle stat contenute
  isCore: boolean;                 // true = card Core non eliminabile
  order: number;                   // Ordine di visualizzazione
}

/**
 * Preset di bilanciamento (override pesi)
 */
export interface BalancerPreset {
  id: string;
  name: string;
  description: string;
  weights: Record<string, number>; // Override pesi per stat
  isBuiltIn: boolean;              // true = preset di sistema
  createdAt: string;               // ISO date
  modifiedAt: string;              // ISO date
}

/**
 * Configurazione completa del Balancer
 */
export interface BalancerConfig {
  version: string;                 // Per migrazioni (es. "1.0.0")
  stats: Record<string, StatDefinition>;
  cards: Record<string, CardDefinition>;
  presets: Record<string, BalancerPreset>;
  activePresetId: string;
}

/**
 * Snapshot per history/undo
 */
export interface ConfigSnapshot {
  timestamp: number;
  config: BalancerConfig;
  description: string;             // Es. "Added stat: magicResist"
}
```

### 3.2 Zod Validation Schemas

```typescript
// src/balancing/config/schemas.ts

import { z } from 'zod';

export const StatDefinitionSchema = z.object({
  id: z.string().min(1).regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 
    'ID must start with letter, contain only letters/numbers/underscores'),
  label: z.string().min(1).max(50),
  description: z.string().max(200).optional(),
  type: z.enum(['number', 'percentage']),
  min: z.number(),
  max: z.number(),
  step: z.number().positive(),
  defaultValue: z.number(),
  weight: z.number(),
  isCore: z.boolean(),
  isDerived: z.boolean(),
  formula: z.string().optional(),
  bgColor: z.string().optional(),
}).refine(
  (data) => data.min <= data.max,
  { message: 'min must be <= max', path: ['min'] }
).refine(
  (data) => data.defaultValue >= data.min && data.defaultValue <= data.max,
  { message: 'defaultValue must be within min/max range', path: ['defaultValue'] }
).refine(
  (data) => !data.isDerived || (data.formula && data.formula.length > 0),
  { message: 'Derived stats must have a formula', path: ['formula'] }
);

export const CardDefinitionSchema = z.object({
  id: z.string().min(1).regex(/^[a-zA-Z][a-zA-Z0-9_]*$/),
  title: z.string().min(1).max(50),
  color: z.string(),
  icon: z.string().optional(),
  statIds: z.array(z.string()).min(0),
  isCore: z.boolean(),
  order: z.number().int().min(0),
});

export const BalancerPresetSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(50),
  description: z.string().max(200),
  weights: z.record(z.string(), z.number()),
  isBuiltIn: z.boolean(),
  createdAt: z.string(),
  modifiedAt: z.string(),
});

export const BalancerConfigSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  stats: z.record(z.string(), StatDefinitionSchema),
  cards: z.record(z.string(), CardDefinitionSchema),
  presets: z.record(z.string(), BalancerPresetSchema),
  activePresetId: z.string(),
});
```

### 3.3 Default Core Config

```typescript
// src/balancing/config/defaultConfig.ts

import type { BalancerConfig, StatDefinition, CardDefinition } from './types';

/**
 * CORE STATS - Sempre presenti, non eliminabili
 * I pesi e range sono comunque modificabili
 */
export const CORE_STATS: Record<string, StatDefinition> = {
  hp: {
    id: 'hp',
    label: 'Hit Points',
    description: 'Total health pool',
    type: 'number',
    min: 10,
    max: 1000,
    step: 10,
    defaultValue: 100,
    weight: 1.0,
    isCore: true,
    isDerived: false,
  },
  damage: {
    id: 'damage',
    label: 'Damage',
    description: 'Base damage per attack',
    type: 'number',
    min: 1,
    max: 200,
    step: 1,
    defaultValue: 10,
    weight: 5.0,
    isCore: true,
    isDerived: false,
  },
  htk: {
    id: 'htk',
    label: 'Hits to Kill',
    description: 'Number of hits needed to defeat target',
    type: 'number',
    min: 1,
    max: 20,
    step: 0.1,
    defaultValue: 10,
    weight: 0, // Derived, no direct cost
    isCore: true,
    isDerived: true,
    formula: 'hp / damage',
    bgColor: 'bg-orange-500/10',
  },
};

/**
 * CORE CARD - Sempre presente, non eliminabile
 */
export const CORE_CARD: CardDefinition = {
  id: 'core',
  title: 'Core',
  color: 'text-blue-400',
  icon: '⚔️',
  statIds: ['hp', 'damage', 'htk'],
  isCore: true,
  order: 0,
};

/**
 * DEFAULT PRESET - Standard weights
 */
export const DEFAULT_PRESET = {
  id: 'standard',
  name: 'Standard',
  description: 'Default balanced weights',
  weights: {
    hp: 1.0,
    damage: 5.0,
    htk: 0,
  },
  isBuiltIn: true,
  createdAt: '2025-01-01T00:00:00Z',
  modifiedAt: '2025-01-01T00:00:00Z',
};

/**
 * Configurazione iniziale completa
 */
export const DEFAULT_CONFIG: BalancerConfig = {
  version: '1.0.0',
  stats: { ...CORE_STATS },
  cards: { core: CORE_CARD },
  presets: { standard: DEFAULT_PRESET },
  activePresetId: 'standard',
};

/**
 * Verifica se una stat è core (non eliminabile)
 */
export function isCoreStat(statId: string): boolean {
  return statId in CORE_STATS;
}

/**
 * Verifica se una card è core (non eliminabile)
 */
export function isCoreCard(cardId: string): boolean {
  return cardId === 'core';
}
```

---

## 4. Formula Engine

### 4.1 Design

Il Formula Engine deve:
1. **Parsare** formule come `hp / damage` o `(txc - evasion) * 0.01`
2. **Validare** che tutte le variabili siano stat esistenti
3. **Eseguire** la formula con valori runtime
4. **Essere estensibile** per aggiungere funzioni in futuro

### 4.2 Implementazione

```typescript
// src/balancing/config/FormulaEngine.ts

/**
 * Operatori supportati (estensibile)
 */
const SUPPORTED_OPERATORS = ['+', '-', '*', '/', '(', ')', '.'];

/**
 * Funzioni matematiche supportate (estensibile)
 */
const SUPPORTED_FUNCTIONS = ['min', 'max', 'abs', 'floor', 'ceil', 'round'];

/**
 * Risultato validazione formula
 */
export interface FormulaValidationResult {
  valid: boolean;
  error?: string;
  usedStats: string[];
}

/**
 * Estrae tutti gli identificatori da una formula
 */
function extractIdentifiers(formula: string): string[] {
  // Rimuove numeri e operatori, estrae parole
  const cleaned = formula.replace(/[0-9.]+/g, ' ');
  const words = cleaned.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
  
  // Filtra funzioni built-in
  return words.filter(w => !SUPPORTED_FUNCTIONS.includes(w.toLowerCase()));
}

/**
 * Valida una formula
 * 
 * @param formula - La formula da validare (es. "hp / damage")
 * @param availableStats - Lista di stat ID disponibili
 * @returns Risultato validazione con eventuali errori
 */
export function validateFormula(
  formula: string,
  availableStats: string[]
): FormulaValidationResult {
  if (!formula || formula.trim().length === 0) {
    return { valid: false, error: 'Formula cannot be empty', usedStats: [] };
  }

  // Estrai identificatori
  const identifiers = extractIdentifiers(formula);
  
  // Verifica che tutte le stat referenziate esistano
  const unknownStats = identifiers.filter(id => !availableStats.includes(id));
  
  if (unknownStats.length > 0) {
    return {
      valid: false,
      error: `Unknown stats: ${unknownStats.join(', ')}`,
      usedStats: identifiers,
    };
  }
  
  // Verifica sintassi con dry-run
  try {
    const testContext = Object.fromEntries(availableStats.map(s => [s, 1]));
    const fn = new Function(...availableStats, `return ${formula}`);
    const result = fn(...Object.values(testContext));
    
    if (typeof result !== 'number' || !isFinite(result)) {
      return {
        valid: false,
        error: 'Formula must return a finite number',
        usedStats: identifiers,
      };
    }
  } catch (e) {
    return {
      valid: false,
      error: `Syntax error: ${(e as Error).message}`,
      usedStats: identifiers,
    };
  }
  
  return { valid: true, usedStats: identifiers };
}

/**
 * Esegue una formula con valori concreti
 * 
 * @param formula - La formula da eseguire
 * @param values - Mappa stat ID → valore
 * @returns Risultato numerico
 */
export function executeFormula(
  formula: string,
  values: Record<string, number>
): number {
  try {
    const statIds = Object.keys(values);
    const statValues = Object.values(values);
    const fn = new Function(...statIds, `return ${formula}`);
    return fn(...statValues);
  } catch (e) {
    console.error('Formula execution error:', e);
    return 0;
  }
}

/**
 * Suggerisce completamenti per una formula parziale
 * (per future autocomplete UI)
 */
export function suggestCompletions(
  partialFormula: string,
  availableStats: string[]
): string[] {
  const lastWord = partialFormula.match(/[a-zA-Z_][a-zA-Z0-9_]*$/)?.[0] || '';
  if (!lastWord) return availableStats;
  
  return availableStats.filter(s => 
    s.toLowerCase().startsWith(lastWord.toLowerCase())
  );
}
```

---

## 5. Config Store (Persistence)

### 5.1 Implementazione

```typescript
// src/balancing/config/BalancerConfigStore.ts

import type { BalancerConfig, ConfigSnapshot } from './types';
import { BalancerConfigSchema } from './schemas';
import { DEFAULT_CONFIG } from './defaultConfig';

const STORAGE_KEY = 'rpg_balancer_config';
const HISTORY_KEY = 'rpg_balancer_config_history';
const MAX_HISTORY = 10;

/**
 * Store per la configurazione del Balancer
 * Gestisce persistenza, history e validazione
 */
export class BalancerConfigStore {
  private static config: BalancerConfig | null = null;
  private static history: ConfigSnapshot[] = [];

  /**
   * Carica la configurazione da localStorage
   * Se non esiste o è invalida, usa il default
   */
  static load(): BalancerConfig {
    if (this.config) return this.config;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const validated = BalancerConfigSchema.parse(parsed);
        
        // Merge con default per garantire che core stats/cards esistano
        this.config = this.mergeWithDefaults(validated);
      } else {
        this.config = { ...DEFAULT_CONFIG };
      }
    } catch (e) {
      console.warn('Failed to load config, using defaults:', e);
      this.config = { ...DEFAULT_CONFIG };
    }

    // Carica history
    this.loadHistory();

    return this.config;
  }

  /**
   * Salva la configurazione
   */
  static save(config: BalancerConfig, description: string = 'Manual save'): void {
    // Valida prima di salvare
    const result = BalancerConfigSchema.safeParse(config);
    if (!result.success) {
      throw new Error(`Invalid config: ${result.error.message}`);
    }

    // Aggiungi a history prima di sovrascrivere
    this.addToHistory(description);

    // Salva
    this.config = config;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }

  /**
   * Aggiunge lo stato corrente alla history
   */
  private static addToHistory(description: string): void {
    if (!this.config) return;

    const snapshot: ConfigSnapshot = {
      timestamp: Date.now(),
      config: JSON.parse(JSON.stringify(this.config)),
      description,
    };

    this.history.unshift(snapshot);
    if (this.history.length > MAX_HISTORY) {
      this.history = this.history.slice(0, MAX_HISTORY);
    }

    localStorage.setItem(HISTORY_KEY, JSON.stringify(this.history));
  }

  /**
   * Carica history da localStorage
   */
  private static loadHistory(): void {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) {
        this.history = JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Failed to load history:', e);
      this.history = [];
    }
  }

  /**
   * Ottiene la history
   */
  static getHistory(): ConfigSnapshot[] {
    return [...this.history];
  }

  /**
   * Ripristina uno snapshot dalla history
   */
  static restore(timestamp: number): BalancerConfig | null {
    const snapshot = this.history.find(s => s.timestamp === timestamp);
    if (!snapshot) return null;

    this.save(snapshot.config, `Restored from ${new Date(timestamp).toLocaleString()}`);
    return this.config;
  }

  /**
   * Undo - ripristina lo stato precedente
   */
  static undo(): BalancerConfig | null {
    if (this.history.length === 0) return null;
    
    const previous = this.history[0];
    this.config = JSON.parse(JSON.stringify(previous.config));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
    
    // Rimuovi dalla history
    this.history.shift();
    localStorage.setItem(HISTORY_KEY, JSON.stringify(this.history));
    
    return this.config;
  }

  /**
   * Merge config con defaults per garantire core elements
   */
  private static mergeWithDefaults(config: BalancerConfig): BalancerConfig {
    return {
      ...config,
      stats: {
        ...DEFAULT_CONFIG.stats, // Core stats sempre presenti
        ...config.stats,
      },
      cards: {
        ...DEFAULT_CONFIG.cards, // Core card sempre presente
        ...config.cards,
      },
      presets: {
        ...DEFAULT_CONFIG.presets,
        ...config.presets,
      },
    };
  }

  /**
   * Reset completo ai defaults
   */
  static reset(): BalancerConfig {
    this.addToHistory('Reset to defaults');
    this.config = { ...DEFAULT_CONFIG };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
    return this.config;
  }

  /**
   * Export config come JSON string
   */
  static export(): string {
    return JSON.stringify(this.load(), null, 2);
  }

  /**
   * Import config da JSON string
   */
  static import(json: string): BalancerConfig {
    const parsed = JSON.parse(json);
    const validated = BalancerConfigSchema.parse(parsed);
    const merged = this.mergeWithDefaults(validated);
    this.save(merged, 'Imported configuration');
    return merged;
  }
}
```

---

## 6. React Hook

### 6.1 useBalancerConfig Hook

```typescript
// src/balancing/hooks/useBalancerConfig.ts

import { useState, useCallback, useEffect } from 'react';
import type { BalancerConfig, StatDefinition, CardDefinition, BalancerPreset } from '../config/types';
import { BalancerConfigStore } from '../config/BalancerConfigStore';
import { validateFormula } from '../config/FormulaEngine';
import { isCoreStat, isCoreCard } from '../config/defaultConfig';
import { StatDefinitionSchema, CardDefinitionSchema } from '../config/schemas';

export interface UseBalancerConfigReturn {
  // State
  config: BalancerConfig;
  activePreset: BalancerPreset;
  history: ConfigSnapshot[];
  
  // Stat CRUD
  addStat: (cardId: string, stat: Omit<StatDefinition, 'isCore'>) => ValidationResult;
  updateStat: (statId: string, updates: Partial<StatDefinition>) => ValidationResult;
  deleteStat: (statId: string) => ValidationResult;
  
  // Card CRUD
  addCard: (card: Omit<CardDefinition, 'isCore' | 'order'>) => ValidationResult;
  updateCard: (cardId: string, updates: Partial<CardDefinition>) => ValidationResult;
  deleteCard: (cardId: string) => ValidationResult;
  reorderCards: (cardIds: string[]) => void;
  
  // Preset management
  switchPreset: (presetId: string) => void;
  createPreset: (name: string, description: string) => BalancerPreset;
  deletePreset: (presetId: string) => ValidationResult;
  
  // Formula validation
  validateStatFormula: (formula: string) => FormulaValidationResult;
  
  // History
  undo: () => void;
  canUndo: boolean;
  
  // Export/Import
  exportConfig: () => string;
  importConfig: (json: string) => ValidationResult;
  resetConfig: () => void;
}

interface ValidationResult {
  success: boolean;
  error?: string;
}

export function useBalancerConfig(): UseBalancerConfigReturn {
  const [config, setConfig] = useState<BalancerConfig>(() => 
    BalancerConfigStore.load()
  );
  const [history, setHistory] = useState<ConfigSnapshot[]>(() => 
    BalancerConfigStore.getHistory()
  );

  // Sync state when store changes
  const refreshState = useCallback(() => {
    setConfig(BalancerConfigStore.load());
    setHistory(BalancerConfigStore.getHistory());
  }, []);

  // Save helper
  const saveConfig = useCallback((newConfig: BalancerConfig, description: string) => {
    BalancerConfigStore.save(newConfig, description);
    refreshState();
  }, [refreshState]);

  // === STAT CRUD ===
  
  const addStat = useCallback((cardId: string, stat: Omit<StatDefinition, 'isCore'>): ValidationResult => {
    const fullStat: StatDefinition = { ...stat, isCore: false };
    
    // Validate
    const result = StatDefinitionSchema.safeParse(fullStat);
    if (!result.success) {
      return { success: false, error: result.error.errors[0]?.message };
    }
    
    // Check ID uniqueness
    if (config.stats[stat.id]) {
      return { success: false, error: `Stat ID "${stat.id}" already exists` };
    }
    
    // Validate formula if derived
    if (stat.isDerived && stat.formula) {
      const formulaResult = validateFormula(stat.formula, Object.keys(config.stats));
      if (!formulaResult.valid) {
        return { success: false, error: formulaResult.error };
      }
    }
    
    // Check card exists
    if (!config.cards[cardId]) {
      return { success: false, error: `Card "${cardId}" not found` };
    }
    
    // Add stat and update card
    const newConfig: BalancerConfig = {
      ...config,
      stats: { ...config.stats, [stat.id]: fullStat },
      cards: {
        ...config.cards,
        [cardId]: {
          ...config.cards[cardId],
          statIds: [...config.cards[cardId].statIds, stat.id],
        },
      },
    };
    
    saveConfig(newConfig, `Added stat: ${stat.label}`);
    return { success: true };
  }, [config, saveConfig]);

  const updateStat = useCallback((statId: string, updates: Partial<StatDefinition>): ValidationResult => {
    const existing = config.stats[statId];
    if (!existing) {
      return { success: false, error: `Stat "${statId}" not found` };
    }
    
    // Prevent changing isCore
    if ('isCore' in updates && updates.isCore !== existing.isCore) {
      return { success: false, error: 'Cannot change isCore property' };
    }
    
    const updated = { ...existing, ...updates };
    
    // Validate
    const result = StatDefinitionSchema.safeParse(updated);
    if (!result.success) {
      return { success: false, error: result.error.errors[0]?.message };
    }
    
    // Validate formula if changed
    if (updates.formula && updated.isDerived) {
      const otherStats = Object.keys(config.stats).filter(id => id !== statId);
      const formulaResult = validateFormula(updates.formula, otherStats);
      if (!formulaResult.valid) {
        return { success: false, error: formulaResult.error };
      }
    }
    
    const newConfig: BalancerConfig = {
      ...config,
      stats: { ...config.stats, [statId]: updated },
    };
    
    saveConfig(newConfig, `Updated stat: ${updated.label}`);
    return { success: true };
  }, [config, saveConfig]);

  const deleteStat = useCallback((statId: string): ValidationResult => {
    if (isCoreStat(statId)) {
      return { success: false, error: 'Cannot delete core stat' };
    }
    
    if (!config.stats[statId]) {
      return { success: false, error: `Stat "${statId}" not found` };
    }
    
    // Check if used in any formula
    const usedIn = Object.values(config.stats)
      .filter(s => s.isDerived && s.formula?.includes(statId))
      .map(s => s.label);
    
    if (usedIn.length > 0) {
      return { 
        success: false, 
        error: `Stat is used in formulas: ${usedIn.join(', ')}` 
      };
    }
    
    // Remove from stats and all cards
    const { [statId]: removed, ...remainingStats } = config.stats;
    const updatedCards = Object.fromEntries(
      Object.entries(config.cards).map(([id, card]) => [
        id,
        { ...card, statIds: card.statIds.filter(s => s !== statId) },
      ])
    );
    
    const newConfig: BalancerConfig = {
      ...config,
      stats: remainingStats,
      cards: updatedCards,
    };
    
    saveConfig(newConfig, `Deleted stat: ${removed.label}`);
    return { success: true };
  }, [config, saveConfig]);

  // === CARD CRUD ===
  
  const addCard = useCallback((card: Omit<CardDefinition, 'isCore' | 'order'>): ValidationResult => {
    const maxOrder = Math.max(...Object.values(config.cards).map(c => c.order), -1);
    const fullCard: CardDefinition = { 
      ...card, 
      isCore: false, 
      order: maxOrder + 1,
      statIds: card.statIds || [],
    };
    
    // Validate
    const result = CardDefinitionSchema.safeParse(fullCard);
    if (!result.success) {
      return { success: false, error: result.error.errors[0]?.message };
    }
    
    // Check ID uniqueness
    if (config.cards[card.id]) {
      return { success: false, error: `Card ID "${card.id}" already exists` };
    }
    
    const newConfig: BalancerConfig = {
      ...config,
      cards: { ...config.cards, [card.id]: fullCard },
    };
    
    saveConfig(newConfig, `Added card: ${card.title}`);
    return { success: true };
  }, [config, saveConfig]);

  const deleteCard = useCallback((cardId: string): ValidationResult => {
    if (isCoreCard(cardId)) {
      return { success: false, error: 'Cannot delete core card' };
    }
    
    if (!config.cards[cardId]) {
      return { success: false, error: `Card "${cardId}" not found` };
    }
    
    const card = config.cards[cardId];
    
    // Also delete non-core stats in this card
    const statsToDelete = card.statIds.filter(id => !isCoreStat(id));
    const remainingStats = Object.fromEntries(
      Object.entries(config.stats).filter(([id]) => !statsToDelete.includes(id))
    );
    
    const { [cardId]: removed, ...remainingCards } = config.cards;
    
    const newConfig: BalancerConfig = {
      ...config,
      stats: remainingStats,
      cards: remainingCards,
    };
    
    saveConfig(newConfig, `Deleted card: ${card.title}`);
    return { success: true };
  }, [config, saveConfig]);

  const reorderCards = useCallback((cardIds: string[]) => {
    const updatedCards = Object.fromEntries(
      cardIds.map((id, index) => [
        id,
        { ...config.cards[id], order: index },
      ])
    );
    
    const newConfig: BalancerConfig = {
      ...config,
      cards: { ...config.cards, ...updatedCards },
    };
    
    saveConfig(newConfig, 'Reordered cards');
  }, [config, saveConfig]);

  // ... altri metodi (preset, undo, export/import)

  return {
    config,
    activePreset: config.presets[config.activePresetId],
    history,
    addStat,
    updateStat,
    deleteStat,
    addCard,
    updateCard: /* similar to updateStat */,
    deleteCard,
    reorderCards,
    switchPreset: /* ... */,
    createPreset: /* ... */,
    deletePreset: /* ... */,
    validateStatFormula: (formula) => validateFormula(formula, Object.keys(config.stats)),
    undo: () => { BalancerConfigStore.undo(); refreshState(); },
    canUndo: history.length > 0,
    exportConfig: () => BalancerConfigStore.export(),
    importConfig: /* ... */,
    resetConfig: () => { BalancerConfigStore.reset(); refreshState(); },
  };
}
```

---

## 7. UI Components

### 7.1 Component Tree

```
FantasyBalancer.tsx (main page)
├── ConfigToolbar.tsx
│   ├── PresetSelector (dropdown)
│   ├── + Add Card (button → apre CardEditor)
│   ├── Undo (button)
│   └── Export/Import (buttons)
│
├── CardGrid (drag & drop container)
│   └── ConfigurableCard.tsx (per ogni card)
│       ├── CardHeader
│       │   ├── DragHandle (⋮⋮ icon, drag only here)
│       │   ├── Title (editable inline)
│       │   ├── + Add Stat (button → apre StatEditor)
│       │   └── Delete Card (button, solo se !isCore)
│       │
│       └── StatList
│           └── ConfigurableStat.tsx (per ogni stat)
│               ├── Label (editable inline)
│               ├── SmartInput (slider + input)
│               ├── Edit (button → apre StatEditor)
│               └── Delete (button, solo se !isCore)
│
└── Drawers (laterali)
    ├── CardEditor.tsx (crea/modifica card)
    ├── StatEditor.tsx (crea/modifica stat)
    └── FormulaEditor.tsx (embedded in StatEditor)
```

### 7.2 CardEditor Drawer

```typescript
// src/ui/balancing/CardEditor.tsx

interface CardEditorProps {
  isOpen: boolean;
  onClose: () => void;
  editingCard?: CardDefinition; // undefined = create mode
}

// Campi:
// - ID (auto-generato se create, readonly se edit)
// - Title (text input)
// - Color (dropdown con opzioni predefinite)
// - Icon (emoji picker o text input)
// - [Save] [Cancel]
```

### 7.3 StatEditor Drawer

```typescript
// src/ui/balancing/StatEditor.tsx

interface StatEditorProps {
  isOpen: boolean;
  onClose: () => void;
  cardId: string;
  editingStat?: StatDefinition; // undefined = create mode
}

// Campi:
// - ID (auto-generato se create, readonly se edit)
// - Label (text input)
// - Description (textarea)
// - Type (dropdown: number | percentage)
// - Min / Max / Step (number inputs)
// - Default Value (number input)
// - Weight (number input)
// - [x] Is Derived? (checkbox)
//   └── Formula (FormulaEditor, visibile solo se checked)
// - Background Color (dropdown)
// - [Save] [Cancel]
```

### 7.4 FormulaEditor

```typescript
// src/ui/balancing/FormulaEditor.tsx

interface FormulaEditorProps {
  value: string;
  onChange: (formula: string) => void;
  availableStats: string[];
}

// Features:
// - Textarea con syntax highlighting (opzionale)
// - Validazione real-time
// - Bordo verde se valido, rosso se errore
// - Tooltip con errore specifico
// - Lista stat disponibili come riferimento
```

### 7.5 Drag & Drop

Per il drag & drop delle card, useremo `@dnd-kit/core` (già standard React):

```typescript
// Solo il DragHandle (⋮⋮) attiva il drag
// Il resto della card (inputs, buttons) non interferisce

<DndContext onDragEnd={handleDragEnd}>
  <SortableContext items={cardIds}>
    {sortedCards.map(card => (
      <SortableCard key={card.id} card={card}>
        <DragHandle /> {/* Solo questo è draggable */}
        <CardContent />
      </SortableCard>
    ))}
  </SortableContext>
</DndContext>
```

---

## 8. Fasi di Implementazione

### Fase 1: Schema e Store (2-3h)
**Files da creare:**
- `src/balancing/config/types.ts`
- `src/balancing/config/schemas.ts`
- `src/balancing/config/defaultConfig.ts`
- `src/balancing/config/FormulaEngine.ts`
- `src/balancing/config/BalancerConfigStore.ts`

**Deliverables:**
- [ ] Interfacce TypeScript complete
- [ ] Zod schemas con validazione
- [ ] Default config con Core hardcoded
- [ ] Formula parser/validator
- [ ] Store con localStorage + history

### Fase 2: React Hook (1-2h)
**Files da creare:**
- `src/balancing/hooks/useBalancerConfig.ts`

**Deliverables:**
- [ ] Hook con CRUD completo
- [ ] Validazione integrata
- [ ] Undo/redo
- [ ] Export/import

### Fase 3: UI Editor Components (3-4h)
**Files da creare:**
- `src/ui/balancing/ConfigToolbar.tsx`
- `src/ui/balancing/CardEditor.tsx`
- `src/ui/balancing/StatEditor.tsx`
- `src/ui/balancing/FormulaEditor.tsx`
- `src/ui/balancing/ConfigurableCard.tsx`
- `src/ui/balancing/ConfigurableStat.tsx`

**Dipendenze da installare:**
- `@dnd-kit/core` e `@dnd-kit/sortable` (per drag & drop)

**Deliverables:**
- [ ] Drawer CardEditor funzionante
- [ ] Drawer StatEditor con FormulaEditor
- [ ] Validazione real-time con feedback visivo
- [ ] Drag & drop card con handle dedicato
- [ ] Conferma eliminazione

### Fase 4: Integrazione FantasyBalancer (2-3h)
**Files da modificare:**
- `src/ui/fantasy/FantasyBalancer.tsx`
- `src/balancing/solver.ts`
- `src/balancing/costs.ts`

**Deliverables:**
- [ ] FantasyBalancer usa `useBalancerConfig()`
- [ ] Card/stat renderizzate da config
- [ ] Solver legge formule da config
- [ ] Costs usa pesi da config

### Fase 5: Testing e Polish (2h)
**Files da creare:**
- `src/balancing/config/__tests__/FormulaEngine.test.ts`
- `src/balancing/config/__tests__/BalancerConfigStore.test.ts`
- `src/balancing/hooks/__tests__/useBalancerConfig.test.ts`

**Deliverables:**
- [ ] Unit tests per FormulaEngine
- [ ] Unit tests per Store
- [ ] Integration tests per hook
- [ ] UI polish (animazioni drawer, feedback)

---

## 9. Rischi e Mitigazioni

| Rischio | Probabilità | Impatto | Mitigazione |
|---------|-------------|---------|-------------|
| Formula injection (XSS) | Media | Alto | Sanitize input, whitelist operatori |
| Circular formula dependencies | Media | Medio | Detect cycles in validateFormula |
| localStorage quota exceeded | Bassa | Medio | Limit history, compress JSON |
| Breaking existing presets | Media | Alto | Migration system, version check |
| Performance con molte stat | Bassa | Basso | Memoization, lazy evaluation |

---

## 10. Success Criteria

- [ ] Utente può creare nuova card da UI
- [ ] Utente può creare nuova stat dentro card da UI
- [ ] Utente può creare formula derivata con validazione
- [ ] Core (hp, damage, htk) non eliminabile
- [ ] Drag & drop card funziona solo da handle
- [ ] Ultimo salvataggio persiste come default
- [ ] Undo ripristina stato precedente
- [ ] Validazione mostra errori in rosso real-time
- [ ] Export/Import JSON funziona

---

## 11. Links

- **Tasks:** [config_driven_balancer_tasks.md](config_driven_balancer_tasks.md)
- **Parent:** [MASTER_PLAN.md](../MASTER_PLAN.md)
- **Related:** [IMPLEMENTED_PLAN.md](../IMPLEMENTED_PLAN.md)
