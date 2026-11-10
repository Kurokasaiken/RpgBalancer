import { useEffect, useMemo, useRef, useState } from 'react';
import { PixiWorldMap } from '@/ui/idleVillage/pixiSpike/PixiWorldMap';
import { useRosterKitData } from '@/ui/idleVillage/frozen/kits/rosterKit';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { HudRealRosterColumn } from '@/ui/idleVillage/hudReal/HudRealRosterColumn';
import { MatericRosterComponentV2 } from '@/ui/idleVillage/rosterV2';
import { SkinScope } from '@/ui/idleVillage/skins/primitives';
import { HudRealCrest, CREST_SIZE } from '@/ui/idleVillage/hudReal/HudRealCrest';
import { HudRealPanel } from '@/ui/idleVillage/hudReal/HudRealPanel';
import { HudRealVoce } from '@/ui/idleVillage/hudReal/HudRealVoce';
import { HudRealSeal } from '@/ui/idleVillage/hudReal/HudRealSeal';
import { HudRealRoundButton } from '@/ui/idleVillage/hudReal/HudRealRoundButton';
import { EngravedIcon } from '@/ui/idleVillage/components/gameFrame/engravedIcons';
import { HudRealTimeConnected } from '@/ui/idleVillage/hudReal/HudRealTimeConnected';
import { HudRealNav } from '@/ui/idleVillage/hudReal/HudRealNav';
import { DEFAULT_GAME_FRAME_CONFIG } from '@/balancing/config/idleVillage/gameFrameConfig';
import { HudRealResources } from '@/ui/idleVillage/hudReal/HudRealResources';
import { useTranslation } from 'react-i18next';
import { selectResourceOutlook, useMinimalGameplayWithIdleVillageConfig } from '@/store/useMinimalGameplay';
import { buildResourceReadoutItems } from '@/ui/idleVillage/components/gameFrame';
import { MERCHANT_CONFIG } from '@/balancing/config/idleVillage/merchantConfig';
import { HudRealMerchantPanel } from '@/ui/idleVillage/hudReal/HudRealMerchantPanel';
import { HudRealLedgerPanel } from '@/ui/idleVillage/hudReal/HudRealLedgerPanel';
import { HudRealTriad } from '@/ui/idleVillage/hudReal/HudRealTriad';
import { HudRealCassettoHost } from '@/ui/idleVillage/hudReal/HudRealCassettoHost';
import { HudRealReliquary } from '@/ui/idleVillage/hudReal/HudRealReliquary';
import { HudRealMemorial } from '@/ui/idleVillage/hudReal/HudRealMemorial';
import { HudRealLevelUp } from '@/ui/idleVillage/hudReal/HudRealLevelUp';
import { HudRealExpeditionLost } from '@/ui/idleVillage/hudReal/HudRealExpeditionLost';
import { HudRealAstrolabe } from '@/ui/idleVillage/hudReal/HudRealAstrolabe';
import { HudRealRosterDrape } from '@/ui/idleVillage/hudReal/HudRealRosterDrape';
import { dispatchHeroLevelUp } from '@/ui/idleVillage/rosterV2/heroLevelUpEvents';
import type { QuestRunState } from '@/ui/idleVillage/questS1Lab/questRun';
import { useMinimalGameplayStore } from '@/store/useMinimalGameplay';
import { frameFor, resolveAll, resolveSlots, zoomFor, type HudView, type Rect } from '@/ui/idleVillage/hudReal/layout/hudLayoutB';

/** Full-HUD composition on the real map, on the SIGNED blueprint B1 (PLAN-112 F4): every component
 *  is mounted at its contract rect (`resolveSlots`, game zoom model via `hudScale` — `?zoom=auto|1|1.25|1.5|2`,
 *  `?view=overview|context|narrative`). Components not yet rebuilt to their contract size are still
 *  mounted at their rect (interim, declared in STATUS). */

const MAP_MANIFEST = '/assets/world/mappa2/base/manifest.json';
const STAGE_COLOR = '#1675ad';

const place = (r: Rect, extra: React.CSSProperties = {}): React.CSSProperties => ({
  position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, ...extra,
});
/** Centre an oversize child on the rect's centre line (same line, ink may bleed a few px). */
const centred = (r: Rect, w: number, h: number): React.CSSProperties => ({
  position: 'absolute', left: r.x + (r.w - w) / 2, top: r.y + (r.h - h) / 2, width: w, height: h,
});

export default function HudComposePage() {
  const { residents: kitResidents } = useRosterKitData();
  const { t } = useTranslation('idleVillage');
  const { state, config } = useMinimalGameplayWithIdleVillageConfig();
  /* ?stress: long texts and extreme values to check overflow of the real components (PLAN-110 review A.7) */
  const params = new URLSearchParams(window.location.search);
  const stress = params.has('stress');
  /* ?n=1|5|14: duplicate the kit residents with varied states — permanent no-cut witness counts (PLAN-112 C1) */
  const residents = useMemo(() => {
    const nHeroes = new URLSearchParams(window.location.search).get('n');
    if (!nHeroes || kitResidents.length === 0) return kitResidents;
    const DEMO: Array<{ status: ResidentState['status']; injured?: boolean }> = [
      { status: 'available' }, { status: 'away' }, { status: 'available' }, { status: 'exhausted' }, { status: 'injured', injured: true },
      { status: 'available' }, { status: 'dead' }, { status: 'available' }, { status: 'away' }, { status: 'available' },
      { status: 'available' }, { status: 'exhausted' }, { status: 'available' }, { status: 'away' },
    ];
    return Array.from({ length: Number(nHeroes) }, (_, i) => {
      const r = kitResidents[i % kitResidents.length];
      const st = DEMO[i % DEMO.length];
      return {
        ...r, id: `${r.id}#${i}`,
        displayName: i < kitResidents.length ? r.displayName : `${r.displayName ?? r.id} ${['II', 'III', 'IV'][Math.floor(i / kitResidents.length) - 1] ?? ''}`.trim(),
        status: st.status, isInjured: Boolean(st.injured), fatigue: st.status === 'exhausted' ? 92 : (i * 17) % 60,
        currentHp: st.status === 'dead' ? 0 : st.injured ? Math.round(r.maxHp * 0.3) : Math.round(r.maxHp * (0.55 + ((i * 13) % 45) / 100)),
      };
    });
  }, [kitResidents]);
  const view = (params.get('view') as HudView) || 'overview';
  const isTriad = params.get('comp') === 'triad';
  /* ?seed=memorial — lab fixture: writes fallen entries (real kit names, fixture
      level/place/day) into s.memorial once, so the signed memorial hall has witnesses.
      Only on this lab page; production entries come from settled resident-dead effects. */
  useEffect(() => {
    if (!params.has('seed') || params.get('seed') !== 'memorial') return;
    const st = useMinimalGameplayStore.getState();
    if (st.memorial.length > 0 || kitResidents.length === 0) return;
    useMinimalGameplayStore.setState({
      memorial: kitResidents.slice(0, 3).map((r, i) => ({
        key: `lab-fixture:${r.id}`, name: r.displayName ?? r.id,
        level: 3 + i * 2, place: 'Goblin Extermination', day: 4 + i * 3,
      })),
    });
  }, [params, kitResidents]);
  const zoomParam = params.get('zoom');
  const [win, setWin] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const on = () => setWin({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  const zoom = zoomParam && zoomParam !== 'auto' ? Number(zoomParam) : zoomFor('auto', win.w, win.h);
  const f = useMemo(() => frameFor(win.w, win.h, zoom), [win, zoom]);
  const rects = useMemo(() => resolveAll(resolveSlots(f).slots, f), [f]);
  /* PLAN-113/114 F4 lab fixture: a wiped party built from real kit residents — only `party`
      is read by `lostReportModel` (documented cast; no settled wipe exists on the lab store). */
  const lostFixtureRun = useMemo(() => ({
    party: residents.slice(0, 3).map((r, i) => ({
      id: r.id, name: r.displayName ?? r.id, dead: true, deadAtTick: (i + 2) * 40,
    })),
  }) as unknown as QuestRunState, [residents]);
  const [recenterSignal, setRecenterSignal] = useState(0);
  const [panelsOpen, setPanelsOpen] = useState(view !== 'narrative');
  const [rosterOpenState, setRosterOpenState] = useState(false);
  const [hudHidden, setHudHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toastOpen] = useState(true);
  void toastOpen; // toast plaque removed — esito text is Voce's output (Director ruling)
  const hasExplicitView = params.has('view');
  const inView = (id: string) => {
    if (id === 'commands') return true;
    if (hudHidden) return false;
    if (!hasExplicitView) return id === 'panel' ? panelsOpen : true;
    if (id === 'panel') return panelsOpen || view === 'context';
    if (id === 'rosterOpen') return rosterOpenState || view === 'context';
    return (SLOTS_VIEWS[id] ?? []).includes(view);
  };

  return (
    <div data-hudreal-lift="" style={{ position: 'fixed', inset: 0 }}>
      <style>{`[data-hudslot]{filter:drop-shadow(0 2px 5px rgba(1,14,18,.7)) drop-shadow(0 0 1px rgba(1,14,18,.9))}`}</style>
      <PixiWorldMap manifestPath={MAP_MANIFEST} stageColor={STAGE_COLOR} recenterSignal={recenterSignal} />
      <div style={{
        position: 'absolute', left: 0, top: 0, width: f.W, height: f.H,
        transform: `scale(${f.scale})`, transformOrigin: 'top left',
      }}>

      {/* Cimiero (armillary crest) — always mounted where the roster family lives;
          in ?comp=roster it is the piece the drape hangs from. */}
      {inView('roster') && (
        <div data-hudslot="crest" style={{ ...place(rects.crest), zIndex: 6, overflow: 'visible' }}>
          <HudRealCrest size={CREST_SIZE} ready={residents.filter((r) => r.status === 'available').length} total={residents.length} open={rosterOpenState} onToggle={() => setRosterOpenState((o) => !o)} />
        </div>
      )}
      {inView('roster') && params.get('comp') !== 'roster' && (
        <div data-hudslot="roster" style={{ ...place(rects.roster), zIndex: 4, overflow: 'visible' }}>
          <HudRealRosterColumn residents={residents} height={rects.roster.h}
            selectedResidentId={residents[1]?.id ?? null} />
        </div>
      )}

      {!isTriad && inView('rosterOpen') && (
        <div data-hudslot="rosterOpen" style={{ ...place(rects.rosterOpen), zIndex: 7, overflow: 'visible' }}>
          {/* Director ruling: the roster shown on crest/roster press is EXACTLY the /game draggable roster, inside the same SkinScope that gives it the pill chrome */}
          <SkinScope style={{ height: '100%' }}>
            <MatericRosterComponentV2 componentId="game-frame-roster" density="compact" onClose={() => setRosterOpenState(false)} />
          </SkinScope>
        </div>
      )}

      {inView('time') && (
        <div data-hudslot="time" style={{ ...place(rects.time), zIndex: 5 }}>
          {/* original intact bar (485.34x84.96, sockets at y~44.5): scale uniformly to slot width, align socket row on slot centre */}
          <div style={{
            position: 'absolute', left: 0, top: rects.time.h / 2 - 44.5 * (rects.time.w / 485.34),
            transform: `scale(${rects.time.w / 485.34})`, transformOrigin: 'top left',
          }}>
            <HudRealTimeConnected />
          </div>
        </div>
      )}

      {inView('resources') && params.get('comp') !== 'cassetto' && (
        <div data-hudslot="resources" style={{ ...place(rects.resources), zIndex: 5 }}>
          {/* original intact bar (395.79x118.86, slot row centre at y=44.3; pendant hangs below the body):
              scale uniformly to slot width, align the slot row on the 56 px slot's centre */}
          <div style={{
            position: 'absolute', left: 0, top: rects.resources.h / 2 - 44.3 * (rects.resources.w / 395.79),
            transform: `scale(${rects.resources.w / 395.79})`, transformOrigin: 'top left',
          }}>
            <HudRealResources items={buildResourceReadoutItems(selectResourceOutlook(state, config), t).map((it) => (stress ? { ...it, value: it.id === 'gold' ? '1234567' : '99999', max: it.max !== undefined ? 123456 : undefined } : it))} />
          </div>
        </div>
      )}

      {!isTriad && inView('panel') && params.get('panel') === 'merchant' ? (
        <div data-hudslot="panel" style={{ ...centred(rects.panel, 340, rects.panel.h), zIndex: 5 }}>
          {/* PLAN-113 pilot D: the real merchant surface ported onto pf-3 — HudRealMerchantPanel, production parity (E-13). */}
          <HudRealMerchantPanel config={MERCHANT_CONFIG} />
        </div>
      ) : !isTriad && inView('panel') && params.get('panel') === 'ledger' ? (
        <div data-hudslot="panel" style={{ ...centred(rects.panel, 340, rects.panel.h), zIndex: 5 }}>
          {/* PLAN-113 pilot E: event ledger rows (real HudEvent shape) onto pf-3 + kit dividers. */}
          <HudRealLedgerPanel events={[
            { id: 'ev-invasion', typeId: 'threat', title: t('gameFrame.events.demo.invasion', 'Marcia dei goblin'), daysLeft: 0 },
            { id: 'ev-quest', typeId: 'quest', title: t('gameFrame.events.demo.quest', 'Ritorno della spedizione'), daysLeft: 1 },
            { id: 'ev-build', typeId: 'construction', title: t('gameFrame.events.demo.build', 'Fucina completata'), daysLeft: 3 },
            { id: 'ev-trade', typeId: 'expedition', title: t('gameFrame.events.demo.trade', 'Carovana di Rowen'), daysLeft: 5 },
          ]} />
        </div>
      ) : !isTriad && inView('panel') && (
        <div data-hudslot="panel" style={{ ...centred(rects.panel, 340, rects.panel.h), zIndex: 5 }}>
          <HudRealPanel
            kicker="Poi · Nord" title={stress ? 'Le Cascate di Zanara e le Grotte degli Alchimisti di Corte' : 'Le Cascate di Zanara'}
            body={stress ? "Antiche terrazze d'acqua dove gli alchimisti di corte distillavano la rugiada stellare. Si dice che chi si bagni alla terza cascata veda il proprio destino, e che le grotte dietro la cascata nascondano un antico manufatto che nessuno ha mai osato toccare, perché la corrente è forte e la leggenda troppo allettante per chi non è preparato. ".repeat(2) : "Antiche terrazze d'acqua dove gli alchimisti di corte distillavano la rugiada stellare. Si dice che chi si bagni alla terza cascata veda il proprio destino."}
            illustration={<img src="/assets/ui/hud-real/panel/illustration-waterfall.webp" alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
            action={{ label: 'Inizia' }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 10px', alignItems: 'center', fontSize: 14, maxWidth: '100%' }}>
              <span style={{ fontSize: 11, letterSpacing: 1, color: '#6b5a3e', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Ricompense</span>
              {[['gold', '350'], ['food', '50'], ['wood', '12']].map(([k, v]) => (
                <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}><img src={`/assets/ui/resources/res-${k}-64.webp`} alt="" width={20} height={20} draggable={false} />{v}</span>
              ))}
            </div>
            {/* probability seal lives inside the panel (contract): the row layout fills the free zone */}
            <div style={{ marginTop: 2 }}>
              <HudRealSeal layout="row" rowHeight={80} value="68" marks={['win', 'win', 'danger', 'off', 'off']} label="Esito" />
            </div>
          </HudRealPanel>
        </div>
      )}

      {/* PLAN-113 family A — V2 fascia unificata (GC-1 ruling): unified company furniture
          (real roster + real stash modules) leftWing, planner arredo centerStage, rightWing free. */}
      {params.get('comp') === 'triad' && (
        <>
          <div data-hudslot="triad-mobile" style={{ position: 'absolute', left: 232, top: 92, width: 400, height: 700, zIndex: 7 }}>
            <HudRealTriad />
          </div>
          <div data-hudslot="triad-planner" style={{ position: 'absolute', left: 760, top: 92, width: 340, zIndex: 6 }}>
            {/* arredo planner — the real QuestExpeditionDetail mounts here in F2; frame + slot prove the arrangement */}
            <HudRealPanel
              kicker={t('gameFrame.quest.kicker', 'Spedizione')} title={t('gameFrame.quest.plannerTitle', 'Pianifica la spedizione')}
              illustration={<img src="/assets/ui/hud-real/kit/medallion.png" alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />}
              action={{ label: t('gameFrame.quest.assign', 'Assegna'), disabled: true }}
            />
          </div>
        </>
      )}

      {/* PLAN-113/114 family B — the signed cassetto planner (dossier on map, right-edge drawer):
          real ResidentSlotRack ghiera + signed internals (skull risk, journey band, enamel CONFIRM). */}
      {/* Cassetto — owns the right column; commands + resources slots hidden
          (Director ruling 2026-11-10); resources incorporated as a top-right band
          inside the cassetto's space so nothing is separate. The host manages
          its own drawer geometry. */}
      {params.get('comp') === 'cassetto' && (
        <>
          <div style={{ position: 'absolute', right: 16, top: 8, zIndex: 8 }}>
            <div style={{ transform: 'scale(0.8)', transformOrigin: 'top right' }}>
              <HudRealResources items={buildResourceReadoutItems(selectResourceOutlook(state, config), t)} />
            </div>
          </div>
          <div data-hudslot="cassetto" style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 360, zIndex: 7 }}>
            <HudRealCassettoHost />
          </div>
        </>
      )}

      {/* PLAN-113/114 E3 — reliquary: real legacySlotsFor(villageBuildingLevel) + mock picks
          (production semantics: in-memory only), signed 3-column inheritance table. */}
      {params.get('comp') === 'reliquary' && (
        <div data-hudslot="reliquary" style={{ position: 'absolute', left: 540, top: 180, width: 720, height: 451, zIndex: 7 }}>
          <HudRealReliquary />
        </div>
      )}

      {/* PLAN-113/114 E2 — memorial hall (signed 8-A nicchie): real s.memorial entries;
          ?seed=memorial writes lab fixture entries into the store once so the signed visual
          has real-Shape witnesses (kit resident names, fixture level/place/day). */}
      {params.get('comp') === 'memorial' && (
        <div data-hudslot="memorial" style={{ position: 'absolute', left: 520, top: 200, width: 760, height: 420, zIndex: 7 }}>
          <HudRealMemorial />
        </div>
      )}

      {/* PLAN-113/114 B2 — skill-check astrolabe: the REAL frozen V62 inside the signed
          Zanara furniture. The dial's own palette is its frozen css — internal recolor
          is a separate frozen-kit contract task (flagged in HudRealAstrolabe header). */}
      {/* PLAN-113/114 R — roster gagliardetto ACCANTONATO (rilievi Director
          2026-11-10: troppo poco visibile, non centrato come colonna, cimiero sotto
          non sopra, colori sbagliati — vedi .mw/specs/hud-real/roster/NOTES-rilievi-2026-11-10.md).
          Il drappo non monta: restano solo cimiero + voce. */}

      {params.get('comp') === 'astrolabe' && (
        <div data-hudslot="astrolabe" style={{ position: 'absolute', left: 780, top: 150, width: 420, height: 560, zIndex: 7 }}>
          <HudRealAstrolabe skillName={t('gameFrame.questWindow.checkOverlay.titleSuffix')} stat={62} />
        </div>
      )}

      {/* PLAN-113/114 F1 — level-up ceremony (signed 9-B luce ascendente): the layer listens to
          the REAL hero_levelup_mock bus; the trigger chip dispatches a real event for a real
          kit resident so the whole pipeline (bus → seal → real heroLevelGains) is exercised. */}
      {params.get('comp') === 'levelup' && <LevelUpLab residents={residents} />}

      {/* PLAN-113/114 F4 — expedition lost (signed 10-B, real winged emblem): tombs from the real
          lostReportModel on a fixture wiped party (lab: no settled wipe exists in the store —
          the party is a documented fixture, the model and copy are production). */}
      {params.get('comp') === 'lost' && (
        <HudRealExpeditionLost
          run={lostFixtureRun}
          questName="Goblin Extermination"
          onClose={() => window.history.back()}
        />
      )}

      {inView('nav') && (
        <div data-hudslot="nav" style={{ ...place(rects.nav), zIndex: 5 }}>
          {/* Director: the nav's bottom edge sits just above the screen's bottom edge (not at M) —
              the R2 asset (513x131) is scaled to contract width from top-left. */}
          <div style={{
            position: 'absolute', left: (rects.nav.w - 460) / 2,
            top: (f.H - 6) - (rects.nav.y + 131.25 * (rects.nav.w / 513)),
            transform: `scale(${rects.nav.w / 513})`, transformOrigin: 'top left', width: 513, height: 131.25,
          }}>
            <NavDemo onRecenter={() => setRecenterSignal((n) => n + 1)} />
          </div>
        </div>
      )}

      {/* toast removed (Director ruling): the esito plaque was a compose fixture,
          not a production component — outcome messages come out of Voce itself. */}

      {inView('voce') && (
        <div data-hudslot="voce" style={{ ...place(rects.voce), zIndex: 5 }}>
          {/* bottom of the 440x230.56 piece sits 6 px above the screen edge (like the nav) so the lower gem is never clipped */}
          <div style={{
            position: 'absolute', left: 0, top: (f.H - 6) - (rects.voce.y + 230.56 * (rects.voce.w / 440)),
            transform: `scale(${rects.voce.w / 440})`, transformOrigin: 'top left',
          }}>
            <HudRealVoce title={stress ? 'La via del Nord e la lunga marcia delle sette sorelle' : 'La via del Nord'}>{stress ? "Il vento porta con sé un profumo di salsedine e di cenere, e laggiù oltre le scogliere gli antichi fari tornano ad accendersi uno dopo l'altro mentre la marea sale… sembra che ci sia una nuova isola all'orizzonte." : "Il vento porta con sé un profumo di salsedine… sembra che ci sia una nuova isola all'orizzonte."}</HudRealVoce>
          </div>
        </div>
      )}

      {inView('commands') && params.get('comp') !== 'cassetto' && (
        <div data-hudslot="commands" style={{ ...centred(rects.commands, 132, 40), zIndex: 6, display: 'flex', gap: 6 }}>
          {menuOpen && (
            <div role="menu" data-hr-cmd-menu="" style={{
              position: 'absolute', right: 0, bottom: 48, minWidth: 168, padding: '8px 12px', borderRadius: 10,
              background: 'linear-gradient(180deg, rgba(11, 56, 44, 0.97), rgba(6, 32, 26, 0.97))',
              border: '1.5px solid #c9a55a', fontFamily: 'Cinzel, "EB Garamond", serif', fontSize: 13, color: '#f3ead0',
              display: 'grid', gap: 6,
            }}>
              <button type="button" role="menuitem" onClick={() => { setRecenterSignal((n) => n + 1); setMenuOpen(false); }}
                style={{ all: 'unset', cursor: 'pointer', padding: '4px 2px' }}>{t('gameFrame.compass.recenter')}</button>
              <button type="button" role="menuitem" onClick={() => { setPanelsOpen((v) => !v); setMenuOpen(false); }}
                style={{ all: 'unset', cursor: 'pointer', padding: '4px 2px' }}>Pannello contestuale</button>
            </div>
          )}
          <HudRealRoundButton label="Menu" active={menuOpen} onClick={() => setMenuOpen((v) => !v)}><EngravedIcon id="cmd-menu" size={22} /></HudRealRoundButton>
          <HudRealRoundButton label="Pannelli" active={panelsOpen || view === 'context'} onClick={() => setPanelsOpen((v) => !v)}><EngravedIcon id="cmd-panels" size={22} /></HudRealRoundButton>
          <HudRealRoundButton label="Nascondi HUD" active={hudHidden} onClick={() => setHudHidden((v) => !v)}><EngravedIcon id="cmd-eye" size={22} /></HudRealRoundButton>
        </div>
      )}

      </div>

      {/* Surface switcher — the baptized comps live behind ?comp=/?panel= params;
          this rail makes every signed surface one click away (lab discoverability).
          Outside the scaled layer: constant size at every zoom. */}
      <ComposeSwitcher />

    </div>
  );
}

/** The baptized surfaces — every signed/portable comp on this lab page. `params`
 *  is the query it navigates to; `match` marks the chip active on the current URL. */
const COMPOSE_SURFACES: ReadonlyArray<{ id: string; label: string; params: string; match: (p: URLSearchParams) => boolean }> = [
  { id: 'hud', label: 'HUD', params: '', match: (p) => !p.has('comp') && !p.has('panel') },
  { id: 'triad', label: 'Triade', params: 'comp=triad', match: (p) => p.get('comp') === 'triad' },
  { id: 'roster', label: 'Roster', params: 'comp=roster', match: (p) => p.get('comp') === 'roster' },
  { id: 'cassetto', label: 'Cassetto', params: 'comp=cassetto', match: (p) => p.get('comp') === 'cassetto' },
  { id: 'reliquary', label: 'Reliquario', params: 'comp=reliquary', match: (p) => p.get('comp') === 'reliquary' },
  { id: 'memorial', label: 'Memoriale', params: 'comp=memorial&seed=memorial', match: (p) => p.get('comp') === 'memorial' },
  { id: 'levelup', label: 'Level-up', params: 'comp=levelup', match: (p) => p.get('comp') === 'levelup' },
  { id: 'lost', label: 'Lost', params: 'comp=lost', match: (p) => p.get('comp') === 'lost' },
  { id: 'astrolabe', label: 'Astrolabio', params: 'comp=astrolabe', match: (p) => p.get('comp') === 'astrolabe' },
  { id: 'merchant', label: 'Mercante', params: 'panel=merchant', match: (p) => p.get('panel') === 'merchant' },
  { id: 'ledger', label: 'Ledger', params: 'panel=ledger', match: (p) => p.get('panel') === 'ledger' },
];

/** Collapsible rail of signed surfaces — a chip per baptized comp, navigates
 *  preserving the ambient params (view/zoom/n/stress). */
const ComposeSwitcher: React.FC = () => {
  const [open, setOpen] = useState(true);
  const p = new URLSearchParams(window.location.search);
  const go = (params: string) => {
    const next = new URLSearchParams(params);
    /* carry the ambient knobs that aren't comp/panel-specific */
    for (const k of ['view', 'zoom', 'n', 'stress']) {
      if (p.has(k) && !next.has(k)) next.set(k, p.get(k)!);
    }
    window.location.search = next.toString();
  };
  return (
    <div data-hudswitcher="" style={{ position: 'fixed', left: 10, bottom: 10, zIndex: 3000, display: 'flex', alignItems: 'flex-end', gap: 6 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Superfici"
        style={{
          width: 34, height: 34, borderRadius: 9, cursor: 'pointer',
          background: 'linear-gradient(180deg,#143229,#07121a)', border: '1.5px solid #c9a55a',
          color: '#f0d58c', fontSize: 15, lineHeight: 1,
        }}
      >{open ? '×' : '☰'}</button>
      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '8px 10px', borderRadius: 10, background: 'rgba(7,18,26,.92)', border: '1.5px solid #8a6f35' }}>
          <div style={{ fontFamily: 'Cinzel, "EB Garamond", serif', fontSize: 9.5, letterSpacing: 2.4, color: '#8fb2a2', textTransform: 'uppercase' }}>Superfici</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: 340 }}>
            {COMPOSE_SURFACES.map((s) => {
              const active = s.match(p);
              return (
                <button
                  key={s.id}
                  type="button"
                  data-switcher={s.id}
                  aria-pressed={active}
                  onClick={() => go(s.params)}
                  style={{
                    fontFamily: 'Cinzel, "EB Garamond", serif', fontSize: 10.5, letterSpacing: 1.2, textTransform: 'uppercase',
                    padding: '5px 10px', borderRadius: 7, cursor: 'pointer',
                    color: active ? '#052015' : '#f0d58c',
                    background: active ? 'linear-gradient(180deg,#2fd4a3,#1fb877)' : 'rgba(20,50,41,.9)',
                    border: `1px solid ${active ? '#0d5c40' : '#c9a55a88'}`,
                  }}
                >{s.label}</button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

/** PLAN-113/114 F1 lab: mounts the signed level-up layer on the REAL presentation bus and
 *  exposes a trigger chip that dispatches a real `hero_levelup_mock` for a real resident —
 *  the eventId is a lab counter (the command handler owns it in production). */
const LevelUpLab: React.FC<{ residents: Array<{ id: string } & Record<string, unknown>> }> = ({ residents }) => {
  const { t } = useTranslation('idleVillage');
  const seq = useRef(0);
  const residentsById = useMemo(
    () => Object.fromEntries(residents.map((r) => [r.id, r])) as Record<string, ResidentState>,
    [residents],
  );
  return (
    <>
      <HudRealLevelUp residentsById={residentsById} />
      <button
        type="button"
        data-testid="hudreal-levelup-trigger"
        onClick={() => {
          const r = residents[Math.floor(Math.random() * residents.length)];
          if (!r) return;
          seq.current += 1;
          dispatchHeroLevelUp({ type: 'hero_levelup_mock', residentId: r.id, level: 2 + (seq.current % 9), eventId: `lab:${seq.current}` });
        }}
        style={{
          position: 'absolute', left: 24, bottom: 160, zIndex: 8, cursor: 'pointer',
          fontFamily: 'Cinzel, "EB Garamond", serif', fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase',
          color: '#f0d58c', background: 'rgba(5,32,26,.9)', border: '1.5px solid #c9a55a', borderRadius: 9, padding: '8px 14px',
        }}
      >
        {t('gameFrame.director.levelUp', 'Hero level-up')}
      </button>
    </>
  );
};

/** Slot visibility by view (mirrors hudLayoutB `views`: roster/time/resources/nav/commands persistent,
 *  panel contextual, voce/toast narrative). */
const SLOTS_VIEWS: Record<string, HudView[]> = {
  roster: ['overview', 'context', 'narrative'],
  time: ['overview', 'context', 'narrative'],
  resources: ['overview', 'context', 'narrative'],
  panel: ['context'],
  rosterOpen: ['context'],
  nav: ['overview', 'context', 'narrative'],
  commands: ['overview', 'context', 'narrative'],
  voce: ['narrative'],
  toast: ['narrative'],
};

function NavDemo({ onRecenter }: { onRecenter: () => void }) {
  const [active, setActive] = useState('map');
  return <HudRealNav navItems={DEFAULT_GAME_FRAME_CONFIG.navItems} activeNavId={active} onNavSelect={setActive} onRecenter={onRecenter} />;
}
