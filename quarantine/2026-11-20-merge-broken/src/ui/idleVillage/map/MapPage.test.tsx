import { vi } from 'vitest';

// Mock dependencies for MapPage integration test
vi.mock('@/ui/styleLab/StyleLaboratoryPanel', () => ({
    StyleLaboratoryPanel: () => <div>Style Lab</div>,
}));

const mockUseMapContext = vi.fn();
vi.mock('@/ui/idleVillage/hooks/useMapContext', () => ({
    useMapContext: () => mockUseMapContext(),
}));

vi.mock('@/ui/idleVillage/components/DragContext', () => ({
    DragProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="drag-provider">{children}</div>,
    useDragContext: () => ({
        activeId: null,
        setActiveId: vi.fn(),
    }),
}));

import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ResourcePanel } from './components/ResourcePanel';
import DayNightActionCard from './actionCards/DayNightActionCard';
import MapPage from './MapPage';

const createBaseSandboxStateInternal = () => {
    const baseResidents = [
        {
            id: 'resident-1',
            displayName: 'Alia',
            currentHp: 90,
            maxHp: 100,
            fatigue: 12,
            status: 'available' as const,
            statTags: ['Hero'],
            statProfileId: 'tank_juggernaut',
            portraitUrl: '/portraits/alia.png',
        },
    ];

    const managedActivity = {
        id: 'job-1',
        label: 'Lavoro',
        tags: ['job'],
        durationFormula: '60',
        metadata: {},
        rewards: [{ resourceId: 'gold', amountFormula: '5' }],
    };

    const demoPanelState = {
        requirement: 'none' as const,
        requirementLabel: 'Nessun Requisito',
        requirementDescription: 'Tutti gli slot accettano qualsiasi residente.',
        slotViewModels: [],
        metrics: [],
        activityDefinition: {
            id: 'demo-activity',
            label: 'Demo Activity',
            description: 'Demo',
            tags: ['system'],
            slotTags: [],
            resolutionEngineId: 'demo',
            durationFormula: '60',
            metadata: {},
            rewards: [],
            maxSlots: 1,
        },
        preview: { rewards: [], injuryPercentage: 0, deathPercentage: 0 },
        hasAssignments: false,
        assignedResidentIds: [],
        elapsedSeconds: 0,
        progressFraction: 0,
    };

    return {
        activePreset: 'default',
        presets: [],
        setPreset: vi.fn(),
        randomizeTheme: vi.fn(),
        resetRandomization: vi.fn(),
        isRandomized: false,
        config: {
            globalRules: { maxFatigueBeforeExhausted: 100 },
            resources: {
                food: { label: 'Cibo' },
                gold: { label: 'Oro' },
            },
        },
        cycleProgressFraction: 0.5,
        cycleElapsedSeconds: 5,
        totalCycleSeconds: 10,
        cyclePhaseLabel: 'Fase giorno',
        cyclePhaseIcon: '☀️',
        isCyclePlaying: true,
        setIsCyclePlaying: vi.fn(),
        cycleVariant: 'solar',
        secondsPerTimeUnit: 1,
        dayTimeUnits: 5,
        nightTimeUnits: 5,
        cycleDayCount: 0,
        villageState: { resources: { food: 10, gold: 100 }, residents: { 'resident-1': baseResidents[0] } },
        residents: baseResidents,
        residentsById: { 'resident-1': baseResidents[0] },
        draggingResidentId: null,
        setActiveId: vi.fn(),
        managedActivities: [managedActivity],
        slotAssignments: { 'job-1': null },
        setSlotAssignments: vi.fn(),
        activityScheduler: {
            getActivityState: vi.fn().mockReturnValue(null),
            startActivity: vi.fn().mockReturnValue(true),
            cancelActivity: vi.fn(),
            canAssignResident: vi.fn().mockReturnValue(true),
        },
        assignmentFeedback: null,
        setAssignmentFeedback: vi.fn(),
        selectedResidentId: null,
        handleResidentSelect: vi.fn(),
        handleResidentDetailClose: vi.fn(),
        openDetailPanel: vi.fn(),
        closeDetailPanel: vi.fn(),
        detailContexts: [],
        detailPanelSlotIds: [],
        setDetailPanelSlotIds: vi.fn(),
        handleResetResidents: vi.fn(),
        handleResetSandboxState: vi.fn(),
        startSlotActivity: vi.fn(),
        handleCloseTheater: vi.fn(),
        locationSlots: [
            {
                slotId: 'location-slot-1',
                iconName: '🌲',
                label: 'Foresta',
                assignedWorkerId: null,
                activity: {
                    id: 'location-activity-1',
                    label: 'Guardia',
                    tags: ['job'],
                    durationFormula: '90',
                    metadata: {},
                    rewards: [],
                },
                visualVariant: 'azure',
            },
        ],
        locationDropState: 'idle',
        handleLocationInspect: vi.fn(),
        handleLocationDragIntent: vi.fn(),
        handleLocationResidentDragEnter: vi.fn(),
        handleLocationResidentDragLeave: vi.fn(),
        handleLocationResidentDrop: vi.fn(),
        openTheaterForSlot: vi.fn(),
        slotDropStates: {},
        handleWorkerDrop: vi.fn(),
        canSlotAcceptDrop: vi.fn(),
        theaterVerbs: [],
        theaterSlotCards: [],
        theaterJobCards: [],
        theaterPrimarySlot: null,
        demoPanelState,
        demoPanelHandlers: {
            setRequirement: vi.fn(),
            onSlotDrop: vi.fn(),
            onSlotClear: vi.fn(),
            onRemoveAll: vi.fn(),
            onStart: vi.fn(),
        },
        activeSlots: [],
        slots: [],
        isDayPhase: true,
        selectVillage: vi.fn(),
        getVillageSummaries: vi.fn(),
        transferResource: vi.fn(),
        getActiveVillageId: vi.fn(),
        getGlobalResources: vi.fn(),
        addVillage: vi.fn(),
        removeVillage: vi.fn(),
        createTradeRoute: vi.fn(),
        executeTradeRoute: vi.fn(),
        queueMigration: vi.fn(),
        processMigrationTick: vi.fn(),
        getTradeRoutes: vi.fn(),
        getMigrationQueue: vi.fn(),
        getLastTradeResult: vi.fn(),
        shellPresetOptions: [{ id: 'default', label: 'Default', description: 'Default preset' }],
        activeShellPresetId: 'default',
        setShellPresetId: vi.fn(),
    };
};

const createMockDataTransfer = (initial: Record<string, string> = {}): DataTransfer => {
    const store: Record<string, string> = { ...initial };
    return {
        dropEffect: 'none',
        effectAllowed: 'all',
        files: [] as unknown as FileList,
        items: [] as unknown as DataTransferItemList,
        types: Object.keys(store),
        setData: (type: string, value: string) => {
            store[type] = value;
        },
        getData: (type: string) => store[type] ?? '',
        clearData: (format?: string) => {
            if (format) {
                delete store[format];
                return;
            }
            Object.keys(store).forEach((key) => delete store[key]);
        },
        setDragImage: vi.fn(),
    } as unknown as DataTransfer;
};

describe('MapPage Test Suite', () => {
    beforeEach(() => {
        mockUseMapContext.mockReturnValue(createBaseSandboxStateInternal());
    });
    describe('DayNightActionCard', () => {
        const baseProps = {
            phaseIcon: <span aria-hidden>☀️</span>,
            isPlaying: true,
            progressFraction: 0.25,
            totalSeconds: 120,
            variant: 'solar' as const,
            onToggle: vi.fn(),
        };

        it('renders icon and countdown time', () => {
            render(<DayNightActionCard {...baseProps} />);

            expect(screen.getByText('☀️')).toBeInTheDocument();
            expect(screen.getByText('01:30')).toBeInTheDocument();
        });

        it('shows pause icon when paused', () => {
            render(<DayNightActionCard {...baseProps} isPlaying={false} />);
            expect(screen.getByTestId('day-night-pause-icon')).toBeInTheDocument();
        });

        it('calls onToggle when clicked', () => {
            const handleToggle = vi.fn();
            render(<DayNightActionCard {...baseProps} onToggle={handleToggle} />);

            fireEvent.click(screen.getByRole('button'));
            expect(handleToggle).toHaveBeenCalledTimes(1);
        });

        it('opens detail panel when clicking the job detail icon', () => {
            const baseState = createBaseSandboxStateInternal();
            const openDetailPanel = vi.fn();
            mockUseMapContext.mockReturnValue({
                ...baseState,
                openDetailPanel,
            });

            render(<MapPage />);

            fireEvent.click(screen.getByTestId('job-detail-trigger'));
            expect(openDetailPanel).toHaveBeenCalledWith('job-1');
        });
    });

    describe('ResourcePanel', () => {
        const defaultItems = [
            { label: 'Cibo', value: 10, accentClass: 'text-amber-200', borderClass: 'border-amber-300/40' },
            { label: 'Oro', value: 100, accentClass: 'text-yellow-200', borderClass: 'border-yellow-200/40' },
            { label: 'Giorno', value: 0, accentClass: 'text-cyan-200', borderClass: 'border-cyan-300/40' },
        ];

        it('should render correctly with items', () => {
            render(<ResourcePanel items={defaultItems} />);

            expect(screen.getByText('Resources')).toBeInTheDocument();

            const ciboTile = screen.getByTestId('resource-tile-cibo');
            expect(within(ciboTile).getByText('Cibo')).toBeInTheDocument();
            expect(within(ciboTile).getByText('10')).toBeInTheDocument();

            const oroTile = screen.getByTestId('resource-tile-oro');
            expect(within(oroTile).getByText('Oro')).toBeInTheDocument();
            expect(within(oroTile).getByText('100')).toBeInTheDocument();

            const giornoTile = screen.getByTestId('resource-tile-giorno');
            expect(within(giornoTile).getByText('Giorno')).toBeInTheDocument();
            expect(within(giornoTile).getByText('0')).toBeInTheDocument();
        });

        it('should handle empty items', () => {
            render(<ResourcePanel items={[]} />);
            expect(screen.getByText('Resources')).toBeInTheDocument();
            expect(screen.queryByText('Cibo')).not.toBeInTheDocument();
        });

        it('should handle string values', () => {
            const itemsWithString = [
                { label: 'Test', value: 'String Value', accentClass: 'text-red-200', borderClass: 'border-red-300/40' },
            ];
            render(<ResourcePanel items={itemsWithString} />);
            expect(screen.getByText('String Value')).toBeInTheDocument();
        });

        it('should apply accent and border classes', () => {
            render(<ResourcePanel items={defaultItems} />);
            const ciboP = screen.getByText('10');
            expect(ciboP).toHaveClass('text-amber-200');
            const ciboDiv = ciboP.closest('div');
            expect(ciboDiv).toHaveClass('border-amber-300/40');
        });
    });

    describe('JobActionCard interactions', () => {
        it('assigns resident when dropping onto the job card', () => {
            const baseState = createBaseSandboxStateInternal();
            const startActivity = vi.fn().mockReturnValue(true);
            const setAssignmentFeedback = vi.fn();
            baseState.activityScheduler.startActivity = startActivity;
            baseState.setAssignmentFeedback = setAssignmentFeedback;
            baseState.setSlotAssignments = vi.fn();
            mockUseMapContext.mockReturnValue(baseState);

            render(<MapPage />);

            const dropzone = screen.getByTestId('job-card-dropzone');
            const dataTransfer = createMockDataTransfer({
                'text/resident-id': 'resident-1',
                'text/plain': 'resident-1',
            });

            fireEvent.drop(dropzone, {
                dataTransfer,
                preventDefault: vi.fn(),
            });

            expect(startActivity).toHaveBeenCalledWith('job-1', 'resident-1', expect.any(Number));
            expect(setAssignmentFeedback).toHaveBeenCalledWith('Alia assegnato al job.');
        });

        it('shows error feedback when scheduler rejects the job start', () => {
            const baseState = createBaseSandboxStateInternal();
            const startActivity = vi.fn().mockReturnValue(false);
            const setAssignmentFeedback = vi.fn();
            baseState.activityScheduler.startActivity = startActivity;
            baseState.setAssignmentFeedback = setAssignmentFeedback;
            mockUseMapContext.mockReturnValue(baseState);

            render(<MapPage />);

            const dropzone = screen.getByTestId('job-card-dropzone');
            const dataTransfer = createMockDataTransfer({
                'text/resident-id': 'resident-1',
                'text/plain': 'resident-1',
            });

            fireEvent.drop(dropzone, {
                dataTransfer,
                preventDefault: vi.fn(),
            });

            expect(setAssignmentFeedback).toHaveBeenCalledWith('Impossibile avviare il job.');
        });
    });

    describe('Resident Detail', () => {
        it('renders resident detail card when a resident is selected', async () => {
            mockUseMapContext.mockReturnValue({
                ...createBaseSandboxStateInternal(),
                residentsById: {
                    'resident-1': {
                        id: 'resident-1',
                        displayName: 'Alia',
                        currentHp: 90,
                        maxHp: 100,
                        fatigue: 12,
                        status: 'available',
                        portraitUrl: '/portraits/alia.png',
                        isHero: false,
                        isInjured: false,
                        survivalCount: 0,
                        survivalScore: 0,
                    },
                },
            });

            render(<MapPage />);

            const firstPgCard = screen.getAllByTestId('pg-card')[0];
            fireEvent.pointerDown(firstPgCard, { pointerId: 1 });
            fireEvent.pointerUp(firstPgCard, { pointerId: 1 });

            await waitFor(() => {
                expect(screen.getAllByTestId('pg-detail-card').length).toBeGreaterThanOrEqual(1);
            });
        });
    });

    describe('Quest Risk Bands', () => {
        it('renders quest risk bands with correct heights based on danger rating', () => {
            const baseState = createBaseSandboxStateInternal();
            // Add quest activity with danger rating
            const questActivity = {
                id: 'quest-1',
                label: 'Epic Quest',
                tags: ['quest'],
                durationFormula: '120',
                metadata: {},
                rewards: [],
                dangerRating: 2, // Should result in 30% injury, 15% death
            };
            baseState.managedActivities = [
                ...baseState.managedActivities,
                questActivity,
            ];
            mockUseMapContext.mockReturnValue(baseState);

            render(<MapPage />);

            // Check that risk bands are rendered
            const riskBands = screen.getByTestId('quest-risk-bands');
            expect(riskBands).toBeInTheDocument();

            // Check injury band height: Math.min(100, 2 * 15) = 30%
            const injuryBand = screen.getByTestId('quest-risk-injury-band');
            expect(injuryBand).toHaveStyle({ height: '30%' });

            // Check death band height: Math.round(2 * 15 / 2) = 15%
            const deathBand = screen.getByTestId('quest-risk-death-band');
            expect(deathBand).toHaveStyle({ height: '15%' });
        });

        it('renders zero height risk bands when quest activity has no danger rating', () => {
            const baseState = createBaseSandboxStateInternal();
            // Add quest activity without danger rating
            const questActivity = {
                id: 'quest-1',
                label: 'Safe Quest',
                tags: ['quest'],
                durationFormula: '120',
                metadata: {},
                rewards: [],
                // No dangerRating, should default to 1
            };
            baseState.managedActivities = [
                ...baseState.managedActivities,
                questActivity,
            ];
            mockUseMapContext.mockReturnValue(baseState);

            render(<MapPage />);

            // Check injury band height: Math.min(100, 1 * 15) = 15%
            const injuryBand = screen.getByTestId('quest-risk-injury-band');
            expect(injuryBand).toHaveStyle({ height: '15%' });

            // Check death band height: Math.round(1 * 15 / 2) = 8%
            const deathBand = screen.getByTestId('quest-risk-death-band');
            expect(deathBand).toHaveStyle({ height: '8%' });
        });

        it('does not render risk bands when no quest activity exists', () => {
            const baseState = createBaseSandboxStateInternal();
            // Remove quest activity
            baseState.managedActivities = baseState.managedActivities.filter(
                activity => !activity.tags?.includes('quest')
            );
            mockUseMapContext.mockReturnValue(baseState);

            render(<MapPage />);

            // Check that risk bands are not rendered
            expect(screen.queryByTestId('quest-risk-bands')).not.toBeInTheDocument();
            expect(screen.queryByTestId('quest-risk-injury-band')).not.toBeInTheDocument();
            expect(screen.queryByTestId('quest-risk-death-band')).not.toBeInTheDocument();
        });
    });

    describe('MapPage Integration', () => {
        it('should render MapPage with all components', () => {
            render(<MapPage />);

            expect(screen.getByText('Style Lab')).toBeInTheDocument();
            expect(screen.getByText('Risorse')).toBeInTheDocument();
            const ciboTile = screen.getByTestId('resource-tile-cibo');
            expect(within(ciboTile).getByText('Cibo')).toBeInTheDocument();
            expect(within(ciboTile).getByText('10')).toBeInTheDocument();
            const oroTile = screen.getByTestId('resource-tile-oro');
            expect(within(oroTile).getByText('Oro')).toBeInTheDocument();
            expect(within(oroTile).getByText('100')).toBeInTheDocument();
            const giornoTile = screen.getByTestId('resource-tile-giorno');
            expect(within(giornoTile).getByText('Giorno')).toBeInTheDocument();
            expect(within(giornoTile).getByText('0')).toBeInTheDocument();
            // Check for PgCard content specifically
            expect(screen.getByTestId('pg-card')).toBeInTheDocument();
            expect(screen.getByText('☀️')).toBeInTheDocument();
        });
    });
});
