/**
 * useHeavyDrag — hook per WanderlustSurface v8
 *
 * Simula la fisica di un oggetto pesante:
 * - "Sollevo con fatica": il visual insegue il cursore con ritardo (useSpring lag)
 * - "Appoggio pesante": al rilascio il target salta di 28px verso il basso e
 *   la spring oscilla attorno alla nuova posizione (rimbalzo smorzato)
 */
import { useState } from 'react';
import { useMotionValue, useSpring, animate } from 'framer-motion';
import type { DragHandlers } from 'framer-motion';

export interface HeavyDragHandlers {
  /** Motion values for the invisible drag tracker div */
  rawX: ReturnType<typeof useMotionValue<number>>;
  rawY: ReturnType<typeof useMotionValue<number>>;
  /** Spring-lagged motion values for the visible element (the "heavy" lag) */
  x: ReturnType<typeof useSpring>;
  y: ReturnType<typeof useSpring>;
  isDragging: boolean;
  onDragStart: DragHandlers['onDragStart'];
  onDragEnd: DragHandlers['onDragEnd'];
}

/**
 * Heavy drag physics for WanderlustSurface components.
 *
 * Usage:
 *   const drag = useHeavyDrag();
 *
 *   // Ghost tracker (invisible, handles actual drag input)
 *   <motion.div drag dragControls={controls} dragListener={false}
 *     style={{ x: drag.rawX, y: drag.rawY, position:'absolute', inset:0, opacity:0 }}
 *     onDragStart={drag.onDragStart}
 *     onDragEnd={drag.onDragEnd}
 *   />
 *
 *   // Visual element (laggy spring)
 *   <motion.div style={{ x: drag.x, y: drag.y }}>
 *     <WanderlustSurface ...>...</WanderlustSurface>
 *   </motion.div>
 */
export function useHeavyDrag(): HeavyDragHandlers {
  const [isDragging, setIsDragging] = useState(false);

  // Raw position — Framer Motion writes these directly during drag
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);

  // Spring-lagged visual position — gives the "lifting with effort" feel
  const x = useSpring(rawX, { stiffness: 90, damping: 22, mass: 4 });
  const y = useSpring(rawY, { stiffness: 90, damping: 22, mass: 4 });

  const onDragStart: DragHandlers['onDragStart'] = () => {
    setIsDragging(true);
  };

  const onDragEnd: DragHandlers['onDragEnd'] = (_event, info) => {
    setIsDragging(false);

    // Gravity: jump the spring target downward so the spring bounces to settle.
    // The visual spring (y) will oscillate around the new rawY target — looks like
    // a heavy object being set down on a surface.
    rawY.set(rawY.get() + 30);

    // Horizontal: carry a fraction of throw velocity, then settle
    const throwX = (info?.velocity?.x ?? 0) * 0.04;
    if (Math.abs(throwX) > 0.5) {
      rawX.set(rawX.get() + throwX);
    }
  };

  return { rawX, rawY, x, y, isDragging, onDragStart, onDragEnd };
}
