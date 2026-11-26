/**
 * PLAN-134 T-003/T-004 — LEGO board inside `/hud-lab`.
 * Internal review surface: read-only canon + in-memory touched rulings + export.
 */
import { useMemo, useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import type { Piece, PieceKind } from '@/config/hud/pieceSchema';
import { REJECT_CODES } from '@/config/hud/pieceSchema';
import { PanelFrameOrnaments } from '@/ui/idleVillage/skins/primitives/PanelFrameOrnaments';
import type { SliceKitFrameManifest } from '@/ui/idleVillage/skins/primitives/sliceKitManifest';
import { controlsFrame } from '@/generated/slicekit/controlsFrame';
import { panelFrame5Frame } from '@/generated/slicekit/panelFrame5Frame';
import { panelFrame6Frame } from '@/generated/slicekit/panelFrame6Frame';
import { panelFrame7Frame } from '@/generated/slicekit/panelFrame7Frame';
import {
  baselineForStatus,
  buildInventoryAudit,
  computeInventoryRev,
  createInventorySnapshot,
  PIECE_KIND_ORDER,
  type HudLegoInventorySnapshot,
} from './inventory';
import {
  buildRulingPacket,
  renderRulingPacketMarkdown,
  serializeRulingPacket,
  validateRulingInput,
  type PieceReviewState,
  type RejectReason,
} from './review';

const SLICEKIT_MANIFESTS: Record<string, SliceKitFrameManifest> = {
  'scripts/hud-real/specs/controls.json': controlsFrame,
  'scripts/hud-real/specs/panel-frame5.json': panelFrame5Frame,
  'scripts/hud-real/specs/panel-frame6.json': panelFrame6Frame,
  'scripts/hud-real/specs/panel-frame7.json': panelFrame7Frame,
};

const BOARD = {
  panel: 'rgba(8,18,28,0.9)',
  panelSoft: 'rgba(13,28,40,0.72)',
  border: 'rgba(125,180,220,0.28)',
  text: '#dfe9f2',
  dim: '#8fa5b8',
  gold: '#ffd98a',
  blue: '#8fd0ff',
  red: '#f0a0a0',
  green: '#a9e6b8',
  input: 'rgba(3,10,16,0.72)',
} as const;

const controlStyle: CSSProperties = {
  background: BOARD.input,
  color: BOARD.text,
  border: `1px solid ${BOARD.border}`,
  borderRadius: 6,
  padding: '5px 8px',
  fontSize: 11,
};

const buttonStyle: CSSProperties = {
  ...controlStyle,
  cursor: 'pointer',
  fontWeight: 700,
  letterSpacing: 0.2,
};

/** Convert a repo `public/` asset path to its Vite URL. */
function publicAssetUrl(path: string): string {
  return path.replace(/^public\//, '/');
}

/** Neutral comparable preview for one rulingable art piece. */
export const PiecePreview: React.FC<{ piece: Piece }> = ({ piece }) => {
  const frameManifest = piece.kind === 'frame' && piece.source === 'slice-kit' && piece.specRef ? SLICEKIT_MANIFESTS[piece.specRef] : undefined;
  if (frameManifest) {
    return (
      <div data-piece-preview={piece.id} style={{ position: 'relative', height: 126, margin: 10, background: 'linear-gradient(160deg,#10251f,#071410)', borderRadius: 6 }}>
        <PanelFrameOrnaments variant="cornici" manifest={frameManifest} />
      </div>
    );
  }
  const assetEntries = 'assets' in piece && piece.assets
    ? Object.entries(piece.assets).sort(([a], [b]) => (a === 'master' ? -1 : b === 'master' ? 1 : a.localeCompare(b)))
    : [];
  if (assetEntries.length > 0) {
    const isGround = piece.kind === 'ground';
    return (
      <div
        data-piece-preview={piece.id}
        style={{
          height: 126,
          margin: 10,
          overflow: 'hidden',
          borderRadius: 6,
          background: '#071410',
          display: 'grid',
          gridTemplateColumns: assetEntries.length > 1 ? `repeat(${assetEntries.length}, minmax(0, 1fr))` : 'minmax(0, 1fr)',
          alignItems: 'center',
          justifyItems: 'center',
        }}
      >
        {assetEntries.map(([assetKey, assetPath]) => (
          <img
            key={assetKey}
            data-piece-asset={assetKey}
            src={publicAssetUrl(assetPath)}
            alt=""
            draggable={false}
            style={{ width: '100%', height: '100%', objectFit: isGround ? 'cover' : 'contain', display: 'block', minWidth: 0 }}
          />
        ))}
      </div>
    );
  }
  return (
    <div data-piece-preview={piece.id} style={{ height: 126, margin: 10, borderRadius: 6, background: '#071410', display: 'flex', alignItems: 'center', justifyContent: 'center', color: BOARD.dim, fontSize: 11 }}>
      {piece.id}
    </div>
  );
};

interface PieceCardProps {
  piece: Piece;
  ruling?: PieceReviewState[string];
  copiedId: string | null;
  onCopy: (id: string) => void;
  onDecision: (id: string, decision: 'approved' | 'rejected') => void;
  onPatch: (id: string, patch: Partial<NonNullable<PieceReviewState[string]>>) => void;
  onReset: (id: string) => void;
}

const PieceCard: React.FC<PieceCardProps> = ({ piece, ruling, copiedId, onCopy, onDecision, onPatch, onReset }) => {
  const { t } = useTranslation('idleVillage');
  const baseline = baselineForStatus(piece.status);
  const issues = ruling ? validateRulingInput(piece.status, piece.id, ruling) : [];
  const review = ruling?.decision ?? baseline;
  return (
    <article
      data-lego-piece-card={piece.id}
      data-kind={piece.kind}
      data-status={piece.status}
      data-review={review}
      data-touched={ruling ? 'true' : 'false'}
      style={{ background: BOARD.panel, border: `1px solid ${BOARD.border}`, borderRadius: 10, overflow: 'hidden', minWidth: 0 }}
    >
      <header style={{ padding: '8px 10px', borderBottom: `1px solid ${BOARD.border}`, display: 'grid', gap: 5 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <strong style={{ flex: 1, fontSize: 12, color: BOARD.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{piece.id}</strong>
          <button type="button" data-copy-piece-id={piece.id} onClick={() => onCopy(piece.id)} style={buttonStyle}>
            {copiedId === piece.id ? t('hudLab.lego.copied') : t('hudLab.lego.copyId')}
          </button>
        </div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', fontSize: 9, color: BOARD.dim }}>
          <span data-canonical-status={piece.status}>{t(`hudLab.lego.canon.${piece.status}`)}</span>
          <span>·</span>
          <span>{t(`hudLab.lego.kinds.${piece.kind}`)}</span>
          <span>·</span>
          <span data-baseline-review={baseline}>{t(`hudLab.lego.baseline.${baseline}`)}</span>
          {ruling && <span data-touched-badge="" style={{ color: BOARD.gold }}>{t('hudLab.lego.touched')}</span>}
        </div>
      </header>
      <PiecePreview piece={piece} />
      <div style={{ padding: '0 10px 8px', fontSize: 9, color: BOARD.dim, lineHeight: 1.45 }}>
        <div>{piece.role} · {piece.dialect} · {piece.materials.join(', ')}</div>
        <div style={{ marginTop: 3 }}>{piece.provenance.ruling}</div>
      </div>
      <div data-review-controls="" style={{ display: 'flex', gap: 6, padding: '8px 10px', borderTop: `1px solid ${BOARD.border}` }}>
        <button type="button" data-approve-piece={piece.id} onClick={() => onDecision(piece.id, 'approved')} style={{ ...buttonStyle, color: BOARD.green }}>{t('hudLab.lego.approve')}</button>
        <button type="button" data-reject-piece={piece.id} onClick={() => onDecision(piece.id, 'rejected')} style={{ ...buttonStyle, color: BOARD.red }}>{t('hudLab.lego.reject')}</button>
        <button type="button" data-reset-piece={piece.id} onClick={() => onReset(piece.id)} disabled={!ruling} style={{ ...buttonStyle, opacity: ruling ? 1 : 0.45 }}>{t('hudLab.lego.reset')}</button>
      </div>
      {ruling?.decision === 'rejected' && (
        <div data-reject-form={piece.id} style={{ display: 'grid', gap: 6, padding: '0 10px 10px' }}>
          <label style={{ display: 'grid', gap: 3, fontSize: 10, color: BOARD.dim }}>
            {t('hudLab.lego.rejectReason')}
            <select
              data-reject-reason={piece.id}
              value={ruling.reason ?? ''}
              onChange={(event) => onPatch(piece.id, { reason: (event.target.value || undefined) as RejectReason | undefined })}
              style={controlStyle}
            >
              <option value="">{t('hudLab.lego.chooseReason')}</option>
              {REJECT_CODES.map((code) => <option key={code} value={code}>{t(`hudLab.lego.reasons.${code}`)}</option>)}
            </select>
          </label>
          <label style={{ display: 'grid', gap: 3, fontSize: 10, color: BOARD.dim }}>
            {t('hudLab.lego.note')}
            <textarea data-reject-note={piece.id} value={ruling.note ?? ''} onChange={(event) => onPatch(piece.id, { note: event.target.value })} rows={2} style={{ ...controlStyle, resize: 'vertical' }} />
          </label>
          <label style={{ display: 'grid', gap: 3, fontSize: 10, color: BOARD.dim }}>
            {t('hudLab.lego.constraint')}
            <input data-reject-constraint={piece.id} value={ruling.constraint ?? ''} onChange={(event) => onPatch(piece.id, { constraint: event.target.value })} style={controlStyle} />
          </label>
        </div>
      )}
      {issues.length > 0 && (
        <div data-review-errors={piece.id} style={{ margin: '0 10px 10px', padding: 7, border: `1px solid ${BOARD.red}`, borderRadius: 6, color: BOARD.red, fontSize: 10 }}>
          {issues.map((issue) => <div key={issue.code}>{t(`hudLab.lego.errors.${issue.code}`)}</div>)}
        </div>
      )}
    </article>
  );
};

/** Main board component. The review state dies with the React page by design. */
export const LegoBoard: React.FC<{ snapshot?: HudLegoInventorySnapshot }> = ({ snapshot: snapshotProp }) => {
  const { t } = useTranslation('idleVillage');
  const snapshot = useMemo(() => snapshotProp ?? createInventorySnapshot(), [snapshotProp]);
  const audit = useMemo(() => buildInventoryAudit(snapshot), [snapshot]);
  const inventoryRev = useMemo(() => computeInventoryRev(snapshot), [snapshot]);
  const [reviewState, setReviewState] = useState<PieceReviewState>({});
  const [kindFilter, setKindFilter] = useState<'all' | PieceKind>('all');
  const [canonFilter, setCanonFilter] = useState<'all' | Piece['status']>('all');
  const [reviewFilter, setReviewFilter] = useState<'all' | 'touched' | 'untouched' | 'approved' | 'undecided' | 'rejected'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  const visiblePieces = useMemo(() => snapshot.pieces.filter((piece) => {
    const ruling = reviewState[piece.id];
    const review = ruling?.decision ?? baselineForStatus(piece.status);
    if (kindFilter !== 'all' && piece.kind !== kindFilter) return false;
    if (canonFilter !== 'all' && piece.status !== canonFilter) return false;
    if (reviewFilter === 'touched' && !ruling) return false;
    if (reviewFilter === 'untouched' && ruling) return false;
    if ((reviewFilter === 'approved' || reviewFilter === 'undecided' || reviewFilter === 'rejected') && review !== reviewFilter) return false;
    return true;
  }), [snapshot.pieces, reviewState, kindFilter, canonFilter, reviewFilter]);

  const groups = useMemo(() => PIECE_KIND_ORDER.map((kind) => ({
    kind,
    pieces: visiblePieces.filter((piece) => piece.kind === kind).sort((a, b) => a.id.localeCompare(b.id)),
  })).filter((group) => group.pieces.length > 0), [visiblePieces]);

  const packetResult = useMemo(() => buildRulingPacket(reviewState, snapshot), [reviewState, snapshot]);
  const touchedCount = Object.values(reviewState).filter(Boolean).length;
  const exportJson = packetResult.packet ? serializeRulingPacket(packetResult.packet) : '';
  const exportMarkdown = packetResult.packet ? renderRulingPacketMarkdown(packetResult.packet) : '';

  const copyText = (id: string, text: string) => {
    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(text).catch(() => undefined);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
    }
    setCopiedId(id);
    window.setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 1200);
  };
  const patch = (id: string, patchValue: Partial<NonNullable<PieceReviewState[string]>>) => {
    setReviewState((current) => ({ ...current, [id]: { ...current[id], decision: current[id]?.decision ?? 'rejected', ...patchValue } }));
  };

  return (
    <section data-lego-board="" style={{ marginBottom: 30 }}>
      <header style={{ marginBottom: 14, padding: 12, background: BOARD.panelSoft, border: `1px solid ${BOARD.border}`, borderRadius: 10 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 420px' }}>
            <h2 style={{ margin: 0, fontSize: 15, color: BOARD.text }}>{t('hudLab.lego.title')}</h2>
            <p style={{ margin: '4px 0 0', fontSize: 11, color: BOARD.dim }}>{t('hudLab.lego.subtitle')}</p>
          </div>
          <div data-inventory-rev={inventoryRev} style={{ fontSize: 9, color: BOARD.dim, maxWidth: 360, overflowWrap: 'anywhere' }}>
            {t('hudLab.lego.inventoryRevLabel')} {inventoryRev.slice(0, 16)}… · {snapshot.pieces.length} {t('hudLab.lego.piecesCount')}
          </div>
        </div>
        <div data-unsaved-warning="" style={{ marginTop: 9, padding: 8, border: `1px solid ${BOARD.gold}`, borderRadius: 7, color: BOARD.gold, fontSize: 11 }}>
          {t('hudLab.lego.unsavedWarning')}
        </div>
        <div data-lego-filters="" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
          <select aria-label={t('hudLab.lego.filters.kind')} data-filter-kind="" value={kindFilter} onChange={(event) => setKindFilter(event.target.value as typeof kindFilter)} style={controlStyle}>
            <option value="all">{t('hudLab.lego.filters.allKinds')}</option>
            {PIECE_KIND_ORDER.map((kind) => <option key={kind} value={kind}>{t(`hudLab.lego.kinds.${kind}`)}</option>)}
          </select>
          <select aria-label={t('hudLab.lego.filters.canon')} data-filter-canon="" value={canonFilter} onChange={(event) => setCanonFilter(event.target.value as typeof canonFilter)} style={controlStyle}>
            <option value="all">{t('hudLab.lego.filters.allCanon')}</option>
            {(['candidate', 'baptized', 'retired'] as const).map((status) => <option key={status} value={status}>{t(`hudLab.lego.canon.${status}`)}</option>)}
          </select>
          <select aria-label={t('hudLab.lego.filters.review')} data-filter-review="" value={reviewFilter} onChange={(event) => setReviewFilter(event.target.value as typeof reviewFilter)} style={controlStyle}>
            {(['all', 'touched', 'untouched', 'approved', 'undecided', 'rejected'] as const).map((filter) => <option key={filter} value={filter}>{t(`hudLab.lego.filters.${filter}`)}</option>)}
          </select>
        </div>
      </header>

      {groups.map((group) => (
        <section key={group.kind} data-lego-kind-group={group.kind} style={{ marginBottom: 20 }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 12, letterSpacing: 0.8, textTransform: 'uppercase', color: BOARD.text }}>
            {t(`hudLab.lego.kinds.${group.kind}`)} <span style={{ color: BOARD.dim }}>({group.pieces.length})</span>
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12, alignItems: 'start' }}>
            {group.pieces.map((piece) => (
              <PieceCard
                key={piece.id}
                piece={piece}
                ruling={reviewState[piece.id]}
                copiedId={copiedId}
                onCopy={(id) => copyText(id, id)}
                onDecision={(id, decision) => setReviewState((current) => ({ ...current, [id]: { decision } }))}
                onPatch={patch}
                onReset={(id) => setReviewState((current) => {
                  const next = { ...current };
                  delete next[id];
                  return next;
                })}
              />
            ))}
          </div>
        </section>
      ))}

      <section data-export-panel="" style={{ marginTop: 18, padding: 12, background: BOARD.panelSoft, border: `1px solid ${BOARD.border}`, borderRadius: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <h3 style={{ margin: 0, flex: 1, fontSize: 13, color: BOARD.text }}>{t('hudLab.lego.exportTitle')}</h3>
          <span data-touched-count={touchedCount} style={{ fontSize: 10, color: BOARD.dim }}>{t('hudLab.lego.touchedCount', { count: touchedCount })}</span>
          <button type="button" data-export-toggle="" disabled={!packetResult.packet} onClick={() => setExportOpen((open) => !open)} style={{ ...buttonStyle, opacity: packetResult.packet ? 1 : 0.45 }}>
            {t('hudLab.lego.exportToggle')}
          </button>
        </div>
        {packetResult.issues.length > 0 && (
          <div data-export-blocked="" style={{ marginTop: 8, color: BOARD.red, fontSize: 10 }}>
            {packetResult.issues.map((issue) => <div key={`${issue.code}-${issue.pieceId ?? 'global'}`}>{t(`hudLab.lego.errors.${issue.code}`)} {issue.pieceId ?? ''}</div>)}
          </div>
        )}
        {exportOpen && packetResult.packet && (
          <div data-export-content="" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) minmax(240px, 0.7fr)', gap: 10, marginTop: 10 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <strong style={{ fontSize: 11, color: BOARD.text }}>{t('hudLab.lego.jsonLabel')}</strong>
                <button type="button" data-copy-export-json="" onClick={() => copyText('export-json', exportJson)} style={buttonStyle}>{copiedId === 'export-json' ? t('hudLab.lego.copied') : t('hudLab.lego.copyJson')}</button>
              </div>
              <pre data-export-json="" style={{ maxHeight: 280, overflow: 'auto', margin: 0, padding: 10, background: '#02090e', borderRadius: 7, fontSize: 10, color: '#cde6f4' }}>{exportJson}</pre>
            </div>
            <div>
              <strong style={{ fontSize: 11, color: BOARD.text }}>{t('hudLab.lego.markdownLabel')}</strong>
              <pre data-export-markdown="" style={{ maxHeight: 280, overflow: 'auto', margin: '4px 0 0', padding: 10, background: '#02090e', borderRadius: 7, fontSize: 10, color: '#cde6f4', whiteSpace: 'pre-wrap' }}>{exportMarkdown}</pre>
            </div>
          </div>
        )}
      </section>

      <details data-unresolved-lane="" style={{ marginTop: 18, padding: 10, background: BOARD.panelSoft, border: `1px solid ${BOARD.border}`, borderRadius: 10 }}>
        <summary style={{ cursor: 'pointer', fontSize: 12, color: BOARD.text }}>{t('hudLab.lego.unresolvedTitle')} ({Object.values(snapshot.labReconciliation).filter((entry) => entry.classification === 'unresolved').length + snapshot.invalidRegistryEntries.length})</summary>
        <div style={{ marginTop: 8, display: 'grid', gap: 6, fontSize: 10, color: BOARD.dim }}>
          {Object.values(snapshot.labReconciliation).filter((entry) => entry.classification === 'unresolved').map((entry) => (
            <div key={entry.labEntryId} data-unresolved-entry={entry.labEntryId}><strong>{entry.labEntryId}</strong> — {entry.reason}</div>
          ))}
          {snapshot.invalidRegistryEntries.map((entry) => (
            <div key={entry.id} data-invalid-registry-entry={entry.id}><strong>{entry.id}</strong> — {entry.issues.join('; ')}</div>
          ))}
        </div>
      </details>

      <details data-control-patterns-lane="" style={{ marginTop: 12, padding: 10, background: BOARD.panelSoft, border: `1px solid ${BOARD.border}`, borderRadius: 10 }}>
        <summary style={{ cursor: 'pointer', fontSize: 12, color: BOARD.text }}>{t('hudLab.lego.controlPatternsTitle')} ({snapshot.controlPatterns.length})</summary>
        <div style={{ marginTop: 8, display: 'grid', gap: 6, fontSize: 10, color: BOARD.dim }}>
          {snapshot.controlPatterns.map((pattern) => (
            <div key={pattern.id} data-control-pattern={pattern.id}>
              <strong>{pattern.id}</strong> · {pattern.surface} — {pattern.pattern} <span>({pattern.observedIn.join(', ')})</span>
            </div>
          ))}
        </div>
      </details>

      <details data-coverage-matrix="" style={{ marginTop: 12, padding: 10, background: BOARD.panelSoft, border: `1px solid ${BOARD.border}`, borderRadius: 10 }}>
        <summary style={{ cursor: 'pointer', fontSize: 12, color: BOARD.text }}>{t('hudLab.lego.coverageTitle')} ({audit.coverageMatrix.length})</summary>
        <div style={{ marginTop: 8, overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 10, color: BOARD.dim }}>
            <thead><tr>{['surface', 'need', 'role', 'reusablePieceIds', 'missingDelta'].map((head) => <th key={head} style={{ textAlign: 'left', padding: '5px 7px', color: BOARD.text, borderBottom: `1px solid ${BOARD.border}` }}>{t(`hudLab.lego.coverageHeaders.${head}`)}</th>)}</tr></thead>
            <tbody>
              {audit.coverageMatrix.map((row) => (
                <tr key={`${row.surface}-${row.need}`} data-coverage-row={`${row.surface}-${row.need}`}>
                  <td style={{ padding: '5px 7px' }}>{row.surface}</td>
                  <td style={{ padding: '5px 7px' }}>{row.need}</td>
                  <td style={{ padding: '5px 7px' }}>{row.role}</td>
                  <td style={{ padding: '5px 7px' }}>{row.reusablePieceIds.join(', ') || '—'}</td>
                  <td style={{ padding: '5px 7px' }}>{row.missingDelta ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
};

export default LegoBoard;
