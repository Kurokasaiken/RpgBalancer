import type { FC } from 'react';

interface StoryboardScene {
  id: string;
  time: string;
  title: string;
  shot: string;
  camera: string;
  movement: string;
  caption: string;
  description: string;
  components: string[];
  testHubPath: string;
  testHubTitle: string;
  visual: FC;
}

const SceneVisual01: FC = () => (
  <svg viewBox="0 0 160 90" className="h-full w-full" aria-hidden="true">
    <rect width="160" height="90" fill="#060604" />
    <circle cx="40" cy="55" r="6" fill="#3c2206" />
    <circle cx="80" cy="45" r="8" fill="#6a3c10" stroke="#d89040" strokeWidth="1" />
    <circle cx="120" cy="60" r="6" fill="#3c2206" />
    <path d="M40 35 L120 35 L120 50 L40 50 Z" fill="#1e0c08" stroke="#c07028" strokeWidth="0.5" />
    <text x="80" y="45" textAnchor="middle" fill="#f8d07e" fontSize="6" fontFamily="Cinzel, serif">
      GOBLIN INVASION
    </text>
    <path d="M80 35 L80 15" stroke="#f8d07e" strokeWidth="1" markerEnd="url(#arrow)" />
    <defs>
      <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
        <path d="M0 0 L6 3 L0 6 Z" fill="#f8d07e" />
      </marker>
    </defs>
  </svg>
);

const SceneVisual02: FC = () => (
  <svg viewBox="0 0 160 90" className="h-full w-full" aria-hidden="true">
    <rect width="160" height="90" fill="#060604" />
    <rect x="20" y="25" width="55" height="45" rx="4" fill="#0c1e10" stroke="#4a8048" strokeWidth="1" />
    <text x="47" y="50" textAnchor="middle" fill="#96be90" fontSize="5" fontFamily="Cinzel, serif">
      +DEF
    </text>
    <rect x="85" y="20" width="55" height="55" rx="4" fill="#1e0c08" stroke="#c07028" strokeWidth="1.5" />
    <text x="112" y="52" textAnchor="middle" fill="#f8d07e" fontSize="5" fontFamily="Cinzel, serif">
      HIGH RISK
    </text>
    <path d="M70 47 L90 47" stroke="#f8d07e" strokeWidth="1" strokeDasharray="2 2" />
  </svg>
);

const SceneVisual03: FC = () => (
  <svg viewBox="0 0 160 90" className="h-full w-full" aria-hidden="true">
    <rect width="160" height="90" fill="#060604" />
    <rect x="15" y="20" width="55" height="55" rx="4" fill="#0c0a07" stroke="#d8b13e" strokeWidth="1" />
    <circle cx="42" cy="42" r="12" fill="#060f16" stroke="#d8b13e" strokeWidth="1" />
    <text x="42" y="70" textAnchor="middle" fill="#c9a84e" fontSize="5" fontFamily="Cinzel, serif">
      15/8/12
    </text>
    <path d="M75 47 L120 47" stroke="#f8d07e" strokeWidth="1" markerEnd="url(#arrow2)" />
    <rect x="110" y="30" width="35" height="35" rx="4" fill="#1e0c08" stroke="#c07028" strokeWidth="1.5" />
    <defs>
      <marker id="arrow2" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
        <path d="M0 0 L6 3 L0 6 Z" fill="#f8d07e" />
      </marker>
    </defs>
  </svg>
);

const SceneVisual04: FC = () => (
  <svg viewBox="0 0 160 90" className="h-full w-full" aria-hidden="true">
    <rect width="160" height="90" fill="#060604" />
    <circle cx="80" cy="45" r="28" fill="none" stroke="#d8b13e" strokeWidth="1" />
    <path d="M80 45 L80 25" stroke="#d98a4a" strokeWidth="1" />
    <circle cx="80" cy="25" r="4" fill="#d98a4a" />
    <path d="M80 45 L95 58" stroke="#d98a4a" strokeWidth="1" />
    <circle cx="95" cy="58" r="3" fill="#d98a4a" />
    <path d="M80 45 L62 60" stroke="#d98a4a" strokeWidth="1" />
    <circle cx="62" cy="60" r="3" fill="#d98a4a" />
    <circle cx="80" cy="45" r="4" fill="#f8d07e">
      <animateTransform attributeName="transform" type="rotate" from="0 80 45" to="360 80 45" dur="3s" repeatCount="indefinite" />
    </circle>
    <text x="80" y="85" textAnchor="middle" fill="#d98a4a" fontSize="6" fontFamily="Cinzel, serif">
      HERO INJURED
    </text>
  </svg>
);

const SceneVisual05: FC = () => (
  <svg viewBox="0 0 160 90" className="h-full w-full" aria-hidden="true">
    <defs>
      <filter id="grey">
        <feColorMatrix type="saturate" values="0" />
      </filter>
    </defs>
    <rect width="160" height="90" fill="#1a1a1a" filter="url(#grey)" />
    <rect x="25" y="25" width="40" height="40" fill="#333" />
    <rect x="95" y="25" width="40" height="40" fill="#333" />
    <rect x="60" y="55" width="40" height="25" fill="#444" />
    <rect x="20" y="35" width="120" height="20" fill="#2a2a2a" stroke="#888" strokeWidth="0.5" />
    <text x="80" y="49" textAnchor="middle" fill="#aaa" fontSize="6" fontFamily="Cinzel, serif">
      SETTLEMENT LOST
    </text>
  </svg>
);

const SceneVisual06: FC = () => (
  <svg viewBox="0 0 160 90" className="h-full w-full" aria-hidden="true">
    <rect width="160" height="90" fill="#060604" />
    <text x="80" y="20" textAnchor="middle" fill="#f8d07e" fontSize="6" fontFamily="Cinzel, serif">
      KNOWLEDGE PRESERVED
    </text>
    <text x="30" y="45" fill="#7bc96f" fontSize="6">✓</text>
    <text x="40" y="45" fill="#c9a84e" fontSize="5">Ancient Artifact</text>
    <text x="30" y="60" fill="#7bc96f" fontSize="6">✓</text>
    <text x="40" y="60" fill="#c9a84e" fontSize="5">Sacred Altar Blueprint</text>
    <text x="30" y="75" fill="#7bc96f" fontSize="6">✓</text>
    <text x="40" y="75" fill="#c9a84e" fontSize="5">Surviving Heroes</text>
  </svg>
);

const SceneVisual07: FC = () => (
  <svg viewBox="0 0 160 90" className="h-full w-full" aria-hidden="true">
    <rect width="160" height="90" fill="#060604" />
    <text x="80" y="35" textAnchor="middle" fill="#f8d07e" fontSize="8" fontFamily="Cinzel, serif">
      WANDERLUST
    </text>
    <text x="80" y="45" textAnchor="middle" fill="#f0cf6a" fontSize="6" fontFamily="Cinzel, serif">
      TRIUMPH
    </text>
    <text x="80" y="58" textAnchor="middle" fill="#c9a84e" fontSize="4" fontFamily="Cinzel, serif">
      PREPARE · ENDURE · TRIUMPH
    </text>
    <rect x="45" y="68" width="70" height="12" rx="2" fill="#c07028" />
    <text x="80" y="77" textAnchor="middle" fill="#060604" fontSize="4" fontFamily="Cinzel, serif">
      WISHLIST NOW
    </text>
  </svg>
);

const SCENES: StoryboardScene[] = [
  {
    id: 'sc-01',
    time: '0:00–0:05',
    title: 'Threat',
    shot: 'Wide establishing',
    camera: 'Zoom into event banner',
    movement: '↗',
    caption: 'The map opens. POIs emerge. A banner warns: GOBLIN INVASION — 5 DAYS REMAIN.',
    description: 'Start with the Idle Village map. The three POI medallions appear one by one. The camera pushes into the special event banner.',
    components: ['MapPage', 'LocationCard', 'QuestPOI', 'MapHeatmapOverlay'],
    testHubPath: '/minimal-poi',
    testHubTitle: 'POI Ecosystem',
    visual: SceneVisual01,
  },
  {
    id: 'sc-02',
    time: '0:05–0:15',
    title: 'Choice',
    shot: 'Medium two-shot',
    camera: 'Static, left/right split',
    movement: '—',
    caption: 'The living village. Two asymmetric choices: safe Training Grounds vs high-risk Forgotten Ruins.',
    description: 'Show the village with warm lights and active workers. The two POI choice cards are side by side; the risky one is highlighted.',
    components: ['VillageSandbox', 'ResidentSlotRack', 'VillageRosterSection', 'WanderlustSurface'],
    testHubPath: '/minimal-gameplay',
    testHubTitle: 'Minimal Gameplay',
    visual: SceneVisual02,
  },
  {
    id: 'sc-03',
    time: '0:15–0:25',
    title: 'Preparation',
    shot: 'Close-up + drag detail',
    camera: 'Follow the drag cursor',
    movement: '→',
    caption: 'Hero sheet: Attack 15, Defense 8, Magic 12. Drag the hero into the bronze slot of Forgotten Ruins.',
    description: 'Open the hero detail, then drag the hero token into the quest POI. The POI begins pulsing to show it is ready.',
    components: ['WanderlustRosterCard', 'WanderlustPortrait', 'WanderlustStatBar', 'QuestPOI'],
    testHubPath: '/minimal-roster',
    testHubTitle: 'Roster',
    visual: SceneVisual03,
  },
  {
    id: 'sc-04',
    time: '0:25–0:32',
    title: 'Risk',
    shot: 'Close-up on astrolabe',
    camera: 'Orbit around the wheel',
    movement: '↻',
    caption: 'The Destiny Astrolabe spins. The ball skims the star and falls into the thorns: HERO INJURED.',
    description: 'Launch the astrolabe. The danger zones are visible: 10% wound, 5% death. The ball decelerates realistically and lands in the wound zone.',
    components: ['DestinyAstrolabe', 'SkillCheckLegend', 'OutcomeModal'],
    testHubPath: '/minimal-destiny-astrolabe',
    testHubTitle: 'Destiny Astrolabe',
    visual: SceneVisual04,
  },
  {
    id: 'sc-05',
    time: '0:32–0:40',
    title: 'Consequence',
    shot: 'Wide village shot',
    camera: 'Hold, then fade to grey',
    movement: '—',
    caption: 'The invasion timer hits zero. The village desaturates to oxidized grey. SETTLEMENT LOST.',
    description: 'Cut back to the village. The timer reaches zero. A greyscale filter and impact overlay appear.',
    components: ['VillageSandbox', 'ActiveHUD', 'HUDNotificationLayer', 'TeaserImpactOverlay'],
    testHubPath: '/minimal-gameplay',
    testHubTitle: 'Minimal Gameplay',
    visual: SceneVisual05,
  },
  {
    id: 'sc-06',
    time: '0:40–0:50',
    title: 'Legacy',
    shot: 'Vertical list / scroll',
    camera: 'Slow pan down',
    movement: '↓',
    caption: 'KNOWLEDGE PRESERVED. Artifacts, blueprints and surviving heroes become legacy.',
    description: 'A triumphant transition screen. Each legacy item appears with a checkmark and a bronze surface card.',
    components: ['VictoryComponent', 'ActivityLogPanel', 'WanderlustSurface', 'WanderlustPortrait'],
    testHubPath: '/minimal-outcome',
    testHubTitle: 'Outcome Modal',
    visual: SceneVisual06,
  },
  {
    id: 'sc-07',
    time: '0:50–0:55',
    title: 'Outro',
    shot: 'Title card',
    camera: 'Push in',
    movement: '↗',
    caption: 'WANDERLUST TRIUMPH. PREPARE · ENDURE · TRIUMPH. WISHLIST NOW ON STEAM.',
    description: 'Final logo lockup with the tagline and an animated wishlist CTA button.',
    components: ['WanderlustHeading', 'WanderlustSurface'],
    testHubPath: '/wanderlust-quest-demo',
    testHubTitle: 'Wanderlust Quest Demo',
    visual: SceneVisual07,
  },
];

export const StoryboardPage: FC = () => {
  return (
    <div className="min-h-screen bg-[#060604] p-6 md:p-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 p-6 md:p-8 border border-gray-700 rounded-lg bg-gray-900">
          <h1 className="text-2xl font-bold text-white mb-2">Wanderlust Triumph — Storyboard</h1>
          <h2 className="text-sm text-gray-400 mb-4">55-second Steam Concept Slice</h2>
          <p className="text-gray-300">
            Scene-by-scene breakdown of the gameplay teaser. Each panel shows the shot, camera move, components used, and the TestHub page where the real components are visible.
          </p>
        </div>

        <div className="space-y-8">
          {SCENES.map((scene, index) => (
            <div key={scene.id} className="border border-gray-700 rounded-lg bg-gray-900 overflow-hidden">
              <div className="grid gap-6 md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
                {/* Shot frame */}
                <div className="relative aspect-video w-full bg-[#030202]">
                  <scene.visual />
                  <div className="absolute left-2 top-2 rounded bg-black/70 px-2 py-1 text-[10px] uppercase tracking-wider text-[#f0cf6a]">
                    {scene.shot}
                  </div>
                  <div className="absolute right-2 top-2 rounded bg-black/70 px-2 py-1 text-[10px] text-[#c9a84e]">
                    {scene.time}
                  </div>
                  <div className="absolute bottom-2 left-2 rounded bg-black/70 px-2 py-1 text-[10px] text-[#9a8246]">
                    {scene.camera} {scene.movement}
                  </div>
                </div>

                {/* Caption & metadata */}
                <div className="p-2 md:p-0">
                  <h2 className="mb-1 text-lg font-semibold text-[#f0cf6a]">
                    {index + 1}. {scene.title}
                  </h2>
                  <p className="mb-4 text-[#e4d5b7]">{scene.caption}</p>
                  <p className="mb-2 text-[#9a8246] text-xs uppercase tracking-wider">How it is built</p>
                  <p className="mb-3 text-sm text-[#c9a84e]">{scene.description}</p>

                  <div className="mb-3 flex flex-wrap gap-2">
                    {scene.components.map((component) => (
                      <span
                        key={component}
                        className="rounded border border-[#6a3c10]/50 bg-[#1a1108] px-2 py-1 text-[10px] text-[#ecb458]"
                      >
                        {component}
                      </span>
                    ))}
                  </div>

                  <a
                    href={scene.testHubPath}
                    className="inline-flex items-center gap-2 rounded border border-[#c07028] bg-[#3c2206]/40 px-3 py-1.5 text-xs text-[#f8d07e] transition-colors hover:bg-[#c07028]/20"
                  >
                    <span>🧪</span>
                    <span>See in TestHub: {scene.testHubTitle}</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        <footer className="mt-10 border-t border-[#3c2206] pt-6 text-center text-xs text-[#6e6048]">
          <p>
            Storyboard based on the anime-style storyboard conventions: wide establishing shots, camera arrows, timing notes, and motion indicators.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default StoryboardPage;
