# Page 01: PgCard (Isolated)

**Phase:** 1  
**Component:** PgCard  
**Route:** `/minimal-pgcard`  
**Purpose:** Test PgCard rendering in isolation (portrait, rarity ring, status icons)

---

## Component Overview

**PgCard** is a rectangular token display showing:
- Portrait image (circular crop)
- Rarity ring (colored border: bronze/silver/gold)
- Status icons (injured, away, busy, fatigue)
- Name label (on hover)
- Hover state (opacity change, tooltip)

---

## Test Cases (Exhaustive)

### Rendering Tests

**Test 1.1: Portrait loads correctly**
- Condition: Portrait URL resolves (no 404)
- Expected: Image visible, src attribute correct
- Source: Component receives valid portraitUrl prop

**Test 1.2: Portrait fallback on error**
- Condition: Portrait URL returns 404
- Expected: Placeholder SVG visible, no white box
- Source: Component has error handler

**Test 1.3: Rarity ring color — Level 1**
- Condition: resident.level = 1
- Expected: Ring is bronze (#C47D4A), CSS class `rarity-bronze`
- Source: Component maps level → color

**Test 1.4: Rarity ring color — Level 2**
- Condition: resident.level = 2
- Expected: Ring is silver (#D4D4D4), CSS class `rarity-silver`

**Test 1.5: Rarity ring color — Level 3+**
- Condition: resident.level = 3
- Expected: Ring is gold (#FFD700), CSS class `rarity-gold`

**Test 1.6: Rarity ring border thickness**
- Condition: Ring rendered
- Expected: Border width 4-6px, opacity 1.0
- Source: Computed CSS style

**Test 1.7: Injured icon visible**
- Condition: resident.isInjured = true
- Expected: Icon (🩹) visible at top-left
- Source: Component renders conditional icon

**Test 1.8: Injured icon hidden**
- Condition: resident.isInjured = false
- Expected: Icon not present in DOM
- Source: Component doesn't render

**Test 1.9: Away icon visible**
- Condition: resident.status = 'away'
- Expected: Icon (👣) visible at top-right
- Source: Component checks status enum

**Test 1.10: Away icon hidden for other statuses**
- Condition: resident.status = 'available'
- Expected: Away icon not present
- Source: Component only renders for 'away'

**Test 1.11: Busy icon visible**
- Condition: resident.status = 'busy'
- Expected: Icon (⚙️) visible at center-right
- Source: Component checks status

**Test 1.12: Fatigue icon visible**
- Condition: resident.fatigue > 80
- Expected: Icon (😴) visible at bottom-right
- Source: Component checks fatigue threshold

**Test 1.13: Fatigue icon hidden for low fatigue**
- Condition: resident.fatigue < 80
- Expected: No fatigue icon
- Source: Threshold check

**Test 1.14: Multiple icons visible together**
- Condition: resident.isInjured=true, resident.status='away', resident.fatigue=90
- Expected: 3 icons visible (injured + away + fatigue)
- Source: Component renders all applicable icons

---

### Interaction Tests

**Test 2.1: Hover shows tooltip**
- Condition: Mouse hover over PgCard
- Expected: Tooltip visible after 300ms, contains name + stats
- Source: Hover event trigger

**Test 2.2: Unhover hides tooltip**
- Condition: Hover, then move mouse away
- Expected: Tooltip hidden within 300ms
- Source: Mouse leave event

**Test 2.3: Tooltip contains name**
- Condition: Tooltip visible
- Expected: Resident.name displayed in tooltip
- Source: Component passes name to tooltip content

**Test 2.4: Tooltip contains stats**
- Condition: Tooltip visible
- Expected: STR:, DEX:, WIS: visible with values
- Source: Component passes statSnapshot to tooltip

**Test 2.5: Tooltip contains level**
- Condition: Tooltip visible
- Expected: "Lv 2" or similar level display
- Source: Component passes level to tooltip

**Test 2.6: Tooltip contains HP**
- Condition: Tooltip visible
- Expected: "HP: 45/100" format
- Source: Component passes currentHp/maxHp to tooltip

---

### State Tests

**Test 3.1: Token reflects available status**
- Condition: resident.status = 'available'
- Expected: Opacity 1.0, not dimmed, border bright
- Source: CSS class applies opacity

**Test 3.2: Token reflects away status**
- Condition: resident.status = 'away'
- Expected: Opacity 0.6 or dimmed, visual indicates unavailable
- Source: CSS class applies opacity

**Test 3.3: Token reflects injured status visually**
- Condition: resident.isInjured = true
- Expected: Border has red tint or visual indicator
- Source: CSS class applies color

**Test 3.4: Token reflects busy status visually**
- Condition: resident.status = 'busy'
- Expected: Border has animation or distinct color
- Source: CSS class applies animation or color

---

### Edge Cases

**Test 4.1: Very long name**
- Condition: resident.name = "Sir Alderic Von Strongblade the Wise"
- Expected: Name truncated or wrapped, no overflow
- Source: CSS overflow handling

**Test 4.2: No portrait URL (null/empty)**
- Condition: portraitUrl = "" or null
- Expected: Placeholder visible, no broken image
- Source: Component fallback

**Test 4.3: Zero HP**
- Condition: resident.currentHp = 0
- Expected: Tooltip shows "HP: 0/100", no crash
- Source: Component handles edge case

**Test 4.4: Max fatigue**
- Condition: resident.fatigue = 100
- Expected: Fatigue icon visible, tooltip shows 100%
- Source: Component handles threshold

**Test 4.5: Negative fatigue (invalid)**
- Condition: resident.fatigue = -10 (invalid state)
- Expected: Clamp to 0, or show 0 fatigue
- Source: Component validation or hook

**Test 4.6: Level 0 (invalid)**
- Condition: resident.level = 0
- Expected: Default to bronze ring, or show error boundary
- Source: Component validation

---

## Definition of Done

- ✅ Page `/minimal-pgcard` renders without errors
- ✅ Shows 5 different residents with different levels/statuses
- ✅ All 30 test cases pass
- ✅ No console errors
- ✅ Visual regression baseline captured (screenshot)
- ✅ Performance: page load < 2s

---

**Total Test Cases:** 30  
**Estimated Test Duration:** 3-4 minutes  
**Next Page:** 02_slottedmedal.md
