# Product Roadmap: Path to Commercialization

## 📊 Current State Analysis
**Product Type:** Developer Tool / Sandbox Simulator
**Current Value:** High utility for game designers/balancers. Low entertainment value for players.
**Tech Stack:** Solid web foundation (React/Vite), robust math engine.

To transform this from a **Tool** into a **Sellable Game**, we need to bridge several gaps.

---

## 🛑 Gap Analysis (What's Missing?)

### 1. The "Game" Loop (Critical)
Currently, there is no goal, progression, or win condition.
*   **Missing**:
    *   **Campaign Mode**: A series of battles with increasing difficulty.
    *   **Progression System**: XP, Leveling, Skill Trees, Loot drops.
    *   **Meta-Game**: Base building, party management, or deck building (if card-based).
    *   **Economy**: Gold, resources, shops.

### 2. Content Depth
*   **Missing**:
    *   **Enemy Variety**: Need 20+ unique enemies with distinct AI behaviors (not just stats).
    *   **Items/Equipment**: A database of weapons/armor with visual representation.
    *   **Maps/Biomes**: More than just "Grass" and "Stone". Interactive terrain (hazards, cover).
    *   **Story/Lore**: Why are we fighting? Flavor text, dialogue.

### 3. Visuals & Audio (Juice)
*   **Missing**:
    *   **Animations**: Attack swings, hit reactions, spell effects (particles), death animations.
    *   **Sound Design**: SFX for hits, blocks, crits, footsteps. Background music.
    *   **UI Polish**: The current UI is "functional/dashboard". Needs a "gamey" HUD, menus, tooltips.
    *   **Visual Feedback**: Screen shake, damage numbers popping up, flash effects.

### 4. User Experience (UX)
*   **Missing**:
    *   **Onboarding**: Tutorial to explain stats (Armor vs Resistance, etc.).
    *   **Save System**: Persistence across sessions (Cloud save or local file slots).
    *   **Settings Menu**: Audio volume, keybindings, graphics quality.

---

## 🗺️ Commercialization Roadmap

### Phase A: The "Indie Roguelike" Pivot (3-4 Months)
*Target: A sellable $5-10 game on Steam/Itch.io*

1.  **Define the Genre**: "Tactical Auto-Battler" or "Turn-Based Strategy Roguelite".
2.  **Implement Core Loop**:
    *   Start Run -> Draft Team -> Fight Battle -> Get Loot/XP -> Next Battle -> Boss.
3.  **Visual Overhaul**:
    *   Replace static icons with simple animated sprites (Pixel art is cost-effective).
    *   Add "Juice" (Screen shake, particles).
4.  **Content Pack 1**:
    *   3 Classes (Warrior, Mage, Archer).
    *   10 Enemy Types.
    *   50 Items.

### Phase B: The "Dev Tool" Pivot (Alternative)
*Target: A SaaS tool for Game Devs ($10-20/month or Asset Store package)*

1.  **Refine Export**: Allow exporting balanced JSON data for Unity/Unreal.
2.  **Integration**: Plugins for major engines.
3.  **Community Features**: Share builds/simulations.
4.  **Documentation**: Extensive wiki on the math models.

---

## 💰 Monetization Strategy

### Option 1: Premium Game (Recommended)
*   **Platform**: Steam (PC/Mac), App Store (Mobile).
*   **Price**: $4.99 - $9.99.
*   **Model**: One-time purchase. No ads, no IAP.
*   **Marketing**: Focus on "Deep Strategy", "Theory-crafting", "Infinite Replayability".

### Option 2: F2P Mobile
*   **Platform**: iOS/Android.
*   **Price**: Free.
*   **Model**: Ads for extra loot, Energy system (hated by core gamers), Skins.
*   **Risk**: Requires massive user acquisition budget.

---

## 📝 Immediate Next Steps (To make it a "Vertical Slice")

1.  **Game Mode**: Create a simple "Survival Mode" where you fight endless waves of enemies until you die, upgrading stats between rounds.
2.  **Visual Feedback**: Add floating damage numbers (Combat Text) to the Grid Arena.
3.  **Sound**: Add basic SFX library.

---

## 🏆 Verdict
Currently, you have a **powerful engine**. To make it **sellable**, you need to wrap a **game** around it. The "Survival Mode" is the fastest path to a playable demo.
