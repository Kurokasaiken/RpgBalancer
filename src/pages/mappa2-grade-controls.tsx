import { DEFAULT_MAPPA2_GRADE, type Mappa2Grade } from './mappa2-grade';

/**
 * Scene-tab controls for the look-dev grade (palette + warm lights / cool shadows).
 * Own file and own persistence key so the mappa2-lab hot file keeps a <=2-line diff (T-13).
 * Presentational only: the grade lifecycle (state, persistence, canvas filter) lives
 * in `useMappa2Grade` so it survives this panel unmounting (hide test UI, tab switch).
 */

/** Presentational panel for the grade sliders; the lifecycle lives in `useMappa2Grade`. */
export function Mappa2GradeControls({ grade, onPatch }: { grade: Mappa2Grade; onPatch: (patch: Partial<Mappa2Grade>) => void }) {
  const slider = (label: string, key: 'palette' | 'warm' | 'coolShadows' | 'saturation' | 'contrast' | 'mountainShade' | 'seaSapphire', min: number, max: number, step: number) => (
    <label style={{ display: 'block', marginTop: 4 }}>
      {label} {grade[key].toFixed(2)}
      <input type="range" min={min} max={max} step={step} value={grade[key]} onChange={(e) => onPatch({ [key]: Number(e.target.value) })} style={{ width: '100%' }} />
    </label>
  );

  return (
    <div data-testid="mappa2-grade-controls" data-grade-enabled={grade.enabled} style={{ marginTop: 8, borderTop: '1px solid #333', paddingTop: 6 }}>
      <label style={{ display: 'block' }}>
        <input type="checkbox" checked={grade.enabled} onChange={(e) => onPatch({ enabled: e.target.checked })} /> luce e colore (look-dev)
      </label>
      {slider('palette teal & orange', 'palette', 0, 1, 0.05)}
      {slider('luci calde', 'warm', 0, 1, 0.05)}
      {slider('ombre fredde', 'coolShadows', 0, 1, 0.05)}
      {slider('saturazione', 'saturation', 0.8, 1.5, 0.01)}
      {slider('contrasto', 'contrast', 0.9, 1.3, 0.01)}
      {slider('montagne nord scure', 'mountainShade', 0, 1, 0.05)}
      {slider('mare zaffiro', 'seaSapphire', 0, 1, 0.05)}
      <button type="button" onClick={() => onPatch({ ...DEFAULT_MAPPA2_GRADE })} style={{ marginTop: 6, padding: '2px 6px', border: '1px solid #56758d', borderRadius: 4, color: 'inherit', background: '#172b40', cursor: 'pointer' }}>reset</button>
    </div>
  );
}
