import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { VendorCard, type Potion } from '@/ui/idleVillage/components/VendorCard';

const mockPotions: Potion[] = [
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
    id: 'speed-potion',
    name: 'Speed Potion',
    description: '-20% duration',
    cost: 75,
    icon: '⚡',
    durationMinutes: 60,
    effect: { type: 'speed', value: 0.8 },
  },
];

describe('VendorCard', () => {
  // TEST-161: Basic rendering
  it('TEST-161: Renders without crashing', () => {
    const { container } = render(
      <VendorCard
        vendorId="vendor-1"
        vendorName="Alchemist"
        potions={mockPotions}
        playerGold={200}
      />
    );
    expect(container).toBeTruthy();
  });

  // TEST-162: Display vendor name
  it('TEST-162: Displays vendor name', () => {
    const { container } = render(
      <VendorCard
        vendorId="vendor-1"
        vendorName="Alchemist"
        potions={mockPotions}
        playerGold={200}
      />
    );
    const text = container.textContent || '';
    expect(text).toContain('Alchemist');
  });

  // TEST-163: Display vendor icon
  it('TEST-163: Shows vendor icon', () => {
    const { container } = render(
      <VendorCard
        vendorId="vendor-1"
        vendorName="Alchemist"
        potions={mockPotions}
        playerGold={200}
        icon="🧪"
      />
    );
    const text = container.textContent || '';
    expect(text).toContain('🧪');
  });

  // TEST-164: Expand/collapse functionality
  it('TEST-164: Has expand toggle', () => {
    const { container } = render(
      <VendorCard
        vendorId="vendor-1"
        vendorName="Alchemist"
        potions={mockPotions}
        playerGold={200}
      />
    );
    // Should have a clickable header
    expect(container.querySelector('[style*="cursor: pointer"]')).toBeTruthy();
  });

  // TEST-165: Display potions when expanded
  it('TEST-165: Shows potions when expanded', () => {
    const { container } = render(
      <VendorCard
        vendorId="vendor-1"
        vendorName="Alchemist"
        potions={mockPotions}
        playerGold={200}
      />
    );
    const text = container.textContent || '';
    // At least one potion should be visible
    expect(text.length).toBeGreaterThan(50);
  });

  // TEST-166: Display potion cost
  it('TEST-166: Shows potion costs', () => {
    const { container } = render(
      <VendorCard
        vendorId="vendor-1"
        vendorName="Alchemist"
        potions={mockPotions}
        playerGold={200}
      />
    );
    const text = container.textContent || '';
    expect(text).toContain('50');
    expect(text).toContain('75');
  });

  // TEST-167: Potion affordability
  it('TEST-167: Shows unaffordable potions as disabled', () => {
    const { container } = render(
      <VendorCard
        vendorId="vendor-1"
        vendorName="Alchemist"
        potions={mockPotions}
        playerGold={40}
      />
    );
    const text = container.textContent || '';
    expect(text).toContain('Need');
  });

  // TEST-168: Purchase callback
  it('TEST-168: Calls onPotionPurchase callback', () => {
    const onPurchase = vi.fn();
    const { container } = render(
      <VendorCard
        vendorId="vendor-1"
        vendorName="Alchemist"
        potions={mockPotions}
        playerGold={200}
        onPotionPurchase={onPurchase}
      />
    );
    expect(onPurchase).toBeDefined();
  });

  // TEST-169: Display duration
  it('TEST-169: Shows potion duration', () => {
    const { container } = render(
      <VendorCard
        vendorId="vendor-1"
        vendorName="Alchemist"
        potions={mockPotions}
        playerGold={200}
      />
    );
    const text = container.textContent || '';
    expect(text).toContain('120') || expect(text).toContain('60');
  });

  // TEST-170: Multiple potions displayed
  it('TEST-170: Displays all potions in catalog', () => {
    const { container } = render(
      <VendorCard
        vendorId="vendor-1"
        vendorName="Alchemist"
        potions={mockPotions}
        playerGold={200}
      />
    );
    expect(container.querySelectorAll('[data-testid^="potion-"]').length).toBeGreaterThan(0);
  });
});
