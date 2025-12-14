# Overlay Mode Plan (Desktop Companion)

> **Goal:** Transform the no-offline-progress constraint into a Steam-friendly feature by shipping a configurable overlay / bottom-screen companion that keeps the village loop visible while users multitask (Rusty's Retirement style).

**Created:** 2025-12-14  
**Status:** Draft – ready for implementation  
**Owner:** Phase 12 (Idle Village vertical slice)

---

## 1. Product Intent & Pillars

| Pillar | Description | Success Criteria |
|--------|-------------|------------------|
| Desk Companion | Always-visible panel (bottom strip or resizable floating window) that shows key stats, verbs in progress, and quick actions. | Players keep the game open during work/YouTube, reporting "no offline" as feature not bug. |
| Second-Screen Friendly | Steam Overlay + Steam Deck support. Works at 1280×800 and ultrawide. | Overlay Mode passes Steam Deck QA, and PC players report 0 friction keeping it visible. |
| Config-First | Reads from IdleVillageConfig + Balancer stats. No bespoke numbers inside the component. | Any overlay metric/action references config or derived selectors. |
| Low Resource Footprint | Headless mode throttles rendering + simulation to avoid battery/CPU spikes. | <5% CPU on modern laptop when in overlay-only view. |

---

## 2. User Stories

1. **Second Monitor Passive:** "Mentre lavoro lascio l'overlay in basso a sinistra per vedere progress e rischi delle quest. Quando vedo rosso clicco per intervenire."
2. **Steam Deck Side Mode:** "Metto l'overlay a 30% dello schermo sul Deck mentre guardo una serie. Posso accettare quest e richiamare i cittadini senza aprire l'intera UI."
3. **Streamer/Content:** "Uso l'overlay come HUD per mostrare ai viewer cosa succede senza clutterare la scena principale."

---

## 3. Functional Requirements

1. **View Toggles**
   - `Full View` (current IdleVillagePage) ↔ `Overlay View` (compact). Shortcut + UI toggle.
   - Remember last mode per device (localStorage / config store).

2. **Overlay Layout**
   - Header: current day/time, village morale, food/gold sliders.
   - Middle: scrollable strip of active verbs (jobs/quests) – each card shows timer, risk stripe, quick buttons (Collect, Recall, Boost, Abort) referencing config actions.
   - Footer: quick actions (Start Training, Recruit, Send Scout) derived from config-defined verbs flagged `overlayQuickAction: true`.
   - Optional mini-map heatmap (quest danger around map slots).

3. **Interaction Model**
   - Click verbs to open detail popover (pulls VerbDetailCard content).
   - Drag residents from overlay roster onto an empty verb slot (use same DnD kit but in compact list form).
   - Keyboard shortcuts (1-9) to switch verbs, `Space` to toggle pause/resume, `R` to recall all risky parties.

4. **Risk Visualization**
   - Apply existing requirement: yellow/red vertical bar sized by injury/death %.
   - Risk thresholds read from config (no hardcoded values).

5. **Performance Modes**
   - When overlay is active and full view hidden, throttle expensive renders (charts, 3D backgrounds) via `requestIdleCallback` or `useReducedMotion` flag.
   - Provide `Headless Simulation` option (no DOM render, only overlay HUD) for minimal CPU.

6. **Steam Overlay & Deck**
   - Provide command-line flag `--overlay-mode` for launching directly into overlay layout.
   - Ensure 1280×800 viewport works with Tailwind breakpoints; add `deck:` token if needed.

---

## 4. Technical Architecture

```
packages/
└── desktop-shell/ (Tauri/Electron shell)
    ├── overlayWindow.ts (frameless, always-on-top)
    ├── mainWindow.ts (full app)
    └── ipc/

src/
├── overlay/
│   ├── OverlayProvider.tsx (context: mode, shortcut handlers)
│   ├── OverlayShell.tsx (layout)
│   ├── OverlayVerbLane.tsx
│   ├── OverlayQuickActions.tsx
│   └── hooks/useOverlayMetrics.ts (selectors over IdleVillageState)
└── idleVillage/
    └── selectors/overlay.ts (derive data: risk stripes, ETA, resource drains)
```

- **State Source:** `IdleVillageEngine` tick loop remains identical; overlay subscribes to the same store (Zustand/store module). No duplicate simulation.
- **IPC Hooks (desktop wrapper):** overlay window receives events (`PAUSE`, `OPEN_FULL_VIEW`) and sends actions back to engine.
- **Config Flags:** introduce `overlaySettings` in `IdleVillageConfig.globalRules` (default size, quick actions, risk palette).

---

## 5. Implementation Stages

| Stage | Scope | Notes |
|-------|-------|-------|
| O1 – Foundation | OverlayModeContext, toggle button in IdleVillagePage, layout skeleton (dummy data). | Feature-flag behind `enableOverlayMode`. |
| O2 – Data Wiring | Hook overlay selectors to real IdleVillage state, implement risk stripes, verb lane, timers. | Reuse VerbDetail components where possible. |
| O3 – Interaction | Drag-drop from roster, quick actions, keyboard shortcuts, toast feedback. | Ensure config-driven actions. |
| O4 – Desktop Shell | Integrate with chosen wrapper (see Tauri/Electron doc). Add always-on-top window + system tray toggle. |
| O5 – QA & Polish | Steam Deck QA checklist, battery/CPU profiling, accessibility (contrast, focus order). | Update docs + marketing copy. |

---

## 6. Risks & Mitigations

- **Performance spikes**: Use memoized selectors and throttled renders; headless mode to disable heavy components.
- **Input conflicts (Steam Deck controls)**: map overlay shortcuts to both keyboard and controller (Steam input config). Provide remapping UI later.
- **Config drift**: ensure overlay only surfaces verbs flagged in config; add tests verifying overlay selectors fail if config missing flags.

---

## 7. Open Questions

1. Launch overlay as separate window vs in-app split view? (Recommendation: separate frameless window for multi-monitor, but keep in-app mode for web build.)
2. Should overlay support notification bubbles (desktop notifications) for quest completion/injury? (Likely yes for Steam build.)
3. How to expose overlay settings in UI? (Settings panel allowing size, opacity, always-on-top toggle.)

---

## 8. Next Actions

1. Add `overlaySettings` stub to `IdleVillageConfig` + types.
2. Implement `OverlayModeContext`, toggle button, and placeholder layout (Stage O1).
3. Decide desktop wrapper (see comparison doc) to know how to spawn overlay window + system tray.
4. Update `MASTER_PLAN.md` and marketing copy referencing overlay as mitigation for no-offline-progress.
