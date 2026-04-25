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

import React, { useId, useState } from 'react';
import type { Archetype } from '../../../balancing/1v1/types';
import { BASELINE_STATS } from '../../../balancing/baseline';
import { saveArchetype } from '../../../balancing/1v1/io';

interface ArchetypeBuilderProps {
    initialArchetype?: Archetype;
    onSave?: (arche: Archetype) => void;
}

const createDefaultArchetype = (idSuffix: string): Archetype => ({
    id: `archetype-${idSuffix}`,
    name: 'New Archetype',
    role: 'Unknown',
    description: '',
    stats: { ...BASELINE_STATS },
    meta: {
        createdBy: 'user',
        createdAt: 'draft',
    },
});

export const ArchetypeBuilder: React.FC<ArchetypeBuilderProps> = ({
    initialArchetype,
    onSave,
}) => {
    const generatedId = useId().replace(/:/g, '-');
    const [archetype, setArchetype] = useState<Archetype>(
        initialArchetype ?? createDefaultArchetype(generatedId)
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
