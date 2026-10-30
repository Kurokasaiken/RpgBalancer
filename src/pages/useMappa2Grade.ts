import { useEffect, useState } from 'react';
import { loadData, saveData } from '@/shared/persistence/PersistenceService';
import { DEFAULT_MAPPA2_GRADE, GRADE_FILTER_ID, gradeCssFilter, gradeFilterMarkup, mountainShadeLive, seaGradeLive, type Mappa2Grade } from './mappa2-grade';

const STORAGE_KEY = 'mappa2-lab:grade:v3';

function pixiCanvas(): HTMLCanvasElement | null {
  const all = [...document.querySelectorAll('canvas')];
  return all.sort((a, b) => b.width * b.height - a.width * a.height)[0] ?? null;
}

/**
 * Owns the look-dev grade lifecycle for /mappa2-lab: state, persistence and the
 * CSS/SVG filter applied to the Pixi canvas. Must be called by the page, not by
 * the controls panel: the filter has to survive the panel unmounting (hide test
 * UI, tab switch) and is only cleaned up when the page itself unmounts.
 */
export function useMappa2Grade() {
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
    seaGradeLive.opacity = grade.seaSapphire;
    mountainShadeLive.opacity = grade.mountainShade; // the north-mountain grade is part of the map look: independent of the look-dev checkbox
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

  return { grade, set };
}
