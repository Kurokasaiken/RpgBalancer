/**
 * @trailer-only
 *
 * AstrolabeTrailerController — scripted DestinyAstrolabe sequence for Scene 4: Risk.
 *
 * This component is part of the Steam teaser trailer production pipeline.
 * It is exempt from gameplay architecture requirements but must preserve
 * presentation architecture requirements.
 *
 * NO gameplay logic (scripted sequences, mock data only)
 * NO persistence (marketing asset, not product)
 * NO full i18n (hardcoded copy for iteration speed)
 * NO telemetry (marketing asset, not product)
 * NO Zod validation (tunable config only)
 *
 * MUST preserve:
 * - Visual consistency with existing components
 * - Existing component contracts (reuse, don't fork)
 * - Deterministic behavior for recording
 * - Project styling conventions
 *
 * This code exists solely to produce recordable video content.
 * Do NOT reuse for gameplay features.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { DestinyAstrolabe } from '@/ui/idleVillage/frozen/kits/destinyAstrolabeKit';
import type { AstrolabeSkill, AstrolabeResult } from '@/ui/idleVillage/frozen/kits/destinyAstrolabeKit';
import { trailerConfig, resetTrailerRandom, trailerRandom } from '@/balancing/config/idleVillage/trailerConfig';
import './trailer.css';

/**
 * Timeline phase for the scripted astrolabe sequence.
 */
type TimelinePhase = 'idle' | 'reveal' | 'tension' | 'nearMiss' | 'heroInjured' | 'reward';

/**
 * Props for AstrolabeTrailerController.
 */
export interface AstrolabeTrailerControllerProps {
  /** Scene duration in milliseconds (default: 7000ms from config) */
  duration?: number;
  /** Whether to auto-start the sequence (default: true) */
  autoStart?: boolean;
  /** Whether to hide throw controls for capture mode (default: false) */
  hideControls?: boolean;
  /** Callback when sequence completes */
  onComplete?: () => void;
}

/**
 * AstrolabeTrailerController — scripted DestinyAstrolabe sequence.
 *
 * Implements the 7-second hero shot (Scene 4: Risk):
 * - 0-2s: Reveal (dark background, rings illuminate, camera scale-in)
 * - 2-5s: Tension (ball enters, spines visible, perceived risk)
 * - 5-7s: Payoff (near collision, success, gold burst)
 * - 7s+: Hero Frame (freeze for screenshot capture)
 *
 * Constraints:
 * - MAY set initial state
 * - MAY trigger scripted actions
 * - MAY control presentation
 * - MAY include internal CSS reward burst (no separate component)
 * - MAY NOT change physics
 * - MAY NOT modify probabilities
 * - MAY NOT alter gameplay rules
 * - MAY NOT fork DestinyAstrolabe
 * - MAY NOT modify DestinyAstrolabe internals
 */
export const AstrolabeTrailerController: React.FC<AstrolabeTrailerControllerProps> = ({
  duration: _duration = trailerConfig.risk.duration,
  autoStart = true,
  hideControls = true,
  onComplete,
}) => {
  const astrolabeRef = useRef<{ roll: () => void; throw: () => void }>(null);
  const [phase, setPhase] = useState<TimelinePhase>('idle');
  const [showRewardBurst, setShowRewardBurst] = useState(false);
  const [isHeroFrame, setIsHeroFrame] = useState(false);
  const [particlePositions, setParticlePositions] = useState<Array<{ x: number; y: number; delay: number }>>([]);

  /**
   * Generate deterministic particle positions for CSS reward burst.
   * Uses seeded random to ensure identical positions across recordings.
   */
  const generateParticlePositions = useCallback(() => {
    resetTrailerRandom();
    const positions: Array<{ x: number; y: number; delay: number }> = [];
    const particleCount = 20;
    
    for (let i = 0; i < particleCount; i++) {
      // Generate positions in a circular pattern around the center
      const angle = (i / particleCount) * Math.PI * 2;
      const radius = 100 + trailerRandom.range(0, 50);
      const x = 50 + Math.cos(angle) * radius * 0.01; // Convert to percentage
      const y = 50 + Math.sin(angle) * radius * 0.01;
      const delay = trailerRandom.range(0, 300);
      positions.push({ x, y, delay });
    }
    
    return positions;
  }, []);

  /**
   * Scripted timeline implementation.
   * Follows the 7-second sequence defined in the plan.
   */
  useEffect(() => {
    if (!autoStart) return;

    const timeouts: number[] = [];

    // Reset seeded random for deterministic behavior
    resetTrailerRandom();

    // Phase 1: Reveal (0-2s)
    // Dark background, rings illuminate, camera scale-in
    const revealTimeout = window.setTimeout(() => {
      setPhase('reveal');
    }, 0);
    timeouts.push(revealTimeout);

    // Phase 2: Tension (2-5s)
    // Ball enters, spines visible, perceived risk
    const tensionTimeout = window.setTimeout(() => {
      setPhase('tension');
      // Trigger the astrolabe roll
      astrolabeRef.current?.roll();
    }, 2000);
    timeouts.push(tensionTimeout);

    // Phase 3: Near Miss (5-7s)
    // Near collision, success
    const nearMissTimeout = window.setTimeout(() => {
      setPhase('nearMiss');
    }, 5000);
    timeouts.push(nearMissTimeout);

    // Phase 4: Hero Injured (7s)
    // HERO INJURED state, freeze for screenshot
    const heroInjuredTimeout = window.setTimeout(() => {
      setPhase('heroInjured');
      setIsHeroFrame(true);
      onComplete?.();
    }, 7000);
    timeouts.push(heroInjuredTimeout);

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [autoStart, onComplete]);

  /**
   * Handle astrolabe result to trigger reward burst.
   */
  const handleResolve = useCallback((result: AstrolabeResult) => {
    // Trigger CSS reward burst on success
    if (result.verdict === 'win' || result.verdict === 'bigwin' || result.verdict === 'almost') {
      setShowRewardBurst(true);
      setParticlePositions(generateParticlePositions());
      
      // Hide reward burst after animation
      window.setTimeout(() => {
        setShowRewardBurst(false);
      }, 1000);
    }
  }, [generateParticlePositions]);

  /**
   * Mock skill data for the trailer.
   * Uses deterministic values for consistent recording.
   */
  const mockSkills: AstrolabeSkill[] = [
    {
      name: 'Perception',
      stat: 65,
      difficulty: 55,
    },
  ];

  /**
   * Mock config for the trailer.
   * Sets up the risk scenario with death/wound percentages.
   */
  const mockConfig = {
    dead: 5,
    wound: 10,
    mode: 'trailer',
  };

  return (
    <div className={`trailer-root trailer-background ${isHeroFrame ? 'trailer-hero-frame' : ''}`}>
      {/* Phase indicator for debugging */}
      <div className="trailer-debug" style={{ position: 'absolute', top: 10, left: 10, color: 'white', fontSize: 12, zIndex: 1000 }}>
        Phase: {phase}
      </div>

      {/* DestinyAstrolabe component */}
      <div style={{ width: '100%', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '800px', height: '800px', maxWidth: '100%', maxHeight: '100%' }}>
          <DestinyAstrolabe
            ref={astrolabeRef as React.RefObject<{ roll: () => void; throw: () => void }>}
            skills={mockSkills}
            config={mockConfig}
            onResolve={handleResolve}
            autoStart={false} // We control timing manually
            autoThrow={true}
            skipAnimation={false}
            removeSounds={true}
            hideThrowControls={hideControls}
          />
        </div>
      </div>

      {/* CSS Reward Burst (internal, no separate component) */}
      {showRewardBurst && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {particlePositions.map((pos, i) => (
            <div
              key={i}
              className="trailer-gold-particle"
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                animationDelay: `${pos.delay}ms`,
              }}
            />
          ))}
        </div>
      )}

      {/* Hero Frame indicator */}
      {isHeroFrame && (
        <div
          className="trailer-debug"
          style={{
            position: 'absolute',
            bottom: 20,
            right: 20,
            color: 'var(--trailer-gold)',
            fontSize: 24,
            fontWeight: 'bold',
            textShadow: '0 0 20px rgba(216, 177, 62, 0.8)',
            zIndex: 1000,
          }}
        >
          HERO INJURED
        </div>
      )}
    </div>
  );
};
