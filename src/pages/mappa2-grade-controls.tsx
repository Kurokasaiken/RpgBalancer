import { useEffect, useState } from 'react';
import { loadData, saveData } from '@/shared/persistence/PersistenceService';
import { DEFAULT_MAPPA2_GRADE, GRADE_FILTER_ID, gradeCssFilter, gradeFilterMarkup, mountainShadeLive, type Mappa2Grade } from './mappa2-grade';

/**
 * Scene-tab controls for the look-dev grade (palette + warm lights / cool shadows).
 * Own file and own persistence key so the mappa2-lab hot file keeps a <=2-line diff (T-13).
 * Look-dev only: the grade is a CSS/SVG filter on the Pixi canvas, see `mappa2-grade.ts`.
 */

const STORAGE_KEY = 'mappa2-lab:grade:v1';

function pixiCanvas(): HTMLCanvasElement | null {
  const all = [...document.querySelectorAll('canvas')];
  return all.sort((a, b) => b.width * b.height - a.width * a.height)[0] ?? null;
}

export function Mappa2GradeControls() {
  const [grade, setGrade] = useState<Mappa2Grade>(DEFAULT_MAPPA2_GRADE);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void loadData<Partial<Mappa2Grade> | null>(STORAGE_KEY, null)
      .then((saved) => { if (saved && typeof saved === 'object') setGrade({ ...DEFAULT_MAPPA2_GRADE, ...saved }); })
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    let svg = document.getElementById(`${GRADE_FILTER_ID}-host`);
    if (!svg) {
      svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.id = `${GRADE_FILTER_ID}-host`;
      svg.setAttribute('width', '0');
      svg.setAttribute('height', '0');
      svg.style.position = 'absolute';
      document.body.appendChild(svg);
    }
    mountainShadeLive.opacity = grade.enabled ? grade.mountainShade : 0;
    svg.innerHTML = gradeFilterMarkup(grade);
    const apply = () => {
      const cv = pixiCanvas();
      if (cv) cv.style.filter = gradeCssFilter(grade);
    };
    apply();
    // the canvas can be (re)created after boot
    const timer = window.setInterval(apply, 1500);
    return () => window.clearInterval(timer);
  }, [grade]);

  useEffect(() => () => {
    const cv = pixiCanvas();
    if (cv) cv.style.filter = '';
    document.getElementById(`${GRADE_FILTER_ID}-host`)?.remove();
  }, []);

  const set = (patch: Partial<Mappa2Grade>) => {
    const next = { ...grade, ...patch };
    setGrade(next);
    if (loaded) void saveData(STORAGE_KEY, next).catch(() => undefined);
  };
  const slider = (label: string, key: 'palette' | 'warm' | 'coolShadows' | 'saturation' | 'contrast' | 'mountainShade', min: number, max: number, step: number) => (
    <label style={{ display: 'block', marginTop: 4 }}>
      {label} {grade[key].toFixed(2)}
      <input type="range" min={min} max={max} step={step} value={grade[key]} onChange={(e) => set({ [key]: Number(e.target.value) })} style={{ width: '100%' }} />
    </label>
  );

  return (
    <div data-testid="mappa2-grade-controls" data-grade-enabled={grade.enabled} style={{ marginTop: 8, borderTop: '1px solid #333', paddingTop: 6 }}>
      <label style={{ display: 'block' }}>
        <input type="checkbox" checked={grade.enabled} onChange={(e) => set({ enabled: e.target.checked })} /> luce e colore (look-dev)
      </label>
      {slider('palette teal & orange', 'palette', 0, 1, 0.05)}
      {slider('luci calde', 'warm', 0, 1, 0.05)}
      {slider('ombre fredde', 'coolShadows', 0, 1, 0.05)}
      {slider('saturazione', 'saturation', 0.8, 1.5, 0.01)}
      {slider('contrasto', 'contrast', 0.9, 1.3, 0.01)}
      {slider('montagne nord scure', 'mountainShade', 0, 1, 0.05)}
      <button type="button" onClick={() => set({ ...DEFAULT_MAPPA2_GRADE })} style={{ marginTop: 6, padding: '2px 6px', border: '1px solid #56758d', borderRadius: 4, color: 'inherit', background: '#172b40', cursor: 'pointer' }}>reset</button>
    </div>
  );
}
