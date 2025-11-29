/**
 * Archetype Builder UI Component
 * 
 * Allows users to create and edit archetypes with a visual stat editor.
 * 
 * Features:
 * - Stat sliders for all stats
 * - Real-time validation
 * - Save/load from IO
 * - Cost model integration
 * 
 * TODO: Full implementation with UI components
 */

import React, { useState } from 'react';
import type { Archetype } from '../../../balancing/1v1/types';
import { BASELINE_STATS } from '../../../balancing/baseline';
import { saveArchetype } from '../../../balancing/1v1/io';

interface ArchetypeBuilderProps {
    initialArchetype?: Archetype;
    onSave?: (arche: Archetype) => void;
}

export const ArchetypeBuilder: React.FC<ArchetypeBuilderProps> = ({
    initialArchetype,
    onSave,
}) => {
    const [archetype, setArchetype] = useState<Archetype>(
        initialArchetype || {
            id: `archetype-${Date.now()}`,
            name: 'New Archetype',
            role: 'Unknown',
            description: '',
            stats: { ...BASELINE_STATS },
            meta: {
                createdBy: 'user',
                createdAt: new Date().toISOString(),
            },
        }
    );

    const handleSave = async () => {
        await saveArchetype(archetype);
        onSave?.(archetype);
    };

    return (
        <div className="archetype-builder">
            <h2>Archetype Builder</h2>

            {/* TODO: Implement full UI with:
                - Name/Role/Description inputs
                - Stat sliders for all stats
                - Cost model display
                - Save/Load buttons
                - Validation feedback
            */}

            <div>
                <label>Name: </label>
                <input
                    value={archetype.name}
                    onChange={(e) => setArchetype({ ...archetype, name: e.target.value })}
                />
            </div>

            <div>
                <label>Role: </label>
                <input
                    value={archetype.role}
                    onChange={(e) => setArchetype({ ...archetype, role: e.target.value })}
                />
            </div>

            <button onClick={handleSave}>Save Archetype</button>

            <p>TODO: Add stat sliders and full UI implementation</p>
        </div>
    );
};
