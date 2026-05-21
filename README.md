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

- **Vertical Slice (Minimal Components)**
  - 📊 [Component Hub](/minimal) – Isolated component testing with 370+ tests
  - 📝 [Specs](./src/docs/docs/minimal_slice/) – Component specifications
  - 🧪 [Test Coverage](./tests/e2e/minimal_slice_*.spec.ts) – Playwright E2E tests
  - 📦 [Frozen Versions](./VERTICAL_SLICE_FROZEN_VERSIONS.md) – Version history
  - 🔄 [Versioning Guide](./context/VERTICAL_SLICE_REFERENCE.md) – SemVer & governance
  - **Quick Commands:**
    ```bash
    pnpm test:minimal              # Run all minimal slice tests
    pnpm test:minimal:headed       # View browser during tests
    pnpm test:minimal:debug        # Debug mode
    pnpm test:minimal:report       # View HTML test report
    ```
- **Core**
  - `Balancer` – primary config-first balancing UI.
    - **Custom Archetypes via Helper**: every new template must use `withAllocationDefaults` from `src/balancing/archetype/allocationDefaults.ts` so all stats stay in sync with the config-first weight system.  
      ```ts
      // src/balancing/archetype/customMythic.ts
      import { withAllocationDefaults } from '@/balancing/archetype/allocationDefaults';
      import type { ArchetypeTemplate } from '@/balancing/archetype/types';
      import { ArchetypeRegistry } from '@/balancing/archetype/ArchetypeRegistry';

      const MYTHIC_SENTINEL: ArchetypeTemplate = {
        id: 'mythic_sentinel',
        name: 'Mythic Sentinel',
        category: 'Tank',
        description: 'Solar ward tank with balanced sustain.',
        allocation: withAllocationDefaults({
          hp: 45,
          armor: 20,
          ward: 15,
          damage: 10,
          txc: 5,
          regen: 5,
        }),
        minBudget: 30,
        maxBudget: 100,
        tags: ['defensive', 'ward', 'balanced'],
        version: '1.1.0',
      };

      ArchetypeRegistry.register(MYTHIC_SENTINEL);
      ```
      1. **Clone an existing template** (see `src/balancing/archetype/constants.ts`) and adjust only the deltas you need.  
      2. **Wrap partial allocations** with `withAllocationDefaults(...)` to keep every stat key present (zeroed values included).  
      3. **Register the template** through `ArchetypeRegistry.register` so the Balancer UI and simulations pick it up automatically.  
      4. **Avoid magic numbers**: if you introduce new stats/tags, add them to `src/balancing/config/*` and update the associated types before using them inside templates.
  - `Stat Testing` – Monte Carlo dashboards for marginal utility & synergy heatmaps.
  - `Spell Creation` – fantasy-themed spell editor wrapper.
- **Village Sandbox**
  - `Village Sandbox`, `Idle Village Config`, `Activity Detail Sandbox`, `Skill Check Lab`.  
    _Legacy note:_ the old "Idle Village" page is retained only for historical reference; all new work must target the Village Sandbox components (ActivityCard, ActivitySlot, TheaterView, ActiveHUD).
  - **Checklist per ogni PR che tocca `src/ui/idleVillage/**`:**
    1. Aggiorna `src/docs/docs/plans/village_sandbox_refactor_plan.md` (sezione 8.x) con stato/contratti aggiornati.
    2. Nel corpo PR aggiungi il bullet `- Docs updated (Village Sandbox plan)` e cita il test `tests/villageSandbox-reset.spec.ts` (o linka `npm run test:sandbox-reset`) per ricordare il reset E2E.
    3. Verifica la **lint quarantine WS6**: finché `src/ui/spell/SpellLibrary.tsx` e `tests/villageSandbox-trade.spec.ts` restano in `lintQuarantineIgnores` (vedi `eslint.config.js`), ogni PR deve confermare che la motivazione/documentazione è aggiornata e che non vengono aggiunti nuovi file alla lista.
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
npm run test               # CI-safe (vitest run)
npm run test -- <pattern>  # Targeted suites
npm run test:watch:dev     # Local watch mode (development only)
npm run test:e2e           # Playwright run mode (CI-safe)
npm run test:e2e:ui:dev    # Playwright UI/Watch (development only)
npm run preview:playwright # Build + preview bundle used automatically by Playwright config
```

> ℹ️ **Playwright WebServer Hardening** – The test runner now triggers `npm run preview:playwright`, which first executes `npm run build:playwright` (bundle with `--mode playwright`) and then serves it on `http://127.0.0.1:5179` with `--strictPort`. No manual `npm run dev` is needed for e2e tests; just run `npx playwright test` or the scripts above and the hardened web server lifecycle is handled automatically.

### Component Lab → Minimal Promotion Guard

- Use `npm run component-lab:promote -- --featureId=<id> [--screenshot=/path/to/evidence.png]` every time a Lab component graduates into Minimal Gameplay.
- The guard sequentially runs lint → test → build:check → kanban:lint, persists the raw output under `test-results/minimal-vertical-slice-<featureId>-<timestamp>.log`, and appends an entry to `src/docs/docs/IMPLEMENTED_PLAN.md`.
- In CI, call the same script before deploying Minimal updates so the generated log can be uploaded as an artifact (e.g., GitHub Actions `actions/upload-artifact`) and attached to the promotion ticket.

## 📚 Documentation
- **[Development Guidelines](DEVELOPMENT_GUIDELINES.md)** - ⚠️ **MUST READ** before implementing anything
- [Implementation Plan](docs/implementation_plan.md)
- [Combat System Audit](docs/combat_system_audit.md)
- [Changelog](CHANGELOG.md)

## 🧪 Lab Only Development

This tool is designed for **lab-only development and testing**. No PWA deployment or mobile distribution is planned.

### Local Development Focus
- **Environment**: Local development server only (`npm run dev`)
- **Testing**: Local Playwright testing and unit tests
- **Telemetry**: Local logging and analysis tools
- **No External Services**: Complete offline functionality

## 🤝 Contributing

Contributions are welcome! Please read the [implementation plan](docs/implementation_plan.md) to understand the current roadmap.

### Checklist "Prima di scrivere un prompt"
- [ ] ID univoco assegnato? (non duplicato)
- [ ] `npm run kanban:lint` eseguito e superato?
- [ ] Placeholder rimosso se usato temporaneamente?
- [ ] Documentazione correlata aggiornata dopo completamento?

## 📄 License
MIT License
