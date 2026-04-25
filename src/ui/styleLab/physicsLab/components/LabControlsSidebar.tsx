/**
 * Lab Controls Sidebar Component
 *
 * Sidebar with tabbed interface for Physics Lab controls.
 * Provides import/export functionality and preset management.
 */

import React, { useState } from 'react';
import { LabPanel } from './LabPanel';
import { type PhysicsPreset } from '@/ui/styleLab/config/physicsPresets';

export interface LabControlsSidebarProps {
  /** Current physics preset configuration */
  config: PhysicsPreset;
  /** Callback when preset is updated */
  onUpdateConfig: (updates: Partial<PhysicsPreset>) => void;
  /** Available preset IDs for selection */
  availablePresets: string[];
  /** Callback to apply a preset */
  onApplyPreset: (presetId: string) => void;
  /** Optional className for styling */
  className?: string;
}

/**
 * Sidebar component containing LabPanel and additional controls.
 * Provides comprehensive interface for Physics Lab management.
 */
export const LabControlsSidebar: React.FC<LabControlsSidebarProps> = ({
  config,
  onUpdateConfig,
  availablePresets,
  onApplyPreset,
  className = '',
}) => {
  const [importData, setImportData] = useState('');
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importError, setImportError] = useState('');

  const handleImport = () => {
    try {
      const parsed = JSON.parse(importData);
      // TODO: Validate with Zod schema
      onUpdateConfig(parsed);
      setImportData('');
      setShowImportDialog(false);
      setImportError('');
    } catch (_error) {
      setImportError('Invalid JSON format');
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(config, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `physics-preset-${config.id}-${Date.now()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(config, null, 2));
  };

  return (
    <div className={`lab-controls-sidebar ${className}`} style={{
      width: '340px',
      height: '100%',
      backgroundColor: '#1a2620',
      border: '1px solid #44c470',
      borderRadius: '4px',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Lab Panel */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <LabPanel
          config={config}
          onUpdateConfig={onUpdateConfig}
          availablePresets={availablePresets}
          onApplyPreset={onApplyPreset}
        />
      </div>

      {/* Import/Export Controls */}
      <div style={{
        borderTop: '1px solid #44c470',
        padding: '16px',
        backgroundColor: '#141d18',
      }}>
        <h4 style={{
          color: '#faeaaa',
          fontSize: '12px',
          fontWeight: 'bold',
          marginBottom: '12px',
          fontFamily: '"Cinzel", serif',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
        }}>
          Import/Export
        </h4>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <button
            onClick={handleExport}
            style={{
              flex: 1,
              padding: '8px 12px',
              backgroundColor: '#786000',
              color: '#03040a',
              border: '1px solid #c8a030',
              borderRadius: '2px',
              fontSize: '10px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontFamily: '"Cinzel", serif',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            📤 Export
          </button>
          
          <button
            onClick={handleCopyToClipboard}
            style={{
              flex: 1,
              padding: '8px 12px',
              backgroundColor: '#786000',
              color: '#03040a',
              border: '1px solid #c8a030',
              borderRadius: '2px',
              fontSize: '10px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontFamily: '"Cinzel", serif',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            📋 Copy
          </button>
        </div>

        <button
          onClick={() => setShowImportDialog(true)}
          style={{
            width: '100%',
            padding: '8px 12px',
            backgroundColor: '#0b0f0e',
            color: '#f5edd8',
            border: '1px solid #44c470',
            borderRadius: '2px',
            fontSize: '10px',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontFamily: '"Cinzel", serif',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          📥 Import Preset
        </button>
      </div>

      {/* Import Dialog */}
      {showImportDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: '#1a2620',
            border: '1px solid #44c470',
            borderRadius: '4px',
            padding: '20px',
            width: '400px',
            maxWidth: '90%',
          }}>
            <h3 style={{
              color: '#faeaaa',
              fontSize: '14px',
              marginBottom: '16px',
              fontFamily: '"Cinzel", serif',
            }}>
              Import Physics Preset
            </h3>

            <textarea
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              placeholder="Paste JSON preset data here..."
              style={{
                width: '100%',
                height: '120px',
                backgroundColor: '#0f1512',
                border: '1px solid #44c470',
                borderRadius: '2px',
                color: '#f5edd8',
                fontFamily: 'monospace',
                fontSize: '12px',
                padding: '8px',
                resize: 'vertical',
                marginBottom: '12px',
              }}
            />

            {importError && (
              <div style={{
                color: '#e04040',
                fontSize: '12px',
                marginBottom: '12px',
              }}>
                {importError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleImport}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  backgroundColor: '#786000',
                  color: '#03040a',
                  border: '1px solid #c8a030',
                  borderRadius: '2px',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                Import
              </button>
              
              <button
                onClick={() => {
                  setShowImportDialog(false);
                  setImportData('');
                  setImportError('');
                }}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  backgroundColor: '#0b0f0e',
                  color: '#f5edd8',
                  border: '1px solid #44c470',
                  borderRadius: '2px',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
