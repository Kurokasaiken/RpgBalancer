# Subplan 1 — Expedition Planning UI: mockup absorption (artifact r004)

## Goal
- Port the mockup's structure onto /game: docked right expedition drawer, left roster|stash column, slimmer top chrome, sun ornament — using only config, skin registry and existing primitives.
- Ship minimal states (CTA disabled+reason, empty slot, empty state) and dynamic journey labels.
- Keep the map protagonist: docked surfaces resize the canvas, nothing floats over it.

## Decisions (mediated from 4 proposals; dissent noted)
- D1 Stash: docked as Roster|Stash segmented tab in the left column (consensus 4/4; dismissible-overlay position rejected as veto-adjacent). Mitigation for hidden bench stats: compact stat chip per member visible in stash tab.
- D2 Left column: PERSISTENT (expanded) by default (mockup fidelity — the mockup shows the roster visible; pillar deviation is status quo, not new). Collapse control allowed. <1100px viewport: only one side surface may be expanded at a time — opening one auto-collapses the other (state preserved).
- D3 Top chrome: two separate slimmer elements (day banner + resource bar), both shifted LEFT — the top-right zone is reserved for the Chronicle surface (Director ruling 2026-11-15, D10). No hanging tab.
- D4 Drawer width: token clamp(360px, 23vw, 460px) → ~441px @1920. Canvas stays full-bleed; drawer publishes insets.right to a Zustand layout slice; pan/zoom bounds clamp to the free rectangle. Free-map AC: ≥65% viewport width with rail closed, ≥50% with both open.
- D5 Mobile: non-modal bottom sheet — snaps peek (CTA row token + env(safe-area-inset-bottom)) / half 50vh / full 85vh; no scrim, no focus trap; wrapper pointer-events:none, sheet auto; only 44px handle+header drags; stash = third tab (Quest|Party|Stash).
- D6 Empty state: drawer ships mode (b) — edge tab with hint that expands on quest selection (pillar-aligned). If the Director wants (a) full-width designed empty state instead, it is a later-slice variant, not built now.
- D7 Item rows: icon + name + ONE effect line. Bag slots under party slots render with empty/filled affordance only; the tap-to-assign-with-eligibility-highlight interaction is S2 scope.
- D8 Bottom-left portrait medallion: left rail max-height terminates above its bounding box (explicit bottom inset token).
- D9 All strings via react-i18next (EN/IT keys extracted now, copy preserved; case normalization is S2). Bars/values from config, never hardcoded. New visuals via skinConfigRegistry + placeholders flagged isPlaceholder.

## Tasks
- T1 skin tokens (drawer clamp, rail width, snap detents, bar colors, CTA green/muted, bottom inset) — Zod schema + registry entries.
- T2 ExpeditionDrawer primitive (docked, collapse chip, edge-tab mode) + sub-blocks: QuestBanner, PartySlots, BagSlots, JourneyStrip ("N days"+total), RiskRewards (reserved cost slot), LaunchCta.
- T3 Party/bag slots: empty affordance (role icon + drop target), filled=portrait; shared selector with roster; tap empty PARTY slot → opens rail on Roster tab (bag slots display-only, their open-tab interaction is S2).
- T4 CTA states: enabled / disabled+inline reason (party incomplete) / hidden-in-empty.
- T5 Roster|Stash left column: segmented tabs, portraits, config-driven bars, stash ItemRow, stat chips in stash tab, persistent by default; collapse chip only.
- T6 Top chrome: slimmer day banner + resource bar arranged left/center (top-right stays free for the Chronicle surface), new sun ornament via skin.
- T7 i18n extraction EN/IT, fix mixed-language defect.
- T8 Mobile sheet + pointer-events contract + safe-area + mutual exclusion <1100px.
- T9 Trusted docs, skin doc mapping, regression tests for all states — OWNS AC10: mode-contract test that QuestRunWindow still renders unaffected.

- D10 Chronicle (Director ruling 2026-11-15): the upcoming-events surface (port of NextEventTab semantics + HudEventLedger for detail) is DOCKED top-right; the remaining top chrome shifts left. Explicitly NOT a hanging tab. Port lands in its own slice; S1 only reserves the zone via a layout token so later work does not reflow the chrome.

## Acceptance criteria
1. Drawer docked flush right; map canvas resizes (insets), no overlap; pan/zoom clamped to free rect.
2. Free map ≥65% (rail closed) / ≥50% (both open) at 1366/1440/1920 — measured, not claimed.
3. Top-right zone reserved for the future Chronicle surface; top chrome (day banner, resources) sits left of it without overlap.
4. Empty party → CTA muted + inline reason; empty slot → role icon + drop target; filled → member portrait.
5. No quest → D6 chosen form; mechanism named (select a quest marker on the map).
6. Journey: per-segment "N days" + "Total: N days" from quest config.
7. Stash tab: icon+name+one effect line; bench stat chips visible; rail bottom inset above medallion.
8. i18n: zero missing keys in expedition flow, EN+IT.
9. No ad-hoc CSS; tokens trace to skinConfigRegistry; primitives reused.
10. Mobile: sheet non-modal, map interactive, targets ≥44px, text ≥16px. Narrow viewport (≤1100px, incl. desktop band 1024–1100): only one side surface expanded at a time — tested at 1024 and 1100.
11. Quest-run surfaces (QuestRunWindow) unaffected — planning and run edges have a mode contract (planning screen owns these edges only while planning); owner T9, runtime test required.

## Risks
- Segmented tab hides bench stats during loadout → stat chips (D1).
- insets vs grid adds complexity → pan-clamp AC + measured widths.
- Placeholder art ships as final → isPlaceholder flags, S4 audit.
- Rail persistent conflicts with pillar → resolved by ruling fidelity; revisit in S3 (dimming/coverage).

## Next slices
S2 typography functional + consequence preview (food cost) · S3 accents (blue=selection+route, green=action) + map coverage/dim/recenter · S4 frame unification + a11y scale + gamepad/i18n hardening + placeholder audit.
