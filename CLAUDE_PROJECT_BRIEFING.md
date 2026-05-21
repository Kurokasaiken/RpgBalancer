# Claude Project Briefing - RPG Vertical Slice

## 🎯 PROJECT IDENTITY

**What this project IS:**
- **Idle Village RPG** - Drag & drop resident management game
- **Vertical Slice**: 10-minute playable demo (Pacifista path)
- **Core Loop**: Drag residents → work slots → resources → quests → progression

**What this project is NOT:**
- Combat balancer simulator (ignore that part of codebase)
- Complex RPG with combat systems
- Multiplayer or cloud services
- Data analysis tool

---

## 🎮 VERTICAL SLICE SCOPE

### Target Experience (10 minutes)
1. **Poverty Phase** (0-2 min): Drag Vagabondo → Rovine → collect resources
2. **Investment Phase** (2-5 min): Choose between Mercante vs Focolare upgrade
3. **Wall & Failure Phase** (5-8 min): Quest "Cripta Allagata" with 40% fail rate
4. **Triumph Phase** (8-10 min): Craft "Piede di Porco" → 75% success → reward

### Core Components to Use
- **`MinimalGameplayPage.tsx`** - Main gameplay interface
- **`PgCard.tsx`** - Resident cards (already open in IDE)
- **`CustomDragOverlay.tsx`** - Drag & drop feedback (already open in IDE)
- **`DragTestContainer.tsx`** - Drag testing (already open in IDE)

### Key Systems (ALREADY EXIST)
- Drag & drop via @dnd-kit
- Time engine with stamina/fatigue
- Resource management (pietra, scarti, zuppa)
- Quest system with Asterism skill checks
- Buff/debuff system (BenNutrito, UmiditaNelleOssa)

---

## 🚫 WHAT TO IGNORE

### Do NOT Touch These Areas:
- **Combat Simulator** (`src/ui/combat/`)
- **Balancing Engine** (`src/balancing/` - except config files)
- **Stat Balancer Tool** 
- **Combat Analytics**
- **Weapon/Armor Systems**
- **Battle Simulators**

### Focus Exclusively On:
- `src/ui/idleVillage/` - Your entire playground
- `src/balancing/config/idleVillage/` - Config files only
- `src/engine/game/idleVillage/TimeEngine.ts` - Time progression

---

## 🎯 IMMEDIATE NEXT STEPS

### Week 1: Core Loop Implementation
1. **Implement 4-phase script** in `MinimalGameplayPage.tsx`
2. **Configure quest "Cripta Allagata"** with 40%/75% success rates
3. **Add crafting recipes** (Focolare, Zuppa Calda, Piede di Porco)
4. **Test drag & drop flow** with existing components

### Week 2: Critical Blockers
1. **QuestSuccessModal** - Show rewards on quest completion
2. **Reward Application System** - Apply buffs/debuffs correctly
3. **Stamina system** - Force rest when < 10%

### Week 3: Polish & Testing
1. **Physics Lab alignment** - Test with drag feedback
2. **Audio/FX** - Add basic sounds for drag/collapse/success
3. **End-to-end testing** - Full 10-minute playthrough

---

## 🎮 SUCCESS CRITERIA

**Vertical slice is COMPLETE when:**
- [ ] User can drag Vagabondo → Rovine → collect 3 pietra + 3 scarti
- [ ] User can build Focolare (10 pietra + 5 scarti)
- [ ] User can craft Zuppa Calda (2 scarti) → BenNutrito buff
- [ ] Quest "Cripta Allagata" fails at 40% → applies UmiditaNelleOssa debuff
- [ ] User can craft Piede di Porco (6 pietra + 2 oggetti recuperati)
- [ ] Second quest attempt succeeds at 75% → shows reward modal
- [ ] Full 10-minute experience plays smoothly without bugs

---

## 🛠️ TECHNICAL CONSTRAINTS

### MUST Use:
- **Config-first**: All values from `MINIMAL_GAMEPLAY_CONFIG`
- **Persistence**: Save state via `PersistenceService`
- **Drag & Drop**: Use existing @dnd-kit setup
- **Style Lab**: Respect existing UI tokens

### MUST NOT:
- Create new balancing systems
- Implement combat mechanics
- Add complex AI or pathfinding
- Build multiplayer features

---

## 📁 KEY FILES TO KNOW

```
src/ui/idleVillage/
├── MinimalGameplayPage.tsx          # MAIN TARGET
├── components/
│   ├── PgCard.tsx                  # Already open
│   ├── CustomDragOverlay.tsx       # Already open
│   └── DragTestContainer.tsx       # Already open
├── hooks/
│   └── useMinimalGameplay.ts        # State management
└── config/
    └── minimalGameplayConfig.ts    # Game parameters
```

---

## 🎯 YOUR MISSION

**Build the 10-minute Idle Village demo using ONLY existing components.**
**Focus on drag & drop flow and quest progression.**
**Ignore everything else - especially the combat balancer.**

**You have 2-3 weeks. Start with the drag flow that's already working.**
