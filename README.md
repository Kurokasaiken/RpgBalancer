# RPG Combat Simulator & Balancing Tool

A powerful, web-based tool for designing, testing, and balancing RPG combat systems. Built with React, TypeScript, and Tailwind CSS.

![Grid Arena Preview](/public/assets/tiles/grass.png)

## 🚀 Key Features

### ⚔️ Combat Simulator
- **Turn-based Engine**: Robust combat logic supporting HP, Damage, Armor, Resistance, Crit, Hit Chance, Evasion, Lifesteal, Regen, Ward, and Block.
- **Configurable Mechanics**: Toggle calculation orders (Mitigation vs Crit, Flat vs Percent) to test different system architectures.
- **Grid Arena**: 8x8 tactical grid for spatial combat testing with movement and range mechanics.

### 🧪 Testing Lab
- **Automated Balancing**: Run thousands of Monte Carlo simulations to verify fairness and balance.
- **Synergy Matrix**: Analyze how different stats interact (e.g., Armor + Regen) to find broken combinations.
- **Stat Weighting**: Automatically calculate the "HP Value" of every stat (e.g., 1 Armor = 1.8 HP).
- **Diminishing Returns**: Visualize effectiveness curves for stats like Armor and Evasion.

### 🔮 Spell & Entity Editor
- **Spell Creation**: Visual editor for designing spells. Now loads base spells from `src/balancing/spells.json`. When saving, only fields that differ from the default *Basic Attack* are persisted, keeping the JSON lean.
- **Entity Manager**: Create and save characters with custom stat blocks for testing.
- **Idle Arena**: Watch AI‑controlled entities fight indefinitely to test long‑term balance.

## 🗺️ Navigation & Layout

The application uses the **FantasyLayout** sidebar (desktop) and a compact bottom bar (mobile). Current sections and entries are entirely config-driven:

- **Core**
  - `Balancer` – primary config-first balancing UI.
  - `Stat Testing` – Monte Carlo dashboards for marginal utility & synergy heatmaps.
  - `Spell Creation` – fantasy-themed spell editor wrapper.
- **Idle Village**
  - `Idle Village`, `Idle Village Config`, `Verb Detail Sandbox`, `Skill Check Lab`.
  - Additional live tools: `Archetypes`, `War Room`, `1v1 Archetypes`, `Battlefield`, `Heroes`, `Builder`, `Grimoire`, `Roster`.
- **Mockups**
  - Showcase spaces such as `Gilded Observatory`, `Obsidian Sanctum`, `Aurora Workshop`, `Arcane Tech Glass`, `Aether Brass Lab`, `Quantum Scriptorium`, `Midnight Meridian`, `Seraphim Archive`, `Verdant Alloy`.
- **System**
  - `Tactical Lab` for experimental combat systems.

On mobile, the thumb-zone nav exposes `Balancer`, `Archetypes`, `Spell Creation`, `Arena`, plus a `More` drawer that mirrors the sections above while preserving the Gilded Observatory theme.

## 🛠️ Tech Stack
- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **State Management**: React Hooks + LocalStorage persistence
- **Testing**: Vitest (Unit), Custom Monte Carlo Framework (Simulation)

## 📦 Getting Started

### Prerequisites
- **Node.js v20.19.6** (required for Vite and testing tools)
- **nvm** (Node Version Manager) - recommended for managing Node versions

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/rpg-combat-simulator.git
   cd rpg-combat-simulator
   ```

2. **Activate Node 20** (via nvm)
   ```bash
   nvm use
   # This will automatically use v20.19.6 from .nvmrc
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   Navigate to `http://localhost:5173`

### Running Tests
```bash
nvm use  # Ensure Node 20 is active
npm test
```

## 📚 Documentation
- **[Development Guidelines](DEVELOPMENT_GUIDELINES.md)** - ⚠️ **MUST READ** before implementing anything
- [Implementation Plan](docs/implementation_plan.md)
- [Combat System Audit](docs/combat_system_audit.md)
- [Changelog](CHANGELOG.md)

## 🚀 Deployment & Mobile Access

Want to test on your phone or share with friends?

1. **Deploy to Vercel:** Follow the [Deployment Guide](DEPLOY_GUIDE.md).
2. **Mobile Setup:** Read the [Mobile Setup Guide](MOBILE_SETUP.md) for the best experience.

**Current Deployment:** _(Run `vercel` to generate URL)_

## 🤝 Contributing
Contributions are welcome! Please read the [implementation plan](docs/implementation_plan.md) to understand the current roadmap.

## 📄 License
MIT License
