/**
 * Idle Village Risk Stripe Calibration Tool
 * 
 * Interactive tool for calibrating risk stripes with real-time visualization,
 * point editing, curve fitting, and export functionality.
 * 
 * @module RiskStripeCalibrationTool
 * @since 2026-01-13
 * @author Cascade
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { createSandboxDiagnostics } from '@/ui/idleVillage/utils/sandboxDiagnostics';
import {
  calibrationEngine,
  type CalibrationSession,
  type CalibrationPoint,
  type CalibrationCurveParams,
  type CalibrationValidationResults,
  type CalibrationPreset,
  type RiskStripeConfig,
  type InteractiveCalibrationState,
  CalibrationAlgorithm,
  CalibrationPresetType,
  RiskLevel,
  createCalibrationSessionId,
  createCalibrationPoint,
  calculateRiskLevel,
  formatRiskValue,
  validateCalibrationPoint,
  sortCalibrationPoints,
  BUILTIN_CALIBRATION_PRESETS,
  DEFAULT_RISK_STRIPE_CALIBRATION_TOOL_CONFIG,
  DEFAULT_RISK_STRIPE_CONFIG,
} from '@/balancing/config/idleVillage/riskStripeCalibrationConfig';

const diagnostics = createSandboxDiagnostics('RiskStripeCalibrationTool', 'calibration');

/**
 * Calibration Tool Props
 */
export interface RiskStripeCalibrationToolProps {
  /** Tool configuration */
  config?: Partial<typeof DEFAULT_RISK_STRIPE_CALIBRATION_TOOL_CONFIG>;
  /** Initial session */
  initialSession?: CalibrationSession;
  /** On session change callback */
  onSessionChange?: (session: CalibrationSession) => void;
  /** CSS class name */
  className?: string;
  /** Height */
  height?: string | number;
  /** Width */
  width?: string | number;
  /** Compact mode */
  compact?: boolean;
}

/**
 * Canvas component for calibration visualization
 */
const CalibrationCanvas: React.FC<{
  session: CalibrationSession;
  state: InteractiveCalibrationState;
  onPointClick: (index: number) => void;
  onPointDrag: (index: number, x: number, y: number) => void;
  onCanvasClick: (x: number, y: number) => void;
  config: typeof DEFAULT_RISK_STRIPE_CALIBRATION_TOOL_CONFIG;
}> = ({ session, state, onPointClick, onPointDrag, onCanvasClick, config }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedPoint, setDraggedPoint] = useState<number | null>(null);

  // Draw calibration visualization
  const drawVisualization = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    const padding = 40;
    const graphWidth = width - 2 * padding;
    const graphHeight = height - 2 * padding;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    if (config.ui.showGrid) {
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);

      // Vertical grid lines
      for (let i = 0; i <= 10; i++) {
        const x = padding + (i * graphWidth) / 10;
        ctx.beginPath();
        ctx.moveTo(x, padding);
        ctx.lineTo(x, height - padding);
        ctx.stroke();
      }

      // Horizontal grid lines
      for (let i = 0; i <= 10; i++) {
        const y = padding + (i * graphHeight) / 10;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
      }

      ctx.setLineDash([]);
    }

    // Draw axes
    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Draw calibration curve
    if (config.ui.showCurve) {
      const curveData = calibrationEngine.generateCurveData(session.curveParams, 100);
      
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      curveData.forEach((point, index) => {
        const x = padding + (point.x * graphWidth);
        const y = height - padding - (point.y / 300) * graphHeight; // Normalize to 300px max height
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();
    }

    // Draw calibration points
    if (config.ui.showPoints) {
      session.calibrationPoints.forEach((point, index) => {
        const x = padding + (point.riskPercentage * graphWidth);
        const y = height - padding - (point.stripeHeight / 300) * graphHeight;
        
        // Point color based on risk level
        const colors = {
          very_low: '#22c55e',
          low: '#84cc16',
          medium: '#eab308',
          high: '#f59e0b',
          very_high: '#ef4444',
          extreme: '#dc2626',
        };
        
        ctx.fillStyle = colors[point.riskLevel] || '#6b7280';
        
        // Draw point
        ctx.beginPath();
        const radius = point.isReference ? 8 : 6;
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw selection indicator
        if (state.selectedPointIndex === index) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x, y, radius + 4, 0, 2 * Math.PI);
          ctx.stroke();
        }
        
        // Draw label if enabled
        if (config.ui.showLabels) {
          ctx.fillStyle = '#f3f4f6';
          ctx.font = '10px sans-serif';
          ctx.textAlign = 'center';
          const label = `${formatRiskValue(point.riskPercentage, 'percentage', 1)} / ${point.stripeHeight.toFixed(0)}px`;
          ctx.fillText(label, x, y - 12);
        }
      });
    }

    // Draw error indicators if enabled
    if (config.ui.showErrors && session.validationResults) {
      session.calibrationPoints.forEach((point, index) => {
        const x = padding + (point.riskPercentage * graphWidth);
        const predicted = calibrationEngine.calculateStripeHeight(point.riskPercentage, session.curveParams);
        const y = height - padding - (predicted / 300) * graphHeight;
        
        // Draw error line
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(x, height - padding - (point.stripeHeight / 300) * graphHeight);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.setLineDash([]);
      });
    }
  }, [session, state, config]);

  // Handle mouse events
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const padding = 40;
    const graphWidth = canvas.width - 2 * padding;
    const graphHeight = canvas.height - 2 * padding;

    // Check if clicking on a point
    const clickedPointIndex = session.calibrationPoints.findIndex(point => {
      const px = padding + (point.riskPercentage * graphWidth);
      const py = canvas.height - padding - (point.stripeHeight / 300) * graphHeight;
      const distance = Math.sqrt(Math.pow(x - px, 2) + Math.pow(y - py, 2));
      return distance <= 10;
    });

    if (clickedPointIndex !== -1) {
      onPointClick(clickedPointIndex);
      setIsDragging(true);
      setDraggedPoint(clickedPointIndex);
    } else {
      // Check if clicking in graph area
      if (x >= padding && x <= canvas.width - padding && 
          y >= padding && y <= canvas.height - padding) {
        const riskPercentage = (x - padding) / graphWidth;
        const stripeHeight = ((canvas.height - padding - y) / graphHeight) * 300;
        onCanvasClick(riskPercentage, stripeHeight);
      }
    }
  }, [session, onPointClick, onCanvasClick]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || draggedPoint === null) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const padding = 40;
    const graphWidth = canvas.width - 2 * padding;
    const graphHeight = canvas.height - 2 * padding;

    const riskPercentage = Math.max(0, Math.min(1, (x - padding) / graphWidth));
    const stripeHeight = Math.max(0, Math.min(300, ((canvas.height - padding - y) / graphHeight) * 300));

    onPointDrag(draggedPoint, riskPercentage, stripeHeight);
  }, [isDragging, draggedPoint, onPointDrag]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDraggedPoint(null);
  }, []);

  // Set up canvas and draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    drawVisualization();
  }, [drawVisualization]);

  // Redraw when session or state changes
  useEffect(() => {
    drawVisualization();
  }, [session, state, drawVisualization]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100%',
        cursor: isDragging ? 'grabbing' : 'grab',
        border: '1px solid #374151',
        borderRadius: '4px',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    />
  );
};

/**
 * Point editor component
 */
const PointEditor: React.FC<{
  point: CalibrationPoint | null;
  onChange: (point: CalibrationPoint) => void;
  onDelete: () => void;
  config: typeof DEFAULT_RISK_STRIPE_CALIBRATION_TOOL_CONFIG;
}> = ({ point, onChange, onDelete, config }) => {
  if (!point) {
    return (
      <div style={{
        padding: '16px',
        backgroundColor: '#1f2937',
        border: '1px solid #374151',
        borderRadius: '4px',
        color: '#9ca3af',
        textAlign: 'center',
      }}>
        Select a point to edit
      </div>
    );
  }

  const handleFieldChange = (field: keyof CalibrationPoint, value: any) => {
    const updatedPoint = { ...point, [field]: value };
    onChange(updatedPoint);
  };

  return (
    <div style={{
      padding: '16px',
      backgroundColor: '#1f2937',
      border: '1px solid #374151',
      borderRadius: '4px',
    }}>
      <h3 style={{ color: '#f3f4f6', marginBottom: '16px' }}>
        Edit Calibration Point
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <label style={{ color: '#9ca3af', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
            Risk Percentage
          </label>
          <input
            type="number"
            min={0}
            max={1}
            step={0.01}
            value={point.riskPercentage}
            onChange={(e) => handleFieldChange('riskPercentage', parseFloat(e.target.value))}
            style={{
              width: '100%',
              padding: '6px',
              backgroundColor: '#374151',
              border: '1px solid #4b5563',
              borderRadius: '4px',
              color: '#f3f4f6',
            }}
          />
        </div>

        <div>
          <label style={{ color: '#9ca3af', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
            Stripe Height (px)
          </label>
          <input
            type="number"
            min={0}
            max={300}
            step={1}
            value={point.stripeHeight}
            onChange={(e) => handleFieldChange('stripeHeight', parseFloat(e.target.value))}
            style={{
              width: '100%',
              padding: '6px',
              backgroundColor: '#374151',
              border: '1px solid #4b5563',
              borderRadius: '4px',
              color: '#f3f4f6',
            }}
          />
        </div>

        <div>
          <label style={{ color: '#9ca3af', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
            Risk Level
          </label>
          <select
            value={point.riskLevel}
            onChange={(e) => handleFieldChange('riskLevel', e.target.value)}
            style={{
              width: '100%',
              padding: '6px',
              backgroundColor: '#374151',
              border: '1px solid #4b5563',
              borderRadius: '4px',
              color: '#f3f4f6',
            }}
          >
            <option value={RiskLevel.VERY_LOW}>Very Low</option>
            <option value={RiskLevel.LOW}>Low</option>
            <option value={RiskLevel.MEDIUM}>Medium</option>
            <option value={RiskLevel.HIGH}>High</option>
            <option value={RiskLevel.VERY_HIGH}>Very High</option>
            <option value={RiskLevel.EXTREME}>Extreme</option>
          </select>
        </div>

        <div>
          <label style={{ color: '#9ca3af', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
            Weight
          </label>
          <input
            type="number"
            min={0}
            max={1}
            step={0.1}
            value={point.weight}
            onChange={(e) => handleFieldChange('weight', parseFloat(e.target.value))}
            style={{
              width: '100%',
              padding: '6px',
              backgroundColor: '#374151',
              border: '1px solid #4b5563',
              borderRadius: '4px',
              color: '#f3f4f6',
            }}
          />
        </div>

        <div>
          <label style={{ color: '#9ca3af', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={point.isReference}
              onChange={(e) => handleFieldChange('isReference', e.target.checked)}
            />
            Reference Point
          </label>
        </div>

        <div>
          <label style={{ color: '#9ca3af', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
            Description
          </label>
          <textarea
            value={point.description || ''}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            placeholder="Optional description..."
            style={{
              width: '100%',
              padding: '6px',
              backgroundColor: '#374151',
              border: '1px solid #4b5563',
              borderRadius: '4px',
              color: '#f3f4f6',
              minHeight: '60px',
              resize: 'vertical',
            }}
          />
        </div>

        <button
          onClick={onDelete}
          style={{
            padding: '8px 16px',
            backgroundColor: '#ef4444',
            color: '#ffffff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          Delete Point
        </button>
      </div>
    </div>
  );
};

/**
 * Algorithm selector component
 */
const AlgorithmSelector: React.FC<{
  algorithm: CalibrationAlgorithm;
  onChange: (algorithm: CalibrationAlgorithm) => void;
}> = ({ algorithm, onChange }) => {
  return (
    <div style={{
      padding: '16px',
      backgroundColor: '#1f2937',
      border: '1px solid #374151',
      borderRadius: '4px',
    }}>
      <h3 style={{ color: '#f3f4f6', marginBottom: '12px' }}>
        Calibration Algorithm
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {Object.values(CalibrationAlgorithm).map(algo => (
          <label key={algo} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="radio"
              name="algorithm"
              value={algo}
              checked={algorithm === algo}
              onChange={() => onChange(algo)}
            />
            <span style={{ color: '#f3f4f6', fontSize: '12px' }}>
              {algo.replace('_', ' ').charAt(0).toUpperCase() + algo.slice(1).replace('_', ' ')}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
};

/**
 * Validation results component
 */
const ValidationResults: React.FC<{
  results: CalibrationValidationResults | null;
}> = ({ results }) => {
  if (!results) {
    return (
      <div style={{
        padding: '16px',
        backgroundColor: '#1f2937',
        border: '1px solid #374151',
        borderRadius: '4px',
        color: '#9ca3af',
        textAlign: 'center',
      }}>
        No validation results available
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return '#22c55e';
    if (score >= 0.6) return '#eab308';
    if (score >= 0.4) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div style={{
      padding: '16px',
      backgroundColor: '#1f2937',
      border: '1px solid #374151',
      borderRadius: '4px',
    }}>
      <h3 style={{ color: '#f3f4f6', marginBottom: '16px' }}>
        Validation Results
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <div style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '4px' }}>
            Overall Score
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '100%',
              height: '8px',
              backgroundColor: '#374151',
              borderRadius: '4px',
              overflow: 'hidden',
            }}>
              <div
                style={{
                  width: `${results.validationScore * 100}%`,
                  height: '100%',
                  backgroundColor: getScoreColor(results.validationScore),
                  borderRadius: '4px',
                }}
              />
            </div>
            <span style={{ color: getScoreColor(results.validationScore), fontSize: '12px', fontWeight: 'bold' }}>
              {(results.validationScore * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        <div>
          <div style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '4px' }}>
            Error Metrics
          </div>
          <div style={{ fontSize: '11px', color: '#f3f4f6' }}>
            <div>MAE: {results.errors.meanAbsoluteError.toFixed(2)}</div>
            <div>RMSE: {results.errors.rootMeanSquareError.toFixed(2)}</div>
            <div>Max Error: {results.errors.maxAbsoluteError.toFixed(2)}</div>
            <div>MAPE: {(results.errors.meanAbsolutePercentageError * 100).toFixed(1)}%</div>
          </div>
        </div>

        <div>
          <div style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '4px' }}>
            Fit Quality
          </div>
          <div style={{ fontSize: '11px', color: '#f3f4f6' }}>
            <div>R²: {results.fitQuality.rSquared.toFixed(3)}</div>
            <div>Adjusted R²: {results.fitQuality.adjustedRSquared.toFixed(3)}</div>
            <div>RSE: {results.fitQuality.residualStandardError.toFixed(2)}</div>
          </div>
        </div>

        {results.outliers.count > 0 && (
          <div>
            <div style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '4px' }}>
              Outliers
            </div>
            <div style={{ fontSize: '11px', color: '#ef4444' }}>
              {results.outliers.count} outliers detected (threshold: {results.outliers.threshold})
            </div>
          </div>
        )}

        {results.recommendations.length > 0 && (
          <div>
            <div style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '4px' }}>
              Recommendations
            </div>
            <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11px', color: '#f3f4f6' }}>
              {results.recommendations.map((rec, index) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Main Calibration Tool Component
 */
export const RiskStripeCalibrationTool: React.FC<RiskStripeCalibrationToolProps> = ({
  config = {},
  initialSession,
  onSessionChange,
  className = '',
  height = '600px',
  width = '100%',
  compact = false,
}) => {
  const fullConfig = useMemo(() => ({
    ...DEFAULT_RISK_STRIPE_CALIBRATION_TOOL_CONFIG,
    ...config,
  }), [config]);

  // State management
  const [session, setSession] = useState<CalibrationSession>(() => {
    if (initialSession) {
      return initialSession;
    }

    // Create default session
    const defaultPoints = [
      createCalibrationPoint(0.0, 0, RiskLevel.VERY_LOW, 1.0, true, 'No risk'),
      createCalibrationPoint(0.5, 100, RiskLevel.MEDIUM, 1.0, true, 'Medium risk'),
      createCalibrationPoint(1.0, 200, RiskLevel.EXTREME, 1.0, true, 'Maximum risk'),
    ];

    return {
      sessionId: createCalibrationSessionId(),
      name: 'New Calibration Session',
      createdAt: Date.now(),
      modifiedAt: Date.now(),
      calibrationPoints: defaultPoints,
      curveParams: {
        algorithm: CalibrationAlgorithm.LINEAR,
        parameters: { slope: 200, intercept: 0 },
        domain: { min: 0, max: 1 },
        range: { min: 0, max: 200 },
      },
      stripeConfig: DEFAULT_RISK_STRIPE_CONFIG,
      metadata: {
        version: '1.0.0',
        author: 'User',
        tags: [],
        category: 'custom',
      },
    };
  });

  const [interactiveState, setInteractiveState] = useState<InteractiveCalibrationState>({
    currentSession: session,
    selectedPointIndex: null,
    isDragging: false,
    isPanning: false,
    zoomLevel: 1,
    viewport: { x: 0, y: 0, width: 800, height: 400 },
    toolMode: 'select',
    snapToGrid: false,
    gridSize: 0.05,
    showHelpers: true,
  });

  // Update session callback
  const updateSession = useCallback((newSession: CalibrationSession) => {
    setSession(newSession);
    setInteractiveState(prev => ({ ...prev, currentSession: newSession }));
    onSessionChange?.(newSession);
  }, [onSessionChange]);

  // Point management
  const handlePointClick = useCallback((index: number) => {
    setInteractiveState(prev => ({ ...prev, selectedPointIndex: index }));
  }, []);

  const handlePointDrag = useCallback((index: number, riskPercentage: number, stripeHeight: number) => {
    const updatedPoints = [...session.calibrationPoints];
    updatedPoints[index] = {
      ...updatedPoints[index],
      riskPercentage,
      stripeHeight,
      riskLevel: calculateRiskLevel(riskPercentage),
    };

    updateSession({
      ...session,
      calibrationPoints: updatedPoints,
      modifiedAt: Date.now(),
    });
  }, [session, updateSession]);

  const handleCanvasClick = useCallback((riskPercentage: number, stripeHeight: number) => {
    if (interactiveState.toolMode !== 'add') return;

    const newPoint = createCalibrationPoint(
      riskPercentage,
      stripeHeight,
      calculateRiskLevel(riskPercentage),
      1.0,
      false,
      'Added manually'
    );

    const updatedPoints = sortCalibrationPoints([...session.calibrationPoints, newPoint]);

    updateSession({
      ...session,
      calibrationPoints: updatedPoints,
      modifiedAt: Date.now(),
    });
  }, [interactiveState.toolMode, session, updateSession]);

  const handlePointChange = useCallback((point: CalibrationPoint) => {
    const updatedPoints = [...session.calibrationPoints];
    if (interactiveState.selectedPointIndex !== null) {
      updatedPoints[interactiveState.selectedPointIndex] = point;
    }

    updateSession({
      ...session,
      calibrationPoints: sortCalibrationPoints(updatedPoints),
      modifiedAt: Date.now(),
    });
  }, [session, interactiveState.selectedPointIndex, updateSession]);

  const handlePointDelete = useCallback(() => {
    if (interactiveState.selectedPointIndex === null) return;

    const updatedPoints = session.calibrationPoints.filter((_, index) => index !== interactiveState.selectedPointIndex);

    updateSession({
      ...session,
      calibrationPoints: updatedPoints,
      modifiedAt: Date.now(),
    });

    setInteractiveState(prev => ({ ...prev, selectedPointIndex: null }));
  }, [session, interactiveState.selectedPointIndex, updateSession]);

  // Algorithm management
  const handleAlgorithmChange = useCallback((algorithm: CalibrationAlgorithm) => {
    try {
      const fittedCurve = calibrationEngine.fitCalibrationCurve(session.calibrationPoints, algorithm);
      
      updateSession({
        ...session,
        curveParams: fittedCurve,
        modifiedAt: Date.now(),
      });
    } catch (error) {
      diagnostics.error('Failed to fit calibration curve', { error });
    }
  }, [session, updateSession]);

  // Validation
  const validateSession = useCallback(() => {
    try {
      const validationResults = calibrationEngine.validateCalibration(session);
      
      updateSession({
        ...session,
        validationResults,
        modifiedAt: Date.now(),
      });
    } catch (error) {
      diagnostics.error('Failed to validate calibration', { error });
    }
  }, [session, updateSession]);

  // Optimization
  const optimizeSession = useCallback(() => {
    try {
      const optimizedSession = calibrationEngine.optimizeCalibration(session);
      updateSession(optimizedSession);
    } catch (error) {
      diagnostics.error('Failed to optimize calibration', { error });
    }
  }, [session, updateSession]);

  // Export functionality
  const exportSession = useCallback((format: 'json' | 'csv') => {
    const exportData = {
      metadata: {
        version: '1.0.0',
        exportedAt: Date.now(),
        exportedBy: 'RiskStripeCalibrationTool',
        format,
      },
      session,
    };

    const data = JSON.stringify(exportData, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `calibration-${session.sessionId}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [session]);

  // Auto-validation
  useEffect(() => {
    if (fullConfig.validation.autoValidate && session.calibrationPoints.length >= 3) {
      validateSession();
    }
  }, [session.calibrationPoints, fullConfig.validation.autoValidate, validateSession]);

  const selectedPoint = interactiveState.selectedPointIndex !== null 
    ? session.calibrationPoints[interactiveState.selectedPointIndex] 
    : null;

  if (compact) {
    return (
      <div
        className={className}
        style={{
          width,
          height,
          backgroundColor: '#111827',
          border: '1px solid #374151',
          borderRadius: '8px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ color: '#f3f4f6', fontWeight: 'bold', fontSize: '14px' }}>
          Risk Stripe Calibration
        </div>
        
        <CalibrationCanvas
          session={session}
          state={interactiveState}
          onPointClick={handlePointClick}
          onPointDrag={handlePointDrag}
          onCanvasClick={handleCanvasClick}
          config={fullConfig}
        />
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={validateSession}
            style={{
              padding: '6px 12px',
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              fontSize: '11px',
              cursor: 'pointer',
            }}
          >
            Validate
          </button>
          <button
            onClick={optimizeSession}
            style={{
              padding: '6px 12px',
              backgroundColor: '#10b981',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              fontSize: '11px',
              cursor: 'pointer',
            }}
          >
            Optimize
          </button>
          <button
            onClick={() => exportSession('json')}
            style={{
              padding: '6px 12px',
              backgroundColor: '#6b7280',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              fontSize: '11px',
              cursor: 'pointer',
            }}
          >
            Export
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        width,
        height,
        backgroundColor: '#111827',
        border: '1px solid #374151',
        borderRadius: '8px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ color: '#f3f4f6', fontWeight: 'bold', fontSize: '16px' }}>
            Risk Stripe Calibration Tool
          </div>
          <div style={{ color: '#9ca3af', fontSize: '12px' }}>
            {session.name} • {session.calibrationPoints.length} points
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <select
            value={interactiveState.toolMode}
            onChange={(e) => setInteractiveState(prev => ({ ...prev, toolMode: e.target.value as any }))}
            style={{
              padding: '6px 12px',
              backgroundColor: '#374151',
              color: '#f3f4f6',
              border: '1px solid #4b5563',
              borderRadius: '4px',
              fontSize: '12px',
            }}
          >
            <option value="select">Select</option>
            <option value="add">Add Point</option>
            <option value="delete">Delete Point</option>
            <option value="edit">Edit Point</option>
          </select>
          
          <button
            onClick={validateSession}
            style={{
              padding: '6px 12px',
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            Validate
          </button>
          
          <button
            onClick={optimizeSession}
            style={{
              padding: '6px 12px',
              backgroundColor: '#10b981',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            Optimize
          </button>
          
          <button
            onClick={() => exportSession('json')}
            style={{
              padding: '6px 12px',
              backgroundColor: '#6b7280',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            Export JSON
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ display: 'flex', gap: '16px', flex: 1 }}>
        {/* Canvas */}
        <div style={{ flex: 1, minHeight: '400px' }}>
          <CalibrationCanvas
            session={session}
            state={interactiveState}
            onPointClick={handlePointClick}
            onPointDrag={handlePointDrag}
            onCanvasClick={handleCanvasClick}
            config={fullConfig}
          />
        </div>

        {/* Side panels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '300px' }}>
          {/* Point Editor */}
          <PointEditor
            point={selectedPoint}
            onChange={handlePointChange}
            onDelete={handlePointDelete}
            config={fullConfig}
          />

          {/* Algorithm Selector */}
          <AlgorithmSelector
            algorithm={session.curveParams.algorithm}
            onChange={handleAlgorithmChange}
          />

          {/* Validation Results */}
          <ValidationResults results={session.validationResults || null} />
        </div>
      </div>
    </div>
  );
};
