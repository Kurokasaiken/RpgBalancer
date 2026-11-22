/**
 * CharterSection — PLAN-131 T-004: la scheda del charter sotto il mount
 * della card `/hud-lab`.
 *
 * Forma FISSA, sempre visibile — niente accordion/disclosure/popup,
 * nessuno stato nascosto (il lab è un banco dev: pagina più lunga
 * accettata, zero interazioni per leggere).
 *
 * Gerarchia informativa (r003 — prima ciò che guida le decisioni):
 * riga verdetto (stage calcolato + confidence) → appreciated →
 * openIssues → openExploration → campi tecnici (materiali/stati/
 * typeFloor). Le tre domande a colpo d'occhio:
 *   appreciated      = cosa non toccare (il perché, sorretto dal ruling)
 *   openIssues       = cosa si può correggere
 *   openExploration  = cosa va chiesto al Director (si propone, non si decide)
 */
import type { ComponentCharter } from '@/config/hud/charters';
import {
  computeCharterStage,
  type CharterStage,
} from '@/config/hud/charterSchema';

const STAGE_STYLE: Record<CharterStage, { label: string; color: string; bg: string; hint: string }> = {
  open: {
    label: 'open',
    color: '#8fd0ff',
    bg: 'rgba(40,110,160,0.25)',
    hint: 'dimensioni estetiche indecise — si propone al Director, non si decide',
  },
  converged: {
    label: 'converged',
    color: '#a8e6b0',
    bg: 'rgba(50,140,80,0.22)',
    hint: 'decisioni documentate — non toccare la forma sorretta da ruling senza nuovo ruling',
  },
  documented: {
    label: 'documented',
    color: '#ffd98a',
    bg: 'rgba(140,100,30,0.28)',
    hint: 'solo difetti noti documentati',
  },
  undocumented: {
    label: 'undocumented',
    color: '#9aa4ae',
    bg: 'rgba(90,100,110,0.22)',
    hint: 'scheda vuota',
  },
};

const CONFIDENCE_STYLE: Record<ComponentCharter['confidence'], { label: string; color: string; bg: string }> = {
  reconstructed: {
    label: 'reconstructed · audit pendente',
    color: '#f0c080',
    bg: 'rgba(180,120,50,0.22)',
  },
  'director-verified': {
    label: 'director-verified',
    color: '#ffd98a',
    bg: 'rgba(140,100,30,0.32)',
  },
};

const badge = (text: string, color: string, bg: string, title?: string) => (
  <span
    title={title}
    style={{
      fontSize: 9,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      color,
      background: bg,
      border: `1px solid ${color}55`,
      borderRadius: 4,
      padding: '1px 6px',
      whiteSpace: 'nowrap',
    }}
  >
    {text}
  </span>
);

const rowLabel = (text: string, color: string) => (
  <div
    style={{
      fontSize: 9,
      textTransform: 'uppercase',
      letterSpacing: 0.7,
      color,
      marginBottom: 3,
      flexShrink: 0,
    }}
  >
    {text}
  </div>
);

const item = (text: string, ref?: string) => (
  <li key={text} style={{ margin: '0 0 3px', fontSize: 10, lineHeight: 1.45, color: '#d5e0ea' }}>
    {text}
    {ref ? <span style={{ color: '#7d92a6' }}> — {ref}</span> : null}
  </li>
);

const Section: React.FC<{ label: string; color: string; marker: string; children: React.ReactNode }> = ({
  label,
  color,
  marker,
  children,
}) => (
  <div data-charter-block={marker} style={{ marginBottom: 8 }}>
    {rowLabel(label, color)}
    {children}
  </div>
);

export const CharterSection: React.FC<{ charter: ComponentCharter }> = ({ charter }) => {
  const stage = computeCharterStage(charter);
  const ss = STAGE_STYLE[stage];
  const cs = CONFIDENCE_STYLE[charter.confidence];
  const openIssues = charter.openIssues ?? [];
  const openExploration = charter.openExploration ?? [];
  const stateKeys = Object.keys(charter.states) as (keyof typeof charter.states)[];

  return (
    <section
      data-charter-section={charter.componentId}
      style={{
        borderTop: '1px solid rgba(125,180,220,0.18)',
        padding: '8px 10px 9px',
        fontSize: 10,
        color: '#c9d6e2',
      }}
    >
      {/* riga verdetto — stage calcolato dal gate + confidence */}
      <div data-charter-verdict="" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
        {badge(`stage: ${ss.label}`, ss.color, ss.bg, ss.hint)}
        {badge(cs.label, cs.color, cs.bg)}
        {charter.ornamentLevel ? badge(`orn. ${charter.ornamentLevel}`, '#ffd98a', 'rgba(140,100,30,0.32)') : null}
      </div>

      {/* appreciated — cosa non toccare (il perché; il vincolo vive nel ruling citato) */}
      <div data-charter-appreciated="">
        <Section label="Apprezzato — non toccare senza ruling" color="#a8e6b0" marker="appreciated">
          <ul style={{ margin: 0, paddingLeft: 14 }}>
            {charter.appreciated.map((a) => item(a.trait, a.ruling))}
          </ul>
        </Section>
      </div>

      {/* openIssues — cosa si può correggere */}
      <div data-charter-open-issues="">
        <Section label="Difetti noti — correggibili" color="#ffd98a" marker="open-issues">
          {openIssues.length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: 14 }}>{openIssues.map((o) => item(o.summary, o.ref))}</ul>
          ) : (
            <div style={{ fontSize: 10, color: '#7d92a6' }}>nessuno registrato</div>
          )}
        </Section>
      </div>

      {/* openExploration — cosa va chiesto al Director */}
      <div data-charter-open-exploration="">
        <Section label="Esplorazione aperta — chiedi al Director" color="#8fd0ff" marker="open-exploration">
          {openExploration.length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: 14 }}>
              {openExploration.map((o) => item(o.dimension, o.ref))}
            </ul>
          ) : (
            <div style={{ fontSize: 10, color: '#7d92a6' }}>nessuna dimensione indecisa</div>
          )}
        </Section>
      </div>

      {/* campi tecnici — materiali, stati, floor tipografico */}
      <div data-charter-technical="">
        <Section label="Tecnici" color="#7d92a6" marker="technical">
          <div style={{ display: 'grid', gridTemplateColumns: '86px 1fr', gap: '3px 8px', fontSize: 10, lineHeight: 1.45 }}>
            <span style={{ color: '#7d92a6' }}>materiali</span>
            <span>
              {charter.materials.length > 0
                ? charter.materials.map((m) => `${m.material}@${m.region}`).join(' · ')
                : '—'}
            </span>
            <span style={{ color: '#7d92a6' }}>stati</span>
            <span>{stateKeys.join(', ') || '—'}</span>
            <span style={{ color: '#7d92a6' }}>typeFloor</span>
            <span>
              {charter.typeFloor.length > 0
                ? charter.typeFloor.map((t) => `${t.role}${t.minPx !== undefined ? ` ≥${t.minPx}px` : ''}`).join(' · ')
                : '—'}
            </span>
            <span style={{ color: '#7d92a6' }}>anatomia</span>
            <span>
              {charter.anatomy
                ? charter.anatomy.kind === 'regions'
                  ? `regions → ${charter.anatomy.ref}`
                  : `zones: ${charter.anatomy.zones.map((z) => z.name).join(', ')}`
                : '—'}
            </span>
            <span style={{ color: '#7d92a6' }}>resize</span>
            <span>
              {charter.proportions.basis} / {charter.proportions.resize}
            </span>
          </div>
        </Section>
      </div>
    </section>
  );
};
