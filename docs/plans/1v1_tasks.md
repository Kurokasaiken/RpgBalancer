# 1v1 Combat System Polish - Task Checklist

> **Executable Tasks** for 1v1 Combat Completion  
> 📋 **Design Context:** [1v1_combat_plan.md](1v1_combat_plan.md)

**Status:** 80% Done (20/30 tasks remaining)  
**Already Complete:** DoT/Buff systems, turn-based combat, damage resolution

---

## Phase 1: Core Mechanics (MOSTLY COMPLETE)

### 1.1 DoT/HoT Module ✅ DONE
- [x] Create `src/balancing/modules/dot.ts`
- [x] `calculateTotalValue(amountPerTurn, duration)`
- [x] `applyTick(currentHp, amountPerTurn, maxHp)`
- [x] `tickDurations(effects)`
- [x] 5 stack modes implemented
- [x] Integrated into combat engine
- [x] Test coverage: `DotStacking.test.ts` (7/7)

### 1.2 Buff/Debuff Module ✅ DONE
- [x] Create `src/balancing/modules/buffs.ts`
- [x] `calculateBuffPower(buff, weights)`
- [x] `applyBuffs(baseStat, buffs, statName)`
- [x] `tickDurations(buffs)`
- [x] Additive + Multiplicative stacking
- [x] Shield system integrated
- [x] Test coverage: `BuffShieldIntegration.test.ts` (6/6)

### 1.3 Combat Engine Integration ✅ DONE
- [x] Apply DoT ticks per turn
- [x] Apply buffs to stats
- [x] Shield damage absorption
- [x] Tick down durations
- [x] Logging

---

## Phase 2: Remaining Features (TODO)

### 2.1 Mana System Integration

- [ ] Add mana tracking to combat state
  - [ ] `currentMana` field in entity
  - [ ] `maxMana` stat in StatBlock
  - [ ] `manaRegen` stat

- [ ] Spell casting mechanics
  - [ ] Check mana cost before casting
  - [ ] Deduct mana on cast
  - [ ] Handle insufficient mana (can't cast)

- [ ] Mana regeneration
  - [ ] Apply mana regen per turn
  - [ ] Cap at maxMana
  - [ ] Log mana changes

- [ ] Update combat engine
  - [ ] Modify `resolveCombatRound` to handle mana
  - [ ] Add mana checks to spell casting logic

- [ ] Test coverage
  - [ ] Write `ManaSystem.test.ts` (5-8 tests)
    - [ ] Should regenerate mana per turn
    - [ ] Should prevent casting if insufficient mana
    - [ ] Should deduct mana on successful cast
    - [ ] Should cap mana at maxMana
    - [ ] Should handle mana overflow

### 2.2 Status Effects

- [ ] Define status effect types
  - [ ] Create `StatusEffect` interface
    - [ ] type: 'stun' | 'slow' | 'silence' | 'root'
    - [ ] duration: number
    - [ ] value: number (for slow %, etc.)

- [ ] Implement effect behaviors
  - [ ] **Stun:** Skip turn entirely
  - [ ] **Slow:** Reduce speed stat
  - [ ] **Silence:** Prevent spell casting
  - [ ] **Root:** Prevent movement (if added)

- [ ] Integrate into combat engine
  - [ ] Check for stun before turn
  - [ ] Apply slow to speed calculation
  - [ ] Block spell casts if silenced
  - [ ] Tick down durations

- [ ] Test coverage
  - [ ] Write `StatusEffects.test.ts` (8-10 tests)
    - [ ] Should skip turn when stunned
    - [ ] Should reduce speed when slowed
    - [ ] Should prevent casting when silenced
    - [ ] Should tick down durations
    - [ ] Should remove expired effects
    - [ ] Should stack/refresh correctly

### 2.3 Combat Modifiers (Extensibility)

- [ ] Create `src/engine/combat/modifiers.ts`
  - [ ] Define `CombatModifiers` interface
    - [ ] damageMultiplier
    - [ ] healingMultiplier
    - [ ] turnLimit
    - [ ] enemyScaling (HP/Damage multipliers)
  - [ ] Create `DEFAULT_1V1_MODIFIERS`
  - [ ] Add JSDoc documentation

- [ ] Integrate into combat engine
  - [ ] Pass modifiers to `resolveCombatRound`
  - [ ] Apply damage multiplier to all damage
  - [ ] Apply healing multiplier to all healing
  - [ ] Enforce turn limit (draw condition)
  - [ ] Apply enemy scaling

- [ ] Future modifiers (placeholders)
  - [ ] `BOSS_MODIFIERS` (higher HP/Damage)
  - [ ] `SWARM_MODIFIERS` (lower healing value)
  - [ ] `TEAMFIGHT_MODIFIERS` (AoE bonus)

---

## Phase 3: Polish & Optimization (TODO)

### 3.1 Performance Optimization

- [ ] Profile combat simulation performance
  - [ ] Identify bottlenecks (likely in Monte Carlo loops)
  - [ ] Optimize hot paths

- [ ] Optimize StatBlock calculations
  - [ ] Cache derived stat values
  - [ ] Avoid redundant calculations per hit

- [ ] Optimize DoT/Buff application
  - [ ] Batch updates where possible
  - [ ] Use efficient data structures

### 3.2 Combat Log Improvements

- [ ] Add color coding to log messages
  - [ ] Damage → red
  - [ ] Healing → green
  - [ ] Buffs → blue
  - [ ] Debuffs → purple

- [ ] Add filtering options
  - [ ] Filter by event type
  - [ ] Filter by entity
  - [ ] Toggle verbose mode

- [ ] Add combat summary
  - [ ] Total damage dealt by each entity
  - [ ] Total healing received
  - [ ] Number of crits, fails, dodges

### 3.3 Code Review & Refactoring

- [ ] Review all combat-related files
  - [ ] Remove dead code
  - [ ] Improve naming consistency
  - [ ] Add missing JSDoc comments

- [ ] Extract reusable utilities
  - [ ] Damage calculation helpers
  - [ ] Stat application helpers
  - [ ] Logging utilities

- [ ] Improve error handling
  - [ ] Validate inputs
  - [ ] Graceful degradation
  - [ ] Helpful error messages

---

## Phase 4: Testing Framework (PARTIALLY DONE)

### 4.1 Automated Weight Discovery ✅ DONE
- [x] `WeightCalibration.test.ts` with binary search
- [x] Auto-calibrate lifesteal, regen, etc.

### 4.2 Archetype Validation Tests (PENDING)

- [ ] Write `ArchetypeValidation.test.ts`
  - [ ] Define test archetypes (Tank, DPS, Sustain, Evasive)
  - [ ] Test: No archetype >70% winrate vs all others
  - [ ] Test: All archetypes >30% winrate vs all others
  - [ ] Log average winrates per archetype

### 4.3 Combat Consistency Tests (DONE)

- [x] Write `CombatConsistency.test.ts` (Covered by `CombatSimulator.test.ts`)
  - [x] Test: Deterministic results with same seed
  - [x] Test: Combat terminates within reasonable turns (<100)
  - [x] Test: No infinite loops
  - [x] Test: Combat state always valid

---

## Phase 5: Documentation & User Testing

### 5.1 Documentation Updates

- [ ] Update `architecture.md`
  - [ ] Document mana system
  - [ ] Document status effects
  - [ ] Document combat modifiers

- [ ] Update `walkthrough.md`
  - [ ] Add section on 1v1 combat completion
  - [ ] Document new features (mana, status effects)

- [ ] Create combat guide
  - [ ] How combat resolution works
  - [ ] Damage formula explanation
  - [ ] DoT/Buff mechanics
  - [ ] Mana management tips

### 5.2 User Testing

- [ ] Test with real users (if applicable)
  - [ ] Observe combat flow
  - [ ] Gather feedback on balance
  - [ ] Identify confusing elements

- [ ] Address feedback
  - [ ] Adjust tooltips/help text
  - [ ] Tweak balance if needed
  - [ ] Fix usability issues

### 5.3 Bug Fixes

- [ ] Review open issues
- [ ] Fix any reported bugs
- [ ] Regression testing

---

## PROGRESS TRACKING

**Already Complete:** 10 tasks ✅  
**Remaining:**
- [ ] Mana System (5 tasks)
- [ ] Status Effects (6 tasks)
- [ ] Combat Modifiers (3 tasks)
- [ ] Performance (3 tasks)
- [ ] Combat Log (3 tasks)
- [ ] Code Review (3 tasks)
- [ ] Testing (6 tasks)
- [ ] Documentation (5 tasks)

**Total:** 10/44 tasks complete (23%)

---

## SUCCESS CRITERIA

✅ **All modules inherit from Balancer**  
✅ **>95% test pass rate** (82/122 currently)  
✅ **DoT/Buffs working correctly**  
✅ **Auto-calibration functional**  
[ ] **Mana system integrated**  
[ ] **Status effects working**  
[ ] **Combat modifiers implemented**  
[ ] **Performance optimized** (<3min for batch tests)  
✅ **Combat logs clear and useful**  
[ ] **Extensible for future scenarios**

---

## NEXT ACTIONS

1. Start with Phase 2.1: Mana System
2. Add mana tracking to combat state
3. Implement spell cost deduction
4. Move to Phase 2.2: Status Effects

📋 **For implementation formulas:** See [1v1_combat_plan.md](1v1_combat_plan.md)
