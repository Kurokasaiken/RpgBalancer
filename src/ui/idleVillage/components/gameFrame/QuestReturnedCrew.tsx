/**
 * QuestReturnedCrew — «who came back» in the end-of-run report (PLAN-067 T-C2 / T-C6, R-234).
 *
 * One niche per party member: an arched portrait frame, the name, the HP bar and a state tag
 * (returned / wounded / fallen — never a colour alone). Hover or focus opens the person's own
 * tooltip: what happened to them (from the run log), the title and illness they carry (granted
 * per person by the scenario's epilogue), and the character slot (not recorded yet).
 * Tokens only; the fallen read in cold iron (COL-D), never violet.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import * as Tooltip from '@radix-ui/react-tooltip';
import { EngravedIcon } from './engravedIcons';
import type { QuestRunState, RuntimeMember } from '@/ui/idleVillage/questS1Lab/questRun';
import type { QuestScenario } from '@/balancing/config/idleVillage/quests/questScenario.schema';
import { buildQuestEpilogue } from '@/ui/idleVillage/quests/questEpilogue';
import { TONE } from '@/ui/idleVillage/questS1Lab/hud/atoms';

type CrewState = 'returned' | 'wounded' | 'fallen';
const stateOf = (m: RuntimeMember): CrewState => (m.dead ? 'fallen' : m.wounded ? 'wounded' : 'returned');

const FONT = { display: 'var(--skin-font-display)', serif: 'var(--skin-font-serif)' } as const;
const BORDER: Record<CrewState, string> = {
  returned: 'var(--skin-hud-brass-hi)',
  wounded: 'color-mix(in srgb, var(--skin-status-wound) 80%, var(--skin-hud-brass-hi))',
  fallen: 'var(--skin-state-fallen)',
};

/** The run log lines that name this person and record harm — «what happened», in the locale. */
const causesOf = (run: QuestRunState, m: RuntimeMember): string[] =>
  (run.log ?? [])
    .filter((e) => (e.kind === 'WOUND' || e.kind === 'DEATH') && e.text.includes(m.name))
    .map((e) => e.text);

const Niche: React.FC<{ member: RuntimeMember; titles: string[]; diseases: string[]; causes: string[] }> = ({ member, titles, diseases, causes }) => {
  const { t } = useTranslation('idleVillage');
  const state = stateOf(member);
  const label = t(`gameFrame.questEpilogue.crew${state === 'returned' ? 'Returned' : state === 'wounded' ? 'Wounded' : 'Fallen'}`);
  const hpPct = Math.max(0, Math.min(100, Math.round((member.hp / Math.max(1, member.maxHp)) * 100)));
  const tagColor = state === 'fallen' ? 'var(--skin-state-fallen)' : state === 'wounded' ? TONE.danger : TONE.secondary;
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <button
          type="button"
          data-testid={`crew-niche-${member.id}`}
          data-crew-state={state}
          aria-label={`${member.name} — ${label}`}
          style={{ all: 'unset', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'help', minWidth: 0 }}
        >
          <span
            style={{
              position: 'relative', width: '100%', height: 96, borderRadius: '44px 44px 8px 8px', overflow: 'hidden',
              border: `1.5px solid ${BORDER[state]}`,
              background: 'linear-gradient(180deg, var(--skin-hud-lacquer-base), var(--skin-hud-lacquer-deep))',
              boxShadow: 'inset 0 0 0 3px var(--skin-hud-lacquer-deep), 0 6px 14px var(--skin-hud-lacquer-deep)',
            }}
          >
            <span
              data-crew-portrait=""
              style={{
                position: 'absolute', inset: '5px 5px 20px', borderRadius: '38px 38px 4px 4px',
                backgroundImage: member.portrait ? `url(${member.portrait})` : undefined,
                backgroundSize: 'cover', backgroundPosition: 'center 22%',
                filter: state === 'fallen' ? 'grayscale(1) brightness(.7)' : undefined,
                display: 'grid', placeItems: 'center', color: 'color-mix(in srgb, var(--skin-title-color) 40%, transparent)',
              }}
            >
              {!member.portrait && <EngravedIcon id={member.role === 'leader' ? 'role-leader' : member.role === 'bodyguard' ? 'role-bodyguard' : 'role-member'} size={34} aria-hidden />}
            </span>
            <span
              style={{
                position: 'absolute', left: 0, right: 0, bottom: 0, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                font: `600 11px ${FONT.display}`, letterSpacing: '0.08em', textTransform: 'uppercase', color: tagColor,
                background: 'color-mix(in srgb, var(--skin-hud-lacquer-deep) 88%, transparent)',
              }}
            >
              <EngravedIcon id={state === 'fallen' ? 'status-fallen' : state === 'wounded' ? 'status-wound' : 'ico-spark'} size={11} aria-hidden />
              {label}
            </span>
          </span>
          <span style={{ font: `600 13px/1.15 ${FONT.display}`, letterSpacing: '0.04em', color: state === 'fallen' ? 'var(--skin-state-fallen)' : TONE.text, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {member.name}
          </span>
          <span aria-hidden style={{ width: 'calc(100% - 12px)', height: 5, borderRadius: 3, background: 'color-mix(in srgb, var(--skin-text-primary) 12%, transparent)', overflow: 'hidden' }}>
            <i style={{ display: 'block', width: `${hpPct}%`, height: '100%', background: state === 'fallen' ? 'var(--skin-state-fallen)' : TONE.ok }} />
          </span>
        </button>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          side="top"
          sideOffset={8}
          collisionPadding={8}
          data-testid={`crew-tip-${member.id}`}
          style={{
            zIndex: 2600, width: 262, padding: '10px 12px', borderRadius: 8, pointerEvents: 'none',
            border: '1px solid var(--skin-hud-brass-hi)',
            background: 'linear-gradient(180deg, var(--skin-hud-lacquer-base), var(--skin-hud-lacquer-deep))',
            boxShadow: '0 14px 28px var(--skin-hud-lacquer-deep)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, font: `600 13px ${FONT.display}`, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--skin-title-color)' }}>
            {member.name}
            <span style={{ color: tagColor }}>{label}</span>
          </div>
          <dl style={{ margin: '8px 0 0', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '5px 10px', font: `14px/1.3 ${FONT.serif}`, color: TONE.text }}>
            {causes.length > 0 && (<><Dt>{t('gameFrame.questEpilogue.tipCause')}</Dt><dd style={{ margin: 0 }}>{causes.join(' ')}</dd></>)}
            <Dt>{t('gameFrame.questEpilogue.tipTitles')}</Dt>
            <dd data-crew-tip-titles="" style={{ margin: 0 }}>{titles.length > 0 ? titles.join(', ') : <None />}</dd>
            <Dt>{t('gameFrame.questEpilogue.tipDiseases')}</Dt>
            <dd data-crew-tip-diseases="" style={{ margin: 0 }}>{diseases.length > 0 ? diseases.join(', ') : <None />}</dd>
            <Dt>{t('gameFrame.questEpilogue.tipCharacter')}</Dt>
            <dd style={{ margin: 0, color: TONE.secondary, fontStyle: 'italic' }}>{t('gameFrame.questEpilogue.tipCharacterTbd')}</dd>
          </dl>
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
};

const Dt: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <dt style={{ font: `500 12px ${FONT.display}`, letterSpacing: '0.1em', textTransform: 'uppercase', color: TONE.label, paddingTop: 2 }}>{children}</dt>
);
const None: React.FC = () => {
  const { t } = useTranslation('idleVillage');
  return <span style={{ color: TONE.secondary, fontStyle: 'italic' }}>{t('gameFrame.questEpilogue.tipNone')}</span>;
};

export const QuestReturnedCrew: React.FC<{ run: QuestRunState; scenario?: QuestScenario }> = ({ run, scenario }) => {
  const { t } = useTranslation('idleVillage');
  if (run.party.length === 0) return null;
  const sections = buildQuestEpilogue(run, scenario);
  const grantsOf = (id: 'titles' | 'diseases', memberId: string) =>
    (sections.find((s) => s.id === id)?.lines ?? []).filter((l) => l.memberId === memberId).map((l) => l.text ?? '');
  return (
    <Tooltip.Provider delayDuration={200} skipDelayDuration={150}>
      <section
        data-testid="quest-returned-crew"
        aria-label={t('gameFrame.questEpilogue.crewTitle')}
        style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
      >
        <span style={{ font: `500 12px ${FONT.display}`, letterSpacing: '0.16em', textTransform: 'uppercase', color: TONE.label }}>
          {t('gameFrame.questEpilogue.crewTitle')}
        </span>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(4, run.party.length)}, minmax(0, 1fr))`, gap: 10 }}>
          {run.party.map((m) => (
            <Niche key={m.id} member={m} titles={grantsOf('titles', m.id)} diseases={grantsOf('diseases', m.id)} causes={causesOf(run, m)} />
          ))}
        </div>
      </section>
    </Tooltip.Provider>
  );
};

export default QuestReturnedCrew;
