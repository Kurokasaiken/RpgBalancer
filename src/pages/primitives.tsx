import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Minus } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  MatericAmbientField,
  MatericBadge,
  MatericButton,
  MatericCarvedBar,
  MatericCloseButton,
  MatericDivider,
  MatericField,
  MatericFieldGroup,
  MatericFrame,
  MatericGrain,
  MatericHeading,
  MatericInset,
  MatericPlaque,
  MatericPortrait,
  MatericRecordList,
  MatericRequirementList,
  MatericSectionHeader,
  MatericSlot,
  MatericStatBar,
  MatericSurface,
  MatericTitleSep,
  MatericEventCard,
  MatericCloudWall,
} from '@/ui/designSystem/primitives';
import { Slot } from '@/ui/idleVillage/components/Slot';
import { GoblinInvasionWindow } from '@/ui/idleVillage/components/GoblinInvasionWindow';
import DayNightPoiSkin from '@/ui/idleVillage/components/minimal/DayNightPoiSkin';
import { WanderlustMedalOverlay } from '@/ui/idleVillage/components/WanderlustMedalOverlay';
import ThreatStatusIndicator from '@/ui/idleVillage/components/ThreatStatusIndicator';
import { SkinTitle } from '@/ui/idleVillage/skins/primitives/SkinTitle';
import { SkinScope } from '@/ui/idleVillage/skins/primitives/SkinScope';
import { WanderlustSurfaceDefs } from '@/ui/wanderlust-surface';

type TabId =
  | 'all'
  | 'frame'
  | 'surface'
  | 'layout'
  | 'lists'
  | 'stats'
  | 'actions'
  | 'slot'
  | 'gauge'
  | 'medallion'
  | 'glass'
  | 'threat'
  | 'skin'
  | 'event'
  | 'window';

const FIELD_BACKGROUND = [
  'radial-gradient(circle at 50% -10%, rgba(0,229,255,0.13) 0%, rgba(0,150,255,0.03) 50%, transparent 80%)',
  '#08121f',
].join(', ');

const TABS: { id: TabId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'frame', label: 'Frame' },
  { id: 'surface', label: 'Surface' },
  { id: 'layout', label: 'Layout' },
  { id: 'lists', label: 'Lists' },
  { id: 'stats', label: 'Stats' },
  { id: 'actions', label: 'Actions' },
  { id: 'slot', label: 'Slot' },
  { id: 'gauge', label: 'Gauge' },
  { id: 'medallion', label: 'Medallion' },
  { id: 'threat', label: 'Threat' },
  { id: 'skin', label: 'Skin' },
  { id: 'event', label: 'Event' },
  { id: 'window', label: 'Window' },
];

/** A compact demo panel that keeps the tab viewport above the fold. */
function DemoPanel({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <MatericSurface shape="panel" material="bronze" style={{ maxWidth: 1100, margin: '0 auto' }}>
      <MatericAmbientField fireflyCount={2} style={{ borderRadius: 'inherit', background: FIELD_BACKGROUND }}>
        <div style={{ padding: 24 }}>
          {children}
        </div>
      </MatericAmbientField>
    </MatericSurface>
  );
}

function FrameTab(): JSX.Element {
  return (
    <DemoPanel>
      <MatericHeading title="MatericFrame" subtitle="Molding frame only" />
      <MatericFrame variant="molding" floor={false}>
        <div style={{ padding: 12, color: 'var(--skin-body-color)', fontSize: 11 }}>Frame only</div>
      </MatericFrame>
    </DemoPanel>
  );
}

function SurfaceTab(): JSX.Element {
  return (
    <DemoPanel>
      <MatericHeading title="MatericSurface" subtitle="Ground, grain, inset" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
        <MatericSurface shape="card" material="jade" style={{ padding: 16 }}>
          <p style={{ color: 'var(--skin-body-color)', margin: 0 }}>Jade card surface.</p>
        </MatericSurface>
        <div style={{ position: 'relative', padding: 16, borderRadius: 12, background: '#060f16' }}>
          <MatericGrain />
          <p style={{ position: 'relative', zIndex: 1, color: 'var(--skin-body-color)' }}>Grain alone on a dark field.</p>
        </div>
        <MatericInset material="bronze">
          <p style={{ color: 'var(--skin-body-color)', margin: 0 }}>Bronze inset recess.</p>
        </MatericInset>
        <MatericInset material="obsidian">
          <p style={{ color: 'var(--skin-body-color)', margin: 0 }}>Obsidian inset recess.</p>
        </MatericInset>
      </div>
    </DemoPanel>
  );
}

function LayoutTab(): JSX.Element {
  return (
    <DemoPanel>
      <MatericHeading title="Layout" subtitle="Heading, field, group, dividers" />
      <MatericSectionHeader tier="primary" hint="primary tier">Primary Section</MatericSectionHeader>
      <MatericSectionHeader tier="tertiary" hint="tertiary tier">Tertiary Section</MatericSectionHeader>
      <MatericFieldGroup layout="columns" columns={3}>
        <MatericField label="Duration" value="14 days" />
        <MatericField label="Distance" value="Far Reach" />
        <MatericField label="Crew" value="3 / 5" />
      </MatericFieldGroup>
      <MatericDivider />
      <MatericTitleSep ornament="✦" />
      <MatericTitleSep ornament="◈" />
    </DemoPanel>
  );
}

function ListsTab(): JSX.Element {
  return (
    <DemoPanel>
      <MatericHeading title="Lists" subtitle="Record and requirement lists" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <MatericRecordList
          rail
          records={[
            ['Day 1', 'Scout entered'],
            ['Day 6', 'Signal detected'],
          ]}
          columns={[
            { width: '64px', variant: 'caption' },
            { width: '1fr', variant: 'body' },
          ]}
        />
        <MatericRequirementList
          requirements={[
            { label: 'Astronomy', current: 5, required: 3 },
            { label: 'Wisdom', current: 8, required: 10 },
          ]}
        />
      </div>
    </DemoPanel>
  );
}

function StatsTab(): JSX.Element {
  const label = (text: string) => (
    <span style={{ fontSize: 9, color: 'var(--skin-label-primary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>{text}</span>
  );
  return (
    <DemoPanel>
      <MatericHeading title="Stats" subtitle="Portrait, bars, carved channels" />
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <MatericPortrait initials="AR" size={56} isHero />
          {label('Portrait hero')}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <MatericPortrait initials="MK" size={48} />
          {label('Portrait')}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <MatericStatBar variant="hp" size="md" value={195} max={195} />
          {label('StatBar HP')}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <MatericStatBar variant="stamina" size="sm" value={100} max={100} />
          {label('StatBar stamina')}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <MatericCarvedBar energy="xp" value={63} max={100} label="Survey" />
          {label('CarvedBar XP')}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <MatericCarvedBar energy="danger" value={24} max={100} label="Threat" />
          {label('CarvedBar danger')}
        </div>
      </div>
    </DemoPanel>
  );
}

function ActionsTab(): JSX.Element {
  return (
    <DemoPanel>
      <MatericHeading title="Actions" subtitle="Buttons, badges, close" />
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <MatericButton>Utility</MatericButton>
        <MatericButton variant="secondary">Secondary</MatericButton>
        <MatericButton variant="cta" ornaments>AVVIA</MatericButton>
        <MatericBadge>Active</MatericBadge>
        <MatericBadge>Rare</MatericBadge>
        <MatericCloseButton />
      </div>
    </DemoPanel>
  );
}

function SlotTab(): JSX.Element {
  return (
    <DemoPanel>
      <MatericHeading title="Slot & Plaque" subtitle="Real Slot v12 + engraved badges" />
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap', marginBottom: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <Slot slotProps={{ letter: 'A', state: 'occupied', sizePx: 120 }} />
          <span style={{ fontSize: 10, color: 'var(--skin-body-color)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Astronomer</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <Slot slotProps={{ letter: 'S', state: 'occupied', sizePx: 120 }} />
          <span style={{ fontSize: 10, color: 'var(--skin-body-color)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Scout</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <Slot slotProps={{ letter: '—', state: 'empty', sizePx: 120 }} />
          <span style={{ fontSize: 10, color: 'var(--skin-body-color)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Empty</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <MatericPlaque>Expedition</MatericPlaque>
        <MatericPlaque>Rare</MatericPlaque>
        <MatericPlaque>Elite</MatericPlaque>
      </div>
    </DemoPanel>
  );
}

function AllTab(): JSX.Element {
  return (
    <DemoPanel>
      <MatericHeading
        title="Primitive Lab"
        subtitle="All primitives together"
        description="Same surface, same skin, all primitives visible at once."
      />

      <MatericTitleSep />
      <MatericSectionHeader tier="tertiary" hint="surface">Frame, Surface, Grain, Inset</MatericSectionHeader>

      <div style={{ display: 'flex', gap: 12, alignItems: 'stretch', marginBottom: 12 }}>
        <MatericFrame variant="molding" style={{ flex: 1 }} floor={false}>
          <div style={{ padding: 12, color: 'var(--skin-body-color)', fontSize: 11 }}>MatericFrame</div>
        </MatericFrame>
        <MatericSurface shape="card" material="jade" style={{ flex: 1, padding: 12 }}>
          <span style={{ color: 'var(--skin-body-color)', fontSize: 11 }}>MatericSurface</span>
        </MatericSurface>
        <MatericInset material="bronze" style={{ flex: 1, padding: 12 }}>
          <span style={{ color: 'var(--skin-body-color)', fontSize: 11 }}>MatericInset</span>
        </MatericInset>
      </div>

      <div style={{ position: 'relative', height: 56, borderRadius: 8, background: '#060f16', marginBottom: 12, overflow: 'hidden' }}>
        <MatericGrain />
        <div style={{ position: 'relative', zIndex: 1, padding: 12, color: 'var(--skin-body-color)', fontSize: 11 }}>MatericGrain</div>
      </div>

      <MatericSectionHeader tier="tertiary" hint="layout">Heading, Field, Group, Dividers</MatericSectionHeader>
      <MatericHeading title="MatericHeading" subtitle="subtitle" as="h3" />
      <MatericFieldGroup layout="columns" columns={3}>
        <MatericField label="A" value="1" />
        <MatericField label="B" value="2" />
        <MatericField label="C" value="3" />
      </MatericFieldGroup>
      <MatericDivider />
      <MatericTitleSep ornament="✦" />

      <MatericSectionHeader tier="tertiary" hint="lists">Record &amp; Requirement Lists</MatericSectionHeader>
      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <MatericRecordList
          rail
          records={[['D1', 'Scout'], ['D2', 'Signal']]}
          columns={[{ width: '40px', variant: 'caption' }, { width: '1fr', variant: 'body' }]}
          style={{ flex: 1 }}
        />
        <MatericRequirementList
          requirements={[
            { label: 'Astronomy', current: 5, required: 3 },
            { label: 'Wisdom', current: 8, required: 10 },
          ]}
          style={{ flex: 1 }}
        />
      </div>

      <MatericSectionHeader tier="tertiary" hint="media">Portrait, Bars, Carved</MatericSectionHeader>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
        <MatericPortrait initials="AR" size={46} isHero />
        <MatericStatBar variant="hp" size="sm" value={120} max={150} style={{ width: 130 }} />
        <MatericCarvedBar energy="xp" value={63} max={100} height={10} label="XP" showValue={false} style={{ width: 130 }} />
      </div>

      <MatericSectionHeader tier="tertiary" hint="actions">Button, Badge, Close</MatericSectionHeader>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
        <MatericButton>OK</MatericButton>
        <MatericBadge>Active</MatericBadge>
        <MatericCloseButton style={{ width: 28, height: 28 }} />
        <MatericPlaque>Rare</MatericPlaque>
      </div>

      <MatericSectionHeader tier="tertiary" hint="slot &amp; plaque">Slot and Plaque</MatericSectionHeader>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <Slot slotProps={{ letter: 'A', state: 'occupied', sizePx: 80 }} />
        <Slot slotProps={{ letter: '—', state: 'empty', sizePx: 80 }} />
      </div>
    </DemoPanel>
  );
}

function GaugeTab(): JSX.Element {
  return (
    <DemoPanel>
      <MatericHeading title="Gauge / Dial" subtitle="Day/Night arc" />
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        <DayNightPoiSkin isDayPhase cycleProgress={0.35} isPaused />
      </div>
    </DemoPanel>
  );
}

function MedallionTab(): JSX.Element {
  return (
    <DemoPanel>
      <MatericHeading title="Medallion" subtitle="WanderlustMedalOverlay" />
      <WanderlustMedalOverlay sizePx={96} portraitUrl="/assets/portraits/portrait male warrior.png" />
    </DemoPanel>
  );
}

function ThreatTab(): JSX.Element {
  return (
    <DemoPanel>
      <MatericHeading title="Threat" subtitle="ThreatStatusIndicator" />
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <ThreatStatusIndicator urgency={0} />
        <ThreatStatusIndicator urgency={1} />
        <ThreatStatusIndicator urgency={2} />
      </div>
    </DemoPanel>
  );
}

function SkinTab(): JSX.Element {
  return (
    <DemoPanel>
      <MatericHeading title="Skin primitives" subtitle="SkinTitle, SkinScope" />
      <SkinScope>
        <div style={{ padding: 16 }}>
          <SkinTitle level="1">Title</SkinTitle>
          <SkinTitle level="section">Section</SkinTitle>
          <SkinTitle level="subtitle">Subtitle</SkinTitle>
          <div style={{ display: 'flex', gap: 8 }}>
            <MatericButton style={{ padding: 6 }} aria-label="Minimize">
              <Minus size={16} />
            </MatericButton>
            <MatericCloseButton style={{ width: 28, height: 28 }} />
          </div>
        </div>
      </SkinScope>
    </DemoPanel>
  );
}

function EventTab(): JSX.Element {
  const { t } = useTranslation('idleVillage');
  const [show, setShow] = useState(true);
  const [stage, setStage] = useState<'modal' | 'reminder'>('modal');
  const mockedDays = 5;

  const isModal = stage === 'modal';

  const handleToggle = () => {
    setShow((s) => {
      const next = !s;
      if (next) setStage('modal');
      return next;
    });
  };

  return (
    <DemoPanel>
      <MatericHeading title="Event" subtitle="Goblin Invasion Window inside MatericEventCard" />
      <button
        type="button"
        onClick={handleToggle}
        style={{ marginBottom: 16, padding: '8px 16px' }}
      >
        {show ? 'Hide Event' : 'Show Event'}
      </button>
      <div style={{ position: 'relative', width: 500, height: 560 }}>
        {show && (
          <>
            <MatericCloudWall
              size={500}
              rimLight={false}
              style={{ top: 0, left: 0, zIndex: 1 }}
            />
            <motion.div
              initial={{ x: 0, y: 0, scale: 1 }}
              animate={
                isModal
                  ? { x: 0, y: 0, scale: 1 }
                  : { x: 120, y: -180, scale: 0.35 }
              }
              transition={{
                x: { duration: 1.2, ease: 'easeInOut' },
                y: { duration: 1.2, ease: 'easeInOut' },
                scale: { duration: 1.2, ease: 'easeInOut' },
              }}
              style={{ position: 'relative' }}
            >
              <MatericEventCard
                variant="modal"
                badge={String(t('world.goblinInvasion.invasion'))}
                subtitle={String(t('world.goblinInvasion.subtitle', { count: mockedDays }))}
                image={
                  <div style={{ width: 364, height: 294, overflow: 'hidden', margin: '0 auto' }}>
                    <GoblinInvasionWindow
                      ariaLabel={String(t('world.goblinInvasion.title'))}
                      style={{ transform: 'scale(0.7)', transformOrigin: 'top left' }}
                    />
                  </div>
                }
                actionLabel={String(t('world.goblinInvasion.action'))}
                onAction={() => isModal && setStage('reminder')}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  transform: 'translate(-50%, -50%) scale(3)',
                  zIndex: 2,
                  maxWidth: 460,
                  width: 460,
                  minHeight: 500,
                }}
              />
            </motion.div>
          </>
        )}
      </div>
    </DemoPanel>
  );
}

function WindowTab(): JSX.Element {
  return (
    <DemoPanel>
      <MatericHeading title="Window" subtitle="Goblin Invasion glass case — frame A/B/C prototypes" />
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {(['A', 'B', 'C'] as const).map((v) => (
          <div
            key={v}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              minWidth: 1040,
              minHeight: 840,
            }}
          >
            <GoblinInvasionWindow
              ariaLabel={`Goblin Invasion ${v}`}
              variant={v}
              style={{ transform: 'scale(2)' }}
            />
            <span style={{ fontSize: 10, color: 'var(--skin-body-color)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{v}</span>
          </div>
        ))}
      </div>
    </DemoPanel>
  );
}

const TAB_CONTENT: Record<TabId, () => JSX.Element> = {
  all: AllTab,
  frame: FrameTab,
  surface: SurfaceTab,
  layout: LayoutTab,
  lists: ListsTab,
  stats: StatsTab,
  actions: ActionsTab,
  slot: SlotTab,
  gauge: GaugeTab,
  medallion: MedallionTab,
  threat: ThreatTab,
  skin: SkinTab,
  event: EventTab,
  window: WindowTab,
};

export default function PrimitivesPage(): JSX.Element {
  const [tab, setTab] = useState<TabId>(TABS[TABS.length - 1].id);
  const TabComponent = TAB_CONTENT[tab];

  return (
    <>
      <WanderlustSurfaceDefs />
      <div
        style={{
          minHeight: '100vh',
          padding: 24,
          background: 'radial-gradient(circle at 50% 0%, #0b1624, #04070a)',
        }}
      >
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 20,
                  border: '1px solid rgba(180,130,30,0.5)',
                  background: tab === t.id ? 'rgba(180,130,30,0.35)' : 'rgba(6,10,16,0.8)',
                  color: tab === t.id ? '#f0cf6a' : 'var(--skin-body-color)',
                  cursor: 'pointer',
                  fontFamily: 'var(--skin-font-display)',
                  fontSize: 12,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
          <TabComponent />
        </div>
      </div>
    </>
  );
}
