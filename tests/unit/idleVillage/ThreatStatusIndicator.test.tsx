import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ThreatStatusIndicator, { type Threat } from '@/ui/idleVillage/components/ThreatStatusIndicator';

const baseThreat: Threat = {
  id: 'threat-1',
  type: 'GOBLIN_RAID',
  urgency: 'CALM',
  timeLeft: '2h 14m',
  icon: '/goblin-march-trasparente.png',
  progress: 65,
};

describe('ThreatStatusIndicator', () => {
  it('renders the threat type, urgency label and time left', () => {
    render(<ThreatStatusIndicator threat={baseThreat} />);

    expect(screen.getByText('Goblin Raid')).toBeInTheDocument();
    expect(screen.getByText(/CALM/)).toBeInTheDocument();
    expect(screen.getByText(/2h 14m/)).toBeInTheDocument();
  });

  it('renders a critical threat with critical copy', () => {
    const criticalThreat: Threat = {
      ...baseThreat,
      id: 'threat-2',
      urgency: 'CRITICAL',
      timeLeft: '5m',
    };
    render(<ThreatStatusIndicator threat={criticalThreat} />);

    expect(screen.getByText(/CRITICAL/)).toBeInTheDocument();
    expect(screen.getByText(/5m/)).toBeInTheDocument();
  });

  it('returns null when threat is absent', () => {
    const { container } = render(
      <ThreatStatusIndicator threat={null as unknown as Threat} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('calls onClick when the card is clicked', () => {
    const handleClick = vi.fn();
    render(<ThreatStatusIndicator threat={baseThreat} onClick={handleClick} />);

    fireEvent.click(screen.getByText('Goblin Raid'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
