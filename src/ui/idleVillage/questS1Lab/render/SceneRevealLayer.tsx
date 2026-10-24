/**
 * SceneRevealLayer — the hidden affordance overlay for quest scenes
 * (PLAN-084). One DOM layer that every stage that mounts a cinematic entry
 * can render over the scene: the clickable/timed region, and the revealed
 * visuals — the revealSrc plate fading in under a sliding cutout (the
 * painted occluder that moves aside, goblins rising behind it).
 *
 * Trigger semantics live here so TheaterLabPage and the real Theater fire
 * the same reveal: 'click' waits for the player, 'timed' springs itself.
 */
import { useEffect, useRef } from 'react';
import type { SceneCinematicEntry } from './sceneManifest';

type Reveal = NonNullable<SceneCinematicEntry['reveal']>;

/** clip-path inset() for an img-fraction rect [x, y, w, h]. */
const clipFor = (r: [number, number, number, number]) =>
  `inset(${r[1] * 100}% ${(1 - r[0] - r[2]) * 100}% ${(1 - r[1] - r[3]) * 100}% ${r[0] * 100}%)`;

export const SceneRevealLayer: React.FC<{
  reveal: Reveal;
  /** The base (hidden) plate src — the cutout is cropped from it. */
  src: string;
  revealed: boolean;
  onReveal: () => void;
}> = ({ reveal, src, revealed, onReveal }) => {
  const firedRef = useRef(false);
  const fire = () => {
    if (firedRef.current) return;
    firedRef.current = true;
    onReveal();
  };

  /* 'timed' springs itself after the authored delay. */
  useEffect(() => {
    if (revealed || reveal.trigger !== 'timed') return undefined;
    const t = window.setTimeout(fire, reveal.afterSeconds * 1000);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed, reveal.trigger, reveal.afterSeconds]);

  /* Reset the fired latch if the scene's reveal contract changes. */
  useEffect(() => {
    if (!revealed) firedRef.current = false;
  }, [revealed]);

  const cover: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: '50% 40%',
    pointerEvents: 'none',
  };
  const mode = reveal.revealMode ?? 'fade';
  const cut = reveal.cutout;
  const slideTransform =
    cut?.slide === 'left' ? 'translateX(-105%)' : cut?.slide === 'right' ? 'translateX(105%)' : 'translateY(105%)';

  return (
    <>
      {/* The hidden affordance — a live region until found. */}
      {!revealed && reveal.trigger === 'click' && (
        <div
          role="button"
          aria-label="Ispeziona"
          data-testid="scene-reveal-region"
          onClick={fire}
          style={{
            position: 'absolute',
            left: `${reveal.region[0] * 100}%`,
            top: `${reveal.region[1] * 100}%`,
            width: `${reveal.region[2] * 100}%`,
            height: `${reveal.region[3] * 100}%`,
            cursor: 'pointer',
            pointerEvents: 'auto',
            zIndex: 5,
          }}
        />
      )}
      {/* The revealed plate — fades in over the WHOLE frame (the risen
       *  goblins live center-right, beyond the cutout region), while the
       *  cutout slides away on top of it selling the uncovering. */}
      {revealed && reveal.revealSrc && (
        <img
          src={reveal.revealSrc}
          alt=""
          data-testid="scene-revealed-plate"
          style={{
            ...cover,
            animation: 'sceneRevealFade 0.9s ease-out both',
            zIndex: 3,
          }}
        />
      )}
      {/* The occluder: the same hidden plate cropped to the cutout region,
       *  sliding away — the painted rock that moves and shows the goblins. */}
      {cut && mode === 'cutout-slide' && (
        <img
          src={src}
          alt=""
          aria-hidden
          data-testid="scene-reveal-cutout"
          style={{
            ...cover,
            clipPath: clipFor(cut.region),
            transform: revealed ? slideTransform : 'translate(0,0)',
            transition: `transform ${cut.slideSeconds}s cubic-bezier(0.25, 0.8, 0.3, 1)`,
            zIndex: 4,
          }}
        />
      )}
      <style>{'@keyframes sceneRevealFade{from{opacity:0}to{opacity:1}}'}</style>
    </>
  );
};
