/**
 * SceneRevealLayer — the hidden affordance overlay for quest scenes
 * (PLAN-084). One DOM layer mounted over the scene by every stage:
 * the clickable/timed region, and the revealed visuals —
 *
 *  - 'fade'         → the revealed plate fades in over the frame
 *  - 'cutout-slide' → a clipped piece of the hidden plate slides away
 *  - 'panel-slide'  → a full foreground panel (covering ~85%) slides
 *                     left off-frame; the scene was behind it all along
 *
 * revealFx (panel-slide only): 'sprites' = extracted goblin cutouts rise
 * into the scene; 'strips' = the revealed plate arrives in vertical
 * stripes left→right. Director picks one after the live comparison.
 */
import { useEffect, useRef } from 'react';
import type { SceneCinematicEntry } from './sceneManifest';

type Reveal = NonNullable<SceneCinematicEntry['reveal']>;

/** clip-path inset() for an img-fraction rect [x, y, w, h]. */
const clipFor = (r: [number, number, number, number]) =>
  `inset(${r[1] * 100}% ${(1 - r[0] - r[2]) * 100}% ${(1 - r[1] - r[3]) * 100}% ${r[0] * 100}%)`;

/** The goblin sprite cutouts (extracted from the revealed plate) and their
 *  home positions/entry motion in img-fraction. */
const SPRITES: { src: string; home: [number, number, number, number]; delay: number; rise: number }[] = [
  { src: '/assets/scene-library/sprites/gob-lunge.png', home: [0.25, 0.15, 0.25, 0.47], delay: 0.4, rise: 0.35 },
  { src: '/assets/scene-library/sprites/gob-archer.png', home: [0.68, 0.25, 0.2, 0.43], delay: 0.7, rise: 0.25 },
  { src: '/assets/scene-library/sprites/gob-charge.png', home: [0.42, 0.3, 0.2, 0.3], delay: 0.55, rise: 0.3 },
];

export const SceneRevealLayer: React.FC<{
  reveal: Reveal;
  /** The base (hidden) plate src — the cutout is cropped from it. */
  src: string;
  revealed: boolean;
  onReveal: () => void;
  /** Lab override for the revealFx comparison (A sprites / C strips). */
  fxOverride?: 'sprites' | 'strips';
}> = ({ reveal, src, revealed, onReveal, fxOverride }) => {
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
  const fx = fxOverride ?? reveal.revealFx ?? 'sprites';
  const slideS = cut?.slideSeconds ?? 1.6;
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

      {/* panel-slide: the FULL foreground panel covers the scene and slides
       *  left off-frame — the goblins were behind it all along. Renders
       *  over the base plate at all times (it's the scene's own cover). */}
      {mode === 'panel-slide' && reveal.panelSrc && (
        <img
          src={reveal.panelSrc}
          alt=""
          aria-hidden
          data-testid="scene-reveal-panel"
          style={{
            ...cover,
            width: `${(cut?.region[2] ?? 0.85) * 100}%`,
            transform: revealed ? slideTransform : 'translate(0,0)',
            transition: `transform ${slideS}s cubic-bezier(0.25, 0.8, 0.3, 1)`,
            zIndex: 6,
          }}
        />
      )}

      {/* The revealed plate — fades/feathers in beneath the sliding panel. */}
      {revealed && reveal.revealSrc && mode !== 'panel-slide' && (
        <img
          src={reveal.revealSrc}
          alt=""
          data-testid="scene-revealed-plate"
          style={{
            ...cover,
            maskImage: cut
              ? `radial-gradient(${cut.region[2] * 115}% ${cut.region[3] * 115}% at ${(cut.region[0] + cut.region[2] / 2) * 100}% ${(cut.region[1] + cut.region[3] / 2) * 100}%, black 55%, transparent 98%)`
              : undefined,
            animation: 'sceneRevealFade 0.9s ease-out both',
            zIndex: 3,
          }}
        />
      )}

      {/* cutout-slide: the hidden-plate occluder slides off. */}
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
            transition: `transform ${slideS}s cubic-bezier(0.25, 0.8, 0.3, 1)`,
            zIndex: 4,
          }}
        />
      )}

      {/* revealFx variants — panel-slide aftermath. */}
      {revealed && mode === 'panel-slide' && fx === 'sprites' &&
        SPRITES.map((s) => (
          <img
            key={s.src}
            src={s.src}
            alt=""
            aria-hidden
            data-testid="scene-reveal-sprite"
            style={{
              position: 'absolute',
              left: `${s.home[0] * 100}%`,
              top: `${s.home[1] * 100}%`,
              width: `${s.home[2] * 100}%`,
              height: `${s.home[3] * 100}%`,
              objectFit: 'contain',
              pointerEvents: 'none',
              zIndex: 7,
              animation: `goblinRise ${0.9 + s.rise}s cubic-bezier(0.2, 0.9, 0.25, 1) ${s.delay}s both`,
            }}
          />
        ))}
      {revealed && mode === 'panel-slide' && fx === 'strips' && reveal.revealSrc &&
        /* 5 vertical stripes of the revealed plate sweeping in left→right —
         *  the goblins arrive as the forest itself reveals them. */
        Array.from({ length: 5 }, (_, i) => (
          <img
            key={i}
            src={reveal.revealSrc}
            alt=""
            aria-hidden
            data-testid="scene-reveal-strip"
            style={{
              ...cover,
              clipPath: `inset(0 ${(4 - i) * 20}% 0 ${i * 20}%)`,
              animation: `stripReveal 0.55s ease-out ${0.3 + i * 0.18}s both`,
              zIndex: 3,
            }}
          />
        ))}

      <style>{`
        @keyframes sceneRevealFade{from{opacity:0}to{opacity:1}}
        @keyframes goblinRise{from{opacity:0;transform:translateY(30%) scale(0.9)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes stripReveal{from{opacity:0;transform:translateX(-12%)}to{opacity:1;transform:translateX(0)}}
      `}</style>
    </>
  );
};
