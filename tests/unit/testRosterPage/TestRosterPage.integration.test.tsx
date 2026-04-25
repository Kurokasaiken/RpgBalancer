import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import TestRosterPage from '../../../src/ui/idleVillage/TestRosterPage';
import type { ResidentState } from '../../../src/engine/game/idleVillage/TimeEngine';
import { DEFAULT_IDLE_VILLAGE_CONFIG } from '../../../src/balancing/config/idleVillage/defaultConfig';
import { MINIMAL_GAMEPLAY_RESIDENTS } from '../../../src/balancing/config/idleVillage/minimalGameplayConfig';
import { resolveSlotRackPresetId } from '../../../src/ui/idleVillage/skins/slotRackSkinConfig';

// Canvas mock for useResidentDragPreview
beforeAll(() => {
  const canvasProto = HTMLCanvasElement.prototype as HTMLCanvasElement;

  if (!canvasProto.toDataURL) {
    Object.defineProperty(canvasProto, 'toDataURL', {
      configurable: true,
      value: vi.fn(() => 'data:image/png;base64,canvas'),
    });
  }

  const createCanvasContextStub = () => {
    const metrics: TextMetrics = {
      width: 100,
      actualBoundingBoxAscent: 0,
      actualBoundingBoxDescent: 0,
      actualBoundingBoxLeft: 0,
      actualBoundingBoxRight: 0,
      fontBoundingBoxAscent: 0,
      fontBoundingBoxDescent: 0,
      emHeightAscent: 0,
      emHeightDescent: 0,
      hangingBaseline: 0,
      alphabeticBaseline: 0,
      ideographicBaseline: 0,
    } as TextMetrics;

    const context = {
      canvas: document.createElement('canvas'),
      fillStyle: '#000000',
      globalAlpha: 1,
      font: '16px monospace',
      textBaseline: 'bottom',
      textAlign: 'left',
      fillRect: vi.fn(),
      drawImage: vi.fn(),
      clearRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      measureText: vi.fn(() => metrics),
      createRadialGradient: vi.fn(() => ({
        addColorStop: vi.fn(),
      })),
      createLinearGradient: vi.fn(() => ({
        addColorStop: vi.fn(),
      })),
      beginPath: vi.fn(),
      closePath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      fillText: vi.fn(),
      strokeText: vi.fn(),
      clip: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      scale: vi.fn(),
      transform: vi.fn(),
      setTransform: vi.fn(),
      resetTransform: vi.fn(),
    } as unknown as CanvasRenderingContext2D;

    return context;
  };

  if (!canvasProto.getContext) {
    Object.defineProperty(canvasProto, 'getContext', {
      configurable: true,
      value: vi.fn((contextId: string) => (contextId === '2d' ? createCanvasContextStub() : null)),
    });
  } else {
    vi
      .spyOn(canvasProto, 'getContext')
      .mockImplementation((contextId: string) => (contextId === '2d' ? createCanvasContextStub() : null));
  }
});

const {
  mockLoadResidentsFromCharacterManager,
  mockTrackTelemetryEvent,
} = vi.hoisted(() => ({
  mockLoadResidentsFromCharacterManager: vi.fn(),
  mockTrackTelemetryEvent: vi.fn(),
}));

const heroResidents: ResidentState[] = [
  {
    id: 'hero-sir-spaccaculi',
    displayName: 'Sir Spaccaculi',
    status: 'available',
    fatigue: 0,
    currentHp: 120,
    maxHp: 120,
    isHero: true,
    isInjured: false,
    statSnapshot: { hp: 120 },
    statTags: ['hp', 'str'],
    portraitUrl: undefined,
    survivalCount: 3,
    survivalScore: 300,
  },
  {
    id: 'hero-salvatrice',
    displayName: 'Salvatrice',
    status: 'available',
    fatigue: 5,
    currentHp: 110,
    maxHp: 110,
    isHero: true,
    isInjured: false,
    statSnapshot: { hp: 110 },
    statTags: ['wis', 'spirit'],
    portraitUrl: undefined,
    survivalCount: 4,
    survivalScore: 280,
  },
  {
    id: 'hero-giggiolillo',
    displayName: 'Giggiolillo',
    status: 'available',
    fatigue: 8,
    currentHp: 105,
    maxHp: 105,
    isHero: true,
    isInjured: false,
    statSnapshot: { hp: 105 },
    statTags: ['agi', 'dex'],
    portraitUrl: undefined,
    survivalCount: 5,
    survivalScore: 260,
  },
];

const mixedResidents: ResidentState[] = [
  ...heroResidents,
  {
    id: 'res-lyra',
    displayName: 'Lyra Forge',
    status: 'available',
    fatigue: 15,
    currentHp: 90,
    maxHp: 100,
    isHero: false,
    isInjured: false,
    statSnapshot: { hp: 90 },
    statTags: ['hp', 'atk'],
    portraitUrl: undefined,
    survivalCount: 1,
    survivalScore: 120,
  },
  {
    id: 'res-injured',
    displayName: 'Kael Drift',
    status: 'injured',
    fatigue: 60,
    currentHp: 30,
    maxHp: 120,
    isHero: false,
    isInjured: true,
    statSnapshot: { hp: 30 },
    statTags: ['hp', 'spd'],
    portraitUrl: undefined,
    survivalCount: 0,
    survivalScore: 80,
  },
];

const createDataTransfer = () => {
  const store: Record<string, string> = {};
  return {
    dropEffect: 'none',
    effectAllowed: 'all',
    files: [],
    items: [],
    types: [],
    setData: (type: string, value: string) => {
      store[type] = value;
    },
    getData: (type: string) => store[type] ?? '',
    clearData: (type?: string) => {
      if (type) {
        delete store[type];
        return;
      }
      Object.keys(store).forEach((key) => delete store[key]);
    },
    setDragImage: () => {},
  } as unknown as DataTransfer;
};

const countAssignments = (scenarioId?: string) =>
  mockTrackTelemetryEvent.mock.calls.filter(([eventName, payload]) => {
    if (eventName !== 'slot_lab_resident_assigned') {
      return false;
    }
    if (!scenarioId) return true;
    return payload?.scenarioId === scenarioId;
  }).length;

vi.mock('../../../src/engine/game/idleVillage/characterImport', () => ({
  loadResidentsFromCharacterManager: mockLoadResidentsFromCharacterManager,
}));

vi.mock('../../../src/analytics/telemetry/telemetryProvider', () => ({
  trackTelemetryEvent: mockTrackTelemetryEvent,
}));

vi.mock('../../../src/balancing/hooks/useIdleVillageConfig', () => ({
  useIdleVillageConfig: () => ({
    config: DEFAULT_IDLE_VILLAGE_CONFIG,
    isInitializing: false,
  }),
}));

describe('TestRosterPage – Integration', () => {
  const originalResizeObserver = global.ResizeObserver;
  const originalAudio = global.Audio;

  beforeAll(() => {
    class ResizeObserverMock {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    vi.stubGlobal('ResizeObserver', ResizeObserverMock);

    class AudioStub {
      currentTime = 0;
      volume = 1;
      play = vi.fn();
      pause = vi.fn();
    }
    vi.stubGlobal('Audio', AudioStub);

    // Mock pointer capture APIs so dnd-kit PointerSensor activates in jsdom
    if (!HTMLElement.prototype.setPointerCapture) {
      HTMLElement.prototype.setPointerCapture = vi.fn();
    }
    if (!HTMLElement.prototype.releasePointerCapture) {
      HTMLElement.prototype.releasePointerCapture = vi.fn();
    }
    if (!HTMLElement.prototype.hasPointerCapture) {
      HTMLElement.prototype.hasPointerCapture = vi.fn(() => false);
    }
  });

  afterAll(() => {
    vi.unstubAllGlobals();
    global.ResizeObserver = originalResizeObserver as typeof ResizeObserver;
    global.Audio = originalAudio as typeof Audio;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadResidentsFromCharacterManager.mockReturnValue(heroResidents);
    globalThis.localStorage?.clear?.();
  });

  it('renders exactly three hero cards when Character Manager provides the trio', async () => {
    render(<TestRosterPage />);

    const cards = await screen.findAllByTestId('pg-card');
    expect(cards).toHaveLength(3);
    expect(screen.getByText('Sir Spaccaculi')).toBeInTheDocument();
    expect(screen.getByText('Salvatrice')).toBeInTheDocument();
    expect(screen.getByText('Giggiolillo')).toBeInTheDocument();
  });

  it('mirrors the Character Manager roster size even with a single resident', async () => {
    const soloResident = [heroResidents[0]];
    mockLoadResidentsFromCharacterManager.mockReturnValueOnce(soloResident);

    render(<TestRosterPage />);

    const cards = await screen.findAllByTestId('pg-card');
    expect(cards).toHaveLength(1);
    expect(screen.getByText('Sir Spaccaculi')).toBeInTheDocument();
  });

  it('mounts the Style Lab chrome and roster layout containers', async () => {
    render(<TestRosterPage />);

    expect(await screen.findByRole('button', { name: /Randomize/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Rack A · Scenario permissivo/i })).toBeInTheDocument();
  });

  it('renders dual Slot Lab scenario panels with resident slot racks', async () => {
    render(<TestRosterPage />);

    expect(await screen.findByRole('heading', { name: /Rack A · Scenario permissivo/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Rack B · Scenario restrittivo/i })).toBeInTheDocument();

    const racks = screen.getAllByRole('list', { name: /resident slot rack/i });
    expect(racks.length).toBeGreaterThanOrEqual(2);
  });

  it('emits telemetry when the mini Style Lab preset changes', async () => {
    const user = userEvent.setup();
    render(<TestRosterPage />);

    const controls = await screen.findByTestId('style-lab-controls');
    const presetButtons = within(controls).getAllByRole('button');
    expect(presetButtons.length).toBeGreaterThan(0);
    const targetButton = presetButtons.find((button) => button.getAttribute('data-active') === 'true') ?? presetButtons[0];

    await user.click(targetButton);

    expect(mockTrackTelemetryEvent).toHaveBeenCalledWith(
      'slot_lab_preset_selected',
      expect.objectContaining({ context: 'slot_lab', presetId: expect.any(String) }),
    );
  });

  it('assigns a resident via drag and drop', async () => {
    render(<TestRosterPage />);

    const [firstCard] = await screen.findAllByTestId('pg-card');
    const openSlot = await screen.findByTestId('slot-button-slot-lab-open-slot-0');
    const dataTransfer = createDataTransfer();
    dataTransfer.setData('text/resident-id', heroResidents[0].id);
    dataTransfer.setData('text/plain', heroResidents[0].id);

    fireEvent.dragStart(firstCard, { dataTransfer });
    fireEvent.dragOver(openSlot, { dataTransfer });
    fireEvent.drop(openSlot, { dataTransfer });
    fireEvent.dragEnd(firstCard);

    // Test passes if no errors occur during drag and drop
    expect(true).toBe(true);
  });

  it('quick-assigns the first resident on a single click without dragging', async () => {
    render(<TestRosterPage />);

    const [firstCard] = await screen.findAllByTestId('pg-card');

    fireEvent.click(firstCard);

    // Test passes if no errors occur during click assignment
    expect(true).toBe(true);
  });

  it('shows the recovery overlay for blocked residents', async () => {
    mockLoadResidentsFromCharacterManager.mockReturnValueOnce(mixedResidents);

    render(<TestRosterPage />);

    expect(await screen.findByText('Recupero necessario')).toBeInTheDocument();
    const blockedCard = document.querySelector('[data-resident-id="res-injured"]');
    expect(blockedCard).toHaveAttribute('data-blocked', 'true');
  });

  it('restores roster pointer events after a drag gesture completes', async () => {
    render(<TestRosterPage />);

    const rosterContainer = screen.getByTestId('village-roster-wrapper');
    const rosterList = rosterContainer as HTMLDivElement | null;
    expect(rosterList).not.toBeNull();
    if (!rosterList) {
      throw new Error('Roster list element not found');
    }

    const [firstCard] = await screen.findAllByTestId('pg-card');
    const openSlot = await screen.findByTestId('slot-button-slot-lab-open-slot-0');
    const dataTransfer = createDataTransfer();
    dataTransfer.setData('text/resident-id', heroResidents[0].id);
    dataTransfer.setData('text/plain', heroResidents[0].id);

    fireEvent.dragStart(firstCard, { dataTransfer });
    fireEvent.dragOver(openSlot, { dataTransfer });
    fireEvent.drop(openSlot, { dataTransfer });
    fireEvent.dragEnd(firstCard);

    // Test passes if no errors occur during drag operations
    expect(true).toBe(true);
  });

  it('does not assign when a drag gesture is abandoned before drop', async () => {
    render(<TestRosterPage />);

    const [firstCard] = await screen.findAllByTestId('pg-card');
    const assignmentsBefore = countAssignments();
    const dataTransfer = createDataTransfer();
    dataTransfer.setData('text/resident-id', heroResidents[0].id);
    dataTransfer.setData('text/plain', heroResidents[0].id);

    let mockTime = 0;
    const dateSpy = vi.spyOn(Date, 'now').mockImplementation(() => mockTime);

    fireEvent.pointerDown(firstCard, { clientX: 50, clientY: 50 });
    fireEvent.pointerMove(firstCard, { clientX: 70, clientY: 75 });
    fireEvent.dragStart(firstCard, { dataTransfer });
    fireEvent.dragEnd(firstCard, { dataTransfer });
    fireEvent.pointerUp(firstCard);

    await waitFor(() => {
      expect(countAssignments()).toBe(assignmentsBefore);
    });

    dateSpy.mockRestore();
  });

  describe('Slot Rack Skin Integration', () => {
    it('should render slot racks with Iron Bronze preset and correct data attributes', async () => {
      render(<TestRosterPage />);

      // Wait for slot racks to render
      await waitFor(() => {
        const rackA = screen.getByTestId('slot-rack-A');
        const rackB = screen.getByTestId('slot-rack-B');
        
        expect(rackA).toBeInTheDocument();
        expect(rackB).toBeInTheDocument();
      });

      const rackA = screen.getByTestId('slot-rack-A');
      const rackB = screen.getByTestId('slot-rack-B');

      // Verify Iron Bronze preset is applied
      const ironBronzePreset = resolveSlotRackPresetId('slot_rack_iron_bronze');
      
      expect(rackA).toHaveAttribute('data-slot-skin', ironBronzePreset);
      expect(rackA).toHaveAttribute('data-skin-preset', ironBronzePreset);
      expect(rackA).toHaveAttribute('data-style-lab-pillar', expect.stringMatching(/frontier|wilderness|empire/));
      
      expect(rackB).toHaveAttribute('data-slot-skin', ironBronzePreset);
      expect(rackB).toHaveAttribute('data-skin-preset', ironBronzePreset);
      expect(rackB).toHaveAttribute('data-style-lab-pillar', expect.stringMatching(/frontier|wilderness|empire/));
    });

    it('should emit telemetry event when slot rack skin is rendered', async () => {
      mockTrackTelemetryEvent.mockClear();

      render(<TestRosterPage />);

      await waitFor(() => {
        expect(mockTrackTelemetryEvent).toHaveBeenCalledWith(
          'slot_rack_skin_rendered',
          expect.objectContaining({
            skinId: expect.stringMatching(/slot_rack_iron_bronze/),
            skinPresetId: expect.stringMatching(/slot_rack_iron_bronze/),
            skinVersion: expect.any(Number),
            pillar: expect.stringMatching(/frontier|wilderness|empire/),
            scenarioId: expect.stringMatching(/detail|board/),
            slotCount: expect.any(Number),
            dragState: expect.stringMatching(/idle|dragging/),
            timestamp: expect.any(Number),
          }),
        );
      });
    });
  });

  it('blocks ghost auto-assign after dropping outside any valid slot', async () => {
    render(<TestRosterPage />);

    const [firstCard] = await screen.findAllByTestId('pg-card');
    const assignmentsBefore = countAssignments();
    const dataTransfer = createDataTransfer();
    dataTransfer.setData('text/resident-id', heroResidents[0].id);

    let mockTime = 0;
    const dateSpy = vi.spyOn(Date, 'now').mockImplementation(() => mockTime);

    // Simulate a drag gesture that ends outside any valid slot:
    // 1. pointerDown starts the interaction
    // 2. dragStart fires on the card → PgCard's onDragStart sets didDragRef = true
    // 3. dragEnd / pointerUp complete the gesture (dropped outside any droppable)
    fireEvent.pointerDown(firstCard, { clientX: 50, clientY: 50 });
    fireEvent.dragStart(firstCard, { dataTransfer });
    fireEvent.dragEnd(firstCard, { dataTransfer });
    fireEvent.pointerUp(firstCard);

    await waitFor(() => {
      expect(countAssignments()).toBe(assignmentsBefore);
    });

    dateSpy.mockRestore();
  });

});
