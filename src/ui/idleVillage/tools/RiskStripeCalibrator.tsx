import React, { useState, useCallback, useMemo } from 'react';
import { Save, Download, Upload, RotateCcw, RotateCw, Settings, BarChart3, Palette, Sliders } from 'lucide-react';
import { useRiskCalibration } from '@/ui/idleVillage/hooks/useRiskCalibration';
import type { RiskCalibrationPreset, RiskSmoothingCurve } from '@/ui/idleVillage/config/riskCalibrationConfig';
import { createSandboxDiagnostics } from '@/ui/idleVillage/utils/sandboxDiagnostics';

/**
 * Risk Stripe Calibration Tool
 * Interactive tool for calibrating risk stripes with configurable curves and export functionality
 */

interface CalibrationControlsProps {
  preset: RiskCalibrationPreset;
  onUpdate: (updates: Partial<RiskCalibrationPreset>) => void;
}

/**
 * Smoothing curve controls
 */
function SmoothingCurveControls({ preset, onUpdate }: CalibrationControlsProps) {
  const handleCurveChange = (field: keyof RiskSmoothingCurve, value: any) => {
    onUpdate({
      smoothingCurve: {
        ...preset.smoothingCurve,
        [field]: value,
      },
    });
  };

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
        <Sliders className="w-4 h-4" />
        Smoothing Curve
      </h4>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Curve Type</label>
          <select
            value={preset.smoothingCurve.type}
            onChange={(e) => handleCurveChange('type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="linear">Linear</option>
            <option value="ease-in">Ease In</option>
            <option value="ease-out">Ease Out</option>
            <option value="ease-in-out">Ease In Out</option>
            <option value="cubic-bezier">Cubic Bezier</option>
          </select>
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Factor</label>
          <input
            type="number"
            min="0"
            max="2"
            step="0.1"
            value={preset.smoothingCurve.factor}
            onChange={(e) => handleCurveChange('factor', parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Threshold</label>
        <input
          type="number"
          min="0"
          max="1"
          step="0.01"
          value={preset.smoothingCurve.threshold}
          onChange={(e) => handleCurveChange('threshold', parseFloat(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      {preset.smoothingCurve.type === 'cubic-bezier' && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Custom Bezier</label>
          <input
            type="text"
            value={preset.smoothingCurve.customBezier || ''}
            onChange={(e) => handleCurveChange('customBezier', e.target.value)}
            placeholder="0.25, 0.1, 0.25, 1"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}
    </div>
  );
}

/**
 * KPI target controls
 */
function KPITargetControls({ preset, onUpdate }: CalibrationControlsProps) {
  const handleKPIChange = (field: string, value: number) => {
    onUpdate({
      kpiTargets: {
        ...preset.kpiTargets,
        [field]: value,
      },
    });
  };

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
        <BarChart3 className="w-4 h-4" />
        KPI Targets
      </h4>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Max Injury Rate</label>
          <input
            type="number"
            min="0"
            max="1"
            step="0.01"
            value={preset.kpiTargets.maxInjuryRate}
            onChange={(e) => handleKPIChange('maxInjuryRate', parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Max Death Rate</label>
          <input
            type="number"
            min="0"
            max="0.5"
            step="0.01"
            value={preset.kpiTargets.maxDeathRate}
            onChange={(e) => handleKPIChange('maxDeathRate', parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Target Overall Risk</label>
        <input
          type="number"
          min="0"
          max="1"
          step="0.01"
          value={preset.kpiTargets.targetOverallRisk}
          onChange={(e) => handleKPIChange('targetOverallRisk', parseFloat(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Risk Tolerance</label>
        <select
          value={preset.kpiTargets.riskTolerance}
          onChange={(e) => handleKPIChange('riskTolerance', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="conservative">Conservative</option>
          <option value="balanced">Balanced</option>
          <option value="aggressive">Aggressive</option>
        </select>
      </div>
    </div>
  );
}

/**
 * Color palette controls
 */
function ColorPaletteControls({ preset, onUpdate }: CalibrationControlsProps) {
  const handleColorChange = (path: string, value: string) => {
    const keys = path.split('.');
    const updatedPalette = { ...preset.colorPalette };
    
    let current: any = updatedPalette;
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    
    onUpdate({ colorPalette: updatedPalette });
  };

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
        <Palette className="w-4 h-4" />
        Color Palette
      </h4>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Injury Start Color</label>
          <input
            type="color"
            value={preset.colorPalette.injuryGradient.start}
            onChange={(e) => handleColorChange('injuryGradient.start', e.target.value)}
            className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
          />
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Injury End Color</label>
          <input
            type="color"
            value={preset.colorPalette.injuryGradient.end}
            onChange={(e) => handleColorChange('injuryGradient.end', e.target.value)}
            className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
          />
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Death Start Color</label>
          <input
            type="color"
            value={preset.colorPalette.deathGradient.start}
            onChange={(e) => handleColorChange('deathGradient.start', e.target.value)}
            className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
          />
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Death End Color</label>
          <input
            type="color"
            value={preset.colorPalette.deathGradient.end}
            onChange={(e) => handleColorChange('deathGradient.end', e.target.value)}
            className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Background Color</label>
          <input
            type="color"
            value={preset.colorPalette.backgroundColor}
            onChange={(e) => handleColorChange('backgroundColor', e.target.value)}
            className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
          />
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Border Color</label>
          <input
            type="color"
            value={preset.colorPalette.borderColor}
            onChange={(e) => handleColorChange('borderColor', e.target.value)}
            className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Risk preview component
 */
function RiskPreview({ preset }: { preset: RiskCalibrationPreset }) {
  const { calculateRiskWithSmoothing } = useRiskCalibration();
  
  const sampleRisks = useMemo(() => {
    return [0.05, 0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 0.85, 0.95].map(risk => ({
      original: risk,
      smoothed: calculateRiskWithSmoothing(risk, preset.smoothingCurve),
    }));
  }, [preset.smoothingCurve, calculateRiskWithSmoothing]);

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-gray-700">Risk Preview</h4>
      
      <div className="space-y-2">
        {sampleRisks.map(({ original, smoothed }, index) => (
          <div key={index} className="flex items-center gap-4">
            <div className="w-16 text-xs text-gray-600">{(original * 100).toFixed(0)}%</div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${smoothed * 100}%`,
                    background: `linear-gradient(to right, ${preset.colorPalette.injuryGradient.start}, ${preset.colorPalette.deathGradient.start})`,
                  }}
                />
              </div>
            </div>
            <div className="w-16 text-xs text-gray-600">{(smoothed * 100).toFixed(0)}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Main Risk Stripe Calibrator component
 */
export function RiskStripeCalibrator() {
  const diagnostics = useRef(createSandboxDiagnostics('RiskStripeCalibrator', 'risk-calibration-tool'));
  
  const {
    state,
    setActivePreset,
    createPreset,
    updatePreset,
    deletePreset,
    undo,
    redo,
    canUndo,
    canRedo,
    savePreset,
    exportPreset,
  } = useRiskCalibration({ enableTelemetry: true });

  const [activeTab, setActiveTab] = useState<'smoothing' | 'kpi' | 'colors' | 'preview'>('smoothing');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleExport = useCallback(() => {
    try {
      const json = exportPreset(state.activePreset.id);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `risk-calibration-${state.activePreset.id}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      diagnostics.current.info('export', 'Preset exported', {
        presetId: state.activePreset.id,
        timestamp: Date.now(),
      });
    } catch (error) {
      diagnostics.current.error('export', 'Failed to export preset', { error });
    }
  }, [state.activePreset.id, exportPreset]);

  const handleSave = useCallback(async () => {
    try {
      await savePreset();
      diagnostics.current.info('save', 'Preset saved successfully', {
        presetId: state.activePreset.id,
        timestamp: Date.now(),
      });
    } catch (error) {
      diagnostics.current.error('save', 'Failed to save preset', { error });
    }
  }, [savePreset]);

  const handleCreatePreset = useCallback(() => {
    const newPreset = createPreset({
      name: `Custom Preset ${state.presets.length + 1}`,
      description: 'Custom calibration preset',
    });
    setActivePreset(newPreset.id);
  }, [state.presets.length, createPreset, setActivePreset]);

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="w-6 h-6" />
            Risk Stripe Calibration Tool
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Calibrate risk stripes with configurable curves and export JSON for quest planner
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={undo}
            disabled={!canUndo}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <RotateCcw className="w-4 h-4" />
            Undo
          </button>
          
          <button
            onClick={redo}
            disabled={!canRedo}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <RotateCw className="w-4 h-4" />
            Redo
          </button>
          
          <button
            onClick={handleSave}
            disabled={!state.isDirty}
            className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
          
          <button
            onClick={handleExport}
            className="px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-1"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Preset Selector */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Active Preset:</label>
            <select
              value={state.activePreset.id}
              onChange={(e) => setActivePreset(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {state.presets.map(preset => (
                <option key={preset.id} value={preset.id}>
                  {preset.name}
                </option>
              ))}
            </select>
            
            <button
              onClick={handleCreatePreset}
              className="px-3 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Create New
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showAdvanced"
              checked={showAdvanced}
              onChange={(e) => setShowAdvanced(e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="showAdvanced" className="text-sm text-gray-600">
              Show Advanced Options
            </label>
          </div>
        </div>
        
        {state.isDirty && (
          <div className="mt-2 text-sm text-amber-600">
            Unsaved changes - Click Save to persist
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'smoothing', label: 'Smoothing', icon: Sliders },
            { id: 'kpi', label: 'KPI Targets', icon: BarChart3 },
            { id: 'colors', label: 'Colors', icon: Palette },
            { id: 'preview', label: 'Preview', icon: Settings },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          {activeTab === 'smoothing' && (
            <SmoothingCurveControls preset={state.activePreset} onUpdate={updatePreset} />
          )}
          {activeTab === 'kpi' && (
            <KPITargetControls preset={state.activePreset} onUpdate={updatePreset} />
          )}
          {activeTab === 'colors' && (
            <ColorPaletteControls preset={state.activePreset} onUpdate={updatePreset} />
          )}
          {activeTab === 'preview' && (
            <RiskPreview preset={state.activePreset} />
          )}
        </div>
        
        <div>
          {/* Preset Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Preset Information</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Name:</span> {state.activePreset.name}
              </div>
              <div>
                <span className="font-medium">Description:</span> {state.activePreset.description}
              </div>
              <div>
                <span className="font-medium">Author:</span> {state.activePreset.metadata.author}
              </div>
              <div>
                <span className="font-medium">Version:</span> {state.activePreset.metadata.version}
              </div>
              <div>
                <span className="font-medium">Created:</span> {new Date(state.activePreset.metadata.createdAt).toLocaleDateString()}
              </div>
              {showAdvanced && (
                <div>
                  <span className="font-medium">Tags:</span> {state.activePreset.metadata.tags?.join(', ') || 'None'}
                </div>
              )}
            </div>
          </div>
          
          {/* KPI Status */}
          <div className="bg-gray-50 rounded-lg p-4 mt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">KPI Status</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Max Injury Rate:</span>
                <span className={(state.activePreset.kpiTargets.maxInjuryRate <= 0.25) ? 'text-green-600' : 'text-red-600'}>
                  {(state.activePreset.kpiTargets.maxInjuryRate * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Max Death Rate:</span>
                <span className={(state.activePreset.kpiTargets.maxDeathRate <= 0.12) ? 'text-green-600' : 'text-red-600'}>
                  {(state.activePreset.kpiTargets.maxDeathRate * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Overall Risk:</span>
                <span className={(state.activePreset.kpiTargets.targetOverallRisk <= 0.3) ? 'text-green-600' : 'text-amber-600'}>
                  {(state.activePreset.kpiTargets.targetOverallRisk * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Risk Tolerance:</span>
                <span className="capitalize">{state.activePreset.kpiTargets.riskTolerance}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
