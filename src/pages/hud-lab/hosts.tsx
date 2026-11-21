/**
 * PLAN-129 — `/hud-lab` host registry: `host` key → React mount for the card.
 * Hosts are lab-owned wrappers; production components are consumed through
 * their public API only (no prop/host added to contracted files to serve the
 * lab — PLAN-129 §5).
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SkinScope } from '@/ui/idleVillage/skins/primitives';
import { PanelFrameOrnaments } from '@/ui/idleVillage/skins/primitives/PanelFrameOrnaments';
import { thinFrameManifest } from '@/ui/idleVillage/skins/primitives/sliceKitManifest';
import { panelFrame7Frame } from '@/generated/slicekit/panelFrame7Frame';
import { HudScrollBand } from '@/ui/idleVillage/skins/primitives/HudScrollBand';
import { HudScrollBandX } from '@/ui/idleVillage/skins/primitives/HudScrollBandX';
import { HudRealCassettoHost } from '@/ui/idleVillage/hudReal/HudRealCassettoHost';
import { HudRealNav } from '@/ui/idleVillage/hudReal/HudRealNav';
import { HudRealTimeConnected } from '@/ui/idleVillage/hudReal/HudRealTimeConnected';
import { HudRealTriad } from '@/ui/idleVillage/hudReal/HudRealTriad';
import { GameTopChrome } from '@/ui/idleVillage/components/gameFrame/GameTopChrome';
import { VillageStashPanel } from '@/ui/idleVillage/components/gameFrame/VillageStashPanel';
import { VILLAGE_STASH_CONFIG } from '@/balancing/config/idleVillage/villageStashConfig';
import { useVillageStashStore } from '@/ui/idleVillage/store/useVillageStashStore';
import { EngravedIcon } from '@/ui/idleVillage/components/gameFrame/engravedIcons';
import WanderlustRosterCardV2 from '@/ui/idleVillage/rosterV2/WanderlustRosterCardV2';
import { useRosterKitData, RosterKitShell } from '@/ui/idleVillage/frozen/kits/rosterKit';
import { selectResourceOutlook, useMinimalGameplayWithIdleVillageConfig } from '@/store/useMinimalGameplay';
import { buildResourceReadoutItems } from '@/ui/idleVillage/components/gameFrame';
import { DEFAULT_GAME_FRAME_CONFIG } from '@/balancing/config/idleVillage/gameFrameConfig';
import { frameFor } from '@/ui/idleVillage/hudReal/layout/hudLayoutB';
import { PAINTED_PIECES, PLAQUE_ASPECT, paintedBoxFrame, paintedGround, paintedNiche } from '@/ui/idleVillage/skins/primitives/paintedPieces';
import paletteNav from '../../../test-results/slicekit/material-palette-nav.json';
import type { LabEntry } from './catalog';

export type Host = React.FC<{ entry: LabEntry }>;

/* Scale a design-width child into the card width — components keep their real
 * proportions (Fit = zoom out, never stretch). */
const Fit: React.FC<{ designWidth: number; designHeight: number; children: React.ReactNode }> = ({ designWidth, designHeight, children }) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(1);
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setK(el.clientWidth / designWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [designWidth]);
  return (
    <div ref={wrapRef} style={{ width: '100%', height: designHeight * k, overflow: 'hidden' }}>
      <div style={{ width: designWidth, height: designHeight, transform: `scale(${k})`, transformOrigin: 'top left' }}>
        {children}
      </div>
    </div>
  );
};

export const NoteHost: Host = ({ entry }) => (
  <div style={{ padding: 10, fontSize: 11, lineHeight: 1.5, color: '#c9d6e2' }}>
    {entry.notes ?? 'Card di catalogo — nessun mount live.'}
  </div>
);

export const CassettoHost: Host = () => (
  <SkinScope>
    <div style={{ height: 560, overflow: 'hidden' }}>
      <HudRealCassettoHost />
    </div>
  </SkinScope>
);

export const RosterHost: Host = () => {
  const { residents } = useRosterKitData();
  const rows = residents.slice(0, 6);
  if (rows.length === 0) return <div style={{ padding: 10, fontSize: 11 }}>nessun residente nello store</div>;
  return (
    <RosterKitShell>
      <SkinScope>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 8, background: 'rgba(6,14,20,0.6)', borderRadius: 8 }}>
          {rows.map((r) => (
            <WanderlustRosterCardV2
              key={r.id}
              workerId={r.id}
              label={r.displayName ?? r.id}
              hp={r.currentHp}
              maxHp={r.maxHp}
              fatigue={r.fatigue}
              portraitUrl={r.portraitUrl}
              statusLabel={r.status}
              isHero={r.isHero}
              compact
            />
          ))}
        </div>
      </SkinScope>
    </RosterKitShell>
  );
};

export const StashHost: Host = () => {
  /* Same hydrate-once the cassetto host does — on the lab route no game boot
   * fills the ledger. */
  useEffect(() => { void useVillageStashStore.getState().hydrate(); }, []);
  return (
  <div style={{ position: 'relative', height: 430, overflow: 'hidden' }}>
    <VillageStashPanel
      config={VILLAGE_STASH_CONFIG}
      left={0}
      top={0}
      widthPx={VILLAGE_STASH_CONFIG.panel.widthPx}
      zIndex={1}
      onClose={() => undefined}
    />
  </div>
  );
};

export const TopChromeHost: Host = () => {
  const { t } = useTranslation('idleVillage');
  const { state, config } = useMinimalGameplayWithIdleVillageConfig();
  const items = useMemo(() => buildResourceReadoutItems(selectResourceOutlook(state, config), t), [state, config, t]);
  const frame = useMemo(() => frameFor(1440, 900, 1), []);
  return (
    <Fit designWidth={1440} designHeight={130}>
      <div style={{ position: 'relative', width: 1440, height: 130 }}>
        <GameTopChrome items={items} frame={frame} visible />
      </div>
    </Fit>
  );
};

export const NavHost: Host = () => (
  <Fit designWidth={1000} designHeight={150}>
    <div style={{ position: 'relative', width: 1000, height: 150 }}>
      <HudRealNav
        navItems={DEFAULT_GAME_FRAME_CONFIG.navItems}
        activeNavId={DEFAULT_GAME_FRAME_CONFIG.navItems[0]?.id ?? ''}
        onNavSelect={() => undefined}
        onRecenter={() => undefined}
      />
    </div>
  </Fit>
);

export const TimeHost: Host = () => (
  <SkinScope>
    <div style={{ position: 'relative', height: 90 }}>
      <HudRealTimeConnected />
    </div>
  </SkinScope>
);

export const TriadHost: Host = () => (
  <SkinScope>
    <div style={{ position: 'relative', width: 320, height: 430 }}>
      <HudRealTriad onRosterClose={() => undefined} />
    </div>
  </SkinScope>
);

export const VictoryHost: Host = ({ entry }) => <NoteHost entry={entry} />;

/* --------------------------------------------------------------- pieces --- */

export const SmeraldoPiece: Host = () => (
  <div style={{ position: 'relative', width: '92%', height: 160, margin: '12px auto', background: 'linear-gradient(160deg, rgba(14,34,30,0.95), rgba(4,18,14,0.98))', borderRadius: 8 }}>
    <PanelFrameOrnaments variant="corniciStash" manifest={thinFrameManifest(panelFrame7Frame, 0.5)} />
  </div>
);

export const CornersPiece: Host = () => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, padding: 10 }}>
    {(['tl', 'tr', 'bl', 'br'] as const).map((c) => (
      <img key={c} src={`/assets/ui/hud-real/panel-frame/corner-mockup-${c}.webp`} alt={`corner ${c}`}
        style={{ width: '100%', display: 'block', background: 'rgba(8,20,16,0.85)', borderRadius: 4 }} />
    ))}
  </div>
);

export const ScrollBandPiece: Host = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  return (
    <div style={{ position: 'relative', height: 150, margin: 8 }}>
      <div ref={scrollRef} style={{ position: 'absolute', inset: 0, overflowY: 'auto', padding: 8, fontSize: 11, lineHeight: 1.6, color: '#d8cba8' }}>
        {Array.from({ length: 12 }, (_, i) => <p key={i} style={{ margin: '0 0 6px' }}>Voce di esempio {i + 1} — la banda pilota lo scroll reale del contenuto.</p>)}
      </div>
      <HudScrollBand scrollRef={scrollRef} />
    </div>
  );
};

export const PiastrinaPiece: Host = () => (
  <div style={{ display: 'flex', gap: 14, padding: 14, justifyContent: 'center' }}>
    {[false, true].map((on) => (
      <div key={String(on)} style={{ position: 'relative', width: 64, height: 64, borderRadius: 8, background: 'linear-gradient(160deg,#12241e,#071410)', border: '1px solid rgba(200,170,90,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <EngravedIcon id="ico-pouch" size={26} aria-hidden />
        <img src="/assets/ui/hud-real/piastrina/cornice-hover-a.webp" alt="" aria-hidden data-piastrina-cornice="" draggable={false}
          style={{ position: 'absolute', inset: -3, width: 'calc(100% + 6px)', height: 'calc(100% + 6px)', objectFit: 'fill', opacity: on ? 1 : 0, pointerEvents: 'none' }} />
      </div>
    ))}
  </div>
);

export const CtaPiece: Host = () => (
  <div style={{ ...paintedGround(), display: 'flex', gap: 16, padding: 14, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
    {[false, true].map((disabled) => (
      <div key={String(disabled)} style={{ position: 'relative', width: 200, height: 200 / PLAQUE_ASPECT, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 200 / PLAQUE_ASPECT * 0.152, paddingLeft: 200 * 0.01 }}>
        <img src={PAINTED_PIECES.plaque.src} alt="" aria-hidden draggable={false}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
        {/* enamel-only layer: the disabled filter hits the lacquer, the brass stays gold */}
        <img src={PAINTED_PIECES.plaqueEnamel.src} alt="" aria-hidden draggable={false}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', filter: disabled ? 'saturate(.72) brightness(.82)' : undefined }} />
        <span style={{ position: 'relative', fontFamily: 'Cinzel, serif', fontSize: 14, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--skin-cassetto-cta-text, #f4e8c8)', opacity: disabled ? 0.82 : 1 }}>Confirm</span>
      </div>
    ))}
  </div>
);

/* Painted pieces (Gemini 2026-11-21): each card wears the piece through the shared recipe in `skins/primitives/paintedPieces.ts`,
 * the same one the cassetto uses — so what you see here is what a new component gets by spreading that recipe. */

export const ScrollBandXPiece: Host = () => {
  const rowRef = useRef<HTMLDivElement>(null);
  return (
    <div style={{ ...paintedGround(), position: 'relative', margin: 8, padding: '10px 0 26px' }}>
      <div ref={rowRef} data-hud-scroll-band="" style={{ width: 230, margin: '0 auto', overflowX: 'auto', overflowY: 'hidden' }}>
        <div style={{ display: 'flex', gap: 8, width: 'max-content', padding: '2px 0 8px' }}>
          {Array.from({ length: 6 }, (_, i) => (
            <span key={i} style={{ ...paintedNiche('15px', '2px'), width: 70, height: 46, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#e9dfae', fontFamily: 'Cinzel, serif', fontSize: 18 }}>+</span>
          ))}
        </div>
      </div>
      <HudScrollBandX scrollRef={rowRef} />
    </div>
  );
};

export const GroundPiece: Host = () => (
  <div style={{ ...paintedGround(), height: 190, margin: 10, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d8e6dc', fontFamily: 'Cinzel, serif', fontSize: 13, letterSpacing: '0.04em' }}>
    Testo sopra il marmo — resta leggibile
  </div>
);

export const BoxFramePiece: Host = () => (
  <div style={{ ...paintedGround(), padding: 14, display: 'grid', gap: 12 }}>
    {[120, 64].map((h) => (
      <div key={h} style={{ ...paintedBoxFrame({ y: '24px', x: '30px' }, '2px'), height: h, background: 'linear-gradient(180deg, rgba(4,40,30,.42), rgba(3,32,25,.52))', color: '#d8e6dc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cinzel, serif', fontSize: 12 }}>
        riquadro {h} px — i bordi si allungano, gli angoli no
      </div>
    ))}
  </div>
);

export const NichePiece: Host = () => (
  <div style={{ ...paintedGround(), padding: 16, display: 'flex', gap: 10, justifyContent: 'center' }}>
    {[false, true, false].map((on, i) => (
      <span key={i} style={{ ...paintedNiche('22px', '2px'), width: 96, height: 60, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', opacity: on ? 1 : 0.85 }}>
        {on && <EngravedIcon id="ico-pouch" size={26} aria-hidden />}
      </span>
    ))}
  </div>
);

export const RimPiece: Host = () => (
  <div style={{ margin: 10, background: '#04190f', paddingTop: 26 }}>
    <img src={PAINTED_PIECES.rimBottom.src} alt="" aria-hidden draggable={false} style={{ display: 'block', width: '100%', height: 12 }} />
    <div style={{ height: 12, background: '#04190f' }} />
  </div>
);

export const SeatRingPiece: Host = () => (
  <div style={{ ...paintedGround(), display: 'flex', justifyContent: 'center', padding: 14 }}>
    <img src={PAINTED_PIECES.seatRing.src} alt="" aria-hidden draggable={false} style={{ width: 110, height: 110 }} />
  </div>
);

const CASSETTO_PIECES = '/assets/ui/hud-real/slicekit/cassetto';

export const CassettoFramePiece: Host = () => (
  <div style={{ ...paintedGround(), padding: 14 }}>
    <div style={{ position: 'relative', height: 150, borderRadius: 4, overflow: 'hidden', background: 'linear-gradient(180deg, rgba(4,40,30,.5), rgba(3,32,25,.6))' }}>
      <img src={`${CASSETTO_PIECES}/frame-corner-tl.webp`} alt="" aria-hidden draggable={false} style={{ position: 'absolute', top: -4, left: -4, width: 90, pointerEvents: 'none' }} />
      <img src={`${CASSETTO_PIECES}/frame-corner-tl.webp`} alt="" aria-hidden draggable={false} style={{ position: 'absolute', top: -4, right: -4, width: 90, transform: 'scaleX(-1)', pointerEvents: 'none' }} />
      <img src={`${CASSETTO_PIECES}/frame-corner-bl.webp`} alt="" aria-hidden draggable={false} style={{ position: 'absolute', bottom: -4, left: -4, width: 90, pointerEvents: 'none' }} />
      <img src={`${CASSETTO_PIECES}/frame-corner-bl.webp`} alt="" aria-hidden draggable={false} style={{ position: 'absolute', bottom: -4, right: -4, width: 90, transform: 'scaleX(-1)', pointerEvents: 'none' }} />
      <img src={`${CASSETTO_PIECES}/rail-mid-fold.webp`} alt="" aria-hidden draggable={false} style={{ position: 'absolute', left: '50%', top: '50%', width: 70, transform: 'translate(-50%,-50%)', pointerEvents: 'none' }} />
    </div>
    <p style={{ margin: '8px 0 0', fontSize: 11, color: '#d8e6dc', fontFamily: 'Cinzel, serif', textAlign: 'center' }}>
      tl/bl specchiati + rotaia mediana piegata — la cornice esterna del cassetto
    </p>
  </div>
);

export const CartouchePiece: Host = () => (
  <div style={{ ...paintedGround(), padding: 14 }}>
    <div style={{ position: 'relative', height: 120, margin: '0 10px 14px', borderRadius: 4, background: 'linear-gradient(180deg, rgba(6,50,38,.55), rgba(4,36,28,.65))' }}>
      {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map((pos) => (
        <img key={pos} src={`${CASSETTO_PIECES}/cart-corner.webp`} alt="" aria-hidden draggable={false}
          style={{
            position: 'absolute', width: 40, pointerEvents: 'none',
            top: pos.startsWith('top') ? -3 : undefined, bottom: pos.startsWith('bottom') ? -3 : undefined,
            left: pos.endsWith('left') ? -3 : undefined, right: pos.endsWith('right') ? -3 : undefined,
            transform: `${pos.endsWith('right') ? 'scaleX(-1)' : ''} ${pos.startsWith('bottom') ? 'scaleY(-1)' : ''}`.trim() || undefined,
          }} />
      ))}
      <img src={`${CASSETTO_PIECES}/cart-gem.webp`} alt="" aria-hidden draggable={false} style={{ position: 'absolute', left: '50%', bottom: -12, width: 66, transform: 'translateX(-50%)', pointerEvents: 'none' }} />
    </div>
    <p style={{ margin: 0, fontSize: 11, color: '#d8e6dc', fontFamily: 'Cinzel, serif', textAlign: 'center' }}>
      angoli cartiglio ×4 + gemma — il riquadro della vignetta quest
    </p>
  </div>
);

export const EmblemsPiece: Host = () => (
  <div style={{ ...paintedGround(), padding: 14, display: 'flex', gap: 18, justifyContent: 'center', alignItems: 'center' }}>
    {(['skull', 'chest', 'laurel'] as const).map((id) => (
      <figure key={id} style={{ margin: 0, textAlign: 'center' }}>
        <img src={`${CASSETTO_PIECES}/${id}.webp`} alt="" aria-hidden draggable={false} style={{ width: 64, height: 64, objectFit: 'contain' }} />
        <figcaption style={{ fontSize: 10, color: '#d8e6dc', fontFamily: 'Cinzel, serif', marginTop: 4 }}>{id}</figcaption>
      </figure>
    ))}
  </div>
);

export const TabsPiece: Host = () => {
  const { t } = useTranslation('idleVillage');
  return (
    <SkinScope>
      <div data-hud-controls="" role="radiogroup" aria-label="demo filtri stash" style={{ display: 'flex', gap: 6, padding: 14, justifyContent: 'center' }}>
        {['all', 'relic', 'supply'].map((id, i) => (
          <button key={id} type="button" role="radio" aria-checked={i === 0} data-ctl="round" data-state={i === 0 ? 'selected' : undefined}
            title={id === 'all' ? t('gameFrame.stash.tabs.all', 'Tutto') : id}>
            <EngravedIcon id={id === 'all' ? 'ico-chest' : 'ico-pouch'} size={12} aria-hidden />
          </button>
        ))}
      </div>
    </SkinScope>
  );
};

interface PaletteMaterial { scala: Array<{ nome: string; hex: string }> }
export const PalettePiece: Host = () => {
  const mats = (paletteNav as { materiali: Record<string, PaletteMaterial> }).materiali;
  return (
    <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {Object.entries(mats).map(([name, m]) => (
        <div key={name}>
          <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.6, color: '#9db4c6', marginBottom: 3 }}>{name}</div>
          <div style={{ display: 'flex', gap: 3 }}>
            {m.scala.map((s) => (
              <div key={s.nome} title={`${s.nome} ${s.hex}`} style={{ flex: 1, height: 18, borderRadius: 3, background: s.hex, border: '1px solid rgba(255,255,255,0.12)' }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const TOKEN_SAMPLE = [
  '--skin-hud-text', '--skin-hud-text-dim', '--skin-hud-field', '--skin-hud-rail',
  '--skin-hud-cta-bg', '--skin-hud-cta-text', '--skin-hud-pill-bg', '--skin-hud-danger',
] as const;
export const TokensPiece: Host = () => (
  <SkinScope>
    <div style={{ padding: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
      {TOKEN_SAMPLE.map((tok) => (
        <div key={tok} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 18, height: 18, borderRadius: 4, background: `var(${tok}, #333)`, border: '1px solid rgba(255,255,255,0.15)', flexShrink: 0 }} />
          <code style={{ fontSize: 9, color: '#9db4c6' }}>{tok.replace('--skin-hud-', '')}</code>
        </div>
      ))}
    </div>
  </SkinScope>
);

