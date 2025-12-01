# Combat System & Encounter Design Specification

**Version:** 2.0  
**Last Updated:** 2025-12-01  
**Status:** Design Complete, Implementation Planned

---

## 1. Core Archetypes

### 1.1 Archetype Definitions

Each archetype has distinct stat priorities, scaling patterns, and tactical roles.

#### **Tank (Juggernaut)**
- **Base Stats:** HP 200, Armor 30, Resistance 20, Damage 25, Agility 5
- **Scaling Priority:** HP > Armor > Block > Resistance
- **Role:** Absorb damage, create space, protect allies
- **Gameplay:** High durability, low mobility, zone control
- **Balance Priority:** Must survive 3+ DPS rotations, but deal <40% of DPS damage
- **Testing:** 1v1 vs DPS should last 8-12 turns, lose slowly

#### **DPS (Berserker)**
- **Base Stats:** HP 120, Damage 45, Crit Chance 15%, Crit Mult 1.8x, Agility 12
- **Scaling Priority:** Damage > Crit > ArmorPen > TxC
- **Role:** High burst damage, glass cannon
- **Gameplay:** High risk/reward, positioning critical
- **Balance Priority:** Must kill Tank in 10-15 turns, but die to Assassin in 4-6
- **Testing:** 1v1 vs Tank = win in 12±2 turns, vs Assassin = lose in 5±1 turns

#### **Assassin (Shadowblade)**
- **Base Stats:** HP 110, Damage 40, Evasion 25%, Crit Chance 20%, Agility 18
- **Scaling Priority:** Evasion > Crit > Damage > Agility
- **Role:** Eliminate high-value targets quickly
- **Gameplay:** Hit-and-run, punish mistakes
- **Balance Priority:** Counter DPS, vulnerable to AoE and Tank CC
- **Testing:** 1v1 vs DPS = win in 5±1 turns via evasion + crit burst

#### **Support (Cleric)**
- **Base Stats:** HP 140, Healing 30/turn, Mana Regen 15/turn, Resistance 25
- **Scaling Priority:** Healing > Mana > Resistance > HP
- **Role:** Sustain, buff, debuff, utility
- **Gameplay:** Multiply team effectiveness, poor solo damage
- **Balance Priority:** Heal = 60% of DPS damage/turn, survives 1v1 vs DPS for 15+ turns
- **Testing:** 1v1 vs DPS = stalemate or slow loss after mana exhaustion

#### **Bruiser (Brawler)**
- **Base Stats:** HP 160, Damage 35, Armor 15, Lifesteal 12%, Agility 10
- **Scaling Priority:** Lifesteal > HP > Damage > Armor
- **Role:** Self-sufficient frontline, sustained damage
- **Gameplay:** Balanced offense/defense, duel specialist
- **Balance Priority:** Beat Tank 1v1, lose to kiting DPS or Assassin burst
- **Testing:** 1v1 vs Tank = win in 10-12 turns, vs DPS = 50/50 depending on engagement

---

## 2. Combat System Mechanics

### 2.1 Turn Order (Initiative System)

```typescript
initiative = baseAgility + random(0, 10) + statusModifiers
turnOrder = entities.sortBy(initiative, DESC)
```

- **Re-roll each round** (dynamic initiative)
- **Agility** provides consistent speed advantage but allows upsets
- **Stun/Slow** reduces initiative by 50%
- **Haste** increases initiative by 30%

### 2.2 Hit Calculation

```typescript
hitChance = baseAccuracy + attackerTxC - defenderEvasion
finalHitChance = clamp(hitChance, 5%, 95%) // Always 5% miss, 5% hit
roll = random(0, 100)
isHit = roll <= finalHitChance
```

### 2.3 Damage Calculation

#### Physical Damage
```typescript
baseDamage = attackerDamage * skillMultiplier
armorReduction = defenderArmor / (defenderArmor + 100)
mitigatedDamage = baseDamage * (1 - armorReduction)
finalDamage = mitigatedDamage * (1 - blockChance ? 0.5 : 0)
```

#### Magical Damage
```typescript
baseDamage = attackerIntelligence * spellPower
resistanceReduction = defenderResistance / (defenderResistance + 100)
mitigatedDamage = baseDamage * (1 - resistanceReduction)
finalDamage = mitigatedDamage * (ward > 0 ? 0 : 1) // Ward blocks 1 spell
```

### 2.4 Critical Hits

```typescript
isCrit = random(0, 100) <= critChance
critDamage = baseDamage * critMultiplier
```

### 2.5 Status Effects

| Status | Effect | Duration | Stackable |
|--------|--------|----------|-----------|
| **Stun** | Skip turn, -50% initiative next turn | 1 turn | No |
| **Burn** | -10% max HP per turn, ignores armor | 3 turns | Yes (3 max) |
| **Poison** | -5% current HP per turn | 5 turns | Yes (5 max) |
| **Slow** | -30% initiative, -2 movement | 2 turns | No |
| **Bleed** | -15 flat damage/turn, scales with damage dealt | 4 turns | Yes (2 max) |

### 2.6 Combat Logging

```typescript
interface CombatEvent {
  turn: number;
  actor: string;
  action: 'attack' | 'spell' | 'move' | 'status';
  target?: string;
  damage?: number;
  healing?: number;
  status?: StatusEffect;
  hit?: boolean;
  crit?: boolean;
}
```

**Telemetry Metrics:**
- Average damage per turn (ADPT)
- Time to kill (TTK)
- Hit rate %
- Crit rate %
- Damage mitigated
- Healing done
- Status effect uptime

---

## 3. Spell System

### 3.1 Base Spell List (Phase 1)

#### Offensive
| Spell | Type | Target | Scaling | Effect |
|-------|------|--------|---------|--------|
| **Strike** | Physical | Single | 100% ATK | Basic attack |
| **Fireball** | Magical | Single | 120% INT | High damage, 10% burn |
| **Poison Dart** | Magical | Single | 80% INT | Apply Poison (5 turns) |
| **Execute** | Physical | Single | 150% ATK | +50% vs <30% HP targets |

#### Defensive/Utility
| Spell | Type | Target | Effect |
|-------|------|--------|--------|
| **Heal** | Restore | Single | Restore 40% max HP |
| **Shield** | Buff | Self | +50% armor for 2 turns |
| **Cleanse** | Utility | Single | Remove 1 debuff |

#### Control
| Spell | Type | Target | Effect |
|-------|------|--------|--------|
| **Stun Strike** | Physical | Single | 70% ATK + Stun (1 turn) |
| **Slow** | Debuff | Single | -30% initiative for 2 turns |

### 3.2 Spell Variants (Phase 2+)

Each base spell can have variants:
- **Single Target** vs **AoE** (2.0x cost, 0.65x damage per target)
- **Burst** (150% damage, 3-turn cooldown) vs **DoT** (100% over 4 turns)
- **Ignore 50% Resistance** (1.5x cost)
- **Ignore 100% Armor** (2.5x cost, -40% damage)
- **Debuff Hybrid** (80% damage + status effect)

**Example:**
- **Fireball** → **Meteor** (AoE, 0.65x per target, 10% burn all)
- **Heal** → **Mass Heal** (AoE, 25% per target)
- **Strike** → **Armor Break** (80% damage, -20 armor for 3 turns)

### 3.3 Scaling Formulas

```typescript
spellDamage = basePower * (1 + relevantStat / 100)
spellCost = baseCost * costMultiplier * (AoE ? 2.0 : 1.0)
cooldown = baseCooldown + (powerful ? 2 : 0)
```

---

## 4. Testing & Balancing Framework

### 4.1 Automated 1v1 Simulation Suite

```typescript
function runBalanceTests() {
  const matchups = generateAllPairs(archetypes);
  const results = [];
  
  for (const [a, b] of matchups) {
    const outcome = simulateCombat(a, b, iterations=1000);
    results.push({
      matchup: `${a.name} vs ${b.name}`,
      winRate: outcome.aWins / 1000,
      avgTTK: outcome.avgTurns,
      avgDamagePerTurn: outcome.totalDamage / outcome.totalTurns
    });
  }
  
  return validateBalance(results);
}
```

### 4.2 Balance Validation Criteria

| Matchup | Expected Win Rate | Expected TTK | Tolerance |
|---------|-------------------|--------------|-----------|
| Tank vs DPS | 30-40% | 10-15 turns | ±15% |
| DPS vs Assassin | 35-45% | 5-7 turns | ±10% |
| Assassin vs Tank | 55-65% | 12-18 turns | ±20% |
| Support vs DPS | 20-30% | 12-20 turns | ±20% |
| Bruiser vs Tank | 60-70% | 10-14 turns | ±15% |

### 4.3 Iterative Tuning Process

1. **Run baseline simulation** (1000 iterations per matchup)
2. **Identify outliers** (>20% deviation from target)
3. **Adjust stat weights** (HP, Armor, Damage, Evasion)
4. **Re-run simulation**
5. **Log delta** (% change in win rate, TTK)
6. **Repeat until convergence** (<5% deviation)

### 4.4 Telemetry Dashboard

Real-time metrics exposed by combat engine:
- Win rate matrix (NxN heatmap)
- TTK distribution (histogram)
- Damage breakdown (physical vs magical, mitigated vs actual)
- Status effect effectiveness (% uptime, damage contribution)
- Spell usage frequency
- Critical moment analysis (turn where battle outcome decided)

---

## 5. Grid-Based Combat (Phase 2)

### 5.1 Coordinate System

```typescript
interface Position {
  x: number; // 0-7
  y: number; // 0-7
}

interface GridEntity extends Entity {
  position: Position;
  movementRange: number; // Based on agility
  attackRange: number; // Melee=1, Ranged=3-5
}
```

### 5.2 Movement Mechanics

- **Movement Points = Agility / 5** (rounded)
- **Movement Cost = 1 per tile** (diagonal = 1.4)
- **Pathfinding:** A* algorithm, avoid occupied tiles
- **Opportunity Attacks:** Moving away from melee range triggers free attack

### 5.3 Range & Line of Sight

```typescript
function inRange(attacker: GridEntity, target: GridEntity): boolean {
  const distance = euclideanDistance(attacker.pos, target.pos);
  return distance <= attacker.attackRange;
}

function hasLineOfSight(from: Position, to: Position, grid: Grid): boolean {
  return raycast(from, to, grid).every(tile => !tile.blocksLOS);
}
```

### 5.4 Basic AI

```typescript
function selectAction(entity: GridEntity, enemies: GridEntity[]): Action {
  const inRangeTargets = enemies.filter(e => inRange(entity, e));
  
  if (inRangeTargets.length > 0) {
    return { type: 'attack', target: inRangeTargets[0] };
  } else {
    const nearest = findNearestEnemy(entity, enemies);
    return { type: 'move', path: calculatePath(entity.pos, nearest.pos) };
  }
}
```

---

## 6. Multi-Unit Combat (Phase 3)

### 6.1 Party Composition (5v5 / 5vMany)

**Standard 5-Hero Party:**
1. Tank (frontline)
2. Support (backline)
3. DPS (mid/backline)
4. Bruiser (frontline/mid)
5. Assassin (flex)

### 6.2 AoE Mechanics

```typescript
function applyAoE(spell: Spell, center: Position, radius: number) {
  const targets = getAllEntitiesInRadius(center, radius);
  targets.forEach(t => {
    const damage = spell.baseDamage * 0.65; // AoE penalty
    applyDamage(t, damage);
  });
}
```

### 6.3 Buff/Debuff System

```typescript
interface Buff {
  id: string;
  source: string; // Caster ID
  target: string;
  type: 'stat_modifier' | 'damage_over_time' | 'immunity';
  stat?: string; // e.g., 'damage', 'armor'
  value: number;
  mode: 'additive' | 'multiplicative';
  duration: number; // turns
  stackable: boolean;
}
```

**Examples:**
- **Battle Cry:** +20% damage to all allies (3 turns)
- **Armor Shred:** -30 armor to target (4 turns, stackable 3x)
- **Fortify:** +50 armor to self (2 turns)

### 6.4 Synergies

| Combo | Effect |
|-------|--------|
| Tank + Support | Tank gets +30% healing, Support gets +20% armor while near Tank |
| Assassin + DPS | First crit on target grants DPS +15% damage vs same target for 2 turns |
| Bruiser + Tank | Both gain +10% lifesteal when adjacent |

### 6.5 Multi-Unit Metrics

- **Team DPS:** Sum of all damage/turn
- **Damage Distribution:** % contribution per role
- **Survival Rate:** % of team alive at end
- **Focus Fire Efficiency:** Avg turns to eliminate priority target
- **Utility Uptime:** % of combat with active buffs

---

## 7. Encounter Check System

### 7.1 Elite Check Types

#### **Elite 1: High Armor Scaling**
- **Enemy Composition:** 1 Tank, 2 DPS
- **Mechanic:** Tank gains +10 armor per turn (max 200)
- **Failure:** Team runs out of damage before breaking armor
- **Success:** Eliminate DPS quickly, then chip Tank with armor penetration
- **Effective Builds:** Assassin (ArmorIgnore spell), Bruiser (sustained DPS), Support (armor debuff)

#### **Elite 2: Evasion Boss**
- **Enemy:** Single boss with 90% evasion, 5000 HP
- **Mechanic:** Standard attacks have 10% hit chance
- **Failure:** Team lacks accuracy or guaranteed-hit spells
- **Success:** Use AoE (can't evade area effects), TxC buffs, or guaranteed-hit ultimates
- **Effective Builds:** Support (TxC buff), DPS with AoE variant

#### **Elite 3: Swarm (5v20)**
- **Enemy:** 20 weak enemies (50 HP each, 15 damage)
- **Mechanic:** Overwhelm through numbers
- **Failure:** Single-target focus, no AoE
- **Success:** AoE spam, Tank zone control, Support mass heals
- **Effective Builds:** DPS (Meteor), Support (Mass Heal), Tank (AoE taunt)

#### **Elite 4: Burst Race**
- **Enemy:** 3 Glass Cannon enemies (100 HP, 80 damage each)
- **Mechanic:** Kill or be killed in 3 turns
- **Failure:** Too slow, team wiped turn 3-4
- **Success:** Assassin burst, DPS priority targeting, Support preemptive shields
- **Effective Builds:** 2 Assassins, 1 Support (shields), skip Tank entirely

#### **Elite 5: Immunity Phases**
- **Enemy:** Boss with rotating 100% physical/magical immunity (alternates every 2 turns)
- **Mechanic:** Must have both damage types
- **Failure:** Pure physical or pure magical team
- **Success:** Balanced damage types, adapt targeting per phase
- **Effective Builds:** Hybrid DPS (physical + magical spells), Bruiser (mixed damage)

#### **Elite 6: Healing Boss**
- **Enemy:** Boss with 40% lifesteal and self-heal every 3 turns
- **Mechanic:** Outheals player damage if low burst
- **Failure:** Sustained damage insufficient, boss recovers
- **Success:** Burst windows, healing reduction debuffs, execute finishers
- **Effective Builds:** Assassin (Execute), Support (Grievous Wounds), DPS (burst rotation)

### 7.2 Check Matrix

| Check | Required Roles | Effective Spells | Alternative Solutions |
|-------|----------------|------------------|----------------------|
| High Armor | DPS, Bruiser | ArmorPen, Execute | Prolonged fight with Support sustain |
| Evasion | Support, DPS | AoE, TxC Buff | Mass Heal + attrition |
| Swarm | Tank, DPS | AoE Multi-target | Heavy single-target if protected by Tank |
| Burst Race | 2+ DPS/Assassin | Burst Variants | Support shields to survive counterattack |
| Immunity | Hybrid DPS | Mixed Damage Types | Summons/DoTs bypass immunity windows |
| Healing Boss | Assassin, DPS | Burst, Healing Reduction | Massive overkill damage in single turn |

---

## 8. Drop System & Build Variability

### 8.1 Drop Mechanics

**Drop Pools:**
- Common: 60% (base variants)
- Rare: 30% (improved variants, +1 stat modifier)
- Epic: 9% (AoE/Burst/Ignore variants)
- Legendary: 1% (unique mechanics, double stat modifiers)

**Example Drops:**
- Common: **Fireball** (120% INT)
- Rare: **Greater Fireball** (150% INT, 15% burn)
- Epic: **Meteor** (AoE, 0.65x per target, 10% burn all)
- Legendary: **Cataclysm** (AoE, 1.0x per target, 20% burn, 5-turn cooldown)

### 8.2 Situational Value

**"Bad" drops that become optimal:**
- **Weak Heal (20% max HP):** Useless in boss fights, perfect for 5v20 swarm (cheap spam)
- **Low Damage AoE (40% per target):** Bad vs single boss, essential vs swarm
- **50% ArmorIgnore, -30% damage:** Bad vs low-armor, breaks High Armor Elite

### 8.3 Emergent Solutions

**Scenario:** Elite 4 (Burst Race) but only have 1 Assassin and weak DPS
- **Solution:** Support uses all mana for damage buffs turn 1, sacrifice self to empower Assassin burst
- **Alternative:** Tank taunts 2 enemies, team focuses 1 at a time (risky but possible)

### 8.4 Build Constraints

**No Perfect Builds:**
- Players cannot choose drops, must adapt to what they find
- Spell synergies discovered through experimentation
- Some encounters become impossible with wrong drops → roguelike failure state

---

## 9. Roadmap

### **Phase 1: Core 1v1 System (4-6 weeks)**
- [x] Implement 5 base archetypes
- [x] Combat engine (damage, hit/miss, crit)
- [x] 10 base spells (5 offensive, 3 utility, 2 control)
- [x] Automated testing suite
- [x] Balance iteration (target ±10% win rates)

### **Phase 2: Advanced Spells & Resources (3-4 weeks)**
- [ ] Mana system
- [ ] Cooldown mechanics
- [ ] 20 spell variants (AoE, Burst, DoT, Ignore)
- [ ] Status effect expansion (6 → 12 types)
- [ ] Testing suite v2 (spell effectiveness metrics)

### **Phase 3: Grid & AI (5-7 weeks)**
- [ ] 8x8 grid implementation
- [ ] Movement & pathfinding (A*)
- [ ] Range & Line of Sight
- [ ] Basic AI (move → attack logic)
- [ ] 1v1 grid validation tests

### **Phase 4: Multi-Unit & Encounters (6-8 weeks)**
- [ ] 5v5 / 5vMany support
- [ ] AoE spell mechanics
- [ ] Buff/Debuff system
- [ ] Synergy system
- [ ] 6 Elite encounter templates
- [ ] Victory/defeat conditions

### **Phase 5: Drop System & Polish (4-5 weeks)**
- [ ] Random drop generation
- [ ] Spell variant tagging (AoE, Burst, etc.)
- [ ] Roguelike run structure (floors, elite encounters)
- [ ] Advanced telemetry (encounter success rates, drop effectiveness)
- [ ] Final balance pass (all encounters, all builds)

---

## 10. Design Principles for New Encounters

### 10.1 Encounter Creation Checklist

1. **Define the Core Mechanic**
   - What makes this fight unique? (scaling, immunity, swarm, etc.)
   - What mistake should punish the player?

2. **Set Numerical Parameters**
   - Enemy HP, Armor, Evasion
   - Damage output (per turn, burst potential)
   - Scaling rates (if applicable)
   - Turn thresholds (e.g., "enrage at turn 10")

3. **Identify Counters**
   - List 2-3 spell types that trivialize the fight
   - List 2-3 spell types that make it very hard

4. **Design Multiple Solutions**
   - Optimal solution (specific spell combo)
   - Suboptimal but viable (creative use of "bad" drops)
   - High-risk gambit (sacrifice strategy)

5. **Validate with Simulator**
   - Run 100 sims with optimal build → 80%+ win rate
   - Run 100 sims with suboptimal → 40-60% win rate
   - Run 100 sims with counter-build → 10%- win rate

### 10.2 Example: Designing "Elite 7: Mirror Match"

**Concept:** Enemy team is a perfect copy of player team

**Mechanic:** AI gets +20% stats to compensate for worse decision-making

**Failure:** Player plays too aggressively, loses resource war

**Success:** Exploit AI predictability, bait cooldown usage, win micro-decisions

**Counters:**
- Burst specs (kill before AI adapts)
- Superior positioning (AI follows simple rules)
- Defensive pivot (outlast with superior macro)

**Parameters:**
- Enemy HP: Player HP × 1.2
- Enemy Damage: Player Damage × 1.2
- AI logic: Focus lowest HP, use strongest spell off cooldown

**Testing:**
- Player with perfect play: 70% win rate
- Player with average play: 50% win rate
- Player with poor play: 30% win rate

---

## 11. Integration with Existing Systems

### 11.1 Balancing Module Integration

All numerical values (stat weights, damage formulas, TTK targets) are sourced from `BalanceConfigManager`:

```typescript
import { BalanceConfigManager } from '@/balancing/BalanceConfigManager';

const config = BalanceConfigManager.getInstance();
const hpWeight = config.getStatWeight('hp');
const targetTTK = config.getTargetTTK('tank_vs_dps');
```

### 11.2 Fantasy UI Integration

Encounter UI will use Fantasy components:
- `FantasyCard` for enemy stat display
- `FantasyButton` for spell casting
- `FantasyModal` for victory/defeat screens

### 11.3 Persistence

Encounter results, drop history, and run progress stored via:
- `ArchetypeStorage` (party composition)
- New: `RunStorage` (current floor, drops, encounters cleared)

---

**End of Specification**
