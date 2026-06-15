/**
 * DestinyAstrolabe - Reusable D100 skill check component with cinematic visuals
 * Encapsulates the complete ball-physics skill resolution system
 * Wraps the full destiny-astrolabe.html with message-passing configuration
 */

import React, { useEffect, useRef } from 'react';

export interface DestinyAstrolabeSkill {
  name: string;
  stat: number;
  difficulty: number;
}

export interface DestinyAstrolabeResult {
  verdict: 'bigwin' | 'win' | 'almost' | 'fail' | 'epicfail';
  roll: number;
  riskRoll: number;
  skillIndex: number;
  skillName: string;
  wounded: boolean;
  dead: boolean;
}

export interface DestinyAstrolabeProps {
  /** Array of skills to test with individual difficulties */
  skills: DestinyAstrolabeSkill[];
  /** Critical failure chance % */
  criticalFailChance?: number;
  /** Wounded chance % */
  woundedChance?: number;
  /** Death chance % */
  deathChance?: number;
  /** Callback when roll completes */
  onComplete?: (result: DestinyAstrolabeResult) => void;
  /** Auto-start the roll */
  autoStart?: boolean;
  /** Force a specific verdict (for testing) */
  forcedVerdict?: DestinyAstrolabeResult['verdict'];
}

/**
 * DestinyAstrolabeComponent - Single-line import, self-contained skill check
 *
 * Usage:
 * ```
 * import { DestinyAstrolabeComponent } from './components/DestinyAstrolabeComponent';
 *
 * <DestinyAstrolabeComponent
 *   playerStat={60}
 *   challengeReq={55}
 *   onComplete={(result) => console.log(result)}
 *   autoStart
 * />
 * ```
 */
export const DestinyAstrolabeComponent = React.memo(({
  skills,
  criticalFailChance = 5,
  woundedChance = 10,
  deathChance = 5,
  onComplete,
  autoStart = true,
  forcedVerdict,
}: DestinyAstrolabeProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Store completion handler
  const onCompleteRef = React.useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!containerRef.current || !skills.length) return;

    // Idempotent: clear any stale iframe (e.g. StrictMode double-mount) first
    containerRef.current.innerHTML = '';

    // Build iframe with query params for the destiny-astrolabe.html file
    const params = new URLSearchParams({
      skillsJson: JSON.stringify(skills),
      crit: String(criticalFailChance),
      wound: String(woundedChance),
      dead: String(deathChance),
      ...(forcedVerdict && { mode: forcedVerdict }),
    });

    const iframe = document.createElement('iframe');
    iframe.src = `/destiny-astrolabe.html?${params.toString()}`;
    iframe.style.cssText = `
      border: none;
      width: 100%;
      height: 100vh;
      display: block;
    `;

    containerRef.current.appendChild(iframe);
    iframeRef.current = iframe;

    // Listen for completion message from iframe
    const handleMessage = (event: MessageEvent) => {
      // Only accept messages from our iframe (same origin)
      if (iframe.contentWindow && event.source === iframe.contentWindow) {
        if (event.data?.type === 'skillcheck-complete') {
          const result: DestinyAstrolabeResult = event.data.payload;
          onCompleteRef.current?.(result);
        }
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
      if (containerRef.current?.contains(iframe)) {
        containerRef.current?.removeChild(iframe);
      }
    };
  }, [skills, criticalFailChance, woundedChance, deathChance, forcedVerdict]);

  return (
    <div
      ref={containerRef}
      data-testid="destiny-astrolabe-component"
      style={{ width: '100%', height: '100vh', overflow: 'hidden' }}
    />
  );
});

DestinyAstrolabeComponent.displayName = 'DestinyAstrolabeComponent';
