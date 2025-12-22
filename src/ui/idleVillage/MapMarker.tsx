import React from 'react';
import MarbleMedallionCard from '@/ui/fantasy/assets/marble-verb-card/MarbleMedallionCard';
import type { MarbleCardTone } from '@/ui/fantasy/assets/marble-verb-card/marbleCardTokens';
import type { VerbSummary } from '@/ui/idleVillage/verbSummaries';

interface MapMarkerProps {
  verb: VerbSummary;
  isActive?: boolean;
  isFinished?: boolean;
}

const resolveTone = (verb: VerbSummary): MarbleCardTone => {
  const tone = verb.tone ?? 'neutral';
  const allowed: MarbleCardTone[] = ['neutral', 'job', 'quest', 'danger', 'system', 'day', 'night'];
  if (allowed.includes(tone as MarbleCardTone)) {
    return tone as MarbleCardTone;
  }
  if (verb.isQuest) return 'quest';
  if (verb.isJob) return 'job';
  return 'neutral';
};

const MapMarker: React.FC<MapMarkerProps> = ({ verb, isActive = false }) => {
  const title = verb.label ?? verb.kindLabel ?? verb.key;
  const icon = verb.icon ?? '✦';
  const tone = resolveTone(verb);
  const progress = Number.isFinite(verb.progressFraction) ? Math.max(0, Math.min(1, verb.progressFraction)) : 0;

  return (
    <MarbleMedallionCard
      title={title}
      icon={icon}
      progress={progress}
      isActive={isActive}
      tone={tone}
    />
  );
};

export default MapMarker;
