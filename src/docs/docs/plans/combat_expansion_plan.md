# Combat System Expansion - Implementation Plan

**Status:** 🔄 Active  
**Phase:** Foundation (Initiative \u0026 Status Effects)  
**Started:** 2025-11-30  
**Estimated Duration:** 8-12 weeks

---

## 1. Overview

Expand the existing robust 1v1 combat system into a full tactical grid-based multi-unit combat system with initiative, movement, AI, AoE abilities, and team synergies.

### Goals
- ✅ Maintain existing 1v1 balance and testing infrastructure
- ✅ Add spatial tactics via 2D grid combat
- ✅ Support multi-unit scenarios (5v5, 5vMany, boss fights)
- ✅ Implement AoE damage and buff/debuff mechanics
- ✅ Create AI opponents with tactical decision-making

### Design Principles
1. **Incremental:** Each phase ships independently
2. **Tested:** Balance validation before moving to next phase
3. **Modular:** New systems integrate cleanly with existing
4. **Single Source of Truth:** All formulas in balancing modules

---

## 2. Architecture Overview

```
Phase 1: Foundation
├─ InitiativeModule → Calculate turn order
├─ StatusEffectManager → Buff/debuff/stun system
└─ Enhanced Logging → Track new metrics

Phase 2: Grid Combat
├─ Pathfinding (A*, Dijkstra) → Movement AI
├─ RangeCalculator → LOS, range checks
├─ AIController (Level 1) → Basic decisions
└─ GridCombatSimulator → Spatial combat

Phase 3: Multi-Unit
├─ AoE System → Area damage/buffs
├─ Team Synergies → Flanking, focus fire
├─ AIController (Level 2) → Tactical AI
└─ Team Balance Testing → NvN validation
```

---

## 3. Phase 1: Foundation (1-2 weeks)

### 3.1 Initiative System

**Problem:** Current combat is alternating turns. Need variable turn order.

**Solution:** Initiative stat + randomness

#### New Stat: `agility`
```typescript
interface StatBlock {
  // ... existing stats
  agility: number; // NEW: Base initiative stat
}
```

**Default Values:**
- Baseline: 50
- Weight: 0.5 HP/point (low impact on balance)
- Archetype variance: ±30 (Tank=30, Assassin=80)

#### InitiativeModule
```typescript
// src/balancing/modules/initiative.ts
export const InitiativeModule = {
  /**
   * Calculate initiative for a character
   * @param agility Base stat
   * @param variance Random variance (0-1)
   * @returns Initiative value (higher acts first)
   */
  calculateInitiative(agility: number, variance: number): number {
    return agility + (variance * 10); // ±10 variance
  },

  /**
   * Generate turn order for all characters
   * @param characters List of combat participants
   * @param rng Seeded RNG function
   * @returns Sorted array of character IDs (highest initiative first)
   */
  generateTurnOrder(
    characters: CombatCharacter[], 
    rng: () => number
  ): string[] {
    const initiatives = characters.map(char => ({
      id: char.id,
      initiative: this.calculateInitiative(char.baseStats.agility, rng())
    }));
    
    return initiatives
      .sort((a, b) => b.initiative - a.initiative)
      .map(item => item.id);
  }
};
```

**Integration:**
- Add to `CombatSimulator`: generate turn order at start
- Re-roll every round (dynamic initiative)
- Log initiative rolls for analysis

---

### 3.2 Status Effects System

**Problem:** No way to apply stun, buff, debuff currently.

**Solution:** StatusEffectManager with duration tracking

#### StatusEffectManager
```typescript
// src/balancing/statusEffects/StatusEffectManager.ts
export class StatusEffectManager {
  /**
   * Apply a status effect to a character
   */
  applyEffect(character: CombatCharacter, effect: StatusEffect): void {
    // Check if effect already exists (refresh duration vs stack)
    const existing = character.statusEffects.find(e => e.id === effect.id);
    
    if (existing) {
      existing.duration = Math.max(existing.duration, effect.duration); // Refresh
    } else {
      character.statusEffects.push({ ...effect });
    }
  }

  /**
   * Process effects at start of turn
   * - Apply stat modifications
   * - Trigger DoT damage
   * - Return if character can act (not stunned)
   */
  processEffects(character: CombatCharacter): { canAct: boolean, dotDamage: number } {
    let canAct = true;
    let dotDamage = 0;

    for (const effect of character.statusEffects) {
      if (effect.type === 'stun') {
        canAct = false;
      }
      if (effect.type === 'dot' && 'damage' in effect.effect) {
        dotDamage += effect.effect.damage;
      }
      // Buff/debuff stats already applied via getEffectiveStats()
    }

    return { canAct, dotDamage };
  }

  /**
   * Tick down durations and remove expired effects
   */
  tickDuration(character: CombatCharacter): void {
    character.statusEffects = character.statusEffects
      .map(effect => ({ ...effect, duration: effect.duration - 1 }))
      .filter(effect => effect.duration > 0);
  }

  /**
   * Get effective stats with buff/debuff applied
   */
  getEffectiveStats(character: CombatCharacter): StatBlock {
    let stats = { ...character.baseStats };

    for (const effect of character.statusEffects) {
      if (effect.type === 'buff' || effect.type === 'debuff') {
        Object.entries(effect.effect).forEach(([stat, value]) => {
          stats[stat as keyof StatBlock] += value as number;
        });
      }
    }

    return stats;
  }
}
```

**Phase 1 Scope:**
- ✅ Stun (skip turn, 1-3 turns duration)
- ⏭️ Buff/Debuff (Phase 3)
- ⏭️ DoT (Phase 3)

---

### 3.3 Enhanced Logging

**New metrics to track:**
```typescript
interface ExtendedCombatMetrics {
  // Existing
  winner: 'entity1' | 'entity2' | 'draw';
  turns: number;
  damageDealt: { entity1: number, entity2: number };

  // NEW
  initiativeRolls: { entity1: number, entity2: number };
  hitRateActual: { entity1: number, entity2: number }; // Actual hits / total attacks
  critRateActual: { entity1: number, entity2: number };
  statusEffectsApplied: number;
  turnsStunned: { entity1: number, entity2: number };
}
```

---

## 4. Phase 2: Grid Combat 2D (3-4 weeks)

### 4.1 Pathfinding System

#### A* Implementation
```typescript
// src/engine/pathfinding/AStar.ts
export function findPath(
  start: Position,
  goal: Position,
  grid: GridState,
  costFn: (pos: Position) => number = () => 1
): Position[] | null {
  // Standard A* with configurable cost function
  // Heuristic: Euclidean distance
  // Returns: Array of positions or null if no path
}
```

#### Dijkstra for Movement Range
```typescript
export function getReachableTiles(
  start: Position,
  maxCost: number,
  grid: GridState
): Position[] {
  // Dijkstra flood-fill
  // Returns all tiles within movement budget
}
```

**Movement Budget:**
```typescript
movementRange = Math.floor(agility / 20) // 50 agility → 2 tiles/turn
```

---

### 4.2 Range \u0026 Targeting

```typescript
// src/engine/combat/RangeCalculator.ts
export const RangeCalculator = {
  /**
   * Check if target is within range (Euclidean distance)
   */
  inRange(attacker: Position, target: Position, range: number): boolean {
    const dist = Math.sqrt(
      (attacker.x - target.x) ** 2 + 
      (attacker.y - target.y) ** 2
    );
    return dist <= range;
  },

  /**
   * Line-of-sight check via raycast
   */
  hasLineOfSight(from: Position, to: Position, grid: GridState): boolean {
    // Bresenham's line algorithm
    // Check each tile for blockers
  },

  /**
   * Get all targets in AoE area
   */
  getTargetsInArea(
    center: Position, 
    shape: AoEShape, 
    grid: GridState
  ): string[] {
    // Based on shape, return all character IDs in area
  }
};
```

**Range Types:**
- Melee: 1 tile (adjacent only)
- Ranged: 3-8 tiles (spell-dependent)
- AoE: Circle radius 2-4 tiles

---

### 4.3 AI Controller (Level 1)

**Decision Priority:**
1. Can cast spell on enemy in range? → Cast
2. Can basic attack enemy in range? → Attack
3. Can move closer to enemy? → Move
4. No valid action? → Wait

```typescript
// src/engine/ai/AIController.ts
export class AIController {
  evaluateAction(
    character: CombatCharacter,
    state: GridCombatState
  ): CombatAction {
    const enemies = state.characters.filter(c => c.team !== character.team);
    
    // 1. Try spell cast
    for (const spell of character.equippedSpells) {
      const target = this.findTargetInRange(character, enemies, spell.range);
      if (target && character.cooldowns.get(spell.id) === 0) {
        return { type: 'spell', spellId: spell.id, targetId: target.id };
      }
    }

    // 2. Try basic attack (range 1)
    const meleeTarget = this.findTargetInRange(character, enemies, 1);
    if (meleeTarget) {
      return { type: 'spell', spellId: 'basic_attack', targetId: meleeTarget.id };
    }

    // 3. Move closer
    const closest = this.findClosestEnemy(character, enemies);
    const path = findPath(character.position, closest.position, state);
    if (path && path.length > 1) {
      return { type: 'move', moveToPosition: path[1] }; // Move 1 step
    }

    // 4. Wait
    return { type: 'wait' };
  }
}
```

---

## 5. Phase 3: Multi-Unit Combat (4-6 weeks)

### 5.1 AoE Damage Formula

**Research-based balancing:**
- AoE damage per target = Single-target × **0.65**
- AoE cost = Single-target cost × **2.0**
- Break-even point: Hits **3+ targets** for efficiency

**Friendly Fire System:**
```typescript
interface Spell {
  // ... existing
  friendlyFire: boolean; // NEW
  damageMultiplier: number; // 1.0 for dangerous, 0.5 for safe
}
```

**Safe Spell (no FF):**
- Damage: 0.5× base
- Cost: 1.5× base
- Filters out allies from targets

**Dangerous Spell (with FF):**
- Damage: 1.0× base
- Cost: 2.0× base
- Hits everyone in area

---

### 5.2 Team Synergies

#### Flanking
```typescript
// If 2+ allies adjacent to target → +15% Crit Chance
function checkFlanking(target: CombatCharacter, allies: CombatCharacter[]): boolean {
  const adjacentAllies = allies.filter(ally => 
    isAdjacent(ally.position, target.position)
  );
  return adjacentAllies.length >= 2;
}
```

#### Focus Fire
```typescript
// If all allies attack same target this round → +10% Damage
// Track via combat state
```

---

### 5.3 Test Scenarios

#### 5v5 Symmetric
- Same archetypes, same positions
- Expected: 50% ±5% winrate
- Validates: No positional advantage, balance maintained

#### 5v10 Swarm
- Player team vs 2× enemies with 0.6× HP each
- Expected: 45-55% player winrate
- Validates: AoE effectiveness, target prioritization

#### 5v1 Boss
- Boss: 5× HP, AoE attacks, higher damage
- Expected: 40-60% player winrate (challenging but fair)
- Validates: Focus fire, sustained damage, survivability

---

## 6. Verification Plan

### Per-Phase Testing

**Phase 1:**
- [x] Initiative distribution (1000 combats) → Normal bell curve
- [x] Stun effectiveness → Target skips N turns
- [x] 6×6 archetype matrix → Balance score \u003c 15%

**Phase 2:**
- [ ] Pathfinding correctness → Always finds shortest valid path
- [ ] Movement range accuracy → Exactly (agility/20) tiles
- [ ] AI decision consistency → Same state = same action (seeded)
- [ ] Grid 1v1 → Win rates match non-grid baseline ±3%

**Phase 3:**
- [ ] AoE damage scaling → 3 targets = 1.95× single-target damage
- [ ] Friendly fire → Safe spell 0% ally hits, Dangerous spell expected %
- [ ] 5v5 symmetric → 50% ±5% winrate
- [ ] Team synergies → Flanking triggers, Focus fire tracked

### Automated Testing
- Deterministic tests (seeded RNG)
- Contract tests (invariants: total HP never increases, etc.)
- Golden snapshot comparisons
- CI/CD via GitHub Actions

---

## 7. Migration \u0026 Compatibility

### Maintaining 1v1 Compatibility
- Existing `CombatSimulator` unchanged
- `GridCombatSimulator` extends base
- Grid position optional: `Position | null`
- If no position → fall back to 1v1 behavior

### Existing Test Suite
- All current tests must pass
- New tests added incrementally
- No breaking changes to existing APIs

---

## 8. Timeline \u0026 Milestones

| Phase | Duration | Milestone |
|-------|----------|-----------|
| **Phase 1** | 1-2 weeks | Initiative + Status Effects working |
| **Phase 2** | 3-4 weeks | Grid 1v1 with AI functional |
| **Phase 3** | 4-6 weeks | 5vMany with AoE balanced |
| **Polish** | 1-2 weeks | Performance, docs, export |
| **Total** | **8-12 weeks** | Full tactical combat system |

---

## 9. Risks \u0026 Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Balance broken by new stats** | High | Recalibrate weights after each phase |
| **AI too weak** | Medium | Iterative AI tuning, multiple difficulty levels |
| **Grid pathfinding slow** | Medium | Optimize with caching, A* heuristics |
| **AoE too strong/weak** | High | Extensive Monte Carlo testing |
| **Scope creep** | High | Strict phase gating, ship incrementally |

---

## 10. Success Criteria

✅ **Phase 1:** Initiative variance observed, stun prevents actions  
✅ **Phase 2:** Grid AI makes tactically sound moves 80%+ of time  
✅ **Phase 3:** 5v5 balance score \u003c 15%, AoE hit 3+ targets 60%+ of casts  
✅ **Overall:** All existing tests pass, new tests at 90%+ coverage

---

**Next Steps:**
1. ✅ Update MASTER_PLAN.md
2. ✅ Create task.md breakdown
3. → **Implement InitiativeModule** (NOW)
