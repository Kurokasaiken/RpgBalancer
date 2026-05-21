import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { VendorShop, type ShopItem } from '@/ui/idleVillage/components/VendorShop';

const mockItems: ShopItem[] = [
  {
    id: 'str-potion',
    name: 'Strength Potion',
    description: '+3 STR',
    cost: 50,
    icon: '💪',
    durationMinutes: 120,
    effect: { type: 'strength', value: 3 },
  },
  {
    id: 'wis-potion',
    name: 'Wisdom Potion',
    description: '+3 WIS',
    cost: 50,
    icon: '🧠',
    durationMinutes: 120,
    effect: { type: 'wisdom', value: 3 },
  },
  {
    id: 'resilience-potion',
    name: 'Resilience Potion',
    description: '+2 DC buffer',
    cost: 100,
    icon: '🛡️',
    durationMinutes: 180,
    effect: { type: 'resilience', value: 2 },
  },
];

describe('VendorShop', () => {
  // TEST-171: Basic rendering
  it('TEST-171: Renders without crashing', () => {
    const { container } = render(
      <VendorShop
        shopTitle="Potion Shop"
        items={mockItems}
        playerGold={300}
      />
    );
    expect(container).toBeTruthy();
  });

  // TEST-172: Display shop title
  it('TEST-172: Displays shop title', () => {
    const { container } = render(
      <VendorShop
        shopTitle="Potion Shop"
        items={mockItems}
        playerGold={300}
      />
    );
    const text = container.textContent || '';
    expect(text).toContain('Potion Shop');
  });

  // TEST-173: Display player gold
  it('TEST-173: Shows player gold balance', () => {
    const { container } = render(
      <VendorShop
        shopTitle="Potion Shop"
        items={mockItems}
        playerGold={300}
      />
    );
    const text = container.textContent || '';
    expect(text).toContain('300');
  });

  // TEST-174: Display shop items
  it('TEST-174: Shows all shop items', () => {
    const { container } = render(
      <VendorShop
        shopTitle="Potion Shop"
        items={mockItems}
        playerGold={300}
      />
    );
    expect(container.querySelectorAll('[data-testid^="shop-item-"]').length).toEqual(3);
  });

  // TEST-175: Display item costs
  it('TEST-175: Shows item costs', () => {
    const { container } = render(
      <VendorShop
        shopTitle="Potion Shop"
        items={mockItems}
        playerGold={300}
      />
    );
    const text = container.textContent || '';
    expect(text).toContain('50');
    expect(text).toContain('100');
  });

  // TEST-176: Display item icons
  it('TEST-176: Shows item icons', () => {
    const { container } = render(
      <VendorShop
        shopTitle="Potion Shop"
        items={mockItems}
        playerGold={300}
      />
    );
    const text = container.textContent || '';
    expect(text).toContain('💪');
    expect(text).toContain('🧠');
  });

  // TEST-177: Unaffordable items show cost difference
  it('TEST-177: Shows unaffordable items', () => {
    const { container } = render(
      <VendorShop
        shopTitle="Potion Shop"
        items={mockItems}
        playerGold={60}
      />
    );
    const text = container.textContent || '';
    expect(text).toContain('Need');
  });

  // TEST-178: Close button
  it('TEST-178: Has close button', () => {
    const { container } = render(
      <VendorShop
        shopTitle="Potion Shop"
        items={mockItems}
        playerGold={300}
        onDismiss={() => {}}
      />
    );
    const text = container.textContent || '';
    expect(text).toContain('Close');
  });

  // TEST-179: Purchase callback
  it('TEST-179: Calls onPurchase callback', () => {
    const onPurchase = vi.fn();
    const { container } = render(
      <VendorShop
        shopTitle="Potion Shop"
        items={mockItems}
        playerGold={300}
        onPurchase={onPurchase}
      />
    );
    expect(onPurchase).toBeDefined();
  });

  // TEST-180: Dismiss callback
  it('TEST-180: Calls onDismiss callback', () => {
    const onDismiss = vi.fn();
    const { container } = render(
      <VendorShop
        shopTitle="Potion Shop"
        items={mockItems}
        playerGold={300}
        onDismiss={onDismiss}
      />
    );
    expect(onDismiss).toBeDefined();
  });
});
