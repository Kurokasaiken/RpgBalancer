import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import WorkerPickerSheet from '../WorkerPickerSheet';
import type {
  ResidentAssignmentCandidate,
  ResidentPickerSlotMeta,
} from '@/ui/idleVillage/components/InlineResidentChips';

const baseSlotMeta: ResidentPickerSlotMeta = {
  slotId: 'job-slot-1',
  label: 'Allenamento',
  description: 'Seleziona un residente per il turno',
  activityLabel: 'Work Shift',
};

const buildCandidate = (
  overrides: Partial<ResidentAssignmentCandidate> = {},
): ResidentAssignmentCandidate => ({
  id: 'resident-1',
  displayName: 'Gladia',
  statusLabel: 'Disponibile',
  fatigue: 12,
  portraitUrl: null,
  compatibility: {
    residentId: 'resident-1',
    reason: 'valid',
    score: 0.92,
    ...overrides.compatibility,
  },
  ...overrides,
});

beforeAll(() => {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));

  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    callback(performance.now());
    return 0;
  });

  vi.stubGlobal('cancelAnimationFrame', vi.fn());
});

afterAll(() => {
  vi.unstubAllGlobals();
});

afterEach(() => {
  cleanup();
  document.body.innerHTML = '';
  document.body.className = '';
});

const flushMicrotasks = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

describe('WorkerPickerSheet', () => {
  it('renders open state with residents (snapshot)', async () => {
    const onAssign = vi.fn();
    const onClose = vi.fn();
    render(
      <WorkerPickerSheet
        isOpen
        slotMeta={baseSlotMeta}
        residents={[buildCandidate()]}
        onAssign={onAssign}
        onClose={onClose}
      />,
    );

    await flushMicrotasks();

    const overlay = document.querySelector('[data-sandbox-interaction-picker="open"]');
    expect(overlay).not.toBeNull();
    expect(overlay).toMatchSnapshot();
  });

  it('renders empty state when there are no candidates', async () => {
    render(
      <WorkerPickerSheet
        isOpen
        slotMeta={baseSlotMeta}
        residents={[]}
        onAssign={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    await flushMicrotasks();

    const emptyCopy = Array.from(
      document.querySelectorAll('[data-sandbox-worker-picker="open"] p'),
    ).find((node) => node.textContent?.includes('Nessun residente compatibile'));
    expect(emptyCopy?.textContent).toContain('Nessun residente compatibile');

    const overlay = document.querySelector('[data-sandbox-interaction-picker="open"]');
    expect(overlay).not.toBeNull();
    expect(overlay).toMatchSnapshot();
  });

  it('disables assign button for incompatible residents', async () => {
    render(
      <WorkerPickerSheet
        isOpen
        slotMeta={baseSlotMeta}
        residents={[
          buildCandidate({
            id: 'resident-invalid',
            displayName: 'Tomas',
            compatibility: {
              residentId: 'resident-invalid',
              reason: 'FATIGUE_THRESHOLD',
              score: 0.35,
            },
          }),
        ]}
        onAssign={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    await flushMicrotasks();

    const assignButton = document.querySelector(
      '[data-sandbox-worker-picker="open"] button[disabled]',
    ) as HTMLButtonElement | null;

    expect(assignButton).not.toBeNull();
    expect(assignButton?.textContent).toContain('Assegna');

    const overlay = document.querySelector('[data-sandbox-interaction-picker="open"]');
    expect(overlay).not.toBeNull();
    expect(overlay).toMatchSnapshot();
  });
});
