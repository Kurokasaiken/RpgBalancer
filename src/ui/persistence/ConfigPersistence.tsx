/**
 * ConfigPersistence Component
 * UI for saving, loading, and managing balance configurations.
 */

import React, { useState } from 'react';
import { ConfigManager } from '../../balancing/persistence/ConfigManager';
import type { BalanceConfig } from '../../balancing/persistence/balanceConfig';
import { CardWrapper } from '../components/CardWrapper';

export function ConfigPersistence() {
    const [currentConfig, setCurrentConfig] = useState<BalanceConfig | null>(null);
    const [saveDescription, setSaveDescription] = useState('');

    const handleSave = () => {
        if (!currentConfig) return;
        ConfigManager.saveCurrentConfig(currentConfig, saveDescription || undefined);
        setSaveDescription('');
        alert('Configuration saved successfully!');
    };

    const handleLoad = () => {
        const config = ConfigManager.loadConfig();
        setCurrentConfig(config);
        alert('Configuration loaded!');
    };

    const handleExport = () => {
        ConfigManager.downloadConfigAsJSON(currentConfig || undefined);
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const success = await ConfigManager.uploadConfigFromFile(file);
        if (success) {
            const config = ConfigManager.loadConfig();
            setCurrentConfig(config);
            alert('Configuration imported successfully!');
        } else {
            alert('Failed to import configuration');
        }

        // Reset file input
        e.target.value = '';
    };

    const handleClear = () => {
        if (confirm('Are you sure you want to clear all saved configurations?')) {
            ConfigManager.clearAll();
            setCurrentConfig(null);
            alert('All configurations cleared');
        }
    };

    return (
        <CardWrapper title="⚙️ Balance Configuration Manager">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                        onClick={handleSave}
                        className="btn-primary"
                        disabled={!currentConfig}
                        title="Save current configuration"
                    >
                        💾 Save Current
                    </button>

                    <button
                        onClick={handleLoad}
                        className="btn-secondary"
                        title="Load configuration"
                    >
                        📂 Load
                    </button>

                    <button
                        onClick={handleExport}
                        className="btn-secondary"
                        title="Export configuration as JSON"
                    >
                        📤 Export JSON
                    </button>

                    <label className="btn-secondary" style={{ cursor: 'pointer' }}>
                        📥 Import JSON
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleImport}
                            style={{ display: 'none' }}
                        />
                    </label>

                    <button
                        onClick={handleClear}
                        className="btn-danger"
                        title="Clear all saved configurations"
                    >
                        🗑️ Clear All
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label htmlFor="save-description">
                        Description (optional):
                    </label>
                    <input
                        id="save-description"
                        type="text"
                        value={saveDescription}
                        onChange={(e) => setSaveDescription(e.target.value)}
                        placeholder="e.g., Increased damage weights"
                        style={{
                            padding: '0.5rem',
                            borderRadius: '4px',
                            border: '1px solid rgba(255,255,255,0.2)',
                            background: 'rgba(0,0,0,0.2)',
                            color: 'white'
                        }}
                    />
                </div>

                {currentConfig && (
                    <div style={{
                        padding: '1rem',
                        background: 'rgba(0,0,0,0.3)',
                        borderRadius: '8px',
                        fontSize: '0.9rem'
                    }}>
                        <h4 style={{ margin: '0 0 0.5rem 0' }}>Current Configuration</h4>
                        <p><strong>Name:</strong> {currentConfig.metadata.name}</p>
                        <p><strong>Version:</strong> {currentConfig.version}</p>
                        {currentConfig.metadata.description && (
                            <p><strong>Description:</strong> {currentConfig.metadata.description}</p>
                        )}
                        <p><strong>Modified:</strong> {new Date(currentConfig.metadata.modifiedAt).toLocaleString()}</p>
                    </div>
                )}
            </div>
        </CardWrapper>
    );
}
