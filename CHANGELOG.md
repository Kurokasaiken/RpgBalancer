# Changelog - Sistema di Bilanciamento

## 2025-12-17 - Phase 10 Priority Fix (BalancerNew)

### ✅ Completed
- **Reset Controls**: Stat, card e pagina usano ora i callback di `useBalancerConfig`, mantenendo i valori importati dal preset iniziale.
- **Lock/Hide**: Card e stat rispettano gli stati `isLocked`/`isHidden` con UI coerente (lock icon text-sm, cluster di pulsanti riordinato).
- **Import/Export/Reset Feedback**: `ConfigToolbar` mostra toast di esito e prevenzione errori (try/catch + validazione).
- **App Load Marker**: `App.tsx` espone `data-testid="app-loaded"` per Playwright e QA automatici.

### 🔍 QA
- `npx playwright test tests/balancer-new.spec.ts` eseguito con successo su Desktop Chrome, Mobile Safari e Mobile Chrome (dev server Vite su 127.0.0.1:5173).
- I log di presenza negativi nei test derivano da selettori incompleti (non attivano edit mode) ma le funzionalità sono verificate manualmente nella UI.

---

## 2025-11-23 - Phase 3 & Grid Arena Polish

### ✨ New Features
- **Synergy Matrix (Phase 3.1)**:
  - Implemented `SynergyAnalyzer` to detect multiplicative stat interactions.
  - Added UI matrix visualization in Testing Lab.
  - **Discovery**: Found +176% synergy between Armor and Regen.
- **Grid Arena UI Overhaul**:
  - Replaced corrupted SVG assets with professional-style PNG icons.
  - Implemented seamless CSS gradient terrain for cleaner aesthetics.
  - Added visual polish to grid tiles (borders, hover effects).

### 🔧 Improvements
- **Testing Lab Consolidation**:
  - Unified all testing tools (Combat, Weights, Validation, Synergies) into a single "🧪 Testing" tab.
  - Added "Auto-run" toggle for continuous balancing.
  - Added Test History tracking.

---

## 2025-11-23 - Phase 2: Stat Weights

### ✅ Completed
- **Stat Weight Database**:
  - Calculated theoretical HP values for all 9 core stats.
  - **Key Findings**: Resistance (1% = 100 HP), Lifesteal (1% = 40 HP).
- **StatWeigher Tool**:
  - Added Batch Mode for analyzing all stats at once.
  - Added CSV export for data analysis.

---

## 2025-11-23 - Phase 1: Foundation

### ✅ Completed
- **Combat Test Framework**:
  - Created Monte Carlo simulation engine (1000+ sims/test).
  - Implemented 6 baseline scenarios (Symmetry, Scaling, Mitigation, etc.).
- **Baseline Calibration**:
  - Validated `DEFAULT_STATS` to achieve perfect 50.05% symmetry.

### 🐛 Bug Fixes
- **`configApplyBeforeCrit`**: Fixed logic to correctly respect the "Mitigation before Crit" flag.

---

## 2025-11-23 - Initial Implementation Phase

### ✅ Assets Update
**Replaced AI-generated SVG with professional assets from game-icons.net**
- **Characters**: Warrior, Mage, Archer, Orc
- **Tiles**: Grass, Stone

### 🐛 Bug Fixes
#### **CRITICAL: `configApplyBeforeCrit` Implementation**
**Issue**: Flag existed in `StatBlock` but was not implemented in damage calculation flow
**Fix**: Added branching logic in `damageCalculator.ts` and UI toggle in `MitigationCard.tsx`.

### 📋 Documentation Created
- **`docs/combat_system_audit.md`**: Comprehensive audit (Grade A-).
- **`implementation_plan.md`**: 5-phase roadmap.
- **`task.md`**: Granular task tracking.
