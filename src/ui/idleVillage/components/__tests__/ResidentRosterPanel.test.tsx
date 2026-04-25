import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type { DropValidationResult } from '@/ui/idleVillage/config/residentDropRules';
import { ResidentRosterPanel } from '../ResidentRosterPanel';
import { VillageRosterSection } from '../VillageRosterSection';

const mockDragTestContainer = vi.fn(({ residents }: { residents: ResidentState[] }) => (
  <div data-testid="drag-test-container">{residents.length}</div>
));

const mockDropFeedbackHUD = vi.fn((props: { showSignals?: boolean }) => (
  <div data-testid="drop-feedback-hud" data-show-signals={props.showSignals} />
));

vi.mock('../DragTestContainer', () => ({
  __esModule: true,
  default: (props: { residents: ResidentState[] }) => mockDragTestContainer(props),
}));

vi.mock('../DropFeedbackUI', () => ({
  __esModule: true,
  DropFeedbackHUD: (props: { showSignals?: boolean }) => mockDropFeedbackHUD(props),
}));

const buildResident = (overrides: Partial<ResidentState> = {}): ResidentState => ({
  id: `resident-${overrides.id ?? '1'}`,
  displayName: overrides.displayName ?? 'Resident One',
  status: overrides.status ?? 'available',
  fatigue: overrides.fatigue ?? 0,
  currentHp: overrides.currentHp ?? 100,
  maxHp: overrides.maxHp ?? 100,
  isHero: overrides.isHero ?? false,
  isInjured: overrides.isInjured ?? false,
  survivalCount: overrides.survivalCount ?? 0,
  survivalScore: overrides.survivalScore ?? 0,
  portraitUrl: overrides.portraitUrl ?? 'portrait-a.png',
  statSnapshot: overrides.statSnapshot ?? {},
  statTags: overrides.statTags ?? [],
});

afterEach(() => {
  mockDragTestContainer.mockClear();
  mockDropFeedbackHUD.mockClear();
});

describe('ResidentRosterPanel', () => {

  it('renders DragTestContainer with provided residents', () => {
    const residents = [buildResident({ id: 'a' }), buildResident({ id: 'b' })];

    render(<ResidentRosterPanel residents={residents} />);

    expect(screen.getByTestId('drag-test-container')).toHaveTextContent('2');
    expect(mockDragTestContainer).toHaveBeenCalledTimes(1);
    expect(mockDragTestContainer).toHaveBeenCalledWith(
      expect.objectContaining({
        residents,
        isDayPhase: true,
        cardVariant: 'vertical',
      }),
    );
  });

  it('forwards cardVariant override to DragTestContainer', () => {
    render(<ResidentRosterPanel residents={[buildResident()]} cardVariant="horizontal" />);

    expect(mockDragTestContainer).toHaveBeenCalledWith(
      expect.objectContaining({
        cardVariant: 'horizontal',
      }),
    );
  });

  it('passes validation feedback props to DropFeedbackHUD', () => {
    const validationResults: DropValidationResult[] = [
      {
        residentId: 'resident-omega',
        slotId: 'slot-1',
        status: 'invalid',
        reason: 'Mismatch',
      },
    ];

    render(
      <ResidentRosterPanel
        residents={[buildResident({ id: 'omega' })]}
        validationResults={validationResults}
        showHUDSignals
      />,
    );

    expect(mockDropFeedbackHUD).toHaveBeenCalledWith(
      expect.objectContaining({
        validationResults,
        showSignals: true,
      }),
    );
    expect(screen.getByTestId('drop-feedback-hud')).toHaveAttribute('data-show-signals', 'true');
  });

  it('displays assignment feedback when provided', () => {
    render(
      <ResidentRosterPanel
        residents={[buildResident()]}
        assignmentFeedback="Test feedback"
      />,
    );

    expect(screen.getByText('Test feedback')).toBeVisible();
  });

  it('forwards getResidentCompatibility to DragTestContainer', () => {
    const stub = vi.fn();
    render(
      <ResidentRosterPanel
        residents={[buildResident({ id: 'gamma' })]}
        getResidentCompatibility={stub}
      />,
    );

    expect(mockDragTestContainer).toHaveBeenCalledWith(
      expect.objectContaining({
        getResidentCompatibility: stub,
      }),
    );
  });
});

describe('VillageRosterSection', () => {
  it('renders section header and roster panel', () => {
    render(
      <VillageRosterSection
        residents={[buildResident({ id: 'alpha' })]}
        assignmentFeedback="Operativo"
        isDayPhase={false}
      />,
    );

    expect(screen.getByTestId('village-roster-section')).toBeVisible();
    expect(screen.getByText(/Residenti/i)).toBeVisible();
    expect(screen.getByTestId('drag-test-container')).toHaveTextContent('1');
    expect(screen.getByText('Operativo')).toBeVisible();
  });

  it('forwards roster handlers down to ResidentRosterPanel', () => {
    const onDragStart = vi.fn();
    const onDragEnd = vi.fn();
    const onResidentSelect = vi.fn();

    render(
      <VillageRosterSection
        residents={[buildResident({ id: 'alpha' })]}
        assignmentFeedback="Status"
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onResidentSelect={onResidentSelect}
        isDayPhase
      />,
    );

    expect(mockDragTestContainer).toHaveBeenCalledWith(
      expect.objectContaining({
        onDragStart,
        onDragEnd,
        onResidentSelect,
        residents: expect.arrayContaining([expect.objectContaining({ id: 'resident-alpha' })]),
        isDayPhase: true,
      }),
    );
  });
});
