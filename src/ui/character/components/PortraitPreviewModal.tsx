import React, { useCallback, useRef, useState } from 'react';
import {
  DEFAULT_PORTRAIT_CROP,
  type PortraitCropSettings,
} from '@/balancing/config/idleVillage/residentVisuals';
import {
  PORTRAIT_BADGE_CONTAINER_CLASS,
  PORTRAIT_IMAGE_CLASS,
  getPortraitImageStyle,
} from './portraitStyles';

interface PortraitPreviewModalProps {
  isOpen: boolean;
  imageUrl?: string;
  label?: string;
  onClose: () => void;
  crop?: PortraitCropSettings;
  onCropChange?: (crop: PortraitCropSettings) => void;
  canAdjustCrop?: boolean;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * Lightweight overlay that displays a portrait at full resolution.
 * When `canAdjustCrop` is true the user can drag inside the badge or use the mouse wheel
 * to edit the focus/zoom interactively.
 */
export const PortraitPreviewModal: React.FC<PortraitPreviewModalProps> = ({
  isOpen,
  imageUrl,
  label,
  onClose,
  crop,
  onCropChange,
  canAdjustCrop = false,
}) => {
  const allowCropAdjustments = Boolean(canAdjustCrop && onCropChange);
  const resolvedCrop = crop ?? DEFAULT_PORTRAIT_CROP;
  const [isDragging, setIsDragging] = useState(false);
  const badgeRef = useRef<HTMLDivElement | null>(null);

  const updateFocusFromPointer = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!allowCropAdjustments || !badgeRef.current) return;
      const rect = badgeRef.current.getBoundingClientRect();
      const focusX = clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100);
      const focusY = clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100);
      onCropChange?.({
        ...resolvedCrop,
        focusX,
        focusY,
      });
    },
    [allowCropAdjustments, badgeRef, resolvedCrop, onCropChange],
  );

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!allowCropAdjustments) return;
      setIsDragging(true);
      event.currentTarget.setPointerCapture(event.pointerId);
      updateFocusFromPointer(event);
    },
    [allowCropAdjustments, updateFocusFromPointer],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!allowCropAdjustments || !isDragging) return;
      event.preventDefault();
      updateFocusFromPointer(event);
    },
    [allowCropAdjustments, isDragging, updateFocusFromPointer],
  );

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!allowCropAdjustments) return;
      event.currentTarget.releasePointerCapture(event.pointerId);
      setIsDragging(false);
    },
    [allowCropAdjustments],
  );

  const handlePointerLeave = useCallback(() => {
    if (!allowCropAdjustments) return;
    setIsDragging(false);
  }, [allowCropAdjustments]);

  const handleWheel = useCallback(
    (event: React.WheelEvent<HTMLDivElement>) => {
      if (!allowCropAdjustments) return;
      event.preventDefault();
      const delta = event.deltaY < 0 ? -0.05 : 0.05;
      onCropChange?.({
        ...resolvedCrop,
        zoom: clamp((resolvedCrop.zoom ?? DEFAULT_PORTRAIT_CROP.zoom) + delta, 1, 1.6),
      });
    },
    [allowCropAdjustments, resolvedCrop, onCropChange],
  );

  if (!isOpen || !imageUrl) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label={label ?? 'Portrait preview'}
      onClick={onClose}
    >
      <div
        className="relative max-h-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900/90 to-black/90 p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white hover:bg-white/20"
        >
          Close
        </button>
        <div className="mb-4 text-center text-sm uppercase tracking-[0.3em] text-slate-200">
          {label ?? 'Portrait'}
        </div>
        <div className="flex flex-col items-center gap-4">
          <div
            ref={badgeRef}
            className={`${PORTRAIT_BADGE_CONTAINER_CLASS} h-80 w-80 ${
              allowCropAdjustments ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
            }`}
            style={{ touchAction: allowCropAdjustments ? 'none' : 'auto' }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerLeave}
            onWheel={handleWheel}
          >
            <img
              src={imageUrl}
              alt={label ?? 'Portrait preview'}
              className={PORTRAIT_IMAGE_CLASS}
              style={getPortraitImageStyle(resolvedCrop)}
              draggable={false}
            />
            {allowCropAdjustments && (
              <div className="pointer-events-none absolute inset-0 border border-white/10" />
            )}
          </div>
          {allowCropAdjustments ? (
            <p className="text-center text-[11px] uppercase tracking-[0.35em] text-amber-200">
              Trascina per cambiare focus, usa la rotellina per lo zoom.
            </p>
          ) : (
            <div className="max-h-[70vh] overflow-auto rounded-2xl border border-white/10 bg-black/40 p-3">
              <img
                src={imageUrl}
                alt={label ?? 'Portrait preview'}
                className="mx-auto h-full max-h-[65vh] w-auto rounded-2xl object-contain"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
