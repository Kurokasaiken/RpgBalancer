/**
 * HudRealRosterDrape — PLAN-113 R-319.
 * Roster gagliardetto scrollabile infinito + toggle comparsa/scomparsa:
 * - Drappo fisso di velluto smeraldo appeso all'asta dorata (senza elmo).
 * - Corona d'alloro modulare che si ripete all'infinito per tutti i residenti (anche 40+).
 * - Ritratti innestati direttamente nei castoni naturali dell'alloro (nessun anello sdoppiato).
 * - Toggle apri/chiudi: clic sull'asta per arrotolare/srotolare il gagliardetto.
 */
import React, { useState } from 'react';
import { useCanonicalRosterData } from '@/ui/idleVillage/roster';

const DRAPE_BG = '/assets/ui/hud-real/roster/drape-bg.webp';
const LAUREL = '/assets/ui/hud-real/roster/laurel-strand.webp';

// Relative socket centers inside laurel-strand.webp (480 x 2192)
// Sockets alternate organically left / right
const LAUREL_SOCKETS = [
  { x: 324 / 480, y: 352 / 2192 },
  { x: 167 / 480, y: 633 / 2192 },
  { x: 313 / 480, y: 866 / 2192 },
  { x: 153 / 480, y: 1087 / 2192 },
  { x: 313 / 480, y: 1348 / 2192 },
  { x: 159 / 480, y: 1516 / 2192 },
  { x: 310 / 480, y: 1768 / 2192 },
];

export function HudRealRosterDrape() {
  const residents = useCanonicalRosterData();
  const [isOpen, setIsOpen] = useState(true);

  // Number of laurel sections needed to hold all residents (minimum 1)
  const sectionsCount = Math.max(1, Math.ceil(residents.length / LAUREL_SOCKETS.length));

  return (
    <div
      data-testid="hudreal-roster-drape"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        containerType: 'size',
        overflow: 'visible',
        userSelect: 'none',
      }}
    >
      {/* 1. Barra superiore interattiva: asta dorata con bottone per ritirare/estrarre */}
      <button
        type="button"
        data-testid="roster-drape-toggle"
        onClick={() => setIsOpen((prev) => !prev)}
        title={isOpen ? 'Riduci gagliardetto' : 'Apri roster gagliardetto'}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100%',
          height: '11%',
          background: 'none',
          border: 'none',
          padding: 0,
          margin: 0,
          cursor: 'pointer',
          zIndex: 10,
          outline: 'none',
        }}
      />

      {/* 2. Il drappo + alloro: animazione di srotolamento/arrotolamento verso l'asta */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transformOrigin: 'top center',
          transform: isOpen ? 'translateY(0) scaleY(1)' : 'translateY(-88%) scaleY(0.12)',
          opacity: isOpen ? 1 : 0.4,
          transition: 'transform 0.42s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease',
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
      >
        {/* Sfondo fisso: Drappo di velluto smeraldo */}
        <img
          src={DRAPE_BG}
          alt=""
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            objectPosition: 'top center',
            pointerEvents: 'none',
            zIndex: 1,
            filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.65))',
          }}
        />

        {/* 3. Area scorrevole infinita: accoglie 40+ residenti con sezioni collegate */}
        <div
          data-testid="roster-drape-scroll"
          style={{
            position: 'absolute',
            left: '8%',
            right: '8%',
            top: '8.5%',
            bottom: '7%',
            zIndex: 2,
            overflowY: 'auto',
            overflowX: 'hidden',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 6%, black 93%, transparent 100%)',
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 6%, black 93%, transparent 100%)',
          }}
        >
          {Array.from({ length: sectionsCount }).map((_, sectionIdx) => (
            <div
              key={`laurel-sec-${sectionIdx}`}
              style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '480 / 2192',
                // Slight overlap between sections so the garland stem connects smoothly
                marginTop: sectionIdx > 0 ? '-8%' : '0',
              }}
            >
              {/* Ghirlanda d'alloro scolpita */}
              <img
                src={LAUREL}
                alt=""
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'fill',
                  pointerEvents: 'none',
                }}
              />

              {/* Ritratti reali incastonati nei castoni naturali dell'alloro (zero anello sdoppiato) */}
              {LAUREL_SOCKETS.map((pos, socketIdx) => {
                const residentIdx = sectionIdx * LAUREL_SOCKETS.length + socketIdx;
                if (residentIdx >= residents.length) return null;
                const resident = residents[residentIdx];

                return (
                  <div
                    key={resident.id ?? residentIdx}
                    data-resident-id={resident.id}
                    title={`${resident.name} (${resident.role ?? 'Adventurer'})`}
                    style={{
                      position: 'absolute',
                      left: `${pos.x * 100}%`,
                      top: `${pos.y * 100}%`,
                      width: '27%',
                      aspectRatio: '1',
                      transform: 'translate(-50%, -50%)',
                      cursor: 'pointer',
                      zIndex: 3,
                    }}
                  >
                    {/* Ritratto del residente dentro il vetro del castone originale */}
                    {resident.portraitUrl ? (
                      <img
                        src={resident.portraitUrl}
                        alt={resident.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.85), 0 0 2px rgba(0,0,0,0.9)',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          borderRadius: '50%',
                          background: '#12221e',
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* 4. Asta superiore sempre presente come perno d'ancoraggio */}
      {!isOpen && (
        <div
          onClick={() => setIsOpen(true)}
          style={{
            position: 'absolute',
            left: '12%',
            top: '8%',
            padding: '4px 10px',
            background: 'linear-gradient(180deg, #18332a 0%, #0d1e18 100%)',
            border: '1px solid #c9a24a',
            borderRadius: '12px',
            color: '#e8d5a3',
            font: '10px Cinzel, serif',
            cursor: 'pointer',
            zIndex: 11,
            boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
            letterSpacing: '1px',
          }}
        >
          ROSTER ({residents.length}) ▼
        </div>
      )}
    </div>
  );
}
