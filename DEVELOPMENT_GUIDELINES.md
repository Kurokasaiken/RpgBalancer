# Development Guidelines

> **CRITICAL:** Queste linee guida devono essere consultate **SEMPRE** prima di implementare qualsiasi funzionalità o creare un implementation plan.

---

## 🎯 Principio Fondamentale: Single Source of Truth

**REGOLA D'ORO:** Non inventare mai valori, stat, o logiche. Ereditare sempre dai moduli esistenti.

---

## 📋 Checklist Pre-Implementazione

Prima di scrivere **qualsiasi** codice o implementation plan, verificare:

### ✅ 1. Identificare le Entità Coinvolte
- [ ] Quali entità vengono usate? (Entity, Spell, StatBlock, etc.)
- [ ] Quali stat/proprietà vengono manipolate?
- [ ] Esistono già moduli di creazione/bilanciamento per queste entità?

### ✅ 2. Localizzare i Moduli di Riferimento
- [ ] Dove sono definite le interfacce TypeScript?
- [ ] Dove sono i factory/builder (es. `createEmptySpell`, `createEntity`)?
- [ ] Dove sono i moduli di balancing (es. `spellBalancingConfig`, `statWeights`)?

### ✅ 3. Ereditare, Non Inventare
- [ ] Usare factory functions esistenti per creare nuove istanze
- [ ] Usare config esistenti per valori di default
- [ ] Non hardcodare mai valori numerici senza verificare la fonte

---

## 🔒 Regole Obbligatorie per Entità Specifiche

### 📜 Spell (Incantesimi)

#### ❌ VIETATO:
```typescript
// MAI fare questo:
const spell = {
  name: "Fireball",
  effect: 100,        // ❌ Valore inventato
  damage: 50,         // ❌ Valore inventato
  manaCost: 30,       // ❌ Valore inventato
  range: 5            // ❌ Valore inventato
};
```

#### ✅ CORRETTO:
```typescript
import { createEmptySpell } from '../balancing/spellTypes';
import { calculateSpellBudget } from '../balancing/spellBalancingConfig';

// Usa sempre il factory
const spell = createEmptySpell();

// Modifica solo i campi necessari, partendo dai baseline
spell.name = "Fireball";
spell.effect = 200; // Modifica consapevole dal baseline (0)

// Verifica il costo
const cost = calculateSpellBudget(spell);
console.assert(Math.abs(cost) < 0.5, "Spell non bilanciata!");
```

#### 📍 Moduli di Riferimento per Spell:
- **Interfaccia:** `src/balancing/spellTypes.ts` - `Spell` interface
- **Factory:** `src/balancing/spellTypes.ts` - `createEmptySpell()`
- **Balancing:** `src/balancing/spellBalancingConfig.ts`
- **Default Spells:** `src/balancing/spells.json`

---

### 🧙 Entity / StatBlock (Personaggi)

#### ❌ VIETATO:
```typescript
// MAI fare questo:
const entity = {
  health: 1000,       // ❌ Valore inventato
  attack: 50,         // ❌ Valore inventato
  armor: 20           // ❌ Valore inventato
};
```

#### ✅ CORRETTO:
```typescript
import { Entity } from '../engine/combat/state';
import { StatBlock } from '../balancing/types';

// Usa il sistema di balancing esistente
const statBlock: StatBlock = {
  health: 1000,
  attack: 50,
  // ... altri valori basati su calcoli di balancing
};

const entity = new Entity("Warrior", statBlock);
```

#### 📍 Moduli di Riferimento per Entity:
- **Interfaccia:** `src/balancing/types.ts` - `StatBlock` interface
- **Entity Class:** `src/engine/combat/state.ts`
- **Weights:** `src/balancing/statWeights.ts`
- **Storage:** `src/balancing/entityStorage.ts`

---

### 🎲 Calcoli e Formule

#### ❌ VIETATO:
```typescript
// MAI inventare formule:
const damage = attack * 1.5 + 20;  // ❌ Formula inventata
const armor_reduction = armor * 0.8; // ❌ Formula inventata
```

#### ✅ CORRETTO:
```typescript
import { DamageCalculator } from '../engine/combat/damageCalculator';
import { EHPCalculator } from '../balancing/modules/ehp';

// Usa i moduli esistenti
const finalDamage = DamageCalculator.calculateFinalDamage(attacker, defender);
const effectiveHP = EHPCalculator.calculateEHP(defender.stats);
```

#### 📍 Moduli di Riferimento per Calcoli:
- **Damage:** `src/engine/combat/damageCalculator.ts`
- **EHP:** `src/balancing/modules/ehp.ts`
- **Hit Chance:** `src/balancing/modules/hitchance.ts`
- **DoT:** `src/engine/combat/dotModule.ts`

---

## 🧪 Validazione e Testing

### Prima di Committare
Ogni implementazione deve:

1. **✅ Usare TypeScript interfaces esistenti**
   - Non creare nuove interfacce se ne esiste già una
   - Estendere interfacce esistenti se necessario

2. **✅ Verificare coerenza con balancing**
   - Se modifichi stat/spell, calcola il costo/HP-equivalent
   - Assicurati che i valori rientrino nei range definiti

3. **✅ Testare con dati reali**
   - Usa spells da `spells.json` o entities da `entityStorage`
   - Non creare dati fittizi per i test

---

## 📚 Struttura dei Moduli (Riferimento Rapido)

```
src/
├── balancing/                    # ⭐ SOURCE OF TRUTH per stat e balancing
│   ├── types.ts                  # StatBlock, BalanceConfig
│   ├── statWeights.ts            # Pesi stat (HP-equivalent)
│   ├── spellTypes.ts             # Spell interface + factory
│   ├── spellBalancingConfig.ts   # Config spell
│   ├── spells.json               # Default spells
│   ├── entityStorage.ts          # CRUD entities
│   └── modules/                  # Moduli di calcolo
│       ├── ehp.ts
│       ├── hitchance.ts
│       └── ...
├── engine/                       # Logica combattimento
│   └── combat/
│       ├── state.ts              # Entity class
│       ├── damageCalculator.ts
│       └── ...
└── ui/                           # UI components (usa i moduli sopra)
```

---

## 🚨 Errori Comuni da Evitare

### ❌ Errore 1: Hardcode di Valori
```typescript
// ❌ SBAGLIATO
const spell = { effect: 100, manaCost: 50 };
```
**Soluzione:** Usa `createEmptySpell()` e modifica consapevolmente.

---

### ❌ Errore 2: Duplicazione di Logica
```typescript
// ❌ SBAGLIATO - Ricalcolare il danno manualmente
const damage = attacker.attack * 2 - defender.armor;
```
**Soluzione:** Usa `DamageCalculator.calculateFinalDamage()`.

---

### ❌ Errore 3: Ignorare Validazione
```typescript
// ❌ SBAGLIATO - Salvare senza validare
upsertSpell(spell); // Spell potrebbe essere sbilanciata!
```
**Soluzione:** 
```typescript
const cost = calculateSpellBudget(spell);
if (Math.abs(cost) > 1) {
  throw new Error(`Spell non bilanciata: cost=${cost}`);
}
upsertSpell(spell);
```

---

## 📝 Processo per Implementation Plan

Quando crei un implementation plan:

1. **Identifica Dependencies**
   - Quali moduli esistenti saranno coinvolti?
   - Elenca i file da modificare con i loro moduli di riferimento

2. **Specifica Source of Truth**
   - Per ogni entità, specifica il factory/config di riferimento
   - Esempio: "Entity stats: usa `StatBlock` da `types.ts`"

3. **Includi Validation Steps**
   - Come verificherai la coerenza con il balancing?
   - Quali test eseguirai?

---

## 🔍 Audit Checklist

Prima di approvare un PR o implementation:

- [ ] Nessun valore hardcoded (tranne costanti di config esplicite)
- [ ] Tutti gli oggetti Entity/Spell creati tramite factory
- [ ] Tutti i calcoli usano moduli esistenti (non ricalcolati)
- [ ] Interfacce TypeScript rispettate al 100%
- [ ] Test di balancing eseguiti (se applicabile)
- [ ] Codice referenzia esplicitamente il modulo sorgente (commenti)

---

## 📖 Esempi di Riferimento

### Esempio Completo: Creare una Spell
```typescript
import { createEmptySpell } from '../balancing/spellTypes';
import { calculateSpellBudget } from '../balancing/spellBalancingConfig';
import { upsertSpell } from '../balancing/spellStorage';

// 1. Factory (non hardcode!)
const fireball = createEmptySpell();

// 2. Modifica consapevole
fireball.name = "Fireball";
fireball.type = "damage";
fireball.effect = 200; // Dall'analisi di balancing

// 3. Validazione
const cost = calculateSpellBudget(fireball);
console.assert(Math.abs(cost) < 0.5, `Spell sbilanciata: ${cost}`);

// 4. Salvataggio
upsertSpell(fireball);
```

---

**ULTIMO PROMEMORIA:** Se hai dubbi su quale modulo usare, chiedi prima di implementare. È meglio perdere 5 minuti a verificare che 2 ore a refactorare codice incoerente.
