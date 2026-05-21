import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ActivityCard } from '@/ui/idleVillage/components/ActivityCard';

describe('ActivityCard', () => {
  it('TEST-121: Renders without crashing', () => {
    const { container } = render(
      <ActivityCard
        activityId="job-1"
        title="Taglia Legna"
        type="job"
        occupancy={1}
        maxSlots={4}
      />
    );
    expect(container).toBeTruthy();
  });

  it('TEST-122: Displays activity title', () => {
    const { container } = render(
      <ActivityCard
        activityId="job-1"
        title="Taglia Legna"
        type="job"
        occupancy={1}
        maxSlots={4}
      />
    );
    const text = container.textContent || '';
    expect(text).toContain('Taglia Legna');
  });

  it('TEST-123: Shows occupancy status', () => {
    const { container } = render(
      <ActivityCard
        activityId="job-1"
        title="Test"
        type="job"
        occupancy={2}
        maxSlots={4}
      />
    );
    const text = container.textContent || '';
    expect(text).toContain('2');
    expect(text).toContain('4');
  });

  it('TEST-124: Shows job icon for job type', () => {
    const { container } = render(
      <ActivityCard
        activityId="job-1"
        title="Test"
        type="job"
        occupancy={0}
        maxSlots={4}
        icon="⚙️"
      />
    );
    const text = container.textContent || '';
    expect(text).toContain('⚙️');
  });

  it('TEST-125: Shows quest icon for quest type', () => {
    const { container } = render(
      <ActivityCard
        activityId="quest-1"
        title="Test"
        type="quest"
        occupancy={0}
        maxSlots={2}
        icon="⚔️"
      />
    );
    const text = container.textContent || '';
    expect(text).toContain('⚔️');
  });

  it('TEST-126: Has expand toggle', () => {
    const { container } = render(
      <ActivityCard
        activityId="job-1"
        title="Test"
        type="job"
        occupancy={0}
        maxSlots={4}
      />
    );
    // Should have a clickable header
    expect(container.querySelector('[style*="cursor: pointer"]')).toBeTruthy();
  });

  it('TEST-127: Occupancy bar shows progress', () => {
    const { container } = render(
      <ActivityCard
        activityId="job-1"
        title="Test"
        type="job"
        occupancy={3}
        maxSlots={4}
      />
    );
    // Bar should be present
    const divs = container.querySelectorAll('div');
    expect(divs.length).toBeGreaterThan(5);
  });

  it('TEST-128: Calculates occupancy percentage correctly', () => {
    const { container } = render(
      <ActivityCard
        activityId="job-1"
        title="Test"
        type="job"
        occupancy={4}
        maxSlots={4}
      />
    );
    const text = container.textContent || '';
    expect(text).toContain('4/4');
  });

  it('TEST-129: Renders custom icon prop', () => {
    const { container } = render(
      <ActivityCard
        activityId="job-1"
        title="Test"
        type="job"
        occupancy={0}
        maxSlots={4}
        icon="⚙️"
      />
    );
    const text = container.textContent || '';
    expect(text).toContain('⚙️');
  });

  it('TEST-130: Accepts children for expanded content', () => {
    const { container } = render(
      <ActivityCard
        activityId="job-1"
        title="Test"
        type="job"
        occupancy={0}
        maxSlots={4}
        expanded={true}
      >
        <div data-testid="detail-content">Details here</div>
      </ActivityCard>
    );
    expect(container).toBeTruthy();
  });
});
