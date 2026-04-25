import React, { useEffect, useRef } from 'react';

export interface WanderlustMedalOverlayProps {
  portraitUrl?: string;
  isDragging?: boolean;
  sizePx?: number;
  className?: string;
  style?: React.CSSProperties;
  cursorVelocity?: { x: number; y: number } | null;
}

export const WanderlustMedalOverlay: React.FC<WanderlustMedalOverlayProps> = ({
  portraitUrl,
  isDragging = false,
  sizePx = 64, // Updated default to match dragConfig.overlay.medalSizePx
  className = '',
  style,
  cursorVelocity = null,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rimAngleTargetRef = useRef(0);
  const rimIntensityRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debug coordinate tracking
  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    
    // Find the image element inside the token
    const imageElement = container.querySelector('image') as SVGImageElement;
    const imageRect = imageElement?.getBoundingClientRect();
    
    console.log('=== TOKEN DEBUG ===');
    console.log('Is dragging:', isDragging);
    console.log('Token container rect:', {
      x: Math.round(rect.left),
      y: Math.round(rect.top),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      centerX: Math.round(rect.left + rect.width / 2),
      centerY: Math.round(rect.top + rect.height / 2)
    });
    
    if (imageRect) {
      console.log('Image element rect:', {
        x: Math.round(imageRect.left),
        y: Math.round(imageRect.top),
        width: Math.round(imageRect.width),
        height: Math.round(imageRect.height),
        centerX: Math.round(imageRect.left + imageRect.width / 2),
        centerY: Math.round(imageRect.top + imageRect.height / 2)
      });
      
      // Calculate relative position of image within token
      const relativeX = imageRect.left - rect.left;
      const relativeY = imageRect.top - rect.top;
      console.log('Image relative to token:', {
        x: Math.round(relativeX),
        y: Math.round(relativeY),
        isCentered: Math.abs(relativeX - (rect.width - imageRect.width) / 2) < 2 && 
                   Math.abs(relativeY - (rect.height - imageRect.height) / 2) < 2
      });
    } else {
      console.log('Image element: NOT FOUND');
    }
    console.log('================');
  }, [isDragging]);

  useEffect(() => {
    if (!cursorVelocity) return;
    const { x, y } = cursorVelocity;
    const speed = Math.hypot(x, y);
    if (speed < 0.02) {
      rimIntensityRef.current *= 0.92;
      return;
    }
    rimAngleTargetRef.current = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
    rimIntensityRef.current = Math.min(1, speed * 12); // amplify small velocities for visual impact
  }, [cursorVelocity]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rimAngleCurrent = rimAngleTargetRef.current;
    let currentOp = 0;
    let animationFrameId: number;

    const drawRim = (angleDeg: number, opacity: number) => {
      ctx.clearRect(0, 0, 86, 86);
      if (opacity < 0.005) return;
      const cx = 43, cy = 43, r = 40;
      const a0 = (angleDeg - 22) * Math.PI / 180;
      const a1 = (angleDeg + 22) * Math.PI / 180;
      
      ctx.beginPath();
      ctx.arc(cx, cy, r, a0, a1);
      ctx.strokeStyle = `rgba(255,248,180,${opacity * 0.28})`;
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.stroke();
      
      ctx.beginPath();
      ctx.arc(cx, cy, r, a0 + (a1 - a0) * 0.35, a1 - (a1 - a0) * 0.35);
      ctx.strokeStyle = `rgba(255,252,200,${opacity * 0.55})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    };

    const animRim = () => {
      const diff = rimAngleTargetRef.current - rimAngleCurrent;
      let delta = diff;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      rimAngleCurrent += delta * 0.15; // increased follow speed for less visual lag
      
      const targetOp = isDragging ? Math.min(1, Math.max(0.25, rimIntensityRef.current)) : 0;
      currentOp += (targetOp - currentOp) * 0.15;
      
      if (canvas) {
        canvas.style.opacity = currentOp.toString();
      }
      drawRim(rimAngleCurrent, currentOp);
      
      animationFrameId = requestAnimationFrame(animRim);
    };

    animRim();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isDragging]);

  // Fallback gradient if no portrait is provided
  const fallbackPortrait = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4ICA4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCARCB9ADASIAAhEBAxEB/8QAHQAAAQUBAQEBAAAAAAAAAAAABAECAwUGAAcICf/EAEsQAAEDAwIEBAMGBAQFBAACCwEAAgMEESEFMQYSQVETImFxBzKBFCNCkaGxUmLB0RUzcuEIJEPw8RY0U4KSJaKyNWNz0hcmVMJE/8QAGwEAAgMBAQEAAAAAAAAAAAAAAgMAAQQFBgf/xAAzEQACAwACAgICAgEEAgEDBQEAAQIDEQQhEjETQQUiMlFhFCNCcQYzgRVSYhY0kaGxQ//aAAwDAQACEQMRAD8A89m/zn+5TMlPl/zn2PUpgX0BHnTikuTlKVwsM/ooyHBKdkoHdcLHoq0sTKT32TiLHCQ2VEG7YSrrEpDfZWQ4HPZLuusF2AVZR3RIbBLdduoQQ4SYLkp32XDdQo7lzdd1v0XZXWyrLYpyEt+y7I2XbKyHFI0XclsO6c0Z3UIdsndFy6xseihBMrrpQDa11xB+isgh9Su/NLb1Xbb9FRZ1he647Ltze67rZQh1vVIDhLhcRsoUMJylK4A5XW7Z6KyCYulSgE9PRLZTSDbDulH6pQ1KAqIc25PTZKD2KXl2Fl1goQ62LlPGMdUgFuqXKhYo3ylsm53S37WUKOtYpricJxPdNcdlGRoafVcT3KUhdbO6oghsF26W2crgrINK62bpy4BUQQZKkb2XNbsngdbWQtkOb6p/S64D2TsqtKEFvqnCyQDO3VPA7qyCALrFO36Jwbi37qiyK21v1S8vZTclxZJy9lEyDAL7KRoSgXG1lKxuM2UbK0SNv5p4b+Sc0JxtfZLbItG26BdbqnfokIPZAWd6Lu5XXXdSVZBrjnITfS+3dPPfCa4Z+iNFCf8AZXZIOFwC4dVCI5qUDouv6JTY9UIQnX6Jric2S7Jryp7INSdOq4ZITgMg9kWEG7905g/Nd1TtsKFCbmyVKey62FChL4Sj8ku2LLgoQ7ltuutbulC4KEwQ4Cba6VwzfdIFCjh6LgeyW2Lrh7KEOykue6W2MruqogrR/unhoSAZ26p2LFQs4ggCyTHqEueiRoyqIOAP0Sj8l2ACuCjKFAPquJBwN+qaXW9U5rLgvmIYwC5zZBKSSLSI3SHNiL';

  return (
    <div 
      ref={containerRef}
      className={`tok-svg ${className}`}
      style={{
        position: 'relative',
        width: `${sizePx}px`,
        height: `${sizePx}px`,
        ...style,
      }}
    >
      <canvas
        ref={canvasRef}
        width={sizePx}
        height={sizePx}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: sizePx,
          height: sizePx,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: sizePx,
          height: sizePx,
          pointerEvents: 'none',
          willChange: isDragging ? 'transform' : 'auto',
          transform: isDragging ? 'translateZ(0)' : 'none',
          backfaceVisibility: isDragging ? 'hidden' : 'visible',
        }}
      >
        <svg
          width={sizePx}
          height={sizePx}
          viewBox="0 0 86 86"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Bronze - warm oxidized */}
            <linearGradient id="g-b" x1="14%" y1="4%" x2="86%" y2="96%">
              <stop offset="0%" stopColor="#fce890" />
              <stop offset="9%" stopColor="#e4b048" />
              <stop offset="28%" stopColor="#a05c18" />
              <stop offset="52%" stopColor="#602c08" />
              <stop offset="76%" stopColor="#341604" />
              <stop offset="100%" stopColor="#0e0602" />
            </linearGradient>

            {/* Bevel diagonal */}
            <linearGradient id="g-bv" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,240,165,.30)" />
              <stop offset="22%" stopColor="rgba(255,225,135,.09)" />
              <stop offset="58%" stopColor="rgba(255,210,100,.02)" />
              <stop offset="100%" stopColor="rgba(0,0,0,.62)" />
            </linearGradient>

            {/* Inner ring */}
            <linearGradient id="g-ri" x1="12%" y1="8%" x2="88%" y2="92%">
              <stop offset="0%" stopColor="#f0d070" />
              <stop offset="16%" stopColor="#c88430" />
              <stop offset="46%" stopColor="#7c3e10" />
              <stop offset="80%" stopColor="#3c1c04" />
              <stop offset="100%" stopColor="#160a02" />
            </linearGradient>

            {/* Field stone */}
            <radialGradient id="g-f" cx="40%" cy="33%" r="70%">
              <stop offset="0%" stopColor="#2e2012" />
              <stop offset="38%" stopColor="#1a1008" />
              <stop offset="72%" stopColor="#0e0804" />
              <stop offset="100%" stopColor="#050302" />
            </radialGradient>

            {/* Specular soft */}
            <radialGradient id="g-sp" cx="26%" cy="20%" r="56%">
              <stop offset="0%" stopColor="rgba(255,245,200,.22)" />
              <stop offset="42%" stopColor="rgba(255,232,168,.05)" />
              <stop offset="100%" stopColor="rgba(255,220,140,0)" />
            </radialGradient>

            {/* Portrait vignette */}
            <radialGradient id="g-vg" cx="50%" cy="44%" r="54%">
              <stop offset="0%" stopColor="rgba(0,0,0,0)" />
              <stop offset="48%" stopColor="rgba(0,0,0,.12)" />
              <stop offset="100%" stopColor="rgba(0,0,0,.78)" />
            </radialGradient>

            {/* Glass convex main body */}
            <radialGradient id="g-glass" cx="50%" cy="48%" r="52%">
              <stop offset="0%" stopColor="rgba(220,235,255,.0)" />
              <stop offset="60%" stopColor="rgba(200,220,255,.028)" />
              <stop offset="100%" stopColor="rgba(180,210,255,.065)" />
            </radialGradient>
            
            {/* Glass top-left reflection */}
            <radialGradient id="g-glass-hl" cx="28%" cy="22%" r="38%">
              <stop offset="0%" stopColor="rgba(255,255,255,.26)" />
              <stop offset="35%" stopColor="rgba(255,255,255,.08)" />
              <stop offset="70%" stopColor="rgba(255,255,255,.02)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>

            {/* Glass bottom-right secondary bounce */}
            <radialGradient id="g-glass-b" cx="74%" cy="78%" r="32%">
              <stop offset="0%" stopColor="rgba(255,255,255,.05)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>

            {/* Filters */}
            <filter id="f-nm" x="0%" y="0%" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.52" numOctaves={4} seed="3" stitchTiles="stitch" result="n" />
              <feColorMatrix in="n" type="matrix" values="0 0 0 0 .068  0 0 0 0 .046  0 0 0 0 .021  0 0 0 .25 0" result="c" />
              <feBlend in="SourceGraphic" in2="c" mode="overlay" />
            </filter>
            
            <filter id="f-fs" x="0%" y="0%" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.90" numOctaves={5} seed="11" stitchTiles="stitch" result="n" />
              <feColorMatrix in="n" type="matrix" values="0 0 0 0 .038  0 0 0 0 .026  0 0 0 0 .014  0 0 0 .18 0" result="c" />
              <feBlend in="SourceGraphic" in2="c" mode="overlay" />
            </filter>
            
            <filter id="f-dp" x="0%" y="0%" width="100%" height="100%">
              <feTurbulence type="turbulence" baseFrequency="0.030" numOctaves={3} seed="7" result="t" />
              <feDisplacementMap in="SourceGraphic" in2="t" scale="3.5" xChannelSelector="R" yChannelSelector="G" />
            </filter>
            
            <filter id="f-gl" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            
            <filter id="f-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Clips */}
            <clipPath id="c-port">
              <circle cx="43" cy="43" r="27.5" />
            </clipPath>

            <clipPath id="c-medal">
              <circle cx="43" cy="43" r="42" />
            </clipPath>
          </defs>
          
          {/* MEDALLION BODY */}
          <g clipPath="url(#c-medal)">
            {/* L1: Bronze outer body + texture + bevel */}
            <circle cx="43" cy="43" r="42" fill="#1a0c04" />
            <circle cx="43" cy="43" r="42" fill="url(#g-b)" filter={isDragging ? undefined : "url(#f-nm)"} opacity=".90" />
            <circle cx="43" cy="43" r="42" fill="url(#g-bv)" filter={isDragging ? undefined : "url(#f-dp)"} opacity=".48" />

            {/* L2: Rim top - arc of warm light */}
            <circle cx="43" cy="43" r="40.5" fill="none"
              stroke="rgba(255,238,148,.26)" strokeWidth="3.5"
              strokeDasharray="108 148" strokeDashoffset="72"
              strokeLinecap="round" filter={isDragging ? undefined : "url(#f-gl)"} />
            <circle cx="43" cy="43" r="41" fill="none"
              stroke="rgba(255,250,178,.68)" strokeWidth=".9"
              strokeDasharray="76 178" strokeDashoffset="82"
              strokeLinecap="round" />

            {/* L3: Inner ring separator */}
            <circle cx="43" cy="43" r="34" fill="#130902" />
            <circle cx="43" cy="43" r="34" fill="url(#g-ri)" filter={isDragging ? undefined : "url(#f-nm)"} opacity=".68" />
            <circle cx="43" cy="43" r="34" fill="none"
              stroke="rgba(0,0,0,.75)" strokeWidth="2.2"
              transform="translate(.3,.35)" />
            <circle cx="43" cy="43" r="33.4" fill="none"
              stroke="rgba(255,222,120,.18)" strokeWidth=".8" />

            {/* L4: Field stone */}
            <circle cx="43" cy="43" r="30.5" fill="url(#g-f)" />
            <circle cx="43" cy="43" r="30.5" fill="url(#g-f)" filter={isDragging ? undefined : "url(#f-fs)"} opacity=".56" />
            <circle cx="43" cy="43" r="30.5" fill="url(#g-sp)" />

            {/* L5: Portrait - real image */}
            <image 
              href={portraitUrl || fallbackPortrait}
              x="15.5" y="15.5" width="55" height="55"
              clipPath="url(#c-port)" 
              preserveAspectRatio="xMidYMin slice"
              style={{
                imageRendering: isDragging ? 'pixelated' : 'auto'
              }}
            />
            <circle cx="43" cy="43" r="27.5" fill="url(#g-vg)" />

            {/* Portrait rim - bronze ring */}
            <circle cx="43" cy="43" r="27.5" fill="none"
              stroke="rgba(180,110,28,.30)" strokeWidth="1.5" />
            <circle cx="43" cy="43" r="27.5" fill="none"
              stroke="rgba(0,0,0,.65)" strokeWidth="1.9"
              transform="translate(.28,.35)" />

            {/* L6: GLASS - convex crystal over portrait */}
            <circle cx="43" cy="43" r="27.5" fill="url(#g-glass)" />
            <circle cx="43" cy="43" r="27.5" fill="url(#g-glass-hl)" />
            <circle cx="43" cy="43" r="27.5" fill="url(#g-glass-b)" />
            <circle cx="43" cy="43" r="27.2" fill="none"
              stroke="rgba(255,255,255,.22)" strokeWidth=".6"
              strokeDasharray="58 114" strokeDashoffset="62"
              strokeLinecap="round" />
            <circle cx="43" cy="43" r="27.2" fill="none"
              stroke="rgba(0,0,0,.30)" strokeWidth=".5"
              strokeDasharray="55 117" strokeDashoffset="194"
              strokeLinecap="round" />

            {/* L7: Patina */}
            <circle cx="16" cy="22" r="5.5" fill="rgba(34,18,8,.40)" />
            <circle cx="13" cy="25" r="3.2" fill="rgba(28,14,6,.32)" />
            <circle cx="11" cy="32" r="2.5" fill="rgba(26,12,5,.28)" />
            <circle cx="71" cy="22" r="5"   fill="rgba(32,16,8,.36)" />
            <circle cx="69" cy="19" r="2.8" fill="rgba(28,14,6,.30)" />
            <circle cx="75" cy="30" r="2"   fill="rgba(26,12,5,.24)" />
            <circle cx="21" cy="67" r="4.2" fill="rgba(32,16,8,.34)" />
            <circle cx="67" cy="65" r="3.5" fill="rgba(28,14,6,.30)" />
            <circle cx="43" cy="7"  r="3"   fill="rgba(36,20,8,.22)" />

            {/* Scratches */}
            <line x1="9"  y1="46" x2="16" y2="54" stroke="rgba(0,0,0,.44)" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="72" y1="50" x2="79" y2="58" stroke="rgba(0,0,0,.36)" strokeWidth="1"  strokeLinecap="round" />
            <line x1="26" y1="76" x2="34" y2="80" stroke="rgba(0,0,0,.32)" strokeWidth=".9" strokeLinecap="round" />
            <line x1="54" y1="75" x2="61" y2="79" stroke="rgba(0,0,0,.28)" strokeWidth=".8" strokeLinecap="round" />
            {/* Edge nicks */}
            <path d="M4,44 C3.0,47.5 3.4,51 4,54" fill="none" stroke="rgba(0,0,0,.50)" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M82,38 C83.0,41.5 82.6,45 82,48" fill="none" stroke="rgba(0,0,0,.40)" strokeWidth="1.5" strokeLinecap="round" />
            {/* Oxidation streaks */}
            <line x1="7"  y1="28" x2="13" y2="36" stroke="rgba(72,92,52,.20)" strokeWidth="1.4" strokeLinecap="round" />
            <line x1="75" y1="56" x2="81" y2="63" stroke="rgba(72,92,52,.16)" strokeWidth="1.1" strokeLinecap="round" />

            {/* L8: Bottom AO on field */}
            <circle cx="43" cy="43" r="30.5" fill="none"
              stroke="rgba(0,0,0,.52)" strokeWidth="4"
              strokeDasharray="96 96" strokeDashoffset="-48"
              strokeLinecap="round" />
          </g>
        </svg>
      </div>

      {/* GEM - absolutely positioned below medal center */}
      <div style={{ position: 'absolute', left: '50%', bottom: '-14px', transform: 'translateX(-50%)', zIndex: 2, pointerEvents: 'none' }}>
        <svg width="40" height="32" viewBox="-20 -14 40 32" xmlns="http://www.w3.org/2000/svg" overflow="visible">
          <defs>
            <linearGradient id="g2-b" x1="14%" y1="4%" x2="86%" y2="96%">
              <stop offset="0%" stopColor="#fce890" /><stop offset="9%" stopColor="#e4b048" />
              <stop offset="28%" stopColor="#a05c18" /><stop offset="52%" stopColor="#602c08" />
              <stop offset="76%" stopColor="#341604" /><stop offset="100%" stopColor="#0e0602" />
            </linearGradient>
            <linearGradient id="g2-ri" x1="12%" y1="8%" x2="88%" y2="92%">
              <stop offset="0%" stopColor="#f0d070" /><stop offset="16%" stopColor="#c88430" />
              <stop offset="46%" stopColor="#7c3e10" /><stop offset="80%" stopColor="#3c1c04" />
              <stop offset="100%" stopColor="#160a02" />
            </linearGradient>
            <linearGradient id="g2-top" x1="30%" y1="0%" x2="70%" y2="100%">
              <stop offset="0%" stopColor="#d8ffd8" /><stop offset="40%" stopColor="#72ee82" />
              <stop offset="100%" stopColor="#1a7830" />
            </linearGradient>
            <linearGradient id="g2-lu" x1="0%" y1="20%" x2="100%" y2="80%">
              <stop offset="0%" stopColor="#58d868" /><stop offset="100%" stopColor="#0e5c20" />
            </linearGradient>
            <linearGradient id="g2-ru" x1="100%" y1="20%" x2="0%" y2="80%">
              <stop offset="0%" stopColor="#88ee98" /><stop offset="100%" stopColor="#1a6828" />
            </linearGradient>
            <linearGradient id="g2-ll" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1a6828" /><stop offset="100%" stopColor="#083c14" />
            </linearGradient>
            <linearGradient id="g2-rl" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2a8838" /><stop offset="100%" stopColor="#0a4818" />
            </linearGradient>
            <linearGradient id="g2-bot" x1="30%" y1="0%" x2="70%" y2="100%">
              <stop offset="0%" stopColor="#0e5020" /><stop offset="100%" stopColor="#042810" />
            </linearGradient>
            <radialGradient id="g2-caus" cx="68%" cy="72%" r="44%">
              <stop offset="0%" stopColor="rgba(140,255,160,.30)" /><stop offset="100%" stopColor="rgba(80,220,100,0)" />
            </radialGradient>
            <radialGradient id="g2-flash" cx="32%" cy="22%" r="28%">
              <stop offset="0%" stopColor="rgba(255,255,255,.88)" /><stop offset="50%" stopColor="rgba(255,255,255,.26)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>
            <radialGradient id="g2-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(58,215,80,.32)" /><stop offset="100%" stopColor="rgba(38,180,60,0)" />
            </radialGradient>
            <radialGradient id="g2-ao" cx="50%" cy="50%" r="50%">
              <stop offset="55%" stopColor="rgba(0,0,0,0)" /><stop offset="80%" stopColor="rgba(0,0,0,.52)" />
              <stop offset="100%" stopColor="rgba(0,0,0,.86)" />
            </radialGradient>
            <filter id="g2-fn" x="-30%" y="-30%" width="160%" height="160%">
              <feTurbulence type="fractalNoise" baseFrequency="0.52" numOctaves={4} seed="3" stitchTiles="stitch" result="n" />
              <feColorMatrix in="n" type="matrix" values="0 0 0 0 .068  0 0 0 0 .046  0 0 0 0 .021  0 0 0 .25 0" result="c" />
              <feBlend in="SourceGraphic" in2="c" mode="overlay" />
            </filter>
          </defs>

          {/* Glow */}
          <ellipse cx="0" cy="0" rx="10" ry="8" fill="url(#g2-glow)" style={{ filter: 'blur(3.5px)' }} />

          {/* 6 claws */}
          <path d="M-1,-9.5 C-.7,-8 -.5,-6.5 -.8,-5.2 C-.5,-4.5 0,-4.2 .8,-5.2 C.5,-6.5 .7,-8 1,-9.5 C.5,-10.2 -.5,-10.2 -1,-9.5 Z" fill="url(#g2-b)" filter="url(#g2-fn)" opacity=".92" />
          <path d="M7.2,-5.5 C6,-4.5 5.4,-3.6 4.8,-2.6 C5.1,-2 5.8,-1.8 6.5,-2.6 C7,-3.6 7.5,-4.5 8.2,-5.3 C7.6,-6.2 6.8,-6 7.2,-5.5 Z" fill="url(#g2-b)" filter="url(#g2-fn)" opacity=".90" />
          <path d="M7.2,5.5 C6,4.5 5.4,3.6 4.8,2.6 C5.1,2 5.8,1.8 6.5,2.6 C7,3.6 7.5,4.5 8.2,5.3 C7.6,6.2 6.8,6 7.2,5.5 Z" fill="url(#g2-b)" filter="url(#g2-fn)" opacity=".90" />
          <path d="M-1,9.5 C-.7,8 -.5,6.5 -.8,5.2 C-.5,4.5 0,4.2 .8,5.2 C.5,6.5 .7,8 1,9.5 C.5,10.2 -.5,10.2 -1,9.5 Z" fill="url(#g2-b)" filter="url(#g2-fn)" opacity=".88" />
          <path d="M-7.2,5.5 C-6,4.5 -5.4,3.6 -4.8,2.6 C-5.1,2 -5.8,1.8 -6.5,2.6 C-7,3.6 -7.5,4.5 -8.2,5.3 C-7.6,6.2 -6.8,6 -7.2,5.5 Z" fill="url(#g2-b)" filter="url(#g2-fn)" opacity=".90" />
          <path d="M-7.2,-5.5 C-6,-4.5 -5.4,-3.6 -4.8,-2.6 C-5.1,-2 -5.8,-1.8 -6.5,-2.6 C-7,-3.6 -7.5,-4.5 -8.2,-5.3 C-7.6,-6.2 -6.8,-6 -7.2,-5.5 Z" fill="url(#g2-b)" filter="url(#g2-fn)" opacity=".90" />

          {/* Base ring */}
          <circle cx="0" cy="0" r="6.2" fill="none" stroke="url(#g2-ri)" strokeWidth="1.4" filter="url(#g2-fn)" opacity=".80" />
          <circle cx="0" cy="0" r="6.2" fill="none" stroke="rgba(0,0,0,.65)" strokeWidth="1.6" transform="translate(.2,.3)" />
          <circle cx="0" cy="0" r="5.8" fill="none" stroke="rgba(255,218,110,.18)" strokeWidth=".6" />

          {/* Gem bed */}
          <ellipse cx="0" cy="0" rx="5.2" ry="6.6" fill="#060402" />
          <ellipse cx="0" cy="0" rx="5.2" ry="6.6" fill="url(#g2-ao)" />

          {/* Facets marquise */}
          <polygon points="0,-6.5 -4.2,0 0,6.5" fill="url(#g2-ll)" opacity=".88" />
          <polygon points="0,-6.5  4.2,0 0,6.5" fill="url(#g2-rl)" opacity=".88" />
          <polygon points="-2.2,3.5 2.2,3.5 0,6.5" fill="url(#g2-bot)" opacity=".95" />
          <polygon points="0,-6.5 -2.8,-2.8 0,-1.4 2.8,-2.8" fill="url(#g2-top)" opacity=".95" />
          <polygon points="0,-6.5 -4.2,0 -2.8,-2.8" fill="url(#g2-lu)" opacity=".90" />
          <polygon points="0,-6.5  4.2,0  2.8,-2.8" fill="url(#g2-ru)" opacity=".90" />
          <polygon points="-2.8,-2.8 0,-1.4 2.8,-2.8 4.2,0 0,2.2 -4.2,0" fill="url(#g2-top)" opacity=".85" />

          {/* Facet lines */}
          <line x1="0" y1="-6.5" x2="-4.2" y2="0" stroke="rgba(255,255,255,.28)" strokeWidth=".4" />
          <line x1="0" y1="-6.5" x2="4.2"  y2="0" stroke="rgba(255,255,255,.22)" strokeWidth=".4" />
          <line x1="0" y1="-6.5" x2="0"    y2="-1.4" stroke="rgba(255,255,255,.35)" strokeWidth=".4" />
          <line x1="-2.8" y1="-2.8" x2="2.8" y2="-2.8" stroke="rgba(255,255,255,.18)" strokeWidth=".35" />
          <line x1="-4.2" y1="0"    x2="4.2" y2="0" stroke="rgba(255,255,255,.14)" strokeWidth=".35" />
          <line x1="0"    y1="2.2"  x2="-4.2" y2="0" stroke="rgba(0,0,0,.20)" strokeWidth=".35" />
          <line x1="0"    y1="2.2"  x2="4.2"  y2="0" stroke="rgba(0,0,0,.16)" strokeWidth=".35" />
          <line x1="0"    y1="2.2"  x2="0"    y2="6.5" stroke="rgba(0,0,0,.24)" strokeWidth=".35" />

          <ellipse cx="0" cy="0" rx="5.2" ry="6.6" fill="url(#g2-caus)" />
          <ellipse cx="0" cy="0" rx="5.2" ry="6.6" fill="url(#g2-flash)" />
          <ellipse cx="0" cy="0" rx="5.2" ry="6.6" fill="rgba(50,210,75,.0)">
            <animate attributeName="rx" values="6.5;9;6.5" dur="3.2s" repeatCount="indefinite" />
            <animate attributeName="ry" values="8.5;12;8.5" dur="3.2s" repeatCount="indefinite" />
            <animate attributeName="fill-opacity" values="0.055;0;0.055" dur="3.2s" repeatCount="indefinite" />
            <animate attributeName="fill" values="rgba(50,210,75,1);rgba(50,210,75,1);rgba(50,210,75,1)" dur="3.2s" repeatCount="indefinite" />
          </ellipse>
        </svg>
      </div>
    </div>
  );
};
