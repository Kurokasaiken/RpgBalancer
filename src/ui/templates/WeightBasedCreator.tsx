import React, { useState, useCallback } from 'react';
import { GlassCard } from '../atoms/GlassCard';
import { GlassButton } from '../atoms/GlassButton';
import { EnhancedStatSlider } from '../spell/components/EnhancedStatSlider';
import { ActionsBar } from '../spell/components/ActionsBar';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { useWeightedBalance } from '../../shared/hooks/useWeightedBalance';
import { toast } from 'sonner';

// Generic interfaces for the creator
export interface StatDefinition {
    id: string;
    label: string;
    min: number;
    max: number;
    step: number;
    baseWeight: number;
    default: number;
    unit?: string;
    helpText?: string;
}

export interface CreatorProps<T> {
    // Configuration
    stats: StatDefinition[];
    initialState: T;

    // Identity Component (renders name, type, etc.)
    IdentityComponent: React.ComponentType<{
        data: T;
        updateField: (field: keyof T, value: any) => void;
        targetBudget: number;
        setTargetBudget: (value: number) => void;
    }>;

    // Preview Component
    PreviewComponent: React.ComponentType<{
        data: T;
        stats: Record<string, number>; // Calculated stats
    }>;

    // Logic
    calculateCost: (data: T, stats: Record<string, number>) => number;
    onSave: (data: T, stats: Record<string, number>) => void;

    // Storage keys
    storageKey: string;
}

export function WeightBasedCreator<T extends { id?: string }>({
    stats: statDefinitions,
    initialState,
    IdentityComponent,
    PreviewComponent,
    calculateCost,
    onSave,
    storageKey
}: CreatorProps<T>) {
    // State
    const [data, setData] = useState<T>(initialState);
    const [statValues, setStatValues] = useState<Record<string, number>>(() => {
        const initial: Record<string, number> = {};
        statDefinitions.forEach(stat => initial[stat.id] = stat.default);
        return initial;
    });
    const [targetBudget, setTargetBudget] = useState(100);
    const [statOrder, setStatOrder] = useState(statDefinitions.map(s => s.id));

    // Hooks
    const { balance } = useWeightedBalance({
        stats: statValues,
        definitions: statDefinitions,
        targetBudget
    });

    // Handlers
    const updateField = useCallback((field: keyof T, value: any) => {
        setData(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleStatChange = useCallback((statId: string, value: number) => {
        setStatValues(prev => ({ ...prev, [statId]: value }));
    }, []);

    const handleDragEnd = useCallback((result: DropResult) => {
        if (!result.destination) return;

        const newOrder = Array.from(statOrder);
        const [reorderedItem] = newOrder.splice(result.source.index, 1);
        newOrder.splice(result.destination.index, 0, reorderedItem);

        setStatOrder(newOrder);
    }, [statOrder]);

    const handleReset = useCallback(() => {
        setData(initialState);
        const initialStats: Record<string, number> = {};
        statDefinitions.forEach(stat => initialStats[stat.id] = stat.default);
        setStatValues(initialStats);
        setTargetBudget(100);
        toast.info('Creator reset to default');
    }, [initialState, statDefinitions]);

    const handleSave = useCallback(() => {
        onSave(data, statValues);
        toast.success('Creation saved successfully!');
    }, [data, statValues, onSave]);

    const handleSaveDefault = useCallback(() => {
        // Logic to save default configuration (could be extended)
        localStorage.setItem(`${storageKey}_default`, JSON.stringify({ data, statValues }));
        toast.success('Default configuration saved');
    }, [data, statValues, storageKey]);

    return (
        <div className="h-[calc(100vh-80px)] p-6 flex flex-col gap-6 max-w-[1920px] mx-auto">
            {/* Top Section: Identity & Preview */}
            <div className="grid grid-cols-12 gap-6 h-[280px] flex-shrink-0">
                <div className="col-span-4 h-full">
                    <IdentityComponent
                        data={data}
                        updateField={updateField}
                        targetBudget={targetBudget}
                        setTargetBudget={setTargetBudget}
                    />
                </div>
                <div className="col-span-8 h-full">
                    <PreviewComponent data={data} stats={statValues} />
                </div>
            </div>

            {/* Bottom Section: Stats & Actions */}
            <div className="flex-1 min-h-0 grid grid-cols-12 gap-6">
                {/* Stats List */}
                <div className="col-span-12 flex flex-col min-h-0">
                    <DragDropContext onDragEnd={handleDragEnd}>
                        <Droppable droppableId="stats-list" direction="horizontal">
                            {(provided) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className="flex gap-4 overflow-x-auto pb-4 px-2 min-h-0"
                                >
                                    {statOrder.map((statId, index) => {
                                        const statDef = statDefinitions.find(s => s.id === statId);
                                        if (!statDef) return null;

                                        return (
                                            <Draggable key={statId} draggableId={statId} index={index}>
                                                {(provided) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        className="w-[300px] flex-shrink-0"
                                                    >
                                                        <EnhancedStatSlider
                                                            stat={statDef}
                                                            value={statValues[statId]}
                                                            onChange={(val) => handleStatChange(statId, val)}
                                                            onDelete={() => { }} // Optional: allow disabling stats
                                                            isRemovable={false}
                                                        />
                                                    </div>
                                                )}
                                            </Draggable>
                                        );
                                    })}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="flex-shrink-0">
                <ActionsBar
                    onReset={handleReset}
                    onSave={handleSave}
                    onSaveDefault={handleSaveDefault}
                    balance={balance}
                />
            </div>
        </div>
    );
}
