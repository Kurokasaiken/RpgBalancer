// src/ui/overlay/OverlayShell.tsx
// Main overlay shell component that layouts and renders overlay widgets

import { useOverlayMode } from './OverlayModeContext';

// Temporary inline widget components (will be extracted later)
const OverlayResourcesWidget = ({ resources }: { resources?: Record<string, { amount: number; label: string; icon: string; colorClass: string }> }) => (
  <div className="space-y-2">
    <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Resources</h3>
    <div className="grid grid-cols-2 gap-2">
      {resources ? Object.entries(resources).map(([id, data]) => (
        <div key={id} className="flex items-center gap-2">
          <span className={data.colorClass}>{data.icon}</span>
          <span className="text-sm text-slate-200">{data.amount}</span>
        </div>
      )) : (
        <div className="col-span-2 text-xs text-slate-400">No resources data</div>
      )}
    </div>
  </div>
);

const OverlayActivitiesWidget = ({ activities }: { activities?: Array<{ id: string; label: string; assignees: string[]; progress: number }> }) => (
  <div className="space-y-2">
    <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Activities</h3>
    <div className="space-y-1">
      {activities ? activities.map((activity) => (
        <div key={activity.id} className="text-xs text-slate-300">
          {activity.label} ({activity.assignees.length} assigned)
        </div>
      )) : (
        <div className="text-xs text-slate-400">No activities data</div>
      )}
    </div>
  </div>
);

const OverlayTimeWidget = ({ time }: { time?: { currentDay: number; timeOfDay: string; isPaused: boolean } }) => (
  <div className="space-y-2">
    <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Time</h3>
    <div className="text-xs text-slate-300">
      {time ? `Day ${time.currentDay} - ${time.timeOfDay}` : 'No time data'}
    </div>
  </div>
);

const OverlayVillagersWidget = ({ villagers }: { villagers?: Array<{ id: string; name: string; status: string; fatigue: number }> }) => (
  <div className="space-y-2">
    <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Villagers</h3>
    <div className="space-y-1">
      {villagers ? villagers.map((villager) => (
        <div key={villager.id} className="text-xs text-slate-300">
          {villager.name} - {villager.status}
        </div>
      )) : (
        <div className="text-xs text-slate-400">No villagers data</div>
      )}
    </div>
  </div>
);

interface OverlayShellProps {
  /** Mock game data for testing */
  mockData?: {
    resources?: Record<string, { amount: number; label: string; icon: string; colorClass: string }>;
    activities?: Array<{ id: string; label: string; assignees: string[]; progress: number }>;
    time?: { currentDay: number; timeOfDay: string; isPaused: boolean };
    villagers?: Array<{ id: string; name: string; status: string; fatigue: number }>;
  };
}

export function OverlayShell({ mockData }: OverlayShellProps) {
  const { state } = useOverlayMode();

  if (!state.isActive) {
    return null;
  }

  // Calculate CSS classes based on state
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  const sizeClasses = {
    compact: 'w-80 max-h-96',
    medium: 'w-96 max-h-[32rem]',
    wide: 'w-[28rem] max-h-[36rem]',
  };

  const overlayClasses = [
    'fixed',
    positionClasses[state.position],
    sizeClasses[state.size],
    'bg-slate-900/95',
    'border',
    'border-slate-700',
    'rounded-lg',
    'shadow-2xl',
    'backdrop-blur-sm',
    'overflow-hidden',
    'transition-all',
    'duration-200',
    'z-50',
  ];

  if (state.transparency) {
    overlayClasses.push('bg-slate-900/80', 'border-slate-600/50');
  }

  const style = {
    transform: `scale(${state.zoom})`,
    transformOrigin: 'top left',
  };

  // Sort widgets by order
  const sortedWidgets = [...state.widgets]
    .filter(widget => widget.enabled)
    .sort((a, b) => a.order - b.order);

  const renderWidget = (widgetId: string) => {
    switch (widgetId) {
      case 'resources':
        return <OverlayResourcesWidget resources={mockData?.resources} />;
      case 'activities':
        return <OverlayActivitiesWidget activities={mockData?.activities} />;
      case 'time':
        return <OverlayTimeWidget time={mockData?.time} />;
      case 'villagers':
        return <OverlayVillagersWidget villagers={mockData?.villagers} />;
      default:
        return <div className="p-4 text-slate-400">Unknown widget: {widgetId}</div>;
    }
  };

  return (
    <div className={overlayClasses.join(' ')} style={style}>
      {/* Header with controls */}
      <div className="flex items-center justify-between p-3 border-b border-slate-700 bg-slate-800/50">
        <h2 className="text-sm font-medium text-slate-200">Idle Village Overlay</h2>
        <div className="flex items-center gap-2">
          {/* Position indicator */}
          <span className="text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded">
            {state.position}
          </span>
          {/* Size indicator */}
          <span className="text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded">
            {state.size}
          </span>
          {/* Zoom indicator */}
          <span className="text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded">
            {Math.round(state.zoom * 100)}%
          </span>
        </div>
      </div>

      {/* Widget content */}
      <div className="divide-y divide-slate-700 max-h-full overflow-y-auto">
        {sortedWidgets.map(widget => (
          <div key={widget.id} className="p-3">
            {renderWidget(widget.id)}
          </div>
        ))}
      </div>

      {/* Resize handle (visual only for now) */}
      <div className="absolute bottom-0 right-0 p-1 cursor-se-resize">
        <div className="w-2 h-2 border-t border-r border-slate-500"></div>
      </div>
    </div>
  );
}
