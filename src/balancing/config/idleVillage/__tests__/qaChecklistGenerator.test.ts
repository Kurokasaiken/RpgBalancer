import { describe, it, expect } from 'vitest';
import { generateQAChecklist } from '../qaChecklistGenerator';
import { MINIMAL_GAMEPLAY_CONFIG } from '../minimalGameplayConfig';

describe('QAChecklistGenerator', () => {
  describe('generateQAChecklist', () => {
    it('should generate a complete checklist from full config', () => {
      const checklist = generateQAChecklist(MINIMAL_GAMEPLAY_CONFIG);

      // Verify basic structure
      expect(checklist).toHaveProperty('generatedAt');
      expect(checklist).toHaveProperty('configVersion', MINIMAL_GAMEPLAY_CONFIG.version);
      expect(checklist).toHaveProperty('totalTasks');
      expect(checklist).toHaveProperty('sections');
      expect(checklist).toHaveProperty('estimatedTotalTime');
      expect(checklist).toHaveProperty('coverage');

      // Verify sections exist
      expect(checklist.sections.length).toBeGreaterThan(0);
      expect(checklist.totalTasks).toBeGreaterThan(0);
      expect(checklist.estimatedTotalTime).toBeGreaterThan(0);

      // Verify coverage
      const coverage = checklist.coverage;
      expect(coverage.uiElements).toBeGreaterThan(0);
      expect(coverage.gameMechanics).toBeGreaterThan(0);
      expect(coverage.locations).toBeGreaterThan(0);
      expect(coverage.residents).toBeGreaterThan(0);
      expect(coverage.edgeCases).toBeGreaterThan(0);
      expect(coverage.performanceTests).toBeGreaterThan(0);
    });

    it('should generate checklist with correct timestamp', () => {
      const before = new Date();
      const checklist = generateQAChecklist(MINIMAL_GAMEPLAY_CONFIG);
      const after = new Date();

      const generatedAt = new Date(checklist.generatedAt);
      expect(generatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(generatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should calculate total tasks correctly', () => {
      const checklist = generateQAChecklist(MINIMAL_GAMEPLAY_CONFIG);
      const manualTotal = checklist.sections.reduce((sum, section) => sum + section.tasks.length, 0);

      expect(checklist.totalTasks).toBe(manualTotal);
    });

    it('should calculate estimated total time correctly', () => {
      const checklist = generateQAChecklist(MINIMAL_GAMEPLAY_CONFIG);
      const manualTotal = checklist.sections.reduce((sum, section) => sum + section.estimatedTotalTime, 0);

      expect(checklist.estimatedTotalTime).toBe(manualTotal);
    });
  });

  describe('UI Testing Section', () => {
    it('should generate hero section testing task', () => {
      const checklist = generateQAChecklist(MINIMAL_GAMEPLAY_CONFIG);
      const uiSection = checklist.sections.find(s => s.sectionId === 'ui-testing');

      expect(uiSection).toBeDefined();
      expect(uiSection!.tasks.some(t => t.id === 'ui-hero-display')).toBe(true);

      const heroTask = uiSection!.tasks.find(t => t.id === 'ui-hero-display');
      expect(heroTask).toBeDefined();
      expect(heroTask!.title).toBe('Hero Section Display');
      expect(heroTask!.priority).toBe('critical');
      expect(heroTask!.steps).toContain('Check hero subtitle displays: "Calibrazione Shell"');
      expect(heroTask!.relatedConfig).toBe('ui.hero');
    });

    it('should generate HUD field tasks for each configured field', () => {
      const checklist = generateQAChecklist(MINIMAL_GAMEPLAY_CONFIG);
      const uiSection = checklist.sections.find(s => s.sectionId === 'ui-testing');

      expect(uiSection).toBeDefined();

      // Check that tasks exist for each HUD field
      MINIMAL_GAMEPLAY_CONFIG.ui.hudFields.forEach(field => {
        const taskId = `ui-hud-field-${field.id}`;
        expect(uiSection!.tasks.some(t => t.id === taskId)).toBe(true);

        const task = uiSection!.tasks.find(t => t.id === taskId);
        expect(task!.title).toBe(`HUD Field: ${field.label}`);
        expect(task!.relatedConfig).toBe(`ui.hudFields[${MINIMAL_GAMEPLAY_CONFIG.ui.hudFields.indexOf(field)}]`);
      });
    });

    it('should include game over modal task when enabled', () => {
      const checklist = generateQAChecklist(MINIMAL_GAMEPLAY_CONFIG);
      const uiSection = checklist.sections.find(s => s.sectionId === 'ui-testing');

      expect(uiSection!.tasks.some(t => t.id === 'ui-game-over-modal')).toBe(true);
    });

    it('should calculate UI section time correctly', () => {
      const checklist = generateQAChecklist(MINIMAL_GAMEPLAY_CONFIG);
      const uiSection = checklist.sections.find(s => s.sectionId === 'ui-testing');

      const manualTime = uiSection!.tasks.reduce((sum, task) => sum + task.estimatedTimeMinutes, 0);
      expect(uiSection!.estimatedTotalTime).toBe(manualTime);
    });
  });

  describe('Location Testing Section', () => {
    it('should generate display tasks for each location', () => {
      const checklist = generateQAChecklist(MINIMAL_GAMEPLAY_CONFIG);
      const locationSection = checklist.sections.find(s => s.sectionId === 'location-testing');

      expect(locationSection).toBeDefined();

      MINIMAL_GAMEPLAY_CONFIG.locations.forEach(location => {
        const displayTaskId = `location-display-${location.id}`;
        expect(locationSection!.tasks.some(t => t.id === displayTaskId)).toBe(true);

        const task = locationSection!.tasks.find(t => t.id === displayTaskId);
        expect(task!.title).toBe(`Location Display: ${location.label}`);
        expect(task!.steps).toContain(`Check location shows correct icon: ${location.icon}`);
      });
    });

    it('should generate activity execution tasks for each location', () => {
      const checklist = generateQAChecklist(MINIMAL_GAMEPLAY_CONFIG);
      const locationSection = checklist.sections.find(s => s.sectionId === 'location-testing');

      MINIMAL_GAMEPLAY_CONFIG.locations.forEach(location => {
        const activityTaskId = `location-activity-${location.id}`;
        expect(locationSection!.tasks.some(t => t.id === activityTaskId)).toBe(true);

        const task = locationSection!.tasks.find(t => t.id === activityTaskId);
        expect(task!.title).toBe(`Activity Execution: ${location.label}`);
        expect(task!.priority).toBe('critical');
      });
    });

    it('should generate stat requirement tasks for locations with recommended stats', () => {
      const checklist = generateQAChecklist(MINIMAL_GAMEPLAY_CONFIG);
      const locationSection = checklist.sections.find(s => s.sectionId === 'location-testing');

      MINIMAL_GAMEPLAY_CONFIG.locations.forEach(location => {
        if (location.recommendedStatTags && location.recommendedStatTags.length > 0) {
          const statTaskId = `location-stats-${location.id}`;
          expect(locationSection!.tasks.some(t => t.id === statTaskId)).toBe(true);

          const task = locationSection!.tasks.find(t => t.id === statTaskId);
          expect(task!.title).toBe(`Stat Requirements: ${location.label}`);
          expect(task!.priority).toBe('medium');
        }
      });
    });
  });

  describe('Resident Testing Section', () => {
    it('should generate display tasks for each resident', () => {
      const checklist = generateQAChecklist(MINIMAL_GAMEPLAY_CONFIG);
      const residentSection = checklist.sections.find(s => s.sectionId === 'resident-testing');

      expect(residentSection).toBeDefined();

      MINIMAL_GAMEPLAY_CONFIG.residents.forEach(resident => {
        const displayTaskId = `resident-display-${resident.id}`;
        expect(residentSection!.tasks.some(t => t.id === displayTaskId)).toBe(true);

        const task = residentSection!.tasks.find(t => t.id === displayTaskId);
        expect(task!.title).toBe(`Resident Display: ${resident.label}`);
      });
    });

    it('should generate stat validation tasks for each resident', () => {
      const checklist = generateQAChecklist(MINIMAL_GAMEPLAY_CONFIG);
      const residentSection = checklist.sections.find(s => s.sectionId === 'resident-testing');

      MINIMAL_GAMEPLAY_CONFIG.residents.forEach(resident => {
        const statTaskId = `resident-stats-${resident.id}`;
        expect(residentSection!.tasks.some(t => t.id === statTaskId)).toBe(true);

        const task = residentSection!.tasks.find(t => t.id === statTaskId);
        expect(task!.title).toBe(`Resident Stats: ${resident.label}`);
        expect(task!.priority).toBe('critical');
      });
    });

    it('should generate fatigue mechanics tasks for each resident', () => {
      const checklist = generateQAChecklist(MINIMAL_GAMEPLAY_CONFIG);
      const residentSection = checklist.sections.find(s => s.sectionId === 'resident-testing');

      MINIMAL_GAMEPLAY_CONFIG.residents.forEach(resident => {
        const fatigueTaskId = `resident-fatigue-${resident.id}`;
        expect(residentSection!.tasks.some(t => t.id === fatigueTaskId)).toBe(true);

        const task = residentSection!.tasks.find(t => t.id === fatigueTaskId);
        expect(task!.title).toBe(`Fatigue Mechanics: ${resident.label}`);
        expect(task!.priority).toBe('high');
      });
    });
  });

  describe('Mechanics Testing Section', () => {
    it('should generate game loop timing task', () => {
      const checklist = generateQAChecklist(MINIMAL_GAMEPLAY_CONFIG);
      const mechanicsSection = checklist.sections.find(s => s.sectionId === 'mechanics-testing');

      expect(mechanicsSection!.tasks.some(t => t.id === 'mechanics-loop-timing')).toBe(true);

      const task = mechanicsSection!.tasks.find(t => t.id === 'mechanics-loop-timing');
      expect(task!.title).toBe('Game Loop Timing');
      expect(task!.priority).toBe('critical');
      expect(task!.steps).toContain(`Monitor tick intervals (${MINIMAL_GAMEPLAY_CONFIG.loop.tickIntervalMs}ms)`);
    });

    it('should generate speed multiplier task', () => {
      const checklist = generateQAChecklist(MINIMAL_GAMEPLAY_CONFIG);
      const mechanicsSection = checklist.sections.find(s => s.sectionId === 'mechanics-testing');

      expect(mechanicsSection!.tasks.some(t => t.id === 'mechanics-speed-multiplier')).toBe(true);

      const task = mechanicsSection!.tasks.find(t => t.id === 'mechanics-speed-multiplier');
      expect(task!.title).toBe('Speed Multiplier');
      expect(task!.steps).toContain(`Increase to maximum (${MINIMAL_GAMEPLAY_CONFIG.loop.maxSpeedMultiplier}x)`);
    });

    it('should generate resource management task', () => {
      const checklist = generateQAChecklist(MINIMAL_GAMEPLAY_CONFIG);
      const mechanicsSection = checklist.sections.find(s => s.sectionId === 'mechanics-testing');

      expect(mechanicsSection!.tasks.some(t => t.id === 'mechanics-resources')).toBe(true);

      const task = mechanicsSection!.tasks.find(t => t.id === 'mechanics-resources');
      expect(task!.title).toBe('Resource Management');
      expect(task!.priority).toBe('critical');
    });
  });

  describe('Edge Cases Section', () => {
    it('should generate game over tasks for each reason', () => {
      const checklist = generateQAChecklist(MINIMAL_GAMEPLAY_CONFIG);
      const edgeCasesSection = checklist.sections.find(s => s.sectionId === 'edge-cases');

      Object.entries(MINIMAL_GAMEPLAY_CONFIG.ui.gameOver.messages).forEach(([reason, message]) => {
        const taskId = `edge-case-game-over-${reason}`;
        expect(edgeCasesSection!.tasks.some(t => t.id === taskId)).toBe(true);

        const task = edgeCasesSection!.tasks.find(t => t.id === taskId);
        expect(task!.title).toContain(message.title);
        expect(task!.steps).toContain(`Verify correct message displays: "${message.title}"`);
      });
    });

    it('should generate resource depletion task', () => {
      const checklist = generateQAChecklist(MINIMAL_GAMEPLAY_CONFIG);
      const edgeCasesSection = checklist.sections.find(s => s.sectionId === 'edge-cases');

      expect(edgeCasesSection!.tasks.some(t => t.id === 'edge-case-resource-depletion')).toBe(true);
    });

    it('should generate resident injury task', () => {
      const checklist = generateQAChecklist(MINIMAL_GAMEPLAY_CONFIG);
      const edgeCasesSection = checklist.sections.find(s => s.sectionId === 'edge-cases');

      expect(edgeCasesSection!.tasks.some(t => t.id === 'edge-case-resident-injury')).toBe(true);
    });

    it('should generate maximum capacity task', () => {
      const checklist = generateQAChecklist(MINIMAL_GAMEPLAY_CONFIG);
      const edgeCasesSection = checklist.sections.find(s => s.sectionId === 'edge-cases');

      expect(edgeCasesSection!.tasks.some(t => t.id === 'edge-case-max-capacity')).toBe(true);
    });
  });

  describe('Performance Testing Section', () => {
    it('should generate page load performance task', () => {
      const checklist = generateQAChecklist(MINIMAL_GAMEPLAY_CONFIG);
      const performanceSection = checklist.sections.find(s => s.sectionId === 'performance-testing');

      expect(performanceSection!.tasks.some(t => t.id === 'performance-load-time')).toBe(true);

      const task = performanceSection!.tasks.find(t => t.id === 'performance-load-time');
      expect(task!.title).toBe('Page Load Performance');
      expect(task!.automationReady).toBe(true);
    });

    it('should generate game loop performance task', () => {
      const checklist = generateQAChecklist(MINIMAL_GAMEPLAY_CONFIG);
      const performanceSection = checklist.sections.find(s => s.sectionId === 'performance-testing');

      expect(performanceSection!.tasks.some(t => t.id === 'performance-game-loop')).toBe(true);

      const task = performanceSection!.tasks.find(t => t.id === 'performance-game-loop');
      expect(task!.title).toBe('Game Loop Performance');
      expect(task!.estimatedTimeMinutes).toBe(30);
    });

    it('should generate autosave performance task', () => {
      const checklist = generateQAChecklist(MINIMAL_GAMEPLAY_CONFIG);
      const performanceSection = checklist.sections.find(s => s.sectionId === 'performance-testing');

      expect(performanceSection!.tasks.some(t => t.id === 'performance-autosave')).toBe(true);

      const task = performanceSection!.tasks.find(t => t.id === 'performance-autosave');
      expect(task!.steps).toContain(`Check save operation duration`);
    });
  });

  describe('Task Structure Validation', () => {
    it('should generate tasks with all required properties', () => {
      const checklist = generateQAChecklist(MINIMAL_GAMEPLAY_CONFIG);

      checklist.sections.forEach(section => {
        section.tasks.forEach(task => {
          expect(task).toHaveProperty('id');
          expect(task).toHaveProperty('category');
          expect(task).toHaveProperty('priority');
          expect(task).toHaveProperty('title');
          expect(task).toHaveProperty('description');
          expect(task).toHaveProperty('steps');
          expect(task).toHaveProperty('expectedResult');
          expect(task).toHaveProperty('automationReady');
          expect(task).toHaveProperty('estimatedTimeMinutes');

          expect(Array.isArray(task.steps)).toBe(true);
          expect(task.steps.length).toBeGreaterThan(0);
          expect(['critical', 'high', 'medium', 'low']).toContain(task.priority);
          expect(['ui', 'mechanics', 'locations', 'residents', 'performance', 'edge-cases']).toContain(task.category);
          expect(typeof task.automationReady).toBe('boolean');
          expect(typeof task.estimatedTimeMinutes).toBe('number');
          expect(task.estimatedTimeMinutes).toBeGreaterThan(0);
        });
      });
    });

    it('should generate tasks with unique IDs', () => {
      const checklist = generateQAChecklist(MINIMAL_GAMEPLAY_CONFIG);
      const allIds: string[] = [];

      checklist.sections.forEach(section => {
        section.tasks.forEach(task => {
          expect(allIds).not.toContain(task.id);
          allIds.push(task.id);
        });
      });
    });

    it('should generate sections with proper structure', () => {
      const checklist = generateQAChecklist(MINIMAL_GAMEPLAY_CONFIG);

      checklist.sections.forEach(section => {
        expect(section).toHaveProperty('sectionId');
        expect(section).toHaveProperty('sectionName');
        expect(section).toHaveProperty('description');
        expect(section).toHaveProperty('tasks');
        expect(section).toHaveProperty('estimatedTotalTime');

        expect(Array.isArray(section.tasks)).toBe(true);
        expect(section.tasks.length).toBeGreaterThan(0);
        expect(typeof section.estimatedTotalTime).toBe('number');
        expect(section.estimatedTotalTime).toBeGreaterThan(0);
      });
    });
  });

  describe('Config-Driven Generation', () => {
    it('should adapt to different location configurations', () => {
      const customConfig = {
        ...MINIMAL_GAMEPLAY_CONFIG,
        locations: [
          {
            id: 'custom-location',
            label: 'Custom Location',
            icon: '🎯',
            activityId: 'custom-activity',
            slotId: 'custom-slot',
            description: 'Custom test location',
            telemetryTags: ['custom'],
            recommendedStatTags: ['custom-stat'],
          },
        ],
      };

      const checklist = generateQAChecklist(customConfig);
      const locationSection = checklist.sections.find(s => s.sectionId === 'location-testing');

      expect(locationSection!.tasks.some(t => t.id === 'location-display-custom-location')).toBe(true);
      expect(locationSection!.tasks.some(t => t.id === 'location-activity-custom-location')).toBe(true);
      expect(locationSection!.tasks.some(t => t.id === 'location-stats-custom-location')).toBe(true);
    });

    it('should adapt to different resident configurations', () => {
      const customConfig = {
        ...MINIMAL_GAMEPLAY_CONFIG,
        residents: [
          {
            id: 'custom-resident',
            label: 'Custom Resident',
            level: 5,
            stats: { strength: 10, endurance: 10, agility: 10, intelligence: 10, perception: 10 },
            fatigue: 0,
            traits: ['custom'],
          },
        ],
      };

      const checklist = generateQAChecklist(customConfig);
      const residentSection = checklist.sections.find(s => s.sectionId === 'resident-testing');

      expect(residentSection!.tasks.some(t => t.id === 'resident-display-custom-resident')).toBe(true);
      expect(residentSection!.tasks.some(t => t.id === 'resident-stats-custom-resident')).toBe(true);
      expect(residentSection!.tasks.some(t => t.id === 'resident-fatigue-custom-resident')).toBe(true);
    });

    it('should handle empty configurations gracefully', () => {
      const minimalConfig = {
        ...MINIMAL_GAMEPLAY_CONFIG,
        locations: [],
        residents: [],
        ui: {
          ...MINIMAL_GAMEPLAY_CONFIG.ui,
          hudFields: [],
          gameOver: {
            ...MINIMAL_GAMEPLAY_CONFIG.ui.gameOver,
            messages: {},
          },
        },
      };

      expect(() => generateQAChecklist(minimalConfig)).not.toThrow();

      const checklist = generateQAChecklist(minimalConfig);
      expect(checklist.totalTasks).toBeGreaterThan(0); // Should still have some base tasks
    });
  });
});
