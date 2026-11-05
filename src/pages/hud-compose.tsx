import { useEffect, useState } from 'react';
import { PixiWorldMap } from '@/ui/idleVillage/pixiSpike/PixiWorldMap';
import { useRosterKitData } from '@/ui/idleVillage/frozen/kits/rosterKit';
import { HudRealRoster } from '@/ui/idleVillage/hudReal/HudRealRoster';
import { PANEL_FRAME } from '@/ui/idleVillage/hudReal/panelFrameGeometry';
import { HudRealPanel } from '@/ui/idleVillage/hudReal/HudRealPanel';
import { HudRealVoce } from '@/ui/idleVillage/hudReal/HudRealVoce';
import { HudRealSeal } from '@/ui/idleVillage/hudReal/HudRealSeal';
import { HudRealBrand } from '@/ui/idleVillage/hudReal/HudRealBrand';
import { HudRealBust } from '@/ui/idleVillage/hudReal/HudRealBust';
import { HudRealRoundButton } from '@/ui/idleVillage/hudReal/HudRealRoundButton';
import { EngravedIcon } from '@/ui/idleVillage/components/gameFrame/engravedIcons';
import { HudRealTime, type TimeSpeed } from '@/ui/idleVillage/hudReal/HudRealTime';
import { HudRealNav } from '@/ui/idleVillage/hudReal/HudRealNav';
import { DEFAULT_GAME_FRAME_CONFIG } from '@/balancing/config/idleVillage/gameFrameConfig';
import { HudRealResources } from '@/ui/idleVillage/hudReal/HudRealResources';
import { useTranslation } from 'react-i18next';
import { selectResourceOutlook, useMinimalGameplayWithIdleVillageConfig } from '@/store/useMinimalGameplay';
import { buildResourceReadoutItems } from '@/ui/idleVillage/components/gameFrame';

/** Full-HUD composition on the real map — every generated asset placed in its
 *  intended slot per the selected zanara mockups. Director + AI-review target. */

const MAP_MANIFEST = '/assets/world/mappa2/base/manifest.json';
const STAGE_COLOR = '#1675ad';

const abs = (x: number | string, y: number | string, extra: React.CSSProperties = {}): React.CSSProperties => ({
  position: 'absolute', left: x, top: y, ...extra,
});

const DESIGN_W = 1600;
const DESIGN_H = 900;
/** One margin for every edge-anchored block (24 px grid): the right column shares a single right edge. */
const M = 24;

export default function HudComposePage() {
  const { residents } = useRosterKitData();
  const { t } = useTranslation('idleVillage');
  const { state, config } = useMinimalGameplayWithIdleVillageConfig();
  /* ?stress: long texts and extreme values to check overflow of the real components (PLAN-110 review A.7) */
  const stress = new URLSearchParams(window.location.search).has('stress');
  /* Fluid design box: scale from the reference 1600x900, then extend the box to the real window so right/bottom anchors sit on the screen edge. */
  const measure = () => {
    const sc = Math.min(window.innerWidth / DESIGN_W, window.innerHeight / DESIGN_H);
    return { scale: sc, W: window.innerWidth / sc, H: window.innerHeight / sc };
  };
  const [box, setBox] = useState(measure);
  useEffect(() => {
    const onResize = () => setBox(measure());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const { scale, W: BOX_W, H: BOX_H } = box;

  return (
    <div data-hudreal-lift="" style={{ position: 'fixed', inset: 0 }}>
      <style>{`[data-testid^=compose-hudreal],[data-testid=compose-zanara-resources]{filter:drop-shadow(0 2px 5px rgba(1,14,18,.7)) drop-shadow(0 0 1px rgba(1,14,18,.9))}`}</style>
      <PixiWorldMap manifestPath={MAP_MANIFEST} stageColor={STAGE_COLOR} />
      <div style={{
        position: 'absolute', left: 0, top: 0, width: BOX_W, height: BOX_H,
        transform: `scale(${scale})`, transformOrigin: 'top left',
      }}>

      {/* LEFT: HudRealRoster (PLAN-110 C1: approved ring + plaque, plaque on hover) */}
      <div data-testid="compose-hudreal-roster" style={{ ...abs(28, -47), zIndex: 4 }}>
        <HudRealRoster residents={residents} crest="none" plaques="rest" visibleRows={4} selectedResidentId={residents[1]?.id ?? null} />
      </div>

      {/* BOTTOM-CENTRE: HudRealNav (PLAN-110 C3, real nav items) */}
      <div data-testid="compose-hudreal-nav" style={{ position: 'absolute', left: (BOX_W - 513) / 2 + 60, bottom: 14, zIndex: 5 }}>
        <NavDemo />
      </div>

      {/* compass: removed from the panoramic view until it has a real coordinate source (HUD-108 P0) */}

      {/* VOCE (PLAN-110 C10): narrator toast above the nav, left */}
      <div data-testid="compose-hudreal-voce" style={{ position: 'absolute', left: 8, bottom: M, zIndex: 5 }}>
        <HudRealVoce title={stress ? 'La via del Nord e la lunga marcia delle sette sorelle' : 'La via del Nord'}>{stress ? "Il vento porta con sé un profumo di salsedine e di cenere, e laggiù oltre le scogliere gli antichi fari tornano ad accendersi uno dopo l'altro mentre la marea sale… sembra che ci sia una nuova isola all'orizzonte." : "Il vento porta con sé un profumo di salsedine… sembra che ci sia una nuova isola all'orizzonte."}</HudRealVoce>
      </div>

      {/* TOP-LEFT: HudRealBrand (PLAN-110 C8), beside the roster crest */}
      <div data-testid="compose-hudreal-brand" style={{ position: 'absolute', left: 6, top: 8, zIndex: 5 }}>
        <HudRealBrand title={stress ? 'Wanderlust Reborn Chronicles' : 'Wanderlust'} />
      </div>

      {/* bust: not part of the panel in the mockup (it belongs to the resource plaque); removed from here */}

      {/* TOP-RIGHT: ZanaraResources (real component, real store outlook) */}
      <div data-testid="compose-zanara-resources" style={{ ...abs('auto', 14), right: M, zIndex: 5 }}>
        <HudRealResources items={buildResourceReadoutItems(selectResourceOutlook(state, config), t).map((it) => (stress ? { ...it, value: it.id === 'gold' ? '1234567' : '99999', max: it.max !== undefined ? 123456 : undefined } : it))} />
      </div>

      {/* RIGHT: HudRealPanel (PLAN-110 C4) — sample POI content */}
      <div data-testid="compose-hudreal-panel" style={{ ...abs('auto', 150), right: M, zIndex: 5 }}>
        <HudRealPanel
          kicker="Poi — Regione Nord" title={stress ? 'Le Cascate di Zanara e le Grotte degli Alchimisti di Corte' : 'Le Cascate di Zanara'}
          body={stress ? "Antiche terrazze d'acqua dove gli alchimisti di corte distillavano la rugiada stellare. Si dice che chi si bagni alla terza cascata veda il proprio destino, e che le grotte dietro la cascata nascondano un antico manufatto che nessuno ha mai osato toccare, perché la corrente è forte e la leggenda troppo allettante per chi non è preparato. ".repeat(2) : "Antiche terrazze d'acqua dove gli alchimisti di corte distillavano la rugiada stellare. Si dice che chi si bagni alla terza cascata veda il proprio destino."}
          illustration={<img src="/assets/ui/hud-real/panel/illustration-waterfall.webp" alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
          action={{ label: 'Inizia' }}
        >
          <div style={{ fontSize: 12, letterSpacing: 1.5, color: '#6b5a3e', textTransform: 'uppercase' }}>Ricompense</div>
          <div style={{ display: 'flex', gap: 14, marginTop: 1, alignItems: 'center', whiteSpace: 'nowrap', fontSize: 14 }}>
            {[['gold', '350'], ['food', '50'], ['wood', '12']].map(([k, v]) => (
              <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><img src={`/assets/ui/resources/res-${k}-64.webp`} alt="" width={22} height={22} draggable={false} />{v}</span>
            ))}
          </div>
          <div style={{ fontSize: 12, letterSpacing: 1.5, color: '#6b5a3e', textTransform: 'uppercase', marginTop: 4 }}>Requisiti</div>
          <div style={{ display: 'grid', gap: 0, marginTop: 1, fontSize: 13.5, lineHeight: '18px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><EngravedIcon id="role-member" size={16} style={{ color: '#4b3d28' }} />Squadra di 2+ eroi</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><EngravedIcon id="role-leader" size={16} style={{ color: '#4b3d28' }} />Livello minimo 8</span>
          </div>
        </HudRealPanel>
      </div>

      {/* VICTORY SEAL (PLAN-110 C7): stacked under the contextual panel, same right edge (it is the expedition's success chance) */}
      <div data-testid="compose-hudreal-seal" style={{ position: 'absolute', right: M, top: 150 + PANEL_FRAME.h + 10, zIndex: 6 }}>
        <HudRealSeal value="68%" label="Probabilità di successo" marks={['danger', 'danger', 'win', 'off', 'off']} />
      </div>

      {/* TIME (PLAN-110 C11): day + pause + speed, top centre-left */}
      <div data-testid="compose-hudreal-time" style={{ position: 'absolute', left: Math.round((BOX_W - 485) / 2) - 18, top: 30, zIndex: 5 }}>
        <TimeDemo />
      </div>

      {/* TOP-CENTRE: round command cluster (menu, panels, hide) — covers the /game controls (PLAN-110 review) */}
      <div data-testid="compose-hudreal-cluster" style={{ position: 'absolute', right: M + 396 + 12, top: 53, zIndex: 5, display: 'flex', gap: 6 }}>
        <HudRealRoundButton label="Menu"><EngravedIcon id="cmd-menu" size={22} /></HudRealRoundButton>
        <HudRealRoundButton label="Pannelli" active><EngravedIcon id="cmd-panels" size={22} /></HudRealRoundButton>
        <HudRealRoundButton label="Nascondi HUD"><EngravedIcon id="cmd-eye" size={22} /></HudRealRoundButton>
      </div>

      {/* globe: removed until it has an action (HUD-108 P0) */}

      </div>
    </div>
  );
}
function TimeDemo() {
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState<TimeSpeed>(1);
  return <HudRealTime dayLabel="Giorno 3" paused={paused} speed={speed} onTogglePause={() => setPaused((v) => !v)} onSpeed={(s) => { setSpeed(s); setPaused(false); }}
    labels={{ pause: 'Pausa', resume: 'Riprendi', speed: (s) => `Velocità ×${s}` }} />;
}

function NavDemo() {
  const [active, setActive] = useState('map');
  return <HudRealNav navItems={DEFAULT_GAME_FRAME_CONFIG.navItems} activeNavId={active} onNavSelect={setActive} onRecenter={() => undefined} />;
}
