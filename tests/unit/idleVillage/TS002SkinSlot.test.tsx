/**
 * TS-002: SkinSlot & Hook Integration Test Suite
 * 
 * Comprehensive test suite for TS-002 compliance of the skin slot system.
 * Tests hook functionality, component integration, and performance.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { SkinSystemProvider } from '@/ui/idleVillage/hooks/useSkinSystem';
import { 
  useSkinSlot, 
  useBasicSkinSlot, 
  useAdvancedSkinSlot,
  useSkinClasses,
  useSkinAttributes,
  type UseSkinSlotOptions 
} from '@/ui/idleVillage/hooks/useSkinSlot';
import { 
  SkinSlot, 
  BasicSkinSlot, 
  AdvancedSkinSlot,
  ClassSkinSlot,
  AttributeSkinSlot,
  StyleSkinSlot,
  withSkinSlot,
  withBasicSkin,
  type SkinSlotProps 
} from '@/ui/idleVillage/components/SkinSlot';

// ============================================================================
// TEST UTILITIES
// ============================================================================

// Define types locally to avoid import issues
type ComponentId = string;
type MotionLevel = 'minimal' | 'reduced' | 'full';
type StyleLabPillar = 'frontier' | 'wilderness' | 'empire';
type SkinPresetId = 'minimal-frontier' | 'minimal-wilderness' | 'minimal-empire' | 'wanderlust' | 'arcane-tech' | 'gilded-observatory';

interface ComponentSkinBinding {
  componentId: ComponentId;
  name: string;
  description: string;
  version: string;
  defaultPreset: SkinPresetId;
  supportedPillars: StyleLabPillar[];
  supportedMotionLevels: MotionLevel[];
  cssClassBase: string;
  dataAttributePrefix: string;
  supportsMotionLevel: boolean;
  supportsTelemetry: boolean;
  supportsPillarSwitching: boolean;
  category: string;
  priority: number;
  tags: string[];
  skinProperties?: Record<string, unknown>;
}

const mockBinding: ComponentSkinBinding = {
  componentId: 'TestComponent',
  name: 'Test Component',
  description: 'A test component for skin slot integration',
  version: '1.0.0',
  defaultPreset: 'minimal-frontier',
  supportedPillars: ['frontier', 'wilderness'],
  supportedMotionLevels: ['minimal', 'reduced', 'full'],
  cssClassBase: 'test-component',
  dataAttributePrefix: 'test',
  supportsMotionLevel: true,
  supportsTelemetry: true,
  supportsPillarSwitching: true,
  category: 'ui',
  priority: 100,
  tags: ['test', 'component'],
  skinProperties: {
    testProperty: 'testValue',
  },
};

// Mock skin system
const mockSkinSystem = {
  state: {
    currentPreset: 'minimal-frontier' as SkinPresetId,
    currentPillar: 'frontier' as StyleLabPillar,
    currentMotionLevel: 'full' as MotionLevel,
    isTransitioning: false,
  },
  registerComponent: vi.fn(),
  unregisterComponent: vi.fn(),
  generateClasses: vi.fn(() => ['test-component', 'test-component--frontier', 'test-component--full']),
  generateAttributes: vi.fn(() => ({
    'data-skin-preset': 'minimal-frontier',
    'data-skin-pillar': 'frontier',
    'data-skin-motion': 'full',
  })),
  generateStyles: vi.fn(() => ({
    color: '#3b82f6',
    backgroundColor: '#ffffff',
  })),
};

// Test wrapper component
function TestWrapper({ children }: { children: ReactNode }) {
  return (
    <SkinSystemProvider>
      {children}
    </SkinSystemProvider>
  );
}

// Test component that uses the hook
function TestHookComponent({ 
  options = {},
  hookType = 'basic' 
}: { 
  options?: UseSkinSlotOptions; 
  hookType?: 'basic' | 'advanced' | 'classes' | 'attributes';
}) {
  let hookResult;
  
  switch (hookType) {
    case 'basic':
      hookResult = useBasicSkinSlot('TestComponent', mockBinding);
      break;
    case 'advanced':
      hookResult = useAdvancedSkinSlot('TestComponent', mockBinding, options);
      break;
    case 'classes':
      hookResult = useSkinClasses('TestComponent', mockBinding, options);
      break;
    case 'attributes':
      hookResult = useSkinAttributes('TestComponent', mockBinding, options);
      break;
    default:
      hookResult = useSkinSlot('TestComponent', mockBinding, options);
  }

  return (
    <div data-testid="test-result">
      <div data-testid="classes">{hookResult.classes.join(',')}</div>
      <div data-testid="className">{hookResult.className}</div>
      <div data-testid="attributes">{JSON.stringify(hookResult.attributes)}</div>
      <div data-testid="is-registered">{hookResult.isRegistered ? 'true' : 'false'}</div>
      <div data-testid="current-preset">{hookResult.currentPreset}</div>
      <div data-testid="current-pillar">{hookResult.currentPillar}</div>
      <div data-testid="current-motion">{hookResult.currentMotionLevel}</div>
    </div>
  );
}

// ============================================================================
// HOOK TESTS
// ============================================================================

describe('TS-002: SkinSlot & Hook Integration', () => {
  describe('useSkinSlot Hook', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should register component automatically with autoRegister=true', async () => {
      render(
        <TestWrapper>
          <TestHookComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockSkinSystem.registerComponent).toHaveBeenCalledWith(
          expect.objectContaining({
            componentId: 'TestComponent',
            name: 'Test Component',
          })
        );
      });
    });

    it('should not register component with autoRegister=false', async () => {
      render(
        <TestWrapper>
          <TestHookComponent options={{ autoRegister: false }} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockSkinSystem.registerComponent).not.toHaveBeenCalled();
      });
    });

    it('should generate classes, attributes, and styles', async () => {
      render(
        <TestWrapper>
          <TestHookComponent 
            options={{ 
              generateClasses: true, 
              generateAttributes: true, 
              generateStyles: true 
            }} 
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('classes').textContent).toBe('test-component,test-component--frontier,test-component--full');
        expect(screen.getByTestId('className').textContent).toBe('test-component test-component--frontier test-component--full');
        expect(JSON.parse(screen.getByTestId('attributes').textContent)).toEqual({
          'data-skin-preset': 'minimal-frontier',
          'data-skin-pillar': 'frontier',
          'data-skin-motion': 'full',
        });
      });
    });

    it('should handle registration errors', async () => {
      const errorMessage = 'Registration failed';
      mockSkinSystem.registerComponent.mockImplementation(() => {
        throw new Error(errorMessage);
      });

      const onError = vi.fn();
      
      render(
        <TestWrapper>
          <TestHookComponent options={{ onError }} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(expect.any(Error));
        expect(onError).toHaveBeenCalledWith(expect.objectContaining({
          message: errorMessage,
        }));
      });
    });

    it('should update properties correctly', async () => {
      let hookResult: any;
      
      function TestComponent() {
        hookResult = useSkinSlot('TestComponent', mockBinding);
        
        return (
          <button 
            data-testid="update-properties"
            onClick={() => hookResult.updateProperties({ newProp: 'newValue' })}
          >
            Update Properties
          </button>
        );
      }

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const initialRenderCount = hookResult.renderCount;
      
      fireEvent.click(screen.getByTestId('update-properties'));

      await waitFor(() => {
        expect(hookResult.renderCount).toBe(initialRenderCount + 1);
      });
    });

    it('should provide utility functions', async () => {
      let hookResult: any;
      
      function TestComponent() {
        hookResult = useSkinSlot('TestComponent', mockBinding);
        
        return (
          <div data-testid="test-result">
            <div data-testid="has-class">{hookResult.hasClass('test-component').toString()}</div>
            <div data-testid="get-attribute">{hookResult.getAttribute('data-skin-preset')}</div>
          </div>
        );
      }

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('has-class').textContent).toBe('true');
        expect(screen.getByTestId('get-attribute').textContent).toBe('minimal-frontier');
      });
    });
  });

  describe('Convenience Hooks', () => {
    it('useBasicSkinSlot should provide only basic data', async () => {
      render(
        <TestWrapper>
          <TestHookComponent hookType="basic" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('classes').textContent).toBe('test-component,test-component--frontier,test-component--full');
        expect(screen.getByTestId('className').textContent).toBe('test-component test-component--frontier test-component--full');
        expect(JSON.parse(screen.getByTestId('attributes').textContent)).toEqual({
          'data-skin-preset': 'minimal-frontier',
          'data-skin-pillar': 'frontier',
          'data-skin-motion': 'full',
        });
      });
    });

    it('useSkinClasses should provide only classes', async () => {
      render(
        <TestWrapper>
          <TestHookComponent hookType="classes" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('classes').textContent).toBe('test-component,test-component--frontier,test-component--full');
        expect(screen.getByTestId('className').textContent).toBe('test-component test-component--frontier test-component--full');
        expect(screen.getByTestId('is-registered').textContent).toBe('true');
      });
    });

    it('useSkinAttributes should provide only attributes', async () => {
      render(
        <TestWrapper>
          <TestHookComponent hookType="attributes" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(JSON.parse(screen.getByTestId('attributes').textContent)).toEqual({
          'data-skin-preset': 'minimal-frontier',
          'data-skin-pillar': 'frontier',
          'data-skin-motion': 'full',
        });
        expect(screen.getByTestId('is-registered').textContent).toBe('true');
      });
    });
  });

  describe('Component Integration', () => {
    it('BasicSkinSlot should render with skin classes and attributes', async () => {
      render(
        <TestWrapper>
          <BasicSkinSlot
            componentId="TestComponent"
            binding={mockBinding}
            className="additional-class"
            data-testid="skin-slot"
          >
            <div data-testid="child-content">Test Content</div>
          </BasicSkinSlot>
        </TestWrapper>
      );

      await waitFor(() => {
        const skinSlot = screen.getByTestId('skin-slot');
        expect(skinSlot).toHaveClass('test-component', 'test-component--frontier', 'test-component--full', 'additional-class');
        expect(skinSlot).toHaveAttribute('data-skin-preset', 'minimal-frontier');
        expect(skinSlot).toHaveAttribute('data-skin-pillar', 'frontier');
        expect(screen.getByTestId('child-content')).toBeInTheDocument();
      });
    });

    it('AdvancedSkinSlot should render with full skin integration', async () => {
      render(
        <TestWrapper>
          <AdvancedSkinSlot
            componentId="TestComponent"
            binding={mockBinding}
            className="additional-class"
            style={{ color: 'red' }}
            data-testid="skin-slot"
          >
            <div data-testid="child-content">Test Content</div>
          </AdvancedSkinSlot>
        </TestWrapper>
      );

      await waitFor(() => {
        const skinSlot = screen.getByTestId('skin-slot');
        expect(skinSlot).toHaveClass('test-component', 'test-component--frontier', 'test-component--full', 'additional-class');
        expect(skinSlot).toHaveAttribute('data-skin-preset', 'minimal-frontier');
        expect(skinSlot).toHaveStyle({ color: '#3b82f6', backgroundColor: '#ffffff' }); // Skin styles override
        expect(screen.getByTestId('child-content')).toBeInTheDocument();
      });
    });

    it('SkinSlot should choose basic or advanced mode correctly', async () => {
      render(
        <TestWrapper>
          <SkinSlot
            componentId="TestComponent"
            binding={mockBinding}
            data-testid="basic-skin-slot"
          >
            Basic
          </SkinSlot>
          <SkinSlot
            componentId="TestComponent"
            binding={mockBinding}
            useAdvanced={true}
            data-testid="advanced-skin-slot"
          >
            Advanced
          </SkinSlot>
        </TestWrapper>
      );

      await waitFor(() => {
        const basicSlot = screen.getByTestId('basic-skin-slot');
        const advancedSlot = screen.getByTestId('advanced-skin-slot');
        
        expect(basicSlot).toHaveClass('test-component', 'test-component--frontier', 'test-component--full');
        expect(advancedSlot).toHaveClass('test-component', 'test-component--frontier', 'test-component--full');
      });
    });

    it('ClassSkinSlot should only apply classes', async () => {
      render(
        <TestWrapper>
          <ClassSkinSlot
            componentId="TestComponent"
            binding={mockBinding}
            data-testid="class-skin-slot"
          >
            <div data-testid="child-content">Test Content</div>
          </ClassSkinSlot>
        </TestWrapper>
      );

      await waitFor(() => {
        const skinSlot = screen.getByTestId('class-skin-slot');
        expect(skinSlot).toHaveClass('test-component', 'test-component--frontier', 'test-component--full');
        expect(skinSlot).toHaveAttribute('data-skin-preset', 'minimal-frontier');
        expect(screen.getByTestId('child-content')).toBeInTheDocument();
      });
    });

    it('AttributeSkinSlot should only apply attributes', async () => {
      render(
        <TestWrapper>
          <AttributeSkinSlot
            componentId="TestComponent"
            binding={mockBinding}
            data-testid="attribute-skin-slot"
          >
            <div data-testid="child-content">Test Content</div>
          </AttributeSkinSlot>
        </TestWrapper>
      );

      await waitFor(() => {
        const skinSlot = screen.getByTestId('attribute-skin-slot');
        expect(skinSlot).toHaveAttribute('data-skin-preset', 'minimal-frontier');
        expect(screen.getByTestId('child-content')).toBeInTheDocument();
      });
    });

    it('StyleSkinSlot should only apply styles', async () => {
      render(
        <TestWrapper>
          <StyleSkinSlot
            componentId="TestComponent"
            binding={mockBinding}
            style={{ fontSize: '16px' }}
            data-testid="style-skin-slot"
          >
            <div data-testid="child-content">Test Content</div>
          </StyleSkinSlot>
        </TestWrapper>
      );

      await waitFor(() => {
        const skinSlot = screen.getByTestId('style-skin-slot');
        expect(skinSlot).toHaveStyle({ 
          color: '#3b82f6', 
          backgroundColor: '#ffffff',
          fontSize: '16px'
        });
        expect(screen.getByTestId('child-content')).toBeInTheDocument();
      });
    });
  });

  describe('Higher-Order Components', () => {
    it('withSkinSlot should wrap component with skin functionality', async () => {
      const TestComponent = ({ text }: { text: string }) => (
        <div data-testid="wrapped-component">{text}</div>
      );

      const WrappedComponent = withSkinSlot(
        TestComponent,
        'TestComponent',
        mockBinding
      );

      render(
        <TestWrapper>
          <WrappedComponent text="Test Content" />
        </TestWrapper>
      );

      await waitFor(() => {
        const wrappedComponent = screen.getByTestId('wrapped-component');
        expect(wrappedComponent.closest('[data-skin-preset]')).toBeInTheDocument();
        expect(wrappedComponent.textContent).toBe('Test Content');
      });
    });

    it('withBasicSkin should wrap component with basic skin functionality', async () => {
      const TestComponent = ({ text }: { text: string }) => (
        <div data-testid="wrapped-component">{text}</div>
      );

      const WrappedComponent = withBasicSkin(
        TestComponent,
        'TestComponent',
        mockBinding
      );

      render(
        <TestWrapper>
          <WrappedComponent text="Test Content" />
        </TestWrapper>
      );

      await waitFor(() => {
        const wrappedComponent = screen.getByTestId('wrapped-component');
        expect(wrappedComponent.closest('[data-skin-preset]')).toBeInTheDocument();
        expect(wrappedComponent.textContent).toBe('Test Content');
      });
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle multiple components efficiently', async () => {
      const components = Array.from({ length: 50 }, (_, i) => (
        <BasicSkinSlot
          key={i}
          componentId={`TestComponent${i}`}
          binding={{ ...mockBinding, componentId: `TestComponent${i}` }}
          data-testid={`skin-slot-${i}`}
        >
          <div>Component {i}</div>
        </BasicSkinSlot>
      ));

      const startTime = performance.now();
      
      render(
        <TestWrapper>
          {components}
        </TestWrapper>
      );

      await waitFor(() => {
        for (let i = 0; i < 50; i++) {
          expect(screen.getByTestId(`skin-slot-${i}`)).toBeInTheDocument();
        }
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should render 50 components in under 100ms
      expect(duration).toBeLessThan(100);
    });

    it('should handle null/undefined children gracefully', async () => {
      render(
        <TestWrapper>
          <BasicSkinSlot
            componentId="TestComponent"
            binding={mockBinding}
            data-testid="skin-slot"
          >
            {null}
          </BasicSkinSlot>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('skin-slot')).toBeInTheDocument();
        expect(screen.getByTestId('skin-slot')).toBeEmptyDOMElement();
      });
    });

    it('should handle invalid binding gracefully', async () => {
      const invalidBinding = {
        ...mockBinding,
        componentId: '',
        name: '',
      };

      render(
        <TestWrapper>
          <BasicSkinSlot
            componentId="InvalidComponent"
            binding={invalidBinding}
            data-testid="skin-slot"
          >
            <div>Test Content</div>
          </BasicSkinSlot>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('skin-slot')).toBeInTheDocument();
        expect(screen.getByTestId('skin-slot')).toHaveTextContent('Test Content');
      });
    });
  });

  describe('Lifecycle Management', () => {
    it('should unregister component on unmount', async () => {
      const { unmount } = render(
        <TestWrapper>
          <TestHookComponent options={{ autoUnregister: true }} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockSkinSystem.registerComponent).toHaveBeenCalled();
      });

      unmount();

      await waitFor(() => {
        expect(mockSkinSystem.unregisterComponent).toHaveBeenCalledWith('TestComponent');
      });
    });

    it('should not unregister component with autoUnregister=false', async () => {
      const { unmount } = render(
        <TestWrapper>
          <TestHookComponent options={{ autoUnregister: false }} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockSkinSystem.registerComponent).toHaveBeenCalled();
      });

      unmount();

      await waitFor(() => {
        expect(mockSkinSystem.unregisterComponent).not.toHaveBeenCalled();
      });
    });
  });
});
