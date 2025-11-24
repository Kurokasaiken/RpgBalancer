import React from 'react';
import { Entity } from '../../engine/core/entity';

interface EntityEditorProps {
    entities: Entity[];
    onSave: (entity: Entity) => void;
    onDelete: (id: string) => void;
}

export const EntityEditor: React.FC<EntityEditorProps> = ({ entities, onSave, onDelete }) => {
    return (
        <div className="p-4 bg-gray-800 rounded-lg">
            <h2 className="text-xl font-bold text-white mb-4">Entity Editor</h2>
            <p className="text-gray-400">Editor functionality coming soon...</p>
            <div className="mt-4">
                <h3 className="text-lg font-semibold text-white mb-2">Current Entities: {entities.length}</h3>
                <ul className="space-y-2">
                    {entities.map(entity => (
                        <li key={entity.id} className="text-gray-300 bg-gray-700 p-2 rounded flex justify-between items-center">
                            <span>{entity.name}</span>
                            <button
                                onClick={() => onDelete(entity.id)}
                                className="text-red-400 hover:text-red-300"
                            >
                                Delete
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};
