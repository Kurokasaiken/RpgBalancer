import React from 'react';

export const TestingLab: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-900 p-8 flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-white mb-4">🧪 Testing Lab</h1>
                <p className="text-gray-400 mb-4">
                    This module is currently undergoing maintenance due to the engine migration.
                </p>
                <div className="p-4 bg-yellow-900/20 border border-yellow-700 rounded text-yellow-200">
                    ⚠ The previous Combat Engine has been removed. Testing tools need to be updated to use the new Idle Engine.
                </div>
            </div>
        </div>
    );
};
