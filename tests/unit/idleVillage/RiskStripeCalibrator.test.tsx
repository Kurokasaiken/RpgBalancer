import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RiskStripeCalibrator } from '@/ui/idleVillage/tools/RiskStripeCalibrator';
import { useRiskCalibration } from '@/ui/idleVillage/hooks/useRiskCalibration';
import type { RiskCalibrationPreset } from '@/ui/idleVillage/config/riskCalibrationConfig';

// Mock the hook
vi.mock('@/ui/idleVillage/hooks/useRiskCalibration');

describe('RiskStripeCalibrator', () => {
  const mockUseRiskCalibration = vi.mocked(useRiskCalibration);
  
  const mockPreset: RiskCalibrationPreset = {
    id: 'test-preset',
    name: 'Test Preset',
    description: 'Test description',
    smoothingCurve: {
      type: 'linear',
      factor: 1.0,
      threshold: 0.05,
    },
    kpiTargets: {
      maxInjuryRate: 0.25,
      maxDeathRate: 0.12,
      targetOverallRisk: 0.3,
      riskTolerance: 'balanced',
    },
    colorPalette: {
      injuryGradient: {
        start: '#fbbf24',
        end: '#f59e0b',
      },
      deathGradient: {
        start: '#ef4444',
        end: '#b91c1c',
      },
      backgroundColor: '#1e293b',
      borderColor: '#475569',
      zeroRiskColor: '#64748b',
    },
    metadata: {
      author: 'Test Author',
      version: '1.0.0',
      createdAt: '2026-01-16T00:00:00.000Z',
      tags: ['test'],
    },
  };

  const mockHookReturn = {
    state: {
      activePreset: mockPreset,
      presets: [mockPreset],
      undoStack: [],
      redoStack: [],
      isDirty: false,
      isAutoSaving: true,
      lastSavedAt: null,
    },
    setActivePreset: vi.fn(),
    createPreset: vi.fn(),
    updatePreset: vi.fn(),
    deletePreset: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
    canUndo: false,
    canRedo: false,
    savePreset: vi.fn(),
    loadPreset: vi.fn(),
    exportPreset: vi.fn().mockReturnValue('{"test": "json"}'),
    calculateRiskWithSmoothing: vi.fn().mockReturnValue(0.5),
    validateKPIs: vi.fn().mockReturnValue(true),
    compareWithBaseline: vi.fn().mockReturnValue({
      injuryDiff: 0.1,
      deathDiff: 0.05,
      overallDiff: 0.15,
    }),
  };

  beforeEach(() => {
    mockUseRiskCalibration.mockReturnValue(mockHookReturn);
    
    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
    
    // Mock document.createElement and appendChild/removeChild
    const mockAnchor = {
      href: '',
      download: '',
      click: vi.fn(),
    };
    global.document.createElement = vi.fn().mockReturnValue(mockAnchor);
    global.document.body.appendChild = vi.fn();
    global.document.body.removeChild = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the calibrator tool', () => {
    render(<RiskStripeCalibrator />);
    
    expect(screen.getByText('Risk Stripe Calibration Tool')).toBeInTheDocument();
    expect(screen.getByText('Calibrate risk stripes with configurable curves and export JSON for quest planner')).toBeInTheDocument();
  });

  it('displays preset information', () => {
    render(<RiskStripeCalibrator />);
    
    expect(screen.getByText('Test Preset')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
    expect(screen.getByText('Test Author')).toBeInTheDocument();
    expect(screen.getByText('1.0.0')).toBeInTheDocument();
  });

  it('shows KPI status', () => {
    render(<RiskStripeCalibrator />);
    
    expect(screen.getByText('Max Injury Rate:')).toBeInTheDocument();
    expect(screen.getByText('25.0%')).toBeInTheDocument();
    expect(screen.getByText('Max Death Rate:')).toBeInTheDocument();
    expect(screen.getByText('12.0%')).toBeInTheDocument();
    expect(screen.getByText('Overall Risk:')).toBeInTheDocument();
    expect(screen.getByText('30.0%')).toBeInTheDocument();
    expect(screen.getByText('Risk Tolerance:')).toBeInTheDocument();
    expect(screen.getByText('Balanced')).toBeInTheDocument();
  });

  it('renders tabs for different sections', () => {
    render(<RiskStripeCalibrator />);
    
    expect(screen.getByText('Smoothing')).toBeInTheDocument();
    expect(screen.getByText('KPI Targets')).toBeInTheDocument();
    expect(screen.getByText('Colors')).toBeInTheDocument();
    expect(screen.getByText('Preview')).toBeInTheDocument();
  });

  it('switches between tabs', async () => {
    render(<RiskStripeCalibrator />);
    
    const kpiTab = screen.getByText('KPI Targets');
    fireEvent.click(kpiTab);
    
    await waitFor(() => {
      expect(screen.getByText('Max Injury Rate')).toBeInTheDocument();
    });
    
    const colorsTab = screen.getByText('Colors');
    fireEvent.click(colorsTab);
    
    await waitFor(() => {
      expect(screen.getByText('Injury Start Color')).toBeInTheDocument();
    });
  });

  it('handles preset selection', () => {
    render(<RiskStripeCalibrator />);
    
    const select = screen.getByDisplayValue('Test Preset');
    expect(select).toBeInTheDocument();
    
    fireEvent.change(select, { target: { value: 'test-preset' } });
    
    expect(mockHookReturn.setActivePreset).toHaveBeenCalledWith('test-preset');
  });

  it('handles create new preset', () => {
    render(<RiskStripeCalibrator />);
    
    const createButton = screen.getByText('Create New');
    fireEvent.click(createButton);
    
    expect(mockHookReturn.createPreset).toHaveBeenCalledWith({
      name: 'Custom Preset 1',
      description: 'Custom calibration preset',
    });
  });

  it('handles undo and redo buttons', () => {
    mockHookReturn.canUndo = true;
    mockHookReturn.canRedo = true;
    mockUseRiskCalibration.mockReturnValue(mockHookReturn);
    
    render(<RiskStripeCalibrator />);
    
    const undoButton = screen.getByText('Undo');
    const redoButton = screen.getByText('Redo');
    
    fireEvent.click(undoButton);
    expect(mockHookReturn.undo).toHaveBeenCalled();
    
    fireEvent.click(redoButton);
    expect(mockHookReturn.redo).toHaveBeenCalled();
  });

  it('handles save button', async () => {
    mockHookReturn.state.isDirty = true;
    mockUseRiskCalibration.mockReturnValue(mockHookReturn);
    
    render(<RiskStripeCalibrator />);
    
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(mockHookReturn.savePreset).toHaveBeenCalled();
    });
  });

  it('handles export button', () => {
    render(<RiskStripeCalibrator />);
    
    const exportButton = screen.getByText('Export');
    fireEvent.click(exportButton);
    
    expect(mockHookReturn.exportPreset).toHaveBeenCalledWith('test-preset');
    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(global.document.createElement).toHaveBeenCalledWith('a');
  });

  it('shows unsaved changes warning', () => {
    mockHookReturn.state.isDirty = true;
    mockUseRiskCalibration.mockReturnValue(mockHookReturn);
    
    render(<RiskStripeCalibrator />);
    
    expect(screen.getByText('Unsaved changes - Click Save to persist')).toBeInTheDocument();
  });

  it('toggles advanced options', () => {
    render(<RiskStripeCalibrator />);
    
    const advancedCheckbox = screen.getByLabelText('Show Advanced Options');
    expect(advancedCheckbox).toBeInTheDocument();
    
    fireEvent.click(advancedCheckbox);
    
    expect(advancedCheckbox).toBeChecked();
  });

  it('disables buttons when appropriate', () => {
    render(<RiskStripeCalibrator />);
    
    const undoButton = screen.getByText('Undo');
    const redoButton = screen.getByText('Redo');
    const saveButton = screen.getByText('Save');
    
    expect(undoButton).toBeDisabled();
    expect(redoButton).toBeDisabled();
    expect(saveButton).toBeDisabled();
  });

  it('enables buttons when state allows', () => {
    mockHookReturn.canUndo = true;
    mockHookReturn.canRedo = true;
    mockHookReturn.state.isDirty = true;
    mockUseRiskCalibration.mockReturnValue(mockHookReturn);
    
    render(<RiskStripeCalibrator />);
    
    const undoButton = screen.getByText('Undo');
    const redoButton = screen.getByText('Redo');
    const saveButton = screen.getByText('Save');
    
    expect(undoButton).not.toBeDisabled();
    expect(redoButton).not.toBeDisabled();
    expect(saveButton).not.toBeDisabled();
  });

  describe('Smoothing Curve Controls', () => {
    it('renders smoothing controls', () => {
      render(<RiskStripeCalibrator />);
      
      const smoothingTab = screen.getByText('Smoothing');
      fireEvent.click(smoothingTab);
      
      expect(screen.getByText('Smoothing Curve')).toBeInTheDocument();
      expect(screen.getByText('Curve Type')).toBeInTheDocument();
      expect(screen.getByText('Factor')).toBeInTheDocument();
      expect(screen.getByText('Threshold')).toBeInTheDocument();
    });

    it('handles smoothing curve changes', () => {
      render(<RiskStripeCalibrator />);
      
      const smoothingTab = screen.getByText('Smoothing');
      fireEvent.click(smoothingTab);
      
      const curveTypeSelect = screen.getByDisplayValue('Linear');
      fireEvent.change(curveTypeSelect, { target: { value: 'ease-in' } });
      
      expect(mockHookReturn.updatePreset).toHaveBeenCalledWith({
        smoothingCurve: {
          type: 'ease-in',
          factor: 1.0,
          threshold: 0.05,
        },
      });
    });

    it('shows custom bezier input for cubic-bezier type', () => {
      render(<RiskStripeCalibrator />);
      
      const smoothingTab = screen.getByText('Smoothing');
      fireEvent.click(smoothingTab);
      
      const curveTypeSelect = screen.getByDisplayValue('Linear');
      fireEvent.change(curveTypeSelect, { target: { value: 'cubic-bezier' } });
      
      expect(screen.getByText('Custom Bezier')).toBeInTheDocument();
    });
  });

  describe('KPI Target Controls', () => {
    it('renders KPI controls', () => {
      render(<RiskStripeCalibrator />);
      
      const kpiTab = screen.getByText('KPI Targets');
      fireEvent.click(kpiTab);
      
      expect(screen.getByText('KPI Targets')).toBeInTheDocument();
      expect(screen.getByText('Max Injury Rate')).toBeInTheDocument();
      expect(screen.getByText('Max Death Rate')).toBeInTheDocument();
      expect(screen.getByText('Target Overall Risk')).toBeInTheDocument();
      expect(screen.getByText('Risk Tolerance')).toBeInTheDocument();
    });

    it('handles KPI changes', () => {
      render(<RiskStripeCalibrator />);
      
      const kpiTab = screen.getByText('KPI Targets');
      fireEvent.click(kpiTab);
      
      const injuryInput = screen.getByDisplayValue('0.25');
      fireEvent.change(injuryInput, { target: { value: '0.3' } });
      
      expect(mockHookReturn.updatePreset).toHaveBeenCalledWith({
        kpiTargets: {
          maxInjuryRate: 0.3,
          maxDeathRate: 0.12,
          targetOverallRisk: 0.3,
          riskTolerance: 'balanced',
        },
      });
    });
  });

  describe('Color Palette Controls', () => {
    it('renders color controls', () => {
      render(<RiskStripeCalibrator />);
      
      const colorsTab = screen.getByText('Colors');
      fireEvent.click(colorsTab);
      
      expect(screen.getByText('Color Palette')).toBeInTheDocument();
      expect(screen.getByText('Injury Start Color')).toBeInTheDocument();
      expect(screen.getByText('Injury End Color')).toBeInTheDocument();
      expect(screen.getByText('Death Start Color')).toBeInTheDocument();
      expect(screen.getByText('Death End Color')).toBeInTheDocument();
      expect(screen.getByText('Background Color')).toBeInTheDocument();
      expect(screen.getByText('Border Color')).toBeInTheDocument();
    });

    it('handles color changes', () => {
      render(<RiskStripeCalibrator />);
      
      const colorsTab = screen.getByText('Colors');
      fireEvent.click(colorsTab);
      
      const injuryStartColor = screen.getByDisplayValue('#fbbf24');
      fireEvent.change(injuryStartColor, { target: { value: '#ff0000' } });
      
      expect(mockHookReturn.updatePreset).toHaveBeenCalledWith({
        colorPalette: {
          injuryGradient: {
            start: '#ff0000',
            end: '#f59e0b',
          },
          deathGradient: {
            start: '#ef4444',
            end: '#b91c1c',
          },
          backgroundColor: '#1e293b',
          borderColor: '#475569',
          zeroRiskColor: '#64748b',
        },
      });
    });
  });

  describe('Risk Preview', () => {
    it('renders risk preview', () => {
      render(<RiskStripeCalibrator />);
      
      const previewTab = screen.getByText('Preview');
      fireEvent.click(previewTab);
      
      expect(screen.getByText('Risk Preview')).toBeInTheDocument();
      expect(mockHookReturn.calculateRiskWithSmoothing).toHaveBeenCalled();
    });

    it('displays risk percentages', () => {
      render(<RiskStripeCalibrator />);
      
      const previewTab = screen.getByText('Preview');
      fireEvent.click(previewTab);
      
      expect(screen.getByText('5%')).toBeInTheDocument();
      expect(screen.getByText('15%')).toBeInTheDocument();
      expect(screen.getByText('25%')).toBeInTheDocument();
    });
  });
});
