import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ResidentRelationshipGraphTool } from '@/ui/idleVillage/tools/ResidentRelationshipGraph';
import { DEFAULT_RESIDENT_RELATIONSHIP_GRAPH_CONFIG } from '@/ui/idleVillage/config/residentRelationshipGraphConfig';
import type { ResidentRelationshipGraphData } from '@/ui/idleVillage/config/residentRelationshipGraphConfig';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';

const mockUseMapContext = vi.fn();
const mockUseCrewSchedulerAnalytics = vi.fn();
const mockUseResidentRelationshipGraph = vi.fn();

vi.mock('@/ui/idleVillage/hooks/useMapContext', () => ({
  useMapContext: () => mockUseMapContext(),
}));

vi.mock('@/ui/idleVillage/hooks/useCrewSchedulerAnalytics', () => ({
  useCrewSchedulerAnalytics: (...args: unknown[]) => mockUseCrewSchedulerAnalytics(...args),
}));

vi.mock('@/ui/idleVillage/hooks/useResidentRelationshipGraph', () => ({
  useResidentRelationshipGraph: (...args: unknown[]) => mockUseResidentRelationshipGraph(...args),
}));

const residentAlpha: ResidentState = {
  id: 'resident_alpha',
  displayName: 'Aurora',
  status: 'available',
  fatigue: 25,
  statTags: ['strength'],
  currentHp: 100,
  maxHp: 120,
  isHero: false,
  isInjured: false,
  survivalCount: 0,
  survivalScore: 0,
};

const residentBeta: ResidentState = {
  id: 'resident_beta',
  displayName: 'Bram',
  status: 'injured',
  fatigue: 60,
  statTags: ['agility'],
  currentHp: 70,
  maxHp: 110,
  isHero: false,
  isInjured: true,
  survivalCount: 0,
  survivalScore: 0,
};

const baseGraph: ResidentRelationshipGraphData = {
  nodes: [
    {
      id: residentAlpha.id,
      label: residentAlpha.displayName ?? residentAlpha.id,
      status: residentAlpha.status,
      fatigue: residentAlpha.fatigue,
      statTags: residentAlpha.statTags ?? [],
      activityCount: 3,
      questCount: 2,
      synergyScore: 0.8,
      portraitUrl: residentAlpha.portraitUrl,
      visualProfileId: residentAlpha.visualProfileId,
      homeId: residentAlpha.homeId,
    },
    {
      id: residentBeta.id,
      label: residentBeta.displayName ?? residentBeta.id,
      status: residentBeta.status,
      fatigue: residentBeta.fatigue,
      statTags: residentBeta.statTags ?? [],
      activityCount: 1,
      questCount: 0,
      synergyScore: 0.3,
      portraitUrl: residentBeta.portraitUrl,
      visualProfileId: residentBeta.visualProfileId,
      homeId: residentBeta.homeId,
    },
  ],
  edges: [
    {
      id: 'edge_alpha_beta',
      source: residentAlpha.id,
      target: residentBeta.id,
      weight: 0.65,
      contributions: [
        {
          type: 'shared_activity',
          label: 'Shared Activities',
          value: 0.6,
          weight: 0.6,
          metadata: { count: 3 },
        },
      ],
      sharedActivities: 3,
      sharedQuests: 1,
      sharedTags: [],
      fatigueDelta: 35,
    },
  ],
  metadata: {
    generatedAt: 1_700_000_000_000,
    configVersion: '1.0.0',
    totalResidents: 2,
    totalEdges: 1,
  },
  config: DEFAULT_RESIDENT_RELATIONSHIP_GRAPH_CONFIG,
};

const baseFilters = {
  includeStatuses: ['available', 'injured'],
  minActivityCount: 0,
  maxFatigue: 100,
};

const baseToggles = {
  sharedActivity: true,
  questBond: true,
  statTagOverlap: true,
  fatigueCompatibility: true,
  crewHistory: true,
};

function setupHookReturn(overrides: Partial<ReturnType<typeof mockUseResidentRelationshipGraph>> = {}) {
  const updateFilters = vi.fn();
  const setToggle = vi.fn();
  const exportAsJson = vi.fn(() => '{"graph":{}}');

  mockUseResidentRelationshipGraph.mockReturnValue({
    graph: baseGraph,
    isEmpty: false,
    filters: baseFilters,
    updateFilters,
    toggles: baseToggles,
    setToggle,
    exportAsJson,
    lastGeneratedAt: baseGraph.metadata.generatedAt,
    ...overrides,
  });

  return { updateFilters, setToggle, exportAsJson };
}

beforeEach(() => {
  mockUseMapContext.mockReturnValue({
    residentsById: {
      [residentAlpha.id]: residentAlpha,
      [residentBeta.id]: residentBeta,
    },
    villageState: {
      activities: {},
    },
    config: {
      activities: {},
      globalRules: { maxFatigueBeforeExhausted: 100 },
    },
  });

  mockUseCrewSchedulerAnalytics.mockReturnValue({
    history: [],
  });

  setupHookReturn();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ResidentRelationshipGraphTool', () => {
  it('renders core layout with snapshot metrics and filters', () => {
    render(<ResidentRelationshipGraphTool />);

    expect(screen.getByText('Idle Village – Analysis Tool')).toBeInTheDocument();
    expect(screen.getByText('Residents')).toBeInTheDocument();
    expect(screen.getByLabelText(/available/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Export JSON/i })).toBeInTheDocument();
  });

  it('updates filters when status checkbox toggled', () => {
    const { updateFilters } = setupHookReturn();
    render(<ResidentRelationshipGraphTool />);

    const checkbox = screen.getByLabelText(/available/i);
    fireEvent.click(checkbox);

    expect(updateFilters).toHaveBeenCalledWith({
      includeStatuses: ['injured'],
    });
  });

  it('invokes setToggle when relationship toggle changes', () => {
    const { setToggle } = setupHookReturn();
    render(<ResidentRelationshipGraphTool />);

    const toggle = screen.getByLabelText(/Shared Activities/i);
    fireEvent.click(toggle);

    expect(setToggle).toHaveBeenCalledWith('sharedActivity', false);
  });

  it('exports JSON using hook payload', () => {
    const { exportAsJson } = setupHookReturn();
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const anchorClickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => void 0);

    render(<ResidentRelationshipGraphTool />);
    fireEvent.click(screen.getByRole('button', { name: /Export JSON/i }));

    expect(exportAsJson).toHaveBeenCalledTimes(1);
    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(anchorClickSpy).toHaveBeenCalled();
    expect(revokeObjectURLSpy).toHaveBeenCalled();

    createObjectURLSpy.mockRestore();
    revokeObjectURLSpy.mockRestore();
    anchorClickSpy.mockRestore();
  });

  it('exports PNG through canvas pipeline', () => {
    setupHookReturn();
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const anchorClickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => void 0);
    const getContextSpy = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue({ drawImage: vi.fn() } as unknown as CanvasRenderingContext2D);
    const toBlobSpy = vi
      .spyOn(HTMLCanvasElement.prototype, 'toBlob')
      .mockImplementation((callback: BlobCallback) => {
        callback(new Blob(), 'image/png');
      });

    const OriginalImage = window.Image;
    class MockImage {
      onload: (() => void) | null = null;
      set src(_value: string) {
        this.onload?.();
      }
    }
    // @ts-expect-error - replace Image for test purposes
    window.Image = MockImage;

    render(<ResidentRelationshipGraphTool />);
    fireEvent.click(screen.getByRole('button', { name: /Export PNG/i }));

    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(getContextSpy).toHaveBeenCalled();
    expect(toBlobSpy).toHaveBeenCalled();
    expect(anchorClickSpy).toHaveBeenCalled();

    window.Image = OriginalImage;
    createObjectURLSpy.mockRestore();
    revokeObjectURLSpy.mockRestore();
    anchorClickSpy.mockRestore();
    getContextSpy.mockRestore();
    toBlobSpy.mockRestore();
  });
});
