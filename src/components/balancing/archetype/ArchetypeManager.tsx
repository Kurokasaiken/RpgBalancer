/**
 * ArchetypeManager Component
 * 
 * Main entry point for archetype management:
 * - List view
 * - Detail view  
 * - Builder (create/edit)
 * - Import/Export
 */

import React, { useState } from 'react';
import { ArchetypeRegistry } from '../../../balancing/archetype/ArchetypeRegistry';
import { DEFAULT_ARCHETYPES } from '../../../balancing/archetype/constants';
import type { ArchetypeTemplate } from '../../../balancing/archetype/types';
import { ArchetypeList } from './ArchetypeList';
import { ArchetypeBuilder } from './ArchetypeBuilder';
import { ArchetypeDetail } from './ArchetypeDetail';
import { GlassButton } from '../../../ui/atoms/GlassButton';
import { GlassCard } from '../../../ui/atoms/GlassCard';

type ViewMode = 'list' | 'builder' | 'detail';

export const ArchetypeManager: React.FC = () => {
    const [registry] = useState(() => new ArchetypeRegistry(DEFAULT_ARCHETYPES));
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [selectedArchetype, setSelectedArchetype] = useState<ArchetypeTemplate | null>(null);

    const handleViewArchetype = (archetype: ArchetypeTemplate) => {
        setSelectedArchetype(archetype);
        setViewMode('detail');
    };

    const handleEditArchetype = () => {
        if (!selectedArchetype) return;
        // TODO: Load archetype into builder for editing
        setViewMode('builder');
    };

    const handleCloneArchetype = () => {
        if (!selectedArchetype) return;
        // TODO: Clone archetype and open in builder
        setViewMode('builder');
    };

    const handleDeleteArchetype = () => {
        if (!selectedArchetype) return;
        if (confirm(`Delete archetype "${selectedArchetype.name}"?`)) {
            registry.delete(selectedArchetype.id);
            setViewMode('list');
            setSelectedArchetype(null);
        }
    };

    const handleExportAll = () => {
        const json = registry.toJSON();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'archetypes.json';
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedRegistry = ArchetypeRegistry.fromJSON(e.target?.result as string);
                // TODO: Merge with existing registry
                alert(`Imported ${importedRegistry.count} archetypes`);
            } catch (error) {
                alert('Failed to import archetypes');
            }
        };
        reader.readAsText(file);
    };

    // Render based on view mode
    switch (viewMode) {
        case 'builder':
            return (
                <div>
                    <div className="p-6">
                        <GlassButton onClick={() => setViewMode('list')} variant="ghost">
                            ← Back to List
                        </GlassButton>
                    </div>
                    <ArchetypeBuilder />
                </div>
            );

        case 'detail':
            return selectedArchetype ? (
                <ArchetypeDetail
                    archetype={selectedArchetype}
                    onEdit={handleEditArchetype}
                    onClone={handleCloneArchetype}
                    onDelete={handleDeleteArchetype}
                    onClose={() => setViewMode('list')}
                />
            ) : (
                <div className="p-6">
                    <GlassCard>
                        <p>Archetype not found</p>
                        <GlassButton onClick={() => setViewMode('list')}>
                            Back to List
                        </GlassButton>
                    </GlassCard>
                </div>
            );

        case 'list':
        default:
            return (
                <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 p-6">
                    <div className="max-w-7xl mx-auto">
                        <GlassCard variant="neon" className="mb-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h1 className="text-3xl font-bold text-cyan-100 mb-2">Archetype Manager</h1>
                                    <p className="text-gray-400">{registry.count} archetypes loaded</p>
                                </div>

                                <div className="flex gap-3">
                                    <GlassButton onClick={() => setViewMode('builder')} variant="primary">
                                        + Create New
                                    </GlassButton>
                                    <GlassButton onClick={handleExportAll} variant="secondary">
                                        Export All
                                    </GlassButton>
                                    <label>
                                        <GlassButton variant="secondary" as="span">
                                            Import
                                        </GlassButton>
                                        <input
                                            type="file"
                                            accept=".json"
                                            onChange={handleImport}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                            </div>
                        </GlassCard>

                        {/* Pass handleViewArchetype to ArchetypeList */}
                        <div className="space-y-6">
                            {registry.listAll().map(archetype => (
                                <GlassCard
                                    key={archetype.id}
                                    interactive
                                    onClick={() => handleViewArchetype(archetype)}
                                    className="cursor-pointer hover:border-cyan-500/30"
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-xl font-bold text-cyan-100">{archetype.name}</h3>
                                                <span className="px-2 py-1 rounded text-xs font-medium bg-cyan-500/20 text-cyan-400">
                                                    {archetype.category}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-400">{archetype.description}</p>
                                        </div>
                                        <GlassButton
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleViewArchetype(archetype);
                                            }}
                                            variant="ghost"
                                            size="sm"
                                        >
                                            View →
                                        </GlassButton>
                                    </div>
                                </GlassCard>
                            ))}
                        </div>
                    </div>
                </div>
            );
    }
};
