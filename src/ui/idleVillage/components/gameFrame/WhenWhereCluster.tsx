import React from 'react';
import { useTranslation } from 'react-i18next';
import { MatericField } from '@/ui/designSystem/primitives';
import DayNightPoiSkin from '@/ui/idleVillage/components/minimal/DayNightPoiSkin';

export interface WhenWhereClusterProps {
  isDayPhase: boolean;
  cycleProgress: number;
  isPaused: boolean;
  currentDay: number;
  /** Where the player is looking — already i18n-resolved. */
  placeName: string;
}

/**
 * "When and where" — content for the top-centre ribbon.
 *
 * The reference mockup runs day · weather · place across this ribbon. We have
 * no weather system, so that cell is simply absent rather than invented
 * (Director: "la meccanica non è da prendere dal mockup"). In its place the
 * real day/night medallion (`DayNightPoiSkin`, already a certified POI-family
 * gauge with its own progress halo) does the job the mockup's sun icon was
 * doing, and actually means something: it shows how far through the phase we
 * are, not just which phase it is.
 */
export const WhenWhereCluster: React.FC<WhenWhereClusterProps> = ({
  isDayPhase,
  cycleProgress,
  isPaused,
  currentDay,
  placeName,
}) => {
  const { t } = useTranslation('idleVillage');

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div
        style={{
          width: 34,
          height: 34,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <div style={{ transform: 'scale(0.42)', transformOrigin: 'center' }}>
          <DayNightPoiSkin isDayPhase={isDayPhase} cycleProgress={cycleProgress} isPaused={isPaused} />
        </div>
      </div>

      <MatericField
        tier="tertiary"
        orientation="horizontal"
        label={t('gameFrame.status.dayLabel')}
        value={currentDay}
        style={{ gap: 7 }}
      />

      <span aria-hidden="true" style={{ width: 1, height: 18, background: 'var(--skin-separator)' }} />

      <span
        style={{
          fontFamily: 'var(--skin-font-serif)',
          fontSize: 13,
          color: 'var(--skin-body-color, rgba(237,224,196,0.92))',
          whiteSpace: 'nowrap',
        }}
      >
        {placeName}
      </span>
    </div>
  );
};

export default WhenWhereCluster;
