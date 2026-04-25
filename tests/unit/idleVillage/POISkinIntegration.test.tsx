import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ActivityCapsule } from '@/ui/idleVillage/components/ActivityCapsule';
import { StyleLabSurface } from '@/ui/styleLab/StyleLabSurface';

describe('POI Skin Integration', () => {
  it('should render POI visualization when enabled', () => {
    const mockSlots = [
      {
        slotId: 'slot-1',
        isOccupied: false,
        isLocked: false,
      },
    ];

    render(
      <StyleLabSurface>
        <ActivityCapsule
          activityId="test-poi"
          label="Test POI"
          slots={mockSlots}
          maxSlots={1}
          progressFraction={0.5}
          elapsedSeconds={60}
          totalDurationSeconds={120}
          status="in-progress"
          canCollect={false}
          enablePoiVisualization={true}
          poiSkinId="poi_wilderness_amber"
          dataTestId="test-poi-capsule"
        />
      </StyleLabSurface>
    );

    // Check if POI visualization is rendered
    const poiVisualization = screen.getByTestId('poi-visualization');
    expect(poiVisualization).toBeInTheDocument();
    
    // Check if SVG with data-poi attribute is present
    const poiSvg = poiVisualization.querySelector('[data-poi]');
    expect(poiSvg).toBeInTheDocument();
    
    // Check if all slot groups are present
    const expectedSlots = [
      '[data-slot="stone"]',
      '[data-slot="rim"]', 
      '[data-slot="corona-glow"]',
      '[data-slot="corona-turb-a"]',
      '[data-slot="corona-turb-b"]',
      '[data-slot="corona-reflect"]',
      '[data-slot="pin"]',
      '[data-slot="particles"]'
    ];
    
    expectedSlots.forEach(slotSelector => {
      const slot = poiSvg.querySelector(slotSelector);
      expect(slot).toBeInTheDocument();
    });
  });

  it('should not render POI visualization when disabled', () => {
    const mockSlots = [
      {
        slotId: 'slot-1',
        isOccupied: false,
        isLocked: false,
      },
    ];

    render(
      <StyleLabSurface>
        <ActivityCapsule
          activityId="test-no-poi"
          label="Test No POI"
          icon="🜂"
          slots={mockSlots}
          maxSlots={1}
          progressFraction={0.5}
          elapsedSeconds={60}
          totalDurationSeconds={120}
          status="in-progress"
          canCollect={false}
          enablePoiVisualization={false}
          dataTestId="test-no-poi-capsule"
        />
      </StyleLabSurface>
    );

    // Check that POI visualization is not rendered
    const poiVisualization = screen.queryByTestId('poi-visualization');
    expect(poiVisualization).not.toBeInTheDocument();
  });
});
