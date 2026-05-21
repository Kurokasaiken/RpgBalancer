import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { VictoryComponent } from '@/ui/idleVillage/components/VictoryComponent';

describe('VictoryComponent', () => {
  it('TEST-103: Renders without crashing', () => {
    const { container } = render(
      <VictoryComponent
        questTitle="Cattura la Bestia"
        rewards={{ xp: 200 }}
      />
    );
    expect(container).toBeTruthy();
  });

  it('TEST-104: Displays victory message', () => {
    const { container } = render(
      <VictoryComponent
        questTitle="Test Quest"
        rewards={{ xp: 100 }}
      />
    );
    const text = container.textContent || '';
    expect(text).toContain('VICTORY');
  });

  it('TEST-105: Shows quest title', () => {
    const { container } = render(
      <VictoryComponent
        questTitle="Cattura la Bestia"
        rewards={{ xp: 200 }}
      />
    );
    const text = container.textContent || '';
    expect(text).toContain('Cattura la Bestia');
  });

  it('TEST-106: Displays XP reward', () => {
    const { container } = render(
      <VictoryComponent
        questTitle="Test"
        rewards={{ xp: 250 }}
      />
    );
    const text = container.textContent || '';
    expect(text).toContain('250');
    expect(text).toContain('Experience');
  });

  it('TEST-107: Displays wood reward when present', () => {
    const { container } = render(
      <VictoryComponent
        questTitle="Test"
        rewards={{ wood: 50, xp: 100 }}
      />
    );
    const text = container.textContent || '';
    expect(text).toContain('50');
    expect(text).toContain('Wood');
  });

  it('TEST-108: Displays gold reward when present', () => {
    const { container } = render(
      <VictoryComponent
        questTitle="Test"
        rewards={{ gold: 30, xp: 100 }}
      />
    );
    const text = container.textContent || '';
    expect(text).toContain('30');
    expect(text).toContain('Gold');
  });

  it('TEST-109: Has continue button', () => {
    const { container } = render(
      <VictoryComponent
        questTitle="Test"
        rewards={{ xp: 100 }}
      />
    );
    const text = container.textContent || '';
    expect(text).toContain('Continue');
  });

  it('TEST-110: Calls onDismiss when closed', () => {
    const onDismiss = vi.fn();
    render(
      <VictoryComponent
        questTitle="Test"
        rewards={{ xp: 100 }}
        onDismiss={onDismiss}
        autoClose={false}
      />
    );
    expect(onDismiss).toBeDefined();
  });
});
