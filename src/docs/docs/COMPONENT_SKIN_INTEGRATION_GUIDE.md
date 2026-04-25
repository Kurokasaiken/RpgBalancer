# Component Skin Integration Guide

## Overview

This guide provides practical examples and patterns for integrating skin binding into certified components. It follows the established patterns from the Skin Binding Registry and demonstrates how to apply consistent skin behavior across the Idle Village roster.

## Prerequisites

Before integrating skin binding into a component, ensure:

1. The component is certified in the Skin Binding Registry
2. The component ID is added to the `CertifiedComponentId` type
3. The component has a binding configuration in `CERTIFIED_COMPONENT_BINDINGS`
4. Required hooks and utilities are imported

## Integration Pattern

### Basic Integration Template

```typescript
import { useEffect } from 'react';
import { useSkinDataAttributes, useSkinTelemetry } from '@/ui/idleVillage/hooks/useSkinHarness';
import { getComponentSkinBinding, generateSkinClassName, type CertifiedComponentId } from '@/ui/idleVillage/skins/SkinBindingRegistry';

interface ComponentProps {
  // Component props
}

function Component(props: ComponentProps) {
  // 1. Get skin data attributes and telemetry
  const skinDataAttributes = useSkinDataAttributes();
  const { trackComponentEvent } = useSkinTelemetry('Component' as CertifiedComponentId);
  
  // 2. Get component binding and generate classes
  const skinBinding = getComponentSkinBinding('Component' as CertifiedComponentId);
  const skinClassName = generateSkinClassName('Component' as CertifiedComponentId, 
    skinDataAttributes['data-skin-preset'] as any, 
    skinDataAttributes['data-skin-pillar'] as any
  );

  // 3. Track telemetry events
  useEffect(() => {
    trackComponentEvent('rendered', {
      componentId: 'Component',
      skinBinding: skinBinding.componentId,
      // Additional context
    });
  }, [trackComponentEvent, skinBinding.componentId]);

  // 4. Apply to component root
  return (
    <div 
      className={`${baseClasses} ${skinClassName}`}
      {...skinDataAttributes}
    >
      {/* Component content */}
    </div>
  );
}
```

## Component Examples

### PgCard Integration

```typescript
import { useRef, memo, useCallback, useMemo, useEffect } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { useSkinDataAttributes, useSkinTelemetry } from '@/ui/idleVillage/hooks/useSkinHarness';
import { getComponentSkinBinding, generateSkinClassName, type CertifiedComponentId } from '@/ui/idleVillage/skins/SkinBindingRegistry';
// ... other imports

const PgCard = memo<PgCardProps>(({  
  workerId,
  label,
  // ... other props
}) => {
  // Skin binding integration
  const skinDataAttributes = useSkinDataAttributes();
  const { trackComponentEvent } = useSkinTelemetry('PgCard' as CertifiedComponentId);
  const skinBinding = getComponentSkinBinding('PgCard' as CertifiedComponentId);
  const skinClassName = generateSkinClassName('PgCard' as CertifiedComponentId, 
    skinDataAttributes['data-skin-preset'] as any, 
    skinDataAttributes['data-skin-pillar'] as any
  );

  // Existing component logic
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: workerId,
    disabled: disabled || !isInteractive,
  });

  // Skin telemetry events
  useEffect(() => {
    trackComponentEvent('rendered', {
      workerId,
      label,
      hp,
      fatigue,
      isDragging,
      disabled,
      horizontal,
      hasPortrait,
      skinBinding: skinBinding.componentId,
    });
  }, [workerId, label, hp, fatigue, isDragging, disabled, horizontal, hasPortrait, skinBinding.componentId, trackComponentEvent]);

  useEffect(() => {
    if (isDragging) {
      trackComponentEvent('drag_start', {
        workerId,
        label,
        skinBinding: skinBinding.componentId,
      });
    }
  }, [isDragging, workerId, label, skinBinding.componentId, trackComponentEvent]);

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={[
        baseTokenClasses,
        compatibilityAccentClass,
        isUnavailable ? 'cursor-not-allowed opacity-35 grayscale' : 'cursor-grab active:cursor-grabbing active:scale-95 hover:border-emerald-300/70',
        returningOverlayClass,
        isDragging ? 'opacity-40' : '',
        skinClassName, // Add skin-specific classes
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      // Add skin data attributes
      {...skinDataAttributes}
      // ... other props
    >
      {/* Component content */}
    </div>
  );
});
```

### ResidentSlotRack Integration

```typescript
import { useEffect } from 'react';
import { useSkinDataAttributes, useSkinTelemetry } from '@/ui/idleVillage/hooks/useSkinHarness';
import { getComponentSkinBinding, generateSkinClassName, type CertifiedComponentId } from '@/ui/idleVillage/skins/SkinBindingRegistry';

interface ResidentSlotRackProps {
  slots: SlotData[];
  onSlotAssign?: (slotId: string, residentId: string) => void;
  // ... other props
}

function ResidentSlotRack({ slots, onSlotAssign, ...props }: ResidentSlotRackProps) {
  // Skin binding integration
  const skinDataAttributes = useSkinDataAttributes();
  const { trackComponentEvent } = useSkinTelemetry('ResidentSlotRack' as CertifiedComponentId);
  const skinBinding = getComponentSkinBinding('ResidentSlotRack' as CertifiedComponentId);
  const skinClassName = generateSkinClassName('ResidentSlotRack' as CertifiedComponentId, 
    skinDataAttributes['data-skin-preset'] as any, 
    skinDataAttributes['data-skin-pillar'] as any
  );

  // Track slot assignment events
  const handleSlotAssign = useCallback((slotId: string, residentId: string) => {
    trackComponentEvent('slot_assigned', {
      slotId,
      residentId,
      totalSlots: slots.length,
      skinBinding: skinBinding.componentId,
    });
    
    onSlotAssign?.(slotId, residentId);
  }, [slots.length, skinBinding.componentId, trackComponentEvent, onSlotAssign]);

  // Track rack rendering
  useEffect(() => {
    trackComponentEvent('rendered', {
      totalSlots: slots.length,
      occupiedSlots: slots.filter(slot => slot.residentId).length,
      skinBinding: skinBinding.componentId,
    });
  }, [slots, skinBinding.componentId, trackComponentEvent]);

  return (
    <div 
      className={`slot-rack ${skinClassName}`}
      {...skinDataAttributes}
      data-slot-count={slots.length}
    >
      {slots.map(slot => (
        <Slot
          key={slot.id}
          slot={slot}
          onAssign={handleSlotAssign}
          skinDataAttributes={skinDataAttributes}
        />
      ))}
    </div>
  );
}
```

### TimeEngineStrip Integration

```typescript
import { useEffect } from 'react';
import { useSkinDataAttributes, useSkinTelemetry } from '@/ui/idleVillage/hooks/useSkinHarness';
import { getComponentSkinBinding, generateSkinClassName, type CertifiedComponentId } from '@/ui/idleVillage/skins/SkinBindingRegistry';

interface TimeEngineStripProps {
  currentTime: number;
  isRunning: boolean;
  onTick?: (time: number) => void;
  // ... other props
}

function TimeEngineStrip({ currentTime, isRunning, onTick, ...props }: TimeEngineStripProps) {
  // Skin binding integration
  const skinDataAttributes = useSkinDataAttributes();
  const { trackComponentEvent } = useSkinTelemetry('TimeEngineStrip' as CertifiedComponentId);
  const skinBinding = getComponentSkinBinding('TimeEngineStrip' as CertifiedComponentId);
  const skinClassName = generateSkinClassName('TimeEngineStrip' as CertifiedComponentId, 
    skinDataAttributes['data-skin-preset'] as any, 
    skinDataAttributes['data-skin-pillar'] as any
  );

  // Track time engine events
  useEffect(() => {
    trackComponentEvent('rendered', {
      currentTime,
      isRunning,
      skinBinding: skinBinding.componentId,
    });
  }, [currentTime, isRunning, skinBinding.componentId, trackComponentEvent]);

  useEffect(() => {
    if (isRunning) {
      trackComponentEvent('tick', {
        currentTime,
        skinBinding: skinBinding.componentId,
      });
    }
  }, [currentTime, isRunning, skinBinding.componentId, trackComponentEvent]);

  return (
    <div 
      className={`time-engine-strip ${skinClassName}`}
      {...skinDataAttributes}
      data-time={currentTime}
      data-running={isRunning}
    >
      <div className="time-display">
        {formatTime(currentTime)}
      </div>
      <div className="engine-controls">
        {/* Engine controls */}
      </div>
    </div>
  );
}
```

### ActiveHUD Integration

```typescript
import { useEffect } from 'react';
import { useSkinDataAttributes, useSkinTelemetry } from '@/ui/idleVillage/hooks/useSkinHarness';
import { getComponentSkinBinding, generateSkinClassName, type CertifiedComponentId } from '@/ui/idleVillage/skins/SkinBindingRegistry';

interface ActiveHUDProps {
  activities: ActivityData[];
  selectedActivity?: string;
  onActivitySelect?: (activityId: string) => void;
  // ... other props
}

function ActiveHUD({ activities, selectedActivity, onActivitySelect, ...props }: ActiveHUDProps) {
  // Skin binding integration
  const skinDataAttributes = useSkinDataAttributes();
  const { trackComponentEvent } = useSkinTelemetry('ActiveHUD' as CertifiedComponentId);
  const skinBinding = getComponentSkinBinding('ActiveHUD' as CertifiedComponentId);
  const skinClassName = generateSkinClassName('ActiveHUD' as CertifiedComponentId, 
    skinDataAttributes['data-skin-preset'] as any, 
    skinDataAttributes['data-skin-pillar'] as any
  );

  // Track HUD events
  useEffect(() => {
    trackComponentEvent('rendered', {
      activityCount: activities.length,
      selectedActivity,
      skinBinding: skinBinding.componentId,
    });
  }, [activities.length, selectedActivity, skinBinding.componentId, trackComponentEvent]);

  const handleActivitySelect = useCallback((activityId: string) => {
    trackComponentEvent('activity_selected', {
      activityId,
      previousActivity: selectedActivity,
      skinBinding: skinBinding.componentId,
    });
    
    onActivitySelect?.(activityId);
  }, [selectedActivity, skinBinding.componentId, trackComponentEvent, onActivitySelect]);

  return (
    <div 
      className={`active-hud ${skinClassName}`}
      {...skinDataAttributes}
      data-activity-count={activities.length}
    >
      <div className="hud-header">
        <h3>Active Activities</h3>
      </div>
      <div className="activity-list">
        {activities.map(activity => (
          <ActivityItem
            key={activity.id}
            activity={activity}
            isSelected={activity.id === selectedActivity}
            onSelect={handleActivitySelect}
            skinDataAttributes={skinDataAttributes}
          />
        ))}
      </div>
    </div>
  );
}
```

### ActivityCapsule Integration

```typescript
import { useEffect } from 'react';
import { useSkinDataAttributes, useSkinTelemetry } from '@/ui/idleVillage/hooks/useSkinHarness';
import { getComponentSkinBinding, generateSkinClassName, type CertifiedComponentId } from '@/ui/idleVillage/skins/SkinBindingRegistry';

interface ActivityCapsuleProps {
  activity: ActivityData;
  isCompact?: boolean;
  onClick?: (activity: ActivityData) => void;
  // ... other props
}

function ActivityCapsule({ activity, isCompact = false, onClick, ...props }: ActivityCapsuleProps) {
  // Skin binding integration
  const skinDataAttributes = useSkinDataAttributes();
  const { trackComponentEvent } = useSkinTelemetry('ActivityCapsule' as CertifiedComponentId);
  const skinBinding = getComponentSkinBinding('ActivityCapsule' as CertifiedComponentId);
  const skinClassName = generateSkinClassName('ActivityCapsule' as CertifiedComponentId, 
    skinDataAttributes['data-skin-preset'] as any, 
    skinDataAttributes['data-skin-pillar'] as any
  );

  // Track capsule events
  useEffect(() => {
    trackComponentEvent('rendered', {
      activityId: activity.id,
      activityType: activity.type,
      isCompact,
      skinBinding: skinBinding.componentId,
    });
  }, [activity.id, activity.type, isCompact, skinBinding.componentId, trackComponentEvent]);

  const handleClick = useCallback(() => {
    trackComponentEvent('click', {
      activityId: activity.id,
      activityType: activity.type,
      skinBinding: skinBinding.componentId,
    });
    
    onClick?.(activity);
  }, [activity, skinBinding.componentId, trackComponentEvent, onClick]);

  return (
    <div 
      className={`activity-capsule ${isCompact ? 'compact' : ''} ${skinClassName}`}
      {...skinDataAttributes}
      onClick={handleClick}
      data-activity-id={activity.id}
      data-activity-type={activity.type}
      data-compact={isCompact}
    >
      <div className="capsule-content">
        <div className="activity-icon">
          {activity.icon}
        </div>
        <div className="activity-info">
          <h4>{activity.name}</h4>
          <p>{activity.description}</p>
        </div>
        <div className="activity-progress">
          {activity.progress && (
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${activity.progress}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

### ActionHalo Integration

```typescript
import { useEffect } from 'react';
import { useSkinDataAttributes, useSkinTelemetry } from '@/ui/idleVillage/hooks/useSkinHarness';
import { getComponentSkinBinding, generateSkinClassName, type CertifiedComponentId } from '@/ui/idleVillage/skins/SkinBindingRegistry';

interface ActionHaloProps {
  isActive: boolean;
  intensity?: number;
  onActivate?: () => void;
  onDeactivate?: () => void;
  // ... other props
}

function ActionHalo({ isActive, intensity = 1.0, onActivate, onDeactivate, ...props }: ActionHaloProps) {
  // Skin binding integration
  const skinDataAttributes = useSkinDataAttributes();
  const { trackComponentEvent } = useSkinTelemetry('ActionHalo' as CertifiedComponentId);
  const skinBinding = getComponentSkinBinding('ActionHalo' as CertifiedComponentId);
  const skinClassName = generateSkinClassName('ActionHalo' as CertifiedComponentId, 
    skinDataAttributes['data-skin-preset'] as any, 
    skinDataAttributes['data-skin-pillar'] as any
  );

  // Track halo events
  useEffect(() => {
    trackComponentEvent('rendered', {
      isActive,
      intensity,
      skinBinding: skinBinding.componentId,
    });
  }, [isActive, intensity, skinBinding.componentId, trackComponentEvent]);

  useEffect(() => {
    if (isActive) {
      trackComponentEvent('activated', {
        intensity,
        skinBinding: skinBinding.componentId,
      });
      onActivate?.();
    } else {
      trackComponentEvent('deactivated', {
        skinBinding: skinBinding.componentId,
      });
      onDeactivate?.();
    }
  }, [isActive, intensity, skinBinding.componentId, trackComponentEvent, onActivate, onDeactivate]);

  return (
    <div 
      className={`action-halo ${isActive ? 'active' : 'inactive'} ${skinClassName}`}
      {...skinDataAttributes}
      data-active={isActive}
      data-intensity={intensity}
      style={{
        opacity: isActive ? intensity : 0.3,
      }}
    >
      <div className="halo-ring">
        <div className="halo-pulse" />
      </div>
      <div className="halo-content">
        {/* Halo content */}
      </div>
    </div>
  );
}
```

### SlottedMedal Integration

```typescript
import { useEffect } from 'react';
import { useSkinDataAttributes, useSkinTelemetry } from '@/ui/idleVillage/hooks/useSkinHarness';
import { getComponentSkinBinding, generateSkinClassName, type CertifiedComponentId } from '@/ui/idleVillage/skins/SkinBindingRegistry';

interface SlottedMedalProps {
  slotId: string;
  resident?: ResidentData;
  isAnimating?: boolean;
  onSlotClick?: (slotId: string) => void;
  // ... other props
}

function SlottedMedal({ slotId, resident, isAnimating = false, onSlotClick, ...props }: SlottedMedalProps) {
  // Skin binding integration
  const skinDataAttributes = useSkinDataAttributes();
  const { trackComponentEvent } = useSkinTelemetry('SlottedMedal' as CertifiedComponentId);
  const skinBinding = getComponentSkinBinding('SlottedMedal' as CertifiedComponentId);
  const skinClassName = generateSkinClassName('SlottedMedal' as CertifiedComponentId, 
    skinDataAttributes['data-skin-preset'] as any, 
    skinDataAttributes['data-skin-pillar'] as any
  );

  // Track medal events
  useEffect(() => {
    trackComponentEvent('rendered', {
      slotId,
      hasResident: !!resident,
      isAnimating,
      skinBinding: skinBinding.componentId,
    });
  }, [slotId, !!resident, isAnimating, skinBinding.componentId, trackComponentEvent]);

  const handleSlotClick = useCallback(() => {
    trackComponentEvent('slot_click', {
      slotId,
      hasResident: !!resident,
      skinBinding: skinBinding.componentId,
    });
    
    onSlotClick?.(slotId);
  }, [slotId, !!resident, skinBinding.componentId, trackComponentEvent, onSlotClick]);

  return (
    <div 
      className={`slotted-medal ${isAnimating ? 'animating' : ''} ${skinClassName}`}
      {...skinDataAttributes}
      onClick={handleSlotClick}
      data-slot-id={slotId}
      data-has-resident={!!resident}
      data-animating={isAnimating}
    >
      <div className="medal-base">
        <div className="medal-ring" />
        <div className="medal-core">
          {resident ? (
            <div className="resident-display">
              <img src={resident.portrait} alt={resident.name} />
              <span className="resident-name">{resident.name}</span>
            </div>
          ) : (
            <div className="empty-slot">
              <span className="slot-label">Empty</span>
            </div>
          )}
        </div>
        {isAnimating && (
          <div className="medal-animation">
            <div className="completion-flash" />
            <div className="halo-effect" />
          </div>
        )}
      </div>
    </div>
  );
}
```

### VillageRosterSection Integration

```typescript
import { useEffect } from 'react';
import { useSkinDataAttributes, useSkinTelemetry } from '@/ui/idleVillage/hooks/useSkinHarness';
import { getComponentSkinBinding, generateSkinClassName, type CertifiedComponentId } from '@/ui/idleVillage/skins/SkinBindingRegistry';

interface VillageRosterSectionProps {
  residents: ResidentData[];
  selectedResident?: string;
  onResidentSelect?: (residentId: string) => void;
  layoutDensity?: 'compact' | 'normal' | 'spacious';
  // ... other props
}

function VillageRosterSection({ 
  residents, 
  selectedResident, 
  onResidentSelect, 
  layoutDensity = 'normal',
  ...props 
}: VillageRosterSectionProps) {
  // Skin binding integration
  const skinDataAttributes = useSkinDataAttributes();
  const { trackComponentEvent } = useSkinTelemetry('VillageRosterSection' as CertifiedComponentId);
  const skinBinding = getComponentSkinBinding('VillageRosterSection' as CertifiedComponentId);
  const skinClassName = generateSkinClassName('VillageRosterSection' as CertifiedComponentId, 
    skinDataAttributes['data-skin-preset'] as any, 
    skinDataAttributes['data-skin-pillar'] as any
  );

  // Track section events
  useEffect(() => {
    trackComponentEvent('rendered', {
      residentCount: residents.length,
      selectedResident,
      layoutDensity,
      skinBinding: skinBinding.componentId,
    });
  }, [residents.length, selectedResident, layoutDensity, skinBinding.componentId, trackComponentEvent]);

  const handleResidentSelect = useCallback((residentId: string) => {
    trackComponentEvent('resident_selected', {
      residentId,
      previousResident: selectedResident,
      skinBinding: skinBinding.componentId,
    });
    
    onResidentSelect?.(residentId);
  }, [selectedResident, skinBinding.componentId, trackComponentEvent, onResidentSelect]);

  return (
    <div 
      className={`village-roster-section layout-${layoutDensity} ${skinClassName}`}
      {...skinDataAttributes}
      data-resident-count={residents.length}
      data-layout-density={layoutDensity}
    >
      <div className="roster-header">
        <h2>Village Roster</h2>
        <div className="roster-stats">
          <span>{residents.length} Residents</span>
        </div>
      </div>
      <div className="roster-grid">
        {residents.map(resident => (
          <PgCard
            key={resident.id}
            workerId={resident.id}
            label={resident.name}
            hp={resident.hp}
            fatigue={resident.fatigue}
            onSelect={handleResidentSelect}
            isSelected={resident.id === selectedResident}
            skinDataAttributes={skinDataAttributes}
          />
        ))}
      </div>
    </div>
  );
}
```

## Advanced Integration Patterns

### Motion Level Support

```typescript
function MotionAwareComponent() {
  const skinDataAttributes = useSkinDataAttributes();
  const { trackComponentEvent } = useSkinTelemetry('MotionAwareComponent' as CertifiedComponentId);
  const skinBinding = getComponentSkinBinding('MotionAwareComponent' as CertifiedComponentId);
  
  const motionLevel = skinDataAttributes['data-motion-level'] as string;
  const shouldAnimate = motionLevel !== 'minimal';
  
  useEffect(() => {
    trackComponentEvent('motion_level_changed', {
      motionLevel,
      supportsAnimation: shouldAnimate,
      skinBinding: skinBinding.componentId,
    });
  }, [motionLevel, shouldAnimate, skinBinding.componentId, trackComponentEvent]);

  return (
    <div 
      className={`motion-aware-component ${shouldAnimate ? 'animations-enabled' : 'animations-disabled'}`}
      {...skinDataAttributes}
    >
      <div className={`content ${shouldAnimate ? 'animated' : 'static'}`}>
        {/* Component content */}
      </div>
    </div>
  );
}
```

### Conditional Skin Features

```typescript
function ConditionalSkinComponent() {
  const skinDataAttributes = useSkinDataAttributes();
  const { trackComponentEvent } = useSkinTelemetry('ConditionalSkinComponent' as CertifiedComponentId);
  const skinBinding = getComponentSkinBinding('ConditionalSkinComponent' as CertifiedComponentId);
  
  const currentPreset = skinDataAttributes['data-skin-preset'] as string;
  const currentPillar = skinDataAttributes['data-skin-pillar'] as string;
  
  // Component-specific features based on preset/pillar
  const showAdvancedFeatures = currentPreset === 'wanderlust';
  const useWildernessTheme = currentPillar === 'wilderness';
  
  useEffect(() => {
    trackComponentEvent('skin_features_determined', {
      preset: currentPreset,
      pillar: currentPillar,
      showAdvancedFeatures,
      useWildernessTheme,
      skinBinding: skinBinding.componentId,
    });
  }, [currentPreset, currentPillar, showAdvancedFeatures, useWildernessTheme, skinBinding.componentId, trackComponentEvent]);

  return (
    <div 
      className={`conditional-skin-component ${showAdvancedFeatures ? 'advanced' : 'basic'} ${useWildernessTheme ? 'wilderness' : 'default'}`}
      {...skinDataAttributes}
    >
      {showAdvancedFeatures && (
        <div className="advanced-features">
          {/* Advanced UI elements */}
        </div>
      )}
      
      <div className={`content ${useWildernessTheme ? 'wilderness-styled' : 'default-styled'}`}>
        {/* Component content */}
      </div>
    </div>
  );
}
```

### Performance-Optimized Integration

```typescript
import { useMemo, useCallback } from 'react';

function OptimizedComponent({ data, ...props }) {
  const skinDataAttributes = useSkinDataAttributes();
  const { trackComponentEvent } = useSkinTelemetry('OptimizedComponent' as CertifiedComponentId);
  const skinBinding = getComponentSkinBinding('OptimizedComponent' as CertifiedComponentId);
  
  // Memoize expensive calculations
  const expensiveValue = useMemo(() => {
    return computeExpensiveValue(data);
  }, [data]);
  
  // Memoize skin class generation
  const skinClassName = useMemo(() => {
    return generateSkinClassName('OptimizedComponent' as CertifiedComponentId, 
      skinDataAttributes['data-skin-preset'] as any, 
      skinDataAttributes['data-skin-pillar'] as any
    );
  }, [skinDataAttributes['data-skin-preset'], skinDataAttributes['data-skin-pillar']]);
  
  // Throttle telemetry events
  const throttledTrackEvent = useCallback(
    throttle((eventName: string, payload: any) => {
      trackComponentEvent(eventName, payload);
    }, 100),
    [trackComponentEvent]
  );
  
  useEffect(() => {
    throttledTrackEvent('rendered', {
      dataLength: data.length,
      expensiveValue,
      skinBinding: skinBinding.componentId,
    });
  }, [data.length, expensiveValue, skinBinding.componentId, throttledTrackEvent]);

  return (
    <div 
      className={`optimized-component ${skinClassName}`}
      {...skinDataAttributes}
    >
      <div className="expensive-content">
        {expensiveValue}
      </div>
    </div>
  );
}

// Utility function for throttling
function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastExecTime = 0;
  
  return (...args: Parameters<T>) => {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
        timeoutId = null;
      }, delay - (currentTime - lastExecTime));
    }
  };
}
```

## Testing Integration

### Unit Test Template

```typescript
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { Component } from './Component';
import { SkinBindingProvider } from '@/ui/idleVillage/hooks/useSkinHarness';

// Mock skin harness
vi.mock('@/ui/idleVillage/hooks/useSkinHarness', () => ({
  useSkinDataAttributes: vi.fn(() => ({
    'data-skin-preset': 'minimal-frontier',
    'data-skin-pillar': 'frontier',
    'data-motion-level': 'full',
  })),
  useSkinTelemetry: vi.fn(() => ({
    trackComponentEvent: vi.fn(),
  })),
}));

// Mock skin binding registry
vi.mock('@/ui/idleVillage/skins/SkinBindingRegistry', () => ({
  getComponentSkinBinding: vi.fn(() => ({
    componentId: 'Component',
    defaultPreset: 'minimal-frontier',
    supportedPillars: ['frontier', 'wilderness', 'empire'],
    cssClassBase: 'component-skin',
    dataAttributePrefix: 'component',
    supportsMotionLevel: true,
    supportsTelemetry: true,
  })),
  generateSkinClassName: vi.fn(() => 'component-skin-minimal-frontier component-skin-frontier'),
}));

describe('Component', () => {
  it('should render with skin binding', () => {
    render(
      <SkinBindingProvider>
        <Component data-testid="component" />
      </SkinBindingProvider>
    );
    
    const component = screen.getByTestId('component');
    
    // Check for skin data attributes
    expect(component).toHaveAttribute('data-skin-preset', 'minimal-frontier');
    expect(component).toHaveAttribute('data-skin-pillar', 'frontier');
    expect(component).toHaveAttribute('data-motion-level', 'full');
    
    // Check for skin classes
    expect(component).toHaveClass('component-skin-minimal-frontier');
    expect(component).toHaveClass('component-skin-frontier');
  });
  
  it('should track telemetry events', () => {
    const mockTrackEvent = vi.fn();
    
    vi.mocked(require('@/ui/idleVillage/hooks/useSkinHarness').useSkinTelemetry).mockReturnValue({
      trackComponentEvent: mockTrackEvent,
    });
    
    render(
      <SkinBindingProvider>
        <Component data-testid="component" />
      </SkinBindingProvider>
    );
    
    expect(mockTrackEvent).toHaveBeenCalledWith('rendered', {
      componentId: 'Component',
      skinBinding: 'Component',
    });
  });
});
```

### Integration Test Template

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { Component } from './Component';
import { SkinBindingProvider } from '@/ui/idleVillage/hooks/useSkinHarness';

describe('Component Integration', () => {
  it('should handle skin changes', async () => {
    const { rerender } = render(
      <SkinBindingProvider initialPreset="minimal-frontier">
        <Component data-testid="component" />
      </SkinBindingProvider>
    );
    
    const component = screen.getByTestId('component');
    
    // Initial state
    expect(component).toHaveAttribute('data-skin-preset', 'minimal-frontier');
    
    // Change skin preset
    rerender(
      <SkinBindingProvider initialPreset="wanderlust">
        <Component data-testid="component" />
      </SkinBindingProvider>
    );
    
    // Updated state
    expect(component).toHaveAttribute('data-skin-preset', 'wanderlust');
  });
  
  it('should handle pillar changes', async () => {
    const { rerender } = render(
      <SkinBindingProvider initialPillar="frontier">
        <Component data-testid="component" />
      </SkinBindingProvider>
    );
    
    const component = screen.getByTestId('component');
    
    // Initial state
    expect(component).toHaveAttribute('data-skin-pillar', 'frontier');
    
    // Change pillar
    rerender(
      <SkinBindingProvider initialPillar="wilderness">
        <Component data-testid="component" />
      </SkinBindingProvider>
    );
    
    // Updated state
    expect(component).toHaveAttribute('data-skin-pillar', 'wilderness');
  });
});
```

## Best Practices

### 1. Import Organization
```typescript
// React imports
import { useEffect, useCallback, useMemo } from 'react';

// Skin binding imports
import { useSkinDataAttributes, useSkinTelemetry } from '@/ui/idleVillage/hooks/useSkinHarness';
import { getComponentSkinBinding, generateSkinClassName, type CertifiedComponentId } from '@/ui/idleVillage/skins/SkinBindingRegistry';

// Component-specific imports
// ... other imports
```

### 2. Telemetry Event Naming
```typescript
// Use consistent event naming
trackComponentEvent('rendered', { ... });      // Component mount/update
trackComponentEvent('click', { ... });          // User interactions
trackComponentEvent('drag_start', { ... });     // Drag operations
trackComponentEvent('drag_end', { ... });       // Drag completion
trackComponentEvent('state_change', { ... });   // State updates
trackComponentEvent('error', { ... });          // Error conditions
```

### 3. Performance Optimization
```typescript
// Memoize expensive calculations
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// Memoize skin class generation
const skinClassName = useMemo(() => {
  return generateSkinClassName('Component' as CertifiedComponentId, 
    skinDataAttributes['data-skin-preset'] as any, 
    skinDataAttributes['data-skin-pillar'] as any
  );
}, [skinDataAttributes['data-skin-preset'], skinDataAttributes['data-skin-pillar']]);

// Throttle high-frequency events
const throttledTrackEvent = useCallback(
  throttle(trackComponentEvent, 100),
  [trackComponentEvent]
);
```

### 4. Error Handling
```typescript
function RobustComponent() {
  const skinDataAttributes = useSkinDataAttributes();
  const { trackComponentEvent } = useSkinTelemetry('RobustComponent' as CertifiedComponentId);
  
  let skinBinding;
  try {
    skinBinding = getComponentSkinBinding('RobustComponent' as CertifiedComponentId);
  } catch (error) {
    console.error('Failed to get skin binding:', error);
    // Fallback behavior
    return <div className="fallback-component">Component unavailable</div>;
  }
  
  // Continue with normal integration
}
```

### 5. TypeScript Safety
```typescript
// Always use CertifiedComponentId type
const componentId: CertifiedComponentId = 'PgCard';

// Don't use string literals
const badId = 'PgCard' as string; // ❌ Wrong

// Use proper type assertions
const goodId = 'PgCard' as CertifiedComponentId; // ✅ Correct

// Type-safe skin properties
const skinProperties = skinBinding.skinProperties || {};
const materialType = skinProperties.materialType as string;
```

## Troubleshooting

### Common Issues and Solutions

1. **Skin classes not applying**
   - Check if `generateSkinClassName` is called correctly
   - Verify component is certified in the registry
   - Ensure CSS is loaded for the skin

2. **Telemetry events not firing**
   - Verify `useSkinTelemetry` hook is called
   - Check if component supports telemetry
   - Ensure events are tracked in correct lifecycle

3. **Type errors**
   - Use `CertifiedComponentId` type for component IDs
   - Check import paths are correct
   - Verify type assertions are proper

4. **Performance issues**
   - Use `useMemo` for expensive calculations
   - Throttle high-frequency events
   - Consider lazy loading for non-critical components

### Debug Mode

Enable debug mode to troubleshoot skin integration:

```typescript
const skinHarness = useSkinHarness({
  enableTelemetry: true,
  // Debug mode will log all skin-related events
});

// Or check debug state
if (process.env.NODE_ENV === 'development') {
  console.log('Skin data attributes:', skinDataAttributes);
  console.log('Skin binding:', skinBinding);
}
```

## Conclusion

Following these integration patterns ensures consistent skin behavior across all certified components. The established patterns provide a robust foundation for skin binding while maintaining flexibility for future enhancements.

For more information, see the Skin Binding Registry Guide and the roster trusted components documentation.
