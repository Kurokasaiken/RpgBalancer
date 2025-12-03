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
import { ArchetypeBuilder } from './ArchetypeBuilder';
import { ArchetypeDetail } from './ArchetypeDetail';
import {
    gildedPageBg,
    gildedSurface,
    gildedCard,
    gildedLabel,
    gildedDivider
} from './gildedTheme';

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

    const actionButton =
        'rounded-2xl border border-[#3b4b4d] px-4 py-2 text-sm font-semibold text-[#f0efe4] hover:border-[#c9a227]/60 hover:text-[#c9a227] transition-colors';

    const subtleButton =
        'rounded-2xl border border-transparent px-4 py-2 text-sm text-[#aeb8b4] hover:text-[#f0efe4] hover:border-[#3b4b4d] transition-colors';

    // Render based on view mode
    switch (viewMode) {
        case 'builder':
            return (
                <div className={`${gildedPageBg} min-h-screen`}>
                    <div className="max-w-6xl mx-auto py-6">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`${subtleButton} inline-flex items-center gap-2`}
                        >
                            ← Torna alla lista
                        </button>
                        <div className="mt-6">
                            <ArchetypeBuilder />
                        </div>
                    </div>
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
                <div className={`${gildedPageBg} min-h-screen`}>
                    <div className="max-w-4xl mx-auto py-10">
                        <div className={`${gildedSurface} text-center space-y-4`}>
                            <p className="text-[#f6f3e4] text-lg">Archetipo non trovato</p>
                            <button onClick={() => setViewMode('list')} className={actionButton}>
                                Torna alla lista
                            </button>
                        </div>
                    </div>
                </div>
            );

        case 'list':
        default:
            return (
                <div className={`${gildedPageBg} min-h-screen`}>
                    <div className="max-w-6xl mx-auto space-y-8">
                        <header className={`${gildedSurface} flex flex-col gap-6 md:flex-row md:items-center md:justify-between`}>
                            <div>
                                <p className={gildedLabel}>Archetype Registry</p>
                                <h1 className="text-4xl font-display text-[#f6f3e4] mt-3">Archetype Manager</h1>
                                <p className="text-sm text-[#aeb8b4] mt-2">
                                    {registry.count} archetipi caricati · CRUD completo + export JSON
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <button onClick={() => setViewMode('builder')} className={`${actionButton} bg-[#c9a227]/10`}>
                                    + Nuovo Archetipo
                                </button>
                                <button onClick={handleExportAll} className={actionButton}>
                                    Export JSON
                                </button>
                                <label className={`${actionButton} cursor-pointer`}>Import
                                    <input
                                        type="file"
                                        accept=".json"
                                        onChange={handleImport}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                        </header>

                        <div className={`${gildedCard} text-sm text-[#aeb8b4]`}>Seleziona un archetipo per aprire il dettaglio.</div>

                        <div className="space-y-5">
                            {registry.listAll().map(archetype => (
                                <div
                                    key={archetype.id}
                                    className={`${gildedCard} cursor-pointer transition-all hover:border-[#c9a227]/40`}
                                    onClick={() => handleViewArchetype(archetype)}
                                >
                                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-2xl font-display text-[#f6f3e4]">{archetype.name}</h3>
                                                <span className="rounded-full border border-[#475758] bg-[#0e1719]/70 px-3 py-1 text-xs uppercase tracking-widest text-[#8db3a5]">
                                                    {archetype.categoryId}
                                                </span>
                                            </div>
                                            <p className="text-sm text-[#aeb8b4] max-w-2xl">{archetype.description}</p>
                                        </div>
                                        <button className={subtleButton} onClick={(e) => {
                                            e.stopPropagation();
                                            handleViewArchetype(archetype);
                                        }}>
                                            Apri scheda →
                                        </button>
                                    </div>
                                    <div className={`${gildedDivider} mt-5`} />
                                    <div className="mt-4 flex flex-wrap gap-4 text-xs text-[#8db3a5]">
                                        <span>Budget: {archetype.minBudget}–{archetype.maxBudget} HP</span>
                                        <span>Versione: {archetype.version}</span>
                                        <span>Tags: {archetype.tags?.slice(0, 3).join(', ') || 'n/a'}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );
    }
}
;
