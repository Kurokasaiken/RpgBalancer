/**
 * ArchetypeList Component
 * 
 * Grid/list view of saved archetypes with filtering
 */

import React, { useState } from 'react';
import { ArchetypeRegistry } from '../../../balancing/archetype/ArchetypeRegistry';
import { DEFAULT_ARCHETYPES } from '../../../balancing/archetype/constants';
import type { ArchetypeTemplate, ArchetypeCategory } from '../../../balancing/archetype/types';

type ViewMode = 'grid' | 'list';

export const ArchetypeList: React.FC = () => {
    const [registry] = useState(() => new ArchetypeRegistry(DEFAULT_ARCHETYPES));
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<ArchetypeCategory | 'All'>('All');

    // Get filtered archetypes
    const archetypes = React.useMemo(() => {
        let filtered = registry.listAll();

        // Filter by category
        if (categoryFilter !== 'All') {
            filtered = registry.filterByCategory(categoryFilter);
        }

        // Filter by search query
        if (searchQuery) {
            filtered = filtered.filter(a =>
                a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                a.description.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        return filtered;
    }, [registry, categoryFilter, searchQuery]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-lg p-6 mb-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-cyan-100 mb-2">Archetypes</h1>
                            <p className="text-gray-400">{archetypes.length} archetypes available</p>
                        </div>

                        {/* View Toggle */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`px-4 py-2 rounded transition-colors ${viewMode === 'grid'
                                        ? 'bg-cyan-500 text-white'
                                        : 'bg-black/20 text-gray-400 hover:bg-black/40'
                                    }`}
                            >
                                Grid
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`px-4 py-2 rounded transition-colors ${viewMode === 'list'
                                        ? 'bg-cyan-500 text-white'
                                        : 'bg-black/20 text-gray-400 hover:bg-black/40'
                                    }`}
                            >
                                List
                            </button>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            type="text"
                            placeholder="Search archetypes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-black/20 border border-cyan-500/30 rounded px-4 py-2 text-cyan-50 placeholder-gray-500 focus:outline-none focus:border-cyan-400"
                        />

                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value as any)}
                            className="bg-black/20 border border-cyan-500/30 rounded px-4 py-2 text-cyan-50 focus:outline-none focus:border-cyan-400"
                        >
                            <option value="All">All Categories</option>
                            <option value="Tank">Tank</option>
                            <option value="DPS">DPS</option>
                            <option value="Assassin">Assassin</option>
                            <option value="Bruiser">Bruiser</option>
                            <option value="Support">Support</option>
                            <option value="Hybrid">Hybrid</option>
                        </select>
                    </div>
                </div>

                {/* Archetype Grid/List */}
                {archetypes.length === 0 ? (
                    <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-lg p-12 text-center">
                        <div className="text-6xl mb-4">🔍</div>
                        <h3 className="text-xl font-bold text-gray-400 mb-2">No archetypes found</h3>
                        <p className="text-gray-500">Try adjusting your search filters</p>
                    </div>
                ) : (
                    <div className={viewMode === 'grid'
                        ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                        : 'space-y-4'
                    }>
                        {archetypes.map(archetype => (
                            <ArchetypeCard
                                key={archetype.id}
                                archetype={archetype}
                                viewMode={viewMode}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// ArchetypeCard sub-component
interface ArchetypeCardProps {
    archetype: ArchetypeTemplate;
    viewMode: ViewMode;
}

const ArchetypeCard: React.FC<ArchetypeCardProps> = ({ archetype, viewMode }) => {
    const categoryColors: Record<ArchetypeCategory, string> = {
        Tank: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        DPS: 'bg-red-500/20 text-red-400 border-red-500/30',
        Assassin: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
        Bruiser: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        Support: 'bg-green-500/20 text-green-400 border-green-500/30',
        Hybrid: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    };

    // Top 3 allocated stats
    const topStats = Object.entries(archetype.allocation)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3);

    if (viewMode === 'list') {
        return (
            <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-lg p-4 hover:border-cyan-500/30 transition-colors">
                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-bold text-cyan-100">{archetype.name}</h3>
                            <span className={`px-2 py-1 rounded text-xs font-medium border ${categoryColors[archetype.category]}`}>
                                {archetype.category}
                            </span>
                        </div>
                        <p className="text-sm text-gray-400">{archetype.description}</p>
                    </div>
                    <div className="flex gap-2">
                        <button className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded hover:bg-cyan-500/30 transition-colors text-sm">
                            View
                        </button>
                        <button className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded hover:bg-purple-500/30 transition-colors text-sm">
                            Clone
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Grid view
    return (
        <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-lg p-6 hover:border-cyan-500/30 transition-colors">
            <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-bold text-cyan-100">{archetype.name}</h3>
                <span className={`px-2 py-1 rounded text-xs font-medium border ${categoryColors[archetype.category]}`}>
                    {archetype.category}
                </span>
            </div>

            <p className="text-sm text-gray-400 mb-4 h-12 overflow-hidden">
                {archetype.description}
            </p>

            <div className="space-y-2 mb-4">
                <div className="text-xs font-bold uppercase tracking-wider text-gray-500">Top Stats</div>
                {topStats.map(([stat, value]) => (
                    <div key={stat} className="flex justify-between items-center text-sm">
                        <span className="text-gray-300 capitalize">{stat}</span>
                        <span className="font-mono text-cyan-400">{value}%</span>
                    </div>
                ))}
            </div>

            <div className="flex gap-2">
                <button className="flex-1 px-3 py-2 bg-cyan-500/20 text-cyan-400 rounded hover:bg-cyan-500/30 transition-colors text-sm font-medium">
                    View
                </button>
                <button className="flex-1 px-3 py-2 bg-purple-500/20 text-purple-400 rounded hover:bg-purple-500/30 transition-colors text-sm font-medium">
                    Clone
                </button>
            </div>
        </div>
    );
};
