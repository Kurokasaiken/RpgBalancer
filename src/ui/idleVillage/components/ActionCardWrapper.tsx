import React from 'react';
import { resolveActionCardProps, type ResolvedActionCardDescriptor } from '@/ui/idleVillage/utils/activityCardMapping';
import type { ActivityDefinition, IdleVillageConfig } from '@/balancing/config/idleVillage/types';
import type { ScheduledActivity, ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import JobCard from '@/ui/idleVillage/map/actionCards/wrappers/JobCard';
import QuestCard from '@/ui/idleVillage/map/actionCards/wrappers/QuestCard';
import TrainingCard from '@/ui/idleVillage/map/actionCards/wrappers/TrainingCard';
import MaintenanceCard from '@/ui/idleVillage/map/actionCards/wrappers/MaintenanceCard';
import { useActionCardsV2 } from '@/ui/idleVillage/hooks/useActionCardsV2';

/**
 * Props per il componente ActionCardWrapper
 */
export interface ActionCardWrapperProps {
  activity: ActivityDefinition;
  scheduled?: ScheduledActivity;
  config: IdleVillageConfig;
  residents?: Record<string, ResidentState>;
  currentTime?: number;
  secondsPerTimeUnit?: number;
  onCollect?: () => void;
  dataTestId?: string;
}

/**
 * Componente che wrappa la logica di selezione tra vecchio e nuovo sistema
 * Quando USE_ACTIONCARDS_V2 è true, usa i wrapper basati su resolveActionCardProps
 * Altrimenti, non renderizza nulla (legacy system)
 */
export const ActionCardWrapper: React.FC<ActionCardWrapperProps> = ({
  activity,
  scheduled,
  config,
  residents,
  currentTime = 0,
  secondsPerTimeUnit = config.globalRules.secondsPerTimeUnit ?? 60,
  onCollect,
  dataTestId,
}) => {
  // Se il flag è disabilitato, non renderizzare nulla (legacy system)
  if (!useActionCardsV2()) {
    return null;
  }

  // Risolvi le props usando resolveActionCardProps
  const descriptor: ResolvedActionCardDescriptor = resolveActionCardProps({
    activity,
    scheduled,
    config,
    residents,
    currentTime,
    secondsPerTimeUnit,
    dataTestId,
    onCollect,
  });

  // Renderizza il wrapper appropriato basato sul cardKind
  switch (descriptor.cardKind) {
    case 'job':
      return <JobCard {...descriptor.props} />;
    case 'quest':
      return <QuestCard {...descriptor.props} />;
    case 'training':
      return <TrainingCard {...descriptor.props} />;
    case 'maintenance':
      return <MaintenanceCard {...descriptor.props} />;
    default:
      // Fallback a JobCard per tipi non riconosciuti
      return <JobCard {...descriptor.props} />;
  }
};
