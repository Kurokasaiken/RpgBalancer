# Phase 1: PgToken — Isolated Entity Specification

**Phase:** 1 of 6
**Estimated Duration:** 2-3 days
**Entità:** PgToken (draggable medaglione visual)
**Page Route:** `/minimal-pgtoken`
**Test Page Requirement:** MUST use real project components (PgCard) with mock data
**Last Updated:** 2026-05-21

---

**Aligned with Master Plan:** See [MASTER_PLAN.md](../MASTER_PLAN.md) for separation of concerns (plans vs tasks)
**Aligned with Semantic Constraints:** See [context/RPG_PROJECT_CONTEXT.md](../../context/RPG_PROJECT_CONTEXT.md) for freezing semantics
**Aligned with Roster-Slot Integration:** See [roster_slot_integration_spec.md](../idle_village/roster_slot_integration_spec.md) for complete drag-and-drop integration (Phases 2+)
**Aligned with Character-Resident Contract:** See [character_resident_trusted.md](../idle_village/trusted/character_resident_trusted.md) for Character → Resident conversion

---

## 1. Entity Overview

### 1.1 What is PgToken?

**PgToken** is the visual medaglione representation of a single playable character. It's a **circular token** (80px diameter) that displays:
- **Portrait image** (centered, circular crop)
- **Rarity ring** (colored border: bronze=Lv1, silver=Lv2, gold=Lv3)
- **Status icons** (top-left/right: injured, away, busy, etc.)
- **Name label** (below portrait, optional on hover)

**In the codebase:** React component `PgCard.tsx` (469 lines)

**Visually rendered as:**
```
     ┌─ Status Icon (if present)
     │
   ╭─┴─╮
   │ 👤 │ ← Portrait image, circular
   │ ⭐ │ ← Rarity ring (bronze/silver/gold border)
   ╰───╯
  "Name" ← Hover tooltip shows full name + stats
```

### 1.2 Key Properties

| Property | Type | Source | Example |
|----------|------|--------|---------|
| `id` | string | Resident ID | `res_001` |
| `portraitUrl` | string | Resident visual resolver | `https://avatars.example/001.jpg` |
| `name` | string | Resident display name | "Elara the Scout" |
| `status` | enum | Resident state | `'available'` \| `'away'` \| `'injured'` \| `'busy'` |
| `rarity` / `level` | number | Character stat | 1, 2, 3 (bronze, silver, gold) |
| `statSnapshot` | object | Resident stats | `{ str: 12, dex: 14, ... }` |
| `currentHp` / `maxHp` | number | Health | `45 / 100` |

**Source of truth:** `ResidentState` from `useVillageResidents()` hook.

---

## 2. Visual Appearance & Rendering

### 2.1 Portrait Image

**Rule 1: Portrait must always load**
- URL source: `getResidentPortraitUrl(resident)` from `residentVisualResolver.ts`
- Fallback: If URL fails, use placeholder SVG (generic face)
- Format: `.jpg` or `.webp`, circular crop (border-radius: 50%)
- Size: 80px × 80px on desktop, scale down for mobile
- On error: Log to console, show placeholder, don't crash

**Test Case 1.1:** Portrait image loads correctly (not 404)
```typescript
// src/docs/docs/minimal_slice/01_pgtoken.md: §2.1 Portrait Rule 1
test('portrait loads and displays', async ({ page }) => {
  await page.goto('/minimal-pgtoken');
  const portrait = page.locator('[data-testid="pgtoken-portrait"]');
  await expect(portrait).toBeVisible();
  const src = await portrait.getAttribute('src');
  expect(src).toMatch(/\.(jpg|webp|png)$/);
});
```

**Test Case 1.2:** Fallback placeholder if URL 404
```typescript
// src/docs/docs/minimal_slice/01_pgtoken.md: §2.1 Portrait Rule 1
test('portrait shows placeholder on load error', async ({ page }) => {
  // Mock a 404 portrait URL
  // Verify placeholder SVG is visible instead
});
```

### 2.2 Rarity Ring (Border Color)

**Rule 2: Ring color represents character level**

| Level | Rarity Ring Color | CSS Class | Visual |
|-------|---|---|---|
| 1 | Bronze (#C47D4A) | `rarity-bronze` | Dull brown |
| 2 | Silver (#D4D4D4) | `rarity-silver` | Light gray |
| 3+ | Gold (#FFD700) | `rarity-gold` | Bright yellow |

**Test Case 2.1:** Rarity ring color matches level
```typescript
// src/docs/docs/minimal_slice/01_pgtoken.md: §2.2 Rarity Rule 2
test('rarity ring color matches character level', async ({ page }) => {
  await page.goto('/minimal-pgtoken');
  
  // Level 1 token
  const token1 = page.locator('[data-testid="pgtoken"][data-level="1"]');
  await expect(token1).toHaveClass(/rarity-bronze/);
  
  // Level 2 token
  const token2 = page.locator('[data-testid="pgtoken"][data-level="2"]');
  await expect(token2).toHaveClass(/rarity-silver/);
  
  // Level 3+ token
  const token3 = page.locator('[data-testid="pgtoken"][data-level="3"]');
  await expect(token3).toHaveClass(/rarity-gold/);
});
```

**Test Case 2.2:** Ring visual thickness and opacity correct
```typescript
// src/docs/docs/minimal_slice/01_pgtoken.md: §2.2 Rarity Rule 2
test('rarity ring has correct border thickness', async ({ page }) => {
  await page.goto('/minimal-pgtoken');
  const ring = page.locator('[data-testid="pgtoken"]');
  // Verify border is 4-6px thick, opacity 1.0 (not faded)
  const borderWidth = await ring.evaluate(el => {
    return window.getComputedStyle(el).borderWidth;
  });
  expect(parseFloat(borderWidth)).toBeGreaterThanOrEqual(4);
  expect(parseFloat(borderWidth)).toBeLessThanOrEqual(6);
});
```

### 2.3 Status Icons

**Rule 3: Status icons appear in top corners based on resident state**

| Status | Icon | Position | Condition |
|--------|------|----------|-----------|
| **Injured** | 🩹 or X | Top-left | `resident.isInjured === true` |
| **Away** | 👣 or ⟳ | Top-right | `resident.status === 'away'` |
| **Busy** | ⚙️ or ⚡ | Center-right | `resident.status === 'busy'` AND in activity |
| **Fatigue** | 😴 or 💤 | Bottom-right | `resident.fatigue > 80` |

**Test Case 3.1:** Injured icon appears when injured
```typescript
// src/docs/docs/minimal_slice/01_pgtoken.md: §2.3 Status Rule 3
test('injured icon visible when isInjured=true', async ({ page }) => {
  await page.goto('/minimal-pgtoken?injured=true');
  const injuredIcon = page.locator('[data-testid="pgtoken-icon-injured"]');
  await expect(injuredIcon).toBeVisible();
});
```

**Test Case 3.2:** Away icon visible when status=away
```typescript
// src/docs/docs/minimal_slice/01_pgtoken.md: §2.3 Status Rule 3
test('away icon visible when status=away', async ({ page }) => {
  await page.goto('/minimal-pgtoken?status=away');
  const awayIcon = page.locator('[data-testid="pgtoken-icon-away"]');
  await expect(awayIcon).toBeVisible();
});
```

**Test Case 3.3:** No icons for available status
```typescript
// src/docs/docs/minimal_slice/01_pgtoken.md: §2.3 Status Rule 3
test('no status icons when status=available', async ({ page }) => {
  await page.goto('/minimal-pgtoken?status=available');
  const icons = page.locator('[data-testid^="pgtoken-icon"]');
  await expect(icons).toHaveCount(0);
});
```

### 2.4 Hover Tooltip

**Rule 4: Hovering over token shows tooltip with name + key stats**

Tooltip content:
```
Elara the Scout
━━━━━━━━━━━━━
Lv 2 | HP 45/100
STR: 12 | DEX: 14 | WIS: 11
```

**Test Case 4.1:** Tooltip appears on hover
```typescript
// src/docs/docs/minimal_slice/01_pgtoken.md: §2.4 Hover Rule 4
test('tooltip appears on hover', async ({ page }) => {
  await page.goto('/minimal-pgtoken');
  const token = page.locator('[data-testid="pgtoken"]').first();
  await token.hover();
  
  const tooltip = page.locator('[role="tooltip"]');
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toContainText(/Elara/); // Name visible
});
```

**Test Case 4.2:** Tooltip disappears on unhover
```typescript
// src/docs/docs/minimal_slice/01_pgtoken.md: §2.4 Hover Rule 4
test('tooltip disappears on unhover', async ({ page }) => {
  await page.goto('/minimal-pgtoken');
  const token = page.locator('[data-testid="pgtoken"]').first();
  await token.hover();
  await page.locator('[role="tooltip"]').waitFor();
  
  // Move away
  await page.mouse.move(0, 0);
  await expect(page.locator('[role="tooltip"]')).toBeHidden();
});
```

**Test Case 4.3:** Tooltip shows correct stats
```typescript
// src/docs/docs/minimal_slice/01_pgtoken.md: §2.4 Hover Rule 4
test('tooltip contains correct character stats', async ({ page }) => {
  await page.goto('/minimal-pgtoken');
  const token = page.locator('[data-testid="pgtoken"]').first();
  await token.hover();
  
  const tooltip = page.locator('[role="tooltip"]');
  // Verify stats from statSnapshot are displayed
  await expect(tooltip).toContainText(/STR:/);
  await expect(tooltip).toContainText(/DEX:/);
});
```

---

## 3. Freezing Rules (When PgToken Cannot Be Interacted With)

In Phase 1, PgToken exists **isolated** (no Roster, no Drag yet). No freezing occurs in Phase 1.

**However, we document the freezing rules here for completeness:**

### 3.1 Frozen During Drag (Phases 4+)

**Condition:** User is dragging this token (pointer down, overlay visible)

**What is frozen:**
- Click interactions are blocked (guard layer G1)
- Cannot be auto-assigned by roster click (guard layer G2)
- Visual position is controlled by `CustomDragOverlay`, not by parent CSS

**Duration:** `pointerDown` → `pointerUp` (variable, typically 0.5-5 seconds)

**Reason:** Drag operation is in-flight. If user clicks or roster reassigns, confusion occurs.

**Visual indicator:** Token appears semi-transparent in Roster (opacity 0.7), cursor changes to `grab-active`.

### 3.2 Frozen After Failed Drop (Phases 4+)

**Condition:** User dragged token but dropped outside any slot

**What is frozen:**
- Click is blocked (guard layer G3)
- Auto-assign is blocked (guard layer G5)
- Token animates back to origin (spring-return)

**Duration:** 900ms after `handleDragEnd` with `over === null`

**Reason:** Browser may fire synthetic click event after drag. Guard prevents unintended assignment.

**Visual indicator:** Token shows "returning" status, slight opacity fade.

### 3.3 Frozen While In Active Activity (Phases 5+)

**Condition:** Token is assigned to an active activity (timer running)

**What is frozen:**
- Cannot be dragged to another slot
- Cannot be assigned by other means
- Displays "busy" status icon

**Duration:** Until `onActivityComplete()`

**Reason:** Token is "occupied". Cannot be double-assigned.

**Visual indicator:** "Busy" icon (⚙️), dimmed appearance, grayed-out medaglione.

---

## 4. Current Visual State (Debug Info)

For Phase 1 page `/minimal-pgtoken`, the page should display:

```
===== Minimal PgToken Page =====

[Portrait: Elara] ← Lv2 silver ring
  Injured 🩹 icon (top-left)
  Name: "Elara the Scout"
  Hover to see stats

[Portrait: Ragnar] ← Lv1 bronze ring
  No status icons
  Name: "Ragnar Strongarm"
  Hover to see stats

[Portrait: Lyra] ← Lv3 gold ring
  Away 👣 icon (top-right)
  Fatigue 😴 icon (bottom-right)
  Name: "Lyra the Sage"
  Hover to see stats
```

---

## 5. Regression Tests (Ensure Phase 1 Never Breaks)

These tests run automatically in all subsequent phases (2-6) to ensure rendering never regresses:

**Regression 1.1:** Portrait still renders after adding Roster (Phase 2)
```typescript
test('portrait renders correctly in Phase 2 (Roster)', async ({ page }) => {
  await page.goto('/minimal-roster');
  const portraits = page.locator('[data-testid="pgtoken-portrait"]');
  const count = await portraits.count();
  expect(count).toBeGreaterThan(0);
  // Spot-check first portrait loads
  await expect(portraits.first()).toHaveAttribute('src', /.*/);
});
```

**Regression 1.2:** Rarity ring colors don't change after Drag (Phase 4)
```typescript
test('rarity ring colors stable in Phase 4 (Drag)', async ({ page }) => {
  await page.goto('/minimal-drag-roster-to-slot');
  const lv2Token = page.locator('[data-testid="pgtoken"][data-level="2"]');
  await expect(lv2Token).toHaveClass(/rarity-silver/);
});
```

**Regression 1.3:** Status icons still correct in Phase 5 (Activity)
```typescript
test('status icons correct in Phase 5 (Activity)', async ({ page }) => {
  await page.goto('/minimal-activity');
  const injuredToken = page.locator('[data-testid="pgtoken"][data-injured="true"]');
  const injuredIcon = injuredToken.locator('[data-testid="pgtoken-icon-injured"]');
  await expect(injuredIcon).toBeVisible();
});
```

---

## 6. Test Cases Summary (Exhaustive List)

| # | Test Name | Phase 1? | Phase 2+? | Category |
|---|-----------|----------|-----------|----------|
| 1.1 | Portrait loads correctly | ✅ | ✅ | Rendering |
| 1.2 | Fallback placeholder on 404 | ✅ | ✅ | Error handling |
| 2.1 | Rarity ring color matches level | ✅ | ✅ | Rendering |
| 2.2 | Ring border thickness correct | ✅ | ✅ | Rendering |
| 3.1 | Injured icon visible when true | ✅ | ✅ | Rendering |
| 3.2 | Away icon visible when status=away | ✅ | ✅ | Rendering |
| 3.3 | No icons when status=available | ✅ | ✅ | Rendering |
| 4.1 | Tooltip appears on hover | ✅ | ✅ | Interaction |
| 4.2 | Tooltip disappears on unhover | ✅ | ✅ | Interaction |
| 4.3 | Tooltip contains correct stats | ✅ | ✅ | Interaction |

**Total test cases for Phase 1:** 10 (all in `tests/e2e/minimal_slice_01_pgtoken.spec.ts`)

---

## 7. Known Issues & Guard Layers

None yet (Phase 1 is isolated, no drag/interaction).

In Phases 4+, guard layers G1-G6 protect PgToken from unintended state mutations. See `guard_layers_reference.md` for details.

---

## 8. Related Files

| File | Purpose |
|------|---------|
| `src/ui/idleVillage/components/PgCard.tsx` | PgToken React component |
| `src/engine/game/idleVillage/residentVisualResolver.ts` | Portrait URL resolution |
| `src/docs/docs/minimal_slice/01_pgtoken.semantics.json` | Machine-readable state |
| `tests/e2e/minimal_slice_01_pgtoken.spec.ts` | Playwright tests |
| `src/pages/minimal-pgtoken.tsx` | Phase 1 page |

---

## 9. Definition of Done (Phase 1)

- ✅ Page `/minimal-pgtoken` loads without errors
- ✅ Shows 3+ PgToken with different levels (Lv1, Lv2, Lv3)
- ✅ Portrait images load correctly (not 404)
- ✅ Rarity rings have correct colors (bronze, silver, gold)
- ✅ Status icons appear correctly (injured, away, etc.)
- ✅ Hover tooltip appears and shows name + stats
- ✅ All 10 test cases pass in `minimal_slice_01_pgtoken.spec.ts`
- ✅ Zero console errors
- ✅ Visual regression baseline captured
- ✅ `npm run build` succeeds

---

**Last Updated:** 2026-05-20  
**Status:** 🟡 Awaiting Phase 1 implementation  
**Next Phase:** 02_roster_pgtoken.md
