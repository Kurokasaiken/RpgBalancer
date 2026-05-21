# Test Execution Plan — Component-by-Component

**Data:** 2026-05-20  
**Basato su:** COMPONENTS_SPECIFICATION.md  
**Obiettivo:** Eseguire test specifici per ogni componente e verificare correttezza

---

## Fase 1: PgToken — Unit Tests

### Test File: `src/ui/idleVillage/__tests__/PgToken.unit.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PgToken } from '../components/PgToken';

describe('PgToken Component', () => {
  const mockToken = {
    id: 'char-1',
    name: 'Borin Stonefist',
    portraitUrl: 'https://example.com/borin.jpg',
    level: 1,
    status: 'healthy' as const,
    isOccupied: false,
    isBusy: false,
    isInjured: false,
    isAway: false,
  };

  describe('Rendering', () => {
    it('✅ TEST-001: Portrait URL resolves and displays correctly', () => {
      const { container } = render(
        <PgToken token={mockToken} onSelect={vi.fn()} />
      );
      const img = container.querySelector('img');
      expect(img?.src).toContain('borin.jpg');
      expect(img?.alt).toBe('Borin Stonefist');
    });

    it('✅ TEST-002: Fallback image shows if URL fails', () => {
      const badToken = { ...mockToken, portraitUrl: '' };
      const { container } = render(
        <PgToken token={badToken} onSelect={vi.fn()} />
      );
      const fallback = container.querySelector('.fallback-portrait');
      expect(fallback).toBeTruthy();
    });

    it('✅ TEST-003: Rarity ring color correct for level 1 (bronze)', () => {
      const { container } = render(
        <PgToken token={{ ...mockToken, level: 1 }} onSelect={vi.fn()} />
      );
      const ring = container.querySelector('.rarity-ring');
      expect(ring?.classList).toContain('bronze');
      expect(ring?.style.borderColor).toBe('rgb(205, 127, 50)'); // bronze
    });

    it('✅ TEST-004: Rarity ring color correct for level 2 (silver)', () => {
      const { container } = render(
        <PgToken token={{ ...mockToken, level: 2 }} onSelect={vi.fn()} />
      );
      const ring = container.querySelector('.rarity-ring');
      expect(ring?.classList).toContain('silver');
      expect(ring?.style.borderColor).toBe('rgb(192, 192, 192)'); // silver
    });

    it('✅ TEST-005: Rarity ring color correct for level 3 (gold)', () => {
      const { container } = render(
        <PgToken token={{ ...mockToken, level: 3 }} onSelect={vi.fn()} />
      );
      const ring = container.querySelector('.rarity-ring');
      expect(ring?.classList).toContain('gold');
      expect(ring?.style.borderColor).toBe('rgb(255, 215, 0)'); // gold
    });

    it('✅ TEST-006: Name displays correctly and truncates if > 12 chars', () => {
      const longName = 'Borin Stonefist the Great Warrior';
      const { container } = render(
        <PgToken token={{ ...mockToken, name: longName }} onSelect={vi.fn()} />
      );
      const nameEl = container.querySelector('.token-name');
      expect(nameEl?.textContent).toBe('Borin Stonef...'); // truncated
    });

    it('✅ TEST-007: Token circle size is 80px', () => {
      const { container } = render(
        <PgToken token={mockToken} onSelect={vi.fn()} />
      );
      const circle = container.querySelector('.pg-token');
      const computed = window.getComputedStyle(circle!);
      expect(computed.width).toBe('80px');
      expect(computed.height).toBe('80px');
      expect(computed.borderRadius).toBe('50%');
    });
  });

  describe('Status Icons', () => {
    it('✅ TEST-008: Injured icon shows when isInjured=true', () => {
      const { container } = render(
        <PgToken token={{ ...mockToken, isInjured: true }} onSelect={vi.fn()} />
      );
      const injuredIcon = container.querySelector('.status-icon.injured');
      expect(injuredIcon).toBeTruthy();
      expect(injuredIcon?.getAttribute('data-status')).toBe('injured');
    });

    it('✅ TEST-009: Injured icon hidden when isInjured=false', () => {
      const { container } = render(
        <PgToken token={{ ...mockToken, isInjured: false }} onSelect={vi.fn()} />
      );
      const injuredIcon = container.querySelector('.status-icon.injured');
      expect(injuredIcon).toBeFalsy();
    });

    it('✅ TEST-010: Away icon shows when isAway=true', () => {
      const { container } = render(
        <PgToken token={{ ...mockToken, isAway: true }} onSelect={vi.fn()} />
      );
      const awayIcon = container.querySelector('.status-icon.away');
      expect(awayIcon).toBeTruthy();
    });

    it('✅ TEST-011: Occupied icon shows when isOccupied=true', () => {
      const { container } = render(
        <PgToken token={{ ...mockToken, isOccupied: true }} onSelect={vi.fn()} />
      );
      const occupiedIcon = container.querySelector('.status-icon.occupied');
      expect(occupiedIcon).toBeTruthy();
    });

    it('✅ TEST-012: Multiple status icons can show together', () => {
      const { container } = render(
        <PgToken 
          token={{ ...mockToken, isInjured: true, isOccupied: true }} 
          onSelect={vi.fn()} 
        />
      );
      const icons = container.querySelectorAll('.status-icon');
      expect(icons.length).toBe(2);
    });
  });

  describe('Hover & Interaction', () => {
    it('✅ TEST-013: Hover shows tooltip with name and rarity', async () => {
      const user = userEvent.setup();
      render(
        <PgToken token={mockToken} onSelect={vi.fn()} />
      );
      
      const token = screen.getByRole('button', { hidden: true }); // PgToken è un button
      await user.hover(token);
      
      const tooltip = await screen.findByText(/Borin Stonefist/);
      expect(tooltip).toBeTruthy();
    });

    it('✅ TEST-014: Hover adds opacity/scale effect', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <PgToken token={mockToken} onSelect={vi.fn()} />
      );
      
      const token = container.querySelector('.pg-token') as HTMLElement;
      const beforeHover = window.getComputedStyle(token).opacity;
      
      await user.hover(token);
      
      const afterHover = window.getComputedStyle(token).opacity;
      expect(parseFloat(afterHover)).toBeGreaterThan(parseFloat(beforeHover));
    });

    it('✅ TEST-015: Click calls onSelect callback', async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      const { container } = render(
        <PgToken token={mockToken} onSelect={onSelect} />
      );
      
      const token = container.querySelector('.pg-token') as HTMLElement;
      await user.click(token);
      
      expect(onSelect).toHaveBeenCalledWith(mockToken.id);
    });

    it('✅ TEST-016: Click disabled when isOccupied=true', async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      const { container } = render(
        <PgToken 
          token={{ ...mockToken, isOccupied: true }} 
          onSelect={onSelect}
          disabled={true}
        />
      );
      
      const token = container.querySelector('.pg-token') as HTMLElement;
      await user.click(token);
      
      expect(onSelect).not.toHaveBeenCalled();
    });
  });

  describe('CSS Layout', () => {
    it('✅ TEST-017: Token centered within parent (flex/grid)', () => {
      const { container } = render(
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <PgToken token={mockToken} onSelect={vi.fn()} />
        </div>
      );
      const parent = container.querySelector('div');
      const token = container.querySelector('.pg-token');
      
      expect(window.getComputedStyle(parent!).display).toBe('flex');
      expect(window.getComputedStyle(parent!).justifyContent).toBe('center');
    });

    it('✅ TEST-018: Icon position (corner placement correct)', () => {
      const { container } = render(
        <PgToken token={{ ...mockToken, isInjured: true }} onSelect={vi.fn()} />
      );
      const icon = container.querySelector('.status-icon.injured');
      const computed = window.getComputedStyle(icon!);
      
      // Bottom-left corner
      expect(computed.bottom).not.toBe('auto');
      expect(computed.left).not.toBe('auto');
    });
  });
});
```

### Test Execution Command

```bash
npm run test -- PgToken.unit.test.ts
```

### Expected Results

- **Total Tests:** 18
- **Expected:** 18 ✅ PASSED
- **Coverage Goal:** 85%+
- **Timeout:** 10s

### Manual Verification (After Unit Tests)

1. **Open:** `npm run dev` → navigate to `/minimal-pgtoken` (requires implementation)
2. **Check:**
   - [ ] Token visible, portrait centered
   - [ ] Rarity ring color matches level (bronze/silver/gold)
   - [ ] Status icons visible (injured, away, occupied)
   - [ ] Hover shows tooltip
   - [ ] Click works (if enabled)
   - [ ] No console errors

---

## Fase 2: Roster + PgToken — Unit + Integration Tests

### Test File: `src/ui/idleVillage/__tests__/Roster.unit.test.ts`

```typescript
describe('Roster Component', () => {
  const mockTokens = [
    { id: 'char-1', name: 'Borin', level: 2, status: 'healthy' },
    { id: 'char-2', name: 'Aelin', level: 1, status: 'healthy' },
    { id: 'char-3', name: 'Theron', level: 3, status: 'injured' },
  ];

  describe('Rendering', () => {
    it('✅ TEST-019: Roster renders all tokens from input', () => {
      const { container } = render(
        <Roster tokens={mockTokens} sortMode="name-asc" onSelectToken={vi.fn()} />
      );
      const tokenEls = container.querySelectorAll('.token-item');
      expect(tokenEls.length).toBe(3);
    });

    it('✅ TEST-020: Tokens display in correct order for name-asc sort', () => {
      const { container } = render(
        <Roster tokens={mockTokens} sortMode="name-asc" onSelectToken={vi.fn()} />
      );
      const names = Array.from(container.querySelectorAll('.token-name')).map(el => el.textContent);
      expect(names).toEqual(['Aelin', 'Borin', 'Theron']);
    });

    it('✅ TEST-021: Tokens display in correct order for name-desc sort', () => {
      const { container } = render(
        <Roster tokens={mockTokens} sortMode="name-desc" onSelectToken={vi.fn()} />
      );
      const names = Array.from(container.querySelectorAll('.token-name')).map(el => el.textContent);
      expect(names).toEqual(['Theron', 'Borin', 'Aelin']);
    });

    it('✅ TEST-022: Tokens display in correct order for rarity-desc sort', () => {
      const { container } = render(
        <Roster tokens={mockTokens} sortMode="rarity-desc" onSelectToken={vi.fn()} />
      );
      const levels = Array.from(container.querySelectorAll('.token-level')).map(el => parseInt(el.textContent || '0'));
      expect(levels).toEqual([3, 2, 1]); // Descending
    });

    it('✅ TEST-023: Roster update < 100ms after sort mode change', async () => {
      const { rerender } = render(
        <Roster tokens={mockTokens} sortMode="name-asc" onSelectToken={vi.fn()} />
      );
      
      const startTime = performance.now();
      rerender(
        <Roster tokens={mockTokens} sortMode="rarity-desc" onSelectToken={vi.fn()} />
      );
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe('Filtering', () => {
    it('✅ TEST-024: Filter "hide-injured" removes injured tokens', () => {
      const { container } = render(
        <Roster 
          tokens={mockTokens} 
          sortMode="name-asc" 
          filterOptions={{ hideInjured: true }}
          onSelectToken={vi.fn()} 
        />
      );
      const tokenEls = container.querySelectorAll('.token-item:not(.hidden)');
      expect(tokenEls.length).toBe(2); // Only Borin and Aelin
    });

    it('✅ TEST-025: Filter "hide-away" removes away tokens', () => {
      const tokensWithAway = [
        ...mockTokens,
        { id: 'char-4', name: 'Away Char', level: 1, status: 'away' },
      ];
      const { container } = render(
        <Roster 
          tokens={tokensWithAway} 
          sortMode="name-asc"
          filterOptions={{ hideAway: true }}
          onSelectToken={vi.fn()} 
        />
      );
      const tokenEls = container.querySelectorAll('.token-item:not(.hidden)');
      expect(tokenEls.length).toBe(3); // Away Char filtered
    });

    it('✅ TEST-026: Busy token shows dimmed but still in list', () => {
      const busyTokens = [
        { ...mockTokens[0], isBusy: true },
        ...mockTokens.slice(1),
      ];
      const { container } = render(
        <Roster tokens={busyTokens} sortMode="name-asc" onSelectToken={vi.fn()} />
      );
      const busyEl = container.querySelector('.token-item.busy');
      expect(busyEl).toBeTruthy();
      expect(busyEl?.classList).toContain('dimmed');
    });
  });

  describe('Availability Status', () => {
    it('✅ TEST-027: Available token shows green color', () => {
      const { container } = render(
        <Roster tokens={[mockTokens[0]]} sortMode="name-asc" onSelectToken={vi.fn()} />
      );
      const token = container.querySelector('.token-availability');
      expect(token?.classList).toContain('available');
      expect(token?.style.color).toBe('rgb(34, 197, 94)'); // green-600
    });

    it('✅ TEST-028: Unavailable (busy) token shows gray color', () => {
      const busyToken = { ...mockTokens[0], isBusy: true };
      const { container } = render(
        <Roster tokens={[busyToken]} sortMode="name-asc" onSelectToken={vi.fn()} />
      );
      const token = container.querySelector('.token-availability');
      expect(token?.classList).toContain('unavailable');
      expect(token?.style.color).toBe('rgb(107, 114, 128)'); // gray-500
    });
  });
});
```

### Test File: `src/ui/idleVillage/__tests__/Roster_PgToken.integration.test.ts`

```typescript
describe('Roster + PgToken Integration', () => {
  const mockTokens = [
    { id: 'char-1', name: 'Borin', level: 2, portraitUrl: 'https://example.com/borin.jpg' },
    { id: 'char-2', name: 'Aelin', level: 1, portraitUrl: 'https://example.com/aelin.jpg' },
  ];

  it('✅ TEST-029: Roster reorders without breaking PgToken display', () => {
    const { rerender, container: container1 } = render(
      <Roster tokens={mockTokens} sortMode="name-asc" onSelectToken={vi.fn()} />
    );

    // Verify first render
    let names = Array.from(container1.querySelectorAll('.token-name')).map(el => el.textContent);
    expect(names).toEqual(['Aelin', 'Borin']);

    // Reorder to rarity-desc
    rerender(
      <Roster tokens={mockTokens} sortMode="rarity-desc" onSelectToken={vi.fn()} />
    );

    // Verify reorder
    const container2 = container1; // Same DOM
    names = Array.from(container2.querySelectorAll('.token-name')).map(el => el.textContent);
    expect(names).toEqual(['Borin', 'Aelin']);

    // Verify PgTokens still render correctly (portraits still there)
    const portraits = container2.querySelectorAll('img');
    expect(portraits.length).toBe(2);
    expect(portraits[0]?.src).toContain('borin.jpg');
  });

  it('✅ TEST-030: Roster filtering does not change token internal state', () => {
    const busyToken = { ...mockTokens[0], isBusy: true };
    const tokensWithBusy = [busyToken, mockTokens[1]];

    const { rerender, container } = render(
      <Roster 
        tokens={tokensWithBusy} 
        sortMode="name-asc"
        filterOptions={{ hideInjured: false }}
        onSelectToken={vi.fn()} 
      />
    );

    // Apply filter
    rerender(
      <Roster 
        tokens={tokensWithBusy} 
        sortMode="name-asc"
        filterOptions={{ hideInjured: true }}
        onSelectToken={vi.fn()} 
      />
    );

    // Busy token should still be busy (not mutated)
    expect(busyToken.isBusy).toBe(true);
    
    // Visual dimming should still be visible
    const busyEl = container.querySelector('.token-item.busy');
    expect(busyEl?.classList).toContain('dimmed');
  });

  it('✅ TEST-031: Token can be clicked to trigger onSelect (from Roster)', async () => {
    const user = userEvent.setup();
    const onSelectToken = vi.fn();

    const { container } = render(
      <Roster tokens={mockTokens} sortMode="name-asc" onSelectToken={onSelectToken} />
    );

    const firstToken = container.querySelector('.pg-token');
    await user.click(firstToken!);

    expect(onSelectToken).toHaveBeenCalledWith(mockTokens[1].id); // Aelin (first after sort)
  });
});
```

### Test Execution Commands

```bash
npm run test -- Roster.unit.test.ts
npm run test -- Roster_PgToken.integration.test.ts
```

### Expected Results

- **Roster Unit Tests:** 12 tests
- **Integration Tests:** 3 tests
- **Total:** 15 tests
- **Expected:** 15 ✅ PASSED

---

## Fase 3: SlotRack — Unit Tests

### Test File: `src/ui/idleVillage/__tests__/SlotRack.unit.test.ts`

```typescript
describe('SlotRack Component', () => {
  const mockSlots = [
    { id: 'slot-job-0', state: 'empty', activityName: 'Taglia Legna' },
    { id: 'slot-job-1', state: 'empty', activityName: 'Taglia Legna' },
    { id: 'slot-job-2', state: 'occupied', occupantId: 'char-1' },
    { id: 'slot-job-3', state: 'ready_to_complete', occupantId: 'char-2' },
  ];

  describe('Rendering', () => {
    it('✅ TEST-032: SlotRack renders 4 slots', () => {
      const { container } = render(
        <SlotRack slots={mockSlots} layout="grid-2x2" />
      );
      const slotEls = container.querySelectorAll('.slot-item');
      expect(slotEls.length).toBe(4);
    });

    it('✅ TEST-033: Each slot has correct id attribute (data-slot-id)', () => {
      const { container } = render(
        <SlotRack slots={mockSlots} layout="grid-2x2" />
      );
      const slotEls = container.querySelectorAll('[data-slot-id]');
      expect(slotEls.length).toBe(4);
      
      const ids = Array.from(slotEls).map(el => el.getAttribute('data-slot-id'));
      expect(ids).toEqual(['slot-job-0', 'slot-job-1', 'slot-job-2', 'slot-job-3']);
    });

    it('✅ TEST-034: Empty slot shows gray box with "+"', () => {
      const { container } = render(
        <SlotRack slots={[mockSlots[0]]} layout="grid-2x2" />
      );
      const slot = container.querySelector('.slot-item.empty');
      expect(slot).toBeTruthy();
      expect(slot?.classList).toContain('empty');
      
      const plus = slot?.querySelector('.slot-plus');
      expect(plus?.textContent).toBe('+');
    });

    it('✅ TEST-035: Occupied slot shows PgCard placeholder', () => {
      const { container } = render(
        <SlotRack slots={[mockSlots[2]]} layout="grid-2x2" />
      );
      const slot = container.querySelector('.slot-item.occupied');
      expect(slot).toBeTruthy();
      expect(slot?.classList).toContain('occupied');
      
      const card = slot?.querySelector('.pg-card-placeholder');
      expect(card).toBeTruthy();
    });

    it('✅ TEST-036: Ready-to-complete slot shows green highlight', () => {
      const { container } = render(
        <SlotRack slots={[mockSlots[3]]} layout="grid-2x2" />
      );
      const slot = container.querySelector('.slot-item.ready_to_complete');
      expect(slot?.classList).toContain('ready_to_complete');
      expect(slot?.style.borderColor).toBe('rgb(34, 197, 94)'); // green
    });
  });

  describe('CSS Layout', () => {
    it('✅ TEST-037: Grid layout 2x2 renders correctly', () => {
      const { container } = render(
        <SlotRack slots={mockSlots} layout="grid-2x2" />
      );
      const wrapper = container.querySelector('.slot-rack-wrapper');
      const computed = window.getComputedStyle(wrapper!);
      
      expect(computed.display).toBe('grid');
      expect(computed.gridTemplateColumns).toBe('repeat(2, minmax(0, 1fr))');
      expect(computed.gridTemplateRows).toBe('repeat(2, minmax(0, 1fr))');
    });

    it('✅ TEST-038: Slot responsive (grid 1x4 on small screens)', () => {
      // Mock window size
      global.innerWidth = 400;
      
      const { container } = render(
        <SlotRack slots={mockSlots} layout="responsive" />
      );
      const wrapper = container.querySelector('.slot-rack-wrapper');
      const computed = window.getComputedStyle(wrapper!);
      
      // On small screens, should be 1 column
      expect(computed.gridTemplateColumns).toBe('repeat(1, minmax(0, 1fr))');
    });
  });

  describe('State CSS Classes', () => {
    it('✅ TEST-039: Empty slot has .empty class', () => {
      const { container } = render(
        <SlotRack slots={[mockSlots[0]]} layout="grid-2x2" />
      );
      const slot = container.querySelector('[data-slot-id="slot-job-0"]');
      expect(slot?.classList.contains('empty')).toBe(true);
    });

    it('✅ TEST-040: Occupied slot has .occupied class', () => {
      const { container } = render(
        <SlotRack slots={[mockSlots[2]]} layout="grid-2x2" />
      );
      const slot = container.querySelector('[data-slot-id="slot-job-2"]');
      expect(slot?.classList.contains('occupied')).toBe(true);
    });

    it('✅ TEST-041: Ready slot has .ready_to_complete class', () => {
      const { container } = render(
        <SlotRack slots={[mockSlots[3]]} layout="grid-2x2" />
      );
      const slot = container.querySelector('[data-slot-id="slot-job-3"]');
      expect(slot?.classList.contains('ready_to_complete')).toBe(true);
    });
  });

  describe('Activity Name Display', () => {
    it('✅ TEST-042: Empty slot shows activity name', () => {
      const { container } = render(
        <SlotRack slots={[{ ...mockSlots[0], activityName: 'Taglia Legna' }]} layout="grid-2x2" />
      );
      const name = container.querySelector('.slot-activity-name');
      expect(name?.textContent).toBe('Taglia Legna');
    });

    it('✅ TEST-043: Occupied slot shows occupant ID instead of activity name', () => {
      const { container } = render(
        <SlotRack slots={[mockSlots[2]]} layout="grid-2x2" />
      );
      const name = container.querySelector('.slot-occupant-id');
      expect(name?.textContent).toContain('char-1');
    });
  });
});
```

### Test Execution Command

```bash
npm run test -- SlotRack.unit.test.ts
```

### Expected Results

- **Total Tests:** 12
- **Expected:** 12 ✅ PASSED

---

## Summary: Test Inventory

| Fase | Component | Test Type | Count | File | Status |
|---|---|---|---|---|---|
| 1 | PgToken | Unit | 18 | `PgToken.unit.test.ts` | ❌ TODO |
| 2 | Roster | Unit | 12 | `Roster.unit.test.ts` | ❌ TODO |
| 2 | Roster+PgToken | Integration | 3 | `Roster_PgToken.integration.test.ts` | ❌ TODO |
| 3 | SlotRack | Unit | 12 | `SlotRack.unit.test.ts` | ❌ TODO |
| **TOTAL FASE 1-3** | | | **45** | | ❌ ALL TODO |

---

## Execution Order

1. **First:** Implementare PgToken componente reale
2. **Then:** Eseguire `npm run test -- PgToken.unit.test.ts`
3. **Then:** Implementare Roster
4. **Then:** Eseguire Roster tests
5. **Continue:** SlotRack, Drag (Fase 4), Activity (Fase 5)

---

## Manual Verification After Each Fase

**Fase 1 Manual Test:**
```
npm run dev
Navigate to http://localhost:3000/minimal-pgtoken
✅ Token visible, portrait centered
✅ Rarity ring color (bronze/silver/gold)
✅ Status icons visible
✅ Hover shows tooltip
✅ No console errors
```

**Fase 2 Manual Test:**
```
npm run dev
Navigate to http://localhost:3000/minimal-roster
✅ 5+ tokens in list
✅ Sort dropdown changes order
✅ Verify A-Z alphabetical
✅ Each token shows availability
✅ No regressions from Fase 1
```

**Fase 3 Manual Test:**
```
npm run dev
Navigate to http://localhost:3000/minimal-slotRack
✅ 4 slots in grid 2x2
✅ Slots gray with "+"
✅ No layout shift between pages
✅ Slot IDs visible in DOM
```

---

**Status:** ❌ Ready to execute (upon component implementation)  
**Next Step:** Implement PgToken → Run TEST-001 through TEST-018
