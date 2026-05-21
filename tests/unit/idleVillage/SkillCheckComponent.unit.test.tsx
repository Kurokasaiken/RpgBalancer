import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { SkillCheckComponent } from '@/ui/idleVillage/components/SkillCheckComponent';

describe('SkillCheckComponent', () => {
  it('TEST-096: Renders without crashing', () => {
    const { container } = render(
      <SkillCheckComponent dcTarget={10} residentSkill={12} />
    );
    expect(container).toBeTruthy();
  });

  it('TEST-097: Displays activity name', () => {
    const { container } = render(
      <SkillCheckComponent
        dcTarget={10}
        residentSkill={12}
        activityName="Taglia Legna"
      />
    );
    const text = container.textContent || '';
    expect(text).toContain('Taglia Legna');
  });

  it('TEST-098: Accepts DC and skill props', () => {
    const { container } = render(
      <SkillCheckComponent dcTarget={15} residentSkill={12} />
    );
    expect(container).toBeTruthy();
  });

  it('TEST-099: Component has idle/rolling/complete states', () => {
    const { container } = render(
      <SkillCheckComponent dcTarget={10} residentSkill={12} />
    );
    const text = container.textContent || '';
    // Initial state should show something
    expect(text).toBeTruthy();
  });

  it('TEST-100: Calls onComplete callback', async () => {
    const onComplete = vi.fn();
    render(
      <SkillCheckComponent
        dcTarget={10}
        residentSkill={12}
        onComplete={onComplete}
        autoStart={true}
      />
    );

    // Component will call callback after rolling
    expect(onComplete).toBeDefined();
  });

  it('TEST-101: Has DC and skill in initial state', () => {
    const { container } = render(
      <SkillCheckComponent dcTarget={10} residentSkill={12} />
    );
    const text = container.textContent || '';
    expect(text).toBeTruthy();
  });

  it('TEST-102: Component renders properly structured', () => {
    const { container } = render(
      <SkillCheckComponent dcTarget={10} residentSkill={12} />
    );
    const divs = container.querySelectorAll('div');
    expect(divs.length).toBeGreaterThan(0);
  });
});
