# Stress Test Dashboard – UI Regression Notes

## Layout Overview

- **Page**: `StressTestDashboard` @src/ui/balancing/StressTestDashboard.tsx
- **Theme**: Style Laboratory tokens and components. Legacy Gilded Observatory classes have been archived.
- **Hero Block**: Phase label, title, description, controls (Refresh + Stat Controls drawer)
- **Action Row**: Generate, Run Analysis, Export JSON/CSV buttons (config-first, disabled states respect `isLoading`)

## Navigation & Routing

- **App Tab**: 'balancerStats' in FantasyLayout (loads via lazy import)
- **Route**: Internal tab navigation (no URL routing, tab-based app)
- **Access**: From main app navigation, select "Stat Stress Testing" tab
- **Lazy Loading**: Implemented in `src/App.tsx` with Suspense fallback
- **Error Boundary**: Wrapped with component name "Stress Test Dashboard"

## Tabs Navigation

- **Implementation**: Custom pill toggles (not shadcn/Tabs yet)
- **Tabs**: Utility (Marginal Table), Synergy (Heatmap), Radar (Profiles)
- **State**: Local `activeTab` state with 'utility' | 'synergy' | 'radar' values

## Data Binding

- Hook: `useStressTesting()`
  - Provides `generateArchetypes`, `runAnalysis`, `exportResults`, `refreshData`
  - Supplies `archetypes`, `marginalUtilities`, `synergies`, `heatmapData`, `selectedStat`, `selectedPair`
- Config: `useBalancerConfig()` for labels + stat ordering

## Sections

1. **Marginal Utility Table** (`MarginalUtilityTable`)
   - Props: `{ results: marginalUtilities }`
   - Sorted by marginal utility, styled for dark theme
2. **Synergy Heatmap** (`SynergyHeatmap`)
   - Props: `{ synergies }`
   - Clickable cells with detail drawer inline
3. **Stat Profile Radar** (`StatProfileRadar`)
   - Props: `{ profiles: archetypes }`
   - Placeholder table ready for chart integration

## Loading & Error States

- Inline cards show status if `isLoading` true or `error` set
- Tabs show fallback messaging when data arrays empty

## Evidence

- Run: `npm run dev` → navigate to `/balancing/stress-testing` (internal route) confirms drawer + tabs
- Hook instrumentation logs `[useStressTesting]` operations (see console)

## Follow-ups

- Integrate actual shadcn drawer when component library lands
- Replace radar placeholder with chart (D3/Chart.js) once design approved
- Add presets for stat pair suggestions (config-driven)
