# Stress Testing Archetype Generator

Questo modulo fornisce un generatore dinamico di archetipi per test di stress statistici nel sistema di bilanciamento RPG Balancer.

## Panoramica

Il `StressTestArchetypeGenerator` genera archetipi basati sulla configurazione del balancer, creando variazioni con aumenti ponderati nelle statistiche individuali e coppie di statistiche. Tutti i valori sono letti direttamente dalla configurazione, senza hardcoding.

## Caratteristiche

- **Config-First**: Legge pesi e valori predefiniti direttamente da `BalancerConfig`
- **Deterministico**: Usa LCG seeded per generazione riproducibile
- **Zero Hardcoding**: Nessun valore fisso, tutto derivato dalla configurazione
- **Diagnostica**: Logging dettagliato per verificare la generazione

## Utilizzo

### Generazione di base

```typescript
import { StressTestArchetypeGenerator } from './StressTestArchetypeGenerator';
import { BalancerConfigStore } from '@/balancing/config/BalancerConfigStore';

async function generateArchetypes() {
  const config = await BalancerConfigStore.load();
  const generator = new StressTestArchetypeGenerator(config, 42);

  // Genera archetipi singoli
  const singleStats = generator.generateSingleStatArchetypes();

  // Genera archetipi coppie
  const pairStats = generator.generatePairStatArchetypes();

  // Genera tutto
  const allArchetypes = generator.generateAllStressTestArchetypes();

  return allArchetypes;
}
```

### Funzione di convenienza

```typescript
import { generateStressTestArchetypes } from './StressTestArchetypeGenerator';

// Genera tutti gli archetipi con seed personalizzato
const archetypes = await generateStressTestArchetypes(123);
```

## Metodi

### `generateBaselineArchetype()`
Restituisce l'archetipo baseline con valori predefiniti delle stat.

### `generateSingleStatArchetypes()`
Genera archetipi con +25 * peso per ogni statistica non derivata.

Esempio output:
```json
{
  "id": "single_hp",
  "name": "Health Points +25",
  "stats": { "hp": 125, "damage": 50, ... },
  "seed": 42
}
```

### `generatePairStatArchetypes()`
Genera archetipi per tutte le combinazioni C(n,2) di stat non derivate.

Esempio output:
```json
{
  "id": "pair_hp_damage",
  "name": "Health Points +25 & Damage +20",
  "stats": { "hp": 125, "damage": 70, ... },
  "seed": 42
}
```

## Architettura

- **Interfaccia StressTestArchetype**: Rappresenta un archetipo generato
- **Classe StressTestArchetypeGenerator**: Generatore principale
- **Dipendenze**: `BalancerConfigStore`, `TestRNG`

## Testing

Eseguire i test con Vitest:

```bash
npm run test -- src/balancing/stressTesting/
```

I test validano:
- Inizializzazione corretta
- Generazione baseline
- Conteggio e valori degli archetipi singoli (+25 * peso per stat)
- Combinazioni delle coppie (C(n,2) per stat non derivate)
- Determinismo con seeding LCG (stessi risultati con stesso seed)
- Edge cases: config senza stat, pesi invalidi (negativi o zero)
- 100% coverage per metodi pubblici

Test specifici:
- `generates correct number of archetypes`: Valida baseline + singles + pairs
- `generates single stat boosts correctly`: Verifica aumenti ponderati
- `generates pair stat boosts correctly`: Verifica combinazioni C(n,2)
- `produces deterministic results with LCG seeding`: Riproducibilità con seed
- `handles config with no stats`: Edge case config vuoto
- `handles config with invalid weights`: Pesi negativi/zero

## Integrazione con Monte Carlo

Gli archetipi generati possono essere utilizzati direttamente nelle simulazioni Monte Carlo per analisi di utilità marginale e heatmap di sinergie.

```typescript
// Esempio di utilizzo in simulazione
const archetypes = await generateStressTestArchetypes();
archetypes.forEach(archetype => {
  const results = runMonteCarloSimulation(archetype.stats);
  analyzeMarginalUtility(results);
});
```

## Note di implementazione

- Salta statistiche derivate (`isDerived: true`)
- Arrotonda aumenti con `Math.round(weight * 25)`
- Seed incluso in ogni archetipo per tracciabilità
- Logging console per diagnostica generazione
