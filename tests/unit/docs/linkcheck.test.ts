import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('Documentation Link Check', () => {
  const docsDir = join(__dirname, '../../../src/docs');
  const styleLabDir = join(__dirname, '../../../src/ui/styleLab');
  
  describe('INTERACTION_TOKENS.md', () => {
    it('should exist and be accessible', () => {
      const filePath = join(docsDir, 'docs/design/INTERACTION_TOKENS.md');
      expect(existsSync(filePath)).toBe(true);
      
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain('ACTION CARD INTERACTIONS');
      expect(content).toContain('ACTION HALO INTERACTIONS');
      expect(content).toContain('wilderness');
      expect(content).toContain('empire');
    });

    it('should contain ActionCard token mappings', () => {
      const filePath = join(docsDir, 'docs/design/INTERACTION_TOKENS.md');
      const content = readFileSync(filePath, 'utf-8');
      
      // Check for ActionCard specific tokens
      expect(content).toContain('--action-card-hover-wilderness');
      expect(content).toContain('--action-card-hover-empire');
      expect(content).toContain('--action-card-collect-wilderness');
      expect(content).toContain('--action-card-collect-empire');
    });

    it('should contain ActionHalo token mappings', () => {
      const filePath = join(docsDir, 'docs/design/INTERACTION_TOKENS.md');
      const content = readFileSync(filePath, 'utf-8');
      
      // Check for ActionHalo specific tokens
      expect(content).toContain('--action-halo-hover-wilderness');
      expect(content).toContain('--action-halo-hover-empire');
      expect(content).toContain('--action-halo-pulse-wilderness');
      expect(content).toContain('--action-halo-pulse-empire');
    });
  });

  describe('game_feel_design_guide.md', () => {
    it('should exist and contain ActionCard guidelines', () => {
      const filePath = join(docsDir, 'docs/design/game_feel_design_guide.md');
      expect(existsSync(filePath)).toBe(true);
      
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain('ActionCard Interactions');
      expect(content).toContain('ActionCard hover');
      expect(content).toContain('ActionCard collect CTA');
    });

    it('should contain ActionHalo guidelines', () => {
      const filePath = join(docsDir, 'docs/design/game_feel_design_guide.md');
      const content = readFileSync(filePath, 'utf-8');
      
      expect(content).toContain('ActionHalo Interactions');
      expect(content).toContain('ActionHalo pulse');
      expect(content).toContain('ActionHalo click');
    });

    it('should contain Style Laboratory controls for ActionCard/ActionHalo', () => {
      const filePath = join(docsDir, 'docs/design/game_feel_design_guide.md');
      const content = readFileSync(filePath, 'utf-8');
      
      expect(content).toContain('ActionCard Specific Controls');
      expect(content).toContain('ActionHalo Specific Controls');
      expect(content).toContain('Hover Scale');
      expect(content).toContain('Pulse Scale Range');
      expect(content).toContain('Collect Overshoot');
    });
  });

  describe('art_direction_plan.md', () => {
    it('should exist and contain Wanderlust UI components section', () => {
      const filePath = join(docsDir, 'docs/plans/art_direction_plan.md');
      expect(existsSync(filePath)).toBe(true);
      
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain('COMPONENTI UI WANDERLUST');
      expect(content).toContain('ActionCardBase');
      expect(content).toContain('ActionHalo');
      expect(content).toContain('Wilderness Pillar');
      expect(content).toContain('Empire Pillar');
    });

    it('should contain component philosophy and styling details', () => {
      const filePath = join(docsDir, 'docs/plans/art_direction_plan.md');
      const content = readFileSync(filePath, 'utf-8');
      
      expect(content).toContain('Il Dettaglio Narrativo');
      expect(content).toContain('Il Richiamo sulla Mappa');
      expect(content).toContain('Rude Bellezza Organica');
      expect(content).toContain('Trionfo Solare Monumentale');
    });

    it('should contain telemetry integration section', () => {
      const filePath = join(docsDir, 'docs/plans/art_direction_plan.md');
      const content = readFileSync(filePath, 'utf-8');
      
      expect(content).toContain('Telemetry Integration');
      expect(content).toContain('wanderlust_pillar_switch');
      expect(content).toContain('action_halo_render');
      expect(content).toContain('action_card_base_render');
    });
  });

  describe('Style Lab README.md', () => {
    it('should exist and contain Wanderlust components section', () => {
      const filePath = join(styleLabDir, 'README.md');
      expect(existsSync(filePath)).toBe(true);
      
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain('Wanderlust Components');
      expect(content).toContain('ActionCardBase');
      expect(content).toContain('ActionHalo');
      expect(content).toContain('Dual Pillar Styling');
    });

    it('should contain usage examples for ActionCardBase', () => {
      const filePath = join(styleLabDir, 'README.md');
      const content = readFileSync(filePath, 'utf-8');
      
      expect(content).toContain('ActionCardBase provides the visual frame');
      expect(content).toContain('pillar={pillar}');
      expect(content).toContain('wilderness');
      expect(content).toContain('empire');
    });

    it('should contain usage examples for ActionHalo', () => {
      const filePath = join(styleLabDir, 'README.md');
      const content = readFileSync(filePath, 'utf-8');
      
      expect(content).toContain('ActionHalo provides pulsing ring indicators');
      expect(content).toContain('pulseIntensity');
      expect(content).toContain('pulseSpeed');
      expect(content).toContain('shadowBlur');
    });

    it('should contain Wanderlust preset integration examples', () => {
      const filePath = join(styleLabDir, 'README.md');
      const content = readFileSync(filePath, 'utf-8');
      
      expect(content).toContain('WANDERLUST_PRESETS');
      expect(content).toContain('applyWanderlustPreset');
      expect(content).toContain('Telemetry Integration');
    });
  });

  describe('Wanderlust Plan Integration', () => {
    it('should reference WL-STY-007 in the plan', () => {
      const filePath = join(__dirname, '../../../.windsurf/plans/style-lab-wanderlust-refinement-9c241b.md');
      expect(existsSync(filePath)).toBe(true);
      
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain('WL-STY-007');
      expect(content).toContain('Documentation & Enablement');
      expect(content).toContain('INTERACTION_TOKENS.md');
      expect(content).toContain('game_feel_design_guide.md');
      expect(content).toContain('art_direction_plan.md');
    });
  });

  describe('Documentation Consistency', () => {
    it('should have consistent pillar naming across all docs', () => {
      const interactionTokens = readFileSync(join(docsDir, 'docs/design/INTERACTION_TOKENS.md'), 'utf-8');
      const gameFeelGuide = readFileSync(join(docsDir, 'docs/design/game_feel_design_guide.md'), 'utf-8');
      const artDirection = readFileSync(join(docsDir, 'docs/plans/art_direction_plan.md'), 'utf-8');
      const styleLabReadme = readFileSync(join(styleLabDir, 'README.md'), 'utf-8');
      
      // All documents should consistently use 'wilderness' and 'empire'
      const allContent = interactionTokens + gameFeelGuide + artDirection + styleLabReadme;
      
      expect(allContent).toContain('wilderness');
      expect(allContent).toContain('empire');
    });

    it('should have consistent component naming', () => {
      const interactionTokens = readFileSync(join(docsDir, 'docs/design/INTERACTION_TOKENS.md'), 'utf-8');
      const gameFeelGuide = readFileSync(join(docsDir, 'docs/design/game_feel_design_guide.md'), 'utf-8');
      const artDirection = readFileSync(join(docsDir, 'docs/plans/art_direction_plan.md'), 'utf-8');
      const styleLabReadme = readFileSync(join(styleLabDir, 'README.md'), 'utf-8');
      
      // All documents should consistently use ActionCardBase and ActionHalo
      const allContent = interactionTokens + gameFeelGuide + artDirection + styleLabReadme;
      
      expect(allContent).toContain('ActionCardBase');
      expect(allContent).toContain('ActionHalo');
    });
  });
});
