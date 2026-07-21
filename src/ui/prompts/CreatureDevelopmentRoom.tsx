import { useMemo, useState } from 'react';

/**
 * Static data for the Gnarled Nightmare, sourced from the canonical
 * Creature IP Development System documents.
 */
const GNARLED_NIGHTMARE_ROOM = {
  name: 'Gnarled Nightmare',
  status: 'canonical',
  version: '1.0.0',
  authority: 'creature',
  approvedBy: ['art_director', 'narrative_director'],
  family: 'Forest Parasites',
  familyUrl: '/src/docs/docs/art-direction/creatures/families/forest-parasites/family-dna.md',
  familyDna: [
    'Core Fantasy: Ancient forest folklore corrupted into living organisms.',
    'Mandatory Traits: organic material, asymmetrical silhouette, environmental traces, slow then burst, small glowing eyes.',
    'Forbidden: armor, weapons, humanoid faces, sci-fi, perfect symmetry, human hands.',
    'Emotional Space: curiosity, unease, punctual awe.',
    'Material Palette: living wood, obsidian, black sap, ritual silk, amber, bone.',
  ],
  whyExists: [
    'Gameplay Purpose: Teach the player that forests must be prepared before entering.',
    'Player Lesson: Observation before confrontation.',
    'Desired Emotion: Curiosity mixed with caution.',
    'Desired Player Behavior: Use preparation items and observe the environment.',
  ],
  identity: [
    ['Creature Type', 'Parasite'],
    ['Family', 'Forest Parasites'],
    ['Identity Sentence', 'A folklore tree parasite that moves like dead wood until it snaps, leaving the forest silent and wounded.'],
    ['Silhouette Hook', 'Hunched asymmetrical wooden hump, tiny glowing amber eyes set in dark knotholes.'],
    ['Materials', 'Ancient living wood, jagged black obsidian shards, torn ritual silks.'],
    ['Movement', 'slides, bends, remains still, then bursts sideways'],
  ],
  decisions: [
    { version: '0.1.0', text: 'Humanoid goblin face rejected: too generic, violated family non-humanoid rule.' },
    { version: '0.2.0', text: 'Converted into parasitic wooden organism: better wonder/ecology tone.' },
    { version: '0.3.0', text: 'Moved to founding member of Forest Parasites family.' },
    { version: '1.0.0', text: 'Canonical approval by art_director and narrative_director.' },
  ],
  prompt: `A parasitic forest creature (NOT a goblin, NOT an orc, NOT a troll) —
a folklore tree parasite that moves like dead wood until it snaps,
leaving the forest silent and wounded.

Silhouette: hunched asymmetrical wooden hump, tiny glowing amber eyes
set deep in dark knotholes.
Shape Language: inverted triangle + tiny circles.
Movement: slides, bends, remains still then bursts sideways.
Materials: ancient living wood, jagged black obsidian shards,
torn ritual silks.
Colors: forest emerald, amber eyes, warm gold light;
NO grey, NO brown, NO mud.
Anatomy: uneven wooden fingers with obsidian tips,
no human hands, no symmetrical limbs, no pointed ears, no fangs.
Environment: clinging to a colossal dead tree in an ancient
sun-drenched forest, crystal-clear river reflections,
broken branches, black sap, sudden silence, birds absent,
smell of burnt resin.
Lighting: Solar Triumph — blinding white light from above,
deep cool teal shadows, prismatic dust motes.
Style: Split-rendering (clean tiny amber eyes / impasto bark and wood),
thick Jaime Jones oil impasto, Justin Gerard whimsy,
Jeff Easley weight, Rude Beauty, chaotic-good.
Mood: curious unease, punctual awe.
NO LIST: pointed ears, green skin, fangs, human hands, symmetry,
leather armor, weapon by default, human facial expressions,
generic shark teeth, grim decay, sci-fi tech, flat digital surfaces,
perfect symmetry.`,
  history: [
    '2026-07-20 — v1.0.0 canonical approval.',
    'Before v1.0.0 — three exploration versions (0.1.0 goblin, 0.2.0 wooden parasite, 0.3.0 family member).',
  ],
} as const;

type RoomTab = 'why' | 'dna' | 'identity' | 'decisions' | 'prompt' | 'history';

interface TabDefinition {
  id: RoomTab;
  label: string;
}

const TABS: TabDefinition[] = [
  { id: 'why', label: 'Why Exists' },
  { id: 'dna', label: 'Family DNA' },
  { id: 'identity', label: 'Identity' },
  { id: 'decisions', label: 'Decisions' },
  { id: 'prompt', label: 'Prompt' },
  { id: 'history', label: 'History' },
];

/**
 * Renders the Creature Development Room, an approval dashboard for a canonical
 * creature. This version shows the Gnarled Nightmare as the reference example.
 */
export function CreatureDevelopmentRoom() {
  const [activeTab, setActiveTab] = useState<RoomTab>('why');

  const tabContent = useMemo(() => {
    switch (activeTab) {
      case 'why':
        return (
          <ul className="list-disc space-y-2 pl-5 text-sm text-slate-200">
            {GNARLED_NIGHTMARE_ROOM.whyExists.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        );
      case 'dna':
        return (
          <div className="space-y-3">
            <p className="text-sm text-slate-300">
              Family:{' '}
              <a
                href={GNARLED_NIGHTMARE_ROOM.familyUrl}
                target="_blank"
                rel="noreferrer"
                className="text-amber-200 hover:text-amber-100"
              >
                {GNARLED_NIGHTMARE_ROOM.family}
              </a>
            </p>
            <ul className="list-disc space-y-2 pl-5 text-sm text-slate-200">
              {GNARLED_NIGHTMARE_ROOM.familyDna.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        );
      case 'identity':
        return (
          <table className="w-full text-left text-sm text-slate-200">
            <tbody>
              {GNARLED_NIGHTMARE_ROOM.identity.map(([key, value]) => (
                <tr key={key} className="border-b border-white/5">
                  <th className="py-2 pr-4 align-top font-normal text-slate-400">{key}</th>
                  <td className="py-2 align-top">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      case 'decisions':
        return (
          <ul className="space-y-3 text-sm text-slate-200">
            {GNARLED_NIGHTMARE_ROOM.decisions.map((decision) => (
              <li key={decision.version} className="rounded-xl border border-white/10 bg-black/20 p-3">
                <span className="text-amber-200">v{decision.version}</span>
                <span className="mx-2 text-slate-500">—</span>
                {decision.text}
              </li>
            ))}
          </ul>
        );
      case 'prompt':
        return (
          <pre className="whitespace-pre-wrap rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-slate-100">
            {GNARLED_NIGHTMARE_ROOM.prompt}
          </pre>
        );
      case 'history':
        return (
          <ul className="list-disc space-y-2 pl-5 text-sm text-slate-200">
            {GNARLED_NIGHTMARE_ROOM.history.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        );
      default:
        return null;
    }
  }, [activeTab]);

  return (
    <section className="default-card border border-white/10 p-6 shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Creature Development Room</p>
          <h2 className="mt-1 text-2xl font-serif text-amber-100">{GNARLED_NIGHTMARE_ROOM.name}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="rounded-full border border-emerald-300/60 px-3 py-1 text-emerald-100">
            {GNARLED_NIGHTMARE_ROOM.status}
          </span>
          <span className="rounded-full border border-amber-300/60 px-3 py-1 text-amber-100">
            v{GNARLED_NIGHTMARE_ROOM.version}
          </span>
          <span className="rounded-full border border-slate-500/60 px-3 py-1 text-slate-300">
            {GNARLED_NIGHTMARE_ROOM.authority}
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-b border-white/10 pb-4">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.25em] transition ${
              activeTab === tab.id
                ? 'border border-amber-300/80 bg-amber-300/10 text-amber-100'
                : 'border border-white/15 text-slate-300 hover:border-amber-300/50 hover:text-amber-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-4">{tabContent}</div>

      <div className="mt-5 border-t border-white/10 pt-4 text-xs text-slate-400">
        Approved by: {GNARLED_NIGHTMARE_ROOM.approvedBy.join(', ')}
      </div>
    </section>
  );
}
