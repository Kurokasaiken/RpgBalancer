import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EnhancedStatSlider } from './index';

describe('EnhancedStatSlider', () => {
  const mockTicks = [
    { value: 5, weight: 1 },
    { value: 10, weight: 2 },
    { value: 15, weight: 3 },
  ];

  const defaultProps = {
    field: 'test-field',
    label: 'Test Slider',
    ticks: mockTicks,
    selectedTick: 0,
    onSelectTick: vi.fn(),
    onStepChange: vi.fn(),
    onAddStep: vi.fn(),
    onRemoveStep: vi.fn(),
    onToggleCollapse: vi.fn(),
    description: 'Test description',
    collapsed: false,
    isMalus: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with default props', () => {
    render(<EnhancedStatSlider {...defaultProps} />);
    
    // Check if the header is rendered
    expect(screen.getByText('Test Slider')).toBeInTheDocument();
    
    // Check if ticks are rendered
    expect(screen.getAllByPlaceholderText('Val')).toHaveLength(3);
    expect(screen.getAllByPlaceholderText('Wgt')).toHaveLength(3);
    
    // Check if the description is rendered
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('calls onSelectTick when a tick is clicked', () => {
    render(<EnhancedStatSlider {...defaultProps} />);
    
    // Click on the second tick's value
    const secondTickValue = screen.getAllByPlaceholderText('Val')[1];
    fireEvent.click(secondTickValue);
    
    expect(defaultProps.onSelectTick).toHaveBeenCalledWith(1);
  });

  it('calls onStepChange when a tick value is changed', () => {
    render(<EnhancedStatSlider {...defaultProps} />);
    
    const firstTickValue = screen.getAllByPlaceholderText('Val')[0] as HTMLInputElement;
    fireEvent.change(firstTickValue, { target: { value: '7' } });
    
    expect(defaultProps.onStepChange).toHaveBeenCalledWith(0, { value: 7, weight: 1 });
  });

  it('calls onStepChange when a tick weight is changed', () => {
    render(<EnhancedStatSlider {...defaultProps} />);
    
    const firstTickWeight = screen.getAllByPlaceholderText('Wgt')[0] as HTMLInputElement;
    fireEvent.change(firstTickWeight, { target: { value: '1.5' } });
    
    expect(defaultProps.onStepChange).toHaveBeenCalledWith(0, { value: 5, weight: 1.5 });
  });

  it('calls onAddStep when add button is clicked', () => {
    render(<EnhancedStatSlider {...defaultProps} />);
    
    // Click the add button at the end
    const addButton = screen.getByTitle('Add tick at end');
    fireEvent.click(addButton);
    
    expect(defaultProps.onAddStep).toHaveBeenCalledWith(2); // Last index
  });

  it('calls onRemoveStep when remove button is clicked', () => {
    // Enable remove button by setting canRemove to true
    const props = {
      ...defaultProps,
      ticks: [...mockTicks],
    };
    
    render(<EnhancedStatSlider {...props} />);
    
    // Click the remove button of the first tick
    const removeButton = screen.getAllByTitle('Remove tick')[0];
    fireEvent.click(removeButton);
    
    expect(defaultProps.onRemoveStep).toHaveBeenCalledWith(0);
  });

  it('does not show remove button when there is only one tick', () => {
    const props = {
      ...defaultProps,
      ticks: [{ value: 5, weight: 1 }],
    };
    
    render(<EnhancedStatSlider {...props} />);
    
    const removeButtons = screen.queryAllByTitle('Remove tick');
    expect(removeButtons).toHaveLength(0);
  });

  it('shows collapsed state when collapsed prop is true', () => {
    render(<EnhancedStatSlider {...defaultProps} collapsed={true} />);
    
    // The content should not be visible when collapsed
    expect(screen.queryByText('Test description')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Val')).not.toBeInTheDocument();
  });

  it('calls onToggleCollapse when header is clicked', () => {
    render(<EnhancedStatSlider {...defaultProps} />);
    
    const header = screen.getByRole('button', { name: /Test Slider/ });
    fireEvent.click(header);
    
    expect(defaultProps.onToggleCollapse).toHaveBeenCalled();
  });

  it('renders malus style when isMalus is true', () => {
    render(<EnhancedStatSlider {...defaultProps} isMalus={true} />);
    
    const header = screen.getByText('Test Slider');
    expect(header).toHaveClass('malus');
  });
});
