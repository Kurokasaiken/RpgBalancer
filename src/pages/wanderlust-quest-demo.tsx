import React from 'react';
import WanderlustSurface from '@/ui/wanderlust-surface/WanderlustSurface';
import WanderlustContent from '@/ui/wanderlust-surface/WanderlustContent';
import { QuestCard } from '@/ui/idleVillage/map/actionCards/wrappers/QuestCard';

/**
 * Wanderlust Quest Card Demo
 * 
 * Visual prototype: QuestCard inside WanderlustSurface with #0c0a07 background.
 * Tests typography integration and visual weight balance.
 */
export default function WanderlustQuestDemo() {
  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="mx-auto max-w-2xl space-y-8">
        <header className="text-center">
          <h1 className="mb-2 text-2xl font-bold text-amber-200">
            Wanderlust Quest Card Demo
          </h1>
          <p className="text-sm text-slate-400">
            QuestCard inside WanderlustSurface with #0c0a07 background
          </p>
        </header>

        {/* Quest Card inside WanderlustSurface */}
        <WanderlustSurface shape="card" material="bronze" interactive>
          <WanderlustContent variant="body">
            <QuestCard
              label="Hunt the Beast"
              icon="🗡️"
              subtitle="Forest of Whispers"
              helperText="Track and eliminate the corrupted beast"
              progressFraction={0.65}
              elapsedSeconds={390}
              totalDurationSeconds={600}
              assignees={[
                { id: '1', name: 'Aldric', portraitUrl: '/portraits/aldric.png' },
                { id: '2', name: 'Lyra', portraitUrl: '/portraits/lyra.png' },
              ]}
              assigneeDisplayLimit={2}
              statusLabel="In Progress"
              dataTestId="wanderlust-quest-card"
            />
          </WanderlustContent>
        </WanderlustSurface>

        {/* Typography test with WanderlustContent */}
        <WanderlustSurface shape="panel" material="bronze" interactive>
          <WanderlustContent variant="title">
            <h2>Typography Test</h2>
          </WanderlustContent>
          <WanderlustContent variant="subtitle">
            <h3>Subtitle in cream/gold</h3>
          </WanderlustContent>
          <WanderlustContent variant="body">
            <p>Body text in cream/gold for important content.</p>
          </WanderlustContent>
          <WanderlustContent variant="label">
            <span>Label in desaturated bronze</span>
          </WanderlustContent>
          <WanderlustContent variant="caption">
            <span>Caption in desaturated bronze</span>
          </WanderlustContent>
        </WanderlustSurface>
      </div>
    </div>
  );
}
